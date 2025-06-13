import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Bell, X, Clock, Settings, CheckCircle, AlertTriangle, Calendar, Target, FileText, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import io from 'socket.io-client';
import moment from 'moment-timezone';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

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
    const [showPreferences, setShowPreferences] = useState(false);
    const [preferences, setPreferences] = useState({
        defaultDeliveryChannels: { inApp: true, email: false, push: false },
        defaultReminderTimes: { task_due: 60, meeting: 30, goal_deadline: 1440, appraisal_submission: 1440, manager_feedback: 720 },
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
            if (e.key === 'Escape' && showPreferences) {
                setShowPreferences(false);
            }
        };
        if (showPreferences) {
            modalRef.current?.focus();
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showPreferences]);

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

    useEffect(() => {
        if (!user || !localStorage.getItem('token')) {
            navigate('/login');
            return;
        }
        fetchReminders();
        fetchPreferences();
    }, [user, navigate, fetchReminders, fetchPreferences]);

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
            className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 font-sans"
        >
            <Toaster position="bottom-right" />
            <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <h1 className="text-3xl font-extrabold text-teal-600">ConnectSphere Reminders</h1>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowPreferences(true)}
                            className="p-2 text-blue-900 hover:text-teal-600 transition-colors"
                            aria-label="Reminder Preferences"
                        >
                            <Settings className="w-6 h-6" />
                        </button>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="px-4 py-2 rounded-full bg-teal-600 text-white font-semibold hover:bg-teal-700 transition-all flex items-center gap-2"
                            aria-label="Back to Dashboard"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </header>
            <main className="max-w-5xl mx-auto w-full p-6">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-6"
                >
                    <h2 className="text-2xl font-bold text-blue-900">Your Reminders</h2>
                    {isLoading ? (
                        <div className="text-center text-gray-500">Loading reminders...</div>
                    ) : reminders.length === 0 ? (
                        <div className="text-center text-gray-500">No reminders found. Create tasks or meetings to get started!</div>
                    ) : (
                        <AnimatePresence>
                            {reminders.map((reminder) => (
                                <motion.div
                                    key={reminder._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="bg-white rounded-2xl shadow-xl p-6 flex items-center gap-4 hover:shadow-2xl transition-all duration-300 border-l-4 border-teal-600"
                                >
                                    <ReminderIcon type={reminder.type} />
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-blue-900">{reminder.message}</p>
                                        <p className="text-xs text-gray-500">
                                            {moment(reminder.remindAt).tz('Africa/Lagos').format('MMM D, YYYY, h:mm A')}
                                        </p>
                                        <p className="text-xs text-gray-400 capitalize">Status: {reminder.status}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleSnooze(reminder._id, 15)}
                                            className="p-2 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition-all"
                                            aria-label="Snooze Reminder"
                                            disabled={reminder.status === 'dismissed'}
                                        >
                                            <Clock className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDismiss(reminder._id)}
                                            className="p-2 bg-red-600 text-white rounded-full hover:bg-red-500 transition-all"
                                            aria-label="Dismiss Reminder"
                                            disabled={reminder.status === 'dismissed'}
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </motion.div>
            </main>

            {/* Preferences Modal */}
            <AnimatePresence>
                {showPreferences && (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={modalVariants}
                        className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
                        role="dialog"
                        aria-label="Reminder Preferences"
                        ref={modalRef}
                        tabIndex={-1}
                    >
                        <div
                            className="bg-white rounded-2xl p-6 max-w-lg w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold text-blue-900">Reminder Preferences</h2>
                                <button
                                    onClick={() => setShowPreferences(false)}
                                    className="p-2 text-blue-900 hover:text-teal-600"
                                    aria-label="Close Preferences"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-gray-800">Delivery Channels</h3>
                                {Object.keys(preferences.defaultDeliveryChannels).map((channel) => (
                                    <label key={channel} className="flex items-center gap-2">
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
                                            className="h-4 w-4 text-teal-600"
                                        />
                                        <span className="text-sm text-gray-800 capitalize">{channel}</span>
                                    </label>
                                ))}
                                <h3 className="text-sm font-semibold text-gray-800 mt-4">Reminder Times (minutes before)</h3>
                                {Object.keys(preferences.defaultReminderTimes).map((type) => (
                                    <div key={type} className="flex items-center gap-2">
                                        <label className="text-sm text-gray-800 capitalize flex-1">
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
                                            className="w-20 p-2 border border-gray-200 rounded-lg text-sm"
                                            min="0"
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    onClick={() => setShowPreferences(false)}
                                    className="px-4 py-2 rounded-full bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition-all"
                                    aria-label="Cancel"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdatePreferences}
                                    className="px-4 py-2 rounded-full bg-teal-600 text-white font-semibold hover:bg-teal-700 transition-all"
                                    aria-label="Save Preferences"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Reminders;