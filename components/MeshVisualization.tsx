import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio } from 'lucide-react';

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

const MeshVisualization: React.FC<Props> = ({
  meshStats = [],
  onNodeClick = () => { }
}) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [showAnimation, setShowAnimation] = useState(true);
  const [selectedView, setSelectedView] = useState<'2d' | '3d'>('2d');
  const [linkLayout, setLinkLayout] = useState<'radial' | 'curved'>('curved');

  const center = { x: 250, y: 250 };
  const uniqueNodes = Array.from(new Set(meshStats.map((s) => s.orig_address)));
  const directLinks = meshStats.filter((s) => s.hop_status === 'direct');
  const hopLinks = meshStats.filter((s) => s.hop_status === 'hop');

  // Radius for placing nodes between the small and large background circles.
  const nodeRingRadius = 150;

  // Return a position on the circle for each node
  const getNodePosition = (index: number, total: number) => {
    const angle = (2 * Math.PI * index) / total - Math.PI / 2;
    return {
      x: center.x + nodeRingRadius * Math.cos(angle),
      y: center.y + nodeRingRadius * Math.sin(angle)
    };
  };

  // Slightly offset the link text so multiple lines won't collide
  const getTextPosition = (
    source: { x: number; y: number },
    target: { x: number; y: number },
    offset: number
  ) => {
    const midX = (source.x + target.x) / 2;
    const midY = (source.y + target.y) / 2;
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const angle = Math.atan2(dy, dx);
    return {
      x: midX + offset * Math.cos(angle + Math.PI / 2),
      y: midY + offset * Math.sin(angle + Math.PI / 2)
    };
  };

  // Curved path from source to target
  const getCurvedPath = (
    source: { x: number; y: number },
    target: { x: number; y: number },
    index: number
  ) => {
    const midX = (source.x + target.x) / 2;
    const midY = (source.y + target.y) / 2;
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const normalX = -dy / dist;
    const normalY = dx / dist;
    const curvature = dist * 0.2 * (index % 2 ? 1 : -1);
    const controlX = midX + normalX * curvature;
    const controlY = midY + normalY * curvature;
    return {
      path: `M ${source.x} ${source.y} Q ${controlX} ${controlY} ${target.x} ${target.y}`
    };
  };

  // Straight line path
  const getStraightPath = (
    source: { x: number; y: number },
    target: { x: number; y: number }
  ) => {
    return { path: `M ${source.x} ${source.y} L ${target.x} ${target.y}` };
  };

  // Map tq to color & textual "status"
  const getQualityInfo = (tq: number) => {
    const quality = (tq / 255) * 100;
    if (quality >= 75) return { color: '#22C55E', status: 'Excellent' };
    if (quality >= 50) return { color: '#EAB308', status: 'Good' };
    if (quality >= 25) return { color: '#F97316', status: 'Fair' };
    return { color: '#EF4444', status: 'Poor' };
  };

  // Offsets for link label text
  const directLabelBaseOffset = linkLayout === 'curved' ? 25 : 15;
  const hopLabelBaseOffset = linkLayout === 'curved' ? -25 : -15;

  return (
    <div className="bg-gray-900 p-6 rounded-lg shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-white">
              Mesh Network Topology
            </h3>
          </div>
          <div className="flex gap-2 bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => setSelectedView('2d')}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${selectedView === '2d'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
                }`}
            >
              2D View
            </button>
            <button
              onClick={() => setSelectedView('3d')}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${selectedView === '3d'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
                }`}
            >
              3D View
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowAnimation(!showAnimation)}
          className="px-3 py-1.5 bg-gray-800 rounded-md text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2"
        >
          {showAnimation ? (
            <>
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-blue-500"
              >
                ●
              </motion.span>
              Pause Animation
            </>
          ) : (
            'Start Animation'
          )}
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {/* Curved Links Button */}
        <button
          onClick={() => setLinkLayout('curved')}
          className={`flex items-center gap-1 px-3 py-1 rounded ${linkLayout === 'curved' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white'
            }`}
        >
          {/* Inline SVG Icon for Curved Links */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {/* This is a simple curved path icon */}
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 16c1.333-2.667 3.667-4 6-4 2.333 0 4.667 1.333 6 4m0 0c1.333-2.667 3.667-4 6-4"
            />
          </svg>
          <span>Curved Links</span>
        </button>

        {/* Radial Links Button */}
        <button
          onClick={() => setLinkLayout('radial')}
          className={`flex items-center gap-1 px-3 py-1 rounded ${linkLayout === 'radial' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white'
            }`}
        >
          {/* Inline SVG Icon for Radial Links */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {/* This icon uses a circle with cross lines to evoke a radial design */}
            <circle cx="12" cy="12" r="9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="12" y1="3" x2="12" y2="21" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="3" y1="12" x2="21" y2="12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Radial Links</span>
        </button>
      </div>

      <div className="relative">
        <motion.div
          layout
          className="bg-gray-800/50 backdrop-blur rounded-lg p-4"
          initial={false}
          animate={{ height: selectedView === '3d' ? '500px' : '400px' }}
        >
          <svg
            width="400"
            height={selectedView === '3d' ? '500' : '400'}
            className="mx-auto"
          >
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Two background circles: smaller + larger */}
            <circle
              cx={center.x}
              cy={center.y}
              r={100}
              fill="none"
              stroke="#1F2937"
              strokeWidth="1"
              opacity="0.3"
            />
            <circle
              cx={center.x}
              cy={center.y}
              r={200}
              fill="none"
              stroke="#1F2937"
              strokeWidth="1"
              opacity="0.3"
            />

            {/* Direct Links */}
            {directLinks.map((stat, i) => {
              const sourceIndex = uniqueNodes.indexOf(stat.orig_address);
              const sourcePos = getNodePosition(sourceIndex, uniqueNodes.length);
              const pathObj =
                linkLayout === 'curved'
                  ? getCurvedPath(sourcePos, center, i)
                  : getStraightPath(sourcePos, center);
              const textOffset = directLabelBaseOffset + i * 8;
              const textPos = getTextPosition(sourcePos, center, textOffset);

              return (
                <motion.g key={`direct-${i}`}>
                  <motion.path
                    d={pathObj.path}
                    stroke="#3B82F6"
                    strokeWidth={3}
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.8 }}
                    transition={{ duration: 1 }}
                  />
                  <text
                    x={textPos.x}
                    y={textPos.y}
                    fill="#3B82F6"
                    fontSize="12"
                    textAnchor="middle"
                  >
                    {Math.round((stat.tq / 255) * 100)}%
                  </text>
                  {showAnimation && (
                    <motion.circle
                      r="4"
                      fill="#3B82F6"
                      filter="url(#glow)"
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: [0, 1, 0],
                        offsetDistance: ['0%', '100%']
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.3
                      }}
                      style={{
                        offsetPath: `path("${pathObj.path}")`,
                        offsetRotate: 'auto'
                      }}
                    />
                  )}
                </motion.g>
              );
            })}

            {/* Hop Links */}
            {hopLinks.map((stat, i) => {
              const sourceIndex = uniqueNodes.indexOf(stat.orig_address);
              const sourcePos = getNodePosition(sourceIndex, uniqueNodes.length);
              const pathObj =
                linkLayout === 'curved'
                  ? getCurvedPath(sourcePos, center, -i)
                  : getStraightPath(sourcePos, center);
              const textOffset = hopLabelBaseOffset - i * 8;
              const textPos = getTextPosition(sourcePos, center, textOffset);

              return (
                <motion.g key={`hop-${i}`}>
                  <motion.path
                    d={pathObj.path}
                    stroke="#8B5CF6"
                    strokeWidth="3"
                    strokeDasharray="6,4"
                    fill="none"
                    opacity="0.8"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1 }}
                  />
                  <text
                    x={textPos.x}
                    y={textPos.y}
                    fill="#8B5CF6"
                    fontSize="12"
                    textAnchor="middle"
                  >
                    {Math.round((stat.tq / 255) * 100)}%
                  </text>
                  {showAnimation && (
                    <motion.circle
                      r="4"
                      fill="#8B5CF6"
                      filter="url(#glow)"
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: [0, 1, 0],
                        offsetDistance: ['0%', '100%']
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.3
                      }}
                      style={{
                        offsetPath: `path("${pathObj.path}")`,
                        offsetRotate: 'auto'
                      }}
                    />
                  )}
                </motion.g>
              );
            })}

            {/* Nodes */}
            {uniqueNodes.map((address, i) => {
              const pos = getNodePosition(i, uniqueNodes.length);
              const nodeStats = meshStats.filter((s) => s.orig_address === address);
              const bestQuality = Math.max(...nodeStats.map((s) => s.tq));
              const qualityInfo = getQualityInfo(bestQuality);

              return (
                <motion.g
                  key={`node-${address}`}
                  animate={{
                    y: [0, selectedView === '3d' ? 10 : 0],
                    scale: hoveredNode === address ? 1.1 : 1
                  }}
                  transition={{
                    y: { duration: 2, repeat: Infinity, repeatType: 'reverse' },
                    scale: { duration: 0.2 }
                  }}
                  onMouseEnter={() => setHoveredNode(address)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => onNodeClick(address)}
                  className="cursor-pointer"
                >
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="12"
                    fill={qualityInfo.color}
                    className="stroke-white stroke-2"
                    filter="url(#glow)"
                  />
                  <motion.circle
                    cx={pos.x}
                    cy={pos.y}
                    r="16"
                    fill="none"
                    stroke={qualityInfo.color}
                    strokeWidth="1"
                    initial={{ opacity: 0.2 }}
                    animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
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
                          x={pos.x - 60}
                          y={pos.y - 60}
                          width="120"
                          height="40"
                          fill="#1F2937"
                          rx="4"
                        />
                        <text
                          x={pos.x}
                          y={pos.y - 45}
                          textAnchor="middle"
                          fill="#F3F4F6"
                          fontSize="10"
                        >
                          {address}
                        </text>
                        <text
                          x={pos.x}
                          y={pos.y - 30}
                          textAnchor="middle"
                          fill={qualityInfo.color}
                          fontSize="10"
                        >
                          {qualityInfo.status} -{' '}
                          {Math.round((bestQuality / 255) * 100)}%
                        </text>
                      </motion.g>
                    )}
                  </AnimatePresence>
                </motion.g>
              );
            })}
          </svg>
        </motion.div>

        {/* Legend */}
        <motion.div
          className="absolute top-2 right-2 bg-gray-800/90 backdrop-blur p-4 rounded-lg z-10"
          whileHover={{ scale: 1.05 }}
        >
          <div className="space-y-2">
            {[
              { color: '#22C55E', label: 'Excellent (75-100%)' },
              { color: '#EAB308', label: 'Good (50-75%)' },
              { color: '#F97316', label: 'Fair (25-50%)' },
              { color: '#EF4444', label: 'Poor (0-25%)' }
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2">
                <motion.div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
                />
                <span className="text-xs text-gray-300">{label}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2">
              <svg width="30" height="10">
                <line
                  x1="0"
                  y1="5"
                  x2="30"
                  y2="5"
                  stroke="#3B82F6"
                  strokeWidth="2"
                />
              </svg>
              <span className="text-xs text-gray-300">Direct Link</span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="30" height="10">
                <line
                  x1="0"
                  y1="5"
                  x2="30"
                  y2="5"
                  stroke="#8B5CF6"
                  strokeWidth="2"
                  strokeDasharray="6,4"
                />
              </svg>
              <span className="text-xs text-gray-300">Hop Link</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MeshVisualization;
