// // utils/dataProcessing.ts

// import type { LinkStateData, ChartData } from '../types';
// import { METRIC_THRESHOLDS } from '../constants';

// export const parseLogData = (logContent: string): ChartData[] => {
//   try {
//     return logContent
//       .split('\n')
//       .filter((line) => line.trim())
//       .map((line) => {
//         const data = JSON.parse(line).linkstate;
//         return {
//           timestamp: data.sysinfo.localtime * 1000,
//           noise: parseFloat(data.noise),
//           activity: data.activity,
//           cpuLoad: (data.sysinfo.cpu_load[0] / 65535) * 100,
//           cpuLoad5m: (data.sysinfo.cpu_load[1] / 65535) * 100,
//           cpuLoad15m: (data.sysinfo.cpu_load[2] / 65535) * 100,
//           memory: data.sysinfo.freemem / (1024 * 1024),
//         };
//       });
//   } catch (error) {
//     console.error('Error parsing log data:', error);
//     return [];
//   }
// };

// export const calculateMetricStatus = (
//   value: number,
//   type: keyof typeof METRIC_THRESHOLDS
// ): 'normal' | 'warning' | 'critical' => {
//   const thresholds = METRIC_THRESHOLDS[type];

//   if (value >= thresholds.critical) return 'critical';
//   if (value >= thresholds.warning) return 'warning';
//   return 'normal';
// };

// export const formatBytes = (bytes: number): string => {
//   if (bytes === 0) return '0 B';
//   const k = 1024;
//   const sizes = ['B', 'KB', 'MB', 'GB'];
//   const i = Math.floor(Math.log(bytes) / Math.log(k));
//   return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
// };

// export const calculateAverages = (
//   data: ChartData[]
// ): {
//   avgNoise: number;
//   avgActivity: number;
//   avgCpuLoad: number;
// } => {
//   const sum = data.reduce(
//     (acc, curr) => ({
//       noise: acc.noise + curr.noise,
//       activity: acc.activity + curr.activity,
//       cpuLoad: acc.cpuLoad + curr.cpuLoad,
//     }),
//     { noise: 0, activity: 0, cpuLoad: 0 }
//   );

//   const count = data.length;
//   return {
//     avgNoise: sum.noise / count,
//     avgActivity: sum.activity / count,
//     avgCpuLoad: sum.cpuLoad / count,
//   };
// };
