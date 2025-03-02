import React, { useState, useEffect, useRef, FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Sliders,
  Wifi,
  BarChart2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Info,
  Zap
} from "lucide-react";
import {
  InputField,
  containerVariants,
  itemVariants,
  fadeIn,
  DeviceCard
} from "../components/common";
import {
  DeviceDetails,
  RadioModels,
  ChartDataPoint,
  Constants
} from "../types/common";

const ThroughputCalculator: FC = () => {
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
  const [powerLimit, setPowerLimit] = useState<number>(33);
  const [framesAggregated, setFramesAggregated] = useState<number>(10);
  const [calculationComplete, setCalculationComplete] = useState<boolean>(false);
  const [advancedOpen, setAdvancedOpen] = useState<boolean>(false);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  const chartRef = useRef<HTMLDivElement>(null);

  const radioModels: RadioModels = {
    "1L": {
      power: [24, 23, 23, 23, 22, 21, 20, 18],
      sensitivity: [-87, -85, -83, -81, -77, -73, -71, -69],
      modulation: [
        "BPSK",
        "QPSK",
        "QPSK",
        "16-QAM",
        "16-QAM",
        "64-QAM",
        "64-QAM",
        "64-QAM",
      ],
      codingRate: [1 / 2, 1 / 2, 3 / 4, 1 / 2, 3 / 4, 2 / 3, 3 / 4, 5 / 6],
      bitsPerSymbol: [1, 2, 2, 4, 4, 6, 6, 6],
    },
    "2L": {
      power: [27, 26, 26, 26, 25, 24, 23, 21],
      sensitivity: [-87, -85, -83, -81, -77, -73, -71, -69],
      modulation: [
        "BPSK",
        "QPSK",
        "QPSK",
        "16-QAM",
        "16-QAM",
        "64-QAM",
        "64-QAM",
        "64-QAM",
      ],
      codingRate: [1 / 2, 1 / 2, 3 / 4, 1 / 2, 3 / 4, 2 / 3, 3 / 4, 5 / 6],
      bitsPerSymbol: [1, 2, 2, 4, 4, 6, 6, 6],
    },
    "2KW": { // Added wearable device mapping
      power: [27, 26, 26, 26, 25, 24, 23, 21],
      sensitivity: [-87, -85, -83, -81, -77, -73, -71, -69],
      modulation: [
        "BPSK",
        "QPSK",
        "QPSK",
        "16-QAM",
        "16-QAM",
        "64-QAM",
        "64-QAM",
        "64-QAM",
      ],
      codingRate: [1 / 2, 1 / 2, 3 / 4, 1 / 2, 3 / 4, 2 / 3, 3 / 4, 5 / 6],
      bitsPerSymbol: [1, 2, 2, 4, 4, 6, 6, 6],
    },
  };

  const deviceDetails: DeviceDetails = {
    "1L": {
      name: "Nano-OEM",
      image: "/nano.png"
    },
    "2L": {
      name: "Mini-OEM",
      image: "/mini.png"
    },
    "2KO": {
      name: "OEM (V2)",
      image: "/oem.png"
    },
    "2KW": {
      name: "Wearable (V2)",
      image: "/wear.png"
    }
  };

  useEffect(() => {
    if (selectedDevice === "1L") {
      if (powerLimit > 30) setPowerLimit(30);
      setAntennas("1");
      setStreams("1");
    } else {
      if (powerLimit < 33) setPowerLimit(33);
    }
  }, [selectedDevice, powerLimit]);

  const calculateResults = (): void => {
    setIsCalculating(true);
    setCalculationComplete(false);

    setTimeout(() => {
      // Convert state values to numbers
      const freq = frequency; // in MHz
      const bwNum = parseFloat(bandwidth);
      const ant = parseFloat(antennas);
      const str = parseFloat(streams);
      const udpVal = udpPayload;
      const gain = antennaGain;
      const fade = fadeMargin;
      const fresnelPct = fresnelClearance;
      const pwrLimit = powerLimit;
      let ampduVal = framesAggregated;
      const psr = 90; // throughput scaling factor in %

      // Constants from the plain JS code
      const ipv4 = 20, eth2 = 14, batAdv = 10, llc = 8, ieee80211 = 42, phy = 4;
      const headerTotal = ipv4 + eth2 + batAdv + llc + ieee80211 + phy; // 98
      const mpduDelimiter = 0, aifs = 8, cwSize = 15, phyHeader11n = 40, ltf = 4, sifs = 10, baSize = 32;
      const txop = 100000; // in microseconds
      const basicRate = 12;
      let giRate = bwNum === 40 ? 14.4 : 13;

      // Get selected radio model and clone arrays
      const currentRadioModel = radioModels[selectedDevice];
      let powerArr = [...currentRadioModel.power];
      let sensitivityArr = [...currentRadioModel.sensitivity];
      const bitsPerSymbol = currentRadioModel.bitsPerSymbol;
      const codingRate = currentRadioModel.codingRate;

      // Derived parameters
      const payload = udpVal + headerTotal;
      const effectiveStreams = Math.min(str, ant);
      let stbw = bwNum > 20 ? 20 : bwNum;
      const slotTime = 4 + Math.ceil((17 * 5) / stbw);
      const phyOverhead = (aifs + cwSize) * slotTime + (phyHeader11n + effectiveStreams * ltf) * 20 / bwNum;

      let freqCorrection = 0;
      if (isOverGround) {
        freqCorrection = Math.round(
          10000 *
          (-0.0000000000313 * Math.pow(freq, 3) +
            0.0000004618 * Math.pow(freq, 2) -
            0.0024096 * freq +
            5.8421)
        ) / 10000;
        if (ampduVal > 2) {
          ampduVal = 2;
        }
      } else {
        freqCorrection = 0;
      }

      // Arrays for per-MCS level calculations
      const mcsIndex: number[] = [];
      const linkSpeed: number[] = [];
      const basicSpeed: number[] = [];
      const maxFrames: number[] = [];
      const ampduWindow: number[] = [];
      const phyTimeArr: number[] = [];
      const baRes: number[] = [];
      const rangeArr: number[] = [];
      const nWayTransit: number[] = [];
      const timeNoTransit: number[] = [];
      const timeTotal: number[] = [];
      const tptIdeal: number[] = [];
      const tptMax: number[] = [];
      const tptAdjusted: number[] = [];
      const fresnelClearanceDistance: number[] = [];

      for (let i = 0; i < 8; i++) {
        // Apply power limit
        powerArr[i] = Math.min(powerArr[i], pwrLimit - 3);
        // Adjust sensitivity based on number of antennas and bandwidth
        sensitivityArr[i] = sensitivityArr[i] - 10 * Math.log10(ant / effectiveStreams) - 10 * Math.log10(20 / bwNum);
        // MCS index calculation
        mcsIndex[i] = i + (effectiveStreams - 1) * 8;
        // Calculate link speed
        linkSpeed[i] = bitsPerSymbol[i] * codingRate[i] * effectiveStreams * giRate * bwNum / 20;
        // Calculate basic rate
        basicSpeed[i] = basicRate * (bwNum / 20) * bitsPerSymbol[i] * Math.min(codingRate[i], 0.75);
        // Determine maximum frames that can be aggregated
        maxFrames[i] = Math.max(Math.min(txop / ((payload * 8) / linkSpeed[i]), ampduVal), 1);
        // Calculate aggregated payload window
        ampduWindow[i] = payload * maxFrames[i];
        // Calculate PHY data transmission time (us)
        phyTimeArr[i] = (ampduVal - 1) * mpduDelimiter + Math.ceil((ampduWindow[i] * 8 / linkSpeed[i]) / 4) * 4;
        // Calculate Block ACK response time (us)
        baRes[i] = sifs + (phyHeader11n + effectiveStreams * ltf) + Math.ceil((baSize * 8) / (basicSpeed[i] * (bwNum / 20)));
        // Compute range (m) using the corrected formula
        const rangeCalc = Math.pow(
          10,
          (powerArr[i] - sensitivityArr[i] - fade + gain) / (20 + freqCorrection)
        ) * 300 / (freq * 4 * Math.PI);
        rangeArr[i] = parseFloat(rangeCalc.toFixed(1));
        // Calculate N-way transit delay (us)
        nWayTransit[i] = Math.round((1000 * 4 * rangeArr[i]) / 300) / 1000;
        // Time without transit (us)
        timeNoTransit[i] = phyTimeArr[i] + phyOverhead + baRes[i];
        // Total transmission time (us)
        timeTotal[i] = parseFloat((timeNoTransit[i] + nWayTransit[i]).toFixed(1));
        // Ideal throughput (Mbps)
        tptIdeal[i] = parseFloat((maxFrames[i] * udpVal * 8 / timeNoTransit[i]).toFixed(1));
        // Maximum throughput (Mbps)
        tptMax[i] = parseFloat((maxFrames[i] * udpVal * 8 / timeTotal[i]).toFixed(1));
        // Adjusted throughput based on PSR
        tptAdjusted[i] = parseFloat((tptMax[i] * psr / 100).toFixed(1));
        // Fresnel Zone Clearance (m)
        fresnelClearanceDistance[i] = parseFloat((8.66 * Math.sqrt(rangeArr[i] / freq) * fresnelPct / 100).toFixed(1));
      }

      const calculatedData: ChartDataPoint[] = rangeArr.map((r, idx) => ({
        distance: r,
        throughput: tptAdjusted[idx],
        fresnelClearance: fresnelClearanceDistance[idx],
        mcs: mcsIndex[idx],
      }));

      setChartData(calculatedData);
      setIsCalculating(false);
      setCalculationComplete(true);

      setTimeout(() => {
        if (chartRef.current) {
          chartRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }, 300);
    }, 800);
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
                <h1 className="glowing-text text-white">
                  Mesh Rider Throughput Calculator
                </h1>
                <p className="text-gray-400 mt-1">
                  Analyze and optimize your mesh network performance with precise throughput and distance estimates
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
                  onClick={() => setAdvancedOpen((prev) => !prev)}
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
                  onChange={(e: { target: { value: string; }; }) => setFrequency(parseInt(e.target.value))}
                  type="number"
                  min="1000"
                  max="6000"
                />

                <InputField
                  label="Bandwidth (MHz)"
                  id="bandwidth"
                  value={bandwidth}
                  onChange={(e: { target: { value: string; }; }) => setBandwidth(e.target.value)}
                  type="select"
                  options={[
                    { value: "3", label: "3 MHz" },
                    { value: "5", label: "5 MHz" },
                    { value: "10", label: "10 MHz" },
                    { value: "15", label: "15 MHz" },
                    { value: "20", label: "20 MHz" },
                    { value: "40", label: "40 MHz" }
                  ]}
                />

                <InputField
                  label="UDP Payload (bytes)"
                  id="udpPayload"
                  value={udpPayload}
                  onChange={(e: { target: { value: string; }; }) => setUdpPayload(parseInt(e.target.value))}
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
                          onChange={(e: { target: { value: string; }; }) => setAntennas(e.target.value)}
                          type="select"
                          options={[
                            { value: "1", label: "1" },
                            { value: "2", label: "2" }
                          ]}
                          disabled={selectedDevice === "1L"}
                        />

                        <InputField
                          label="Data Streams"
                          id="streams"
                          value={streams}
                          onChange={(e: { target: { value: string; }; }) => setStreams(e.target.value)}
                          type="select"
                          options={[
                            { value: "1", label: "1" },
                            { value: "2", label: "2" }
                          ]}
                          disabled={selectedDevice === "1L"}
                        />

                        <InputField
                          label="Antenna Gain (dBi)"
                          id="antennaGain"
                          value={antennaGain}
                          onChange={(e: { target: { value: string; }; }) => setAntennaGain(parseInt(e.target.value))}
                          type="number"
                          min="0"
                          max="100"
                        />

                        <InputField
                          label="Fade Margin (dB)"
                          id="fadeMargin"
                          value={fadeMargin}
                          onChange={(e: { target: { value: string; }; }) => setFadeMargin(parseInt(e.target.value))}
                          type="number"
                          min="0"
                          max="30"
                        />

                        <InputField
                          label="Fresnel Clearance (%)"
                          id="fresnelClearance"
                          value={fresnelClearance}
                          onChange={(e: { target: { value: string; }; }) => setFresnelClearance(parseInt(e.target.value))}
                          type="number"
                          min="0"
                          max="100"
                        />

                        <InputField
                          label="Power Limit (dBm)"
                          id="powerLimit"
                          value={powerLimit}
                          onChange={(e: { target: { value: string; }; }) => setPowerLimit(parseInt(e.target.value))}
                          type="number"
                          min="0"
                          max={selectedDevice === "1L" ? "30" : "33"}
                        />

                        <InputField
                          label="Frames Aggregated"
                          id="framesAggregated"
                          value={framesAggregated}
                          onChange={(e: { target: { value: string; }; }) => setFramesAggregated(parseInt(e.target.value))}
                          type="number"
                          min="1"
                          max="32"
                        />

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="isOverGround"
                            checked={isOverGround}
                            onChange={(e) => setIsOverGround(e.target.checked)}
                            className="h-4 w-4 text-violet-500 focus:ring-violet-500 border-gray-700 rounded"
                          />
                          <label
                            htmlFor="isOverGround"
                            className="ml-2 text-sm text-gray-300"
                          >
                            Ground Level Link
                          </label>
                        </div>
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
                      <span>Calculate Throughput</span>
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
                  <span>Performance Analysis</span>
                </h2>
              </div>

              <div className="p-6">
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
                            Maximum throughput starts at 100 Mbps near the node and decreases as distance increases due to signal attenuation.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="h-5 w-1 bg-emerald-500 rounded-full mr-3 mt-1"></div>
                        <div>
                          <span className="font-medium text-emerald-400">Fresnel Zone Clearance</span>
                          <p className="text-sm text-gray-400 mt-1">
                            The required clearance area for optimal signal propagation grows with distance. Keep this zone clear of obstacles.
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
                            The {deviceDetails[selectedDevice].name} performs best with the selected bandwidth of {bandwidth} MHz and {antennas} antenna(s).
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="h-5 w-1 bg-blue-500 rounded-full mr-3 mt-1"></div>
                        <div>
                          <span className="font-medium text-blue-400">Recommendations</span>
                          <p className="text-sm text-gray-400 mt-1">
                            For maximum performance, maintain line of sight between nodes and ensure proper mounting height for adequate Fresnel zone clearance.
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
            <p>Mesh Rider Throughput Estimation Tool</p>
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
