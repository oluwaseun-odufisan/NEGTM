import File from '../models/fileModel.js';
import Folder from '../models/folderModel.js';
import Task from '../models/taskModel.js';
import { uploadFileToIPFS } from '../pinning/pinata.js';

const ALLOWED_TYPES = ['pdf', 'docx', 'doc', 'jpg', 'jpeg', 'png', 'mp4', 'webm', 'xls', 'xlsx'];
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

// Upload files to IPFS and save metadata
export const pinFileToIPFS = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: 'No files uploaded' });
        }

        const { taskId, tags, folderId } = req.body;
        let taskTitle = null;

        // Validate taskId if provided
        if (taskId) {
            const task = await Task.findOne({ _id: taskId, owner: req.user._id });
            if (!task) {
                return res.status(404).json({ success: false, message: 'Task not found or not yours' });
            }
            taskTitle = task.title;
        }

        // Validate folderId if provided
        if (folderId) {
            const folder = await Folder.findOne({ _id: folderId, owner: req.user._id });
            if (!folder) {
                return res.status(404).json({ success: false, message: 'Folder not found or not yours' });
            }
        }

        // Validate tags
        const tagArray = tags ? JSON.parse(tags).filter(tag => tag && tag.length <= 50 && /^[a-zA-Z0-9\-_]+$/.test(tag)) : [];

        const results = await Promise.all(
            req.files.map(async (file) => {
                try {
                    const fileType = file.originalname.split('.').pop().toLowerCase();
                    if (!ALLOWED_TYPES.includes(fileType)) {
                        throw new Error(`Unsupported file type: ${file.originalname}`);
                    }
                    if (file.size > MAX_FILE_SIZE) {
                        throw new Error(`File ${file.originalname} exceeds 25MB limit`);
                    }

                    console.log(`Uploading file to Pinata: ${file.originalname}, size: ${file.size}, type: ${file.mimetype}`);

                    // Upload to Pinata
                    const cid = await uploadFileToIPFS(file.buffer, file.originalname, file.mimetype);

                    // Check for existing file with same CID
                    let existingFile = await File.findOne({ cid, owner: req.user._id, deleted: false });
                    if (existingFile) {
                        // Generate unique fileName by appending timestamp
                        const timestamp = Date.now();
                        const nameParts = file.originalname.split('.');
                        const extension = nameParts.pop();
                        const baseName = nameParts.join('.');
                        file.originalname = `${baseName}_${timestamp}.${extension}`;
                    }

                    const newFile = new File({
                        fileName: file.originalname,
                        cid,
                        size: file.size,
                        type: fileType,
                        owner: req.user._id,
                        taskId: taskId || null,
                        taskTitle,
                        folderId: folderId || null,
                        tags: tagArray,
                    });

                    const savedFile = await newFile.save();

                    // Update task with file reference
                    if (taskId) {
                        await Task.findByIdAndUpdate(taskId, { $addToSet: { files: savedFile._id } });
                    }

                    return { success: true, file: savedFile };
                } catch (err) {
                    return { success: false, fileName: file.originalname, error: err.message };
                }
            })
        );

        // Separate successful and failed uploads
        const successfulFiles = results.filter(r => r.success).map(r => r.file);
        const failedFiles = results.filter(r => !r.success).map(r => ({ fileName: r.fileName, error: r.error }));

        if (successfulFiles.length === 0) {
            return res.status(400).json({ successregardless: false, message: 'No files uploaded successfully', errors: failedFiles });
        }

        res.status(201).json({
            success: true,
            files: successfulFiles,
            errors: failedFiles.length > 0 ? failedFiles : undefined,
        });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(400).json({ success: false, message: err.message });
    }
};

// Get files with pagination and filtering
export const getFiles = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, type, taskId, tags, trashed, folderId } = req.query;
        const query = { owner: req.user._id };

        if (trashed === 'true') {
            query.deleted = true;
        } else {
            query.deleted = false;
        }

        if (search) {
            query.$or = [
                { fileName: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } },
            ];
        }

        if (type && type !== 'all') {
            query.type = type;
        }

        if (taskId && taskId !== 'all') {
            query.taskId = taskId;
        }

        if (tags) {
            const tagArray = JSON.parse(tags);
            query.tags = { $all: tagArray };
        }

        if (folderId) {
            query.folderId = folderId;
        } else {
            query.folderId = null;
        }

        const files = await File.find(query)
            .sort({ uploadedAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .lean();

        const total = await File.countDocuments(query);
        const hasMore = total > page * limit;

        res.json({ success: true, files, hasMore });
    } catch (err) {
        console.error('Fetch files error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Soft delete file
export const deleteFile = async (req, res) => {
    try {
        const file = await File.findOneAndUpdate(
            { _id: req.params.id, owner: req.user._id, deleted: false },
            { deleted: true, deletedAt: new Date() },
            { new: true }
        );

        if (!file) {
            return res.status(404).json({ success: false, message: 'File not found or not yours' });
        }

        res.json({ success: true, message: 'File moved to trash' });
    } catch (err) {
        console.error('Delete file error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Permanently delete file
export const permanentDeleteFile = async (req, res) => {
    try {
        const file = await File.findOneAndDelete({ _id: req.params.id, owner: req.user._id });

        if (!file) {
            return res.status(404).json({ success: false, message: 'File not found or not yours' });
        }

        // Remove file reference from task
        if (file.taskId) {
            await Task.findByIdAndUpdate(file.taskId, { $pull: { files: file._id } });
        }

        res.json({ success: true, message: 'File permanently deleted' });
    } catch (err) {
        console.error('Permanent delete file error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Restore file from trash
export const restoreFile = async (req, res) => {
    try {
        const file = await File.findOneAndUpdate(
            { _id: req.params.id, owner: req.user._id, deleted: true },
            { deleted: false, deletedAt: null },
            { new: true }
        );

        if (!file) {
            return res.status(404).json({ success: false, message: 'File not found or not yours' });
        }

        res.json({ success: true, message: 'File restored' });
    } catch (err) {
        console.error('Restore file error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Clear all trashed files
export const clearTrash = async (req, res) => {
    try {
        const files = await File.find({ owner: req.user._id, deleted: true });

        await Promise.all(
            files.map(async (file) => {
                if (file.taskId) {
                    await Task.findByIdAndUpdate(file.taskId, { $pull: { files: file._id } });
                }
                await File.deleteOne({ _id: file._id });
            })
        );

        res.json({ success: true, message: 'Trash cleared' });
    } catch (err) {
        console.error('Clear trash error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Share file with expiration
export const shareFile = async (req, res) => {
    try {
        const { expiresInDays = 7 } = req.body;
        const file = await File.findOne({ _id: req.params.id, owner: req.user._id });

        if (!file) {
            return res.status(404).json({ success: false, message: 'File not found or not yours' });
        }

        const shareLink = `https://gateway.pinata.cloud/ipfs/${file.cid}`;
        const shareExpires = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

        const updatedFile = await File.findByIdAndUpdate(
            req.params.id,
            { shareLink, shareExpires },
            { new: true }
        );

        res.json({ success: true, shareLink, shareExpires });
    } catch (err) {
        console.error('Share file error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Associate file with task
export const associateTask = async (req, res) => {
    try {
        const { taskId } = req.body;
        let taskTitle = null;

        if (taskId) {
            const task = await Task.findOne({ _id: taskId, owner: req.user._id });
            if (!task) {
                return res.status(404).json({ success: false, message: 'Task not found or not yours' });
            }
            taskTitle = task.title;
        }

        const file = await File.findOne({ _id: req.params.id, owner: req.user._id });
        if (!file) {
            return res.status(404).json({ success: false, message: 'File not found or not yours' });
        }

        // Remove file from previous task
        if (file.taskId) {
            await Task.findByIdAndUpdate(file.taskId, { $pull: { files: file._id } });
        }

        // Update file with new task
        const updatedFile = await File.findByIdAndUpdate(
            req.params.id,
            { taskId: taskId || null, taskTitle },
            { new: true }
        );

        // Add file to new task
        if (taskId) {
            await Task.findByIdAndUpdate(taskId, { $addToSet: { files: file._id } });
        }

        res.json({ success: true, taskId: updatedFile.taskId, taskTitle: updatedFile.taskTitle });
    } catch (err) {
        console.error('Associate task error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Add or update tags
export const updateTags = async (req, res) => {
    try {
        const { tag } = req.body;
        if (!tag || !/^[a-zA-Z0-9\-_]+$/.test(tag) || tag.length > 50) {
            return res.status(400).json({ success: false, message: 'Invalid tag' });
        }

        const file = await File.findOneAndUpdate(
            { _id: req.params.id, owner: req.user._id },
            { $addToSet: { tags: tag } },
            { new: true }
        );

        if (!file) {
            return res.status(404).json({ success: false, message: 'File not found or not yours' });
        }

        res.json({ success: true, tags: file.tags });
    } catch (err) {
        console.error('Update tags error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Move files to a folder
export const moveFiles = async (req, res) => {
    try {
        const { fileIds, folderId } = req.body;

        if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
            return res.status(400).json({ success: false, message: 'No files selected to move' });
        }

        // Validate folderId if provided
        if (folderId) {
            const folder = await Folder.findOne({ _id: folderId, owner: req.user._id });
            if (!folder) {
                return res.status(404).json({ success: false, message: 'Folder not found or not yours' });
            }
        }

        // Validate files
        const files = await File.find({
            _id: { $in: fileIds },
            owner: req.user._id,
            deleted: false,
        });

        if (files.length !== fileIds.length) {
            return res.status(404).json({ success: false, message: 'Some files not found or not yours' });
        }

        // Update folderId for all files
        await File.updateMany(
            { _id: { $in: fileIds }, owner: req.user._id },
            { folderId: folderId || null }
        );

        res.json({ success: true, message: 'Files moved successfully' });
    } catch (err) {
        console.error('Move files error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};