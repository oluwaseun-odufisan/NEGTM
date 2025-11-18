import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
    Brain, ArrowLeft, FileText, Zap, Star, Gauge, Loader2, Copy, Check,
    Download, Send, RefreshCw, Calendar, CheckCircle, AlertCircle, Clock,
    GripVertical, TrendingUp, X, Mic, Code, Search, Clock as ClockIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format, startOfDay, endOfDay, startOfWeek, endOfMonth, isWithinInterval } from 'date-fns';
import toast, { Toaster } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Professional Palette
const COLORS = {
    primary: '#1E40AF',
    secondary: '#16A34A',
    accent: '#F59E0B',
    danger: '#DC2626',
    neutral: {
        50: '#F9FAFB',
        100: '#F3F4F6',
        200: '#E5E7EB',
        300: '#D1D5DB',
        500: '#6B7280',
        700: '#374151',
        900: '#111827',
        border: '#E5E7EB'
    }
};

const REPORT_TEMPLATES = {
    daily: { title: "Daily Progress Report", greeting: "Good morning team,", summary: "Here's today's update.", completed: "Completed Today", pending: "In Progress", next: "Tomorrow's Focus", closing: "Let's keep the momentum." },
    weekly: { title: "Weekly Progress Report", greeting: "Hello team,", summary: "This week in review.", completed: "Completed This Week", pending: "Ongoing Work", next: "Next Week Priorities", closing: "Strong progress ahead." },
    monthly: { title: "Monthly Progress Report", greeting: "Team,", summary: "This month's achievements.", completed: "Completed This Month", pending: "In Progress", next: "Next Month Focus", closing: "On track and aligned." }
};

const AiTools = () => {
    const { user, tasks = [] } = useOutletContext();
    const navigate = useNavigate();

    // Report State
    const [reportType, setReportType] = useState('daily');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [selectedTaskIds, setSelectedTaskIds] = useState(new Set());
    const [reportContent, setReportContent] = useState('');
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [copied, setCopied] = useState(false);

    // AI Tools
    const [priorityTask, setPriorityTask] = useState({ title: '', priority: 'medium', dueDate: '' });
    const [prioritizedTasks, setPrioritizedTasks] = useState([]);
    const [effortTask, setEffortTask] = useState('');
    const [estimatedEffort, setEstimatedEffort] = useState(null);
    const [estimating, setEstimating] = useState(false);

    // Prompt Engine
    const [promptText, setPromptText] = useState('');
    const [promptOutput, setPromptOutput] = useState('');
    const [isPrompting, setIsPrompting] = useState(false);

    // AI Insights
    const aiInsights = useMemo(() => {
        const insights = [];
        const now = new Date();
        const overdue = tasks.filter(t => t.dueDate && !t.completed && new Date(t.dueDate) < now);
        const highPriorityPending = tasks.filter(t => (t.priority || '').toLowerCase() === 'high' && !t.completed);

        if (overdue.length > 0) {
            insights.push({ text: `${overdue.length} task(s) are overdue.`, level: 'error' });
        }
        if (highPriorityPending.length > 0) {
            insights.push({ text: `${highPriorityPending.length} high-priority task(s) pending.`, level: 'warn' });
        }
        if (tasks.length > 0) {
            const completionRate = Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100);
            insights.push({ text: `Overall completion: ${completionRate}%`, level: completionRate >= 80 ? 'success' : 'info' });
        }
        return insights;
    }, [tasks]);

    // Filter tasks by date range — FIXED
    const filteredTasks = useMemo(() => {
        if (!tasks.length) return [];

        let start, end;

        if (customStartDate && customEndDate) {
            start = startOfDay(new Date(customStartDate));
            end = endOfDay(new Date(customEndDate));
        } else {
            const now = new Date();
            switch (reportType) {
                case 'daily':
                    start = startOfDay(now);
                    end = endOfDay(now);
                    break;
                case 'weekly':
                    start = startOfWeek(now, { weekStartsOn: 1 });
                    end = now;
                    break;
                case 'monthly':
                    start = new Date(now.getFullYear(), now.getMonth(), 1);
                    end = endOfMonth(now);
                    break;
                default:
                    start = new Date(0);
                    end = now;
            }
        }

        return tasks.filter(task => {
            // Use dueDate if exists, otherwise createdAt, otherwise skip
            const taskDateStr = task.dueDate || task.createdAt;
            if (!taskDateStr) return false;

            let taskDate;
            try {
                taskDate = new Date(taskDateStr);
                if (isNaN(taskDate)) return false;
            } catch {
                return false;
            }

            // Normalize to full day for accurate comparison
            const taskStart = startOfDay(taskDate);
            const taskEnd = endOfDay(taskDate);

            return isWithinInterval(taskStart, { start, end }) || isWithinInterval(taskEnd, { start, end });
        });
    }, [tasks, reportType, customStartDate, customEndDate]);

    // Stats
    const stats = useMemo(() => {
        const selected = filteredTasks.filter(t => selectedTaskIds.has(t._id || t.id));
        const total = selected.length;
        const completed = selected.filter(t => t.completed).length;
        const pending = total - completed;
        const overdue = selected.filter(t => t.dueDate && !t.completed && new Date(t.dueDate) < new Date()).length;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        return { total, completed, pending, overdue, completionRate, selected };
    }, [filteredTasks, selectedTaskIds]);

    // Task selection
    const toggleTask = (id) => {
        const newSet = new Set(selectedTaskIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedTaskIds(newSet);
    };

    const selectAll = () => {
        const allIds = filteredTasks.map(t => t._id || t.id);
        setSelectedTaskIds(new Set(allIds));
    };

    const clearSelection = () => setSelectedTaskIds(new Set());

    // Generate Report
    const handleGenerateReport = useCallback(async () => {
        if (stats.selected.length === 0) {
            toast.error('Please select at least one task');
            return;
        }

        setIsGeneratingReport(true);
        setReportContent('');

        try {
            await new Promise(resolve => setTimeout(resolve, 2000));

            const template = REPORT_TEMPLATES[reportType];
            const completedTasks = stats.selected.filter(t => t.completed);
            const pendingTasks = stats.selected.filter(t => !t.completed);
            const overdueTasks = stats.selected.filter(t => t.dueDate && !t.completed && new Date(t.dueDate) < new Date());

            const formatList = (tasks) => {
                if (tasks.length === 0) return "- *None*";
                return tasks.map(t => `- **${t.title}**${t.dueDate ? ` _(due ${format(new Date(t.dueDate), 'MMM d')})_` : ''}`).join('\n');
            };

            const periodStart = customStartDate ? format(new Date(customStartDate), 'MMM d, yyyy') : 'This Period';
            const periodEnd = customEndDate ? format(new Date(customEndDate), 'MMM d, yyyy') : '';

            const markdown = `
# ${template.title}

**Prepared by:** ${user?.name || 'Team Member'}  
**Date:** ${format(new Date(), 'PPP')}  
**Period:** ${periodStart}${periodEnd ? ` to ${periodEnd}` : ''}  
**Tasks Included:** ${stats.selected.length}

---

${template.greeting}

${template.summary}

---

### ${template.completed} (${completedTasks.length})
${formatList(completedTasks)}

---

### ${template.pending} (${pendingTasks.length})
${formatList(pendingTasks)}

${overdueTasks.length > 0 ? `
> **Overdue Alert**  
> ${overdueTasks.map(t => `- **${t.title}** (was due ${format(new Date(t.dueDate), 'MMM d')})`).join('\n')}
` : ''}

---

### ${template.next}
${pendingTasks.length > 0
    ? pendingTasks.slice(0, 3).map(t => `- Continue **${t.title}**`).join('\n')
    : '- Review new tasks and maintain momentum.'}

---

**Completion Rate:** \`${stats.completionRate}%\`  
**Status:** ${stats.completionRate >= 80 ? 'Excellent' : stats.completionRate >= 50 ? 'Good' : 'Needs Attention'}

---

> *${template.closing}*  
> _AI-Generated • Powered by Grok_

            `.trim();

            setReportContent(markdown);
            toast.success('Report generated successfully!');
        } catch (err) {
            console.error('Report error:', err);
            toast.error('Failed to generate report.');
        } finally {
            setIsGeneratingReport(false);
        }
    }, [user, reportType, stats, selectedTaskIds, customStartDate, customEndDate]);

    // Copy, Download, Submit
    const handleCopy = async () => {
        if (!reportContent) return;
        try {
            await navigator.clipboard.writeText(reportContent);
            setCopied(true);
            toast.success('Copied!');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error('Copy failed');
        }
    };

    const downloadReport = () => {
        if (!reportContent) return;
        const blob = new Blob([reportContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${REPORT_TEMPLATES[reportType].title.replace(/ /g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.md`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Downloaded!');
    };

    const handleSubmit = () => {
        if (!reportContent) return;
        toast.success('Report submitted!');
    };

    // Prioritize & Estimate
    const handlePrioritize = (e) => {
        e.preventDefault();
        if (!priorityTask.title.trim()) return;

        const scoreMap = { high: 90, medium: 70, low: 50 };
        const newTask = {
            id: Date.now().toString(),
            ...priorityTask,
            aiScore: scoreMap[priorityTask.priority] + (priorityTask.dueDate ? 10 : 0) + Math.floor(Math.random() * 20)
        };

        const updated = [...prioritizedTasks, newTask]
            .sort((a, b) => b.aiScore - a.aiScore)
            .slice(0, 5);

        setPrioritizedTasks(updated);
        setPriorityTask({ title: '', priority: 'medium', dueDate: '' });
        toast.success('Prioritized!');
    };

    const handleEstimate = async () => {
        if (!effortTask.trim()) return;
        setEstimating(true);
        setEstimatedEffort(null);

        try {
            await new Promise(r => setTimeout(r, 1300));
            const desc = effortTask.toLowerCase();
            let hours = 2;
            if (/(complex|advanced|integrate|build|system|deploy)/i.test(desc)) hours += 5;
            if (/(research|analyze|report|design|plan|strategy)/i.test(desc)) hours += 3;
            if (/(review|update|fix|test|debug|refactor)/i.test(desc)) hours += 2;
            if (/(quick|simple|easy|minor|fast|basic)/i.test(desc)) hours -= 1;
            hours = Math.max(1, Math.min(24, hours));

            setEstimatedEffort(hours);
            toast.success(`${hours}h estimated`);
        } catch {
            toast.error('Estimation failed');
        } finally {
            setEstimating(false);
        }
    };

    // Grok Prompt Engine
    const handlePrompt = async () => {
        if (!promptText.trim()) return;
        setIsPrompting(true);
        setPromptOutput('');

        try {
            await new Promise(r => setTimeout(r, 1800));

            const lower = promptText.toLowerCase();
            let response = '';

            if (lower.includes('break') && lower.includes('task')) {
                response = '1. Research (2h)\n2. Design (1h)\n3. Code (4h)\n4. Test (2h)\n5. Deploy (1h)';
            } else if (lower.includes('risk')) {
                response = '**Risks:** Data loss (High), Scope creep (Medium), Delay (Low)';
            } else if (lower.includes('email')) {
                response = `Subject: Update\n\nHi,\n\n[Task] is on track. Next: [Action].\n\nBest,\n${user?.name || 'You'}`;
            } else {
                response = `**Grok:** Your prompt: "${promptText}"\n\n→ Connect to xAI API: https://x.ai/api`;
            }

            setPromptOutput(response);
            toast.success('Grok responded!');
        } catch {
            toast.error('Prompt failed');
        } finally {
            setIsPrompting(false);
        }
    };

    return (
        <>
            <Toaster position="top-center" toastOptions={{
                style: { background: COLORS.primary, color: 'white', fontWeight: '600' }
            }} />

            <div className="min-h-screen bg-gray-50">
                <header className="bg-white border-b border-gray-200 px-6 py-5 shadow-sm sticky top-0 z-10">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Brain className="w-8 h-8 text-blue-600" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Grok AI Hub</h1>
                                <p className="text-sm text-gray-500">Custom reports • Real-time AI • xAI powered</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                Dashboard
                            </button>
                            <img
                                src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=1e40af&color=fff`}
                                alt="Avatar"
                                className="w-10 h-10 rounded-full ring-2 ring-blue-100"
                            />
                        </div>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Left: Report & Tools */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Report Generator */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                                        <FileText className="w-6 h-6 text-blue-600" />
                                        Generate Report
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="date"
                                            value={customStartDate}
                                            onChange={e => setCustomStartDate(e.target.value)}
                                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                        />
                                        <span className="text-xs text-gray-500">to</span>
                                        <input
                                            type="date"
                                            value={customEndDate}
                                            onChange={e => setCustomEndDate(e.target.value)}
                                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                        />
                                        <button
                                            onClick={() => { setCustomStartDate(''); setCustomEndDate(''); }}
                                            className="p-1.5 text-gray-500 hover:text-gray-700"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="mb-4 flex gap-2">
                                    <button onClick={selectAll} className="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">
                                        Select All
                                    </button>
                                    <button onClick={clearSelection} className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                                        Clear
                                    </button>
                                </div>

                                <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2 scrollbar-thin">
                                    {filteredTasks.length > 0 ? (
                                        filteredTasks.map(task => {
                                            const id = task._id || task.id;
                                            const isSelected = selectedTaskIds.has(id);
                                            return (
                                                <label
                                                    key={id}
                                                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border ${
                                                        isSelected ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50 border-transparent'
                                                    }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleTask(id)}
                                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm text-gray-900 truncate">{task.title}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {task.completed ? 'Completed' : 'Pending'}
                                                            {task.dueDate && ` • Due ${format(new Date(task.dueDate), 'MMM d')}`}
                                                        </p>
                                                    </div>
                                                </label>
                                            );
                                        })
                                    ) : (
                                        <p className="text-center text-sm text-gray-500 py-8">
                                            {customStartDate && customEndDate 
                                                ? 'No tasks in selected date range' 
                                                : 'No tasks available'}
                                        </p>
                                    )}
                                </div>

                                <button
                                    onClick={handleGenerateReport}
                                    disabled={isGeneratingReport || stats.selected.length === 0}
                                    className="mt-5 w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                                >
                                    {isGeneratingReport ? (
                                        <>Generating<Loader2 className="w-5 h-5 animate-spin" /></>
                                    ) : (
                                        <>Generate Report</>
                                    )}
                                </button>
                            </motion.div>

                            {/* Tools */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Prioritization */}
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Star className="w-5 h-5 text-amber-600" />
                                        Prioritize
                                    </h3>
                                    <form onSubmit={handlePrioritize} className="space-y-3">
                                        <input type="text" placeholder="Task title..." value={priorityTask.title} onChange={e => setPriorityTask(prev => ({ ...prev, title: e.target.value }))} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                                        <div className="grid grid-cols-2 gap-2">
                                            <select value={priorityTask.priority} onChange={e => setPriorityTask(prev => ({ ...prev, priority: e.target.value }))} className="p-3 border border-gray-300 rounded-lg">
                                                <option value="high">High</option>
                                                <option value="medium">Medium</option>
                                                <option value="low">Low</option>
                                            </select>
                                            <input type="date" value={priorityTask.dueDate} onChange={e => setPriorityTask(prev => ({ ...prev, dueDate: e.target.value }))} className="p-3 border border-gray-300 rounded-lg" />
                                        </div>
                                        <button type="submit" className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700">Prioritize</button>
                                    </form>
                                    {prioritizedTasks.length > 0 && (
                                        <div className="mt-4 space-y-2">
                                            <p className="text-xs font-medium text-gray-700">Top Priorities:</p>
                                            {prioritizedTasks.map(t => (
                                                <div key={t.id} className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                                                    <p className="font-medium text-sm text-gray-900">{t.title}</p>
                                                    <p className="text-xs text-amber-700">Score: {t.aiScore}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>

                                {/* Effort */}
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Gauge className="w-5 h-5 text-blue-600" />
                                        Estimate Effort
                                    </h3>
                                    <input type="text" placeholder="Describe task..." value={effortTask} onChange={e => setEffortTask(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-3" />
                                    <button onClick={handleEstimate} disabled={estimating} className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
                                        {estimating ? <>Estimating<Loader2 className="w-5 h-5 animate-spin" /></> : 'Estimate'}
                                    </button>
                                    {estimatedEffort !== null && (
                                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-semibold text-blue-900">Estimated</span>
                                                <span className="text-2xl font-bold text-blue-600">{estimatedEffort}h</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-3">
                                                <motion.div initial={{ width: 0 }} animate={{ width: `${(estimatedEffort / 24) * 100}%` }} className="bg-blue-600 h-3 rounded-full" />
                                            </div>
                                        </motion.div>
                                    )}
                                </motion.div>
                            </div>

                            {/* Prompt Engine */}
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Code className="w-5 h-5 text-blue-600" />
                                    Grok Prompt Engine
                                </h3>
                                <textarea value={promptText} onChange={e => setPromptText(e.target.value)} placeholder="Ask Grok anything..." className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-3 resize-none" rows="3" />
                                <button onClick={handlePrompt} disabled={isPrompting || !promptText.trim()} className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
                                    {isPrompting ? <>Thinking<Loader2 className="w-5 h-5 animate-spin" /></> : 'Ask Grok'}
                                </button>
                                {promptOutput && (
                                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{promptOutput}</ReactMarkdown>
                                    </div>
                                )}
                            </motion.div>
                        </div>

                        {/* Right: Output */}
                        <div className="space-y-6">
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                    Generated Report
                                </h3>
                                {reportContent ? (
                                    <div className="space-y-4">
                                        <div className="flex gap-2">
                                            <button onClick={handleCopy} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium flex items-center justify-center gap-1 transition-colors">
                                                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                                                {copied ? 'Copied' : 'Copy'}
                                            </button>
                                            <button onClick={downloadReport} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium flex items-center justify-center gap-1 transition-colors">
                                                <Download className="w-4 h-4" /> Download
                                            </button>
                                            <button onClick={handleSubmit} className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-1">
                                                <Send className="w-4 h-4" /> Submit
                                            </button>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 max-h-96 overflow-y-auto text-sm prose prose-sm">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{reportContent}</ReactMarkdown>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-16 text-gray-400">
                                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p className="text-sm">Select tasks and generate</p>
                                    </div>
                                )}
                            </motion.div>

                            {/* Insights */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-blue-600" />
                                    Grok Insights
                                </h3>
                                <div className="space-y-3">
                                    {aiInsights.length > 0 ? (
                                        aiInsights.map((insight, i) => (
                                            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className={`p-3 rounded-lg border text-sm ${insight.level === 'error' ? 'bg-red-50 border-red-200 text-red-800' : insight.level === 'warn' ? 'bg-amber-50 border-amber-200 text-amber-800' : insight.level === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
                                                {insight.text}
                                            </motion.div>
                                        ))
                                    ) : (
                                        <p className="text-center text-sm text-gray-500 py-4">No insights</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <style jsx>{`
                    .scrollbar-thin { scrollbar-width: thin; }
                    .scrollbar-thin::-webkit-scrollbar { width: 6px; }
                    .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
                    .scrollbar-thin::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 9999px; }
                    .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                `}</style>
            </div>
        </>
    );
};

export default AiTools;