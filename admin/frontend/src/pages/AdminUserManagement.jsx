import React, { useState } from 'react';
import {
    User,
    Mail,
    Shield,
    Calendar,
    ToggleLeft,
    ToggleRight,
    Key,
    Trash2,
    Edit,
    CheckCircle,
    X,
    Search,
    ChevronUp,
    ChevronDown,
} from 'lucide-react';

// Mock user data (replace with backend API call)
const initialUsers = [
    {
        id: '1',
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'User',
        registrationDate: '2025-01-15',
        status: 'Active',
        lastLogin: '2025-06-16',
    },
    {
        id: '2',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        role: 'Team Lead',
        registrationDate: '2025-02-10',
        status: 'Inactive',
        lastLogin: '2025-06-10',
    },
    {
        id: '3',
        name: 'Alice Johnson',
        email: 'alice.johnson@example.com',
        role: 'User',
        registrationDate: '2025-03-05',
        status: 'Active',
        lastLogin: '2025-06-17',
    },
];

const AdminUserManagement = () => {
    const [users, setUsers] = useState(initialUsers);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: '', direction: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const usersPerPage = 5;

    // Handle sorting
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });

        const sortedUsers = [...users].sort((a, b) => {
            if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
            if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
            return 0;
        });
        setUsers(sortedUsers);
    };

    // Handle search and filters
    const filteredUsers = users.filter(
        (user) =>
            (user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email.toLowerCase().includes(searchQuery.toLowerCase())) &&
            (filterRole ? user.role === filterRole : true) &&
            (filterStatus ? user.status === filterStatus : true)
    );

    // Pagination logic
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
    const paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * usersPerPage,
        currentPage * usersPerPage
    );

    // Handle bulk selection
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedUsers(paginatedUsers.map((user) => user.id));
        } else {
            setSelectedUsers([]);
        }
    };

    const handleSelectUser = (id) => {
        setSelectedUsers((prev) =>
            prev.includes(id) ? prev.filter((userId) => userId !== id) : [...prev, id]
        );
    };

    // Handle bulk actions
    const handleBulkAction = (action) => {
        setIsLoading(true);
        setTimeout(() => {
            if (action === 'deactivate') {
                setUsers((prev) =>
                    prev.map((user) =>
                        selectedUsers.includes(user.id) ? { ...user, status: 'Inactive' } : user
                    )
                );
                setSuccess('Selected users deactivated successfully!');
            } else if (action === 'activate') {
                setUsers((prev) =>
                    prev.map((user) =>
                        selectedUsers.includes(user.id) ? { ...user, status: 'Active' } : user
                    )
                );
                setSuccess('Selected users activated successfully!');
            } else if (action === 'delete') {
                setUsers((prev) => prev.filter((user) => !selectedUsers.includes(user.id)));
                setSuccess('Selected users deleted successfully!');
            } else if (action === 'assignRole') {
                setUsers((prev) =>
                    prev.map((user) =>
                        selectedUsers.includes(user.id) ? { ...user, role: 'Team Lead' } : user
                    )
                );
                setSuccess('Role assigned to selected users successfully!');
            }
            setSelectedUsers([]);
            setIsLoading(false);
        }, 1000);
    };

    // Handle individual actions
    const handleEdit = (user) => {
        setEditUser({ ...user });
        setIsEditModalOpen(true);
        setError('');
        setSuccess('');
    };

    const handleToggleStatus = (id) => {
        setIsLoading(true);
        setTimeout(() => {
            setUsers((prev) =>
                prev.map((user) =>
                    user.id === id
                        ? { ...user, status: user.status === 'Active' ? 'Inactive' : 'Active' }
                        : user
                )
            );
            setSuccess(`User status updated successfully!`);
            setIsLoading(false);
        }, 1000);
    };

    const handleResetPassword = (email) => {
        setIsLoading(true);
        setTimeout(() => {
            console.log(`Password reset email sent to ${email}`); // Replace with API call
            setSuccess(`Password reset email sent to ${email}!`);
            setIsLoading(false);
        }, 1000);
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            setIsLoading(true);
            setTimeout(() => {
                setUsers((prev) => prev.filter((user) => user.id !== id));
                setSuccess('User deleted successfully!');
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
        if (!editUser.name || editUser.name.length < 2) {
            setError('Name must be at least 2 characters long.');
            setIsLoading(false);
            return;
        }
        if (!editUser.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editUser.email)) {
            setError('Please enter a valid email address.');
            setIsLoading(false);
            return;
        }
        if (!editUser.role) {
            setError('Please select a role.');
            setIsLoading(false);
            return;
        }

        // Simulate API call
        setTimeout(() => {
            setUsers((prev) =>
                prev.map((user) => (user.id === editUser.id ? editUser : user))
            );
            setSuccess('User updated successfully!');
            setIsEditModalOpen(false);
            setEditUser(null);
            setIsLoading(false);
        }, 1000);
    };

    return (
        <div className="p-6 bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl max-w-7xl mx-auto relative animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-teal-600">User Management</h2>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 rounded-full border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700 w-64"
                        aria-label="Search users"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-600" size={18} />
                </div>
            </div>

            {/* Filters */}
            <div className="flex space-x-4 mb-4">
                <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="p-2 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700"
                    aria-label="Filter by role"
                >
                    <option value="">All Roles</option>
                    <option value="User">User</option>
                    <option value="Team Lead">Team Lead</option>
                </select>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="p-2 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700"
                    aria-label="Filter by status"
                >
                    <option value="">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
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
            {selectedUsers.length > 0 && (
                <div className="flex space-x-2 mb-4 animate-slide-in">
                    <button
                        onClick={() => handleBulkAction('activate')}
                        className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-all duration-300"
                        disabled={isLoading}
                    >
                        Activate
                    </button>
                    <button
                        onClick={() => handleBulkAction('deactivate')}
                        className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-all duration-300"
                        disabled={isLoading}
                    >
                        Deactivate
                    </button>
                    <button
                        onClick={() => handleBulkAction('assignRole')}
                        className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-all duration-300"
                        disabled={isLoading}
                    >
                        Assign Team Lead
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

            {/* User Table */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-teal-50">
                            <th className="p-3">
                                <input
                                    type="checkbox"
                                    checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                                    onChange={handleSelectAll}
                                    className="h-4 w-4 text-teal-600 focus:ring-teal-400"
                                    aria-label="Select all users"
                                />
                            </th>
                            {['name', 'email', 'role', 'registrationDate', 'status', 'lastLogin'].map((key) => (
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
                        {paginatedUsers.map((user) => (
                            <tr
                                key={user.id}
                                className="border-b border-teal-100 hover:bg-teal-50 transition-all duration-200"
                            >
                                <td className="p-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.includes(user.id)}
                                        onChange={() => handleSelectUser(user.id)}
                                        className="h-4 w-4 text-teal-600 focus:ring-teal-400"
                                        aria-label={`Select ${user.name}`}
                                    />
                                </td>
                                <td className="p-3 text-gray-700">{user.name}</td>
                                <td className="p-3 text-gray-700">{user.email}</td>
                                <td className="p-3 text-gray-700">{user.role}</td>
                                <td className="p-3 text-gray-700">{user.registrationDate}</td>
                                <td className="p-3 text-gray-700">{user.status}</td>
                                <td className="p-3 text-gray-700">{user.lastLogin}</td>
                                <td className="p-3 flex space-x-2">
                                    <button
                                        onClick={() => handleEdit(user)}
                                        className="p-2 rounded-full bg-teal-600 text-white hover:bg-teal-700 transition-all duration-300"
                                        aria-label={`Edit ${user.name}`}
                                        disabled={isLoading}
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleToggleStatus(user.id)}
                                        className="p-2 rounded-full bg-teal-600 text-white hover:bg-teal-700 transition-all duration-300"
                                        aria-label={`${user.status === 'Active' ? 'Deactivate' : 'Activate'} ${user.name}`}
                                        disabled={isLoading}
                                    >
                                        {user.status === 'Active' ? <ToggleLeft size={16} /> : <ToggleRight size={16} />}
                                    </button>
                                    <button
                                        onClick={() => handleResetPassword(user.email)}
                                        className="p-2 rounded-full bg-teal-600 text-white hover:bg-teal-700 transition-all duration-300"
                                        aria-label={`Reset password for ${user.name}`}
                                        disabled={isLoading}
                                    >
                                        <Key size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(user.id)}
                                        className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300"
                                        aria-label={`Delete ${user.name}`}
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
                    Showing {(currentPage - 1) * usersPerPage + 1} to{' '}
                    {Math.min(currentPage * usersPerPage, filteredUsers.length)} of {filteredUsers.length}{' '}
                    users
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
                        <h3 className="text-xl font-bold text-teal-600 mb-4">Edit User</h3>
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div className="relative">
                                <label htmlFor="name" className="sr-only">
                                    Name
                                </label>
                                <div className="flex items-center border border-teal-200 rounded-lg focus-within:ring-2 focus-within:ring-teal-400 transition-all duration-300">
                                    <User className="w-5 h-5 text-teal-600 ml-3" />
                                    <input
                                        type="text"
                                        id="name"
                                        value={editUser.name}
                                        onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                                        placeholder="Enter name"
                                        className="w-full p-3 bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
                                        aria-label="Full name"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="relative">
                                <label htmlFor="email" className="sr-only">
                                    Email
                                </label>
                                <div className="flex items-center border border-teal-200 rounded-lg focus-within:ring-2 focus-within:ring-teal-400 transition-all duration-300">
                                    <Mail className="w-5 h-5 text-teal-600 ml-3" />
                                    <input
                                        type="email"
                                        id="email"
                                        value={editUser.email}
                                        onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                                        placeholder="Enter email"
                                        className="w-full p-3 bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
                                        aria-label="Email address"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="relative">
                                <label htmlFor="role" className="sr-only">
                                    Role
                                </label>
                                <div className="flex items-center border border-teal-200 rounded-lg focus-within:ring-2 focus-within:ring-teal-400 transition-all duration-300">
                                    <Shield className="w-5 h-5 text-teal-600 ml-3" />
                                    <select
                                        id="role"
                                        value={editUser.role}
                                        onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                                        className="w-full p-3 bg-transparent focus:outline-none text-gray-700 appearance-none"
                                        aria-label="Select role"
                                        required
                                    >
                                        <option value="User">User</option>
                                        <option value="Team Lead">Team Lead</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex space-x-4">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`w-full py-3 rounded-lg bg-teal-600 text-white font-semibold flex items-center justify-center transition-all duration-300 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-teal-700 hover:shadow-lg'
                                        }`}
                                    aria-label="Save user"
                                >
                                    {isLoading ? (
                                        <div className="flex items-center space-x-2">
                                            <div className="w-5 h-5 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                                            <span>Saving...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-5 h-5 mr-2" />
                                            Save
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        setIsEditModalOpen(false);
                                        setEditUser(null);
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

export default AdminUserManagement;