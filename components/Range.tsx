import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Sliders, Radio, BarChart2, RefreshCw, ArrowRight, Layers } from "lucide-react";

import {
    DeviceCard,
    InputField,
    RFChart,
    AnalysisPanel,
    McsRangeItem,
    Animations
} from "./common/UIKit";

import {
    DEVICES,
    BANDWIDTH_OPTIONS,
    ANTENNA_OPTIONS,
    STREAM_OPTIONS,
    DeviceKey
} from "./common/RFData";

import { useRFCalculations, convertAGLUnit, getPowerLimitOptions } from "./common/RFEngine";
import ParticleBackground from "./ParticleBackground";

const RangeCalculator: React.FC = () => {
    const [telemetry, setTelemetry] = useState("50");
    const [video, setVideo] = useState("3");
    const [frequency, setFrequency] = useState("2450");
    const [bw, setBw] = useState<string>("20");
    const [antennas, setAntennas] = useState<string>("2");
    const [streams, setStreams] = useState<string>("2");
    const [fadeMargin, setFadeMargin] = useState("10");
    const [antGain, setAntGain] = useState("6");
    const [overGround, setOverGround] = useState(false);
    const [AGL, setAGL] = useState("400");
    const [unit, setUnit] = useState<"feet" | "meters">("feet");
    const [powerLimit, setPowerLimit] = useState<string>("33");
    const [srVariant, setSrVariant] = useState<DeviceKey>("2L");
    const [activeTab, setActiveTab] = useState<"dual" | "throughput" | "fresnel" | "snr">("dual");
    const [calculationMode, setCalculationMode] = useState<string>("mcs0_7");
    const [accordionState, setAccordionState] = useState({
        throughputOptimization: true,
        fresnelOptimization: true
    });
    const chartRef = useRef<HTMLDivElement>(null);

    const { chartData, analysisResults, isCalculating, calculationComplete, calculateRF } = useRFCalculations('range');

    useEffect(() => {
        if (srVariant === "1L") {
            setAntennas("1");
            setStreams("1");
            if (parseInt(powerLimit) > 30) setPowerLimit("30");
        }
    }, [srVariant, powerLimit]);

    const toggleAccordion = (section: "throughputOptimization" | "fresnelOptimization") => {
        setAccordionState(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const handleUnitChange = (newUnit: "feet" | "meters") => {
        const newAGL = convertAGLUnit(AGL, unit, newUnit);
        setAGL(newAGL);
        setUnit(newUnit);
    };

    const handleCalculate = (mode: string) => {
        const effectiveStreams = mode === "mcs0_7" ? "1" : streams;
        setCalculationMode(mode);
        calculateRF({
            deviceKey: srVariant,
            frequency,
            bandwidth: bw,
            antennas,
            streams: effectiveStreams,
            udpPayload: "1500",
            antennaGain: antGain,
            fadeMargin,
            fresnelClearance: "60",
            isOverGround: overGround,
            powerLimit,
            telemetry,
            video,
            agl: AGL,
            unit,
            calculationMode: mode
        });

        if (chartRef.current) {
            const timeoutId = setTimeout(() => {
                chartRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 300);
            return () => clearTimeout(timeoutId);
        }
    };

    const handleNumericChange = (setter: React.Dispatch<React.SetStateAction<string>>) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setter(e.target.value);

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-gray-100">
            <ParticleBackground />
            <div className="pt-8 pb-16 px-4 max-w-6xl mx-auto">
                <motion.div initial="hidden" animate="visible" variants={Animations.containerVariants} className="space-y-8">
                    <motion.div variants={Animations.itemVariants} className="flex items-center mb-6">
                        <div className="flex items-center">
                            <img src="https://learn.doodlelabs.com/hubfs/mesh%20rider%20logo.png" alt="Mesh Rider Logo" className="h-12 w-auto mr-4" />
                            <div>
                                <h1 className="text-2xl font-bold text-white">Mesh Rider Range Calculator</h1>
                                <p className="text-gray-400 mt-1">Advanced RF analysis for optimizing mesh network range</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div variants={Animations.itemVariants} className="mb-8">
                        <h2 className="text-xl font-medium flex items-center mb-4">
                            <Radio className="w-5 h-5 mr-2 text-amber-400" />
                            <span>Select Radio Variant</span>
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {Object.keys(DEVICES).map((key) => (
                                <DeviceCard
                                    key={key}
                                    deviceKey={key}
                                    device={{
                                        name: DEVICES[key as DeviceKey].name,
                                        image: DEVICES[key as DeviceKey].image
                                    }}
                                    isSelected={srVariant === key}
                                    onClick={() => setSrVariant(key as DeviceKey)}
                                />
                            ))}
                        </div>
                    </motion.div>

                    <motion.div variants={Animations.itemVariants} className="bg-gray-850 rounded-2xl overflow-hidden shadow-xl">
                        <div className="p-6 border-b border-gray-700">
                            <h2 className="text-xl font-medium flex items-center">
                                <Sliders className="w-5 h-5 mr-2 text-amber-400" />
                                <span>Configuration Parameters</span>
                            </h2>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                <InputField label="Telemetry (Kbps)" id="telemetry" value={telemetry} onChange={handleNumericChange(setTelemetry)} type="number" min="0" />
                                <InputField label="Video Stream (Mbps)" id="video" value={video} onChange={handleNumericChange(setVideo)} type="number" min="0" step="0.1" />
                                <InputField label="Center Frequency (MHz)" id="frequency" value={frequency} onChange={handleNumericChange(setFrequency)} type="number" min="1000" max="6000" />
                                <InputField label="Channel Bandwidth (MHz)" id="bw" value={bw} onChange={(e) => setBw(e.target.value)} type="select" options={BANDWIDTH_OPTIONS} />
                                <InputField label="Number of Antennas" id="antennas" value={antennas} onChange={(e) => setAntennas(e.target.value)} type="select" options={ANTENNA_OPTIONS} disabled={srVariant === "1L"} />
                                <InputField label="Number of Data Streams" id="streams" value={streams} onChange={(e) => setStreams(e.target.value)} type="select" options={STREAM_OPTIONS} disabled={srVariant === "1L"} />
                                <InputField label="Fade Margin (dB)" id="fadeMargin" value={fadeMargin} onChange={handleNumericChange(setFadeMargin)} type="number" min="0" max="30" />
                                <InputField label="TX + RX Antenna Gain (dBi)" id="antGain" value={antGain} onChange={handleNumericChange(setAntGain)} type="number" min="0" max="100" />
                                <InputField label="Near Ground Level?" id="overGround" checked={overGround} value={overGround} onChange={(e) => setOverGround((e.target as HTMLInputElement).checked)} type="checkbox" />
                                <div className="relative">
                                    <label className="block text-xs font-medium text-gray-300 mb-1">Height Above Ground Level (AGL)</label>
                                    <div className="flex space-x-2">
                                        <select value={unit} onChange={(e) => handleUnitChange(e.target.value as "feet" | "meters")} className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent">
                                            <option value="meters">Meters</option>
                                            <option value="feet">Feet</option>
                                        </select>
                                        <input type="text" value={AGL} onChange={handleNumericChange(setAGL)} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
                                    </div>
                                </div>
                                <InputField
                                    label="Power Limit (dBm)"
                                    id="powerLimit"
                                    value={powerLimit}
                                    onChange={(e) => setPowerLimit(e.target.value)}
                                    type="select"
                                    options={getPowerLimitOptions(srVariant)}
                                />
                            </div>
                            <div className="flex justify-center pt-6">
                                <motion.button
                                    onClick={() => handleCalculate("mcs0_7")}
                                    disabled={isCalculating}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold py-3 px-10 rounded-full shadow-lg flex items-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isCalculating ? (
                                        <>
                                            <RefreshCw className="w-5 h-5 animate-spin" />
                                            <span>Calculating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <BarChart2 className="w-5 h-5" />
                                            <span>Estimate Range</span>
                                        </>
                                    )}
                                </motion.button>
                            </div>
                            <div className="flex flex-col sm:flex-row justify-center pt-4 gap-4 mt-6 border-t border-gray-700">
                                <div className="pt-4 text-center text-gray-400 mb-2">Calculation Mode:</div>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <motion.button
                                        onClick={() => handleCalculate("mcs0_7")}
                                        disabled={isCalculating}
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        className={`${calculationMode === "mcs0_7" && analysisResults
                                            ? "bg-gradient-to-r from-green-600 to-emerald-600"
                                            : "bg-gradient-to-r from-gray-700 to-gray-600"
                                            } text-white font-medium py-2 px-4 rounded-lg shadow flex items-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all`}
                                        id="mcsButton0_7"
                                    >
                                        {isCalculating && calculationMode === "mcs0_7" ? (
                                            <>
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                <span>Calculating...</span>
                                            </>
                                        ) : (
                                            <>
                                                <BarChart2 className="w-4 h-4" />
                                                <span>MCS 0-7 (Longer Range)</span>
                                            </>
                                        )}
                                    </motion.button>
                                    <motion.button
                                        onClick={() => handleCalculate("mcs8_15")}
                                        disabled={isCalculating || streams === "1"}
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        id="mcsButton8_15"
                                        className={`${calculationMode === "mcs8_15" && analysisResults
                                            ? "bg-gradient-to-r from-violet-600 to-purple-600"
                                            : "bg-gradient-to-r from-gray-700 to-gray-600"
                                            } text-white font-medium py-2 px-4 rounded-lg shadow flex items-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all`}
                                    >
                                        {isCalculating && calculationMode === "mcs8_15" ? (
                                            <>
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                <span>Calculating...</span>
                                            </>
                                        ) : (
                                            <>
                                                <BarChart2 className="w-4 h-4" />
                                                <span>MCS 8-15 (Higher Throughput)</span>
                                            </>
                                        )}
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {analysisResults && (
                        <motion.div initial="hidden" animate="visible" variants={Animations.fadeIn} className="space-y-6" ref={chartRef}>
                            <motion.div variants={Animations.itemVariants} className="bg-gray-850 rounded-2xl overflow-hidden shadow-xl">
                                <div className="p-6 border-b border-gray-700">
                                    <h2 className="text-xl font-medium flex items-center">
                                        <ArrowRight className="w-5 h-5 mr-2 text-amber-400" />
                                        <span>Range Analysis</span>
                                    </h2>
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        {['dual', 'throughput', 'fresnel', 'snr'].map((tab) => (
                                            <button
                                                key={tab}
                                                onClick={() => setActiveTab(tab as any)}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === tab
                                                    ? "bg-blue-600 text-white"
                                                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
                                            >
                                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="overflow-x-auto py-4">
                                        <RFChart
                                            type={activeTab}
                                            data={chartData}
                                            estimatedRange={analysisResults?.finalRange}
                                            aglHeight={analysisResults?.aglM}
                                            calculatorType="range"
                                        />
                                    </div>
                                    <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div className="bg-white-900/50 rounded-xl p-5 border border-gray-800">
                                            <h3 className="text-lg font-medium text-amber-400 mb-4">Range Overview</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-gray-800/50 p-3 rounded-lg">
                                                    <div className="text-sm text-gray-400">Total Throughput</div>
                                                    <div className="text-xl font-medium mt-1">{analysisResults.totalThroughput.toFixed(2)} Mbps</div>
                                                </div>
                                                <div className="bg-gray-800/50 p-3 rounded-lg">
                                                    <div className="text-sm text-gray-400">Estimated Range</div>
                                                    <div className="text-xl font-medium text-green-500 mt-1">{analysisResults.finalRange} meters</div>
                                                </div>
                                                <div className="bg-gray-800/50 p-3 rounded-lg">
                                                    <div className="text-sm text-gray-400">MCS Rate</div>
                                                    <div className="text-xl font-medium mt-1">MCS {analysisResults.finalMcsRate}</div>
                                                </div>
                                                <div className="bg-gray-800/50 p-3 rounded-lg">
                                                    <div className="text-sm text-gray-400">Max Range</div>
                                                    <div className="text-xl font-medium text-amber-400 mt-1">{analysisResults.maxRange} meters</div>
                                                </div>
                                            </div>

                                            <div className="mt-4">
                                                <div
                                                    className="flex justify-between items-center cursor-pointer p-2 rounded hover:bg-gray-800/50"
                                                    onClick={() => toggleAccordion("throughputOptimization")}
                                                >
                                                    <h4 className="font-medium text-white">
                                                        Max Range Throughput Optimization (MCS {analysisResults.finalMcsRate})
                                                    </h4>
                                                    <span className="text-gray-400">
                                                        {accordionState.throughputOptimization ? "▲" : "▼"}
                                                    </span>
                                                </div>

                                                <div className={`transition-all duration-300 overflow-hidden ${accordionState.throughputOptimization ? "max-h-96" : "max-h-0"}`}>
                                                    <div className="p-3 bg-gray-800/30 rounded-lg mt-2 text-sm space-y-2">
                                                        <p className="text-gray-300">
                                                            Current MCS rate is <span className="text-green-500">MCS {analysisResults.finalMcsRate}</span> supporting {analysisResults.totalThroughput.toFixed(2)} Mbps throughput.
                                                        </p>
                                                        {parseFloat(analysisResults.throughputDelta) > 0 && (
                                                            <p className="text-gray-300">
                                                                Reduce throughput by <span className="text-amber-400">-{analysisResults.throughputDelta} Mbps</span> to achieve MCS {analysisResults.maxMcsRate} rate for maximum range.
                                                            </p>
                                                        )}
                                                        {parseFloat(analysisResults.rangeDelta) > 0 && (
                                                            <p className="text-gray-300">
                                                                This could extend range by <span className="text-green-500">+{analysisResults.rangeDelta} meters</span>, for a total of {analysisResults.maxRange} meters.
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white-900/50 rounded-xl p-5 border border-gray-800">
                                            <h3 className="text-lg font-medium text-emerald-400 mb-4">Max Range Fresnel-Zone Optimization</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-gray-800/50 p-3 rounded-lg">
                                                    <div className="text-sm text-gray-400">Required Clearance</div>
                                                    <div className="text-xl font-medium mt-1">{analysisResults.finalAGL} meters</div>
                                                </div>
                                                <div className="bg-gray-800/50 p-3 rounded-lg">
                                                    <div className="text-sm text-gray-400">Current AGL</div>
                                                    <div className="text-xl font-medium mt-1">{analysisResults.aglM.toFixed(2)} meters</div>
                                                </div>
                                                <div className="bg-gray-800/50 p-3 rounded-lg">
                                                    <div className="text-sm text-gray-400">Clearance Margin</div>
                                                    <div className={`text-xl font-medium mt-1 ${analysisResults.aglDeltaPositive ? 'text-green-500' : 'text-red-500'}`}>
                                                        {analysisResults.aglDeltaPositive ? '+' : ''}{analysisResults.aglDelta} meters
                                                    </div>
                                                </div>
                                                <div className="bg-gray-800/50 p-3 rounded-lg">
                                                    <div className="text-sm text-gray-400">AGL Increase Needed</div>
                                                    <div className="text-xl font-medium mt-1">
                                                        {parseFloat(analysisResults.aglIncreaseNeeded) > 0 ? (
                                                            <span className="text-amber-400">{analysisResults.aglIncreaseNeeded} meters</span>
                                                        ) : (
                                                            <span className="text-green-500">0 meters</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-4">
                                                <div
                                                    className="flex justify-between items-center cursor-pointer p-2 rounded hover:bg-gray-800/50"
                                                    onClick={() => toggleAccordion("fresnelOptimization")}
                                                >
                                                    <h4 className="font-medium text-white">Fresnel-Zone Optimization</h4>
                                                    <span className="text-gray-400">
                                                        {accordionState.fresnelOptimization ? "▲" : "▼"}
                                                    </span>
                                                </div>

                                                <div className={`transition-all duration-300 overflow-hidden ${accordionState.fresnelOptimization ? "max-h-96" : "max-h-0"}`}>
                                                    <div className="p-3 bg-gray-800/30 rounded-lg mt-2 text-sm space-y-2">
                                                        <p className="text-gray-300">
                                                            The calculated 60% Required Fresnel-Zone Clearance height is <span className="text-red-500">{analysisResults.finalAGL} meters</span> at a range of {analysisResults.finalRange} meters.
                                                        </p>
                                                        <p className="text-gray-300">
                                                            Your current AGL is <span className={analysisResults.aglDeltaPositive ? 'text-green-500' : 'text-red-500'}>
                                                                {analysisResults.aglM.toFixed(2)} meters
                                                            </span>, resulting in a clearance deficit of <span className={analysisResults.aglDeltaPositive ? 'text-green-500' : 'text-red-500'}>
                                                                {analysisResults.aglDeltaPositive ? '+' : ''}{analysisResults.aglDelta} meters
                                                            </span>.
                                                        </p>
                                                        {parseFloat(analysisResults.aglIncreaseNeeded) > 0 && (
                                                            <p className="text-gray-300">
                                                                Increasing AGL by <span className="text-amber-400">{analysisResults.aglIncreaseNeeded} meters</span> could add up to <span className="text-green-500">+{analysisResults.rangeDelta} meters</span> of range.
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div variants={Animations.itemVariants} className="bg-gray-850 rounded-2xl overflow-hidden shadow-xl">
                                <div className="p-6 border-b border-gray-700">
                                    <h2 className="text-xl font-medium flex items-center">
                                        <Layers className="w-5 h-5 mr-2 text-amber-400" />
                                        <span>Detailed MCS Results</span>
                                    </h2>
                                </div>
                                <div className="divide-y divide-gray-700">
                                    {analysisResults.rangeResults.map((result, index) => (
                                        <McsRangeItem key={`mcs-result-${index}`} result={result} />
                                    ))}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}

                    <motion.div variants={Animations.itemVariants} className="text-center text-xs text-gray-500 mt-8">
                        <p>Mesh Rider Range Estimation Tool</p>
                        <p className="mt-1">Results are theoretical and may vary based on environmental conditions.</p>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default RangeCalculator;