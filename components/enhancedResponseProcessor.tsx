import type { Message,ProductModel } from '@/types';

export function enhanceSystemPrompt(basePrompt: string, toolType: string): string {
    let enhancedPrompt = basePrompt;

    if (toolType === 'range') {
        enhancedPrompt += '\nYou are using the Range Calculator tool. Provide precise calculations for signal propagation distance based on frequency, power, and environmental factors.';
    } else if (toolType === 'throughput') {
        enhancedPrompt += '\nYou are using the Throughput Calculator tool. Calculate expected data rates at different distances considering bandwidth, modulation, and link quality.';
    } else if (toolType === 'coverage') {
        enhancedPrompt += '\nYou are using the Coverage Mapper tool. Analyze expected network coverage based on terrain, obstacles, and radio configurations.';
    } else if (toolType === 'logviewer') {
        enhancedPrompt += '\nYou are using the Log Analyzer tool. Identify patterns, anomalies, and optimizations from wireless mesh network logs.';
    }

    enhancedPrompt += '\nProvide technically precise answers with specific metrics where appropriate. Include numeric values for signal strength, throughput, and range estimates.';

    return enhancedPrompt;
}

export function enhanceAIResponse(content: string, query: string, tool: string): Message {
    let charts: any[] = [];
    let products: string[] = [];

    if (tool === 'throughput' || query.toLowerCase().includes('throughput') ||
        query.toLowerCase().includes('speed') || query.toLowerCase().includes('bandwidth')) {
        charts = generateThroughputData(query);
    }

    if (tool === 'range' || query.toLowerCase().includes('range') ||
        query.toLowerCase().includes('distance') || query.toLowerCase().includes('coverage')) {
        charts = generateRangeData(query);
    }

    if (query.toLowerCase().includes('product') || query.toLowerCase().includes('radio') ||
        query.toLowerCase().includes('model') || query.toLowerCase().includes('recommend')) {
        const productMatches = content.match(/RM-\d+[-\w]*/g);
        if (productMatches) {
            products = [...new Set(productMatches)].slice(0, 2);
        }
    }

    return {
        role: 'assistant',
        content: content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        products: products,
        charts: charts
    };
}

function generateThroughputData(query: string): any[] {
    const distance = query.match(/(\d+(?:\.\d+)?)\s*(?:km|kilometer)/i);
    const distanceValue = distance ? parseFloat(distance[1]) : 2;

    const frequency = query.match(/(\d+)\s*(?:mhz|ghz)/i);
    const freqValue = frequency ? parseInt(frequency[1]) : 5800;

    const data = [];
    const maxDistance = Math.min(10, distanceValue * 2);

    for (let d = 0.5; d <= maxDistance; d += 0.5) {
        const snr = Math.max(5, 40 - (d * 5 * (freqValue > 3000 ? 1.5 : 1)));
        const throughput = Math.max(1, 100 * Math.exp(-d / (freqValue > 3000 ? 2 : 3)));

        data.push({
            distance: d,
            throughput: Math.round(throughput * 10) / 10,
            snr: Math.round(snr * 10) / 10,
            fresnelClearance: Math.round(17.3 * Math.sqrt((d * 0.299) / (4 * freqValue * 0.001)) * 100) / 100
        });
    }

    return data;
}

function generateRangeData(query: string): any[] {
    const frequency = query.match(/(\d+)\s*(?:mhz|ghz)/i);
    const freqValue = frequency ? parseInt(frequency[1]) : 5800;

    const isUrban = query.toLowerCase().includes('urban') || query.toLowerCase().includes('city');
    const isRainy = query.toLowerCase().includes('rain') || query.toLowerCase().includes('wet');

    const data = [];

    const maxRangeKm = freqValue > 3000 ?
        (isUrban ? 2 : 5) :
        (isUrban ? 5 : 10);

    for (let d = 0.5; d <= maxRangeKm; d += 0.5) {
        const rxPower = -50 - (20 * Math.log10(d) * (freqValue > 3000 ? 1.2 : 1));
        const noiseFloor = -90;

        data.push({
            distance: d,
            rxPower: Math.round(rxPower * 10) / 10,
            snr: Math.round((rxPower - noiseFloor) * 10) / 10,
            linkQuality: rxPower > -65 ? "Excellent" : rxPower > -75 ? "Good" : rxPower > -85 ? "Fair" : "Poor"
        });
    }

    return data;
}