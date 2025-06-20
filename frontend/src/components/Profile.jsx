import React, { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { ChevronLeft, Lock, LogOut, Save, Shield, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const Profile = ({ setCurrentUser, onLogout }) => {
    const [profile, setProfile] = useState({ name: '', email: '', role: 'standard' });
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            onLogout?.();
            return;
        }
        axios
            .get(`${API_URL}/api/user/me`, { headers: { Authorization: `Bearer ${token}` } })
            .then(({ data }) => {
                if (data.success) {
                    setProfile({
                        name: data.user.name,
                        email: data.user.email,
                        role: data.user.role,
                    });
                } else {
                    toast.error(data.message);
                }
            })
            .catch((err) => {
                toast.error(err.response?.data?.message || 'Unable to load profile.');
                if (err.response?.status === 401) onLogout?.();
            });
    }, [onLogout]);

    const saveProfile = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.put(
                `${API_URL}/api/user/profile`,
                { name: profile.name, email: profile.email },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (data.success) {
                setCurrentUser((prev) => ({
                    ...prev,
                    name: profile.name,
                    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random`,
                    role: profile.role,
                }));
                toast.success('Profile updated successfully');
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Profile update failed');
            if (err.response?.status === 401) onLogout?.();
        }
    };

    const changePassword = async (e) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            return toast.error('Passwords do not match');
        }
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.put(
                `${API_URL}/api/user/password`,
                { currentPassword: passwords.current, newPassword: passwords.new },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (data.success) {
                toast.success('Password changed successfully');
                setPasswords({ current: '', new: '', confirm: '' });
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Password change failed');
            if (err.response?.status === 401) onLogout?.();
        }
    };

    const personalFields = [
        { name: 'name', type: 'text', placeholder: 'Your Full Name', icon: UserCircle },
        { name: 'email', type: 'email', placeholder: 'Your Email Address', icon: UserCircle },
        { name: 'role', type: 'text', placeholder: 'Your Role', icon: Shield, readOnly: true },
    ];

    const securityFields = [
        { name: 'current', placeholder: 'Current Password' },
        { name: 'new', placeholder: 'New Password' },
        { name: 'confirm', placeholder: 'Confirm New Password' },
    ];

    return (
        <div className="h-screen bg-gradient-to-br from-teal-50 via-lime-50 to-emerald-50">
            <ToastContainer position="top-center" autoClose={3000} />
            <div className="max-w-4xl mx-auto p-6 sm:p-8">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-1 px-3 py-2 text-teal-600 hover:text-emerald-700 font-medium hover:bg-teal-50 rounded-lg transition-colors duration-300"
                >
                    <ChevronLeft className="w-4 h-5 mr-1" />
                    Back to Dashboard
                </button>
                <div className="flex items-center gap-4 mb-8 mt-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                        {profile.name ? profile.name[0].toUpperCase() : 'U'}
                    </div>
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 bg-gradient-to-r from-teal-600 to-emerald-700 bg-clip-text text-transparent">
                            Account Settings
                        </h1>
                        <p className="text-teal-600 text-sm sm:text-base">Manage your profile and security settings</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <section className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-md border border-teal-100">
                        <div className="flex items-center gap-2 mb-6">
                            <UserCircle className="text-teal-500 w-5 h-5" />
                            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">Personal Information</h2>
                        </div>

                        <form onSubmit={saveProfile} className="space-y-4">
                            {personalFields.map(({ name, type, placeholder, icon: Icon, readOnly }) => (
                                <div
                                    key={name}
                                    className="flex items-center border border-teal-200 rounded-xl px-4 py-3 bg-teal-50/50 focus-within:border-emerald-300 focus-within:ring-2 focus-within:ring-emerald-100 transition-all duration-200"
                                >
                                    {Icon && <Icon className="text-teal-500 w-5 h-5 mr-2" />}
                                    <input
                                        type={type}
                                        placeholder={placeholder}
                                        value={profile[name]}
                                        onChange={(e) => !readOnly && setProfile({ ...profile, [name]: e.target.value })}
                                        className="w-full focus:outline-none text-sm sm:text-base text-gray-800 placeholder-gray-500 bg-transparent"
                                        required={!readOnly}
                                        readOnly={readOnly}
                                        disabled={readOnly}
                                    />
                                </div>
                            ))}
                            <button className="w-full py-2.5 flex items-center justify-center gap-2 text-white bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 rounded-xl shadow-md font-semibold text-sm sm:text-base transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed">
                                <Save className="w-4 h-4" /> Save Changes
                            </button>
                        </form>
                    </section>

                    <section className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-md border border-teal-100">
                        <div className="flex items-center gap-2 mb-6">
                            <Shield className="text-teal-500 w-5 h-5" />
                            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">Security</h2>
                        </div>

                        <form onSubmit={changePassword} className="space-y-4">
                            {securityFields.map(({ name, placeholder }) => (
                                <div
                                    key={name}
                                    className="flex items-center border border-teal-200 rounded-xl px-4 py-3 bg-teal-50/50 focus-within:border-emerald-300 focus-within:ring-2 focus-within:ring-emerald-100 transition-all duration-200"
                                >
                                    <Lock className="text-teal-500 w-5 h-5 mr-2" />
                                    <input
                                        type="password"
                                        placeholder={placeholder}
                                        value={passwords[name]}
                                        onChange={(e) => setPasswords({ ...passwords, [name]: e.target.value })}
                                        className="w-full focus:outline-none text-sm sm:text-base text-gray-800 placeholder-gray-500 bg-transparent"
                                        required
                                    />
                                </div>
                            ))}
                            <button className="w-full py-2.5 flex items-center justify-center gap-2 text-white bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 rounded-xl shadow-md font-semibold text-sm sm:text-base transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed">
                                <Shield className="w-4 h-4" /> Change Password
                            </button>

                            <div className="mt-8 pt-6 border-t border-teal-100">
                                <h3 className="text-red-600 font-semibold mb-4 flex items-center gap-2">
                                    <LogOut className="w-4 h-4" /> Danger Zone
                                </h3>
                                <button
                                    className="w-full py-2 px-4 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                                    onClick={onLogout}
                                >
                                    Logout
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Profile;