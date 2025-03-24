import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Sliders, Wifi, BarChart2, ChevronDown, ChevronUp, RefreshCw,
  Zap, Activity, Radio, ArrowRight, Layers
} from "lucide-react";

import {
  DeviceCard, InputField, RFChart, AnalysisPanel, Animations
} from "./common/UIKit";

import {
  DEVICES, BANDWIDTH_OPTIONS, ANTENNA_OPTIONS, STREAM_OPTIONS,
  DeviceKey
} from "./common/RFData";

import {
  useRFCalculations, getPowerLimitOptions
} from "./common/RFEngine";
import ParticleBackground from "./ParticleBackground";

const ThroughputCalculator: React.FC = () => {
  const [selectedDevice, setSelectedDevice] = useState<DeviceKey>("2L");
  const [frequency, setFrequency] = useState<string>("2450");
  const [bandwidth, setBandwidth] = useState<string>("20");
  const [antennas, setAntennas] = useState<string>("2");
  const [streams, setStreams] = useState<string>("2");
  const [udpPayload, setUdpPayload] = useState<string>("1500");
  const [antennaGain, setAntennaGain] = useState<string>("6");
  const [fadeMargin, setFadeMargin] = useState<string>("10");
  const [fresnelClearance, setFresnelClearance] = useState<string>("60");
  const [isOverGround, setIsOverGround] = useState<boolean>(false);
  const [powerLimit, setPowerLimit] = useState<string>("33");
  const [framesAggregated, setFramesAggregated] = useState<string>("10");
  const [advancedOpen, setAdvancedOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"dual" | "throughput" | "fresnel" | "snr">("dual");
  const chartRef = useRef<HTMLDivElement | null>(null);

  const {
    chartData,
    analysisResults,
    isCalculating,
    calculationComplete,
    calculateRF
  } = useRFCalculations('throughput');

  useEffect(() => {
    if (selectedDevice === "1L") {
      setAntennas("1");
      setStreams("1");
      if (parseInt(powerLimit) > 30) setPowerLimit("30");
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
                  onChange={handleNumericChange(setFrequency)}
                  type="number"
                  min="1000"
                  max="6000"
                />
                <InputField
                  label="Channel Bandwidth (MHz)"
                  id="bandwidth"
                  value={bandwidth}
                  onChange={handleNumericChange(setBandwidth)}
                  type="select"
                  options={BANDWIDTH_OPTIONS}
                />
                <InputField
                  label="UDP Payload (bytes)"
                  id="udpPayload"
                  value={udpPayload}
                  onChange={handleNumericChange(setUdpPayload)}
                  type="number"
                  min="10"
                  max="1500"
                />
              </div>

              <div className={`transition-all duration-300 overflow-hidden ${advancedOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="pt-4 border-t border-gray-700">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <InputField
                      label="Number of Antennas"
                      id="antennas"
                      value={antennas}
                      onChange={handleNumericChange(setAntennas)}
                      type="select"
                      options={ANTENNA_OPTIONS}
                      disabled={selectedDevice === "1L"}
                    />
                    <InputField
                      label="Number of Data Streams"
                      id="streams"
                      value={streams}
                      onChange={handleNumericChange(setStreams)}
                      type="select"
                      options={STREAM_OPTIONS}
                      disabled={selectedDevice === "1L"}
                    />
                    <InputField
                      label="TX + RX Antenna Gain (dBi)"
                      id="antennaGain"
                      value={antennaGain}
                      onChange={handleNumericChange(setAntennaGain)}
                      type="number"
                      min="0"
                      max="100"
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
                      label="Fresnel Zone Clearance (%)"
                      id="fresnelClearance"
                      value={fresnelClearance}
                      onChange={handleNumericChange(setFresnelClearance)}
                      type="number"
                      min="0"
                      max="100"
                    />
                    <InputField
                      label="Power Limit (dBm)"
                      id="powerLimit"
                      value={powerLimit}
                      onChange={handleNumericChange(setPowerLimit)}
                      type="select"
                      options={getPowerLimitOptions(selectedDevice)}
                    />
                    <InputField
                      label="Frames Aggregated"
                      id="framesAggregated"
                      value={framesAggregated}
                      onChange={handleNumericChange(setFramesAggregated)}
                      type="number"
                      min="1"
                      max="32"
                    />
                    <InputField
                      label="Ground level propagation"
                      id="isOverGround"
                      checked={isOverGround}
                      value={isOverGround}
                      onChange={(e) => setIsOverGround((e.target as HTMLInputElement).checked)}
                      type="checkbox"
                    />
                  </div>
                </div>
              </div>

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
                <div className="flex flex-wrap gap-2 mt-4">
                  {['dual', 'throughput', 'fresnel', 'snr'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab as "dual" | "throughput" | "fresnel" | "snr")}
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
                <RFChart
                  type={activeTab}
                  data={chartData}
                  frequency={parseInt(frequency)}
                  bandwidth={bandwidth}
                  calculatorType="throughput"
                />
              </div>

              <div className="mt-2 p-5 border-t border-gray-700">
                {analysisResults && (
                  <div className="mt-6">
                    <div className="bg-white-900/50 rounded-xl p-5 border border-gray-800">
                      <h3 className="text-lg font-medium text-blue-400 mb-4">MCS Rate Performance Analysis</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {analysisResults.rangeResults && analysisResults.rangeResults.map((data, index) => (
                          <div key={`mcs-data-${index}`} className="bg-gray-800/30 p-2 rounded text-center">
                            <div className="text-xs text-gray-400">MCS {data.mcs}</div>
                            <div className="text-xs font-medium mt-1">
                              {DEVICES[selectedDevice].modulation[index % 8]},
                              {Math.round(DEVICES[selectedDevice].codingRate[index % 8] * 100)}%
                            </div>
                            <div className="text-xs text-amber-400 mt-1">{data.throughput.toFixed(1)} Mbps</div>
                            <div className="text-xs text-blue-400 mt-1">{data.range.toFixed(1)} m</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white-900/50 rounded-xl p-5 border border-gray-800">
                    <h3 className="text-lg font-medium text-green-400 mb-4">Maximum Performance</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Maximum Throughput:</span>
                        <span className="text-amber-400 font-bold">{analysisResults?.maxThroughput || 0} Mbps</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Maximum Range:</span>
                        <span className="text-green-400 font-bold">{analysisResults?.maxRange || 0} m</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Device:</span>
                        <span className="text-blue-400 font-bold">{DEVICES[selectedDevice].name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Bandwidth:</span>
                        <span className="text-purple-400 font-bold">{bandwidth} MHz</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white-900/50 rounded-xl p-5 border border-gray-800">
                    <h3 className="text-lg font-medium text-amber-400 mb-4">Usage Recommendations</h3>
                    <div className="space-y-2 text-sm text-gray-300">
                      <p>
                        <span className="text-blue-400 font-medium">Short Range, High Throughput:</span> Use
                        MCS {analysisResults?.rangeResults?.[7]?.mcs || 7} for maximum data transfer up to
                        {analysisResults?.rangeResults?.[7]?.range.toFixed(1) || 0}m.
                      </p>
                      <p>
                        <span className="text-green-400 font-medium">Medium Range, Balanced:</span> Use
                        MCS {analysisResults?.rangeResults?.[3]?.mcs || 3} for reliable connections up to
                        {analysisResults?.rangeResults?.[3]?.range.toFixed(1) || 0}m.
                      </p>
                      <p>
                        <span className="text-amber-400 font-medium">Long Range, Lower Throughput:</span> Use
                        MCS {analysisResults?.rangeResults?.[0]?.mcs || 0} for maximum range up to
                        {analysisResults?.rangeResults?.[0]?.range.toFixed(1) || 0}m.
                      </p>
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