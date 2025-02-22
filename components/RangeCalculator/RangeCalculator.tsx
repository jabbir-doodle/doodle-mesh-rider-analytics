'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Area, Line } from 'recharts';
import { Radio, Signal, Wifi, Activity, Database, Antenna, Waves, Zap, ChevronDown, Network, Settings } from 'lucide-react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import type { RangeCalculatorProps, RadioModels, CalculationResults, ChartDataPoint } from '@/types';
import 'react-circular-progressbar/dist/styles.css';
import { MetricCard } from '@/components/shared/MetricCard';
import ParticleBackground from '../ParticleBackground';

// First, let's add some glass-morphism effects and enhanced gradients
const glassStyle = {
    background: 'rgba(0, 0, 0, 0.75)', // Changed to black background
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(59, 130, 246, 0.125)' // Blue border tint
};

// Add these new animations
const pulseAnimation = {
    scale: [1, 1.05, 1],
    opacity: [0.8, 1, 0.8],
    transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
    }
};

const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

const radioModels: RadioModels = {
    '1L': {
        name: 'Nano-OEM',
        power: [24, 23, 23, 23, 22, 21, 20, 18],
        sensitivity: [-87, -85, -83, -81, -77, -73, -71, -69],
        maxTxPower: 24,
        frequencies: [2400, 2450, 2500]
    },
    '2L': {
        name: 'Mini-OEM',
        power: [27, 26, 26, 26, 25, 24, 23, 21],
        sensitivity: [-87, -85, -83, -81, -77, -73, -71, -69],
        maxTxPower: 27,
        frequencies: [2400, 2450, 2500]
    },
    '2KO': {
        name: 'OEM (V2)',
        power: [30, 29, 29, 29, 28, 27, 26, 24],
        sensitivity: [-87, -85, -83, -81, -77, -73, -71, -69],
        maxTxPower: 30,
        frequencies: [2400, 2450, 2500, 5000, 5500]
    },
    '2KW': {
        name: 'Wearable (V2)',
        power: [27, 26, 26, 26, 25, 24, 23, 21],
        sensitivity: [-87, -85, -83, -81, -77, -73, -71, -69],
        maxTxPower: 27,
        frequencies: [2400, 2450, 2500]
    }
};

const RangeCalculator: React.FC<RangeCalculatorProps> = ({ isOpen, onClose }) => {
    // State management for inputs and results
    const [telemetry, setTelemetry] = useState<number>(50);
    const [video, setVideo] = useState<number>(3);
    const [frequency, setFrequency] = useState<number>(2450);
    const [bw, setBw] = useState<number>(20);
    const [antennas, setAntennas] = useState<number>(2);
    const [streams, setStreams] = useState<number>(2);
    const [antGain, setAntGain] = useState<number>(6);
    const [fadeMargin, setFadeMargin] = useState<number>(10);
    const [overGround, setOverGround] = useState<boolean>(false);
    const [unit, setUnit] = useState<'feet' | 'meters'>('feet');
    const [AGL, setAGL] = useState<number>(400);
    const [powerLimit, setPowerLimit] = useState<number>(33);
    const [srVariant, setSrVariant] = useState<string>('2L');
    // New state: which MCS mode to display: diversity (MCS 0–7) or multiplexing (MCS 8–15)
    const [mcsMode, setMcsMode] = useState<'diversity' | 'multiplexing'>('diversity');
    // Results now contains separate data for each mode
    const [results, setResults] = useState<{
        totalThroughput: number;
        model: string;
        diversity: CalculationResults;
        multiplexing: CalculationResults;
    } | null>(null);
    const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
    const [isCalculating, setIsCalculating] = useState<boolean>(false);
    const chartRef = useRef<any>(null);

    // Constants for calculations
    const constants = {
        udp: 1500,
        ipv4: 20,
        eth2: 14,
        batAdv: 10,
        llc: 8,
        ieee80211: 42,
        phy: 4,
        aifs: 8,
        cwSize: 15,
        baSize: 32,
        phyHeader11n: 40,
        ltf: 4,
        sifs: 10,
        mpduDelimiter: 0,
        txop: 100000,
        psr: 90,
        fresnelClearancePercent: 60,
        basicRate: 12
    };

    const calculateRange = async () => {
        setIsCalculating(true);
        const model = radioModels[srVariant];
        if (!model) {
            setIsCalculating(false);
            return;
        }

        // Artificial delay for animation
        await new Promise(resolve => setTimeout(resolve, 800));

        // Pre-calculation common variables
        const headerTotal = constants.ipv4 + constants.eth2 + constants.batAdv +
            constants.llc + constants.ieee80211 + constants.phy;
        const ampdu = overGround ? 2 : 10;
        const giRate = bw === 40 ? 14.4 : 13;
        const telemetryMbps = telemetry / 1000;
        const videoMbps = video;
        const totalThroughput = telemetryMbps + videoMbps;
        const AGLm = unit === 'feet' ? AGL / 3.28084 : AGL;
        const rfParams = {
            power: model.power,
            sensitivity: model.sensitivity,
            modulation: ["BPSK", "QPSK", "QPSK", "16-QAM", "16-QAM", "64-QAM", "64-QAM", "64-QAM"],
            codingRate: [0.5, 0.5, 0.75, 0.5, 0.75, 2 / 3, 0.75, 5 / 6],
            bitsPerSymbol: [1, 2, 2, 4, 4, 6, 6, 6]
        };
        // Always apply frequency correction
        const freqCorrection = Math.round(10000 * (
            -0.0000000000313 * Math.pow(frequency, 3) +
            0.0000004618 * Math.pow(frequency, 2) -
            0.0024096 * frequency +
            5.8421
        )) / 10000;
        // Limit antStreams as per user selection (for multiplexing mode)
        const multiplexingAntStreams = Math.min(streams, antennas);

        // Calculate PHY overhead (common for both modes)
        const stbw = bw > 20 ? 20 : bw;
        const slotTime = 4 + Math.ceil((17 * 5) / stbw);
        const phyOverhead = (constants.aifs + constants.cwSize) * slotTime +
            (constants.phyHeader11n + multiplexingAntStreams * constants.ltf) * 20 / bw;

        // Helper function: Compute MCS results for a given number of streams (antStreams)
        function computeMcsDataForMode(antStreams: number) {
            const rangeEstList = [];
            const chartData = [];
            let finalAGL = 0;
            let rangeEstFinal = 0;
            let finalMcsRate = 0;
            let rangeEstMax = 0;
            let maxAGL = 0;
            let maxMcsRate = 0;

            for (let i = 0; i < 8; i++) {
                const adjustedPower = Math.min(rfParams.power[i], powerLimit - 3);
                const adjustedSensitivity = rfParams.sensitivity[i] -
                    10 * Math.log10(antennas / antStreams) -
                    10 * Math.log10(20 / bw);
                const mcsIndex = i + (antStreams - 1) * 8;
                const linkSpeed = rfParams.bitsPerSymbol[i] * rfParams.codingRate[i] * antStreams * giRate * bw / 20;
                const basicSpeed = constants.basicRate * (bw / 20) * rfParams.bitsPerSymbol[i] *
                    Math.min(rfParams.codingRate[i], 0.75);
                const maxFrames = Math.max(
                    Math.min(constants.txop / ((constants.udp + headerTotal) * 8 / linkSpeed), ampdu),
                    1
                );
                const ampduWindow = (constants.udp + headerTotal) * maxFrames;
                const phyTime = (ampdu - 1) * constants.mpduDelimiter +
                    Math.ceil((ampduWindow * 8 / linkSpeed) / 4) * 4;
                const baRes = constants.sifs + (constants.phyHeader11n + antStreams * constants.ltf) +
                    Math.ceil((constants.baSize * 8) / (basicSpeed * (bw / 20)));
                const range = parseFloat(
                    (Math.pow(10, (adjustedPower - adjustedSensitivity - fadeMargin + antGain) /
                        (20 + freqCorrection)) * 300 / frequency / 4 / Math.PI).toFixed(1)
                );
                const nWayTransit = Math.round((1000 * 4 * range) / 300) / 1000;
                const timeNoTransit = phyTime + phyOverhead + baRes;
                const timeTotal = parseFloat((timeNoTransit + nWayTransit).toFixed(1));
                const tptIdeal = parseFloat((maxFrames * constants.udp * 8 / timeNoTransit).toFixed(1));
                const tptMax = parseFloat((maxFrames * constants.udp * 8 / timeTotal).toFixed(1));
                const tptAdjusted = parseFloat((tptMax * constants.psr / 100).toFixed(2));
                const fresnelClearance = parseFloat(
                    (8.66 * Math.sqrt(range / frequency) * (constants.fresnelClearancePercent / 100)).toFixed(1)
                );

                if (i === 0) {
                    finalAGL = fresnelClearance;
                    rangeEstFinal = range;
                    finalMcsRate = mcsIndex;
                    rangeEstMax = range;
                    maxAGL = fresnelClearance;
                    maxMcsRate = mcsIndex;
                } else {
                    if (totalThroughput > tptAdjusted) {
                        rangeEstFinal = range;
                        finalMcsRate = mcsIndex;
                        finalAGL = fresnelClearance;
                    } else if (AGLm < fresnelClearance) {
                        rangeEstFinal = range;
                        finalAGL = fresnelClearance;
                        finalMcsRate = mcsIndex;
                    }
                }

                const throughputStatus = totalThroughput > tptAdjusted ? "text-red-500" : "text-green-500";
                const fresnelStatus = AGLm - fresnelClearance > 0 ? "text-green-500" : "text-red-500";

                rangeEstList.push({
                    mcs: mcsIndex,
                    range,
                    throughput: tptAdjusted,
                    modulation: rfParams.modulation[i],
                    codingRate: rfParams.codingRate[i],
                    status: throughputStatus,
                    fresnelStatus
                });

                chartData.push({
                    distance: range,
                    throughput: tptAdjusted,
                    fresnelClearance,
                    modulation: rfParams.modulation[i],
                    codingRate: rfParams.codingRate[i],
                    mcs: mcsIndex
                });
            }

            return {
                rangeEstList,
                chartData,
                rangeEstFinal,
                finalMcsRate,
                finalAGL,
                rangeEstMax,
                maxMcsRate,
                maxAGL
            };
        }

        // Compute two sets:
        const diversityResults = computeMcsDataForMode(1); // Diversity: force one stream (MCS 0–7)
        const multiplexingResults = computeMcsDataForMode(multiplexingAntStreams); // Multiplexing: use selected streams

        setResults({
            totalThroughput,
            model: model.name,
            diversity: { ...diversityResults, totalThroughput, model: model.name },
            multiplexing: { ...multiplexingResults, totalThroughput, model: model.name }
        });

        // Reset mcsMode to diversity by default (or keep previous selection if desired)
        setMcsMode('diversity');
        setIsCalculating(false);
    };

    // Updated render function for the chart to use selected mode’s chartData
    const renderRangeChart = () => {
        if (!results) return null;
        const data = mcsMode === 'diversity' ? results.diversity.chartData : results.multiplexing.chartData;

        return (
            <motion.div
                className="rounded-xl overflow-hidden"
                style={glassStyle}
            >
                <div className="h-80 p-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={data}>
                            <defs>
                                <linearGradient id="throughputGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
                                </linearGradient>
                                <linearGradient id="fresnelGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                </linearGradient>
                                <filter id="glow">
                                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                    <feMerge>
                                        <feMergeNode in="coloredBlur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />
                            <XAxis
                                dataKey="distance"
                                type="number"
                                domain={['auto', 'auto']}
                                name="Distance"
                                unit=" m"
                                stroke="#9CA3AF"
                                label={{ value: 'Distance (m)', position: 'bottom', fill: '#9CA3AF' }}
                            />
                            <YAxis
                                yAxisId="left"
                                domain={[0, 'auto']}
                                stroke="#3B82F6"
                                label={{ value: 'Throughput (Mbps)', angle: -90, position: 'left', fill: '#3B82F6' }}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                domain={[0, 'auto']}
                                stroke="#10B981"
                                label={{ value: 'Fresnel Clearance (m)', angle: 90, position: 'right', fill: '#10B981' }}
                            />
                            <Tooltip
                                content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        const dataPoint = payload[0].payload as ChartDataPoint;
                                        return (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="bg-gray-900 p-4 rounded-lg border border-gray-700 shadow-xl"
                                            >
                                                <div className="font-semibold text-gray-300 mb-2">
                                                    Distance: {label} m
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                                                        <span className="text-blue-400">
                                                            Throughput: {dataPoint.throughput.toFixed(2)} Mbps
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full bg-green-500" />
                                                        <span className="text-green-400">
                                                            Fresnel: {dataPoint.fresnelClearance.toFixed(2)} m
                                                        </span>
                                                    </div>
                                                    <div className="text-gray-400 text-sm mt-2">
                                                        MCS {dataPoint.mcs} ({dataPoint.modulation} {dataPoint.codingRate})
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Legend />
                            <Area
                                yAxisId="left"
                                type="monotone"
                                dataKey="throughput"
                                name="Throughput"
                                stroke="#3B82F6"
                                fill="url(#throughputGradient)"
                                strokeWidth={2}
                                style={{ filter: 'url(#glow)' }}
                            />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="fresnelClearance"
                                name="Fresnel Zone"
                                stroke="#10B981"
                                strokeWidth={2}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>
        );
    };

    // A simple handler – can be expanded as needed
    const setSelectedMetric = (metric: string): void => {
        console.log('Metric selected:', metric);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black overflow-auto">
            <div className="min-h-screen p-6">
                <div className="max-w-7xl mx-auto">



                    {/* Existing calculator content */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black overflow-y-auto" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.08), transparent)' }}>
                        <div className="min-h-screen p-6">
                            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="max-w-7xl mx-auto">
                                {/* Header */}
                                <div className="flex justify-between items-center mb-8">
                                    <div className="flex items-center gap-4">
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                                            className="p-3 bg-blue-600/20 rounded-full"
                                        >
                                            <Radio className="h-8 w-8 text-blue-500" />
                                        </motion.div>
                                        <div>
                                            <h1 className="text-3xl font-bold glowing-text">Mesh Rider Range Calculator</h1>
                                            <p className="text-gray-400">Calculate optimal range and performance metrics</p>
                                        </div>
                                    </div>
                                    <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
                                        <motion.div whileHover={{ rotate: 90 }} transition={{ duration: 0.2 }}>
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </motion.div>
                                    </button>
                                </div>

                                {/* Radio Model Selection */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
                                >
                                    {Object.entries(radioModels).map(([key, model], index) => (
                                        <motion.div
                                            key={key}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className={`relative p-6 rounded-xl cursor-pointer transition-all duration-300 ${srVariant === key ? 'bg-blue-600/20 border-2 border-blue-500' : 'bg-black hover:bg-gray-900'
                                                }`}
                                            onClick={() => setSrVariant(key)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="relative w-16 h-16 flex items-center justify-center">
                                                    <motion.div
                                                        animate={srVariant === key ? { scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] } : {}}
                                                        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                                                        className="absolute inset-0 bg-blue-500/20 rounded-full"
                                                    />
                                                    <Antenna className={`w-8 h-8 ${srVariant === key ? 'text-blue-400' : 'text-gray-400'}`} />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-semibold">{model.name}</h3>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Zap className="w-4 h-4 text-yellow-500" />
                                                        <span className="text-gray-400">{model.maxTxPower} dBm Max</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>

                                {/* Main Content - Settings and Results */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Left Column - Settings */}
                                    <div className="lg:col-span-1 space-y-6">
                                        {/* Data Requirements */}
                                        <motion.div initial={fadeInUp.hidden} animate={fadeInUp.visible} className="bg-gray-800 rounded-xl p-6" style={glassStyle}>
                                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                                <Database className="h-5 w-5 text-blue-500" />
                                                Data Requirements
                                            </h3>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium mb-2">Telemetry (Kbps)</label>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            value={telemetry}
                                                            onChange={(e) => setTelemetry(Number(e.target.value))}
                                                            className="w-full bg-gray-700 rounded-lg p-2 pl-8 border border-gray-600 focus:border-blue-500 transition-colors"
                                                        />
                                                        <Activity className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-2">Video Stream (Mbps)</label>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            step="0.1"
                                                            value={video}
                                                            onChange={(e) => setVideo(Number(e.target.value))}
                                                            className="w-full bg-gray-700 rounded-lg p-2 pl-8 border border-gray-600 focus:border-blue-500 transition-colors"
                                                        />
                                                        <Wifi className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>

                                        {/* Network Configuration */}
                                        <motion.div initial={fadeInUp.hidden} animate={fadeInUp.visible} className="bg-gray-800 rounded-xl p-6" style={glassStyle}>
                                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                                <Signal className="h-5 w-5 text-blue-500" />
                                                Network Configuration
                                            </h3>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium mb-2">Center Frequency (MHz)</label>
                                                    <div className="relative">
                                                        <select
                                                            value={frequency}
                                                            onChange={(e) => setFrequency(Number(e.target.value))}
                                                            className="w-full bg-gray-700 rounded-lg p-2 pl-8 border border-gray-600 focus:border-blue-500 transition-colors"
                                                        >
                                                            {radioModels[srVariant].frequencies.map((freq) => (
                                                                <option key={freq} value={freq}>{freq}</option>
                                                            ))}
                                                        </select>
                                                        <Waves className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-2">Channel Bandwidth (MHz)</label>
                                                    <div className="relative">
                                                        <select
                                                            value={bw}
                                                            onChange={(e) => setBw(Number(e.target.value))}
                                                            className="w-full bg-gray-700 rounded-lg p-2 pl-8 border border-gray-600 focus:border-blue-500 transition-colors"
                                                        >
                                                            {[3, 5, 10, 15, 20, 26, 40].map(n => (
                                                                <option key={n} value={n}>{n} MHz</option>
                                                            ))}
                                                        </select>
                                                        <Network className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>

                                        {/* Advanced Settings Panel */}
                                        <motion.div initial={fadeInUp.hidden} animate={fadeInUp.visible} className="bg-gray-800 rounded-xl p-6" style={glassStyle}>
                                            <button
                                                onClick={() => setShowAdvanced(!showAdvanced)}
                                                className="flex items-center gap-2 text-gray-400 hover:text-white w-full"
                                            >
                                                <Settings className="h-5 w-5" />
                                                <span>Advanced Settings</span>
                                                <motion.div animate={{ rotate: showAdvanced ? 180 : 0 }} className="ml-auto">
                                                    <ChevronDown className="h-5 w-5" />
                                                </motion.div>
                                            </button>

                                            <AnimatePresence>
                                                {showAdvanced && (
                                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-4 mt-4 overflow-hidden">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-sm font-medium mb-2">Antennas</label>
                                                                <select
                                                                    value={antennas}
                                                                    onChange={(e) => setAntennas(Number(e.target.value))}
                                                                    className="w-full bg-gray-700 rounded-lg p-2 border border-gray-600"
                                                                >
                                                                    {[1, 2].map(n => (
                                                                        <option key={n} value={n}>{n}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm font-medium mb-2">Data Streams</label>
                                                                <select
                                                                    value={streams}
                                                                    onChange={(e) => setStreams(Number(e.target.value))}
                                                                    className="w-full bg-gray-700 rounded-lg p-2 border border-gray-600"
                                                                >
                                                                    {[1, 2].map(n => (
                                                                        <option key={n} value={n}>{n}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-sm font-medium mb-2">Antenna Gain (dBi)</label>
                                                                <input
                                                                    type="number"
                                                                    value={antGain}
                                                                    onChange={(e) => setAntGain(Number(e.target.value))}
                                                                    className="w-full bg-gray-700 rounded-lg p-2 border border-gray-600"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm font-medium mb-2">Fade Margin (dB)</label>
                                                                <input
                                                                    type="number"
                                                                    value={fadeMargin}
                                                                    onChange={(e) => setFadeMargin(Number(e.target.value))}
                                                                    className="w-full bg-gray-700 rounded-lg p-2 border border-gray-600"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2 p-3 bg-gray-700 rounded-lg">
                                                            <input
                                                                type="checkbox"
                                                                checked={overGround}
                                                                onChange={(e) => setOverGround(e.target.checked)}
                                                                className="rounded bg-gray-600 border-gray-500"
                                                            />
                                                            <label>Near Ground Level?</label>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-sm font-medium mb-2">Height AGL</label>
                                                                <input
                                                                    type="number"
                                                                    value={AGL}
                                                                    onChange={(e) => setAGL(Number(e.target.value))}
                                                                    className="w-full bg-gray-700 rounded-lg p-2 border border-gray-600"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm font-medium mb-2">Unit</label>
                                                                <select
                                                                    value={unit}
                                                                    onChange={(e) => setUnit(e.target.value as 'feet' | 'meters')}
                                                                    className="w-full bg-gray-700 rounded-lg p-2 border border-gray-600"
                                                                >
                                                                    <option value="meters">Meters</option>
                                                                    <option value="feet">Feet</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>

                                        {/* Calculate Button */}
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={calculateRange}
                                            disabled={isCalculating}
                                            className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white py-4 rounded-xl flex items-center justify-center gap-2 text-lg font-semibold disabled:opacity-50"
                                        >
                                            {isCalculating ? (
                                                <>
                                                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                        </svg>
                                                    </motion.div>
                                                    <span>Calculating...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Zap className="h-5 w-5" />
                                                    <span>Calculate Range</span>
                                                </>
                                            )}
                                        </motion.button>
                                    </div>

                                    {/* Right Column - Results */}
                                    <div className="lg:col-span-2 space-y-6">
                                        {results ? (
                                            <>
                                                {/* MCS Mode Toggle Buttons */}
                                                <div className="flex gap-4 mb-4">
                                                    <button
                                                        onClick={() => setMcsMode('diversity')}
                                                        className={`px-4 py-2 rounded-lg transition-colors ${mcsMode === 'diversity' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                                                    >
                                                        Diversity Rates (MCS 0–7)
                                                    </button>
                                                    <button
                                                        onClick={() => setMcsMode('multiplexing')}
                                                        className={`px-4 py-2 rounded-lg transition-colors ${mcsMode === 'multiplexing' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                                                    >
                                                        Multiplexing Rates (MCS 8–15)
                                                    </button>
                                                </div>

                                                {/* Results Grid */}
                                                <div className="grid grid-cols-3 gap-6">
                                                    <MetricCardEnhanced
                                                        title="Maximum Range"
                                                        value={mcsMode === 'diversity' ? results.diversity.rangeEstFinal : results.multiplexing.rangeEstFinal}
                                                        unit="m"
                                                        icon={Signal}
                                                        onClick={() => setSelectedMetric('range')}
                                                        subValue={`MCS ${mcsMode === 'diversity'
                                                            ? results.diversity.finalMcsRate
                                                            : results.multiplexing.finalMcsRate
                                                            }`}
                                                    />
                                                    <MetricCardEnhanced
                                                        title="Throughput"
                                                        value={results.totalThroughput}
                                                        unit="Mbps"
                                                        icon={Activity}
                                                        onClick={() => setSelectedMetric('throughput')}
                                                        subValue={`Target: ${(telemetry / 1000) + video} Mbps`}
                                                    />
                                                    <MetricCardEnhanced
                                                        title="Fresnel Zone"
                                                        value={mcsMode === 'diversity' ? results.diversity.finalAGL : results.multiplexing.finalAGL}
                                                        unit="m"
                                                        icon={Waves}
                                                        onClick={() => setSelectedMetric('fresnel')}
                                                        subValue={`Required Height: ${Math.ceil(mcsMode === 'diversity'
                                                            ? results.diversity.finalAGL
                                                            : results.multiplexing.finalAGL)}m`}
                                                    />
                                                </div>

                                                {/* Range Chart */}
                                                {renderRangeChart()}

                                                {/* MCS Analysis */}
                                                <motion.div initial={fadeInUp.hidden} animate={fadeInUp.visible} className="bg-gray-800 rounded-xl p-6" style={glassStyle}>
                                                    <h3 className="text-xl font-semibold mb-4">MCS Analysis</h3>
                                                    <div className="space-y-2">
                                                        {(mcsMode === 'diversity'
                                                            ? results.diversity.rangeEstList
                                                            : results.multiplexing.rangeEstList
                                                        ).map((item, index) => (
                                                            <motion.div
                                                                key={index}
                                                                initial={{ opacity: 0, x: -20 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                transition={{ delay: index * 0.1 }}
                                                                className={`flex justify-between items-center p-3 rounded-lg ${item.status === 'text-green-500' ? 'bg-green-900/20' : 'bg-red-900/20'}`}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`w-2 h-2 rounded-full ${item.status === 'text-green-500' ? 'bg-green-500' : 'bg-red-500'}`} />
                                                                    <div>
                                                                        <span className={item.status}>MCS {item.mcs}</span>
                                                                        <span className="text-gray-400 text-sm ml-2">
                                                                            ({item.modulation} {item.codingRate})
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <span className={item.status}>{item.range}m</span>
                                                                    <span className="text-gray-400 text-sm ml-2">
                                                                        ({item.throughput} Mbps)
                                                                    </span>
                                                                </div>
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            </>
                                        ) : (
                                            <motion.div initial={fadeInUp.hidden} animate={fadeInUp.visible} className="flex flex-col items-center justify-center h-full bg-gray-800 p-12 rounded-xl" style={glassStyle}>
                                                <motion.div
                                                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                                    transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                                                    className="mb-8"
                                                >
                                                    <Wifi className="h-24 w-24 text-blue-500/50" />
                                                </motion.div>
                                                <h3 className="text-xl font-semibold text-center mb-4">Ready to Calculate Range</h3>
                                                <p className="text-gray-400 text-center max-w-md">
                                                    Configure your parameters and click Calculate to see detailed range analysis and performance metrics
                                                </p>
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                        {/* Add animated background particles */}
                        <div className="absolute inset-0 pointer-events-none">
                            <ParticleBackground />
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

interface MetricCardEnhancedProps {
    title: string;
    value: number;
    unit: string;
    icon: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    subValue?: string;
}

const MetricCardEnhanced: React.FC<MetricCardEnhancedProps> = ({ title, value, unit, icon: Icon, onClick, subValue }) => (
    <motion.div
        whileHover={{ scale: 1.02, y: -5 }}
        whileTap={{ scale: 0.98 }}
        className="relative overflow-hidden rounded-xl p-6 cursor-pointer"
        style={glassStyle}
        onClick={onClick}
    >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
        <motion.div
            className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 opacity-20"
            animate={pulseAnimation}
        />
        <div className="relative z-10">
            <div className="flex items-center gap-4">
                <Icon className="h-8 w-8 text-blue-500" />
                <div>
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-400">{value}</span>
                        <span className="text-gray-400">{unit}</span>
                    </div>
                    {subValue && <div className="text-gray-400 text-sm">{subValue}</div>}
                </div>
            </div>
        </div>
    </motion.div>
);

export default RangeCalculator;
