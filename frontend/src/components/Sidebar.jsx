import React, { useEffect, useState } from 'react';
import { List, CheckCircle, Menu, Info, X, LayoutDashboard, Clock, AlertCircle, Calendar, MessageSquare, Link, File, FileText, CreditCard, Rss, Sparkles } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const Sidebar = ({ user, tasks }) => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [urgentTask, setUrgentTask] = useState(null);

    // Calculate stats
    const totalTasks = tasks?.length || 0;
    const completedTasks = tasks?.filter((task) => task.completed).length || 0;
    const productivity = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Find most urgent task
    useEffect(() => {
        const pendingTasks = tasks?.filter((task) => !task.completed) || [];
        if (pendingTasks.length > 0) {
            const sortedTasks = pendingTasks.sort((a, b) => {
                const priorityA = a.priority || 0;
                const priorityB = b.priority || 0;
                if (priorityB !== priorityA) return priorityB - priorityA;
                const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
                const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
                return dateA - dateB;
            });
            setUrgentTask(sortedTasks[0]);
        } else {
            setUrgentTask(null);
        }
    }, [tasks]);

    const username = user?.name || 'User';
    const initial = username.charAt(0).toUpperCase();

    // Handle mobile menu overflow
    useEffect(() => {
        document.body.style.overflow = mobileOpen ? 'hidden' : 'auto';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [mobileOpen]);

    const menuItems = [
        { text: 'Dashboard', path: '/', icon: <LayoutDashboard className="w-6 h-6 text-teal-500" /> },
        { text: 'Pending Tasks', path: '/pending', icon: <List className="w-6 h-6 text-teal-500" /> },
        { text: 'Completed Tasks', path: '/complete', icon: <CheckCircle className="w-6 h-6 text-teal-500" /> },
        { text: 'Assigned Tasks', path: '/assigned', icon: <AlertCircle className="w-6 h-6 text-teal-500" /> },
        { text: 'Calendar View', path: '/calendar', icon: <Calendar className="w-6 h-6 text-teal-500" /> },
        { text: 'Team Chat', path: '/team-chat', icon: <MessageSquare className="w-6 h-6 text-teal-500" /> },
        { text: 'URL Shortener', path: '/url-shortener', icon: <Link className="w-6 h-6 text-teal-500" /> },
        { text: 'File Storage', path: '/file-storage', icon: <File className="w-6 h-6 text-teal-500" /> },
        { text: 'Generate Report', path: '/generate-report', icon: <FileText className="w-6 h-6 text-teal-500" /> },
        { text: 'Payment', path: '/payment', icon: <CreditCard className="w-6 h-6 text-teal-500" /> },
        { text: 'Social Feed', path: '/social-feed', icon: <Rss className="w-6 h-6 text-teal-500" /> },
        { text: 'AI Tools', path: '/ai-tools', icon: <Sparkles className="w-6 h-6 text-teal-500" /> },
    ];

    const renderMenuItems = (isMobile = false) => (
        <ul className="space-y-2">
            {menuItems.map(({ text, path, icon }) => (
                <li key={text}>
                    <NavLink
                        to={path}
                        className={({ isActive }) =>
                            [
                                'flex items-center gap-3 px-4 py-2 rounded-lg text-gray-700 hover:bg-teal-100/50 transition-all duration-200 hover:shadow-sm',
                                isActive ? 'bg-gradient-to-r from-teal-200 to-blue-200 text-teal-700 font-semibold shadow-md' : '',
                                isMobile ? 'justify-start' : 'lg:justify-start',
                            ].join(' ')
                        }
                        onClick={() => setMobileOpen(false)}
                    >
                        <span className="flex-shrink-0 p-2 bg-teal-50 rounded-md">{icon}</span>
                        <span className={`truncate ${isMobile ? 'block' : 'hidden lg:block'} text-sm font-medium`}>{text}</span>
                    </NavLink>
                </li>
            ))}
        </ul>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <div className="hidden lg:block fixed w-72 h-screen bg-gradient-to-b from-blue-50 via-teal-50 to-teal-100 backdrop-blur-lg border-r border-teal-200/50 flex flex-col p-6">
                {/* User Profile (Static) */}
                <div className="flex items-center gap-4 mb-6 shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg border-2 border-white/50">
                        {initial}
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">Hi, {username}</h2>
                        <p className="text-xs text-teal-600 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3 animate-pulse" /> Stay Productive!
                        </p>
                    </div>
                </div>

                {/* Scrollable Section: All Content */}
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-teal-400 scrollbar-track-teal-100">
                    <div className="space-y-6 pb-32">
                        {/* Navigation */}
                        <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-4 shadow-md border border-teal-100/50">
                            <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <List className="w-5 h-5 text-teal-500" /> Navigation
                            </h3>
                            {renderMenuItems()}
                        </div>

                        {/* Urgent Task Alert */}
                        {urgentTask && (
                            <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-2xl p-4 shadow-md border border-teal-100/50 animate-pulse-slow">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5 text-teal-500 animate-pulse" /> Urgent Task
                                    </h3>
                                </div>
                                <p className="text-sm text-gray-700 truncate">{urgentTask.title}</p>
                                {urgentTask.dueDate && (
                                    <p className="text-xs text-teal-600 mt-1">
                                        Due: {new Date(urgentTask.dueDate).toLocaleDateString()}
                                    </p>
                                )}
                                <NavLink
                                    to="/pending"
                                    className="block mt-2 text-xs text-teal-700 font-medium hover:text-teal-900 transition-colors duration-200"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    View Task
                                </NavLink>
                            </div>
                        )}

                        {/* Productivity Widget */}
                        <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-4 shadow-md border border-teal-100/50">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-base font-semibold text-gray-800">Progress</h3>
                                <span className="bg-teal-50 text-teal-700 px-2 py-1 rounded-full text-xs font-medium">{productivity}%</span>
                            </div>
                            <div className="w-full bg-teal-100 h-2 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-teal-500 to-blue-600 transition-all duration-500"
                                    style={{ width: `${productivity}%` }}
                                />
                            </div>
                            <p className="text-xs text-gray-600 mt-2">
                                {completedTasks} of {totalTasks} tasks done
                            </p>
                        </div>

                        {/* Quick Tip */}
                        <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-4 shadow-md border border-teal-100/50">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-full bg-teal-50">
                                    <Info className="w-5 h-5 text-teal-500" />
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-gray-800">Quick Tip</h3>
                                    <p className="text-xs text-gray-600 mt-1">Tackle high-priority tasks first to stay ahead.</p>
                                    <a
                                        href="https://x.ai"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block mt-1 text-xs text-teal-700 font-medium hover:text-teal-900 transition-colors duration-200"
                                    >
                                        Learn More
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Social Feed Updates */}
                        <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-4 shadow-md border border-teal-100/50">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-full bg-teal-50">
                                    <Rss className="w-5 h-5 text-teal-500" />
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-gray-800">Social Feed Updates</h3>
                                    <p className="text-xs text-gray-600 mt-1">Stay updated with office news and activities.</p>
                                    <NavLink
                                        to="/social-feed"
                                        className="block mt-1 text-xs text-teal-700 font-medium hover:text-teal-900 transition-colors duration-200"
                                        onClick={() => setMobileOpen(false)}
                                    >
                                        View Feed
                                    </NavLink>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Button */}
            {!mobileOpen && (
                <button
                    onClick={() => setMobileOpen(true)}
                    className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-white/90 backdrop-blur-lg rounded-full shadow-md border border-teal-200/50 hover:bg-teal-100/50 transition-all duration-200"
                >
                    <Menu className="w-6 h-6 text-teal-500" />
                </button>
            )}

            {/* Mobile Drawer */}
            {mobileOpen && (
                <div className="fixed inset-0 z-40">
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
                    <div
                        className="fixed top-0 left-0 w-72 h-full bg-gradient-to-b from-blue-50 via-teal-50 to-teal-100 backdrop-blur-lg border-r border-teal-200/50 p-6 transition-transform duration-300 transform translate-x-0"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-teal-700">Menu</h2>
                            <button
                                onClick={() => setMobileOpen(false)}
                                className="p-2 rounded-full bg-teal-50 text-teal-700 hover:bg-teal-100 transition-all duration-200"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg border-2 border-white/50">
                                {initial}
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800">Hi, {username}</h2>
                                <p className="text-xs text-teal-600 font-medium flex items-center gap-1">
                                    <Clock className="w-3 h-3 animate-pulse" /> Stay Productive!
                                </p>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-teal-400 scrollbar-track-teal-100 max-h-[calc(100vh-200px)]">
                            {renderMenuItems(true)}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Sidebar;