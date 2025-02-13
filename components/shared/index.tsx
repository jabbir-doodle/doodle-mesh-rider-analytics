// components/shared/index.tsx
'use client';

import React from 'react';

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  unit?: string;
  subtitle?: string;
  status?: 'normal' | 'warning' | 'critical';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  unit = '',
  subtitle = '',
  status = 'normal',
}) => {
  const getStatusColor = (status: 'normal' | 'warning' | 'critical') => {
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
    <div className="bg-[#0F1629] rounded-lg p-6 relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-center space-x-2 text-gray-400 mb-2">
          <Icon className="h-5 w-5" />
          <span className="text-sm">{title}</span>
        </div>
        <div className={`text-3xl font-bold ${getStatusColor(status)}`}>
          {typeof value === 'number' ? value.toFixed(1) : value}
          {unit}
        </div>
        {subtitle && (
          <div className="text-sm text-gray-500 mt-1">{subtitle}</div>
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent"></div>
    </div>
  );
};

interface InfoCardProps {
  title: string;
  icon: React.ElementType;
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
