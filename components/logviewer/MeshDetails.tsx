'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatTimestamp, formatTimeAxis } from '@/utils/timeFormatters';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine, AreaChart, Area,
    TooltipProps
} from 'recharts';
import { Network, Clock, X, Info } from 'lucide-react';
import { formatMacAddress } from '@/utils/networkHelpers';

interface Station {
    mac: string;
    rssi: number;
    rssi_ant: number[];
    pl_ratio: number;
    tx_bytes: number;
    tx_retries: number;
    tx_failed: number;
    mcs: number;
    inactive: number;
}

interface MeshNode {
    orig_address: string;
    tq: number;
    hop_status: 'direct' | 'indirect';
    last_seen_msecs: number;
}

interface LogEntry {
    timestamp: number;
    tq: number;
    hop_status: 'direct' | 'indirect';
    last_seen_msecs: number;
    [key: string]: any;
}

interface MeshDetailsProps {
    node: MeshNode;
    timeSeriesData: LogEntry[];
    localtime: number;
    onClose: () => void;
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{ payload: LogEntry }>;
    label?: number;
}

type ViewMode = 'tq' | 'connection' | 'both';

const MeshDetails: React.FC<MeshDetailsProps> = ({
    node,
    timeSeriesData,
    localtime,
    onClose
}) => {
    const [viewMode, setViewMode] = useState<ViewMode>('tq');

    // Custom tooltip for all charts
    const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
        if (!active || !payload || !payload.length) return null;

        const data = payload[0].payload;
        return (
            <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 shadow-lg">
                <p className="text-gray-300 font-medium mb-1">{formatTimestamp(label || 0)}</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <span className="text-gray-400">TQ Value:</span>
                    <span className="text-white font-mono">{data.tq}/255</span>
                    <span className="text-gray-400">Link Type:</span>
                    <span className={`${data.hop_status === 'direct' ? 'text-green-400' : 'text-blue-400'}`}>
                        {data.hop_status.toUpperCase()}
                    </span>
                    <span className="text-gray-400">Last Seen:</span>
                    <span className="text-white">{(data.last_seen_msecs / 1000).toFixed(1)}s ago</span>
                </div>
            </div>
        );
    };

    // Get link type history
    const linkTypeHistory = timeSeriesData.reduce<Record<string, string[]>>((acc, data) => {
        const timestamp = formatTimestamp(data.timestamp);
        if (!acc[data.hop_status]) {
            acc[data.hop_status] = [];
        }
        acc[data.hop_status].push(timestamp);
        return acc;
    }, {});

    // Format the header to show link type changes
    const linkTypeInfo = Object.entries(linkTypeHistory).map(([type, times]) => (
        <div key={type} className="mt-2">
            <span className={`px-2 py-0.5 rounded-full text-xs ${type === 'direct' ? 'bg-green-900/50 text-green-300' : 'bg-blue-900/50 text-blue-300'
                }`}>
                {type.toUpperCase()}
            </span>
            <span className="text-gray-400 ml-2">
                {Array.isArray(times) && (times.length > 1
                    ? `${times.length} occurrences (latest: ${times[times.length - 1]})`
                    : `at ${times[0]}`)}
            </span>
        </div>
    ));

    // Status data for connection type view
    const statusData = timeSeriesData.map(item => ({
        ...item,
        status_value: item.hop_status === 'direct' ? 2 : 1,
    }));

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
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <div className="flex items-center gap-2">
                                <div className="bg-blue-500/10 p-2 rounded-lg">
                                    <Network className="h-6 w-6 text-blue-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">
                                        {formatMacAddress(node.orig_address)}
                                    </h2>
                                    <div className="text-sm text-gray-400 mt-1">
                                        <div className="flex items-center gap-2">
                                            <Clock size={16} />
                                            <span>Last Updated: {formatTimestamp(localtime)}</span>
                                        </div>
                                        <div className="mt-2">
                                            <span className="text-gray-300">Link Type History:</span>
                                            {linkTypeInfo}
                                        </div>
                                        <div className="mt-2 text-yellow-300 text-xs">
                                            <Info size={14} className="inline mr-1" />
                                            Link type changes over time as network conditions change
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={onClose}
                            className="text-gray-400 hover:text-white p-2"
                        >
                            <X />
                        </motion.button>
                    </div>

                    {/* Tab buttons */}
                    <div className="flex mb-4">
                        <button
                            onClick={() => setViewMode('tq')}
                            className={`px-4 py-2 ${viewMode === 'tq' ? 'bg-blue-600 text-white' : 'bg-white text-gray-300'}`}
                        >
                            TQ Value
                        </button>
                        <button
                            onClick={() => setViewMode('connection')}
                            className={`px-4 py-2 ${viewMode === 'connection' ? 'bg-blue-600 text-white' : 'bg-white-700 text-gray-300'}`}
                        >
                            Connection Type
                        </button>
                        <button
                            onClick={() => setViewMode('both')}
                            className={`px-4 py-2 ${viewMode === 'both' ? 'bg-blue-600 text-white' : 'bg-white text-gray-300'}`}
                        >
                            Both
                        </button>
                    </div>

                    {/* TQ Value Graph */}
                    {(viewMode === 'tq' || viewMode === 'both') && (
                        <div className="bg-gray-800 p-4 rounded-lg mb-4">
                            <h3 className="text-lg font-semibold text-white mb-4">TQ Value Over Time</h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={timeSeriesData}
                                        margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                        <XAxis
                                            dataKey="timestamp"
                                            type="number"
                                            domain={['auto', 'auto']}
                                            tickFormatter={(value) => formatTimeAxis(value)}
                                            stroke="#9CA3AF"
                                            tickCount={5}
                                        />
                                        <YAxis
                                            domain={[0, 255]}
                                            stroke="#9CA3AF"
                                            label={{ value: 'TQ Value (0-255)', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF' } }}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <ReferenceLine y={128} stroke="#F59E0B" strokeDasharray="3 3" label={{ value: '50%', position: 'right', fill: '#F59E0B' }} />
                                        <ReferenceLine y={192} stroke="#10B981" strokeDasharray="3 3" label={{ value: '75%', position: 'right', fill: '#10B981' }} />
                                        <Line
                                            type="monotone"
                                            dataKey="tq"
                                            stroke="#60A5FA"
                                            strokeWidth={2}
                                            dot={false}
                                            activeDot={{ r: 6, fill: '#3B82F6', stroke: '#1E40AF', strokeWidth: 2 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                                <div className="mt-4 text-sm text-gray-400">
                                    <p>Hover over the chart to see detailed information for each data point.</p>
                                    <div className="flex flex-wrap gap-4 mt-2">
                                        <div className="flex items-center">
                                            <div className="w-3 h-3 bg-green-500 mr-1"></div>
                                            <span>75%+ (192-255): Excellent</span>
                                        </div>
                                        <div className="flex items-center">
                                            <div className="w-3 h-3 bg-yellow-500 mr-1"></div>
                                            <span>50-75% (128-191): Good</span>
                                        </div>
                                        <div className="flex items-center">
                                            <div className="w-3 h-3 bg-red-500 mr-1"></div>
                                            <span>0-50% (0-127): Poor</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Connection Type Graph */}
                    {(viewMode === 'connection' || viewMode === 'both') && (
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold text-white mb-4">Connection Type Over Time</h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={statusData}
                                        margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                        <XAxis
                                            dataKey="timestamp"
                                            type="number"
                                            domain={['auto', 'auto']}
                                            tickFormatter={(value: number) => formatTimeAxis(value)}
                                            stroke="#9CA3AF"
                                            tickCount={5}
                                        />
                                        <YAxis
                                            domain={[0, 3]}
                                            ticks={[1, 2]}
                                            tickFormatter={(value: number) => value === 2 ? 'DIRECT' : value === 1 ? 'INDIRECT' : ''}
                                            stroke="#9CA3AF"
                                            label={{ value: 'Connection Type', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF' } }}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area
                                            type="stepAfter"
                                            dataKey="status_value"
                                            stroke="#10B981"
                                            fill="#10B981"
                                            fillOpacity={0.3}
                                            isAnimationActive={true}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                                <div className="mt-4 text-sm text-gray-400">
                                    <p>Hover over the chart to see detailed information for each status change.</p>
                                    <div className="flex flex-wrap gap-4 mt-2">
                                        <div className="flex items-center">
                                            <div className="w-3 h-3 bg-green-500 mr-1"></div>
                                            <span>DIRECT: Direct connection to the node</span>
                                        </div>
                                        <div className="flex items-center">
                                            <div className="w-3 h-3 bg-blue-500 mr-1"></div>
                                            <span>INDIRECT: Connection via another mesh node</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default MeshDetails;