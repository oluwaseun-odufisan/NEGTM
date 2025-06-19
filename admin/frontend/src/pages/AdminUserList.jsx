import React, { useState } from 'react';
import {
    User,
    Mail,
    Shield,
    Calendar,
    Clock,
    Search,
    ChevronUp,
    ChevronDown,
    Edit,
    Lock,
    Key,
    Trash2,
    Download,
} from 'lucide-react';

// Mock user data (replace with backend API call)
const initialUsers = [
    {
        id: '1',
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'Admin',
        registrationDate: '2025-01-15',
        status: 'Active',
        lastLogin: '2025-06-17 14:30',
    },
    {
        id: '2',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        role: 'User',
        registrationDate: '2025-02-10',
        status: 'Active',
        lastLogin: '2025-06-16 09:45',
    },
    {
        id: '3',
        name: 'Alice Johnson',
        email: 'alice.johnson@example.com',
        role: 'User',
        registrationDate: '2025-03-05',
        status: 'Inactive',
        lastLogin: '2025-06-10 12:20',
    },
    {
        id: '4',
        name: 'Bob Wilson',
        email: 'bob.wilson@example.com',
        role: 'Manager',
        registrationDate: '2025-04-20',
        status: 'Active',
        lastLogin: '2025-06-17 08:15',
    },
];

// Mock available roles and statuses
const availableRoles = ['All Roles', 'Admin', 'Manager', 'User'];
const availableStatuses = ['All Statuses', 'Active', 'Inactive'];

const AdminUserList = () => {
    const [users, setUsers] = useState(initialUsers);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('All Roles');
    const [filterStatus, setFilterStatus] = useState('All Statuses');
    const [sortConfig, setSortConfig] = useState({ key: '', direction: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const usersPerPage = 5;

    // Handle sorting
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });

        const sortedUsers = [...users].sort((a, b) => {
            return direction === 'asc'
                ? a[key].localeCompare(b[key])
                : b[key].localeCompare(a[key]);
        });
        setUsers(sortedUsers);
    };

    // Handle search and filters
    const filteredUsers = users.filter(
        (user) =>
            (user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email.toLowerCase().includes(searchQuery.toLowerCase())) &&
            (filterRole !== 'All Roles' ? user.role === filterRole : true) &&
            (filterStatus !== 'All Statuses' ? user.status === filterStatus : true)
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
    const handleBulkAction = (action, value) => {
        setIsLoading(true);
        setError('');
        setSuccess('');
        setTimeout(() => {
            if (selectedUsers.length === 0) {
                setError('No users selected.');
                setIsLoading(false);
                return;
            }
            if (action === 'assignRole') {
                setUsers((prev) =>
                    prev.map((user) =>
                        selectedUsers.includes(user.id) ? { ...user, role: value } : user
                    )
                );
                setSuccess(`Assigned role ${value} to selected users successfully!`);
            } else if (action === 'deactivate') {
                setUsers((prev) =>
                    prev.map((user) =>
                        selectedUsers.includes(user.id) ? { ...user, status: 'Inactive' } : user
                    )
                );
                setSuccess('Selected users deactivated successfully!');
            } else if (action === 'delete') {
                setUsers((prev) => prev.filter((user) => !selectedUsers.includes(user.id)));
                setSuccess('Selected users deleted successfully!');
            }
            setSelectedUsers([]);
            setIsLoading(false);
        }, 1000);
    };

    // Handle individual actions
    const handleEdit = (user) => {
        console.log(`Editing user: ${user.name}`); // Replace with modal or form logic
        setSuccess(`Initiated edit for ${user.name}!`);
    };

    const handleDeactivate = (id) => {
        setIsLoading(true);
        setTimeout(() => {
            setUsers((prev) =>
                prev.map((user) =>
                    user.id === id ? { ...user, status: 'Inactive' } : user
                )
            );
            setSuccess('User deactivated successfully!');
            setIsLoading(false);
        }, 1000);
    };

    const handleResetPassword = (email) => {
        console.log(`Resetting password for: ${email}`); // Replace with password reset logic
        setSuccess(`Password reset initiated for ${email}!`);
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

    // Handle export
    const handleExport = (format) => {
        if (filteredUsers.length === 0) {
            setError('No users to export.');
            return;
        }
        setIsLoading(true);
        setTimeout(() => {
            if (format === 'csv') {
                const csvHeaders = ['name', 'email', 'role', 'registrationDate', 'status', 'lastLogin'];
                const csvRows = filteredUsers.map((user) =>
                    csvHeaders.map((header) => `"${user[header]}"`).join(',')
                );
                const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `user_list_${Date.now()}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else if (format === 'pdf') {
                console.log('PDF export initiated'); // Replace with PDF generation logic (e.g., jsPDF)
                setSuccess('PDF export initiated! (Placeholder)');
            }
            setSuccess(`Users exported as ${format.toUpperCase()} successfully!`);
            setIsLoading(false);
        }, 1000);
    };

    return (
        <div className="p-6 bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl max-w-7xl mx-auto animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-teal-600">User List</h2>
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
            <div className="flex flex-wrap gap-4 mb-4">
                <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="p-2 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700"
                    aria-label="Filter by role"
                >
                    {availableRoles.map((role) => (
                        <option key={role} value={role}>
                            {role}
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

            {/* Bulk Actions */}
            {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4 animate-slide-in">
                    <select
                        onChange={(e) => handleBulkAction('assignRole', e.target.value)}
                        className="p-2 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700"
                        aria-label="Assign role to selected users"
                        disabled={isLoading}
                    >
                        <option value="">Assign Role</option>
                        <option value="Admin">Admin</option>
                        <option value="Manager">Manager</option>
                        <option value="User">User</option>
                    </select>
                    <button
                        onClick={() => handleBulkAction('deactivate')}
                        className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-all duration-300"
                        disabled={isLoading}
                        aria-label="Deactivate selected users"
                    >
                        Deactivate
                    </button>
                    <button
                        onClick={() => handleBulkAction('delete')}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300"
                        disabled={isLoading}
                        aria-label="Delete selected users"
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
                                <td className="p-3 text-gray-700">
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs ${user.status === 'Active' ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700'
                                            }`}
                                    >
                                        {user.status}
                                    </span>
                                </td>
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
                                        onClick={() => handleDeactivate(user.id)}
                                        className="p-2 rounded-full bg-teal-600 text-white hover:bg-teal-700 transition-all duration-300"
                                        aria-label={`Deactivate ${user.name}`}
                                        disabled={isLoading}
                                    >
                                        <Lock size={16} />
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

            {isLoading && (
                <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
                    <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                </div>
            )}
        </div>
    );
};

export default AdminUserList;