import type { LinkStateData } from '../types';

export function parseLogFile(content: string): LinkStateData[] {
  const lines = content.split('\n').filter((line) => line.trim());

  return lines.map((line) => {
    const data = JSON.parse(line).linkstate;
    return {
      localtime: data.sysinfo.localtime,
      timestamp: data.sysinfo.localtime * 1000,
      noise: parseFloat(data.noise),
      activity: data.activity,
      cpuLoad: (data.sysinfo.cpu_load[0] / 65535) * 100,
      cpuLoad5m: (data.sysinfo.cpu_load[1] / 65535) * 100,
      cpuLoad15m: (data.sysinfo.cpu_load[2] / 65535) * 100,
      memory: data.sysinfo.freemem / (1024 * 1024),
      channel: data.oper_chan,
      frequency: data.oper_freq,
      channelWidth: data.chan_width,
      lnaStatus: data.lna_status,
      stations: data.sta_stats,
      meshNodes: data.mesh_stats,
    };
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export function calculateLinkQuality(
  rssi: number,
  plRatio: number
): 'good' | 'fair' | 'poor' {
  if (rssi > -65 && plRatio < 1) return 'good';
  if (rssi > -75 && plRatio < 2) return 'fair';
  return 'poor';
}
// Define and export MeshStat
export interface MeshStat {
  orig_address: string;
  tq: number;
  hop_status: string;
  last_seen_msecs: number;
}
export function formatTimestamp(timestamp: number): string {
  // Ensure timestamp is in milliseconds
  const date = new Date(timestamp * 1000);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

export function formatChartTimestamp(timestamp: number): string {
  // Ensure timestamp is in milliseconds
  const date = new Date(timestamp * 1000);
  return date.toLocaleString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}
// Existing code...