import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

// Components
import AdminLayout from './components/AdminLayout.jsx';
import AdminLogin from './components/AdminLogin.jsx';
import AdminSignup from './components/AdminSignup.jsx';
import AdminProfile from './components/AdminProfile.jsx';

// Pages
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminUserManagement from './pages/AdminUserManagement.jsx';
import AdminTaskManagement from './pages/AdminTaskManagement.jsx';
import AdminGoalManagement from './pages/AdminGoalManagement.jsx';
import AdminFileManagement from './pages/AdminFileManagement.jsx';
import AdminUserList from './pages/AdminUserList.jsx';
import AdminTaskOverview from './pages/AdminTaskOverview.jsx';
import AdminGoalOverview from './pages/AdminGoalOverview.jsx';
import AdminFileStorage from './pages/AdminFileStorage.jsx';
import AdminReports from './pages/AdminReports.jsx';
import AdminAnalytics from './pages/AdminAnalytics.jsx';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const App = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    const fetchAdmin = async () => {
      const token = localStorage.getItem('adminToken');
      if (token) {
        // Basic token format validation
        if (typeof token !== 'string' || token.split('.').length !== 3) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('admin');
          toast.error('Invalid session detected. Please log in.');
          setIsLoading(false);
          return;
        }

        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const response = await axios.get(`${API_BASE_URL}/api/admin/me`);
          if (response.data.success) {
            setAdmin(response.data.admin);
            localStorage.setItem('admin', JSON.stringify(response.data.admin));
          } else {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('admin');
            delete axios.defaults.headers.common['Authorization'];
            toast.error('Session invalid. Please log in.');
          }
        } catch (err) {
          console.error('Error fetching admin:', err.message);
          localStorage.removeItem('adminToken');
          localStorage.removeItem('admin');
          delete axios.defaults.headers.common['Authorization'];
          toast.error(err.response?.data?.message || 'Failed to validate session.');
        }
      }
      setIsLoading(false);
    };

    fetchAdmin();
  }, []);

  // Update axios headers and localStorage when admin changes
  useEffect(() => {
    if (admin) {
      localStorage.setItem('admin', JSON.stringify(admin));
      const token = localStorage.getItem('adminToken');
      if (token && typeof token === 'string' && token.split('.').length === 3) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } else {
        localStorage.removeItem('adminToken');
        delete axios.defaults.headers.common['Authorization'];
      }
    } else {
      localStorage.removeItem('admin');
      localStorage.removeItem('adminToken');
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [admin]);

  const handleAuthSubmit = (data) => {
    if (!data.token || typeof data.token !== 'string' || data.token.split('.').length !== 3) {
      toast.error('Invalid token received. Please try again.');
      return;
    }
    setAdmin(data.admin);
    localStorage.setItem('adminToken', data.token);
    localStorage.setItem('admin', JSON.stringify(data.admin));
    toast.success('Logged in successfully!');
    navigate('/admin/dashboard', { replace: true });
  };

  const handleLogout = () => {
    setAdmin(null);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');
    delete axios.defaults.headers.common['Authorization'];
    toast.success('Logged out successfully.');
    navigate('/admin/login', { replace: true });
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-teal-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-teal-600 text-xl font-semibold"
        >
          Loading...
        </motion.div>
      </div>
    );
  }

  const ProtectedLayout = () => (
    <AdminLayout admin={admin} onLogout={handleLogout}>
      <Outlet />
    </AdminLayout>
  );

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/admin/login"
        element={admin ? <Navigate to="/admin/dashboard" replace /> : <AdminLogin onSubmit={handleAuthSubmit} />}
      />
      <Route
        path="/admin/signup"
        element={admin ? <Navigate to="/admin/dashboard" replace /> : <AdminSignup onSubmit={handleAuthSubmit} />}
      />

      {/* Protected Routes */}
      <Route element={admin ? <ProtectedLayout /> : <Navigate to="/admin/login" replace />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/user-management" element={<AdminUserManagement />} />
        <Route path="/admin/task-management" element={<AdminTaskManagement />} />
        <Route path="/admin/goal-management" element={<AdminGoalManagement />} />
        <Route path="/admin/file-management" element={<AdminFileManagement />} />
        <Route path="/admin/user-list" element={<AdminUserList />} />
        <Route path="/admin/task-overview" element={<AdminTaskOverview />} />
        <Route path="/admin/goal-overview" element={<AdminGoalOverview />} />
        <Route path="/admin/file-storage" element={<AdminFileStorage />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        <Route path="/admin/analytics" element={<AdminAnalytics />} />
        <Route path="/admin/profile" element={<AdminProfile admin={admin} setAdmin={setAdmin} onLogout={handleLogout} />} />
      </Route>

      {/* Root and Unknown Routes */}
      <Route path="/" element={<Navigate to={admin ? '/admin/dashboard' : '/admin/login'} replace />} />
      <Route path="*" element={<Navigate to={admin ? '/admin/dashboard' : '/admin/login'} replace />} />
    </Routes>
  );
};

export default App;