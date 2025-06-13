import { Eye, EyeOff, Lock, LogIn, Mail } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const INITIAL_FORM = { email: "", password: "" };

const Login = ({ onSubmit, onSwitchMode }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [rememberMe, setRememberMe] = useState(false);

    const navigate = useNavigate();
    const url = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("userId");
        if (token) {
            (async () => {
                try {
                    const { data } = await axios.get(`${url}/api/user/me`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (data.success) {
                        onSubmit?.({ token, userId, ...data.user });
                        toast.success("Welcome back! Redirecting...");
                        navigate('/');
                    } else {
                        localStorage.clear();
                    }
                } catch {
                    localStorage.clear();
                }
            })();
        }
    }, [navigate, onSubmit]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!rememberMe) {
            toast.error('Please enable "Remember Me" to continue.');
            return;
        }
        setLoading(true);
        try {
            const { data } = await axios.post(`${url}/api/user/login`, formData);
            if (!data.token) throw new Error(data.message || "Login failed");
            localStorage.setItem("token", data.token);
            localStorage.setItem("userId", data.user.id);
            setFormData(INITIAL_FORM);
            onSubmit?.({ token: data.token, userId: data.user.id, ...data.user });
            toast.success("Login successful! Redirecting...");
            setTimeout(() => navigate("/", 1000));
        } catch (err) {
            const msg = err.response?.data?.message || err.message;
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleSwitchMode = () => {
        toast.dismiss();
        onSwitchMode?.();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSubmit(e);
        }
    };

    const fields = [
        {
            name: "email",
            type: "email",
            placeholder: "Your Email Address",
            icon: Mail,
        },
        {
            name: "password",
            type: showPassword ? "text" : "password",
            placeholder: "Your Password",
            icon: Lock,
            isPassword: true,
        },
    ];

    return (
        <div className="min-h-screen w-screen bg-gradient-to-br from-teal-100 via-lime-100 to-emerald-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden">
            <ToastContainer position='top-center' autoClose={3000} hideProgressBar />
            <div className="w-full max-w-md bg-white/95 backdrop-blur-xl shadow-2xl rounded-3xl p-6 sm:p-8 border border-teal-200 transform transition-all duration-500 hover:scale-105 hover:shadow-3xl">
                <div className="mb-10 text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl animate-bounce-slow transition-transform duration-300 hover:scale-110">
                        <LogIn className="w-12 h-12 text-white transform transition-transform duration-300 hover:rotate-12" />
                    </div>
                    <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight bg-gradient-to-r from-teal-600 to-emerald-700 bg-clip-text text-transparent animate-gradient">
                        Welcome Back
                    </h2>
                    <p className="text-teal-600 text-lg sm:text-xl mt-3 font-semibold animate-fade-in">
                        Access Your TaskManager Dashboard
                    </p>
                </div>

                <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-6">
                    {fields.map(({ name, type, placeholder, icon: Icon, isPassword }) => (
                        <div key={name} className="relative group">
                            <div className="flex items-center border border-teal-200 rounded-2xl px-5 py-3 bg-teal-50/70 focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-200/50 transition-all duration-300 group-hover:shadow-md">
                                {Icon && <Icon className="text-teal-500 w-6 h-6 mr-4 transform transition-transform duration-300 group-hover:scale-110" />}
                                <input
                                    type={type}
                                    placeholder={placeholder}
                                    value={formData[name]}
                                    onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}
                                    className="w-full focus:outline-none text-lg text-gray-800 placeholder-gray-500 bg-transparent transition-all duration-300"
                                    required
                                />
                                {isPassword && (
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        className="ml-2 text-gray-500 hover:text-teal-600 transition-colors duration-300 transform hover:scale-110"
                                    >
                                        {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                                    </button>
                                )}
                            </div>
                            <div className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-gradient-to-r from-teal-500 to-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center" />
                        </div>
                    ))}

                    <div className="flex items-center group">
                        <input
                            type="checkbox"
                            id="rememberMe"
                            checked={rememberMe}
                            onChange={() => setRememberMe(!rememberMe)}
                            className="h-5 w-5 text-teal-600 border-teal-300 rounded focus:ring-emerald-400 transition-all duration-300 cursor-pointer group-hover:scale-110"
                            required
                        />
                        <label htmlFor="rememberMe" className="ml-3 text-lg text-gray-700 group-hover:text-teal-600 transition-colors duration-300">
                            Remember me on this device
                        </label>
                    </div>

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
                                Logging you in...
                            </span>
                        ) : (
                            <>
                                <LogIn className="w-6 h-6 transform transition-transform duration-300 group-hover:rotate-12" />
                                Log In
                            </>
                        )}
                    </button>
                </form>

                <p className="text-center text-base sm:text-lg text-gray-600 mt-10 animate-fade-in">
                    Don't have an account yet?{" "}
                    <button
                        type="button"
                        onClick={handleSwitchMode}
                        className="text-teal-600 hover:text-emerald-700 font-bold hover:underline transition-all duration-300 hover:scale-105 inline-block"
                    >
                        Create an account
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Login;