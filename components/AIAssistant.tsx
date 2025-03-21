
import React, { useState, useRef, useEffect, FormEvent } from 'react';
import { motion } from 'framer-motion';
import {
  Send, Bot, User, Loader2, X, Check, Copy, ChevronDown, ChevronUp,
  Radio, Activity, Signal, Sparkles, MessageSquare, HelpCircle, ThumbsUp,
  ThumbsDown, Zap, Wifi, BarChart2, Info, RefreshCw, MapPin,
  LineChart
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useToolContext } from './context/ToolContext';
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
  LineChart as RLineChart  // FIX: Renamed import to avoid conflict
} from 'recharts';
import { productModels } from '@/utils/productDatabase';
import { enhanceAIResponse } from './enhancedResponseProcessor';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12
    }
  }
};

const chartVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: {
    opacity: 1,
    height: 'auto',
    transition: {
      duration: 0.4,
      ease: "easeInOut"
    }
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: {
      duration: 0.3,
      ease: "easeInOut"
    }
  }
};

interface AIAssistantProps {
  showInSidebar?: boolean;
}

type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  productRecommendations?: string[];
  charts?: any[];
}

const AIAssistant: React.FC<AIAssistantProps> = ({ showInSidebar = false }) => {


  const handleLogDataInput = (input: string) => {
    // Check if input contains JSON-like content
    if (input.includes('{') && input.includes('}')) {
      const logData = parseLogData(input);

      if (logData) {
        let analysisContent = '';

        // Extract general network metrics
        if (logData.noise !== undefined) {
          analysisContent += `📡 **Network Environment:**\n`;
          analysisContent += `• Noise Floor: ${logData.noise} dBm\n`;

          if (logData.activity !== undefined) {
            analysisContent += `• Channel Activity: ${logData.activity}%\n`;
          }

          if (logData.oper_freq !== undefined) {
            analysisContent += `• Operating Frequency: ${logData.oper_freq} MHz\n`;
          }

          if (logData.chan_width !== undefined) {
            analysisContent += `• Channel Width: ${logData.chan_width} MHz\n`;
          }

          analysisContent += '\n';
        }

        // Extract and analyze station data
        if (logData.sta_stats && Array.isArray(logData.sta_stats) && logData.sta_stats.length > 0) {
          analysisContent += `📊 **Connected Stations (${logData.sta_stats.length}):**\n`;

          logData.sta_stats.forEach((station: any, index: number) => {
            const signalQuality = station.rssi > -65 ? 'Good' : station.rssi > -75 ? 'Fair' : 'Poor';
            const snr = station.rssi - (logData.noise || -95);

            analysisContent += `\n**Station ${index + 1} (${station.mac}):**\n`;
            analysisContent += `• Signal Strength: ${station.rssi} dBm (${signalQuality})\n`;

            if (logData.noise) {
              analysisContent += `• SNR: ${Math.round(snr)} dB\n`;
            }

            if (station.rssi_ant && Array.isArray(station.rssi_ant)) {
              analysisContent += `• Antenna RSSI: [${station.rssi_ant.join(', ')}] dBm\n`;
            }

            if (station.inactive !== undefined) {
              analysisContent += `• Inactive Time: ${station.inactive} ms\n`;
            }

            if (station.pl_ratio !== undefined) {
              analysisContent += `• Packet Loss Ratio: ${station.pl_ratio}\n`;
            }

            if (station.mcs !== undefined) {
              analysisContent += `• MCS Index: ${station.mcs}\n`;
            }
          });
        }

        // Add system information if available
        if (logData.sysinfo) {
          analysisContent += `\n💻 **System Information:**\n`;

          if (logData.sysinfo.cpu_load && Array.isArray(logData.sysinfo.cpu_load)) {
            const cpuPercentage = logData.sysinfo.cpu_load[0] / 100;
            analysisContent += `• CPU Load: ${cpuPercentage.toFixed(2)}%\n`;
          }

          if (logData.sysinfo.freemem !== undefined) {
            const memMB = logData.sysinfo.freemem / (1024 * 1024);
            analysisContent += `• Free Memory: ${memMB.toFixed(2)} MB\n`;
          }

          if (logData.sysinfo.localtime !== undefined) {
            const date = new Date(logData.sysinfo.localtime * 1000);
            analysisContent += `• Timestamp: ${date.toLocaleString()}\n`;
          }
        }

        // Add connection analysis and recommendations
        analysisContent += `\n🔍 **Analysis & Recommendations:**\n`;

        // Noise floor analysis
        if (logData.noise !== undefined) {
          const noiseNum = parseFloat(logData.noise);
          if (noiseNum > -85) {
            analysisContent += `• ⚠️ High noise floor detected (${logData.noise} dBm). Consider changing frequency or location to reduce interference.\n`;
          } else {
            analysisContent += `• ✅ Noise floor is acceptable (${logData.noise} dBm).\n`;
          }
        }

        // Signal quality analysis for stations
        if (logData.sta_stats && Array.isArray(logData.sta_stats) && logData.sta_stats.length > 0) {
          const lowSignalStations = logData.sta_stats.filter((s: any) => s.rssi < -75);

          if (lowSignalStations.length > 0) {
            analysisContent += `• ⚠️ ${lowSignalStations.length} station(s) have low signal strength. Consider repositioning these devices or adding a repeater.\n`;
          } else {
            analysisContent += `• ✅ All stations have acceptable signal strength.\n`;
          }

          // Packet loss analysis
          const highPLStations = logData.sta_stats.filter((s: any) => s.pl_ratio > 1);
          if (highPLStations.length > 0) {
            analysisContent += `• ⚠️ ${highPLStations.length} station(s) show elevated packet loss. Check for interference or obstructions.\n`;
          }
        }

        const response: Message = {
          role: 'assistant',
          content: `I've analyzed your log data:\n\n${analysisContent}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages((prev: Message[]) => [...prev, response]);
        return true;
      }
    }

    return false;
  };
  const parseLogData = (logContent: string) => {
    try {
      // Try to parse as JSON
      let parsedData;
      if (logContent.trim().startsWith('{')) {
        try {
          parsedData = JSON.parse(logContent);
          return parsedData;
        } catch (jsonError) {
          // Try to handle case where there might be multiple JSON objects
          const jsonMatches = logContent.match(/\{[\s\S]*?\}/g);
          if (jsonMatches && jsonMatches.length > 0) {
            try {
              parsedData = JSON.parse(jsonMatches[0]);
              return parsedData;
            } catch (e) {
              console.error("Error parsing first JSON object", e);
            }
          }
        }
      }

      // If not valid JSON, try to extract key information via regex
      const noiseMatch = logContent.match(/noise["\s:=]+([+-]?\d+\.?\d*)/i);
      const rssiMatches = logContent.match(/rssi["\s:=]+([+-]?\d+\.?\d*)/gi);
      const activityMatch = logContent.match(/activity["\s:=]+(\d+\.?\d*)/i);
      const macMatches = logContent.match(/mac["\s:=]+"([0-9A-Fa-f:]+)"/g);

      if (noiseMatch || rssiMatches || activityMatch || macMatches) {
        const extractedData: any = {};

        if (noiseMatch) extractedData.noise = noiseMatch[1];
        if (activityMatch) extractedData.activity = activityMatch[1];

        if (rssiMatches && macMatches) {
          extractedData.sta_stats = [];
          // Very simplified parsing
          for (let i = 0; i < Math.min(rssiMatches.length, macMatches.length); i++) {
            const rssiMatch = rssiMatches[i].match(/([+-]?\d+\.?\d*)/);
            const macMatch = macMatches[i].match(/"([0-9A-Fa-f:]+)"/);
            if (!rssiMatch || !macMatch) continue;

            const rssiVal = rssiMatch[1];
            const macVal = macMatch[1];
            extractedData.sta_stats.push({
              mac: macVal,
              rssi: parseFloat(rssiVal)
            });
          }
        }

        return extractedData;
      }

      throw new Error("Could not parse log data");
    } catch (error) {
      console.error("Error parsing log data:", error);
      return null;
    }
  };

  const renderChart = (data: any, index: number) => {
    const isExpanded = expandedCharts.includes(index);

    // Determine chart type
    const hasRxPower = data[0]?.rxPower !== undefined;
    const hasThroughput = data[0]?.throughput !== undefined;

    return (
      <div className="mt-6 bg-gray-850 rounded-xl overflow-hidden border border-gray-700 shadow-lg">
        <div className="bg-gradient-to-r from-gray-800 to-gray-750 p-4 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Wifi className="h-5 w-5 mr-2 text-violet-400" />
              <h4 className="text-base font-medium text-white">RF Performance Analysis</h4>
            </div>
            <button
              onClick={() => toggleChartExpansion(index)}
              className="p-1.5 bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition-colors"
            >
              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>
        </div>

        <motion.div
          variants={chartVariants}
          initial="hidden"
          animate={isExpanded ? "visible" : "hidden"}
          exit="exit"
          className="overflow-hidden"
        >
          <div className="p-6">
            {hasThroughput && renderThroughputChart(data)}
            {hasRxPower && renderRangeChart(data)}

            <div className="mt-8 bg-gray-900/50 rounded-xl p-5 border border-gray-800">
              <div className="flex items-center mb-3">
                <Info className="w-5 h-5 mr-2 text-blue-400" />
                <h3 className="text-lg font-medium">Analysis Summary</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="mt-1 h-5 w-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Signal className="h-3 w-3 text-blue-500" />
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-blue-400">Signal Quality</h5>
                      <p className="text-sm text-gray-300">{hasThroughput ?
                        "Excellent at close range, degrades with distance" :
                        `${data[1]?.linkQuality || "Good"} up to ${data[1]?.distance.toFixed(1) || "1.0"}km`}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <div className="mt-1 h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Activity className="h-3 w-3 text-emerald-500" />
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-emerald-400">Performance</h5>
                      <p className="text-sm text-gray-300">{hasThroughput ?
                        `Optimal for video streaming up to ${data.find((d: { throughput: number; }) => d.throughput < 5)?.distance.toFixed(1) || "2.5"}km` :
                        `Reliable connection up to ${(data.length > 0 ? data[Math.floor(data.length / 2)].distance : 2).toFixed(1)}km`}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="mt-1 h-5 w-5 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <Zap className="h-3 w-3 text-amber-500" />
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-amber-400">Power Requirements</h5>
                      <p className="text-sm text-gray-300">Standard 12V DC, 1.5A recommended</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <div className="mt-1 h-5 w-5 rounded-full bg-red-500/20 flex items-center justify-center">
                      <MapPin className="h-3 w-3 text-red-500" />
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-red-400">Environmental Impact</h5>
                      <p className="text-sm text-gray-300">Rain attenuation significant above 3GHz</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };


  const renderThroughputChart = (data: any) => (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <RLineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="distance"
            label={{ value: "Distance (km)", position: "insideBottom", offset: -5, fill: "#aaa" }}
            tick={{ fill: "#aaa" }}
          />
          <YAxis
            yAxisId="left"
            label={{ value: "Throughput (Mbps)", angle: -90, position: "insideLeft", offset: 10, fill: "#f59e0b" }}
            stroke="#f59e0b"
            tick={{ fill: "#aaa" }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            label={{ value: "SNR (dB)", angle: 90, position: "insideRight", offset: 10, fill: "#10b981" }}
            stroke="#10b981"
            tick={{ fill: "#aaa" }}
          />
          <Tooltip
            contentStyle={{ backgroundColor: "rgba(17,24,39,0.95)", borderColor: "#4b5563", color: "#e5e7eb", borderRadius: "0.5rem", border: "none" }}
            labelStyle={{ color: "#f3f4f6", fontWeight: "bold", marginBottom: "0.5rem" }}
            itemStyle={{ padding: "0.25rem 0" }}
          />
          <Legend wrapperStyle={{ paddingTop: "1rem" }} />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="throughput"
            name="Throughput (Mbps)"
            stroke="#f59e0b"
            strokeWidth={3}
            dot={{ stroke: "#f59e0b", strokeWidth: 2, r: 4, fill: "#f59e0b" }}
            activeDot={{ stroke: "#f59e0b", strokeWidth: 2, r: 6, fill: "#f59e0b" }}
            animationDuration={1500}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="snr"
            name="SNR (dB)"
            stroke="#10b981"
            strokeWidth={3}
            dot={{ stroke: "#10b981", strokeWidth: 2, r: 4, fill: "#10b981" }}
            activeDot={{ stroke: "#10b981", strokeWidth: 2, r: 6, fill: "#10b981" }}
            animationDuration={1500}
            animationBegin={300}
          />
        </RLineChart>
      </ResponsiveContainer>
    </div>
  );
  // FIX END: End of renderThroughputChart


  // FIX START: renderRangeChart – Replace entire method with the code below
  const renderRangeChart = (data: Record<string, any>[]) => (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <RLineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="distance"
            label={{ value: "Distance (km)", position: "insideBottom", offset: -5, fill: "#aaa" }}
            tick={{ fill: "#aaa" }}
          />
          <YAxis
            yAxisId="left"
            label={{ value: "Signal Power (dBm)", angle: -90, position: "insideLeft", offset: 10, fill: "#f59e0b" }}
            stroke="#f59e0b"
            tick={{ fill: "#aaa" }}
            domain={[-100, -30]}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            label={{ value: "SNR (dB)", angle: 90, position: "insideRight", offset: 10, fill: "#3b82f6" }}
            stroke="#3b82f6"
            tick={{ fill: "#aaa" }}
          />
          <Tooltip
            contentStyle={{ backgroundColor: "rgba(17,24,39,0.95)", borderColor: "#4b5563", color: "#e5e7eb", borderRadius: "0.5rem", border: "none" }}
            labelStyle={{ color: "#f3f4f6", fontWeight: "bold", marginBottom: "0.5rem" }}
            itemStyle={{ padding: "0.25rem 0" }}
          />
          <Legend wrapperStyle={{ paddingTop: "1rem" }} />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="rxPower"
            name="Received Power (dBm)"
            stroke="#f59e0b"
            strokeWidth={3}
            dot={{ stroke: "#f59e0b", strokeWidth: 2, r: 4, fill: "#f59e0b" }}
            activeDot={{ stroke: "#f59e0b", strokeWidth: 2, r: 6, fill: "#f59e0b" }}
            animationDuration={1500}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="snr"
            name="SNR (dB)"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ stroke: "#3b82f6", strokeWidth: 2, r: 4, fill: "#3b82f6" }}
            activeDot={{ stroke: "#3b82f6", strokeWidth: 2, r: 6, fill: "#3b82f6" }}
            animationDuration={1500}
            animationBegin={300}
          />
        </RLineChart>
      </ResponsiveContainer>
    </div>
  );


  const environmentFactors = {
    "Clear Sky": 1.0,
    "Light Rain": 0.8,
    "Moderate Rain": 0.65,
    "Heavy Rain": 0.5,
    "Fog": 0.7,
    "Urban": 0.6,
    "Dense Urban": 0.4
  };
  const calculateThroughput = (input: string) => {
    try {
      // Extract parameters from the input
      const frequencyMatch = input.match(/Frequency\s*\(MHz\)\s*(\d+)/i);
      const bandwidthMatch = input.match(/Bandwidth\s*\(MHz\)\s*(\d+)/i);
      const payloadMatch = input.match(/Payload\s*\(bytes\)\s*(\d+)/i);
      const antennasMatch = input.match(/Antennas\s*(\d+)/i);
      const dataStreamsMatch = input.match(/Data\s*Streams\s*(\d+)/i);
      const antennaGainMatch = input.match(/Antenna\s*Gain\s*\(dBi\)\s*(\d+)/i);
      const fadeMarginMatch = input.match(/Fade\s*Margin\s*\(dB\)\s*(\d+)/i);
      const powerLimitMatch = input.match(/Power\s*Limit\s*\(dBm\)\s*(\d+)/i);

      if (!frequencyMatch || !bandwidthMatch) {
        throw new Error("Missing required parameters");
      }

      const frequency = parseInt(frequencyMatch[1]);
      const bandwidth = parseInt(bandwidthMatch[1]);
      const payload = payloadMatch ? parseInt(payloadMatch[1]) : 1500;
      const antennas = antennasMatch ? parseInt(antennasMatch[1]) : 2;
      const dataStreams = dataStreamsMatch ? parseInt(dataStreamsMatch[1]) : 2;
      const antennaGain = antennaGainMatch ? parseInt(antennaGainMatch[1]) : 6;
      const fadeMargin = fadeMarginMatch ? parseInt(fadeMarginMatch[1]) : 10;
      const powerLimit = powerLimitMatch ? parseInt(powerLimitMatch[1]) : 30;

      // Calculate max distance based on physics
      const wavelength = 299792458 / (frequency * 1000000);
      const maxDistance = Math.sqrt((4 * Math.PI * antennaGain * 2) / (wavelength * wavelength)) * 0.001;

      // Generate data points for throughput chart
      const chartData = [];
      const distances = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5];

      for (const distance of distances) {
        if (distance > maxDistance * 1.2) continue;

        // Calculate Free Space Path Loss
        const fspl = 20 * Math.log10(distance * 1000) + 20 * Math.log10(frequency) + 20 * Math.log10((4 * Math.PI) / 3);

        // Calculate Received Power
        const txPower = powerLimit;
        const rxPower = txPower - fspl + antennaGain + antennaGain;

        // Calculate SNR (assuming -90 dBm noise floor)
        const noiseFloor = -90;
        const snr = rxPower - noiseFloor;

        // Calculate theoretical throughput using Shannon-Hartley with practical adjustments
        const spectralEfficiency = Math.min(Math.log2(1 + Math.pow(10, snr / 10)), dataStreams * 8);
        const throughput = (bandwidth * spectralEfficiency) * (payload / (payload + 40)) * 0.7; // 70% efficiency factor

        // Calculate Fresnel zone clearance
        const fresnelRadius = Math.sqrt((wavelength * distance * 1000) / 4);
        const fresnelClearanceMeters = fresnelRadius * 0.6; // 60% clearance

        chartData.push({
          distance,
          throughput: Math.round(throughput * 10) / 10,
          snr: Math.round(snr * 10) / 10,
          rxPower: Math.round(rxPower * 10) / 10,
          fresnelClearance: Math.round(fresnelClearanceMeters * 100) / 100
        });
      }

      return {
        chartData,
        maxDistance: Math.round(maxDistance * 100) / 100,
        parameters: {
          frequency,
          bandwidth,
          antennas,
          dataStreams,
          antennaGain,
          fadeMargin,
          powerLimit
        }
      };
    } catch (error) {
      console.error("Throughput calculation error:", error);
      return null;
    }
  };

  const calculateRange = (input: string) => {
    try {
      // Extract parameters from the input
      const frequencyMatch = input.match(/Frequency\s*\(MHz\)\s*(\d+)/i);
      const bandwidthMatch = input.match(/Bandwidth\s*\(MHz\)\s*(\d+)/i);
      const antennaGainMatch = input.match(/Antenna\s*Gain\s*\(dBi\)\s*(\d+)/i);
      const powerLimitMatch = input.match(/Power\s*Limit\s*\(dBm\)\s*(\d+)/i);
      const climateMatch = input.match(/Climate\s*Condition\s*([a-zA-Z\s]+)/i);

      if (!frequencyMatch) {
        throw new Error("Missing required parameters");
      }

      const frequency = parseInt(frequencyMatch[1]);
      const bandwidth = bandwidthMatch ? parseInt(bandwidthMatch[1]) : 20;
      const antennaGain = antennaGainMatch ? parseInt(antennaGainMatch[1]) : 6;
      const powerLimit = powerLimitMatch ? parseInt(powerLimitMatch[1]) : 30;
      const climate = climateMatch ? climateMatch[1].trim() : "Clear Sky";

      // Environment factors
      const environmentFactors = {
        "Clear Sky": 1.0,
        "Light Rain": 0.8,
        "Moderate Rain": 0.65,
        "Heavy Rain": 0.5,
        "Fog": 0.7,
        "Urban": 0.6,
        "Dense Urban": 0.4
      };

      const envFactor = environmentFactors[climate as keyof typeof environmentFactors] || 1.0;

      // Calculate maximum theoretical range
      const wavelength = 299792458 / (frequency * 1000000);
      const linkBudget = powerLimit - (-90) + antennaGain * 2; // in dB, includes both antennas
      const pathLoss = 20 * Math.log10(4 * Math.PI / wavelength);
      const maxDistance = Math.pow(10, (linkBudget - pathLoss) / 20) * envFactor / 1000; // in km

      // Generate data points for range chart
      const chartData = [];
      const distances = [];

      // Generate distance points
      const maxRangeKm = Math.ceil(maxDistance);
      for (let i = 0; i <= 10; i++) {
        const distance = maxRangeKm * i / 10;
        if (distance === 0) continue; // Skip zero distance
        distances.push(distance);
      }

      for (const distance of distances) {
        // Calculate Free Space Path Loss
        const fspl = 20 * Math.log10(distance * 1000) + 20 * Math.log10(frequency) + 20 * Math.log10((4 * Math.PI) / 3);

        // Calculate Received Power
        const txPower = powerLimit;
        const rxPower = txPower - fspl + antennaGain + antennaGain;

        // Calculate SNR (assuming -90 dBm noise floor)
        const noiseFloor = -90;
        const snr = rxPower - noiseFloor;

        // Calculate Fresnel zone
        const fresnelRadius = 17.3 * Math.sqrt((distance * wavelength) / (4 * frequency));

        chartData.push({
          distance,
          rxPower: Math.round(rxPower * 10) / 10,
          snr: Math.round(snr * 10) / 10,
          fresnelRadius: Math.round(fresnelRadius * 100) / 100,
          linkQuality: rxPower > -75 ? "Good" : rxPower > -85 ? "Fair" : "Poor"
        });
      }

      return {
        chartData,
        maxDistance: Math.round(maxDistance * 100) / 100,
        parameters: {
          frequency,
          bandwidth,
          antennaGain,
          powerLimit,
          climate
        }
      };
    } catch (error) {
      console.error("Range calculation error:", error);
      return null;
    }
  };
  const router = useRouter();
  const { activeTool, setActiveTool } = useToolContext();
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [expandedCharts, setExpandedCharts] = useState<number[]>([]);
  const [assistantMode, setAssistantMode] = useState<'chat' | 'expert'>('expert');
  const [showFeedback, setShowFeedback] = useState<number | null>(null);
  const [animateInput, setAnimateInput] = useState(false);
  const [activeChartTab, setActiveChartTab] = useState<'throughput' | 'snr' | 'coverage'>('throughput');

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm your Mesh Rider AI Assistant by Doodle Labs. How can I help optimize your wireless mesh network today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (activeTool) setShowSuggestions(true);
  }, [activeTool]);

  const handleThroughputRequest = (input: string) => {
    const frequencyMatch = input.match(/(?:frequency|freq|ghz|mhz)[:\s]*(\d+)/i);
    const bandwidthMatch = input.match(/(?:bandwidth|bw)[:\s]*(\d+)/i);
    const throughputKeywords = /(?:throughput|speed|data rate|calculate throughput)/i.test(input);
    const productMatch = input.match(/(?:RM-\d+|Smart Radio|MIMO Radio)/i);

    if (throughputKeywords || (productMatch && input.toLowerCase().includes("calculate"))) {
      const frequency = frequencyMatch ? parseInt(frequencyMatch[1]) : 5800;
      const bandwidth = bandwidthMatch ? parseInt(bandwidthMatch[1]) : 20;
      const distanceMatch = input.match(/(?:at|range|distance)[:\s]*(\d+(?:\.\d+)?)\s*(?:km|kilometer)/i);
      const distance = distanceMatch ? parseFloat(distanceMatch[1]) : 1;

      const formattedInput = `Frequency (MHz) ${frequency} Bandwidth (MHz) ${bandwidth} Power Limit (dBm) 30 Antenna Gain (dBi) 6`;
      const calculationResult = calculateThroughput(formattedInput);

      if (calculationResult) {
        const relevantData = calculationResult.chartData.find(d =>
          Math.abs(d.distance - distance) ===
          Math.min(...calculationResult.chartData.map(p => Math.abs(p.distance - distance)))
        );

        const response: Message = {
          role: 'assistant',
          content: `I've calculated the throughput for ${productMatch ? productMatch[0] : "your radio"} at ${distance}km in clear weather:
  
  📡 **Parameters:**
  • Frequency: ${calculationResult.parameters.frequency} MHz
  • Bandwidth: ${calculationResult.parameters.bandwidth} MHz
  • Antennas: ${calculationResult.parameters.antennas}
  • Data Streams: ${calculationResult.parameters.dataStreams}
  • Antenna Gain: ${calculationResult.parameters.antennaGain} dBi
  • Power Limit: ${calculationResult.parameters.powerLimit} dBm
  
  📊 **Results for ${distance}km distance:**
  • Throughput: ${relevantData?.throughput || "N/A"} Mbps
  • Signal-to-Noise Ratio: ${relevantData?.snr || "N/A"} dB
  • Signal Quality: ${relevantData && relevantData.snr !== undefined ? (relevantData.snr > 25 ? "Excellent" : relevantData.snr > 15 ? "Good" : relevantData.snr > 10 ? "Fair" : "Poor") : "Unknown"}
  
  📈 **Throughput across distance:**
  ${calculationResult.chartData.map(point => `• At ${point.distance}km: ${point.throughput} Mbps (SNR: ${point.snr} dB)`).join('\n')}
  
  For optimal performance, maintain line-of-sight and ensure proper Fresnel zone clearance of at least ${relevantData?.fresnelClearance || "0.6"}m.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          productRecommendations: ["RM-1700 Smart Radio", "RM-5700 MIMO Radio"],
          charts: calculationResult.chartData
        };

        setMessages(prev => [...prev, response]);
        setExpandedCharts(prev => [...prev, messages.length]);
        return true;
      }
    }

    return false;
  };


  const handleRangeRequest = (input: string) => {
    const frequencyMatch = input.match(/(?:frequency|freq|ghz|mhz)[:\s]*(\d+)/i);
    const rangeKeywords = /(?:range|distance|coverage|calculate range)/i.test(input);
    const productMatch = input.match(/(?:RM-\d+|Smart Radio|MIMO Radio)/i);

    if (rangeKeywords || (productMatch && input.toLowerCase().includes("distance"))) {
      const frequency = frequencyMatch ? parseInt(frequencyMatch[1]) : 5800;

      const weatherConditions = ["Clear Sky", "Light Rain", "Moderate Rain", "Heavy Rain", "Fog", "Urban", "Dense Urban"];
      let climate = "Clear Sky";

      for (const condition of weatherConditions) {
        if (input.toLowerCase().includes(condition.toLowerCase())) {
          climate = condition;
          break;
        }
      }

      const formattedInput = `Frequency (MHz) ${frequency} Climate Condition ${climate}`;
      const calculationResult = calculateRange(formattedInput);

      if (calculationResult) {
        const response: Message = {
          role: 'assistant',
          content: `I've calculated the range for ${productMatch ? productMatch[0] : "your radio"} in ${climate} conditions:
  
  📡 **Parameters:**
  • Frequency: ${calculationResult.parameters.frequency} MHz
  • Bandwidth: ${calculationResult.parameters.bandwidth} MHz
  • Antenna Gain: ${calculationResult.parameters.antennaGain} dBi
  • Power Limit: ${calculationResult.parameters.powerLimit} dBm
  • Climate: ${calculationResult.parameters.climate}
  
  📊 **Results:**
  • Maximum theoretical range: ${calculationResult.maxDistance} km
  • Signal quality at 1km: ${calculationResult.chartData.find(d => Math.abs(d.distance - 1) < 0.1)?.linkQuality || 'N/A'}
  • SNR at 1km: ${calculationResult.chartData.find(d => Math.abs(d.distance - 1) < 0.1)?.snr || 'N/A'} dB
  
  📈 **Range Analysis:**
  ${calculationResult.chartData.filter((_, i) => i % 2 === 0).map(point => `• At ${point.distance.toFixed(1)}km: Signal ${point.linkQuality} (${point.rxPower} dBm), SNR: ${point.snr} dB`).join('\n')}
  
  ⚠️ **Environmental Impact:** ${calculationResult.parameters.climate !== "Clear Sky" ?
              `${calculationResult.parameters.climate} conditions reduce maximum range by approximately ${Math.round((1 - environmentFactors[calculationResult.parameters.climate as keyof typeof environmentFactors]) * 100)}%.` :
              "Clear sky conditions provide optimal signal propagation."}
  
  For optimal performance, ensure proper Fresnel zone clearance and maintain line-of-sight between nodes.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          productRecommendations: ["RM-2450 OEM Module", "RM-3100 Wearable Radio"],
          charts: calculationResult.chartData
        };

        setMessages(prev => [...prev, response]);
        setExpandedCharts(prev => [...prev, messages.length]);
        return true;
      }
    }
    return false;
  };

  const handleLogAnalysisRequest = (input: string) => {
    if (input.toLowerCase().includes('log') ||
      input.toLowerCase().includes('analyze') ||
      input.toLowerCase().includes('packet loss')) {

      const response: Message = {
        role: 'assistant',
        content: `To analyze network logs, I'll need you to upload your log file first. 

📊 **Log Analysis Capabilities:**
• Signal strength trends
• Packet loss patterns
• Link quality metrics
• Noise floor monitoring
• Throughput performance
• Station connectivity

Please upload your Mesh Rider log file (.log, .txt, or .tar.gz) using the upload function in the Log Analyzer tool, or share specific metrics you want to analyze from your logs.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, response]);
      return true;
    }
    return false;
  };

  const handleGeneralInfo = (input: string) => {
    if (input.toLowerCase().includes('rssi') && input.toLowerCase().includes('snr')) {
      const response: Message = {
        role: 'assistant',
        content: `RSSI (Received Signal Strength Indicator) and SNR (Signal-to-Noise Ratio) are key RF performance metrics:

RSSI measures the power of received radio signals in dBm:
• Good: -65 dBm or higher
• Fair: -75 to -65 dBm
• Poor: Below -75 dBm

SNR represents signal quality relative to background noise:
• Excellent: Above 25 dB
• Good: 15-25 dB
• Fair: 10-15 dB
• Poor: Below 10 dB

For accurate measurements of your specific network, I recommend using our Range Calculator or Throughput tools.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, response]);
      return true;
    }
    return false;
  };

  const sendMessage = async (inputText: string) => {
    if (!inputText.trim() || isLoading) return false;
    try {
      setIsLoading(true);
      setLastError(null);
      const userMessage: Message = {
        role: 'user',
        content: inputText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, userMessage]);

      // Try handling with local handlers first
      if (handleProductRecommendation(inputText) ||
        handleThroughputRequest(inputText) ||
        handleRangeRequest(inputText) ||
        handleLogDataInput(inputText)) {
        setIsLoading(false);
        return true;
      }

      // Otherwise use API with enhancedPrompt
      const systemPrompt = "You are a highly technical Mesh Rider AI Assistant specialized in wireless mesh network optimization.";
      // Create enhancedPrompt directly instead of using function
      let enhancedPrompt = systemPrompt;

      if (activeTool === 'range') {
        enhancedPrompt += '\nYou are using the Range Calculator tool. Provide precise calculations for signal propagation distance.';
      } else if (activeTool === 'throughput') {
        enhancedPrompt += '\nYou are using the Throughput Calculator tool. Calculate expected data rates at different distances.';
      } else if (activeTool === 'coverage') {
        enhancedPrompt += '\nYou are using the Coverage Mapper tool. Analyze expected network coverage based on configuration.';
      } else if (activeTool === 'logviewer') {
        enhancedPrompt += '\nYou are using the Log Analyzer tool. Identify patterns and optimizations from network logs.';
      }

      const payloadMessages = [
        { role: 'system', content: enhancedPrompt },
        ...messages.filter(m => m.role === 'user' || m.role === 'assistant')
          .slice(-10)
          .map(msg => ({ role: msg.role, content: msg.content })),
        { role: 'user', content: inputText }
      ];

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: payloadMessages,
          context: { activeTool, logFileContent: '' }
        })
      });

      if (!res.ok) throw new Error(`API response error: ${res.status}`);
      const data = await res.json();
      const aiResponseText = data.content;

      // Process the response manually instead of using enhanceAIResponse
      let responseMessage: Message = {
        role: 'assistant',
        content: aiResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      // Add charts if appropriate
      if (activeTool === 'throughput' || inputText.toLowerCase().includes('throughput')) {
        responseMessage.charts = generateThroughputData(inputText);
      } else if (activeTool === 'range' || inputText.toLowerCase().includes('range')) {
        responseMessage.charts = generateRangeData(inputText);
      }

      // Add product recommendations if appropriate
      if (inputText.toLowerCase().includes('product') || inputText.toLowerCase().includes('radio')) {
        const productMatches = aiResponseText.match(/RM-\d+[-\w]*/g);
        if (productMatches) {
          const uniqueProducts: string[] = Array.from(new Set(productMatches));
          responseMessage.productRecommendations = uniqueProducts.slice(0, 2);
        }
      }

      setMessages(prev => [...prev, responseMessage]);
      return true;
    } catch (error) {
      setLastError(error instanceof Error ? error.message : 'Unknown error');
      toast.error("Error processing request. Please try again.");
      const errorMsg: Message = {
        role: 'assistant',
        content: "I'm sorry, but I encountered an error processing your request. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  const generateThroughputData = (query: string): any[] => {
    const distance = query.match(/(\d+(?:\.\d+)?)\s*(?:km|kilometer)/i);
    const distanceValue = distance ? parseFloat(distance[1]) : 2;

    const frequency = query.match(/(\d+)\s*(?:mhz|ghz)/i);
    const freqValue = frequency ? parseInt(frequency[1]) : 5800;

    const data = [];
    const maxDistance = Math.min(10, distanceValue * 2);

    for (let d = 0.5; d <= maxDistance; d += 0.5) {
      const snr = Math.max(5, 40 - (d * 5 * (freqValue > 3000 ? 1.5 : 1)));
      const throughput = Math.max(1, 100 * Math.exp(-d / (freqValue > 3000 ? 2 : 3)));

      data.push({
        distance: d,
        throughput: Math.round(throughput * 10) / 10,
        snr: Math.round(snr * 10) / 10,
        fresnelClearance: Math.round(17.3 * Math.sqrt((d * 0.299) / (4 * freqValue * 0.001)) * 100) / 100
      });
    }

    return data;
  };

  const generateRangeData = (query: string): any[] => {
    const frequency = query.match(/(\d+)\s*(?:mhz|ghz)/i);
    const freqValue = frequency ? parseInt(frequency[1]) : 5800;

    const isUrban = query.toLowerCase().includes('urban') || query.toLowerCase().includes('city');
    const isRainy = query.toLowerCase().includes('rain') || query.toLowerCase().includes('wet');

    const data = [];

    const maxRangeKm = freqValue > 3000 ?
      (isUrban ? 2 : 5) :
      (isUrban ? 5 : 10);

    for (let d = 0.5; d <= maxRangeKm; d += 0.5) {
      const rxPower = -50 - (20 * Math.log10(d) * (freqValue > 3000 ? 1.2 : 1));
      const noiseFloor = -90;

      data.push({
        distance: d,
        rxPower: Math.round(rxPower * 10) / 10,
        snr: Math.round((rxPower - noiseFloor) * 10) / 10,
        linkQuality: rxPower > -65 ? "Excellent" : rxPower > -75 ? "Good" : rxPower > -85 ? "Fair" : "Poor"
      });
    }

    return data;
  };
  const handleProductRecommendation = (input: string): boolean => {
    if (!/which|recommend|best|suitable|work best|deployment|product|radio|doodle/i.test(input)) {
      return false;
    }

    let environmentScore = {
      suburban: input.toLowerCase().includes("suburban") ? 10 : 0,
      urban: input.toLowerCase().includes("urban") ? 10 : 0,
      rural: input.toLowerCase().includes("rural") || input.toLowerCase().includes("remote") ? 10 : 0
    };

    if (!environmentScore.suburban && !environmentScore.urban && !environmentScore.rural) {
      environmentScore.suburban = 5;
    }

    if (input.toLowerCase().includes("building") || input.toLowerCase().includes("dense")) {
      environmentScore.urban += 5;
    }

    if (input.toLowerCase().includes("distance") || input.toLowerCase().includes("far") || input.toLowerCase().includes("range")) {
      environmentScore.rural += 5;
    }

    const formFactorScore: Record<string, number> = {
      "OEM": (input.toLowerCase().includes("oem") || input.toLowerCase().includes("embed")) ? 10 : 0,
      "Mini-OEM": (input.toLowerCase().includes("mini") || input.toLowerCase().includes("small")) ? 10 : 0,
      "Wearable": (input.toLowerCase().includes("wear") || input.toLowerCase().includes("portable")) ? 10 : 0
    };

    const frequencyScore = {
      "900": (input.toLowerCase().includes("900") || input.toLowerCase().includes("915")) ? 10 : 0,
      "2400": (input.toLowerCase().includes("2.4") || input.toLowerCase().includes("2450")) ? 10 : 0,
      "5000": (input.toLowerCase().includes("5") || input.toLowerCase().includes("5ghz")) ? 10 : 0
    };

    const productScores = productModels.map(product => {
      let score = 0;

      const formFactor = product.formFactor.type;
      score += formFactorScore[formFactor] || 0;

      if (product.frequencyBand.includes("902-928") || product.frequencyBand.includes("915")) {
        score += frequencyScore["900"];
        score += environmentScore.rural * 2;
        score += environmentScore.suburban;
      }

      if (product.frequencyBand.includes("2400-2482") || product.frequencyBand.includes("2450")) {
        score += frequencyScore["2400"];
        score += environmentScore.suburban * 1.5;
        score += environmentScore.urban;
      }

      if (product.frequencyBand.includes("5150-5895") || product.frequencyBand.includes("5GHz")) {
        score += frequencyScore["5000"];
        score += environmentScore.urban * 2;
      }

      if (product.formFactor.type === "Wearable" &&
        (input.toLowerCase().includes("portable") || input.toLowerCase().includes("mobile"))) {
        score += 10;
      }

      if (product.formFactor.ingressProtection && input.toLowerCase().includes("outdoor")) {
        score += 10;
      }

      if (product.applications.some(app => input.toLowerCase().includes(app.toLowerCase()))) {
        score += 15;
      }

      return { product, score };
    });

    productScores.sort((a, b) => b.score - a.score);

    const topRecommendations = productScores.slice(0, 2).map(item => item.product);

    if (topRecommendations.length > 0) {
      const primaryRecommendation = topRecommendations[0];
      const environmentType = Object.entries(environmentScore).reduce((a, b) => a[1] > b[1] ? a : b)[0];

      const response: Message = {
        role: 'assistant',
        content: `Based on your requirements, I recommend the ${primaryRecommendation.id} (${primaryRecommendation.name}).
  
  📡 Specifications:
  • Frequency Band: ${primaryRecommendation.frequencyBand}
  • Max Throughput: ${primaryRecommendation.specifications.maxThroughput}
  • Max Range: ${primaryRecommendation.specifications.maxRange}
  • TX Power: ${primaryRecommendation.specifications.maxTxPower}
  
  💡 Key features:
  ${primaryRecommendation.features.map(f => `• ${f}`).join('\n')}
  
  This model is particularly suited for ${environmentType} environments and offers excellent performance characteristics for your deployment needs.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        productRecommendations: topRecommendations.map(p => p.id)
      };

      setMessages(prev => [...prev, response]);
      return true;
    }

    return false;
  };

  const clearMessages = () => {
    setMessages([
      {
        role: 'assistant',
        content: "Hello! I'm your Mesh Rider AI Assistant by Doodle Labs. How can I help optimize your wireless mesh network today?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    toast.success("Conversation history cleared");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (await sendMessage(input)) setInput('');
  };

  const handleCopyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const toggleChartExpansion = (index: number) => {
    setExpandedCharts(expandedCharts.includes(index)
      ? expandedCharts.filter(i => i !== index)
      : [...expandedCharts, index]
    );
  };

  const suggestions = {
    general: [
      "What's the difference between RSSI and SNR?",
      "How do environmental factors affect my mesh network?",
      "Which Doodle Labs radio would work best for my deployment?"
    ],
    range: [
      "Calculate maximum range for 5GHz at 20MHz bandwidth",
      "How to optimize my antenna setup for rainy environments?",
      "What's the impact of multipath fading on my network?"
    ],
    throughput: [
      "Calculate throughput at 2km using RM-1700 in clear weather",
      "What MCS rate should I expect with -65dBm RSSI?",
      "Bandwidth vs range tradeoffs for my Smart Radio"
    ],
    logviewer: [
      "Analyze this log for network bottlenecks",
      "What's causing packet loss between these nodes?",
      "How to improve mesh stability in my topology?"
    ]
  };

  const getActiveSuggestions = () => {
    if (activeTool === 'range') return [...suggestions.range, ...suggestions.general];
    if (activeTool === 'throughput') return [...suggestions.throughput, ...suggestions.general];
    if (activeTool === 'logviewer' || activeTool === 'logviewer-analysis') return [...suggestions.logviewer, ...suggestions.general];
    return suggestions.general;
  };

  const handleSuggestionClick = (s: string) => {
    setInput(s);
    setAnimateInput(true);
    if (inputRef.current) inputRef.current.focus();
  };
  const [showThroughputDetailsModal, setShowThroughputDetailsModal] = useState(false);

  const renderProductRecommendation = (productId: string) => {

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mt-4 p-4 rounded-xl bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border border-indigo-700/50 shadow-lg"
      >
        <div className="flex items-center gap-3 mb-2">
          <Radio className="h-5 w-5 text-indigo-400" />
          <h4 className="text-base font-medium text-white">Recommended Product</h4>
        </div>
        <div className="flex flex-col md:flex-row items-start gap-4">
          <div className="bg-black/30 rounded-lg p-2 flex items-center justify-center">
            <Wifi className="h-12 w-12 text-indigo-500" />
          </div>
          <div>
            <h5 className="text-lg font-semibold text-white">{productId}</h5>
            <p className="text-gray-300 mt-1">Optimized for your specific network requirements</p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  setShowThroughputDetailsModal(true);
                  // setActiveTool('throughput');
                  // router.push('/');
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors"
              >
                View Details
              </button>
              <button className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-md transition-colors">
                Compare
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col h-full min-h-screen bg-gray-900">
      {/* Header Section */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex items-center mb-6"
          >
            <div className="flex items-center">
              <img
                src="https://learn.doodlelabs.com/hubfs/mesh%20rider%20logo.png"
                alt="Mesh Rider Logo"
                className="h-12 w-auto mr-4"
              />
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Mesh Rider AI Assistant
                </h1>
                <p className="text-gray-400 mt-1">
                  RF performance analyzer for mesh network planning and optimization
                </p>
              </div>
            </div>
          </motion.div>

          <div className="flex flex-wrap gap-2 md:gap-4 mb-2">
            <button
              onClick={() => setAssistantMode('chat')}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${assistantMode === 'chat'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/30'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Chat Mode
            </button>
            <button
              onClick={() => setAssistantMode('expert')}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${assistantMode === 'expert'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-900/30'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
            >
              <div className="relative">
                <Sparkles className="w-4 h-4 mr-2" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full"></div>
              </div>
              <span>Expert Mode</span>
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-md bg-amber-500/20 text-amber-400 font-medium">PRO</span>
            </button>

            <button
              onClick={clearMessages}
              className="flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors ml-auto"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              New Chat
            </button>

            <button
              onClick={() => {
                setActiveTool(null);
                router.push('/');
              }}
              className="flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              Back to Toolbox
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tools Panel - Left Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-gray-800 rounded-xl p-5 border border-gray-700 shadow-lg"
            >
              <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                <Radio className="w-5 h-5 mr-2 text-violet-400" />
                Network Tools
              </h3>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setActiveTool('range');
                    router.push('/');
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-200 transition-all">
                  <div className="flex items-center">
                    <Signal className="w-5 h-5 mr-3 text-blue-400" />
                    <span>Range Calculator</span>
                  </div>
                  <ChevronDown size={16} />
                </button>

                <button
                  onClick={() => {
                    setActiveTool('throughput');
                    router.push('/');
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-200 transition-all">
                  <div className="flex items-center">
                    <BarChart2 className="w-5 h-5 mr-3 text-amber-400" />
                    <span>Throughput Analyzer</span>
                  </div>
                  <ChevronDown size={16} />
                </button>

                <button
                  onClick={() => {
                    setActiveTool('coverage');
                    router.push('/');
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-200 transition-all">
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 mr-3 text-emerald-400" />
                    <span>Coverage Mapper</span>
                  </div>
                  <ChevronDown size={16} />
                </button>

                <button
                  onClick={() => {
                    setActiveTool('logviewer');
                    router.push('/');
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-200 transition-all">
                  <div className="flex items-center">
                    <Activity className="w-5 h-5 mr-3 text-red-400" />
                    <span>Log Analyzer</span>
                  </div>
                  <ChevronDown size={16} />
                </button>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-700">
                <h4 className="text-sm font-medium text-gray-400 mb-3">HARDWARE MODELS</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setActiveTool('app');
                      router.push('/');
                    }}
                    className="w-full text-left p-2 rounded hover:bg-gray-700/50 text-gray-300 transition-colors text-sm flex items-center">
                    <Wifi className="w-4 h-4 mr-2 text-indigo-400" />
                    RM-1700 Smart Radio
                  </button>
                  <button
                    onClick={() => {
                      setActiveTool('app');
                      router.push('/');
                    }}
                    className="w-full text-left p-2 rounded hover:bg-gray-700/50 text-gray-300 transition-colors text-sm flex items-center">
                    <Wifi className="w-4 h-4 mr-2 text-indigo-400" />
                    RM-2450 OEM Module
                  </button>
                  <button
                    onClick={() => {
                      setActiveTool('app');
                      router.push('/');
                    }}
                    className="w-full text-left p-2 rounded hover:bg-gray-700/50 text-gray-300 transition-colors text-sm flex items-center">
                    <Wifi className="w-4 h-4 mr-2 text-indigo-400" />
                    RM-3100 Wearable Radio
                  </button>
                  <button
                    onClick={() => {
                      setActiveTool('app');
                      router.push('/');
                    }}
                    className="w-full text-left p-2 rounded hover:bg-gray-700/50 text-gray-300 transition-colors text-sm flex items-center">
                    <Wifi className="w-4 h-4 mr-2 text-indigo-400" />
                    RM-5700 MIMO Radio
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Main Chat Panel */}
          <div className="lg:col-span-2">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg overflow-hidden h-full flex flex-col"
            >
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-gray-800 to-gray-750 p-4 border-b border-gray-700 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-violet-600/20 mr-3">
                    <Bot className="h-5 w-5 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-white">AI Assistant</h3>
                    <p className="text-xs text-gray-400">Powered by Doodle Labs</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-300 transition-colors"
                    onClick={clearMessages}
                  >
                    <RefreshCw size={16} />
                  </button>
                  <button className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-300 transition-colors">
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    variants={itemVariants}
                    className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`max-w-3xl ${msg.role === 'assistant' ? 'bg-gray-750 border-gray-700' : 'bg-indigo-900/30 border-indigo-800'} rounded-xl p-4 border shadow-md`}>
                      <div className="flex items-center mb-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${msg.role === 'assistant' ? 'bg-violet-600/30' : 'bg-indigo-600/30'}`}>
                          {msg.role === 'assistant' ?
                            <Bot className="h-4 w-4 text-violet-400" /> :
                            <User className="h-4 w-4 text-indigo-400" />
                          }
                        </div>
                        <div className="flex justify-between items-center w-full">
                          <span className="text-sm font-medium text-gray-300">
                            {msg.role === 'assistant' ? 'Mesh Rider Assistant' : 'You'}
                          </span>
                          <span className="text-xs text-gray-500">{msg.timestamp}</span>
                        </div>
                      </div>
                      <div className="pl-10 text-gray-200 whitespace-pre-line">
                        {msg.content}
                      </div>
                      {msg.charts && msg.charts.length > 0 && (
                        <div className="mt-6 h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <RLineChart data={msg.charts} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                              <XAxis
                                dataKey="distance"
                                label={{ value: "Distance (m)", position: "insideBottom", offset: -10, fill: "#94a3b8" }}
                                stroke="#94a3b8"
                                tick={{ fill: "#94a3b8" }}
                              />
                              <YAxis
                                yAxisId="left"
                                label={{ value: "Throughput (Mbps)", angle: -90, position: "insideLeft", offset: 10, fill: "#f59e0b" }}
                                stroke="#f59e0b"
                                tick={{ fill: "#94a3b8" }}
                              />
                              <YAxis
                                yAxisId="right"
                                orientation="right"
                                label={{ value: "Fresnel Zone (m)", angle: 90, position: "insideRight", offset: 10, fill: "#22c55e" }}
                                stroke="#22c55e"
                                tick={{ fill: "#94a3b8" }}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "rgba(17,24,39,0.95)",
                                  borderColor: "#4b5563",
                                  color: "#e5e7eb",
                                  borderRadius: "0.5rem",
                                  border: "none"
                                }}
                                labelStyle={{ color: "#f3f4f6", fontWeight: "bold" }}
                                itemStyle={{ padding: "0.25rem 0" }}
                              />
                              <Legend wrapperStyle={{ paddingTop: "1rem" }} />
                              <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="throughput"
                                name="Throughput (Mbps)"
                                stroke="#f59e0b"
                                strokeWidth={3}
                                dot={{ stroke: "#f59e0b", strokeWidth: 2, r: 4, fill: "#f59e0b" }}
                                activeDot={{ stroke: "#f59e0b", strokeWidth: 2, r: 6, fill: "#f59e0b" }}
                                animationDuration={1500}
                              />
                              <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="fresnelClearance"
                                name="Fresnel Zone (m)"
                                stroke="#22c55e"
                                strokeWidth={3}
                                dot={{ stroke: "#22c55e", strokeWidth: 2, r: 4, fill: "#22c55e" }}
                                activeDot={{ stroke: "#22c55e", strokeWidth: 2, r: 6, fill: "#22c55e" }}
                                animationDuration={1500}
                                animationBegin={300}
                              />
                            </RLineChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                   
                      {msg.charts && msg.charts.length > 0 && (
                        <div className="mt-6 bg-gray-850 rounded-xl overflow-hidden border border-gray-700 shadow-lg">
                          <div className="bg-gradient-to-r from-gray-800 to-gray-750 p-4 border-b border-gray-700">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center">
                                <Wifi className="h-5 w-5 mr-2 text-violet-400" />
                                <h4 className="text-base font-medium text-white">RF Performance Analysis</h4>
                              </div>
                              <button
                                onClick={() => toggleChartExpansion(i)}
                                className="p-1.5 bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition-colors"
                              >
                                {expandedCharts.includes(i) ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Product recommendations */}
                      {msg.productRecommendations && msg.productRecommendations.length > 0 && msg.productRecommendations.map((p, index) => (
                        <div key={index}>{renderProductRecommendation(p)}</div>
                      ))}

                      {/* Message actions */}
                      <div className="mt-3 pl-10 flex items-center gap-4">
                        <div
                          onClick={() => handleCopyToClipboard(msg.content ?? '', i)}
                          className="flex items-center gap-1 text-gray-400 hover:text-gray-200 cursor-pointer transition-colors"
                        >
                          {copiedIndex === i ? <Check size={14} /> : <Copy size={14} />}
                          <span className="text-xs">{copiedIndex === i ? 'Copied' : 'Copy'}</span>
                        </div>

                        {msg.role === 'assistant' && (
                          <div className="flex items-center gap-2">
                            <button className="flex items-center gap-1 text-gray-400 hover:text-green-400 transition-colors">
                              <ThumbsUp size={14} />
                              <span className="text-xs">Helpful</span>
                            </button>
                            <button className="flex items-center gap-1 text-gray-400 hover:text-red-400 transition-colors">
                              <ThumbsDown size={14} />
                              <span className="text-xs">Not helpful</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />

                {/* Loading indicator */}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-gray-750 border-gray-700 rounded-xl p-4 border shadow-md max-w-3xl">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-violet-600/30 flex items-center justify-center mr-2">
                          <Loader2 className="h-4 w-4 text-violet-400 animate-spin" />
                        </div>
                        <span className="text-sm font-medium text-gray-300">Mesh Rider Assistant is thinking...</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Suggestions */}
              {showSuggestions && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="p-4 border-t border-gray-700 bg-gray-850"
                >
                  <h4 className="text-sm font-medium text-gray-400 mb-3">SUGGESTED QUERIES</h4>
                  <div className="flex flex-wrap gap-2">
                    {getActiveSuggestions().slice(0, 4).map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleSuggestionClick(s)}
                        className="px-3 py-2 bg-gray-700/70 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors border border-gray-600"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
                {/* Input Area */}
                <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700 bg-gray-800">
                <div className="flex items-start gap-2">
                  <motion.div
                  animate={animateInput ? { scale: [1, 1.02, 1] } : {}}
                  transition={{ duration: 0.3 }}
                  className="flex-1 relative"
                  >
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onFocus={() => setAnimateInput(false)}
                    placeholder="Type your message or question here..."
                    rows={3}
                    className="w-full p-3 bg-gray-750 border border-gray-700 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none text-black placeholder-gray-500 resize-none"
                  />
                  {input.length > 0 && (
                    <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    type="button"
                    onClick={() => setInput('')}
                    className="absolute right-3 top-3 p-1 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-400"
                    >
                    <X size={14} />
                    </motion.button>
                  )}
                  </motion.div>
                  <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className={`p-3 rounded-xl ${isLoading || !input.trim()
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-900/30 hover:from-violet-500 hover:to-indigo-500'
                    } transition-all`}
                  >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  </motion.button>
                </div>


                {lastError && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 p-2 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 text-sm flex items-center"
                  >
                    <X className="h-4 w-4 mr-2" />
                    {lastError}
                  </motion.div>
                )}

                <div className="mt-3 text-xs text-gray-500 flex items-center justify-between">
                  <span>Powered by Doodle Labs</span>
                  <button type="button" onClick={() => setShowSuggestions(!showSuggestions)} className="text-gray-400 hover:text-gray-300">
                    {showSuggestions ? 'Hide suggestions' : 'Show suggestions'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AIAssistant;
