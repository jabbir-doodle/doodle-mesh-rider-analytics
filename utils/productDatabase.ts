export interface ProductModel {
    id: string;
    name: string;
    frequencyBand: string;
    formFactor: FormFactor;
    description: string;
    specifications: ProductSpecifications;
    features: string[];
    applications: string[];
}

export interface FormFactor {
    type: 'OEM' | 'Mini-OEM' | 'Wearable';
    dimensions: string;
    weight: string;
    interfaces: string[];
    antennaConnectors: string;
    batteryOption: boolean;
    ingressProtection?: string;
}

export interface ProductSpecifications {
    frequencyRange: string;
    bandwidth: string[];
    mimoConfig: string;
    maxThroughput: string;
    maxTxPower: string;
    rxSensitivity: string;
    operatingTemp: string;
    powerConsumption: {
        tx: string;
        rx: string;
        standby: string;
    };
    maxRange: string;
    encryption: string[];
    certifications: string[];
}

export const productModels: ProductModel[] = [
    {
        id: 'RM-2450-12M3',
        name: 'mini‑OEM Mesh Rider Radio - 2400~2482 MHz (Wi‑Fi band)',
        frequencyBand: '2400-2482 MHz (Wi‑Fi band)',
        formFactor: {
            type: 'Mini-OEM',
            dimensions: '40mm x 60mm x 10mm',
            weight: '50 grams',
            interfaces: ['Ethernet', 'USB', 'UART'],
            antennaConnectors: '2x MMCX-Female Connector',
            batteryOption: false
        },
        description:
            'A compact mini‑OEM radio operating in the Wi‑Fi band, delivering high throughput and long‑range performance via Mesh Rider technology.',
        specifications: {
            frequencyRange: '2400-2482 MHz',
            bandwidth: ['3 MHz', '5 MHz', '10 MHz', '20 MHz'],
            mimoConfig: '2x2 MIMO',
            maxThroughput: '80 Mbps (20 MHz Channel)',
            maxTxPower: '1.6W (32 dBm)',
            rxSensitivity: '-93 dBm',
            operatingTemp: 'Industrial: -40°C to +85°C',
            powerConsumption: {
                tx: '12W Peak',
                rx: '5W',
                standby: '2W'
            },
            maxRange: '>100km (field tested)',
            encryption: ['128-bit AES', '256-bit AES', 'FIPS 140-3 Certified'],
            certifications: ['FCC', 'CE', 'IC']
        },
        features: [
            'Long range and high throughput',
            'Interference resistant COFDM',
            'Adaptive modulation from BPSK to 64QAM'
        ],
        applications: ['Unmanned systems', 'Tactical communications', 'Industrial IoT']
    },
    {
        id: 'RM-5600-12W3',
        name: 'Wearable Mesh Rider Radio – 5150~5895 MHz (5‑GHz + UNII band)',
        frequencyBand: '5150-5895 MHz (5‑GHz UNII bands)',
        formFactor: {
            type: 'Wearable',
            dimensions: '134.3mm x 63.0mm x 17.0mm',
            weight: '203 grams, 467 grams with battery',
            interfaces: ['USB-Device (Ethernet only)'],
            antennaConnectors: '2x TNC-Female Connector',
            batteryOption: true,
            ingressProtection: 'IP67'
        },
        description:
            'A wearable radio for tactical teams offering low latency, high throughput connectivity in the 5‑GHz band.',
        specifications: {
            frequencyRange: '5150-5895 MHz',
            bandwidth: ['3 MHz', '5 MHz', '10 MHz', '20 MHz'],
            mimoConfig: '2x2 MIMO',
            maxThroughput: '80 Mbps (20 MHz Channel)',
            maxTxPower: '1.6W (32 dBm)',
            rxSensitivity: '-93 dBm',
            operatingTemp: 'Industrial: -30°C to +70°C',
            powerConsumption: {
                tx: '12W Peak',
                rx: '5W',
                standby: '2W'
            },
            maxRange: '>1km (typical), >100km with external antennas',
            encryption: ['128-bit AES', '256-bit AES', 'FIPS 140-3 Certified'],
            certifications: ['FCC', 'CE', 'IC']
        },
        features: [
            'Portable wearable design',
            'Integrated battery and GPS option',
            'Optimized for low latency and secure communications'
        ],
        applications: ['Tactical communications', 'Field operations', 'First responder networks']
    },
    {
        id: 'RM-1700-22O3',
        name: 'OEM Mesh Rider Radio – 915 MHz and 2450 MHz (ISM bands)',
        frequencyBand: '902-928 MHz and 2400-2482 MHz',
        formFactor: {
            type: 'OEM',
            dimensions: '57mm x 86mm x 13mm',
            weight: '86 grams',
            interfaces: ['Ethernet', 'USB-Device', 'UART', 'USB-Host'],
            antennaConnectors: '2x MMCX-Female Connector',
            batteryOption: false
        },
        description:
            'An OEM radio providing dual‑band ISM operation for global deployments with robust error correction.',
        specifications: {
            frequencyRange: '902-928 MHz and 2400-2482 MHz',
            bandwidth: ['3 MHz', '5 MHz', '10 MHz', '20 MHz'],
            mimoConfig: '2x2 MIMO',
            maxThroughput: '80 Mbps (20 MHz Channel)',
            maxTxPower: '1.6W (32 dBm)',
            rxSensitivity: '-93 dBm',
            operatingTemp: 'Industrial: -30°C to +70°C',
            powerConsumption: {
                tx: '14W (915 MHz), 12W (2450 MHz)',
                rx: '5W',
                standby: '2W'
            },
            maxRange: '>100km (field tested)',
            encryption: ['128-bit AES', '256-bit AES', 'FIPS 140-3 Certified'],
            certifications: ['FCC', 'CE', 'IC']
        },
        features: [
            'Dual‑band global ISM operation',
            'High throughput with robust link quality',
            'Designed for embedding in rugged systems'
        ],
        applications: ['Global industrial deployments', 'Unmanned systems', 'Tactical communications']
    },
    {
        id: 'RM-1700-22W3',
        name: 'Wearable Mesh Rider Radio – 915 MHz and 2450 MHz (ISM bands)',
        frequencyBand: '902-928 MHz and 2400-2482 MHz',
        formFactor: {
            type: 'Wearable',
            dimensions: '134.3mm x 63.0mm x 17.0mm',
            weight: '203 grams, 467 grams with battery',
            interfaces: ['USB-Device (Ethernet only)'],
            antennaConnectors: '2x TNC-Female Connector',
            batteryOption: true,
            ingressProtection: 'IP67'
        },
        description:
            'A wearable dual‑band radio for ISM applications, optimized for secure, low latency mobile operations.',
        specifications: {
            frequencyRange: '902-928 MHz and 2400-2482 MHz',
            bandwidth: ['3 MHz', '5 MHz', '10 MHz', '20 MHz'],
            mimoConfig: '2x2 MIMO',
            maxThroughput: '80 Mbps (20 MHz Channel)',
            maxTxPower: '1.6W (32 dBm)',
            rxSensitivity: '-93 dBm',
            operatingTemp: 'Industrial: -30°C to +70°C',
            powerConsumption: {
                tx: '14W (915 MHz), 12W (2450 MHz)',
                rx: '5W',
                standby: '2W'
            },
            maxRange: '>1km (typical), >100km with external antennas',
            encryption: ['128-bit AES', '256-bit AES', 'FIPS 140-3 Certified'],
            certifications: ['FCC', 'CE', 'IC']
        },
        features: [
            'Portable design with battery option',
            'Secure encryption and low latency performance',
            'Optimized for tactical command and control'
        ],
        applications: ['Field communications', 'Mobile command centers', 'Tactical operations']
    },
    {
        id: 'RM-1700-22M3',
        name: 'mini‑OEM Dual‑Band Mesh Rider Radio – 915 MHz and 2450 MHz (ISM bands)',
        frequencyBand: '902-928 MHz and 2400-2482 MHz',
        formFactor: {
            type: 'Mini-OEM',
            dimensions: '57mm x 86mm x 13mm',
            weight: '86 grams',
            interfaces: ['Ethernet', 'USB-Device', 'UART', 'USB-Host'],
            antennaConnectors: '2x MMCX-Female Connector',
            batteryOption: false
        },
        description:
            'A compact mini‑OEM dual‑band radio that offers the versatility of both 915 MHz and 2450 MHz operation in a small form factor.',
        specifications: {
            frequencyRange: '902-928 MHz and 2400-2482 MHz',
            bandwidth: ['3 MHz', '5 MHz', '10 MHz', '20 MHz'],
            mimoConfig: '2x2 MIMO',
            maxThroughput: '80 Mbps (20 MHz Channel)',
            maxTxPower: '1.6W (32 dBm)',
            rxSensitivity: '-93 dBm',
            operatingTemp: 'Industrial: -30°C to +70°C',
            powerConsumption: {
                tx: '12W Peak',
                rx: '5W',
                standby: '2W'
            },
            maxRange: '>100km (field tested)',
            encryption: ['128-bit AES', '256-bit AES', 'FIPS 140-3 Certified'],
            certifications: ['FCC', 'CE', 'IC']
        },
        features: [
            'Dual‑band support in a compact design',
            'High throughput and robust error correction',
            'Ideal for industrial wireless networks'
        ],
        applications: ['Industrial networks', 'Mobile command centers', 'Tactical communications']
    },
    {
        id: 'RM-5600-12O3',
        name: 'OEM Mesh Rider Radio – 5150~5895 MHz (5‑GHz + UNII band)',
        frequencyBand: '5150-5895 MHz (5‑GHz UNII bands)',
        formFactor: {
            type: 'OEM',
            dimensions: '57mm x 86mm x 13mm',
            weight: '86 grams',
            interfaces: ['Ethernet', 'USB-Device', 'UART', 'USB-Host'],
            antennaConnectors: '2x MMCX-Female Connector',
            batteryOption: false
        },
        description:
            'An OEM radio for the 5‑GHz band designed for embedding in external chassis with robust RF performance.',
        specifications: {
            frequencyRange: '5150-5895 MHz',
            bandwidth: ['3 MHz', '5 MHz', '10 MHz', '20 MHz'],
            mimoConfig: '2x2 MIMO',
            maxThroughput: '80 Mbps (20 MHz Channel)',
            maxTxPower: '1.6W (32 dBm)',
            rxSensitivity: '-93 dBm',
            operatingTemp: 'Industrial: -30°C to +70°C',
            powerConsumption: {
                tx: '12W Peak',
                rx: '5W',
                standby: '2W'
            },
            maxRange: '>100km (field tested)',
            encryption: ['128-bit AES', '256-bit AES', 'FIPS 140-3 Certified'],
            certifications: ['FCC', 'CE', 'IC']
        },
        features: [
            'High throughput and long-range performance',
            'Optimized for embedding in rugged systems',
            'Interference mitigation and robust RF design'
        ],
        applications: ['Embedded systems', 'Industrial networks', 'Global wireless deployments']
    }
]

export function getProductById(id: string): ProductModel | undefined {
    return productModels.find(p => p.id === id)
}
