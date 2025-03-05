import React, { useState, useEffect, useRef } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Play, FileText, RefreshCw, AlertTriangle, CheckCircle, XCircle, Clock,
    Zap, Filter, Search, ChevronDown, BarChart2, PieChart as PieChartIcon,
    Activity, Clipboard, Download, Layers, ThumbsUp, ThumbsDown, Code
} from 'lucide-react';

const ApiTestingTool = () => {
    // Test state management
    const [isRunning, setIsRunning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [filter, setFilter] = useState("all");
    const [chartType, setChartType] = useState("line");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const resultsRef = useRef<HTMLDivElement>(null);

    // Simulated test results - in a real app, this would come from your API
    const [testResults, setTestResults] = useState({
        summary: {
            total: 200,
            passed: 187,
            failed: 13,
            avgResponseTime: 213,
            startTime: "2025-03-05T14:23:45",
            endTime: "2025-03-05T14:25:12",
            duration: "1m 27s",
            inProgress: false
        },
        categories: [
            { name: "System", total: 42, passed: 40, failed: 2, color: "#3B82F6" },
            { name: "Network", total: 67, passed: 64, failed: 3, color: "#10B981" },
            { name: "Wireless", total: 35, passed: 31, failed: 4, color: "#F59E0B" },
            { name: "Firmware", total: 28, passed: 26, failed: 2, color: "#8B5CF6" },
            { name: "Security", total: 18, passed: 17, failed: 1, color: "#EF4444" },
            { name: "GPS", total: 10, passed: 9, failed: 1, color: "#EC4899" }
        ],
        responseTimeData: [
            { category: "System", avg: 156, min: 89, max: 312 },
            { category: "Network", avg: 187, min: 102, max: 354 },
            { category: "Wireless", avg: 234, min: 110, max: 458 },
            { category: "Firmware", avg: 267, min: 143, max: 521 },
            { category: "Security", avg: 204, min: 123, max: 378 },
            { category: "GPS", avg: 178, min: 98, max: 312 }
        ],
        failedTests: [
            { id: "NET-012", category: "Network", name: "network.interface.add", errorMsg: "Invalid parameters: missing ipaddr", responseTime: 134, timestamp: "14:23:52" },
            { id: "WIFI-008", category: "Wireless", name: "wireless.radio.config", errorMsg: "Invalid frequency range", responseTime: 287, timestamp: "14:24:18" },
            { id: "SYS-022", category: "System", name: "system.upgrade.start", errorMsg: "Insufficient storage space", responseTime: 421, timestamp: "14:24:32" },
            { id: "SEC-005", category: "Security", name: "security.firewall.rule.add", errorMsg: "Invalid port range specification", responseTime: 156, timestamp: "14:24:45" },
            { id: "FW-013", category: "Firmware", name: "firmware.package.verify", errorMsg: "Package signature verification failed", responseTime: 312, timestamp: "14:24:59" },
            { id: "GPS-003", category: "GPS", name: "gps.position.update", errorMsg: "Invalid coordinates format", responseTime: 187, timestamp: "14:25:03" }
        ]
    });

    // Simulate a test run
    const runTests = () => {
        setIsRunning(true);
        setProgress(0);

        // Scroll to results section after a delay
        setTimeout(() => {
            if (resultsRef.current) {
                resultsRef.current.scrollIntoView({ behavior: 'smooth' });
            }
        }, 300);

        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setIsRunning(false);
                    return 100;
                }
                return prev + Math.random() * 2;
            });
        }, 80);
    };

    // Filter failed tests by category (if selected)
    const filteredFailedTests = selectedCategory
        ? testResults.failedTests.filter(test => test.category === selectedCategory)
        : testResults.failedTests;

    // Filter failed tests by search term
    const searchFilteredFailedTests = searchTerm
        ? filteredFailedTests.filter(test =>
            test.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            test.errorMsg.toLowerCase().includes(searchTerm.toLowerCase()))
        : filteredFailedTests;

    // Prepare data for pie chart
    const pieChartData = testResults.categories.map(category => ({
        name: category.name,
        value: category.total,
        passed: category.passed,
        failed: category.failed,
        color: category.color
    }));

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 100,
                damping: 12
            }
        }
    };

    const fadeIn = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.5
            }
        }
    };

    const renderResponseTimeChart = () => {
        switch (chartType) {
            case 'line':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={testResults.responseTimeData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                            <XAxis dataKey="category" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                                    borderColor: '#4b5563',
                                    color: '#e5e7eb',
                                    borderRadius: '0.5rem',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                    border: 'none'
                                }}
                                labelStyle={{ color: '#f3f4f6', fontWeight: 'bold', marginBottom: '0.5rem' }}
                                itemStyle={{ padding: '0.25rem 0' }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '1rem' }} />
                            <Line
                                type="monotone"
                                dataKey="avg"
                                stroke="#F59E0B"
                                strokeWidth={3}
                                name="Avg (ms)"
                                dot={{ stroke: '#F59E0B', strokeWidth: 2, r: 4, fill: '#F59E0B' }}
                                activeDot={{ stroke: '#F59E0B', strokeWidth: 2, r: 6, fill: '#F59E0B' }}
                                animationDuration={1500}
                            />
                            <Line
                                type="monotone"
                                dataKey="max"
                                stroke="#EF4444"
                                strokeWidth={3}
                                name="Max (ms)"
                                dot={{ stroke: '#EF4444', strokeWidth: 2, r: 4, fill: '#EF4444' }}
                                activeDot={{ stroke: '#EF4444', strokeWidth: 2, r: 6, fill: '#EF4444' }}
                                animationDuration={1500}
                                animationBegin={300}
                            />
                            <Line
                                type="monotone"
                                dataKey="min"
                                stroke="#10B981"
                                strokeWidth={3}
                                name="Min (ms)"
                                dot={{ stroke: '#10B981', strokeWidth: 2, r: 4, fill: '#10B981' }}
                                activeDot={{ stroke: '#10B981', strokeWidth: 2, r: 6, fill: '#10B981' }}
                                animationDuration={1500}
                                animationBegin={600}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                );
            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={testResults.responseTimeData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                            <XAxis dataKey="category" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                                    borderColor: '#4b5563',
                                    color: '#e5e7eb',
                                    borderRadius: '0.5rem'
                                }}
                            />
                            <Legend />
                            <Bar dataKey="avg" name="Avg (ms)" fill="#F59E0B" radius={[4, 4, 0, 0]} animationDuration={1500} />
                            <Bar dataKey="max" name="Max (ms)" fill="#EF4444" radius={[4, 4, 0, 0]} animationDuration={1500} />
                            <Bar dataKey="min" name="Min (ms)" fill="#10B981" radius={[4, 4, 0, 0]} animationDuration={1500} />
                        </BarChart>
                    </ResponsiveContainer>
                );
            case 'radar':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart outerRadius={90} data={testResults.responseTimeData}>
                            <PolarGrid stroke="rgba(255, 255, 255, 0.1)" />
                            <PolarAngleAxis dataKey="category" stroke="#94a3b8" />
                            <PolarRadiusAxis stroke="#94a3b8" />
                            <Radar name="Avg (ms)" dataKey="avg" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.5} animationDuration={1500} />
                            <Radar name="Max (ms)" dataKey="max" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} animationDuration={1500} />
                            <Radar name="Min (ms)" dataKey="min" stroke="#10B981" fill="#10B981" fillOpacity={0.3} animationDuration={1500} />
                            <Legend />
                            <Tooltip />
                        </RadarChart>
                    </ResponsiveContainer>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-gray-100">
            <div className="pt-8 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    className="space-y-8"
                >
                    <motion.div variants={itemVariants} className="flex items-center mb-6">
                        <div className="flex items-center">
                            <img
                                src="/logo.png"
                                alt="Mesh Rider Logo"
                                className="h-12 w-auto mr-4"
                            />
                            <div>
                                <h1 className="text-2xl font-bold text-white">
                                    Mesh Rider API Manager
                                </h1>
                                <p className="text-gray-400 mt-1">
                                    Advanced API testing and analysis for Mesh Rider radio interfaces
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        variants={itemVariants}
                        className="flex flex-col lg:flex-row justify-between gap-6 items-start lg:items-center"
                    >
                        <div className="bg-gray-850 rounded-xl p-5 flex-grow">
                            <h2 className="text-lg font-medium mb-4 flex items-center">
                                <Code className="w-5 h-5 mr-2 text-blue-400" />
                                <span>API Test Configuration</span>
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-gray-800/50 rounded-lg p-3">
                                    <div className="text-sm text-gray-400 mb-1">Target Device</div>
                                    <div className="flex items-center">
                                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                                        <span>UAV-001 Smart Radio (10.223.9.106)</span>
                                    </div>
                                </div>

                                <div className="bg-gray-800/50 rounded-lg p-3">
                                    <div className="text-sm text-gray-400 mb-1">API Version</div>
                                    <div className="flex items-center">
                                        <span>v2.3.4 (Latest)</span>
                                    </div>
                                </div>

                                <div className="bg-gray-800/50 rounded-lg p-3">
                                    <div className="text-sm text-gray-400 mb-1">Test Suite</div>
                                    <div className="flex items-center">
                                        <span>Full API Validation</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4">
                                <button
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                    className="text-sm text-gray-400 hover:text-white flex items-center"
                                >
                                    <ChevronDown size={16} className={`mr-1 transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`} />
                                    {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
                                </button>

                                <AnimatePresence>
                                    {showAdvanced && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="mt-4 pt-4 border-t border-gray-700 overflow-hidden"
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-sm text-gray-400 mb-1">Request Timeout (ms)</label>
                                                    <input
                                                        type="number"
                                                        defaultValue={5000}
                                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm text-gray-400 mb-1">Authentication Type</label>
                                                    <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white">
                                                        <option>Token Based</option>
                                                        <option>Basic Auth</option>
                                                        <option>OAuth2</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-sm text-gray-400 mb-1">Test Categories</label>
                                                    <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white">
                                                        <option>All Categories</option>
                                                        <option>System</option>
                                                        <option>Network</option>
                                                        <option>Wireless</option>
                                                        <option>Firmware</option>
                                                        <option>Security</option>
                                                        <option>GPS</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={runTests}
                                disabled={isRunning}
                                className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white px-5 py-3 rounded-xl font-medium disabled:opacity-50 transition-colors shadow-lg shadow-amber-600/20"
                            >
                                <Play size={18} />
                                Run API Tests
                            </button>

                            <button className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-5 py-3 rounded-xl font-medium transition-colors">
                                <FileText size={18} />
                                Export Report
                            </button>
                        </div>
                    </motion.div>

                    {isRunning && (
                        <motion.div
                            className="bg-gray-850 p-5 rounded-xl border border-gray-800/50"
                            variants={itemVariants}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <RefreshCw size={18} className="text-amber-500 animate-spin" />
                                    <span className="font-medium">Running API tests...</span>
                                </div>
                                <span className="text-amber-500 font-medium">{progress.toFixed(1)}%</span>
                            </div>

                            <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-amber-500 to-amber-600"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ ease: "easeOut" }}
                                ></motion.div>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                {testResults.categories.map((category, index) => (
                                    <div key={index} className="bg-gray-800/50 rounded-full px-3 py-1 flex items-center">
                                        <div className={`w-1.5 h-1.5 rounded-full mr-1.5`} style={{ backgroundColor: category.color }}></div>
                                        <span>{category.name}</span>
                                        <span className="text-gray-400 ml-1">
                                            {Math.min(100, Math.floor(progress * (index + 1) / testResults.categories.length))}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    <div ref={resultsRef}>
                        <motion.div
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
                            variants={itemVariants}
                        >
                            <div className="bg-gray-850 p-6 rounded-xl shadow-xl border border-gray-800/50">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-3 bg-blue-500/10 rounded-lg">
                                        <Layers size={20} className="text-blue-500" />
                                    </div>
                                    <div className="flex-grow">
                                        <h2 className="text-gray-400 text-sm">Total APIs</h2>
                                        <div className="text-white text-2xl font-bold">{testResults.summary.total}</div>
                                    </div>
                                </div>
                                <div className="mt-2 text-xs text-gray-500">
                                    {testResults.categories.length} categories
                                </div>
                            </div>

                            <div className="bg-gray-850 p-6 rounded-xl shadow-xl border border-gray-800/50">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-3 bg-green-500/10 rounded-lg">
                                        <ThumbsUp size={20} className="text-green-500" />
                                    </div>
                                    <div className="flex-grow">
                                        <h2 className="text-gray-400 text-sm">Passed</h2>
                                        <div className="text-green-500 text-2xl font-bold">{testResults.summary.passed}</div>
                                    </div>
                                </div>
                                <div className="mt-2 text-xs text-gray-500">
                                    {((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1)}% success rate
                                </div>
                            </div>

                            <div className="bg-gray-850 p-6 rounded-xl shadow-xl border border-gray-800/50">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-3 bg-red-500/10 rounded-lg">
                                        <ThumbsDown size={20} className="text-red-500" />
                                    </div>
                                    <div className="flex-grow">
                                        <h2 className="text-gray-400 text-sm">Failed</h2>
                                        <div className="text-red-500 text-2xl font-bold">{testResults.summary.failed}</div>
                                    </div>
                                </div>
                                <div className="mt-2 text-xs text-gray-500">
                                    Issues across {testResults.categories.filter(c => c.failed > 0).length} categories
                                </div>
                            </div>

                            <div className="bg-gray-850 p-6 rounded-xl shadow-xl border border-gray-800/50">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-3 bg-blue-500/10 rounded-lg">
                                        <Clock size={20} className="text-blue-500" />
                                    </div>
                                    <div className="flex-grow">
                                        <h2 className="text-gray-400 text-sm">Avg Response</h2>
                                        <div className="text-blue-500 text-2xl font-bold">{testResults.summary.avgResponseTime}<span className="text-lg ml-1">ms</span></div>
                                    </div>
                                </div>
                                <div className="mt-2 text-xs text-gray-500">
                                    Total duration: {testResults.summary.duration}
                                </div>
                            </div>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <motion.div
                                className="bg-gray-850 rounded-xl shadow-xl overflow-hidden col-span-2 border border-gray-800/50"
                                variants={itemVariants}
                            >
                                <div className="p-5 border-b border-gray-800 flex justify-between items-center">
                                    <h2 className="text-lg font-medium flex items-center">
                                        <Activity className="w-5 h-5 mr-2 text-blue-400" />
                                        <span>Response Time Analysis</span>
                                    </h2>

                                    <div className="flex bg-gray-800 rounded-lg">
                                        <button
                                            onClick={() => setChartType('line')}
                                            className={`p-2 rounded-lg ${chartType === 'line' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                        >
                                            <Activity size={16} />
                                        </button>
                                        <button
                                            onClick={() => setChartType('bar')}
                                            className={`p-2 rounded-lg ${chartType === 'bar' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                        >
                                            <BarChart2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => setChartType('radar')}
                                            className={`p-2 rounded-lg ${chartType === 'radar' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                        >
                                            <PieChartIcon size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-5 h-72">
                                    {renderResponseTimeChart()}
                                </div>

                                <div className="p-4 bg-blue-900/10 border-t border-blue-900/20">
                                    <div className="flex items-start">
                                        <Zap size={18} className="text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
                                        <div>
                                            <h3 className="font-medium text-blue-400">Response Time Insights</h3>
                                            <p className="text-sm text-gray-400 mt-1">
                                                Firmware APIs have the highest average response time ({testResults.responseTimeData.find(d => d.category === 'Firmware')?.avg}ms),
                                                while System APIs are the fastest ({testResults.responseTimeData.find(d => d.category === 'System')?.avg}ms).
                                                Consider optimizing the Firmware package verification process to improve performance.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                className="bg-gray-850 rounded-xl shadow-xl overflow-hidden border border-gray-800/50"
                                variants={itemVariants}
                            >
                                <div className="p-5 border-b border-gray-800 flex items-center justify-between">
                                    <h2 className="text-lg font-medium flex items-center">
                                        <AlertTriangle className="w-5 h-5 mr-2 text-amber-400" />
                                        <span>Failed Tests</span>
                                    </h2>
                                    <div className="bg-red-900/20 text-red-400 py-1 px-3 rounded-full text-sm">
                                        {testResults.failedTests.length} Issues
                                    </div>
                                </div>

                                <div className="border-b border-gray-800">
                                    <div className="p-3 flex">
                                        <div className="relative flex-grow">
                                            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                                            <input
                                                type="text"
                                                placeholder="Search errors..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div className="ml-2">
                                            <button
                                                className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white"
                                                onClick={() => setSelectedCategory(null)}
                                            >
                                                <Filter size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {selectedCategory && (
                                        <div className="px-3 pb-3">
                                            <div className="flex items-center">
                                                <span className="text-sm text-gray-400 mr-2">Filtered by:</span>
                                                <div className="bg-blue-900/20 text-blue-400 px-2 py-0.5 rounded-full text-xs flex items-center">
                                                    {selectedCategory}
                                                    <button
                                                        className="ml-1 hover:text-white"
                                                        onClick={() => setSelectedCategory(null)}
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="h-80 overflow-y-auto">
                                    {searchFilteredFailedTests.length > 0 ? (
                                        <ul className="divide-y divide-gray-800">
                                            {searchFilteredFailedTests.map((test, index) => (
                                                <li key={index} className="p-4 hover:bg-gray-800/50 transition-colors">
                                                    <div className="flex items-start">
                                                        <XCircle size={18} className="text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                                                        <div>
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="font-medium">{test.id}</span>
                                                                <button
                                                                    className="text-xs text-blue-400 bg-blue-900/20 px-2 py-0.5 rounded-full hover:bg-blue-900/30 transition-colors"
                                                                    onClick={() => setSelectedCategory(test.category)}
                                                                >
                                                                    {test.category}
                                                                </button>
                                                                <span className="text-gray-400 text-sm">{test.name}</span>
                                                            </div>
                                                            <p className="text-red-400 text-sm mt-1">{test.errorMsg}</p>
                                                            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                                                                <span>Response: {test.responseTime}ms</span>
                                                                <span>{test.timestamp}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                                            <CheckCircle size={32} className="text-green-500 mb-2" />
                                            <p className="text-gray-400">No failed tests match your search criteria</p>
                                            {searchTerm && (
                                                <button
                                                    className="mt-2 text-blue-400 hover:text-blue-300 text-sm"
                                                    onClick={() => setSearchTerm("")}
                                                >
                                                    Clear search
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>

                        <motion.div
                            className="bg-gray-850 rounded-xl shadow-xl overflow-hidden border border-gray-800/50 mb-8"
                            variants={itemVariants}
                        >
                            <div className="p-5 border-b border-gray-800 flex items-center justify-between">
                                <h2 className="text-lg font-medium flex items-center">
                                    <Clipboard className="w-5 h-5 mr-2 text-blue-400" />
                                    <span>Test Categories Summary</span>
                                </h2>

                                <div className="flex items-center bg-gray-800 rounded-lg">
                                    <button
                                        className={`px-3 py-1 text-sm rounded-lg ${filter === 'all' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                        onClick={() => setFilter('all')}
                                    >
                                        All
                                    </button>
                                    <button
                                        className={`px-3 py-1 text-sm rounded-lg ${filter === 'failed' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                        onClick={() => setFilter('failed')}
                                    >
                                        Failed
                                    </button>
                                    <button
                                        className={`px-3 py-1 text-sm rounded-lg ${filter === 'passed' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                        onClick={() => setFilter('passed')}
                                    >
                                        Passed
                                    </button>
                                </div>
                            </div>

                            <div className="p-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {testResults.categories
                                        .filter(category => {
                                            if (filter === 'failed') return category.failed > 0;
                                            if (filter === 'passed') return category.passed === category.total;
                                            return true;
                                        })
                                        .map((category, index) => (
                                            <motion.div
                                                key={index}
                                                className="bg-gray-800/50 p-5 rounded-xl border border-gray-700/50 hover:border-gray-600/50 transition-colors"
                                                whileHover={{ y: -4 }}
                                                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                                            >
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="font-medium text-white flex items-center">
                                                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: category.color }}></div>
                                                        {category.name}
                                                    </h3>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-green-400 text-sm flex items-center">
                                                            <CheckCircle size={14} className="mr-1" />
                                                            {category.passed}
                                                        </span>
                                                        <span className="text-red-400 text-sm flex items-center">
                                                            <XCircle size={14} className="mr-1" />
                                                            {category.failed}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="mb-3">
                                                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                        <span>Success Rate</span>
                                                        <span>{((category.passed / category.total) * 100).toFixed(1)}%</span>
                                                    </div>
                                                    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500"
                                                            style={{ width: `${(category.passed / category.total) * 100}%` }}
                                                        ></div>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between text-xs text-gray-400">
                                                    <div>
                                                        <span className="block text-gray-500">Avg. Response</span>
                                                        <span className="font-medium text-sm">
                                                            {testResults.responseTimeData.find(d => d.category === category.name)?.avg} ms
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-gray-500">Max Response</span>
                                                        <span className="font-medium text-sm">
                                                            {testResults.responseTimeData.find(d => d.category === category.name)?.max} ms
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-gray-500">Total Tests</span>
                                                        <span className="font-medium text-sm">{category.total}</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-center p-4 border-t border-gray-800 bg-gray-900/20">
                                <div className="h-60 w-full max-w-md">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieChartData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={90}
                                                paddingAngle={2}
                                                dataKey="value"
                                                animationBegin={0}
                                                animationDuration={1500}
                                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                labelLine={false}
                                            >
                                                {pieChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value, name, props) => {
                                                    const entry = props.payload;
                                                    return [
                                                        `Total: ${value}, Passed: ${entry.passed}, Failed: ${entry.failed}`,
                                                        entry.name
                                                    ];
                                                }}
                                                contentStyle={{
                                                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                                                    borderColor: '#4b5563',
                                                    color: '#e5e7eb',
                                                    borderRadius: '0.5rem'
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            className="flex items-start bg-blue-900/10 p-5 rounded-xl border border-blue-900/20"
                            variants={itemVariants}
                        >
                            <div className="p-2 bg-blue-900/20 rounded-lg mr-4">
                                <Download size={20} className="text-blue-400" />
                            </div>
                            <div>
                                <h3 className="font-medium">Want more detailed insights?</h3>
                                <p className="text-gray-400 mt-1 text-sm">
                                    Export a comprehensive report with detailed test results, response time analysis, and actionable recommendations for optimization.
                                </p>
                                <button className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                    Generate Detailed Report
                                </button>
                            </div>
                        </motion.div>

                        <motion.footer
                            className="mt-8 text-gray-500 text-sm border-t border-gray-800/50 pt-6 flex justify-between"
                            variants={itemVariants}
                        >
                            <div>
                                Last test run: {testResults.summary.startTime.replace('T', ' ')} • Duration: {testResults.summary.duration}
                            </div>
                            <div>
                                Mesh Rider API Test Dashboard v1.0.1
                            </div>
                        </motion.footer>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default ApiTestingTool;