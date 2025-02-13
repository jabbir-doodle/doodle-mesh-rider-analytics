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
  localtime: any;
  localtime: any;
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
