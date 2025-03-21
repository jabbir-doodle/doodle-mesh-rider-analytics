// components/common/index.tsx
import React from 'react';
import { motion } from 'framer-motion';
import {
    DeviceDetail,
    InputFieldProps,
    DeviceCardProps,
    McsRangeItemProps,
    getDeviceColor,
    CustomTooltipProps
} from '../../types/common';

export const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.1
        }
    },
};

export const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { type: "spring", stiffness: 80 },
    },
};

export const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.4 } },
};

export const InputField: React.FC<InputFieldProps> = ({
    label,
    id,
    value,
    onChange,
    type = "text",
    min,
    max,
    step,
    options,
    disabled,
    checked,
    className = ""
}) => (
    <div className={`relative ${className}`}>
        <label htmlFor={id} className="block text-xs font-medium text-gray-300 mb-1">
            {label}
        </label>
        {type === "select" ? (
            <select
                id={id}
                value={value as string | number}
                onChange={onChange}
                disabled={disabled}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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
                    type="checkbox"
                    id={id}
                    checked={checked !== undefined ? checked : value as boolean}
                    onChange={onChange}
                    className="h-4 w-4 text-violet-500 focus:ring-violet-500 border-gray-700 rounded"
                />
                <span className="ml-2 text-sm text-gray-300">{label}</span>
            </div>
        ) : (
            <input
                type={type}
                id={id}
                value={value as string | number}
                onChange={onChange}
                min={min}
                max={max}
                step={step}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            />
        )}
    </div>
);

export const DeviceCard: React.FC<DeviceCardProps> = ({ deviceKey, device, isSelected, onClick }) => {
    return (
        <motion.div
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`bg-white rounded-lg shadow border ${isSelected ? 'border-blue-500' : 'border-gray-200'} transition-all duration-200 cursor-pointer h-full overflow-hidden`}
        >
            <div className="p-4 flex flex-col items-center justify-between h-full">
                <div className="flex items-center justify-center w-full mb-3">
                    <img
                        src={device.image}
                        alt={device.name}
                        className="h-16 w-auto object-contain mx-auto"
                    />
                </div>
                <div className="text-center mt-auto">
                    <h3 className={`text-sm font-medium ${isSelected ? 'text-blue-600' : 'text-gray-700'}`}>
                        {device.name}
                    </h3>
                    {isSelected && (
                        <span className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            Selected
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
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

export const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-gray-900 p-3 border border-gray-700 rounded-lg shadow-xl">
                <p className="font-medium text-white mb-1">Distance: {label} meters</p>
                <p className="text-amber-400 text-sm">
                    <span className="inline-block w-3 h-3 bg-amber-400 rounded-full mr-2"></span>
                    Throughput: {payload[0]?.value} Mbps
                </p>
                <p className="text-emerald-400 text-sm">
                    <span className="inline-block w-3 h-3 bg-emerald-400 rounded-full mr-2"></span>
                    Fresnel Zone: {payload[1] ? payload[1].value : "N/A"} meters
                </p>
                <p className="text-gray-300 text-sm mt-1">MCS: {payload[0]?.payload?.mcs || "N/A"}</p>
            </div>
        );
    }
    return null;
};
