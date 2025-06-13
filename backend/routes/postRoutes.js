import express from 'express';
import validator from 'validator';
import sanitizeHtml from 'sanitize-html';
import mongoose from 'mongoose';
import Post from '../models/postModel.js';
import authMiddleware from '../middleware/auth.js';
import { uploadFileToIPFS } from '../pinning/pinata.js';

const router = express.Router();

// Create a post
router.post('/', authMiddleware, async (req, res, next) => {
    const { content, fileUrl, contentType } = req.body;

    if (!content && !fileUrl) {
        return res.status(400).json({ success: false, message: 'Post content or file required' });
    }

    const sanitizedContent = content ? sanitizeHtml(content, { allowedTags: [], allowedAttributes: {} }) : '';
    if (sanitizedContent && !validator.isLength(sanitizedContent, { min: 1, max: 1000 })) {
        return res.status(400).json({ success: false, message: 'Post content must be between 1 and 1000 characters' });
    }

    if (fileUrl && !validator.isURL(fileUrl)) {
        return res.status(400).json({ success: false, message: 'Invalid file URL' });
    }

    try {
        const post = new Post({
            user: req.user._id,
            content: sanitizedContent,
            fileUrl,
            contentType,
        });
        await post.save();
        await post.populate('user', 'name');
        res.json({ success: true, post });
    } catch (error) {
        console.error('Error creating post:', error.message);
        res.status(500).json({ success: false, message: 'Failed to create post' });
        next(error);
    }
});

// Fetch posts (paginated)
router.get('/', authMiddleware, async (req, res, next) => {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    if (pageNum < 1 || limitNum < 1) {
        return res.status(400).json({ success: false, message: 'Invalid page or limit' });
    }

    try {
        const posts = await Post.find()
            .populate('user', 'name')
            .sort({ createdAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum);
        res.json({ success: true, posts });
    } catch (error) {
        console.error('Error fetching posts:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch posts' });
        next(error);
    }
});

// Upload file
router.post('/upload', authMiddleware, async (req, res, next) => {
    try {
        if (!req.files || !req.files.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const file = req.files.file;
        if (file.size > 50 * 1024 * 1024) {
            return res.status(400).json({ success: false, message: 'File size exceeds 50MB' });
        }

        const buffer = file.data;
        const fileName = file.name;
        const mimeType = file.mimetype;
        const cid = await uploadFileToIPFS(buffer, fileName, mimeType);
        const fileUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;
        const contentType = mimeType.split('/')[0];

        res.json({ success: true, fileUrl, contentType });
    } catch (error) {
        console.error('Error uploading file:', error.message);
        res.status(500).json({ success: false, message: error.message });
        next(error);
    }
});

export default router;