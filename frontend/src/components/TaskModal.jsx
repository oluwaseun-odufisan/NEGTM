import React, { useCallback, useEffect, useState } from 'react';
import { Edit, Calendar, CheckSquare, Flag, Save, X, FileText, PlusCircle } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const TaskModal = ({ isOpen, onClose, taskToEdit, onSave, onLogout }) => {
    const [taskData, setTaskData] = useState({
        title: '',
        description: '',
        priority: 'Low',
        dueDate: '',
        completed: 'No',
        id: null,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        if (!isOpen) return;
        if (taskToEdit) {
            const normalized = taskToEdit.completed === 'Yes' || taskToEdit.completed === true ? 'Yes' : 'No';
            setTaskData({
                title: taskToEdit.title || '',
                description: taskToEdit.description || '',
                priority: taskToEdit.priority || 'Low',
                dueDate: taskToEdit.dueDate?.split('T')[0] || '',
                completed: normalized,
                id: taskToEdit._id,
            });
        } else {
            setTaskData({
                title: '',
                description: '',
                priority: 'Low',
                dueDate: '',
                completed: 'No',
                id: null,
            });
        }
        setError(null);
    }, [isOpen, taskToEdit]);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setTaskData((prev) => ({ ...prev, [name]: value }));
    }, []);

    const handleSubmit = useCallback(
        async (e) => {
            e.preventDefault();
            if (!taskData.title.trim()) {
                setError('Task title is required.');
                return;
            }
            if (taskData.dueDate && taskData.dueDate < today) {
                setError('Due date cannot be in the past.');
                return;
            }
            setLoading(true);
            setError(null);

            try {
                onSave?.({
                    _id: taskData.id,
                    title: taskData.title,
                    description: taskData.description,
                    priority: taskData.priority,
                    dueDate: taskData.dueDate,
                    completed: taskData.completed,
                });
                onClose();
            } catch (err) {
                console.error('Error saving task:', err);
                setError(err.response?.data?.message || 'Unexpected error occurred');
                if (err.response?.status === 401) onLogout?.();
            } finally {
                setLoading(false);
            }
        },
        [taskData, today, onSave, onClose, onLogout]
    );

    const priorityStyles = {
        Low: 'bg-gray-50 text-gray-700 border-gray-200',
        Medium: 'bg-orange-50 text-orange-700 border-orange-200',
        High: 'bg-red-50 text-red-700 border-red-200',
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="bg-gradient-to-br from-white to-teal-50/50 backdrop-blur-lg border border-teal-200 rounded-2xl max-w-lg w-full shadow-2xl relative p-6 sm:p-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-3">
                        {taskData.id ? <Edit className="w-6 h-6 text-teal-600" /> : <PlusCircle className="w-6 h-6 text-teal-600" />}
                        {taskData.id ? 'Edit Task' : 'Add Task'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-teal-100 rounded-full transition-colors duration-300 text-gray-600 hover:text-teal-800"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="text-sm text-red-700 bg-red-50/90 p-3 rounded-lg border border-red-200 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                            <Edit className="w-4 h-4 text-teal-600" /> Task Name
                        </label>
                        <input
                            type="text"
                            name="title"
                            required
                            value={taskData.title}
                            onChange={handleChange}
                            className="w-full border border-teal-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-300 bg-white/80 text-gray-800 placeholder-gray-500"
                            placeholder="Enter task name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-teal-600" /> Details
                        </label>
                        <textarea
                            name="description"
                            rows="4"
                            onChange={handleChange}
                            value={taskData.description}
                            className="w-full border border-teal-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-300 resize-none bg-white/80 text-gray-800 placeholder-gray-500"
                            placeholder="Describe your task"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                <Flag className="w-4 h-4 text-teal-600" /> Priority Level
                            </label>
                            <select
                                name="priority"
                                value={taskData.priority}
                                onChange={handleChange}
                                className={`w-full border ${priorityStyles[taskData.priority]} rounded-lg px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-300 text-sm font-medium`}
                            >
                                <option>Low</option>
                                <option>Medium</option>
                                <option>High</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-teal-600" /> Due Date
                            </label>
                            <input
                                type="date"
                                name="dueDate"
                                required
                                min={today}
                                value={taskData.dueDate}
                                onChange={handleChange}
                                className="w-full border border-teal-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-300 bg-white/80 text-gray-800"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                            <CheckSquare className="w-4 h-4 text-teal-600" /> Task Status
                        </label>
                        <div className="flex gap-6">
                            {[{ val: 'Yes', label: 'Completed' }, { val: 'No', label: 'Pending' }].map(({ val, label }) => (
                                <label key={val} className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="completed"
                                        value={val}
                                        checked={taskData.completed === val}
                                        onChange={handleChange}
                                        className="h-5 w-5 text-teal-600 focus:ring-teal-500 border-teal-300 rounded transition-all duration-200"
                                    />
                                    <span className="text-sm text-gray-800 font-medium">{label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-lg transition-all duration-300 hover:from-teal-700 hover:to-emerald-700"
                    >
                        {loading ? (
                            'Saving...'
                        ) : taskData.id ? (
                            <>
                                <Save className="w-5 h-5" /> Update Task
                            </>
                        ) : (
                            <>
                                <PlusCircle className="w-5 h-5" /> Add Task
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default TaskModal;