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

// Register Chart.js components
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

// Mock dashboard data (replace with backend API call)
const dashboardData = {
    totalUsers: 42,
    activeTasks: { pending: 35, completed: 78 },
    goalsInProgress: [
        { title: 'Customer Retention', completion: 60 },
        { title: 'Product Launch', completion: 85 },
        { title: 'Team Productivity', completion: 30 },
    ],
    storage: {
        totalUsed: '7.5 GB',
        totalQuota: '50 GB',
        perUserQuota: '10 GB',
    },
    recentActivities: [
        { id: '1', user: 'John Doe', action: 'created Task "Project Proposal"', timestamp: '2025-06-17 15:30' },
        { id: '2', user: 'Jane Smith', action: 'completed Task "Marketing Plan"', timestamp: '2025-06-17 14:45' },
        { id: '3', user: 'Alice Johnson', action: 'uploaded File "team_photo.jpg"', timestamp: '2025-06-17 13:20' },
        { id: '4', user: 'Bob Wilson', action: 'updated Goal "Customer Retention"', timestamp: '2025-06-17 12:10' },
    ],
    taskCompletionData: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [
            {
                label: 'Completed Tasks',
                data: [20, 25, 30, 28],
                backgroundColor: '#00CED1',
            },
            {
                label: 'Pending Tasks',
                data: [15, 10, 12, 8],
                backgroundColor: '#1E90FF',
            },
        ],
    },
    userActivityData: {
        labels: ['Jun 1', 'Jun 5', 'Jun 10', 'Jun 15'],
        datasets: [
            {
                label: 'User Actions',
                data: [50, 75, 60, 90],
                borderColor: '#00CED1',
                backgroundColor: 'rgba(0, 206, 209, 0.2)',
                fill: true,
            },
        ],
    },
    goalProgressData: {
        labels: ['Customer Retention', 'Product Launch', 'Team Productivity'],
        datasets: [
            {
                data: [60, 85, 30],
                backgroundColor: ['#00CED1', '#1E90FF', '#FFD700'],
                borderColor: '#FFFFFF',
                borderWidth: 2,
            },
        ],
    },
};

const AdminDashboard = () => {
    const [isLoading, setIsLoading] = useState(true);

    // Simulate API call
    useEffect(() => {
        setTimeout(() => {
            setIsLoading(false);
        }, 1000);
    }, []);

    const storageUsedPercentage =
        (parseFloat(dashboardData.storage.totalUsed) / parseFloat(dashboardData.storage.totalQuota)) * 100;

    // Chart options
    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
                labels: { color: '#2D3748' },
            },
            tooltip: {
                backgroundColor: '#2D3748',
                titleColor: '#FFFFFF',
                bodyColor: '#FFFFFF',
            },
        },
        scales: {
            x: { ticks: { color: '#2D3748' } },
            y: { ticks: { color: '#2D3748' } },
        },
    };

    const pieChartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'right',
                labels: { color: '#2D3748' },
            },
            tooltip: {
                backgroundColor: '#2D3748',
                titleColor: '#FFFFFF',
                bodyColor: '#FFFFFF',
            },
        },
    };

    return (
        <div className="p-6 bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl max-w-7xl mx-auto animate-fade-in">
            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                </div>
            ) : (
                <>
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
                            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg animate-fade-in" style={{ animationDelay: '0.2s' }}>
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
                            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg animate-slide-in">
                                <h3 className="text-lg font-semibold text-teal-700 flex items-center mb-4">
                                    <Clock className="w-5 h-5 mr-2" />
                                    Recent Activity
                                </h3>
                                <ul className="space-y-4 max-h-96 overflow-y-auto pr-2">
                                    {dashboardData.recentActivities.map((activity) => (
                                        <li
                                            key={activity.id}
                                            className="flex items-start space-x-3 border-l-4 border-teal-600 pl-3 animate-fade-in"
                                            style={{ animationDelay: `${parseInt(activity.id) * 0.1}s` }}
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
                                        { to: '/admin/users', label: 'Manage Users' },
                                        { to: '/admin/tasks', label: 'Manage Tasks' },
                                        { to: '/admin/goals', label: 'Manage Goals' },
                                        { to: '/admin/files', label: 'Manage Files' },
                                        { to: '/admin/reports', label: 'View Reports' },
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