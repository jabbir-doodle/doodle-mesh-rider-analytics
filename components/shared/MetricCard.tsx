'use client';
import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface MetricCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: any;
  status: 'normal' | 'warning' | 'critical';
  onClick?: () => void;
  clickInstruction?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  icon: Icon,
  status,
  onClick,
  clickInstruction
}) => {
  const statusColor =
    status === 'normal'
      ? 'bg-green-500/10 text-green-500'
      : status === 'warning'
      ? 'bg-yellow-500/10 text-yellow-500'
      : 'bg-red-500/10 text-red-500';

  return (
    <div
      className={`bg-gray-900 p-4 rounded-lg ${
        onClick ? 'cursor-pointer hover:bg-gray-800 transition-colors' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={`rounded-full p-2 ${statusColor}`}>
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-white font-medium">{title}</h3>
      </div>
      {value || unit ? (
        <div className="text-2xl font-semibold text-white">
          {value}
          <span className="text-gray-400 text-sm">{unit}</span>
        </div>
      ) : (
        <div className="text-sm text-gray-400 mt-2">
          {clickInstruction || "Click for details"}
        </div>
      )}
    </div>
  );
};

// components/shared/InfoCard.tsx
export interface InfoCardProps {
  title: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  children: React.ReactNode;
}

export const InfoCard: React.FC<InfoCardProps> = ({
  title,
  icon: Icon,
  children,
}) => (
  <div className="bg-[#0F1629] rounded-lg p-6 relative overflow-hidden">
    <div className="relative z-10">
      <div className="flex items-center space-x-2 text-gray-100 mb-4">
        <Icon className="h-5 w-5" />
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      {children}
    </div>
    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent"></div>
  </div>
);

// components/shared/StatusItem.tsx
interface StatusItemProps {
  label: string;
  value: string | number;
}

export const StatusItem: React.FC<StatusItemProps> = ({ label, value }) => (
  <div className="bg-gray-800/50 p-3 rounded-lg">
    <div className="text-sm text-gray-400">{label}</div>
    <div className="text-gray-100 font-medium">{value}</div>
  </div>
);
