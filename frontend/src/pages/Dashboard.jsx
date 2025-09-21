import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { Star, Flag, CircleDot, Clock, Filter, Plus, Rocket, Search, ArrowUpDown, PieChart, CircleCheck, Layers, CheckCircle, Pen, Trash2 } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import TaskItem from '../components/TaskItem';
import axios from 'axios';
import TaskModal from '../components/TaskModal';
import io from 'socket.io-client';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/tasks`;
const USER_API_URL = import.meta.env.VITE_USER_API_URL || 'http://localhost:4001';

const TaskActionModal = ({ isOpen, onClose, onAction }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-300 px-4">
            <div className="bg-white/95 backdrop-blur-lg rounded-xl p-4 sm:p-6 w-full max-w-xs sm:max-w-sm md:max-w-md border border-teal-200/50 shadow-xl">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 truncate">Task Actions</h3>
                <div className="space-y-2 sm:space-y-3">
                    <button
                        onClick={() => onAction('complete')}
                        className="w-full flex items-center gap-2 sm:gap-3 bg-teal-100/50 text-teal-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-teal-200/70 transition-all duration-200 text-sm sm:text-base"
                    >
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" /> Mark as Done
                    </button>
                    <button
                        onClick={() => onAction('edit')}
                        className="w-full flex items-center gap-2 sm:gap-3 bg-blue-100/50 text-blue-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-blue-200/70 transition-all duration-200 text-sm sm:text-base"
                    >
                        <Pen className="w-4 h-4 sm:w-5 sm:h-5" /> Edit Task
                    </button>
                    <button
                        onClick={() => onAction('delete')}
                        className="w-full flex items-center gap-2 sm:gap-3 bg-red-100/50 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-red-200/70 transition-all duration-200 text-sm sm:text-base"
                    >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" /> Delete Task
                    </button>
                </div>
                <button
                    onClick={onClose}
                    className="mt-3 sm:mt-4 w-full text-gray-600 px-3 sm:px-4 py-2 rounded text-xs sm:text-sm hover:bg-gray-100 transition-all duration-200"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

const DeleteConfirmationModal = ({ isOpen, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200 px-4">
            <div className="bg-white/95 backdrop-blur-lg rounded-xl p-4 sm:p-6 w-full max-w-xs sm:max-w-sm border border-gray-200/50 shadow-lg">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 truncate">Delete Task?</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 line-clamp-3">Are you sure you want to delete this task? This action cannot be undone.</p>
                <div className="flex gap-2">
                    <button
                        onClick={onConfirm}
                        className="flex-1 bg-red-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-red-600 transition-all duration-200 text-xs sm:text-sm"
                    >
                        Yes
                    </button>
                    <button
                        onClick={onCancel}
                        className="flex-1 bg-gray-100 text-gray-700 px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-200 transition-all duration-200 text-xs sm:text-sm"
                    >
                        No
                    </button>
                </div>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const { user, tasks, fetchTasks: refreshTasks, onLogout } = useOutletContext();
    const [showModal, setShowModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showActionModal, setShowActionModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('dueDate');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [localTasks, setLocalTasks] = useState(tasks);

    // Socket.IO setup
    useEffect(() => {
        const socket = io(USER_API_URL, {
            auth: { token: localStorage.getItem('token') },
        });

        socket.on('connect', () => console.log('User socket connected:', socket.id));
        socket.on('newTask', (task) => {
            if (task.owner?._id === user?.id) {
                setLocalTasks((prev) => [...prev, task]);
            }
        });
        socket.on('updateTask', (updatedTask) => {
            if (updatedTask.owner?._id === user?.id) {
                setLocalTasks((prev) =>
                    prev.map((task) => (task._id === updatedTask._id ? updatedTask : task))
                );
            } else {
                setLocalTasks((prev) => prev.filter((task) => task._id !== updatedTask._id));
            }
        });
        socket.on('deleteTask', (taskId) => {
            setLocalTasks((prev) => prev.filter((task) => task._id !== taskId));
        });

        socket.on('connect_error', (err) => {
            console.error('User socket connection error:', err.message);
        });

        return () => {
            socket.disconnect();
            console.log('User socket disconnected');
        };
    }, [user?.id]);

    // Sync local tasks with context tasks
    useEffect(() => {
        setLocalTasks(tasks);
    }, [tasks]);

    // Live Clock for WAT (UTC+1)
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Stats
    const stats = useMemo(() => ({
        total: localTasks.length,
        completed: localTasks.filter(t => t.completed === true || t.completed === 1 || (typeof t.completed === 'string' && t.completed.toLowerCase() === 'yes')).length,
        highPriority: localTasks.filter(t => t.priority?.toLowerCase() === 'high').length,
        mediumPriority: localTasks.filter(t => t.priority?.toLowerCase() === 'medium').length,
    }), [localTasks]);

    // Filtered and Sorted Tasks
    const filteredTasks = useMemo(() => {
        let filtered = localTasks.filter(task => {
            if (!task || !task.title) return false;
            const dueDate = task.dueDate ? new Date(task.dueDate) : null;
            const today = new Date();
            const nextWeek = new Date(today);
            nextWeek.setDate(today.getDate() + 7);
            const searchLower = search.toLowerCase();
            const matchesSearch = task.title.toLowerCase().includes(searchLower) || (task.description || '').toLowerCase().includes(searchLower);
            switch (filter) {
                case 'today':
                    return dueDate && dueDate.toDateString() === today.toDateString() && matchesSearch;
                case 'week':
                    return dueDate && dueDate >= today && dueDate <= nextWeek && matchesSearch;
                case 'high':
                case 'medium':
                case 'low':
                    return task.priority?.toLowerCase() === filter && matchesSearch;
                default:
                    return matchesSearch;
            }
        });

        return filtered.sort((a, b) => {
            if (sort === 'dueDate') {
                const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
                const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
                return dateA - dateB;
            } else if (sort === 'priority') {
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                return (priorityOrder[b.priority?.toLowerCase()] || 0) - (priorityOrder[a.priority?.toLowerCase()] || 0);
            } else if (sort === 'title') {
                return a.title.localeCompare(b.title);
            }
            return 0;
        });
    }, [localTasks, filter, search, sort]);

    // API Helpers
    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No auth token found');
        return { Authorization: `Bearer ${token}` };
    };

    // Handle Task Completion
    const handleComplete = async (task) => {
        try {
            const headers = getAuthHeaders();
            await axios.put(`${API_BASE_URL}/${task._id}/gp`, { completed: 'Yes' }, { headers });
            await refreshTasks();
            setShowActionModal(false);
            setSelectedTask(null);
        } catch (error) {
            console.error('Error marking task as done:', error.response?.data || error.message);
            if (error.response?.status === 401) onLogout?.();
        }
    };

    // Handle Task Deletion
    const handleDelete = async () => {
        try {
            const headers = getAuthHeaders();
            await axios.delete(`${API_BASE_URL}/${selectedTask._id}/gp`, { headers });
            await refreshTasks();
            setShowDeleteConfirm(false);
            setShowActionModal(false);
            setSelectedTask(null);
        } catch (error) {
            console.error('Error deleting task:', error.response?.data || error.message);
            if (error.response?.status === 401) onLogout?.();
        }
    };

    // Handle Task Save (Modal)
    const handleTaskSave = useCallback(
        async (taskData) => {
            try {
                const token = localStorage.getItem("token");
                if (!token) throw new Error("No authentication token found");

                // Filter and validate fields
                const payload = {
                    title: taskData.title?.trim() || "",
                    description: taskData.description || "",
                    priority: taskData.priority || "Low",
                    dueDate: taskData.dueDate || undefined,
                    completed: taskData.completed === "Yes" || taskData.completed === true,
                };

                if (!payload.title) {
                    console.error("Task title is required");
                    return;
                }

                if (taskData._id) {
                    await axios.put(`${API_BASE_URL}/${taskData._id}/gp`, payload, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                } else {
                    await axios.post(
                        `${API_BASE_URL}/gp`,
                        { ...payload, userId: user?.id || null },
                        {
                            headers: { Authorization: `Bearer ${token}` },
                        }
                    );
                }

                await refreshTasks();
                setShowModal(false);
                setSelectedTask(null);
            } catch (error) {
                console.error("Error saving task:", error.response?.data || error.message);
                if (error.response?.status === 401) onLogout?.();
            }
        },
        [refreshTasks, user, onLogout]
    );

    // Handle Task Action Selection
    const handleAction = (action) => {
        if (action === 'complete') {
            handleComplete(selectedTask);
        } else if (action === 'edit') {
            setShowActionModal(false);
            setShowModal(true);
        } else if (action === 'delete') {
            setShowDeleteConfirm(true);
        }
    };

    const FILTER_LABELS = {
        all: 'All',
        today: 'Today',
        week: 'Week',
        high: 'High',
        medium: 'Medium',
        low: 'Low',
    };

    const FILTER_OPTIONS = ['all', 'today', 'week', 'high', 'medium', 'low'];

    const SORT_OPTIONS = [
        { value: 'dueDate', label: 'Due Date', icon: Clock },
        { value: 'priority', label: 'Priority', icon: Flag },
        { value: 'title', label: 'Title', icon: CircleDot },
    ];

    const STATS = [
        { key: 'total', label: 'Total', icon: Rocket, color: 'bg-teal-500/15 text-teal-600', valueKey: 'total', textColor: 'text-teal-700' },
        { key: 'completed', label: 'Done', icon: CircleCheck, color: 'bg-blue-500/15 text-blue-600', valueKey: 'completed', textColor: 'text-blue-700' },
        { key: 'highPriority', label: 'High', icon: Flag, color: 'bg-red-500/15 text-red-600', valueKey: 'highPriority', textColor: 'text-red-700' },
        { key: 'mediumPriority', label: 'Medium', icon: Flag, color: 'bg-blue-500/15 text-blue-800', valueKey: 'mediumPriority', textColor: 'text-blue-900' },
    ];

    return (
        <div className="relative min-h-screen bg-gradient-to-br from-teal-100 via-blue-100 to-teal-200">
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.3)_0%,rgba(59,130,246,0.25)_50%,transparent_70%)] animate-pulse-slow" />
                {[...Array(8)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute rounded-full bg-teal-400/25 blur-lg animate-float"
                        style={{
                            width: `${Math.random() * 8 + 4}px`,
                            height: `${Math.random() * 8 + 4}px`,
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${Math.random() * 6 + 8}s`,
                        }}
                    />
                ))}
            </div>

            {/* Header */}
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-teal-300/50 px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 shadow-sm">
                <div className="flex items-center gap-2 sm:gap-3">
                    <Star className="w-6 h-6 sm:w-7 h-7 md:w-8 h-8 text-teal-600 animate-spin-slow flex-shrink-0" />
                    <div className="min-w-0">
                        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 tracking-tight truncate">Task Board</h1>
                        <p className="text-xs sm:text-sm text-teal-600 tracking-tight line-clamp-1">Your Productivity Hub</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                    <button
                        onClick={() => { setSelectedTask(null); setShowModal(true); }}
                        className="sm:hidden bg-white/95 text-teal-700 border border-teal-300/50 rounded-lg px-3 py-2 text-xs font-semibold hover:bg-teal-50 transition-all duration-300 shadow-sm hover:shadow-md flex items-center gap-1"
                    >
                        <Plus className="w-4 h-4" /> Task
                    </button>
                    <button
                        onClick={() => { setSelectedTask(null); setShowModal(true); }}
                        className="hidden sm:flex bg-white/95 text-teal-700 border border-teal-300/50 rounded-lg px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-semibold hover:bg-teal-50 transition-all duration-300 shadow-sm hover:shadow-md flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4 sm:w-5 h-5" /> Add Task
                    </button>
                    <div className="bg-white/95 border border-teal-300/50 rounded-lg px-3 sm:px-4 py-2 text-gray-800 text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        <Clock className="w-4 h-4 sm:w-5 h-5 text-teal-600 animate-pulse flex-shrink-0" />
                        <span className="truncate">{currentTime.toLocaleTimeString('en-US', { hour12: true })}</span>
                    </div>
                    <img
                        src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}`}
                        alt="User Avatar"
                        className="w-8 h-8 sm:w-9 h-9 md:w-10 h-10 rounded-full border-2 border-teal-400/50 hover:shadow-sm transition-all duration-200 flex-shrink-0"
                    />
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 px-3 sm:px-4 md:px-6 py-4 sm:py-6 max-w-[90rem] mx-auto space-y-4 sm:space-y-6">
                {/* Stats Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {STATS.map(({ key, label, icon: Icon, color, valueKey, textColor }) => (
                        <div
                            key={key}
                            className="bg-white/95 backdrop-blur-md border border-teal-200/50 rounded-xl p-3 sm:p-4 md:p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                        >
                            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                                {key === 'completed' ? (
                                    <div className="relative w-10 h-10 sm:w-12 h-12 flex-shrink-0">
                                        <svg className="w-full h-full" viewBox="0 0 36 36">
                                            <path
                                                d="M18 2 a 16 16 0 0 1 0 32 a 16 16 0 0 1 0 -32"
                                                fill="none"
                                                stroke="#E6FFFA"
                                                strokeWidth="4"
                                            />
                                            <path
                                                d="M18 2 a 16 16 0 0 1 0 32 a 16 16 0 0 1 0 -32"
                                                fill="none"
                                                stroke="#14B8A6"
                                                strokeWidth="4"
                                                strokeDasharray={`${(stats.completed / stats.total) * 100 || 0}, 100`}
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <PieChart className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 h-6 text-teal-600" />
                                    </div>
                                ) : (
                                    <div className={`p-2 sm:p-3 rounded-lg ${color} flex-shrink-0`}>
                                        <Icon className="w-5 h-5 sm:w-6 h-6" />
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <p className={`text-lg sm:text-xl md:text-2xl font-bold ${textColor} truncate`}>{stats[valueKey]}</p>
                                    <p className="text-xs sm:text-sm text-gray-600 tracking-tight truncate">{label}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Search and Sort */}
                <div className="bg-white/95 backdrop-blur-md border border-teal-200/50 rounded-xl p-3 sm:p-4 md:p-5 shadow-sm flex flex-col gap-3 sm:gap-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 w-full">
                            <Search className="w-5 h-5 sm:w-6 h-6 text-teal-600 flex-shrink-0" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search tasks..."
                                className="bg-white border border-teal-300/50 rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-800 focus:ring-2 focus:ring-teal-400 w-full transition-all duration-300"
                            />
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                            <ArrowUpDown className="w-5 h-5 sm:w-6 h-6 text-teal-600 flex-shrink-0" />
                            <select
                                value={sort}
                                onChange={(e) => setSort(e.target.value)}
                                className="bg-white border border-teal-300/50 rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base text-teal-800 focus:ring-2 focus:ring-teal-400 transition-all duration-300 w-full sm:w-40"
                            >
                                {SORT_OPTIONS.map(({ value, label }) => (
                                    <option key={value} value={value} className="text-teal-800">
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white/95 backdrop-blur-md border border-teal-200/50 rounded-xl p-3 sm:p-4 md:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Filter className="w-5 h-5 sm:w-6 h-6 text-teal-600 flex-shrink-0" />
                        <span className="text-base sm:text-lg font-semibold text-gray-900 tracking-tight truncate">{FILTER_LABELS[filter]}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="lg:hidden bg-white border border-teal-300/50 rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base text-teal-800 focus:ring-2 focus:ring-teal-400 transition-all duration-300 w-full"
                        >
                            {FILTER_OPTIONS.map(opt => (
                                <option key={opt} value={opt} className="text-teal-800">
                                    {FILTER_LABELS[opt]}
                                </option>
                            ))}
                        </select>
                        <div className="hidden lg:flex flex-wrap gap-1 sm:gap-2 bg-teal-100/50 p-1 rounded-lg">
                            {FILTER_OPTIONS.map(opt => (
                                <button
                                    key={opt}
                                    onClick={() => setFilter(opt)}
                                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm sm:text-base font-semibold transition-all duration-300 hover:scale-105 truncate ${filter === opt
                                        ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white shadow-md'
                                        : 'text-teal-700 hover:bg-teal-200/50'
                                        }`}
                                    title={FILTER_LABELS[opt]}
                                >
                                    {FILTER_LABELS[opt]}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Task List with Dual-Column Stacked Cards */}
                <div className="bg-white/95 backdrop-blur-md border border-teal-200/50 rounded-2xl p-4 sm:p-5 md:p-6 shadow-sm overflow-hidden">
                    <div className="max-h-[calc(100vh-16rem)] sm:max-h-[calc(100vh-20rem)] overflow-y-auto pr-2 sm:pr-3 custom-scrollbar">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4">
                            {filteredTasks.length === 0 ? (
                                <div className="col-span-full bg-white/95 backdrop-blur-md border border-teal-200/50 rounded-2xl p-6 sm:p-8 md:p-10 text-center shadow-md animate-in fade-in duration-600">
                                    <div className="w-16 h-16 sm:w-20 h-20 md:w-24 h-24 bg-teal-100/50 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                                        <Layers className="w-8 h-8 sm:w-10 h-10 md:w-12 h-12 text-teal-600" />
                                    </div>
                                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 tracking-tight truncate">No Tasks Found</h3>
                                    <p className="text-sm sm:text-base text-teal-600 mb-6 sm:mb-8 leading-relaxed line-clamp-2">
                                        {filter === 'all' && !search ? 'Start your productivity journey with a new task!' : 'No tasks match your current filters.'}
                                    </p>
                                    <button
                                        onClick={() => { setSelectedTask(null); setShowModal(true); }}
                                        className="bg-gradient-to-r from-teal-500 to-blue-500 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg flex items-center gap-2 sm:gap-3 mx-auto hover:from-teal-600 hover:to-blue-600 transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg text-sm sm:text-base"
                                    >
                                        <Plus className="w-5 h-5 sm:w-6 h-6" /> Create New Task
                                    </button>
                                </div>
                            ) : (
                                filteredTasks.map((task, index) => (
                                    <div
                                        key={task._id || task.id}
                                        className={`relative bg-white/95 backdrop-blur-md border rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-in slide-in-from-bottom-10 duration-600 cursor-pointer ${task.priority?.toLowerCase() === 'high' ? 'border-red-300/50' :
                                            task.priority?.toLowerCase() === 'medium' ? 'border-yellow-300/50' :
                                                task.priority?.toLowerCase() === 'low' ? 'border-teal-300/50' : 'border-teal-200/50'
                                            }`}
                                        style={{ animationDelay: `${index * 0.1}s` }}
                                        onClick={() => { setSelectedTask(task); setShowActionModal(true); }}
                                    >
                                        {/* Priority Indicator */}
                                        <div
                                            className={`absolute -top-2 -left-2 w-4 h-4 sm:w-5 h-5 rounded-full ${task.priority?.toLowerCase() === 'high' ? 'bg-red-500' :
                                                task.priority?.toLowerCase() === 'medium' ? 'bg-yellow-500' :
                                                    task.priority?.toLowerCase() === 'low' ? 'bg-teal-500' : 'bg-gray-400'
                                                } animate-pulse-slow shadow-md`}
                                        />
                                        {/* Task Content */}
                                        <div className="p-4 sm:p-5 md:p-6">
                                            <TaskItem
                                                task={task}
                                                onRefresh={refreshTasks}
                                                showCompleteCheckbox
                                                onAction={() => { setSelectedTask(task); setShowActionModal(true); }}
                                                onLogout={onLogout}
                                            />
                                        </div>
                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-blue-500/10 opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                                        {/* Hover Full Task Details */}
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 z-10 overflow-hidden">
                                            <div className="bg-white/95 backdrop-blur-md p-4 rounded-lg shadow-lg max-w-[90%] max-h-[90%] overflow-y-auto text-gray-900">
                                                <h3 className="text-lg font-bold mb-2">{task.title}</h3>
                                                <p className="text-sm whitespace-pre-wrap">{task.description || 'No description provided.'}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
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
                </div>

                {/* Floating Add Button */}
                <button
                    onClick={() => { setSelectedTask(null); setShowModal(true); }}
                    className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 bg-gradient-to-r from-teal-500 to-blue-500 text-white p-3 sm:p-4 md:p-5 rounded-full shadow-md hover:from-teal-600 hover:to-blue-600 transition-all duration-300 hover:scale-110 animate-pulse z-30"
                    title="Add New Task"
                >
                    <Plus className="w-5 h-5 sm:w-6 h-6 md:w-7 h-7" />
                </button>

                {/* Task Modal */}
                <TaskModal
                    isOpen={showModal}
                    onClose={() => { setShowModal(false); setSelectedTask(null); }}
                    taskToEdit={selectedTask}
                    onSave={handleTaskSave}
                    onLogout={onLogout}
                />

                {/* Action Prompt Modal */}
                <TaskActionModal
                    isOpen={showActionModal}
                    onClose={() => { setShowActionModal(false); setSelectedTask(null); }}
                    onAction={handleAction}
                />

                {/* Delete Confirmation Modal */}
                <DeleteConfirmationModal
                    isOpen={showDeleteConfirm}
                    onConfirm={handleDelete}
                    onCancel={() => setShowDeleteConfirm(false)}
                />
            </div>
        </div>
    );
};

export default Dashboard;