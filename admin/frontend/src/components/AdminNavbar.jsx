import React, { useState } from 'react';
import { Bell, Menu, Search, User, Settings, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminNavbar = ({ toggleSidebar }) => {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Placeholder for notifications count
    const notificationCount = 2; // Mock value until backend is implemented

    // Handle search input (placeholder until backend integration)
    const handleSearch = (e) => {
        e.preventDefault();
        console.log('Searching for:', searchQuery); // Replace with API call later
    };

    return (
        <nav className="bg-white shadow-md p-4 flex items-center justify-between relative">
            {/* Logo/Branding */}
            <div className="flex items-center space-x-4">
                <button
                    className="md:hidden text-teal-600 hover:text-teal-800 focus:outline-none"
                    onClick={toggleSidebar}
                    aria-label="Toggle sidebar"
                >
                    <Menu size={24} />
                </button>
                <Link to="/admin/dashboard" className="text-2xl font-bold text-teal-600">
                    NEGTM Admin
                </Link>
            </div>

            {/* Navigation Links (Hidden on Mobile) */}
            <div className="hidden md:flex space-x-6">
                <Link
                    to="/admin/dashboard"
                    className="text-blue-600 hover:text-teal-600 transition-colors"
                    aria-label="Dashboard"
                >
                    Dashboard
                </Link>
                <Link
                    to="/admin/users"
                    className="text-blue-600 hover:text-teal-600 transition-colors"
                    aria-label="Users"
                >
                    Users
                </Link>
                <Link
                    to="/admin/tasks"
                    className="text-blue-600 hover:text-teal-600 transition-colors"
                    aria-label="Tasks"
                >
                    Tasks
                </Link>
                <Link
                    to="/admin/goals"
                    className="text-blue-600 hover:text-teal-600 transition-colors"
                    aria-label="Goals"
                >
                    Goals
                </Link>
                <Link
                    to="/admin/files"
                    className="text-blue-600 hover:text-teal-600 transition-colors"
                    aria-label="Files"
                >
                    Files
                </Link>
                <Link
                    to="/admin/reports"
                    className="text-blue-600 hover:text-teal-600 transition-colors"
                    aria-label="Reports"
                >
                    Reports
                </Link>
            </div>

            {/* Right Side: Search, Notifications, Profile */}
            <div className="flex items-center space-x-4">
                {/* Search Bar */}
                <form onSubmit={handleSearch} className="relative">
                    <input
                        type="text"
                        placeholder="Search users, tasks, goals..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 rounded-full border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700"
                        aria-label="Search"
                    />
                    <Search
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-600"
                        size={18}
                    />
                </form>

                {/* Notifications Icon */}
                <div className="relative">
                    <button
                        className="text-teal-600 hover:text-teal-800 focus:outline-none"
                        aria-label={`Notifications (${notificationCount} unread)`}
                    >
                        <Bell size={24} />
                        {notificationCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-teal-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                {notificationCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Profile Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center space-x-2 text-teal-600 hover:text-teal-800 focus:outline-none"
                        aria-label="Profile menu"
                        aria-expanded={isProfileOpen}
                    >
                        <User size={24} />
                        <span className="hidden md:inline text-blue-600">Admin</span>
                    </button>
                    {isProfileOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-teal-50 rounded-lg shadow-lg py-2 z-50">
                            <Link
                                to="/admin/profile"
                                className="flex items-center px-4 py-2 text-blue-600 hover:bg-teal-100 hover:text-teal-800"
                                onClick={() => setIsProfileOpen(false)}
                            >
                                <Settings size={18} className="mr-2" />
                                Profile Settings
                            </Link>
                            <button
                                className="flex items-center w-full text-left px-4 py-2 text-blue-600 hover:bg-teal-100 hover:text-teal-800"
                                onClick={() => {
                                    console.log('Logout'); // Replace with logout logic later
                                    setIsProfileOpen(false);
                                }}
                            >
                                <LogOut size={18} className="mr-2" />
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default AdminNavbar;