import React, { useState, useMemo, useCallback } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft, List, Zap, Star, Gauge, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api/ai';

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
**Generated At**: ${new Date().toLocaleString()}

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
            transition={{ duration: 0.5 }}
            className="min-h-screen bg-gradient-to-br from-teal-50/50 via-white to-emerald-50/50 flex flex-col"
        >
            {/* Header */}
            <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-lg shadow-md border-b border-teal-100/20 px-4 py-3 md:px-6 md:py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Sparkles className="w-6 h-6 text-teal-500 animate-pulse" />
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900">AI Tools</h1>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition-all duration-200"
                        aria-label="Back to Dashboard"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 md:px-6 md:py-8 flex flex-col lg:flex-row gap-6">
                {/* Main Section: Report and Tools */}
                <div className="flex-1 flex flex-col gap-6">
                    {/* Generate Report Section */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white/95 backdrop-blur-lg rounded-xl p-4 md:p-6 shadow-lg border border-teal-100/20"
                    >
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                            <Sparkles className="w-5 h-5 text-teal-500" />
                            Generate Report with AI
                        </h2>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleGenerateReport}
                                disabled={isGeneratingReport}
                                className={`w-full max-w-xs mx-auto px-4 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all duration-200 ${isGeneratingReport ? 'bg-teal-300 cursor-not-allowed' : 'bg-teal-500 text-white hover:bg-teal-600'
                                    }`}
                                aria-label="Generate Report"
                            >
                                {isGeneratingReport ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        Generate Report
                                    </>
                                )}
                            </button>
                            {reportError && (
                                <p className="text-center text-sm text-red-600">{reportError}</p>
                            )}
                            <textarea
                                className="w-full h-80 md:h-96 p-4 text-sm bg-teal-50/50 border border-teal-200 rounded-lg resize-none focus:ring-2 focus:ring-teal-500 scrollbar-thin scrollbar-thumb-teal-500 scrollbar-track-teal-100"
                                value={reportContent}
                                readOnly
                                placeholder={isGeneratingReport ? 'Generating report...' : 'Your AI-generated report will appear here...'}
                                aria-label="AI Generated Report"
                            />
                        </div>
                    </motion.section>

                    {/* AI Tools Section */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white/95 backdrop-blur-lg rounded-xl p-4 md:p-6 shadow-lg border border-teal-100/20"
                    >
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                            <Sparkles className="w-5 h-5 text-teal-500" />
                            AI Tools
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Task Prioritization AI */}
                            <div className="p-4 bg-teal-50/50 rounded-lg shadow-sm border border-teal-100/50 hover:bg-teal-100 transition-all duration-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <Star className="w-5 h-5 text-teal-500" />
                                    <p className="text-sm font-medium text-gray-800">Task Prioritization AI</p>
                                </div>
                                <p className="text-xs text-gray-600 mb-3">Rank tasks by urgency and importance.</p>
                                <form onSubmit={handlePrioritizeTask} className="space-y-2">
                                    <input
                                        type="text"
                                        value={priorityTask.title}
                                        onChange={(e) => setPriorityTask({ ...priorityTask, title: e.target.value })}
                                        placeholder="Enter task title..."
                                        className="w-full p-2 text-sm border border-teal-200 rounded-md focus:ring-2 focus:ring-teal-500"
                                        aria-label="Task Title"
                                    />
                                    <select
                                        value={priorityTask.priority}
                                        onChange={(e) => setPriorityTask({ ...priorityTask, priority: e.target.value })}
                                        className="w-full p-2 text-sm border border-teal-200 rounded-md focus:ring-2 focus:ring-teal-500"
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
                                        className="w-full p-2 text-sm border border-teal-200 rounded-md focus:ring-2 focus:ring-teal-500"
                                        aria-label="Due Date"
                                    />
                                    <button
                                        type="submit"
                                        className="w-full px-3 py-1.5 text-sm bg-teal-500 text-white rounded-md hover:bg-teal-600 transition-all duration-200"
                                        aria-label="Prioritize Task"
                                    >
                                        Prioritize
                                    </button>
                                </form>
                                {prioritizedTasks.length > 0 && (
                                    <div className="mt-3">
                                        <p className="text-xs font-medium text-gray-800">Prioritized Tasks:</p>
                                        <ul className="list-disc list-inside text-xs text-gray-600">
                                            {prioritizedTasks.map((task) => (
                                                <li key={task.id}>
                                                    {task.title} ({task.priority}, {task.dueDate || 'No due date'})
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* Effort Estimation AI */}
                            <div className="p-4 bg-teal-50/50 rounded-lg shadow-sm border border-teal-100/50 hover:bg-teal-100 transition-all duration-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <Gauge className="w-5 h-5 text-teal-500" />
                                    <p className="text-sm font-medium text-gray-800">Effort Estimation AI</p>
                                </div>
                                <p className="text-xs text-gray-600 mb-3">Estimate task effort based on description.</p>
                                <input
                                    type="text"
                                    value={effortTask}
                                    onChange={(e) => setEffortTask(e.target.value)}
                                    placeholder="Describe task (e.g., 'Complex report analysis')..."
                                    className="w-full p-2 text-sm border border-teal-200 rounded-md focus:ring-2 focus:ring-teal-500"
                                    aria-label="Task Description"
                                />
                                <button
                                    onClick={handleEstimateEffort}
                                    className="w-full mt-2 px-3 py-1.5 text-sm bg-teal-500 text-white rounded-md hover:bg-teal-600 transition-all duration-200"
                                    aria-label="Estimate Effort"
                                >
                                    Estimate Effort
                                </button>
                                {estimatedEffort && (
                                    <p className="mt-3 text-xs text-gray-600">
                                        Estimated Effort: <span className="font-medium">{estimatedEffort} hours</span>
                                    </p>
                                )}
                            </div>
                        </div>
                    </motion.section>
                </div>

                {/* Sidebar: Task Summaries and Insights */}
                <aside className="w-full lg:w-80 flex flex-col gap-6">
                    {/* AI Task Summaries */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white/95 backdrop-blur-lg rounded-xl p-4 md:p-6 shadow-lg border border-teal-100/20"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <List className="w-5 h-5 text-teal-500" />
                                AI Task Summaries
                            </h2>
                            <select
                                value={periodFilter}
                                onChange={(e) => setPeriodFilter(e.target.value)}
                                className="px-2 py-1 text-xs bg-teal-50 border border-teal-200 rounded-md focus:ring-2 focus:ring-teal-500"
                                aria-label="Period filter"
                            >
                                <option value="all">All</option>
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>
                        <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-teal-500 scrollbar-track-teal-100">
                            <AnimatePresence>
                                {taskSummaries.length > 0 ? (
                                    taskSummaries.map((task) => (
                                        <motion.div
                                            key={task.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="p-3 bg-teal-50/50 rounded-md shadow-sm border border-teal-100/50 hover:bg-teal-100 transition-all duration-200"
                                        >
                                            <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                                <span className={`px-2 py-0.5 rounded-full ${task.status === 'Completed' ? 'bg-blue-100 text-blue-700' : 'bg-teal-100 text-teal-700'}`}>
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
                                        className="text-center py-4"
                                    >
                                        <List className="w-6 h-6 mx-auto text-teal-500 animate-pulse" />
                                        <p className="text-xs font-medium text-gray-600 mt-1">No tasks for this period</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.section>

                    {/* AI Insights */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white/95 backdrop-blur-lg rounded-xl p-4 md:p-6 shadow-lg border border-teal-100/20"
                    >
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                            <Zap className="w-5 h-5 text-teal-500" />
                            AI Insights
                        </h2>
                        <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-teal-500 scrollbar-track-teal-100">
                            {aiInsights.length > 0 ? (
                                aiInsights.map((insight, idx) => (
                                    <div
                                        key={`insight-${idx}`}
                                        className="p-3 bg-teal-50/50 rounded-md shadow-sm border border-teal-100/50 hover:bg-teal-100 transition-all duration-200"
                                    >
                                        <p className="text-xs text-gray-800">{insight}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-4">
                                    <Zap className="w-6 h-6 mx-auto text-teal-500 animate-pulse" />
                                    <p className="text-xs font-medium text-gray-600 mt-1">No insights available</p>
                                </div>
                            )}
                        </div>
                    </motion.section>
                </aside>
            </main>
        </motion.div>
    );
};

export default AiTools;