'use client';

import React from 'react';
import { Radio, Waves, Antenna, Signal } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface OperationMetricProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subLabel?: string;
  status?: 'online' | 'offline';
  highlight?: boolean;
}

const OperationMetric: React.FC<OperationMetricProps> = ({
  icon: Icon,
  label,
  value,
  subLabel,
  status,
  highlight
}) => (
  <div className={`relative overflow-hidden rounded-xl bg-gradient-to-b from-gray-800/50 to-gray-900/50 p-4 transition-all duration-300 hover:from-gray-800 hover:to-gray-900 ${highlight ? 'ring-2 ring-blue-500/50' : ''}`}>
    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/3 to-purple-500/3" />
    <div className="relative space-y-2">
      <div className="flex items-center gap-2 text-gray-400">
        <Icon className="h-5 w-5" />
        <span className="text-sm font-medium">{label}</span>
        {status && (
          <span className={`ml-auto h-2 w-2 rounded-full ${status === 'online' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <div className="text-2xl font-bold text-white">{value}</div>
        {subLabel && <div className="text-sm text-gray-500">{subLabel}</div>}
      </div>
    </div>
  </div>
);

interface OperationsDetailsProps {
  operChan: number;
  operFreq: number;
  chanWidth: number;
  lnaStatus: number;
}

const OperationsDetails: React.FC<OperationsDetailsProps> = ({
  operChan,
  operFreq,
  chanWidth,
  lnaStatus
}) => {
  const isLnaActive = [1, 3].includes(lnaStatus);

  const getAmplifierStatus = (status: number): { text: string; status: 'online' | 'offline' } => ({
    text: [1, 3].includes(status) ? 'On' : 'Off',
    status: [1, 3].includes(status) ? 'online' : 'offline'
  });

  const amplifierStatus = getAmplifierStatus(lnaStatus);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
          <Radio className="h-5 w-5 text-blue-500" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Operation Details</h2>
          <p className="text-sm text-gray-400">Radio Configuration and Status</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <OperationMetric
          icon={Signal}
          label="Operating Channel"
          value={operChan}
          subLabel="Current Channel"
          highlight
        />

        <OperationMetric
          icon={Waves}
          label="Operating Frequency"
          value={`${operFreq} MHz`}
          subLabel="Center Frequency"
        />

        <OperationMetric
          icon={Antenna}
          label="Channel Width"
          value={chanWidth === 0 ? '20 MHz' : `${chanWidth} MHz`}
          subLabel="Bandwidth"
        />

        <OperationMetric
          icon={Radio}
          label="Link Status"
          value={amplifierStatus.text}
          status={amplifierStatus.status}
          highlight={isLnaActive}
        />
      </div>

      <div className="mt-6 rounded-lg bg-gray-800/50 p-4">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-gray-400">Active Configuration</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-gray-400">Radio Status Normal</span>
          </div>
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-gray-400" />
            <span className="text-gray-400">Link Module Operational</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(OperationsDetails);