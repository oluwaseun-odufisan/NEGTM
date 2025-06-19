import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    CheckSquare,
    Target,
    Folder,
    BarChart2,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';

const AdminSidebar = ({ toggleSidebar }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const location = useLocation();

    // Navigation links with icons and routes
    const navLinks = [
        { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Users', path: '/admin/users', icon: Users },
        { name: 'Tasks', path: '/admin/tasks', icon: CheckSquare },
        { name: 'Goals', path: '/admin/goals', icon: Target },
        { name: 'Files', path: '/admin/files', icon: Folder },
        { name: 'Reports', path: '/admin/reports', icon: BarChart2 },
    ];

    // Toggle collapse state for desktop
    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };

    return (
        <div
            className={`h-full bg-white/80 backdrop-blur-md shadow-lg flex flex-col transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'
                }`}
        >
            {/* Branding/Logo */}
            <div
                className={`p-4 flex items-center justify-between border-b border-teal-100/50 ${isCollapsed ? 'justify-center' : ''
                    }`}
            >
                {!isCollapsed && (
                    <Link to="/admin/dashboard" className="text-xl font-bold text-teal-600">
                        NEGTM
                    </Link>
                )}
                <button
                    onClick={toggleCollapse}
                    className="p-2 rounded-full text-teal-600 hover:bg-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-400"
                    aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 overflow-y-auto">
                <ul className="p-2 space-y-1">
                    {navLinks.map((link) => {
                        const isActive = location.pathname === link.path;
                        return (
                            <li key={link.path}>
                                <Link
                                    to={link.path}
                                    onClick={toggleSidebar} // Close sidebar on mobile after click
                                    className={`flex items-center p-3 rounded-lg transition-all duration-200 ${isActive
                                            ? 'bg-teal-100 text-teal-700'
                                            : 'text-blue-600 hover:bg-teal-50 hover:text-teal-600'
                                        } ${isCollapsed ? 'justify-center' : 'space-x-3'}`}
                                    aria-label={link.name}
                                >
                                    <link.icon
                                        size={20}
                                        className={isActive ? 'text-teal-700' : 'text-teal-600'}
                                    />
                                    {!isCollapsed && <span className="text-sm font-medium">{link.name}</span>}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Decorative Element */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-teal-200/20 to-transparent" />
            </div>
        </div>
    );
};

export default AdminSidebar;