import React, { useState, useMemo, useCallback } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft, List, Zap, Star, Gauge, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/ai`;

const AiTools = () => {
    const { user, tasks = [], onLogout } = useOutletContext();
    const navigate = useNavigate();
    const [periodFilter, setPeriodFilter] = useState('all');
    const [reportContent, setReportContent] = useState('');
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [reportError, setReportError] = useState(null);
    const [priorityTask, setPriorityTask] = useState({ title: '', priority: 'medium', dueDate: '' });
    const [prioritizedTasks, setPrioritizedTasks] = useState([]);
    const [effortTask, setEffortTask] = useState('');
    const [estimatedEffort, setEstimatedEffort] = useState(null);

    const filteredTasks = useMemo(() => {
        const now = new Date();
        return tasks.filter((task) => {
            const taskDate = task.createdAt ? new Date(task.createdAt) : new Date();
            if (periodFilter === 'daily') {
                return taskDate.toDateString() === now.toDateString();
            } else if (periodFilter === 'weekly') {
                const startDate = new Date(now);
                startDate.setDate(now.getDate() - 7);
                return taskDate >= startDate && taskDate <= now;
            } else if (periodFilter === 'monthly') {
                const startDate = new Date(now);
                startDate.setDate(now.getDate() - 30);
                return taskDate >= startDate && taskDate <= now;
            }
            return true;
        });
    }, [tasks, periodFilter]);

    const taskSummaries = useMemo(() => {
        return filteredTasks.map((task) => ({
            id: task._id || task.id,
            title: task.title,
            status: task.completed ? 'Completed' : 'Pending',
            dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A',
        }));
    }, [filteredTasks]);

    const aiInsights = useMemo(() => {
        const insights = [];
        const now = new Date();
        const overdueTasks = filteredTasks.filter((task) => task.dueDate && !task.completed && new Date(task.dueDate) < now);
        if (overdueTasks.length > 0) {
            insights.push(`Complete ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''} to avoid delays.`);
        }
        const highPriorityTasks = filteredTasks.filter((task) => !task.completed && task.priority?.toLowerCase() === 'high');
        if (highPriorityTasks.length > 0) {
            insights.push(`Tackle ${highPriorityTasks.length} high-priority task${highPriorityTasks.length > 1 ? 's' : ''} first.`);
        }
        const completionRate = filteredTasks.length
            ? Math.round((filteredTasks.filter((task) => task.completed).length / filteredTasks.length) * 100)
            : 0;
        if (completionRate < 50 && filteredTasks.length > 0) {
            insights.push(`Improve your ${completionRate}% completion rate by focusing on pending tasks.`);
        }
        if (filteredTasks.length === 0) {
            insights.push('Add tasks to leverage AI insights!');
        }
        return insights.slice(0, 3);
    }, [filteredTasks]);

    const getAuthHeaders = useCallback(() => {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No auth token found');
        return { Authorization: `Bearer ${token}` };
    }, []);

    const handleGenerateReport = useCallback(async () => {
        setIsGeneratingReport(true);
        setReportError(null);
        try {
            const headers = getAuthHeaders();
            // Mock API call
            await new Promise((resolve) => setTimeout(resolve, 1500));
            const mockReport = `
# AI-Generated Task Report
**User**: ${user?.name || 'User'}
**Period**: ${periodFilter.charAt(0).toUpperCase() + periodFilter.slice(1)}
**Generated At**: ${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}

## Overview
- **Total Tasks**: ${filteredTasks.length}
- **Completed**: ${filteredTasks.filter(t => t.completed).length}
- **Pending**: ${filteredTasks.filter(t => !t.completed).length}
- **Overdue**: ${filteredTasks.filter(t => t.dueDate && !t.completed && new Date(t.dueDate) < new Date()).length}

## Key Tasks
${filteredTasks.slice(0, 3).map(t => `- **${t.title}** (${t.priority || 'No priority'}, Due: ${t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'N/A'}, Status: ${t.completed ? 'Completed' : 'Pending'})`).join('\n')}

## Recommendations
${aiInsights.length > 0 ? aiInsights.map(i => `- ${i}`).join('\n') : '- No recommendations available.'}
      `;
            setReportContent(mockReport);
        } catch (error) {
            console.error('Error generating report:', error);
            setReportError('Failed to generate report. Please try again.');
            if (error.response?.status === 401) onLogout?.();
        } finally {
            setIsGeneratingReport(false);
        }
    }, [user, filteredTasks, periodFilter, aiInsights, onLogout, getAuthHeaders]);

    const handlePrioritizeTask = useCallback(async (e) => {
        e.preventDefault();
        if (!priorityTask.title.trim()) return;
        try {
            const headers = getAuthHeaders();
            // Mock API call
            const newTask = {
                ...priorityTask,
                id: Date.now(),
                score: priorityTask.priority === 'high' ? 3 : priorityTask.priority === 'medium' ? 2 : 1,
            };
            const updatedTasks = [...prioritizedTasks, newTask].sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
                const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
                return dateA - dateB;
            });
            setPrioritizedTasks(updatedTasks.slice(0, 3));
            setPriorityTask({ title: '', priority: 'medium', dueDate: '' });
        } catch (error) {
            console.error('Error prioritizing task:', error);
            if (error.response?.status === 401) onLogout?.();
        }
    }, [priorityTask, prioritizedTasks, onLogout, getAuthHeaders]);

    const handleEstimateEffort = useCallback(async () => {
        if (!effortTask.trim()) return;
        try {
            const headers = getAuthHeaders();
            // Mock API call
            await new Promise((resolve) => setTimeout(resolve, 1000));
            const keywords = effortTask.toLowerCase();
            let hours = 2;
            if (keywords.includes('complex') || keywords.includes('urgent')) hours += 4;
            if (keywords.includes('research') || keywords.includes('analysis')) hours += 3;
            if (keywords.includes('quick') || keywords.includes('simple')) hours -= 1;
            setEstimatedEffort(Math.max(1, hours));
        } catch (error) {
            console.error('Error estimating effort:', error);
            if (error.response?.status === 401) onLogout?.();
        }
    }, [effortTask, onLogout, getAuthHeaders]);

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
                            <Sparkles className="w-8 h-8 text-teal-600 animate-pulse" />
                            <div className="min-w-0">
                                <h1 className="text-3xl font-bold text-blue-900 tracking-tight truncate">AI Tools</h1>
                                <p className="text-base text-teal-600 tracking-tight line-clamp-1">Optimize Your Workflow</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="flex items-center gap-3 bg-teal-100 text-teal-700 px-6 py-3 rounded-lg hover:bg-teal-200 transition-all duration-300 text-base"
                                aria-label="Back to Dashboard"
                            >
                                <ArrowLeft className="w-6 h-6" />
                                Back to Dashboard
                            </button>
                            <img
                                src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}`}
                                alt="User Avatar"
                                className="w-12 h-12 rounded-full border-2 border-teal-400/50 hover:shadow-sm transition-all duration-200 flex-shrink-0"
                            />
                        </div>
                    </header>

                    {/* Main Content */}
                    <main className="flex-1 flex flex-col lg:flex-row overflow-hidden p-8 gap-8">
                        {/* Main Section: Report and Tools */}
                        <div className="flex-1 flex flex-col gap-8">
                            {/* Generate Report Section */}
                            <motion.section
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-white/95 backdrop-blur-md border border-teal-200/50 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
                            >
                                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-4 mb-6">
                                    <Sparkles className="w-6 h-6 text-teal-400 animate-pulse" />
                                    Generate Report with AI
                                </h2>
                                <div className="flex flex-col gap-4">
                                    <button
                                        onClick={handleGenerateReport}
                                        disabled={isGeneratingReport}
                                        className={`w-full max-w-md mx-auto px-6 py-3 text-base font-medium rounded-lg flex items-center justify-center gap-3 transition-all duration-300 ${isGeneratingReport ? 'bg-teal-300 cursor-not-allowed' : 'bg-gradient-to-r from-teal-500 to-blue-500 text-white hover:from-teal-600 hover:to-blue-600 hover:scale-105 hover:shadow-md'}`}
                                        aria-label="Generate Report"
                                    >
                                        {isGeneratingReport ? (
                                            <>
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-6 h-6" />
                                                Generate Report
                                            </>
                                        )}
                                    </button>
                                    {reportError && (
                                        <p className="text-center text-base text-red-600">{reportError}</p>
                                    )}
                                    <textarea
                                        className="w-full h-[400px] lg:h-[600px] p-6 text-base bg-teal-50/50 border border-teal-200/50 rounded-lg resize-none focus:ring-2 focus:ring-teal-400 scrollbar-thin transition-all duration-300"
                                        value={reportContent}
                                        readOnly
                                        placeholder={isGeneratingReport ? 'Generating report...' : 'Your AI-generated report will appear here...'}
                                        aria-label="AI Generated Report"
                                    />
                                </div>
                            </motion.section>

                            {/* AI Tools Section */}
                            <motion.section
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-white/95 backdrop-blur-md border border-teal-200/50 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
                            >
                                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-4 mb-6">
                                    <Sparkles className="w-6 h-6 text-teal-400 animate-pulse" />
                                    AI Tools
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {/* Task Prioritization AI */}
                                    <div className="p-6 bg-teal-50/50 rounded-lg shadow-sm border border-teal-200/50 hover:bg-teal-100 transition-all duration-300">
                                        <div className="flex items-center gap-3 mb-4">
                                            <Star className="w-6 h-6 text-teal-400 animate-pulse" />
                                            <p className="text-base font-semibold text-gray-900">Task Prioritization AI</p>
                                        </div>
                                        <p className="text-base text-gray-600 mb-4">Rank tasks by urgency and importance.</p>
                                        <form onSubmit={handlePrioritizeTask} className="space-y-4">
                                            <input
                                                type="text"
                                                value={priorityTask.title}
                                                onChange={(e) => setPriorityTask({ ...priorityTask, title: e.target.value })}
                                                placeholder="Enter task title..."
                                                className="w-full p-3 text-base border border-teal-300/50 rounded-lg focus:ring-2 focus:ring-teal-400 transition-all duration-300"
                                                aria-label="Task Title"
                                            />
                                            <select
                                                value={priorityTask.priority}
                                                onChange={(e) => setPriorityTask({ ...priorityTask, priority: e.target.value })}
                                                className="w-full p-3 text-base border border-teal-300/50 rounded-lg focus:ring-2 focus:ring-teal-400 transition-all duration-300"
                                                aria-label="Task Priority"
                                            >
                                                <option value="high">High</option>
                                                <option value="medium">Medium</option>
                                                <option value="low">Low</option>
                                            </select>
                                            <input
                                                type="date"
                                                value={priorityTask.dueDate}
                                                onChange={(e) => setPriorityTask({ ...priorityTask, dueDate: e.target.value })}
                                                className="w-full p-3 text-base border border-teal-300/50 rounded-lg focus:ring-2 focus:ring-teal-400 transition-all duration-300"
                                                aria-label="Due Date"
                                            />
                                            <button
                                                type="submit"
                                                className="w-full px-6 py-3 text-base bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-lg hover:from-teal-600 hover:to-blue-600 transition-all duration-300 hover:scale-105 hover:shadow-md"
                                                aria-label="Prioritize Task"
                                            >
                                                Prioritize
                                            </button>
                                        </form>
                                        {prioritizedTasks.length > 0 && (
                                            <div className="mt-4">
                                                <p className="text-base font-semibold text-gray-900">Prioritized Tasks:</p>
                                                <ul className="list-disc list-inside text-base text-gray-600 mt-2">
                                                    {prioritizedTasks.map((task) => (
                                                        <li key={task.id} className="truncate">
                                                            {task.title} ({task.priority}, {task.dueDate || 'No due date'})
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>

                                    {/* Effort Estimation AI */}
                                    <div className="p-6 bg-teal-50/50 rounded-lg shadow-sm border border-teal-200/50 hover:bg-teal-100 transition-all duration-300">
                                        <div className="flex items-center gap-3 mb-4">
                                            <Gauge className="w-6 h-6 text-teal-400 animate-pulse" />
                                            <p className="text-base font-semibold text-gray-900">Effort Estimation AI</p>
                                        </div>
                                        <p className="text-base text-gray-600 mb-4">Estimate task effort based on description.</p>
                                        <input
                                            type="text"
                                            value={effortTask}
                                            onChange={(e) => setEffortTask(e.target.value)}
                                            placeholder="Describe task (e.g., 'Complex report analysis')..."
                                            className="w-full p-3 text-base border border-teal-300/50 rounded-lg focus:ring-2 focus:ring-teal-400 transition-all duration-300"
                                            aria-label="Task Description"
                                        />
                                        <button
                                            onClick={handleEstimateEffort}
                                            className="w-full mt-4 px-6 py-3 text-base bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-lg hover:from-teal-600 hover:to-blue-600 transition-all duration-300 hover:scale-105 hover:shadow-md"
                                            aria-label="Estimate Effort"
                                        >
                                            Estimate Effort
                                        </button>
                                        {estimatedEffort && (
                                            <p className="mt-4 text-base text-gray-600">
                                                Estimated Effort: <span className="font-semibold">{estimatedEffort} hours</span>
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </motion.section>
                        </div>

                        {/* Sidebar: Task Summaries and Insights */}
                        <aside className="w-full lg:w-96 flex flex-col gap-8">
                            {/* AI Task Summaries */}
                            <motion.section
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-white/95 backdrop-blur-md border border-teal-200/50 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-4">
                                        <List className="w-6 h-6 text-teal-400 animate-pulse" />
                                        AI Task Summaries
                                    </h2>
                                    <select
                                        value={periodFilter}
                                        onChange={(e) => setPeriodFilter(e.target.value)}
                                        className="px-4 py-2 text-base bg-teal-50/50 border border-teal-300/50 rounded-lg focus:ring-2 focus:ring-teal-400 transition-all duration-300"
                                        aria-label="Period filter"
                                    >
                                        <option value="all">All</option>
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                </div>
                                <div className="max-h-[calc(100vh-24rem)] lg:max-h-[700px] overflow-y-auto scrollbar-thin">
                                    <AnimatePresence>
                                        {taskSummaries.length > 0 ? (
                                            taskSummaries.map((task) => (
                                                <motion.div
                                                    key={task.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="p-4 bg-teal-50/50 rounded-lg shadow-sm border border-teal-200/50 hover:bg-teal-100 transition-all duration-300 mb-4"
                                                >
                                                    <p className="text-base font-semibold text-gray-900 truncate">{task.title}</p>
                                                    <div className="flex items-center gap-3 mt-2 text-base text-gray-600">
                                                        <span className={`px-3 py-1 rounded-full text-sm ${task.status === 'Completed' ? 'bg-blue-100 text-blue-700' : 'bg-teal-100 text-teal-700'}`}>
                                                            {task.status}
                                                        </span>
                                                        <span className="truncate">{task.dueDate}</span>
                                                    </div>
                                                </motion.div>
                                            ))
                                        ) : (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="text-center py-10"
                                            >
                                                <List className="w-12 h-12 mx-auto text-teal-400 animate-pulse" />
                                                <p className="text-base font-semibold text-gray-600 mt-4">No tasks for this period</p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.section>

                            {/* AI Insights */}
                            <motion.section
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="bg-white/95 backdrop-blur-md border border-teal-200/50 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
                            >
                                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-4 mb-6">
                                    <Zap className="w-6 h-6 text-teal-400 animate-pulse" />
                                    AI Insights
                                </h2>
                                <div className="max-h-[calc(100vh-24rem)] lg:max-h-[700px] overflow-y-auto scrollbar-thin">
                                    {aiInsights.length > 0 ? (
                                        aiInsights.map((insight, idx) => (
                                            <div
                                                key={`insight-${idx}`}
                                                className="p-4 bg-teal-50/50 rounded-lg shadow-sm border border-teal-200/50 hover:bg-teal-100 transition-all duration-300 mb-4"
                                            >
                                                <p className="text-base text-gray-900">{insight}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-10">
                                            <Zap className="w-12 h-12 mx-auto text-teal-400 animate-pulse" />
                                            <p className="text-base font-semibold text-gray-600 mt-4">No insights available</p>
                                        </div>
                                    )}
                                </div>
                            </motion.section>
                        </aside>
                    </main>
                </motion.div>
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

export default AiTools;