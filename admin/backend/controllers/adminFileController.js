import axios from 'axios';
import multer from 'multer';
import FormData from 'form-data';
import mongoose from 'mongoose';

const USER_API_URL = process.env.USER_API_URL || 'http://localhost:4001';
const USER_API_TOKEN = process.env.USER_API_TOKEN;

// Configure multer for in-memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
});

// Helper to make authenticated API calls to user backend
const makeUserApiCall = async (method, endpoint, data = {}, headers = {}) => {
    try {
        const response = await axios({
            method,
            url: `${USER_API_URL}/api/files${endpoint}`,
            data,
            headers: {
                Authorization: `Bearer ${USER_API_TOKEN}`,
                ...headers,
            },
        });
        return response.data;
    } catch (err) {
        console.error(`Error calling user API (${method} ${endpoint}):`, err.message);
        throw new Error(err.response?.data?.message || 'Failed to communicate with user backend');
    }
};

// Get all files for a specific user
export const getUserFiles = async (req, res) => {
    try {
        if (req.admin.role !== 'super-admin') {
            return res.status(403).json({ success: false, message: 'Access denied: Super-admin role required' });
        }

        const { userId } = req.params;
        const { page = 1, limit = 10, search, type, taskId, tags, trashed, folderId } = req.query;

        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID' });
        }

        const params = { page, limit, search, type, taskId, tags, trashed, folderId };
        const response = await makeUserApiCall('get', `/admin/user/${userId}`, null, { params });

        res.json({ success: true, files: response.files, hasMore: response.hasMore });
    } catch (err) {
        console.error('Error fetching user files:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Upload files for a specific user or multiple users
export const uploadFileForUsers = async (req, res) => {
    try {
        if (req.admin.role !== 'super-admin') {
            return res.status(403).json({ success: false, message: 'Access denied: Super-admin role required' });
        }

        const { userIds, taskId, tags, folderId } = req.body;
        const files = req.files;

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ success: false, message: 'At least one user ID is required' });
        }

        if (!files || files.length === 0) {
            return res.status(400).json({ success: false, message: 'No files uploaded' });
        }

        // Validate user IDs
        for (const userId of userIds) {
            if (!mongoose.isValidObjectId(userId)) {
                return res.status(400).json({ success: false, message: `Invalid user ID: ${userId}` });
            }
        }

        const results = [];
        for (const userId of userIds) {
            const formData = new FormData();
            files.forEach((file) => {
                formData.append('files', file.buffer, {
                    filename: file.originalname,
                    contentType: file.mimetype,
                });
            });
            if (taskId) formData.append('taskId', taskId);
            if (tags) formData.append('tags', JSON.stringify(tags));
            if (folderId) formData.append('folderId', folderId);

            const response = await makeUserApiCall('post', `/admin/upload/${userId}`, formData, {
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`,
                },
            });

            results.push({ userId, files: response.files, errors: response.errors });
        }

        res.status(201).json({ success: true, results });
    } catch (err) {
        console.error('Error uploading files:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Modify a user's file
export const modifyUserFile = async (req, res) => {
    try {
        if (req.admin.role !== 'super-admin') {
            return res.status(403).json({ success: false, message: 'Access denied: Super-admin role required' });
        }

        const { userId, fileId } = req.params;
        const { fileName, taskId, tags, folderId } = req.body;

        if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(fileId)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID or file ID' });
        }

        const response = await makeUserApiCall('patch', `/admin/user/${userId}/file/${fileId}`, {
            fileName,
            taskId,
            tags,
            folderId,
        });

        res.json({ success: true, file: response.file });
    } catch (err) {
        console.error('Error modifying user file:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Delete a user's file
export const deleteUserFile = async (req, res) => {
    try {
        if (req.admin.role !== 'super-admin') {
            return res.status(403).json({ success: false, message: 'Access denied: Super-admin role required' });
        }

        const { userId, fileId } = req.params;
        const { permanent } = req.query;

        if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(fileId)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID or file ID' });
        }

        const endpoint = permanent === 'true' ? `/admin/user/${userId}/file/${fileId}` : `/admin/user/${userId}/file/${fileId}/delete`;
        const method = permanent === 'true' ? 'delete' : 'patch';

        const response = await makeUserApiCall(method, endpoint);

        res.json({ success: true, message: response.message });
    } catch (err) {
        console.error('Error deleting user file:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get storage usage for a user
export const getUserStorageUsage = async (req, res) => {
    try {
        if (req.admin.role !== 'super-admin') {
            return res.status(403).json({ success: false, message: 'Access denied: Super-admin role required' });
        }

        const { userId } = req.params;

        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID' });
        }

        const response = await makeUserApiCall('get', `/admin/storage/${userId}`);

        res.json({ success: true, storageUsed: response.storageUsed, totalStorage: response.totalStorage });
    } catch (err) {
        console.error('Error fetching storage usage:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};