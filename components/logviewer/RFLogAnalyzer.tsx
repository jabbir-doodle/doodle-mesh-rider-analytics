import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar, ReferenceLine } from 'recharts';
import { Radio, ZoomIn, ZoomOut, Maximize2, Minimize2, Network } from 'lucide-react';

// Define proper types to fix all TypeScript errors
interface Station {
    mac: string;
    rssi: number;
    pl_ratio?: number;
    tx_retries?: number;
}

interface LogEntry {
    timestamp: number;
    noise: number;
    activity?: number;
    channel: number;
    channelWidth?: number | string;
    lnaStatus?: string;
    stations?: Station[];
}

interface RFLogAnalyzerProps {
    logData: LogEntry[];
}

interface ChannelTransition {
    timestamp: number;
    from: number;
    to: number;
}

interface StationStats {
    rssiValues: number[];
    plValues: number[];
    retryValues: number[];
}

// Clean, properly-typed component implementation
const RFLogAnalyzer: React.FC<RFLogAnalyzerProps> = ({ logData }) => {
    const [expandedSection, setExpandedSection] = useState<string>('summary');
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    const [zoomLevel, setZoomLevel] = useState<number>(1);

    if (!Array.isArray(logData) || logData.length === 0) {
        return <div className="text-center p-6 text-gray-400">No RF data available</div>;
    }

    // Process channel transitions
    const channelTransitions: ChannelTransition[] = [];
    for (let i = 1; i < logData.length; i++) {
        const prevEntry = logData[i - 1];
        const currEntry = logData[i];

        if (prevEntry.channel !== currEntry.channel) {
            channelTransitions.push({
                timestamp: currEntry.timestamp,
                from: prevEntry.channel,
                to: currEntry.channel
            });
        }
    }

    // Find average noise floor
    const avgNoiseFloor = logData.reduce((sum, entry) => sum + entry.noise, 0) / logData.length;

    // Find most used channel
    const channelCounts: Record<number, number> = {};
    logData.forEach(entry => {
        const channel = entry.channel;
        channelCounts[channel] = (channelCounts[channel] || 0) + 1;
    });

    let primaryChannel = 0;
    let maxCount = 0;
    Object.entries(channelCounts).forEach(([channelStr, count]) => {
        if (count > maxCount) {
            maxCount = count;
            primaryChannel = Number(channelStr);
        }
    });

    // Format time for display
    const formatTime = (timestamp: number): string => {
        if (!timestamp) return '';
        try {
            const date = new Date(timestamp * 1000);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        } catch {
            return '';
        }
    };

    // Toggle section visibility
    const toggleSection = (section: string): void => {
        setExpandedSection(expandedSection === section ? '' : section);
    };

    return (
        <div className={`space-y-4 ${isFullscreen ? 'fixed inset-0 bg-gray-950 z-50 overflow-auto p-4' : ''}`}>


            {/* Summary panel */}
            <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-800">
                <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => toggleSection('summary')}
                >
                    <div className="flex items-center space-x-2">
                        <Network className="w-5 h-5 text-blue-600" />
                        <h3 className="text-base font-medium text-gray-900 dark:text-white">RF Environment Summary</h3>
                    </div>
                    <div className="text-gray-600 dark:text-gray-400 text-sm">
                        {logData.length} data points
                    </div>
                </div>

                {expandedSection === 'summary' && (
                    <div className="mt-4 space-y-4">
                        {/* Key metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                                <div className="text-xs text-gray-600 dark:text-gray-400">Primary Channel</div>
                                <div className="text-lg text-gray-900 dark:text-white font-medium">{primaryChannel}</div>
                            </div>

                            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                                <div className="text-xs text-gray-600 dark:text-gray-400">Avg Noise Floor</div>
                                <div className="text-lg text-gray-900 dark:text-white font-medium">
                                    {avgNoiseFloor.toFixed(1)} dBm
                                </div>
                            </div>

                            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                                <div className="text-xs text-gray-600 dark:text-gray-400">Channel Changes</div>
                                <div className="text-lg text-gray-900 dark:text-white font-medium">
                                    {channelTransitions.length}
                                </div>
                            </div>

                            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                                <div className="text-xs text-gray-600 dark:text-gray-400">Time Range</div>
                                <div className="text-sm text-gray-900 dark:text-white font-medium">
                                    {formatTime(logData[0].timestamp)} - {formatTime(logData[logData.length - 1].timestamp)}
                                </div>
                            </div>
                        </div>

                        {/* Noise/channel overview chart */}
                        <div style={{ height: '200px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={logData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis
                                        dataKey="timestamp"
                                        type="number"
                                        scale="time"
                                        domain={['auto', 'auto']}
                                        tickFormatter={formatTime}
                                        stroke="#9CA3AF"
                                    />
                                    <YAxis
                                        yAxisId="channel"
                                        orientation="left"
                                        domain={['dataMin - 2', 'dataMax + 2']}
                                        stroke="#8B5CF6"
                                        label={{ value: 'Channel', angle: -90, position: 'insideLeft' }}
                                    />
                                    <YAxis
                                        yAxisId="noise"
                                        orientation="right"
                                        domain={['dataMin - 5', 'dataMax + 5']}
                                        stroke="#EF4444"
                                        label={{ value: 'Noise (dBm)', angle: 90, position: 'insideRight' }}
                                    />
                                    <Tooltip
                                        labelFormatter={(label: any) => formatTime(Number(label))}
                                        formatter={(value: any, name: string) => {
                                            if (name === 'Noise') return [`${value} dBm`, name];
                                            return [value, name];
                                        }}
                                    />
                                    <Legend />
                                    <Line
                                        yAxisId="channel"
                                        type="stepAfter"
                                        dataKey="channel"
                                        name="Channel"
                                        stroke="#8B5CF6"
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                    <Line
                                        yAxisId="noise"
                                        type="monotone"
                                        dataKey="noise"
                                        name="Noise"
                                        stroke="#EF4444"
                                        dot={false}
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>

            {/* Channel analysis */}
            <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-800">
                <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => toggleSection('channel')}
                >
                    <div className="flex items-center space-x-2">
                        <Network className="w-5 h-5 text-purple-600" />
                        <h3 className="text-base font-medium text-gray-900 dark:text-white">
                            Channel Transition Analysis
                        </h3>
                    </div>
                    <div className="text-gray-600 dark:text-gray-400 text-sm">
                        {channelTransitions.length} transitions detected
                    </div>
                </div>

                {expandedSection === 'channel' && (
                    <div className="mt-4 space-y-4">
                        {/* Channel chart */}
                        <div
                            style={{
                                transform: `scale(${zoomLevel})`,
                                transformOrigin: 'top left',
                                width: `${100 / zoomLevel}%`,
                                height: '300px'
                            }}
                        >
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={logData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis
                                        dataKey="timestamp"
                                        type="number"
                                        scale="time"
                                        domain={['auto', 'auto']}
                                        tickFormatter={formatTime}
                                        stroke="#9CA3AF"
                                    />
                                    <YAxis
                                        yAxisId="channel"
                                        orientation="left"
                                        domain={['dataMin - 2', 'dataMax + 2']}
                                        stroke="#8B5CF6"
                                        label={{ value: 'Channel', angle: -90, position: 'insideLeft' }}
                                    />
                                    <YAxis
                                        yAxisId="noise"
                                        orientation="right"
                                        domain={['dataMin - 5', 'dataMax + 5']}
                                        stroke="#EF4444"
                                        label={{ value: 'Noise (dBm)', angle: 90, position: 'insideRight' }}
                                    />
                                    <Tooltip
                                        labelFormatter={(label: any) => formatTime(Number(label))}
                                        formatter={(value: any, name: string) => {
                                            if (name === 'Noise') return [`${value} dBm`, name];
                                            if (name === 'Activity') return [`${value}%`, name];
                                            return [value, name];
                                        }}
                                    />
                                    <Legend />

                                    <Line
                                        yAxisId="channel"
                                        type="stepAfter"
                                        dataKey="channel"
                                        name="Channel"
                                        stroke="#8B5CF6"
                                        strokeWidth={2}
                                        dot={false}
                                    />

                                    <Line
                                        yAxisId="noise"
                                        type="monotone"
                                        dataKey="noise"
                                        name="Noise"
                                        stroke="#EF4444"
                                        strokeWidth={1.5}
                                        dot={false}
                                    />

                                    {typeof logData[0].activity === 'number' && (
                                        <Bar
                                            yAxisId="activity"
                                            dataKey="activity"
                                            name="Activity"
                                            fill="#14B8A6"
                                            opacity={0.5}
                                        />
                                    )}

                                    <YAxis
                                        yAxisId="activity"
                                        orientation="right"
                                        domain={[0, 100]}
                                        stroke="#14B8A6"
                                        hide={true}
                                    />

                                    {channelTransitions.map((transition, idx) => (
                                        <ReferenceLine
                                            key={`transition-${idx}`}
                                            x={transition.timestamp}
                                            stroke="#EC4899"
                                            strokeDasharray="3 3"
                                            strokeWidth={1.5}
                                            yAxisId="channel"
                                        />
                                    ))}
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Transition table */}
                        {channelTransitions.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg overflow-x-auto shadow-sm border border-gray-200 dark:border-gray-700">
                                <table className="w-full text-sm text-gray-700 dark:text-gray-300">
                                    <thead>
                                        <tr className="bg-gray-100 dark:bg-gray-700">
                                            <th className="py-2 px-3 text-left border-b border-gray-200 dark:border-gray-600">Time</th>
                                            <th className="py-2 px-3 text-right border-b border-gray-200 dark:border-gray-600">From</th>
                                            <th className="py-2 px-3 text-right border-b border-gray-200 dark:border-gray-600">To</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {channelTransitions.map((transition, idx) => (
                                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700/50'}>
                                                <td className="py-2 px-3 border-b border-gray-100 dark:border-gray-700">{formatTime(transition.timestamp)}</td>
                                                <td className="py-2 px-3 text-right border-b border-gray-100 dark:border-gray-700">{transition.from}</td>
                                                <td className="py-2 px-3 text-right border-b border-gray-100 dark:border-gray-700">{transition.to}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Channel distribution */}
                        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Channel Distribution</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {Object.entries(channelCounts)
                                    .sort(([a], [b]) => Number(a) - Number(b))
                                    .map(([channelStr, count]) => {
                                        const channel = Number(channelStr);
                                        const percentage = (count / logData.length) * 100;
                                        const isPrimary = channel === primaryChannel;

                                        return (
                                            <div
                                                key={channelStr}
                                                className={`p-2 rounded-lg border ${isPrimary
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                    : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div className="text-gray-900 dark:text-white font-medium">Ch {channel}</div>
                                                    <div className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-1.5 py-0.5 rounded">
                                                        {count} samples
                                                    </div>
                                                </div>
                                                <div className="mt-1">
                                                    <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-1.5">
                                                        <div
                                                            className={`h-1.5 rounded-full ${isPrimary ? 'bg-blue-600' : 'bg-gray-500'}`}
                                                            style={{ width: `${percentage}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                    {percentage.toFixed(1)}% of time
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Station performance */}
            <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-800">
                <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => toggleSection('station')}
                >
                    <div className="flex items-center space-x-2">
                        <Radio className="w-5 h-5 text-blue-600" />
                        <h3 className="text-base font-medium text-gray-900 dark:text-white">
                            Station Performance
                        </h3>
                    </div>
                    <div className="text-gray-600 dark:text-gray-400 text-sm">
                        {logData[0]?.stations?.length || 0} stations
                    </div>
                </div>

                {expandedSection === 'station' && logData[0]?.stations && logData[0].stations.length > 0 && (
                    <div className="mt-4 space-y-4">
                        {/* RSSI chart */}
                        <div
                            style={{
                                transform: `scale(${zoomLevel})`,
                                transformOrigin: 'top left',
                                width: `${100 / zoomLevel}%`,
                                height: '300px'
                            }}
                        >
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={logData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis
                                        dataKey="timestamp"
                                        type="number"
                                        scale="time"
                                        domain={['auto', 'auto']}
                                        tickFormatter={formatTime}
                                        stroke="#9CA3AF"
                                    />
                                    <YAxis
                                        yAxisId="rssi"
                                        orientation="left"
                                        domain={[-90, -50]}
                                        stroke="#3B82F6"
                                        label={{ value: 'Signal (dBm)', angle: -90, position: 'insideLeft' }}
                                    />
                                    <Tooltip
                                        labelFormatter={(label: any) => formatTime(Number(label))}
                                        formatter={(value: any, name: string) => {
                                            if (name === 'Noise') return [`${value} dBm`, name];
                                            if (name.startsWith('RSSI')) return [`${value} dBm`, name];
                                            return [value, name];
                                        }}
                                    />
                                    <Legend />

                                    <Line
                                        data={logData}
                                        yAxisId="rssi"
                                        type="monotone"
                                        dataKey="noise"
                                        name="Noise"
                                        stroke="#EF4444"
                                        strokeWidth={1.5}
                                        dot={false}
                                    />

                                    {/* Get up to 3 stations for display */}
                                    {(() => {
                                        // Collect all unique station MACs
                                        const stationMacs = new Set<string>();
                                        logData.forEach(entry => {
                                            if (entry.stations) {
                                                entry.stations.forEach(station => {
                                                    if (station && station.mac) {
                                                        stationMacs.add(station.mac);
                                                    }
                                                });
                                            }
                                        });

                                        // Take first 3 stations for display
                                        return Array.from(stationMacs).slice(0, 3).map(mac => {
                                            // Create dataset for this station
                                            const stationData = logData
                                                .map(entry => {
                                                    if (!entry.stations) return null;
                                                    const station = entry.stations.find(s => s.mac === mac);
                                                    if (!station || typeof station.rssi !== 'number') return null;

                                                    return {
                                                        timestamp: entry.timestamp,
                                                        rssi: station.rssi
                                                    };
                                                })
                                                .filter((item): item is { timestamp: number, rssi: number } => item !== null);

                                            if (stationData.length === 0) return null;

                                            const macSuffix = mac.slice(-4);

                                            return (
                                                <Line
                                                    key={`rssi-${mac}`}
                                                    data={stationData}
                                                    yAxisId="rssi"
                                                    type="monotone"
                                                    dataKey="rssi"
                                                    name={`RSSI (${macSuffix})`}
                                                    stroke="#3B82F6"
                                                    strokeWidth={2}
                                                    dot={false}
                                                    connectNulls={true}
                                                />
                                            );
                                        });
                                    })()}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Station metrics */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                                <thead>
                                    <tr className="bg-gray-100 dark:bg-gray-700">
                                        <th className="py-2 px-3 text-left border-b border-gray-200 dark:border-gray-600">Station</th>
                                        <th className="py-2 px-3 text-right border-b border-gray-200 dark:border-gray-600">Avg RSSI</th>
                                        <th className="py-2 px-3 text-right border-b border-gray-200 dark:border-gray-600">Packet Loss</th>
                                        <th className="py-2 px-3 text-right border-b border-gray-200 dark:border-gray-600">Retries</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        // Collect stats for each station
                                        const stationStats: Record<string, StationStats> = {};

                                        logData.forEach(entry => {
                                            if (entry.stations) {
                                                entry.stations.forEach(station => {
                                                    if (!station || !station.mac) return;

                                                    if (!stationStats[station.mac]) {
                                                        stationStats[station.mac] = {
                                                            rssiValues: [],
                                                            plValues: [],
                                                            retryValues: []
                                                        };
                                                    }

                                                    if (typeof station.rssi === 'number') {
                                                        stationStats[station.mac].rssiValues.push(station.rssi);
                                                    }

                                                    if (typeof station.pl_ratio === 'number') {
                                                        stationStats[station.mac].plValues.push(station.pl_ratio);
                                                    }

                                                    if (typeof station.tx_retries === 'number') {
                                                        stationStats[station.mac].retryValues.push(station.tx_retries);
                                                    }
                                                });
                                            }
                                        });

                                        // Generate table rows
                                        return Object.entries(stationStats).map(([mac, stats], idx) => {
                                            const avgRssi = stats.rssiValues.length
                                                ? stats.rssiValues.reduce((sum, v) => sum + v, 0) / stats.rssiValues.length
                                                : null;

                                            const avgPl = stats.plValues.length
                                                ? stats.plValues.reduce((sum, v) => sum + v, 0) / stats.plValues.length
                                                : null;

                                            const avgRetries = stats.retryValues.length
                                                ? stats.retryValues.reduce((sum, v) => sum + v, 0) / stats.retryValues.length
                                                : null;

                                            return (
                                                <tr key={mac} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700/50'}>
                                                    <td className="py-2 px-3 border-b border-gray-100 dark:border-gray-700">{mac.slice(-8)}</td>
                                                    <td className="py-2 px-3 text-right border-b border-gray-100 dark:border-gray-700">
                                                        {avgRssi !== null ? `${avgRssi.toFixed(1)} dBm` : 'N/A'}
                                                    </td>
                                                    <td className="py-2 px-3 text-right border-b border-gray-100 dark:border-gray-700">
                                                        {avgPl !== null ? `${avgPl.toFixed(2)}%` : 'N/A'}
                                                    </td>
                                                    <td className="py-2 px-3 text-right border-b border-gray-100 dark:border-gray-700">
                                                        {avgRetries !== null ? avgRetries.toFixed(1) : 'N/A'}
                                                    </td>
                                                </tr>
                                            );
                                        });
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RFLogAnalyzer;