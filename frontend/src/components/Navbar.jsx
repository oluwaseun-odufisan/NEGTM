import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, CheckCircle, ChevronDown, Settings, LogOut, Star, Mail } from 'lucide-react';

const Navbar = ({ user = {}, onLogout }) => {
    const menuRef = useRef(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.addEventListener("mousedown", handleClickOutside);
    }, []);

    const handleMenuToggle = () => setMenuOpen((prev) => !prev);

    const handleLogout = () => {
        setMenuOpen(false);
        onLogout();
    };

    return (
        <header className='sticky top-0 z-50 bg-gradient-to-r from-teal-50/90 via-white/95 to-blue-50/90 backdrop-blur-xl border-b border-blue-200/50 shadow-xl font-sans'>
            <div className='flex items-center justify-between px-4 py-3 md:px-6 lg:px-8 max-w-screen-2xl mx-auto'>
                {/* LOGO AND TITLE SECTION - Left-Aligned */}
                <div className='flex items-start gap-4 cursor-pointer group' onClick={() => navigate('/')}>
                    <div className='relative w-14 h-14 flex items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-blue-600 shadow-2xl group-hover:shadow-blue-400/70 transition-all duration-700'>
                        <div className='relative flex items-center justify-center'>
                            <CheckCircle className='w-7 h-7 text-white animate-pulse-infinite' />
                            <Check className='absolute w-5 h-5 text-white animate-bounce-infinite -top-1 -right-1' />
                            <Star className='absolute w-4 h-4 text-yellow-300 animate-twinkle -bottom-1 -left-1' />
                        </div>
                        <div className='absolute -bottom-3 -right-3 w-5 h-5 bg-blue-300 rounded-full animate-ping-infinite' />
                        <div className='absolute inset-0 rounded-xl border-2 border-blue-200/70 animate-ripple' />
                        <div className='absolute inset-1 rounded-xl bg-blue-100/20 animate-glimmer' />
                    </div>
                    <div className='flex flex-col justify-center'>
                        <span className='text-2xl md:text-4xl font-extrabold bg-gradient-to-r from-teal-500 to-blue-600 bg-clip-text text-transparent tracking-wide animate-fadeIn-slow'>
                            TaskManager
                        </span>
                        <span className='text-xs md:text-sm font-light text-blue-600 animate-pulse-slow'>
                            Powered by NEG AI
                        </span>
                    </div>
                </div>

                {/* RIGHT SIDE SECTION */}
                <div className='flex items-center gap-6 flex-wrap'>
                    {/* Email Icons with Labels */}
                    <a
                        href="https://outlook.live.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className='flex flex-col items-center gap-1'
                        title="Microsoft Outlook"
                        aria-label="Open Microsoft Outlook"
                    >
                        <div className='p-2.5 text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition-all duration-300 shadow-md hover:shadow-blue-200 hover:scale-105'>
                            <Mail className='w-6 h-6 text-blue-500' />
                        </div>
                        <span className='text-xs text-gray-600'>Outlook</span>
                    </a>
                    <a
                        href="https://mail.google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className='flex flex-col items-center gap-1'
                        title="Gmail"
                        aria-label="Open Gmail"
                    >
                        <div className='p-2.5 text-red-600 bg-blue-50 rounded-full hover:bg-blue-100 transition-all duration-300 shadow-md hover:shadow-blue-200 hover:scale-105'>
                            <Mail className='w-6 h-6 text-red-500' />
                        </div>
                        <span className='text-xs text-gray-600'>Gmail</span>
                    </a>
                    <a
                        href="https://mail.yahoo.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className='flex flex-col items-center gap-1'
                        title="Yahoo Mail"
                        aria-label="Open Yahoo Mail"
                    >
                        <div className='p-2.5 text-purple-600 text-gray-50 rounded-full hover:bg-blue-100 transition-all duration-300 shadow-md hover:shadow-blue-200 hover:scale-105'>
                            <Mail className='w-6 h-6 text-purple-500' />
                        </div>
                        <span className='text-xs text-gray-600'>Yahoo</span>
                    </a>

                    {/* Settings Icon */}
                    <button 
                        className='p-2.5 text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors duration-300 shadow-md hover:shadow-blue-200'
                        onClick={() => navigate('/profile')}
                        aria-label="Profile Settings"
                    >
                        <Settings className='w-6 h-6 md:w-7 h-7' />
                    </button>

                    {/* USER DROPDOWN MENU */}
                    <div ref={menuRef} className='relative'>
                        <button 
                            onClick={handleMenuToggle} 
                            className='flex items-center gap-3 px-4 py-2.5 rounded-full bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg'
                        >
                            <div className='relative'>
                                {user.avatar ? (
                                    <img 
                                        src={user.avatar} 
                                        alt="User Avatar" 
                                        className='w-10 h-10 rounded-full shadow-md hover:scale-105 transition-transform duration-300' 
                                    />
                                ) : (
                                    <div className='w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-blue-600 text-white font-semibold shadow-md hover:scale-105 transition-transform duration-300'>
                                        {user.name?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                )}
                                <div className='text absolute -bottom-1 -right-1 w-4 h-4 bg-gray-400 rounded-full border-2 border-white animate-ping' />
                            </div>

                            <div className='hidden md:block text-left'>
                                <p className='text-sm font-medium text-gray-800 truncate max-width-[180px]'>{user.name}</p>
                                <p className='text-xs text-blue-600 truncate max-width max-width-[180px]'>{user.email}</p>
                            </div>

                            <ChevronDown 
                                className={`w-5 h-5 text-blue-600 transition-transform duration-300 ${menuOpen ? 'rotate-180' : ''}`} 
                            />
                        </button>

                        {menuOpen && (
                            <ul className='absolute top-16 right-0 w-64 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-blue-100 z-50 overflow-hidden animate-slideDown-faster'>
                                <li className='border-b border-blue-100/50'>
                                    <button 
                                        onClick={() => {
                                            setMenuOpen(false);
                                            navigate('/profile');
                                        }}
                                        className='w-full px-5 py-3.5 text-left hover:bg-blue-50 text-sm text-gray-700 transition-all duration-300 flex items-center gap-3'
                                        role='menuitem'
                                    >
                                        <Settings className='w-5 h-5 text-blue-600' />
                                        Profile Settings
                                    </button>
                                </li>

                                <li>
                                    <button 
                                        onClick={handleLogout} 
                                        className='flex w-full items-center gap-3 px-5 py-3.5 text-sm hover:bg-red-50 text-red-600 transition-colors duration-300'
                                    >
                                        <LogOut className='w-5 h-5 animate-bounce' />
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