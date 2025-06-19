import React, { useState } from 'react';
import {
    FileText,
    User,
    CheckCircle,
    Star,
    Calendar,
    Percent,
    Edit,
    Users,
    Trash2,
    Search,
    ChevronUp,
    ChevronDown,
    Save,
    X,
} from 'lucide-react';

// Mock task data (replace with backend API call)
const initialTasks = [
    {
        id: '1',
        title: 'Complete Project Proposal',
        assignedUser: 'John Doe',
        status: 'Pending',
        priority: 'High',
        dueDate: '2025-06-20',
        progress: 75,
    },
    {
        id: '2',
        title: 'Review Marketing Plan',
        assignedUser: 'Jane Smith',
        status: 'Completed',
        priority: 'Medium',
        dueDate: '2025-06-15',
        progress: 100,
    },
    {
        id: '3',
        title: 'Update Website Content',
        assignedUser: 'Alice Johnson',
        status: 'Pending',
        priority: 'Low',
        dueDate: '2025-06-25',
        progress: 20,
    },
];

// Mock user data for reassignment (replace with backend API call)
const availableUsers = ['John Doe', 'Jane Smith', 'Alice Johnson'];

const AdminTaskManagement = () => {
    const [tasks, setTasks] = useState(initialTasks);
    const [selectedTasks, setSelectedTasks] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterPriority, setFilterPriority] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: '', direction: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editTask, setEditTask] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const tasksPerPage = 5;

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
            if (a[key].toLowerCase() < b[key].toLowerCase()) return direction === 'asc' ? -1 : 1;
            if (a[key].toLowerCase() > b[key].toLowerCase()) return direction === 'asc' ? 1 : -1;
            return 0;
        });
        setTasks(sortedTasks);
    };

    // Handle search and filters
    const filteredTasks = tasks.filter(
        (task) =>
            (task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.assignedUser.toLowerCase().includes(searchQuery.toLowerCase())) &&
            (filterStatus ? task.status === filterStatus : true) &&
            (filterPriority ? task.priority === filterPriority : true)
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
    const handleBulkAction = (action, value = null) => {
        setIsLoading(true);
        setTimeout(() => {
            if (action === 'setStatus') {
                setTasks((prev) =>
                    prev.map((task) =>
                        selectedTasks.includes(task.id) ? { ...task, status: value } : task
                    )
                );
                setSuccess(`Selected tasks set to ${value} successfully!`);
            } else if (action === 'reassign') {
                setTasks((prev) =>
                    prev.map((task) =>
                        selectedTasks.includes(task.id) ? { ...task, assignedUser: value } : task
                    )
                );
                setSuccess(`Selected tasks reassigned to ${value} successfully!`);
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
        setEditTask({ ...task, adminNotes: task.adminNotes || '' });
        setIsEditModalOpen(true);
        setError('');
        setSuccess('');
    };

    const handleReassign = (id, newUser) => {
        setIsLoading(true);
        setTimeout(() => {
            setTasks((prev) =>
                prev.map((task) =>
                    task.id === id ? { ...task, assignedUser: newUser } : task
                )
            );
            setSuccess(`Task reassigned to ${newUser} successfully!`);
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

    // Handle edit form submission
    const handleEditSubmit = (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Mock validation
        if (!editTask.title || editTask.title.length < 3) {
            setError('Task title must be at least 3 characters long.');
            setIsLoading(false);
            return;
        }
        if (!editTask.assignedUser) {
            setError('Please select an assigned user.');
            setIsLoading(false);
            return;
        }
        if (!editTask.status) {
            setError('Please select a status.');
            setIsLoading(false);
            return;
        }
        if (!editTask.priority) {
            setError('Please select a priority.');
            setIsLoading(false);
            return;
        }
        if (!editTask.dueDate) {
            setError('Please select a due date.');
            setIsLoading(false);
            return;
        }
        if (editTask.progress < 0 || editTask.progress > 100) {
            setError('Progress must be between 0 and 100.');
            setIsLoading(false);
            return;
        }

        // Simulate API call
        setTimeout(() => {
            setTasks((prev) =>
                prev.map((task) => (task.id === editTask.id ? editTask : task))
            );
            setSuccess('Task updated successfully!');
            setIsEditModalOpen(false);
            setEditTask(null);
            setIsLoading(false);
        }, 1000);
    };

    return (
        <div className="p-6 bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl max-w-7xl mx-auto relative animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-teal-600">Task Management</h2>
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
            <div className="flex space-x-4 mb-4">
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="p-2 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700"
                    aria-label="Filter by status"
                >
                    <option value="">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                </select>
                <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="p-2 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700"
                    aria-label="Filter by priority"
                >
                    <option value="">All Priorities</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                </select>
            </div>

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

            {/* Bulk Actions */}
            {selectedTasks.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4 animate-slide-in">
                    <button
                        onClick={() => handleBulkAction('setStatus', 'Completed')}
                        className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-all duration-300"
                        disabled={isLoading}
                    >
                        Mark Completed
                    </button>
                    <button
                        onClick={() => handleBulkAction('setStatus', 'Pending')}
                        className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-all duration-300"
                        disabled={isLoading}
                    >
                        Mark Pending
                    </button>
                    <select
                        onChange={(e) => handleBulkAction('reassign', e.target.value)}
                        className="p-2 rounded-lg border border-teal-200 bg-white text-gray-700"
                        aria-label="Reassign selected tasks"
                        disabled={isLoading}
                    >
                        <option value="">Reassign To...</option>
                        {availableUsers.map((user) => (
                            <option key={user} value={user}>
                                {user}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={() => handleBulkAction('delete')}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300"
                        disabled={isLoading}
                    >
                        Delete
                    </button>
                </div>
            )}

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
                            {['title', 'assignedUser', 'status', 'priority', 'dueDate', 'progress'].map((key) => (
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
                                <td className="p-3 text-gray-700">{task.assignedUser}</td>
                                <td className="p-3 text-gray-700">
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs ${task.status === 'Completed' ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700'
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
                                    <div className="w-24 bg-gray-200 rounded-full h-2.5">
                                        <div
                                            className="bg-teal-600 h-2.5 rounded-full transition-all duration-300"
                                            style={{ width: `${task.progress}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-xs text-gray-600 ml-2">{task.progress}%</span>
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
                                    <select
                                        onChange={(e) => handleReassign(task.id, e.target.value)}
                                        className="p-2 rounded-full bg-teal-600 text-white hover:bg-teal-700 text-xs"
                                        aria-label={`Reassign ${task.title}`}
                                        disabled={isLoading}
                                    >
                                        <option value="">Reassign</option>
                                        {availableUsers.map((user) => (
                                            <option key={user} value={user}>
                                                {user}
                                            </option>
                                        ))}
                                    </select>
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

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 w-full max-w-md transform transition-all duration-500 hover:scale-105">
                        <h3 className="text-xl font-bold text-teal-600 mb-4">Edit Task</h3>
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div className="relative">
                                <label htmlFor="title" className="sr-only">
                                    Task Title
                                </label>
                                <div className="flex items-center border border-teal-200 rounded-lg focus-within:ring-2 focus-within:ring-teal-400 transition-all duration-300">
                                    <FileText className="w-5 h-5 text-teal-600 ml-3" />
                                    <input
                                        type="text"
                                        id="title"
                                        value={editTask.title}
                                        onChange={(e) => setEditTask({ ...editTask, title: e.target.value })}
                                        placeholder="Enter task title"
                                        className="w-full p-3 bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
                                        aria-label="Task title"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="relative">
                                <label htmlFor="assignedUser" className="sr-only">
                                    Assigned User
                                </label>
                                <div className="flex items-center border border-teal-200 rounded-lg focus-within:ring-2 focus-within:ring-teal-400 transition-all duration-300">
                                    <User className="w-5 h-5 text-teal-600 ml-3" />
                                    <select
                                        id="assignedUser"
                                        value={editTask.assignedUser}
                                        onChange={(e) => setEditTask({ ...editTask, assignedUser: e.target.value })}
                                        className="w-full p-3 bg-transparent focus:outline-none text-gray-700 appearance-none"
                                        aria-label="Select assigned user"
                                        required
                                    >
                                        <option value="">Select User</option>
                                        {availableUsers.map((user) => (
                                            <option key={user} value={user}>
                                                {user}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="relative">
                                <label htmlFor="status" className="sr-only">
                                    Status
                                </label>
                                <div className="flex items-center border border-teal-200 rounded-lg focus-within:ring-2 focus-within:ring-teal-400 transition-all duration-300">
                                    <CheckCircle className="w-5 h-5 text-teal-600 ml-3" />
                                    <select
                                        id="status"
                                        value={editTask.status}
                                        onChange={(e) => setEditTask({ ...editTask, status: e.target.value })}
                                        className="w-full p-3 bg-transparent focus:outline-none text-gray-700 appearance-none"
                                        aria-label="Select status"
                                        required
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                </div>
                            </div>
                            <div className="relative">
                                <label htmlFor="priority" className="sr-only">
                                    Priority
                                </label>
                                <div className="flex items-center border border-teal-200 rounded-lg focus-within:ring-2 focus-within:ring-teal-400 transition-all duration-300">
                                    <Star className="w-5 h-5 text-teal-600 ml-3" />
                                    <select
                                        id="priority"
                                        value={editTask.priority}
                                        onChange={(e) => setEditTask({ ...editTask, priority: e.target.value })}
                                        className="w-full p-3 bg-transparent focus:outline-none text-gray-700 appearance-none"
                                        aria-label="Select priority"
                                        required
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                    </select>
                                </div>
                            </div>
                            <div className="relative">
                                <label htmlFor="dueDate" className="sr-only">
                                    Due Date
                                </label>
                                <div className="flex items-center border border-teal-200 rounded-lg focus-within:ring-2 focus-within:ring-teal-400 transition-all duration-300">
                                    <Calendar className="w-5 h-5 text-teal-600 ml-3" />
                                    <input
                                        type="date"
                                        id="dueDate"
                                        value={editTask.dueDate}
                                        onChange={(e) => setEditTask({ ...editTask, dueDate: e.target.value })}
                                        className="w-full p-3 bg-transparent focus:outline-none text-gray-700"
                                        aria-label="Due date"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="relative">
                                <label htmlFor="progress" className="sr-only">
                                    Progress
                                </label>
                                <div className="flex items-center border border-teal-200 rounded-lg focus-within:ring-2 focus:within:ring-teal-400 transition-all duration-300">
                                    <Percent className="w-5 h-5 text-teal-600 ml-3" />
                                    <input
                                        type="number"
                                        id="progress"
                                        value={editTask.progress}
                                        onChange={(e) => setEditTask({ ...editTask, progress: parseInt(e.target.value) })}
                                        placeholder="Enter progress (0-100)"
                                        className="w-full p-3 bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
                                        aria-label="Progress percentage"
                                        min="0"
                                        max="100"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="relative">
                                <label htmlFor="adminNotes" className="sr-only">
                                    Admin Notes
                                </label>
                                <div className="flex items-center border border-teal-200 rounded-lg focus-within:ring-2 focus:within:ring-teal-400 transition-all duration-300">
                                    <FileText className="w-5 h-5 text-teal-600 ml-3" />
                                    <textarea
                                        id="adminNotes"
                                        value={editTask.adminNotes}
                                        onChange={(e) => setEditTask({ ...editTask, adminNotes: e.target.value })}
                                        placeholder="Enter admin notes"
                                        className="w-full p-3 bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
                                        aria-label="Admin notes"
                                        rows="4"
                                    />
                                </div>
                            </div>
                            <div className="flex space-x-4">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`w-full py-3 rounded-lg bg-teal-600 text-white font-semibold flex items-center justify-center transition-all duration-300 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-teal-700 hover:shadow-lg'
                                        }`}
                                    aria-label="Save task"
                                >
                                    {isLoading ? (
                                        <div className="flex items-center space-x-2">
                                            <div className="w-5 h-5 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                                            <span>Saving...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5 mr-2" />
                                            Save
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        setIsEditModalOpen(false);
                                        setEditTask(null);
                                        setError('');
                                        setSuccess('');
                                    }}
                                    className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 hover:shadow-lg transition-all duration-300"
                                    aria-label="Cancel"
                                >
                                    <X className="w-5 h-5 mr-2 inline" />
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminTaskManagement;