import React from 'react';

interface StatusBadgeProps {
  status: 'online' | 'offline' | 'training' | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const normalized = status.toLowerCase();

  const getStyle = () => {
    switch (normalized) {
      case 'online':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'training':
        return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse';
      case 'offline':
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${getStyle()}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        normalized === 'online' ? 'bg-emerald-400' :
        normalized === 'training' ? 'bg-indigo-400' : 'bg-slate-400'
      }`} />
      {status}
    </span>
  );
};
