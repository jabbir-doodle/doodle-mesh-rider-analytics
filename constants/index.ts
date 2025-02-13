// constants/index.ts

export const SYSTEM_INFO = {
  name: 'Doodle Labs',
  version: 'firmware-2024-10.0',
  buildId: 'r11306-c4a6851c72',
  board: 'ar71xx/generic',
  arch: 'mips_24kc',
  device: 'SmartRadio',
  manufacturer: 'Doodle Labs',
} as const;

export const INTERFACE_INFO = {
  name: 'wlan0',
  ifindex: 9,
  address: '00:30:1a:50:61:8a',
  type: 'mesh point',
  channel: '9 (2452 MHz)',
  width: '26 MHz',
  txpower: '30.00 dBm',
  txStats: {
    flows: 4192,
    drops: 0,
    marks: 0,
    txBytes: 370236,
    txPackets: 4192,
  },
} as const;

export const CHART_CONFIG = {
  noise: {
    domain: [-90, -50],
    color: '#3B82F6',
    label: 'Noise Floor (dBm)',
  },
  activity: {
    domain: [0, 100],
    color: '#10B981',
    label: 'Activity (%)',
  },
  cpu: {
    domain: [0, 100],
    colors: {
      load1m: '#8B5CF6',
      load5m: '#EC4899',
      load15m: '#F59E0B',
    },
    label: 'CPU Load (%)',
  },
} as const;

export const METRIC_THRESHOLDS = {
  noise: {
    warning: -75,
    critical: -65,
  },
  activity: {
    warning: 70,
    critical: 85,
  },
  cpu: {
    warning: 80,
    critical: 90,
  },
  temperature: {
    warning: 50,
    critical: 60,
  },
} as const;
