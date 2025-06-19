import React, { useState } from 'react';
import {
    Target,
    User,
    CheckCircle,
    Calendar,
    Search,
    ChevronUp,
    ChevronDown,
    Edit,
    Check,
    Trash2,
    Download,
    PieChart,
    BarChart2,
} from 'lucide-react';
import { Pie, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    BarElement,
    CategoryScale,
    LinearScale,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

// Mock goal data (replace with backend API call)
const initialGoals = [
    {
        id: '1',
        title: 'Customer Retention',
        users: ['John Doe', 'Jane Smith'],
        status: 'Approved',
        completion: 60,
        deadline: '2025-12-31',
    },
    {
        id: '2',
        title: 'Product Launch',
        users: ['Alice Johnson'],
        status: 'Pending',
        completion: 85,
        deadline: '2025-09-30',
    },
    {
        id: '3',
        title: 'Team Productivity',
        users: ['Company-Wide'],
        status: 'Approved',
        completion: 30,
        deadline: '2025-11-15',
    },
    {
        id: '4',
        title: 'Market Expansion',
        users: ['Bob Wilson'],
        status: 'Draft',
        completion: 10,
        deadline: '2026-03-31',
    },
];

// Mock chart data
const goalCompletionData = {
    labels: ['0-25%', '26-50%', '51-75%', '76-100%'],
    datasets: [
        {
            data: [1, 1, 1, 1], // Mock counts
            backgroundColor: ['#FF6347', '#FFD700', '#00CED1', '#1E90FF'],
            borderColor: '#FFFFFF',
            borderWidth: 2,
        },
    ],
};

const goalsByStatusData = {
    labels: ['Approved', 'Pending', 'Draft'],
    datasets: [
        {
            label: 'Goals',
            data: [2, 1, 1], // Mock counts
            backgroundColor: '#00CED1',
        },
    ],
};

// Mock available filters
const availableUsers = ['All Users', 'John Doe', 'Jane Smith', 'Alice Johnson', 'Bob Wilson', 'Company-Wide'];
const availableStatuses = ['All Statuses', 'Approved', 'Pending', 'Draft'];

const AdminGoalOverview = () => {
    const [goals, setGoals] = useState(initialGoals);
    const [selectedGoals, setSelectedGoals] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterUser, setFilterUser] = useState('All Users');
    const [filterStatus, setFilterStatus] = useState('All Statuses');
    const [sortConfig, setSortConfig] = useState({ key: '', direction: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const goalsPerPage = 5;

    // Chart options
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

    const barChartOptions = {
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

    // Handle sorting
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });

        const sortedGoals = [...goals].sort((a, b) => {
            if (key === 'completion') {
                return direction === 'asc' ? a[key] - b[key] : b[key] - a[key];
            } else if (key === 'users') {
                return direction === 'asc'
                    ? a[key].join(', ').localeCompare(b[key].join(', '))
                    : b[key].join(', ').localeCompare(a[key].join(', '));
            }
            return direction === 'asc'
                ? a[key].localeCompare(b[key])
                : b[key].localeCompare(a[key]);
        });
        setGoals(sortedGoals);
    };

    // Handle search and filters
    const filteredGoals = goals.filter(
        (goal) =>
            (goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                goal.users.some((user) => user.toLowerCase().includes(searchQuery.toLowerCase()))) &&
            (filterUser !== 'All Users' ? goal.users.includes(filterUser) : true) &&
            (filterStatus !== 'All Statuses' ? goal.status === filterStatus : true)
    );

    // Pagination logic
    const totalPages = Math.ceil(filteredGoals.length / goalsPerPage);
    const paginatedGoals = filteredGoals.slice(
        (currentPage - 1) * goalsPerPage,
        currentPage * goalsPerPage
    );

    // Handle bulk selection
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedGoals(paginatedGoals.map((goal) => goal.id));
        } else {
            setSelectedGoals([]);
        }
    };

    const handleSelectGoal = (id) => {
        setSelectedGoals((prev) =>
            prev.includes(id) ? prev.filter((goalId) => goalId !== id) : [...prev, id]
        );
    };

    // Handle bulk actions
    const handleBulkAction = (action) => {
        setIsLoading(true);
        setError('');
        setSuccess('');
        setTimeout(() => {
            if (selectedGoals.length === 0) {
                setError('No goals selected.');
                setIsLoading(false);
                return;
            }
            if (action === 'approve') {
                setGoals((prev) =>
                    prev.map((goal) =>
                        selectedGoals.includes(goal.id) ? { ...goal, status: 'Approved' } : goal
                    )
                );
                setSuccess('Selected goals approved successfully!');
            } else if (action === 'delete') {
                setGoals((prev) => prev.filter((goal) => !selectedGoals.includes(goal.id)));
                setSuccess('Selected goals deleted successfully!');
            }
            setSelectedGoals([]);
            setIsLoading(false);
        }, 1000);
    };

    // Handle individual actions
    const handleCreate = () => {
        console.log('Creating new goal'); // Replace with modal or form logic
        setSuccess('Initiated goal creation!');
    };

    const handleEdit = (goal) => {
        console.log(`Editing goal: ${goal.title}`); // Replace with modal or form logic
        setSuccess(`Initiated edit for ${goal.title}!`);
    };

    const handleApprove = (id) => {
        setIsLoading(true);
        setTimeout(() => {
            setGoals((prev) =>
                prev.map((goal) =>
                    goal.id === id ? { ...goal, status: 'Approved' } : goal
                )
            );
            setSuccess('Goal approved successfully!');
            setIsLoading(false);
        }, 1000);
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this goal?')) {
            setIsLoading(true);
            setTimeout(() => {
                setGoals((prev) => prev.filter((goal) => goal.id !== id));
                setSuccess('Goal deleted successfully!');
                setIsLoading(false);
            }, 1000);
        }
    };

    // Handle export
    const handleExport = (format) => {
        if (filteredGoals.length === 0) {
            setError('No goals to export.');
            return;
        }
        setIsLoading(true);
        setTimeout(() => {
            if (format === 'csv') {
                const csvHeaders = ['title', 'users', 'status', 'completion', 'deadline'];
                const csvRows = filteredGoals.map((goal) =>
                    csvHeaders.map((header) =>
                        header === 'users' ? `"${goal[header].join(', ')}"` : `"${goal[header]}"`
                    ).join(',')
                );
                const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `goal_overview_${Date.now()}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else if (format === 'pdf') {
                console.log('PDF export initiated'); // Replace with PDF generation logic (e.g., jsPDF)
                setSuccess('PDF export initiated! (Placeholder)');
            }
            setSuccess(`Goals exported as ${format.toUpperCase()} successfully!`);
            setIsLoading(false);
        }, 1000);
    };

    return (
        <div className="p-6 bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl max-w-7xl mx-auto animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-teal-600">Goal Overview</h2>
                <div className="flex space-x-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search goals..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 rounded-full border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700 w-64"
                            aria-label="Search goals"
                        />
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-600" size={18} />
                    </div>
                    <button
                        onClick={handleCreate}
                        className="px-4 py-2 rounded-lg bg-teal-600 text-white flex items-center hover:bg-teal-700 transition-all duration-300"
                        aria-label="Create new goal"
                        disabled={isLoading}
                    >
                        <Target className="w-5 h-5 mr-2" />
                        Create Goal
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-4">
                <select
                    value={filterUser}
                    onChange={(e) => setFilterUser(e.target.value)}
                    className="p-2 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700"
                    aria-label="Filter by user"
                >
                    {availableUsers.map((user) => (
                        <option key={user} value={user}>
                            {user}
                        </option>
                    ))}
                </select>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="p-2 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700"
                    aria-label="Filter by status"
                >
                    {availableStatuses.map((status) => (
                        <option key={status} value={status}>
                            {status}
                        </option>
                    ))}
                </select>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg animate-fade-in">
                    <h3 className="text-lg font-semibold text-teal-700 flex items-center mb-4">
                        <PieChart className="w-5 h-5 mr-2" />
                        Goal Completion Rates
                    </h3>
                    <div className="h-64 flex justify-center">
                        <Pie data={goalCompletionData} options={pieChartOptions} />
                    </div>
                </div>
                <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    <h3 className="text-lg font-semibold text-teal-700 flex items-center mb-4">
                        <BarChart2 className="w-5 h-5 mr-2" />
                        Goals by Status
                    </h3>
                    <div className="h-64">
                        <Bar data={goalsByStatusData} options={barChartOptions} />
                    </div>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedGoals.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4 animate-slide-in">
                    <button
                        onClick={() => handleBulkAction('approve')}
                        className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-all duration-300"
                        disabled={isLoading}
                        aria-label="Approve selected goals"
                    >
                        Approve
                    </button>
                    <button
                        onClick={() => handleBulkAction('delete')}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300"
                        disabled={isLoading}
                        aria-label="Delete selected goals"
                    >
                        Delete
                    </button>
                </div>
            )}

            {/* Success/Error Messages */}
            {error && (
                <div className="text-red-500 text-sm text-center animate-shake mb-4">
                    {error}
                </div>
            )}
            {success && (
                <div className="text-teal-600 text-sm text-center animate-fade-in mb-4">
                    {success}
                </div>
            )}

            {/* Export Options */}
            <div className="flex space-x-4 mb-6">
                <button
                    onClick={() => handleExport('csv')}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white flex items-center hover:bg-blue-700 transition-all duration-300"
                    disabled={isLoading}
                    aria-label="Export as CSV"
                >
                    <Download className="w-5 h-5 mr-2" />
                    Export CSV
                </button>
                <button
                    onClick={() => handleExport('pdf')}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white flex items-center hover:bg-blue-700 transition-all duration-300"
                    disabled={isLoading}
                    aria-label="Export as PDF"
                >
                    <Download className="w-5 h-5 mr-2" />
                    Export PDF
                </button>
            </div>

            {/* Goal Table */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-teal-50">
                            <th className="p-3">
                                <input
                                    type="checkbox"
                                    checked={selectedGoals.length === paginatedGoals.length && paginatedGoals.length > 0}
                                    onChange={handleSelectAll}
                                    className="h-4 w-4 text-teal-600 focus:ring-teal-400"
                                    aria-label="Select all goals"
                                />
                            </th>
                            {['title', 'users', 'status', 'completion', 'deadline'].map((key) => (
                                <th
                                    key={key}
                                    className="p-3 text-left text-teal-700 cursor-pointer hover:text-teal-900 transition-colors"
                                    onClick={() => handleSort(key)}
                                    aria-sort={sortConfig.key === key ? sortConfig.direction : 'none'}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                                        {sortConfig.key === key &&
                                            (sortConfig.direction === 'asc' ? (
                                                <ChevronUp size={16} />
                                            ) : (
                                                <ChevronDown size={16} />
                                            ))}
                                    </div>
                                </th>
                            ))}
                            <th className="p-3 text-left text-teal-700">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedGoals.map((goal) => (
                            <tr
                                key={goal.id}
                                className="border-b border-teal-100 hover:bg-teal-50 transition-all duration-200"
                            >
                                <td className="p-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedGoals.includes(goal.id)}
                                        onChange={() => handleSelectGoal(goal.id)}
                                        className="h-4 w-4 text-teal-600 focus:ring-teal-400"
                                        aria-label={`Select ${goal.title}`}
                                    />
                                </td>
                                <td className="p-3 text-gray-700">{goal.title}</td>
                                <td className="p-3 text-gray-700">{goal.users.join(', ')}</td>
                                <td className="p-3 text-gray-700">
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs ${goal.status === 'Approved'
                                                ? 'bg-teal-100 text-teal-700'
                                                : goal.status === 'Pending'
                                                    ? 'bg-yellow-100 text-yellow-700'
                                                    : 'bg-blue-100 text-blue-700'
                                            }`}
                                    >
                                        {goal.status}
                                    </span>
                                </td>
                                <td className="p-3 text-gray-700">
                                    <div className="flex items-center">
                                        <div className="w-24 bg-gray-200 rounded-full h-2.5 mr-2">
                                            <div
                                                className="bg-teal-600 h-2.5 rounded-full transition-all duration-300"
                                                style={{ width: `${goal.completion}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-xs text-gray-600">{goal.completion}%</span>
                                    </div>
                                </td>
                                <td className="p-3 text-gray-700">{goal.deadline}</td>
                                <td className="p-3 flex space-x-2">
                                    <button
                                        onClick={() => handleEdit(goal)}
                                        className="p-2 rounded-full bg-teal-600 text-white hover:bg-teal-700 transition-all duration-300"
                                        aria-label={`Edit ${goal.title}`}
                                        disabled={isLoading}
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleApprove(goal.id)}
                                        className="p-2 rounded-full bg-teal-600 text-white hover:bg-teal-700 transition-all duration-300"
                                        aria-label={`Approve ${goal.title}`}
                                        disabled={isLoading || goal.status === 'Approved'}
                                    >
                                        <Check size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(goal.id)}
                                        className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300"
                                        aria-label={`Delete ${goal.title}`}
                                        disabled={isLoading}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-gray-600">
                    Showing {(currentPage - 1) * goalsPerPage + 1} to{' '}
                    {Math.min(currentPage * goalsPerPage, filteredGoals.length)} of {filteredGoals.length}{' '}
                    goals
                </p>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 rounded-lg bg-teal-600 text-white disabled:opacity-50 hover:bg-teal-700 transition-all duration-300"
                        aria-label="Previous page"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 rounded-lg bg-teal-600 text-white disabled:opacity-50 hover:bg-teal-700 transition-all duration-300"
                        aria-label="Next page"
                    >
                        Next
                    </button>
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

export default AdminGoalOverview;