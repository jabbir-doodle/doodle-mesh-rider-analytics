'use client';
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Legend,
    ComposedChart,
} from 'recharts';
import {
    Radio,
    Network,
    Clock,
    Signal,
    Maximize2,
    Wifi,
    Activity,
    GitBranch,
} from 'lucide-react';
import { MetricCard } from './shared/MetricCard';
import { MeshStat } from '@/types';
import { formatMacAddress, macToIpAddress } from '@/utils/networkHelpers';

interface MeshDetailsProps {
    node: MeshStat;
    timeSeriesData: any[];
    localtime: number;
    onClose: () => void;
}

/* -----------------------------
   Utility Functions
----------------------------- */
const formatTimestamp = (value: number) =>
    new Date(value).toLocaleString('en-US', {
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
    });

// Enhanced Path Quality Chart showing direct vs hopped paths
const PathQualityChart: React.FC<{ data: any[] }> = ({ data }) => {
    const processedData = data.map(entry => ({
        ...entry,
        directQuality: entry.hop_status === 'direct' ? (entry.tq / 255) * 100 : null,
        hoppedQuality: entry.hop_status === 'hop' ? (entry.tq / 255) * 100 : null,
    }));

    return (
        <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={processedData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                        dataKey="timestamp"
                        type="number"
                        domain={['auto', 'auto']}
                        tickFormatter={formatTimestamp}     // Change this line
                        stroke="#9CA3AF"
                    />
                    <YAxis
                        domain={[0, 100]}
                        stroke="#9CA3AF"
                        label={{
                            value: 'Path Quality (%)',
                            angle: -90,
                            position: 'insideLeft',
                            style: { fill: '#9CA3AF' }
                        }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1F2937',
                            border: 'none',
                            borderRadius: '0.5rem',
                            color: '#F3F4F6',
                        }}
                        labelFormatter={(label) => formatTimestamp(Number(label))}  // Add this line
                        formatter={(value: any) => [
                            `${Number(value).toFixed(1)}%`,
                            'Quality'
                        ]}
                    />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey="directQuality"
                        stroke="#10B981"
                        name="Direct Path"
                        strokeWidth={2}
                        dot={false}
                    />
                    <Line
                        type="monotone"
                        dataKey="hoppedQuality"
                        stroke="#60A5FA"
                        name="Hopped Path"
                        strokeWidth={2}
                        dot={false}
                    />
                    {/* Quality threshold indicators */}
                    <Line
                        type="monotone"
                        dataKey={() => 70}
                        stroke="#059669"
                        strokeDasharray="3 3"
                        name="Good Quality"
                    />
                    <Line
                        type="monotone"
                        dataKey={() => 40}
                        stroke="#DC2626"
                        strokeDasharray="3 3"
                        name="Min Quality"
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};

// Network Stability Chart combining quality and latency
const StabilityChart: React.FC<{ data: any[] }> = ({ data }) => (
    <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                    dataKey="timestamp"
                    type="number"
                    domain={['auto', 'auto']}
                    tickFormatter={formatTimestamp}     // Change this line
                    stroke="#9CA3AF"
                />
                <YAxis
                    yAxisId="quality"
                    domain={[0, 100]}
                    stroke="#9CA3AF"
                    label={{
                        value: 'Quality (%)',
                        angle: -90,
                        position: 'insideLeft',
                        style: { fill: '#9CA3AF' }
                    }}
                />
                <YAxis
                    yAxisId="latency"
                    orientation="right"
                    domain={[0, 'auto']}
                    stroke="#9CA3AF"
                    label={{
                        value: 'Response (ms)',
                        angle: 90,
                        position: 'insideRight',
                        style: { fill: '#9CA3AF' }
                    }}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#1F2937',
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: '#F3F4F6',
                    }}
                    labelFormatter={(label) => formatTimestamp(Number(label))}  // Add this line
                />
                <Legend />
                <Line
                    yAxisId="quality"
                    type="monotone"
                    dataKey="quality"
                    stroke="#10B981"
                    name="Link Quality"
                    dot={false}
                />
                <Bar
                    yAxisId="latency"
                    dataKey="last_seen_msecs"
                    fill="#60A5FA"
                    name="Response Time"
                    opacity={0.5}
                />
            </ComposedChart>
        </ResponsiveContainer>
    </div>
);

// Path Distribution Chart
const PathDistributionChart: React.FC<{ data: any[] }> = ({ data }) => {
    const processedData = useMemo(() => {
        const latest = [...data].sort((a, b) => b.timestamp - a.timestamp)[0];
        if (!latest) return [];

        const paths = data.reduce((acc, curr) => {
            const key = `${curr.hop_status}_${Math.floor((curr.tq / 255) * 100 / 33)}`;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});

        return Object.entries(paths).map(([key, count]) => {
            const [type, quality] = key.split('_');
            return {
                pathType: type,
                qualityRange: Number(quality) === 0 ? 'Low' : Number(quality) === 1 ? 'Medium' : 'High',
                count,
            };
        });
    }, [data]);

    return (
        <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={processedData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="pathType" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1F2937',
                            border: 'none',
                            borderRadius: '0.5rem',
                            color: '#F3F4F6',
                        }}
                        labelFormatter={(label) => formatTimestamp(Number(label))}  // Add this line
                    />
                    <Legend />
                    <Bar
                        dataKey="count"
                        name="Path Count"
                        fill="#60A5FA"
                        radius={[4, 4, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

const MeshDetails: React.FC<MeshDetailsProps> = ({
    node,
    timeSeriesData,
    localtime,
    onClose,
}) => {
    const [selectedMetric, setSelectedMetric] = useState<string>('');
    const [isFullView, setIsFullView] = useState<boolean>(false);
    const [showOverview, setShowOverview] = useState<boolean>(true);
    const [compareMode, setCompareMode] = useState<boolean>(false);
    const [selectedGraphs, setSelectedGraphs] = useState<string[]>(['pathQuality', 'stability', 'distribution']);
    const [isAllMetricsSelected, setIsAllMetricsSelected] = useState<boolean>(true);

    // Calculate network health metrics
    const normalizedQuality = (node.tq / 255) * 100;
    const pathStats = useMemo(() => {
        const paths = timeSeriesData.reduce((acc: Record<string, number>, curr) => {
            acc[curr.hop_status] = (acc[curr.hop_status] || 0) + 1;
            return acc;
        }, {});
        return {
            total: Object.values(paths).reduce((a, b) => a + b, 0),
            direct: paths.direct || 0,
            hopped: paths.hop || 0,
        };
    }, [timeSeriesData]);

    const getQualityStatus = (quality: number): 'normal' | 'warning' | 'critical' => {
        if (quality >= 70) return 'normal';
        if (quality >= 40) return 'warning';
        return 'critical';
    };

    const getPathStatus = (direct: number, total: number): 'normal' | 'warning' | 'critical' => {
        const ratio = direct / total;
        if (ratio >= 0.5) return 'normal';
        if (ratio >= 0.3) return 'warning';
        return 'critical';
    };

    const renderChart = () => {
        switch (selectedMetric) {
            case 'pathQuality':
                return <PathQualityChart data={timeSeriesData} />;
            case 'stability':
                return <StabilityChart data={timeSeriesData} />;
            case 'distribution':
                return <PathDistributionChart data={timeSeriesData} />;
            default:
                return null;
        }
    };

    const CombinedMetricsChart = () => (
        <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Combined Metrics</h3>
            </div>
            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={timeSeriesData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis
                            dataKey="timestamp"
                            type="number"
                            domain={['auto', 'auto']}
                            tickFormatter={formatTimestamp}
                            stroke="#9CA3AF"
                        />
                        <YAxis
                            yAxisId="quality"
                            orientation="left"
                            domain={[0, 100]}
                            stroke="#10B981"
                            label={{ value: 'Quality (%)', angle: -90, position: 'insideLeft' }}
                        />
                        <YAxis
                            yAxisId="latency"
                            orientation="right"
                            domain={[0, 'auto']}
                            stroke="#60A5FA"
                            label={{ value: 'Response (ms)', angle: 90, position: 'insideRight' }}
                        />
                        <Tooltip
                            labelFormatter={formatTimestamp}
                            contentStyle={{
                                backgroundColor: '#1F2937',
                                border: 'none',
                                borderRadius: '0.5rem',
                                color: '#F3F4F6'
                            }}
                        />
                        <Legend />
                        {selectedGraphs.includes('pathQuality') && (
                            <>
                                <Line
                                    yAxisId="quality"
                                    type="monotone"
                                    dataKey="directQuality"
                                    name="Direct Path"
                                    stroke="#10B981"
                                    dot={false}
                                />
                                <Line
                                    yAxisId="quality"
                                    type="monotone"
                                    dataKey="hoppedQuality"
                                    name="Hopped Path"
                                    stroke="#EC4899"
                                    dot={false}
                                />
                            </>
                        )}
                        {selectedGraphs.includes('stability') && (
                            <Bar
                                yAxisId="latency"
                                dataKey="last_seen_msecs"
                                name="Response Time"
                                fill="#60A5FA"
                                opacity={0.5}
                            />
                        )}
                        {selectedGraphs.includes('distribution') && (
                            <Line
                                yAxisId="quality"
                                type="monotone"
                                dataKey={(entry) => (entry.tq / 255) * 100}
                                name="Path Distribution"
                                stroke="#F59E0B"
                                dot={false}
                            />
                        )}
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );

    const handleCompareSelect = (metric: string) => {
        if (metric === 'all') {
            setIsAllMetricsSelected(prev => {
                const newState = !prev;
                setSelectedGraphs(newState ? ['pathQuality', 'stability', 'distribution'] : []);
                return newState;
            });
            return;
        }

        setIsAllMetricsSelected(false);
        setSelectedGraphs(prev => {
            if (prev.includes(metric)) {
                return prev.filter(m => m !== metric);
            }
            if (prev.length >= 3) {
                return prev;
            }
            return [...prev, metric];
        });
    };

    const toggleCompareMode = () => {
        setCompareMode(prev => {
            if (!prev) {
                // Entering compare mode
                setShowOverview(false);
                setSelectedMetric('');
                setSelectedGraphs(['pathQuality', 'stability', 'distribution']);
                setIsAllMetricsSelected(true);
            } else {
                // Exiting compare mode
                setShowOverview(true);
                setSelectedGraphs([]);
                setIsAllMetricsSelected(true);
            }
            return !prev;
        });
    };

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    className="bg-gray-900 rounded-lg p-6 w-full sm:w-[80%] max-h-[90vh] overflow-y-auto"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                >
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <div className="flex items-center gap-2">
                                <div className="bg-blue-500/10 p-2 rounded-lg">
                                    <Network className="h-6 w-6 text-blue-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">
                                        <span className="text-sm text-gray-400 font-mono">
                                            {formatMacAddress(node.orig_address)}
                                        </span>
                                        <span className="px-2 py-0.5 bg-gray-700 rounded-full text-xs text-gray-300">
                                            {node.hop_status.toUpperCase()}
                                        </span>
                                        {/* // {macToIpAddress(node.orig_address)} */}
                                    </h2>
                                    {/* <div className="flex items-center gap-2 mt-1">
                                       
                                    </div> */}
                                </div>
                            </div>

                            <div className="text-sm text-gray-400 mt-1">
                                Last Updated: {formatTimestamp(localtime)}
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    setShowOverview(!showOverview);
                                    if (!showOverview) setSelectedMetric('');
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                            >
                                {showOverview ? 'Hide Overview' : 'Show Overview'}
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onClose}
                                className="text-gray-400 hover:text-white p-2 text-xl"
                            >
                                ×
                            </motion.button>
                        </div>
                    </div>

                    {/* Metric Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                        <MetricCard
                            title="Link Quality"
                            value={normalizedQuality}
                            unit="%"
                            icon={Signal}
                            onClick={() => {
                                setSelectedMetric('pathQuality');
                                setShowOverview(false);
                            }}
                            status={getQualityStatus(normalizedQuality)}
                        />
                        <MetricCard
                            title="Response Time"
                            value={node.last_seen_msecs}
                            unit="ms"
                            icon={Clock}
                            onClick={() => {
                                setSelectedMetric('stability');
                                setShowOverview(false);
                            }}
                            status={node.last_seen_msecs < 1000 ? 'normal' : 'warning'}
                        />
                    </div>


                    {/* Compare Metrics Section */}
                    <div className="mb-6">
                        <div className="flex justify-end">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={toggleCompareMode}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                            >
                                <Activity className="h-4 w-4" />
                                {compareMode ? 'Hide Comparison' : 'Compare Metrics'}
                            </motion.button>
                        </div>

                        {compareMode && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-4"
                            >
                                <div className="bg-gray-800 p-4 rounded-lg">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-semibold text-white">Compare Metrics</h3>
                                    </div>

                                    <div className="text-gray-400 text-sm mb-4">
                                        {`Select metrics to compare or click "All Metrics"`}
                                    </div>

                                    <div className="flex flex-wrap gap-3 mb-4">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleCompareSelect('all')}
                                            className={`px-4 py-2 rounded-lg transition-colors duration-200 ${isAllMetricsSelected
                                                ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                                                }`}
                                        >
                                            All Metrics
                                        </motion.button>

                                        {[
                                            { id: 'pathQuality', label: 'Path Quality' },
                                            { id: 'stability', label: 'Network Stability' },
                                            { id: 'distribution', label: 'Path Distribution' }
                                        ].map(({ id, label }) => (
                                            <motion.button
                                                key={id}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleCompareSelect(id)}
                                                className={`px-4 py-2 rounded-lg transition-colors duration-200 ${selectedGraphs.includes(id)
                                                    ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                                                    : isAllMetricsSelected
                                                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                                                    }`}
                                                disabled={isAllMetricsSelected}
                                            >
                                                {label}
                                            </motion.button>
                                        ))}
                                    </div>

                                    {selectedGraphs.length > 0 && <CombinedMetricsChart />}
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Overview */}
                    {showOverview && !selectedMetric && !compareMode && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                className="bg-gray-800 p-4 rounded-lg"
                            >
                                <h4 className="text-md font-semibold text-white mb-2 flex items-center gap-2">
                                    <Signal className="h-4 w-4" />
                                    Path Quality Trends
                                </h4>
                                <PathQualityChart data={timeSeriesData} />
                            </motion.div>
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                className="bg-gray-800 p-4 rounded-lg"
                            >
                                <h4 className="text-md font-semibold text-white mb-2 flex items-center gap-2">
                                    <Activity className="h-4 w-4" />
                                    Network Stability
                                </h4>
                                <StabilityChart data={timeSeriesData} />
                            </motion.div>
                        </div>
                    )}

                    {/* Selected Metric View */}
                    {selectedMetric && !compareMode && (
                        <motion.div
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gray-800 p-4 rounded-lg"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-white">
                                    {selectedMetric === 'pathQuality' ? 'Path Quality Analysis' :
                                        selectedMetric === 'stability' ? 'Network Stability' :
                                            'Path Distribution'}
                                </h3>
                                <div className="flex items-center space-x-2">
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setIsFullView(true)}
                                        className="text-gray-400 hover:text-white"
                                    >
                                        <Maximize2 size={20} /></motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setSelectedMetric('')}
                                        className="text-gray-400 hover:text-white"
                                    >
                                        ×
                                    </motion.button>
                                </div>
                            </div>
                            {renderChart()}
                        </motion.div>
                    )}

                    {/* Full View Modal */}
                    <AnimatePresence>
                        {isFullView && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
                            >
                                <motion.div
                                    layout
                                    initial={{ scale: 0.9 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0.9 }}
                                    className="bg-gray-900 rounded-lg p-6 w-full sm:w-[90%] max-h-[90vh] overflow-y-auto relative"
                                >
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-semibold text-white">
                                            {selectedMetric === 'pathQuality' ? 'Detailed Path Quality Analysis' :
                                                selectedMetric === 'stability' ? 'Network Stability Details' :
                                                    'Path Distribution Analysis'}
                                        </h3>
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setIsFullView(false)}
                                            className="text-gray-400 hover:text-white"
                                        >
                                            ×
                                        </motion.button>
                                    </div>
                                    <div className="h-[calc(80vh-100px)]">
                                        {renderChart()}
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </motion.div>
        </AnimatePresence >
    );
};

export default MeshDetails;