// src/utils/rfAnalysisUtils.ts

// Define the signal quality levels
export enum SignalQuality {
    Excellent = 'excellent',
    Good = 'good',
    Fair = 'fair',
    Poor = 'poor',
    Critical = 'critical'
}

export interface RfLinkBudget {
    txPower: number;           // dBm
    txAntennaGain: number;     // dBi
    rxAntennaGain: number;     // dBi
    cableLossTx: number;       // dB
    cableLossRx: number;       // dB
    pathLoss: number;          // dB
    fadingMargin: number;      // dB
    receivedSignalPower: number; // dBm
    noiseFigure: number;       // dB
    noiseFloor: number;        // dBm
    snr: number;               // dB
    sensitivity: number;       // dBm
    linkMargin: number;        // dB
    linkStatus: SignalQuality;
}

export interface EnvironmentFactors {
    rainAttenuation: number;   // dB
    fogAttenuation: number;    // dB
    vegetationLoss: number;    // dB
    buildingPenetrationLoss: number; // dB
    additionalLosses: number;  // dB
}

/**
 * Calculate free space path loss according to the standard formula
 * @param distanceKm - Distance in kilometers
 * @param frequencyGHz - Frequency in GHz
 * @returns Path loss in dB
 */
export function calculateFreeSpacePathLoss(distanceKm: number, frequencyGHz: number): number {
    // Free Space Path Loss (dB) = 20*log10(d) + 20*log10(f) + 92.45
    return 20 * Math.log10(distanceKm) + 20 * Math.log10(frequencyGHz) + 92.45;
}

/**
 * Calculate two-ray ground reflection model path loss
 * @param distanceKm - Distance in kilometers
 * @param frequencyGHz - Frequency in GHz
 * @param txHeightM - Transmitter height in meters
 * @param rxHeightM - Receiver height in meters
 * @returns Path loss in dB
 */
export function calculateTwoRayGroundPathLoss(
    distanceKm: number,
    frequencyGHz: number,
    txHeightM: number,
    rxHeightM: number
): number {
    // 2-Ray Ground: 20*log10(d) + 20*log10(f) + 92.45 - 20*log10(h1*h2) + 10
    const fspl = calculateFreeSpacePathLoss(distanceKm, frequencyGHz);
    return fspl - 20 * Math.log10(txHeightM * rxHeightM) + 10;
}

/**
 * Calculate the Fresnel zone radius at a specified clearance percentage
 * @param distanceKm - Total path distance in kilometers
 * @param frequencyGHz - Frequency in GHz
 * @param clearancePercentage - Desired clearance percentage (typically 60-80%)
 * @returns Fresnel zone radius in meters
 */
export function calculateFresnelZoneRadius(
    distanceKm: number,
    frequencyGHz: number,
    clearancePercentage: number = 60
): number {
    // Fresnel zone radius (meters) = 8.66 * sqrt(distance / frequency) * clearance_percentage / 100
    return 8.66 * Math.sqrt(distanceKm / frequencyGHz) * clearancePercentage / 100;
}

/**
 * Calculate optimal antenna height needed for proper Fresnel zone clearance
 * @param distanceKm - Distance in kilometers
 * @param frequencyGHz - Frequency in GHz
 * @param obstacleHeightM - Height of obstacles in meters
 * @param terrainClearanceM - Additional terrain clearance in meters
 * @returns Required antenna height in meters
 */
export function calculateOptimalAntennaHeight(
    distanceKm: number,
    frequencyGHz: number,
    obstacleHeightM: number,
    terrainClearanceM: number = 2
): number {
    const fresnelRadius = calculateFresnelZoneRadius(distanceKm, frequencyGHz, 60);
    return obstacleHeightM + fresnelRadius + terrainClearanceM;
}

/**
 * Calculate rain attenuation based on ITU-R models
 * @param frequencyGHz - Frequency in GHz
 * @param distanceKm - Distance in kilometers
 * @param rainRateMmHr - Rain rate in mm/hour (light: 0-5, moderate: 5-10, heavy: >10)
 * @returns Rain attenuation in dB
 */
export function calculateRainAttenuation(
    frequencyGHz: number,
    distanceKm: number,
    rainRateMmHr: number
): number {
    // Simplified rain attenuation model based on frequency and distance
    // For more accurate calculations, the full ITU-R P.838 model should be used
    if (rainRateMmHr <= 0) return 0;

    let k, α;
    if (frequencyGHz < 2.5) {
        k = 0.0000855;
        α = 0.9;
    } else if (frequencyGHz < 5) {
        k = 0.000138;
        α = 1.1;
    } else if (frequencyGHz < 7) {
        k = 0.00175;
        α = 1.3;
    } else {
        k = 0.01;
        α = 1.6;
    }

    return k * Math.pow(frequencyGHz, α) * Math.pow(rainRateMmHr, 0.8) * distanceKm;
}

/**
 * Calculate fog/cloud attenuation
 * @param frequencyGHz - Frequency in GHz
 * @param distanceKm - Distance in kilometers
 * @param liquidWaterDensity - Liquid water density (g/m³) - light: 0.05, medium: 0.2, heavy: 0.5
 * @returns Fog attenuation in dB
 */
export function calculateFogAttenuation(
    frequencyGHz: number,
    distanceKm: number,
    liquidWaterDensity: number = 0.05
): number {
    // K_l = liquid water specific attenuation coefficient
    // Simplified model: K_l = 0.0001 * f^2 * M where M is liquid water density
    return 0.0001 * Math.pow(frequencyGHz, 2) * liquidWaterDensity * distanceKm;
}

/**
 * Calculate Signal-to-Noise Ratio (SNR)
 * @param signalPower - Received signal power in dBm
 * @param noiseFloor - Noise floor in dBm
 * @returns SNR in dB
 */
export function calculateSNR(signalPower: number, noiseFloor: number): number {
    return signalPower - noiseFloor;
}

/**
 * Calculate noise floor based on bandwidth and temperature
 * @param bandwidthMHz - Channel bandwidth in MHz
 * @param temperatureC - Ambient temperature in Celsius
 * @param noiseFigure - Receiver noise figure in dB
 * @returns Noise floor in dBm
 */
export function calculateNoiseFloor(
    bandwidthMHz: number,
    temperatureC: number = 25,
    noiseFigure: number = 4
): number {
    // Convert temperature to Kelvin
    const temperatureK = temperatureC + 273.15;

    // Boltzmann's constant
    const k = 1.38064852e-23;

    // Thermal noise power in dBm = 10*log10(k*T*B*1000)
    const thermalNoise = 10 * Math.log10(k * temperatureK * bandwidthMHz * 1e6 * 1000);

    // Add noise figure
    return thermalNoise + noiseFigure;
}

/**
 * Estimate the appropriate MCS (Modulation and Coding Scheme) based on SNR
 * @param snrDb - Signal-to-Noise Ratio in dB
 * @param mimoStreams - Number of MIMO streams (1 or 2)
 * @returns Recommended MCS index
 */
export function determineOptimalMCS(snrDb: number, mimoStreams: number = 1): number {
    // MCS thresholds for reliable operation (conservative values)
    const mcsThresholds = [
        { mcs: 0, snr: 5 },   // BPSK 1/2
        { mcs: 1, snr: 10 },  // QPSK 1/2
        { mcs: 2, snr: 14 },  // QPSK 3/4
        { mcs: 3, snr: 16 },  // 16-QAM 1/2
        { mcs: 4, snr: 20 },  // 16-QAM 3/4
        { mcs: 5, snr: 25 },  // 64-QAM 2/3
        { mcs: 6, snr: 27 },  // 64-QAM 3/4
        { mcs: 7, snr: 29 }   // 64-QAM 5/6
    ];

    // Find the highest MCS that meets the SNR requirement
    let mcs = 0;
    for (let i = mcsThresholds.length - 1; i >= 0; i--) {
        if (snrDb >= mcsThresholds[i].snr) {
            mcs = mcsThresholds[i].mcs;
            break;
        }
    }

    // For 2x2 MIMO, we can use higher MCS values (8-15) for increased throughput
    if (mimoStreams === 2 && mcs > 0) {
        return mcs + 8;  // Shift to equivalent MIMO MCS
    }

    return mcs;
}

/**
 * Estimate the expected throughput based on RF parameters and link conditions
 * @param mcs - Modulation and Coding Scheme index
 * @param bandwidthMHz - Channel bandwidth in MHz
 * @param mimoStreams - Number of MIMO streams (1 or 2)
 * @param packetLoss - Expected packet loss percentage (0-100)
 * @returns Estimated throughput in Mbps
 */
export function estimateThroughput(
    mcs: number,
    bandwidthMHz: number,
    mimoStreams: number = 1,
    packetLoss: number = 0
): number {
    // Base raw data rates for 20MHz channel (from Doodle Labs datasheets)
    const baseThroughputMbps = [
        5.4,    // MCS 0
        10.62,  // MCS 1
        15.66,  // MCS 2
        20.52,  // MCS 3
        29.88,  // MCS 4
        38.88,  // MCS 5
        43.11,  // MCS 6
        47.34,  // MCS 7
        10.53,  // MCS 8 (MIMO)
        20.43,  // MCS 9 (MIMO)
        29.7,   // MCS 10 (MIMO)
        38.52,  // MCS 11 (MIMO)
        54.72,  // MCS 12 (MIMO)
        69.3,   // MCS 13 (MIMO)
        76.14,  // MCS 14 (MIMO)
        82.8    // MCS 15 (MIMO)
    ];

    // Calculate bandwidth scaling factor
    const bwScalingFactor = bandwidthMHz / 20.0;

    // Get the base throughput for the given MCS
    const baseThroughput = mcs < baseThroughputMbps.length
        ? baseThroughputMbps[mcs]
        : baseThroughputMbps[7] * 1.1;  // Fallback with small improvement

    // Apply bandwidth scaling
    let throughput = baseThroughput * bwScalingFactor;

    // Apply packet loss degradation
    throughput = throughput * (1 - packetLoss / 100);

    return Math.max(0, throughput);
}

/**
 * Calculate complete RF link budget and performance metrics
 * @param params - Configuration parameters for the link budget calculation
 * @returns Complete link budget analysis results
 */
export function calculateLinkBudget(params: {
    // Link parameters
    distanceKm: number;
    frequencyGHz: number;
    bandwidthMHz: number;
    txPowerDbm: number;
    txAntennaGainDbi: number;
    rxAntennaGainDbi: number;
    txCableLossDb: number;
    rxCableLossDb: number;
    noiseFigureDb: number;
    // Environment parameters
    rainRateMmHr?: number;
    fogDensity?: number;
    vegetationDepthM?: number;
    wallsCount?: number;
    additionalLossDb?: number;
    temperatureC?: number;
    // Heights
    txHeightM?: number;
    rxHeightM?: number;
    obstacleHeightM?: number;
}): RfLinkBudget {
    const {
        distanceKm, frequencyGHz, bandwidthMHz, txPowerDbm,
        txAntennaGainDbi, rxAntennaGainDbi, txCableLossDb, rxCableLossDb, noiseFigureDb,
        rainRateMmHr = 0, fogDensity = 0, vegetationDepthM = 0, wallsCount = 0, additionalLossDb = 0,
        temperatureC = 25, txHeightM = 3, rxHeightM = 3, obstacleHeightM = 0
    } = params;

    // Calculate baseline path loss
    let pathLoss = 0;
    if (txHeightM > 0 && rxHeightM > 0) {
        pathLoss = calculateTwoRayGroundPathLoss(distanceKm, frequencyGHz, txHeightM, rxHeightM);
    } else {
        pathLoss = calculateFreeSpacePathLoss(distanceKm, frequencyGHz);
    }

    // Calculate environmental losses
    const rainLoss = calculateRainAttenuation(frequencyGHz, distanceKm, rainRateMmHr);
    const fogLoss = calculateFogAttenuation(frequencyGHz, distanceKm, fogDensity);
    const vegetationLoss = vegetationDepthM > 0 ? 0.2 * frequencyGHz * vegetationDepthM : 0;
    const buildingLoss = wallsCount > 0 ? wallsCount * (frequencyGHz < 2.5 ? 4 : 6) : 0;

    const environmentLoss = rainLoss + fogLoss + vegetationLoss + buildingLoss + additionalLossDb;

    // Calculate fading margin based on distance and frequency
    // This is a simplified model - in practice, more complex models are used
    const fadingMargin = 5 + 5 * Math.log10(distanceKm * frequencyGHz);

    // Calculate received signal strength
    const eirp = txPowerDbm + txAntennaGainDbi - txCableLossDb;
    const receivedSignalPower = eirp - pathLoss - environmentLoss + rxAntennaGainDbi - rxCableLossDb;

    // Calculate noise floor
    const noiseFloor = calculateNoiseFloor(bandwidthMHz, temperatureC, noiseFigureDb);

    // Calculate SNR
    const snr = calculateSNR(receivedSignalPower, noiseFloor);

    // Determine receiver sensitivity based on MCS
    const mcs = determineOptimalMCS(snr - 3);  // 3dB safety margin
    const sensitivity = mcs <= 3 ? -90 : mcs <= 7 ? -80 : -70;  // Simplified model

    // Calculate link margin
    const linkMargin = receivedSignalPower - sensitivity;

    // Determine link status
    let linkStatus: SignalQuality;
    if (linkMargin > 20) {
        linkStatus = SignalQuality.Excellent;
    } else if (linkMargin > 15) {
        linkStatus = SignalQuality.Good;
    } else if (linkMargin > 10) {
        linkStatus = SignalQuality.Fair;
    } else if (linkMargin > 5) {
        linkStatus = SignalQuality.Poor;
    } else {
        linkStatus = SignalQuality.Critical;
    }

    return {
        txPower: txPowerDbm,
        txAntennaGain: txAntennaGainDbi,
        rxAntennaGain: rxAntennaGainDbi,
        cableLossTx: txCableLossDb,
        cableLossRx: rxCableLossDb,
        pathLoss: pathLoss,
        fadingMargin: fadingMargin,
        receivedSignalPower: receivedSignalPower,
        noiseFigure: noiseFigureDb,
        noiseFloor: noiseFloor,
        snr: snr,
        sensitivity: sensitivity,
        linkMargin: linkMargin,
        linkStatus: linkStatus
    };
}

/**
 * Generate a comprehensiveMesh Rider analysis report
 * @param linkBudget - Link budget analysis results
 * @param distance - Distance in kilometers
 * @param frequency - Frequency in GHz
 * @param bandwidth - Bandwidth in MHz
 * @returns Detailed analysis report with recommendations
 */
export function generateRfAnalysisReport(
    linkBudget: RfLinkBudget,
    distance: number,
    frequency: number,
    bandwidth: number
): string {
    const { snr, linkMargin, linkStatus, receivedSignalPower } = linkBudget;

    // Determine MCS based on SNR
    const mcs = determineOptimalMCS(snr - 3);  // 3dB safety margin

    // Estimate throughput
    const throughput = estimateThroughput(mcs, bandwidth, 2, 0);

    // Format report
    let report = `# RF Link Analysis Report\n\n`;
    report += `## Link Summary\n`;
    report += `- Distance: ${distance.toFixed(2)} km\n`;
    report += `- Frequency: ${frequency.toFixed(2)} GHz\n`;
    report += `- Channel Bandwidth: ${bandwidth} MHz\n`;
    report += `- Link Status: ${linkStatus}\n`;
    report += `- Received Signal Power: ${receivedSignalPower.toFixed(2)} dBm\n`;
    report += `- Signal-to-Noise Ratio: ${snr.toFixed(2)} dB\n`;
    report += `- Link Margin: ${linkMargin.toFixed(2)} dB\n`;
    report += `- Optimal MCS: ${mcs}\n`;
    report += `- Estimated Throughput: ${throughput.toFixed(2)} Mbps\n\n`;

    report += `## Recommendations\n`;

    if (linkStatus === SignalQuality.Critical) {
        report += `- ⚠️ **Critical Link Condition**: Link is unreliable and requires immediate attention.\n`;
        if (linkMargin < 0) {
            report += `- ⚠️ **Negative Link Margin**: Signal level is below receiver sensitivity.\n`;
        }
        report += `- Consider adding higher gain antennas (+${Math.ceil(Math.abs(linkMargin) + 5)} dBi improvement needed).\n`;
        report += `- Reduce obstacles in the path if possible.\n`;
        report += `- Consider decreasing distance between nodes or adding intermediate relay nodes.\n`;
    } else if (linkStatus === SignalQuality.Poor) {
        report += `- ⚠️ **Poor Link Condition**: Link may experience intermittent issues during adverse weather.\n`;
        report += `- Consider increasing antenna gain by at least ${Math.ceil(10 - linkMargin)} dBi.\n`;
        report += `- Ensure proper Fresnel zone clearance.\n`;
        report += `- Consider using lower MCS (${Math.max(0, mcs - 2)}) for more reliable connection.\n`;
    } else if (linkStatus === SignalQuality.Fair) {
        report += `- Link should be stable in fair weather conditions.\n`;
        report += `- Consider implementing adaptive MCS to optimize for changing conditions.\n`;
        if (frequency > 5) {
            report += `- Monitor performance during rain events; consider fallback to lower frequency band if available.\n`;
        }
    } else if (linkStatus === SignalQuality.Good || linkStatus === SignalQuality.Excellent) {
        report += `- Link has good margin and should be reliable in most conditions.\n`;
        if (mcs < 7) {
            report += `- MCS can potentially be increased to ${Math.min(15, mcs + 2)} for higher throughput.\n`;
        }
        if (bandwidth < 20) {
            report += `- Consider increasing channel bandwidth to ${Math.min(20, bandwidth * 2)} MHz for higher throughput.\n`;
        }
    }

    return report;
}