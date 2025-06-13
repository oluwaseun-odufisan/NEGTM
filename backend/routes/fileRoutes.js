import express from 'express';
import authMiddleware from '../middleware/auth.js';
import {
    pinFileToIPFS,
    getFiles,
    deleteFile,
    permanentDeleteFile,
    restoreFile,
    clearTrash,
    shareFile,
    associateTask,
    updateTags,
    moveFiles,
} from '../controllers/fileController.js';
import {
    createFolder,
    getFolders,
    deleteFolder,
} from '../controllers/folderController.js';
import multer from 'multer';

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
});

const fileRouter = express.Router();

fileRouter.get('/', authMiddleware, getFiles);
fileRouter.post('/pinFileToIPFS', authMiddleware, upload.array('files'), pinFileToIPFS);
fileRouter.patch('/:id/delete', authMiddleware, deleteFile);
fileRouter.delete('/:id', authMiddleware, permanentDeleteFile);
fileRouter.patch('/:id/restore', authMiddleware, restoreFile);
fileRouter.delete('/trash/clear', authMiddleware, clearTrash);
fileRouter.post('/:id/share', authMiddleware, shareFile);
fileRouter.patch('/:id/task', authMiddleware, associateTask);
fileRouter.patch('/:id/tags', authMiddleware, updateTags);
fileRouter.patch('/move', authMiddleware, moveFiles);

fileRouter.get('/folders', authMiddleware, getFolders);
fileRouter.post('/folders', authMiddleware, createFolder);
fileRouter.delete('/folders/:id', authMiddleware, deleteFolder);

export default fileRouter;