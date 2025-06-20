import React, { useState } from 'react';
import AdminNavbar from './AdminNavbar';
import AdminSidebar from './AdminSidebar';

const AdminLayout = ({ children, admin, onLogout }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Toggle sidebar for mobile view
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    // Placeholder for authentication check
    const isAuthenticated = !!admin;

    if (!isAuthenticated) {
        return (
            <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-teal-50 to-teal-100">
                <p className="text-xl text-teal-700">Please log in to access the admin panel.</p>
            </div>
        );
    }

    return (
        <div className="h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-teal-100 overflow-hidden relative">
            {/* Background decorative elements */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute w-72 h-72 top-0 left-0 bg-teal-200/30 rounded-full filter blur-4xl animate-pulse-slow" />
                <div className="absolute w-72 h-72 bottom-0 right-0 bg-blue-200/30 rounded-full filter blur-4xl animate-pulse-slow-delayed" />
            </div>

            {/* Main layout */}
            <div className="flex h-full">
                {/* Sidebar */}
                <div
                    className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                        } md:translate-x-0 transition-transform duration-300 ease-in-out`}
                >
                    <AdminSidebar toggleSidebar={toggleSidebar} />
                </div>

                {/* Overlay for mobile sidebar */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
                        onClick={toggleSidebar}
                        aria-hidden="true"
                    ></div>
                )}

                {/* Main content area */}
                <div className="flex-1 flex flex-col md:ml-64">
                    {/* Navbar */}
                    <header className="bg-teal-800 shadow-md z-10">
                        <AdminNavbar toggleSidebar={toggleSidebar} admin={admin} onLogout={onLogout} />
                    </header>

                    {/* Content */}
                    <main className="flex-1 overflow-y-auto p-6 relative z-0">
                        {children}
                    </main>

                    {/* Notifications Area */}
                    <div className="fixed bottom-4 right-4 z-40">
                        <div className="bg-white rounded-lg shadow-lg p-4 max-w-sm">
                            <h3 className="text-teal-700 font-semibold mb-2">Notifications</h3>
                            <ul className="space-y-2">
                                <li className="text-sm text-gray-600 border-l-4 border-teal-500 pl-2">
                                    New user registered: john.doe@example.com
                                </li>
                                <li className="text-sm text-gray-600 border-l-4 border-blue-500 pl-2">
                                    Task "Project Plan" overdue by 2 days
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Footer */}
                    <footer className="bg-white text-gray-600 text-center py-2 text-sm">
                        NEGTM Admin © 2025 | Version 1.0.0
                    </footer>
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;