import React, { useMemo, useState } from 'react';
import { layoutClasses, SORT_OPTIONS } from '../assets/cssConstants';
import { Clock, Filter, ListChecks, Plus } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import TaskItem from '../components/TaskItem';
import TaskModal from '../components/TaskModal';

const PendingPage = () => {
    const { tasks = [], refreshTasks } = useOutletContext();
    const [sortBy, setSortBy] = useState('newest');
    const [selectedTask, setSelectedTask] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const sortedPendingTasks = useMemo(() => {
        const filtered = tasks.filter(
            (t) => !t.completed || (typeof t.completed === 'string' && t.completed.toLowerCase() === 'no')
        );
        return filtered.sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
            if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
            const order = { high: 3, medium: 2, low: 1 };
            return order[b.priority.toLowerCase()] - order[a.priority.toLowerCase()];
        });
    }, [tasks, sortBy]);

    return (
        <div className={`${layoutClasses.container} relative bg-gradient-to-br from-teal-50/50 via-white to-emerald-50/50 overflow-hidden`}>
            {/* Animated Background Particles */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute w-full h-full bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.1)_0%,transparent_70%)] animate-pulse-slow"></div>
                {[...Array(15)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute rounded-full bg-teal-200/30 blur-xs animate-float"
                        style={{
                            width: `${Math.random() * 8 + 4}px`,
                            height: `${Math.random() * 8 + 4}px`,
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${Math.random() * 10 + 10}s`,
                        }}
                    />
                ))}
            </div>

            {/* Header Section with Animation */}
            <div className={`${layoutClasses.headerWrapper} sticky top-0 bg-white/95 backdrop-blur-md z-10 border-b border-teal-100 shadow-sm`}>
                <div className='flex-1 min-w-0'>
                    <h1 className='text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2 animate-slideIn-left'>
                        <ListChecks className='text-teal-500 w-7 h-7 animate-bounce-slow' />
                        <span className='truncate'>Pending Tasks</span>
                    </h1>
                    <p className='text-sm text-teal-600 mt-1 ml-9 animate-fadeIn-slow'>
                        {sortedPendingTasks.length} task{sortedPendingTasks.length !== 1 && 's'} needing your attention
                    </p>
                </div>

                <div className={`${layoutClasses.sortBox} hover:shadow-md transition-all duration-300`}>
                    <div className='flex items-center gap-2 text-gray-700 font-medium'>
                        <Filter className='w-4 h-4 text-teal-500 animate-pulse-slow' />
                        <span className='text-sm'>Sort by:</span>
                    </div>

                    <select 
                        value={sortBy} 
                        onChange={(e) => setSortBy(e.target.value)}
                        className={`${layoutClasses.select} hover:bg-teal-100 focus:ring-teal-500 transition-all duration-200`}
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="priority">By Priority</option>
                    </select>

                    <div className={`${layoutClasses.tabWrapper}`}>
                        {SORT_OPTIONS.map(opt => (
                            <button 
                                key={opt.id} 
                                onClick={() => setSortBy(opt.id)}
                                className={`${layoutClasses.tabButton(sortBy === opt.id)} hover:scale-105 transition-transform duration-200 flex items-center gap-1.5 animate-fadeIn-slow`}
                            >
                                {opt.icon}{opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Add Task Section - Desktop View */}
            <div 
                className={`${layoutClasses.addBox} group bg-gradient-to-r from-teal-50/80 to-emerald-50/80 hover:from-teal-100 hover:to-emerald-100 transition-all duration-500 animate-slideIn-right`} 
                onClick={() => setShowModal(true)}
            >
                <div className='flex items-center justify-center gap-3 text-gray-600 group-hover:text-teal-700 transition-colors duration-300'>
                    <div className='w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md group-hover:shadow-teal-300/50 transition-all duration-300 animate-spin-slow'>
                        <Plus className='text-teal-500 w-5 h-5' />
                    </div>
                    <span className='font-medium text-sm md:text-base'>Add New Task</span>
                </div>
            </div>

            {/* Task List or Empty State */}
            <div className='space-y-4 mt-6 h-[calc(80vh-4rem)] overflow-y-auto'>
                {sortedPendingTasks.length === 0 ? (
                    <div className={`${layoutClasses.emptyState} animate-fadeIn-up`}>
                        <div className='max-w-sm mx-auto py-8'>
                            <div className={`${layoutClasses.emptyIconBg} bg-teal-50/90 hover:bg-teal-100 transition-all duration-300 animate-pulse-slow`}>
                                <Clock className='w-8 h-8 text-teal-500 animate-bounce-slow' />
                            </div>
                            <h3 className='text-lg font-semibold text-gray-800 mb-2 animate-slideIn-left'>All caught up!</h3>
                            <p className='text-sm text-teal-600 mb-4 animate-slideIn-right'>No pending tasks. Great work!</p>
                            <button 
                                onClick={() => setShowModal(true)}
                                className={`${layoutClasses.emptyBtn} hover:scale-105 transition-transform duration-300 animate-pulse-slow`}
                            >
                                Create New Task
                            </button>
                        </div>
                    </div>
                ) : (
                    sortedPendingTasks.map((task, index) => (
                        <div 
                            key={task._id || task.id} 
                            className='relative bg-white/95 backdrop-blur-md border border-teal-100 rounded-xl shadow-md hover:shadow-lg transition-all duration-500 hover:-translate-y-1 animate-slideIn-up'
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <TaskItem
                                task={task}
                                showCompleteCheckbox
                                onDelete={() => handleDelete(task._id || task.id)}
                                onToggleComplete={() => handleToggleComplete(task._id || task.id, task.completed)}
                                onEdit={() => { setSelectedTask(task); setShowModal(true); }}
                                onRefresh={refreshTasks}
                            />
                        </div>
                    ))
                )}
            </div>

            {/* Task Modal */}
            <TaskModal 
                isOpen={!!selectedTask || showModal}
                onClose={() => { setShowModal(false); setSelectedTask(null); refreshTasks(); }}
                taskToEdit={selectedTask} 
            />
        </div>
    );
};

export default PendingPage;