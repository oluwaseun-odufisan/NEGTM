import React, { useMemo, useState } from 'react';
import { CT_CLASSES, EMPTY_STATE, SORT_OPTIONS } from '../assets/cssConstants';
import { CheckCircle2, Filter, Star } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import TaskItem from '../components/TaskItem';

const CompletePage = () => {
    const { tasks, refreshTasks } = useOutletContext();
    const [sortBy, setSortBy] = useState('newest');

    const sortedCompletedTasks = useMemo(() => {
        return tasks
            .filter(task => [true, 1, 'yes'].includes(
                typeof task.completed === 'string' ? task.completed.toLowerCase() : task.completed
            ))
            .sort((a, b) => {
                switch (sortBy) {
                    case 'newest':
                        return new Date(b.createdAt) - new Date(a.createdAt);
                    case 'oldest':
                        return new Date(a.createdAt) - new Date(b.createdAt);
                    case 'priority': {
                        const order = { high: 3, medium: 2, low: 1 };
                        return order[b.priority?.toLowerCase()] - order[a.priority?.toLowerCase()];
                    }
                    default:
                        return 0;
                }
            });
    }, [tasks, sortBy]);

    return (
        <div className={`${CT_CLASSES.page} relative bg-gradient-to-br from-teal-50/70 via-white to-emerald-50/70 overflow-hidden`}>
            {/* Dynamic Background with Sparkles and Glow */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute w-full h-full bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.15)_0%,transparent_60%)] animate-pulse-infinite"></div>
                {[...Array(25)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 rounded-full bg-teal-400/50 animate-sparkle"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 3}s`,
                            animationDuration: `${Math.random() * 4 + 2}s`,
                        }}
                    />
                ))}
                <div className="absolute inset-0 bg-teal-100/10 animate-glow"></div>
            </div>

            {/* Header with Interactive Glow */}
            <div className={`${CT_CLASSES.header} sticky top-0 bg-white/95 backdrop-blur-xl z-10 border-b border-teal-100 shadow-lg`}>
                <div className={CT_CLASSES.titleWrapper}>
                    <h1 className={`${CT_CLASSES.title} flex items-center gap-3 animate-slideIn-left`}>
                        <CheckCircle2 className='text-teal-500 w-8 h-8 md:w-9 md:h-9 animate-spin-slow' />
                        <div className='relative'>
                            <span className='truncate text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-teal-500 to-emerald-600 bg-clip-text'>Completed Tasks</span>
                            <div className='absolute -bottom-1 left-0 w-full h-1 bg-teal-300/50 animate-progress'></div>
                        </div>
                    </h1>
                    <p className={`${CT_CLASSES.subtitle} text-teal-600 animate-fadeIn-slow`}>
                        {sortedCompletedTasks.length} task{sortedCompletedTasks.length !== 1 && 's'} marked as completed
                    </p>
                </div>

                {/* Sort Controls with Hover Effects */}
                <div className={CT_CLASSES.sortContainer}>
                    <div className={`${CT_CLASSES.sortBox} bg-white/90 backdrop-blur-md rounded-xl p-2 hover:shadow-xl transition-all duration-700`}>
                        <div className={CT_CLASSES.filterLabel}>
                            <Filter className='w-5 h-5 text-teal-500 animate-pulse-slow' />
                            <span className='text-xs md:text-sm font-medium'>Sort By:</span>
                        </div>

                        {/* Mobile Dropdown */}
                        <select 
                            value={sortBy} 
                            onChange={e => setSortBy(e.target.value)} 
                            className={`${CT_CLASSES.select} bg-teal-50 border-teal-200 hover:bg-teal-100 focus:ring-teal-500 transition-all duration-300`}
                        >
                            {SORT_OPTIONS.map(opt => (
                                <option key={opt.id} value={opt.id} className='bg-white text-teal-700'>
                                    {opt.label}
                                    {opt.id === 'newest' ? ' First' : ''}
                                </option>
                            ))}
                        </select>

                        {/* Desktop Buttons */}
                        <div className={`${CT_CLASSES.btnGroup} animate-fadeIn-up space-x-2`}>
                            {SORT_OPTIONS.map(opt => (
                                <button 
                                    key={opt.id} 
                                    onClick={() => setSortBy(opt.id)}
                                    className={[
                                        CT_CLASSES.btnBase,
                                        sortBy === opt.id ? CT_CLASSES.btnActive : CT_CLASSES.btnInactive,
                                        'hover:scale-110 hover:bg-teal-50 transition-all duration-400 flex items-center gap-2 px-3 py-1.5 rounded-lg'
                                    ].join(' ')}
                                >
                                    {opt.icon}{opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Task List with Enhanced Cards */}
            <div className={`${CT_CLASSES.list} space-y-3 mt-5 p-2`}>
                {sortedCompletedTasks.length === 0 ? (
                    <div className={`${CT_CLASSES.emptyState} bg-white/90 backdrop-blur-md rounded-xl p-6 shadow-md animate-fadeIn-up`}>
                        <div className={`${CT_CLASSES.emptyIconWrapper} bg-teal-50/80 rounded-full p-3 hover:bg-teal-100 transition-all duration-300 animate-pulse-slow`}>
                            <CheckCircle2 className='w-10 h-10 md:w-12 md:h-12 text-teal-500 animate-bounce-slow' />
                        </div>
                        <h3 className={`${CT_CLASSES.emptyTitle} text-xl md:text-2xl font-semibold animate-slideIn-left`}>No Completed Tasks Yet!</h3>
                        <p className={`${CT_CLASSES.emptyText} text-teal-600 animate-slideIn-right`}>
                            Complete some tasks and they will appear here
                        </p>
                    </div>
                ) : (
                    sortedCompletedTasks.map((task, index) => (
                        <div 
                            key={task._id || task.id} 
                            className='relative bg-white/95 backdrop-blur-md border border-teal-100 rounded-xl shadow-md hover:shadow-teal-200/60 transition-all duration-700 hover:-translate-y-2 animate-slideIn-up'
                            style={{ animationDelay: `${index * 0.12}s` }}
                        >
                            <TaskItem
                                task={task}
                                onRefresh={refreshTasks}
                                showCompleteCheckbox={false}
                                className='opacity-90 hover:opacity-100 transition-opacity text-sm md:text-base p-3'
                            />
                            <div className='absolute -top-2 -right-2 w-5 h-5 bg-teal-400/30 rounded-full animate-twinkle' />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CompletePage;