import React, { useState, useMemo, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Save, Upload, Download, Trash2, BarChart, Clock, Trophy, PieChart, TrendingUp, Calendar, Send } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { motion, AnimatePresence } from 'framer-motion';

const GenerateReport = () => {
    const { user, tasks } = useOutletContext();
    const [reportContent, setReportContent] = useState('');
    const [attachedImages, setAttachedImages] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [periodFilter, setPeriodFilter] = useState('monthly');
    const fileInputRef = useRef(null);
    const reportPreviewRef = useRef(null);

    // Filter tasks by period
    const filteredTasks = useMemo(() => {
        const now = new Date();
        let startDate = new Date();
        if (periodFilter === 'daily') {
            startDate.setHours(0, 0, 0, 0);
        } else if (periodFilter === 'weekly') {
            startDate.setDate(now.getDate() - 7);
        } else {
            startDate.setDate(now.getDate() - 30);
        }
        return tasks.filter((task) => {
            const taskDate = task.createdAt ? new Date(task.createdAt) : new Date();
            return taskDate >= startDate && taskDate <= now;
        });
    }, [tasks, periodFilter]);

    // Metrics calculation
    const stats = useMemo(() => {
        const completedTasks = filteredTasks.filter(
            (task) => task.completed === true || task.completed === 1 || (typeof task.completed === 'string' && task.completed.toLowerCase() === 'yes')
        ).length;
        const totalCount = filteredTasks.length;
        const pendingCount = totalCount - completedTasks;
        const completionPercentage = totalCount ? Math.round((completedTasks / totalCount) * 100) : 0;
        const highPriorityCompleted = filteredTasks.filter(
            (task) =>
                (task.completed === true || task.completed === 1 || (typeof task.completed === 'string' && task.completed.toLowerCase() === 'yes')) &&
                task.priority?.toLowerCase() === 'high'
        ).length;
        const productivityScore = Math.min(100, completionPercentage + highPriorityCompleted * 5);
        const overdueCount = filteredTasks.filter((task) => task.dueDate && !task.completed && new Date(task.dueDate) < new Date()).length;

        return {
            totalCount,
            completedTasks,
            pendingCount,
            completionPercentage,
            productivityScore,
            overdueCount,
        };
    }, [filteredTasks]);

    // Handle image attachment
    const handleImageAttach = (e) => {
        const files = Array.from(e.target.files);
        const validImages = files.filter((file) => file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024); // 5MB limit
        if (validImages.length + attachedImages.length > 5) {
            alert('You can attach up to 5 images.');
            return;
        }
        const newImages = validImages.map((file) => ({
            file,
            url: URL.createObjectURL(file),
            name: file.name,
        }));
        setAttachedImages([...attachedImages, ...newImages]);
        e.target.value = ''; // Reset input
    };

    // Remove attached image
    const removeImage = (index) => {
        const updatedImages = attachedImages.filter((_, i) => i !== index);
        attachedImages[index].url && URL.revokeObjectURL(attachedImages[index].url); // Clean up
        setAttachedImages(updatedImages);
    };

    // Clear report content and images
    const clearReport = () => {
        setReportContent('');
        attachedImages.forEach((image) => image.url && URL.revokeObjectURL(image.url)); // Clean up URLs
        setAttachedImages([]);
    };

    // Save report (simulated)
    const saveReport = async () => {
        try {
            setIsSaving(true);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            alert('Report saved successfully!');
        } catch (error) {
            console.error('Error saving report:', error);
            alert('Error saving report. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    // Submit report (simulated, placeholder for backend)
    const submitReport = async () => {
        try {
            setIsSubmitting(true);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            alert('Report submitted successfully!');
        } catch (error) {
            console.error('Error submitting report:', error);
            alert('Error submitting report. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Export report to PDF
    const exportToPDF = async () => {
        try {
            setIsExporting(true);
            const preview = reportPreviewRef.current;
            if (!preview) throw new Error('Report preview not found');

            const tempContainer = document.createElement('div');
            tempContainer.style.width = '210mm';
            tempContainer.style.padding = '20mm';
            tempContainer.style.backgroundColor = '#fff';
            tempContainer.style.fontFamily = 'Arial, sans-serif';
            tempContainer.style.fontSize = '12px';
            tempContainer.style.lineHeight = '1.6';
            tempContainer.style.textAlign = 'justify';
            tempContainer.style.color = '#000';
            document.body.appendChild(tempContainer);

            const contentDiv = document.createElement('div');
            contentDiv.innerHTML = reportContent.replace(/\n/g, '<br>');
            tempContainer.appendChild(contentDiv);

            if (attachedImages.length) {
                const imagesDiv = document.createElement('div');
                imagesDiv.style.marginTop = '20px';
                for (const image of attachedImages) {
                    const img = document.createElement('img');
                    img.src = image.url;
                    img.style.maxWidth = '100%';
                    img.style.height = 'auto';
                    img.style.marginBottom = '10px';
                    imagesDiv.appendChild(img);
                    const caption = document.createElement('div');
                    caption.textContent = image.name;
                    caption.style.fontStyle = 'italic';
                    caption.style.marginBottom = '15px';
                    caption.style.textAlign = 'center';
                    imagesDiv.appendChild(caption);
                }
                tempContainer.appendChild(imagesDiv);
            }

            const canvas = await html2canvas(tempContainer, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#fff',
            });
            const imgData = canvas.toDataURL('image/png', 1.0);

            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 190;
            const pageHeight = 295;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 10;

            pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight, undefined, 'FAST');
            heightLeft -= pageHeight - 20;

            while (heightLeft > 0) {
                position = heightLeft - imgHeight + 10;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight, undefined, 'FAST');
                heightLeft -= pageHeight - 20;
            }

            pdf.save(`report_${new Date().toISOString()}.pdf`);
            document.body.removeChild(tempContainer);
        } catch (error) {
            console.error('Error exporting PDF:', error);
            alert('Error exporting PDF.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex flex-col font-sans p-0">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white/80 backdrop-blur-xl rounded-xl shadow-lg p-6 mb-6 flex justify-between items-center sticky top-0 z-20 border border-teal-100 w-full"
            >
                <div className="flex items-center gap-3">
                    <BarChart className="w-8 h-8 text-teal-600" />
                    <h1 className="text-2xl font-bold text-gray-900">Generate Report</h1>
                </div>
            </motion.div>

            {/* Main Content */}
            <div className="w-full grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Metrics Sidebar */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="bg-white/80 backdrop-blur-xl rounded-xl shadow-lg p-8 lg:col-span-2 min-h-[500px] flex flex-col border border-teal-100 order-first overflow-hidden"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <TrendingUp className="w-6 h-6 text-teal-600" />
                            Performance Metrics
                        </h2>
                        <select
                            value={periodFilter}
                            onChange={(e) => setPeriodFilter(e.target.value)}
                            className="px-4 py-1 text-base bg-teal-50 border border-teal-200 rounded-md focus:ring-2 focus:ring-teal-500"
                            aria-label="Period filter"
                        >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-1 gap-4 mb-4">
                        {[
                            { label: 'Total Tasks', value: stats.totalCount, icon: PieChart, color: 'teal-600' },
                            { label: 'Completed', value: stats.completedTasks, icon: Trophy, color: 'blue-600' },
                            { label: 'Pending', value: stats.pendingCount, icon: Clock, color: 'amber-600' },
                            { label: 'Overdue', value: stats.overdueCount, icon: Clock, color: 'red-600' },
                            { label: 'Completion Rate', value: `${stats.completionPercentage}%`, icon: TrendingUp, color: 'purple-600' },
                            { label: 'Productivity Score', value: `${stats.productivityScore}%`, icon: TrendingUp, color: 'green-600' },
                        ].map(({ label, value, icon: Icon, color }, idx) => (
                            <motion.div
                                key={`metric-${idx}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * idx }}
                                className="flex items-center justify-between p-4 bg-teal-50/50 rounded-md hover:bg-teal-100 transition-colors duration-200"
                            >
                                <div className="flex items-center gap-3">
                                    <Icon className={`w-5 h-5 text-${color}`} />
                                    <span className="text-base font-medium text-gray-700 truncate">{label}</span>
                                </div>
                                <span className={`text-base font-semibold text-${color}`}>{value}</span>
                            </motion.div>
                        ))}
                    </div>
                    <div className="mt-2 flex-1">
                        <h3 className="text-md font-semibold text-gray-900 flex items-center gap-2 mb-2">
                            <Calendar className="w-5 h-5 text-teal-600" />
                            Recent Tasks
                        </h3>
                        <div className="space-y-3 max-h-48 overflow-y-auto scrollbar-thin scrollbar-teal-600 scrollbar-track-teal-100">
                            {filteredTasks.slice(0, 5).map((task, idx) => (
                                <motion.div
                                    key={task._id || `task-${idx}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 * idx }}
                                    className="p-3 bg-teal-50/50 rounded-md text-base hover:bg-teal-100 transition-colors duration-200"
                                >
                                    <p className="font-medium text-gray-800 truncate">{task.title || 'Untitled'}</p>
                                    <p className="text-sm text-gray-600 truncate">
                                        {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'N/A'} • {task.priority || 'None'} •{' '}
                                        {(task.completed === true || task.completed === 1 || (typeof task.completed === 'string' && task.completed.toLowerCase() === 'yes'))
                                            ? 'Completed'
                                            : 'Pending'}
                                    </p>
                                </motion.div>
                            ))}
                            {!filteredTasks.length && <p className="text-base text-gray-600 text-center">No tasks available.</p>}
                        </div>
                    </div>
                </motion.div>

                {/* Report Editor */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="bg-white/80 backdrop-blur-xl rounded-xl shadow-lg p-8 lg:col-span-3 min-h-[500px] flex flex-col border border-teal-100 overflow-hidden"
                >
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                        <BarChart className="w-6 h-6 text-teal-600" />
                        Write Your Report
                    </h2>
                    <textarea
                        value={reportContent}
                        onChange={(e) => setReportContent(e.target.value)}
                        placeholder="Write your detailed report here..."
                        className="w-full h-96 p-4 text-base bg-teal-50/50 border border-teal-200 rounded-md resize-none focus:ring-2 focus:ring-teal-500 outline-none scrollbar-thin scrollbar-teal-600 scrollbar-track-teal-100"
                        aria-label="Report content"
                    />
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                        <label className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 cursor-pointer transition-transform duration-200 hover:scale-105">
                            <Upload className="w-5 h-5" />
                            Attach Images
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                ref={fileInputRef}
                                onChange={handleImageAttach}
                                className="hidden"
                                aria-label="Attach images"
                            />
                        </label>
                        <button
                            onClick={saveReport}
                            disabled={isSaving || isExporting || isSubmitting || !reportContent.trim()}
                            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-amber-500 transition-transform duration-200 hover:scale-105"
                            aria-label="Save report"
                        >
                            <Save className="w-5 h-5" />
                            {isSaving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                            onClick={exportToPDF}
                            disabled={isSaving || isExporting || isSubmitting || !reportContent.trim()}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 transition-transform duration-200 hover:scale-105"
                            aria-label="Export to PDF"
                        >
                            <Download className="w-5 h-5" />
                            {isExporting ? 'Exporting...' : 'Export PDF'}
                        </button>
                        <button
                            onClick={submitReport}
                            disabled={isSaving || isExporting || isSubmitting || !reportContent.trim()}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-green-500 transition-transform duration-200 hover:scale-105"
                            aria-label="Submit report"
                        >
                            <Send className="w-5 h-5" />
                            {isSubmitting ? 'Submitting...' : 'Submit Report'}
                        </button>
                        <button
                            onClick={clearReport}
                            disabled={!reportContent.trim() && !attachedImages.length}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-red-500 transition-transform duration-200 hover:scale-105"
                            aria-label="Clear report"
                        >
                            <Trash2 className="w-5 h-5" />
                            Clear
                        </button>
                    </div>
                    <AnimatePresence>
                        {attachedImages.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
                            >
                                {attachedImages.map((image, idx) => (
                                    <motion.div
                                        key={`image-${idx}`}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="relative group"
                                    >
                                        <img
                                            src={image.url}
                                            alt={image.name}
                                            className="w-full h-32 object-cover rounded-md"
                                            loading="lazy"
                                        />
                                        <button
                                            onClick={() => removeImage(idx)}
                                            className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                            aria-label={`Remove ${image.name}`}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <p className="text-sm text-gray-600 truncate mt-1">{image.name}</p>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* Hidden Preview for PDF */}
            <div className="hidden" ref={reportPreviewRef}>
                <div className="p-10 bg-white text-gray-900">
                    <div className="text-justify whitespace-pre-wrap">{reportContent}</div>
                    {attachedImages.map((image, idx) => (
                        <div key={`preview-image-${idx}`} className="mt-5">
                            <img src={image.url} alt={image.name} className="max-w-full h-auto" />
                            <p className="text-center italic text-sm mt-2">{image.name}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default GenerateReport;