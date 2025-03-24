import { motion } from 'framer-motion';
import { getLinkQuality } from './RFEngine';
import React, { useState, useCallback, useMemo } from 'react';
import {
    ComposedChart, LineChart, Line, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';

import {
    AnalysisResults, CHART_ANIMATIONS, ChartDataPoint, CustomTooltipProps,
    DeviceCardProps, getDeviceColor, InputFieldProps, McsRangeItemProps
} from './RFData';

export const DeviceCard = ({ deviceKey, device, isSelected, onClick }: DeviceCardProps) => {
    const color = getDeviceColor(deviceKey);
    return (
        <motion.div
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`bg-gray-800 hover:bg-gray-750 rounded-xl overflow-hidden transition-all duration-200 cursor-pointer h-full ${isSelected ? `ring-2 ring-${color}-500 shadow-lg shadow-${color}-500/20` : "ring-1 ring-white-700"}`}
        >
            <div className="p-4 flex flex-col items-center h-full">
                <div className={`w-full h-20 flex items-center justify-center mb-4 rounded-lg ${isSelected ? `bg-${color}-950/30` : 'bg-gray-900/30'}`}>
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

export const InputField = ({
    label, id, value, onChange, type = "text", min, max, step,
    options, disabled, checked, className = ""
}: InputFieldProps) => (
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
                    type="checkbox" id={id} checked={checked ?? value as boolean} onChange={onChange}
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

export const McsRangeItem = ({ result }: McsRangeItemProps) => {
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

const CustomTooltip = ({ active, payload, estimatedRange, aglHeight }: CustomTooltipProps & { estimatedRange?: number, aglHeight?: number }) => {
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0].payload as ChartDataPoint;
    const withinRange = estimatedRange ? data.distance <= estimatedRange : true;
    const belowAGL = aglHeight ? data.fresnelClearance <= aglHeight : true;

    return (
        <div className="bg-gray-800 border border-gray-700 p-3 rounded-md shadow-xl">
            <p className="text-blue-200 font-medium">Distance: {data.distance?.toFixed(1)} m</p>

            {payload.find(p => p.dataKey?.includes('throughput')) && (
                <p className={withinRange ? "text-green-400" : "text-red-400"}>
                    Throughput: {data.throughput?.toFixed(1)} Mbps
                    <span className="text-gray-400 text-xs ml-2">
                        {withinRange ? "(Within Range)" : "(Beyond Range)"}
                    </span>
                </p>
            )}

            {payload.find(p => p.dataKey?.includes('fresnel')) && (
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

            {payload.find(p => p.dataKey?.includes('snr')) && (
                <p className="text-blue-400">SNR: {data.snr?.toFixed(1)} dB</p>
            )}
        </div>
    );
};

const CustomLegend = ({
    payload,
    activeItems,
    onToggle,
    allDataKeys,
    valueLabels,
    colorMap
}: {
    payload?: any[];
    activeItems: string[];
    onToggle: (key: string) => void;
    allDataKeys?: string[];
    valueLabels?: Record<string, string>;
    colorMap?: Record<string, string>;
}) => {

    if (allDataKeys && allDataKeys.length > 0) {
        return (
            <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2 p-0">
                {allDataKeys.map((dataKey) => {
                    const isActive = activeItems.includes(dataKey);
                    const color = colorMap?.[dataKey] || '#777';
                    const label = valueLabels?.[dataKey] || dataKey;

                    return (
                        <li
                            key={`item-${dataKey}`}
                            className={`flex items-center cursor-pointer list-none px-2 py-1 rounded-md border ${isActive ? 'border-gray-400 bg-gray-800/30' : 'border-transparent'}`}
                            onClick={() => onToggle(dataKey)}
                        >
                            <span
                                className="inline-block w-3 h-3 mr-2 rounded-sm"
                                style={{ backgroundColor: color }}
                            />
                            <span className={`text-sm ${isActive ? 'text-white' : 'text-gray-400'}`}>
                                {label}
                            </span>
                        </li>
                    );
                })}
            </ul>
        );
    }
    if (!payload) return null;

    return (
        <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2 p-0">
            {payload.map((entry) => {
                const isActive = activeItems.includes(entry.dataKey);
                return (
                    <li
                        key={`item-${entry.dataKey}`}
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
const CustomizedDot = (props: any) => {
    const { cx, cy, index, dataPoints } = props;
    const totalPoints = dataPoints?.length || 10;
    const interval = Math.max(1, Math.floor(totalPoints / 8));
    const showDot = index === 0 || index === (dataPoints?.length - 1) || index % interval === 0;

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

export const RFChart = ({
    type,
    data,
    estimatedRange,
    aglHeight,
    frequency,
    bandwidth,
    calculatorType = 'throughput'
}: {
    type: 'dual' | 'throughput' | 'fresnel' | 'snr';
    data: ChartDataPoint[];
    estimatedRange?: number;
    aglHeight?: number;
    frequency?: number;
    bandwidth?: number | string;
    calculatorType?: 'range' | 'throughput';
}) => {
    const [activeItems, setActiveItems] = useState([
        'throughputWithin', 'throughputBeyond', 'fresnelBelow', 'fresnelAbove'
    ]);

    const toggleItem = useCallback((dataKey: string) => {
        setActiveItems(prev =>
            prev.includes(dataKey)
                ? prev.filter(item => item !== dataKey)
                : [...prev, dataKey]
        );
    }, []);

    const generateCustomTicks = (
        chartData: ChartDataPoint[],
        estimatedRange?: number
    ): number[] => {
        if (!chartData.length) return [];


        const distances = chartData.map(point => point.distance);
        const minDistance = Math.min(...distances);
        const maxDistance = Math.max(...distances);

        const tickCount = 6; // Adjust as needed
        const step = (maxDistance - minDistance) / (tickCount - 1);
        const baseTicks = Array.from({ length: tickCount }, (_, i) =>
            Math.round(minDistance + i * step)
        );


        if (estimatedRange !== undefined) {

            const isRangeIncluded = baseTicks.some(tick =>
                Math.abs(tick - estimatedRange) < (step / 4)
            );

            if (!isRangeIncluded) {

                const newTicks = [...baseTicks, estimatedRange];
                return newTicks.sort((a, b) => a - b);
            }
        }

        return baseTicks;
    };

    const chartData = useMemo(() => {
        if (!data.length) return [];

        if (calculatorType !== 'range') return data;

        // Exact same approach as the original JS implementation that uses xValues and yValues mapping
        // This ensures consistent chart segmentation behavior
        return data.map(d => ({
            ...d,
            throughputWithin: parseFloat(d.distance.toString()) <= parseFloat((estimatedRange || Infinity).toString()) ? d.throughput : null,
            throughputBeyond: parseFloat(d.distance.toString()) >= parseFloat((estimatedRange || -Infinity).toString()) ? d.throughput : null,
            fresnelBelow: parseFloat(d.fresnelClearance.toString()) <= parseFloat((aglHeight || Infinity).toString()) ? d.fresnelClearance : null,
            fresnelAbove: parseFloat(d.fresnelClearance.toString()) >= parseFloat((aglHeight || -Infinity).toString()) ? d.fresnelClearance : null
        }));
    }, [data, calculatorType, estimatedRange, aglHeight]);

    const xDomain = useMemo(() => {
        if (!chartData.length) return [0, 0];

        const distanceMin = Math.min(...chartData.map(d => d.distance));
        const distanceMax = Math.max(...chartData.map(d => d.distance));
        const domainPadding = 0.15;

        return [
            distanceMin * (1 - domainPadding),
            distanceMax * (1 + domainPadding)
        ];
    }, [chartData]);

    if (!chartData.length) {
        return <div className="h-80 flex items-center justify-center">No data available</div>;
    }

    const isVisible = (dataKey: string) => activeItems.includes(dataKey);

    const renderChart = () => {
        switch (type) {
            case 'dual':
                return (
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
                            domain={xDomain}
                            type="number"
                            ticks={generateCustomTicks(chartData, estimatedRange)}
                            tickFormatter={(value) => {

                                if (estimatedRange && Math.abs(value - estimatedRange) < 0.1) {
                                    return estimatedRange.toString();
                                }
                                return Math.round(value).toString();
                            }}
                            tick={(props) => {
                                const { x, y, payload } = props;
                                const isEstimatedRange = estimatedRange &&
                                    Math.abs(payload.value - estimatedRange) < 0.1;

                                return (
                                    <g transform={`translate(${x},${y})`}>
                                        <text
                                            x={0}
                                            y={0}
                                            dy={16}
                                            textAnchor="middle"
                                            fill={isEstimatedRange ? "#FFFFFF" : "#94a3b8"}
                                            fontWeight={isEstimatedRange ? "bold" : "normal"}
                                        >
                                            {isEstimatedRange
                                                ? estimatedRange?.toString()
                                                : Math.round(payload.value).toString()}
                                        </text>
                                    </g>
                                );
                            }}
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

                        <Tooltip content={<CustomTooltip estimatedRange={estimatedRange} aglHeight={aglHeight} />} cursor={{ strokeDasharray: '3 3' }} />

                        {calculatorType === 'range' ? (
                            <Legend
                                content={
                                    <CustomLegend
                                        activeItems={activeItems}
                                        onToggle={toggleItem}
                                        allDataKeys={[
                                            'throughputWithin',
                                            'throughputBeyond',
                                            'fresnelBelow',
                                            'fresnelAbove'
                                        ]}
                                        valueLabels={{
                                            'throughputWithin': 'Throughput (Within Estimated Range) >',
                                            'throughputBeyond': 'Throughput (Beyond Estimated Range) <',
                                            'fresnelBelow': 'Fresnel-Zone Clearance (Below AGL) >',
                                            'fresnelAbove': 'Fresnel-Zone Clearance (Above AGL) <'
                                        }}
                                        colorMap={{
                                            'throughputWithin': '#22c55e',
                                            'throughputBeyond': '#ef4444',
                                            'fresnelBelow': '#3b82f6',
                                            'fresnelAbove': '#ef4444'
                                        }}
                                    />
                                }
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
                                {isVisible('throughputWithin') && (
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
                                        dot={(props) => <CustomizedDot {...props} dataPoints={chartData} />}
                                    />
                                )}

                                {isVisible('throughputBeyond') && (
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
                                        dot={(props) => <CustomizedDot {...props} dataPoints={chartData} />}
                                    />
                                )}

                                {isVisible('fresnelBelow') && (
                                    <Line
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="fresnelBelow"
                                        name="Fresnel-Zone Clearance (Below AGL) >"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        dot={(props) => <CustomizedDot {...props} dataPoints={chartData} />}
                                        activeDot={{ r: 8, fill: "#3b82f6", stroke: "#000" }}
                                    />
                                )}

                                {isVisible('fresnelAbove') && (
                                    <Line
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="fresnelAbove"
                                        name="Fresnel-Zone Clearance (Above AGL) <"
                                        stroke="#ef4444"
                                        strokeWidth={3}
                                        dot={(props) => <CustomizedDot {...props} dataPoints={chartData} />}
                                        activeDot={{ r: 8, fill: "#ef4444", stroke: "#000" }}
                                    />
                                )}
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
                                    dot={(props) => <CustomizedDot {...props} dataPoints={chartData} />}
                                />

                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="fresnelClearance"
                                    name="Fresnel Zone (m)"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    dot={(props) => <CustomizedDot {...props} dataPoints={chartData} />}
                                    activeDot={{ r: 8, fill: "#10b981", stroke: "#000" }}
                                />
                            </>
                        )}
                    </ComposedChart>
                );

            case 'throughput':
                return (
                    <ComposedChart
                        data={chartData}
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
                        <Tooltip content={<CustomTooltip estimatedRange={estimatedRange} />} />
                        <Legend wrapperStyle={{ paddingTop: "1rem" }} />
                        <defs>
                            <linearGradient id="gradientThroughput" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
                            </linearGradient>
                        </defs>

                        {estimatedRange && (
                            <ReferenceLine
                                x={estimatedRange}
                                stroke="#FFFFFF"
                                strokeDasharray="5 5"
                                label={{ value: "Estimated Range", position: "top", fill: "#FFFFFF" }}
                            />
                        )}

                        {calculatorType === 'range' ? (
                            <>
                                {isVisible('throughputWithin') && (
                                    <Area
                                        type="monotone"
                                        dataKey="throughputWithin"
                                        name="Throughput (Within Range)"
                                        stroke="#22c55e"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#greenGradient)"
                                        activeDot={{ r: 8, fill: "#22c55e", stroke: "#000" }}
                                        dot={(props) => <CustomizedDot {...props} dataPoints={chartData} />}
                                    />
                                )}

                                {isVisible('throughputBeyond') && (
                                    <Area
                                        type="monotone"
                                        dataKey="throughputBeyond"
                                        name="Throughput (Beyond Range)"
                                        stroke="#ef4444"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#redGradient)"
                                        activeDot={{ r: 8, fill: "#ef4444", stroke: "#000" }}
                                        dot={(props) => <CustomizedDot {...props} dataPoints={chartData} />}
                                    />
                                )}
                            </>
                        ) : (
                            <Area
                                type="monotone"
                                dataKey="throughput"
                                name="Throughput (Mbps)"
                                stroke="#f59e0b"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#gradientThroughput)"
                                activeDot={{ r: 8, fill: "#f59e0b", stroke: "#000" }}
                                dot={(props) => <CustomizedDot {...props} dataPoints={chartData} />}
                            />
                        )}
                    </ComposedChart>
                );

            case 'fresnel':
                return (
                    <LineChart
                        data={chartData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                        <XAxis
                            dataKey="distance"
                            label={{ value: "Distance (m)", position: "insideBottom", offset: -10, fill: "#94a3b8" }}
                            stroke="#94a3b8"
                            tick={{ fill: "#94a3b8" }}
                            domain={xDomain}
                            type="number"
                        />
                        <YAxis
                            label={{ value: "Fresnel Zone (m)", angle: -90, position: "insideLeft", offset: 10, fill: "#10b981" }}
                            stroke="#10b981"
                            tick={{ fill: "#94a3b8" }}
                        />
                        <Tooltip content={<CustomTooltip aglHeight={aglHeight} />} />

                        {calculatorType === 'range' && (
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
                        )}

                        {estimatedRange && (
                            <ReferenceLine
                                x={estimatedRange}
                                stroke="#FFFFFF"
                                strokeDasharray="5 5"
                                label={{ value: "Estimated Range", position: "top", fill: "#FFFFFF" }}
                            />
                        )}

                        {aglHeight && (
                            <ReferenceLine
                                y={aglHeight}
                                stroke="#FFFFFF"
                                strokeDasharray="5 5"
                                label={{ value: "Current AGL", position: "insideTopRight", fill: "#FFFFFF" }}
                            />
                        )}

                        {calculatorType === 'range' ? (
                            <>
                                {isVisible('fresnelBelow') && (
                                    <Line
                                        type="monotone"
                                        dataKey="fresnelBelow"
                                        name="Fresnel-Zone Clearance (Below AGL) >"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: "#3b82f6", stroke: "#000" }}
                                        activeDot={{ r: 8, fill: "#3b82f6", stroke: "#000" }}
                                    />
                                )}

                                {isVisible('fresnelAbove') && (
                                    <Line
                                        type="monotone"
                                        dataKey="fresnelAbove"
                                        name="Fresnel-Zone Clearance (Above AGL) <"
                                        stroke="#ef4444"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: "#ef4444", stroke: "#000" }}
                                        activeDot={{ r: 8, fill: "#ef4444", stroke: "#000" }}
                                    />
                                )}
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
                            />
                        )}
                    </LineChart>
                );

            case 'snr':
                return (
                    <LineChart
                        data={chartData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                        <XAxis
                            dataKey="distance"
                            label={{ value: "Distance (m)", position: "insideBottom", offset: -10, fill: "#94a3b8" }}
                            stroke="#94a3b8"
                            tick={{ fill: "#94a3b8" }}
                            domain={xDomain}
                        />
                        <YAxis
                            label={{ value: "SNR (dB)", angle: -90, position: "insideLeft", offset: 10, fill: "#3b82f6" }}
                            stroke="#3b82f6"
                            tick={{ fill: "#94a3b8" }}
                        />
                        <Tooltip content={<CustomTooltip estimatedRange={estimatedRange} />} />
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
                                label={{ value: "Estimated Range", position: "top", fill: "#FFFFFF" }}
                            />
                        )}
                    </LineChart>
                );

            default:
                return <div className="h-80 flex items-center justify-center">Invalid chart type</div>;
        }
    };

    return (
        <div className={type === 'dual' ? "h-96" : "h-80"}>
            <ResponsiveContainer width="100%" height="100%">
                {renderChart()}
            </ResponsiveContainer>
        </div>
    );
};

export const ResultsCard = ({
    title,
    icon,
    color,
    children
}: {
    title: string;
    icon: React.ReactNode;
    color: string;
    children: React.ReactNode;
}) => (
    <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-800">
        <h3 className={`text-lg font-medium text-${color}-400 mb-4 flex items-center`}>
            {icon}
            <span className="ml-2">{title}</span>
        </h3>
        {children}
    </div>
);

export const AnalysisPanel = ({
    results,
    showAccordion
}: {
    results: AnalysisResults;
    showAccordion?: boolean;
}) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Analysis panel components can be added here if needed */}
    </div>
);

export const DualAxisTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload as ChartDataPoint;
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

export const ThroughputTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload as ChartDataPoint;
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

export const FresnelTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload as ChartDataPoint;

        return (
            <div className="bg-gray-800 border border-gray-700 p-3 rounded-md shadow-lg">
                <p className="text-blue-200 font-medium">Distance: {data.distance?.toFixed(1)} m</p>
                <p className="text-emerald-400 font-medium">Fresnel Zone: {data.fresnelClearance?.toFixed(2)} m</p>
            </div>
        );
    }
    return null;
};

export const SNRTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload as ChartDataPoint;
        const { status, color } = getLinkQuality(data.snr);
        const codingRatePercent = Math.round((data.codingRate || 0) * 100);

        return (
            <div className="bg-gray-800 border border-gray-700 p-3 rounded-md shadow-lg">
                <p className="text-blue-200 font-medium">Distance: {data.distance?.toFixed(1)} m</p>
                <p className="text-blue-400">SNR: {data.snr?.toFixed(1)} dB</p>
                <p className={`font-medium ${color}`}>Link Quality: {status}</p>
                <p className="text-emerald-400">MCS: {data.mcs} ({data.modulation}, {codingRatePercent}%)</p>
                <p className="text-amber-400">Throughput: {data.throughput?.toFixed(1)} Mbps</p>
            </div>
        );
    }
    return null;
};

export { CHART_ANIMATIONS as Animations };