'use client';
import MeshVisualization from '../components/MeshVisualization';
import React, { useState } from 'react';
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
} from 'recharts';
import {
  Activity,
  Signal,
  Cpu,
  Database,
  Upload,
  Server,
  Radio,
} from 'lucide-react';
import { MetricCard } from '../components/shared/MetricCard';
import StationDetails from '../components/StationDetails';
import { parseLogFile, MeshStat } from '../utils/logParser';
import FileUpload from './LogFileUpload';
import { StationStat } from '@/types';

interface LinkStatusAnalyzerProps {
  initialData?: string;
}

export default function LinkStatusAnalyzer({ initialData }: LinkStatusAnalyzerProps) {
  const [logData, setLogData] = useState(() => initialData ? parseLogFile(initialData) : []);
  const [selectedStation, setSelectedStation] = useState<StationStat | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string>('noiseFloor');
  const [isLoading, setIsLoading] = useState(false);

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

  const handleMetricClick = (metricType: string) => {
    setSelectedMetric(metricType);
    document.getElementById('performance-graphs')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const getStationTimeSeriesData = (mac: string) => {
    return logData
      .map((entry) => {
        const stationData = entry.stations.find((s) => s.mac === mac);
        return stationData ? { timestamp: entry.timestamp, ...stationData } : null;
      })
      .filter((data) => data && data.rssi !== undefined);
  };

  if (logData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
          <h1 className="glowing-text text-white">Link Status Log Analyzer</h1>
            <p className="text-gray-400">Upload your SmartRadio log file to analyze performance metrics</p>
          </div>
          <FileUpload onFileLoaded={handleFileLoaded} />
        </div>
      </div>
    );
  }

  const latestData = logData[logData.length - 1];
  // A helper for formatting timestamps to a readable date/time
  const formatTimestamp = (value: number) =>
    new Date(value).toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  return (
<div className="p-6">
  <div className="max-w-7xl mx-auto">
  <div className="flex justify-between items-center mb-8">
  {/* Left Side: Logo + Title + Subtitle */}
  <div className="flex items-center space-x-3">
    <img
      src="/logo.png"
      alt="Mesh Rider Logo"
      className="h-12"
    />
    <div className="flex flex-col">
      <h1 className="glowing-text text-white text-2xl font-bold">
        Link Status Analysis
      </h1>
      <p className="text-gray-400 mt-1">
        Analyzing {logData.length} log entries
      </p>
    </div>
  </div>
  
  {/* Right Side: Button */}
  <button
    onClick={() => setLogData([])}
    className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700"
  >
    Upload New File
  </button>
</div>

        <div className="grid grid-cols-4 gap-6 mb-8">
          <MetricCard title="Noise Floor" value={latestData.noise} unit=" dBm" icon={Signal} status={latestData.noise > -75 ? 'warning' : 'normal'} onClick={() => handleMetricClick('noiseFloor')} />
          <MetricCard title="Channel Activity" value={latestData.activity} unit="%" icon={Activity} status={latestData.activity > 70 ? 'warning' : 'normal'} onClick={() => handleMetricClick('activity')} />
          <MetricCard title="CPU Load" value={latestData.cpuLoad} unit="%" icon={Cpu} status={latestData.cpuLoad > 80 ? 'warning' : 'normal'} onClick={() => handleMetricClick('cpu')} />
          <MetricCard title="Memory Available" value={latestData.memory} unit=" MB" icon={Database} status="normal" onClick={() => handleMetricClick('memory')} />
        </div>
        <div id="performance-graphs" className="grid grid-cols-2 gap-6 mb-8">
          {(selectedMetric === 'noiseFloor' || selectedMetric === 'activity') && (
            <div className="bg-gray-900 p-6 rounded-lg col-span-2">
              <h3 className="text-lg font-semibold text-white mb-4">RF Performance</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={logData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="timestamp" type="number" domain={['auto', 'auto']}    tickFormatter={formatTimestamp} stroke="#9CA3AF" />
                    <YAxis yAxisId="noise" domain={[-90, -50]} stroke="#60A5FA" />
                    <YAxis yAxisId="activity" orientation="right" domain={[0, 100]} stroke="#34D399" />
                    <Tooltip labelFormatter={(label) => formatTimestamp(Number(label))} contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '0.5rem', color: '#F3F4F6' }} />
                    <Line yAxisId="noise" type="monotone" dataKey="noise" name="Noise Floor" stroke="#60A5FA" dot={false} />
                    <Line yAxisId="activity" type="monotone" dataKey="activity" name="Activity" stroke="#34D399" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          {selectedMetric === 'cpu' && (
            <div className="bg-gray-900 p-6 rounded-lg col-span-2">
              <h3 className="text-lg font-semibold text-white mb-4">System Performance</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={logData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="timestamp" type="number" domain={['auto', 'auto']}    tickFormatter={(value) =>
      new Date(value).toLocaleString('en-US', {
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      })
    }
    stroke="#9CA3AF" />
                    <YAxis domain={[0, 100]} stroke="#9CA3AF" />
                    <Tooltip  labelFormatter={(label) => formatTimestamp(Number(label))} contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '0.5rem', color: '#F3F4F6' }} />
                    <Line type="monotone" dataKey="cpuLoad" name="CPU Load" stroke="#A78BFA" dot={false} />
                    <Line type="monotone" dataKey="cpuLoad5m" name="CPU Load (5m)" stroke="#EC4899" dot={false} />
                    <Line type="monotone" dataKey="cpuLoad15m" name="CPU Load (15m)" stroke="#F59E0B" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          {selectedMetric === 'memory' && (
            <div className="bg-gray-900 p-6 rounded-lg col-span-2">
              <h3 className="text-lg font-semibold text-white mb-4">Memory Usage</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={logData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="timestamp" type="number" domain={['auto', 'auto']} tickFormatter={(value) => new Date(value).toLocaleTimeString("en-US")} stroke="#9CA3AF" />
                    <YAxis domain={[0, 'auto']} stroke="#9CA3AF" />
                    <Tooltip  labelFormatter={(label) => formatTimestamp(Number(label))} contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '0.5rem', color: '#F3F4F6' }} />
                    <Line type="monotone" dataKey="memory" name="Available Memory" stroke="#F87171" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
        <div className="mb-8">
          <MeshVisualization
            meshStats={latestData.meshNodes}
            onNodeClick={(address: string) => {
              const stationObj = latestData.stations.find((s: any) => s.mac === address);
              if (stationObj) {
                setSelectedStation(stationObj);
              }
            }}
          />
        </div>
        <div className="bg-gray-900 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Connected Stations ({latestData.stations.length})</h3>
          <div className="space-y-4">
            {latestData.stations.map((station: any) => {
              const signalQuality = station.rssi > -65 ? 'good' : station.rssi > -75 ? 'fair' : 'poor';
              const plQuality = station.pl_ratio < 1 ? 'good' : station.pl_ratio < 2 ? 'fair' : 'poor';
              return (
                <div
                  key={station.mac}
                  className="bg-gray-800 p-4 rounded-lg cursor-pointer hover:bg-gray-750 transition-colors"
                  onClick={() => setSelectedStation(station)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-white font-medium flex items-center">
                        {station.mac}
                        <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${signalQuality === 'good' ? 'bg-green-900 text-green-300' : signalQuality === 'fair' ? 'bg-yellow-900 text-yellow-300' : 'bg-red-900 text-red-300'}`}>{signalQuality.toUpperCase()}</span>
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        <span className="mr-4">RSSI: {station.rssi} dBm</span>
                        <span className="mr-4">MCS: {station.mcs}</span>
                        <span>Inact: {station.inactive}ms</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Ant1: {station.rssi_ant[0]} dBm, Ant2: {station.rssi_ant[1]} dBm
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">
                        <span className="text-gray-400">TX: </span>
                        <span className="text-white">{(station.tx_bytes / 1024).toFixed(2)} KB</span>
                      </div>
                      <div className={`text-sm ${plQuality === 'good' ? 'text-green-400' : plQuality === 'fair' ? 'text-yellow-400' : 'text-red-400'}`}>
                        PL: {station.pl_ratio.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-400">Retries: {station.tx_retries}</div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Click for detailed statistics and packet loss graph
                  </div>
                </div>
              );
            })}
          </div>
        </div>
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
  );
}
