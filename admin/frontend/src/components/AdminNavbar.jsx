import React, { useState } from 'react';
import { Bell, Menu, Search, User, Settings, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const AdminNavbar = ({ toggleSidebar, onLogout, admin }) => {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Placeholder for notifications count
    const notificationCount = 2; // Mock value until backend is implemented

    // Handle search input (placeholder until backend integration)
    const handleSearch = (e) => {
        e.preventDefault();
        console.log('Searching for:', searchQuery); // Replace with API call later
    };

    // Handle logout
    const handleLogoutClick = () => {
        setIsProfileOpen(false);
        onLogout();
    };

    return (
        <nav className="bg-teal-800 text-white shadow-lg p-4 flex items-center justify-between relative z-20">
            {/* Logo/Branding */}
            <div className="flex items-center space-x-4">
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="md:hidden text-teal-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-teal-400 rounded"
                    onClick={toggleSidebar}
                    aria-label="Toggle sidebar"
                >
                    <Menu size={24} />
                </motion.button>
                <Link to="/admin/dashboard" className="text-2xl font-bold text-teal-200 hover:text-white transition-colors">
                    NEGAITM Admin
                </Link>
            </div>

            {/* Navigation Links (Hidden on Mobile) */}
            <div className="hidden md:flex items-center space-x-6">
                {[
                    { to: '/admin/dashboard', label: 'Dashboard' },
                    { to: '/admin/user-list', label: 'Users' },
                    { to: '/admin/task-management', label: 'Tasks' },
                    { to: '/admin/goal-management', label: 'Goals' },
                    { to: '/admin/file-management', label: 'Files' },
                    { to: '/admin/reports', label: 'Reports' },
                ].map((link) => (
                    <Link
                        key={link.to}
                        to={link.to}
                        className="text-teal-200 hover:text-white font-medium transition-colors duration-200 relative group"
                        aria-label={link.label}
                    >
                        {link.label}
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-teal-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
                    </Link>
                ))}
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
                        className="pl-10 pr-4 py-2 rounded-full border border-teal-600 bg-teal-700/50 text-white placeholder-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-400 w-64"
                        aria-label="Search"
                    />
                    <Search
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-300"
                        size={18}
                    />
                </form>

                {/* Notifications Icon */}
                <motion.div
                    className="relative"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <button
                        className="text-teal-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-teal-400 rounded"
                        aria-label={`Notifications (${notificationCount} unread)`}
                    >
                        <Bell size={24} />
                        {notificationCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                {notificationCount}
                            </span>
                        )}
                    </button>
                </motion.div>

                {/* Profile Dropdown */}
                <div className="relative">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center space-x-2 text-teal-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-teal-400 rounded"
                        aria-label="Profile menu"
                        aria-expanded={isProfileOpen}
                    >
                        <User size={24} />
                        <span className="hidden md:inline font-medium">
                            {admin?.name || 'Admin'}
                        </span>
                    </motion.button>
                    <AnimatePresence>
                        {isProfileOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="absolute right-0 mt-2 w-48 bg-teal-700 rounded-lg shadow-xl py-2 z-50"
                            >
                                <Link
                                    to="/admin/profile"
                                    className="flex items-center px-4 py-2 text-teal-100 hover:bg-teal-600 hover:text-white transition-colors"
                                    onClick={() => setIsProfileOpen(false)}
                                >
                                    <Settings size={18} className="mr-2" />
                                    Profile Settings
                                </Link>
                                <button
                                    className="flex items-center w-full text-left px-4 py-2 text-teal-100 hover:bg-teal-600 hover:text-white transition-colors"
                                    onClick={handleLogoutClick}
                                    aria-label="Logout"
                                >
                                    <LogOut size={18} className="mr-2" />
                                    Logout
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </nav>
    );
};

export default AdminNavbar;