// Types, constants and device data for RF calculations
import React from 'react';

export type DeviceKey = "1L" | "2L" | "2KO" | "2KW";

export interface ChartDataPoint {
    distance: number;
    throughput: number;
    fresnelClearance: number;
    snr: number;
    mcs: number;
    modulation?: string;
    codingRate?: number;
    receivedPower?: number;
    sensitivity?: number;
    estimatedRange?: boolean;
}

export interface DeviceDetail {
    name: string;
    image: string;
}

export interface DeviceCardProps {
    deviceKey: string;
    device: DeviceDetail;
    isSelected: boolean;
    onClick: () => void;
}

export interface InputFieldProps {
    label: string;
    id: string;
    value: string | number | boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    type?: string;
    min?: string;
    max?: string;
    step?: string;
    options?: Array<{ value: string | number; label: string }>;
    disabled?: boolean;
    checked?: boolean;
    className?: string;
}

export interface CustomTooltipProps {
    active?: boolean;
    payload?: any[];
    label?: string;
}

export interface McsRangeItemProps {
    result: {
        mcs: number;
        range: number;
        throughput: number;
        fresnelClearance: number;
        withinThroughput: boolean;
        withinClearance: boolean;
    };
}

export interface RangeCalculationResult {
    mcs: number;
    range: number;
    throughput: number;
    fresnelClearance: number;
    withinThroughput: boolean;
    withinClearance: boolean;
}

export interface AnalysisResults {
    radioVariant?: string;
    mcsMode?: string;
    totalThroughput: number;
    finalRange: number;
    finalMcsRate: number;
    maxRange: number;
    maxMcsRate: number;
    maxThroughput: number;
    throughputDelta: string;
    rangeDelta: string;
    finalAGL: number;
    aglM: number;
    aglDelta: string;
    aglDeltaPositive: boolean;
    aglIncreaseNeeded: string;
    rangeResults: RangeCalculationResult[];
    climateRangeImpact?: string;
    climateThroughputImpact?: string;
}

export const RF_CONSTANTS = {
    ipv4: 20,
    eth2: 14,
    batAdv: 10,
    llc: 8,
    ieee80211: 42,
    phy: 4,
    mpduDelimiter: 0,
    aifs: 8,
    cwSize: 15,
    ackSize: 14,
    baSize: 32,
    phyHeader11n: 40,
    ltf: 4,
    sifs: 10,
    txop: 100000,
    psr: 90,
    basicRate: 12
};

export const DEVICES: Record<DeviceKey, {
    name: string;
    power: number[];
    sensitivity: number[];
    modulation: string[];
    codingRate: number[];
    bitsPerSymbol: number[];
    image: string;
}> = {
    "1L": {
        name: "Nano-OEM",
        power: [24, 23, 23, 23, 22, 21, 20, 18],
        sensitivity: [-87, -85, -83, -81, -77, -73, -71, -69],
        modulation: ["BPSK", "QPSK", "QPSK", "16-QAM", "16-QAM", "64-QAM", "64-QAM", "64-QAM"],
        codingRate: [1 / 2, 1 / 2, 3 / 4, 1 / 2, 3 / 4, 2 / 3, 3 / 4, 5 / 6],
        bitsPerSymbol: [1, 2, 2, 4, 4, 6, 6, 6],
        image: "/nano.png"
    },
    "2L": {
        name: "Mini-OEM",
        power: [27, 26, 26, 26, 25, 24, 23, 21],
        sensitivity: [-87, -85, -83, -81, -77, -73, -71, -69],
        modulation: ["BPSK", "QPSK", "QPSK", "16-QAM", "16-QAM", "64-QAM", "64-QAM", "64-QAM"],
        codingRate: [1 / 2, 1 / 2, 3 / 4, 1 / 2, 3 / 4, 2 / 3, 3 / 4, 5 / 6],
        bitsPerSymbol: [1, 2, 2, 4, 4, 6, 6, 6],
        image: "/mini.png"
    },
    "2KO": {
        name: "OEM (V2)",
        power: [30, 29, 29, 29, 28, 27, 26, 24],
        sensitivity: [-89, -87, -85, -83, -79, -75, -73, -71],
        modulation: ["BPSK", "QPSK", "QPSK", "16-QAM", "16-QAM", "64-QAM", "64-QAM", "64-QAM"],
        codingRate: [1 / 2, 1 / 2, 3 / 4, 1 / 2, 3 / 4, 2 / 3, 3 / 4, 5 / 6],
        bitsPerSymbol: [1, 2, 2, 4, 4, 6, 6, 6],
        image: "/oem.png"
    },
    "2KW": {
        name: "Wearable (V2)",
        power: [27, 26, 26, 26, 25, 24, 23, 21],
        sensitivity: [-87, -85, -83, -81, -77, -73, -71, -69],
        modulation: ["BPSK", "QPSK", "QPSK", "16-QAM", "16-QAM", "64-QAM", "64-QAM", "64-QAM"],
        codingRate: [1 / 2, 1 / 2, 3 / 4, 1 / 2, 3 / 4, 2 / 3, 3 / 4, 5 / 6],
        bitsPerSymbol: [1, 2, 2, 4, 4, 6, 6, 6],
        image: "/wear.png"
    }
};

export const BANDWIDTH_OPTIONS = [
    { value: "3", label: "3 MHz" },
    { value: "5", label: "5 MHz" },
    { value: "10", label: "10 MHz" },
    { value: "15", label: "15 MHz" },
    { value: "20", label: "20 MHz" },
    { value: "40", label: "40 MHz" },
];

export const ANTENNA_OPTIONS = [
    { value: "1", label: "1" },
    { value: "2", label: "2" },
];

export const STREAM_OPTIONS = [
    { value: "1", label: "1" },
    { value: "2", label: "2" },
];

export function getDeviceColor(deviceKey: string): string {
    const colorMap: Record<string, string> = {
        "1L": "blue",
        "2L": "amber",
        "2KO": "emerald",
        "2KW": "violet"
    };
    return colorMap[deviceKey] || "gray";
}

export const CHART_ANIMATIONS = {
    containerVariants: {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05, delayChildren: 0.1 }
        },
    },
    itemVariants: {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0, opacity: 1,
            transition: { type: "spring", stiffness: 80 },
        },
    },
    fadeIn: {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.4 } },
    }
};