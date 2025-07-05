import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Bell, X, Clock, Settings, CheckCircle, AlertTriangle, Calendar, Target, FileText, ArrowLeft, Plus, Edit, Trash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import io from 'socket.io-client';
import moment from 'moment-timezone';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Firebase configuration
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const Reminders = () => {
    const { user, onLogout } = useOutletContext();
    const navigate = useNavigate();
    const [reminders, setReminders] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [showPreferences, setShowPreferences] = useState(false);
    const [showCreateReminder, setShowCreateReminder] = useState(false);
    const [showReminderDetails, setShowReminderDetails] = useState(false);
    const [selectedReminder, setSelectedReminder] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editReminder, setEditReminder] = useState({
        type: 'custom',
        message: '',
        targetId: '',
        targetModel: '',
        deliveryChannels: { inApp: true, email: true, push: false },
        remindAt: new Date(),
        repeatInterval: '',
        emailOverride: '',
    });
    const [preferences, setPreferences] = useState({
        defaultDeliveryChannels: { inApp: true, email: true, push: false },
        defaultReminderTimes: {
            task_due: 60,
            meeting: 30,
            goal_deadline: 1440,
            appraisal_submission: 1440,
            manager_feedback: 720,
            custom: 60,
        },
    });
    const [newReminder, setNewReminder] = useState({
        type: 'custom',
        message: '',
        targetId: '',
        targetModel: '',
        deliveryChannels: { inApp: true, email: true, push: false },
        remindAt: new Date(),
        repeatInterval: '',
        emailOverride: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const modalRef = useRef(null);

    // Initialize Firebase and register push token
    useEffect(() => {
        const registerPushToken = async () => {
            try {
                const app = initializeApp(firebaseConfig);
                const messaging = getMessaging(app);
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    const token = await getToken(messaging, { vapidKey: import.meta.env.VITE_VAPID_KEY });
                    await axios.put(
                        `${API_BASE_URL}/api/user/push-token`,
                        { pushToken: token },
                        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
                    );
                    console.log('Push token registered:', token);
                }
            } catch (error) {
                console.error('Error registering push token:', error.message);
            }
        };
        registerPushToken();
    }, []);

    // Socket.IO for real-time reminders
    useEffect(() => {
        const socket = io(API_BASE_URL, {
            auth: { token: localStorage.getItem('token') },
        });
        socket.on('newReminder', (reminder) => {
            setReminders((prev) => [reminder, ...prev]);
            toast.custom((t) => (
                <ReminderToast reminder={reminder} onSnooze={() => handleSnooze(reminder._id, 15)} onDismiss={() => handleDismiss(reminder._id)} />
            ));
        });
        socket.on('reminderUpdated', (reminder) => {
            setReminders((prev) => prev.map((r) => (r._id === reminder._id ? reminder : r)));
        });
        socket.on('reminderDeleted', (reminderId) => {
            setReminders((prev) => prev.filter((r) => r._id !== reminderId));
            toast.success('Reminder deleted in real-time!');
        });
        socket.on('reminderTriggered', (reminder) => {
            toast.custom((t) => (
                <ReminderToast reminder={reminder} onSnooze={() => handleSnooze(reminder._id, 15)} onDismiss={() => handleDismiss(reminder._id)} />
            ));
        });
        socket.on('connect_error', (error) => {
            console.error('Socket connect error:', error.message);
            toast.error('Real-time reminders unavailable.');
        });
        return () => {
            socket.off('newReminder');
            socket.off('reminderUpdated');
            socket.off('reminderDeleted');
            socket.off('reminderTriggered');
            socket.disconnect();
        };
    }, []);

    // Axios interceptor for 401 handling
    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    toast.error('Session expired. Please log in.');
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    onLogout?.();
                    navigate('/login');
                }
                return Promise.reject(error);
            }
        );
        return () => axios.interceptors.response.eject(interceptor);
    }, [onLogout, navigate]);

    // Modal focus trap
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && (showPreferences || showCreateReminder)) {
                setShowPreferences(false);
                setShowCreateReminder(false);
            }
        };
        if (showPreferences || showCreateReminder) {
            modalRef.current?.focus();
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showPreferences, showCreateReminder]);

    const getAuthHeaders = useCallback(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No auth token');
        }
        return { Authorization: `Bearer ${token}` };
    }, []);

    const fetchReminders = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/api/reminders`, { headers: getAuthHeaders() });
            setReminders(response.data.reminders);
        } catch (error) {
            if (error.response?.status !== 401) {
                toast.error(error.response?.data?.message || 'Failed to fetch reminders.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [getAuthHeaders]);

    const fetchPreferences = useCallback(async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/user/me`, { headers: getAuthHeaders() });
            setPreferences(response.data.user.preferences?.reminders || preferences);
        } catch (error) {
            if (error.response?.status !== 401) {
                toast.error('Failed to fetch preferences.');
            }
        }
    }, [getAuthHeaders]);

    const fetchTasks = useCallback(async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/tasks/gp`, { headers: getAuthHeaders() });
            setTasks(response.data.tasks);
        } catch (error) {
            if (error.response?.status !== 401) {
                toast.error(error.response?.data?.message || 'Failed to fetch tasks.');
            }
        }
    }, [getAuthHeaders]);

    useEffect(() => {
        if (!user || !localStorage.getItem('token')) {
            navigate('/login');
            return;
        }
        fetchReminders();
        fetchPreferences();
        fetchTasks();
    }, [user, navigate, fetchReminders, fetchPreferences, fetchTasks]);

    const handleSnooze = useCallback(async (id, minutes) => {
        try {
            await axios.put(
                `${API_BASE_URL}/api/reminders/${id}/snooze`,
                { snoozeMinutes: minutes },
                { headers: getAuthHeaders() }
            );
            toast.success('Reminder snoozed!');
        } catch (error) {
            if (error.response?.status !== 401) {
                toast.error(error.response?.data?.message || 'Failed to snooze reminder.');
            }
        }
    }, [getAuthHeaders]);

    const handleDismiss = useCallback(async (id) => {
        try {
            await axios.put(`${API_BASE_URL}/api/reminders/${id}/dismiss`, {}, { headers: getAuthHeaders() });
            toast.success('Reminder dismissed!');
        } catch (error) {
            if (error.response?.status !== 401) {
                toast.error(error.response?.data?.message || 'Failed to dismiss reminder.');
            }
        }
    }, [getAuthHeaders]);

    const handleUpdatePreferences = useCallback(async () => {
        try {
            await axios.put(
                `${API_BASE_URL}/api/reminders/preferences`,
                preferences,
                { headers: getAuthHeaders() }
            );
            setShowPreferences(false);
            toast.success('Preferences updated!', { style: { background: '#2DD4BF', color: '#FFFFFF' } });
        } catch (error) {
            if (error.response?.status !== 401) {
                toast.error(error.response?.data?.message || 'Failed to update preferences.');
            }
        }
    }, [preferences, getAuthHeaders]);

    const handleCreateReminder = useCallback(async () => {
        if (!newReminder.message.trim()) {
            toast.error('Reminder message is required.');
            return;
        }
        if (newReminder.repeatInterval && (newReminder.repeatInterval < 5 || newReminder.repeatInterval > 1440)) {
            toast.error('Repeat interval must be between 5 and 1440 minutes.');
            return;
        }
        if (newReminder.emailOverride && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newReminder.emailOverride)) {
            toast.error('Invalid email address.');
            return;
        }
        try {
            const response = await axios.post(
                `${API_BASE_URL}/api/reminders`,
                {
                    ...newReminder,
                    targetModel: newReminder.targetId ? 'Task' : null,
                    repeatInterval: newReminder.repeatInterval ? parseInt(newReminder.repeatInterval) : null,
                    emailOverride: newReminder.emailOverride || null,
                },
                { headers: getAuthHeaders() }
            );
            setShowCreateReminder(false);
            setNewReminder({
                type: 'custom',
                message: '',
                targetId: '',
                targetModel: '',
                deliveryChannels: { inApp: true, email: true, push: false },
                remindAt: new Date(),
                repeatInterval: '',
                emailOverride: '',
            });
            toast.success('Reminder created!');
        } catch (error) {
            if (error.response?.status !== 401) {
                toast.error(error.response?.data?.message || 'Failed to create reminder.');
            }
        }
    }, [newReminder, getAuthHeaders]);

    const handleReminderClick = useCallback((reminder) => {
        setSelectedReminder(reminder);
        setShowReminderDetails(true);
    }, []);

    const handleEditReminder = useCallback(async () => {
        if (!editReminder.message.trim()) {
            toast.error('Reminder message is required.');
            return;
        }
        if (editReminder.repeatInterval && (editReminder.repeatInterval < 5 || editReminder.repeatInterval > 1440)) {
            toast.error('Repeat interval must be between 5 and 1440 minutes.');
            return;
        }
        if (editReminder.emailOverride && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editReminder.emailOverride)) {
            toast.error('Invalid email address.');
            return;
        }
        try {
            const response = await axios.put(
                `${API_BASE_URL}/api/reminders/${selectedReminder._id}`,
                {
                    ...editReminder,
                    targetModel: editReminder.targetId ? 'Task' : null,
                    repeatInterval: editReminder.repeatInterval ? parseInt(editReminder.repeatInterval) : null,
                    emailOverride: editReminder.emailOverride || null,
                },
                { headers: getAuthHeaders() }
            );
            setReminders((prev) => prev.map((r) => (r._id === selectedReminder._id ? response.data.reminder : r)));
            setShowReminderDetails(false);
            setIsEditing(false);
            toast.success('Reminder updated!');
        } catch (error) {
            if (error.response?.status !== 401) {
                toast.error(error.response?.data?.message || 'Failed to update reminder.');
            }
        }
    }, [editReminder, selectedReminder, getAuthHeaders]);

    const handleDeleteReminder = useCallback(async () => {
        try {
            await axios.delete(`${API_BASE_URL}/api/reminders/${selectedReminder._id}`, {
                headers: getAuthHeaders(),
            });
            setReminders((prev) => prev.filter((r) => r._id !== selectedReminder._id));
            setShowReminderDetails(false);
            toast.success('Reminder deleted!');
        } catch (error) {
            if (error.response?.status !== 401) {
                toast.error(error.response?.data?.message || 'Failed to delete reminder.');
            }
        }
    }, [selectedReminder, getAuthHeaders]);

    // Prefill editReminder when entering edit mode
    useEffect(() => {
        if (isEditing && selectedReminder) {
            setEditReminder({
                type: selectedReminder.type || 'custom',
                message: selectedReminder.message || '',
                targetId: selectedReminder.targetId || '',
                targetModel: selectedReminder.targetModel || '',
                deliveryChannels: selectedReminder.deliveryChannels || { inApp: true, email: true, push: false },
                remindAt: new Date(selectedReminder.remindAt) || new Date(),
                repeatInterval: selectedReminder.repeatInterval || '',
                emailOverride: selectedReminder.emailOverride || '',
            });
        }
    }, [isEditing, selectedReminder]);

    const modalVariants = {
        hidden: { opacity: 0, scale: 0.8 },
        visible: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.8 },
    };

    const ReminderToast = ({ reminder, onSnooze, onDismiss }) => (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="bg-gradient-to-r from-teal-600 to-blue-900 text-white p-4 rounded-xl shadow-2xl max-w-sm flex items-center gap-4"
        >
            <ReminderIcon type={reminder.type} />
            <div className="flex-1">
                <p className="text-sm font-semibold">{reminder.message}</p>
                <p className="text-xs opacity-75">{moment(reminder.remindAt).tz('Africa/Lagos').format('MMM D, h:mm A')}</p>
            </div>
            <div className="flex gap-2">
                <button
                    onClick={onSnooze}
                    className="p-2 bg-teal-700 rounded-full hover:bg-teal-500 transition-all"
                    aria-label="Snooze Reminder"
                >
                    <Clock className="w-4 h-4" />
                </button>
                <button
                    onClick={onDismiss}
                    className="p-2 bg-red-600 rounded-full hover:bg-red-500 transition-all"
                    aria-label="Dismiss Reminder"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );

    const ReminderIcon = ({ type }) => {
        const icons = {
            task_due: <CheckCircle className="w-6 h-6 text-teal-300" />,
            meeting: <Calendar className="w-6 h-6 text-teal-300" />,
            goal_deadline: <Target className="w-6 h-6 text-teal-300" />,
            appraisal_submission: <FileText className="w-6 h-6 text-teal-300" />,
            manager_feedback: <AlertTriangle className="w-6 h-6 text-teal-300" />,
            custom: <Bell className="w-6 h-6 text-teal-300" />,
        };
        return icons[type] || <Bell className="w-6 h-6 text-teal-300" />;
    };

    if (!user || !localStorage.getItem('token')) {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50 font-sans"
        >
            <Toaster position="bottom-right" toastOptions={{ className: 'text-xs sm:text-sm max-w-xs sm:max-w-sm' }} />
            <header className="bg-white shadow-lg px-4 sm:px-6 py-4 sm:py-5 sticky top-0 z-20">
                <div className="max-w-[90rem] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-teal-600 truncate">Reminders</h1>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowCreateReminder(true)}
                            className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-3 rounded-full bg-blue-600 text-white text-sm sm:text-base md:text-lg font-semibold hover:bg-blue-700 transition-all flex items-center gap-2 sm:gap-3 shadow-md"
                            aria-label="Create Reminder"
                        >
                            <Plus className="w-4 h-4 sm:w-5 h-5" />
                            Create Reminder
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowPreferences(true)}
                            className="p-1 sm:p-2 text-blue-900 hover:text-teal-600 transition-colors"
                            aria-label="Reminder Preferences"
                        >
                            <Settings className="w-5 h-5 sm:w-6 h-6" />
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/')}
                            className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-3 rounded-full bg-teal-600 text-white text-sm sm:text-base md:text-lg font-semibold hover:bg-teal-700 transition-all flex items-center gap-2 sm:gap-3 shadow-md"
                            aria-label="Back to Dashboard"
                        >
                            <ArrowLeft className="w-4 h-4 sm:w-5 h-5" />
                            Back to Dashboard
                        </motion.button>
                    </div>
                </div>
            </header>
            <main className="max-w-[90rem] mx-auto w-full px-4 sm:px-6 md:px-8 py-6 sm:py-8">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-6 sm:space-y-8 max-h-[calc(100vh-14rem)] sm:max-h-[calc(100vh-16rem)] overflow-y-auto custom-scrollbar"
                    role="region"
                    aria-label="Reminders List"
                >
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-900 truncate">Your Reminders</h2>
                    {isLoading ? (
                        <div className="text-center text-gray-500 text-xs sm:text-sm">Loading reminders...</div>
                    ) : reminders.length === 0 ? (
                        <div className="text-center text-gray-500 text-xs sm:text-sm">No reminders found. Create tasks or reminders to get started!</div>
                    ) : (
                        <AnimatePresence>
                            {reminders.map((reminder) => (
                                <motion.div
                                    key={reminder._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="bg-white rounded-2xl sm:rounded-3xl shadow-lg sm:shadow-xl p-4 sm:p-5 md:p-6 max-w-full sm:max-w-2xl mx-auto flex items-center gap-3 sm:gap-4 hover:shadow-2xl transition-all duration-300 border-l-4 border-teal-600 cursor-pointer"
                                    onClick={() => handleReminderClick(reminder)}
                                >
                                    <ReminderIcon type={reminder.type} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm sm:text-base font-semibold text-blue-900 truncate">{reminder.message}</p>
                                        <p className="text-xs sm:text-sm text-gray-500 line-clamp-1">
                                            {moment(reminder.remindAt).tz('Africa/Lagos').format('MMM D, YYYY, h:mm A')}
                                        </p>
                                        <p className="text-xs sm:text-sm text-gray-400 capitalize">Status: {reminder.status}</p>
                                        {reminder.isUserCreated && (
                                            <p className="text-xs sm:text-sm text-teal-600">User Created</p>
                                        )}
                                        {reminder.repeatInterval && (
                                            <p className="text-xs sm:text-sm text-gray-400 line-clamp-1">Repeats every {reminder.repeatInterval} minutes</p>
                                        )}
                                        {reminder.emailOverride && (
                                            <p className="text-xs sm:text-sm text-gray-400 truncate">Sent to: {reminder.emailOverride}</p>
                                        )}
                                    </div>
                                    <div className="flex gap-2 sm:gap-3 flex-shrink-0">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSnooze(reminder._id, 15);
                                            }}
                                            className="p-1 sm:p-2 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition-all"
                                            aria-label="Snooze Reminder"
                                            disabled={reminder.status === 'dismissed'}
                                        >
                                            <Clock className="w-4 h-4 sm:w-5 h-5" />
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDismiss(reminder._id);
                                            }}
                                            className="p-1 sm:p-2 bg-red-600 text-white rounded-full hover:bg-red-500 transition-all"
                                            aria-label="Dismiss Reminder"
                                            disabled={reminder.status === 'dismissed'}
                                        >
                                            <X className="w-4 h-4 sm:w-5 h-5" />
                                        </motion.button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </motion.div>
                <style jsx>{`
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 5px;
                        height: 5px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: rgba(20, 184, 166, 0.1);
                        border-radius: 3px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: #14B8A6;
                        border-radius: 3px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: #0D9488;
                    }
                `}</style>
            </main>

            {/* Preferences Modal */}
            <AnimatePresence>
                {showPreferences && (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={modalVariants}
                        className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 px-4 sm:px-6"
                        role="dialog"
                        aria-label="Reminder Preferences"
                        ref={modalRef}
                        tabIndex={-1}
                    >
                        <div
                            className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 max-w-xs sm:max-w-sm md:max-w-lg w-full bg-opacity-95 backdrop-blur-sm"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-3 sm:mb-4">
                                <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-blue-900 truncate">Reminder Preferences</h2>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowPreferences(false)}
                                    className="p-1 sm:p-2 text-blue-900 hover:text-teal-600"
                                    aria-label="Close Preferences"
                                >
                                    <X className="w-4 h-4 sm:w-5 h-5" />
                                </motion.button>
                            </div>
                            <div className="space-y-4 sm:space-y-6">
                                <h3 className="text-sm sm:text-base font-semibold text-gray-800">Delivery Channels</h3>
                                {Object.keys(preferences.defaultDeliveryChannels).map((channel) => (
                                    <label key={channel} className="flex items-center gap-2 sm:gap-3">
                                        <input
                                            type="checkbox"
                                            checked={preferences.defaultDeliveryChannels[channel]}
                                            onChange={(e) =>
                                                setPreferences((prev) => ({
                                                    ...prev,
                                                    defaultDeliveryChannels: {
                                                        ...prev.defaultDeliveryChannels,
                                                        [channel]: e.target.checked,
                                                    },
                                                }))
                                            }
                                            className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600"
                                        />
                                        <span className="text-xs sm:text-sm text-gray-800 capitalize">{channel}</span>
                                    </label>
                                ))}
                                <h3 className="text-sm sm:text-base font-semibold text-gray-800 mt-4 sm:mt-6">Reminder Times (minutes before)</h3>
                                {Object.keys(preferences.defaultReminderTimes).map((type) => (
                                    <div key={type} className="flex items-center gap-2 sm:gap-3">
                                        <label className="text-xs sm:text-sm text-gray-800 capitalize flex-1 truncate">
                                            {type.replace('_', ' ')}
                                        </label>
                                        <input
                                            type="number"
                                            value={preferences.defaultReminderTimes[type]}
                                            onChange={(e) =>
                                                setPreferences((prev) => ({
                                                    ...prev,
                                                    defaultReminderTimes: {
                                                        ...prev.defaultReminderTimes,
                                                        [type]: parseInt(e.target.value) || 0,
                                                    },
                                                }))
                                            }
                                            className="w-20 sm:w-24 p-1 sm:p-2 border border-gray-200 rounded-lg text-xs sm:text-sm"
                                            min="0"
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-4 sm:mt-6">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowPreferences(false)}
                                    className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-gray-200 text-gray-800 text-sm sm:text-base font-semibold hover:bg-gray-300 transition-all"
                                    aria-label="Cancel"
                                >
                                    Cancel
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleUpdatePreferences}
                                    className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-teal-600 text-white text-sm sm:text-base font-semibold hover:bg-teal-700 transition-all"
                                    aria-label="Save Preferences"
                                >
                                    Save
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Create Reminder Modal */}
            <AnimatePresence>
                {showCreateReminder && (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={modalVariants}
                        className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 px-4 sm:px-6"
                        role="dialog"
                        aria-label="Create Reminder"
                        ref={modalRef}
                        tabIndex={-1}
                    >
                        <div
                            className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 max-w-xs sm:max-w-sm md:max-w-lg w-full bg-opacity-95 backdrop-blur-sm"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-3 sm:mb-4">
                                <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-blue-900 truncate">Create New Reminder</h2>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowCreateReminder(false)}
                                    className="p-1 sm:p-2 text-blue-900 hover:text-teal-600"
                                    aria-label="Close Create Reminder"
                                >
                                    <X className="w-4 h-4 sm:w-5 h-5" />
                                </motion.button>
                            </div>
                            <div className="space-y-4 sm:space-y-6">
                                <div>
                                    <label className="text-xs sm:text-sm font-semibold text-gray-800">Message</label>
                                    <input
                                        type="text"
                                        value={newReminder.message}
                                        onChange={(e) =>
                                            setNewReminder((prev) => ({ ...prev, message: e.target.value }))
                                        }
                                        className="w-full p-2 sm:p-3 border border-gray-200 rounded-lg text-xs sm:text-sm"
                                        placeholder="Enter reminder message"
                                        maxLength={200}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs sm:text-sm font-semibold text-gray-800">Attach Task (Optional)</label>
                                    <select
                                        value={newReminder.targetId}
                                        onChange={(e) =>
                                            setNewReminder((prev) => ({
                                                ...prev,
                                                targetId: e.target.value,
                                                targetModel: e.target.value ? 'Task' : '',
                                            }))
                                        }
                                        className="w-full p-2 sm:p-3 border border-gray-200 rounded-lg text-xs sm:text-sm"
                                    >
                                        <option value="">No Task</option>
                                        {tasks.map((task) => (
                                            <option key={task._id} value={task._id} className="truncate">
                                                {task.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs sm:text-sm font-semibold text-gray-800">Reminder Date & Time</label>
                                    <DatePicker
                                        selected={newReminder.remindAt}
                                        onChange={(date) =>
                                            setNewReminder((prev) => ({ ...prev, remindAt: date }))
                                        }
                                        showTimeSelect
                                        timeIntervals={15}
                                        dateFormat="MMMM d, yyyy h:mm aa"
                                        className="w-full p-2 sm:p-3 border border-gray-200 rounded-lg text-xs sm:text-sm"
                                        minDate={new Date()}
                                        popperClassName="z-[60]"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs sm:text-sm font-semibold text-gray-800">Repeat Interval (minutes, optional)</label>
                                    <input
                                        type="number"
                                        value={newReminder.repeatInterval}
                                        onChange={(e) =>
                                            setNewReminder((prev) => ({ ...prev, repeatInterval: e.target.value }))
                                        }
                                        className="w-full p-2 sm:p-3 border border-gray-200 rounded-lg text-xs sm:text-sm"
                                        placeholder="e.g., 20"
                                        min="5"
                                        max="1440"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs sm:text-sm font-semibold text-gray-800">Email Address (Optional)</label>
                                    <input
                                        type="email"
                                        value={newReminder.emailOverride}
                                        onChange={(e) =>
                                            setNewReminder((prev) => ({ ...prev, emailOverride: e.target.value }))
                                        }
                                        className="w-full p-2 sm:p-3 border border-gray-200 rounded-lg text-xs sm:text-sm"
                                        placeholder={`Default: ${user.email}`}
                                    />
                                </div>
                                <div>
                                    <h3 className="text-xs sm:text-sm font-semibold text-gray-800">Delivery Channels</h3>
                                    {Object.keys(newReminder.deliveryChannels).map((channel) => (
                                        <label key={channel} className="flex items-center gap-2 sm:gap-3">
                                            <input
                                                type="checkbox"
                                                checked={newReminder.deliveryChannels[channel]}
                                                onChange={(e) =>
                                                    setNewReminder((prev) => ({
                                                        ...prev,
                                                        deliveryChannels: {
                                                            ...prev.deliveryChannels,
                                                            [channel]: e.target.checked,
                                                        },
                                                    }))
                                                }
                                                className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600"
                                            />
                                            <span className="text-xs sm:text-sm text-gray-800 capitalize">{channel}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-4 sm:mt-6">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowCreateReminder(false)}
                                    className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-gray-200 text-gray-800 text-sm sm:text-base font-semibold hover:bg-gray-300 transition-all"
                                    aria-label="Cancel"
                                >
                                    Cancel
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleCreateReminder}
                                    className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-teal-600 text-white text-sm sm:text-base font-semibold hover:bg-teal-700 transition-all"
                                    aria-label="Create Reminder"
                                >
                                    Create
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Reminder Details Modal */}
            <AnimatePresence>
                {showReminderDetails && selectedReminder && (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={modalVariants}
                        className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 px-4 sm:px-6"
                        role="dialog"
                        aria-label="Reminder Details"
                        ref={modalRef}
                        tabIndex={-1}
                    >
                        <div
                            className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 max-w-xs sm:max-w-sm md:max-w-lg w-full bg-opacity-95 backdrop-blur-sm"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-3 sm:mb-4">
                                <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-blue-900 truncate">
                                    {isEditing ? 'Edit Reminder' : 'Reminder Details'}
                                </h2>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        setShowReminderDetails(false);
                                        setIsEditing(false);
                                    }}
                                    className="p-1 sm:p-2 text-blue-900 hover:text-teal-600"
                                    aria-label="Close Reminder Details"
                                >
                                    <X className="w-4 h-4 sm:w-5 h-5" />
                                </motion.button>
                            </div>
                            {isEditing ? (
                                <div className="space-y-4 sm:space-y-6">
                                    <div>
                                        <label className="text-xs sm:text-sm font-semibold text-gray-800">Message</label>
                                        <input
                                            type="text"
                                            value={editReminder.message}
                                            onChange={(e) =>
                                                setEditReminder((prev) => ({ ...prev, message: e.target.value }))
                                            }
                                            className="w-full p-2 sm:p-3 border border-gray-200 rounded-lg text-xs sm:text-sm"
                                            placeholder="Enter reminder message"
                                            maxLength={200}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs sm:text-sm font-semibold text-gray-800">Attach Task (Optional)</label>
                                        <select
                                            value={editReminder.targetId}
                                            onChange={(e) =>
                                                setEditReminder((prev) => ({
                                                    ...prev,
                                                    targetId: e.target.value,
                                                    targetModel: e.target.value ? 'Task' : '',
                                                }))
                                            }
                                            className="w-full p-2 sm:p-3 border border-gray-200 rounded-lg text-xs sm:text-sm"
                                        >
                                            <option value="">No Task</option>
                                            {tasks.map((task) => (
                                                <option key={task._id} value={task._id} className="truncate">
                                                    {task.title}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs sm:text-sm font-semibold text-gray-800">Reminder Date & Time</label>
                                        <DatePicker
                                            selected={editReminder.remindAt}
                                            onChange={(date) =>
                                                setEditReminder((prev) => ({ ...prev, remindAt: date }))
                                            }
                                            showTimeSelect
                                            timeIntervals={15}
                                            dateFormat="MMMM d, yyyy h:mm aa"
                                            className="w-full p-2 sm:p-3 border border-gray-200 rounded-lg text-xs sm:text-sm"
                                            minDate={new Date()}
                                            popperClassName="z-[60]"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs sm:text-sm font-semibold text-gray-800">Repeat Interval (minutes, optional)</label>
                                        <input
                                            type="number"
                                            value={editReminder.repeatInterval}
                                            onChange={(e) =>
                                                setEditReminder((prev) => ({ ...prev, repeatInterval: e.target.value }))
                                            }
                                            className="w-full p-2 sm:p-3 border border-gray-200 rounded-lg text-xs sm:text-sm"
                                            placeholder="e.g., 20"
                                            min="5"
                                            max="1440"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs sm:text-sm font-semibold text-gray-800">Email Address (Optional)</label>
                                        <input
                                            type="email"
                                            value={editReminder.emailOverride}
                                            onChange={(e) =>
                                                setEditReminder((prev) => ({ ...prev, emailOverride: e.target.value }))
                                            }
                                            className="w-full p-2 sm:p-3 border border-gray-200 rounded-lg text-xs sm:text-sm"
                                            placeholder={`Default: ${user.email}`}
                                        />
                                    </div>
                                    <div>
                                        <h3 className="text-xs sm:text-sm font-semibold text-gray-800">Delivery Channels</h3>
                                        {Object.keys(editReminder.deliveryChannels).map((channel) => (
                                            <label key={channel} className="flex items-center gap-2 sm:gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={editReminder.deliveryChannels[channel]}
                                                    onChange={(e) =>
                                                        setEditReminder((prev) => ({
                                                            ...prev,
                                                            deliveryChannels: {
                                                                ...prev.deliveryChannels,
                                                                [channel]: e.target.checked,
                                                            },
                                                        }))
                                                    }
                                                    className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600"
                                                />
                                                <span className="text-xs sm:text-sm text-gray-800 capitalize">{channel}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-4 sm:mt-6">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setIsEditing(false)}
                                            className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-gray-200 text-gray-800 text-sm sm:text-base font-semibold hover:bg-gray-300 transition-all"
                                            aria-label="Cancel"
                                        >
                                            Cancel
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handleEditReminder}
                                            className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-teal-600 text-white text-sm sm:text-base font-semibold hover:bg-teal-700 transition-all"
                                            aria-label="Save Reminder"
                                        >
                                            Save
                                        </motion.button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 sm:space-y-6">
                                    <div>
                                        <p className="text-xs sm:text-sm font-semibold text-gray-800">Message</p>
                                        <p className="text-xs sm:text-sm text-gray-600 break-words">{selectedReminder.message}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs sm:text-sm font-semibold text-gray-800">Type</p>
                                        <p className="text-xs sm:text-sm text-gray-600 capitalize">{selectedReminder.type.replace('_', ' ')}</p>
                                    </div>
                                    {selectedReminder.targetId && (
                                        <div>
                                            <p className="text-xs sm:text-sm font-semibold text-gray-800">Attached Task</p>
                                            <p className="text-xs sm:text-sm text-gray-600 truncate">
                                                {tasks.find((task) => task._id === selectedReminder.targetId)?.title || 'Task not found'}
                                            </p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-xs sm:text-sm font-semibold text-gray-800">Reminder Time</p>
                                        <p className="text-xs sm:text-sm text-gray-600 line-clamp-1">
                                            {moment(selectedReminder.remindAt).tz('Africa/Lagos').format('MMM D, YYYY, h:mm A')}
                                        </p>
                                    </div>
                                    {selectedReminder.repeatInterval && (
                                        <div>
                                            <p className="text-xs sm:text-sm font-semibold text-gray-800">Repeat Interval</p>
                                            <p className="text-xs sm:text-sm text-gray-600">{selectedReminder.repeatInterval} minutes</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-xs sm:text-sm font-semibold text-gray-800">Email</p>
                                        <p className="text-xs sm:text-sm text-gray-600 truncate">
                                            {selectedReminder.emailOverride || user.email}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs sm:text-sm font-semibold text-gray-800">Delivery Channels</p>
                                        <p className="text-xs sm:text-sm text-gray-600 truncate">
                                            {Object.keys(selectedReminder.deliveryChannels)
                                                .filter((key) => selectedReminder.deliveryChannels[key])
                                                .map((key) => key)
                                                .join(', ')}
                                        </p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-4 sm:mt-6">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setIsEditing(true)}
                                            className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-blue-600 text-white text-sm sm:text-base font-semibold hover:bg-blue-700 transition-all flex items-center gap-2 sm:gap-3"
                                            aria-label="Edit Reminder"
                                        >
                                            <Edit className="w-4 h-4 sm:w-5 h-5" />
                                            Edit
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handleDeleteReminder}
                                            className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-red-600 text-white text-sm sm:text-base font-semibold hover:bg-red-500 transition-all flex items-center gap-2 sm:gap-3"
                                            aria-label="Delete Reminder"
                                        >
                                            <Trash className="w-4 h-4 sm:w-5 h-5" />
                                            Delete
                                        </motion.button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Reminders;