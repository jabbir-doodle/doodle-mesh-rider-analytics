import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MeshStat } from '../utils/logParser';
import { Radio } from 'lucide-react';

interface Props {
  meshStats?: MeshStat[];
  onNodeClick: (address: string) => void;
}

const MeshVisualization: React.FC<Props> = ({ meshStats = [], onNodeClick }) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [showAnimation, setShowAnimation] = useState(true);

  const uniqueNodes = [...new Set(meshStats.map((s) => s.orig_address))];
  const directLinks = meshStats.filter((s) => s.hop_status === 'direct');
  const hopLinks = meshStats.filter((s) => s.hop_status === 'hop');

  const getNodePosition = (index: number, total: number) => {
    const angle = (2 * Math.PI * index) / total;
    const radius = 150;
    return {
      x: 200 + radius * Math.cos(angle),
      y: 200 + radius * Math.sin(angle),
    };
  };


  // Quality-based indicators – returns both a color and a status text.
  const getQualityInfo = (tq: number) => {
    const quality = (tq / 255) * 100;
    if (quality >= 75) return { color: '#22C55E', status: 'Excellent' };
    if (quality >= 50) return { color: '#EAB308', status: 'Good' };
    if (quality >= 25) return { color: '#F97316', status: 'Fair' };
    return { color: '#EF4444', status: 'Poor' };
  };

  return (
    <div className="bg-gray-900 p-6 rounded-lg shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-white">Mesh Network Topology</h3>
        </div>
        <button 
          onClick={() => setShowAnimation(!showAnimation)}
          className="px-3 py-1.5 bg-gray-800 rounded-md text-sm text-gray-300 hover:bg-gray-700"
        >
          {showAnimation ? 'Pause' : 'Start'} Animation
        </button>
      </div>

      <div className="relative">
        <svg width="400" height="400" className="mx-auto">
          <defs>
            {/* Glow effect */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Link patterns */}
            <pattern id="directPattern" patternUnits="userSpaceOnUse" width="4" height="4">
              <path d="M 0 0 L 4 0" stroke="#3B82F6" strokeWidth="2" />
            </pattern>
            <pattern id="hopPattern" patternUnits="userSpaceOnUse" width="8" height="8">
              <path d="M 0 0 L 8 0" stroke="#8B5CF6" strokeWidth="2" strokeDasharray="4,4" />
            </pattern>
          </defs>

          {/* Background grid */}
          <circle cx="200" cy="200" r="180" fill="none" stroke="#1F2937" strokeWidth="1" />
          <circle cx="200" cy="200" r="120" fill="none" stroke="#1F2937" strokeWidth="1" />

          {/* Connection type legend */}
          <g transform="translate(20, 20)">
            <text x="25" y="10" fill="#F3F4F6" fontSize="12" fontWeight="bold">
              Connection Types:
            </text>
            <line x1="0" y1="25" x2="20" y2="25" stroke="#3B82F6" strokeWidth="2" />
            <text x="25" y="30" fill="#F3F4F6" fontSize="12">Direct Link</text>
            <line x1="0" y1="45" x2="20" y2="45" stroke="#8B5CF6" strokeWidth="2" strokeDasharray="4,4" />
            <text x="25" y="50" fill="#F3F4F6" fontSize="12">Hop Link</text>
          </g>

          {/* Draw direct connections */}
          {directLinks.map((stat, i) => {
            const source = uniqueNodes.indexOf(stat.orig_address);
            const sourcePos = getNodePosition(source, uniqueNodes.length);
            const qualityInfo = getQualityInfo(stat.tq);

            return (
              <motion.g key={`direct-${i}`}>
                <motion.line
                  x1={sourcePos.x}
                  y1={sourcePos.y}
                  x2="200"
                  y2="200"
                  stroke="#3B82F6"
                  strokeWidth="2"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.8 }}
                  transition={{ duration: 1 }}
                />
                <text
                  x={(sourcePos.x + 200) / 2}
                  y={(sourcePos.y + 200) / 2 - 10}
                  fill="#3B82F6"
                  fontSize="10"
                  textAnchor="middle"
                  className="pointer-events-none"
                >
                  Direct ({Math.round((stat.tq / 255) * 100)}%)
                </text>
                {showAnimation && (
                  <motion.circle
                    r="3"
                    fill="#3B82F6"
                    filter="url(#glow)"
                    initial={{ x: sourcePos.x, y: sourcePos.y }}
                    animate={{
                      x: [sourcePos.x, 200],
                      y: [sourcePos.y, 200],
                      opacity: [0, 1, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.5
                    }}
                  />
                )}
              </motion.g>
            );
          })}

          {/* Draw hop connections */}
          {hopLinks.map((stat, i) => {
            const source = uniqueNodes.indexOf(stat.orig_address);
            const sourcePos = getNodePosition(source, uniqueNodes.length);
            const qualityInfo = getQualityInfo(stat.tq);
            const controlPoint = {
              x: (sourcePos.x + 200) / 2 + (Math.random() - 0.5) * 40,
              y: (sourcePos.y + 200) / 2 + (Math.random() - 0.5) * 40
            };
            const path = `M ${sourcePos.x} ${sourcePos.y} Q ${controlPoint.x} ${controlPoint.y} 200 200`;

            return (
              <motion.g key={`hop-${i}`}>
                <motion.path
                  d={path}
                  stroke="#8B5CF6"
                  strokeWidth="2"
                  strokeDasharray="4,4"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.6 }}
                  transition={{ duration: 1 }}
                />
                <text
                  x={controlPoint.x}
                  y={controlPoint.y - 10}
                  fill="#8B5CF6"
                  fontSize="10"
                  textAnchor="middle"
                  className="pointer-events-none"
                >
                  Hop ({Math.round((stat.tq / 255) * 100)}%)
                </text>
                {showAnimation && (
                  <motion.circle
                    r="3"
                    fill="#8B5CF6"
                    filter="url(#glow)"
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      offsetDistance: ["0%", "100%"]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      delay: i * 0.5
                    }}
                    style={{
                      offsetPath: `path("${path}")`,
                      offsetRotate: "auto"
                    }}
                  />
                )}
              </motion.g>
            );
          })}

          {/* Draw nodes with overlay tooltip including quality info */}
          {uniqueNodes.map((address, i) => {
            const pos = getNodePosition(i, uniqueNodes.length);
            const nodeStats = meshStats.filter((s) => s.orig_address === address);
            const bestQuality = Math.max(...nodeStats.map((s) => s.tq));
            const qualityInfo = getQualityInfo(bestQuality);

            return (
              <motion.g
                key={`node-${address}`}
                onMouseEnter={() => setHoveredNode(address)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => onNodeClick(address)}
                whileHover={{ scale: 1.1 }}
                className="cursor-pointer"
              >
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="10"
                  fill={qualityInfo.color}
                  className="stroke-white stroke-2"
                  filter="url(#glow)"
                />
                <text
                  x={pos.x}
                  y={pos.y + 25}
                  textAnchor="middle"
                  fill="#9CA3AF"
                  fontSize="12"
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
                        x={pos.x - 40}
                        y={pos.y - 50}
                        width="80"
                        height="20"
                        fill="#1F2937"
                        rx="4"
                      />
                      <text
                        x={pos.x}
                        y={pos.y - 35}
                        textAnchor="middle"
                        fill="#F3F4F6"
                        fontSize="10"
                      >
                        {address} - {qualityInfo.status}
                      </text>
                    </motion.g>
                  )}
                </AnimatePresence>
              </motion.g>
            );
          })}
        </svg>
        <div className="absolute top-2 right-2 bg-gray-800/80 backdrop-blur p-3 rounded-lg z-10">
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full bg-[#22C55E]"></div>
      <span className="text-xs text-gray-300">Excellent (75-100%)</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full bg-[#EAB308]"></div>
      <span className="text-xs text-gray-300">Good (50-75%)</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full bg-[#F97316]"></div>
      <span className="text-xs text-gray-300">Fair (25-50%)</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full bg-[#EF4444]"></div>
      <span className="text-xs text-gray-300">Poor (0-25%)</span>
    </div>
  </div>
</div>

      </div>
      
    </div>
    
  );
};

export default MeshVisualization;
