import React, { useState, useEffect, useRef, FC } from "react";
import { motion } from "framer-motion";
import {
    ResponsiveContainer,
    LineChart,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    Line,
    Area,
    ComposedChart,
    ReferenceLine,
} from "recharts";
import {
    Sliders,
    Wifi,
    Zap,
    ChevronDown,
    ChevronUp,
    Activity,
    RefreshCw,
    ArrowRight,
    Eye,
    Radio,
    BarChart2,
} from "lucide-react";
import {
    InputField,
    containerVariants,
    itemVariants,
    fadeIn,
    McsRangeItem,
    DeviceCard
} from "../components/common";
import {
    RadioModels,
    AccordionState,
    AnalysisResults,
    ChartDataPoint,
    CustomTooltipProps,
    Constants
} from "../types/common";


const RangeCalculator: FC = () => {
    const [telemetry, setTelemetry] = useState<string>("50");
    const [video, setVideo] = useState<string>("3");
    const [frequency, setFrequency] = useState<string>("2450");
    const [bw, setBw] = useState<number>(20);
    const [udpPayload] = useState<number>(1500);
    const [antennas, setAntennas] = useState<number>(2);
    const [streams, setStreams] = useState<number>(2);
    const [fadeMargin, setFadeMargin] = useState<string>("10");
    const [antGain, setAntGain] = useState<string>("6");
    const [overGround, setOverGround] = useState<boolean>(false);
    const [AGL, setAGL] = useState<string>("400");
    const [unit, setUnit] = useState<string>("feet");
    const [powerLimit, setPowerLimit] = useState<string>("33");
    const [srVariant, setSrVariant] = useState<string>("2L");
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
    const [isCalculating, setIsCalculating] = useState<boolean>(false);
    const [calculationMode, setCalculationMode] = useState<string>("mcs8_15");
    const [advancedOpen, setAdvancedOpen] = useState<boolean>(false);
    const [accordionState, setAccordionState] = useState<AccordionState>({
        throughputOptimization: false,
        fresnelOptimization: false,
    });
    const handleCheckboxChange = (setter: React.Dispatch<React.SetStateAction<boolean>>) =>
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setter(e.target.checked);
        };

    const chartRef = useRef<HTMLDivElement>(null);

    const radioModels: RadioModels = {
        "1L": {
            name: "nanoOEM",
            power: [24, 23, 23, 23, 22, 21, 20, 18],
            sensitivity: [-87, -85, -83, -81, -77, -73, -71, -69],
            modulation: ["BPSK", "QPSK", "QPSK", "16-QAM", "16-QAM", "64-QAM", "64-QAM", "64-QAM"],
            codingRate: [1 / 2, 1 / 2, 3 / 4, 1 / 2, 3 / 4, 2 / 3, 3 / 4, 5 / 6],
            bitsPerSymbol: [1, 2, 2, 4, 4, 6, 6, 6],
            image: "/nano.png"
        },
        "2L": {
            name: "miniOEM",
            power: [27, 26, 26, 26, 25, 24, 23, 21],
            sensitivity: [-87, -85, -83, -81, -77, -73, -71, -69],
            modulation: ["BPSK", "QPSK", "QPSK", "16-QAM", "16-QAM", "64-QAM", "64-QAM", "64-QAM"],
            codingRate: [1 / 2, 1 / 2, 3 / 4, 1 / 2, 3 / 4, 2 / 3, 3 / 4, 5 / 6],
            bitsPerSymbol: [1, 2, 2, 4, 4, 6, 6, 6],
            image: "/mini.png"
        },
        "2KO": {
            name: "OEM",
            power: [27, 26, 26, 26, 25, 24, 23, 21],
            sensitivity: [-87, -85, -83, -81, -77, -73, -71, -69],
            modulation: ["BPSK", "QPSK", "QPSK", "16-QAM", "16-QAM", "64-QAM", "64-QAM", "64-QAM"],
            codingRate: [1 / 2, 1 / 2, 3 / 4, 1 / 2, 3 / 4, 2 / 3, 3 / 4, 5 / 6],
            bitsPerSymbol: [1, 2, 2, 4, 4, 6, 6, 6],
            image: "/oem.png"
        },
        "2KW": {
            name: "Wearable",
            power: [27, 26, 26, 26, 25, 24, 23, 21],
            sensitivity: [-87, -85, -83, -81, -77, -73, -71, -69],
            modulation: ["BPSK", "QPSK", "QPSK", "16-QAM", "16-QAM", "64-QAM", "64-QAM", "64-QAM"],
            codingRate: [1 / 2, 1 / 2, 3 / 4, 1 / 2, 3 / 4, 2 / 3, 3 / 4, 5 / 6],
            bitsPerSymbol: [1, 2, 2, 4, 4, 6, 6, 6],
            image: "/wear.png"
        }
    };

    useEffect(() => {
        if (srVariant === "1L") {
            if (parseFloat(powerLimit) > 30) setPowerLimit("30");
            setAntennas(1);
            setStreams(1);
        } else {
            if (parseFloat(powerLimit) < 33) setPowerLimit("33");
            if (antennas < 2) setAntennas(2);
            if (streams < 2) setStreams(2);
        }
    }, [srVariant, powerLimit]);

    const convertAGLUnit = (newUnit: string): void => {
        if (newUnit !== unit) {
            let newAGL: number;
            if (newUnit === "meters") {
                newAGL = parseFloat(AGL) / 3.28084;
            } else {
                newAGL = parseFloat(AGL) * 3.28084;
            }
            setAGL(newAGL.toFixed(2));
            setUnit(newUnit);
        }
    };

    const toggleAccordion = (section: string): void => {
        setAccordionState({
            ...accordionState,
            [section]: !accordionState[section],
        });
    };

    const handleNumericChange = (setter: React.Dispatch<React.SetStateAction<string>>) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
            setter(e.target.value);
        };

    const calculateRange = (mode: string): void => {
        setIsCalculating(true);
        setCalculationMode(mode);

        const actualStreams = mode === "mcs0_7" ? 1 : streams;

        setTimeout(() => {
            const telemetryMbps = parseFloat(telemetry) / 1000;
            const totalThroughput = telemetryMbps + parseFloat(video);
            const AGLm = unit === "feet" ? parseFloat(AGL) / 3.28084 : parseFloat(AGL);

            let ampdu = 10;
            let stbw = bw > 20 ? 20 : bw;
            const slotTime = 4 + Math.ceil((17 * 5) / stbw);
            const phyOverhead =
                (Constants.aifs + Constants.cwSize) * slotTime +
                (Constants.phyHeader11n + actualStreams * Constants.ltf) * 20 / bw;

            let freqCorrection = 0;
            if (overGround) {
                freqCorrection = Math.round(
                    10000 *
                    (
                        -0.0000000000313 * Math.pow(parseFloat(frequency), 3) +
                        0.0000004618 * Math.pow(parseFloat(frequency), 2) -
                        0.0024096 * parseFloat(frequency) +
                        5.8421
                    )
                ) / 10000;
                if (ampdu > 2) ampdu = 2;
            }

            const rangeArr: number[] = [];
            let mcsIndexArr: number[] = [];
            const tptAdjusted: number[] = [];
            const fresnelClearanceDistance: number[] = [];
            const rangeCalculationResults: any[] = []; // <-- New array for detailed MCS results

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
                powerArr[index] = Math.min(powerArr[index], parseFloat(powerLimit) - 3);
                sensitivityArr[index] =
                    sensitivityArr[index] -
                    10 * Math.log10(antennas / actualStreams) -
                    10 * Math.log10(20 / bw);

                mcsIndexArr[index] = index + (actualStreams - 1) * 8;

                const linkSpeed =
                    currentRadioModel.bitsPerSymbol[index] *
                    currentRadioModel.codingRate[index] *
                    actualStreams *
                    13 *
                    bw / 20;

                const basicSpeed =
                    12 * (bw / 20) *
                    currentRadioModel.bitsPerSymbol[index] *
                    Math.min(currentRadioModel.codingRate[index], 0.75);

                const maxFrames = Math.max(
                    Math.min(
                        Constants.txop /
                        (((udpPayload +
                            Constants.ipv4 +
                            Constants.eth2 +
                            Constants.batAdv +
                            Constants.llc +
                            Constants.ieee80211 +
                            Constants.phy) *
                            8) /
                            linkSpeed),
                        ampdu
                    ),
                    1
                );

                const ampduWindow =
                    (udpPayload +
                        Constants.ipv4 +
                        Constants.eth2 +
                        Constants.batAdv +
                        Constants.llc +
                        Constants.ieee80211 +
                        Constants.phy) *
                    maxFrames;

                const phyTime =
                    (ampdu - 1) * Constants.mpduDelimiter +
                    Math.ceil((ampduWindow * 8 / linkSpeed) / 4) * 4;

                const baRes =
                    Constants.sifs +
                    (Constants.phyHeader11n + actualStreams * Constants.ltf) +
                    Math.ceil((Constants.baSize * 8) / (basicSpeed * (bw / 20)));

                // Corrected range calculation (divisor includes freqCorrection and multiplier is 300)
                rangeArr[index] = parseFloat(
                    (
                        Math.pow(
                            10,
                            (powerArr[index] -
                                sensitivityArr[index] -
                                parseFloat(fadeMargin) +
                                parseFloat(antGain)) /
                            (20 + freqCorrection)
                        ) *
                        300 /
                        (parseFloat(frequency) * 4 * Math.PI)
                    ).toFixed(1)
                );

                const nWayTransit = Math.round((1000 * 4 * rangeArr[index]) / 300) / 1000;
                const timeNoTransit = phyTime + phyOverhead + baRes;
                const timeTotal = parseFloat((timeNoTransit + nWayTransit).toFixed(1));
                const tptIdeal = parseFloat((maxFrames * udpPayload * 8 / timeNoTransit).toFixed(1));
                const tptMax = parseFloat((maxFrames * udpPayload * 8 / timeTotal).toFixed(1));
                tptAdjusted[index] = parseFloat((tptMax * Constants.psr / 100).toFixed(2));

                fresnelClearanceDistance[index] = parseFloat(
                    (8.66 * Math.sqrt(rangeArr[index] / parseFloat(frequency)) * 60 / 100).toFixed(1)
                );

                // Build detailed result for each MCS iteration
                rangeCalculationResults.push({
                    mcs: mcsIndexArr[index],
                    range: rangeArr[index],
                    throughput: tptAdjusted[index],
                    fresnelClearance: fresnelClearanceDistance[index],
                    withinThroughput: totalThroughput <= tptAdjusted[index],
                    withinClearance: AGLm >= fresnelClearanceDistance[index],
                });

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

            const chartData = rangeArr.map((range, idx) => ({
                distance: range,
                throughput: tptAdjusted[idx],
                fresnelClearance: fresnelClearanceDistance[idx],
                mcs: mcsIndexArr[idx],
                estimatedRange: range === rangeEstFinal,
            }));

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
                rangeResults: rangeCalculationResults, // <-- Detailed results are now populated here
            });

            setChartData(chartData);
            setIsCalculating(false);

            setTimeout(() => {
                if (chartRef.current) {
                    chartRef.current.scrollIntoView({ behavior: "smooth" });
                }
            }, 500);
        }, 800);
    };


    const CustomTooltip: FC<CustomTooltipProps> = ({ active, payload, label }) => {
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
                                    Optimize your mesh network range with precise throughput and distance estimates
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
                                    value={overGround}
                                    onChange={(e) => {
                                        // This cast is safe because we know this element is an HTMLInputElement
                                        const target = e.target as HTMLInputElement;
                                        setOverGround(target.checked);
                                    }}
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
                                    <h2 className="text-xl font-medium flex items-center">
                                        <Activity className="w-5 h-5 mr-2 text-amber-400" />
                                        <span>Range & Throughput Analysis</span>
                                    </h2>
                                </div>

                                <div className="p-6">
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
                                                    x={analysisResults.finalRange}
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
                                                    y={analysisResults.aglM}
                                                    yAxisId="right"
                                                    stroke="#FFFFFF"
                                                    strokeDasharray="5 5"
                                                    label={{
                                                        value: "Current AGL",
                                                        position: "insideTopRight",
                                                        fill: "#FFFFFF"
                                                    }}
                                                />
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    </div>

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
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div variants={itemVariants} className="bg-gray-850 rounded-2xl overflow-hidden shadow-xl">
                                <div className="p-6 border-b border-gray-700">
                                    <h2 className="text-xl font-medium flex items-center">
                                        <Zap className="w-5 h-5 mr-2 text-amber-400" />
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
                        <p>Mesh Rider Range Estimation Tool</p>
                        <p className="mt-1">
                            Results are theoretical and may vary based on environmental conditions and interference.
                        </p>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default RangeCalculator;