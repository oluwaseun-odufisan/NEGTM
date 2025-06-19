import React, { useState } from 'react';
import {
    Clock,
    Users,
    Target,
    Search,
    BarChart2,
    TrendingUp,
    HardDrive,
} from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

// Mock analytics data (replace with backend API call)
const analyticsData = {
    avgTaskCompletionTime: '3.5 days',
    topPerformers: [
        { user: 'Jane Smith', tasksCompleted: 20 },
        { user: 'John Doe', tasksCompleted: 15 },
        { user: 'Alice Johnson', tasksCompleted: 10 },
    ],
    goalCompletionRate: 58,
    taskCompletionOverTime: {
        labels: ['Jun 1', 'Jun 5', 'Jun 10', 'Jun 15', 'Jun 20'],
        datasets: [
            {
                label: 'Tasks Completed',
                data: [10, 15, 20, 18, 25],
                borderColor: '#00CED1',
                backgroundColor: 'rgba(0, 206, 209, 0.2)',
                fill: true,
            },
        ],
    },
    userActivityByDepartment: {
        labels: ['Engineering', 'Marketing', 'Sales', 'HR'],
        datasets: [
            {
                label: 'User Actions',
                data: [150, 100, 80, 50],
                backgroundColor: '#00CED1',
            },
            {
                label: 'Tasks Completed',
                data: [50, 30, 20, 10],
                backgroundColor: '#1E90FF',
            },
        ],
    },
    storageUsageTrends: {
        labels: ['Jun 1', 'Jun 5', 'Jun 10', 'Jun 15', 'Jun 20'],
        datasets: [
            {
                label: 'Storage Used (GB)',
                data: [5.0, 5.5, 6.2, 7.0, 7.5],
                borderColor: '#1E90FF',
                backgroundColor: 'rgba(30, 144, 255, 0.2)',
                fill: true,
            },
        ],
    },
};

const departments = ['All Departments', 'Engineering', 'Marketing', 'Sales', 'HR'];
const availableUsers = ['All Users', 'John Doe', 'Jane Smith', 'Alice Johnson'];

const AdminAnalytics = () => {
    const [dateRange, setDateRange] = useState('Last 30 Days');
    const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
    const [selectedUser, setSelectedUser] = useState('All Users');
    const [isLoading, setIsLoading] = useState(false);

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
        interaction: {
            mode: 'index',
            intersect: false,
        },
    };

    // Handle filter changes (mocked)
    const handleFilterChange = () => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
        }, 500);
    };

    return (
        <div className="p-6 bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl max-w-7xl mx-auto animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-teal-600">Analytics</h2>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search analytics..."
                        className="pl-10 pr-4 py-2 rounded-full border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700 w-64"
                        aria-label="Search analytics"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-600" size={18} />
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
                <select
                    value={dateRange}
                    onChange={(e) => { setDateRange(e.target.value); handleFilterChange(); }}
                    className="p-2 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700"
                    aria-label="Select date range"
                >
                    <option value="Last 7 Days">Last 7 Days</option>
                    <option value="Last 30 Days">Last 30 Days</option>
                    <option value="Last 90 Days">Last 90 Days</option>
                    <option value="Custom">Custom</option>
                </select>
                <select
                    value={selectedDepartment}
                    onChange={(e) => { setSelectedDepartment(e.target.value); handleFilterChange(); }}
                    className="p-2 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700"
                    aria-label="Select department"
                >
                    {departments.map((dept) => (
                        <option key={dept} value={dept}>
                            {dept}
                        </option>
                    ))}
                </select>
                <select
                    value={selectedUser}
                    onChange={(e) => { setSelectedUser(e.target.value); handleFilterChange(); }}
                    className="p-2 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700"
                    aria-label="Select user"
                >
                    {availableUsers.map((user) => (
                        <option key={user} value={user}>
                            {user}
                        </option>
                    ))}
                </select>
            </div>

            {/* Analytics Widgets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {/* Average Task Completion Time */}
                <div className="bg-teal-600 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 animate-slide-in">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold">Avg Task Completion</h3>
                            <p className="text-3xl font-bold">{analyticsData.avgTaskCompletionTime}</p>
                        </div>
                        <Clock className="w-10 h-10 opacity-80 animate-pulse-slow" />
                    </div>
                </div>
                {/* Top Performers */}
                <div className="bg-blue-600 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 animate-slide-in" style={{ animationDelay: '0.1s' }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold">Top Performers</h3>
                            <ul className="text-sm">
                                {analyticsData.topPerformers.map((performer) => (
                                    <li key={performer.user}>
                                        {performer.user}: {performer.tasksCompleted} tasks
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <Users className="w-10 h-10 opacity-80 animate-pulse-slow-delayed" />
                    </div>
                </div>
                {/* Goal Completion Rate */}
                <div className="bg-teal-600 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 animate-slide-in" style={{ animationDelay: '0.2s' }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold">Goal Completion Rate</h3>
                            <p className="text-3xl font-bold">{analyticsData.goalCompletionRate}%</p>
                        </div>
                        <Target className="w-10 h-10 opacity-80 animate-pulse-slow" />
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Task Completion Over Time */}
                <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg animate-fade-in">
                    <h3 className="text-lg font-semibold text-teal-700 flex items-center mb-4">
                        <TrendingUp className="w-5 h-5 mr-2" />
                        Task Completion Over Time
                    </h3>
                    <div className="h-64">
                        <Line data={analyticsData.taskCompletionOverTime} options={chartOptions} />
                    </div>
                </div>
                {/* User Activity by Department */}
                <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    <h3 className="text-lg font-semibold text-teal-700 flex items-center mb-4">
                        <BarChart2 className="w-5 h-5 mr-2" />
                        User Activity by Department
                    </h3>
                    <div className="h-64">
                        <Bar data={analyticsData.userActivityByDepartment} options={chartOptions} />
                    </div>
                </div>
                {/* Storage Usage Trends */}
                <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    <h3 className="text-lg font-semibold text-teal-700 flex items-center mb-4">
                        <HardDrive className="w-5 h-5 mr-2" />
                        Storage Usage Trends
                    </h3>
                    <div className="h-64">
                        <Line data={analyticsData.storageUsageTrends} options={chartOptions} />
                    </div>
                </div>
            </div>

            {isLoading && (
                <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
                    <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                </div>
            )}
        </div>
    );
};

export default AdminAnalytics;