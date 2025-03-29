import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Minimize2, X, Activity, Signal, Radio, Check, Square } from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';

interface MetricConfig {
    name: string;
    color: string;
    unit: string;
    axis: 'left' | 'right';
    type?: string;
    stationMetric?: boolean;
    fill?: boolean;
    enabledByDefault?: boolean;
}

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
    [key: string]: any;
}

interface LogEntry {
    timestamp: number;
    localtime?: number;
    noise: string | number;
    activity: number | any;
    channel: number;
    frequency: number;
    channelWidth: string | number;
    lnaStatus: string;
    stations: Station[];
    [key: string]: any;
}

interface RFSignalProps {
    logData: LogEntry[];
}

const RFSignalAnalysisChart = ({ logData }: RFSignalProps) => {
    const [activeTab, setActiveTab] = useState('all');
    const [isExpanded, setIsExpanded] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [showEvents, setShowEvents] = useState(false);
    const [selectedTimeframe, setSelectedTimeframe] = useState('all');
    const [visibleStations, setVisibleStations] = useState<Record<string, boolean>>({});
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const [isMobile, setIsMobile] = useState(false);

    // Define metric configurations with consistent colors that work in both themes
    const METRICS: Record<string, MetricConfig> = {
        rssi: { name: "RSSI", color: "#3B82F6", unit: "dBm", axis: "left", stationMetric: true, enabledByDefault: true },
        noise: { name: "Noise Floor", color: "#EF4444", unit: "dBm", axis: "left", enabledByDefault: true },
        channel: { name: "Channel", color: "#8B5CF6", unit: "", axis: "right", type: "step" },
        frequency: { name: "Frequency", color: "#F59E0B", unit: "MHz", axis: "right", type: "step" },
        channelWidth: { name: "Bandwidth", color: "#EC4899", unit: "MHz", axis: "right", type: "step" },
        lnaStatus: { name: "LNA Status", color: "#6366F1", unit: "", axis: "right", type: "step" },
        activity: { name: "Channel Activity", color: "#14B8A6", unit: "%", axis: "right", fill: true },
        pl_ratio: { name: "Packet Loss", color: "#F97316", unit: "%", axis: "right", stationMetric: true },
        tx_retries: { name: "TX Retries", color: "#FB7185", unit: "", axis: "right", stationMetric: true },
        tx_failed: { name: "TX Failed", color: "#F43F5E", unit: "", axis: "right", stationMetric: true },
        mcs: { name: "MCS Index", color: "#0EA5E9", unit: "", axis: "right", type: "step", stationMetric: true }
    };

    const TAB_METRICS = {
        signal: ['rssi', 'noise'],
        radio: ['channel', 'frequency', 'channelWidth', 'lnaStatus'],
        performance: ['activity', 'pl_ratio', 'tx_retries', 'tx_failed', 'mcs'],
        all: Object.keys(METRICS)
    };

    const [metricChanges, setMetricChanges] = useState<{
        timestamp: number;
        metric: string;
        from: any;
        to: any;
    }[]>([]);

    const [visibleMetrics, setVisibleMetrics] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        Object.entries(METRICS).forEach(([key, config]) => {
            initial[key] = !!config.enabledByDefault;
        });
        return initial;
    });

    const [allMetricsSelected, setAllMetricsSelected] = useState<Record<string, boolean>>({
        signal: true,
        radio: false,
        performance: false,
        all: false
    });

    useEffect(() => {
        const metricsForTab = TAB_METRICS[activeTab as keyof typeof TAB_METRICS] || [];
        const allSelected = metricsForTab.every(key => visibleMetrics[key]);

        setAllMetricsSelected(prev => ({
            ...prev,
            [activeTab]: allSelected
        }));
    }, [activeTab, visibleMetrics]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!logData || logData.length === 0) return;

        const stations: Record<string, boolean> = {};
        logData.forEach(entry => {
            if (Array.isArray(entry.stations)) {
                entry.stations.forEach(station => {
                    if (station && station.mac && !visibleStations[station.mac]) {
                        stations[station.mac] = true;
                    }
                });
            }
        });

        if (Object.keys(visibleStations).length === 0 && Object.keys(stations).length > 0) {
            setVisibleStations(stations);
        }

        const changes: { timestamp: number; metric: string; from: any; to: any }[] = [];

        ['channel', 'frequency', 'channelWidth', 'lnaStatus'].forEach(metricKey => {
            for (let i = 1; i < logData.length; i++) {
                if (logData[i - 1] && logData[i]) {
                    const prevValue = logData[i - 1][metricKey];
                    const currentValue = logData[i][metricKey];

                    if (prevValue !== undefined && currentValue !== undefined && prevValue !== currentValue) {
                        changes.push({
                            timestamp: logData[i].timestamp,
                            metric: metricKey,
                            from: prevValue,
                            to: currentValue
                        });
                    }
                }
            }
        });

        changes.sort((a, b) => a.timestamp - b.timestamp);
        setMetricChanges(changes);
    }, [logData, visibleStations]);

    useEffect(() => {
        if (!activeTab) return;

        if (activeTab !== 'signal') {
            const updatedMetrics = { ...visibleMetrics };

            TAB_METRICS[activeTab as keyof typeof TAB_METRICS].forEach(metricKey => {
                updatedMetrics[metricKey] = true;
            });

            setVisibleMetrics(updatedMetrics);

            setAllMetricsSelected(prev => ({
                ...prev,
                [activeTab]: true
            }));
        }
    }, [activeTab]);

    const processedData = useMemo(() => {
        if (!logData || !Array.isArray(logData) || logData.length === 0) return [];

        let filteredData = [...logData];

        if (selectedTimeframe === 'recent') {
            filteredData = filteredData.slice(-30);
        } else if (selectedTimeframe === 'last-hour') {
            const oneHourAgo = filteredData[filteredData.length - 1].timestamp - 3600;
            filteredData = filteredData.filter(entry => entry.timestamp >= oneHourAgo);
        }

        return filteredData.map(entry => {
            const processed = { ...entry };

            if (typeof processed.activity === 'object') {
                processed.activity = 0;
            } else if (typeof processed.activity === 'string') {
                processed.activity = parseFloat(processed.activity) || 0;
            }

            if (typeof processed.noise === 'string') {
                processed.noise = parseFloat(processed.noise) || -100;
            } else if (processed.noise === null || processed.noise === undefined) {
                processed.noise = -100;
            }

            // Always convert channelWidth of "0" to 20 MHz as per specification
            if (processed.channelWidth === "0" || processed.channelWidth === 0) {
                processed.channelWidth_display = 20;
            } else {
                processed.channelWidth_display = processed.channelWidth ?
                    parseInt(String(processed.channelWidth), 10) || 20 : 20; // Default to 20MHz if invalid value
            }

            processed.lnaStatus_display = processed.lnaStatus === "1" ? 1 : 0;

            return processed;
        });
    }, [logData, selectedTimeframe]);

    const getVisibleMetricsForTab = () => {
        const metricsForTab = TAB_METRICS[activeTab as keyof typeof TAB_METRICS] || [];

        const result: Record<string, any> = {};
        Object.entries(METRICS).forEach(([key, config]) => {
            if (visibleMetrics[key] && (metricsForTab.includes(key) || activeTab === 'all')) {
                result[key] = config;
            }
        });

        return result;
    };

    const visibleMetricsForTab = getVisibleMetricsForTab();

    const formatMacAddress = (mac: string): string => {
        if (!mac) return '';
        return mac.slice(-8).toUpperCase();
    };

    const formatTimeAxis = (timestamp: number): string => {
        if (!timestamp) return '';
        const date = new Date(timestamp * 1000);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatTimestamp = (timestamp: number): string => {
        if (!timestamp) return '';
        const date = new Date(timestamp * 1000);
        return date.toLocaleString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const toggleMetric = (metricKey: string) => {
        setVisibleMetrics(prev => ({
            ...prev,
            [metricKey]: !prev[metricKey]
        }));
    };

    const toggleAllMetricsInTab = () => {
        const metricsForTab = TAB_METRICS[activeTab as keyof typeof TAB_METRICS] || [];
        const newState = !allMetricsSelected[activeTab];

        const updatedVisibleMetrics = { ...visibleMetrics };
        metricsForTab.forEach(metricKey => {
            updatedVisibleMetrics[metricKey] = newState;
        });

        setVisibleMetrics(updatedVisibleMetrics);
        setAllMetricsSelected(prev => ({
            ...prev,
            [activeTab]: newState
        }));
    };

    const toggleStationVisibility = (mac: string) => {
        setVisibleStations(prev => ({
            ...prev,
            [mac]: !prev[mac]
        }));
    };

    const toggleFullscreen = () => setIsExpanded(!isExpanded);
    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 2.5));
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 1));

    const getAxisDomains = () => {
        let leftDomain: [number, number] = [-100, -50];
        let rightDomain: [number, number] = [0, 100];

        if (activeTab === 'radio') {
            rightDomain = [0, 200];
        }

        return { leftDomain, rightDomain };
    };

    const { leftDomain, rightDomain } = getAxisDomains();

    const availableStations = useMemo(() => {
        if (!logData || !Array.isArray(logData) || logData.length === 0) return [];

        const uniqueStations: Station[] = [];
        const macAddresses = new Set<string>();

        logData.forEach(entry => {
            if (Array.isArray(entry.stations)) {
                entry.stations.forEach(station => {
                    if (station && station.mac && !macAddresses.has(station.mac)) {
                        macAddresses.add(station.mac);
                        uniqueStations.push(station);
                    }
                });
            }
        });

        return uniqueStations;
    }, [logData]);

    const CustomTooltip = ({ active, payload, label }: { active?: boolean, payload?: any[], label?: any }) => {
        if (!active || !payload || !Array.isArray(payload) || payload.length === 0) return null;

        const timestamp = formatTimestamp(label);
        const nearbyEvents = showEvents ?
            metricChanges.filter(change => Math.abs(change.timestamp - label) < 5) : [];

        return (
            <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 shadow-lg max-w-md text-gray-300 light-mode:bg-white light-mode:border-gray-200 light-mode:text-gray-800">
                <p className="text-gray-300 font-medium mb-2 light-mode:text-gray-700">{timestamp}</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-2">
                    {payload.map((p, idx) => {
                        if (p.value === null || p.value === undefined) return null;

                        let displayValue = p.value;
                        if (typeof displayValue === 'object') {
                            displayValue = Object.keys(displayValue).length === 0
                                ? null
                                : JSON.stringify(displayValue);
                            if (displayValue === null) return null;
                        }

                        if (p.name === "LNA Status") {
                            displayValue = p.value === 1 || p.value === "1" ? "ON" : "OFF";
                        } else if (p.name === "Bandwidth" && (p.value === 0 || p.value === "0")) {
                            displayValue = "20"; // Show 0 bandwidth as 20MHz
                        } else if (typeof p.value === 'number') {
                            displayValue = p.value.toFixed(1);
                        }

                        return (
                            <React.Fragment key={idx}>
                                <span className="text-gray-400 light-mode:text-gray-600">{p.name}:</span>
                                <span className="text-white font-mono light-mode:text-gray-800" style={{ color: p.stroke || p.fill || (document.body.classList.contains('light-mode') ? '#1f2937' : '#fff') }}>
                                    {displayValue} {p.unit || ''}
                                </span>
                            </React.Fragment>
                        );
                    })}
                </div>
                {nearbyEvents.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-700 light-mode:border-gray-200">
                        <p className="text-yellow-300 text-xs mb-1 light-mode:text-amber-600">Configuration Changes:</p>
                        {nearbyEvents.map((event, idx) => {
                            let fromValue = event.from;
                            let toValue = event.to;

                            if (event.metric === "lnaStatus") {
                                fromValue = event.from === "1" ? "ON" : "OFF";
                                toValue = event.to === "1" ? "ON" : "OFF";
                            } else if (event.metric === "channelWidth") {
                                // Convert 0 to 20 MHz for channel width
                                fromValue = event.from === "0" || event.from === 0 ? "20" : event.from;
                                toValue = event.to === "0" || event.to === 0 ? "20" : event.to;
                            }
                            return (
                                <div key={idx} className="text-xs text-gray-300 light-mode:text-gray-600">
                                    {event.metric}: {fromValue} → {toValue}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    // Define consistent container classes for dark mode (default) and light mode
    const containerClass = isExpanded
        ? "fixed inset-0 bg-gray-900 z-50 overflow-auto p-4 light-mode:bg-gray-100"
        : "bg-gray-900 rounded-lg overflow-hidden p-4 light-mode:bg-white light-mode:shadow-md";

    const chartStyle = {
        transform: `scale(${zoomLevel})`,
        transformOrigin: 'top left',
        width: isExpanded ? `calc(100vw / ${zoomLevel})` : `calc(100% / ${zoomLevel})`,
        height: isExpanded ? `calc(70vh / ${zoomLevel})` : `20rem`
    };

    if (!logData || !Array.isArray(logData) || logData.length === 0) {
        return <div className="text-center p-6 text-gray-400 light-mode:text-gray-500">No data available for RF signal analysis</div>;
    }

    return (
        <div className={containerClass}>
            <div className="flex flex-col space-y-4">
                {/* Header with title */}
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-medium text-white flex items-center gap-2 light-mode:text-gray-800">
                            <Signal className="w-5 h-5 text-blue-500" />
                            RF Signal Analysis
                        </h3>
                        <p className="text-xs text-gray-400 light-mode:text-gray-500">
                            {processedData.length} data points • {Math.round((processedData[processedData.length - 1]?.timestamp - processedData[0]?.timestamp) / 60)} minutes
                        </p>
                    </div>

                    {isExpanded && (
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 text-gray-300 light-mode:bg-gray-100 light-mode:hover:bg-gray-200 light-mode:text-gray-600"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Tab navigation */}
                <div className="flex mb-2 mx-1 light-mode:border-b light-mode:border-gray-200">
                    <button
                        onClick={() => setActiveTab('signal')}
                        className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${activeTab === 'signal'
                            ? 'bg-blue-600 text-white light-mode:bg-blue-500 light-mode:text-white'
                            : 'text-gray-300 hover:bg-gray-800/50 light-mode:text-gray-600 light-mode:hover:bg-gray-100'}`}
                    >
                        Signal Quality
                    </button>
                    <button
                        onClick={() => setActiveTab('radio')}
                        className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${activeTab === 'radio'
                            ? 'bg-purple-600 text-white light-mode:bg-purple-500 light-mode:text-white'
                            : 'text-gray-300 hover:bg-gray-800/50 light-mode:text-gray-600 light-mode:hover:bg-gray-100'}`}
                    >
                        Radio Config
                    </button>
                    <button
                        onClick={() => setActiveTab('performance')}
                        className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${activeTab === 'performance'
                            ? 'bg-green-600 text-white light-mode:bg-green-500 light-mode:text-white'
                            : 'text-gray-300 hover:bg-gray-800/50 light-mode:text-gray-600 light-mode:hover:bg-gray-100'}`}
                    >
                        Performance
                    </button>
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${activeTab === 'all'
                            ? 'bg-amber-500 text-white light-mode:bg-amber-500 light-mode:text-white'
                            : 'text-gray-300 hover:bg-gray-800/50 light-mode:text-gray-600 light-mode:hover:bg-gray-100'}`}
                    >
                        All Metrics
                    </button>
                </div>

                {/* Control panels */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        {/* Metrics panel */}
                        <div className="bg-gray-800 p-4 rounded-lg shadow-md border border-gray-700 light-mode:bg-white light-mode:border-gray-200">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="text-sm font-medium text-gray-300 light-mode:text-gray-700">Metrics</h4>
                                <button
                                    onClick={toggleAllMetricsInTab}
                                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs bg-blue-500/80 hover:bg-blue-600/90 text-white light-mode:bg-blue-500 light-mode:hover:bg-blue-600 transition-colors"
                                >
                                    {allMetricsSelected[activeTab] ? (
                                        <Check className="w-3.5 h-3.5 text-white" />
                                    ) : (
                                        <Square className="w-3.5 h-3.5 text-white" />
                                    )}
                                    <span className="text-white font-medium">{allMetricsSelected[activeTab] ? 'Uncheck All' : 'Check All'}</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {TAB_METRICS[activeTab as keyof typeof TAB_METRICS].map(key => {
                                    const metric = METRICS[key as keyof typeof METRICS];
                                    if (!metric) return null;

                                    return (
                                        <button
                                            key={key}
                                            onClick={() => toggleMetric(key)}
                                            className={`flex items-center justify-between p-2.5 rounded-md text-xs transition-all duration-200 ${visibleMetrics[key]
                                                ? `bg-teal-100/20 border border-teal-500 text-white font-medium shadow-sm light-mode:bg-teal-100 light-mode:text-teal-800`
                                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600 light-mode:bg-white light-mode:text-gray-700 light-mode:border-gray-300 light-mode:hover:bg-gray-100'
                                                }`}
                                        >
                                            <div className="flex items-center">
                                                <div className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: metric.color }}></div>
                                                <span className="font-medium">{metric.name}</span>
                                            </div>
                                            <span className="text-xs text-gray-400 light-mode:text-gray-500 ml-1">{metric.unit}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col space-y-3">
                        {/* Time Range panel */}
                        <div className="bg-gray-800 p-3 rounded-lg shadow-md border border-gray-700 light-mode:bg-white light-mode:border-gray-200">
                            <h4 className="text-sm font-medium text-gray-300 light-mode:text-gray-700 mb-2">Time Range</h4>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setSelectedTimeframe('all')}
                                    style={{ color: 'white' }}
                                    className={`px-3 py-1 text-xs rounded-md font-medium ${selectedTimeframe === 'all'
                                        ? 'bg-teal-600'
                                        : 'bg-gray-700 hover:bg-gray-600'}`}
                                >
                                    All Data
                                </button>

                                <button
                                    onClick={() => setSelectedTimeframe('recent')}
                                    style={{ color: 'white' }}
                                    className={`px-3 py-1 text-xs rounded-md font-medium ${selectedTimeframe === 'recent'
                                        ? 'bg-teal-600'
                                        : 'bg-gray-700 hover:bg-gray-600'}`}
                                >
                                    Recent
                                </button>
                            </div>
                        </div>

                        {/* Event Markers panel with FIXED BUTTON */}
                        <div className="bg-gray-800 p-3 rounded-lg shadow-md border border-gray-700 light-mode:bg-white light-mode:border-gray-200">
                            <div className="flex justify-between items-center">
                                <h4 className="text-sm font-medium text-gray-300 light-mode:text-gray-700">Event Markers (<i>Sense</i>)™</h4>
                                <button
                                    onClick={() => setShowEvents(!showEvents)}
                                    style={{ color: 'white' }}

                                    className={`px-3 py-1 text-xs rounded-md font-medium ${showEvents
                                        ? 'bg-amber-500'
                                        : 'bg-gray-700 hover:bg-gray-600'}`}
                                >
                                    {showEvents ? 'Hide' : 'Show'}
                                </button>
                            </div>
                        </div>

                        {/* Stations panel */}
                        {availableStations.length > 0 && (
                            <div className="bg-gray-800 p-3 rounded-lg shadow-md border border-gray-700 light-mode:bg-white light-mode:border-gray-200">
                                <h4 className="text-sm font-medium text-gray-300 light-mode:text-gray-700 mb-2">Stations</h4>
                                <div className="flex flex-wrap gap-2">
                                    {availableStations.map(station => (
                                        <button
                                            key={station.mac}
                                            onClick={() => toggleStationVisibility(station.mac)}
                                            className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${visibleStations[station.mac]
                                                ? `bg-teal-600/80 border border-teal-500 text-white font-medium shadow-sm light-mode:bg-teal-100 light-mode:text-teal-800 light-mode:border-teal-500`
                                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600 light-mode:bg-white light-mode:text-gray-700 light-mode:border-gray-300 light-mode:hover:bg-gray-100'
                                                }`}
                                        >
                                            <span className={`w-2 h-2 rounded-full ${visibleStations[station.mac] ? 'bg-blue-500' : 'bg-gray-500 light-mode:bg-gray-400'}`}></span>
                                            {formatMacAddress(station.mac)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Chart container */}
                <div className="relative bg-gray-800 p-2 rounded-lg shadow-md border border-gray-700 light-mode:bg-white light-mode:border-gray-200" ref={chartContainerRef}>
                    <div style={chartStyle}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={processedData} margin={{ top: 10, right: 40, left: 10, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" className="light-mode:stroke-gray-200" />

                                <XAxis
                                    dataKey="timestamp"
                                    type="number"
                                    domain={['auto', 'auto']}
                                    tickFormatter={formatTimeAxis}
                                    stroke="#9CA3AF"
                                    tick={{ fontSize: 11 }}
                                    className="light-mode:text-gray-600 light-mode:stroke-gray-400"
                                />

                                <YAxis
                                    yAxisId="left"
                                    orientation="left"
                                    domain={leftDomain}
                                    stroke="#9CA3AF"
                                    tick={{ fontSize: 11 }}
                                    className="light-mode:text-gray-600 light-mode:stroke-gray-400"
                                    label={{
                                        value: activeTab === 'signal' ? 'Signal (dBm)' : '',
                                        angle: -90,
                                        position: 'insideLeft',
                                        style: { fill: '#9CA3AF', fontSize: 11 }
                                    }}
                                />

                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    domain={rightDomain}
                                    stroke="#9CA3AF"
                                    tick={{ fontSize: 11 }}
                                    className="light-mode:text-gray-600 light-mode:stroke-gray-400"
                                    label={{
                                        value: activeTab === 'performance' ? 'Performance' :
                                            activeTab === 'radio' ? 'Configuration' : '',
                                        angle: 90,
                                        position: 'insideRight',
                                        style: { fill: '#9CA3AF', fontSize: 11 }
                                    }}
                                />

                                <Tooltip content={<CustomTooltip />} />
                                <Legend
                                    verticalAlign="top"
                                    wrapperStyle={{ fontSize: 11, paddingBottom: 10 }}
                                    formatter={(value) => <span className="text-gray-300 light-mode:text-gray-700">{value}</span>}
                                />

                                {showEvents && metricChanges.map((change, index) => {
                                    const metric = METRICS[change.metric as keyof typeof METRICS];
                                    if (!metric) return null;

                                    return (
                                        <ReferenceLine
                                            key={`change-${index}`}
                                            x={change.timestamp}
                                            stroke={metric.color || "#999999"}
                                            strokeDasharray="3 3"
                                            yAxisId="left"
                                        />
                                    );
                                })}

                                {Object.entries(visibleMetricsForTab).map(([key, metric]) => {
                                    if (metric.stationMetric) {
                                        return Object.entries(visibleStations)
                                            .filter(([_, isVisible]) => isVisible)
                                            .map(([mac, isVisible]) => (
                                                <Line
                                                    key={`${mac}-${key}`}
                                                    yAxisId={metric.axis === 'left' ? 'left' : 'right'}
                                                    type={metric.type || "monotone"}
                                                    dataKey={(dataPoint: LogEntry) => {
                                                        if (!Array.isArray(dataPoint.stations)) return null;
                                                        const stationData = dataPoint.stations.find(s => s.mac === mac);
                                                        return stationData ? stationData[key] : null;
                                                    }}
                                                    name={`${metric.name} (${formatMacAddress(mac)})`}
                                                    stroke={metric.color}
                                                    strokeWidth={1.5}
                                                    dot={false}
                                                    activeDot={{ r: 4 }}
                                                    connectNulls={true}
                                                />
                                            ));
                                    }

                                    let dataKey = key;
                                    if (key === 'channelWidth') {
                                        dataKey = 'channelWidth_display';
                                    } else if (key === 'lnaStatus') {
                                        dataKey = 'lnaStatus_display';
                                    }

                                    return (
                                        <Line
                                            key={key}
                                            yAxisId={metric.axis === 'left' ? 'left' : 'right'}
                                            type={metric.type || "monotone"}
                                            dataKey={dataKey}
                                            name={metric.name}
                                            stroke={metric.color}
                                            strokeWidth={1.5}
                                            dot={false}
                                            activeDot={{ r: 4 }}
                                            connectNulls={true}
                                            {...(metric.fill ? { fillOpacity: 0.2, fill: metric.color } : {})}
                                        />
                                    );
                                })}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Chart controls */}
                    <div className="absolute bottom-2 right-2 flex gap-1">
                        <button
                            onClick={handleZoomOut}
                            className="p-1.5 bg-gray-700 rounded-md hover:bg-gray-600 text-gray-300 disabled:opacity-50 light-mode:bg-gray-200 light-mode:hover:bg-gray-300 light-mode:text-gray-700"
                            disabled={zoomLevel <= 1}
                        >
                            <ZoomOut size={16} />
                        </button>
                        <button
                            onClick={handleZoomIn}
                            className="p-1.5 bg-gray-700 rounded-md hover:bg-gray-600 text-gray-300 disabled:opacity-50 light-mode:bg-gray-200 light-mode:hover:bg-gray-300 light-mode:text-gray-700"
                            disabled={zoomLevel >= 2.5}
                        >
                            <ZoomIn size={16} />
                        </button>
                        <button
                            onClick={toggleFullscreen}
                            className="p-1.5 bg-gray-700 rounded-md hover:bg-gray-600 text-gray-300 light-mode:bg-gray-200 light-mode:hover:bg-gray-300 light-mode:text-gray-700"
                        >
                            {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                        </button>
                    </div>
                </div>

                {/* Metric information panel */}
                <div className="bg-gray-800 p-3 rounded-lg shadow-md border border-gray-700 light-mode:bg-white light-mode:border-gray-200">
                    <h4 className="text-sm font-medium text-gray-300 mb-2 light-mode:text-gray-700">Metric Information</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-2 text-xs">
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: METRICS.rssi.color }}></div>
                            <span className="text-gray-300 light-mode:text-gray-600">RSSI: Signal strength</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: METRICS.noise.color }}></div>
                            <span className="text-gray-300 light-mode:text-gray-600">Noise: Background interference</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: METRICS.channel.color }}></div>
                            <span className="text-gray-300 light-mode:text-gray-600">Channel: Operating channel</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: METRICS.frequency.color }}></div>
                            <span className="text-gray-300 light-mode:text-gray-600">Frequency: MHz</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: METRICS.channelWidth.color }}></div>
                            <span className="text-gray-300 light-mode:text-gray-600">Bandwidth: Channel width</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: METRICS.activity.color }}></div>
                            <span className="text-gray-300 light-mode:text-gray-600">Activity: Channel utilization</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile fullscreen button */}
            {isMobile && (
                <div className="fixed bottom-4 right-4 z-50">
                    <button
                        onClick={toggleFullscreen}
                        className="p-3 bg-blue-600 rounded-full shadow-lg text-white light-mode:bg-blue-500"
                    >
                        {isExpanded ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                    </button>
                </div>
            )}
        </div>
    );
}

export default RFSignalAnalysisChart;