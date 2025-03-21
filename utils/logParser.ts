import type { LinkStateData } from '../types';

export function parseLogFile(content: string): LinkStateData[] {
  const cleanedContent = content
    .replace(/^\uFEFF/, '')
    .replace(/\u0000/g, '')
    .replace(/\uFFFD/g, '');

  const lines = cleanedContent.split('\n').filter(line => line.trim());
  const results: LinkStateData[] = [];

  for (let i = 0; i < lines.length; i++) {
    try {
      const line = lines[i].trim();
      if (!line.startsWith('{') || !line.endsWith('}')) continue;

      const parsed = JSON.parse(line);
      if (!parsed.linkstate || !parsed.linkstate.sysinfo) continue;

      const data = parsed.linkstate;
      results.push({
        localtime: data.sysinfo.localtime,
        timestamp: data.sysinfo.localtime,  // <-- Timestamp stored in seconds
        noise: Math.round(parseFloat(data.noise)),
        activity: typeof data.activity === 'number' ? Math.round(data.activity) : 0,
        cpuLoad: Math.round((data.sysinfo.cpu_load[0] / 65535) * 100),
        cpuLoad5m: Math.round((data.sysinfo.cpu_load[1] / 65535) * 100),
        cpuLoad15m: Math.round((data.sysinfo.cpu_load[2] / 65535) * 100),
        memory: Math.round(data.sysinfo.freemem / (1024 * 1024)),
        channel: data.oper_chan,
        frequency: data.oper_freq,
        channelWidth: data.chan_width,
        lnaStatus: data.lna_status,
        stations: data.sta_stats || [],
        meshNodes: data.mesh_stats || [],
      });
    } catch (error) {
      console.warn(`Skipping invalid log entry at line ${i + 1}`);
    }
  }

  return results;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export function calculateLinkQuality(rssi: number, plRatio: number): 'good' | 'fair' | 'poor' {
  if (rssi > -65 && plRatio < 1) return 'good';
  if (rssi > -75 && plRatio < 2) return 'fair';
  return 'poor';
}

export interface MeshStat {
  orig_address: string;
  tq: number;
  hop_status: string;
  last_seen_msecs: number;
}

export function formatTimestamp(timestamp: number): string {
  if (!timestamp || isNaN(timestamp)) return 'Unknown';
  const date = new Date(timestamp * 1000);
  if (date.getFullYear() < 2000 || date.getFullYear() > 2100) return 'Invalid date';

  return date.toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

export function formatChartTimestamp(timestamp: number): string {
  if (!timestamp || isNaN(timestamp)) return '';
  const date = new Date(timestamp * 1000);
  if (date.getFullYear() < 2000 || date.getFullYear() > 2100) return '';

  return date.toLocaleString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

export function isValidLogFormat(content: string): boolean {
  try {
    const cleanedContent = content.replace(/^\uFEFF/, '').replace(/\u0000/g, '');
    const lines = cleanedContent.split('\n').filter(line => line.trim());
    const linesToCheck = Math.min(lines.length, 5);
    let validLines = 0;

    for (let i = 0; i < linesToCheck; i++) {
      const line = lines[i].trim();
      if (line.startsWith('{') && line.endsWith('}')) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.linkstate) validLines++;
        } catch { }
      }
    }

    return validLines > 0;
  } catch {
    return false;
  }
}

export function getLogFormatError(): string {
  return "The log file format is not compatible with the analyzer. Ensure you're using the correct log file from your Mesh Rider device.";
}