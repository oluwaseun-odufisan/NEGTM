import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Target, X, Plus, Edit, Trash, CheckCircle, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import io from 'socket.io-client';
import moment from 'moment-timezone';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const Goals = () => {
    const { user, onLogout } = useOutletContext();
    const navigate = useNavigate();
    const [goals, setGoals] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [showCreateGoal, setShowCreateGoal] = useState(false);
    const [showGoalDetails, setShowGoalDetails] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [newGoal, setNewGoal] = useState({
        title: '',
        subGoals: [],
        type: 'personal',
        timeframe: 'daily',
        startDate: new Date(),
        endDate: new Date(),
    });
    const [editGoal, setEditGoal] = useState(null);
    const [newSubGoal, setNewSubGoal] = useState('');
    const modalRef = useRef(null);

    // Socket.IO for real-time updates
    useEffect(() => {
        const socket = io(API_BASE_URL, {
            auth: { token: localStorage.getItem('token') },
        });
        socket.on('newGoal', (goal) => {
            setGoals((prev) => [goal, ...prev]);
            toast.success('Goal created in real-time!');
        });
        socket.on('goalUpdated', (goal) => {
            setGoals((prev) => prev.map((g) => (g._id === goal._id ? goal : g)));
            toast.success('Goal updated in real-time!');
        });
        socket.on('goalDeleted', (goalId) => {
            setGoals((prev) => prev.filter((g) => g._id !== goalId));
            toast.success('Goal deleted in real-time!');
        });
        socket.on('connect_error', (error) => {
            console.error('Socket connect error:', error.message);
            toast.error('Real-time updates unavailable.');
        });
        return () => {
            socket.off('newGoal');
            socket.off('goalUpdated');
            socket.off('goalDeleted');
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
            if (e.key === 'Escape' && (showCreateGoal || showGoalDetails)) {
                setShowCreateGoal(false);
                setShowGoalDetails(false);
                setIsEditing(false);
            }
        };
        if (showCreateGoal || showGoalDetails) {
            modalRef.current?.focus();
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showCreateGoal, showGoalDetails]);

    const getAuthHeaders = useCallback(() => {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No auth token');
        return { Authorization: `Bearer ${token}` };
    }, []);

    const fetchGoals = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/api/goals`, { headers: getAuthHeaders() });
            setGoals(response.data.goals);
        } catch (error) {
            if (error.response?.status !== 401) {
                toast.error(error.response?.data?.message || 'Failed to fetch goals.');
            }
        } finally {
            setIsLoading(false);
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
        fetchGoals();
        fetchTasks();
    }, [user, navigate, fetchGoals, fetchTasks]);

    const handleCreateGoal = useCallback(async () => {
        if (!newGoal.title.trim()) {
            toast.error('Goal title is required.');
            return;
        }
        if (newGoal.subGoals.length === 0) {
            toast.error('At least one sub-goal is required.');
            return;
        }
        if (newGoal.startDate >= newGoal.endDate) {
            toast.error('End date must be after start date.');
            return;
        }
        try {
            await axios.post(`${API_BASE_URL}/api/goals`, newGoal, { headers: getAuthHeaders() });
            setShowCreateGoal(false);
            setNewGoal({
                title: '',
                subGoals: [],
                type: 'personal',
                timeframe: 'daily',
                startDate: new Date(),
                endDate: new Date(),
            });
            toast.success('Goal created!');
        } catch (error) {
            if (error.response?.status !== 401) {
                toast.error(error.response?.data?.message || 'Failed to create goal.');
            }
        }
    }, [newGoal, getAuthHeaders]);

    const handleUpdateGoal = useCallback(async () => {
        if (!editGoal.title.trim()) {
            toast.error('Goal title is required.');
            return;
        }
        if (editGoal.subGoals.length === 0) {
            toast.error('At least one sub-goal is required.');
            return;
        }
        if (editGoal.startDate >= editGoal.endDate) {
            toast.error('End date must be after start date.');
            return;
        }
        try {
            await axios.put(
                `${API_BASE_URL}/api/goals/${selectedGoal._id}`,
                editGoal,
                { headers: getAuthHeaders() }
            );
            setShowGoalDetails(false);
            setIsEditing(false);
            toast.success('Goal updated!');
        } catch (error) {
            if (error.response?.status !== 401) {
                toast.error(error.response?.data?.message || 'Failed to update goal.');
            }
        }
    }, [editGoal, selectedGoal, getAuthHeaders]);

    const handleDeleteGoal = useCallback(async () => {
        try {
            await axios.delete(`${API_BASE_URL}/api/goals/${selectedGoal._id}`, { headers: getAuthHeaders() });
            setShowGoalDetails(false);
            toast.success('Goal deleted!');
        } catch (error) {
            if (error.response?.status !== 401) {
                toast.error(error.response?.data?.message || 'Failed to delete goal.');
            }
        }
    }, [selectedGoal, getAuthHeaders]);

    const handleGoalClick = useCallback((goal) => {
        setSelectedGoal(goal);
        setEditGoal({ ...goal, startDate: new Date(goal.startDate), endDate: new Date(goal.endDate) });
        setShowGoalDetails(true);
    }, []);

    const handleAddSubGoal = () => {
        if (!newSubGoal.trim()) {
            toast.error('Sub-goal title is required.');
            return;
        }
        setNewGoal((prev) => ({
            ...prev,
            subGoals: [...prev.subGoals, { title: newSubGoal, completed: false, taskId: null }],
        }));
        setNewSubGoal('');
    };

    const handleUpdateSubGoalStatus = async (subGoalIndex, completed) => {
        const updatedSubGoals = [...editGoal.subGoals];
        updatedSubGoals[subGoalIndex].completed = completed;
        setEditGoal((prev) => ({ ...prev, subGoals: updatedSubGoals }));
    };

    const calculateProgress = (subGoals) => {
        if (subGoals.length === 0) return 0;
        const completed = subGoals.filter((sg) => sg.completed).length;
        return Math.round((completed / subGoals.length) * 100);
    };

    const setDefaultDates = (timeframe) => {
        const startDate = new Date();
        let endDate = new Date();
        switch (timeframe) {
            case 'daily':
                endDate.setDate(startDate.getDate() + 1);
                break;
            case 'weekly':
                endDate.setDate(startDate.getDate() + 7);
                break;
            case 'monthly':
                endDate.setMonth(startDate.getMonth() + 1);
                break;
            case 'quarterly':
                endDate.setMonth(startDate.getMonth() + 3);
                break;
            default:
                endDate.setDate(startDate.getDate() + 1);
                break;
        }
        setNewGoal((prev) => ({ ...prev, startDate, endDate }));
    };

    const modalVariants = {
        hidden: { opacity: 0, scale: 0.8 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
        exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
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
            <Toaster position="bottom-right" toastOptions={{ className: 'text-sm sm:text-base max-w-xs sm:max-w-sm' }} />
            <header className="bg-white shadow-lg px-4 sm:px-6 py-4 sm:py-5 sticky top-0 z-20">
                <div className="max-w-[90rem] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-teal-700 truncate">Your Goals</h1>
                    <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 md:gap-4 w-full sm:w-auto">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                setShowCreateGoal(true);
                                setDefaultDates('daily');
                            }}
                            className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-3 rounded-full bg-blue-600 text-white text-sm sm:text-base md:text-lg font-semibold hover:bg-blue-700 transition-all flex items-center gap-2 sm:gap-3 shadow-md"
                            aria-label="Create Goal"
                        >
                            <Plus className="w-4 h-4 sm:w-5 h-5 md:w-6 h-6" />
                            New Goal
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/')}
                            className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-3 rounded-full bg-teal-600 text-white text-sm sm:text-base md:text-lg font-semibold hover:bg-teal-700 transition-all flex items-center gap-2 sm:gap-3 shadow-md"
                            aria-label="Back to Dashboard"
                        >
                            <ArrowLeft className="w-4 h-4 sm:w-5 h-5 md:w-6 h-6" />
                            Dashboard
                        </motion.button>
                    </div>
                </div>
            </header>
            <main className="max-w-[90rem] mx-auto w-full px-4 sm:px-6 md:px-8 py-6 sm:py-8">
                <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6 }}
                    className="space-y-6 sm:space-y-8 max-h-[calc(100vh-12rem)] sm:max-h-[calc(100vh-14rem)] overflow-y-auto custom-scrollbar"
                >
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-900 truncate">All Goals</h2>
                    {isLoading ? (
                        <div className="text-center text-gray-600 text-sm sm:text-base md:text-lg">Loading goals...</div>
                    ) : goals.length === 0 ? (
                        <div className="text-center text-gray-600 text-sm sm:text-base md:text-lg">No goals found. Create a goal to get started!</div>
                    ) : (
                        <AnimatePresence>
                            {goals.map((goal) => (
                                <motion.div
                                    key={goal._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="bg-white rounded-2xl sm:rounded-3xl shadow-lg sm:shadow-xl p-4 sm:p-5 md:p-6 flex items-center gap-3 sm:gap-4 md:gap-6 hover:shadow-2xl transition-all duration-300 border-l-4 sm:border-l-6 border-teal-600 cursor-pointer bg-opacity-90 backdrop-blur-sm"
                                    onClick={() => handleGoalClick(goal)}
                                >
                                    <Target className="w-6 h-6 sm:w-7 h-7 md:w-8 h-8 text-teal-400 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-base sm:text-lg md:text-xl font-semibold text-blue-900 truncate">{goal.title}</p>
                                        <p className="text-sm sm:text-base text-gray-600 line-clamp-1">
                                            {moment(goal.startDate).tz('Africa/Lagos').format('MMM D, YYYY')} -{' '}
                                            {moment(goal.endDate).tz('Africa/Lagos').format('MMM D, YYYY')}
                                        </p>
                                        <p className="text-sm sm:text-base text-gray-500 capitalize line-clamp-1">Type: {goal.type}</p>
                                        <div className="mt-2 flex items-center gap-2 sm:gap-3">
                                            <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
                                                <motion.div
                                                    className="bg-teal-600 h-2 sm:h-3 rounded-full"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${calculateProgress(goal.subGoals)}%` }}
                                                    transition={{ duration: 0.5 }}
                                                />
                                            </div>
                                            <p className="text-sm sm:text-base text-gray-600 flex-shrink-0">{calculateProgress(goal.subGoals)}%</p>
                                        </div>
                                        {calculateProgress(goal.subGoals) === 100 && (
                                            <p className="text-sm sm:text-base text-teal-600 font-semibold mt-1 line-clamp-1">Goal Completed!</p>
                                        )}
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 z-10 overflow-hidden">
                                        <div className="bg-white/95 backdrop-blur-md p-4 rounded-lg shadow-lg max-w-[90%] max-h-[90%] overflow-y-auto text-gray-900">
                                            <h3 className="text-lg font-bold mb-2">{goal.title}</h3>
                                            <p className="text-sm mb-2">Type: {goal.type}</p>
                                            <p className="text-sm mb-2">Timeframe: {goal.timeframe}</p>
                                            <p className="text-sm mb-2">From {moment(goal.startDate).tz('Africa/Lagos').format('MMM D, YYYY')} to {moment(goal.endDate).tz('Africa/Lagos').format('MMM D, YYYY')}</p>
                                            <h4 className="text-md font-semibold mb-1">Sub-goals:</h4>
                                            <ul className="list-disc pl-4 text-sm">
                                                {goal.subGoals.map((sg, i) => (
                                                    <li key={i} className={sg.completed ? 'line-through' : ''}>
                                                        {sg.title} {sg.taskId ? `(Task: ${tasks.find(t => t._id === sg.taskId)?.title || 'Unknown'})` : ''}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
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

            {/* Create Goal Modal */}
            <AnimatePresence>
                {showCreateGoal && (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={modalVariants}
                        className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 px-4 sm:px-6"
                        role="dialog"
                        aria-label="Create Goal"
                        ref={modalRef}
                        tabIndex={-1}
                    >
                        <div className="bg-white bg-opacity-95 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 max-w-xs sm:max-w-sm md:max-w-lg w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-4 sm:mb-6">
                                <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-blue-900 truncate">Create New Goal</h2>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setShowCreateGoal(false)}
                                    className="p-1 sm:p-2 text-blue-900 hover:text-teal-600"
                                    aria-label="Close Create Goal"
                                >
                                    <X className="w-5 h-5 sm:w-6 h-6" />
                                </motion.button>
                            </div>
                            <div className="space-y-4 sm:space-y-6">
                                <div>
                                    <label className="text-sm sm:text-base font-semibold text-gray-800">Goal Title</label>
                                    <input
                                        type="text"
                                        value={newGoal.title}
                                        onChange={(e) => setNewGoal((prev) => ({ ...prev, title: e.target.value }))}
                                        className="w-full p-2 sm:p-3 border border-gray-200 rounded-xl text-sm sm:text-base focus:ring-2 focus:ring-teal-500"
                                        placeholder="Enter goal title"
                                        maxLength={100}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm sm:text-base font-semibold text-gray-800">Sub-Goals</label>
                                    <div className="flex gap-2 sm:gap-3">
                                        <input
                                            type="text"
                                            value={newSubGoal}
                                            onChange={(e) => setNewSubGoal(e.target.value)}
                                            className="flex-1 p-2 sm:p-3 border border-gray-200 rounded-xl text-sm sm:text-base focus:ring-2 focus:ring-teal-500"
                                            placeholder="Enter sub-goal"
                                            maxLength={200}
                                        />
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handleAddSubGoal}
                                            className="p-2 sm:p-3 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition-all shadow-md"
                                            aria-label="Add Sub-Goal"
                                        >
                                            <Plus className="w-4 h-4 sm:w-5 h-5" />
                                        </motion.button>
                                    </div>
                                    <div className="mt-2 sm:mt-3 max-h-32 sm:max-h-48 overflow-y-auto custom-scrollbar">
                                        {newGoal.subGoals.map((subGoal, index) => (
                                            <motion.div
                                                key={index}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-xl mb-2 sm:mb-3"
                                            >
                                                <p className="text-sm sm:text-base text-gray-800 flex-1 truncate">{subGoal.title}</p>
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() =>
                                                        setNewGoal((prev) => ({
                                                            ...prev,
                                                            subGoals: prev.subGoals.filter((_, i) => i !== index),
                                                        }))
                                                    }
                                                    className="p-1 text-red-600 hover:text-red-500"
                                                    aria-label="Remove Sub-Goal"
                                                >
                                                    <X className="w-4 h-4 sm:w-5 h-5" />
                                                </motion.button>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm sm:text-base font-semibold text-gray-800">Goal Type</label>
                                    <select
                                        value={newGoal.type}
                                        onChange={(e) => setNewGoal((prev) => ({ ...prev, type: e.target.value }))}
                                        className="w-full p-2 sm:p-3 border border-gray-200 rounded-xl text-sm sm:text-base focus:ring-2 focus:ring-teal-500"
                                    >
                                        <option value="personal">Personal</option>
                                        <option value="task">Task</option>
                                    </select>
                                </div>
                                {newGoal.type === 'task' && (
                                    <div>
                                        <label className="text-sm sm:text-base font-semibold text-gray-800">Attach Task to Sub-Goals</label>
                                        {newGoal.subGoals.map((subGoal, index) => (
                                            <div key={index} className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                                                <p className="text-sm sm:text-base text-gray-800 flex-1 truncate">{subGoal.title}</p>
                                                <select
                                                    value={subGoal.taskId || ''}
                                                    onChange={(e) => {
                                                        const updatedSubGoals = [...newGoal.subGoals];
                                                        updatedSubGoals[index].taskId = e.target.value || null;
                                                        setNewGoal((prev) => ({ ...prev, subGoals: updatedSubGoals }));
                                                    }}
                                                    className="w-full sm:w-1/2 p-2 sm:p-3 border border-gray-200 rounded-xl text-sm sm:text-base focus:ring-2 focus:ring-teal-500"
                                                >
                                                    <option value="">No Task</option>
                                                    {tasks.map((task) => (
                                                        <option key={task._id} value={task._id}>
                                                            {task.title}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div>
                                    <label className="text-sm sm:text-base font-semibold text-gray-800">Timeframe</label>
                                    <select
                                        value={newGoal.timeframe}
                                        onChange={(e) => {
                                            setNewGoal((prev) => ({ ...prev, timeframe: e.target.value }));
                                            setDefaultDates(e.target.value);
                                        }}
                                        className="w-full p-2 sm:p-3 border border-gray-200 rounded-xl text-sm sm:text-base focus:ring-2 focus:ring-teal-500"
                                    >
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="quarterly">Quarterly</option>
                                        <option value="custom">Custom</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm sm:text-base font-semibold text-gray-800">Start Date</label>
                                    <DatePicker
                                        selected={newGoal.startDate}
                                        onChange={(date) => setNewGoal((prev) => ({ ...prev, startDate: date }))}
                                        dateFormat="MMM d, yyyy"
                                        className="w-full p-2 sm:p-3 border border-gray-200 rounded-xl text-sm sm:text-base focus:ring-2 focus:ring-teal-500"
                                        wrapperClassName="w-full"
                                        minDate={new Date()}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm sm:text-base font-semibold text-gray-800">End Date</label>
                                    <DatePicker
                                        selected={newGoal.endDate}
                                        onChange={(date) => setNewGoal((prev) => ({ ...prev, endDate: date }))}
                                        dateFormat="MMM d, yyyy"
                                        className="w-full p-2 sm:p-3 border border-gray-200 rounded-xl text-sm sm:text-base focus:ring-2 focus:ring-teal-500"
                                        wrapperClassName="w-full"
                                        minDate={newGoal.startDate}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 sm:gap-3 mt-6 sm:mt-8">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowCreateGoal(false)}
                                    className="px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-gray-200 text-gray-800 text-sm sm:text-base font-semibold hover:bg-gray-300 transition-all"
                                    aria-label="Cancel"
                                >
                                    Cancel
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleCreateGoal}
                                    className="px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-teal-600 text-white text-sm sm:text-base font-semibold hover:bg-teal-700 transition-all shadow-md"
                                    aria-label="Create Goal"
                                >
                                    Create Goal
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Goal Details Modal */}
            <AnimatePresence>
                {showGoalDetails && selectedGoal && (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={modalVariants}
                        className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 px-4 sm:px-6"
                        role="dialog"
                        aria-label="Goal Details"
                        ref={modalRef}
                        tabIndex={-1}
                    >
                        <div className="bg-white bg-opacity-95 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 max-w-xs sm:max-w-sm md:max-w-lg w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-4 sm:mb-6">
                                <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-blue-900 truncate">
                                    {isEditing ? 'Edit Goal' : 'Goal Details'}
                                </h2>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => {
                                        setShowGoalDetails(false);
                                        setIsEditing(false);
                                    }}
                                    className="p-1 sm:p-2 text-blue-900 hover:text-teal-600"
                                    aria-label="Close Goal Details"
                                >
                                    <X className="w-5 h-5 sm:w-6 h-6" />
                                </motion.button>
                            </div>
                            {isEditing ? (
                                <div className="space-y-4 sm:space-y-6">
                                    <div>
                                        <label className="text-sm sm:text-base font-semibold text-gray-800">Goal Title</label>
                                        <input
                                            type="text"
                                            value={editGoal.title}
                                            onChange={(e) => setEditGoal((prev) => ({ ...prev, title: e.target.value }))}
                                            className="w-full p-2 sm:p-3 border border-gray-200 rounded-xl text-sm sm:text-base focus:ring-2 focus:ring-teal-500"
                                            placeholder="Enter goal title"
                                            maxLength={100}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm sm:text-base font-semibold text-gray-800">Sub-Goals</label>
                                        <div className="flex gap-2 sm:gap-3">
                                            <input
                                                type="text"
                                                value={newSubGoal}
                                                onChange={(e) => setNewSubGoal(e.target.value)}
                                                className="flex-1 p-2 sm:p-3 border border-gray-200 rounded-xl text-sm sm:text-base focus:ring-2 focus:ring-teal-500"
                                                placeholder="Enter sub-goal"
                                                maxLength={200}
                                            />
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => {
                                                    if (!newSubGoal.trim()) {
                                                        toast.error('Sub-goal title is required.');
                                                        return;
                                                    }
                                                    setEditGoal((prev) => ({
                                                        ...prev,
                                                        subGoals: [
                                                            ...prev.subGoals,
                                                            { title: newSubGoal, completed: false, taskId: null },
                                                        ],
                                                    }));
                                                    setNewSubGoal('');
                                                }}
                                                className="p-2 sm:p-3 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition-all shadow-md"
                                                aria-label="Add Sub-Goal"
                                            >
                                                <Plus className="w-4 h-4 sm:w-5 h-5" />
                                            </motion.button>
                                        </div>
                                        <div className="mt-2 sm:mt-3 max-h-32 sm:max-h-48 overflow-y-auto custom-scrollbar">
                                            {editGoal.subGoals.map((subGoal, index) => (
                                                <motion.div
                                                    key={index}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-xl mb-2 sm:mb-3"
                                                >
                                                    <p className="text-sm sm:text-base text-gray-800 flex-1 truncate">{subGoal.title}</p>
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() =>
                                                            setEditGoal((prev) => ({
                                                                ...prev,
                                                                subGoals: prev.subGoals.filter((_, i) => i !== index),
                                                            }))
                                                        }
                                                        className="p-1 text-red-600 hover:text-red-500"
                                                        aria-label="Remove Sub-Goal"
                                                    >
                                                        <X className="w-4 h-4 sm:w-5 h-5" />
                                                    </motion.button>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm sm:text-base font-semibold text-gray-800">Goal Type</label>
                                        <select
                                            value={editGoal.type}
                                            onChange={(e) => setEditGoal((prev) => ({ ...prev, type: e.target.value }))}
                                            className="w-full p-2 sm:p-3 border border-gray-200 rounded-xl text-sm sm:text-base focus:ring-2 focus:ring-teal-500"
                                        >
                                            <option value="personal">Personal</option>
                                            <option value="task">Task</option>
                                        </select>
                                    </div>
                                    {editGoal.type === 'task' && (
                                        <div>
                                            <label className="text-sm sm:text-base font-semibold text-gray-800">Attach Task to Sub-Goals</label>
                                            {editGoal.subGoals.map((subGoal, index) => (
                                                <div key={index} className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                                                    <p className="text-sm sm:text-base text-gray-800 flex-1 truncate">{subGoal.title}</p>
                                                    <select
                                                        value={subGoal.taskId || ''}
                                                        onChange={(e) => {
                                                            const updatedSubGoals = [...editGoal.subGoals];
                                                            updatedSubGoals[index].taskId = e.target.value || null;
                                                            setEditGoal((prev) => ({ ...prev, subGoals: updatedSubGoals }));
                                                        }}
                                                        className="w-full sm:w-1/2 p-2 sm:p-3 border border-gray-200 rounded-xl text-sm sm:text-base focus:ring-2 focus:ring-teal-500"
                                                    >
                                                        <option value="">No Task</option>
                                                        {tasks.map((task) => (
                                                            <option key={task._id} value={task._id}>
                                                                {task.title}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div>
                                        <label className="text-sm sm:text-base font-semibold text-gray-800">Timeframe</label>
                                        <select
                                            value={editGoal.timeframe}
                                            onChange={(e) => setEditGoal((prev) => ({ ...prev, timeframe: e.target.value }))}
                                            className="w-full p-2 sm:p-3 border border-gray-200 rounded-xl text-sm sm:text-base focus:ring-2 focus:ring-teal-500"
                                        >
                                            <option value="daily">Daily</option>
                                            <option value="weekly">Weekly</option>
                                            <option value="monthly">Monthly</option>
                                            <option value="quarterly">Quarterly</option>
                                            <option value="custom">Custom</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm sm:text-base font-semibold text-gray-800">Start Date</label>
                                        <DatePicker
                                            selected={editGoal.startDate}
                                            onChange={(date) => setEditGoal((prev) => ({ ...prev, startDate: date }))}
                                            dateFormat="MMM d, yyyy"
                                            className="w-full p-2 sm:p-3 border border-gray-200 rounded-xl text-sm sm:text-base focus:ring-2 focus:ring-teal-500"
                                            wrapperClassName="w-full"
                                            minDate={new Date()}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm sm:text-base font-semibold text-gray-800">End Date</label>
                                        <DatePicker
                                            selected={editGoal.endDate}
                                            onChange={(date) => setEditGoal((prev) => ({ ...prev, endDate: date }))}
                                            dateFormat="MMM d, yyyy"
                                            className="w-full p-2 sm:p-3 border border-gray-200 rounded-xl text-sm sm:text-base focus:ring-2 focus:ring-teal-500"
                                            wrapperClassName="w-full"
                                            minDate={editGoal.startDate}
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2 sm:gap-3 mt-6 sm:mt-8">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setIsEditing(false)}
                                            className="px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-gray-200 text-gray-800 text-sm sm:text-base font-semibold hover:bg-gray-300 transition-all"
                                            aria-label="Cancel"
                                        >
                                            Cancel
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handleUpdateGoal}
                                            className="px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-teal-600 text-white text-sm sm:text-base font-semibold hover:bg-teal-700 transition-all shadow-md"
                                            aria-label="Save Goal"
                                        >
                                            Save Goal
                                        </motion.button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 sm:space-y-6">
                                    <div>
                                        <p className="text-sm sm:text-base font-semibold text-gray-800">Goal Title</p>
                                        <p className="text-base sm:text-lg text-gray-600 truncate">{selectedGoal.title}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm sm:text-base font-semibold text-gray-800">Sub-Goals</p>
                                        <div className="max-h-32 sm:max-h-48 overflow-y-auto custom-scrollbar">
                                            {selectedGoal.subGoals.map((subGoal, index) => (
                                                <div key={index} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-xl mb-2 sm:mb-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={subGoal.completed}
                                                        onChange={(e) => handleUpdateSubGoalStatus(index, e.target.checked)}
                                                        className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600 focus:ring-teal-500 flex-shrink-0"
                                                    />
                                                    <p className="text-sm sm:text-base text-gray-600 flex-1 truncate">
                                                        {subGoal.title}
                                                        {subGoal.taskId && (
                                                            <span className="text-xs sm:text-sm text-gray-400">
                                                                {' '}
                                                                (Task: {tasks.find((t) => t._id === subGoal.taskId)?.title || 'Not found'})
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm sm:text-base font-semibold text-gray-800">Progress</p>
                                        <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
                                            <motion.div
                                                className="bg-teal-600 h-2 sm:h-3 rounded-full"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${calculateProgress(selectedGoal.subGoals)}%` }}
                                                transition={{ duration: 0.5 }}
                                            />
                                        </div>
                                        <p className="text-sm sm:text-base text-gray-600 mt-1">{calculateProgress(selectedGoal.subGoals)}%</p>
                                        {calculateProgress(selectedGoal.subGoals) === 100 && (
                                            <p className="text-sm sm:text-base text-teal-600 font-semibold mt-1 line-clamp-1">Goal Completed!</p>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm sm:text-base font-semibold text-gray-800">Type</p>
                                        <p className="text-sm sm:text-base text-gray-600 capitalize line-clamp-1">{selectedGoal.type}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm sm:text-base font-semibold text-gray-800">Timeframe</p>
                                        <p className="text-sm sm:text-base text-gray-600 capitalize line-clamp-1">{selectedGoal.timeframe}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm sm:text-base font-semibold text-gray-800">Duration</p>
                                        <p className="text-sm sm:text-base text-gray-600 line-clamp-1">
                                            {moment(selectedGoal.startDate).tz('Africa/Lagos').format('MMM D, YYYY')} -{' '}
                                            {moment(selectedGoal.endDate).tz('Africa/Lagos').format('MMM D, YYYY')}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap justify-end gap-2 sm:gap-3 mt-6 sm:mt-8">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setIsEditing(true)}
                                            className="px-4 sm:px-5 py-2 sm:py-3 rounded-full bg-blue-600 text-white text-sm sm:text-base font-semibold hover:bg-blue-700 transition-all flex items-center gap-2 sm:gap-3 shadow-md"
                                            aria-label="Edit Goal"
                                        >
                                            <Edit className="w-4 h-4 sm:w-5 h-5" />
                                            Edit
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handleUpdateGoal}
                                            className="px-4 sm:px-5 py-2 sm:py-3 rounded-full bg-teal-600 text-white text-sm sm:text-base font-semibold hover:bg-teal-700 transition-all flex items-center gap-2 sm:gap-3 shadow-md"
                                            aria-label="Update Progress"
                                        >
                                            <CheckCircle className="w-4 h-4 sm:w-5 h-5" />
                                            Update
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handleDeleteGoal}
                                            className="px-4 sm:px-5 py-2 sm:py-3 rounded-full bg-red-600 text-white text-sm sm:text-base font-semibold hover:bg-red-500 transition-all flex items-center gap-2 sm:gap-3 shadow-md"
                                            aria-label="Delete Goal"
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

export default Goals;