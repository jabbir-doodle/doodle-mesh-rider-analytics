// types.ts
import { LucideIcon } from 'lucide-react';

export interface StationStat {
  mac: string;
  inactive: number;
  rssi: number;
  rssi_ant: number[];
  pl_ratio: number;
  tx_bytes: number;
  tx_retries: number;
  tx_failed: number;
  mcs: number;
}

export interface MeshStat {
  orig_address: string;
  tq: number;
  hop_status: string;
  last_seen_msecs: number;
}

export interface LinkStateData {
  localtime: number;
  timestamp: number;
  noise: number;
  activity: number;
  cpuLoad: number;
  cpuLoad5m: number;
  cpuLoad15m: number;
  memory: number;
  channel: number;
  frequency: number;
  channelWidth: string;
  lnaStatus: string;
  stations: StationStat[];
  meshNodes: MeshStat[];
  inactive?: number;
}

export interface MetricCardProps {
  title: string;
  value: number;
  unit?: string;
  icon: LucideIcon; // Changed from string to LucideIcon
  status?: 'normal' | 'warning' | 'critical';
  onClick?: () => void; // Added onClick prop
}

export interface ChartData {
  timestamp: number;
  value: number;
  type: string;
}
export interface ChartData {
  timestamp: number;
  noise: number;
  activity: number;
  cpuLoad: number;
  cpuLoad5m: number;
  cpuLoad15m: number;
  memory: number;
}

export interface RadioModel {
  name: string;
  power: number[];
  sensitivity: number[];
  maxTxPower: number;
  frequencies: number[];
}

export interface RadioModels {
  [key: string]: RadioModel;
}

export interface RangeEstimation {
  mcs: number;
  range: number;
  throughput: number;
  modulation: string;
  codingRate: number;
  status: string;
  fresnelStatus: string;
}

export interface ChartDataPoint {
  distance: number;
  throughput: number;
  fresnelClearance: number;
  modulation: string;
  codingRate: number;
  mcs: number;
}

export interface CalculationConstants {
  udp: number;
  ipv4: number;
  eth2: number;
  batAdv: number;
  llc: number;
  ieee80211: number;
  phy: number;
  aifs: number;
  cwSize: number;
  baSize: number;
  phyHeader11n: number;
  ltf: number;
  sifs: number;
  mpduDelimiter: number;
  txop: number;
  psr: number;
  fresnelClearancePercent: number;
  basicRate: number;
}

export interface RFParameters {
  power: number[];
  sensitivity: number[];
  modulation: string[];
  codingRate: number[];
  bitsPerSymbol: number[];
}
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
export interface CalculationResults {
  chartData: ChartDataPoint[];
  rangeEstFinal: number;
  finalMcsRate: number;
  finalAGL: number;
  rangeEstMax: number;
  maxMcsRate: number;
  maxAGL: number;
  totalThroughput: number;
  rangeEstList: RangeEstimation[];
  model: string;
}

export interface RangeCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  products?: string[];
  productRecommendations?: string[];
  charts?: any[];
}