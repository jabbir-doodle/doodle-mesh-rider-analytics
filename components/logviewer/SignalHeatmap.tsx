import React, { useState } from 'react';
import { MeshStat } from '@/utils/logParser';
import { formatMacAddress } from '@/utils/networkHelpers';
import { Radio, Clock, ArrowUpDown, Info, HelpCircle } from 'lucide-react';
import { formatTimestamp, formatRelativeTime } from '@/utils/timeFormatters';

interface SignalHeatmapProps {
  meshStats: Array<MeshStat & { timestamp?: number }>;
  timeRange?: number;
  onNodeClick: (address: string) => void;
}

const SignalHeatmap: React.FC<SignalHeatmapProps> = ({ meshStats, onNodeClick }) => {
  const [sortField, setSortField] = useState<string>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [infoTooltip, setInfoTooltip] = useState<string | null>(null);

  // Process data as before
  const uniqueNodes = [...new Set(meshStats.map(stat => stat.orig_address))];
  const latestNodeData = uniqueNodes
    .map(address => {
      const nodeStats = meshStats
        .filter(stat => stat.orig_address === address)
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      return nodeStats[0] || null;
    })
    .filter(Boolean);

  const sortedData = [...latestNodeData].sort((a, b) => {
    if (sortField === 'timestamp') {
      return sortDirection === 'asc'
        ? (a.timestamp || 0) - (b.timestamp || 0)
        : (b.timestamp || 0) - (a.timestamp || 0);
    } else if (sortField === 'tq') {
      return sortDirection === 'asc' ? a.tq - b.tq : b.tq - a.tq;
    } else if (sortField === 'last_seen') {
      return sortDirection === 'asc'
        ? a.last_seen_msecs - b.last_seen_msecs
        : b.last_seen_msecs - a.last_seen_msecs;
    }
    return 0;
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Helper to get link quality class
  const getLinkQualityClass = (tq: number) => {
    if (tq > 200) return "text-green-400";
    if (tq > 150) return "text-blue-400";
    if (tq > 100) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Radio className="h-5 w-5 text-blue-500" />
          <h2 className="text-lg font-semibold text-white">Mesh Link Status</h2>
        </div>

        <div
          onMouseEnter={() => setInfoTooltip('info')}
          onMouseLeave={() => setInfoTooltip(null)}
          className="bg-gray-800 px-2 py-1 rounded-md text-xs text-gray-400 hover:text-white cursor-help relative flex items-center"
        >
          <Info size={12} className="mr-1" />
          <span>About Connection Modes</span>

          {infoTooltip === 'info' && (
            <div className="absolute z-50 right-0 top-full mt-2 w-64 p-3 bg-gray-800 rounded-md border border-gray-600 shadow-xl text-xs">
              <p className="text-gray-300 mb-2">
                <strong>Connection modes</strong> automatically adjust to optimize network performance:
              </p>
              <div className="mb-1 flex items-center">
                <span className="w-12 text-indigo-300 font-medium">DIRECT:</span>
                <span className="text-gray-400">Point-to-point connections (fastest)</span>
              </div>
              <div className="flex items-center">
                <span className="w-12 text-indigo-300 font-medium">HOP:</span>
                <span className="text-gray-400">Routed through other nodes (more reliable)</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {sortedData.length === 0 ? (
        <div className="text-center p-6 bg-gray-800/50 rounded-lg">
          <p className="text-gray-400">No mesh link data available</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-300">
            <thead className="text-xs uppercase bg-gray-800 text-gray-400">
              <tr>
                <th className="px-4 py-3">MAC Address</th>
                <th className="px-4 py-3">Connection</th>
                <th className="px-4 py-3 cursor-pointer hover:text-white" onClick={() => handleSort('tq')}>
                  <div className="flex items-center gap-1">
                    Quality {sortField === 'tq' && <ArrowUpDown className="h-3 w-3" />}
                  </div>
                </th>
                <th className="px-4 py-3 cursor-pointer hover:text-white" onClick={() => handleSort('last_seen')}>
                  <div className="flex items-center gap-1">
                    Last Seen {sortField === 'last_seen' && <ArrowUpDown className="h-3 w-3" />}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map(node => {
                const qualityClass = getLinkQualityClass(node.tq);

                return (
                  <tr
                    key={node.orig_address}
                    className="border-b border-gray-700 hover:bg-gray-800/60 cursor-pointer transition-colors"
                    onClick={() => onNodeClick(node.orig_address)}
                  >
                    <td className="px-4 py-3 font-medium text-gray-100">
                      {formatMacAddress(node.orig_address)}
                    </td>
                    <td className="px-4 py-3">
                      <div
                        className="relative"
                        onMouseEnter={() => setInfoTooltip(`mode-${node.orig_address}`)}
                        onMouseLeave={() => setInfoTooltip(null)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-indigo-200/30 border border-indigo-900/50 text-indigo-300 text-xs">
                            {node.hop_status === 'direct' ? 'DIRECT' : 'HOP'}
                          </span>
                          <span className="text-xs text-green-400">✓</span>
                        </div>

                        {infoTooltip === `mode-${node.orig_address}` && (
                          <div className="absolute z-50 left-0 top-full mt-1 w-48 p-2 bg-gray-800 rounded-md border border-gray-600 shadow-lg text-xs">
                            <div className="text-gray-400">
                              {node.hop_status === 'direct'
                                ? 'Point-to-point connection (no intermediaries)'
                                : 'Routed through mesh (for better reliability)'}
                            </div>
                            <div className="text-green-400 mt-1 flex items-center">
                              <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1"></span>
                              Normal operation
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`font-mono ${qualityClass}`}>
                        {node.tq}/255
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-gray-500" />
                        <span>{formatRelativeTime(node.last_seen_msecs)}</span>
                        <span className="text-xs text-gray-500 ml-1">
                          at {node.timestamp ? formatTimestamp(node.timestamp, false) : 'N/A'}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-400">
        <div className="flex items-center">
          <span className="h-2 w-2 rounded-full bg-green-500 mr-1"></span>
          <span>Excellent (200+)</span>
        </div>
        <div className="flex items-center">
          <span className="h-2 w-2 rounded-full bg-blue-500 mr-1"></span>
          <span>Good (150-199)</span>
        </div>
        <div className="flex items-center">
          <span className="h-2 w-2 rounded-full bg-yellow-500 mr-1"></span>
          <span>Fair (100-149)</span>
        </div>
        <div className="flex items-center">
          <span className="h-2 w-2 rounded-full bg-red-500 mr-1"></span>
          <span>Poor (0-99)</span>
        </div>
      </div>
    </div>
  );
};

export default SignalHeatmap;