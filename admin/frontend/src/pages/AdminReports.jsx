import React, { useState, useEffect } from 'react';
import {
    BarChart2,
    PieChart,
    LineChart,
    Gauge,
    Search,
    ChevronUp,
    ChevronDown,
    Download,
    Filter,
    Calendar,
    User,
    FileText,
} from 'lucide-react';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    BarElement,
    LineElement,
    PointElement,
    CategoryScale,
    LinearScale,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import zoomPlugin from 'chartjs-plugin-zoom';

// Register Chart.js components and plugins
ChartJS.register(
    ArcElement,
    BarElement,
    LineElement,
    PointElement,
    CategoryScale,
    LinearScale,
    Title,
    Tooltip,
    Legend,
    Filler,
    ChartDataLabels,
    zoomPlugin
);

// Mock report data (replace with backend API calls)
const mockReportData = {
    'User Activity': {
        chartData: {
            labels: ['2025-06-01', '2025-06-02', '2025-06-03', '2025-06-04', '2025-06-05'],
            datasets: [
                {
                    label: 'Active Sessions',
                    data: [50, 60, 55, 70, 65],
                    borderColor: '#00CED1',
                    backgroundColor: 'rgba(0, 206, 209, 0.2)',
                    fill: true,
                    tension: 0.4,
                },
            ],
        },
        tableColumns: ['user', 'sessions', 'lastActive'],
        tableData: [
            { id: '1', user: 'John Doe', sessions: 50, lastActive: '2025-06-05' },
            { id: '2', user: 'Jane Smith', sessions: 45, lastActive: '2025-06-04' },
            { id: '3', user: 'Alice Johnson', sessions: 30, lastActive: '2025-06-03' },
            { id: '4', user: 'Bob Wilson', sessions: 20, lastActive: '2025-06-02' },
        ],
    },
    'Task Completion': {
        chartData: {
            labels: ['John Doe', 'Jane Smith', 'Alice Johnson', 'Bob Wilson'],
            datasets: [
                {
                    label: 'Completed',
                    data: [10, 8, 5, 3],
                    backgroundColor: '#00CED1',
                },
                {
                    label: 'In Progress',
                    data: [5, 4, 3, 2],
                    backgroundColor: '#1E90FF',
                },
            ],
        },
        tableColumns: ['user', 'completed', 'inProgress', 'overdue'],
        tableData: [
            { id: '1', user: 'John Doe', completed: 10, inProgress: 5, overdue: 1 },
            { id: '2', user: 'Jane Smith', completed: 8, inProgress: 4, overdue: 0 },
            { id: '3', user: 'Alice Johnson', completed: 5, inProgress: 3, overdue: 2 },
            { id: '4', user: 'Bob Wilson', completed: 3, inProgress: 2, overdue: 1 },
        ],
    },
    'Goal Progress': {
        chartData: {
            labels: ['0-25%', '26-50%', '51-75%', '76-100%'],
            datasets: [
                {
                    data: [2, 3, 4, 1],
                    backgroundColor: ['#FF6347', '#FFD700', '#00CED1', '#1E90FF'],
                    borderColor: '#FFFFFF',
                    borderWidth: 2,
                },
            ],
        },
        tableColumns: ['goal', 'users', 'progress', 'deadline'],
        tableData: [
            { id: '1', goal: 'Customer Retention', users: 'John Doe, Jane Smith', progress: 60, deadline: '2025-12-31' },
            { id: '2', goal: 'Product Launch', users: 'Alice Johnson', progress: 85, deadline: '2025-09-30' },
            { id: '3', goal: 'Team Productivity', users: 'Company-Wide', progress: 30, deadline: '2025-11-15' },
            { id: '4', goal: 'Market Expansion', users: 'Bob Wilson', progress: 10, deadline: '2026-03-31' },
        ],
    },
    'System Usage': {
        chartData: {
            labels: ['Active Users', 'API Calls'],
            datasets: [
                {
                    data: [100, 5000],
                    backgroundColor: ['#00CED1', '#1E90FF'],
                    borderColor: '#FFFFFF',
                    borderWidth: 2,
                },
            ],
        },
        tableColumns: ['metric', 'value', 'date'],
        tableData: [
            { id: '1', metric: 'Active Users', value: 100, date: '2025-06-17' },
            { id: '2', metric: 'API Calls', value: 5000, date: '2025-06-17' },
            { id: '3', metric: 'Storage Used (GB)', value: 3.84, date: '2025-06-17' },
        ],
    },
};

// Mock available users for custom report
const availableUsers = ['All Users', 'John Doe', 'Jane Smith', 'Alice Johnson', 'Bob Wilson'];

// Mock available metrics for custom report
const availableMetrics = ['Tasks Completed', 'Active Sessions', 'Goal Progress', 'Files Uploaded'];

const AdminReports = () => {
    const [selectedReport, setSelectedReport] = useState('User Activity');
    const [customReportOpen, setCustomReportOpen] = useState(false);
    const [customMetrics, setCustomMetrics] = useState([]);
    const [customUsers, setCustomUsers] = useState(['All Users']);
    const [customDateRange, setCustomDateRange] = useState({ start: '2025-06-01', end: '2025-06-17' });
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: '', direction: '' });
    const [selectedRows, setSelectedRows] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const rowsPerPage = 5;

    // Chart options
    const lineChartOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'top', labels: { color: '#2D3748' } },
            tooltip: { backgroundColor: '#2D3748', titleColor: '#FFFFFF', bodyColor: '#FFFFFF' },
            zoom: {
                pan: { enabled: true, mode: 'xy' },
                zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'xy' },
            },
        },
        scales: {
            x: { ticks: { color: '#2D3748' } },
            y: { ticks: { color: '#2D3748' } },
        },
    };

    const barChartOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'top', labels: { color: '#2D3748' } },
            tooltip: { backgroundColor: '#2D3748', titleColor: '#FFFFFF', bodyColor: '#FFFFFF' },
        },
        scales: {
            x: { ticks: { color: '#2D3748' }, stacked: true },
            y: { ticks: { color: '#2D3748' }, stacked: true },
        },
    };

    const pieChartOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'right', labels: { color: '#2D3748' } },
            tooltip: { backgroundColor: '#2D3748', titleColor: '#FFFFFF', bodyColor: '#FFFFFF' },
            datalabels: {
                color: '#FFFFFF',
                formatter: (value, ctx) => {
                    const total = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                    return `${((value / total) * 100).toFixed(1)}%`;
                },
            },
        },
    };

    // Handle report selection
    const handleReportSelect = (report) => {
        setSelectedReport(report);
        setSearchQuery('');
        setSortConfig({ key: '', direction: '' });
        setCurrentPage(1);
        setSelectedRows([]);
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            setSuccess(`Loaded ${report} report successfully!`);
        }, 1000);
    };

    // Handle custom report generation
    const handleCustomReport = (e) => {
        e.preventDefault();
        if (customMetrics.length === 0 || customUsers.length === 0) {
            setError('Please select at least one metric and one user.');
            return;
        }
        setIsLoading(true);
        setTimeout(() => {
            setSelectedReport('Custom Report');
            setSuccess('Custom report generated successfully!');
            setIsLoading(false);
            setCustomReportOpen(false);
            // Mock custom report data
            mockReportData['Custom Report'] = {
                chartData: {
                    labels: customUsers.filter((u) => u !== 'All Users'),
                    datasets: customMetrics.map((metric, idx) => ({
                        label: metric,
                        data: Array(customUsers.length - (customUsers.includes('All Users') ? 1 : 0)).fill(Math.floor(Math.random() * 100)),
                        backgroundColor: idx % 2 === 0 ? '#00CED1' : '#1E90FF',
                    })),
                },
                tableColumns: ['user', ...customMetrics.map((m) => m.toLowerCase().replace(' ', ''))],
                tableData: customUsers
                    .filter((u) => u !== 'All Users')
                    .map((user, idx) => ({
                        id: String(idx + 1),
                        user,
                        ...customMetrics.reduce(
                            (acc, m) => ({
                                ...acc,
                                [m.toLowerCase().replace(' ', '')]: Math.floor(Math.random() * 100),
                            }),
                            {}
                        ),
                    })),
            };
        }, 1000);
    };

    // Handle sorting
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });

        const sortedData = [...mockReportData[selectedReport].tableData].sort((a, b) => {
            if (key === 'progress' || key === 'completed' || key === 'inProgress' || key === 'overdue' || key === 'sessions' || key === 'value') {
                return direction === 'asc' ? a[key] - b[key] : b[key] - a[key];
            }
            return direction === 'asc'
                ? String(a[key]).localeCompare(String(b[key]))
                : String(b[key]).localeCompare(String(a[key]));
        });
        mockReportData[selectedReport].tableData = sortedData;
        setFiles([...mockReportData[selectedReport].tableData]); // Trigger re-render
    };

    // Handle search and filters
    const filteredData = mockReportData[selectedReport].tableData.filter((row) =>
        Object.values(row).some((value) =>
            String(value).toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

    // Pagination logic
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    // Handle row selection
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedRows(paginatedData.map((row) => row.id));
        } else {
            setSelectedRows([]);
        }
    };

    const handleSelectRow = (id) => {
        setSelectedRows((prev) =>
            prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
        );
    };

    // Handle export
    const handleExport = (format) => {
        if (filteredData.length === 0) {
            setError('No data to export.');
            return;
        }
        setIsLoading(true);
        setTimeout(() => {
            if (format === 'csv') {
                const csvHeaders = mockReportData[selectedReport].tableColumns;
                const exportData = selectedRows.length > 0
                    ? filteredData.filter((row) => selectedRows.includes(row.id))
                    : filteredData;
                const csvRows = exportData.map((row) =>
                    csvHeaders.map((header) => `"${row[header] || ''}"`).join(',')
                );
                const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `${selectedReport.toLowerCase().replace(' ', '_')}_${Date.now()}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else if (format === 'pdf') {
                console.log('PDF export initiated'); // Replace with jsPDF logic
                setSuccess('PDF export initiated! (Placeholder)');
            } else if (format === 'png') {
                const canvas = document.querySelector('canvas');
                if (canvas) {
                    const link = document.createElement('a');
                    link.href = canvas.toDataURL('image/png');
                    link.download = `${selectedReport.toLowerCase().replace(' ', '_')}_${Date.now()}.png`;
                    link.click();
                } else {
                    setError('No chart available to export as PNG.');
                }
            }
            setSuccess(`Report exported as ${format.toUpperCase()} successfully!`);
            setIsLoading(false);
        }, 1000);
    };

    return (
        <div className="p-6 bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl max-w-7xl mx-auto animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-teal-600">Reports & Analytics</h2>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search report data..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 rounded-full border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700 w-64"
                        aria-label="Search report data"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-600" size={18} />
                </div>
            </div>

            {/* Report Selection */}
            <div className="flex flex-wrap gap-2 mb-6">
                {['User Activity', 'Task Completion', 'Goal Progress', 'System Usage'].map((report) => (
                    <button
                        key={report}
                        onClick={() => handleReportSelect(report)}
                        className={`px-4 py-2 rounded-lg text-white transition-all duration-300 transform hover:scale-105 ${selectedReport === report ? 'bg-teal-600' : 'bg-teal-400 hover:bg-teal-500'
                            }`}
                        aria-label={`Select ${report} report`}
                    >
                        {report}
                    </button>
                ))}
                <button
                    onClick={() => setCustomReportOpen(!customReportOpen)}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300 transform hover:scale-105"
                    aria-label="Toggle custom report builder"
                >
                    <Filter className="inline-block w-5 h-5 mr-2" />
                    Custom Report
                </button>
            </div>

            {/* Custom Report Builder */}
            {customReportOpen && (
                <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg mb-6 animate-slide-in">
                    <h3 className="text-lg font-semibold text-teal-700 mb-4">Custom Report Builder</h3>
                    <form onSubmit={handleCustomReport} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-700 mb-2">Select Metrics</label>
                            <select
                                multiple
                                value={customMetrics}
                                onChange={(e) => setCustomMetrics(Array.from(e.target.selectedOptions, (option) => option.value))}
                                className="w-full p-2 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700"
                                aria-label="Select metrics"
                            >
                                {availableMetrics.map((metric) => (
                                    <option key={metric} value={metric}>{metric}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-2">Select Users</label>
                            <select
                                multiple
                                value={customUsers}
                                onChange={(e) => setCustomUsers(Array.from(e.target.selectedOptions, (option) => option.value))}
                                className="w-full p-2 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700"
                                aria-label="Select users"
                            >
                                {availableUsers.map((user) => (
                                    <option key={user} value={user}>{user}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-2">Start Date</label>
                            <input
                                type="date"
                                value={customDateRange.start}
                                onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                                className="w-full p-2 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700"
                                aria-label="Start date"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-2">End Date</label>
                            <input
                                type="date"
                                value={customDateRange.end}
                                onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                                className="w-full p-2 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700"
                                aria-label="End date"
                            />
                        </div>
                        <div className="col-span-2">
                            <button
                                type="submit"
                                className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-all duration-300"
                                disabled={isLoading}
                                aria-label="Generate custom report"
                            >
                                Generate Report
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Charts */}
            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg mb-8 animate-fade-in">
                <h3 className="text-lg font-semibold text-teal-700 flex items-center mb-4">
                    {selectedReport === 'User Activity' && <LineChart className="w-5 h-5 mr-2" />}
                    {selectedReport === 'Task Completion' && <BarChart2 className="w-5 h-5 mr-2" />}
                    {selectedReport === 'Goal Progress' && <PieChart className="w-5 h-5 mr-2" />}
                    {selectedReport === 'System Usage' && <Gauge className="w-5 h-5 mr-2" />}
                    {selectedReport} Report
                </h3>
                <div className="h-64">
                    {selectedReport === 'User Activity' && (
                        <Line data={mockReportData[selectedReport].chartData} options={lineChartOptions} />
                    )}
                    {selectedReport === 'Task Completion' && (
                        <Bar data={mockReportData[selectedReport].chartData} options={barChartOptions} />
                    )}
                    {selectedReport === 'Goal Progress' && (
                        <Pie data={mockReportData[selectedReport].chartData} options={pieChartOptions} />
                    )}
                    {selectedReport === 'System Usage' && (
                        <Pie data={mockReportData[selectedReport].chartData} options={pieChartOptions} />
                    )}
                    {selectedReport === 'Custom Report' && (
                        <Bar data={mockReportData[selectedReport].chartData} options={barChartOptions} />
                    )}
                </div>
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

            {/* Export Options */}
            <div className="flex space-x-4 mb-6">
                <button
                    onClick={() => handleExport('csv')}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white flex items-center hover:bg-blue-700 transition-all duration-300"
                    disabled={isLoading}
                    aria-label="Export as CSV"
                >
                    <Download className="w-5 h-5 mr-2" />
                    Export CSV
                </button>
                <button
                    onClick={() => handleExport('pdf')}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white flex items-center hover:bg-blue-700 transition-all duration-300"
                    disabled={isLoading}
                    aria-label="Export as PDF"
                >
                    <Download className="w-5 h-5 mr-2" />
                    Export PDF
                </button>
                <button
                    onClick={() => handleExport('png')}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white flex items-center hover:bg-blue-700 transition-all duration-300"
                    disabled={isLoading}
                    aria-label="Export as PNG"
                >
                    <Download className="w-5 h-5 mr-2" />
                    Export PNG
                </button>
            </div>

            {/* Data Table */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-teal-50">
                            <th className="p-3">
                                <input
                                    type="checkbox"
                                    checked={selectedRows.length === paginatedData.length && paginatedData.length > 0}
                                    onChange={handleSelectAll}
                                    className="h-4 w-4 text-teal-600 focus:ring-teal-400"
                                    aria-label="Select all rows"
                                />
                            </th>
                            {mockReportData[selectedReport].tableColumns.map((col) => (
                                <th
                                    key={col}
                                    className="p-3 text-left text-teal-700 cursor-pointer hover:text-teal-900 transition-colors"
                                    onClick={() => handleSort(col)}
                                    aria-sort={sortConfig.key === col ? sortConfig.direction : 'none'}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>{col.charAt(0).toUpperCase() + col.slice(1).replace(/([A-Z])/g, ' $1')}</span>
                                        {sortConfig.key === col &&
                                            (sortConfig.direction === 'asc' ? (
                                                <ChevronUp size={16} />
                                            ) : (
                                                <ChevronDown size={16} />
                                            ))}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.map((row) => (
                            <tr
                                key={row.id}
                                className="border-b border-teal-100 hover:bg-teal-50 transition-all duration-200"
                            >
                                <td className="p-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedRows.includes(row.id)}
                                        onChange={() => handleSelectRow(row.id)}
                                        className="h-4 w-4 text-teal-600 focus:ring-teal-400"
                                        aria-label={`Select row for ${row.user || row.goal || row.metric}`}
                                    />
                                </td>
                                {mockReportData[selectedReport].tableColumns.map((col) => (
                                    <td key={col} className="p-3 text-gray-700">
                                        {col === 'progress' ? (
                                            <div className="flex items-center">
                                                <div className="w-24 bg-gray-200 rounded-full h-2.5 mr-2">
                                                    <div
                                                        className="bg-teal-600 h-2.5 rounded-full transition-all duration-300"
                                                        style={{ width: `${row[col]}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs text-gray-600">{row[col]}%</span>
                                            </div>
                                        ) : col === 'overdue' ? (
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs ${row[col] > 0 ? 'bg-red-100 text-red-700' : 'bg-teal-100 text-teal-700'
                                                    }`}
                                            >
                                                {row[col]}
                                            </span>
                                        ) : (
                                            row[col]
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-gray-600">
                    Showing {(currentPage - 1) * rowsPerPage + 1} to{' '}
                    {Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length}{' '}
                    rows
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

            {isLoading && (
                <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
                    <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                </div>
            )}
        </div>
    );
};

export default AdminReports;