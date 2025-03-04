import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, ReferenceLine, AreaChart, Area
} from "recharts";
import {
  Sliders, Wifi, BarChart2, ChevronDown, ChevronUp, RefreshCw,
  Info, Zap, Activity, Map, Box, Layers
} from "lucide-react";

// Import common components, types and utilities
import {
  InputField, DeviceCard, containerVariants, itemVariants, fadeIn, CustomTooltip
} from "./common/index";
import {
  RadioModels, DeviceDetails, ChartDataPoint, SelectOption
} from "../types/common";

interface McsTableRow {
  mcs: number;
  modulation: string;
  coding: number;
  dataRate: string;
  range: number;
  throughput: number;
  snr: string;
  fresnelClearance: number;
}

const ThroughputCalculator: React.FC = () => {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("2L");
  const [frequency, setFrequency] = useState<number>(2450);
  const [bandwidth, setBandwidth] = useState<string>("20");
  const [antennas, setAntennas] = useState<string>("2");
  const [streams, setStreams] = useState<string>("2");
  const [udpPayload, setUdpPayload] = useState<number>(1500);
  const [antennaGain, setAntennaGain] = useState<number>(6);
  const [fadeMargin, setFadeMargin] = useState<number>(10);
  const [fresnelClearance, setFresnelClearance] = useState<number>(60);
  const [isOverGround, setIsOverGround] = useState<boolean>(false);
  const [powerLimit, setPowerLimit] = useState<number>(30);
  const [framesAggregated, setFramesAggregated] = useState<number>(10);
  const [calculationComplete, setCalculationComplete] = useState<boolean>(false);
  const [advancedOpen, setAdvancedOpen] = useState<boolean>(false);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [snrData, setSnrData] = useState<any[]>([]);
  const [pathLossModel, setPathLossModel] = useState<string>("free");
  const [activeTab, setActiveTab] = useState<string>("throughput");
  const [mcsTable, setMcsTable] = useState<McsTableRow[]>([]);
  const [climate, setClimate] = useState<string>("clear");
  const [temperature, setTemperature] = useState<number>(25);
  const [multiPathFading, setMultiPathFading] = useState<boolean>(false);
  const [fadingIntensity, setFadingIntensity] = useState<number>(3);

  const chartRef = useRef<HTMLDivElement>(null);

  const radioModels: RadioModels = {
    "1L": {
      power: [24, 23, 23, 23, 22, 21, 20, 18],
      sensitivity: [-87, -85, -83, -81, -77, -73, -71, -69],
      modulation: ["BPSK", "QPSK", "QPSK", "16-QAM", "16-QAM", "64-QAM", "64-QAM", "64-QAM"],
      codingRate: [1 / 2, 1 / 2, 3 / 4, 1 / 2, 3 / 4, 2 / 3, 3 / 4, 5 / 6],
      bitsPerSymbol: [1, 2, 2, 4, 4, 6, 6, 6],
    },
    "2L": {
      power: [27, 26, 26, 26, 25, 24, 23, 21],
      sensitivity: [-87, -85, -83, -81, -77, -73, -71, -69],
      modulation: ["BPSK", "QPSK", "QPSK", "16-QAM", "16-QAM", "64-QAM", "64-QAM", "64-QAM"],
      codingRate: [1 / 2, 1 / 2, 3 / 4, 1 / 2, 3 / 4, 2 / 3, 3 / 4, 5 / 6],
      bitsPerSymbol: [1, 2, 2, 4, 4, 6, 6, 6],
    },
    "2KO": {
      power: [30, 29, 29, 29, 28, 27, 26, 24],
      sensitivity: [-89, -87, -85, -83, -79, -75, -73, -71],
      modulation: ["BPSK", "QPSK", "QPSK", "16-QAM", "16-QAM", "64-QAM", "64-QAM", "64-QAM"],
      codingRate: [1 / 2, 1 / 2, 3 / 4, 1 / 2, 3 / 4, 2 / 3, 3 / 4, 5 / 6],
      bitsPerSymbol: [1, 2, 2, 4, 4, 6, 6, 6],
    },
    "2KW": {
      power: [27, 26, 26, 26, 25, 24, 23, 21],
      sensitivity: [-87, -85, -83, -81, -77, -73, -71, -69],
      modulation: ["BPSK", "QPSK", "QPSK", "16-QAM", "16-QAM", "64-QAM", "64-QAM", "64-QAM"],
      codingRate: [1 / 2, 1 / 2, 3 / 4, 1 / 2, 3 / 4, 2 / 3, 3 / 4, 5 / 6],
      bitsPerSymbol: [1, 2, 2, 4, 4, 6, 6, 6],
    },
  };

  const deviceDetails: DeviceDetails = {
    "1L": { name: "Nano-OEM", image: "/nano.png" },
    "2L": { name: "Mini-OEM", image: "/mini.png" },
    "2KO": { name: "OEM (V2)", image: "/oem.png" },
    "2KW": { name: "Wearable (V2)", image: "/wear.png" }
  };

  const bandwidthOptions: SelectOption[] = [
    { value: "3", label: "3 MHz" },
    { value: "5", label: "5 MHz" },
    { value: "10", label: "10 MHz" },
    { value: "15", label: "15 MHz" },
    { value: "20", label: "20 MHz" },
    { value: "40", label: "40 MHz" }
  ];

  const antennasOptions: SelectOption[] = [
    { value: "1", label: "1" },
    { value: "2", label: "2" }
  ];

  const streamsOptions: SelectOption[] = [
    { value: "1", label: "1" },
    { value: "2", label: "2" }
  ];

  const pathLossModelOptions: SelectOption[] = [
    { value: "free", label: "Free Space" },
    { value: "ground", label: "2-Ray Ground" },
    { value: "urban", label: "Urban" },
    { value: "suburban", label: "Suburban" }
  ];

  const climateOptions: SelectOption[] = [
    { value: "clear", label: "Clear Sky" },
    { value: "rain", label: "Rain" },
    { value: "fog", label: "Fog" },
    { value: "snow", label: "Snow" },
    { value: "humid", label: "High Humidity" }
  ];

  useEffect(() => {
    if (selectedDevice === "1L") {
      setAntennas("1");
      setStreams("1");
      if (powerLimit > 30) setPowerLimit(30);
    }
  }, [selectedDevice, powerLimit]);

  const calculatePathLoss = (distance: number, freq: number): number => {
    const freqGHz = freq / 1000;
    let baseLoss = 0;

    if (pathLossModel === "free") {
      baseLoss = 20 * Math.log10(distance) + 20 * Math.log10(freqGHz) + 92.45;
    } else if (pathLossModel === "ground") {
      const h1 = 2; // Tx height in meters
      const h2 = 2; // Rx height in meters
      baseLoss = 20 * Math.log10(distance) + 20 * Math.log10(freqGHz) + 92.45 -
        20 * Math.log10(h1 * h2) + 10;
    } else if (pathLossModel === "urban") {
      // Simplified COST-Hata model for urban areas
      baseLoss = 20 * Math.log10(distance) + 20 * Math.log10(freqGHz) + 92.45 +
        (distance < 500 ? 0 : 20) + (freqGHz > 2 ? 3 : 0);
    } else if (pathLossModel === "suburban") {
      // Simplified model for suburban areas with less obstruction
      baseLoss = 20 * Math.log10(distance) + 20 * Math.log10(freqGHz) + 92.45 +
        (distance < 500 ? 0 : 15);
    } else {
      baseLoss = 20 * Math.log10(distance) + 20 * Math.log10(freqGHz) + 92.45;
    }

    // Apply multipath fading if enabled
    // Uses Rayleigh fading model (simplified)
    if (multiPathFading) {
      // Rayleigh fading varies with distance and frequency
      // Higher intensity = more fading variation
      const fadingFactor = (Math.sin(distance * 0.3) + Math.cos(freqGHz * 2)) * fadingIntensity;
      baseLoss += fadingFactor;
    }

    // Apply climate attenuation factors
    let climateAttenuation = 0;

    switch (climate) {
      case "rain":
        // ITU-R P.838-3 model (simplified)
        // Rain attenuation increases with frequency and is significant above 5 GHz
        climateAttenuation = freqGHz > 5 ? 0.01 * Math.pow(freqGHz, 1.6) * distance / 1000 : 0.005 * freqGHz * distance / 1000;
        break;
      case "fog":
        // ITU-R P.840-6 model (simplified)
        climateAttenuation = 0.0001 * Math.pow(freqGHz, 2) * distance / 1000;
        break;
      case "snow":
        // Snow attenuation is typically higher than rain
        climateAttenuation = 0.02 * Math.pow(freqGHz, 1.6) * distance / 1000;
        break;
      case "humid":
        // Higher humidity causes additional attenuation especially at higher frequencies
        // ITU-R P.676-11 model (simplified)
        const humidityFactor = Math.abs(temperature - 25) / 10; // Temperature deviation factor
        climateAttenuation = 0.0003 * Math.pow(freqGHz, 2) * humidityFactor * distance / 1000;
        break;
      case "clear":
      default:
        climateAttenuation = 0;
    }

    // Temperature effects on electronics (simplified)
    // Extreme temperatures can degrade radio performance
    let temperatureEffect = 0;
    if (temperature < 0) {
      temperatureEffect = Math.abs(temperature) * 0.05; // Cold degrades performance
    } else if (temperature > 40) {
      temperatureEffect = (temperature - 40) * 0.1; // Heat degrades performance more rapidly
    }

    return baseLoss + climateAttenuation + temperatureEffect;
  };

  const calculateResults = () => {
    setIsCalculating(true);
    setCalculationComplete(false);

    setTimeout(() => {
      // Convert state values to numbers
      const freq = frequency;
      const bwNum = parseFloat(bandwidth);
      const ant = parseFloat(antennas);
      const str = parseFloat(streams);
      const udpVal = udpPayload;
      const gain = antennaGain;
      const fade = fadeMargin;
      const fresnelPct = fresnelClearance;
      const pwrLimit = powerLimit;
      let ampduVal = framesAggregated;
      const psr = 90;

      // Constants
      const ipv4 = 20, eth2 = 14, batAdv = 10, llc = 8, ieee80211 = 42, phy = 4;
      const headerTotal = ipv4 + eth2 + batAdv + llc + ieee80211 + phy;
      const mpduDelimiter = 0, aifs = 8, cwSize = 15, phyHeader11n = 40, ltf = 4, sifs = 10;
      const txop = 100000;
      const basicRate = 12;
      let giRate = bwNum === 40 ? 14.4 : 13;

      // Get selected radio model and clone arrays
      const currentRadioModel = radioModels[selectedDevice];
      let powerArr = [...currentRadioModel.power];
      let sensitivityArr = [...currentRadioModel.sensitivity];
      const bitsPerSymbol = currentRadioModel.bitsPerSymbol;
      const codingRate = currentRadioModel.codingRate;
      const modulation = currentRadioModel.modulation;

      // Derived parameters
      const payload = udpVal + headerTotal;
      const effectiveStreams = Math.min(str, ant);
      let stbw = bwNum > 20 ? 20 : bwNum;
      const slotTime = 4 + Math.ceil((17 * 5) / stbw);
      const phyOverhead = (aifs + cwSize) * slotTime + (phyHeader11n + effectiveStreams * ltf) * 20 / bwNum;

      let freqCorrection = 0;
      if (isOverGround) {
        freqCorrection = Math.round(
          10000 * (-0.0000000000313 * Math.pow(freq, 3) +
            0.0000004618 * Math.pow(freq, 2) -
            0.0024096 * freq + 5.8421)
        ) / 10000;
        if (ampduVal > 2) ampduVal = 2;
      }

      // Arrays for per-MCS level calculations
      const mcsIndex: number[] = [];
      const linkSpeed: number[] = [];
      const basicSpeed: number[] = [];
      const maxFrames: number[] = [];
      const phyTimeArr: number[] = [];
      const rangeArr: number[] = [];
      const snrArr: number[] = [];
      const tptMax: number[] = [];
      const fresnelClearanceDistance: number[] = [];
      const mcsTableData: McsTableRow[] = [];

      for (let i = 0; i < 8; i++) {
        // Apply power limit
        powerArr[i] = Math.min(powerArr[i], pwrLimit - 3);

        // Adjust sensitivity based on antennas and bandwidth
        sensitivityArr[i] = sensitivityArr[i] - 10 * Math.log10(ant / effectiveStreams) -
          10 * Math.log10(20 / bwNum);

        // Calculate MCS index
        mcsIndex[i] = i + (effectiveStreams - 1) * 8;

        // Calculate link speed
        linkSpeed[i] = bitsPerSymbol[i] * codingRate[i] * effectiveStreams * giRate * bwNum / 20;

        // Calculate basic rate
        basicSpeed[i] = basicRate * (bwNum / 20) * bitsPerSymbol[i] * Math.min(codingRate[i], 0.75);

        // Determine maximum frames
        maxFrames[i] = Math.max(Math.min(txop / ((payload * 8) / linkSpeed[i]), ampduVal), 1);

        // Calculate PHY data transmission time
        phyTimeArr[i] = (ampduVal - 1) * mpduDelimiter +
          Math.ceil((payload * maxFrames[i] * 8 / linkSpeed[i]) / 4) * 4;

        // Compute range (m)
        const rangeCalc = Math.pow(
          10, (powerArr[i] - sensitivityArr[i] - fade + gain) / (20 + freqCorrection)
        ) * 300 / (freq * 4 * Math.PI);

        rangeArr[i] = parseFloat(rangeCalc.toFixed(1));

        // Calculate SNR based on path loss
        const pathLoss = calculatePathLoss(rangeArr[i], freq);
        const receivedPower = powerArr[i] + gain - pathLoss;
        const noiseFloor = -174 + 10 * Math.log10(bwNum * 1e6);
        snrArr[i] = receivedPower - noiseFloor;

        // Calculate throughput
        const timeTotal = phyTimeArr[i] + phyOverhead +
          (sifs + (phyHeader11n + effectiveStreams * ltf) +
            Math.ceil((32 * 8) / (basicSpeed[i] * (bwNum / 20)))) +
          (1000 * 4 * rangeArr[i]) / 300;

        tptMax[i] = parseFloat((maxFrames[i] * udpVal * 8 / timeTotal * 0.9).toFixed(1));

        // Fresnel Zone Clearance
        fresnelClearanceDistance[i] = parseFloat(
          (8.66 * Math.sqrt(rangeArr[i] / freq) * fresnelPct / 100).toFixed(1)
        );

        // MCS Table Data
        mcsTableData.push({
          mcs: mcsIndex[i],
          modulation: modulation[i],
          coding: codingRate[i],
          dataRate: linkSpeed[i].toFixed(1),
          range: rangeArr[i],
          throughput: tptMax[i],
          snr: snrArr[i].toFixed(1),
          fresnelClearance: fresnelClearanceDistance[i]
        });
      }

      // Sort data by distance (ascending)
      const sortedData = rangeArr.map((r, idx) => ({
        distance: r,
        throughput: tptMax[idx],
        fresnelClearance: fresnelClearanceDistance[idx],
        snr: snrArr[idx],
        mcs: mcsIndex[idx],
      })).sort((a, b) => a.distance - b.distance);

      setChartData(sortedData);
      setSnrData(sortedData);
      setMcsTable(mcsTableData);
      setIsCalculating(false);
      setCalculationComplete(true);

      setTimeout(() => {
        if (chartRef.current) {
          chartRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }, 300);
    }, 600);
  };

  const renderMcsTable = () => (
    <div className="overflow-x-auto mt-4">
      <table className="w-full min-w-full divide-y divide-gray-700">
        <thead>
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">MCS</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Modulation</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Coding</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Rate (Mbps)</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Distance (m)</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Throughput (Mbps)</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">SNR (dB)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {mcsTable.map((row, idx) => (
            <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-900' : 'bg-gray-850'}>
              <td className="px-4 py-2 text-sm">{row.mcs}</td>
              <td className="px-4 py-2 text-sm">{row.modulation}</td>
              <td className="px-4 py-2 text-sm">{row.coding.toFixed(3)}</td>
              <td className="px-4 py-2 text-sm">{row.dataRate}</td>
              <td className="px-4 py-2 text-sm">{row.range}</td>
              <td className="px-4 py-2 text-sm">{row.throughput}</td>
              <td className="px-4 py-2 text-sm">{row.snr}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderThroughputChart = () => (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
          <XAxis
            dataKey="distance"
            label={{
              value: "Distance (m)",
              position: "insideBottom",
              offset: -10,
              fill: "#94a3b8"
            }}
            stroke="#94a3b8"
            tick={{ fill: "#94a3b8" }}
          />
          <YAxis
            yAxisId="left"
            label={{
              value: "Throughput (Mbps)",
              angle: -90,
              position: "insideLeft",
              offset: 10,
              fill: "#f59e0b"
            }}
            stroke="#f59e0b"
            tick={{ fill: "#94a3b8" }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            label={{
              value: "Fresnel Zone (m)",
              angle: 90,
              position: "insideRight",
              offset: 10,
              fill: "#22c55e"
            }}
            stroke="#22c55e"
            tick={{ fill: "#94a3b8" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(17, 24, 39, 0.95)",
              borderColor: "#4b5563",
              color: "#e5e7eb",
              borderRadius: "0.5rem",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              border: "none"
            }}
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
            dataKey="fresnelClearance"
            name="Fresnel Zone (m)"
            stroke="#22c55e"
            strokeWidth={3}
            dot={{ stroke: "#22c55e", strokeWidth: 2, r: 4, fill: "#22c55e" }}
            activeDot={{ stroke: "#22c55e", strokeWidth: 2, r: 6, fill: "#22c55e" }}
            animationDuration={1500}
            animationBegin={300}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  const renderSnrChart = () => (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={snrData}
          margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
          <XAxis
            dataKey="distance"
            label={{
              value: "Distance (m)",
              position: "insideBottom",
              offset: -10,
              fill: "#94a3b8"
            }}
            stroke="#94a3b8"
            tick={{ fill: "#94a3b8" }}
          />
          <YAxis
            label={{
              value: "SNR (dB)",
              angle: -90,
              position: "insideLeft",
              offset: 10,
              fill: "#3b82f6"
            }}
            stroke="#3b82f6"
            tick={{ fill: "#94a3b8" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(17, 24, 39, 0.95)",
              borderColor: "#4b5563",
              color: "#e5e7eb",
              borderRadius: "0.5rem",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              border: "none"
            }}
            labelStyle={{ color: "#f3f4f6", fontWeight: "bold", marginBottom: "0.5rem" }}
            itemStyle={{ padding: "0.25rem 0" }}
          />
          <Legend wrapperStyle={{ paddingTop: "1rem" }} />
          <Line
            type="monotone"
            dataKey="snr"
            name="Signal-to-Noise Ratio (dB)"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ stroke: "#3b82f6", strokeWidth: 2, r: 4, fill: "#3b82f6" }}
            activeDot={{ stroke: "#3b82f6", strokeWidth: 2, r: 6, fill: "#3b82f6" }}
            animationDuration={1500}
          />
          <ReferenceLine y={25} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Excellent', position: 'right', fill: '#10b981' }} />
          <ReferenceLine y={15} stroke="#eab308" strokeDasharray="3 3" label={{ value: 'Good', position: 'right', fill: '#eab308' }} />
          <ReferenceLine y={10} stroke="#f97316" strokeDasharray="3 3" label={{ value: 'Fair', position: 'right', fill: '#f97316' }} />
          <ReferenceLine y={5} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Poor', position: 'right', fill: '#ef4444' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  const renderCoverageMap = () => (
    <div className="h-80">
      <p className="text-sm text-gray-400 mb-2 italic">A top-down view showing signal propagation and throughput in all directions from the transmitter (center).</p>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart
          margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
          <XAxis type="number" dataKey="x" name="distance (m)" stroke="#94a3b8" tick={{ fill: "#94a3b8" }} domain={[-chartData[chartData.length - 1]?.distance || -1000, chartData[chartData.length - 1]?.distance || 1000]} />
          <YAxis type="number" dataKey="y" name="distance (m)" stroke="#94a3b8" tick={{ fill: "#94a3b8" }} domain={[-chartData[chartData.length - 1]?.distance || -1000, chartData[chartData.length - 1]?.distance || 1000]} />
          <ZAxis type="number" range={[50, 400]} />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          <Legend />
          {chartData.map((point, index) => {
            const circles = [];
            for (let i = 0; i < 8; i++) {
              const angle = i * Math.PI / 4;
              circles.push({
                x: Math.cos(angle) * point.distance,
                y: Math.sin(angle) * point.distance,
                z: point.throughput
              });
            }
            return (
              <Scatter
                key={index}
                name={`${point.throughput} Mbps`}
                data={circles}
                fill={`hsl(${200 - point.throughput * 1.5}, 100%, 50%)`}
                shape="circle"
              />
            );
          })}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "throughput":
        return renderThroughputChart();
      case "snr":
        return renderSnrChart();
      case "coverage":
        return renderCoverageMap();
      case "mcs":
        return renderMcsTable();
      default:
        return renderThroughputChart();
    }
  };

  const handleFrequencyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFrequency(parseInt(e.target.value));
  };

  const handleBandwidthChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setBandwidth(e.target.value);
  };

  const handleAntennasChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setAntennas(e.target.value);
  };

  const handleStreamsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setStreams(e.target.value);
  };

  const handleUdpPayloadChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setUdpPayload(parseInt(e.target.value));
  };

  const handleAntennaGainChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setAntennaGain(parseInt(e.target.value));
  };

  const handleFadeMarginChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFadeMargin(parseInt(e.target.value));
  };

  const handleFresnelClearanceChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFresnelClearance(parseInt(e.target.value));
  };

  const handleOverGroundChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setIsOverGround((e.target as HTMLInputElement).checked);
  };

  const handlePowerLimitChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setPowerLimit(parseInt(e.target.value));
  };

  const handleFramesAggregatedChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFramesAggregated(parseInt(e.target.value));
  };

  const handlePathLossModelChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setPathLossModel(e.target.value);
  };

  const handleClimateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setClimate(e.target.value);
  };

  const handleTemperatureChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setTemperature(parseInt(e.target.value));
  };

  const handleMultiPathFadingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setMultiPathFading((e.target as HTMLInputElement).checked);
  };

  const handleFadingIntensityChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFadingIntensity(parseInt(e.target.value));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-gray-100">
      <div className="pt-8 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="space-y-8"
        >
          <motion.div variants={itemVariants} className="flex items-center mb-6">
            <div className="flex items-center">
              <img
                src="https://learn.doodlelabs.com/hubfs/mesh%20rider%20logo.png"
                alt="Mesh Rider Logo"
                className="h-12 w-auto mr-4"
              />
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Mesh Rider Throughput Calculator
                </h1>
                <p className="text-gray-400 mt-1">
                  RF performance analyzer for mesh network planning and optimization
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-medium flex items-center">
                <Zap className="w-5 h-5 mr-2 text-amber-400" />
                <span>Select Device</span>
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.keys(deviceDetails).map((deviceKey) => (
                <DeviceCard
                  key={deviceKey}
                  deviceKey={deviceKey}
                  device={deviceDetails[deviceKey]}
                  isSelected={selectedDevice === deviceKey}
                  onClick={() => setSelectedDevice(deviceKey)}
                />
              ))}
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-gray-850 rounded-2xl overflow-hidden shadow-xl"
          >
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-medium flex items-center">
                  <Sliders className="w-5 h-5 mr-2 text-violet-400" />
                  <span>Configuration Parameters</span>
                </h2>
                <button
                  onClick={() => setAdvancedOpen(!advancedOpen)}
                  className="flex items-center text-sm px-3 py-1 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <span>{advancedOpen ? "Hide Advanced" : "Show Advanced"}</span>
                  {advancedOpen ? (
                    <ChevronUp className="ml-1 w-4 h-4" />
                  ) : (
                    <ChevronDown className="ml-1 w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InputField
                  label="Frequency (MHz)"
                  id="frequency"
                  value={frequency}
                  onChange={handleFrequencyChange}
                  type="number"
                  min="1000"
                  max="6000"
                />

                <InputField
                  label="Bandwidth (MHz)"
                  id="bandwidth"
                  value={bandwidth}
                  onChange={handleBandwidthChange}
                  type="select"
                  options={bandwidthOptions}
                />

                <InputField
                  label="UDP Payload (bytes)"
                  id="udpPayload"
                  value={udpPayload}
                  onChange={handleUdpPayloadChange}
                  type="number"
                  min="10"
                  max="1500"
                />
              </div>

              <AnimatePresence>
                {advancedOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 border-t border-gray-700">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <InputField
                          label="Antennas"
                          id="antennas"
                          value={antennas}
                          onChange={handleAntennasChange}
                          type="select"
                          options={antennasOptions}
                          disabled={selectedDevice === "1L"}
                        />

                        <InputField
                          label="Data Streams"
                          id="streams"
                          value={streams}
                          onChange={handleStreamsChange}
                          type="select"
                          options={streamsOptions}
                          disabled={selectedDevice === "1L"}
                        />

                        <InputField
                          label="Antenna Gain (dBi)"
                          id="antennaGain"
                          value={antennaGain}
                          onChange={handleAntennaGainChange}
                          type="number"
                          min="0"
                          max="100"
                        />

                        <InputField
                          label="Fade Margin (dB)"
                          id="fadeMargin"
                          value={fadeMargin}
                          onChange={handleFadeMarginChange}
                          type="number"
                          min="0"
                          max="30"
                        />

                        <InputField
                          label="Fresnel Clearance (%)"
                          id="fresnelClearance"
                          value={fresnelClearance}
                          onChange={handleFresnelClearanceChange}
                          type="number"
                          min="0"
                          max="100"
                        />

                        <InputField
                          label="Power Limit (dBm)"
                          id="powerLimit"
                          value={powerLimit}
                          onChange={handlePowerLimitChange}
                          type="number"
                          min="0"
                          max={selectedDevice === "1L" ? "30" : "36"}
                        />

                        <InputField
                          label="Frames Aggregated"
                          id="framesAggregated"
                          value={framesAggregated}
                          onChange={handleFramesAggregatedChange}
                          type="number"
                          min="1"
                          max="32"
                        />

                        <InputField
                          label="Path Loss Model"
                          id="pathLossModel"
                          value={pathLossModel}
                          onChange={handlePathLossModelChange}
                          type="select"
                          options={pathLossModelOptions}
                        />

                        <InputField
                          label="Climate Condition"
                          id="climate"
                          value={climate}
                          onChange={handleClimateChange}
                          type="select"
                          options={climateOptions}
                        />

                        <InputField
                          label="Ambient Temperature (°C)"
                          id="temperature"
                          value={temperature}
                          onChange={handleTemperatureChange}
                          type="number"
                          min="-20"
                          max="50"
                        />

                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="isOverGround"
                              checked={isOverGround}
                              onChange={handleOverGroundChange}
                              className="h-4 w-4 text-violet-500 focus:ring-violet-500 border-gray-700 rounded"
                            />
                            <label
                              htmlFor="isOverGround"
                              className="ml-2 text-sm text-gray-300"
                            >
                              Ground Level Link
                            </label>
                          </div>

                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="multiPathFading"
                              checked={multiPathFading}
                              onChange={handleMultiPathFadingChange}
                              className="h-4 w-4 text-violet-500 focus:ring-violet-500 border-gray-700 rounded"
                            />
                            <label
                              htmlFor="multiPathFading"
                              className="ml-2 text-sm text-gray-300"
                            >
                              Enable Multi-Path Fading
                            </label>
                          </div>
                        </div>

                        {multiPathFading && (
                          <InputField
                            label="Fading Intensity (1-10)"
                            id="fadingIntensity"
                            value={fadingIntensity}
                            onChange={handleFadingIntensityChange}
                            type="number"
                            min="1"
                            max="10"
                          />
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex justify-center pt-4">
                <motion.button
                  onClick={calculateResults}
                  disabled={isCalculating}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-medium py-3 px-8 rounded-xl shadow-lg shadow-violet-500/20 flex items-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                >
                  {isCalculating ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Calculating...</span>
                    </>
                  ) : (
                    <>
                      <BarChart2 className="w-5 h-5" />
                      <span>Calculate Performance</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>

          {calculationComplete && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="bg-gray-850 rounded-2xl overflow-hidden shadow-xl"
              ref={chartRef}
            >
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-xl font-medium flex items-center">
                  <Wifi className="w-5 h-5 mr-2 text-emerald-400" />
                  <span>RF Performance Analysis</span>
                </h2>

                <div className="flex space-x-2 mt-4">
                  <button
                    onClick={() => setActiveTab("throughput")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === "throughput"
                      ? "bg-violet-600 text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      }`}
                  >
                    <BarChart2 className="w-4 h-4 inline mr-1" />
                    Throughput
                  </button>

                  <button
                    onClick={() => setActiveTab("snr")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === "snr"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      }`}
                  >
                    <Activity className="w-4 h-4 inline mr-1" />
                    SNR Analysis
                  </button>

                  <button
                    onClick={() => setActiveTab("coverage")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === "coverage"
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      }`}
                  >
                    <Map className="w-4 h-4 inline mr-1" />
                    Coverage Map
                  </button>

                  <button
                    onClick={() => setActiveTab("mcs")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === "mcs"
                      ? "bg-amber-600 text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      }`}
                  >
                    <Layers className="w-4 h-4 inline mr-1" />
                    MCS Details
                  </button>
                </div>
              </div>

              <div className="p-6">
                {renderTabContent()}

                <div className="mt-8 bg-gray-900/50 rounded-xl p-5 border border-gray-800">
                  <div className="flex items-center mb-3">
                    <Info className="w-5 h-5 mr-2 text-sky-400" />
                    <h3 className="text-lg font-medium">Analysis Overview</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <div className="h-5 w-1 bg-amber-500 rounded-full mr-3 mt-1"></div>
                        <div>
                          <span className="font-medium text-amber-400">Throughput Performance</span>
                          <p className="text-sm text-gray-400 mt-1">
                            Maximum throughput reaches {chartData[0]?.throughput} Mbps at close range and decreases to {chartData[chartData.length - 1]?.throughput} Mbps at {chartData[chartData.length - 1]?.distance}m.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="h-5 w-1 bg-emerald-500 rounded-full mr-3 mt-1"></div>
                        <div>
                          <span className="font-medium text-emerald-400">Fresnel Zone Clearance</span>
                          <p className="text-sm text-gray-400 mt-1">
                            At maximum distance, maintain a clearance zone of {chartData[chartData.length - 1]?.fresnelClearance}m for optimal signal propagation.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="h-5 w-1 bg-red-500 rounded-full mr-3 mt-1"></div>
                        <div>
                          <span className="font-medium text-red-400">Climate & Environment Impact</span>
                          <p className="text-sm text-gray-400 mt-1">
                            {climate === "clear"
                              ? "Clear sky conditions provide optimal signal propagation."
                              : `${climate.charAt(0).toUpperCase() + climate.slice(1)} conditions cause signal attenuation of approximately ${(0.01 * Math.pow(frequency / 1000, 1.6) * chartData[chartData.length - 1]?.distance / 1000).toFixed(2)} dB at maximum range.`
                            }
                            {Math.abs(temperature - 25) > 15
                              ? ` Temperature of ${temperature}°C also ${temperature < 0 ? "reduces throughput due to component limitations" : "degrades signal quality due to thermal noise increase"}.`
                              : ""
                            }
                            {multiPathFading
                              ? ` Multi-path fading (intensity: ${fadingIntensity}) causes signal variations of ±${fadingIntensity.toFixed(1)} dB, resulting in less predictable performance.`
                              : ""
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start">
                        <div className="h-5 w-1 bg-violet-500 rounded-full mr-3 mt-1"></div>
                        <div>
                          <span className="font-medium text-violet-400">Device Optimization</span>
                          <p className="text-sm text-gray-400 mt-1">
                            The {deviceDetails[selectedDevice].name} performs best with {bandwidth} MHz bandwidth and {antennas} antenna configuration.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="h-5 w-1 bg-blue-500 rounded-full mr-3 mt-1"></div>
                        <div>
                          <span className="font-medium text-blue-400">Recommended Link Distance</span>
                          <p className="text-sm text-gray-400 mt-1">
                            For optimal performance (≥20 Mbps), maintain distance under {chartData.find(d => d.throughput < 20)?.distance || 'N/A'}m with clear line of sight.
                            {climate !== "clear" ? ` In ${climate} conditions, reduce maximum distance by ${climate === "rain" ? "15-20%" : climate === "fog" ? "10-15%" : climate === "snow" ? "25-30%" : "5-10%"}.` : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="h-5 w-1 bg-amber-500 rounded-full mr-3 mt-1"></div>
                        <div>
                          <span className="font-medium text-amber-400">Environmental Recommendations</span>
                          <p className="text-sm text-gray-400 mt-1">
                            {climate !== "clear"
                              ? `For ${climate} conditions, consider ${climate === "rain" || climate === "snow"
                                ? "weatherproof enclosures and increased fade margin"
                                : climate === "fog"
                                  ? "lower frequency operation if possible"
                                  : "additional antenna gain to overcome attenuation"}.`
                              : "Standard installation practices are sufficient for current environmental conditions."
                            }
                            {Math.abs(temperature - 25) > 15
                              ? ` Equipment may require ${temperature < 0 ? "heating elements" : "additional cooling"} at ${temperature}°C.`
                              : ""
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <motion.div variants={itemVariants} className="text-center text-xs text-gray-500 mt-8">
            <p>Mesh Rider Analysis Tool</p>
            <p className="mt-1">
              Results are theoretical and may vary based on environmental conditions and interference.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default ThroughputCalculator;