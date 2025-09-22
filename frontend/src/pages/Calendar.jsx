import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Star, Clock, Plus, Circle, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import TaskItem from '../components/TaskItem';
import TaskModal from '../components/TaskModal';
import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/tasks`;

// Custom Calendar Component
const CustomCalendar = ({ value, onChange, tasksByDate }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date(value.getFullYear(), value.getMonth(), 1));

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const getDaysInMonth = (year, month) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year, month) => {
        return new Date(year, month, 1).getDay();
    };

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const weeks = [];
    let currentWeek = Array(firstDay).fill(null); // Pad with null for days before the 1st

    for (let day = 1; day <= daysInMonth; day++) {
        currentWeek.push(day);
        if (currentWeek.length === 7) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
    }

    if (currentWeek.length > 0) {
        while (currentWeek.length < 7) {
            currentWeek.push(null); // Pad with null for days after the last day
        }
        weeks.push(currentWeek);
    }

    const tileContent = (day) => {
        if (!day) return null;
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayTasks = tasksByDate[dateKey] || [];
        if (!dayTasks.length) return null;

        const maxDots = 3;
        const priorityColors = {
            high: 'bg-red-500',
            medium: 'bg-yellow-600',
            low: 'bg-teal-400',
        };

        return (
            <div className="flex justify-center gap-1 mt-1">
                {dayTasks.slice(0, maxDots).map((task, index) => (
                    <span
                        key={index}
                        className={`w-2 h-2 rounded-full ${priorityColors[task.priority?.toLowerCase()] || priorityColors.low}`}
                    />
                ))}
                {dayTasks.length > maxDots && (
                    <span className="text-xs text-teal-600 font-medium">+{dayTasks.length - maxDots}</span>
                )}
            </div>
        );
    };

    const tileClassName = (day) => {
        if (!day) return 'text-transparent';
        const isSelected =
            value.getFullYear() === year &&
            value.getMonth() === month &&
            value.getDate() === day;
        return `rounded-full transition-all duration-200 hover:bg-teal-50 hover:shadow-sm text-center py-3 text-base ${isSelected ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white font-medium shadow-teal-500/30' : 'text-gray-900'}`;
    };

    return (
        <div className="w-full rounded-xl p-6 bg-teal-50/50 border border-teal-200/50">
            <div className="flex items-center justify-between mb-6">
                <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-teal-100 transition-all duration-200">
                    <ChevronLeft className="w-7 h-7 text-teal-600" />
                </button>
                <span className="text-lg font-semibold text-teal-600">
                    {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-teal-100 transition-all duration-200">
                    <ChevronRight className="w-7 h-7 text-teal-600" />
                </button>
            </div>
            <div className="grid grid-cols-7 gap-2 text-base">
                {daysOfWeek.map((day) => (
                    <div key={day} className="text-center font-semibold text-teal-600 text-sm uppercase py-2">
                        {day}
                    </div>
                ))}
                {weeks.flat().map((day, index) => (
                    <div
                        key={index}
                        className={tileClassName(day)}
                        onClick={() => day && onChange(new Date(year, month, day))}
                    >
                        {day}
                        {tileContent(day)}
                    </div>
                ))}
            </div>
        </div>
    );
};

const CalendarView = () => {
    const { user, tasks, fetchTasks, onLogout } = useOutletContext();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showModal, setShowModal] = useState(false);
    const [taskToEdit, setTaskToEdit] = useState(null);
    const [currentTime, setCurrentTime] = useState('');

    // Live Clock for WAT (UTC+1)
    useEffect(() => {
        const updateTime = () => {
            const watTime = new Intl.DateTimeFormat('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
                timeZone: 'Africa/Lagos',
            }).format(new Date());
            setCurrentTime(watTime);
        };
        updateTime();
        const timer = setInterval(updateTime, 1000);
        return () => clearInterval(timer);
    }, []);

    // Tasks for selected date
    const dailyTasks = useMemo(() => {
        return tasks.filter((task) => {
            if (!task.dueDate) return false;
            const taskDate = new Date(task.dueDate);
            return (
                taskDate.getFullYear() === selectedDate.getFullYear() &&
                taskDate.getMonth() === selectedDate.getMonth() &&
                taskDate.getDate() === selectedDate.getDate()
            );
        });
    }, [tasks, selectedDate]);

    // Tasks by date for indicators
    const tasksByDate = useMemo(() => {
        const map = {};
        tasks.forEach((task) => {
            if (!task.dueDate) return;
            const date = new Date(task.dueDate);
            const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            if (!map[dateKey]) map[dateKey] = [];
            map[dateKey].push(task);
        });
        return map;
    }, [tasks]);

    // Handle task save
    const handleTaskSave = async (taskData) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('No auth token found');

            const payload = {
                title: taskData.title?.trim() || '',
                description: taskData.description || '',
                priority: taskData.priority || 'Low',
                dueDate: taskData.dueDate || selectedDate.toISOString().split('T')[0],
                completed: taskData.completed === 'Yes' || taskData.completed === true,
                userId: user?.id || null,
            };

            if (!payload.title) {
                console.error('Task title is required');
                return;
            }

            if (taskData._id) {
                await axios.put(`${API_BASE_URL}/${taskData._id}/gp`, payload, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            } else {
                await axios.post(`${API_BASE_URL}/gp`, payload, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            }

            await fetchTasks();
            setShowModal(false);
            setTaskToEdit(null);
        } catch (error) {
            console.error('Error saving task:', error.response?.data || error.message);
            if (error.response?.status === 401) onLogout?.();
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-teal-100 flex flex-col font-sans"
        >
            <div className="flex-1 max-w-[1600px] mx-auto w-full px-8 py-12">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white/95 backdrop-blur-lg border border-teal-100/50 rounded-3xl shadow-lg flex flex-col min-h-[calc(100vh-6rem)] lg:min-h-[900px] overflow-hidden"
                >
                    {/* Header */}
                    <header className="bg-teal-50/50 border-b border-teal-200/50 px-8 py-6 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <Star className="w-8 h-8 text-teal-600 animate-spin-slow" />
                            <div className="min-w-0">
                                <h1 className="text-3xl font-bold text-blue-900 tracking-tight truncate">My Calendar</h1>
                                <p className="text-base text-teal-600 tracking-tight line-clamp-1">Your Task Schedule</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="bg-white/95 border border-teal-300/50 rounded-lg px-6 py-3 text-gray-800 text-base font-medium flex items-center gap-3 flex-shrink-0">
                                <Clock className="w-6 h-6 text-teal-600 animate-pulse flex-shrink-0" />
                                <span className="truncate">{currentTime}</span>
                            </div>
                            <img
                                src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}`}
                                alt="User Avatar"
                                className="w-12 h-12 rounded-full border-2 border-teal-400/50 hover:shadow-sm transition-all duration-200 flex-shrink-0"
                            />
                        </div>
                    </header>

                    {/* Main Content */}
                    <main className="flex-1 flex flex-col overflow-hidden p-8 space-y-8">
                        {/* Calendar Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white/95 backdrop-blur-md border border-teal-200/50 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
                        >
                            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-4">
                                <Circle className="w-6 h-6 text-teal-400 animate-pulse" />
                                Task Calendar
                            </h2>
                            <CustomCalendar
                                value={selectedDate}
                                onChange={setSelectedDate}
                                tasksByDate={tasksByDate}
                            />
                        </motion.div>

                        {/* Daily Tasks Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white/95 backdrop-blur-md border border-teal-200/50 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex-1 overflow-hidden"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-4">
                                    <Circle className="w-6 h-6 text-blue-400 animate-pulse" />
                                    Tasks for {selectedDate.toLocaleDateString()}
                                </h2>
                                <button
                                    onClick={() => {
                                        setTaskToEdit({ dueDate: selectedDate.toISOString().split('T')[0] });
                                        setShowModal(true);
                                    }}
                                    className="bg-gradient-to-r from-teal-500 to-blue-500 text-white px-6 py-3 rounded-lg flex items-center gap-3 text-base hover:from-teal-600 hover:to-blue-600 transition-all duration-300 hover:scale-105 hover:shadow-md"
                                >
                                    <Plus className="w-6 h-6" /> Add Task
                                </button>
                            </div>
                            <div className="max-h-[calc(100vh-24rem)] lg:max-h-[700px] overflow-y-auto scrollbar-thin">
                                {dailyTasks.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-center py-10"
                                    >
                                        <Circle className="w-12 h-12 mx-auto text-teal-400 animate-pulse" />
                                        <p className="text-lg font-medium text-gray-600 mt-6">No tasks for this date.</p>
                                        <p className="text-base text-teal-500 mt-2">Create a task to stay on track!</p>
                                    </motion.div>
                                ) : (
                                    dailyTasks.map((task, index) => (
                                        <motion.div
                                            key={task._id || task.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="relative bg-white/80 backdrop-blur-sm rounded-lg p-6 mb-4 hover:bg-teal-50 transition-all duration-300 border border-teal-200/50 cursor-pointer shadow-sm hover:shadow-md"
                                            onClick={() => {
                                                setTaskToEdit(task);
                                                setShowModal(true);
                                            }}
                                        >
                                            <TaskItem
                                                task={task}
                                                onRefresh={fetchTasks}
                                                showCompleteCheckbox
                                                onEdit={() => {
                                                    setTaskToEdit(task);
                                                    setShowModal(true);
                                                }}
                                                onLogout={onLogout}
                                            />
                                            <span
                                                className={`absolute -top-2 -left-2 w-4 h-4 rounded-full ${task.priority?.toLowerCase() === 'high'
                                                    ? 'bg-red-500'
                                                    : task.priority?.toLowerCase() === 'medium'
                                                        ? 'bg-yellow-600'
                                                        : 'bg-teal-400'
                                                    } animate-pulse shadow-sm`}
                                            />
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </main>

                    {/* Floating Add Button */}
                    <motion.button
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            setTaskToEdit({ dueDate: selectedDate.toISOString().split('T')[0] });
                            setShowModal(true);
                        }}
                        className="fixed bottom-8 right-8 bg-gradient-to-r from-teal-500 to-blue-500 text-white p-5 rounded-full shadow-md hover:from-teal-600 hover:to-blue-600 transition-all duration-300 z-30"
                        title="Add New Task"
                    >
                        <Plus className="w-7 h-7" />
                    </motion.button>
                </motion.div>

                {/* Task Modal */}
                <TaskModal
                    isOpen={showModal}
                    onClose={() => {
                        setShowModal(false);
                        setTaskToEdit(null);
                    }}
                    taskToEdit={taskToEdit}
                    onSave={handleTaskSave}
                    onLogout={onLogout}
                />
            </div>

            <style jsx>{`
                .scrollbar-thin::-webkit-scrollbar {
                    width: 6px;
                }
                .scrollbar-thin::-webkit-scrollbar-track {
                    background: rgba(20, 184, 166, 0.1);
                    border-radius: 3px;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb {
                    background: #14B8A6;
                    border-radius: 3px;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb:hover {
                    background: #0D9488;
                }
            `}</style>
        </motion.div>
    );
};

export default CalendarView;