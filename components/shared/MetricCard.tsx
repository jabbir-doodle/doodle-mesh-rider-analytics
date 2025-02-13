'use client';
import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface MetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
  subValue?: string;
  icon: LucideIcon;
  status: 'normal' | 'warning' | 'critical';
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit = '',
  subValue,
  icon: Icon,
  status,
  onClick,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      default:
        return 'text-white';
    }
  };
  return (
    <div
      className={`bg-gray-900 border border-gray-800 rounded-lg p-6 ${
        onClick ? 'cursor-pointer hover:bg-gray-800 transition-colors' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center space-x-2 text-gray-400 mb-2">
        <Icon className="h-5 w-5" />
        <span className="text-sm">{title}</span>
      </div>
      <div className={`text-2xl font-bold ${getStatusColor(status)}`}>
        {typeof value === 'number' ? Number(value).toFixed(1) : value}
        {unit}
      </div>
      {subValue && <div className="text-xs text-gray-500">{subValue}</div>}
      {onClick && (
        <div className="mt-2 text-xs text-gray-300">Click to show graph</div>
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
