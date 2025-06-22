import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';
import {
    Upload, Trash2, FileText, Image, Video, Download, List, Grid,
    Search, Tag, Folder, ChevronRight, Plus, Info, Link2, FolderPlus,
    Users, HardDrive, ChevronDown, ChevronUp, X, Edit2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const FilePreviewModal = ({ isOpen, onClose, file }) => {
    if (!isOpen || !file) return null;

    const url = `https://gateway.pinata.cloud/ipfs/${file.cid}`;
    const type = file.type?.toLowerCase();

    const renderPreview = () => {
        if (['jpg', 'jpeg', 'png'].includes(type)) {
            return <img src={url} alt={file.fileName} className="w-full h-auto rounded-lg max-h-[70vh] object-contain" />;
        }
        if (['mp4', 'webm'].includes(type)) {
            return <video controls autoPlay muted className="w-full max-h-[70vh] rounded-lg"><source src={url} type={`video/${type}`} /></video>;
        }
        if (type === 'pdf') {
            return <iframe src={url} className="w-full h-[70vh] rounded-lg" title="PDF Preview" />;
        }
        return <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center"><p className="text-gray-500">No preview available</p></div>;
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/80 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">{file.fileName}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
                </div>
                {renderPreview()}
                <div className="mt-4 space-y-2 text-sm text-gray-600">
                    <p><span className="font-medium">Size:</span> {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    <p><span className="font-medium">Type:</span> {file.type}</p>
                    <p><span className="font-medium">Uploaded:</span> {new Date(file.uploadedAt).toLocaleString()}</p>
                </div>
            </motion.div>
        </motion.div>
    );
};

const UploadModal = ({ isOpen, onClose, users, onUpload, tasks, currentFolderId }) => {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [taskId, setTaskId] = useState('');
    const [tags, setTags] = useState('');
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setSelectedFiles(files);
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedFiles.length) return setError('Please select files');
        if (!selectedUserIds.length) return setError('Please select at least one user');

        try {
            const formData = new FormData();
            selectedFiles.forEach(file => formData.append('files', file));
            formData.append('userIds', JSON.stringify(selectedUserIds));
            if (taskId) formData.append('taskId', taskId);
            if (tags) formData.append('tags', tags.split(',').map(t => t.trim()));
            if (currentFolderId) formData.append('folderId', currentFolderId);

            await onUpload(formData);
            setSelectedFiles([]);
            setSelectedUserIds([]);
            setTaskId('');
            setTags('');
            setError(null);
            onClose();
        } catch (err) {
            setError(err.message || 'Upload failed');
        }
    };

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/80 flex items-center justify-center z-50"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-white rounded-2xl p-6 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-lg font-semibold mb-4">Upload Files</h3>
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm text-gray-600">Select Users</label>
                        <select
                            multiple
                            value={selectedUserIds}
                            onChange={(e) => setSelectedUserIds(Array.from(e.target.selectedOptions, option => option.value))}
                            className="w-full p-2 border rounded-md"
                        >
                            {users.map(user => (
                                <option key={user._id} value={user._id}>{user.name} ({user.email})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm text-gray-600">Files</label>
                        <input
                            type="file"
                            multiple
                            onChange={handleFileChange}
                            className="w-full p-2 border rounded-md"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-gray-600">Task</label>
                        <select
                            value={taskId}
                            onChange={(e) => setTaskId(e.target.value)}
                            className="w-full p-2 border rounded-md"
                        >
                            <option value="">No Task</option>
                            {tasks.map(task => (
                                <option key={task._id} value={task._id}>{task.title}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm text-gray-600">Tags</label>
                        <input
                            type="text"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            placeholder="e.g., report, urgent"
                            className="w-full p-2 border rounded-md"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!selectedFiles.length || !selectedUserIds.length}
                        className="w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
                    >
                        Upload
                    </button>
                </form>
            </motion.div>
        </motion.div>
    );
};

const AdminFileManager = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [files, setFiles] = useState([]);
    const [folders, setFolders] = useState([]);
    const [currentFolder, setCurrentFolder] = useState(null);
    const [viewMode, setViewMode] = useState('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [previewModal, setPreviewModal] = useState(false);
    const [uploadModal, setUploadModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [storageUsage, setStorageUsage] = useState({ storageUsed: 0, totalStorage: 2 * 1024 * 1024 * 1024 });
    const [tasks, setTasks] = useState([]);

    const fetchUsers = useCallback(async () => {
        try {
            const { data } = await axios.get(`${API_BASE_URL}/api/admin/users`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
            });
            setUsers(data.users);
        } catch (err) {
            toast.error('Failed to fetch users');
        }
    }, []);

    const fetchUserData = useCallback(async (userId) => {
        if (!userId) return;
        try {
            const [filesRes, foldersRes, storageRes, tasksRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/admin/users/${userId}/files`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
                }),
                axios.get(`${API_BASE_URL}/api/admin/users/${userId}/folders`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
                }),
                axios.get(`${API_BASE_URL}/api/admin/users/${userId}/storage`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
                }),
                axios.get(`${API_BASE_URL}/api/admin/tasks?ownerId=${userId}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
                }),
            ]);

            setFiles(filesRes.data.files);
            setFolders(foldersRes.data.folders);
            setStorageUsage(storageRes.data);
            setTasks(tasksRes.data.tasks);
        } catch (err) {
            toast.error('Failed to fetch user data');
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    useEffect(() => {
        fetchUserData(selectedUserId);
    }, [selectedUserId, fetchUserData]);

    const handleUpload = async (formData) => {
        try {
            const { data } = await axios.post(`${API_BASE_URL}/api/admin/users/upload`, formData, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
                    'Content-Type': 'multipart/form-data',
                },
            });
            toast.success('Files uploaded successfully');
            fetchUserData(selectedUserId);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Upload failed');
        }
    };

    const handleDelete = async (fileId, permanent = false) => {
        if (!window.confirm(permanent ? 'Permanently delete this file?' : 'Move to trash?')) return;
        try {
            await axios[permanent ? 'delete' : 'patch'](
                `${API_BASE_URL}/api/admin/users/${selectedUserId}/files/${fileId}${permanent ? '' : '/delete'}`,
                {},
                { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }
            );
            toast.success(permanent ? 'File permanently deleted' : 'File moved to trash');
            fetchUserData(selectedUserId);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Delete failed');
        }
    };

    const handlePreview = (file) => {
        setSelectedFile(file);
        setPreviewModal(true);
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(2)} ${units[unitIndex]}`;
    };

    const getFileIcon = (type) => {
        type = type?.toLowerCase();
        if (['jpg', 'jpeg', 'png'].includes(type)) return <Image className="w-6 h-6 text-blue-500" />;
        if (['mp4', 'webm'].includes(type)) return <Video className="w-6 h-6 text-red-500" />;
        if (type === 'pdf') return <FileText className="w-6 h-6 text-red-500" />;
        return <FileText className="w-6 h-6 text-gray-500" />;
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-gray-100 p-6"
        >
            <Toaster />
            <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">User File Manager</h1>
                    <button
                        onClick={() => navigate('/admin/dashboard')}
                        className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                        Back to Dashboard
                    </button>
                </div>

                <div className="mb-4">
                    <label className="text-sm text-gray-600">Select User</label>
                    <select
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        className="w-full p-2 border rounded-md"
                    >
                        <option value="">Select a user</option>
                        {users.map(user => (
                            <option key={user._id} value={user._id}>{user.name} ({user.email})</option>
                        ))}
                    </select>
                </div>

                {selectedUserId && (
                    <>
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setUploadModal(true)}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                                >
                                    Upload Files
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 ${viewMode === 'grid' ? 'bg-blue-100' : ''} rounded-md`}
                                >
                                    <Grid className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 ${viewMode === 'list' ? 'bg-blue-100' : ''} rounded-md`}
                                >
                                    <List className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="mb-4">
                            <p className="text-sm text-gray-600">
                                Storage Used: {formatFileSize(storageUsage.storageUsed)} of {formatFileSize(storageUsage.totalStorage)}
                            </p>
                            <div className="h-2 bg-gray-200 rounded-full">
                                <div
                                    className="h-2 bg-blue-500 rounded-full"
                                    style={{ width: `${(storageUsage.storageUsed / storageUsage.totalStorage) * 100}%` }}
                                />
                            </div>
                        </div>

                        <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'}`}>
                            {files.map(file => (
                                <motion.div
                                    key={file._id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md"
                                >
                                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => handlePreview(file)}>
                                        {getFileIcon(file.type)}
                                        <p className="text-sm truncate">{file.fileName}</p>
                                    </div>
                                    <div className="flex justify-end gap-2 mt-2">
                                        <button
                                            onClick={() => handleDelete(file._id, false)}
                                            className="p-1 text-red-500 hover:bg-red-100 rounded-full"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(file._id, true)}
                                            className="p-1 text-red-500 hover:bg-red-100 rounded-full"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <FilePreviewModal
                isOpen={previewModal}
                onClose={() => setPreviewModal(false)}
                file={selectedFile}
            />
            <UploadModal
                isOpen={uploadModal}
                onClose={() => setUploadModal(false)}
                users={users}
                onUpload={handleUpload}
                tasks={tasks}
                currentFolderId={currentFolder}
            />
        </motion.div>
    );
};

export default AdminFileManager;