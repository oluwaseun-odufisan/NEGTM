import React, { useState } from 'react';
import { User, Mail, Lock, CheckCircle, ChevronDown } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const AdminSignup = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        const { name, email, password, confirmPassword, role } = formData;

        if (!name || name.length < 2) {
            setError('Name must be at least 2 characters long.');
            setIsLoading(false);
            return;
        }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('Please enter a valid email address.');
            setIsLoading(false);
            return;
        }
        if (!password || password.length < 8 || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password)) {
            setError('Password must be at least 8 characters with uppercase, lowercase, number, and special character.');
            setIsLoading(false);
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            setIsLoading(false);
            return;
        }
        if (!role) {
            setError('Please select a role.');
            setIsLoading(false);
            return;
        }

        try {
            const response = await axios.post('http://localhost:4000/api/admin/signup', {
                name,
                email,
                password,
                role,
            });
            if (response.data.success) {
                localStorage.setItem('adminToken', response.data.token);
                localStorage.setItem('admin', JSON.stringify(response.data.admin));
                setSuccess('Signup successful! Redirecting to login...');
                setTimeout(() => {
                    navigate('/admin/login');
                }, 1000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Signup failed. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-teal-100 flex items-center justify-center relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute w-96 h-96 top-0 left-0 bg-teal-200/30 rounded-full filter blur-4xl animate-pulse-slow" />
                <div className="absolute w-96 h-96 bottom-0 right-0 bg-blue-200/30 rounded-full filter blur-4xl animate-pulse-slow-delayed" />
                <div className="absolute w-64 h-64 top-1/4 right-1/4 bg-teal-300/20 rounded-full filter blur-3xl animate-float" />
            </div>

            {/* Signup Card */}
            <div className="relative bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl p-8 w-full max-w-md transform transition-all duration-500 hover:scale-105">
                {/* Branding */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-teal-600 animate-fade-in">NEGTM Admin Signup</h1>
                    <p className="text-sm text-blue-600 mt-2">Create your admin account</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name Input */}
                    <div className="relative">
                        <label htmlFor="name" className="sr-only">
                            Name
                        </label>
                        <div className="flex items-center border border-teal-200 rounded-lg focus-within:ring-2 focus-within:ring-teal-400 transition-all duration-300">
                            <User className="w-5 h-5 text-teal-600 ml-3" />
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter your name"
                                className="w-full p-3 bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
                                aria-label="Full name"
                                required
                            />
                        </div>
                    </div>

                    {/* Email Input */}
                    <div className="relative">
                        <label htmlFor="email" className="sr-only">
                            Email
                        </label>
                        <div className="flex items-center border border-teal-200 rounded-lg focus-within:ring-2 focus-within:ring-teal-400 transition-all duration-300">
                            <Mail className="w-5 h-5 text-teal-600 ml-3" />
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter your email"
                                className="w-full p-3 bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
                                aria-label="Email address"
                                required
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div className="relative">
                        <label htmlFor="password" className="sr-only">
                            Password
                        </label>
                        <div className="flex items-center border border-teal-200 rounded-lg focus-within:ring-2 focus-within:ring-teal-400 transition-all duration-300">
                            <Lock className="w-5 h-5 text-teal-600 ml-3" />
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Enter your password"
                                className="w-full p-3 bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
                                aria-label="Password"
                                required
                            />
                        </div>
                    </div>

                    {/* Confirm Password Input */}
                    <div className="relative">
                        <label htmlFor="confirmPassword" className="sr-only">
                            Confirm Password
                        </label>
                        <div className="flex items-center border border-teal-200 rounded-lg focus-within:ring-2 focus-within:ring-teal-400 transition-all duration-300">
                            <Lock className="w-5 h-5 text-teal-600 ml-3" />
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Confirm your password"
                                className="w-full p-3 bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
                                aria-label="Confirm password"
                                required
                            />
                        </div>
                    </div>

                    {/* Role Dropdown */}
                    <div className="relative">
                        <label htmlFor="role" className="sr-only">
                            Role
                        </label>
                        <div className="flex items-center border border-teal-200 rounded-lg focus-within:ring-2 focus-within:ring-teal-400 transition-all duration-300">
                            <ChevronDown className="w-5 h-5 text-teal-600 ml-3" />
                            <select
                                id="role"
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="w-full p-3 bg-transparent focus:outline-none text-gray-700 appearance-none text-sm"
                                aria-label="Select role"
                                required
                            >
                                <option value="" disabled>
                                    Select your role
                                </option>
                                <option value="super-admin">Super Admin</option>
                                <option value="manager">Manager</option>
                            </select>
                        </div>
                    </div>

                    {/* Success/Error Messages */}
                    {success && (
                        <div className="text-teal-600 text-sm text-center animate-fade-in">
                            {success}
                        </div>
                    )}
                    {error && (
                        <div className="text-red-500 text-sm text-center animate-shake">
                            {error}
                        </div>
                    )}

                    {/* Signup Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-3 rounded-lg bg-teal-600 text-white font-semibold flex items-center justify-center transition-all duration-300 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-teal-700 hover:shadow-lg'}`}
                        aria-label="Sign up"
                    >
                        {isLoading ? (
                            <div className="flex items-center space-x-2">
                                <div className="w-5 h-5 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                                <span>Signing up...</span>
                            </div>
                        ) : (
                            <>
                                <CheckCircle className="w-5 h-5 mr-2" />
                                Sign Up
                            </>
                        )}
                    </button>
                </form>

                {/* Link to Login */}
                <p className="mt-6 text-center text-sm text-blue-600">
                    Already have an account?{' '}
                    <Link to="/admin/login" className="underline hover:text-teal-600 transition-colors">
                        Log in here
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default AdminSignup;