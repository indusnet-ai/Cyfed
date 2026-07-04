import React from 'react';

interface HealthIndicatorProps {
  status: 'healthy' | 'warning' | 'critical' | string;
  label?: string;
}

export const HealthIndicator: React.FC<HealthIndicatorProps> = ({ status, label }) => {
  const normalized = status.toLowerCase();

  const getStyle = () => {
    switch (normalized) {
      case 'healthy':
        return { dot: 'bg-emerald-400', glow: 'bg-emerald-500/30' };
      case 'warning':
        return { dot: 'bg-amber-400', glow: 'bg-amber-500/30' };
      case 'critical':
      default:
        return { dot: 'bg-rose-400', glow: 'bg-rose-500/30' };
    }
  };

  const style = getStyle();

  return (
    <div className="flex items-center space-x-2">
      <div className="relative flex h-3 w-3">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${style.glow}`}></span>
        <span className={`relative inline-flex rounded-full h-3 w-3 ${style.dot}`}></span>
      </div>
      {label && <span className="text-slate-300 text-xs font-semibold">{label}</span>}
    </div>
  );
};
