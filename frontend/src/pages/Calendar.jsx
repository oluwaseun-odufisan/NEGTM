import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Star, Clock, Plus, Circle, ChevronLeft, ChevronRight } from 'lucide-react';
import TaskItem from '../components/TaskItem';
import TaskModal from '../components/TaskModal';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/tasks';

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
            <div className="flex justify-center gap-0.5 mt-0.5">
                {dayTasks.slice(0, maxDots).map((task, index) => (
                    <span
                        key={index}
                        className={`w-1.5 h-1.5 rounded-full ${priorityColors[task.priority?.toLowerCase()] || priorityColors.low}`}
                    />
                ))}
                {dayTasks.length > maxDots && (
                    <span className="text-[0.6rem] text-teal-600 font-medium">+{dayTasks.length - maxDots}</span>
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
        return `rounded-full transition-all duration-200 hover:bg-teal-50 hover:shadow-sm text-center py-2 ${isSelected ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white font-medium animate-pulse shadow-teal-500/30' : 'text-gray-900'
            }`;
    };

    return (
        <div className="w-full rounded-md p-3 bg-teal-50/50">
            <div className="flex items-center justify-between mb-3">
                <button onClick={prevMonth} className="p-1 rounded hover:bg-teal-100 transition-all duration-200">
                    <ChevronLeft className="w-5 h-5 text-teal-600" />
                </button>
                <span className="text-base font-medium text-teal-600">
                    {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={nextMonth} className="p-1 rounded hover:bg-teal-100 transition-all duration-200">
                    <ChevronRight className="w-5 h-5 text-teal-600" />
                </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-sm">
                {daysOfWeek.map((day) => (
                    <div key={day} className="text-center font-semibold text-teal-600 text-xs uppercase py-1">
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
    const { user, tasks, fetchTasks } = useOutletContext();
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

    // Handle task save with optimistic update
    const handleTaskSave = async (taskData) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('No auth token found');

            let optimisticTask = null;
            if (!(taskData.id || taskData._id)) {
                optimisticTask = {
                    ...taskData,
                    _id: `temp-${Date.now()}`,
                    userId: user?.id || null,
                    dueDate: taskData.dueDate || selectedDate.toISOString().split('T')[0],
                };
                fetchTasks([...tasks, optimisticTask]);
            }

            let response;
            if (taskData.id || taskData._id) {
                response = await axios.put(`${API_BASE_URL}/${taskData.id || taskData._id}/edit`, taskData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            } else {
                response = await axios.post(`${API_BASE_URL}/create`, { ...taskData, userId: user?.id || null }, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            }

            await fetchTasks();
            setShowModal(false);
            setTaskToEdit(null);
        } catch (error) {
            console.error('Error saving task:', error);
            if (optimisticTask) {
                fetchTasks(tasks.filter((t) => t._id !== optimisticTask._id));
            }
        }
    };

    return (
        <div className="relative min-h-screen bg-teal-50">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-teal-200/50 px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <Star className="w-6 h-6 text-teal-600 animate-spin-slow" />
                    <div>
                        <h1 className="text-lg font-semibold text-gray-900">My Calendar</h1>
                        <p className="text-xs text-teal-600">Your Task Schedule</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-teal-100/50 border border-teal-200/50 rounded-md px-3 py-1 text-teal-800 text-sm font-mono flex items-center">
                        <Clock className="w-4 h-4 mr-1.5 text-teal-600 animate-pulse" />
                        {currentTime}
                    </div>
                    <img
                        src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}`}
                        alt="User Avatar"
                        className="w-8 h-8 rounded-full border-2 border-teal-300/50 hover:scale-105 transition-all duration-200"
                    />
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-6 max-w-5xl mx-auto space-y-6">
                {/* Calendar Section */}
                <div className="bg-white/90 backdrop-blur-md border border-teal-200/50 rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-200">
                    <h2 className="text-base font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <Circle className="w-4 h-4 text-teal-400 animate-pulse" />
                        Task Calendar
                    </h2>
                    <CustomCalendar
                        value={selectedDate}
                        onChange={setSelectedDate}
                        tasksByDate={tasksByDate}
                    />
                </div>

                {/* Daily Tasks Section */}
                <div className="bg-white/90 backdrop-blur-md border border-teal-200/50 rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-base font-medium text-gray-900 flex items-center gap-2">
                            <Circle className="w-4 h-4 text-blue-400 animate-pulse" />
                            Tasks for {selectedDate.toLocaleDateString()}
                        </h2>
                        <button
                            onClick={() => {
                                setTaskToEdit({ dueDate: selectedDate.toISOString().split('T')[0] });
                                setShowModal(true);
                            }}
                            className="bg-gradient-to-r from-teal-500 to-blue-500 text-white px-3 py-1.5 rounded-md flex items-center gap-1.5 text-sm hover:from-teal-600 hover:to-blue-600 transition-all duration-200 hover:scale-105 hover:shadow-md"
                        >
                            <Plus className="w-4 h-4" /> Add Task
                        </button>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {dailyTasks.length === 0 ? (
                            <div className="text-center py-6">
                                <Circle className="w-10 h-10 mx-auto text-teal-400 animate-pulse" />
                                <p className="text-sm font-medium text-gray-600 mt-3">No tasks for this date.</p>
                                <p className="text-xs text-teal-500 mt-1">Create a task to stay on track!</p>
                            </div>
                        ) : (
                            dailyTasks.map((task, index) => (
                                <div
                                    key={task._id || task.id}
                                    className="relative bg-white/80 backdrop-blur-sm rounded-md p-3 hover:bg-teal-50 transition-all duration-200 border border-teal-200/50 cursor-pointer shadow-sm"
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
                                    />
                                    <span
                                        className={`absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full ${task.priority?.toLowerCase() === 'high'
                                            ? 'bg-red-500'
                                            : task.priority?.toLowerCase() === 'medium'
                                                ? 'bg-yellow-600'
                                                : 'bg-teal-400'
                                            } animate-pulse shadow-sm`}
                                    />
                                </div>
                            ))
                        )}
                        <style jsx>{`
              .custom-scrollbar::-webkit-scrollbar {
                width: 6px;
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
                </div>
            </div>

            {/* Floating Add Button */}
            <button
                onClick={() => {
                    setTaskToEdit({ dueDate: selectedDate.toISOString().split('T')[0] });
                    setShowModal(true);
                }}
                className="fixed bottom-4 right-4 bg-gradient-to-r from-teal-500 to-blue-500 text-white p-4 rounded-full shadow-md hover:from-teal-600 hover:to-blue-600 transition-all duration-200 hover:scale-105 hover:shadow-lg animate-pulse z-30"
                title="Add New Task"
            >
                <Plus className="w-5 h-5" />
            </button>

            {/* Task Modal */}
            <TaskModal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setTaskToEdit(null);
                }}
                taskToEdit={taskToEdit}
                onSave={handleTaskSave}
            />
        </div>
    );
};

export default CalendarView;