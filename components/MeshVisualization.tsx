'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, Signal } from 'lucide-react';

export interface MeshStat {
  orig_address: string;
  tq: number;
  hop_status: 'direct' | 'hop';
  last_seen_msecs?: number;
}

interface Props {
  meshStats?: MeshStat[];
  onNodeClick?: (address: string) => void;
}

const GridBackground = () => (
  <svg className="absolute inset-0 w-full h-full opacity-[0.03]">
    <defs>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#grid)" />
  </svg>
);

interface ConnectionBeamProps {
  start: { x: number; y: number };
  end: { x: number; y: number };
  quality: number;
  type: 'direct' | 'hop';
}

const ConnectionBeam: React.FC<ConnectionBeamProps> = ({ start, end, quality, type }) => {
  const pathD = `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  const color = type === 'direct' ? '#4ADE80' : '#FBBF24';

  return (
    <g>
      <path
        d={pathD}
        stroke={color}
        strokeWidth="2"
        fill="none"
        className="opacity-60"
      />
      <circle r="2" fill="white" opacity="0.8">
        <animateMotion
          dur="1.5s"
          repeatCount="indefinite"
          path={pathD}
        />
      </circle>
    </g>
  );
};

const MeshVisualization: React.FC<Props> = ({
  meshStats = [],
  onNodeClick = () => { }
}) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [showInitialHint, setShowInitialHint] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowInitialHint(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const center = { x: 400, y: 300 };
  const uniqueNodes = Array.from(new Set(meshStats.map((s) => s.orig_address)));
  const nodeRingRadius = 200;

  const getNodePosition = (index: number, total: number) => {
    const angle = (2 * Math.PI * index) / total - Math.PI / 2;
    return {
      x: center.x + nodeRingRadius * Math.cos(angle),
      y: center.y + nodeRingRadius * Math.sin(angle)
    };
  };

  const getQualityInfo = (tq: number) => {
    const quality = (tq / 255) * 100;
    if (quality >= 75) return { color: '#4ADE80', status: 'Excellent', textColor: '#22C55E' };
    if (quality >= 50) return { color: '#FBBF24', status: 'Good', textColor: '#EAB308' };
    if (quality >= 25) return { color: '#FB923C', status: 'Fair', textColor: '#F97316' };
    return { color: '#EF4444', status: 'Poor', textColor: '#DC2626' };
  };

  return (
    <div className="bg-[#0F172A] rounded-xl p-4 relative overflow-hidden">
      <GridBackground />

      <div className="relative z-10">
        <div className="flex justify-between items-center mb-4 px-2">
          <div className="flex items-center gap-2">
            <Network className="h-5 w-5 text-blue-500" />
            <div>
              <h2 className="text-lg font-semibold text-white">Network Topology</h2>
              <p className="text-sm text-gray-400">Click on any node to view detailed network statistics</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#4ADE80]"></div>
              <span className="text-sm text-gray-300">Direct Connection</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#FBBF24]"></div>
              <span className="text-sm text-gray-300">Hopped Connection</span>
            </div>
          </div>
        </div>

        {showInitialHint && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-4 right-4 bg-blue-600/90 text-white px-4 py-2 rounded-lg shadow-lg z-20 flex items-center gap-2"
          >
            <Signal className="h-4 w-4" />
            <span>Click nodes to view details</span>
          </motion.div>
        )}

        <div className="relative bg-[#1E293B]/90 backdrop-blur rounded-xl p-4">
          <svg width="800" height="600" className="mx-auto">
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <radialGradient id="nodeGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="white" stopOpacity="0.2" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </radialGradient>
            </defs>

            {meshStats.map((stat, i) => {
              const sourcePos = getNodePosition(
                uniqueNodes.indexOf(stat.orig_address),
                uniqueNodes.length
              );
              const quality = (stat.tq / 255) * 100;

              return (
                <ConnectionBeam
                  key={`beam-${i}`}
                  start={sourcePos}
                  end={center}
                  quality={quality}
                  type={stat.hop_status}
                />
              );
            })}

            {uniqueNodes.map((address, i) => {
              const pos = getNodePosition(i, uniqueNodes.length);
              const nodeStats = meshStats.filter((s) => s.orig_address === address);
              const bestQuality = Math.max(...nodeStats.map((s) => s.tq));
              const qualityInfo = getQualityInfo(bestQuality);

              return (
                <g
                  key={`node-${address}`}
                  onMouseEnter={() => setHoveredNode(address)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => onNodeClick(address)}
                  className="cursor-pointer transition-transform hover:scale-110"
                >
                  {hoveredNode === address && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r="30"
                      fill="url(#nodeGradient)"
                      className="animate-pulse"
                    />
                  )}

                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="12"
                    fill={qualityInfo.color}
                    filter="url(#glow)"
                    className="transition-all duration-300"
                  />

                  <text
                    x={pos.x}
                    y={pos.y + 25}
                    textAnchor="middle"
                    fill="#94A3B8"
                    fontSize="12"
                    className="pointer-events-none"
                  >
                    {address.slice(-4)}
                  </text>

                  <AnimatePresence>
                    {hoveredNode === address && (
                      <motion.g
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        <rect
                          x={pos.x - 80}
                          y={pos.y - 80}
                          width="160"
                          height="70"
                          fill="#1E293B"
                          rx="8"
                          className="filter drop-shadow-lg"
                        />
                        <text
                          x={pos.x - 70}
                          y={pos.y - 55}
                          fill="#fff"
                          fontSize="11"
                        >
                          {address}
                        </text>
                        <text
                          x={pos.x - 70}
                          y={pos.y - 35}
                          fill={qualityInfo.textColor}
                          fontSize="11"
                          className="font-medium"
                        >
                          Quality: {Math.round((bestQuality / 255) * 100)}% ({qualityInfo.status})
                        </text>
                        <text
                          x={pos.x - 70}
                          y={pos.y - 20}
                          fill="#94A3B8"
                          fontSize="11"
                        >
                          Click to view details
                        </text>
                      </motion.g>
                    )}
                  </AnimatePresence>
                </g>
              );
            })}
          </svg>

          <div className="absolute top-4 right-4 bg-[#1E293B]/90 backdrop-blur p-4 rounded-lg">
            <div className="text-sm text-gray-300 font-medium mb-2">Link Quality</div>
            <div className="space-y-2">
              {[
                { color: '#4ADE80', label: 'Excellent (75-100%)' },
                { color: '#FBBF24', label: 'Good (50-75%)' },
                { color: '#FB923C', label: 'Fair (25-50%)' },
                { color: '#EF4444', label: 'Poor (0-25%)' }
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs text-gray-400">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeshVisualization;