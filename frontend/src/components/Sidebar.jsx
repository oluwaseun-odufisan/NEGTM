import React, { useEffect, useState } from 'react';
import { List, CheckCircle, Menu, Info, X, LayoutDashboard, Clock, Calendar, MessageSquare, Link, File, FileText, CreditCard, Sparkles, AlertCircle, Bell, Target, Award, Video, BookOpen, Instagram } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const Sidebar = ({ user, tasks }) => {
    const [mobileOpen, setMobileOpen] = useState(false);

    // Fallback for username to handle undefined or missing user.name
    const username = user?.name?.trim() || 'User';
    const initial = username.charAt(0).toUpperCase();

    // Handle mobile menu overflow
    useEffect(() => {
        document.body.style.overflow = mobileOpen ? 'hidden' : 'auto';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [mobileOpen]);

    const menuItems = [
        { text: 'Dashboard', path: '/', icon: <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6 text-teal-500" /> },
        { text: 'Pending Tasks', path: '/pending', icon: <List className="w-5 h-5 sm:w-6 sm:h-6 text-teal-500" /> },
        { text: 'Completed', path: '/complete', icon: <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-teal-500" /> },
        { text: 'Assigned Tasks', path: '/assigned', icon: <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-teal-500" /> },
        { text: 'Calendar View', path: '/calendar', icon: <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-teal-500" /> },
        { text: 'Team Chat', path: '/team-chat', icon: <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-teal-500" /> },
        { text: 'Social Feeds', path: '/social-feed', icon: <Instagram className="w-5 h-5 sm:w-6 sm:h-6 text-teal-500" /> },
        { text: 'URL Shortener', path: '/url-shortener', icon: <Link className="w-5 h-5 sm:w-6 sm:h-6 text-teal-500" /> },
        { text: 'File Storage', path: '/file-storage', icon: <File className="w-5 h-5 sm:w-6 sm:h-6 text-teal-500" /> },
        { text: 'Generate Report', path: '/generate-report', icon: <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-teal-500" /> },
        { text: 'Payment', path: '/payment', icon: <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-teal-500" /> },
        { text: 'AI Tools', path: '/ai-tools', icon: <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-teal-500" /> },
        { text: 'Reminders', path: '/reminders', icon: <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-teal-500" /> },
        { text: 'Goals', path: '/goals', icon: <Target className="w-5 h-5 sm:w-6 sm:h-6 text-teal-500" /> },
        { text: 'Appraisals', path: '/appraisals', icon: <Award className="w-5 h-5 sm:w-6 sm:h-6 text-teal-500" /> },
        { text: 'Meeting', path: '/meeting', icon: <Video className="w-5 h-5 sm:w-6 sm:h-6 text-teal-500" /> },
        { text: 'Training', path: '/training', icon: <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-teal-500" /> },
    ];

    const renderMenuItems = (isMobile = false) => (
        <ul className="space-y-1 sm:space-y-2">
            {menuItems.map(({ text, path, icon }) => (
                <li key={text}>
                    <NavLink
                        to={path}
                        className={({ isActive }) =>
                            [
                                'flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-gray-700 hover:bg-teal-100/50 transition-all duration-200 hover:shadow-sm',
                                isActive ? 'bg-gradient-to-r from-teal-200 to-blue-200 text-teal-700 font-semibold shadow-md' : '',
                                isMobile ? 'justify-start' : 'lg:justify-start',
                            ].join(' ')
                        }
                        onClick={() => setMobileOpen(false)}
                    >
                        <span className="flex-shrink-0 p-1.5 sm:p-2 bg-teal-50 rounded-md">{icon}</span>
                        <span className="truncate text-xs sm:text-sm font-medium">{text}</span>
                    </NavLink>
                </li>
            ))}
        </ul>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <div className="hidden lg:block fixed w-60 md:w-64 lg:w-72 h-screen bg-gradient-to-b from-blue-50 via-teal-50 to-teal-100 backdrop-blur-lg border-r border-teal-200/50 flex flex-col p-4 sm:p-5 lg:p-6 z-40">
                {/* User Profile */}
                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 shrink-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-lg border-2 border-white/50">
                        {initial}
                    </div>
                    <div>
                        <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800 truncate max-w-[150px] sm:max-w-[180px] lg:max-w-[200px]">
                            Hi, {username}
                        </h2>
                        <p className="text-2xs sm:text-xs text-teal-600 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3 animate-pulse" /> Stay Productive!
                        </p>
                    </div>
                </div>

                {/* Scrollable Section: Navigation and Below */}
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-teal-400 scrollbar-track-teal-100 px-2 sm:px-4">
                    <div className="space-y-4 sm:space-y-6 pb-24 sm:pb-32">
                        {/* Navigation */}
                        <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-3 sm:p-4 shadow-md border border-teal-100/50">
                            <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                                <List className="w-4 h-4 sm:w-5 sm:h-5 text-teal-500" /> Navigation
                            </h3>
                            {renderMenuItems()}
                        </div>

                        {/* Quick Tip */}
                        <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-3 sm:p-4 shadow-md border border-teal-100/50">
                            <div className="flex items-start gap-2 sm:gap-3">
                                <div className="p-1.5 sm:p-2 rounded-full bg-teal-50">
                                    <Info className="w-4 h-4 sm:w-5 sm:h-5 text-teal-500" />
                                </div>
                                <div>
                                    <h3 className="text-sm sm:text-base font-semibold text-gray-800">Quick Tip</h3>
                                    <p className="text-2xs sm:text-xs text-gray-600 mt-0.5 sm:mt-1">Tackle high-priority tasks first to stay ahead.</p>
                                    <a
                                        href="https://x.ai"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block mt-1 text-2xs sm:text-xs text-teal-700 font-medium hover:text-teal-900 transition-colors duration-200"
                                    >
                                        Learn More
                                    </a>
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
                    className="lg:hidden fixed top-4 sm:top-5 left-3 sm:left-4 z-[60] p-2 sm:p-3 bg-white/95 backdrop-blur-lg rounded-full shadow-md border border-teal-200/50 hover:bg-teal-100/50 transition-all duration-200"
                    aria-label="Open menu"
                >
                    <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-teal-500" />
                </button>
            )}

            {/* Mobile Drawer */}
            <div
                className={`fixed inset-0 z-40 transition-opacity duration-300 ${mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
                <div
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm"
                    onClick={() => setMobileOpen(false)}
                    aria-hidden="true"
                />
                <div
                    className={`fixed top-0 left-0 w-64 sm:w-72 h-full bg-gradient-to-b from-blue-50 via-teal-50 to-teal-100 backdrop-blur-lg border-r border-teal-200/50 p-4 sm:p-5 transition-transform duration-300 transform ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-4 sm:mb-6">
                        <h2 className="text-lg sm:text-xl font-semibold text-teal-700">Menu</h2>
                        <button
                            onClick={() => setMobileOpen(false)}
                            className="p-1.5 sm:p-2 rounded-full bg-teal-50 text-teal-700 hover:bg-teal-100 transition-all duration-200"
                            aria-label="Close menu"
                        >
                            <X className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-lg border-2 border-white/50">
                            {initial}
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 truncate max-w-[150px] sm:max-w-[180px]">
                                Hi, {username}
                            </h2>
                            <p className="text-2xs sm:text-xs text-teal-600 font-medium flex items-center gap-1">
                                <Clock className="w-3 h-3 animate-pulse" /> Stay Productive!
                            </p>
                        </div>
                    </div>
                    <div className="h-[calc(100vh-4rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-teal-400 scrollbar-track-teal-100">
                        <div className="space-y-4 sm:space-y-6 pb-24 sm:pb-32">
                            {renderMenuItems(true)}
                            {/* Quick Tip */}
                            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-3 sm:p-4 shadow-md border border-teal-100/50">
                                <div className="flex items-start gap-2 sm:gap-3">
                                    <div className="p-1.5 sm:p-2 rounded-full bg-teal-50">
                                        <Info className="w-4 h-4 sm:w-5 sm:h-5 text-teal-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm sm:text-base font-semibold text-gray-800">Quick Tip</h3>
                                        <p className="text-2xs sm:text-xs text-gray-600 mt-0.5 sm:mt-1">Tackle high-priority tasks first to stay ahead.</p>
                                        <a
                                            href="https://x.ai"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block mt-1 text-2xs sm:text-xs text-teal-700 font-medium hover:text-teal-900 transition-colors duration-200"
                                        >
                                            Learn More
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Sidebar;