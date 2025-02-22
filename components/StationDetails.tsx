'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ComposedChart,
  LineChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Activity,
  Signal,
  Cpu,
  Upload,
  Network,
  Maximize2,
  Clock,
  ZoomIn,
  ZoomOut,
  Minimize2,
} from 'lucide-react';
import { MetricCard } from './shared/MetricCard';
import { formatMacAddress, macToIpAddress } from '@/utils/networkHelpers';

/* -----------------------------
   Types & Interfaces
----------------------------- */
interface StationDetailsProps {
  station: any;
  timeSeriesData: any[];
  localtime: number;
  onClose: () => void;
}

interface ChartProps {
  data: any[];
}

interface PacketLossChartProps extends ChartProps {
  displayChoice: string;
}

/* -----------------------------
   Utility Functions
----------------------------- */
// Update the formatTimestamp function to be more consistent
const formatTimestamp = (value: number) => {
  // Ensure value is treated as milliseconds
  const date = new Date(value * 1000);
  return date.toLocaleString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};

/* -----------------------------
   Chart Components
----------------------------- */
const RssiChart: React.FC<ChartProps & { displayChoice: string }> = ({
  data,
  displayChoice
}) => (
  <div className="h-64">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis
          dataKey="timestamp"
          type="number"
          domain={['auto', 'auto']}
          tickFormatter={formatTimestamp}
          stroke="#9CA3AF"
        />
        <YAxis
          domain={[-90, -20]}
          stroke="#9CA3AF"
          label={{ value: 'RSSI (dBm)', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip
          labelFormatter={formatTimestamp}
          contentStyle={{
            backgroundColor: '#1F2937',
            border: 'none',
            borderRadius: '0.5rem',
            color: '#F3F4F6',
          }}
        />
        {(displayChoice === 'all' || displayChoice === 'rssi') && (
          <Line type="monotone" dataKey="rssi" stroke="#3B82F6" name="Overall RSSI" dot={false} strokeWidth={2} />
        )}
        {(displayChoice === 'all' || displayChoice === 'ant1') && (
          <Line type="monotone" dataKey="rssi_ant[0]" stroke="#60A5FA" name="Antenna 1" dot={false} strokeWidth={2} />
        )}
        {(displayChoice === 'all' || displayChoice === 'ant2') && (
          <Line type="monotone" dataKey="rssi_ant[1]" stroke="#93C5FD" name="Antenna 2" dot={false} strokeWidth={2} />
        )}
      </LineChart>
    </ResponsiveContainer>
  </div>
);

const PacketLossChart: React.FC<PacketLossChartProps> = ({
  data,
  displayChoice
}) => (
  <div className="h-64">
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis
          dataKey="timestamp"
          type="number"
          domain={['auto', 'auto']}
          tickFormatter={formatTimestamp}
          stroke="#9CA3AF"
        />
        <YAxis
          yAxisId="left"
          domain={[0, (dataMax: number) => Math.max(5, Math.ceil(dataMax))]}
          stroke="#9CA3AF"
          label={{
            value: 'Packet Loss Ratio',
            angle: -90,
            position: 'insideLeft',
            style: { fill: '#9CA3AF' }
          }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          domain={[0, (dataMax: number) => Math.max(10, Math.ceil(dataMax))]}
          stroke="#9CA3AF"
          label={{
            value: 'Tx Retries',
            angle: -90,
            position: 'insideRight',
            style: { fill: '#9CA3AF' }
          }}
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
        {(displayChoice === 'all' || displayChoice === 'pl') && (
          <Bar
            yAxisId="left"
            dataKey="pl_ratio"
            barSize={20}
            fill="#EF4444"
            name="Packet Loss Ratio"
            radius={[4, 4, 0, 0]}
          />
        )}
        {(displayChoice === 'all' || displayChoice === 'retries') && (
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="tx_retries"
            stroke="#F59E0B"
            name="Tx Retries"
            dot={false}
            strokeWidth={2}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  </div>
);

const McsChart: React.FC<ChartProps> = ({ data }) => (
  <div className="h-64">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis
          dataKey="timestamp"
          type="number"
          domain={['auto', 'auto']}
          tickFormatter={formatTimestamp}
          stroke="#9CA3AF"
        />
        <YAxis
          domain={[0, 15]}
          stroke="#9CA3AF"
          label={{ value: 'MCS Index', angle: -90, position: 'insideLeft' }}
          ticks={[0, 3, 7, 11, 15]}
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
        <Line type="stepAfter" dataKey="mcs" stroke="#8B5CF6" name="MCS Index" dot={false} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

const InactiveChart: React.FC<ChartProps> = ({ data }) => (
  <div className="h-64">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis
          dataKey="timestamp"
          type="number"
          domain={['auto', 'auto']}
          tickFormatter={formatTimestamp}
          stroke="#9CA3AF"
        />
        <YAxis
          domain={[0, 'auto']}
          stroke="#9CA3AF"
          label={{ value: 'Inactive Time (ms)', angle: -90, position: 'insideLeft' }}
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
        <Line type="monotone" dataKey="inactive" stroke="#EC4899" name="Inactive Time" dot={false} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

/* -----------------------------
   Main Component
----------------------------- */
const StationDetails: React.FC<StationDetailsProps> = ({
  station,
  timeSeriesData,
  localtime,
  onClose
}) => {
  const [selectedMetric, setSelectedMetric] = useState<string>('');
  const [rssiChoice, setRssiChoice] = useState<string>('all');
  const [plChoice, setPlChoice] = useState<string>('all');
  const [isFullView, setIsFullView] = useState<boolean>(false);
  const [showOverview, setShowOverview] = useState<boolean>(true);
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [selectedGraphs, setSelectedGraphs] = useState<string[]>([]);
  const [isAllMetricsSelected, setIsAllMetricsSelected] = useState<boolean>(false);

  const formattedTime = new Date(localtime * 1000).toLocaleString('en-US', {
    hour12: true,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const handleOverviewChartClick = (metricType: string) => {
    setSelectedMetric(metricType);
    setShowOverview(false);
    if (metricType === 'rssi') {
      setRssiChoice('all');
    } else if (metricType === 'packetLoss') {
      setPlChoice('all');
    }
  };

  const getGraphTitle = (metric: string) => {
    switch (metric) {
      case 'rssi':
        return `RSSI ${rssiChoice === 'all' ? '- Overall & Antennas' : rssiChoice}`;
      case 'packetLoss':
        return `Packet Loss Ratio ${plChoice === 'all' ? '' : `- ${plChoice}`}`;
      case 'mcs':
        return 'MCS Index';
      case 'inactive':
        return 'Inactive Time';
      default:
        return '';
    }
  };

  // Update the handleCompareSelect function with improved logic
  const handleCompareSelect = (metric: string) => {
    if (metric === 'all') {
      // If All Metrics is being selected
      if (!isAllMetricsSelected) {
        setIsAllMetricsSelected(true);
        setSelectedGraphs(['rssi', 'packetLoss', 'mcs', 'inactive']);
      } else {
        // If All Metrics is being deselected
        setIsAllMetricsSelected(false);
        setSelectedGraphs([]);
      }
    } else {
      // If individual metric is clicked while All Metrics is active
      if (isAllMetricsSelected) {
        setIsAllMetricsSelected(false);
        setSelectedGraphs([metric]);
      } else {
        // Normal individual metric toggle
        if (selectedGraphs.includes(metric)) {
          setSelectedGraphs(selectedGraphs.filter(g => g !== metric));
        } else if (selectedGraphs.length < 4) {
          setSelectedGraphs([...selectedGraphs, metric]);
        }
      }
    }
  };

  const ChartContainer: React.FC<{ title: string; children: React.ReactNode }> = ({
    title,
    children
  }) => (
    <div className="bg-gray-800 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      <div className="h-80">
        {children}
      </div>
    </div>
  );

  const ComparisonChart = () => (
    <ChartContainer title="Combined Metrics">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={timeSeriesData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="timestamp"
            type="number"
            scale="time"
            domain={['auto', 'auto']}
            tickFormatter={formatTimestamp}
            stroke="#9CA3AF"
          />
          {/* Add all possible Y-axes */}
          {selectedGraphs.includes('rssi') && (
            <YAxis
              yAxisId="rssi"
              orientation="left"
              domain={[-90, -20]}
              stroke="#3B82F6"
              label={{ value: 'RSSI (dBm)', angle: -90, position: 'insideLeft', style: { fill: '#3B82F6' } }}
            />
          )}
          {selectedGraphs.includes('packetLoss') && (
            <YAxis
              yAxisId="pl"
              orientation="right"
              domain={[0, (dataMax: number) => Math.max(1, Math.ceil(dataMax * 1.1))]}
              stroke="#EF4444"
              label={{ value: 'Packet Loss Ratio', angle: -90, position: 'insideRight', style: { fill: '#EF4444' } }}
            />
          )}
          {selectedGraphs.includes('mcs') && (
            <YAxis
              yAxisId="mcs"
              orientation="right"
              domain={[0, 15]}
              stroke="#8B5CF6"
              label={{ value: 'MCS Index', angle: -90, position: 'insideRight', style: { fill: '#8B5CF6' } }}
            />
          )}
          {selectedGraphs.includes('inactive') && (
            <YAxis
              yAxisId="inactive"
              orientation="right"
              domain={[0, 'auto']}
              stroke="#EC4899"
              label={{ value: 'Inactive (ms)', angle: -90, position: 'insideRight', style: { fill: '#EC4899' } }}
            />
          )}
          <Tooltip
            labelFormatter={formatTimestamp}
            contentStyle={{
              backgroundColor: '#1F2937',
              border: 'none',
              borderRadius: '0.5rem',
              color: '#F3F4F6',
            }}
          />
          <Legend />
          {/* Add all possible metrics */}
          {selectedGraphs.includes('rssi') && (
            <Line
              yAxisId="rssi"
              type="monotone"
              dataKey="rssi"
              stroke="#3B82F6"
              name="RSSI"
              dot={false}
            />
          )}
          {selectedGraphs.includes('packetLoss') && (
            <Bar
              yAxisId="pl"
              dataKey="pl_ratio"
              fill="#EF4444"
              name="Packet Loss"
              opacity={0.8}
            />
          )}
          {selectedGraphs.includes('mcs') && (
            <Line
              yAxisId="mcs"
              type="stepAfter"
              dataKey="mcs"
              stroke="#8B5CF6"
              name="MCS Index"
              dot={false}
            />
          )}
          {selectedGraphs.includes('inactive') && (
            <Line
              yAxisId="inactive"
              type="monotone"
              dataKey="inactive"
              stroke="#EC4899"
              name="Inactive Time"
              dot={false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </ChartContainer>
  );

  useEffect(() => {
    if (compareMode) {
      setIsAllMetricsSelected(true);
      setSelectedGraphs(['rssi', 'packetLoss', 'mcs', 'inactive']);
    }
  }, [compareMode]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey) {
        switch (e.key) {
          case 'f':
            setIsFullView(prev => !prev);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  function renderChart(): React.ReactNode {
    switch (selectedMetric) {
      case 'rssi':
        return <RssiChart data={timeSeriesData} displayChoice={rssiChoice} />;
      case 'packetLoss':
        return <PacketLossChart data={timeSeriesData} displayChoice={plChoice} />;
      case 'mcs':
        return <McsChart data={timeSeriesData} />;
      case 'inactive':
        return <InactiveChart data={timeSeriesData} />;
      default:
        return null;
    }
  }

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div className="bg-gray-900 rounded-lg p-6 w-full sm:w-[80%] max-h-[90vh] overflow-y-auto">
          {/* Header Section */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex justify-between items-center">
              <div>
                {/* Network icon */}
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/10 p-2 rounded-lg">
                    <Network className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="text-xl font-bold text-white">
                    {macToIpAddress(station.mac)}
                    <div className="font-mono text-sm text-gray-300">
                      {formatMacAddress(station.mac)}
                    </div>
                  </div>
                </div>
                {/* MAC Address with identifier icon */}
                <div className="flex items-center text-sm text-gray-400 gap-2 mt-2">
                  <Clock size={16} />
                  <span>Local Time: {formattedTime}</span>
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
                  onClick={() => {
                    setCompareMode(!compareMode);
                    setSelectedGraphs([]);
                    setShowOverview(false);
                    setSelectedMetric('');
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  {compareMode ? 'Exit Compare' : 'Compare Metrics'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="text-gray-400 hover:text-white p-2"
                >
                  <Minimize2 />
                </motion.button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <motion.div whileHover={{ scale: 1.02 }} className="h-full">
              <MetricCard
                title="Inactive Time"
                value={station.inactive}
                unit="ms"
                icon={Activity}
                onClick={() => {
                  setSelectedMetric('inactive');
                  setShowOverview(false);
                }}
                status="normal"
              />
            </motion.div>

            {/* RSSI Card with fixed height */}
            <motion.div whileHover={{ scale: 1.02 }} className="h-full">
              <div
                className="bg-gray-900 border border-gray-800 rounded-lg p-6 flex flex-col justify-between h-[120px] cursor-pointer hover:bg-gray-800 transition-colors"
                onClick={() => {
                  setSelectedMetric('rssi');
                  setShowOverview(false);
                }}
              >
                <div className="flex items-center space-x-2 text-gray-400">
                  <Signal className="h-5 w-5" />
                  <span className="text-sm">RSSI</span>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-400">
                    {station.rssi} dBm
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    A1:{station.rssi_ant[0]} A2:{station.rssi_ant[1]}
                  </div>
                </div>
                <div className="text-xs text-gray-300">Click to show graph</div>
              </div>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} className="h-full">
              <div
                className="bg-gray-900 border border-gray-800 rounded-lg p-6 flex flex-col justify-between h-[120px] cursor-pointer hover:bg-gray-800 transition-colors"
                onClick={() => {
                  setSelectedMetric('packetLoss');
                  setShowOverview(false);
                }}
              >
                <div className="flex items-center space-x-2 text-gray-400">
                  <Upload className="h-5 w-5" />
                  <span className="text-sm">Packet Loss Ratio</span>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-400">
                    {station.pl_ratio.toFixed(2)}
                  </div>
                </div>
                <div className="text-xs text-gray-300">Click to show graph</div>
              </div>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} className="h-full">
              <div
                className="bg-gray-900 border border-gray-800 rounded-lg p-6 flex flex-col justify-between h-[120px] cursor-pointer hover:bg-gray-800 transition-colors"
                onClick={() => {
                  setSelectedMetric('mcs');
                  setShowOverview(false);
                }}
              >
                <div className="flex items-center space-x-2 text-gray-400">
                  <Cpu className="h-5 w-5" />
                  <span className="text-sm">MCS Index</span>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-400">
                    {station.mcs}
                  </div>
                </div>
                <div className="text-xs text-gray-300">Click to show graph</div>
              </div>
            </motion.div>
          </div>

          {/* Comparison Chart Section */}
          {compareMode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-white">Compare Metrics</h3>
                </div>

                <div className="text-gray-400 text-sm mb-4">
                  {`Select metrics to compare (max 4) or click "All Metrics"`}
                </div>

                <div className="flex flex-wrap gap-3 mb-4">
                  <button
                    onClick={() => handleCompareSelect('all')}
                    className={`px-4 py-2 rounded-lg transition-colors duration-200 ${isAllMetricsSelected
                      ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                      }`}
                  >
                    All Metrics
                  </button>

                  {['rssi', 'packetLoss', 'mcs', 'inactive'].map(metric => (
                    <button
                      key={metric}
                      onClick={() => handleCompareSelect(metric)}
                      className={`px-4 py-2 rounded-lg transition-colors duration-200 ${selectedGraphs.includes(metric)
                        ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                        : selectedGraphs.length >= 4 && !selectedGraphs.includes(metric)
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                        }`}
                      disabled={isAllMetricsSelected || (selectedGraphs.length >= 4 && !selectedGraphs.includes(metric))}
                    >
                      {metric === 'rssi' ? 'RSSI' :
                        metric === 'packetLoss' ? 'Packet Loss' :
                          metric === 'mcs' ? 'MCS Index' : 'Inactive Time'}
                    </button>
                  ))}
                </div>

                {selectedGraphs.length > 0 && (
                  <div className="mt-4">
                    <ComparisonChart />
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Overview Graphs */}
          {showOverview && !selectedMetric && !compareMode && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gray-800 p-4 rounded-lg cursor-pointer"
                onClick={() => handleOverviewChartClick('packetLoss')}
              >
                <h4 className="text-md font-semibold text-white mb-2">Packet Loss Ratio</h4>
                <PacketLossChart data={timeSeriesData} displayChoice="all" />
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gray-800 p-4 rounded-lg cursor-pointer"
                onClick={() => handleOverviewChartClick('rssi')}
              >
                <h4 className="text-md font-semibold text-white mb-2">RSSI</h4>
                <RssiChart data={timeSeriesData} displayChoice="all" />
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gray-800 p-4 rounded-lg cursor-pointer"
                onClick={() => handleOverviewChartClick('inactive')}
              >
                <h4 className="text-md font-semibold text-white mb-2">Inactive Time</h4>
                <InactiveChart data={timeSeriesData} />
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gray-800 p-4 rounded-lg cursor-pointer"
                onClick={() => handleOverviewChartClick('mcs')}
              >
                <h4 className="text-md font-semibold text-white mb-2">MCS Index</h4>
                <McsChart data={timeSeriesData} />
              </motion.div>
            </div>
          )}

          {/* Individual Metric Chart */}
          {selectedMetric && !compareMode && (
            <ChartContainer title={getGraphTitle(selectedMetric)}>
              {renderChart()}
            </ChartContainer>
          )}
        </motion.div>

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
                <div className="flex justify-end mb-4">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsFullView(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <Minimize2 />
                  </motion.button>
                </div>
                {renderChart()}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

export default StationDetails;