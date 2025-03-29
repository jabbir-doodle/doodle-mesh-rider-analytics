'use client';
import React, { useState, useEffect, useRef } from 'react';
import { formatTimestamp, formatTimeAxis, formatRelativeTime, formatDateCompact } from '@/utils/timeFormatters';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Legend,
} from 'recharts';
import {
  Activity,
  Signal,
  Cpu,
  Database,
  Upload,
  Server,
  Radio,
  Network,
  Menu,
  X,
  Info,
  Clock
} from 'lucide-react';
import { MetricCard } from '../shared/MetricCard';
import StationDetails from './StationDetails';
import OperationsDetails from './OperationsDetails';
import { parseLogFile, MeshStat } from '@/utils/logParser';
import RFLogAnalyzer from './RFLogAnalyzer';
import FileUpload from './LogFileUpload';
import { StationStat } from '@/types';
import MeshDetails from './MeshDetails';
import { formatMacAddress, macToIpAddress } from '@/utils/networkHelpers';
import ParticleBackground from '../ParticleBackground';
import SignalHeatmap from './SignalHeatmap';
import RFSignalAnalysisChart from './RFSignalAnalysisChart';

interface Props {
  initialData?: string;
  onBack?: () => void; // Make this optional
}

const LinkStatusAnalyzer: React.FC<Props> = ({ initialData, onBack }) => {
  const [logData, setLogData] = useState(() => initialData ? parseLogFile(initialData) : []);
  const [selectedStation, setSelectedStation] = useState<StationStat | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMeshNode, setSelectedMeshNode] = useState<MeshStat | null>(null);
  const [showCombinedMetrics, setShowCombinedMetrics] = useState(false);
  const [showRssiNoiseChart, setShowRssiNoiseChart] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [showRfDiagnostics, setShowRfDiagnostics] = useState(false);
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);

    return () => {
      window.removeEventListener('resize', checkDevice);
    };
  }, []);

  useEffect(() => {
    const handler = () => {
      if (chartContainerRef.current) {
        const charts = chartContainerRef.current.querySelectorAll('.recharts-responsive-container');
        charts.forEach(chart => {
          if (chart instanceof HTMLElement) {
            chart.style.minHeight = "300px";
          }
        });
      }
    };

    window.addEventListener('resize', handler);
    handler(); // Call immediately to set initial state

    return () => {
      window.removeEventListener('resize', handler);
    };
  }, [showRssiNoiseChart, selectedMetric, showCombinedMetrics]);

  const handleFileLoaded = (content: string) => {
    try {
      setIsLoading(true);
      const parsedData = parseLogFile(content);
      setLogData(parsedData);
    } catch (error) {
      console.error('Error parsing log file:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleRfDiagnosticsClick = () => {
    setShowRfDiagnostics(true);
    setShowRssiNoiseChart(false);
    setShowCombinedMetrics(false);
    setSelectedMetric('');
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  const handleMetricClick = (metricType: string) => {
    setSelectedMetric(metricType);
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  const getMeshNodeTimeSeriesData = (address: string) => {
    return logData
      .map((entry) => {
        const meshData = entry.meshNodes?.find((n) => n.orig_address === address);
        return meshData ? {
          timestamp: entry.timestamp || entry.localtime,
          ...meshData,
          quality: (meshData.tq / 255) * 100  // Normalize quality to percentage
        } : null;
      })
      .filter((data): data is NonNullable<typeof data> => data !== null)
      .sort((a, b) => a.timestamp - b.timestamp); // Sort by timestamp to ensure chronological order
  };

  const getStationTimeSeriesData = (mac: string) => {
    return logData
      .map((entry) => {
        const stationData = entry.stations.find((s) => s.mac === mac);
        return stationData
          ? {
            timestamp: entry.timestamp,
            ...stationData,
            rssi: stationData.rssi !== undefined ? stationData.rssi : 0,
            rssi_ant: Array.isArray(stationData.rssi_ant)
              ? stationData.rssi_ant.map((ant) => ant !== undefined ? ant : 0)
              : [0, 0],
            pl_ratio: stationData.pl_ratio !== undefined ? stationData.pl_ratio : 0,
            inactive: stationData.inactive !== undefined ? stationData.inactive : 0,
            noise: entry.noise,
            parent: entry
          }
          : null;
      })
      .filter((data) => data !== null);
  };



  const latestData = logData.find((entry) => entry.stations && entry.stations.length > 0) || logData[logData.length - 1];

  const CombinedMetricsChart = () => (
    <div className="bg-gray-900 p-4 md:p-6 rounded-lg col-span-1 md:col-span-2">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base md:text-lg font-semibold text-white">Combined RF Metrics</h3>
      </div>
      <div className="h-64 md:h-80" ref={chartContainerRef}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={logData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="timestamp"
              type="number"
              domain={['auto', 'auto']}
              tickFormatter={formatTimeAxis}
              stroke="#9CA3AF"
              tick={{ fontSize: isMobile ? 10 : 12 }}
            />
            {/* Left Y-Axis for RSSI and Noise */}
            <YAxis
              yAxisId="signal"
              orientation="left"
              domain={[-90, -50]}
              stroke="#60A5FA"
              label={{ value: 'dBm', angle: -90, position: 'insideLeft', fontSize: isMobile ? 10 : 12 }}
              tick={{ fontSize: isMobile ? 10 : 12 }}
            />
            {/* Right Y-Axis for Activity and MCS */}
            <YAxis
              yAxisId="activity"
              orientation="right"
              domain={[0, 100]}
              stroke="#34D399"
              label={{ value: '%', angle: 90, position: 'insideRight', fontSize: isMobile ? 10 : 12 }}
              tick={{ fontSize: isMobile ? 10 : 12 }}
            />
            <Tooltip
              labelFormatter={(label) => formatTimestamp(Number(label))}
              contentStyle={{
                backgroundColor: '#1F2937',
                border: 'none',
                borderRadius: '0.5rem',
                color: '#F3F4F6'
              }}
            />
            <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
            {/* Noise Floor Line */}
            <Line
              yAxisId="signal"
              type="monotone"
              dataKey="noise"
              name="Noise Floor"
              stroke="#60A5FA"
              dot={false}
            />
            {/* RSSI Line */}
            <Line
              yAxisId="signal"
              type="monotone"
              dataKey="rssi"
              name="RSSI"
              stroke="#EC4899"
              dot={false}
            />
            {/* MCS Line */}
            <Line
              yAxisId="activity"
              type="monotone"
              dataKey="mcs"
              name="MCS Rate"
              stroke="#F59E0B"
              dot={false}
            />
            {/* Activity Bars */}
            <Bar
              yAxisId="activity"
              dataKey="activity"
              name="Channel Activity"
              fill="#34D399"
              opacity={0.5}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
  <button
    onClick={() => {
      setShowRfDiagnostics(true);
      setShowRssiNoiseChart(false);
      setShowCombinedMetrics(false);
      setSelectedMetric('');
      setIsMobileMenuOpen(false);
    }}
    className="p-4 bg-gray-800 rounded-lg flex items-center gap-2"
  >
    <Radio size={20} className="text-purple-500" />
    <span className="text-white">RF Diagnostics</span>
  </button>

  return (
    <div className="fixed inset-0 bg-gray-950 overflow-auto">
      <ParticleBackground />
      <div className="relative z-10 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Mobile menu toggle */}
          {isMobile && (
            <div className="fixed top-4 right-4 z-50">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="bg-gray-800 p-2 rounded-full text-gray-300 shadow-md"
                style={{ transform: 'translateZ(0)' }}
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          )}

          {/* Mobile sidebar menu */}
          {isMobile && isMobileMenuOpen && (
            <div className="fixed inset-0 bg-gray-900/90 z-40 overflow-auto">
              <div className="p-4 pt-16">
                <div className="grid grid-cols-1 gap-4 mb-6">
                  <button
                    onClick={() => {
                      setShowRssiNoiseChart(true);
                      setShowCombinedMetrics(false);
                      setSelectedMetric('');
                      setIsMobileMenuOpen(false);
                    }}
                    className="p-4 bg-gray-800 rounded-lg flex items-center gap-2"
                  >
                    <Signal size={20} className="text-blue-500" />
                    <span className="text-white">RSSI + Noise Chart</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedMetric('activity');
                      setShowRssiNoiseChart(false);
                      setShowCombinedMetrics(false);
                      setIsMobileMenuOpen(false);
                    }}
                    className="p-4 bg-gray-800 rounded-lg flex items-center gap-2"
                  >
                    <Activity size={20} className="text-green-500" />
                    <span className="text-white">Channel Activity</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedMetric('cpu');
                      setShowRssiNoiseChart(false);
                      setShowCombinedMetrics(false);
                      setIsMobileMenuOpen(false);
                    }}
                    className="p-4 bg-gray-800 rounded-lg flex items-center gap-2"
                  >
                    <Cpu size={20} className="text-purple-500" />
                    <span className="text-white">CPU Load</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedMetric('memory');
                      setShowRssiNoiseChart(false);
                      setShowCombinedMetrics(false);
                      setIsMobileMenuOpen(false);
                    }}
                    className="p-4 bg-gray-800 rounded-lg flex items-center gap-2"
                  >
                    <Database size={20} className="text-red-500" />
                    <span className="text-white">Memory Available</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowCombinedMetrics(true);
                      setShowRssiNoiseChart(false);
                      setSelectedMetric('');
                      setIsMobileMenuOpen(false);
                    }}
                    className="p-4 bg-gray-800 rounded-lg flex items-center gap-2"
                  >
                    <Activity size={20} className="text-indigo-500" />
                    <span className="text-white">Combined Metrics</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowRfDiagnostics(true);
                      setShowRssiNoiseChart(false);
                      setShowCombinedMetrics(false);
                      setSelectedMetric('');
                      setIsMobileMenuOpen(false);
                    }}
                    className="p-4 bg-gray-800 rounded-lg flex items-center gap-2"
                  >
                    <Radio size={20} className="text-purple-500" />
                    <span className="text-white">RF Diagnostics</span>
                  </button>
                  <button
                    onClick={() => {
                      setLogData([]);
                      setIsMobileMenuOpen(false);
                    }}
                    className="p-4 bg-red-900 rounded-lg flex items-center gap-2"
                  >
                    <Upload size={20} className="text-white" />
                    <span className="text-white">Upload New File</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-8">
            {/* Left Side: Logo + Title + Subtitle with proper spacing */}
            <div className="flex items-center w-full">

              <button
                onClick={() => {

                  if (onBack) {
                    onBack();
                  } else {
                    setLogData([]);
                  }
                }}
                className="flex-shrink-0 mr-3 p-1.5 rounded-full bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors focus:outline-none"
                aria-label="Go back to upload screen"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Logo and text container with proper spacing */}
              <div className="flex items-center space-x-2 overflow-hidden">
                <img
                  src="/logo.png"
                  alt="Mesh Rider Logo"
                  className="h-6 w-auto md:h-7 flex-shrink-0"
                />
                <div className="flex flex-col min-w-0">
                  <h1 className="text-white text-base md:text-lg font-bold truncate">
                    <span>Mesh Rider</span>
                    <span className="hidden sm:inline"> Log Viewer</span>
                  </h1>
                  <p className="text-xs text-gray-400 truncate">
                    Analyzing {logData.length} entries
                  </p>
                </div>
              </div>
            </div>

            {/* Right Side: Button - Hidden on mobile (shown in menu) */}
            {!isMobile && (
              <button
                onClick={() => {
                  if (onBack) {
                    onBack();
                  } else {
                    setLogData([]);
                  }
                }}
                className="mt-2 md:mt-0 px-3 py-1.5 text-sm bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 flex-shrink-0"
              >
                Back to Upload
              </button>
            )}
          </div>

          {/* Operations Details Card
          <div className="mb-6 md:mb-8">
            <OperationsDetails
              operChan={latestData.channel}
              operFreq={latestData.frequency}
              chanWidth={Number(latestData.channelWidth)}
              lnaStatus={Number(latestData.lnaStatus)}
              timestamp={String(latestData.localtime)}
            />
          </div> */}
          {/* Performance Metrics Header */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Performance Metrics</h2>
            </div>
          </div>

          {/* Replace the entire MetricCard section with these simple buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <button
              onClick={() => {
                setShowRssiNoiseChart(true);
                setShowCombinedMetrics(false);
                setShowRfDiagnostics(false);
                setSelectedMetric('');
              }}
              className="flex flex-col items-center justify-center p-4 rounded-lg 
               border border-gray-300 dark:border-gray-700
               bg-white dark:bg-gray-800 
               hover:bg-blue-50 dark:hover:bg-blue-900/20
               text-gray-800 dark:text-white"
            >
              <Signal size={24} className="mb-2 text-blue-600" />
              <span>Signal Analysis</span>
            </button>

            <button
              onClick={() => {
                setSelectedMetric('activity');
                setShowRssiNoiseChart(false);
                setShowCombinedMetrics(false);
                setShowRfDiagnostics(false);
              }}
              className="flex flex-col items-center justify-center p-4 rounded-lg 
               border border-gray-300 dark:border-gray-700
               bg-white dark:bg-gray-800 
               hover:bg-green-50 dark:hover:bg-green-900/20
               text-gray-800 dark:text-white"
            >
              <Activity size={24} className="mb-2 text-green-600" />
              <span>Channel Activity</span>
            </button>

            <button
              onClick={() => {
                setSelectedMetric('cpu');
                setShowRssiNoiseChart(false);
                setShowCombinedMetrics(false);
              }}
              className="flex flex-col items-center justify-center p-4 rounded-lg 
               border border-gray-300 dark:border-gray-700
               bg-white dark:bg-gray-800 
               hover:bg-purple-50 dark:hover:bg-purple-900/20
               text-gray-800 dark:text-white"
            >
              <Cpu size={24} className="mb-2 text-purple-600" />
              <span>System Performance</span>
            </button>

            <button
              onClick={handleRfDiagnosticsClick}
              className="flex flex-col items-center justify-center p-4 rounded-lg 
               border border-gray-300 dark:border-gray-700
               bg-white dark:bg-gray-800 
               hover:bg-indigo-50 dark:hover:bg-indigo-900/20
               text-gray-800 dark:text-white"
            >
              <Radio size={24} className="mb-2 text-indigo-600" />
              <span>RF Diagnostics</span>
            </button>
          </div>
          {/* Show either the combined metrics chart or the individual metric charts */}
          {showCombinedMetrics ? (
            <CombinedMetricsChart />
          ) : showRssiNoiseChart ? (
            <div className="bg-gray-900 p-4 md:p-6 rounded-lg mb-6 md:mb-8">
              <RFSignalAnalysisChart logData={logData} />
            </div>
          ) : showRfDiagnostics ? (
            <div className="bg-gray-900 p-4 md:p-6 rounded-lg mb-6 md:mb-8">
              <RFLogAnalyzer logData={logData} />
            </div>
          ) : (
            <div id="performance-graphs" className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
              {selectedMetric === 'noiseFloor' && (
                <div className="bg-gray-900 p-4 md:p-6 rounded-lg col-span-1 md:col-span-2">
                  <h3 className="text-base md:text-lg font-semibold text-white mb-3 md:mb-4">RF Performance - Noise Floor</h3>
                  <div className="h-64 md:h-80" ref={chartContainerRef}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={logData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="timestamp" type="number" domain={['auto', 'auto']} tickFormatter={formatTimeAxis} stroke="#9CA3AF" tick={{ fontSize: isMobile ? 10 : 12 }} />
                        <YAxis domain={[-90, -50]} stroke="#60A5FA" tickFormatter={(value) => Math.round(value).toString()} tick={{ fontSize: isMobile ? 10 : 12 }} />
                        <Tooltip labelFormatter={(label) => formatTimestamp(Number(label))} contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '0.5rem', color: '#F3F4F6' }} />
                        <Line type="monotone" dataKey="noise" name="Noise Floor" stroke="#60A5FA" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {selectedMetric === 'activity' && (
                <div className="bg-gray-900 p-4 md:p-6 rounded-lg col-span-1 md:col-span-2">
                  <h3 className="text-base md:text-lg font-semibold text-white mb-3 md:mb-4">Channel Utilization</h3>
                  <div className="h-64 md:h-80" ref={chartContainerRef}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={logData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="timestamp" type="number" domain={['auto', 'auto']} tickFormatter={formatTimeAxis} stroke="#9CA3AF" tick={{ fontSize: isMobile ? 10 : 12 }} />
                        <YAxis domain={[0, 100]} stroke="#34D399" tick={{ fontSize: isMobile ? 10 : 12 }} />
                        <Tooltip labelFormatter={(label) => formatTimestamp(Number(label))} contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '0.5rem', color: '#F3F4F6' }} />
                        <Bar dataKey="activity" name="Channel Activity" fill="#34D399" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {selectedMetric === 'cpu' && (
                <div className="bg-gray-900 p-4 md:p-6 rounded-lg col-span-1 md:col-span-2">
                  <h3 className="text-base md:text-lg font-semibold text-white mb-3 md:mb-4">System Performance</h3>
                  <div className="h-64 md:h-80" ref={chartContainerRef}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={logData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="timestamp" type="number" domain={['auto', 'auto']} tickFormatter={formatTimeAxis} stroke="#9CA3AF" tick={{ fontSize: isMobile ? 10 : 12 }} />
                        <YAxis domain={[0, 100]} stroke="#9CA3AF" tick={{ fontSize: isMobile ? 10 : 12 }} />
                        <Tooltip labelFormatter={(label) => formatTimestamp(Number(label))} contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '0.5rem', color: '#F3F4F6' }} />
                        <Line type="monotone" dataKey="cpuLoad" name="CPU Load" stroke="#A78BFA" dot={false} />
                        <Line type="monotone" dataKey="cpuLoad5m" name="CPU Load (5m)" stroke="#EC4899" dot={false} />
                        <Line type="monotone" dataKey="cpuLoad15m" name="CPU Load (15m)" stroke="#F59E0B" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {selectedMetric === 'memory' && (
                <div className="bg-gray-900 p-4 md:p-6 rounded-lg col-span-1 md:col-span-2">
                  <h3 className="text-base md:text-lg font-semibold text-white mb-3 md:mb-4">Memory Usage</h3>
                  <div className="h-64 md:h-80" ref={chartContainerRef}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={logData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="timestamp" type="number" domain={['auto', 'auto']} tickFormatter={formatTimeAxis} stroke="#9CA3AF" tick={{ fontSize: isMobile ? 10 : 12 }} />
                        <YAxis domain={[0, 'auto']} stroke="#9CA3AF" tick={{ fontSize: isMobile ? 10 : 12 }} />
                        <Tooltip labelFormatter={(label) => formatTimestamp(Number(label))} contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '0.5rem', color: '#F3F4F6' }} />
                        <Line type="monotone" dataKey="memory" name="Available Memory" stroke="#F87171" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Network Visualization Section */}
          <div className="mb-6 md:mb-8">
            <div className="bg-gray-900 p-4 md:p-6 rounded-lg">
              {latestData.meshNodes && (
                <div className="relative group">
                  <SignalHeatmap
                    meshStats={logData.flatMap(entry =>
                      entry.meshNodes?.map(node => ({
                        ...node,
                        timestamp: entry.timestamp || entry.localtime
                      })) || []
                    )}
                    timeRange={30} // Last 30 minutes
                    onNodeClick={(address: string) => {
                      const clickedNode = logData.flatMap(entry =>
                        entry.meshNodes?.map(node => ({
                          ...node,
                          timestamp: entry.timestamp || entry.localtime
                        })) || []
                      ).find(n => n.orig_address === address);
                      if (clickedNode) {
                        setSelectedMeshNode(clickedNode);
                        setSelectedStation(null);
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Direct connections section - Responsive grid for mobile */}
          {/* Direct connections section */}
          <div className="bg-gray-900 p-4 md:p-6 rounded-lg">
            <div className="flex justify-between items-center mb-3 md:mb-4">
              <h3 className="text-base md:text-lg font-semibold text-white">
                Direct Connections ({latestData.stations.length})
              </h3>
              <div className="bg-blue-600/20 text-blue-300 px-2 py-1 rounded-md text-xs">
                <Info size={12} className="inline mr-1" />
                Showing snapshot data - click for history
              </div>
            </div>

            <div className="space-y-3 md:space-y-4">
              {latestData.stations.map((station: any) => {
                // Get most recent data for this station across all log entries
                const allStationEntries = logData
                  .filter(entry => entry.stations && entry.stations.some(s => s.mac === station.mac))
                  .sort((a, b) => b.timestamp - a.timestamp); // Sort by newest first

                const latestEntry = allStationEntries[0] || latestData;
                const latestStationData = latestEntry.stations.find((s: any) => s.mac === station.mac) || station;

                // Format timestamp for the latest data
                const timestamp = new Date(latestEntry.timestamp * 1000).toLocaleString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true,
                  day: '2-digit',
                  month: '2-digit',
                  year: '2-digit'
                });

                const signalQuality = latestStationData.rssi > -65 ? 'good' : latestStationData.rssi > -75 ? 'fair' : 'poor';
                const plQuality = latestStationData.pl_ratio < 1 ? 'good' : latestStationData.pl_ratio < 2 ? 'fair' : 'poor';

                return (
                  <div
                    key={latestStationData.mac}
                    className="bg-gray-800 p-3 md:p-4 rounded-lg cursor-pointer hover:bg-gray-750 transition-colors"
                    onClick={() => setSelectedStation(latestStationData)}
                  >
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                      <div>
                        <div className="text-white font-medium flex flex-wrap items-center gap-2">
                          <span className="text-sm md:text-base text-white font-mono">
                            {formatMacAddress(latestStationData.mac)}
                          </span>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${signalQuality === 'good'
                            ? 'bg-green-900/50 text-green-300'
                            : signalQuality === 'fair'
                              ? 'bg-yellow-900/50 text-yellow-300'
                              : 'bg-red-900/50 text-red-300'
                            }`}>
                            {signalQuality.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-400">
                            Last update: {timestamp}
                          </span>
                        </div>
                        <div className="text-xs md:text-sm text-gray-400 mt-1 flex flex-wrap gap-2 md:gap-4">
                          <span>RSSI: {latestStationData.rssi} dBm</span>
                          <span>MCS: {latestStationData.mcs}</span>
                          <span>Inact: {latestStationData.inactive}ms</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Ant1: {latestStationData.rssi_ant?.[0] ?? 'N/A'} dBm, Ant2: {latestStationData.rssi_ant?.[1] ?? 'N/A'} dBm
                        </div>
                      </div>
                      <div className="mt-2 md:mt-0 md:text-right">
                        <div className="text-xs md:text-sm">
                          <span className="text-gray-400">TX: </span>
                          <span className="text-white">{(latestStationData.tx_bytes / 1024).toFixed(2)} KB</span>
                        </div>
                        <div className={`text-xs md:text-sm ${plQuality === 'good' ? 'text-green-400' : plQuality === 'fair' ? 'text-yellow-400' : 'text-red-400'}`}>
                          PL: {latestStationData.pl_ratio !== undefined ? latestStationData.pl_ratio.toFixed(2) : 'N/A'}
                        </div>
                        <div className="text-xs md:text-sm text-gray-400">Retries: {latestStationData.tx_retries}</div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
                      <span>Click for detailed statistics and historical data</span>
                      <span className="bg-gray-700 px-2 py-1 rounded text-gray-300 font-medium">
                        <Clock size={10} className="inline-block mr-1" />
                        Point-in-time data
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Modal components - These appear over everything else */}
          {selectedMeshNode && (
            <MeshDetails
              node={selectedMeshNode as any}
              timeSeriesData={getMeshNodeTimeSeriesData(selectedMeshNode.orig_address) as any}
              localtime={latestData.localtime as number}
              onClose={() => setSelectedMeshNode(null)}
            />
          )}
          {selectedStation && (
            <StationDetails
              station={latestData.stations.find((s: any) => s.mac === selectedStation.mac) || selectedStation}
              timeSeriesData={getStationTimeSeriesData(selectedStation.mac)}
              localtime={latestData.localtime}
              onClose={() => setSelectedStation(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default LinkStatusAnalyzer;