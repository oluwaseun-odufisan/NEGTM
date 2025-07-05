import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, CheckCircle, ChevronDown, Settings, LogOut, Star, Mail, Menu, X } from 'lucide-react';

const Navbar = ({ user = {}, onLogout }) => {
    const menuRef = useRef(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [emailMenuOpen, setEmailMenuOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
                setEmailMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMenuToggle = () => setMenuOpen((prev) => !prev);
    const handleEmailMenuToggle = () => setEmailMenuOpen((prev) => !prev);

    const handleLogout = () => {
        setMenuOpen(false);
        setEmailMenuOpen(false);
        onLogout();
    };

    const emailLinks = [
        { name: 'Outlook', href: 'https://outlook.live.com', color: 'text-blue-500', bgColor: 'bg-blue-50' },
        { name: 'Gmail', href: 'https://mail.google.com', color: 'text-red-500', bgColor: 'bg-red-50' },
        { name: 'Yahoo', href: 'https://mail.yahoo.com', color: 'text-purple-500', bgColor: 'bg-purple-50' },
    ];

    return (
        <header className="fixed top-0 left-0 w-full z-50 bg-gradient-to-r from-teal-50/90 via-white/95 to-blue-50/90 backdrop-blur-xl border-b border-blue-200/50 shadow-xl font-sans">
            <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 lg:pl-[18rem] lg:pr-8 h-16 max-w-screen-2xl mx-auto">
                {/* LOGO AND TITLE SECTION */}
                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
                    <div className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-blue-600 shadow-2xl group-hover:shadow-blue-400/70 transition-all duration-700">
                        <div className="relative flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white animate-pulse-infinite" />
                            <Check className="absolute w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white animate-bounce-infinite -top-1 -right-1" />
                            <Star className="absolute w-3 h-3 sm:w-3 sm:h-3 md:w-4 md:h-4 text-yellow-300 animate-twinkle -bottom-1 -left-1" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 bg-blue-300 rounded-full animate-ping-infinite" />
                        <div className="absolute inset-0 rounded-xl border-2 border-blue-200/70 animate-ripple" />
                        <div className="absolute inset-1 rounded-xl bg-blue-100/20 animate-glimmer" />
                    </div>
                    <div className="flex flex-col justify-center">
                        <span className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold bg-gradient-to-r from-teal-500 to-blue-600 bg-clip-text text-transparent tracking-wide animate-fadeIn-slow">
                            TaskManager
                        </span>
                        <span className="text-xs sm:text-sm font-light text-blue-600 animate-pulse-slow">
                            Powered by NEG AI
                        </span>
                    </div>
                </div>

                {/* HAMBURGER MENU BUTTON FOR MOBILE */}
                <div ref={menuRef} className="relative">
                    <button
                        className="md:hidden p-2 text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors duration-300 z-[70]"
                        onClick={handleMenuToggle}
                        aria-label="Toggle Menu"
                    >
                        {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>

                    {/* MOBILE MENU DROPDOWN */}
                    {menuOpen && (
                        <div className="absolute top-12 right-4 w-56 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-blue-100 z-[70] overflow-hidden md:hidden animate-slideDown-faster">
                            <div className="flex flex-col py-2">
                                {/* Email Dropdown for Mobile */}
                                <div className="relative px-4 py-2">
                                    <button
                                        onClick={handleEmailMenuToggle}
                                        className="flex items-center gap-2 w-full text-left text-sm text-gray-700 hover:bg-blue-50 transition-all duration-300"
                                    >
                                        <Mail className="w-5 h-5 text-blue-600" />
                                        Email Services
                                        <ChevronDown
                                            className={`w-4 h-4 text-blue-600 transition-transform duration-300 ${emailMenuOpen ? 'rotate-180' : ''}`}
                                        />
                                    </button>
                                    {emailMenuOpen && (
                                        <ul className="mt-2 w-full bg-blue-50/80 rounded-lg shadow-inner border border-blue-100 overflow-hidden animate-slideDown-faster">
                                            {emailLinks.map((link) => (
                                                <li key={link.name}>
                                                    <a
                                                        href={link.href}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={`block px-4 py-2 text-sm ${link.color} hover:${link.bgColor} transition-all duration-300`}
                                                        onClick={() => setMenuOpen(false)}
                                                    >
                                                        {link.name}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                {/* Profile Settings */}
                                <button
                                    onClick={() => {
                                        setMenuOpen(false);
                                        navigate('/profile');
                                    }}
                                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-all duration-300"
                                >
                                    <Settings className="w-5 h-5 text-blue-600" />
                                    Profile Settings
                                </button>

                                {/* User Info */}
                                <div className="flex items-center gap-3 px-4 py-2 border-t border-blue-100/50">
                                    <div className="relative">
                                        {user.avatar ? (
                                            <img
                                                src={user.avatar}
                                                alt="User Avatar"
                                                className="w-8 h-8 rounded-full shadow-md"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-blue-600 text-white font-semibold shadow-md">
                                                {user.name?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                        )}
                                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-gray-400 rounded-full border-2 border-white animate-ping" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-medium text-gray-800 truncate max-w-[150px]">{user.name}</p>
                                        <p className="text-xs text-blue-600 truncate max-w-[150px]">{user.email}</p>
                                    </div>
                                </div>

                                {/* Logout */}
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-all duration-300 border-t border-blue-100/50"
                                >
                                    <LogOut className="w-5 h-5 animate-bounce" />
                                    Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT SIDE SECTION - DESKTOP */}
                <div className="hidden md:flex items-center gap-4 lg:gap-6">
                    {/* Email Icons */}
                    {emailLinks.map((link) => (
                        <a
                            key={link.name}
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center gap-1"
                            title={link.name}
                            aria-label={`Open ${link.name}`}
                        >
                            <div className={`p-2 ${link.color} ${link.bgColor} rounded-full hover:bg-opacity-75 transition-all duration-300 shadow-md hover:shadow-blue-200 hover:scale-105`}>
                                <Mail className={`w-5 h-5 ${link.color}`} />
                            </div>
                            <span className="text-xs text-gray-600">{link.name}</span>
                        </a>
                    ))}

                    {/* Settings Icon */}
                    <button
                        className="p-2 text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors duration-300 shadow-md hover:shadow-blue-200"
                        onClick={() => navigate('/profile')}
                        aria-label="Profile Settings"
                    >
                        <Settings className="w-5 h-5 md:w-6 md:h-6" />
                    </button>

                    {/* User Dropdown */}
                    <div className="relative">
                        <button
                            onClick={handleMenuToggle}
                            className="flex items-center gap-2 px-3 py-2 rounded-full bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg"
                        >
                            <div className="relative">
                                {user.avatar ? (
                                    <img
                                        src={user.avatar}
                                        alt="User Avatar"
                                        className="w-8 h-8 rounded-full shadow-md hover:scale-105 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-blue-600 text-white font-semibold shadow-md hover:scale-105 transition-transform duration-300">
                                        {user.name?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                )}
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-gray-400 rounded-full border-2 border-white animate-ping" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-medium text-gray-800 truncate max-w-[150px] lg:max-w-[180px]">{user.name}</p>
                                <p className="text-xs text-blue-600 truncate max-w-[150px] lg:max-w-[180px]">{user.email}</p>
                            </div>
                            <ChevronDown
                                className={`w-4 h-4 text-blue-600 transition-transform duration-300 ${menuOpen ? 'rotate-180' : ''}`}
                            />
                        </button>
                        {menuOpen && (
                            <ul className="absolute top-14 right-0 w-56 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-blue-100 z-50 overflow-hidden animate-slideDown-faster">
                                <li className="border-b border-blue-100/50">
                                    <button
                                        onClick={() => {
                                            setMenuOpen(false);
                                            navigate('/profile');
                                        }}
                                        className="w-full px-4 py-3 text-left hover:bg-blue-50 text-sm text-gray-700 transition-all duration-300 flex items-center gap-3"
                                        role="menuitem"
                                    >
                                        <Settings className="w-5 h-5 text-blue-600" />
                                        Profile Settings
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={handleLogout}
                                        className="flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-red-50 text-red-600 transition-colors duration-300"
                                    >
                                        <LogOut className="w-5 h-5 animate-bounce" />
                                        Logout
                                    </button>
                                </li>
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;