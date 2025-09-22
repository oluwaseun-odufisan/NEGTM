import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Send, Paperclip, Image, Video, FileText, ArrowLeft, Smile, Edit2, Trash2, ArrowUp, ArrowDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import moment from 'moment-timezone';
import { Tooltip } from 'react-tooltip';
import io from 'socket.io-client';
import EmojiPicker from 'emoji-picker-react';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const SocialFeed = () => {
    const { user, onLogout } = useOutletContext();
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [postIds, setPostIds] = useState(new Set());
    const [newPost, setNewPost] = useState('');
    const [file, setFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isPosting, setIsPosting] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [editingPost, setEditingPost] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const fileInputRef = useRef(null);
    const observer = useRef();
    const modalRef = useRef(null);
    const emojiButtonRef = useRef(null);
    const feedRef = useRef(null);
    const fetchedPages = useRef(new Set());
    const fetchTimeout = useRef(null);

    // Debug user context
    useEffect(() => {
        console.log('User from context:', user);
        if (!user?._id) {
            console.warn('User ID is missing or undefined');
        }
    }, [user]);

    // Socket.IO for real-time posts
    useEffect(() => {
        const socket = io(API_BASE_URL, {
            auth: { token: localStorage.getItem('token') },
        });
        socket.on('newPost', (post) => {
            console.log('Received new post:', post);
            setPosts((prev) => {
                if (postIds.has(post._id)) return prev;
                setPostIds((prevIds) => new Set([...prevIds, post._id]));
                return [post, ...prev];
            });
        });
        socket.on('postUpdated', (updatedPost) => {
            console.log('Received updated post:', updatedPost);
            setPosts((prev) =>
                prev.map((post) =>
                    post._id === updatedPost._id ? updatedPost : post
                )
            );
        });
        socket.on('postDeleted', (postId) => {
            console.log('Received deleted post ID:', postId);
            setPosts((prev) => prev.filter((post) => post._id !== postId));
            setPostIds((prevIds) => {
                const newIds = new Set(prevIds);
                newIds.delete(postId);
                return newIds;
            });
        });
        socket.on('connect_error', (error) => {
            console.error('Socket connect error:', error.message);
            toast.error('Real-time updates unavailable.', { style: { background: '#2DD4BF', color: '#FFFFFF' } });
        });
        return () => {
            socket.off('newPost');
            socket.off('postUpdated');
            socket.off('postDeleted');
            socket.disconnect();
        };
    }, [postIds]);

    // Axios interceptor for 401 handling
    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    toast.error('Session expired. Please log in.', { style: { background: '#2DD4BF', color: '#FFFFFF' } });
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    onLogout?.();
                    navigate('/login');
                }
                return Promise.reject(error);
            }
        );
        return () => axios.interceptors.response.eject(interceptor);
    }, [onLogout, navigate]);

    // Modal focus trap and escape key handling
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setSelectedImage(null);
                setSelectedDoc(null);
                setShowEmojiPicker(false);
                setEditingPost(null);
                setShowDeleteConfirm(null);
            }
        };
        if (selectedImage || selectedDoc || showEmojiPicker || editingPost || showDeleteConfirm) {
            modalRef.current?.focus();
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedImage, selectedDoc, showEmojiPicker, editingPost, showDeleteConfirm]);

    // Close emoji picker, edit modal, or delete confirm when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                showEmojiPicker &&
                emojiButtonRef.current &&
                !emojiButtonRef.current.contains(e.target) &&
                !e.target.closest('.emoji-picker-react')
            ) {
                setShowEmojiPicker(false);
            }
            if (
                editingPost &&
                modalRef.current &&
                !modalRef.current.contains(e.target)
            ) {
                setEditingPost(null);
                setEditContent('');
            }
            if (
                showDeleteConfirm &&
                modalRef.current &&
                !modalRef.current.contains(e.target)
            ) {
                setShowDeleteConfirm(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showEmojiPicker, editingPost, showDeleteConfirm]);

    const getAuthHeaders = useCallback(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error('Session expired. Please log in.', { style: { background: '#2DD4BF', color: '#FFFFFF' } });
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            onLogout?.();
            navigate('/login');
            throw new Error('No auth token');
        }
        return { Authorization: `Bearer ${token}` };
    }, [onLogout, navigate]);

    const fetchPosts = useCallback(
        async (pageNum) => {
            if (isLoading || !hasMore || fetchedPages.current.has(pageNum)) return;
            setIsLoading(true);
            fetchedPages.current.add(pageNum);
            console.log(`Fetching posts for page ${pageNum}`);
            try {
                const response = await axios.get(`${API_BASE_URL}/api/posts?page=${pageNum}&limit=10`, {
                    headers: getAuthHeaders(),
                });
                const newPosts = response.data.posts;
                console.log('Fetched posts:', newPosts);
                setPosts((prev) => {
                    const newUniquePosts = newPosts.filter((post) => !postIds.has(post._id));
                    if (!newUniquePosts.length) return prev;
                    setPostIds((prevIds) => new Set([...prevIds, ...newUniquePosts.map((post) => post._id)]));
                    return [...prev, ...newUniquePosts];
                });
                setHasMore(newPosts.length === 10);
            } catch (error) {
                console.error('Fetch posts error:', error.response?.data || error.message);
                fetchedPages.current.delete(pageNum);
                if (error.response?.status !== 401) {
                    toast.error(error.response?.data?.message || 'Failed to fetch posts.', { style: { background: '#2DD4BF', color: '#FFFFFF' } });
                }
            } finally {
                setIsLoading(false);
            }
        },
        [getAuthHeaders, isLoading, hasMore, postIds]
    );

    useEffect(() => {
        if (!user || !localStorage.getItem('token')) {
            navigate('/login');
            return;
        }
        fetchPosts(page);
    }, [user, page, fetchPosts, navigate]);

    const lastPostElementRef = useCallback(
        (node) => {
            if (isLoading || !hasMore) return;
            if (observer.current) observer.current.disconnect();
            observer.current = new IntersectionObserver(
                (entries) => {
                    if (entries[0].isIntersecting && hasMore && !fetchTimeout.current) {
                        fetchTimeout.current = setTimeout(() => {
                            console.log('Observer triggered, incrementing page');
                            setPage((prev) => prev + 1);
                            fetchTimeout.current = null;
                        }, 500);
                    }
                },
                { threshold: 0.1 }
            );
            if (node) observer.current.observe(node);
        },
        [isLoading, hasMore]
    );

    const handleFileChange = useCallback((e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.size > 50 * 1024 * 1024) {
                toast.error('File size exceeds 50MB.', { style: { background: '#2DD4BF', color: '#FFFFFF' } });
                return;
            }
            setFile(selectedFile);
            if (selectedFile.type.startsWith('image/') || selectedFile.type.startsWith('video/')) {
                setFilePreview(URL.createObjectURL(selectedFile));
            } else {
                setFilePreview(null);
            }
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, []);

    const uploadFile = useCallback(
        async (file) => {
            try {
                const formData = new FormData();
                formData.append('file', file);
                const response = await axios.post(`${API_BASE_URL}/api/posts/upload`, formData, {
                    headers: {
                        ...getAuthHeaders(),
                        'Content-Type': 'multipart/form-data',
                    },
                });
                return response.data;
            } catch (error) {
                console.error('File upload error:', error.response?.data || error.message);
                throw new Error(error.response?.data?.message || 'Failed to upload file.');
            }
        },
        [getAuthHeaders]
    );

    const handleEmojiClick = useCallback((emojiObject) => {
        setNewPost((prev) => prev + emojiObject.emoji);
        if (editingPost) {
            setEditContent((prev) => prev + emojiObject.emoji);
        }
    }, [editingPost]);

    const handleCreatePost = useCallback(async () => {
        if (!newPost.trim() && !file) {
            toast.error('Post content or file required.', { style: { background: '#2DD4BF', color: '#FFFFFF' } });
            return;
        }
        setIsPosting(true);
        let fileUrl = '';
        let contentType = '';

        if (file) {
            try {
                const { fileUrl: uploadedUrl, contentType: fileContentType } = await uploadFile(file);
                fileUrl = uploadedUrl;
                contentType = fileContentType;
            } catch (error) {
                toast.error(error.message, { style: { background: '#2DD4BF', color: '#FFFFFF' } });
                setIsPosting(false);
                return;
            }
        }

        try {
            await axios.post(
                `${API_BASE_URL}/api/posts`,
                { content: newPost.trim(), fileUrl, contentType },
                { headers: getAuthHeaders() }
            );
            setNewPost('');
            setFile(null);
            setFilePreview(null);
            setShowEmojiPicker(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            toast.success('Post created!', { style: { background: '#2DD4BF', color: '#FFFFFF' } });
            feedRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            console.error('Create post error:', error.response?.data || error.message);
            if (error.response?.status !== 401) {
                toast.error(error.response?.data?.message || 'Failed to create post.', { style: { background: '#2DD4BF', color: '#FFFFFF' } });
            }
        } finally {
            setIsPosting(false);
        }
    }, [newPost, file, getAuthHeaders]);

    const handleEditPost = useCallback(async (postId) => {
        if (!editContent.trim() && !file) {
            toast.error('Post content or file required.', { style: { background: '#2DD4BF', color: '#FFFFFF' } });
            return;
        }
        setIsPosting(true);
        let fileUrl = '';
        let contentType = '';

        if (file) {
            try {
                const { fileUrl: uploadedUrl, contentType: fileContentType } = await uploadFile(file);
                fileUrl = uploadedUrl;
                contentType = fileContentType;
            } catch (error) {
                toast.error(error.message, { style: { background: '#2DD4BF', color: '#FFFFFF' } });
                setIsPosting(false);
                return;
            }
        }

        try {
            const response = await axios.put(
                `${API_BASE_URL}/api/posts/${postId}`,
                { content: editContent.trim(), fileUrl, contentType },
                { headers: getAuthHeaders() }
            );
            const updatedPost = response.data.post;
            setPosts((prev) => {
                const otherPosts = prev.filter((post) => post._id !== postId);
                return [updatedPost, ...otherPosts];
            });
            setEditingPost(null);
            setEditContent('');
            setFile(null);
            setFilePreview(null);
            toast.success('Post updated!', { style: { background: '#2DD4BF', color: '#FFFFFF' } });
            feedRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            console.error('Edit post error:', error.response?.data || error.message);
            if (error.response?.status === 403) {
                toast.error('You are not authorized to edit this post.', { style: { background: '#2DD4BF', color: '#FFFFFF' } });
            } else if (error.response?.status !== 401) {
                toast.error(error.response?.data?.message || 'Failed to update post.', { style: { background: '#2DD4BF', color: '#FFFFFF' } });
            }
        } finally {
            setIsPosting(false);
        }
    }, [editContent, file, getAuthHeaders]);

    const handleDeletePost = useCallback(async (postId) => {
        try {
            await axios.delete(`${API_BASE_URL}/api/posts/${postId}`, {
                headers: getAuthHeaders(),
            });
            toast.success('Post deleted!', { style: { background: '#2DD4BF', color: '#FFFFFF' } });
        } catch (error) {
            console.error('Delete post error:', error.response?.data || error.message);
            if (error.response?.status === 403) {
                toast.error('You are not authorized to delete this post.', { style: { background: '#2DD4BF', color: '#FFFFFF' } });
            } else if (error.response?.status !== 401) {
                toast.error(error.response?.data?.message || 'Failed to delete post.', { style: { background: '#2DD4BF', color: '#FFFFFF' } });
            }
        }
    }, [getAuthHeaders]);

    const handleConfirmDelete = useCallback((postId) => {
        setShowDeleteConfirm(postId);
    }, []);

    const handleCancelDelete = useCallback(() => {
        setShowDeleteConfirm(null);
    }, []);

    const handleConfirmDeleteAction = useCallback(async () => {
        if (showDeleteConfirm) {
            await handleDeletePost(showDeleteConfirm);
            setShowDeleteConfirm(null);
        }
    }, [showDeleteConfirm, handleDeletePost]);

    const startEditing = (post) => {
        setEditingPost(post._id);
        setEditContent(post.content || '');
        setFile(null);
        setFilePreview(null);
    };

    const scrollToTop = () => {
        feedRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const scrollToBottom = () => {
        feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: 'smooth' });
    };

    const modalVariants = {
        hidden: { opacity: 0, scale: 0.8 },
        visible: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.8 },
    };

    if (!user || !localStorage.getItem('token')) {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-teal-100 flex flex-col font-sans"
        >
            <Toaster position="bottom-right" />
            <div className="flex-1 max-w-[1600px] mx-auto w-full px-8 py-12">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white/95 backdrop-blur-lg border border-teal-100/50 rounded-3xl shadow-lg flex flex-col min-h-[calc(100vh-6rem)] lg:min-h-[900px] overflow-hidden"
                >
                    <header className="bg-teal-50/50 border-b border-teal-200/50 px-8 py-6 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <Send className="w-8 h-8 text-teal-600 animate-pulse" />
                            <div className="min-w-0">
                                <h1 className="text-3xl font-bold text-blue-900 tracking-tight truncate">Social Connect</h1>
                                <p className="text-base text-teal-600 tracking-tight line-clamp-1">Share Your Updates</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/')}
                                className="flex items-center gap-3 bg-teal-100 text-teal-600 px-6 py-3 rounded-lg hover:bg-teal-200 transition-all duration-300 text-base hover:scale-105 hover:shadow-md"
                                aria-label="Back to Dashboard"
                            >
                                <ArrowLeft className="w-6 h-6" />
                                Back to Dashboard
                            </button>
                            <img
                                src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}`}
                                alt="User Avatar"
                                className="w-12 h-12 rounded-full border-2 border-teal-400/50 hover:shadow-sm transition-all duration-200 flex-shrink-0"
                            />
                        </div>
                    </header>
                    <main className="flex-1 p-8">
                        <motion.div
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white/95 backdrop-blur-md border border-teal-200/50 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 mb-8"
                        >
                            <div className="flex items-start gap-6">
                                <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-lg font-bold flex-shrink-0">
                                    {user.name
                                        .trim()
                                        .split(' ')
                                        .map((word) => word[0])
                                        .slice(0, 2)
                                        .join('')
                                        .toUpperCase()}
                                </div>
                                <div className="flex-1 relative">
                                    <textarea
                                        value={newPost}
                                        onChange={(e) => setNewPost(e.target.value)}
                                        placeholder="Share your thoughts..."
                                        className="w-full p-4 text-base text-gray-800 border border-teal-300/50 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-transparent resize-y mb-4 transition-all duration-300"
                                        rows="4"
                                        maxLength={1000}
                                        aria-label="New post content"
                                    />
                                    {file && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="flex items-center gap-4 mb-4"
                                        >
                                            {filePreview && file.type.startsWith('image/') && (
                                                <img src={filePreview} alt="Preview" className="w-20 h-20 object-cover rounded-lg shadow-sm" />
                                            )}
                                            {filePreview && file.type.startsWith('video/') && (
                                                <video src={filePreview} className="w-20 h-20 object-cover rounded-lg shadow-sm" />
                                            )}
                                            <span className="text-base text-gray-600 truncate max-w-md">{file.name}</span>
                                            <button
                                                onClick={() => {
                                                    setFile(null);
                                                    setFilePreview(null);
                                                }}
                                                className="text-red-500 hover:text-red-600 transition-colors duration-300"
                                                aria-label="Remove file"
                                            >
                                                <X className="w-6 h-6" />
                                            </button>
                                        </motion.div>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <div className="flex gap-4">
                                            <button
                                                ref={emojiButtonRef}
                                                onClick={() => setShowEmojiPicker((prev) => !prev)}
                                                className="p-2 text-blue-900 hover:text-teal-600 transition-colors duration-300"
                                                data-tooltip-id="add-emoji"
                                                data-tooltip-content="Add Emoji"
                                                aria-label="Add Emoji"
                                            >
                                                <Smile className="w-6 h-6" />
                                                <Tooltip id="add-emoji" className="bg-teal-600 text-white" />
                                            </button>
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="p-2 text-blue-900 hover:text-teal-600 transition-colors duration-300"
                                                data-tooltip-id="attach-image"
                                                data-tooltip-content="Attach Image"
                                                aria-label="Attach Image"
                                            >
                                                <Image className="w-6 h-6" />
                                                <Tooltip id="attach-image" className="bg-teal-600 text-white" />
                                            </button>
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="p-2 text-blue-900 hover:text-teal-600 transition-colors duration-300"
                                                data-tooltip-id="attach-video"
                                                data-tooltip-content="Attach Video"
                                                aria-label="Attach Video"
                                            >
                                                <Video className="w-6 h-6" />
                                                <Tooltip id="attach-video" className="bg-teal-600 text-white" />
                                            </button>
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="p-2 text-blue-900 hover:text-teal-600 transition-colors duration-300"
                                                data-tooltip-id="attach-doc"
                                                data-tooltip-content="Attach Document"
                                                aria-label="Attach Document"
                                            >
                                                <FileText className="w-6 h-6" />
                                                <Tooltip id="attach-doc" className="bg-teal-600 text-white" />
                                            </button>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="hidden"
                                                accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
                                                onChange={handleFileChange}
                                            />
                                        </div>
                                        <button
                                            onClick={handleCreatePost}
                                            disabled={(!newPost.trim() && !file) || isPosting}
                                            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-3 text-base ${newPost.trim() || file
                                                    ? 'bg-gradient-to-r from-teal-600 to-blue-600 text-white hover:from-teal-700 hover:to-blue-700 hover:scale-105 hover:shadow-md'
                                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                } ${isPosting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            data-tooltip-id="post"
                                            data-tooltip-content="Share Post"
                                            aria-label="Share Post"
                                        >
                                            <Send className="w-6 h-6" />
                                            {isPosting ? 'Posting...' : 'Post'}
                                            <Tooltip id="post" className="bg-teal-600 text-white" />
                                        </button>
                                    </div>
                                    <AnimatePresence>
                                        {showEmojiPicker && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="absolute left-0 top-full z-20 mt-2"
                                            >
                                                <EmojiPicker
                                                    onEmojiClick={handleEmojiClick}
                                                    theme="light"
                                                    emojiStyle="native"
                                                    skinTonesDisabled
                                                    className="shadow-lg"
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </motion.div>
                        <div
                            className="max-h-[calc(100vh-24rem)] lg:max-h-[700px] overflow-y-auto scrollbar-thin scroll-smooth space-y-8 pb-16"
                            role="region"
                            aria-label="Social Feed"
                            ref={feedRef}
                        >
                            <AnimatePresence>
                                {posts.map((post, index) => (
                                    <motion.div
                                        key={post._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                        className="bg-white/95 backdrop-blur-md rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-6 max-w-3xl mx-auto relative"
                                        ref={index === posts.length - 1 ? lastPostElementRef : null}
                                    >
                                        <div className="flex items-center gap-6 mb-6">
                                            <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-lg font-bold flex-shrink-0">
                                                {post.user.name
                                                    .trim()
                                                    .split(' ')
                                                    .map((word) => word[0])
                                                    .slice(0, 2)
                                                    .join('')
                                                    .toUpperCase()}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center">
                                                    <div className="min-w-0">
                                                        <p className="text-base font-semibold text-blue-900 truncate">{post.user.name}</p>
                                                        <p className="text-sm text-gray-500">
                                                            {moment(post.createdAt).tz('Africa/Lagos').format('MMM D, YYYY, h:mm A')}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-3 flex-shrink-0">
                                                        <button
                                                            onClick={() => startEditing(post)}
                                                            className="p-2 text-blue-900 hover:text-teal-600 transition-colors duration-300"
                                                            data-tooltip-id={`edit-post-${post._id}`}
                                                            data-tooltip-content="Edit Post"
                                                            aria-label="Edit Post"
                                                        >
                                                            <Edit2 className="w-6 h-6" />
                                                            <Tooltip id={`edit-post-${post._id}`} className="bg-teal-600 text-white" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleConfirmDelete(post._id)}
                                                            className="p-2 text-red-500 hover:text-red-600 transition-colors duration-300"
                                                            data-tooltip-id={`delete-post-${post._id}`}
                                                            data-tooltip-content="Delete Post"
                                                            aria-label="Delete Post"
                                                        >
                                                            <Trash2 className="w-6 h-6" />
                                                            <Tooltip id={`delete-post-${post._id}`} className="bg-teal-600 text-white" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {post.content && (
                                            <p className="text-base text-gray-800 mb-6 text-left leading-relaxed">{post.content}</p>
                                        )}
                                        {post.fileUrl && (
                                            <div className="mt-6 flex justify-center">
                                                {post.contentType === 'image' && (
                                                    <img
                                                        src={post.fileUrl}
                                                        alt="Post media"
                                                        className="max-w-full h-auto rounded-lg shadow-sm cursor-pointer hover:opacity-90 transition-all duration-300"
                                                        loading="lazy"
                                                        onClick={() => setSelectedImage(post.fileUrl)}
                                                    />
                                                )}
                                                {post.contentType === 'video' && (
                                                    <video
                                                        src={post.fileUrl}
                                                        controls
                                                        className="max-w-full h-auto rounded-lg shadow-sm"
                                                        loading="lazy"
                                                    />
                                                )}
                                                {post.contentType === 'application' && (
                                                    <button
                                                        onClick={() => setSelectedDoc(post.fileUrl)}
                                                        className="flex items-center gap-3 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all duration-300 hover:scale-105 hover:shadow-md text-base"
                                                        aria-label="View Document"
                                                    >
                                                        <FileText className="w-6 h-6" /> View Document
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {isLoading && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center text-base text-gray-500 py-8"
                                >
                                    Loading more posts...
                                </motion.div>
                            )}
                            {!hasMore && posts.length > 0 && (
                                <div className="text-center text-base text-gray-500 py-8">No more posts to load.</div>
                            )}
                        </div>
                        {/* Scroll Buttons */}
                        <div className="fixed bottom-8 right-8 flex flex-col gap-4 z-20">
                            <button
                                onClick={scrollToTop}
                                className="p-3 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition-all duration-300 hover:scale-105 shadow-lg"
                                data-tooltip-id="scroll-top"
                                data-tooltip-content="Scroll to Top"
                                aria-label="Scroll to Top"
                            >
                                <ArrowUp className="w-6 h-6" />
                                <Tooltip id="scroll-top" className="bg-teal-600 text-white" />
                            </button>
                            <button
                                onClick={scrollToBottom}
                                className="p-3 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition-all duration-300 hover:scale-105 shadow-lg"
                                data-tooltip-id="scroll-bottom"
                                data-tooltip-content="Scroll to Bottom"
                                aria-label="Scroll to Bottom"
                            >
                                <ArrowDown className="w-6 h-6" />
                                <Tooltip id="scroll-bottom" className="bg-teal-600 text-white" />
                            </button>
                        </div>
                    </main>
                </motion.div>

                {/* Image Modal */}
                <AnimatePresence>
                    {selectedImage && (
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            variants={modalVariants}
                            className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-6"
                            onClick={() => setSelectedImage(null)}
                            role="dialog"
                            aria-label="Image Preview"
                            ref={modalRef}
                            tabIndex={-1}
                        >
                            <div
                                className="relative max-w-5xl w-full p-6"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <img
                                    src={selectedImage}
                                    alt="Large preview"
                                    className="w-full h-auto rounded-xl shadow-lg"
                                />
                                <button
                                    onClick={() => setSelectedImage(null)}
                                    className="absolute top-4 right-4 p-3 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition-all duration-300 hover:scale-105"
                                    aria-label="Close Image Preview"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Document Modal */}
                <AnimatePresence>
                    {selectedDoc && (
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            variants={modalVariants}
                            className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-6"
                            onClick={() => setSelectedDoc(null)}
                            role="dialog"
                            aria-label="Document Preview"
                            ref={modalRef}
                            tabIndex={-1}
                        >
                            <div
                                className="relative w-full max-w-5xl h-[80vh] bg-white rounded-xl overflow-hidden shadow-lg"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <iframe
                                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(selectedDoc)}&embedded=true`}
                                    className="w-full h-full border-0"
                                    title="Document Preview"
                                />
                                <button
                                    onClick={() => setSelectedDoc(null)}
                                    className="absolute top-4 right-4 p-3 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition-all duration-300 hover:scale-105"
                                    aria-label="Close Document Preview"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Delete Confirmation Modal */}
                <AnimatePresence>
                    {showDeleteConfirm && (
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            variants={modalVariants}
                            className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-6"
                            role="dialog"
                            aria-label="Delete Confirmation"
                            ref={modalRef}
                            tabIndex={-1}
                        >
                            <div
                                className="relative w-full max-w-md bg-white/95 backdrop-blur-md rounded-xl p-8 border border-teal-200/50 shadow-lg"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <h2 className="text-xl font-semibold text-blue-900 mb-6 truncate">Confirm Deletion</h2>
                                <p className="text-base text-gray-800 mb-8 leading-relaxed">Are you sure you want to delete this post? This action cannot be undone.</p>
                                <div className="flex justify-end gap-4">
                                    <button
                                        onClick={handleCancelDelete}
                                        className="px-6 py-3 rounded-lg bg-gray-200 text-gray-800 text-base font-semibold hover:bg-gray-300 transition-all duration-300 hover:scale-105"
                                        aria-label="Cancel Deletion"
                                    >
                                        No
                                    </button>
                                    <button
                                        onClick={handleConfirmDeleteAction}
                                        className="px-6 py-3 rounded-lg bg-red-600 text-white text-base font-semibold hover:bg-red-700 transition-all duration-300 hover:scale-105"
                                        aria-label="Confirm Deletion"
                                    >
                                        Yes
                                    </button>
                                </div>
                                <button
                                    onClick={handleCancelDelete}
                                    className="absolute top-4 right-4 p-3 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition-all duration-300 hover:scale-105"
                                    aria-label="Close Delete Confirmation"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Edit Post Modal */}
                <AnimatePresence>
                    {editingPost && (
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            variants={modalVariants}
                            className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-6"
                            role="dialog"
                            aria-label="Edit Post"
                            ref={modalRef}
                            tabIndex={-1}
                        >
                            <div
                                className="relative w-full max-w-3xl bg-white/95 backdrop-blur-md rounded-xl p-8 border border-teal-200/50 shadow-lg"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <h2 className="text-xl font-semibold text-blue-900 mb-6 truncate">Edit Post</h2>
                                <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    placeholder="Edit your post..."
                                    className="w-full p-4 text-base text-gray-800 border border-teal-300/50 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-transparent resize-y mb-6 transition-all duration-300"
                                    rows="4"
                                    maxLength={1000}
                                    aria-label="Edit post content"
                                />
                                {file && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex items-center gap-4 mb-6"
                                    >
                                        {filePreview && file.type.startsWith('image/') && (
                                            <img src={filePreview} alt="Preview" className="w-20 h-20 object-cover rounded-lg shadow-sm" />
                                        )}
                                        {filePreview && file.type.startsWith('video/') && (
                                            <video src={filePreview} className="w-20 h-20 object-cover rounded-lg shadow-sm" />
                                        )}
                                        <span className="text-base text-gray-600 truncate max-w-md">{file.name}</span>
                                        <button
                                            onClick={() => {
                                                setFile(null);
                                                setFilePreview(null);
                                            }}
                                            className="text-red-500 hover:text-red-600 transition-colors duration-300"
                                            aria-label="Remove file"
                                        >
                                            <X className="w-6 h-6" />
                                        </button>
                                    </motion.div>
                                )}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="p-2 text-blue-900 hover:text-teal-600 transition-colors duration-300"
                                            data-tooltip-id="attach-file-edit"
                                            data-tooltip-content="Attach File"
                                            aria-label="Attach File"
                                        >
                                            <Paperclip className="w-6 h-6" />
                                            <Tooltip id="attach-file-edit" className="bg-teal-600 text-white" />
                                        </button>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
                                            onChange={handleFileChange}
                                        />
                                        <button
                                            ref={emojiButtonRef}
                                            onClick={() => setShowEmojiPicker((prev) => !prev)}
                                            className="p-2 text-blue-900 hover:text-teal-600 transition-colors duration-300"
                                            data-tooltip-id="add-emoji-edit"
                                            data-tooltip-content="Add Emoji"
                                            aria-label="Add Emoji"
                                        >
                                            <Smile className="w-6 h-6" />
                                            <Tooltip id="add-emoji-edit" className="bg-teal-600 text-white" />
                                        </button>
                                    </div>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => {
                                                setEditingPost(null);
                                                setEditContent('');
                                                setFile(null);
                                                setFilePreview(null);
                                            }}
                                            className="px-6 py-3 rounded-lg bg-gray-200 text-gray-800 text-base font-semibold hover:bg-gray-300 transition-all duration-300 hover:scale-105"
                                            aria-label="Cancel Edit"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => handleEditPost(editingPost)}
                                            disabled={(!editContent.trim() && !file) || isPosting}
                                            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-3 text-base ${editContent.trim() || file
                                                    ? 'bg-gradient-to-r from-teal-600 to-blue-600 text-white hover:from-teal-700 hover:to-blue-700 hover:scale-105 hover:shadow-md'
                                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                } ${isPosting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            aria-label="Save Post"
                                        >
                                            {isPosting ? 'Saving...' : 'Save'}
                                        </button>
                                    </div>
                                </div>
                                <AnimatePresence>
                                    {showEmojiPicker && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute left-0 top-full z-20 mt-2"
                                        >
                                            <EmojiPicker
                                                onEmojiClick={handleEmojiClick}
                                                theme="light"
                                                emojiStyle="native"
                                                skinTonesDisabled
                                                className="shadow-lg"
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <button
                                    onClick={() => {
                                        setEditingPost(null);
                                        setEditContent('');
                                        setFile(null);
                                        setFilePreview(null);
                                    }}
                                    className="absolute top-4 right-4 p-3 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition-all duration-300 hover:scale-105"
                                    aria-label="Close Edit Modal"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <style jsx>{`
                .scrollbar-thin::-webkit-scrollbar {
                    width: 6px;
                }
                .scrollbar-thin::-webkit-scrollbar-track {
                    background: rgba(20, 184, 166, 0.1);
                    border-radius: 3px;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb {
                    background: #14B8A6;
                    border-radius: 3px;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb:hover {
                    background: #0D9488;
                }
            `}</style>
        </motion.div>
    );
};

export default SocialFeed;