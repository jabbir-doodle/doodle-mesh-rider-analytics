import React, { useState, useRef } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Minimize2, X } from 'lucide-react';
import { formatTimestamp, formatTimeAxis } from '@/utils/timeFormatters';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceArea,
    ReferenceLine,
    Label
} from 'recharts';

interface StationData {
    mac: string;
    rssi: number;
    rssi_ant: number[];
    [key: string]: any;
}

interface LogEntry {
    timestamp: number;
    noise: number;
    stations: StationData[];
    [key: string]: any;
}

interface RssiNoiseChartProps {
    logData: LogEntry[];
}

const RFSignalAnalysisChart: React.FC<RssiNoiseChartProps> = ({ logData }) => {
    const [visibleStations, setVisibleStations] = useState<{ [key: string]: boolean }>({});
    const [showMargin, setShowMargin] = useState(true);
    const [timeRange, setTimeRange] = useState<'all' | 'recent'>('all');
    const [isExpanded, setIsExpanded] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);
    const chartContainerRef = useRef<HTMLDivElement>(null);
    if (!logData || logData.length === 0) {
        return <div className="text-center text-gray-400 p-6">No data available</div>;
    }
    const filteredData = timeRange === 'recent' ? logData.slice(Math.max(0, logData.length - 30)) : logData;

    const handleZoomIn = () => {
        setZoomLevel(prev => Math.min(prev + 0.25, 2.5));
    };
    const handleZoomOut = () => {
        setZoomLevel(prev => Math.max(prev - 0.25, 1));
    };
    const toggleFullscreen = () => {
        setIsExpanded(!isExpanded);
    };

    const formatMacAddress = (mac: string): string => {
        if (!mac) return '';
        return mac.replace(/:/g, '').match(/.{1,2}/g)?.join(':').toUpperCase() || mac;
    };
    const getStationColor = (index: number): string => {
        const colors = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];
        return colors[index % colors.length];
    };
    const stations = logData.flatMap(entry => entry.stations || []).filter((station, index, self) => index === self.findIndex(s => s.mac === station.mac));
    if (Object.keys(visibleStations).length === 0 && stations.length > 0) {
        const initialState: { [key: string]: boolean } = {};
        stations.forEach(station => { initialState[station.mac] = true; });
        setVisibleStations(initialState);
    }
    const availableStations = stations.filter(station => logData.some(entry => entry.stations?.some(s => s.mac === station.mac && s.rssi != null)));
    const calculateSnrMargin = (rssi: number, noise: number) => rssi - noise;
    const toggleStationVisibility = (mac: string) => {
        setVisibleStations(prev => ({ ...prev, [mac]: !prev[mac] }));
    };
    const getAvgRssi = (mac: string) => {
        const values = logData.flatMap(entry => entry.stations?.filter(s => s.mac === mac) || []).map(s => s.rssi).filter(v => v != null);
        return values.length > 0 ? (values.reduce((sum, val) => sum + val, 0) / values.length).toFixed(1) : 'N/A';
    };
    const avgNoise = logData.reduce((sum, entry) => sum + entry.noise, 0) / logData.length;
    const containerClass = isExpanded ? "fixed inset-0 bg-gray-900 z-50 overflow-auto" : "bg-gray-900 p-4 rounded-lg";
    const chartWrapperClass = isExpanded ? "p-4" : "";
    const chartStyle = {
        transform: `scale(${zoomLevel})`,
        transformOrigin: 'top left',
        width: isExpanded ? `calc(100vw / ${zoomLevel})` : `calc(100% / ${zoomLevel})`,
        height: isExpanded ? `calc(100vh / ${zoomLevel})` : '20rem'
    };
    return (
        <div className={containerClass}>
            <div className="flex flex-col space-y-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-semibold text-white">RF Signal Analysis</h3>
                        <p className="text-xs text-gray-400">Signal strength vs. noise floor with {logData.length} data points</p>
                    </div>
                    {isExpanded && (
                        <button onClick={() => setIsExpanded(false)} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 text-gray-300 z-50">
                            <X size={20} />
                        </button>
                    )}
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setShowMargin(!showMargin)}
                        className={`px-2 py-1 text-xs rounded-md font-medium transition-colors duration-200 ${showMargin
                            ? 'bg-green-500 hover:bg-green-600 text-white'
                            : 'bg-gray-300 hover:bg-gray-400 text-black'
                            }`}
                    >
                        {showMargin ? 'Hide SNR Margin' : 'Show SNR Margin'}
                    </button>

                    <button onClick={() => setTimeRange(timeRange === 'all' ? 'recent' : 'all')} className={`px-3 py-1 text-xs rounded-md font-medium transition-colors duration-200 ${timeRange === 'recent' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-blue-700 hover:bg-blue-600 text-white'}`}>
                        {timeRange === 'recent' ? 'Showing Recent' : 'Show All Data'}
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {availableStations.map((station, index) => (
                        <button key={station.mac} onClick={() => toggleStationVisibility(station.mac)} className={`flex items-center px-2 py-1 rounded-md text-xs ${visibleStations[station.mac] ? `bg-opacity-20 border` : 'bg-gray-800'}`} style={{ borderColor: visibleStations[station.mac] ? getStationColor(index) : 'transparent' }}>
                            <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: getStationColor(index) }}></div>
                            <span className={visibleStations[station.mac] ? 'text-white' : 'text-gray-400'}>
                                {formatMacAddress(station.mac)} ({getAvgRssi(station.mac)} dBm)
                            </span>
                        </button>
                    ))}
                </div>
                <div className={`relative ${chartWrapperClass}`}>
                    <div ref={chartContainerRef} style={chartStyle}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={filteredData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                <XAxis dataKey="timestamp" type="number" domain={['auto', 'auto']} tickFormatter={formatTimeAxis} stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                                <YAxis domain={[-100, 0]} stroke="#9CA3AF" label={{ value: 'Signal Strength (dBm)', angle: -90, position: 'insideLeft' }} ticks={[-100, -90, -80, -70, -60, -50, -40, -30, -20, -10, 0]} />
                                {showMargin && (
                                    <>
                                        <ReferenceArea y1={avgNoise} y2={avgNoise + 15} fill="#6B21A8" fillOpacity={0.1} />
                                        <ReferenceArea y1={avgNoise + 15} y2={avgNoise + 25} fill="#1D4ED8" fillOpacity={0.1} />
                                        <ReferenceArea y1={avgNoise + 25} y2={0} fill="#065F46" fillOpacity={0.1} />
                                        <ReferenceLine y={avgNoise + 15} stroke="#A78BFA" strokeDasharray="3 3">
                                            <Label value="15dB SNR" position="insideBottomRight" fill="#A78BFA" />
                                        </ReferenceLine>
                                        <ReferenceLine y={avgNoise + 25} stroke="#60A5FA" strokeDasharray="3 3">
                                            <Label value="25dB SNR" position="insideBottomRight" fill="#60A5FA" />
                                        </ReferenceLine>
                                    </>
                                )}
                                <Tooltip
                                    labelFormatter={(label) => `Time: ${formatTimestamp(label)}`}
                                    formatter={(value: any, name: string, props: any) => {
                                        if (name === 'Noise Floor') {
                                            return [Math.round(Number(value) * 10) / 10 + ' dBm', name];
                                        }
                                        const entry = filteredData[props.payload.index];
                                        if (!entry) return [value, name];
                                        const noiseValue = entry.noise ?? -100;
                                        const snr = calculateSnrMargin(Number(value), noiseValue);
                                        let snrQuality = '';
                                        if (snr > 25) snrQuality = '(Excellent)';
                                        else if (snr > 15) snrQuality = '(Good)';
                                        else if (snr > 10) snrQuality = '(Fair)';
                                        else snrQuality = '(Poor)';
                                        return [
                                            <>
                                                <span>{Math.round(Number(value) * 10) / 10} dBm</span>
                                                <br />
                                                <span className="text-xs">SNR: {Math.round(snr)} dB {snrQuality}</span>
                                            </>,
                                            name
                                        ];
                                    }}
                                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '0.5rem', color: '#F3F4F6' }}
                                />
                                <Legend
                                    wrapperStyle={{ fontSize: '0.65rem', lineHeight: '1.2', color: '#F3F4F6' }}
                                />
                                {availableStations.map((station, index) => (
                                    visibleStations[station.mac] && (
                                        <Line
                                            key={station.mac}
                                            type="monotone"
                                            dataKey={(dataPoint) => {
                                                const stationData = (dataPoint as LogEntry).stations?.find(s => s.mac === station.mac);
                                                return stationData ? stationData.rssi : null;
                                            }}
                                            name={`RSSI ${formatMacAddress(station.mac)}`}
                                            stroke={getStationColor(index)}
                                            dot={false}
                                            strokeWidth={2}
                                            connectNulls={true}
                                            activeDot={{ r: 6 }}
                                        />
                                    )
                                ))}
                                <Line
                                    type="monotone"
                                    dataKey="noise"
                                    name="Noise Floor"
                                    stroke="#EF4444"
                                    strokeWidth={2.5}
                                    dot={false}
                                    connectNulls={true}
                                    filter="url(#noiseGlow)"
                                    isAnimationActive={true}
                                    animationDuration={1000}
                                    animationEasing="ease-in-out"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                </div>
                <div className="flex justify-end gap-2">
                    <button onClick={handleZoomOut} className="p-1.5 bg-gray-800 rounded-md hover:bg-gray-700 text-gray-300 z-50" disabled={zoomLevel <= 1}>
                        <ZoomOut size={16} />
                    </button>
                    <button onClick={handleZoomIn} className="p-1.5 bg-gray-800 rounded-md hover:bg-gray-700 text-gray-300 z-50" disabled={zoomLevel >= 2.5}>
                        <ZoomIn size={16} />
                    </button>
                    <button onClick={toggleFullscreen} className="p-1.5 bg-gray-800 rounded-md hover:bg-gray-700 text-gray-300 z-50">
                        {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default RFSignalAnalysisChart;
