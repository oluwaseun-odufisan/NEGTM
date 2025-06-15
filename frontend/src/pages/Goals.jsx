import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Plus, X, Target, Calendar, CheckCircle, Edit2, Trash2, Save, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { getDatabase, ref, onValue, set } from 'firebase/database';
import { initializeApp } from 'firebase/app';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import moment from 'moment-timezone';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const Goals = () => {
    const { user, onLogout } = useOutletContext();
    const navigate = useNavigate();
    const [goals, setGoals] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [showCreateGoal, setShowCreateGoal] = useState(false);
    const [showGoalDetails, setShowGoalDetails] = useState(null);
    const [editGoal, setEditGoal] = useState(null);
    const [newGoal, setNewGoal] = useState({
        title: '',
        subGoals: [{ description: '' }],
        type: 'personal',
        taskId: '',
        timeframe: 'daily',
        startDate: new Date(),
        endDate: new Date(new Date().setHours(23, 59, 59, 999)),
    });
    const [isLoading, setIsLoading] = useState(false);
    const modalRef = useRef(null);
    const subGoalInputRef = useRef(null);

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);

    // Calculate default end date based on timeframe
    const getDefaultEndDate = (timeframe, startDate) => {
        const start = new Date(startDate);
        switch (timeframe) {
            case 'daily':
                return new Date(start.setHours(23, 59, 59, 999));
            case 'weekly':
                return new Date(start.setDate(start.getDate() + 6));
            case 'monthly':
                return new Date(start.setMonth(start.getMonth() + 1, 0));
            case 'quarterly':
                return new Date(start.setMonth(start.getMonth() + 3, 0));
            case 'custom':
            default:
                return new Date(start.setDate(start.getDate() + 1));
        }
    };

    useEffect(() => {
        // Update endDate when timeframe changes
        setNewGoal((prev) => ({
            ...prev,
            endDate: getDefaultEndDate(prev.timeframe, prev.startDate),
        }));
    }, [newGoal.timeframe, newGoal.startDate]);

    // Real-time updates with Firebase Realtime Database
    useEffect(() => {
        if (!user) return;
        const db = getDatabase();
        const goalsRef = ref(db, `goals/${user._id}`);
        const unsubscribe = onValue(goalsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setGoals(Object.values(data));
            } else {
                setGoals([]);
            }
        });
        return () => unsubscribe();
    }, [user]);

    // Socket.IO for additional real-time events
    useEffect(() => {
        const socket = io(API_BASE_URL, {
            auth: { token: localStorage.getItem('token') },
        });
        socket.on('newGoal', (goal) => {
            setGoals((prev) => [goal, ...prev]);
            toast.success('Goal created!');
        });
        socket.on('goalUpdated', (goal) => {
            setGoals((prev) => prev.map((g) => (g._id === goal._id ? goal : g)));
            toast.success('Goal updated!');
        });
        socket.on('goalDeleted', (id) => {
            setGoals((prev) => prev.filter((g) => g._id !== id));
            toast.success('Goal deleted!');
        });
        socket.on('connect_error', (error) => {
            console.error('Socket connect error:', error.message);
            toast.error('Real-time updates unavailable.');
        });
        return () => {
            socket.disconnect();
        };
    }, []);

    // Handle authentication errors
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

    // Close modals on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && (showCreateGoal || showGoalDetails || editGoal)) {
                setShowCreateGoal(false);
                setShowGoalDetails(null);
                setEditGoal(null);
            }
        };
        if (showCreateGoal || showGoalDetails || editGoal) {
            modalRef.current?.focus();
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showCreateGoal, showGoalDetails, editGoal]);

    // Fetch tasks and goals
    const getAuthHeaders = useCallback(() => {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No auth token');
        return { Authorization: `Bearer ${token}` };
    }, []);

    const fetchTasks = useCallback(async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/tasks`, { headers: getAuthHeaders() });
            setTasks(response.data.tasks);
        } catch (error) {
            if (error.response?.status !== 401) {
                toast.error(error.response?.data?.message || 'Failed to fetch tasks.');
            }
        }
    }, [getAuthHeaders]);

    const fetchGoals = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/api/goals`, { headers: getAuthHeaders() });
            setGoals(response.data.goals);
            // Sync with Firebase
            const db = getDatabase();
            const goalsRef = ref(db, `goals/${user._id}`);
            await set(goalsRef, response.data.goals.reduce((acc, goal) => ({ ...acc, [goal._id]: goal }), {}));
        } catch (error) {
            if (error.response?.status !== 401) {
                toast.error(error.response?.data?.message || 'Failed to fetch goals.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [getAuthHeaders, user]);

    useEffect(() => {
        if (!user || !localStorage.getItem('token')) {
            navigate('/login');
            return;
        }
        fetchTasks();
        fetchGoals();
    }, [user, navigate, fetchTasks, fetchGoals]);

    // Handle goal creation
    const handleCreateGoal = async () => {
        if (!newGoal.title.trim()) {
            toast.error('Goal title is required.');
            return;
        }
        if (newGoal.subGoals.some((sg) => !sg.description.trim())) {
            toast.error('All sub-goals must have a description.');
            return;
        }
        if (newGoal.type === 'task_related' && !newGoal.taskId) {
            toast.error('Please select a task for task-related goal.');
            return;
        }
        if (newGoal.startDate > newGoal.endDate) {
            toast.error('Start date must be before end date.');
            return;
        }

        try {
            const response = await axios.post(
                `${API_BASE_URL}/api/goals`,
                {
                    ...newGoal,
                    subGoals: newGoal.subGoals.map((sg) => ({ description: sg.description })),
                },
                { headers: getAuthHeaders() }
            );
            // Sync with Firebase
            const db = getDatabase();
            const goalRef = ref(db, `goals/${user._id}/${response.data.goal._id}`);
            await set(goalRef, response.data.goal);
            setShowCreateGoal(false);
            setNewGoal({
                title: '',
                subGoals: [{ description: '' }],
                type: 'personal',
                taskId: '',
                timeframe: 'daily',
                startDate: new Date(),
                endDate: new Date(new Date().setHours(23, 59, 59, 999)),
            });
        } catch (error) {
            if (error.response?.status !== 401) {
                toast.error(error.response?.data?.message || 'Failed to create goal.');
            }
        }
    };

    // Handle goal update
    const handleUpdateGoal = async () => {
        if (!editGoal.title.trim()) {
            toast.error('Goal title is required.');
            return;
        }
        if (editGoal.subGoals.some((sg) => !sg.description.trim())) {
            toast.error('All sub-goals must have a description.');
            return;
        }
        if (editGoal.type === 'task_related' && !editGoal.taskId) {
            toast.error('Please select a task for task-related goal.');
            return;
        }
        if (editGoal.startDate > editGoal.endDate) {
            toast.error('Start date must be before end date.');
            return;
        }

        try {
            const response = await axios.put(
                `${API_BASE_URL}/api/goals/${editGoal._id}`,
                editGoal,
                { headers: getAuthHeaders() }
            );
            // Sync with Firebase
            const db = getDatabase();
            const goalRef = ref(db, `goals/${user._id}/${editGoal._id}`);
            await set(goalRef, response.data.goal);
            setEditGoal(null);
            setShowGoalDetails(null);
        } catch (error) {
            if (error.response?.status !== 401) {
                toast.error(error.response?.data?.message || 'Failed to update goal.');
            }
        }
    };

    // Handle goal progress update
    const handleUpdateProgress = async (goal) => {
        try {
            const response = await axios.put(
                `${API_BASE_URL}/api/goals/${goal._id}/progress`,
                { subGoals: goal.subGoals },
                { headers: getAuthHeaders() }
            );
            // Sync with Firebase
            const db = getDatabase();
            const goalRef = ref(db, `goals/${user._id}/${goal._id}`);
            await set(goalRef, response.data.goal);
            setShowGoalDetails(response.data.goal);
        } catch (error) {
            if (error.response?.status !== 401) {
                toast.error(error.response?.data?.message || 'Failed to update progress.');
            }
        }
    };

    // Handle goal deletion
    const handleDeleteGoal = async (id) => {
        try {
            await axios.delete(`${API_BASE_URL}/api/goals/${id}`, { headers: getAuthHeaders() });
            // Sync with Firebase
            const db = getDatabase();
            const goalRef = ref(db, `goals/${user._id}/${id}`);
            await set(goalRef, null);
            setShowGoalDetails(null);
        } catch (error) {
            if (error.response?.status !== 401) {
                toast.error(error.response?.data?.message || 'Failed to delete goal.');
            }
        }
    };

    // Modal animation variants
    const modalVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
        exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
    };

    if (!user || !localStorage.getItem('token')) {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200 font-sans"
        >
            <Toaster position="bottom-right" />
            <header className="bg-white shadow-md p-4 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-teal-600">ConnectSphere Goals</h1>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowCreateGoal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition-all duration-200"
                            aria-label="Create Goal"
                        >
                            <Plus className="w-5 h-5" />
                            Create Goal
                        </button>
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-all duration-200"
                            aria-label="Back to Dashboard"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Back
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-6">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-6"
                >
                    <h2 className="text-2xl font-semibold text-gray-800">Your Goals</h2>
                    {isLoading ? (
                        <div className="text-center text-gray-600">Loading goals...</div>
                    ) : goals.length === 0 ? (
                        <div className="text-center text-gray-600">No goals found. Create a goal to get started!</div>
                    ) : (
                        <AnimatePresence>
                            {goals.map((goal) => (
                                <motion.div
                                    key={goal._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="bg-white rounded-xl shadow-lg p-6 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-all duration-200 border-l-4 border-teal-500"
                                    onClick={() => setShowGoalDetails(goal)}
                                >
                                    <Target className="w-8 h-8 text-teal-500" />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-semibold text-gray-900">{goal.title}</h3>
                                            {goal.completed && (
                                                <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
                                                    Completed
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            {moment(goal.startDate).format('MMM D, YYYY')} - {moment(goal.endDate).format('MMM D, YYYY')}
                                        </p>
                                        <div className="mt-2 flex items-center gap-2">
                                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                <div
                                                    className="bg-teal-600 h-2.5 rounded-full"
                                                    style={{ width: `${goal.progress}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-sm font-medium text-gray-700">{goal.progress}%</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </motion.div>
            </main>

            {/* Create Goal Modal */}
            <AnimatePresence>
                {showCreateGoal && (
                    <motion.div
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                        role="dialog"
                        aria-labelledby="create-goal-title"
                        ref={modalRef}
                        tabIndex={-1}
                    >
                        <div className="bg-white rounded-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h3 id="create-goal-title" className="text-xl font-semibold text-gray-900">
                                    Create New Goal
                                </h3>
                                <button
                                    onClick={() => setShowCreateGoal(false)}
                                    className="p-2 text-gray-600 hover:text-gray-800"
                                    aria-label="Close"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Goal Title</label>
                                    <input
                                        type="text"
                                        value={newGoal.title}
                                        onChange={(e) => setNewGoal((prev) => ({ ...prev, title: e.target.value }))}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                                        placeholder="Enter goal title"
                                        maxLength={100}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Sub-Goals</label>
                                    {newGoal.subGoals.map((sg, index) => (
                                        <div key={index} className="flex items-center gap-2 mt-2">
                                            <input
                                                type="text"
                                                value={sg.description}
                                                onChange={(e) =>
                                                    setNewGoal((prev) => {
                                                        const updatedSubGoals = [...prev.subGoals];
                                                        updatedSubGoals[index] = { description: e.target.value };
                                                        return { ...prev, subGoals: updatedSubGoals };
                                                    })
                                                }
                                                className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                                                placeholder="Enter sub-goal"
                                                maxLength={200}
                                                ref={index === newGoal.subGoals.length - 1 ? subGoalInputRef : null}
                                            />
                                            {newGoal.subGoals.length > 1 && (
                                                <button
                                                    onClick={() =>
                                                        setNewGoal((prev) => ({
                                                            ...prev,
                                                            subGoals: prev.subGoals.filter((_, i) => i !== index),
                                                        }))
                                                    }
                                                    className="text-red-600 hover:text-red-800"
                                                    aria-label="Remove sub-goal"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        onClick={() =>
                                            setNewGoal((prev) => ({
                                                ...prev,
                                                subGoals: [...prev.subGoals, { description: '' }],
                                            }))
                                        }
                                        className="mt-2 flex items-center gap-1 text-teal-600 hover:text-teal-800"
                                        aria-label="Add sub-goal"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Sub-Goal
                                    </button>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Goal Type</label>
                                    <select
                                        value={newGoal.type}
                                        onChange={(e) =>
                                            setNewGoal((prev) => ({
                                                ...prev,
                                                type: e.target.value,
                                                taskId: e.target.value === 'personal' ? '' : prev.taskId,
                                            }))
                                        }
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                                    >
                                        <option value="personal">Personal</option>
                                        <option value="task_related">Task-Related</option>
                                    </select>
                                </div>
                                {newGoal.type === 'task_related' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Select Task</label>
                                        <select
                                            value={newGoal.taskId}
                                            onChange={(e) => setNewGoal((prev) => ({ ...prev, taskId: e.target.value }))}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                                        >
                                            <option value="">Select a task</option>
                                            {tasks.map((task) => (
                                                <option key={task._id} value={task._id}>
                                                    {task.title}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Timeframe</label>
                                    <select
                                        value={newGoal.timeframe}
                                        onChange={(e) =>
                                            setNewGoal((prev) => ({
                                                ...prev,
                                                timeframe: e.target.value,
                                                endDate: getDefaultEndDate(e.target.value, prev.startDate),
                                            }))
                                        }
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                                    >
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="quarterly">Quarterly</option>
                                        <option value="custom">Custom</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Start Date</label>
                                        <DatePicker
                                            selected={newGoal.startDate}
                                            onChange={(date) =>
                                                setNewGoal((prev) => ({
                                                    ...prev,
                                                    startDate: date,
                                                    endDate: getDefaultEndDate(prev.timeframe, date),
                                                }))
                                            }
                                            dateFormat="MMM d, yyyy"
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                                            minDate={new Date()}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">End Date</label>
                                        <DatePicker
                                            selected={newGoal.endDate}
                                            onChange={(date) => setNewGoal((prev) => ({ ...prev, endDate: date }))}
                                            dateFormat="MMM d, yyyy"
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                                            minDate={newGoal.startDate}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    onClick={() => setShowCreateGoal(false)}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-full hover:bg-gray-300 transition-all duration-200"
                                    aria-label="Cancel"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateGoal}
                                    className="px-4 py-2 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition-all duration-200"
                                    aria-label="Create Goal"
                                >
                                    Create Goal
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Goal Details Modal */}
            <AnimatePresence>
                {showGoalDetails && (
                    <motion.div
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                        role="dialog"
                        aria-labelledby="goal-details-title"
                        ref={modalRef}
                        tabIndex={-1}
                    >
                        <div className="bg-white rounded-2xl p-8 max-w-lg w-full">
                            <div className="flex justify-between items-center mb-6">
                                <h3 id="goal-details-title" className="text-xl font-semibold text-gray-900">
                                    Goal Details
                                </h3>
                                <button
                                    onClick={() => setShowGoalDetails(null)}
                                    className="p-2 text-gray-600 hover:text-gray-800"
                                    aria-label="Close"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700">Title</h4>
                                    <p className="text-sm text-gray-900">{showGoalDetails.title}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700">Sub-Goals</h4>
                                    <ul className="space-y-2">
                                        {showGoalDetails.subGoals.map((sg, index) => (
                                            <li key={index} className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={sg.completed}
                                                    onChange={() => {
                                                        const updatedSubGoals = [...showGoalDetails.subGoals];
                                                        updatedSubGoals[index].completed = !sg.completed;
                                                        setShowGoalDetails((prev) => ({
                                                            ...prev,
                                                            subGoals: updatedSubGoals,
                                                        }));
                                                    }}
                                                    className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                                                />
                                                <span
                                                    className={`text-sm ${sg.completed ? 'line-through text-gray-500' : 'text-gray-900'
                                                        }`}
                                                >
                                                    {sg.description}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700">Progress</h4>
                                    <div className="flex items-center gap-2">
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div
                                                className="bg-teal-600 h-2.5 rounded-full"
                                                style={{ width: `${showGoalDetails.progress}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-sm font-medium text-gray-700">{showGoalDetails.progress}%</span>
                                    </div>
                                    {showGoalDetails.completed && (
                                        <div className="mt-2 flex items-center gap-2 text-green-600">
                                            <CheckCircle className="w-5 h-5" />
                                            <span className="text-sm font-medium">Goal Completed!</span>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700">Type</h4>
                                    <p className="text-sm text-gray-600 capitalize">{showGoalDetails.type.replace('_', ' ')}</p>
                                </div>
                                {showGoalDetails.taskId && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700">Attached Task</h4>
                                        <p className="text-sm text-gray-600">
                                            {tasks.find((t) => t._id === showGoalDetails.taskId)?.title || 'N/A'}
                                        </p>
                                    </div>
                                )}
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700">Timeframe</h4>
                                    <p className="text-sm text-gray-600 capitalize">{showGoalDetails.timeframe}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700">Start Date</h4>
                                        <p className="text-sm text-gray-600">
                                            {moment(showGoalDetails.startDate).format('MMM D, YYYY')}
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700">End Date</h4>
                                        <p className="text-sm text-gray-600">
                                            {moment(showGoalDetails.endDate).format('MMM D, YYYY')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    onClick={() =>
                                        setEditGoal({
                                            ...showGoalDetails,
                                            startDate: new Date(showGoalDetails.startDate),
                                            endDate: new Date(showGoalDetails.endDate),
                                        })
                                    }
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-200"
                                    aria-label="Edit Goal"
                                >
                                    <Edit2 className="w-4 h-4" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleUpdateProgress(showGoalDetails)}
                                    className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition-all duration-200"
                                    aria-label="Update Progress"
                                >
                                    <Save className="w-4 h-4" />
                                    Update
                                </button>
                                <button
                                    onClick={() => handleDeleteGoal(showGoalDetails._id)}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all duration-200"
                                    aria-label="Delete Goal"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Edit Goal Modal */}
            <AnimatePresence>
                {editGoal && (
                    <motion.div
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                        role="dialog"
                        aria-labelledby="edit-goal-title"
                        ref={modalRef}
                        tabIndex={-1}
                    >
                        <div className="bg-white rounded-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h3 id="edit-goal-title" className="text-xl font-semibold text-gray-900">
                                    Edit Goal
                                </h3>
                                <button
                                    onClick={() => setEditGoal(null)}
                                    className="p-2 text-gray-600 hover:text-gray-800"
                                    aria-label="Close"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Goal Title</label>
                                    <input
                                        type="text"
                                        value={editGoal.title}
                                        onChange={(e) => setEditGoal((prev) => ({ ...prev, title: e.target.value }))}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                                        placeholder="Enter goal title"
                                        maxLength={100}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Sub-Goals</label>
                                    {editGoal.subGoals.map((sg, index) => (
                                        <div key={index} className="flex items-center gap-2 mt-2">
                                            <input
                                                type="text"
                                                value={sg.description}
                                                onChange={(e) =>
                                                    setEditGoal((prev) => {
                                                        const updatedSubGoals = [...prev.subGoals];
                                                        updatedSubGoals[index] = {
                                                            ...updatedSubGoals[index],
                                                            description: e.target.value,
                                                        };
                                                        return { ...prev, subGoals: updatedSubGoals };
                                                    })
                                                }
                                                className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                                                placeholder="Enter sub-goal"
                                                maxLength={200}
                                            />
                                            {editGoal.subGoals.length > 1 && (
                                                <button
                                                    onClick={() =>
                                                        setEditGoal((prev) => ({
                                                            ...prev,
                                                            subGoals: prev.subGoals.filter((_, i) => i !== index),
                                                        }))
                                                    }
                                                    className="text-red-600 hover:text-red-800"
                                                    aria-label="Remove sub-goal"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        onClick={() =>
                                            setEditGoal((prev) => ({
                                                ...prev,
                                                subGoals: [...prev.subGoals, { description: '', completed: false }],
                                            }))
                                        }
                                        className="mt-2 flex items-center gap-1 text-teal-600 hover:text-teal-800"
                                        aria-label="Add sub-goal"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Sub-Goal
                                    </button>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Goal Type</label>
                                    <select
                                        value={editGoal.type}
                                        onChange={(e) =>
                                            setEditGoal((prev) => ({
                                                ...prev,
                                                type: e.target.value,
                                                taskId: e.target.value === 'personal' ? '' : prev.taskId,
                                            }))
                                        }
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                                    >
                                        <option value="personal">Personal</option>
                                        <option value="task_related">Task-Related</option>
                                    </select>
                                </div>
                                {editGoal.type === 'task_related' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Select Task</label>
                                        <select
                                            value={editGoal.taskId || ''}
                                            onChange={(e) => setEditGoal((prev) => ({ ...prev, taskId: e.target.value }))}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                                        >
                                            <option value="">Select a task</option>
                                            {tasks.map((task) => (
                                                <option key={task._id} value={task._id}>
                                                    {task.title}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Timeframe</label>
                                    <select
                                        value={editGoal.timeframe}
                                        onChange={(e) =>
                                            setEditGoal((prev) => ({
                                                ...prev,
                                                timeframe: e.target.value,
                                                endDate: getDefaultEndDate(e.target.value, prev.startDate),
                                            }))
                                        }
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                                    >
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="quarterly">Quarterly</option>
                                        <option value="custom">Custom</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Start Date</label>
                                        <DatePicker
                                            selected={editGoal.startDate}
                                            onChange={(date) =>
                                                setEditGoal((prev) => ({
                                                    ...prev,
                                                    startDate: date,
                                                    endDate: getDefaultEndDate(prev.timeframe, date),
                                                }))
                                            }
                                            dateFormat="MMM d, yyyy"
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                                            minDate={new Date()}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">End Date</label>
                                        <DatePicker
                                            selected={editGoal.endDate}
                                            onChange={(date) => setEditGoal((prev) => ({ ...prev, endDate: date }))}
                                            dateFormat="MMM d, yyyy"
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                                            minDate={editGoal.startDate}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    onClick={() => setEditGoal(null)}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-full hover:bg-gray-300 transition-all duration-200"
                                    aria-label="Cancel"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdateGoal}
                                    className="px-4 py-2 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition-all duration-200"
                                    aria-label="Save Changes"
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

export default Goals;