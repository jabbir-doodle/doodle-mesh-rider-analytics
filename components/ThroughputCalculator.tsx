import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sliders, Wifi, BarChart2, ChevronDown, ChevronUp, RefreshCw, Info,
  Zap, Activity, Radio, ArrowRight, Layers
} from "lucide-react";

import {
  DeviceCard, InputField, RFChart, AnalysisPanel, Animations, McsRangeItem
} from "./common/UIKit";

import {
  DEVICES, BANDWIDTH_OPTIONS, ANTENNA_OPTIONS, STREAM_OPTIONS,
  ChartDataPoint, DeviceKey
} from "./common/RFData";

import {
  useRFCalculations, getPowerLimitOptions
} from "./common/RFEngine";

const ThroughputCalculator: React.FC = () => {
  const [selectedDevice, setSelectedDevice] = useState<DeviceKey>("2L");
  const [frequency, setFrequency] = useState(2450);
  const [bandwidth, setBandwidth] = useState("20");
  const [antennas, setAntennas] = useState("2");
  const [streams, setStreams] = useState("2");
  const [udpPayload, setUdpPayload] = useState(1500);
  const [antennaGain, setAntennaGain] = useState(6);
  const [fadeMargin, setFadeMargin] = useState(10);
  const [fresnelClearance, setFresnelClearance] = useState(60);
  const [isOverGround, setIsOverGround] = useState(false);
  const [powerLimit, setPowerLimit] = useState(33);
  const [framesAggregated, setFramesAggregated] = useState(10);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dual");
  const chartRef = useRef<HTMLDivElement | null>(null);

  const {
    chartData,  // <- This was missing before
    isCalculating,
    calculationComplete,
    calculateRF,
    analysisResults
  } = useRFCalculations('throughput');

  useEffect(() => {
    if (selectedDevice === "1L") {
      setAntennas("1");
      setStreams("1");
      if (powerLimit > 30) setPowerLimit(30);
    }
  }, [selectedDevice, powerLimit]);

  const handleCalculate = () => {
    calculateRF({
      deviceKey: selectedDevice,
      frequency,
      bandwidth,
      antennas,
      streams,
      udpPayload,
      antennaGain,
      fadeMargin,
      fresnelClearance,
      isOverGround,
      powerLimit,
      framesAggregated
    });

    setTimeout(() => {
      if (chartRef.current) {
        chartRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-gray-100">
      <div className="relative z-20 pt-8 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={Animations.containerVariants}
          className="space-y-8"
        >
          <motion.div variants={Animations.itemVariants} className="flex items-center mb-6">
            <div className="flex items-center">
              <img src="https://learn.doodlelabs.com/hubfs/mesh%20rider%20logo.png" alt="Mesh Rider Logo" className="h-12 w-auto mr-4" />
              <div>
                <h1 className="text-2xl font-bold text-white">Throughput Performance Analysis</h1>
                <p className="text-gray-400 mt-1">Mesh network planning and optimization tool</p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={Animations.itemVariants} className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-medium text-white flex items-center">
                <Radio className="w-5 h-5 mr-2 text-amber-400" />
                <span>Select Device</span>
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.keys(DEVICES).map((deviceKey) => (
                <DeviceCard
                  key={deviceKey}
                  deviceKey={deviceKey}
                  device={{
                    name: DEVICES[deviceKey as DeviceKey].name,
                    image: DEVICES[deviceKey as DeviceKey].image
                  }}
                  isSelected={selectedDevice === deviceKey}
                  onClick={() => setSelectedDevice(deviceKey as DeviceKey)}
                />
              ))}
            </div>
          </motion.div>

          <motion.div variants={Animations.itemVariants} className="bg-gray-850 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-medium text-white flex items-center">
                  <Sliders className="w-5 h-5 mr-2 text-amber-400" />
                  <span>Configuration Parameters</span>
                </h2>
                <button
                  onClick={() => setAdvancedOpen(!advancedOpen)}
                  className="flex items-center text-sm px-3 py-1 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-300"
                >
                  <span>{advancedOpen ? "Hide Advanced" : "Show Advanced"}</span>
                  {advancedOpen ? <ChevronUp className="ml-1 w-4 h-4" /> : <ChevronDown className="ml-1 w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InputField
                  label="Center Frequency (MHz)"
                  id="frequency"
                  value={frequency}
                  onChange={(e) => setFrequency(parseInt(e.target.value))}
                  type="number"
                  min="1000"
                  max="6000"
                />
                <InputField
                  label="Channel Bandwidth (MHz)"
                  id="bandwidth"
                  value={bandwidth}
                  onChange={(e) => setBandwidth(e.target.value)}
                  type="select"
                  options={BANDWIDTH_OPTIONS}
                />
                <InputField
                  label="UDP Payload (bytes)"
                  id="udpPayload"
                  value={udpPayload}
                  onChange={(e) => setUdpPayload(parseInt(e.target.value))}
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
                          label="Number of Antennas"
                          id="antennas"
                          value={antennas}
                          onChange={(e) => setAntennas(e.target.value)}
                          type="select"
                          options={ANTENNA_OPTIONS}
                          disabled={selectedDevice === "1L"}
                        />
                        <InputField
                          label="Number of Data Streams"
                          id="streams"
                          value={streams}
                          onChange={(e) => setStreams(e.target.value)}
                          type="select"
                          options={STREAM_OPTIONS}
                          disabled={selectedDevice === "1L"}
                        />
                        <InputField
                          label="TX + RX Antenna Gain (dBi)"
                          id="antennaGain"
                          value={antennaGain}
                          onChange={(e) => setAntennaGain(parseInt(e.target.value))}
                          type="number"
                          min="0"
                          max="100"
                        />
                        <InputField
                          label="Fade Margin (dB)"
                          id="fadeMargin"
                          value={fadeMargin}
                          onChange={(e) => setFadeMargin(parseInt(e.target.value))}
                          type="number"
                          min="0"
                          max="30"
                        />
                        <InputField
                          label="Fresnel Zone Clearance (%)"
                          id="fresnelClearance"
                          value={fresnelClearance}
                          onChange={(e) => setFresnelClearance(parseInt(e.target.value))}
                          type="number"
                          min="0"
                          max="100"
                        />
                        <InputField
                          label="Power Limit (dBm)"
                          id="powerLimit"
                          value={powerLimit}
                          onChange={(e) => setPowerLimit(parseInt(e.target.value))}
                          type="select"
                          options={getPowerLimitOptions(selectedDevice)}
                        />
                        <InputField
                          label="Frames Aggregated"
                          id="framesAggregated"
                          value={framesAggregated}
                          onChange={(e) => setFramesAggregated(parseInt(e.target.value))}
                          type="number"
                          min="1"
                          max="32"
                        />
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="isOverGround"
                              checked={isOverGround}
                              onChange={(e) => setIsOverGround(e.target.checked)}
                              className="h-4 w-4 text-amber-500 focus:ring-amber-500 border-gray-600 rounded"
                            />
                            <label htmlFor="isOverGround" className="ml-2 text-sm text-gray-300">
                              Ground level propagation
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex justify-center pt-4">
                <motion.button
                  onClick={handleCalculate}
                  disabled={isCalculating}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold py-3 px-8 rounded-full shadow-lg flex items-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
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

          {calculationComplete && analysisResults && chartData.length > 0 && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={Animations.fadeIn}
              className="bg-gray-850 rounded-2xl overflow-hidden shadow-xl"
              ref={chartRef}
            >
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-xl font-medium text-white flex items-center">
                  <ArrowRight className="w-5 h-5 mr-2 text-amber-400" />
                  <span>RF Performance Analysis</span>
                </h2>
                <div className="flex space-x-2 mt-4">
                  <button
                    onClick={() => setActiveTab("dual")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === "dual" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
                  >
                    <BarChart2 className="w-4 h-4 inline mr-1" />
                    Combined
                  </button>
                  <button
                    onClick={() => setActiveTab("throughput")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === "throughput" ? "bg-amber-500 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
                  >
                    <BarChart2 className="w-4 h-4 inline mr-1" />
                    Throughput
                  </button>
                  <button
                    onClick={() => setActiveTab("fresnel")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === "fresnel" ? "bg-green-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
                  >
                    <Info className="w-4 h-4 inline mr-1" />
                    Fresnel
                  </button>
                  <button
                    onClick={() => setActiveTab("snr")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === "snr" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
                  >
                    <Activity className="w-4 h-4 inline mr-1" />
                    SNR
                  </button>
                </div>
              </div>

              <div className="p-6">
                <RFChart
                  type={activeTab as any}
                  data={chartData}
                  frequency={frequency}
                  bandwidth={bandwidth}
                />
              </div>

              <div className="mt-2 p-5 border-t border-gray-700">
                <AnalysisPanel results={analysisResults} />

                <div className="mt-6">
                  <div className="bg-white-900/50 rounded-xl p-5 border border-gray-800">
                    {/* <h3 className="text-lg font-medium text-blue-400 mb-4">MCS Rate Distribution</h3> */}
                    <div className="grid grid-cols-4 gap-2">
                      {analysisResults.rangeResults.map((data, index) => (
                        <div key={index} className="bg-gray-800/30 p-2 rounded text-center">
                          <div className="text-xs text-gray-400">MCS {data.mcs}</div>
                          <div className="text-xs font-medium mt-1">
                            {DEVICES[selectedDevice].modulation[index]},
                            {Math.round(DEVICES[selectedDevice].codingRate[index] * 100)}%
                          </div>
                          <div className="text-xs text-amber-400 mt-1">{data.throughput.toFixed(1)} Mbps</div>
                          <div className="text-xs text-blue-400 mt-1">{data.range.toFixed(1)} m</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <motion.div variants={Animations.itemVariants} className="text-center text-xs text-gray-400 mt-8">
            <p>RF Performance Analysis Tool</p>
            <p className="mt-1">Results are theoretical and may vary based on environmental conditions.</p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default ThroughputCalculator;