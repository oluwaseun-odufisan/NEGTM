import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
    Upload, Trash2, FileText, Image, Video, Download, List, Grid,
    Search, Tag, ArrowLeft, Loader2, X, ZoomIn, File, Folder,
    ChevronRight, ChevronLeft, Plus, Info, Link2, FolderPlus,
    Users, Calendar, Star, Menu, Filter, Clock, Share2, HardDrive,
    ChevronDown, Minus, ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';
import { Tooltip } from 'react-tooltip';
import { Document, Page, pdfjs } from 'react-pdf';
import mammoth from 'mammoth';
import DOMPurify from 'dompurify';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Configure pdfjs worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const ALLOWED_TYPES = ['pdf', 'docx', 'doc', 'jpg', 'jpeg', 'png', 'mp4', 'webm', 'xls', 'xlsx'];
const TOTAL_STORAGE = 2 * 1024 * 1024 * 1024; // 2GB in bytes

// Error Boundary for react-pdf
class ErrorBoundary extends React.Component {
    state = { hasError: false, error: null };

    static getDerivedStateFromError(error) {
        return { hasError: true, error: error.message };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="h-96 bg-gray-900/20 rounded-lg flex items-center justify-center">
                    <p className="text-gray-400">{this.state.error || 'Failed to render content'}</p>
                </div>
            );
        }
        return this.props.children;
    }
}

const FilePreviewModal = ({ isOpen, onClose, file, handleDownload, handleShare }) => {
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [zoom, setZoom] = useState(1);
    const [docContent, setDocContent] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isOpen || !file) {
            setNumPages(null);
            setPageNumber(1);
            setZoom(1);
            setDocContent(null);
            setError(null);
            return;
        }

        if (file.type === 'docx' || file.name?.toLowerCase().endsWith('.docx')) {
            const fetchDoc = async () => {
                try {
                    const response = await fetch(`https://gateway.pinata.cloud/ipfs/${file.cid}`);
                    if (!response.ok) throw new Error('Failed to fetch document');
                    const arrayBuffer = await response.arrayBuffer();
                    const result = await mammoth.convertToHtml({ arrayBuffer });
                    const sanitizedHtml = DOMPurify.sanitize(result.value);
                    setDocContent(sanitizedHtml);
                } catch (err) {
                    console.error('Error loading .docx:', err);
                    setError('Failed to load Word document');
                }
            };
            fetchDoc();
        }
    }, [isOpen, file]);

    if (!isOpen || !file) return null;

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
        setPageNumber(1);
    };

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 2));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));
    const handlePrevPage = () => setPageNumber(prev => Math.max(prev - 1, 1));
    const handleNextPage = () => setPageNumber(prev => Math.min(prev + 1, numPages));

    const url = `https://gateway.pinata.cloud/ipfs/${file.cid}`;
    const type = file.type?.toLowerCase() || file.name?.split('.').pop().toLowerCase();

    const renderPreview = () => {
        if (error) {
            return (
                <div className="h-96 bg-gray-900/20 rounded-lg flex items-center justify-center">
                    <p className="text-gray-400">{error}</p>
                </div>
            );
        }
        if (['jpg', 'jpeg', 'png'].includes(type)) {
            return <img src={url} alt={file.fileName} className="w-full h-auto rounded-lg max-h-[70vh] object-contain" />;
        }
        if (['mp4', 'webm'].includes(type)) {
            return (
                <video
                    controls
                    autoPlay
                    muted
                    loop
                    className="w-full max-h-[70vh] rounded-lg"
                    onError={() => setError('Failed to load video')}
                    aria-label={`Video player for ${file.fileName}`}
                >
                    <source src={url} type={`video/${type}`} />
                    Your browser does not support video playback.
                </video>
            );
        }
        if (type === 'pdf') {
            return (
                <ErrorBoundary>
                    <div className="relative">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleZoomOut}
                                    className="p-1 text-gray-300 hover:text-cyan-500"
                                    aria-label="Zoom Out"
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <span className="text-sm text-gray-300">{(zoom * 100).toFixed(0)}%</span>
                                <button
                                    onClick={handleZoomIn}
                                    className="p-1 text-gray-300 hover:text-cyan-500"
                                    aria-label="Zoom In"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handlePrevPage}
                                    disabled={pageNumber <= 1}
                                    className="p-1 text-gray-300 hover:text-cyan-500 disabled:text-gray-500"
                                    aria-label="Previous Page"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-sm text-gray-300">
                                    Page {pageNumber} of {numPages || '?'}
                                </span>
                                <button
                                    onClick={handleNextPage}
                                    disabled={pageNumber >= numPages}
                                    className="p-1 text-gray-300 hover:text-cyan-500 disabled:text-gray-500"
                                    aria-label="Next Page"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="h-[70vh] overflow-y-auto scrollbar-thin">
                            <Document
                                file={url}
                                onLoadSuccess={onDocumentLoadSuccess}
                                onLoadError={(err) => {
                                    console.error('Error loading PDF:', err);
                                    setError('Failed to load PDF');
                                }}
                                className="flex justify-center"
                                loading={<Loader2 className="w-8 h-8 animate-spin text-cyan-500" />}
                            >
                                <Page
                                    pageNumber={pageNumber}
                                    scale={zoom}
                                    renderTextLayer={true}
                                    renderAnnotationLayer={true}
                                    className="shadow-md"
                                />
                            </Document>
                        </div>
                    </div>
                </ErrorBoundary>
            );
        }
        if (type === 'docx') {
            return (
                <div className="h-[70vh] overflow-y-auto scrollbar-thin bg-gray-900/10 p-4 rounded-lg">
                    {docContent ? (
                        <div
                            dangerouslySetInnerHTML={{ __html: docContent }}
                            className="doc-content max-w-none text-sm leading-relaxed text-gray-200"
                            style={{ fontFamily: 'Arial, sans-serif', lineHeight: '1.6' }}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
                        </div>
                    )}
                </div>
            );
        }
        if (type === 'doc') {
            return (
                <div className="h-96 bg-gray-900/20 rounded-lg flex items-center justify-center">
                    <p className="text-gray-400">Preview not supported for .doc files</p>
                </div>
            );
        }
        if (['xls', 'xlsx'].includes(type)) {
            return (
                <div className="h-96 bg-gray-900/20 rounded-lg flex items-center justify-center">
                    <p className="text-gray-400">Preview not supported for Excel files</p>
                </div>
            );
        }
        return (
            <div className="h-96 bg-gray-900/20 rounded-lg flex items-center justify-center">
                <File className="w-12 h-12 text-cyan-500" />
                <p className="ml-2 text-gray-400">No preview available</p>
            </div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm flex items-center justify-center z-[1002] p-4"
            onClick={onClose}
            role="dialog"
            aria-label="File Preview Modal"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-800/80 backdrop-blur-xl rounded-2xl p-8 w-full max-w-5xl border border-gray-700/50 shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-thin"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white truncate">{file.fileName}</h3>
                    <button onClick={onClose} className="p-2 text-gray-300 hover:bg-gray-700/50 rounded-full" aria-label="Close Modal">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                {renderPreview()}
                <div className="mt-4 space-y-2 text-sm text-gray-300">
                    <p><span className="font-medium">Size:</span> {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    <p><span className="font-medium">Type:</span> {file.type}</p>
                    <p><span className="font-medium">Task:</span> {file.taskTitle || 'None'}</p>
                    <p><span className="font-medium">Uploaded:</span> {new Date(file.uploadedAt).toLocaleString()}</p>
                    <p><span className="font-medium">Tags:</span> {file.tags?.join(', ') || 'None'}</p>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <button
                        type="button"
                        onClick={() => handleDownload(file)}
                        className="px-4 py-2 text-sm bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-all duration-200"
                        aria-label={`Download ${file.fileName}`}
                    >
                        Download
                    </button>
                    <button
                        type="button"
                        onClick={() => handleShare(file)}
                        className="px-4 py-2 text-sm bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-all duration-200"
                        aria-label={`Share ${file.fileName}`}
                    >
                        Share
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

const UploadModal = ({ isOpen, onClose, onUpload, tasks, currentFolderId, isUploading, setIsUploading }) => {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [taskId, setTaskId] = useState('');
    const [tags, setTags] = useState('');
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const validateTaskId = (id) => {
        if (!id) return true; // Allow no task
        return tasks.some(task => task._id === id);
    };

    const validateTags = (tagString) => {
        const tagArray = tagString.split(',').map(t => t.trim()).filter(t => t);
        return tagArray.every(tag => tag.length <= 50 && /^[a-zA-Z0-9._\-]+$/.test(tag));
    };

    const handleFileChange = useCallback((e) => {
        console.log('File input changed:', e.target.files);
        const files = Array.from(e.target.files);
        const validFiles = files.filter(file => {
            const fileType = file.name.split('.').pop().toLowerCase();
            if (!ALLOWED_TYPES.includes(fileType)) {
                setError(`Unsupported file type: ${file.name}`);
                return false;
            }
            if (file.size > MAX_FILE_SIZE) {
                setError(`File ${file.name} exceeds 25MB limit`);
                return false;
            }
            return true;
        });
        setSelectedFiles(validFiles);
        setError(validFiles.length ? null : files.length ? 'Some files are invalid' : null);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Form submitted:', {
            files: selectedFiles.map(f => f.name),
            taskId,
            tags,
            folderId: currentFolderId,
        });
        if (!selectedFiles.length) {
            setError('Please select files to upload.');
            toast.error('No files selected.');
            return;
        }
        if (!validateTaskId(taskId)) {
            setError('Invalid task selected.');
            toast.error('Invalid task selected.');
            return;
        }
        if (!validateTags(tags)) {
            setError('Invalid tags. Use alphanumeric characters, dots, hyphens, or underscores, max 50 chars per tag.');
            toast.error('Invalid tags.');
            return;
        }
        try {
            setIsUploading(true);
            const tagArray = tags.split(',').map(t => t.trim()).filter(t => t);
            await onUpload(selectedFiles, taskId || null, tagArray, currentFolderId || null);
            setSelectedFiles([]);
            setTaskId('');
            setTags('');
            setError(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            onClose();
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.message || 'Failed to upload files');
            toast.error(err.message || 'Failed to upload files');
        } finally {
            setIsUploading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm flex items-center justify-center z-[1000]"
            onClick={onClose}
            role="dialog"
            aria-label="Upload Modal"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-800/80 rounded-2xl p-6 max-w-md w-full border border-gray-700/50 shadow-lg"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white">Upload Files</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-white"
                        aria-label="Close Modal"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm text-gray-300 mb-1 block">Files (max 25MB each)</label>
                        <div
                            className="border-2 border-dashed border-gray-500 rounded-lg p-6 text-center hover:bg-gray-700/30"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                handleFileChange({ target: { files: e.dataTransfer.files } });
                            }}
                        >
                            <Upload className="w-8 h-8 mx-auto text-cyan-500" />
                            <p className="text-sm text-gray-400 mt-2">Drag & drop files here</p>
                            <input
                                type="file"
                                id="file-upload"
                                multiple
                                onChange={handleFileChange}
                                className="hidden"
                                accept={ALLOWED_TYPES.map(t => `.${t}`).join(',')}
                                ref={fileInputRef}
                            />
                            <label
                                htmlFor="file-upload"
                                className="cursor-pointer text-sm text-cyan-400 mt-2 block"
                            >
                                Or click to browse
                            </label>
                        </div>
                        {selectedFiles.length > 0 && (
                            <ul className="mt-2 text-sm text-gray-400">
                                {selectedFiles.map((file, index) => (
                                    <li key={index}>{file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)</li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div>
                        <label className="text-sm text-gray-300 mb-1 block">Task</label>
                        <select
                            value={taskId}
                            onChange={(e) => setTaskId(e.target.value)}
                            className="w-full p-2 text-sm bg-gray-700/50 border border-gray-600 rounded-md text-gray-200"
                            aria-label="Select task"
                        >
                            <option value="">No Task</option>
                            {tasks?.map((task) => (
                                <option key={task._id} value={task._id}>{task.title}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm text-gray-300 mb-1 block">Tags</label>
                        <input
                            type="text"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            placeholder="e.g., report, urgent"
                            className="w-full p-2 text-sm bg-gray-700/50 border border-gray-600 rounded-md text-gray-200"
                            aria-label="Enter tags"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!selectedFiles.length || isUploading}
                        className="w-full py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 disabled:bg-gray-500 disabled:opacity-50"
                        aria-label="Upload files"
                    >
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" /> : 'Upload'}
                    </button>
                </form>
            </motion.div>
        </motion.div>
    );
};

const MoveFilesModal = ({ isOpen, onClose, folders, onMove, currentFolderId }) => {
    const [selectedFolderId, setSelectedFolderId] = useState('');
    const folderTree = useMemo(() => {
        const buildTree = (parentId = null, level = 0) => {
            return folders
                .filter(f => f.parentId === parentId)
                .map(f => ({
                    ...f,
                    children: buildTree(f._id, level + 1),
                    level
                }));
        };
        return buildTree(null);
    }, [folders]);

    const renderFolderOptions = (folders, indent = 0) => {
        return folders.map(folder => (
            <React.Fragment key={folder._id}>
                <option value={folder._id} disabled={folder._id === currentFolderId}>
                    {'-'.repeat(indent * 2)} {folder.name}
                </option>
                {folder.children && renderFolderOptions(folder.children, indent + 1)}
            </React.Fragment>
        ));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onMove(selectedFolderId || null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm flex items-center justify-center z-[1001]"
            onClick={onClose}
            role="dialog"
            aria-label="Move Files Modal"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-800/80 rounded-2xl p-6 max-w-md w-full border border-gray-700/50 shadow-lg"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white">Move to Folder</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-white"
                        aria-label="Close Modal"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm text-gray-300 mb-1 block">Select Destination Folder</label>
                        <select
                            value={selectedFolderId}
                            onChange={(e) => setSelectedFolderId(e.target.value)}
                            className="w-full p-2 text-sm bg-gray-700/50 border border-gray-600 rounded-md text-gray-200"
                            aria-label="Select destination folder"
                        >
                            <option value="">Root Folder</option>
                            {renderFolderOptions(folderTree)}
                        </select>
                    </div>
                    <button
                        type="submit"
                        className="w-full py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-600"
                        aria-label="Move files"
                    >
                        Move
                    </button>
                </form>
            </motion.div>
        </motion.div>
    );
};

const FolderNode = ({ folder, onSelect, selectedFolderId, folders, level = 0 }) => {
    const [isOpen, setIsOpen] = useState(false);
    const childFolders = folders.filter((f) => f.parentId === folder._id);

    return (
        <div style={{ paddingLeft: `${level * 16}px` }}>
            <div
                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-gray-700/50 ${selectedFolderId === folder._id ? 'bg-teal-500/20 text-teal-400' : 'text-gray-300'}`}
                onClick={() => {
                    setIsOpen(!isOpen);
                    onSelect(folder._id);
                }}
            >
                {childFolders.length > 0 && (isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
                <Folder className="w-4 h-4 text-teal-500" />
                <span className="text-sm truncate">{folder.name}</span>
            </div>
            {isOpen && childFolders.map((child) => (
                <FolderNode
                    key={child._id}
                    folder={child}
                    onSelect={onSelect}
                    selectedFolderId={selectedFolderId}
                    folders={folders}
                    level={level + 1}
                />
            ))}
        </div>
    );
};

const FileStorage = () => {
    const { user, tasks = [], onLogout } = useOutletContext();
    const navigate = useNavigate();
    const [files, setFiles] = useState([]);
    const [folders, setFolders] = useState([]);
    const [currentFolder, setCurrentFolder] = useState(null);
    const [viewMode, setViewMode] = useState('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('uploadedAt');
    const [showTrash, setShowTrash] = useState(false);
    const [selectedFileId, setSelectedFileId] = useState(null);
    const [previewModal, setPreviewModal] = useState(false);
    const [uploadModal, setUploadModal] = useState(false);
    const [moveFilesModal, setMoveFilesModal] = useState(false);
    const [detailsPanel, setDetailsPanel] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [filterType, setFilterType] = useState('all');
    const [filterTask, setFilterTask] = useState('all');
    const [filterTags, setFilterTags] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [showActionsMenu, setShowActionsMenu] = useState(false);
    const searchTimeoutRef = useRef(null);
    const observerRef = useRef();
    const actionsMenuRef = useRef();

    const storageUsed = useMemo(() => files.reduce((sum, file) => sum + (file.size || 0), 0), [files]);
    const uniqueTags = useMemo(() => [...new Set(files.flatMap(f => f.tags || []))], [files]);

    const getAuthHeaders = useCallback(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No auth token found');
            toast.error('Session expired. Please log in again.', { duration: 5000 });
            onLogout?.();
            throw new Error('No auth token found');
        }
        return { Authorization: `Bearer ${token}` };
    }, [onLogout]);

    const fetchFilesAndFolders = useCallback(async (pageNum = 1, reset = false) => {
        try {
            const headers = getAuthHeaders();
            const params = {
                page: pageNum,
                limit: 10,
                searchQuery: searchQuery || undefined,
                type: filterType !== 'all' ? filterType : undefined,
                taskId: filterTask !== 'all' ? filterTask : undefined,
                tags: filterTags.length ? JSON.stringify(filterTags) : undefined,
                trashed: showTrash,
                folderId: currentFolder || undefined,
            };
            const [filesResponse, foldersResponse] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/files`, { headers, params }),
                axios.get(`${API_BASE_URL}/api/files/folders`, { headers, params: { parentId: currentFolder || undefined } }),
            ]);

            if (filesResponse.data.success) {
                setFiles(prev => reset ? filesResponse.data.files : [...prev, ...filesResponse.data.files]);
                setHasMore(filesResponse.data.hasMore);
            } else {
                throw new Error(filesResponse.data.message || 'Failed to fetch files');
            }
            if (foldersResponse.data.success) {
                setFolders(foldersResponse.data.folders || []);
            } else {
                throw new Error(foldersResponse.data.message || 'Failed to fetch folders');
            }
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error(error.message || 'Failed to load files and folders');
            if (error.response?.status === 401) onLogout?.();
        }
    }, [currentFolder, showTrash, searchQuery, filterType, filterTask, filterTags, getAuthHeaders, onLogout]);

    useEffect(() => {
        if (user) fetchFilesAndFolders(1, true);
        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, [fetchFilesAndFolders, user]);

    useEffect(() => {
        if (page > 1) fetchFilesAndFolders(page, false);
    }, [page, fetchFilesAndFolders]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (actionsMenuRef.current && !actionsMenuRef.current.contains(e.target)) {
                setShowActionsMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const debouncedSearch = useCallback((query) => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => {
            setSearchQuery(query);
            setPage(1);
            setFiles([]);
            fetchFilesAndFolders(1, true);
        }, 300);
    }, [fetchFilesAndFolders]);

    const filteredItems = useMemo(() => {
        const lowerQuery = searchQuery.toLowerCase();
        const items = [
            ...folders.map((folder) => ({ ...folder, isFolder: true })),
            ...files.filter((file) => (showTrash ? file.deleted : !file.deleted)),
        ].filter(
            (item) =>
                item.fileName?.toLowerCase().includes(lowerQuery) ||
                item.name?.toLowerCase().includes(lowerQuery) ||
                item.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
        );

        return items.sort((a, b) => {
            if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
            switch (sortBy) {
                case 'name':
                    return (a.fileName || a.name).localeCompare(b.fileName || b.name);
                case 'size':
                    return (b.size || 0) - (a.size || 0);
                case 'type':
                    return (a.type || ' ').localeCompare(b.type || ' ');
                case 'uploadedAt':
                    return new Date(b.uploadedAt || b.createdAt) - new Date(a.uploadedAt || a.createdAt);
                default:
                    return 0;
            }
        });
    }, [files, folders, searchQuery, sortBy, showTrash]);

    const breadcrumbPath = useMemo(() => {
        const path = [];
        let folderId = currentFolder;
        const folderMap = new Map(folders.map((f) => [f._id, f]));
        while (folderId && folderMap.has(folderId)) {
            const folder = folderMap.get(folderId);
            path.unshift(folder);
            folderId = folder.parentId;
        }
        return path;
    }, [currentFolder, folders]);

    const lastFileRef = useCallback(node => {
        if (observerRef.current) observerRef.current.disconnect();
        observerRef.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prev => prev + 1);
            }
        });
        if (node) observerRef.current.observe(node);
    }, [hasMore]);

    const handleFileUpload = useCallback(
        async (selectedFiles, taskId, tags, folderId) => {
            console.log('handleFileUpload called:', {
                files: selectedFiles.map(f => f.name),
                taskId,
                tags,
                folderId,
            });
            try {
                const headers = getAuthHeaders();
                const formData = new FormData();
                const fileIds = selectedFiles.map(() => `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`);
                setUploadProgress(prev => fileIds.reduce((acc, id) => ({ ...acc, [id]: 0 }), {}));

                selectedFiles.forEach((file, index) => {
                    formData.append('files', file);
                    console.log(`Appending file ${index}:`, file.name, file.size, file.type);
                });
                if (taskId) formData.append('taskId', taskId);
                if (tags?.length) formData.append('tags', JSON.stringify(tags));
                if (folderId) formData.append('folderId', folderId);

                for (let pair of formData.entries()) {
                    console.log(`FormData entry: ${pair[0]}`, pair[1]);
                }

                const response = await axios.post(`${API_BASE_URL}/api/files/pinFileToIPFS`, formData, {
                    headers: {
                        ...headers,
                        'Content-Type': 'multipart/form-data',
                    },
                    onUploadProgress: (progressEvent) => {
                        const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
                        setUploadProgress(prev => fileIds.reduce((acc, id) => ({ ...acc, [id]: percent }), {}));
                    },
                    timeout: 60000,
                });

                if (response.data.success) {
                    // Optimistically update state
                    setFiles(prev => [...response.data.files, ...prev]);
                    toast.success('Files uploaded successfully!');
                    // Refresh data to ensure consistency
                    await fetchFilesAndFolders(1, true);
                } else {
                    throw new Error(response.data.message || 'Upload failed');
                }
            } catch (error) {
                console.error('Upload error:', error);
                console.error('Error response:', error.response?.data);
                toast.error(error.response?.data?.message || error.message || 'Failed to upload files');
                if (error.response?.status === 401) onLogout?.();
                throw error;
            } finally {
                setIsUploading(false);
                setUploadProgress({});
            }
        },
        [getAuthHeaders, onLogout, fetchFilesAndFolders]
    );

    const handleCreateFolder = useCallback(
        async () => {
            const folderName = newFolderName.trim();
            if (!folderName) {
                toast.error('Folder name is required');
                return;
            }
            if (folderName.length > 100 || !folderName.match(/^[a-zA-Z0-9._\-\s]+$/)) {
                toast.error('Invalid folder name (max 100 chars, alphanumeric, spaces, dots, hyphens, underscores)');
                return;
            }

            try {
                const headers = getAuthHeaders();
                const response = await axios.post(
                    `${API_BASE_URL}/api/files/folders`,
                    { name: folderName, parentId: currentFolder || null },
                    { headers }
                );

                if (response.data.success) {
                    setFolders(prev => [...prev, response.data.folder]);
                    setNewFolderName('');
                    toast.success('Folder created successfully!');
                    await fetchFilesAndFolders(1, true);
                } else {
                    throw new Error(response.data.message || 'Failed to create folder');
                }
            } catch (error) {
                console.error('Create folder error:', error);
                toast.error(error.response?.data?.message || 'Failed to create folder');
                if (error.response?.status === 401) onLogout?.();
            }
        },
        [newFolderName, currentFolder, getAuthHeaders, onLogout, fetchFilesAndFolders]);

    const handleDelete = useCallback(
        async (id, isFolder, permanent = false) => {
            if (!window.confirm(permanent ? 'Permanently delete this item?' : 'Move to trash?')) return;
            try {
                const headers = getAuthHeaders();
                console.log('Deleting item:', { id, isFolder, permanent, headers });
                const endpoint = isFolder
                    ? `${API_BASE_URL}/api/files/folders/${id}`
                    : permanent
                        ? `${API_BASE_URL}/api/files/${id}`
                        : `${API_BASE_URL}/api/files/${id}/delete`;
                const method = isFolder || permanent ? 'delete' : 'patch';
                await axios[method](endpoint, {}, { headers });

                if (isFolder) {
                    setFolders(prev => prev.filter(f => f._id !== id));
                    setFiles(prev => prev.filter(f => f.folderId !== id));
                } else {
                    if (permanent) {
                        setFiles(prev => prev.filter(f => f._id !== id));
                    } else {
                        setFiles(prev =>
                            prev.map(file =>
                                file._id === id ? { ...file, deleted: true, deletedAt: new Date().toISOString() } : file
                            )
                        );
                    }
                }

                setSelectedItems(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(id);
                    return newSet;
                });
                if (detailsPanel?._id === id) setDetailsPanel(null);
                toast.success(permanent ? 'Permanently deleted' : 'Moved to trash');
                await fetchFilesAndFolders(1, true);
            } catch (error) {
                console.error('Delete error:', error);
                toast.error(error.response?.data?.message || 'Failed to delete item');
                if (error.response?.status === 401) onLogout?.();
            }
        },
        [getAuthHeaders, detailsPanel, onLogout, fetchFilesAndFolders]
    );

    const handleMoveFiles = useCallback(
        async (destinationFolderId) => {
            const fileIds = Array.from(selectedItems).filter(id => !folders.find(f => f._id === id));
            if (!fileIds.length) {
                toast.error('No files selected to move');
                return;
            }

            try {
                const headers = getAuthHeaders();
                const response = await axios.patch(
                    `${API_BASE_URL}/api/files/move`,
                    { fileIds, folderId: destinationFolderId || null },
                    { headers }
                );

                if (response.data.success) {
                    setFiles(prev =>
                        prev.map(file =>
                            fileIds.includes(file._id)
                                ? { ...file, folderId: destinationFolderId || null }
                                : file
                        )
                    );
                    setSelectedItems(new Set());
                    toast.success('Files moved successfully');
                    await fetchFilesAndFolders(1, true);
                } else {
                    throw new Error(response.data.message || 'Failed to move files');
                }
            } catch (error) {
                console.error('Move files error:', error);
                toast.error(error?.response?.data?.message || 'Failed to move files');
                if (error.response?.status === 401) onLogout?.();
            }
        },
        [selectedItems, folders, getAuthHeaders, onLogout, fetchFilesAndFolders]
    );

    const handleRestore = useCallback(
        async (id) => {
            try {
                const headers = getAuthHeaders();
                await axios.patch(
                    `${API_BASE_URL}/api/files/${id}/restore`,
                    {},
                    { headers }
                );

                setFiles(prev =>
                    prev.map(file =>
                        file._id === id ? { ...file, deleted: false, deletedAt: null } : file
                    )
                );
                setSelectedItems(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(id);
                    return newSet;
                });
                if (detailsPanel?._id === id) setDetailsPanel(null);
                toast.success('File restored');
                await fetchFilesAndFolders(1, true);
            } catch (error) {
                console.error('Restore error:', error);
                toast.error(error.response?.data?.message || 'Failed to restore file');
                if (error.response?.status === 401) onLogout?.();
            }
        },
        [getAuthHeaders, detailsPanel, onLogout, fetchFilesAndFolders]
    );

    const handleClearTrash = useCallback(
        async () => {
            if (!window.confirm('Permanently delete all trashed items?')) return;
            try {
                const headers = getAuthHeaders();
                await axios.delete(`${API_BASE_URL}/api/files/trash/clear`, { headers });

                setFiles(prev => prev.filter(file => !file.deleted));
                setSelectedItems(new Set);
                setDetailsPanel(null);
                toast.success('Trash cleared');
                await fetchFilesAndFolders(1, true);
            } catch (error) {
                console.error('Clear trash error:', error);
                toast.error(error.response?.data?.message || 'Failed to clear trash');
                if (error.response?.status === 401) onLogout?.();
            }
        },
        [getAuthHeaders, onLogout, fetchFilesAndFolders]
    );

    const handleBulkDelete = useCallback(() => {
        const promises = Array.from(selectedItems).map((id) => {
            const isFolder = folders.find(f => f._id === id);
            return handleDelete(id, !!isFolder, showTrash);
        });

        Promise.all(promises).then(() => {
            setSelectedItems(new Set());
            toast.success('Selected items deleted');
            fetchFilesAndFolders(1, true);
        });
    }, [selectedItems, folders, showTrash, handleDelete, fetchFilesAndFolders]);

    const handleShare = useCallback(
        async (file) => {
            try {
                const headers = getAuthHeaders();
                const response = await axios.post(
                    `${API_BASE_URL}/api/files/${file._id}/share`,
                    { expiresInDays: 7 },
                    { headers }
                );
                if (response.data.success) {
                    setFiles(prev =>
                        prev.map(f =>
                            f._id === file._id
                                ? { ...f, shareLink: response.data.shareLink, shareExpires: response.data.shareExpires }
                                : f
                        )
                    );
                    await navigator.clipboard.writeText(response.data.shareLink);
                    toast.success('Share link copied to clipboard!');
                } else {
                    throw new Error(response.data.message || 'Failed to share file');
                }
            } catch (error) {
                console.error('Share error:', error);
                toast.error(error.response?.data?.message || 'Failed to share file');
                if (error.response?.status === 401) onLogout?.();
            }
        },
        [getAuthHeaders, onLogout]
    );

    const handleDownload = useCallback(
        (file) => {
            try {
                const url = `https://gateway.pinata.cloud/ipfs/${file.cid}`;
                const link = document.createElement('a');
                link.href = url;
                link.download = file.fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success(`Downloading ${file.fileName}`);
            } catch (error) {
                console.error('Download error:', error);
                toast.error('Download failed');
            }
        },
        []
    );

    const handlePreview = useCallback((file) => {
        setSelectedFileId(file);
        setPreviewModal(true);
    }, []);

    const handleAssociateTask = useCallback(
        async (fileId, taskId) => {
            try {
                const headers = getAuthHeaders();
                const response = await axios.patch(
                    `${API_BASE_URL}/api/files/${fileId}/task`,
                    { taskId: taskId || null },
                    { headers }
                );
                if (response.data.success) {
                    setFiles(prev =>
                        prev.map(file =>
                            file._id === fileId
                                ? { ...file, taskId: response.data.taskId, taskTitle: response.data.taskTitle }
                                : file
                        )
                    );
                    setDetailsPanel(prev => (prev?._id === fileId ? { ...prev, taskId: response.data.taskId, taskTitle: response.data.taskTitle } : prev));
                    toast.success('Task associated successfully');
                    await fetchFilesAndFolders(1, true);
                } else {
                    throw new Error(response.data.message || 'Failed to associate task');
                }
            } catch (error) {
                console.error('Error associating task:', error);
                toast.error(error.response?.data?.message || 'Failed to associate task');
                if (error.response?.status === 401) onLogout?.();
            }
        },
        [getAuthHeaders, onLogout, fetchFilesAndFolders]
    );

    const handleAddTag = useCallback(
        async (fileId, tag) => {
            if (!tag?.trim()) return;
            try {
                const headers = getAuthHeaders();
                const response = await axios.patch(
                    `${API_BASE_URL}/api/files/${fileId}/tags`,
                    { tag: tag.trim() },
                    { headers }
                );
                if (response.data.success) {
                    setFiles(prev =>
                        prev.map(file =>
                            file._id === fileId ? { ...file, tags: response.data.tags } : file
                        )
                    );
                    setDetailsPanel(prev => (prev?._id === fileId ? { ...prev, tags: response.data.tags } : prev));
                    toast.success('Tag added successfully');
                    await fetchFilesAndFolders(1, true);
                } else {
                    toast.error(response.data.message || 'Failed to add tag');
                }
            } catch (error) {
                console.error('Error adding tag:', error);
                toast.error(error.response?.data?.message || 'Failed to add tag');
                if (error.response?.status === 401) onLogout?.();
            }
        },
        [getAuthHeaders, onLogout, fetchFilesAndFolders]
    );

    const formatFileSize = (bytes) => {
        if (!bytes || bytes < 0) return '-';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(2)} KB`;
        if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(2)} MB`;
        return `${(bytes / 1073741824).toFixed(2)} GB`;
    };

    const getFileIcon = (type) => {
        type = type?.toLowerCase();
        if (['jpg', 'jpeg', 'png'].includes(type)) return <Image className="w-6 h-6 text-emerald-500" />;
        if (['mp4', 'webm'].includes(type)) return <Video className="w-6 h-6 text-violet-500" />;
        if (type === 'pdf') return <FileText className="w-6 h-6 text-rose-500" />;
        if (['docx', 'doc'].includes(type)) return <FileText className="w-6 h-6 text-blue-500" />;
        if (['xls', 'xlsx'].includes(type)) return <FileText className="w-6 h-6 text-green-500" />;
        return <File className="w-6 h-6 text-gray-400" />;
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-950">
                <p className="text-lg font-medium text-gray-300">Please log in to access file manager</p>
            </div>
        );
    }

    console.log('Rendering FileStorage, passing to UploadModal:', { isUploading, setIsUploadingType: typeof setIsUploading });

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-teal-100 flex flex-col font-sans"
        >
            <Toaster position="bottom-right" toastOptions={{ duration: 4000, style: { background: '#e0f7fa', color: '#1e3a8a' } }} />
            <Tooltip id="file-tooltip" className="z-[1003]" />

            <div className="flex-1 max-w-[1600px] mx-auto w-full px-6 py-8">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white/95 backdrop-blur-lg border border-teal-100/50 rounded-3xl shadow-lg flex flex-col h-[calc(100vh-4rem)] overflow-hidden"
                >
                    <header className="bg-teal-50/50 border-b border-teal-200/50 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Folder className="w-7 h-7 text-teal-500" />
                            <h1 className="text-2xl font-bold text-blue-900">File Manager</h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="p-2 text-teal-600 hover:bg-teal-100/50 rounded-full md:hidden"
                                aria-label="Toggle sidebar"
                            >
                                {isSidebarOpen ? <ChevronLeft className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowTrash(!showTrash);
                                    setCurrentFolder(null);
                                    setSelectedItems(new Set());
                                    setPage(1);
                                    setFiles([]);
                                    fetchFilesAndFolders(1, true);
                                }}
                                className="px-4 py-2 text-sm bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200"
                                aria-label={showTrash ? 'View Files' : 'View Trash'}
                            >
                                {showTrash ? 'Files' : 'Trash'}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/')}
                                className="px-4 py-2 text-sm bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 flex items-center gap-2"
                                aria-label="Back to dashboard"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                Dashboard
                            </button>
                        </div>
                    </header>

                    <main className="flex-1 flex overflow-hidden">
                        <aside
                            className={`fixed inset-y-0 left-0 z-30 w-72 bg-teal-50/50 backdrop-blur-md border-r border-teal-200/50 transform transition-transform duration-300 md:static md:transform-none ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 flex flex-col`}
                        >
                            <div className="flex-1 p-6 overflow-y-auto scrollbar-thin">
                                <motion.section
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="mb-6"
                                >
                                    <h3 className="text-sm font-semibold text-teal-700 mb-3 flex items-center gap-2">
                                        <Upload className="w-5 h-5 text-teal-500" />
                                        Upload Files
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => setUploadModal(true)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-xl hover:from-teal-600 hover:to-blue-700 transition-all duration-300 shadow-md hover:shadow-lg"
                                        aria-label="Upload Files"
                                    >
                                        <Plus className="w-5 h-5" />
                                        Upload Files
                                    </button>
                                </motion.section>

                                <motion.section
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="mb-6"
                                >
                                    <h3 className="text-sm font-semibold text-teal-700 mb-3 flex items-center gap-2">
                                        <FolderPlus className="w-5 h-5 text-teal-500" />
                                        New Folder
                                    </h3>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newFolderName}
                                            onChange={(e) => setNewFolderName(e.target.value)}
                                            placeholder="Folder name"
                                            className="flex-1 p-3 text-sm bg-teal-50/50 border border-teal-200 rounded-xl text-teal-800 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all duration-300"
                                            aria-label="New folder name"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleCreateFolder}
                                            className="p-3 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-xl hover:from-teal-600 hover:to-blue-700 transition-all duration-300"
                                            aria-label="Create folder"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    </div>
                                </motion.section>

                                <motion.section
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="mb-6"
                                >
                                    <h3 className="text-sm font-semibold text-teal-700 mb-3 flex items-center gap-2">
                                        <Folder className="w-5 h-5 text-teal-500" />
                                        Folders
                                    </h3>
                                    {folders.length ? (
                                        folders
                                            .filter(f => !f.parentId || f.parentId === currentFolder)
                                            .map(folder => (
                                                <FolderNode
                                                    key={folder._id}
                                                    folder={folder}
                                                    onSelect={setCurrentFolder}
                                                    selectedFolderId={currentFolder}
                                                    folders={folders}
                                                />
                                            ))
                                    ) : (
                                        <p className="text-sm text-teal-600">No folders created</p>
                                    )}
                                </motion.section>

                                <motion.section
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="mb-6"
                                >
                                    <h3 className="text-sm font-semibold text-teal-700 mb-3 flex items-center gap-2">
                                        <Search className="w-5 h-5 text-teal-500" />
                                        Search & Filter
                                    </h3>
                                    <input
                                        type="text"
                                        onChange={(e) => debouncedSearch(e.target.value)}
                                        placeholder="Search files, folders, or tags..."
                                        className="w-full p-3 text-sm bg-teal-50/50 border border-teal-200 rounded-xl text-teal-800 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all duration-300"
                                        aria-label="Search files and folders"
                                    />
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="w-full mt-3 p-3 text-sm bg-teal-50/50 border border-teal-200 rounded-xl text-teal-800 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all duration-300"
                                        aria-label="Sort by"
                                    >
                                        <option value="uploadedAt">Uploaded Date</option>
                                        <option value="name">Name</option>
                                        <option value="size">Size</option>
                                        <option value="type">Type</option>
                                    </select>
                                    <select
                                        value={filterType}
                                        onChange={(e) => {
                                            setFilterType(e.target.value);
                                            setPage(1);
                                            setFiles([]);
                                            fetchFilesAndFolders(1, true);
                                        }}
                                        className="w-full mt-3 p-3 text-sm bg-teal-50/50 border border-teal-200 rounded-xl text-teal-800 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all duration-300"
                                        aria-label="Filter by type"
                                    >
                                        <option value="all">All Types</option>
                                        {ALLOWED_TYPES.map(type => (
                                            <option key={type} value={type}>{type.toUpperCase()}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={filterTask}
                                        onChange={(e) => {
                                            setFilterTask(e.target.value);
                                            setPage(1);
                                            setFiles([]);
                                            fetchFilesAndFolders(1, true);
                                        }}
                                        className="w-full mt-3 p-3 text-sm bg-teal-50/50 border border-teal-200 rounded-xl text-teal-800 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all duration-300"
                                        aria-label="Filter by task"
                                    >
                                        <option value="all">All Tasks</option>
                                        {tasks.map(task => (
                                            <option key={task._id} value={task._id}>{task.title}</option>
                                        ))}
                                    </select>
                                    <div className="mt-3">
                                        <h4 className="text-sm font-semibold text-teal-700 mb-2">Filter by Tags</h4>
                                        {uniqueTags.length ? (
                                            uniqueTags.map(tag => (
                                                <label key={tag} className="flex items-center gap-2 text-sm text-teal-800 mb-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={filterTags.includes(tag)}
                                                        onChange={() => {
                                                            setFilterTags(prev =>
                                                                prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                                                            );
                                                            setPage(1);
                                                            setFiles([]);
                                                            fetchFilesAndFolders(1, true);
                                                        }}
                                                        className="form-checkbox text-teal-500"
                                                    />
                                                    {tag}
                                                </label>
                                            ))
                                        ) : (
                                            <p className="text-sm text-teal-600">No tags available</p>
                                        )}
                                    </div>
                                </motion.section>

                                <motion.section
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    <h3 className="text-sm font-semibold text-teal-700 mb-3 flex items-center gap-2">
                                        <HardDrive className="w-5 h-5 text-teal-500" />
                                        Storage
                                    </h3>
                                    <div className="relative h-2 bg-teal-200/50 rounded-full overflow-hidden">
                                        <div
                                            className="absolute h-full bg-gradient-to-r from-teal-500 to-blue-600"
                                            style={{ width: `${Math.min((storageUsed / TOTAL_STORAGE) * 100, 100)}%` }}
                                        />
                                    </div>
                                    <p className="text-sm text-teal-600 mt-2">
                                        {formatFileSize(storageUsed)} used of {formatFileSize(TOTAL_STORAGE)}
                                    </p>
                                </motion.section>
                            </div>
                        </aside>

                        <section className="flex-1 flex flex-col overflow-hidden">
                            <div className="p-6 border-b border-teal-200/50 bg-teal-50/30">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <nav className="flex items-center gap-2 text-sm text-teal-700">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setCurrentFolder(null);
                                                    setPage(1);
                                                    setFiles([]);
                                                    fetchFilesAndFolders(1, true);
                                                }}
                                                className="hover:text-teal-500"
                                                aria-label="Root folder"
                                            >
                                                Home
                                            </button>
                                            {breadcrumbPath.map((folder, index) => (
                                                <React.Fragment key={folder._id}>
                                                    <ChevronRight className="w-4 h-4" />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setCurrentFolder(folder._id);
                                                            setPage(1);
                                                            setFiles([]);
                                                            fetchFilesAndFolders(1, true);
                                                        }}
                                                        className="hover:text-teal-500 truncate max-w-[150px]"
                                                        aria-label={`Folder ${folder.name}`}
                                                    >
                                                        {folder.name}
                                                    </button>
                                                </React.Fragment>
                                            ))}
                                        </nav>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setViewMode('grid')}
                                            className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-teal-100 text-teal-700' : 'text-teal-600 hover:bg-teal-100/50'}`}
                                            aria-label="Grid view"
                                        >
                                            <Grid className="w-5 h-5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setViewMode('list')}
                                            className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-teal-100 text-teal-700' : 'text-teal-600 hover:bg-teal-100/50'}`}
                                            aria-label="List view"
                                        >
                                            <List className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                {selectedItems.size > 0 && (
                                    <div className="flex items-center gap-3 bg-teal-100/50 p-3 rounded-lg relative">
                                        <p className="text-sm text-teal-700">{selectedItems.size} item(s) selected</p>
                                        <button
                                            type="button"
                                            onClick={() => setShowActionsMenu(!showActionsMenu)}
                                            className="px-3 py-1 text-sm bg-teal-500 text-white rounded-lg hover:bg-teal-600 flex items-center gap-1"
                                            aria-label="Show actions menu"
                                        >
                                            Actions {showActionsMenu ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        </button>
                                        {showActionsMenu && (
                                            <div
                                                ref={actionsMenuRef}
                                                className="absolute top-full mt-2 left-40 bg-teal-50/95 border border-teal-200 rounded-lg shadow-lg z-10"
                                            >
                                                <button
                                                    type="button"
                                                    onClick={handleBulkDelete}
                                                    className="w-full px-4 py-2 text-sm text-red-500 hover:bg-teal-100/50 text-left"
                                                    aria-label={showTrash ? 'Permanently delete selected items' : 'Move selected items to trash'}
                                                >
                                                    {showTrash ? 'Permanently Delete' : 'Move to Trash'}
                                                </button>
                                                {!showTrash && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setMoveFilesModal(true)}
                                                        className="w-full px-4 py-2 text-sm text-teal-700 hover:bg-teal-100/50 text-left"
                                                        aria-label="Move selected items to folder"
                                                    >
                                                        Move to Folder
                                                    </button>
                                                )}
                                                {showTrash && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            Array.from(selectedItems).forEach(id => {
                                                                if (!folders.find(f => f._id === id)) handleRestore(id);
                                                            });
                                                        }}
                                                        className="w-full px-4 py-2 text-sm text-teal-700 hover:bg-teal-100/50 text-left"
                                                        aria-label="Restore selected items"
                                                    >
                                                        Restore
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedItems(new Set());
                                                setShowActionsMenu(false);
                                            }}
                                            className="px-3 py-1 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                                            aria-label="Clear selection"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                )}
                                {showTrash && (
                                    <div className="flex justify-end mt-3">
                                        <button
                                            type="button"
                                            onClick={handleClearTrash}
                                            className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
                                            aria-label="Clear trash"
                                        >
                                            Clear Trash
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
                                {filteredItems.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-teal-600">
                                        <Folder className="w-16 h-16 mb-4" />
                                        <p className="text-lg font-medium">
                                            {showTrash ? 'Trash is empty' : 'No files or folders found'}
                                        </p>
                                    </div>
                                ) : (
                                    <div
                                        className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' : 'grid-cols-1'}`}
                                    >
                                        {filteredItems.map((item, index) => {
                                            const isFolder = item.isFolder;
                                            const isLast = index === filteredItems.length - 1;
                                            return (
                                                <motion.div
                                                    key={item._id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className={`relative rounded-xl border ${selectedItems.has(item._id) ? 'border-teal-500 bg-teal-50/30' : 'border-teal-200/50 bg-teal-50/10'} p-4 hover:bg-teal-50/20 transition-all duration-300 ${viewMode === 'list' ? 'flex items-center gap-4' : ''}`}
                                                    ref={isLast ? lastFileRef : null}
                                                    data-tooltip-id="file-tab"
                                                    data-tooltip-content={item.fileName || item.name}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedItems.has(item._id)}
                                                        onChange={() => {
                                                            setSelectedItems(prev => {
                                                                const newSet = new Set(prev);
                                                                if (newSet.has(item._id)) {
                                                                    newSet.delete(item._id);
                                                                } else {
                                                                    newSet.add(item._id);
                                                                }
                                                                return newSet;
                                                            });
                                                        }}
                                                        className="absolute top-2 left-2 form-checkbox text-teal-500"
                                                        aria-label={`Select ${item.fileName || item.name}`}
                                                    />
                                                    <div
                                                        className="flex-1 cursor-pointer"
                                                        onClick={() => {
                                                            if (isFolder) {
                                                                setCurrentFolder(item._id);
                                                                setPage(1);
                                                                setFiles([]);
                                                                fetchFilesAndFolders(1, true);
                                                            } else {
                                                                handlePreview(item);
                                                            }
                                                        }}
                                                    >
                                                        {isFolder ? (
                                                            <div className={viewMode === 'list' ? 'flex items-center gap-4' : ''}>
                                                                <Folder className="w-12 h-12 text-teal-500" />
                                                                <div className={viewMode === 'list' ? 'flex-1' : 'mt-2'}>
                                                                    <p className="text-sm font-medium text-teal-800 truncate">{item.name}</p>
                                                                    <p className="text-xs text-teal-600">
                                                                        Created: {new Date(item.createdAt).toLocaleDateString()}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className={viewMode === 'list' ? 'flex items-center gap-4' : ''}>
                                                                {getFileIcon(item.type)}
                                                                <div className={viewMode === 'list' ? 'flex-1' : 'mt-2'}>
                                                                    <p className="text-sm font-medium text-teal-800 truncate">{item.fileName}</p>
                                                                    <p className="text-xs text-teal-600">
                                                                        {formatFileSize(item.size)} | {new Date(item.uploadedAt).toLocaleDateString()}</p>
                                                                    {item.tags?.length > 0 && (
                                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                                            {item.tags.map((tag, i) => (
                                                                                <span
                                                                                    key={i}
                                                                                    className="px-1.5 py-0.5 text-xs bg-teal-200/50 text-teal-700 rounded"
                                                                                >
                                                                                    {tag}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="absolute top-2 right-2 flex gap-1">
                                                        {!showTrash && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDownload(item);
                                                                    }}
                                                                    className="p-1.5 text-teal-600 hover:bg-teal-100/50 rounded-full"
                                                                    aria-label={`Download ${item.fileName || item.name}`}
                                                                >
                                                                    <Download className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleShare(item);
                                                                    }}
                                                                    className="p-1.5 text-teal-600 hover:bg-teal-100/50 rounded-full"
                                                                    aria-label={`Share ${item.fileName || item.name}`}
                                                                >
                                                                    <Share2 className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setDetailsPanel(item);
                                                            }}
                                                            className="p-1.5 text-teal-600 hover:bg-teal-100/50 rounded-full"
                                                            aria-label={`View details of ${item.fileName || item.name}`}
                                                        >
                                                            <Info className="w-4 h-4" />
                                                        </button>
                                                        {!isFolder && showTrash && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleRestore(item._id);
                                                                }}
                                                                className="p-1.5 text-teal-600 hover:bg-teal-100/50 rounded-full"
                                                                aria-label={`Restore ${item.fileName}`}
                                                            >
                                                                <ArrowLeft className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(item._id, isFolder, showTrash);
                                                            }}
                                                            className="p-1.5 text-red-500 hover:bg-red-100/50 rounded-full"
                                                            aria-label={`Delete ${item.fileName || item.name}`}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </section>

                        {detailsPanel && (
                            <aside className="w-80 bg-teal-50/50 border-l border-teal-200/50 p-6 overflow-y-auto scrollbar-thin">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-sm font-semibold text-teal-700">Details</h3>
                                    <button
                                        type="button"
                                        onClick={() => setDetailsPanel(null)}
                                        className="p-1 text-teal-600 hover:bg-teal-100/50 rounded-full"
                                        aria-label="Close details panel"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs font-medium text-teal-600">Name</p>
                                        <p className="text-sm text-teal-800 truncate">{detailsPanel.fileName || detailsPanel.name}</p>
                                    </div>
                                    {!detailsPanel.isFolder && (
                                        <>
                                            <div>
                                                <p className="text-xs font-medium text-teal-600">Size</p>
                                                <p className="text-sm text-teal-800">{formatFileSize(detailsPanel.size)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-teal-600">Type</p>
                                                <p className="text-sm text-teal-800">{detailsPanel.type?.toUpperCase()}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-teal-600">Uploaded</p>
                                                <p className="text-sm text-teal-800">{new Date(detailsPanel.uploadedAt).toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-teal-600">Task</p>
                                                <select
                                                    value={detailsPanel.taskId || ''}
                                                    onChange={(e) => handleAssociateTask(detailsPanel._id, e.target.value)}
                                                    className="w-full p-2 text-sm bg-teal-50/50 border border-teal-200 rounded-xl text-teal-800 focus:ring-2 focus:ring-teal-500"
                                                    aria-label="Associate task"
                                                >
                                                    <option value="">No Task</option>
                                                    {tasks.map((task) => (
                                                        <option key={task._id} value={task._id}>{task.title}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-teal-600">Tags</p>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {detailsPanel.tags?.map((tag, i) => (
                                                        <span
                                                            key={i}
                                                            className="px-1.5 py-0.5 text-xs bg-teal-200/50 text-teal-700 rounded"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="flex gap-2 mt-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Add tag"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' && e.target.value.trim()) {
                                                                handleAddTag(detailsPanel._id, e.target.value);
                                                                e.target.value = '';
                                                            }
                                                        }}
                                                        className="flex-1 p-2 text-sm bg-teal-50/50 border border-teal-200 rounded-xl text-teal-800 focus:ring-2 focus:ring-teal-500"
                                                        aria-label="Add tag"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const input = document.querySelector('input[placeholder="Add tag"]');
                                                            if (input?.value.trim()) {
                                                                handleAddTag(detailsPanel._id, input.value);
                                                                input.value = '';
                                                            }
                                                        }}
                                                        className="p-2 bg-teal-500 text-white rounded-xl"
                                                        aria-label="Add tag"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            {detailsPanel.shareLink && (
                                                <div>
                                                    <p className="text-xs font-medium text-teal-600">Share Link</p>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={detailsPanel.shareLink}
                                                            readOnly
                                                            className="flex-1 p-2 text-sm bg-teal-50/50 border border-teal-200 rounded-xl text-teal-800"
                                                            aria-label="Share link"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(detailsPanel.shareLink);
                                                                toast.success('Link copied!');
                                                            }}
                                                            className="p-2 bg-teal-500 text-white rounded-xl"
                                                            aria-label="Copy share link"
                                                        >
                                                            <Link2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <p className="text-xs text-teal-600 mt-1">
                                                        Expires: {new Date(detailsPanel.shareExpires).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                    {detailsPanel.isFolder && (
                                        <div>
                                            <p className="text-xs font-medium text-teal-600">Created</p>
                                            <p className="text-sm text-teal-800">{new Date(detailsPanel.createdAt).toLocaleString()}</p>
                                        </div>
                                    )}
                                </div>
                            </aside>
                        )}
                    </main>
                </motion.div>
            </div>

            <FilePreviewModal
                isOpen={previewModal}
                onClose={() => setPreviewModal(false)}
                file={selectedFileId}
                handleDownload={handleDownload}
                handleShare={handleShare}
            />
            <UploadModal
                isOpen={uploadModal}
                onClose={() => setUploadModal(false)}
                onUpload={handleFileUpload}
                tasks={tasks}
                currentFolderId={currentFolder}
                isUploading={isUploading}
                setIsUploading={setIsUploading}
            />
            <MoveFilesModal
                isOpen={moveFilesModal}
                onClose={() => setMoveFilesModal(false)}
                folders={folders}
                onMove={handleMoveFiles}
                currentFolderId={currentFolder}
            />
        </motion.div>
    );
};

export default FileStorage;