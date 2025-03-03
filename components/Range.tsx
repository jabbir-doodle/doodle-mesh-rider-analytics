import React, { useState, useEffect, useRef, FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
    Line, Area, ComposedChart, ReferenceLine, ScatterChart, Scatter, ZAxis, AreaChart
} from "recharts";
import {
    Sliders, Wifi, Zap, ChevronDown, ChevronUp, Activity, RefreshCw, ArrowRight,
    Eye, Radio, BarChart2, CloudRain, Thermometer, Map, Signal, Layers
} from "lucide-react";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05, delayChildren: 0.1 }
    },
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0, opacity: 1,
        transition: { type: "spring", stiffness: 80 },
    },
};

const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.4 } },
};

const InputField = ({
    label, id, value, onChange, type = "text", min, max, step,
    options, disabled, checked, className = ""
}) => (
    <div className={`relative ${className}`}>
        <label htmlFor={id} className="block text-xs font-medium text-gray-300 mb-1">
            {label}
        </label>
        {type === "select" ? (
            <select
                id={id} value={value} onChange={onChange} disabled={disabled}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
                {options?.map(option => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        ) : type === "checkbox" ? (
            <div className="flex items-center mt-2">
                <input
                    type="checkbox" id={id} checked={checked} onChange={onChange}
                    className="h-4 w-4 text-amber-500 focus:ring-amber-500 border-gray-700 rounded"
                />
                <span className="ml-2 text-sm text-gray-300">{label}</span>
            </div>
        ) : (
            <input
                type={type} id={id} value={value} onChange={onChange}
                min={min} max={max} step={step}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            />
        )}
    </div>
);

const DeviceCard = ({ deviceKey, device, isSelected, onClick }) => {
    const getDeviceColor = (key) => {
        const colors = {
            "1L": "blue", "2L": "amber", "2KO": "violet", "2KW": "emerald"
        };
        return colors[key] || "amber";
    };
    
    const color = getDeviceColor(deviceKey);

    return (
        <motion.div
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`bg-gray-800 hover:bg-gray-750 rounded-xl overflow-hidden transition-all duration-200 cursor-pointer h-full ${
                isSelected ? `ring-2 ring-${color}-500 shadow-lg shadow-${color}-500/20` : "ring-1 ring-gray-700"
            }`}
        >
            <div className="p-4 flex flex-col items-center h-full">
                <div className={`w-full h-20 flex items-center justify-center mb-4 rounded-lg ${
                    isSelected ? `bg-${color}-950/30` : 'bg-gray-900/30'
                }`}>
                    <img src={device.image} alt={device.name} className="h-16 w-auto object-contain" />
                </div>
                <div className="text-center">
                    <h3 className={`font-medium ${isSelected ? `text-${color}-400` : 'text-gray-200'}`}>
                        {device.name}
                    </h3>
                    {isSelected && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-${color}-500/20 text-${color}-400 mt-1`}>
                            Selected
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

const McsRangeItem = ({ result }) => {
    const textClass = result.withinThroughput ? "text-green-500" : "text-red-500";
    const clearanceClass = result.withinClearance ? "text-green-500" : "text-red-500";
    
    return (
        <div className="p-2 flex flex-col border-b border-gray-700 last:border-b-0">
            <div className="flex justify-between items-center">
                <span className={`font-medium ${textClass}`}>MCS {result.mcs}</span>
                <div>
                    <span className={textClass}>{result.range}m</span>
                    <span className="text-gray-400 mx-1">|</span>
                    <span className={textClass}>{result.throughput} Mbps</span>
                </div>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs">
                <span className="text-gray-400">Fresnel Zone Clearance:</span>
                <span className={clearanceClass}>{result.fresnelClearance}m</span>
            </div>
        </div>
    );
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-gray-900 p-3 border border-gray-700 rounded-lg shadow-xl">
                <p className="font-medium text-white mb-1">Distance: {label} meters</p>
                <p className="text-amber-400 text-sm">
                    <span className="inline-block w-3 h-3 bg-amber-400 rounded-full mr-2"></span>
                    Throughput: {payload[0].value} Mbps
                </p>
                <p className="text-emerald-400 text-sm">
                    <span className="inline-block w-3 h-3 bg-emerald-400 rounded-full mr-2"></span>
                    Fresnel Zone: {payload[1].value} meters
                </p>
                <p className="text-gray-300 text-sm mt-1">MCS: {payload[0].payload.mcs}</p>
            </div>
        );
    }
    return null;
};

const Constants = {
    ipv4: 20,
    eth2: 14, 
    batAdv: 10, 
    llc: 8, 
    ieee80211: 42, 
    phy: 4,
    mpduDelimiter: 0, 
    aifs: 8, 
    cwSize: 15, 
    phyHeader11n: 40, 
    ltf: 4, 
    sifs: 10, 
    baSize: 32,
    txop: 100000,
    psr: 90
};

const RangeCalculator = () => {
    // Basic parameters
    const [telemetry, setTelemetry] = useState("50");
    const [video, setVideo] = useState("3");
    const [frequency, setFrequency] = useState("2450");
    const [bw, setBw] = useState(20);
    const [udpPayload] = useState(1500);
    const [antennas, setAntennas] = useState(2);
    const [streams, setStreams] = useState(2);
    const [fadeMargin, setFadeMargin] = useState("10");
    const [antGain, setAntGain] = useState("6");
    const [overGround, setOverGround] = useState(false);
    const [AGL, setAGL] = useState("400");
    const [unit, setUnit] = useState("feet");
    const [powerLimit, setPowerLimit] = useState("33");
    const [srVariant, setSrVariant] = useState("2L");
    
    // New environmental parameters
    const [climate, setClimate] = useState("clear");
    const [temperature, setTemperature] = useState(25);
    const [pathLossModel, setPathLossModel] = useState("free");
    
    // UI state
    const [chartData, setChartData] = useState([]);
    const [snrData, setSnrData] = useState([]);
    const [coverageData, setCoverageData] = useState([]);
    const [analysisResults, setAnalysisResults] = useState(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [calculationMode, setCalculationMode] = useState("mcs8_15");
    const [advancedOpen, setAdvancedOpen] = useState(false);
    const [accordionState, setAccordionState] = useState({
        throughputOptimization: false,
        fresnelOptimization: false,
        environmentalFactors: false
    });
    const [activeTab, setActiveTab] = useState("range");
    
    const chartRef = useRef(null);

    const radioModels = {
        "1L": {
            name: "nanoOEM",
            power: [24, 23, 23, 23, 22, 21, 20, 18],
            sensitivity: [-87, -85, -83, -81, -77, -73, -71, -69],
            modulation: ["BPSK", "QPSK", "QPSK", "16-QAM", "16-QAM", "64-QAM", "64-QAM", "64-QAM"],
            codingRate: [1/2, 1/2, 3/4, 1/2, 3/4, 2/3, 3/4, 5/6],
            bitsPerSymbol: [1, 2, 2, 4, 4, 6, 6, 6],
            image: "/nano.png"
        },
        "2L": {
            name: "miniOEM",
            power: [27, 26, 26, 26, 25, 24, 23, 21],
            sensitivity: [-87, -85, -83, -81, -77, -73, -71, -69],
            modulation: ["BPSK", "QPSK", "QPSK", "16-QAM", "16-QAM", "64-QAM", "64-QAM", "64-QAM"],
            codingRate: [1/2, 1/2, 3/4, 1/2, 3/4, 2/3, 3/4, 5/6],
            bitsPerSymbol: [1, 2, 2, 4, 4, 6, 6, 6],
            image: "/mini.png"
        },
        "2KO": {
            name: "OEM",
            power: [27, 26, 26, 26, 25, 24, 23, 21],
            sensitivity: [-87, -85, -83, -81, -77, -73, -71, -69],
            modulation: ["BPSK", "QPSK", "QPSK", "16-QAM", "16-QAM", "64-QAM", "64-QAM", "64-QAM"],
            codingRate: [1/2, 1/2, 3/4, 1/2, 3/4, 2/3, 3/4, 5/6],
            bitsPerSymbol: [1, 2, 2, 4, 4, 6, 6, 6],
            image: "/oem.png"
        },
        "2KW": {
            name: "Wearable",
            power: [27, 26, 26, 26, 25, 24, 23, 21],
            sensitivity: [-87, -85, -83, -81, -77, -73, -71, -69],
            modulation: ["BPSK", "QPSK", "QPSK", "16-QAM", "16-QAM", "64-QAM", "64-QAM", "64-QAM"],
            codingRate: [1/2, 1/2, 3/4, 1/2, 3/4, 2/3, 3/4, 5/6],
            bitsPerSymbol: [1, 2, 2, 4, 4, 6, 6, 6],
            image: "/wear.png"
        }
    };

    useEffect(() => {
        if (srVariant === "1L") {
            // Only enforce max power limit for 1L devices
            if (parseFloat(powerLimit) > 30) setPowerLimit("30");
            setAntennas(1);
            setStreams(1);
        } else {
            // For non-1L devices, only enforce antenna/stream minimums
            // Removed the minimum power limit constraint
            if (antennas < 2) setAntennas(2);
            if (streams < 2) setStreams(2);
        }
    }, [srVariant, powerLimit]);

    const convertAGLUnit = (newUnit) => {
        if (newUnit !== unit) {
            let newAGL;
            if (newUnit === "meters") {
                newAGL = parseFloat(AGL) / 3.28084;
            } else {
                newAGL = parseFloat(AGL) * 3.28084;
            }
            setAGL(newAGL.toFixed(2));
            setUnit(newUnit);
        }
    };

    const toggleAccordion = (section) => {
        setAccordionState({
            ...accordionState,
            [section]: !accordionState[section],
        });
    };

    const handleNumericChange = (setter) => (e) => {
        setter(e.target.value);
    };

    const calculatePathLoss = (distance, freq) => {
        const freqGHz = freq / 1000;
        let baseLoss = 0;
        
        // Calculate base path loss based on selected model
        if (pathLossModel === "free") {
            baseLoss = 20 * Math.log10(distance) + 20 * Math.log10(freqGHz) + 92.45;
        } else if (pathLossModel === "ground") {
            const h1 = unit === "feet" ? parseFloat(AGL) / 3.28084 : parseFloat(AGL); // Height in meters
            const h2 = h1; // Assuming same height for both ends
            baseLoss = 20 * Math.log10(distance) + 20 * Math.log10(freqGHz) + 92.45 - 
                     20 * Math.log10(h1*h2) + 10;
        } else if (pathLossModel === "urban") {
            baseLoss = 20 * Math.log10(distance) + 20 * Math.log10(freqGHz) + 92.45 + 
                     (distance < 500 ? 0 : 20);
        } else {
            baseLoss = 20 * Math.log10(distance) + 20 * Math.log10(freqGHz) + 92.45;
        }
        
        // Apply climate attenuation factors
        let climateAttenuation = 0;
        
        switch (climate) {
            case "rain":
                // ITU-R P.838-3 model (simplified)
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
                const humidityFactor = Math.abs(temperature - 25) / 10; // Temperature deviation factor
                climateAttenuation = 0.0003 * Math.pow(freqGHz, 2) * humidityFactor * distance / 1000;
                break;
            case "clear":
            default:
                climateAttenuation = 0;
        }
        
        // Temperature effects on electronics (simplified)
        let temperatureEffect = 0;
        if (temperature < 0) {
            temperatureEffect = Math.abs(temperature) * 0.05; // Cold degrades performance
        } else if (temperature > 40) {
            temperatureEffect = (temperature - 40) * 0.1; // Heat degrades performance more rapidly
        }
        
        return baseLoss + climateAttenuation + temperatureEffect;
    };

    const calculateRange = (mode) => {
        setIsCalculating(true);
        setCalculationMode(mode);

        const actualStreams = mode === "mcs0_7" ? 1 : streams;

        setTimeout(() => {
            const telemetryMbps = parseFloat(telemetry) / 1000;
            const totalThroughput = telemetryMbps + parseFloat(video);
            const AGLm = unit === "feet" ? parseFloat(AGL) / 3.28084 : parseFloat(AGL);
            const freqMhz = parseFloat(frequency);

            let ampdu = 10;
            let stbw = bw > 20 ? 20 : bw;
            const slotTime = 4 + Math.ceil((17 * 5) / stbw);
            const phyOverhead =
                (Constants.aifs + Constants.cwSize) * slotTime +
                (Constants.phyHeader11n + actualStreams * Constants.ltf) * 20 / bw;

            let freqCorrection = 0;
            if (overGround) {
                freqCorrection = Math.round(
                    10000 * (-0.0000000000313 * Math.pow(freqMhz, 3) +
                            0.0000004618 * Math.pow(freqMhz, 2) -
                            0.0024096 * freqMhz + 5.8421)
                ) / 10000;
                if (ampdu > 2) ampdu = 2;
            }

            const rangeArr = [];
            const mcsIndexArr = [];
            const tptAdjusted = [];
            const fresnelClearanceDistance = [];
            const rangeCalculationResults = [];
            const snrValues = [];

            let currentRadioModel = { ...radioModels[srVariant] };
            let sensitivityArr = [...currentRadioModel.sensitivity];
            let powerArr = [...currentRadioModel.power];

            let finalAGL = 0;
            let rangeEstFinal = 0;
            let finalMcsRate = 0;
            let rangeEstMax = 0;
            let maxAGL = 0;
            let maxMcsRate = 0;

            for (let index = 0; index < 8; index++) {
                // Apply power limit
                powerArr[index] = Math.min(powerArr[index], parseFloat(powerLimit) - 3);
                
                // Adjust sensitivity based on antenna configuration and bandwidth
                sensitivityArr[index] = sensitivityArr[index] -
                                      10 * Math.log10(antennas / actualStreams) -
                                      10 * Math.log10(20 / bw);

                // Calculate MCS index
                mcsIndexArr[index] = index + (actualStreams - 1) * 8;

                // Calculate link speed
                const linkSpeed = currentRadioModel.bitsPerSymbol[index] *
                                currentRadioModel.codingRate[index] *
                                actualStreams * 13 * bw / 20;

                // Calculate basic speed
                const basicSpeed = 12 * (bw / 20) *
                                currentRadioModel.bitsPerSymbol[index] *
                                Math.min(currentRadioModel.codingRate[index], 0.75);

                // Determine maximum frames that can be aggregated
                const maxFrames = Math.max(
                    Math.min(
                        Constants.txop / (((udpPayload + Constants.ipv4 + Constants.eth2 + 
                                         Constants.batAdv + Constants.llc + 
                                         Constants.ieee80211 + Constants.phy) * 8) / linkSpeed),
                        ampdu
                    ),
                    1
                );

                // Calculate aggregated payload size
                const ampduWindow = (udpPayload + Constants.ipv4 + Constants.eth2 + 
                                   Constants.batAdv + Constants.llc + 
                                   Constants.ieee80211 + Constants.phy) * maxFrames;

                // Calculate PHY transmission time
                const phyTime = (ampdu - 1) * Constants.mpduDelimiter +
                              Math.ceil((ampduWindow * 8 / linkSpeed) / 4) * 4;

                // Calculate BA response time
                const baRes = Constants.sifs + (Constants.phyHeader11n + actualStreams * Constants.ltf) +
                            Math.ceil((Constants.baSize * 8) / (basicSpeed * (bw / 20)));

                // Calculate range with climate and temperature adjustments
                // First, get base range without environmental factors
                const baseRange = Math.pow(
                    10, (powerArr[index] - sensitivityArr[index] - parseFloat(fadeMargin) + parseFloat(antGain)) / 
                        (20 + freqCorrection)
                ) * 300 / (freqMhz * 4 * Math.PI);
                
                // Iteratively adjust range based on environmental factors
                let adjustedRange = baseRange;
                let prevRange = 0;
                
                // Iterative approach to find stable range with environmental factors
                for (let i = 0; i < 5; i++) {  // Usually converges in 3-5 iterations
                    const pathLoss = calculatePathLoss(adjustedRange, freqMhz);
                    const envAdjustment = pathLoss - (20 * Math.log10(adjustedRange) + 20 * Math.log10(freqMhz/1000) + 92.45);
                    
                    prevRange = adjustedRange;
                    adjustedRange = Math.pow(
                        10, (powerArr[index] - sensitivityArr[index] - parseFloat(fadeMargin) + parseFloat(antGain) - envAdjustment) / 
                            (20 + freqCorrection)
                    ) * 300 / (freqMhz * 4 * Math.PI);
                    
                    // Check for convergence
                    if (Math.abs(adjustedRange - prevRange) < 0.1) break;
                }
                
                // Store the adjusted range
                rangeArr[index] = parseFloat(adjustedRange.toFixed(1));

                // Calculate SNR
                const noiseFloor = -174 + 10 * Math.log10(bw * 1e6);  // Thermal noise in dBm
                const receivedPower = powerArr[index] + parseFloat(antGain) - 
                                   calculatePathLoss(rangeArr[index], freqMhz);
                snrValues[index] = parseFloat((receivedPower - noiseFloor).toFixed(1));

                // Calculate transit delay
                const nWayTransit = Math.round((1000 * 4 * rangeArr[index]) / 300) / 1000;
                
                // Calculate total transmission time
                const timeNoTransit = phyTime + phyOverhead + baRes;
                const timeTotal = parseFloat((timeNoTransit + nWayTransit).toFixed(1));
                
                // Calculate throughput
                const tptIdeal = parseFloat((maxFrames * udpPayload * 8 / timeNoTransit).toFixed(1));
                const tptMax = parseFloat((maxFrames * udpPayload * 8 / timeTotal).toFixed(1));
                tptAdjusted[index] = parseFloat((tptMax * Constants.psr / 100).toFixed(2));

                // Calculate Fresnel zone clearance
                fresnelClearanceDistance[index] = parseFloat(
                    (8.66 * Math.sqrt(rangeArr[index] / freqMhz) * 60 / 100).toFixed(1)
                );

                // Build detailed result for each MCS
                rangeCalculationResults.push({
                    mcs: mcsIndexArr[index],
                    range: rangeArr[index],
                    throughput: tptAdjusted[index],
                    fresnelClearance: fresnelClearanceDistance[index],
                    withinThroughput: totalThroughput <= tptAdjusted[index],
                    withinClearance: AGLm >= fresnelClearanceDistance[index],
                    snr: snrValues[index],
                    modulation: currentRadioModel.modulation[index],
                    codingRate: currentRadioModel.codingRate[index]
                });

                // Determine range estimation based on throughput and clearance requirements
                if (index === 0) {
                    finalAGL = fresnelClearanceDistance[index];
                    rangeEstFinal = rangeArr[index];
                    finalMcsRate = mcsIndexArr[index];
                    rangeEstMax = rangeArr[index];
                    maxAGL = fresnelClearanceDistance[index];
                    maxMcsRate = mcsIndexArr[index];
                } else if (totalThroughput > tptAdjusted[index - 1]) {
                    rangeEstFinal = rangeArr[index];
                    finalMcsRate = mcsIndexArr[index];
                    finalAGL = fresnelClearanceDistance[index];
                } else if (AGLm < fresnelClearanceDistance[index - 1]) {
                    rangeEstFinal = rangeArr[index];
                    finalAGL = fresnelClearanceDistance[index];
                    finalMcsRate = mcsIndexArr[index];
                }
            }

            // Prepare chart data
            const chartData = rangeArr.map((range, idx) => ({
                distance: range,
                throughput: tptAdjusted[idx],
                fresnelClearance: fresnelClearanceDistance[idx],
                mcs: mcsIndexArr[idx],
                snr: snrValues[idx],
                estimatedRange: range === rangeEstFinal,
            }));

            // Prepare SNR data
            const snrData = rangeArr.map((range, idx) => ({
                distance: range,
                snr: snrValues[idx],
                mcs: mcsIndexArr[idx],
            }));

            // Prepare coverage data for the map
            const coverageData = [];
            for (let i = 0; i < 8; i++) {
                for (let angle = 0; angle < 360; angle += 45) {
                    const radian = angle * Math.PI / 180;
                    coverageData.push({
                        x: Math.cos(radian) * rangeArr[i],
                        y: Math.sin(radian) * rangeArr[i],
                        z: tptAdjusted[i],
                        mcs: mcsIndexArr[i]
                    });
                }
            }

            // Calculate climate impact on range
            let climateRangeImpact = 0;
            let climateThroughputImpact = 0;
            
            if (climate !== "clear") {
                // Compare with a calculation without climate effects
                const baseRange = Math.pow(
                    10, (powerArr[0] - sensitivityArr[0] - parseFloat(fadeMargin) + parseFloat(antGain)) / 
                        (20 + freqCorrection)
                ) * 300 / (freqMhz * 4 * Math.PI);
                
                climateRangeImpact = ((baseRange - rangeArr[0]) / baseRange * 100).toFixed(1);
                climateThroughputImpact = ((baseRange - rangeArr[0]) / baseRange * tptAdjusted[0]).toFixed(1);
            }

            // Set analysis results
            setAnalysisResults({
                radioVariant: srVariant,
                mcsMode: mode,
                totalThroughput,
                finalRange: rangeEstFinal,
                finalMcsRate,
                maxRange: rangeEstMax,
                maxMcsRate,
                maxThroughput: tptAdjusted[0],
                throughputDelta: Math.max(0, totalThroughput - tptAdjusted[0]).toFixed(2),
                rangeDelta: Math.max(0, rangeEstMax - rangeEstFinal).toFixed(2),
                finalAGL,
                aglM: AGLm,
                aglDelta: (AGLm - finalAGL).toFixed(2),
                aglDeltaPositive: AGLm - finalAGL > 0,
                aglIncreaseNeeded: Math.max(0, maxAGL - AGLm).toFixed(2),
                rangeResults: rangeCalculationResults,
                climate,
                temperature,
                pathLossModel,
                climateRangeImpact,
                climateThroughputImpact,
                maxSNR: snrValues[0],
                minSNR: snrValues[snrValues.length - 1]
            });

            // Set chart data
            setChartData(chartData);
            setSnrData(snrData);
            setCoverageData(coverageData);
            setIsCalculating(false);

            // Scroll to results
            setTimeout(() => {
                if (chartRef.current) {
                    chartRef.current.scrollIntoView({ behavior: "smooth" });
                }
            }, 500);
        }, 800);
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case "range":
                return (
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                                <XAxis
                                    dataKey="distance"
                                    type="number"
                                    domain={['dataMin', 'dataMax']}
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
                                        fill: "#10b981"
                                    }}
                                    stroke="#10b981"
                                    tick={{ fill: "#94a3b8" }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ paddingTop: "1rem" }} />

                                <ReferenceLine
                                    x={analysisResults?.finalRange}
                                    stroke="#FFFFFF"
                                    strokeDasharray="5 5"
                                    yAxisId="left"
                                    label={{
                                        value: "Estimated Range",
                                        position: "top",
                                        fill: "#FFFFFF"
                                    }}
                                />

                                <Area
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="throughput"
                                    name="Throughput (Mbps)"
                                    stroke="#F59E0B"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#gradientThroughput)"
                                    activeDot={{ r: 8, fill: "#F59E0B", stroke: "#000" }}
                                    animationDuration={1500}
                                />

                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="fresnelClearance"
                                    name="Fresnel Zone (m)"
                                    stroke="#10B981"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: "#10B981", stroke: "#000" }}
                                    activeDot={{ r: 8, fill: "#10B981", stroke: "#000" }}
                                    animationDuration={1500}
                                />

                                <ReferenceLine
                                    y={analysisResults?.aglM}
                                    yAxisId="right"
                                    stroke="#FFFFFF"
                                    strokeDasharray="5 5"
                                    label={{
                                        value: "Current AGL",
                                        position: "insideTopRight",
                                        fill: "#FFFFFF"
                                    }}
                                />
                                
                                <defs>
                                    <linearGradient id="gradientThroughput" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.1}/>
                                    </linearGradient>
                                </defs>
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                );
                
            case "snr":
                return (
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={snrData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                                <XAxis
                                    dataKey="distance"
                                    type="number"
                                    domain={['dataMin', 'dataMax']}
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
                                <Tooltip />
                                <Legend />
                                
                                <ReferenceLine
                                    y={25}
                                    stroke="#10b981"
                                    strokeDasharray="3 3"
                                    label={{ value: 'Excellent', position: 'right', fill: '#10b981' }}
                                />
                                <ReferenceLine
                                    y={15}
                                    stroke="#eab308"
                                    strokeDasharray="3 3"
                                    label={{ value: 'Good', position: 'right', fill: '#eab308' }}
                                />
                                <ReferenceLine
                                    y={10}
                                    stroke="#f97316"
                                    strokeDasharray="3 3"
                                    label={{ value: 'Fair', position: 'right', fill: '#f97316' }}
                                />
                                <ReferenceLine
                                    y={5}
                                    stroke="#ef4444"
                                    strokeDasharray="3 3"
                                    label={{ value: 'Poor', position: 'right', fill: '#ef4444' }}
                                />
                                
                                <Line
                                    type="monotone"
                                    dataKey="snr"
                                    name="Signal-to-Noise Ratio (dB)"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: "#3b82f6", stroke: "#000" }}
                                    activeDot={{ r: 8, fill: "#3b82f6", stroke: "#000" }}
                                />
                                
                                <ReferenceLine
                                    x={analysisResults?.finalRange}
                                    stroke="#FFFFFF"
                                    strokeDasharray="5 5"
                                    label={{
                                        value: "Estimated Range",
                                        position: "top",
                                        fill: "#FFFFFF"
                                    }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                );
                
            case "coverage":
                return (
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                                <XAxis
                                    type="number"
                                    dataKey="x"
                                    name="Distance (m)"
                                    stroke="#94a3b8"
                                    tick={{ fill: "#94a3b8" }}
                                    domain={[-analysisResults?.maxRange || -500, analysisResults?.maxRange || 500]}
                                />
                                <YAxis
                                    type="number"
                                    dataKey="y"
                                    name="Distance (m)"
                                    stroke="#94a3b8"
                                    tick={{ fill: "#94a3b8" }}
                                    domain={[-analysisResults?.maxRange || -500, analysisResults?.maxRange || 500]}
                                />
                                <ZAxis
                                    type="number"
                                    dataKey="z"
                                    range={[20, 200]}
                                    name="Throughput (Mbps)"
                                />
                                <Tooltip
                                    cursor={{ strokeDasharray: '3 3' }}
                                    formatter={(value, name, props) => {
                                        if (name === 'z') return [`${props.payload.z} Mbps`, 'Throughput'];
                                        return [value, name];
                                    }}
                                />
                                <Legend />
                                <Scatter
                                    name="Coverage Map"
                                    data={coverageData}
                                    fill="#8884d8"
                                    shape={(props) => {
                                        const { cx, cy, fill } = props;
                                        const throughput = props.payload.z;
                                        const color = `hsl(${Math.min(200, 360 - throughput * 2)}, 100%, 50%)`;
                                        return (
                                            <circle
                                                cx={cx}
                                                cy={cy}
                                                r={5}
                                                stroke="none"
                                                fill={color}
                                                fillOpacity={0.8}
                                            />
                                        );
                                    }}
                                />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                );
                
            default:
                return renderTabContent("range");
        }
    };

    const getClimateImpactDescription = () => {
        if (climate === "clear") {
            return "Clear sky conditions provide optimal signal propagation.";
        } else {
            const impactDescriptions = {
                rain: "Rain causes signal absorption and scattering, significantly reducing range at higher frequencies.",
                fog: "Fog creates moisture-based signal absorption, particularly affecting higher frequencies.",
                snow: "Snow causes severe signal scattering and absorption, significantly reducing range.",
                humid: "High humidity increases water vapor in the air, causing absorption at specific frequencies."
            };
            
            return `${impactDescriptions[climate]} Range reduced by approximately ${analysisResults?.climateRangeImpact}%.`;
        }
    };

    const getRecommendationForClimate = () => {
        const recommendations = {
            rain: "Increase fade margin, use lower frequencies, and ensure proper enclosures for equipment.",
            fog: "Consider lower frequencies when possible, and increase antenna gain.",
            snow: "Significant fade margin increase recommended; use lower frequencies when possible.",
            humid: "Consider increased antenna gain to overcome attenuation in humid conditions."
        };
        
        return climate === "clear" 
            ? "Standard installation practices are sufficient for current environmental conditions." 
            : recommendations[climate];
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
                                    Mesh Rider Range Calculator
                                </h1>
                                <p className="text-gray-400 mt-1">
                                    Advanced RF analysis for optimizing mesh network range with environmental adaptability
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-medium flex items-center">
                                <Radio className="w-5 h-5 mr-2 text-amber-400" />
                                <span>Select Radio Variant</span>
                            </h2>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {Object.keys(radioModels).map((deviceKey) => {
                                const device = {
                                    name: radioModels[deviceKey].name || "",
                                    image: radioModels[deviceKey].image || ""
                                };
                                const isSelected = srVariant === deviceKey;

                                return (
                                    <DeviceCard
                                        key={deviceKey}
                                        deviceKey={deviceKey}
                                        device={device}
                                        isSelected={isSelected}
                                        onClick={() => setSrVariant(deviceKey)}
                                    />
                                );
                            })}
                        </div>
                    </motion.div>

                    <motion.div
                        variants={itemVariants}
                        className="bg-gray-850 rounded-2xl overflow-hidden shadow-xl"
                    >
                        <div className="p-6 border-b border-gray-700">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-medium flex items-center">
                                    <Sliders className="w-5 h-5 mr-2 text-amber-400" />
                                    <span>Configuration Parameters</span>
                                </h2>
                                <button
                                    onClick={() => setAdvancedOpen(prev => !prev)}
                                    className="flex items-center text-sm px-3 py-1 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                <InputField
                                    label="Telemetry (Kbps)"
                                    id="telemetry"
                                    value={telemetry}
                                    onChange={handleNumericChange(setTelemetry)}
                                    type="number"
                                    min="0"
                                />

                                <InputField
                                    label="Video Stream (Mbps)"
                                    id="video"
                                    value={video}
                                    onChange={handleNumericChange(setVideo)}
                                    type="number"
                                    min="0"
                                    step="0.1"
                                />

                                <InputField
                                    label="Center Frequency (MHz)"
                                    id="frequency"
                                    value={frequency}
                                    onChange={handleNumericChange(setFrequency)}
                                    type="number"
                                    min="1000"
                                    max="6000"
                                />

                                <InputField
                                    label="Channel Bandwidth (MHz)"
                                    id="bw"
                                    value={bw}
                                    onChange={(e) => setBw(parseInt(e.target.value))}
                                    type="select"
                                    options={[
                                        { value: 3, label: "3 MHz" },
                                        { value: 5, label: "5 MHz" },
                                        { value: 10, label: "10 MHz" },
                                        { value: 15, label: "15 MHz" },
                                        { value: 20, label: "20 MHz" },
                                        { value: 26, label: "26 MHz" },
                                        { value: 40, label: "40 MHz" }
                                    ]}
                                />

                                <InputField
                                    label="Near Ground Level?"
                                    id="overGround"
                                    checked={overGround}
                                    onChange={(e) => setOverGround(e.target.checked)}
                                    type="checkbox"
                                />

                                <div className="relative">
                                    <label className="block text-xs font-medium text-gray-300 mb-1">
                                        Height Above Ground Level (AGL)
                                    </label>
                                    <div className="flex space-x-2">
                                        <select
                                            value={unit}
                                            onChange={(e) => convertAGLUnit(e.target.value)}
                                            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                        >
                                            <option value="meters">Meters</option>
                                            <option value="feet">Feet</option>
                                        </select>
                                        <input
                                            type="text"
                                            value={AGL}
                                            onChange={handleNumericChange(setAGL)}
                                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                {/* Environmental Parameters */}
                                <InputField
                                    label="Climate Condition"
                                    id="climate"
                                    value={climate}
                                    onChange={(e) => setClimate(e.target.value)}
                                    type="select"
                                    options={[
                                        { value: "clear", label: "Clear Sky" },
                                        { value: "rain", label: "Rain" },
                                        { value: "fog", label: "Fog" },
                                        { value: "snow", label: "Snow" },
                                        { value: "humid", label: "High Humidity" }
                                    ]}
                                />

                                <InputField
                                    label="Path Loss Model"
                                    id="pathLossModel"
                                    value={pathLossModel}
                                    onChange={(e) => setPathLossModel(e.target.value)}
                                    type="select"
                                    options={[
                                        { value: "free", label: "Free Space" },
                                        { value: "ground", label: "2-Ray Ground" },
                                        { value: "urban", label: "Urban" }
                                    ]}
                                />

                                <InputField
                                    label="Ambient Temperature (°C)"
                                    id="temperature"
                                    value={temperature}
                                    onChange={(e) => setTemperature(parseInt(e.target.value))}
                                    type="number"
                                    min="-20"
                                    max="50"
                                />

                                {advancedOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="col-span-full overflow-hidden"
                                    >
                                        <div className="pt-4 border-t border-gray-700 mt-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                                <InputField
                                                    label="Number of Antennas"
                                                    id="antennas"
                                                    value={antennas}
                                                    onChange={(e) => setAntennas(parseInt(e.target.value))}
                                                    type="select"
                                                    options={[
                                                        { value: 1, label: "1" },
                                                        { value: 2, label: "2" }
                                                    ]}
                                                    disabled={srVariant === "1L"}
                                                />

                                                <InputField
                                                    label="Number of Data Streams"
                                                    id="streams"
                                                    value={streams}
                                                    onChange={(e) => setStreams(parseInt(e.target.value))}
                                                    type="select"
                                                    options={[
                                                        { value: 1, label: "1" },
                                                        { value: 2, label: "2" }
                                                    ]}
                                                    disabled={srVariant === "1L"}
                                                />

                                                <InputField
                                                    label="Fade Margin (dB)"
                                                    id="fadeMargin"
                                                    value={fadeMargin}
                                                    onChange={handleNumericChange(setFadeMargin)}
                                                    type="number"
                                                    min="0"
                                                    max="30"
                                                />

                                                <InputField
                                                    label="TX + RX Antenna Gain (dBi)"
                                                    id="antGain"
                                                    value={antGain}
                                                    onChange={handleNumericChange(setAntGain)}
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                />

                                                <InputField
                                                    label="Power Limit (dBm)"
                                                    id="powerLimit"
                                                    value={powerLimit}
                                                    onChange={handleNumericChange(setPowerLimit)}
                                                    type="number"
                                                    min="0"
                                                    max={srVariant === "1L" ? "30" : "33"}
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            <div className="flex justify-center pt-6">
                                <motion.button
                                    onClick={() => calculateRange("mcs0_7")}
                                    disabled={isCalculating}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold py-3 px-10 rounded-full shadow-lg flex items-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
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
                                        onClick={() => calculateRange("mcs0_7")}
                                        disabled={isCalculating}
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        className={`${calculationMode === "mcs0_7" && analysisResults
                                            ? "bg-gradient-to-r from-green-600 to-emerald-600"
                                            : "bg-gradient-to-r from-gray-700 to-gray-600"
                                            } text-white font-medium py-2 px-4 rounded-lg shadow flex items-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all`}
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
                                        onClick={() => calculateRange("mcs8_15")}
                                        disabled={isCalculating}
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
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
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={fadeIn}
                            className="space-y-6"
                            ref={chartRef}
                        >
                            <motion.div variants={itemVariants} className="bg-gray-850 rounded-2xl overflow-hidden shadow-xl">
                                <div className="p-6 border-b border-gray-700">
                                    <div className="flex flex-wrap items-center justify-between">
                                        <h2 className="text-xl font-medium flex items-center mb-4 md:mb-0">
                                            <Activity className="w-5 h-5 mr-2 text-amber-400" />
                                            <span>RF Performance Analysis</span>
                                        </h2>
                                        
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => setActiveTab("range")}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                                    activeTab === "range" 
                                                    ? "bg-amber-600 text-white" 
                                                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                                                }`}
                                            >
                                                <Activity className="w-4 h-4 inline mr-1" />
                                                Range Analysis
                                            </button>
                                            
                                            <button
                                                onClick={() => setActiveTab("snr")}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                                    activeTab === "snr" 
                                                    ? "bg-blue-600 text-white" 
                                                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                                                }`}
                                            >
                                                <Signal className="w-4 h-4 inline mr-1" />
                                                SNR Analysis
                                            </button>
                                            
                                            <button
                                                onClick={() => setActiveTab("coverage")}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                                    activeTab === "coverage" 
                                                    ? "bg-emerald-600 text-white" 
                                                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                                                }`}
                                            >
                                                <Map className="w-4 h-4 inline mr-1" />
                                                Coverage Map
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6">
                                    {renderTabContent()}

                                    <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-800">
                                            <h3 className="text-lg font-medium text-amber-400 flex items-center mb-4">
                                                <Eye className="w-5 h-5 mr-2" />
                                                Range Overview
                                            </h3>

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
                                                    <div className="flex items-end">
                                                        <div className="text-xl font-medium text-amber-400 mt-1">{analysisResults.maxRange} meters</div>
                                                        {parseFloat(analysisResults.rangeDelta) > 0 && (
                                                            <div className="text-xs text-green-500 ml-1 mb-1">+{analysisResults.rangeDelta}m</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-4">
                                                <div
                                                    className="flex justify-between items-center cursor-pointer p-2 rounded hover:bg-gray-800/50"
                                                    onClick={() => toggleAccordion("throughputOptimization")}
                                                >
                                                    <h4 className="font-medium text-white">Range Optimization</h4>
                                                    {accordionState.throughputOptimization ? (
                                                        <ChevronUp className="w-4 h-4 text-gray-400" />
                                                    ) : (
                                                        <ChevronDown className="w-4 h-4 text-gray-400" />
                                                    )}
                                                </div>

                                                {accordionState.throughputOptimization && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.3 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="p-3 bg-gray-800/30 rounded-lg mt-2 text-sm space-y-2">
                                                            <p className="text-gray-300">
                                                                Current MCS rate is <span className="text-green-500">MCS {analysisResults.finalMcsRate}</span>
                                                                supporting {analysisResults.totalThroughput.toFixed(2)} Mbps throughput.
                                                            </p>

                                                            {parseFloat(analysisResults.throughputDelta) > 0 && (
                                                                <p className="text-gray-300">
                                                                    Reduce throughput by <span className="text-amber-400">-{analysisResults.throughputDelta} Mbps</span> to
                                                                    achieve MCS {analysisResults.maxMcsRate} rate for maximum range.
                                                                </p>
                                                            )}

                                                            {parseFloat(analysisResults.rangeDelta) > 0 && (
                                                                <p className="text-gray-300">
                                                                    This could extend range by <span className="text-green-500">+{analysisResults.rangeDelta} meters</span>,
                                                                    for a total of {analysisResults.maxRange} meters.
                                                                </p>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-800">
                                            <h3 className="text-lg font-medium text-emerald-400 flex items-center mb-4">
                                                <ArrowRight className="w-5 h-5 mr-2" />
                                                Fresnel Zone Analysis
                                            </h3>

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
                                                    <h4 className="font-medium text-white">Fresnel Zone Optimization</h4>
                                                    {accordionState.fresnelOptimization ? (
                                                        <ChevronUp className="w-4 h-4 text-gray-400" />
                                                    ) : (
                                                        <ChevronDown className="w-4 h-4 text-gray-400" />
                                                    )}
                                                </div>

                                                {accordionState.fresnelOptimization && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.3 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="p-3 bg-gray-800/30 rounded-lg mt-2 text-sm space-y-2">
                                                            <p className="text-gray-300">
                                                                60% Fresnel Zone clearance requires <span className="text-emerald-400">{analysisResults.finalAGL} meters</span>
                                                                height at {analysisResults.finalRange} meters range.
                                                            </p>

                                                            <p className="text-gray-300">
                                                                Current AGL is <span className={analysisResults.aglDeltaPositive ? 'text-green-500' : 'text-red-500'}>
                                                                    {analysisResults.aglM.toFixed(2)} meters
                                                                </span>, giving a
                                                                margin of <span className={analysisResults.aglDeltaPositive ? 'text-green-500' : 'text-red-500'}>
                                                                    {analysisResults.aglDeltaPositive ? '+' : ''}{analysisResults.aglDelta} meters
                                                                </span>.
                                                            </p>

                                                            {parseFloat(analysisResults.aglIncreaseNeeded) > 0 && (
                                                                <p className="text-gray-300">
                                                                    Increasing AGL by <span className="text-amber-400">{analysisResults.aglIncreaseNeeded} meters</span> could
                                                                    gain <span className="text-green-500">+{analysisResults.rangeDelta} meters</span> of range.
                                                                </p>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Environmental Analysis Section */}
                                        <div className="col-span-1 lg:col-span-2 bg-gray-900/50 rounded-xl p-5 border border-gray-800">
                                            <h3 className="text-lg font-medium text-blue-400 flex items-center mb-4">
                                                <CloudRain className="w-5 h-5 mr-2" />
                                                <span>Environmental Impact Analysis</span>
                                            </h3>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="bg-gray-800/50 p-3 rounded-lg">
                                                    <div className="text-sm text-gray-400">Climate Condition</div>
                                                    <div className="flex items-center mt-1">
                                                        {climate === "clear" && <Wifi className="w-4 h-4 mr-2 text-green-500" />}
                                                        {climate === "rain" && <CloudRain className="w-4 h-4 mr-2 text-blue-500" />}
                                                        {climate === "fog" && <CloudRain className="w-4 h-4 mr-2 text-gray-400" />}
                                                        {climate === "snow" && <CloudRain className="w-4 h-4 mr-2 text-blue-300" />}
                                                        {climate === "humid" && <Thermometer className="w-4 h-4 mr-2 text-amber-500" />}
                                                        <div className="text-xl font-medium capitalize">{climate} Sky</div>
                                                    </div>
                                                </div>
                                                
                                                <div className="bg-gray-800/50 p-3 rounded-lg">
                                                    <div className="text-sm text-gray-400">Temperature Impact</div>
                                                    <div className="flex items-center mt-1">
                                                        <Thermometer className={`w-4 h-4 mr-2 ${
                                                            temperature < 0 ? 'text-blue-500' : 
                                                            temperature > 40 ? 'text-red-500' : 'text-green-500'
                                                        }`} />
                                                        <div className="text-xl font-medium">{temperature}°C</div>
                                                    </div>
                                                </div>
                                                
                                                <div className="bg-gray-800/50 p-3 rounded-lg">
                                                    <div className="text-sm text-gray-400">Signal Quality</div>
                                                    <div className="flex items-center mt-1">
                                                        <Signal className={`w-4 h-4 mr-2 ${
                                                            analysisResults.minSNR > 20 ? 'text-green-500' : 
                                                            analysisResults.minSNR > 10 ? 'text-amber-500' : 'text-red-500'
                                                        }`} />
                                                        <div className="text-xl font-medium">
                                                            SNR: {analysisResults.maxSNR} to {analysisResults.minSNR} dB
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="mt-4">
                                                <div
                                                    className="flex justify-between items-center cursor-pointer p-2 rounded hover:bg-gray-800/50"
                                                    onClick={() => toggleAccordion("environmentalFactors")}
                                                >
                                                    <h4 className="font-medium text-white">Environmental Considerations</h4>
                                                    {accordionState.environmentalFactors ? (
                                                        <ChevronUp className="w-4 h-4 text-gray-400" />
                                                    ) : (
                                                        <ChevronDown className="w-4 h-4 text-gray-400" />
                                                    )}
                                                </div>

                                                {accordionState.environmentalFactors && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.3 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="p-3 bg-gray-800/30 rounded-lg mt-2 text-sm space-y-2">
                                                            <p className="text-gray-300">
                                                                <span className="font-medium text-blue-400">Climate Impact:</span>{" "}
                                                                {getClimateImpactDescription()}
                                                            </p>
                                                            
                                                            {climate !== "clear" && (
                                                                <p className="text-gray-300">
                                                                    <span className="font-medium text-amber-400">Throughput Impact:</span>{" "}
                                                                    In {climate} conditions, maximum throughput is reduced by approximately {analysisResults.climateThroughputImpact} Mbps.
                                                                </p>
                                                            )}
                                                            
                                                            <p className="text-gray-300">
                                                                <span className="font-medium text-green-400">Temperature Considerations:</span>{" "}
                                                                {temperature < 0 
                                                                    ? `Cold temperatures (${temperature}°C) may reduce battery life and increase component failures.` 
                                                                    : temperature > 40 
                                                                        ? `High temperatures (${temperature}°C) increase thermal noise and reduce component efficiency.`
                                                                        : `Current temperature (${temperature}°C) is within optimal operating range.`
                                                                }
                                                            </p>
                                                            
                                                            <p className="text-gray-300">
                                                                <span className="font-medium text-violet-400">Recommendations:</span>{" "}
                                                                {getRecommendationForClimate()}
                                                                {temperature < 0 
                                                                    ? " Consider thermal enclosures for equipment." 
                                                                    : temperature > 40 
                                                                        ? " Provide adequate ventilation or cooling for equipment."
                                                                        : ""
                                                                }
                                                            </p>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div variants={itemVariants} className="bg-gray-850 rounded-2xl overflow-hidden shadow-xl">
                                <div className="p-6 border-b border-gray-700">
                                    <h2 className="text-xl font-medium flex items-center">
                                        <Layers className="w-5 h-5 mr-2 text-amber-400" />
                                        <span>Detailed MCS Results</span>
                                    </h2>
                                </div>

                                <div className="divide-y divide-gray-700">
                                    {analysisResults.rangeResults.map((result, index) => (
                                        <McsRangeItem key={index} result={result} />
                                    ))}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}

                    <motion.div variants={itemVariants} className="text-center text-xs text-gray-500 mt-8">
                        <p>Mesh Rider Advanced Range Estimation Tool</p>
                        <p className="mt-1">
                            Results are theoretical and consider environmental factors, but actual performance may vary.
                        </p>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default RangeCalculator;