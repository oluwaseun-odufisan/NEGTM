import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { Clock, TrendingUp, Circle, Zap, Sparkles, Activity, MessageCircle, ChevronDown, X, Trash2, StickyNote, Minus } from 'lucide-react';
import axios from 'axios';
import { Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Layout = ({ onLogout, user }) => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [isLogExpanded, setIsLogExpanded] = useState(false);
    const [isNoteOpen, setIsNoteOpen] = useState(false);
    const [noteContent, setNoteContent] = useState('');
    const chatContainerRef = useRef(null);
    const chatInputRef = useRef(null);
    const noteModalRef = useRef(null);
    const navigate = useNavigate();

    const fetchTasks = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('No auth token found');
            const { data } = await axios.get('http://localhost:4000/api/tasks/gp', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const arr = Array.isArray(data)
                ? data
                : Array.isArray(data?.tasks)
                    ? data?.tasks
                    : Array.isArray(data?.data)
                        ? data?.data
                        : [];
            setTasks(arr);
            return true; // Indicate success
        } catch (err) {
            console.error('Task fetch error:', err);
            setError(err.message || 'Could not load tasks.');
            if (err.response?.status === 401) {
                onLogout();
            }
            return false;
        } finally {
            setLoading(false);
        }
    }, [onLogout]);

    const fetchChatHistory = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('No auth token found');
            const { data } = await axios.get('http://localhost:4000/api/bot/chat/history', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (data.success) {
                setChatMessages(data.messages || []);
            } else {
                console.error('Chat history error:', data.message);
            }
        } catch (err) {
            console.error('Chat history fetch error:', err.message);
        }
    }, []);

    const handleChatSubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission
        if (!chatInput.trim() || isChatLoading) {
            return;
        }

        const userMessage = { text: chatInput, sender: 'user', timestamp: new Date().toISOString() };
        setChatMessages((prev) => [...prev, userMessage]);
        setChatInput('');
        setIsChatLoading(true);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No auth token found');
            }
            const { data } = await axios.post(
                'http://localhost:4000/api/bot/chat',
                { message: chatInput },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (data.success) {
                setChatMessages((prev) => [...prev, ...data.messages.filter((msg) => msg.sender === 'bot')]);
                // Only fetch tasks if the bot response indicates a task-related action
                if (data.messages.some((msg) => msg.text.includes('created') || msg.text.includes('updated') || msg.text.includes('deleted'))) {
                    await fetchTasks();
                }
            } else {
                throw new Error(data.message || 'Chat request failed');
            }
        } catch (err) {
            console.error('Chat submit error:', err.message);
            const errorMessage = {
                text: err.message.includes('401')
                    ? 'Authentication failed. Please log in again.'
                    : 'Sorry, I couldn’t respond. Please try again.',
                sender: 'bot',
                timestamp: new Date().toISOString(),
            };
            setChatMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsChatLoading(false);
            if (chatInputRef.current) {
                chatInputRef.current.focus();
            }
        }
    };

    const clearChatInput = () => {
        setChatInput('');
        if (chatInputRef.current) {
            chatInputRef.current.focus();
        }
    };

    const clearChatMessages = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('No auth token found');
            await axios.delete('http://localhost:4000/api/bot/chat', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setChatMessages([]);
        } catch (err) {
            console.error('Clear chat error:', err.message);
        }
    }, []);

    const toggleChat = () => {
        setIsChatOpen((prev) => {
            if (!prev) {
                fetchChatHistory();
                setTimeout(() => {
                    if (chatInputRef.current) {
                        chatInputRef.current.focus();
                    }
                }, 100);
            }
            return !prev;
        });
    };

    const toggleLog = () => {
        setIsLogExpanded((prev) => !prev);
    };

    const toggleNote = () => {
        setIsNoteOpen((prev) => !prev);
    };

    const clearNote = () => {
        setNoteContent('');
    };

    const handleBackdropClick = (e) => {
        if (noteModalRef.current && !noteModalRef.current.contains(e.target)) {
            setIsNoteOpen(false);
        }
    };

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isNoteOpen) {
                setIsNoteOpen(false);
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isNoteOpen]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    useEffect(() => {
        if (isChatOpen && chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatMessages, isChatOpen]);

    // Debug reloads
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            console.log('Page is about to reload or navigate');
            // Optionally prevent reload for debugging
            // e.preventDefault();
            // e.returnValue = '';
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    const stats = useMemo(() => {
        const completedTasks = tasks.filter((task) =>
            task.completed === true ||
            task.completed === 1 ||
            (typeof task.completed === 'string' && task.completed.toLowerCase() === 'true')
        ).length;

        const totalCount = tasks.length;
        const pendingCount = totalCount - completedTasks;
        const completionPercentage = totalCount ? Math.round((completedTasks / totalCount) * 100) : 0;

        return {
            totalCount,
            completedTasks,
            pendingCount,
            completionPercentage,
        };
    }, [tasks]);

    const aiSuggestions = useMemo(() => {
        const suggestions = [];
        const now = new Date();
        const overdueTasks = tasks.filter((task) => task.dueDate && !task.completed && new Date(task.dueDate) < now);
        if (overdueTasks.length > 0) {
            suggestions.push(`Address ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}, e.g., "${overdueTasks[0]?.title || 'task'}".`);
        }
        const highPriorityTasks = tasks.filter((task) => !task.completed && task.priority?.toLowerCase() === 'high');
        if (highPriorityTasks.length > 0) {
            suggestions.push(`Prioritize ${highPriorityTasks.length} high-priority task${highPriorityTasks.length > 1 ? 's' : ''}, starting with "${highPriorityTasks[0]?.title || 'task'}".`);
        }
        if (stats.completionPercentage < 50 && stats.pendingCount > 0) {
            suggestions.push(`Boost your ${stats.completionPercentage}% completion rate by tackling ${stats.pendingCount} pending task${stats.pendingCount > 1 ? 's' : ''}.`);
        }
        if (tasks.length === 0) {
            suggestions.push('Add new tasks to stay productive!');
        }
        return suggestions.slice(0, 3);
    }, [tasks, stats]);

    const StatCard = ({ title, value, icon, gradientFrom, gradientTo }) => (
        <div className="relative p-3 rounded-xl bg-white/95 backdrop-blur-lg border border-teal-100/50 hover:shadow-lg transition-all duration-300 group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-50 to-teal-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative flex items-center gap-2">
                <div className={`p-2 rounded-full bg-gradient-to-br ${gradientFrom} ${gradientTo} group-hover:scale-110 transition-transform duration-200`}>
                    {icon}
                </div>
                <div className="min-w-0">
                    <p className="text-base sm:text-lg font-bold bg-gradient-to-r from-teal-500 to-blue-600 bg-clip-text text-transparent">
                        {value}
                    </p>
                    <p className="text-2xs sm:text-xs text-gray-600 font-medium">{title}</p>
                </div>
            </div>
        </div>
    );

    if (loading) return (
        <div className="h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-teal-400 flex items-center justify-center">
            <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-teal-500" />
                <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-teal-400 animate-pulse" />
            </div>
        </div>
    );

    if (error) return (
        <div className="h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-teal-400 flex items-center justify-center p-4">
            <div className="relative bg-white/95 backdrop-blur-lg text-red-600 p-6 rounded-xl border border-red-200 max-w-md shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-r from-red-50/20 to-transparent animate-pulse" />
                <p className="relative text-lg font-semibold mb-2 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-red-600" /> Error
                </p>
                <p className="text-sm text-gray-600">{error}</p>
                <button
                    onClick={fetchTasks}
                    className="mt-4 px-6 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors duration-200"
                >
                    Retry
                </button>
            </div>
        </div>
    );

    return (
        <div className="h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-teal-400 overflow-hidden relative">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute w-72 h-72 top-0 left-0 bg-teal-200/30 rounded-full filter blur-4xl animate-pulse-slow" />
                <div className="absolute w-72 h-72 bottom-0 right-0 bg-blue-200/30 rounded-full filter blur-4xl animate-pulse-slow-delayed" />
            </div>

            <Navbar user={user} onLogout={onLogout} />
            <Sidebar user={user} tasks={tasks} />

            <div className="ml-0 xl:ml-65 lg:ml-55 md:ml-20 pt-16 p-6 sm:p-8 md:p-10 transition-all duration-300 relative z-10">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
                    <div className="xl:col-span-2 space-y-6">
                        <Outlet context={{ user, tasks, fetchTasks }} />
                    </div>

                    <div className="space-y-5">
                        {/* Metrics */}
                        <div className="relative bg-white/95 backdrop-blur-lg rounded-xl p-5 shadow-lg border border-teal-100/20 hover:shadow-xl transition-all duration-200">
                            <div className="absolute inset-0 bg-gradient-to-br from-teal-50/20 to-blue-50/20 opacity-50 rounded-xl" />
                            <div className="relative">
                                <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2 mb-5">
                                    <TrendingUp className="w-5 h-5 text-teal-500 animate-pulse" />
                                    Metrics
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <StatCard
                                        title="Total Tasks"
                                        value={stats.totalCount}
                                        icon={<Circle className="w-4 h-4 text-teal-500" />}
                                        gradientFrom="from-teal-100"
                                        gradientTo="to-teal-200"
                                    />
                                    <StatCard
                                        title="Completed"
                                        value={stats.completedTasks}
                                        icon={<Circle className="w-4 h-4 text-blue-600" />}
                                        gradientFrom="from-blue-100"
                                        gradientTo="to-blue-200"
                                    />
                                    <StatCard
                                        title="Pending"
                                        value={stats.pendingCount}
                                        icon={<Circle className="w-4 h-4 text-teal-400" />}
                                        gradientFrom="from-teal-200"
                                        gradientTo="to-teal-300"
                                    />
                                    <StatCard
                                        title="Completion Rate"
                                        value={`${stats.completionPercentage}%`}
                                        icon={<Zap className="w-4 h-4 text-blue-600" />}
                                        gradientFrom="from-blue-100"
                                        gradientTo="to-teal-200"
                                    />
                                </div>
                                <hr className="my-5 border-teal-200/30" />
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs text-gray-700">
                                        <span className="font-medium flex items-center gap-2">
                                            <Circle className="w-2 h-2 text-teal-500 fill-teal-400" />
                                            Progress
                                        </span>
                                        <span className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full text-2xs font-semibold">
                                            {stats.completedTasks}/{stats.totalCount}
                                        </span>
                                    </div>
                                    <div className="relative h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-teal-500 to-blue-600 transition-all duration-500"
                                            style={{ width: `${stats.completionPercentage}%` }}
                                        />
                                    </div>
                                    <button
                                        onClick={() => navigate('/analytics')}
                                        className="mt-4 w-full bg-gradient-to-r from-teal-500 to-blue-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:from-teal-600 hover:to-blue-700 transition-all duration-300 hover:scale-105 shadow-md"
                                    >
                                        View Your Performance Analytics Dashboard
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Activity Log */}
                        <div className="relative bg-white/95 backdrop-blur-lg rounded-xl p-5 shadow-lg border border-teal-100/20 hover:shadow-xl transition-all duration-200">
                            <div className="absolute inset-0 bg-gradient-to-br from-teal-50/20 to-blue-50/20 opacity-50 rounded-xl" />
                            <div className="relative">
                                <button
                                    onClick={toggleLog}
                                    className="w-full text-left text-lg font-bold text-blue-900 flex items-center justify-between gap-2 mb-5 hover:text-teal-600 transition-colors duration-200"
                                    aria-expanded={isLogExpanded}
                                    aria-controls="log-content"
                                >
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-teal-500 animate-spin-slow" />
                                        Activity Log
                                    </div>
                                    <ChevronDown
                                        className={`w-4 h-4 text-teal-500 transition-transform duration-200 ${isLogExpanded ? 'rotate-180' : ''}`}
                                    />
                                </button>
                                <div
                                    id="log-content"
                                    className={`space-y-2 transition-all duration-300 ease-in-out overflow-y-auto ${isLogExpanded ? 'max-h-[360px]' : 'max-h-[180px]'}`}
                                    role="region"
                                    aria-live="polite"
                                >
                                    {(isLogExpanded ? tasks : tasks.slice(0, 3)).map((task) => (
                                        <div
                                            key={task._id || task.id}
                                            className="flex items-center justify-between p-2 bg-teal-50/50 rounded-lg hover:bg-teal-100/70 transition-all duration-200 border border-teal-200/50"
                                        >
                                            <div className="flex-1 min-w-0 pr-2">
                                                <p className="text-xs font-medium text-gray-800 break-words">{task.title}</p>
                                                <p className="text-2xs text-gray-500 mt-0.5">
                                                    {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'No date'}
                                                </p>
                                            </div>
                                            <span
                                                className={`px-1.5 py-0.5 text-2xs font-medium rounded-full ${task.completed ? 'bg-blue-100 text-blue-700' : 'bg-teal-100 text-teal-700'}`}
                                            >
                                                {task.completed ? 'Done' : 'Pending'}
                                            </span>
                                        </div>
                                    ))}
                                    {tasks.length === 0 && (
                                        <div className="text-center py-5">
                                            <Clock className="w-8 h-8 mx-auto text-teal-500 animate-pulse" />
                                            <p className="text-xs font-medium text-gray-600 mt-1.5">No tasks yet</p>
                                            <p className="text-2xs text-gray-400 mt-0.5">Your activity will appear here.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* AI Suggestions */}
                        <div className="relative bg-white/95 backdrop-blur-lg rounded-xl p-5 shadow-lg border border-teal-100/20 hover:shadow-xl transition-all duration-200">
                            <div className="absolute inset-0 bg-gradient-to-br from-teal-50/20 to-blue-50/20 opacity-50 rounded-xl" />
                            <div className="relative">
                                <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2 mb-5">
                                    <Sparkles className="w-5 h-5 text-teal-500 animate-pulse" />
                                    AI Suggestions
                                </h3>
                                <div className="space-y-2">
                                    {aiSuggestions.length > 0 ? (
                                        aiSuggestions.map((suggestion, idx) => (
                                            <div
                                                key={`suggestion-${idx}`}
                                                className="p-2 bg-teal-50/50 rounded-lg hover:bg-teal-100/70 transition-all duration-200 border border-teal-200/50"
                                            >
                                                <p className="text-xs text-gray-800 break-words">{suggestion}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-5">
                                            <Sparkles className="w-8 h-8 mx-auto text-teal-500 animate-pulse" />
                                            <p className="text-xs font-medium text-gray-600 mt-1.5">No suggestions yet</p>
                                            <p className="text-2xs text-gray-400 mt-0.5">Complete tasks to get AI insights.</p>
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => navigate('/ai-tools')}
                                    className="mt-4 w-full bg-gradient-to-r from-teal-500 to-blue-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:from-teal-600 hover:to-blue-700 transition-all duration-300 hover:scale-105 shadow-md"
                                    aria-label="Navigate to AI Tools"
                                >
                                    Use AI Tools
                                </button>
                            </div>
                        </div>

                        {/* Sticky Notes */}
                        <div className="relative bg-white/95 backdrop-blur-lg rounded-xl p-5 shadow-lg border border-teal-100/20 hover:shadow-xl transition-all duration-200">
                            <div className="absolute inset-0 bg-gradient-to-br from-teal-50/20 to-blue-50/20 opacity-50 rounded-xl" />
                            <div className="relative">
                                <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2 mb-5">
                                    <StickyNote className="w-5 h-5 text-yellow-500 animate-pulse" />
                                    Sticky Notes
                                </h3>
                                <button
                                    onClick={toggleNote}
                                    className="w-full p-3 bg-yellow-100 text-gray-600 rounded-md shadow-sm border border-yellow-200 hover:bg-yellow-200 transition-all duration-200 text-left"
                                    aria-label="Open sticky note"
                                >
                                    <p className="text-xs text-gray-600 break-words">
                                        {noteContent || 'Click to add temporary notes...'}
                                    </p>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sticky Note Modal */}
                <AnimatePresence>
                    {isNoteOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1001]"
                            onClick={handleBackdropClick}
                            role="dialog"
                            aria-label="Sticky Note Modal"
                            aria-hidden={!isNoteOpen}
                        >
                            <motion.div
                                ref={noteModalRef}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                className="bg-yellow-100 border border-yellow-300 rounded-lg p-6 w-[90vw] max-w-md shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-3">
                                    <StickyNote className="w-5 h-5 text-yellow-600" />
                                    Temporary Note
                                </h4>
                                <p className="text-xs text-gray-600 mb-4">Write temporary notes here (not saved).</p>
                                <textarea
                                    value={noteContent}
                                    onChange={(e) => setNoteContent(e.target.value)}
                                    placeholder="Write temporary notes here (not saved)..."
                                    className="w-full h-48 border-none bg-transparent text-gray-800 placeholder-gray-500 text-sm focus:outline-none resize-none"
                                    aria-label="Temporary note input"
                                    autoFocus
                                />
                                <div className="flex justify-between mt-4">
                                    <button
                                        onClick={clearNote}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-all duration-200"
                                        aria-label="Clear note"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Clear
                                    </button>
                                    <button
                                        onClick={toggleNote}
                                        className="flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-600 rounded-lg text-sm font-medium hover:bg-teal-100 transition-all duration-200"
                                        aria-label="Minimize note"
                                    >
                                        <Minus className="w-4 h-4" />
                                        Minimize
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* TaskBot Chat */}
                <div
                    className={`fixed bottom-0 right-0 sm:bottom-6 sm:right-6 w-full sm:w-[400px] h-full sm:h-[600px] bg-white/95 backdrop-blur-lg rounded-t-2xl sm:rounded-2xl shadow-xl border border-teal-200/50 z-[1000] transition-all duration-300 transform ${isChatOpen ? 'translate-y-0 opacity-100' : 'translate-y-full sm:translate-y-0 sm:opacity-0 sm:pointer-events-none'}`}
                    role="dialog"
                    aria-label="TaskBot Chat"
                    aria-hidden={!isChatOpen}
                >
                    <div className="flex flex-col h-full">
                        <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-500 to-blue-600 rounded-t-2xl sm:rounded-t-2xl flex items-center justify-between">
                            <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                                <MessageCircle className="w-6 h-6 text-white animate-pulse" />
                                TaskBot
                            </h3>
                            <div className="flex items-center gap-2">
                                {chatMessages.length > 0 && (
                                    <button
                                        onClick={clearChatMessages}
                                        className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-all duration-200"
                                        aria-label="Clear chat"
                                        title="Clear chat"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                )}
                                <button
                                    onClick={toggleChat}
                                    className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-all duration-200"
                                    aria-label="Close chat"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div
                            ref={chatContainerRef}
                            className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-white/90"
                            aria-live="polite"
                        >
                            {chatMessages.length === 0 && (
                                <div className="text-center py-8 text-gray-700 animate-in fade-in duration-300">
                                    <MessageCircle className="w-12 h-12 mx-auto mb-3 text-teal-500 animate-pulse" />
                                    <p className="text-base font-semibold">Welcome to TaskBot!</p>
                                    <p className="text-sm text-gray-600 mt-2">Try these commands:</p>
                                    <ul className="text-sm list-disc list-inside mt-2 text-left max-w-xs mx-auto space-y-1">
                                        <li>Add a task: Finish report by tomorrow</li>
                                        <li>List my tasks</li>
                                        <li>Update task: Mark report as completed</li>
                                        <li>Set reminder: Meeting at 3 PM</li>
                                        <li>What's my next task?</li>
                                    </ul>
                                </div>
                            )}
                            {chatMessages.map((msg, index) => (
                                <div
                                    key={index}
                                    className={`flex items-start gap-3 animate-in fade-in-10 duration-200 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`flex items-start gap-3 p-3 sm:p-4 rounded-lg max-w-[80%] ${msg.sender === 'user' ? 'bg-teal-500 text-white' : 'bg-teal-50 text-gray-800 border border-teal-200/50'}`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                                            {msg.sender === 'user' ? (
                                                <span className="text-sm font-semibold text-teal-700">U</span>
                                            ) : (
                                                <MessageCircle className="w-5 h-5 text-teal-500" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                                                {msg.text.split('\n').map((line, i) => (
                                                    <span key={i} className="block">
                                                        {line}
                                                    </span>
                                                ))}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {new Date(msg.timestamp).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isChatLoading && (
                                <div className="flex items-center gap-2 text-gray-600 animate-pulse">
                                    <svg
                                        className="animate-spin h-5 w-5"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                    </svg>
                                    <span className="text-sm">TaskBot is processing...</span>
                                </div>
                            )}
                        </div>
                        <form onSubmit={handleChatSubmit} className="p-4 sm:p-5 border-t border-teal-200/50 bg-white/95">
                            <div className="relative flex items-center">
                                <input
                                    type="text"
                                    ref={chatInputRef}
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Ask TaskBot about tasks or anything..."
                                    className="w-full p-3 pr-20 rounded-lg border border-teal-300 bg-white text-gray-800 placeholder-gray-500 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200/50 transition-all duration-200 text-sm"
                                    aria-label="Chat input"
                                    autoComplete="off"
                                    disabled={isChatLoading}
                                />
                                {chatInput && (
                                    <button
                                        type="button"
                                        onClick={clearChatInput}
                                        className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-teal-600 transition-colors duration-200"
                                        aria-label="Clear input"
                                        title="Clear input"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-teal-500 hover:text-teal-700 transition-all duration-200"
                                    disabled={isChatLoading}
                                    aria-label="Send message"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {!isChatOpen && (
                    <button
                        onClick={toggleChat}
                        className="fixed bottom-7 right-7 p-5 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 shadow-lg hover:shadow-teal-500/50 transition-all duration-200 z-[1001] animate-pulse-slow"
                        aria-label="Open TaskBot chat"
                    >
                        <MessageCircle className="w-6 h-6 text-white" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default Layout;