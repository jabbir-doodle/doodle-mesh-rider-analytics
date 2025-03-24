import { useState } from 'react';
import { DEVICES, RF_CONSTANTS, ChartDataPoint, AnalysisResults, RangeCalculationResult, DeviceKey } from './RFData';

export function calculatePathLoss(distance: number, freq: number): number {
    const freqGHz = freq / 1000;
    return 20 * Math.log10(distance) + 20 * Math.log10(freqGHz) + 92.45;
}

export function calculateFresnelRadius(distance: number, freq: number, clearancePercent: number = 60): number {
    return 8.66 * Math.sqrt(distance / freq) * clearancePercent / 100;
}

export function calculateSNR(receivedPower: number, bandwidth: number): number {
    const noiseFloor = -174 + 10 * Math.log10(bandwidth * 1e6);
    const effectiveNoiseFloor = noiseFloor + 3;
    return receivedPower - effectiveNoiseFloor;
}

export const getPowerLimitOptions = (deviceKey: string) => {
    const [minVal, maxVal] = deviceKey === "1L" ? [18, 30] : [21, 33];
    return Array.from({ length: maxVal - minVal + 1 }, (_, i) => ({
        value: (maxVal - i).toString(),
        label: `${maxVal - i} dBm`
    }));
};

export function getLinkQuality(snr: number) {
    if (snr < 10) return { status: "Poor", color: "text-red-500" };
    if (snr < 15) return { status: "Fair", color: "text-yellow-500" };
    if (snr < 25) return { status: "Good", color: "text-green-500" };
    return { status: "Excellent", color: "text-green-500" };
}

export function getRangeLimits(chartData: ChartDataPoint[]) {
    if (!chartData.length) return { min: 0, max: 0 };
    const distances = chartData.map(point => point.distance);
    return { min: Math.min(...distances), max: Math.max(...distances) };
}

interface RFCalculationParams {
    deviceKey: DeviceKey;
    frequency: number | string;
    bandwidth: number | string;
    antennas: number | string;
    streams: number | string;
    udpPayload: number | string;
    antennaGain: number | string;
    fadeMargin: number | string;
    fresnelClearance?: number | string;
    isOverGround: boolean;
    powerLimit: number | string;
    framesAggregated?: number | string;
    telemetry?: string;
    video?: string;
    agl?: string;
    unit?: 'feet' | 'meters';
    calculationMode?: string;
}

export function useRFCalculations(calculatorType: 'range' | 'throughput') {
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [calculationComplete, setCalculationComplete] = useState(false);

    function calculateRF({
        deviceKey,
        frequency,
        bandwidth,
        antennas,
        streams,
        udpPayload,
        antennaGain,
        fadeMargin,
        fresnelClearance = "60",
        isOverGround,
        powerLimit,
        framesAggregated = "10",
        telemetry = "50",
        video = "3",
        agl = "400",
        unit = "feet",
        calculationMode = calculatorType === 'range' ? "mcs0_7" : ""
    }: RFCalculationParams) {
        setIsCalculating(true);
        setCalculationComplete(false);

        setTimeout(() => {
            try {
                const freq = parseFloat(frequency.toString());
                const bwNum = parseFloat(bandwidth.toString());
                const ant = parseFloat(antennas.toString());
                const str = parseFloat(streams.toString());
                const effectiveStreams = Math.min(str, ant);
                const udpVal = parseFloat(udpPayload.toString());
                const gain = parseFloat(antennaGain.toString());
                const fade = parseFloat(fadeMargin.toString());
                const fresnelPct = parseFloat(fresnelClearance.toString());
                const pwrLimit = parseFloat(powerLimit.toString());
                const ampduVal = Math.max(1, parseFloat(framesAggregated.toString()));

                const currentRadioModel = DEVICES[deviceKey];
                const headerTotal = RF_CONSTANTS.ipv4 + RF_CONSTANTS.eth2 + RF_CONSTANTS.batAdv +
                    RF_CONSTANTS.llc + RF_CONSTANTS.ieee80211 + RF_CONSTANTS.phy;

                let freqCorrection = 0;
                let effectiveAmpdu = ampduVal;

                if (isOverGround) {
                    freqCorrection = Math.round(10000 * (-0.0000000000313 * Math.pow(freq, 3) +
                        0.0000004618 * Math.pow(freq, 2) -
                        0.0024096 * freq + 5.8421)) / 10000;
                    effectiveAmpdu = Math.min(ampduVal, 2);
                }

                const giRate = bwNum === 40 ? 14.4 : 13;
                const stbw = bwNum > 20 ? 20 : bwNum;
                const slotTime = 4 + Math.ceil((17 * 5) / stbw);
                const phyOverhead = (RF_CONSTANTS.aifs + RF_CONSTANTS.cwSize) * slotTime +
                    (RF_CONSTANTS.phyHeader11n + effectiveStreams * RF_CONSTANTS.ltf) * 20 / bwNum;

                const mcsIndex: number[] = [];
                const rangeArr: number[] = [];
                const snrArr: number[] = [];
                const tptAdjustedArr: number[] = [];
                const fresnelClearanceDistance: number[] = [];
                const rangeCalculationResults: RangeCalculationResult[] = [];

                let powerArr = [...currentRadioModel.power];
                let sensitivityArr = [...currentRadioModel.sensitivity];

                for (let i = 0; i < 8; i++) {
                    powerArr[i] = Math.min(powerArr[i], pwrLimit - 3);
                    sensitivityArr[i] = sensitivityArr[i] - 10 * Math.log10(ant / effectiveStreams) - 10 * Math.log10(20 / bwNum);

                    if (calculatorType === 'range' && calculationMode === "mcs0_7") {
                        mcsIndex[i] = i;
                    } else {
                        mcsIndex[i] = i + (effectiveStreams - 1) * 8;
                    }

                    const linkSpeed = currentRadioModel.bitsPerSymbol[i] * currentRadioModel.codingRate[i] *
                        effectiveStreams * giRate * bwNum / 20;
                    const basicSpeed = RF_CONSTANTS.basicRate * (bwNum / 20) * currentRadioModel.bitsPerSymbol[i] *
                        Math.min(currentRadioModel.codingRate[i], 0.75);
                    const payload = udpVal + headerTotal;
                    const maxFrames = Math.max(Math.min(RF_CONSTANTS.txop / ((payload * 8) / linkSpeed), effectiveAmpdu), 1);
                    const phyTime = (effectiveAmpdu - 1) * RF_CONSTANTS.mpduDelimiter +
                        Math.ceil((payload * maxFrames * 8 / linkSpeed) / 4) * 4;

                    const rangeCalc = Math.pow(10, (powerArr[i] - sensitivityArr[i] - fade + gain) /
                        (20 + freqCorrection)) * 300 / (freq * 4 * Math.PI);
                    rangeArr[i] = parseFloat(rangeCalc.toFixed(1));

                    fresnelClearanceDistance[i] = parseFloat((8.66 * Math.sqrt(rangeArr[i] / freq) * fresnelPct / 100).toFixed(1));

                    const baRes = RF_CONSTANTS.sifs + (RF_CONSTANTS.phyHeader11n + effectiveStreams * RF_CONSTANTS.ltf) +
                        Math.ceil((32 * 8) / (basicSpeed * (bwNum / 20)));
                    const nWayTransit = Math.round(1000 * 4 * (rangeArr[i] / 300)) / 1000;
                    const timeNoTransit = phyTime + phyOverhead + baRes;
                    const timeTotal = timeNoTransit + nWayTransit;
                    tptAdjustedArr[i] = parseFloat((maxFrames * udpVal * 8 / timeTotal * 0.9).toFixed(1));

                    const pathLoss = calculatePathLoss(rangeArr[i], freq);
                    const receivedPower = powerArr[i] + gain - pathLoss;
                    snrArr[i] = parseFloat(calculateSNR(receivedPower, bwNum).toFixed(1));

                    if (calculatorType === 'range') {
                        const telemetryMbps = parseFloat(telemetry) / 1000;
                        const totalThroughput = telemetryMbps + parseFloat(video);
                        const AGLm = unit === "feet" ? parseFloat(agl) / 3.28084 : parseFloat(agl);

                        rangeCalculationResults.push({
                            mcs: mcsIndex[i],
                            range: rangeArr[i],
                            throughput: tptAdjustedArr[i],
                            fresnelClearance: fresnelClearanceDistance[i],
                            withinThroughput: totalThroughput <= tptAdjustedArr[i],
                            withinClearance: AGLm >= fresnelClearanceDistance[i]
                        });
                    }
                }

                const chartDataPoints = rangeArr.map((r, idx) => ({
                    distance: r,
                    throughput: tptAdjustedArr[idx],
                    fresnelClearance: fresnelClearanceDistance[idx],
                    snr: snrArr[idx],
                    mcs: mcsIndex[idx],
                    modulation: currentRadioModel.modulation[idx],
                    codingRate: currentRadioModel.codingRate[idx],
                    receivedPower: powerArr[idx] + gain - calculatePathLoss(r, freq),
                    sensitivity: sensitivityArr[idx],
                    estimatedRange: false
                })).sort((a, b) => a.distance - b.distance);

                if (calculatorType === 'range' && rangeCalculationResults.length > 0) {
                    const telemetryMbps = parseFloat(telemetry) / 1000;
                    const totalThroughput = telemetryMbps + parseFloat(video);
                    const AGLm = unit === "feet" ? parseFloat(agl) / 3.28084 : parseFloat(agl);

                    let finalAGL = fresnelClearanceDistance[0];
                    let rangeEstFinal = rangeArr[0];
                    let finalMcsRate = mcsIndex[0];
                    const maxRange = rangeArr[0];
                    const maxMcsRate = mcsIndex[0];
                    const maxThroughput = tptAdjustedArr[0];

                    for (let i = 1; i < 8; i++) {

                        if (totalThroughput > tptAdjustedArr[i - 1]) {
                            rangeEstFinal = rangeArr[i];
                            finalMcsRate = mcsIndex[i];
                            finalAGL = fresnelClearanceDistance[i];
                        } else if (AGLm < fresnelClearanceDistance[i - 1]) {
                            rangeEstFinal = rangeArr[i];
                            finalMcsRate = mcsIndex[i];
                            finalAGL = fresnelClearanceDistance[i];
                        }
                    }

                    chartDataPoints.forEach(point => {
                        point.estimatedRange = point.distance === rangeEstFinal;
                    });

                    const aglDelta = AGLm - finalAGL;
                    const aglDeltaPositive = aglDelta > 0;

                    setAnalysisResults({
                        radioVariant: deviceKey,
                        mcsMode: calculationMode,
                        totalThroughput,
                        finalRange: rangeEstFinal,
                        finalMcsRate,
                        maxRange,
                        maxMcsRate,
                        maxThroughput,
                        throughputDelta: Math.max(0, totalThroughput - maxThroughput).toFixed(2),
                        rangeDelta: Math.max(0, maxRange - rangeEstFinal).toFixed(2),
                        finalAGL,
                        aglM: AGLm,
                        aglDelta: aglDelta.toFixed(2),
                        aglDeltaPositive,
                        aglIncreaseNeeded: Math.max(0, finalAGL - AGLm).toFixed(2),
                        rangeResults: rangeCalculationResults
                    });
                }
                else if (calculatorType === 'throughput') {
                    setAnalysisResults({
                        radioVariant: deviceKey,
                        mcsMode: calculationMode,
                        totalThroughput: 0,
                        finalRange: chartDataPoints[0]?.distance || 0,
                        finalMcsRate: 0,
                        maxRange: chartDataPoints[chartDataPoints.length - 1]?.distance || 0,
                        maxMcsRate: 0,
                        maxThroughput: tptAdjustedArr[0] || 0,
                        throughputDelta: "0",
                        rangeDelta: "0",
                        finalAGL: 0,
                        aglM: 0,
                        aglDelta: "0",
                        aglDeltaPositive: false,
                        aglIncreaseNeeded: "0",
                        rangeResults: rangeCalculationResults
                    });
                }

                setChartData(chartDataPoints);
            } catch (error) {
                console.error("Calculation error:", error);
                setChartData([]);
                setAnalysisResults(null);
            } finally {
                setIsCalculating(false);
                setCalculationComplete(true);
            }
        }, 300);
    }

    return { chartData, analysisResults, isCalculating, calculationComplete, calculateRF };
}

export function segmentChartData(chartData: ChartDataPoint[], segmentPoint: number, property: keyof ChartDataPoint) {
    if (!chartData.length) return { beforeSegment: [], afterSegment: [] };

    const beforeSegment = chartData.map(point => {
        if (point.distance <= segmentPoint) {
            return { ...point };
        }
        const result = { ...point };
        (result[property] as any) = null;
        return result;
    });

    const afterSegment = chartData.map(point => {
        if (point.distance >= segmentPoint) {
            return { ...point };
        }
        const result = { ...point };
        (result[property] as any) = null;
        return result;
    });

    return { beforeSegment, afterSegment };
}

export function convertAGLUnit(currentValue: string, currentUnit: string, newUnit: string): string {
    if (newUnit === currentUnit) return currentValue;

    const value = parseFloat(currentValue);
    if (isNaN(value)) return "0";

    if (newUnit === "meters") {
        return (value / 3.28084).toFixed(2);
    } else {
        return (value * 3.28084).toFixed(2);
    }
}