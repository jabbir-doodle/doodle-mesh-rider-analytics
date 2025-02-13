'use client';
import React, { useState } from 'react';
import {
  LineChart,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Activity, Signal, Cpu, Upload } from 'lucide-react';
import { MetricCard } from './shared/MetricCard';

interface StationDetailsProps {
  station: any;
  timeSeriesData: any[];
  localtime: number;
  onClose: () => void;
}

interface ChartProps {
  data: any[];
}
const formatTimestamp = (value: number) =>
  new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

const RssiChart: React.FC<ChartProps & { displayChoice: string }> = ({ data, displayChoice }) => (
  <div className="h-64">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis
          dataKey="timestamp"
          type="number"
          domain={['auto', 'auto']}
          tickFormatter={(value: number) =>
            new Date(value * 1000).toLocaleTimeString("en-US", {
              timeZone: "America/New_York",
              hour12: true,
            })
          }
          stroke="#9CA3AF"
        />
        <YAxis
          domain={[-90, -20]}
          stroke="#9CA3AF"
          label={{ value: 'RSSI (dBm)', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip labelFormatter={(label) => formatTimestamp(Number(label))}  contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '0.5rem', color: '#F3F4F6' }} />
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

interface PacketLossChartProps extends ChartProps {
  displayChoice: string;
}

const PacketLossChart: React.FC<PacketLossChartProps> = ({ data, displayChoice }) => (
  <div className="h-64">
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis
          dataKey="timestamp"
          type="number"
          domain={['auto', 'auto']}
          tickFormatter={(value: number) =>
            new Date(value * 1000).toLocaleTimeString("en-US", {
              timeZone: "America/New_York",
              hour12: true,
            })
          }
          stroke="#9CA3AF"
        />
        {displayChoice === "all" ? (
          <>
            <YAxis
              yAxisId="left"
              domain={[0, 'auto']}
              stroke="#9CA3AF"
              label={{ value: 'Packet Loss Ratio', angle: -90, position: 'insideLeft' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 'auto']}
              stroke="#9CA3AF"
              label={{ value: 'Tx Retries', angle: -90, position: 'insideRight' }}
            />
          </>
        ) : displayChoice === "pl" ? (
          <YAxis
            domain={[0, 'auto']}
            stroke="#9CA3AF"
            label={{ value: 'Packet Loss Ratio', angle: -90, position: 'insideLeft' }}
          />
        ) : (
          <YAxis
            domain={[0, 'auto']}
            stroke="#9CA3AF"
            label={{ value: 'Tx Retries', angle: -90, position: 'insideLeft' }}
          />
        )}
        <Tooltip labelFormatter={(label) => formatTimestamp(Number(label))} contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '0.5rem', color: '#F3F4F6' }} />
        {(displayChoice === 'all' || displayChoice === 'pl') && (
          <Bar
            dataKey="pl_ratio"
            barSize={20}
            fill="#EF4444"
            name="Packet Loss Ratio"
            yAxisId={displayChoice === 'all' ? "left" : undefined}
          />
        )}
        {(displayChoice === 'all' || displayChoice === 'retries') && (
          <Line
            dataKey="tx_retries"
            stroke="#F59E0B"
            dot={false}
            strokeWidth={2}
            name="Retries"
            yAxisId={displayChoice === 'all' ? "right" : undefined}
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
          tickFormatter={(value: number) =>
            new Date(value * 1000).toLocaleTimeString("en-US", {
              timeZone: "America/New_York",
              hour12: true,
            })
          }
          stroke="#9CA3AF"
        />
        <YAxis
          domain={[0, 15]}
          stroke="#9CA3AF"
          label={{ value: 'MCS Index', angle: -90, position: 'insideLeft' }}
          ticks={[0, 3, 7, 11, 15]}
        />
        <Tooltip   labelFormatter={(label) => formatTimestamp(Number(label))} contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '0.5rem', color: '#F3F4F6' }} />
        <Line type="stepAfter" dataKey="mcs" stroke="#8B5CF6" name="MCS Index" dot={false} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

const StationDetails: React.FC<StationDetailsProps> = ({ station, timeSeriesData, localtime, onClose }) => {
  const [selectedMetric, setSelectedMetric] = useState<string>('packetLoss');
  const [rssiChoice, setRssiChoice] = useState<string>('all');
  const [plChoice, setPlChoice] = useState<string>('all');
  const formattedLocalTime = new Date(localtime * 1000).toLocaleString("en-US", {
    timeZone: "America/New_York",
    hour12: true,
  });
  
  const graphTitle =
    selectedMetric === 'rssi'
      ? `RSSI ${rssiChoice === 'all' ? '- Overall & Antennas' : rssiChoice === 'rssi' ? '- Overall' : rssiChoice === 'ant1' ? '- Antenna 1' : '- Antenna 2'}`
      : selectedMetric === 'packetLoss'
      ? 'Packet Loss Ratio'
      : selectedMetric === 'mcs'
      ? 'MCS Index'
      : '';
  const renderChart = () => {
    if (selectedMetric === 'rssi')
      return <RssiChart data={timeSeriesData} displayChoice={rssiChoice} />;
    if (selectedMetric === 'packetLoss')
      return <PacketLossChart data={timeSeriesData} displayChoice={plChoice} />;
    if (selectedMetric === 'mcs') return <McsChart data={timeSeriesData} />;
    return null;
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-[80%] max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Station Details: {station.mac}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">×</button>
        </div>
        <div className="grid grid-cols-5 gap-4 mb-6">
          <MetricCard title="Local Time" value={formattedLocalTime} icon={Activity} status="normal" />
          <MetricCard title="Inactive Time" value={station.inactive} unit="ms" icon={Activity} status="warning" />
          <MetricCard title="RSSI" value={station.rssi} subValue={`Ant1: ${station.rssi_ant[0]} dBm, Ant2: ${station.rssi_ant[1]} dBm`} icon={Signal} onClick={() => setSelectedMetric('rssi')} status="warning" />
          <MetricCard title="Packet Loss Ratio" value={station.pl_ratio.toFixed(2)} icon={Upload} onClick={() => setSelectedMetric('packetLoss')} status="warning" />
          <MetricCard title="MCS Index" value={station.mcs} icon={Cpu} onClick={() => setSelectedMetric('mcs')} status="warning" />
        </div>
        <div className="bg-gray-800 p-4 rounded-lg mb-4">
          <h3 className="text-lg font-semibold text-white mb-4">{graphTitle}</h3>
          {selectedMetric === 'rssi' && (
            <div className="flex space-x-4 mb-4">
              <button onClick={() => setRssiChoice('all')} className={`px-2 py-1 rounded ${rssiChoice === 'all' ? 'bg-blue-500' : 'bg-gray-700'}`}>Overall & Antennas</button>
              <button onClick={() => setRssiChoice('rssi')} className={`px-2 py-1 rounded ${rssiChoice === 'rssi' ? 'bg-blue-500' : 'bg-gray-700'}`}>Overall</button>
              <button onClick={() => setRssiChoice('ant1')} className={`px-2 py-1 rounded ${rssiChoice === 'ant1' ? 'bg-blue-500' : 'bg-gray-700'}`}>Antenna 1</button>
              <button onClick={() => setRssiChoice('ant2')} className={`px-2 py-1 rounded ${rssiChoice === 'ant2' ? 'bg-blue-500' : 'bg-gray-700'}`}>Antenna 2</button>
            </div>
          )}
          {selectedMetric === 'packetLoss' && (
            <div className="flex space-x-4 mb-4">
              <button onClick={() => setPlChoice('all')} className={`px-2 py-1 rounded ${plChoice === 'all' ? 'bg-blue-500' : 'bg-gray-700'}`}>All</button>
              <button onClick={() => setPlChoice('pl')} className={`px-2 py-1 rounded ${plChoice === 'pl' ? 'bg-blue-500' : 'bg-gray-700'}`}>Packet Loss</button>
              <button onClick={() => setPlChoice('retries')} className={`px-2 py-1 rounded ${plChoice === 'retries' ? 'bg-blue-500' : 'bg-gray-700'}`}>Retries</button>
            </div>
          )}
          {renderChart()}
        </div>
      </div>
    </div>
  );
};

export default StationDetails;
