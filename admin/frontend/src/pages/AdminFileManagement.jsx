import React, { useState } from 'react';
import {
    File,
    User,
    FileDown,
    Trash2,
    Edit,
    Search,
    ChevronUp,
    ChevronDown,
    Save,
    X,
    Lock,
    Unlock,
    HardDrive,
} from 'lucide-react';

// Mock file data (replace with backend API call)
const initialFiles = [
    {
        id: '1',
        name: 'project_proposal.pdf',
        owner: 'John Doe',
        size: '2.5 MB',
        uploadDate: '2025-06-15',
        status: 'Public',
        type: 'PDF',
    },
    {
        id: '2',
        name: 'marketing_plan.docx',
        owner: 'Jane Smith',
        size: '1.8 MB',
        uploadDate: '2025-06-10',
        status: 'Private',
        type: 'Document',
    },
    {
        id: '3',
        name: 'team_photo.jpg',
        owner: 'Alice Johnson',
        size: '3.2 MB',
        uploadDate: '2025-06-12',
        status: 'Public',
        type: 'Image',
    },
];

// Mock storage data (replace with backend API call)
const storageData = {
    totalUsed: '7.5 GB',
    totalQuota: '50 GB',
    perUserQuota: '10 GB',
    users: [
        { name: 'John Doe', used: '2.5 GB' },
        { name: 'Jane Smith', used: '1.8 GB' },
        { name: 'Alice Johnson', used: '3.2 GB' },
    ],
};

// Mock available owners and file types
const availableOwners = ['John Doe', 'Jane Smith', 'Alice Johnson'];
const availableFileTypes = ['PDF', 'Document', 'Image'];

const AdminFileManagement = () => {
    const [files, setFiles] = useState(initialFiles);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterOwner, setFilterOwner] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: '', direction: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [editFile, setEditFile] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const filesPerPage = 5;

    // Handle sorting
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });

        const sortedFiles = [...files].sort((a, b) => {
            if (key === 'size') {
                const aSize = parseFloat(a.size);
                const bSize = parseFloat(b.size);
                return direction === 'asc' ? aSize - bSize : bSize - aSize;
            }
            return direction === 'asc'
                ? a[key].localeCompare(b[key])
                : b[key].localeCompare(a[key]);
        });
        setFiles(sortedFiles);
    };

    // Handle search and filters
    const filteredFiles = files.filter(
        (file) =>
            (file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                file.owner.toLowerCase().includes(searchQuery.toLowerCase())) &&
            (filterOwner ? file.owner === filterOwner : true) &&
            (filterType ? file.type === filterType : true) &&
            (filterStatus ? file.status === filterStatus : true)
    );

    // Pagination logic
    const totalPages = Math.ceil(filteredFiles.length / filesPerPage);
    const paginatedFiles = filteredFiles.slice(
        (currentPage - 1) * filesPerPage,
        currentPage * filesPerPage
    );

    // Handle bulk selection
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedFiles(paginatedFiles.map((file) => file.id));
        } else {
            setSelectedFiles([]);
        }
    };

    const handleSelectFile = (id) => {
        setSelectedFiles((prev) =>
            prev.includes(id) ? prev.filter((fileId) => fileId !== id) : [...prev, id]
        );
    };

    // Handle bulk actions
    const handleBulkAction = (action) => {
        setIsLoading(true);
        setTimeout(() => {
            if (action === 'makePublic') {
                setFiles((prev) =>
                    prev.map((file) =>
                        selectedFiles.includes(file.id) ? { ...file, status: 'Public' } : file
                    )
                );
                setSuccess('Selected files set to public successfully!');
            } else if (action === 'makePrivate') {
                setFiles((prev) =>
                    prev.map((file) =>
                        selectedFiles.includes(file.id) ? { ...file, status: 'Private' } : file
                    )
                );
                setSuccess('Selected files set to private successfully!');
            } else if (action === 'delete') {
                setFiles((prev) => prev.filter((file) => !selectedFiles.includes(file.id)));
                setSuccess('Selected files deleted successfully!');
            }
            setSelectedFiles([]);
            setIsLoading(false);
        }, 1000);
    };

    // Handle individual actions
    const handleViewDownload = (file) => {
        console.log(`Viewing/Downloading file: ${file.name}`); // Replace with actual file access logic
        setSuccess(`Initiated view/download for ${file.name}!`);
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this file?')) {
            setIsLoading(true);
            setTimeout(() => {
                setFiles((prev) => prev.filter((file) => file.id !== id));
                setSuccess('File deleted successfully!');
                setIsLoading(false);
            }, 1000);
        }
    };

    const handleUpdate = (file) => {
        setEditFile({ ...file });
        setIsUpdateModalOpen(true);
        setError('');
        setSuccess('');
    };

    // Handle update form submission
    const handleUpdateSubmit = (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Validation
        if (!editFile.name || editFile.name.length < 3) {
            setError('File name must be at least 3 characters long.');
            setIsLoading(false);
            return;
        }
        if (!editFile.status) {
            setError('Please select a status.');
            setIsLoading(false);
            return;
        }

        // Simulate API call
        setTimeout(() => {
            setFiles((prev) =>
                prev.map((file) => (file.id === editFile.id ? editFile : file))
            );
            setSuccess('File updated successfully!');
            setIsUpdateModalOpen(false);
            setEditFile(null);
            setIsLoading(false);
        }, 1000);
    };

    // Calculate storage usage percentage
    const storageUsedPercentage =
        (parseFloat(storageData.totalUsed) / parseFloat(storageData.totalQuota)) * 100;

    return (
        <div className="p-6 bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl max-w-7xl mx-auto relative animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-teal-600">File Management</h2>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search files..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 rounded-full border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700 w-64"
                        aria-label="Search files"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-600" size={18} />
                </div>
            </div>

            {/* Storage Usage Display */}
            <div className="mb-6 bg-teal-50 p-4 rounded-lg animate-slide-in">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-teal-700 flex items-center">
                        <HardDrive className="w-5 h-5 mr-2" />
                        Storage Usage
                    </h3>
                    <p className="text-sm text-gray-600">
                        {storageData.totalUsed} / {storageData.totalQuota} used
                    </p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                    <div
                        className="bg-teal-600 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${storageUsedPercentage}%` }}
                    ></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {storageData.users.map((user) => (
                        <div key={user.name} className="text-sm text-gray-700">
                            <span className="font-medium">{user.name}:</span> {user.used} / {storageData.perUserQuota}
                        </div>
                    ))}
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-4">
                <select
                    value={filterOwner}
                    onChange={(e) => setFilterOwner(e.target.value)}
                    className="p-2 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700"
                    aria-label="Filter by owner"
                >
                    <option value="">All Owners</option>
                    {availableOwners.map((owner) => (
                        <option key={owner} value={owner}>
                            {owner}
                        </option>
                    ))}
                </select>
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="p-2 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700"
                    aria-label="Filter by file type"
                >
                    <option value="">All File Types</option>
                    {availableFileTypes.map((type) => (
                        <option key={type} value={type}>
                            {type}
                        </option>
                    ))}
                </select>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="p-2 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700"
                    aria-label="Filter by status"
                >
                    <option value="">All Statuses</option>
                    <option value="Public">Public</option>
                    <option value="Private">Private</option>
                </select>
            </div>

            {/* Success/Error Messages */}
            {error && (
                <div className="text-red-500 text-sm text-center animate-shake mb-4">
                    {error}
                </div>
            )}
            {success && (
                <div className="text-teal-600 text-sm text-center animate-fade-in mb-4">
                    {success}
                </div>
            )}

            {/* Bulk Actions */}
            {selectedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4 animate-slide-in">
                    <button
                        onClick={() => handleBulkAction('makePublic')}
                        className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-all duration-300"
                        disabled={isLoading}
                    >
                        Make Public
                    </button>
                    <button
                        onClick={() => handleBulkAction('makePrivate')}
                        className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-all duration-300"
                        disabled={isLoading}
                    >
                        Make Private
                    </button>
                    <button
                        onClick={() => handleBulkAction('delete')}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300"
                        disabled={isLoading}
                    >
                        Delete
                    </button>
                </div>
            )}

            {/* File Table */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-teal-50">
                            <th className="p-3">
                                <input
                                    type="checkbox"
                                    checked={selectedFiles.length === paginatedFiles.length && paginatedFiles.length > 0}
                                    onChange={handleSelectAll}
                                    className="h-4 w-4 text-teal-600 focus:ring-teal-400"
                                    aria-label="Select all files"
                                />
                            </th>
                            {['name', 'owner', 'size', 'uploadDate', 'status'].map((key) => (
                                <th
                                    key={key}
                                    className="p-3 text-left text-teal-700 cursor-pointer hover:text-teal-900 transition-colors"
                                    onClick={() => handleSort(key)}
                                    aria-sort={sortConfig.key === key ? sortConfig.direction : 'none'}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                                        {sortConfig.key === key &&
                                            (sortConfig.direction === 'asc' ? (
                                                <ChevronUp size={16} />
                                            ) : (
                                                <ChevronDown size={16} />
                                            ))}
                                    </div>
                                </th>
                            ))}
                            <th className="p-3 text-left text-teal-700">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedFiles.map((file) => (
                            <tr
                                key={file.id}
                                className="border-b border-teal-100 hover:bg-teal-50 transition-all duration-200"
                            >
                                <td className="p-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedFiles.includes(file.id)}
                                        onChange={() => handleSelectFile(file.id)}
                                        className="h-4 w-4 text-teal-600 focus:ring-teal-400"
                                        aria-label={`Select ${file.name}`}
                                    />
                                </td>
                                <td className="p-3 text-gray-700">{file.name}</td>
                                <td className="p-3 text-gray-700">{file.owner}</td>
                                <td className="p-3 text-gray-700">{file.size}</td>
                                <td className="p-3 text-gray-700">{file.uploadDate}</td>
                                <td className="p-3 text-gray-700">
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs ${file.status === 'Public' ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700'
                                            }`}
                                    >
                                        {file.status}
                                    </span>
                                </td>
                                <td className="p-3 flex space-x-2">
                                    <button
                                        onClick={() => handleViewDownload(file)}
                                        className="p-2 rounded-full bg-teal-600 text-white hover:bg-teal-700 transition-all duration-300"
                                        aria-label={`View or download ${file.name}`}
                                        disabled={isLoading}
                                    >
                                        <FileDown size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleUpdate(file)}
                                        className="p-2 rounded-full bg-teal-600 text-white hover:bg-teal-700 transition-all duration-300"
                                        aria-label={`Update ${file.name}`}
                                        disabled={isLoading}
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(file.id)}
                                        className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300"
                                        aria-label={`Delete ${file.name}`}
                                        disabled={isLoading}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-gray-600">
                    Showing {(currentPage - 1) * filesPerPage + 1} to{' '}
                    {Math.min(currentPage * filesPerPage, filteredFiles.length)} of {filteredFiles.length}{' '}
                    files
                </p>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 rounded-lg bg-teal-600 text-white disabled:opacity-50 hover:bg-teal-700 transition-all duration-300"
                        aria-label="Previous page"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 rounded-lg bg-teal-600 text-white disabled:opacity-50 hover:bg-teal-700 transition-all duration-300"
                        aria-label="Next page"
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* Update Modal */}
            {isUpdateModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 w-full max-w-md transform transition-all duration-500 hover:scale-105">
                        <h3 className="text-xl font-bold text-teal-600 mb-4">Update File</h3>
                        <form onSubmit={handleUpdateSubmit} className="space-y-4">
                            <div className="relative">
                                <label htmlFor="name" className="sr-only">
                                    File Name
                                </label>
                                <div className="flex items-center border border-teal-200 rounded-lg focus-within:ring-2 focus-within:ring-teal-400 transition-all duration-300">
                                    <File className="w-5 h-5 text-teal-600 ml-3" />
                                    <input
                                        type="text"
                                        id="name"
                                        value={editFile.name}
                                        onChange={(e) => setEditFile({ ...editFile, name: e.target.value })}
                                        placeholder="Enter file name"
                                        className="w-full p-3 bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
                                        aria-label="File name"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="relative">
                                <label htmlFor="status" className="sr-only">
                                    Status
                                </label>
                                <div className="flex items-center border border-teal-200 rounded-lg focus-within:ring-2 focus-within:ring-teal-400 transition-all duration-300">
                                    {editFile.status === 'Public' ? (
                                        <Unlock className="w-5 h-5 text-teal-600 ml-3" />
                                    ) : (
                                        <Lock className="w-5 h-5 text-teal-600 ml-3" />
                                    )}
                                    <select
                                        id="status"
                                        value={editFile.status}
                                        onChange={(e) => setEditFile({ ...editFile, status: e.target.value })}
                                        className="w-full p-3 bg-transparent focus:outline-none text-gray-700 appearance-none"
                                        aria-label="Select status"
                                        required
                                    >
                                        <option value="Public">Public</option>
                                        <option value="Private">Private</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex space-x-4">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`w-full py-3 rounded-lg bg-teal-600 text-white font-semibold flex items-center justify-center transition-all duration-300 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-teal-700 hover:shadow-lg'
                                        }`}
                                    aria-label="Save file"
                                >
                                    {isLoading ? (
                                        <div className="flex items-center space-x-2">
                                            <div className="w-5 h-5 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                                            <span>Saving...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5 mr-2" />
                                            Save
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        setIsUpdateModalOpen(false);
                                        setEditFile(null);
                                        setError('');
                                        setSuccess('');
                                    }}
                                    className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 hover:shadow-lg transition-all duration-300"
                                    aria-label="Cancel"
                                >
                                    <X className="w-5 h-5 mr-2 inline" />
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminFileManagement;