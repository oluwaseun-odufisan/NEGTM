import React, { useState } from 'react';
import {
    Target,
    User,
    CheckCircle,
    Percent,
    Calendar,
    Plus,
    Edit,
    Check,
    XCircle,
    Trash2,
    Search,
    ChevronUp,
    ChevronDown,
    Save,
    X,
    Users,
} from 'lucide-react';

// Mock goal data (replace with backend API call)
const initialGoals = [
    {
        id: '1',
        title: 'Increase Customer Retention by 15%',
        assignedUsers: ['John Doe', 'Jane Smith'],
        status: 'Pending',
        completion: 60,
        deadline: '2025-12-31',
        description: 'Implement new loyalty program.',
        adminComments: '',
    },
    {
        id: '2',
        title: 'Launch New Product Line',
        assignedUsers: ['Alice Johnson'],
        status: 'Approved',
        completion: 85,
        deadline: '2025-09-30',
        description: 'Develop and market new product category.',
        adminComments: 'On track, needs marketing boost.',
    },
    {
        id: '3',
        title: 'Improve Team Productivity',
        assignedUsers: ['Company-Wide'],
        status: 'Pending',
        completion: 30,
        deadline: '2025-11-15',
        description: 'Introduce agile methodologies.',
        adminComments: '',
    },
];

// Mock user data for assignment (replace with backend API call)
const availableUsers = ['John Doe', 'Jane Smith', 'Alice Johnson', 'Company-Wide'];

const AdminGoalManagement = () => {
    const [goals, setGoals] = useState(initialGoals);
    const [selectedGoals, setSelectedGoals] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterCompletion, setFilterCompletion] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: '', direction: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
    const [editGoal, setEditGoal] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const goalsPerPage = 5;

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
            }
            if (key === 'assignedUsers') {
                const aValue = a[key].join(', ');
                const bValue = b[key].join(', ');
                return direction === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
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
                goal.assignedUsers.some((user) =>
                    user.toLowerCase().includes(searchQuery.toLowerCase())
                )) &&
            (filterStatus ? goal.status === filterStatus : true) &&
            (filterCompletion
                ? filterCompletion === 'high'
                    ? goal.completion >= 70
                    : filterCompletion === 'medium'
                        ? goal.completion >= 30 && goal.completion < 70
                        : goal.completion < 30
                : true)
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
        setTimeout(() => {
            if (action === 'approve') {
                setGoals((prev) =>
                    prev.map((goal) =>
                        selectedGoals.includes(goal.id) ? { ...goal, status: 'Approved' } : goal
                    )
                );
                setSuccess('Selected goals approved successfully!');
            } else if (action === 'reject') {
                setGoals((prev) =>
                    prev.map((goal) =>
                        selectedGoals.includes(goal.id) ? { ...goal, status: 'Rejected' } : goal
                    )
                );
                setSuccess('Selected goals rejected successfully!');
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
        setEditGoal({
            id: Math.random().toString(36).substr(2, 9), // Temporary ID
            title: '',
            assignedUsers: [],
            status: 'Pending',
            completion: 0,
            deadline: '',
            description: '',
            adminComments: '',
        });
        setModalMode('create');
        setIsModalOpen(true);
        setError('');
        setSuccess('');
    };

    const handleEdit = (goal) => {
        setEditGoal({ ...goal });
        setModalMode('edit');
        setIsModalOpen(true);
        setError('');
        setSuccess('');
    };

    const handleApproveReject = (id, newStatus) => {
        setIsLoading(true);
        setTimeout(() => {
            setGoals((prev) =>
                prev.map((goal) =>
                    goal.id === id ? { ...goal, status: newStatus } : goal
                )
            );
            setSuccess(`Goal ${newStatus.toLowerCase()} successfully!`);
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

    // Handle modal form submission
    const handleModalSubmit = (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Validation
        if (!editGoal.title || editGoal.title.length < 3) {
            setError('Goal title must be at least 3 characters long.');
            setIsLoading(false);
            return;
        }
        if (!editGoal.assignedUsers.length) {
            setError('Please assign at least one user or select Company-Wide.');
            setIsLoading(false);
            return;
        }
        if (!editGoal.deadline) {
            setError('Please select a deadline.');
            setIsLoading(false);
            return;
        }
        if (editGoal.completion < 0 || editGoal.completion > 100) {
            setError('Completion must be between 0 and 100.');
            setIsLoading(false);
            return;
        }

        // Simulate API call
        setTimeout(() => {
            if (modalMode === 'create') {
                setGoals((prev) => [...prev, editGoal]);
                setSuccess('Goal created successfully!');
            } else {
                setGoals((prev) =>
                    prev.map((goal) => (goal.id === editGoal.id ? editGoal : goal))
                );
                setSuccess('Goal updated successfully!');
            }
            setIsModalOpen(false);
            setEditGoal(null);
            setIsLoading(false);
        }, 1000);
    };

    // Handle assigned users selection
    const handleUserToggle = (user) => {
        setEditGoal((prev) => ({
            ...prev,
            assignedUsers: prev.assignedUsers.includes(user)
                ? prev.assignedUsers.filter((u) => u !== user)
                : [...prev.assignedUsers, user],
        }));
    };

    return (
        <div className="p-6 bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl max-w-7xl mx-auto relative animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-teal-600">Goal Management</h2>
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
                        className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-all duration-300 flex items-center"
                        aria-label="Create new goal"
                    >
                        <Plus size={18} className="mr-2" />
                        Create Goal
                    </button>
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
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                </select>
                <select
                    value={filterCompletion}
                    onChange={(e) => setFilterCompletion(e.target.value)}
                    className="p-2 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700"
                    aria-label="Filter by completion"
                >
                    <option value="">All Completion Rates</option>
                    <option value="high">High (70%+)</option>
                    <option value="medium">Medium (30-69%)</option>
                    <option value="low">Low (0-29%)</option>
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
            {selectedGoals.length > 0 && (
                <div className="flex space-x-2 mb-4 animate-slide-in">
                    <button
                        onClick={() => handleBulkAction('approve')}
                        className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-all duration-300"
                        disabled={isLoading}
                    >
                        Approve
                    </button>
                    <button
                        onClick={() => handleBulkAction('reject')}
                        className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-all duration-300"
                        disabled={isLoading}
                    >
                        Reject
                    </button>
                    <button
                        onClick={() => handleBulkAction('delete')}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300"
                        disabled={isLoading}
                    >
                        Delete
                    </button>
                </div>
            )}

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
                            {['title', 'assignedUsers', 'status', 'completion', 'deadline'].map((key) => (
                                <th
                                    key={key}
                                    className="p-3 text-left text-teal-700 cursor-pointer hover:text-teal-900 transition-colors"
                                    onClick={() => handleSort(key)}
                                    aria-sort={sortConfig.key === key ? sortConfig.direction : 'none'}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>{key === 'assignedUsers' ? 'Assigned To' : key.charAt(0).toUpperCase() + key.slice(1)}</span>
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
                                <td className="p-3 text-gray-700">{goal.assignedUsers.join(', ')}</td>
                                <td className="p-3 text-gray-700">
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs ${goal.status === 'Approved'
                                                ? 'bg-teal-100 text-teal-700'
                                                : goal.status === 'Rejected'
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-blue-100 text-blue-700'
                                            }`}
                                    >
                                        {goal.status}
                                    </span>
                                </td>
                                <td className="p-3 text-gray-700">
                                    <div className="w-24 bg-gray-200 rounded-full h-2.5">
                                        <div
                                            className="bg-teal-600 h-2.5 rounded-full transition-all duration-300"
                                            style={{ width: `${goal.completion}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-xs text-gray-600 ml-2">{goal.completion}%</span>
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
                                        onClick={() => handleApproveReject(goal.id, 'Approved')}
                                        className="p-2 rounded-full bg-teal-600 text-white hover:bg-teal-700 transition-all duration-300"
                                        aria-label={`Approve ${goal.title}`}
                                        disabled={isLoading || goal.status === 'Approved'}
                                    >
                                        <Check size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleApproveReject(goal.id, 'Rejected')}
                                        className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300"
                                        aria-label={`Reject ${goal.title}`}
                                        disabled={isLoading || goal.status === 'Rejected'}
                                    >
                                        <XCircle size={16} />
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

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 w-full max-w-md transform transition-all duration-500 hover:scale-105">
                        <h3 className="text-xl font-bold text-teal-600 mb-4">
                            {modalMode === 'create' ? 'Create Goal' : 'Edit Goal'}
                        </h3>
                        <form onSubmit={handleModalSubmit} className="space-y-4">
                            <div className="relative">
                                <label htmlFor="title" className="sr-only">
                                    Goal Title
                                </label>
                                <div className="flex items-center border border-teal-200 rounded-lg focus-within:ring-2 focus-within:ring-teal-400 transition-all duration-300">
                                    <Target className="w-5 h-5 text-teal-600 ml-3" />
                                    <input
                                        type="text"
                                        id="title"
                                        value={editGoal.title}
                                        onChange={(e) => setEditGoal({ ...editGoal, title: e.target.value })}
                                        placeholder="Enter goal title"
                                        className="w-full p-3 bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
                                        aria-label="Goal title"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="relative">
                                <label htmlFor="description" className="sr-only">
                                    Description
                                </label>
                                <div className="flex items-center border border-teal-200 rounded-lg focus-within:ring-2 focus-within:ring-teal-400 transition-all duration-300">
                                    <Target className="w-5 h-5 text-teal-600 ml-3" />
                                    <textarea
                                        id="description"
                                        value={editGoal.description}
                                        onChange={(e) => setEditGoal({ ...editGoal, description: e.target.value })}
                                        placeholder="Enter goal description"
                                        className="w-full p-3 bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
                                        aria-label="Goal description"
                                        rows="3"
                                    />
                                </div>
                            </div>
                            <div className="relative">
                                <label className="block text-sm text-teal-700 mb-2">Assigned Users</label>
                                <div className="border border-teal-200 rounded-lg p-3">
                                    {availableUsers.map((user) => (
                                        <div key={user} className="flex items-center space-x-2 mb-2">
                                            <input
                                                type="checkbox"
                                                id={`user-${user}`}
                                                checked={editGoal.assignedUsers.includes(user)}
                                                onChange={() => handleUserToggle(user)}
                                                className="h-4 w-4 text-teal-600 focus:ring-teal-400"
                                                aria-label={`Assign ${user}`}
                                            />
                                            <label htmlFor={`user-${user}`} className="text-gray-700">
                                                {user}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="relative">
                                <label htmlFor="deadline" className="sr-only">
                                    Deadline
                                </label>
                                <div className="flex items-center border border-teal-200 rounded-lg focus-within:ring-2 focus-within:ring-teal-400 transition-all duration-300">
                                    <Calendar className="w-5 h-5 text-teal-600 ml-3" />
                                    <input
                                        type="date"
                                        id="deadline"
                                        value={editGoal.deadline}
                                        onChange={(e) => setEditGoal({ ...editGoal, deadline: e.target.value })}
                                        className="w-full p-3 bg-transparent focus:outline-none text-gray-700"
                                        aria-label="Deadline"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="relative">
                                <label htmlFor="completion" className="sr-only">
                                    Completion
                                </label>
                                <div className="flex items-center border border-teal-200 rounded-lg focus-within:ring-2 focus-within:ring-teal-400 transition-all duration-300">
                                    <Percent className="w-5 h-5 text-teal-600 ml-3" />
                                    <input
                                        type="number"
                                        id="completion"
                                        value={editGoal.completion}
                                        onChange={(e) => setEditGoal({ ...editGoal, completion: parseInt(e.target.value) })}
                                        placeholder="Enter completion (0-100)"
                                        className="w-full p-3 bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
                                        aria-label="Completion percentage"
                                        min="0"
                                        max="100"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="relative">
                                <label htmlFor="adminComments" className="sr-only">
                                    Admin Comments
                                </label>
                                <div className="flex items-center border border-teal-200 rounded-lg focus-within:ring-2 focus-within:ring-teal-400 transition-all duration-300">
                                    <Target className="w-5 h-5 text-teal-600 ml-3" />
                                    <textarea
                                        id="adminComments"
                                        value={editGoal.adminComments}
                                        onChange={(e) => setEditGoal({ ...editGoal, adminComments: e.target.value })}
                                        placeholder="Enter admin comments"
                                        className="w-full p-3 bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
                                        aria-label="Admin comments"
                                        rows="3"
                                    />
                                </div>
                            </div>
                            <div className="flex space-x-4">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`w-full py-3 rounded-lg bg-teal-600 text-white font-semibold flex items-center justify-center transition-all duration-300 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-teal-700 hover:shadow-lg'
                                        }`}
                                    aria-label="Save goal"
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
                                        setIsModalOpen(false);
                                        setEditGoal(null);
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

export default AdminGoalManagement;