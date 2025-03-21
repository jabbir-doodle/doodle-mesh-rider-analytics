
import { motion } from 'framer-motion';

import { getLinkQuality } from './RFEngine';
import React, { useState, useCallback, ReactNode } from 'react';
import {
    ComposedChart, LineChart, Line, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';

import { AnalysisResults, CHART_ANIMATIONS, ChartDataPoint, CustomTooltipProps, DeviceCardProps, getDeviceColor, InputFieldProps, McsRangeItemProps } from './RFData';
export const DeviceCard: React.FC<DeviceCardProps> = ({ deviceKey, device, isSelected, onClick }) => {
    const color = getDeviceColor(deviceKey);

    return (
        <motion.div
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`bg-gray-800 hover:bg-gray-750 rounded-xl overflow-hidden transition-all duration-200 cursor-pointer h-full ${isSelected ? `ring-2 ring-${color}-500 shadow-lg shadow-${color}-500/20` : "ring-1 ring-white-700"
                }`}
        >
            <div className="p-4 flex flex-col items-center h-full">
                <div className={`w-full h-20 flex items-center justify-center mb-4 rounded-lg ${isSelected ? `bg-${color}-950/30` : 'bg-gray-900/30'
                    }`}>
                    <img src={device.image} alt={device.name} className="h-16 w-auto object-contain" />
                </div>
                <div className="text-center">
                    <h3 className={`font-medium ${isSelected ? `text-${color}-400` : 'text-black-200'}`}>
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

export const InputField: React.FC<InputFieldProps> = ({
    label, id, value, onChange, type = "text", min, max, step,
    options, disabled, checked, className = ""
}) => (
    <div className={`relative ${className}`}>
        <label htmlFor={id} className="block text-xs font-medium text-gray-300 mb-1">
            {label}
        </label>
        {type === "select" ? (
            <select
                id={id} value={value as string | number} onChange={onChange} disabled={disabled}
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
                    type="checkbox" id={id} checked={checked ?? (value as boolean)} onChange={onChange}
                    className="h-4 w-4 text-amber-500 focus:ring-amber-500 border-gray-700 rounded"
                />
                <span className="ml-2 text-sm text-gray-300">{label}</span>
            </div>
        ) : (
            <input
                type={type} id={id} value={value as string | number} onChange={onChange}
                min={min} max={max} step={step}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            />
        )}
    </div>
);

export const McsRangeItem: React.FC<McsRangeItemProps> = ({ result }) => {
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

export const DualAxisTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-gray-800 border border-gray-700 p-3 rounded-md shadow-lg">
                <p className="text-blue-200 font-medium">Distance: {data.distance?.toFixed(1)} m</p>
                <p className="text-amber-400">Throughput: {data.throughput?.toFixed(1)} Mbps</p>
                <p className="text-emerald-400">Fresnel Zone: {data.fresnelClearance?.toFixed(2)} m</p>
                <p className="text-gray-300">MCS Rate: {data.mcs} ({data.modulation})</p>
                <p className="text-blue-400">SNR: {data.snr?.toFixed(1)} dB</p>
            </div>
        );
    }
    return null;
};

export const ThroughputTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const codingRatePercent = Math.round((data.codingRate || 0) * 100);

        return (
            <div className="bg-gray-800 border border-gray-700 p-3 rounded-md shadow-lg">
                <p className="text-blue-200 font-medium">Distance: {data.distance?.toFixed(1)} m</p>
                <p className="text-amber-400 font-medium">Throughput: {data.throughput?.toFixed(1)} Mbps</p>
                <p className="text-gray-300">MCS: {data.mcs} ({data.modulation}, {codingRatePercent}%)</p>
            </div>
        );
    }
    return null;
};

export const FresnelTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;

        return (
            <div className="bg-gray-800 border border-gray-700 p-3 rounded-md shadow-lg">
                <p className="text-blue-200 font-medium">Distance: {data.distance?.toFixed(1)} m</p>
                <p className="text-emerald-400 font-medium">Fresnel Zone: {data.fresnelClearance?.toFixed(2)} m</p>
            </div>
        );
    }
    return null;
};

export const SNRTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const { status, color } = getLinkQuality(data.snr);
        const codingRatePercent = Math.round((data.codingRate || 0) * 100);

        return (
            <div className="bg-gray-800 border border-gray-700 p-3 rounded-md shadow-lg">
                <p className="text-blue-200 font-medium">Distance: {data.distance} m</p>
                <p className="text-blue-400">SNR: {data.snr?.toFixed(1)} dB</p>
                <p className={`font-medium ${color}`}>Link Quality: {status}</p>
                <p className="text-emerald-400">MCS: {data.mcs} ({data.modulation}, {codingRatePercent}%)</p>
                <p className="text-amber-400">Throughput: {data.throughput?.toFixed(1)} Mbps</p>
            </div>
        );
    }
    return null;
};



interface CustomLegendProps {
    payload?: any[];
    activeItems: string[];
    onToggle: (dataKey: string) => void;
}

interface RFChartProps {
    type: 'dual' | 'throughput' | 'fresnel' | 'snr';
    data: ChartDataPoint[];
    estimatedRange?: number;
    aglHeight?: number;
    frequency?: number;
    bandwidth?: string;
}

const CustomLegend: React.FC<CustomLegendProps> = ({ payload, activeItems, onToggle }) => {
    if (!payload) return null;

    return (
        <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2 p-0">
            {payload.map((entry: any, index: number) => {
                const isActive = activeItems.includes(entry.dataKey);

                return (
                    <li
                        key={`item-${index}`}
                        className={`flex items-center cursor-pointer list-none px-2 py-1 rounded-md border ${isActive ? 'border-gray-400 bg-gray-800/30' : 'border-transparent'}`}
                        onClick={() => onToggle(entry.dataKey)}
                    >
                        <span
                            className="inline-block w-3 h-3 mr-2 rounded-sm"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className={`text-sm ${isActive ? 'text-white' : 'text-gray-400'}`}>
                            {entry.value}
                        </span>
                    </li>
                );
            })}
        </ul>
    );
};
interface DotProps {
    cx: number;
    cy: number;
    index: number;
    points: Array<any>;
    payload: any;
    stroke: string;
    fill?: string;
}

const CustomizedDot = (props: any) => {
    const { cx, cy, index, dataKey, payload, dataPoints } = props;

    // Strategic dot placement - first point, last point, and evenly distributed intervals
    const totalPoints = dataPoints?.length || 10;
    const interval = Math.max(1, Math.floor(totalPoints / 8));
    const showDot = index === 0 ||
        index === (dataPoints?.length - 1) ||
        index % interval === 0;

    if (!showDot) return null;

    return (
        <circle
            cx={cx}
            cy={cy}
            r={4}
            stroke={props.stroke}
            strokeWidth={2}
            fill={props.fill || props.stroke}
        />
    );
};

const CustomTooltip = ({ active, payload, label, estimatedRange, aglHeight }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    const withinRange = estimatedRange ? data.distance <= estimatedRange : true;
    const belowAGL = aglHeight ? data.fresnelClearance <= aglHeight : true;

    return (
        <div className="bg-gray-800 border border-gray-700 p-3 rounded-md shadow-xl">
            <p className="text-blue-200 font-medium">Distance: {data.distance?.toFixed(1)} m</p>

            {payload.find((p: any) => p.dataKey.includes('throughput')) && (
                <p className={withinRange ? "text-green-400" : "text-red-400"}>
                    Throughput: {data.throughput?.toFixed(1)} Mbps
                    <span className="text-gray-400 text-xs ml-2">
                        {withinRange ? "(Within Range)" : "(Beyond Range)"}
                    </span>
                </p>
            )}

            {payload.find((p: any) => p.dataKey.includes('fresnelClearance')) && (
                <p className={belowAGL ? "text-blue-400" : "text-red-400"}>
                    Fresnel Zone: {data.fresnelClearance?.toFixed(2)} m
                    <span className="text-gray-400 text-xs ml-2">
                        {belowAGL ? "(Below AGL)" : "(Above AGL)"}
                    </span>
                </p>
            )}

            {data.modulation && (
                <p className="text-gray-300">MCS Rate: {data.mcs} ({data.modulation})</p>
            )}

            {payload.find((p: any) => p.dataKey.includes('snr')) && (
                <p className="text-blue-400">SNR: {data.snr?.toFixed(1)} dB</p>
            )}
        </div>
    );
};

export const RFChart: React.FC<RFChartProps & { calculatorType?: 'range' | 'throughput' }> = ({
    type,
    data,
    estimatedRange,
    aglHeight,
    frequency,
    bandwidth,
    calculatorType = 'throughput'
}) => {
    const [activeItems, setActiveItems] = useState<string[]>([
        'throughputWithin', 'throughputBeyond', 'fresnelBelow', 'fresnelAbove'
    ]);

    const toggleItem = useCallback((dataKey: string) => {
        setActiveItems(prev =>
            prev.includes(dataKey)
                ? prev.filter(item => item !== dataKey)
                : [...prev, dataKey]
        );
    }, []);

    if (!data.length) {
        return <div className="h-80 flex items-center justify-center">No data available</div>;
    }

    // Calculate domain bounds to ensure intersection is centered
    const distanceMin = Math.min(...data.map(d => d.distance));
    const distanceMax = Math.max(...data.map(d => d.distance));

    // Strategic padding for optimal visualization
    const domainPadding = 0.15; // 15% padding on each side
    const xDomain = [
        distanceMin * (1 - domainPadding),
        distanceMax * (1 + domainPadding)
    ];

    // Handle visualization data processing
    const getChartData = () => {
        if (calculatorType !== 'range') return data;

        return data.map(d => ({
            ...d,
            throughputWithin: d.distance <= (estimatedRange || Infinity) ? d.throughput : null,
            throughputBeyond: d.distance > (estimatedRange || -Infinity) ? d.throughput : null,
            fresnelBelow: d.fresnelClearance <= (aglHeight || Infinity) ? d.fresnelClearance : null,
            fresnelAbove: d.fresnelClearance > (aglHeight || -Infinity) ? d.fresnelClearance : null
        }));
    };

    const chartData = getChartData();

    // Professional dot rendering with optimal distribution
    const CustomizedDot = (props: any) => {
        const { cx, cy, index, points } = props;
        // Strategic dot placement for cleaner visualization
        const totalPoints = points?.length || 8;
        const interval = Math.max(1, Math.floor(totalPoints / 6));
        const showDot = index === 0 ||
            index === (points?.length - 1) ||
            index % interval === 0;

        if (!showDot) return null;

        return <circle
            cx={cx}
            cy={cy}
            r={4}
            stroke={props.stroke}
            strokeWidth={2}
            fill={props.fill || props.stroke}
        />;
    };

    switch (type) {
        case 'dual':
            return (
                <div className="h-96"> {/* Increased height for better visualization */}
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                            data={chartData}
                            margin={{ top: 15, right: 40, left: 10, bottom: 30 }}
                        >
                            <defs>
                                <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1} />
                                </linearGradient>
                                <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                                </linearGradient>
                                <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>

                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />

                            <XAxis
                                dataKey="distance"
                                label={{ value: "Distance (m)", position: "insideBottom", offset: -5, fill: "#94a3b8" }}
                                stroke="#94a3b8"
                                tick={{ fill: "#94a3b8" }}
                                domain={xDomain}
                                type="number"
                                tickCount={8}
                                tickFormatter={(value) => Math.round(value).toString()}
                                allowDecimals={false}
                            />

                            <YAxis
                                yAxisId="left"
                                label={{ value: "Throughput (Mbps)", angle: -90, position: "insideLeft", offset: 10, fill: "#f59e0b" }}
                                stroke="#f59e0b"
                                tick={{ fill: "#94a3b8" }}
                                domain={[0, 'auto']}
                                padding={{ top: 15 }}
                            />

                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                label={{ value: "Fresnel Zone (m)", angle: 90, position: "insideRight", offset: 10, fill: "#10b981" }}
                                stroke="#10b981"
                                tick={{ fill: "#94a3b8" }}
                                domain={[0, 'auto']}
                                padding={{ top: 15 }}
                            />

                            <Tooltip
                                content={<CustomTooltip estimatedRange={estimatedRange} aglHeight={aglHeight} />}
                                cursor={{ strokeDasharray: '3 3' }}
                            />

                            {calculatorType === 'range' ? (
                                <Legend
                                    content={<CustomLegend activeItems={activeItems} onToggle={toggleItem} />}
                                    verticalAlign="bottom"
                                    height={42}
                                />
                            ) : (
                                <Legend wrapperStyle={{ paddingTop: "1rem" }} />
                            )}

                            {estimatedRange && (
                                <ReferenceLine
                                    x={estimatedRange}
                                    stroke="#FFFFFF"
                                    strokeDasharray="5 5"
                                    yAxisId="left"
                                    label={{ value: "Estimated Range", position: "top", fill: "#FFFFFF" }}
                                />
                            )}

                            {aglHeight && (
                                <ReferenceLine
                                    y={aglHeight}
                                    stroke="#FFFFFF"
                                    strokeDasharray="5 5"
                                    yAxisId="right"
                                    label={{ value: "Current AGL", position: "insideTopRight", fill: "#FFFFFF" }}
                                />
                            )}

                            {calculatorType === 'range' ? (
                                <>
                                    <Area
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="throughputWithin"
                                        name="Throughput (Within Estimated Range) >"
                                        stroke="#22c55e"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#greenGradient)"
                                        activeDot={{ r: 8, fill: "#22c55e", stroke: "#000" }}
                                        dot={(props) => <CustomizedDot {...props} />}
                                    />

                                    <Area
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="throughputBeyond"
                                        name="Throughput (Beyond Estimated Range) <"
                                        stroke="#ef4444"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#redGradient)"
                                        activeDot={{ r: 8, fill: "#ef4444", stroke: "#000" }}
                                        dot={(props) => <CustomizedDot {...props} />}
                                    />

                                    <Line
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="fresnelBelow"
                                        name="Fresnel-Zone Clearance (Below AGL) >"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        dot={(props) => <CustomizedDot {...props} />}
                                        activeDot={{ r: 8, fill: "#3b82f6", stroke: "#000" }}
                                    />

                                    <Line
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="fresnelAbove"
                                        name="Fresnel-Zone Clearance (Above AGL) <"
                                        stroke="#ef4444"
                                        strokeWidth={3}
                                        dot={(props) => <CustomizedDot {...props} />}
                                        activeDot={{ r: 8, fill: "#ef4444", stroke: "#000" }}
                                    />
                                </>
                            ) : (
                                <>
                                    <Area
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="throughput"
                                        name="Throughput (Mbps)"
                                        stroke="#F59E0B"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#greenGradient)"
                                        activeDot={{ r: 8, fill: "#F59E0B", stroke: "#000" }}
                                        dot={(props) => <CustomizedDot {...props} />}
                                    />

                                    <Line
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="fresnelClearance"
                                        name="Fresnel Zone (m)"
                                        stroke="#10b981"
                                        strokeWidth={3}
                                        dot={(props) => <CustomizedDot {...props} />}
                                        activeDot={{ r: 8, fill: "#10b981", stroke: "#000" }}
                                    />
                                </>
                            )}
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            );

        case 'throughput':
            // Similar implementation with centered domain
            return (
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                            data={data}
                            margin={{ top: 10, right: 30, left: 0, bottom: 25 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                            <XAxis
                                dataKey="distance"
                                label={{ value: "Distance (m)", position: "insideBottom", offset: -10, fill: "#94a3b8" }}
                                stroke="#94a3b8"
                                tick={{ fill: "#94a3b8" }}
                                domain={xDomain}
                                type="number"
                                tickCount={8}
                                tickFormatter={(value) => Math.round(value).toString()}
                            />
                            <YAxis
                                label={{ value: "Throughput (Mbps)", angle: -90, position: "insideLeft", offset: 10, fill: "#f59e0b" }}
                                stroke="#f59e0b"
                                tick={{ fill: "#94a3b8" }}
                                domain={[0, 'auto']}
                            />
                            <Tooltip content={<ThroughputTooltip />} />
                            <Legend wrapperStyle={{ paddingTop: "1rem" }} />
                            <defs>
                                <linearGradient id="gradientThroughput" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone"
                                dataKey="throughput"
                                name="Throughput (Mbps)"
                                stroke="#f59e0b"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#gradientThroughput)"
                                activeDot={{ r: 8, fill: "#f59e0b", stroke: "#000" }}
                                dot={(props) => <CustomizedDot {...props} />}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            );

        case 'fresnel':
            return (
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={chartData}
                            margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
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
                                domain={['dataMin', 'dataMax']}
                                type="number"
                            />

                            <YAxis
                                label={{
                                    value: "Fresnel Zone (m)",
                                    angle: -90,
                                    position: "insideLeft",
                                    offset: 10,
                                    fill: "#10b981"
                                }}
                                stroke="#10b981"
                                tick={{ fill: "#94a3b8" }}
                            />

                            <Tooltip
                                content={<CustomTooltip aglHeight={aglHeight} />}
                            />

                            <Legend
                                content={<CustomLegend
                                    activeItems={activeItems.filter(item =>
                                        item === 'fresnelBelow' || item === 'fresnelAbove'
                                    )}
                                    onToggle={toggleItem}
                                />}
                                verticalAlign="bottom"
                                height={36}
                            />

                            {aglHeight && (
                                <ReferenceLine
                                    y={aglHeight}
                                    stroke="#FFFFFF"
                                    strokeDasharray="5 5"
                                    label={{
                                        value: "Current AGL",
                                        position: "insideTopRight",
                                        fill: "#FFFFFF"
                                    }}
                                />
                            )}

                            {aglHeight ? (
                                <>
                                    <Line
                                        type="monotone"
                                        dataKey="fresnelBelow"
                                        name="Fresnel-Zone Clearance (Below AGL) >"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: "#3b82f6", stroke: "#000" }}
                                        activeDot={{ r: 8, fill: "#3b82f6", stroke: "#000" }}
                                        isAnimationActive={true}
                                        animationDuration={800}
                                    />

                                    <Line
                                        type="monotone"
                                        dataKey="fresnelAbove"
                                        name="Fresnel-Zone Clearance (Above AGL) <"
                                        stroke="#ef4444"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: "#ef4444", stroke: "#000" }}
                                        activeDot={{ r: 8, fill: "#ef4444", stroke: "#000" }}
                                        isAnimationActive={true}
                                        animationDuration={800}
                                    />
                                </>
                            ) : (
                                <Line
                                    type="monotone"
                                    dataKey="fresnelClearance"
                                    name="Fresnel Zone (m)"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: "#10b981", stroke: "#000" }}
                                    activeDot={{ r: 8, fill: "#10b981", stroke: "#000" }}
                                    isAnimationActive={true}
                                    animationDuration={800}
                                />
                            )}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            );

        case 'snr':
            // SNR case remains largely unchanged but with improved formatting
            return (
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={data}
                            margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
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
                                content={<CustomTooltip />}
                            />

                            <Legend />

                            <ReferenceLine y={25} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Excellent', position: 'right', fill: '#10b981' }} />
                            <ReferenceLine y={15} stroke="#eab308" strokeDasharray="3 3" label={{ value: 'Good', position: 'right', fill: '#eab308' }} />
                            <ReferenceLine y={10} stroke="#f97316" strokeDasharray="3 3" label={{ value: 'Fair', position: 'right', fill: '#f97316' }} />
                            <ReferenceLine y={5} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Poor', position: 'right', fill: '#ef4444' }} />

                            <Line
                                type="monotone"
                                dataKey="snr"
                                name="Signal-to-Noise Ratio (dB)"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                dot={{ r: 4, fill: "#3b82f6", stroke: "#000" }}
                                activeDot={{ r: 8, fill: "#3b82f6", stroke: "#000" }}
                            />

                            {estimatedRange && (
                                <ReferenceLine
                                    x={estimatedRange}
                                    stroke="#FFFFFF"
                                    strokeDasharray="5 5"
                                    label={{
                                        value: "Estimated Range",
                                        position: "top",
                                        fill: "#FFFFFF"
                                    }}
                                />
                            )}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            );

        default:
            return <div className="h-80 flex items-center justify-center">Invalid chart type</div>;
    }
};

export const ResultsCard: React.FC<{
    title: string;
    icon: ReactNode;
    color: string;
    children: ReactNode;
}> = ({ title, icon, color, children }) => (
    <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-800">
        <h3 className={`text-lg font-medium text-${color}-400 mb-4 flex items-center`}>
            {icon}
            <span className="ml-2">{title}</span>
        </h3>
        {children}
    </div>
);

export const AnalysisPanel: React.FC<{
    results: AnalysisResults;
    showAccordion?: boolean;
}> = ({ results, showAccordion }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-800">
            <h3 className="text-lg font-medium text-amber-400 mb-4">Throughput Performance</h3>
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800/50 p-3 rounded-lg">
                    <div className="text-sm text-gray-400">Max Throughput</div>
                    <div className="text-xl font-medium mt-1">{results.maxThroughput.toFixed(1)} Mbps</div>
                </div>
                <div className="bg-gray-800/50 p-3 rounded-lg">
                    <div className="text-sm text-gray-400">{results.finalRange === results.maxRange ? "Estimated" : "Min"} Throughput</div>
                    <div className="text-xl font-medium text-amber-500 mt-1">
                        {(results.maxThroughput - parseFloat(results.throughputDelta)).toFixed(1)} Mbps
                    </div>
                </div>
                <div className="bg-gray-800/50 p-3 rounded-lg">
                    <div className="text-sm text-gray-400">Max Distance</div>
                    <div className="text-xl font-medium mt-1">{results.finalRange.toFixed(1)} m</div>
                </div>
                <div className="bg-gray-800/50 p-3 rounded-lg">
                    <div className="text-sm text-gray-400">MCS Rate</div>
                    <div className="text-xl font-medium text-amber-400 mt-1">MCS {results.finalMcsRate}</div>
                </div>
            </div>
        </div> */}

        {/* <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-800">
            <h3 className="text-lg font-medium text-emerald-400 mb-4">RF Signal Analysis</h3>
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800/50 p-3 rounded-lg">
                    <div className="text-sm text-gray-400">Fresnel Zone</div>
                    <div className="text-xl font-medium mt-1">{results.finalAGL.toFixed(1)} meters</div>
                </div>
                <div className="bg-gray-800/50 p-3 rounded-lg">
                    <div className="text-sm text-gray-400">AGL Height</div>
                    <div className="text-xl font-medium mt-1">{results.aglM.toFixed(2)} meters</div>
                </div>
                <div className="bg-gray-800/50 p-3 rounded-lg">
                    <div className="text-sm text-gray-400">Clearance Margin</div>
                    <div className={`text-xl font-medium mt-1 ${results.aglDeltaPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {results.aglDeltaPositive ? '+' : ''}{results.aglDelta} m
                    </div>
                </div>
                <div className="bg-gray-800/50 p-3 rounded-lg">
                    <div className="text-sm text-gray-400">Fade Margin</div>
                    <div className="text-xl font-medium mt-1">{results.rangeResults[0]?.mcs ? `MCS ${results.rangeResults[0].mcs}` : "10 dB"}</div>
                </div>
            </div>
        </div> */}
    </div>
);

export { CHART_ANIMATIONS as Animations };