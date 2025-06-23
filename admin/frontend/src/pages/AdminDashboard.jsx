import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Users,
    FileText,
    Target,
    HardDrive,
    Clock,
    BarChart2,
    TrendingUp,
    PieChart,
    ArrowRight,
} from 'lucide-react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import axios from 'axios';
import toast from 'react-hot-toast';
import io from 'socket.io-client';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const USER_API_URL = import.meta.env.VITE_USER_API_URL || 'http://localhost:4001';

const AdminDashboard = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [dashboardData, setDashboardData] = useState({
        totalUsers: 0,
        activeTasks: { pending: 0, completed: 0 },
        goalsInProgress: [],
        storage: {
            totalUsed: '7.5 GB',
            totalQuota: '50 GB',
            perUserQuota: '10 GB',
        },
        recentActivities: [],
        taskCompletionData: {
            labels: [],
            datasets: [
                {
                    label: 'Completed Tasks',
                    data: [],
                    backgroundColor: '#00CED1',
                },
                {
                    label: 'Pending Tasks',
                    data: [],
                    backgroundColor: '#1E90FF',
                },
            ],
        },
        userActivityData: {
            labels: [],
            datasets: [
                {
                    label: 'User Actions',
                    data: [],
                    borderColor: '#00CED1',
                    backgroundColor: 'rgba(0, 206, 209, 0.2)',
                    fill: true,
                },
            ],
        },
        goalProgressData: {
            labels: [],
            datasets: [
                {
                    data: [],
                    backgroundColor: ['#00CED1', '#1E90FF', '#FFD700', '#FF6347', '#9ACD32'],
                    borderColor: '#FFFFFF',
                    borderWidth: 2,
                },
            ],
        },
    });

    // Fetch data from APIs
    const fetchDashboardData = async () => {
        setIsLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('adminToken');
            if (!token) {
                throw new Error('Authentication token missing. Please log in again.');
            }

            // Default date range: last 30 days
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const startDate = new Date(today);
            startDate.setDate(today.getDate() - 30);

            // Fetch users, tasks, and goals
            const [usersResponse, tasksResponse, goalsResponse] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/admin/users`, {
                    headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' },
                }),
                axios.get(`${API_BASE_URL}/api/admin/tasks`, {
                    headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' },
                    params: {
                        startDate: startDate.toISOString().split('T')[0],
                        endDate: today.toISOString().split('T')[0],
                    },
                }),
                axios.get(`${API_BASE_URL}/api/admin/goals`, {
                    headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' },
                    params: {
                        startDate: startDate.toISOString().split('T')[0],
                        endDate: today.toISOString().split('T')[0],
                    },
                }),
            ]);

            if (!usersResponse.data.success || !tasksResponse.data.success || !goalsResponse.data.success) {
                throw new Error('Failed to fetch dashboard data.');
            }

            const users = usersResponse.data.users;
            const tasks = tasksResponse.data.tasks;
            const goals = goalsResponse.data.goals;

            // Calculate metrics
            const totalUsers = users.length;
            const activeTasks = {
                pending: tasks.filter((task) => !task.completed).length,
                completed: tasks.filter((task) => task.completed).length,
            };

            // Goals in Progress (approved or pending)
            const goalsInProgress = goals
                .filter((goal) => ['approved', 'pending'].includes(goal.status))
                .map((goal) => ({
                    title: goal.title,
                    completion:
                        goal.subGoals && goal.subGoals.length > 0
                            ? (goal.subGoals.filter((sg) => sg.completed).length / goal.subGoals.length) * 100
                            : 0,
                }));

            // Average Task Completion Time
            const completedTasks = tasks.filter(
                (task) => task.completed && task.createdAt && task.completedAt && !isNaN(new Date(task.createdAt)) && !isNaN(new Date(task.completedAt))
            );
            const avgTaskCompletionTime = completedTasks.length > 0
                ? completedTasks.reduce((sum, task) => {
                      const created = new Date(task.createdAt);
                      const completed = new Date(task.completedAt);
                      const diffDays = (completed - created) / (1000 * 60 * 60 * 24);
                      return sum + (isNaN(diffDays) ? 0 : diffDays);
                  }, 0) / completedTasks.length
                : 0;

            // Task Completion Rate
            const taskCompletionRate = tasks.length > 0 ? (activeTasks.completed / tasks.length) * 100 : 0;

            // Goal Completion Rate
            const completedGoals = goals.filter(
                (goal) => goal.subGoals && goal.subGoals.length > 0 && goal.subGoals.every((sg) => sg.completed)
            ).length;
            const goalCompletionRate = goals.length > 0 ? (completedGoals / goals.length) * 100 : 0;

            // Task Completion Chart (weekly)
            const weeks = [];
            for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 7)) {
                weeks.push(new Date(d).toISOString().split('T')[0]);
            }
            const taskCompletionData = {
                labels: weeks.map((_, i) => `Week ${i + 1}`),
                datasets: [
                    {
                        label: 'Completed Tasks',
                        data: weeks.map((week, i) => {
                            const weekStart = new Date(week);
                            const weekEnd = new Date(weekStart);
                            weekEnd.setDate(weekStart.getDate() + 7);
                            return tasks.filter(
                                (task) =>
                                    task.completed &&
                                    task.completedAt &&
                                    new Date(task.completedAt) >= weekStart &&
                                    new Date(task.completedAt) < weekEnd
                            ).length;
                        }),
                        backgroundColor: '#00CED1',
                    },
                    {
                        label: 'Pending Tasks',
                        data: weeks.map((week, i) => {
                            const weekStart = new Date(week);
                            const weekEnd = new Date(weekStart);
                            weekEnd.setDate(weekStart.getDate() + 7);
                            return tasks.filter(
                                (task) =>
                                    !task.completed &&
                                    task.createdAt &&
                                    new Date(task.createdAt) >= weekStart &&
                                    new Date(task.createdAt) < weekEnd
                            ).length;
                        }),
                        backgroundColor: '#1E90FF',
                    },
                ],
            };

            // User Activity Chart
            const dates = [];
            for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 5)) {
                dates.push(new Date(d).toISOString().split('T')[0]);
            }
            const userActivityData = {
                labels: dates.map((date) => date.slice(5, 10)), // MM-DD
                datasets: [
                    {
                        label: 'User Actions',
                        data: dates.map((date, i) => {
                            const dayStart = new Date(date);
                            const dayEnd = new Date(dayStart);
                            dayEnd.setDate(dayStart.getDate() + 5);
                            return (
                                tasks.filter(
                                    (task) =>
                                        task.createdAt &&
                                        new Date(task.createdAt) >= dayStart &&
                                        new Date(task.createdAt) < dayEnd
                                ).length +
                                goals.filter(
                                    (goal) =>
                                        goal.createdAt &&
                                        new Date(goal.createdAt) >= dayStart &&
                                        new Date(goal.createdAt) < dayEnd
                                ).length
                            );
                        }),
                        borderColor: '#00CED1',
                        backgroundColor: 'rgba(0, 206, 209, 0.2)',
                        fill: true,
                    },
                ],
            };

            // Goal Progress Chart
            const goalProgressData = {
                labels: goalsInProgress.map((goal) => goal.title),
                datasets: [
                    {
                        data: goalsInProgress.map((goal) => goal.completion),
                        backgroundColor: ['#00CED1', '#1E90FF', '#FFD700', '#FF6347', '#9ACD32'],
                        borderColor: '#FFFFFF',
                        borderWidth: 2,
                    },
                ],
            };

            // Recent Activities (initially from fetched data, updated via socket)
            const recentActivities = [
                ...tasks.slice(0, 10).map((task) => ({
                    id: task._id,
                    user: task.owner?.name || task.owner?.email || 'Unknown',
                    action: task.completed
                        ? `completed Task "${task.title}"`
                        : `created Task "${task.title}"`,
                    timestamp: new Date(task.createdAt).toISOString().replace('T', ' ').slice(0, 16),
                })),
                ...goals.slice(0, 10).map((goal) => ({
                    id: goal._id,
                    user: goal.owner?.name || goal.owner?.email || 'Unknown',
                    action: `updated Goal "${goal.title}"`,
                    timestamp: new Date(goal.createdAt).toISOString().replace('T', ' ').slice(0, 16),
                })),
            ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 20);

            setDashboardData({
                totalUsers,
                activeTasks,
                goalsInProgress,
                storage: dashboardData.storage, // Retain mock storage
                recentActivities,
                taskCompletionData,
                userActivityData,
                goalProgressData,
            });

            toast.success('Dashboard data loaded successfully!');
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            if (err.response?.status === 403) {
                setError('Access denied: Super-admin role required.');
                toast.error('Access denied: Super-admin role required.');
            } else if (err.response?.status === 401) {
                setError('Session expired. Please log in again.');
                toast.error('Session expired. Please log in again.');
            } else if (err.response?.status === 400) {
                setError(err.response.data.message || 'Invalid request for dashboard data.');
                toast.error(err.response.data.message || 'Invalid request for dashboard data.');
            } else {
                setError(err.message || 'Failed to fetch dashboard data.');
                toast.error(err.message || 'Failed to fetch dashboard data.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Socket.IO setup
    useEffect(() => {
        const socket = io(USER_API_URL, {
            auth: { token: localStorage.getItem('adminToken') },
            reconnectionAttempts: 3,
            reconnectionDelay: 2000,
        });

        socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
            toast.success('Connected to real-time updates');
        });

        socket.on('newTask', (task) => {
            setDashboardData((prev) => ({
                ...prev,
                activeTasks: {
                    ...prev.activeTasks,
                    pending: prev.activeTasks.pending + 1,
                },
                recentActivities: [
                    {
                        id: task._id,
                        user: task.owner?.name || task.owner?.email || 'Unknown',
                        action: `created Task "${task.title}"`,
                        timestamp: new Date(task.createdAt).toISOString().replace('T', ' ').slice(0, 16),
                    },
                    ...prev.recentActivities.slice(0, 19),
                ],
            }));
            fetchDashboardData(); // Refresh charts
            toast.success('New task created!');
        });

        socket.on('updateTask', (updatedTask) => {
            setDashboardData((prev) => {
                const wasCompleted = prev.activeTasks.completed > 0 && updatedTask.completed;
                return {
                    ...prev,
                    activeTasks: {
                        pending: updatedTask.completed
                            ? prev.activeTasks.pending - 1
                            : prev.activeTasks.pending + 1,
                        completed: updatedTask.completed
                            ? prev.activeTasks.completed + 1
                            : prev.activeTasks.completed - 1,
                    },
                    recentActivities: [
                        {
                            id: updatedTask._id,
                            user: updatedTask.owner?.name || updatedTask.owner?.email || 'Unknown',
                            action: `updated Task "${updatedTask.title}"`,
                            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
                        },
                        ...prev.recentActivities.slice(0, 19),
                    ],
                };
            });
            fetchDashboardData();
            toast.success('Task updated!');
        });

        socket.on('deleteTask', (taskId) => {
            setDashboardData((prev) => ({
                ...prev,
                activeTasks: {
                    ...prev.activeTasks,
                    pending: prev.activeTasks.pending - 1,
                },
                recentActivities: prev.recentActivities.filter((act) => act.id !== taskId).slice(0, 20),
            }));
            fetchDashboardData();
            toast.success('Task deleted!');
        });

        socket.on('newGoal', (goal) => {
            setDashboardData((prev) => ({
                ...prev,
                goalsInProgress: [
                    {
                        title: goal.title,
                        completion:
                            goal.subGoals && goal.subGoals.length > 0
                                ? (goal.subGoals.filter((sg) => sg.completed).length / goal.subGoals.length) * 100
                                : 0,
                    },
                    ...prev.goalsInProgress,
                ],
                recentActivities: [
                    {
                        id: goal._id,
                        user: goal.owner?.name || goal.owner?.email || 'Unknown',
                        action: `created Goal "${goal.title}"`,
                        timestamp: new Date(goal.createdAt).toISOString().replace('T', ' ').slice(0, 16),
                    },
                    ...prev.recentActivities.slice(0, 19),
                ],
            }));
            fetchDashboardData();
            toast.success('New goal created!');
        });

        socket.on('goalUpdated', (updatedGoal) => {
            setDashboardData((prev) => ({
                ...prev,
                goalsInProgress: prev.goalsInProgress.map((g) =>
                    g.title === updatedGoal.title
                        ? {
                              title: updatedGoal.title,
                              completion:
                                  updatedGoal.subGoals && updatedGoal.subGoals.length > 0
                                      ? (updatedGoal.subGoals.filter((sg) => sg.completed).length /
                                            updatedGoal.subGoals.length) *
                                        100
                                      : 0,
                          }
                        : g
                ),
                recentActivities: [
                    {
                        id: updatedGoal._id,
                        user: updatedGoal.owner?.name || updatedGoal.owner?.email || 'Unknown',
                        action: `updated Goal "${updatedGoal.title}"`,
                        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
                    },
                    ...prev.recentActivities.slice(0, 19),
                ],
            }));
            fetchDashboardData();
            toast.success('Goal updated!');
        });

        socket.on('goalDeleted', (goalId) => {
            setDashboardData((prev) => ({
                ...prev,
                goalsInProgress: prev.goalsInProgress.filter((g) => g.id !== goalId),
                recentActivities: prev.recentActivities.filter((act) => act.id !== goalId).slice(0, 20),
            }));
            fetchDashboardData();
            toast.success('Goal deleted!');
        });

        socket.on('connect_error', (err) => {
            console.error('Socket connection error:', err.message);
            toast.error('Failed to connect to real-time updates. Retrying...');
        });

        socket.on('error', (err) => {
            console.error('Socket error:', err.message);
            toast.error('Real-time update error occurred.');
        });

        return () => {
            socket.disconnect();
            console.log('Socket disconnected');
        };
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const storageUsedPercentage =
        (parseFloat(dashboardData.storage.totalUsed) / parseFloat(dashboardData.storage.totalQuota)) * 100;

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: { color: '#2D3748', font: { size: 12 } },
            },
            tooltip: {
                backgroundColor: '#2D3748',
                titleColor: '#FFFFFF',
                bodyColor: '#FFFFFF',
            },
        },
        scales: {
            x: { ticks: { color: '#2D3748' } },
            y: {
                ticks: { color: '#2D3748' },
                beginAtZero: true,
            },
        },
    };

    const pieChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
                labels: { color: '#2D3748', font: { size: 12 } },
            },
            tooltip: {
                backgroundColor: '#2D3748',
                titleColor: '#FFFFFF',
                bodyColor: '#FFFFFF',
            },
        },
    };

    return (
        <div className="p-6 bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl w-full min-h-screen overflow-y-auto">
            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                </div>
            ) : (
                <>
                    {/* Error Message */}
                    {error && (
                        <div className="text-red-500 text-sm text-center mb-4 animate-shake">
                            {error}
                        </div>
                    )}

                    {/* Overview Widgets */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {/* Total Users */}
                        <div className="bg-teal-600 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 animate-slide-in">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold">Total Users</h3>
                                    <p className="text-3xl font-bold">{dashboardData.totalUsers}</p>
                                </div>
                                <Users className="w-10 h-10 opacity-80 animate-pulse-slow" />
                            </div>
                        </div>
                        {/* Active Tasks */}
                        <div className="bg-blue-600 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 animate-slide-in" style={{ animationDelay: '0.1s' }}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold">Active Tasks</h3>
                                    <p className="text-3xl font-bold">{dashboardData.activeTasks.pending}</p>
                                    <p className="text-sm opacity-80">
                                        Completed: {dashboardData.activeTasks.completed}
                                    </p>
                                </div>
                                <FileText className="w-10 h-10 opacity-80 animate-pulse-slow-delayed" />
                            </div>
                        </div>
                        {/* Goals in Progress */}
                        <div className="bg-teal-600 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 animate-slide-in" style={{ animationDelay: '0.2s' }}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold">Goals in Progress</h3>
                                    <p className="text-3xl font-bold">{dashboardData.goalsInProgress.length}</p>
                                </div>
                                <Target className="w-10 h-10 opacity-80 animate-pulse-slow" />
                            </div>
                        </div>
                        {/* Storage Usage */}
                        <div className="bg-blue-600 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 animate-slide-in" style={{ animationDelay: '0.3s' }}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold">Storage Usage</h3>
                                    <p className="text-3xl font-bold">{dashboardData.storage.totalUsed}</p>
                                    <p className="text-sm opacity-80">of {dashboardData.storage.totalQuota}</p>
                                </div>
                                <HardDrive className="w-10 h-10 opacity-80 animate-pulse-slow-delayed" />
                            </div>
                            <div className="w-full bg-white/30 rounded-full h-2.5 mt-2">
                                <div
                                    className="bg-white h-2.5 rounded-full transition-all duration-500"
                                    style={{ width: `${storageUsedPercentage}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Charts and Quick Links */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Task Completion Chart */}
                            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg animate-fade-in">
                                <h3 className="text-lg font-semibold text-teal-700 flex items-center mb-4">
                                    <BarChart2 className="w-5 h-5 mr-2" />
                                    Task Completion Rates
                                </h3>
                                <div className="h-64">
                                    <Bar data={dashboardData.taskCompletionData} options={chartOptions} />
                                </div>
                            </div>
                            {/* User Activity Chart */}
                            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg animate-fade-in" style={{ animationDelay: '0.1s' }}>
                                <h3 className="text-lg font-semibold text-teal-700 flex items-center mb-4">
                                    <TrendingUp className="w-5 h-5 mr-2" />
                                    User Activity Trends
                                </h3>
                                <div className="h-64">
                                    <Line data={dashboardData.userActivityData} options={chartOptions} />
                                </div>
                            </div>
                            {/* Goal Progress Chart */}
                            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg animate-slide-disable">
                                <h3 className="text-lg font-semibold text-teal-700 flex items-center mb-4">
                                    <PieChart className="w-5 h-5 mr-2" />
                                    Goal Progress
                                </h3>
                                <div className="h-64 flex justify-center">
                                    <Pie data={dashboardData.goalProgressData} options={pieChartOptions} />
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity and Quick Links */}
                        <div className="space-y-6">
                            {/* Recent Activity Feed */}
                            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg">
                                <h3 className="text-lg font-semibold text-teal-700 flex items-center mb-4">
                                    <Clock className="w-5 h-5 mr-2" />
                                    Recent Activity
                                </h3>
                                <ul className="space-y-4 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-teal-600 scrollbar-track-teal-100">
                                    {dashboardData.recentActivities.map((activity) => (
                                        <li
                                            key={activity.id}
                                            className="flex items-start space-x-3 border-l-4 border-teal-600 pl-3 animate-fade-in"
                                        >
                                            <div className="flex-shrink-0 w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                                                <Users className="w-4 h-4 text-teal-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-700">
                                                    <span className="font-semibold text-teal-600">{activity.user}</span>{' '}
                                                    {activity.action}
                                                </p>
                                                <p className="text-xs text-gray-500">{activity.timestamp}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            {/* Quick Links */}
                            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg animate-slide-in" style={{ animationDelay: '0.1s' }}>
                                <h3 className="text-lg font-semibold text-teal-700 mb-4">Quick Links</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {[
                                        { to: '/admin/user-management', label: 'Manage Users' },
                                        { to: '/admin/task-management', label: 'Manage Tasks' },
                                        { to: '/admin/goal-management', label: 'Manage Goals' },
                                        { to: '/admin/file-management', label: 'Manage Files' },
                                        { to: '/admin/reports', label: 'View Reports' },
                                        { to: '/admin/analytics', label: 'View Analytics' },
                                    ].map((link, index) => (
                                        <Link
                                            key={link.to}
                                            to={link.to}
                                            className="flex items-center justify-between px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-blue-600 transition-all duration-300 transform hover:translate-x-2"
                                            style={{ animationDelay: `${index * 0.1}s` }}
                                            aria-label={link.label}
                                        >
                                            <span>{link.label}</span>
                                            <ArrowRight className="w-5 h-5" />
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminDashboard;