import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MaterialList from '../components/MaterialList';
import MaterialViewer from '../components/MaterialViewer';
import TrainingProgress from '../components/TrainingProgress';
import AIChat from '../components/AIChat';
import { Toaster, toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

const Learning = () => {
  const [courses, setCourses] = useState([]);
  const [progress, setProgress] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
    fetchProgress();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to access learning materials');
        return;
      }
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/learning/courses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCourses(res.data.courses || []);
    } catch (err) {
      toast.error('Failed to load courses. Please try again.');
      console.error('Fetch courses error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/learning/progress`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProgress(res.data.progress || []);
    } catch (err) {
      toast.error('Failed to load progress.');
      console.error('Fetch progress error:', err);
    }
  };

  const handleCourseSelect = (course) => {
    setSelectedCourse(course);
  };

  const handleModuleComplete = async (courseId, moduleId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_URL}/api/learning/progress`, { courseId, moduleId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchProgress(); // Refresh progress
      toast.success('Module completed! Progress updated.');
    } catch (err) {
      toast.error('Failed to update progress.');
      console.error('Update progress error:', err);
    }
  };

  const handleBack = () => {
    setSelectedCourse(null);
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <Toaster position="top-right" />
      <motion.h1 
        className="text-3xl font-bold text-blue-800 mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Learning Management System
      </motion.h1>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : selectedCourse ? (
            <MaterialViewer 
              course={selectedCourse} 
              onCompleteModule={handleModuleComplete} 
              onBack={handleBack}
            />
          ) : (
            <MaterialList 
              courses={courses} 
              progress={progress} 
              onSelect={handleCourseSelect} 
            />
          )}
        </div>
        <div className="space-y-8">
          <TrainingProgress progress={progress} courses={courses} />
          <AIChat />
        </div>
      </div>
    </div>
  );
};

export default Learning;