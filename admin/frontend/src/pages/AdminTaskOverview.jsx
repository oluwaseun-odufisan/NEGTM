import React, { useState } from 'react';
import {
    FileText,
    User,
    Tag,
    Calendar,
    Clock,
    Search,
    ChevronUp,
    ChevronDown,
    Edit,
    Users,
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

// Mock task data (replace with backend API call)
const initialTasks = [
    {
        id: '1',
        title: 'Project Proposal',
        user: 'John Doe',
        status: 'Completed',
        priority: 'High',
        dueDate: '2025-06-20',
        progress: 100,
    },
    {
        id: '2',
        title: 'Marketing Plan',
        user: 'Jane Smith',
        status: 'In Progress',
        priority: 'Medium',
        dueDate: '2025-06-25',
        progress: 75,
    },
    {
        id: '3',
        title: 'Website Update',
        user: 'Alice Johnson',
        status: 'Pending',
        priority: 'Low',
        dueDate: '2025-06-30',
        progress: 20,
    },
    {
        id: '4',
        title: 'Customer Feedback Analysis',
        user: 'Bob Wilson',
        status: 'Overdue',
        priority: 'High',
        dueDate: '2025-06-15',
        progress: 50,
    },
];

// Mock chart data
const taskStatusData = {
    labels: ['Completed', 'In Progress', 'Pending', 'Overdue'],
    datasets: [
        {
            data: [1, 1, 1, 1], // Mock counts
            backgroundColor: ['#00CED1', '#1E90FF', '#FFD700', '#FF6347'],
            borderColor: '#FFFFFF',
            borderWidth: 2,
        },
    ],
};

const overdueTasksData = {
    labels: ['John Doe', 'Jane Smith', 'Alice Johnson', 'Bob Wilson'],
    datasets: [
        {
            label: 'Overdue Tasks',
            data: [0, 0, 0, 1], // Mock counts
            backgroundColor: '#FF6347',
        },
    ],
};

// Mock available filters
const availableUsers = ['All Users', 'John Doe', 'Jane Smith', 'Alice Johnson', 'Bob Wilson'];
const availableStatuses = ['All Statuses', 'Completed', 'In Progress', 'Pending', 'Overdue'];
const availablePriorities = ['All Priorities', 'High', 'Medium', 'Low'];

const AdminTaskOverview = () => {
    const [tasks, setTasks] = useState(initialTasks);
    const [selectedTasks, setSelectedTasks] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterUser, setFilterUser] = useState('All Users');
    const [filterStatus, setFilterStatus] = useState('All Statuses');
    const [filterPriority, setFilterPriority] = useState('All Priorities');
    const [sortConfig, setSortConfig] = useState({ key: '', direction: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const tasksPerPage = 5;

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

        const sortedTasks = [...tasks].sort((a, b) => {
            if (key === 'progress') {
                return direction === 'asc' ? a[key] - b[key] : b[key] - a[key];
            }
            return direction === 'asc'
                ? a[key].localeCompare(b[key])
                : b[key].localeCompare(a[key]);
        });
        setTasks(sortedTasks);
    };

    // Handle search and filters
    const filteredTasks = tasks.filter(
        (task) =>
            (task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.user.toLowerCase().includes(searchQuery.toLowerCase())) &&
            (filterUser !== 'All Users' ? task.user === filterUser : true) &&
            (filterStatus !== 'All Statuses' ? task.status === filterStatus : true) &&
            (filterPriority !== 'All Priorities' ? task.priority === filterPriority : true)
    );

    // Pagination logic
    const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);
    const paginatedTasks = filteredTasks.slice(
        (currentPage - 1) * tasksPerPage,
        currentPage * tasksPerPage
    );

    // Handle bulk selection
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedTasks(paginatedTasks.map((task) => task.id));
        } else {
            setSelectedTasks([]);
        }
    };

    const handleSelectTask = (id) => {
        setSelectedTasks((prev) =>
            prev.includes(id) ? prev.filter((taskId) => taskId !== id) : [...prev, id]
        );
    };

    // Handle bulk actions
    const handleBulkAction = (action, value) => {
        setIsLoading(true);
        setError('');
        setSuccess('');
        setTimeout(() => {
            if (selectedTasks.length === 0) {
                setError('No tasks selected.');
                setIsLoading(false);
                return;
            }
            if (action === 'reassign') {
                setTasks((prev) =>
                    prev.map((task) =>
                        selectedTasks.includes(task.id) ? { ...task, user: value } : task
                    )
                );
                setSuccess(`Reassigned selected tasks to ${value} successfully!`);
            } else if (action === 'changeStatus') {
                setTasks((prev) =>
                    prev.map((task) =>
                        selectedTasks.includes(task.id)
                            ? { ...task, status: value, progress: value === 'Completed' ? 100 : task.progress }
                            : task
                    )
                );
                setSuccess(`Updated status to ${value} for selected tasks successfully!`);
            } else if (action === 'delete') {
                setTasks((prev) => prev.filter((task) => !selectedTasks.includes(task.id)));
                setSuccess('Selected tasks deleted successfully!');
            }
            setSelectedTasks([]);
            setIsLoading(false);
        }, 1000);
    };

    // Handle individual actions
    const handleEdit = (task) => {
        console.log(`Editing task: ${task.title}`); // Replace with modal or form logic
        setSuccess(`Initiated edit for ${task.title}!`);
    };

    const handleReassign = (id, user) => {
        setIsLoading(true);
        setTimeout(() => {
            setTasks((prev) =>
                prev.map((task) =>
                    task.id === id ? { ...task, user } : task
                )
            );
            setSuccess(`Task reassigned to ${user} successfully!`);
            setIsLoading(false);
        }, 1000);
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            setIsLoading(true);
            setTimeout(() => {
                setTasks((prev) => prev.filter((task) => task.id !== id));
                setSuccess('Task deleted successfully!');
                setIsLoading(false);
            }, 1000);
        }
    };

    // Handle export
    const handleExport = (format) => {
        if (filteredTasks.length === 0) {
            setError('No tasks to export.');
            return;
        }
        setIsLoading(true);
        setTimeout(() => {
            if (format === 'csv') {
                const csvHeaders = ['title', 'user', 'status', 'priority', 'dueDate', 'progress'];
                const csvRows = filteredTasks.map((task) =>
                    csvHeaders.map((header) => `"${task[header]}"`).join(',')
                );
                const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `task_overview_${Date.now()}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else if (format === 'pdf') {
                console.log('PDF export initiated'); // Replace with PDF generation logic (e.g., jsPDF)
                setSuccess('PDF export initiated! (Placeholder)');
            }
            setSuccess(`Tasks exported as ${format.toUpperCase()} successfully!`);
            setIsLoading(false);
        }, 1000);
    };

    return (
        <div className="p-6 bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl max-w-7xl mx-auto animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-teal-600">Task Overview</h2>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search tasks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 rounded-full border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700 w-64"
                        aria-label="Search tasks"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-600" size={18} />
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
                <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="p-2 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700"
                    aria-label="Filter by priority"
                >
                    {availablePriorities.map((priority) => (
                        <option key={priority} value={priority}>
                            {priority}
                        </option>
                    ))}
                </select>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg animate-fade-in">
                    <h3 className="text-lg font-semibold text-teal-700 flex items-center mb-4">
                        <PieChart className="w-5 h-5 mr-2" />
                        Task Status Distribution
                    </h3>
                    <div className="h-64 flex justify-center">
                        <Pie data={taskStatusData} options={pieChartOptions} />
                    </div>
                </div>
                <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    <h3 className="text-lg font-semibold text-teal-700 flex items-center mb-4">
                        <BarChart2 className="w-5 h-5 mr-2" />
                        Overdue Tasks by User
                    </h3>
                    <div className="h-64">
                        <Bar data={overdueTasksData} options={barChartOptions} />
                    </div>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedTasks.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4 animate-slide-in">
                    <select
                        onChange={(e) => handleBulkAction('reassign', e.target.value)}
                        className="p-2 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700"
                        aria-label="Reassign selected tasks"
                        disabled={isLoading}
                    >
                        <option value="">Reassign To</option>
                        {availableUsers.slice(1).map((user) => (
                            <option key={user} value={user}>
                                {user}
                            </option>
                        ))}
                    </select>
                    <select
                        onChange={(e) => handleBulkAction('changeStatus', e.target.value)}
                        className="p-2 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700"
                        aria-label="Change status of selected tasks"
                        disabled={isLoading}
                    >
                        <option value="">Change Status</option>
                        <option value="Completed">Completed</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Pending">Pending</option>
                        <option value="Overdue">Overdue</option>
                    </select>
                    <button
                        onClick={() => handleBulkAction('delete')}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300"
                        disabled={isLoading}
                        aria-label="Delete selected tasks"
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

            {/* Task Table */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-teal-50">
                            <th className="p-3">
                                <input
                                    type="checkbox"
                                    checked={selectedTasks.length === paginatedTasks.length && paginatedTasks.length > 0}
                                    onChange={handleSelectAll}
                                    className="h-4 w-4 text-teal-600 focus:ring-teal-400"
                                    aria-label="Select all tasks"
                                />
                            </th>
                            {['title', 'user', 'status', 'priority', 'dueDate', 'progress'].map((key) => (
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
                        {paginatedTasks.map((task) => (
                            <tr
                                key={task.id}
                                className="border-b border-teal-100 hover:bg-teal-50 transition-all duration-200"
                            >
                                <td className="p-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedTasks.includes(task.id)}
                                        onChange={() => handleSelectTask(task.id)}
                                        className="h-4 w-4 text-teal-600 focus:ring-teal-400"
                                        aria-label={`Select ${task.title}`}
                                    />
                                </td>
                                <td className="p-3 text-gray-700">{task.title}</td>
                                <td className="p-3 text-gray-700">{task.user}</td>
                                <td className="p-3 text-gray-700">
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs ${task.status === 'Completed'
                                                ? 'bg-teal-100 text-teal-700'
                                                : task.status === 'Overdue'
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-blue-100 text-blue-700'
                                            }`}
                                    >
                                        {task.status}
                                    </span>
                                </td>
                                <td className="p-3 text-gray-700">
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs ${task.priority === 'High'
                                                ? 'bg-red-100 text-red-700'
                                                : task.priority === 'Medium'
                                                    ? 'bg-yellow-100 text-yellow-700'
                                                    : 'bg-green-100 text-green-700'
                                            }`}
                                    >
                                        {task.priority}
                                    </span>
                                </td>
                                <td className="p-3 text-gray-700">{task.dueDate}</td>
                                <td className="p-3 text-gray-700">
                                    <div className="flex items-center">
                                        <div className="w-24 bg-gray-200 rounded-full h-2.5 mr-2">
                                            <div
                                                className="bg-teal-600 h-2.5 rounded-full transition-all duration-300"
                                                style={{ width: `${task.progress}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-xs text-gray-600">{task.progress}%</span>
                                    </div>
                                </td>
                                <td className="p-3 flex space-x-2">
                                    <button
                                        onClick={() => handleEdit(task)}
                                        className="p-2 rounded-full bg-teal-600 text-white hover:bg-teal-700 transition-all duration-300"
                                        aria-label={`Edit ${task.title}`}
                                        disabled={isLoading}
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleReassign(task.id, availableUsers[Math.floor(Math.random() * (availableUsers.length - 1)) + 1])}
                                        className="p-2 rounded-full bg-teal-600 text-white hover:bg-teal-700 transition-all duration-300"
                                        aria-label={`Reassign ${task.title}`}
                                        disabled={isLoading}
                                    >
                                        <Users size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(task.id)}
                                        className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300"
                                        aria-label={`Delete ${task.title}`}
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
                    Showing {(currentPage - 1) * tasksPerPage + 1} to{' '}
                    {Math.min(currentPage * tasksPerPage, filteredTasks.length)} of {filteredTasks.length}{' '}
                    tasks
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

export default AdminTaskOverview;