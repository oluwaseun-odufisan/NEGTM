import React, { useState } from 'react';
import { UserPlus, User, Mail, Lock, Shield } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001';

const INITIAL_FORM = { name: '', email: '', password: '', role: 'standard' };

const Signup = ({ onSwitchMode }) => {
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            const { data } = await axios.post(`${API_URL}/api/user/register`, formData);
            setMessage({ text: 'Registration successful! You can now log in.', type: 'success' });
            setFormData(INITIAL_FORM);
        } catch (err) {
            console.error('Signup error:', err);
            setMessage({
                text: err.response?.data?.message || 'An error occurred. Please try again later.',
                type: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSubmit(e);
        }
    };

    const FIELDS = [
        {
            name: 'name',
            type: 'text',
            placeholder: 'Your Full Name',
            icon: User,
        },
        {
            name: 'email',
            type: 'email',
            placeholder: 'Your Email Address',
            icon: Mail,
        },
        {
            name: 'password',
            type: 'password',
            placeholder: 'Your Password',
            icon: Lock,
        },
        {
            name: 'role',
            type: 'select',
            placeholder: 'Select Role',
            icon: Shield,
            options: ['standard', 'team-lead', 'admin'],
        },
    ];

    return (
        <div className="min-h-screen w-screen bg-gradient-to-br from-teal-100 via-lime-100 to-emerald-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden">
            <div className="w-full max-w-md bg-white/95 backdrop-blur-xl shadow-2xl rounded-3xl p-6 sm:p-8 border border-teal-200 transform transition-all duration-500 hover:scale-105 hover:shadow-3xl">
                <div className="mb-10 text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl animate-bounce-slow transition-transform duration-300 hover:scale-110">
                        <UserPlus className="w-12 h-12 text-white transform transition-transform duration-300 hover:rotate-12" />
                    </div>
                    <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight bg-gradient-to-r from-teal-600 to-emerald-700 bg-clip-text text-transparent animate-gradient">
                        Create Account
                    </h2>
                    <p className="text-teal-600 text-lg sm:text-xl mt-3 font-semibold animate-fade-in">
                        Start Managing Your Tasks
                    </p>
                </div>

                {message.text && (
                    <div className={`text-center py-3 px-5 rounded-xl text-base font-medium animate-fade-in ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-6">
                    {FIELDS.map(({ name, type, placeholder, icon: Icon, options }) => (
                        <div key={name} className="relative group">
                            <div className="flex items-center border border-teal-200 rounded-2xl px-5 py-3 bg-teal-50/70 focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-200/50 transition-all duration-300 group-hover:shadow-md">
                                {Icon && <Icon className="text-teal-500 w-6 h-6 mr-4 transform transition-transform duration-300 group-hover:scale-110" />}
                                {type === 'select' ? (
                                    <select
                                        name={name}
                                        value={formData[name]}
                                        onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}
                                        className="w-full focus:outline-none text-lg text-gray-800 bg-transparent transition-all duration-300"
                                        required
                                    >
                                        {options.map((option) => (
                                            <option key={option} value={option}>
                                                {option.charAt(0).toUpperCase() + option.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type={type}
                                        placeholder={placeholder}
                                        value={formData[name]}
                                        onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}
                                        className="w-full focus:outline-none text-lg text-gray-800 placeholder-gray-500 bg-transparent transition-all duration-300"
                                        required
                                    />
                                )}
                            </div>
                            <div className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-gradient-to-r from-teal-500 to-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center" />
                        </div>
                    ))}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 flex items-center justify-center gap-3 text-white bg-gradient-to-r from-teal-500 to-emerald-600 rounded-2xl shadow-lg font-bold text-xl transition-all duration-500 hover:from-teal-600 hover:to-emerald-700 hover:shadow-xl hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed animate-pulse-slow"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                </svg>
                                Signing Up...
                            </span>
                        ) : (
                            <>
                                <UserPlus className="w-6 h-6 transform transition-transform duration-300 group-hover:rotate-12" />
                                Sign Up
                            </>
                        )}
                    </button>
                </form>

                <p className="text-center text-base sm:text-lg text-gray-600 mt-10 animate-fade-in">
                    Already have an account?{' '}
                    <button
                        onClick={onSwitchMode}
                        className="text-teal-600 hover:text-emerald-700 font-bold hover:underline transition-all duration-300 hover:scale-105 inline-block"
                    >
                        Login
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Signup;