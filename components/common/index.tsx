import React, { FC } from 'react';
import { motion } from 'framer-motion';
import { DeviceDetail, InputFieldProps, DeviceCardProps, McsRangeItemProps, getDeviceColor } from '../../types/common';

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

// Fix for InputField component in components/common/index.tsx
export const InputField: FC<InputFieldProps> = ({
    label,
    id,
    value,
    onChange,
    type = "text",
    min,
    max,
    step,  // Add this parameter
    options,
    disabled,
    checked,  // Add this parameter
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
                step={step}  // Add this line
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            />
        )}
    </div>
);

export const DeviceCard: FC<DeviceCardProps> = ({ deviceKey, device, isSelected, onClick }) => {
    const color = getDeviceColor(deviceKey);

    return (
        <motion.div
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`bg-gray-800 hover:bg-gray-750 rounded-xl overflow-hidden transition-all duration-200 cursor-pointer h-full ${isSelected
                ? `ring-2 ring-${color}-500 shadow-lg shadow-${color}-500/20`
                : "ring-1 ring-gray-700"
                }`}
        >
            <div className="p-4 flex flex-col items-center h-full">
                <div className={`w-full h-20 flex items-center justify-center mb-4 rounded-lg ${isSelected ? `bg-${color}-950/30` : 'bg-gray-900/30'}`}>
                    <img
                        src={device.image}
                        alt={device.name}
                        className="h-16 w-auto object-contain"
                    />
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

export const McsRangeItem: FC<McsRangeItemProps> = ({ result }) => {
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