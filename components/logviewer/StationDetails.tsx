'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ComposedChart, LineChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity, Signal, Cpu, Upload, Network, Clock, X, Info } from 'lucide-react';
import { MetricCard } from '../shared/MetricCard';
import { formatMacAddress } from '@/utils/networkHelpers';
import { formatTimestamp, formatTimeAxis, formatRelativeTime } from '@/utils/timeFormatters';

interface StationDetailsProps {
  station: any;
  timeSeriesData: any[];
  localtime: number;
  onClose: () => void;
}

interface ChartProps { data: any[]; }
interface PacketLossChartProps extends ChartProps { displayChoice: string; }

// Adapter functions for Recharts components
const formatTimeAxisForChart = (value: any) => formatTimeAxis(Number(value));
const formatTimestampForTooltip = (label: any) => formatTimestamp(Number(label));

const RssiChart = ({ data, displayChoice }: ChartProps & { displayChoice: string }) => (
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
      <XAxis dataKey="timestamp" type="number" domain={['auto', 'auto']} tickFormatter={formatTimeAxisForChart} stroke="#9CA3AF" tick={{ fontSize: 10 }} />
      <YAxis domain={[-90, -20]} stroke="#9CA3AF" label={{ value: 'RSSI (dBm)', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 10 }} />
      <Tooltip labelFormatter={formatTimestampForTooltip} contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '0.5rem', color: '#F3F4F6', fontSize: '12px' }} />
      {(displayChoice === 'all' || displayChoice === 'rssi') && <Line type="monotone" dataKey="rssi" stroke="#3B82F6" name="Overall RSSI" dot={false} strokeWidth={2} />}
      {(displayChoice === 'all' || displayChoice === 'ant1') && <Line type="monotone" dataKey="rssi_ant[0]" stroke="#60A5FA" name="Antenna 1" dot={false} strokeWidth={2} />}
      {(displayChoice === 'all' || displayChoice === 'ant2') && <Line type="monotone" dataKey="rssi_ant[1]" stroke="#93C5FD" name="Antenna 2" dot={false} strokeWidth={2} />}
    </LineChart>
  </ResponsiveContainer>
);

const PacketLossChart = ({ data, displayChoice }: PacketLossChartProps) => (
  <ResponsiveContainer width="100%" height="100%">
    <ComposedChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
      <XAxis dataKey="timestamp" type="number" domain={['auto', 'auto']} tickFormatter={formatTimeAxisForChart} stroke="#9CA3AF" tick={{ fontSize: 10 }} />
      <YAxis yAxisId="left" domain={[0, (dataMax: number) => Math.max(5, Math.ceil(dataMax))]} stroke="#9CA3AF"
        label={{ value: 'PL Ratio', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF' }, fontSize: 10 }} tick={{ fontSize: 10 }} />
      <YAxis yAxisId="right" orientation="right" domain={[0, (dataMax: number) => Math.max(10, Math.ceil(dataMax))]} stroke="#9CA3AF"
        label={{ value: 'Tx Retries', angle: -90, position: 'insideRight', style: { fill: '#9CA3AF' }, fontSize: 10 }} tick={{ fontSize: 10 }} />
      <Tooltip labelFormatter={formatTimestampForTooltip} contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '0.5rem', color: '#F3F4F6', fontSize: '12px' }} />
      <Legend iconSize={10} wrapperStyle={{ fontSize: 10 }} />
      {(displayChoice === 'all' || displayChoice === 'pl') && <Bar yAxisId="left" dataKey="pl_ratio" barSize={20} fill="#EF4444" name="Packet Loss Ratio" radius={[4, 4, 0, 0]} />}
      {(displayChoice === 'all' || displayChoice === 'retries') && <Line yAxisId="right" type="monotone" dataKey="tx_retries" stroke="#F59E0B" name="Tx Retries" dot={false} strokeWidth={2} />}
    </ComposedChart>
  </ResponsiveContainer>
);

const McsChart = ({ data }: ChartProps) => (
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
      <XAxis dataKey="timestamp" type="number" domain={['auto', 'auto']} tickFormatter={formatTimeAxisForChart} stroke="#9CA3AF" tick={{ fontSize: 10 }} />
      <YAxis domain={[0, 15]} stroke="#9CA3AF" label={{ value: 'MCS Index', angle: -90, position: 'insideLeft', fontSize: 10 }} ticks={[0, 3, 7, 11, 15]} tick={{ fontSize: 10 }} />
      <Tooltip labelFormatter={formatTimestampForTooltip} contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '0.5rem', color: '#F3F4F6', fontSize: '12px' }} />
      <Line type="stepAfter" dataKey="mcs" stroke="#8B5CF6" name="MCS Index" dot={false} strokeWidth={2} />
    </LineChart>
  </ResponsiveContainer>
);

const InactiveChart = ({ data }: ChartProps) => (
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
      <XAxis dataKey="timestamp" type="number" domain={['auto', 'auto']} tickFormatter={formatTimeAxisForChart} stroke="#9CA3AF" tick={{ fontSize: 10 }} />
      <YAxis domain={[0, 'auto']} stroke="#9CA3AF" label={{ value: 'Inactive (ms)', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 10 }} />
      <Tooltip labelFormatter={formatTimestampForTooltip} contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '0.5rem', color: '#F3F4F6', fontSize: '12px' }} />
      <Line type="monotone" dataKey="inactive" stroke="#EC4899" name="Inactive Time" dot={false} strokeWidth={2} />
    </LineChart>
  </ResponsiveContainer>
);

const StationDetails: React.FC<StationDetailsProps> = ({ station, timeSeriesData, localtime, onClose }) => {
  const [selectedMetric, setSelectedMetric] = useState<string>('');
  const [isFullView, setIsFullView] = useState<boolean>(false);
  const [showOverview, setShowOverview] = useState<boolean>(true);
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [selectedGraphs, setSelectedGraphs] = useState<string[]>([]);
  const [isAllMetricsSelected, setIsAllMetricsSelected] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkDevice = () => setIsMobile(window.innerWidth < 768);
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Use our utility function with proper type safety
  const formattedTime = formatTimestamp(localtime, false);

  const meshNodeInfo = timeSeriesData[0]?.meshNodes?.find((node: any) => node.orig_address === station.mac);
  const linkType = meshNodeInfo?.hop_status?.toUpperCase() || 'UNKNOWN';

  const handleOverviewChartClick = (metricType: string) => {
    setSelectedMetric(metricType);
    setShowOverview(false);
  };

  const getGraphTitle = (metric: string) => {
    switch (metric) {
      case 'rssi': return 'RSSI - Signal Strength';
      case 'packetLoss': return 'Packet Loss Ratio';
      case 'mcs': return 'MCS Index';
      case 'inactive': return 'Inactive Time';
      default: return '';
    }
  };

  const handleCompareSelect = (metric: string) => {
    if (metric === 'all') {
      const newAllMetricsState = !isAllMetricsSelected;
      setIsAllMetricsSelected(newAllMetricsState);
      setSelectedGraphs(newAllMetricsState ? ['rssi', 'noise', 'packetLoss', 'mcs', 'inactive'] : []);
    } else {
      if (isAllMetricsSelected) {
        setIsAllMetricsSelected(false);
        setSelectedGraphs([metric]);
      } else {
        if (selectedGraphs.includes(metric)) {
          if (selectedGraphs.length > 1) {
            setSelectedGraphs(selectedGraphs.filter(g => g !== metric));
          }
        } else if (selectedGraphs.length < 5) {
          setSelectedGraphs([...selectedGraphs, metric]);
        }
      }
    }
  };

  const CompareMetricsChart = () => {
    const processedData = timeSeriesData.map(entry => ({
      ...entry,
      noise: entry.noise || (entry.parent?.noise ? parseFloat(entry.parent.noise) : -90),
      timestamp: entry.timestamp
    }));

    return (
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={processedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="timestamp" type="number" domain={['auto', 'auto']} tickFormatter={formatTimeAxisForChart} stroke="#9CA3AF" tick={{ fontSize: isMobile ? 8 : 10 }} />
          <YAxis yAxisId="rssi" orientation="left" domain={[-90, -50]} stroke="#60A5FA"
            label={{ value: 'dBm', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF' }, fontSize: isMobile ? 8 : 10 }} tick={{ fontSize: isMobile ? 8 : 10 }} />
          <YAxis yAxisId="mcs" orientation="right" domain={[0, 'auto']} stroke="#F59E0B"
            label={{ value: 'MCS', angle: 90, position: 'insideRight', style: { fill: '#9CA3AF' }, fontSize: isMobile ? 8 : 10 }} tick={{ fontSize: isMobile ? 8 : 10 }} />
          <Tooltip labelFormatter={formatTimestampForTooltip} contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '0.5rem', color: '#F3F4F6', fontSize: isMobile ? '10px' : '12px' }} />
          <Legend iconSize={isMobile ? 8 : 10} wrapperStyle={{ fontSize: isMobile ? 8 : 10 }} />
          {selectedGraphs.includes('rssi') && <Line yAxisId="rssi" type="monotone" dataKey="rssi" name="RSSI" stroke="#EC4899" dot={false} />}
          {selectedGraphs.includes('noise') && <Line yAxisId="rssi" type="monotone" dataKey="noise" name="Noise Floor" stroke="#60A5FA" dot={false} strokeDasharray="3 3" />}
          {selectedGraphs.includes('mcs') && <Line yAxisId="mcs" type="monotone" dataKey="mcs" name="MCS Index" stroke="#F59E0B" dot={false} />}
          {selectedGraphs.includes('packetLoss') && <Bar yAxisId="mcs" dataKey="pl_ratio" name="Packet Loss" fill="#EF4444" opacity={0.7} />}
          {selectedGraphs.includes('inactive') && <Line yAxisId="mcs" type="monotone" dataKey="inactive" name="Inactive Time" stroke="#8B5CF6" dot={false} />}
        </ComposedChart>
      </ResponsiveContainer>
    );
  };
  useEffect(() => {
    if (compareMode) {
      setIsAllMetricsSelected(true);
      setSelectedGraphs(['rssi', 'noise', 'packetLoss', 'mcs', 'inactive']);
    }
  }, [compareMode]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'f') setIsFullView(prev => !prev);
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  function renderChart(): React.ReactNode {
    switch (selectedMetric) {
      case 'rssi': return <RssiChart data={timeSeriesData} displayChoice="all" />;
      case 'packetLoss': return <PacketLossChart data={timeSeriesData} displayChoice="all" />;
      case 'mcs': return <McsChart data={timeSeriesData} />;
      case 'inactive': return <InactiveChart data={timeSeriesData} />;
      default: return null;
    }
  }

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
        <motion.div className="bg-gray-900 rounded-lg p-3 md:p-6 w-full sm:w-[95%] md:w-[80%] max-h-[90vh] overflow-y-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="bg-blue-500/10 p-1.5 md:p-2 rounded-lg">
                <Network className="h-4 w-4 md:h-5 md:w-5 text-blue-400" />
              </div>
              <div>
                <div className="text-base md:text-xl font-bold text-white">{formatMacAddress(station.mac)}</div>
                <div className="flex flex-wrap items-center text-xs md:text-sm text-gray-400 gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    <Clock size={isMobile ? 12 : 16} />
                    <span>Local Time: {formattedTime}</span>
                  </div>
                  {meshNodeInfo && (
                    <span className="ml-0 md:ml-2">
                      Link Type: <span className={`px-1.5 py-0.5 rounded-full text-xs ${linkType === 'DIRECT' ? 'bg-green-900/50 text-green-300' : 'bg-blue-900/50 text-blue-300'
                        }`}>{linkType}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowOverview(!showOverview);
                  setCompareMode(false);
                  if (!showOverview) setSelectedMetric('');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-2 md:px-4 py-1 md:py-2 rounded-lg text-xs md:text-sm font-medium"
              >
                {showOverview ? 'Hide Overview' : 'Show Overview'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setCompareMode(!compareMode);
                  setShowOverview(false);
                  setSelectedMetric('');
                  setSelectedGraphs(compareMode ? [] : ['rssi', 'noise', 'packetLoss', 'mcs', 'inactive']);
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white px-2 md:px-4 py-1 md:py-2 rounded-lg text-xs md:text-sm font-medium"
              >
                {compareMode ? 'Exit Compare' : 'Compare'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="text-gray-400 hover:text-white p-1 md:p-2"
                aria-label="Close"
              >
                <X size={isMobile ? 16 : 20} />
              </motion.button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 md:gap-4 mb-4">
            {['inactive', 'rssi', 'packetLoss', 'mcs'].map((metricType) => (
              <motion.div key={metricType} whileHover={{ scale: 1.02 }} className="h-full">
                <div
                  className="bg-gray-900 dark:bg-gray-900 light:bg-white border border-gray-800 rounded-lg p-3 md:p-4 flex flex-col justify-between h-20 md:h-24 cursor-pointer transition-transform duration-300 hover:scale-[1.02] hover:border-blue-700 hover:bg-inherit"
                  onClick={() => { setSelectedMetric(metricType); setShowOverview(false); }}
                >
                  <div className="flex items-center space-x-2 text-gray-400">
                    {metricType === 'inactive' ? <Activity className="h-4 w-4 md:h-5 md:w-5" /> :
                      metricType === 'rssi' ? <Signal className="h-4 w-4 md:h-5 md:w-5" /> :
                        metricType === 'packetLoss' ? <Upload className="h-4 w-4 md:h-5 md:w-5" /> :
                          <Cpu className="h-4 w-4 md:h-5 md:w-5" />
                    }
                    <span className="text-xs md:text-sm">{
                      metricType === 'inactive' ? 'Inactive Time' :
                        metricType === 'rssi' ? 'RSSI' :
                          metricType === 'packetLoss' ? 'Packet Loss Ratio' :
                            'MCS Index'
                    }</span>
                  </div>
                  <div className="text-sm text-white font-semibold">Click to view graph</div>
                </div>
              </motion.div>
            ))}
          </div>

          {compareMode && !showOverview && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
              <div className="bg-gray-800 p-3 md:p-4 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm md:text-lg font-semibold text-white">Compare Metrics</h3>
                </div>
                <div className="text-gray-400 text-xs md:text-sm mb-3">Select metrics to compare (max 5) or click "All Metrics"</div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <button
                    onClick={() => handleCompareSelect('all')}
                    className={`px-2 md:px-4 py-1 md:py-2 rounded-lg text-xs md:text-sm transition-colors ${isAllMetricsSelected
                      ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                  >
                    All Metrics
                  </button>

                  {['rssi', 'noise', 'packetLoss', 'mcs', 'inactive'].map(metric => (
                    <button
                      key={metric}
                      onClick={() => handleCompareSelect(metric)}
                      disabled={selectedGraphs.length === 1 && selectedGraphs.includes(metric)}
                      className={`px-2 md:px-4 py-1 md:py-2 rounded-lg text-xs md:text-sm transition-colors ${selectedGraphs.includes(metric)
                        ? 'bg-blue-600 text-white'
                        : selectedGraphs.length >= 5 && !selectedGraphs.includes(metric)
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-60'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                    >
                      {metric === 'packetLoss' ? 'Packet Loss' :
                        metric === 'mcs' ? 'MCS Index' :
                          metric === 'inactive' ? 'Inactive Time' :
                            metric === 'noise' ? 'Noise Floor' : 'RSSI'}
                    </button>
                  ))}
                </div>
                {selectedGraphs.length > 0 && (
                  <div className="h-64 md:h-80"><CompareMetricsChart /></div>
                )}
              </div>
            </motion.div>
          )}

          {showOverview && !selectedMetric && !compareMode && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              {[
                { type: 'packetLoss', title: 'Packet Loss Ratio', chart: <PacketLossChart data={timeSeriesData} displayChoice="all" /> },
                { type: 'rssi', title: 'RSSI', chart: <RssiChart data={timeSeriesData} displayChoice="all" /> },
                { type: 'inactive', title: 'Inactive Time', chart: <InactiveChart data={timeSeriesData} /> },
                { type: 'mcs', title: 'MCS Index', chart: <McsChart data={timeSeriesData} /> }
              ].map(item => (
                <motion.div key={item.type} whileHover={{ scale: 1.02 }}
                  className="bg-gray-800 p-3 md:p-4 rounded-lg cursor-pointer"
                  onClick={() => handleOverviewChartClick(item.type)}>
                  <h4 className="text-xs md:text-md font-semibold text-white mb-2">{item.title}</h4>
                  <div className="h-64">{item.chart}</div>
                </motion.div>
              ))}
            </div>
          )}

          {selectedMetric && !compareMode && !showOverview && (
            <div className="bg-gray-800 p-3 md:p-4 rounded-lg">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm md:text-lg font-semibold text-white">{getGraphTitle(selectedMetric)}</h3>
              </div>
              <div className="h-64 md:h-80">{renderChart()}</div>
            </div>
          )}
        </motion.div>

        <AnimatePresence>
          {isFullView && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-2 md:p-4">
              <motion.div layout initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                className="bg-gray-900 rounded-lg p-3 md:p-6 w-full sm:w-[90%] max-h-[90vh] overflow-y-auto relative">
                <div className="flex justify-end mb-2">
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setIsFullView(false)} className="text-gray-400 hover:text-white"
                    aria-label="Close full view">
                    <X size={isMobile ? 16 : 24} />
                  </motion.button>
                </div>
                <div className="h-[calc(90vh-100px)]">{renderChart()}</div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

export default StationDetails;