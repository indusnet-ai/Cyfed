import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: string;
  trendType?: 'up' | 'down' | 'neutral';
  description?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  trendType = 'neutral',
  description,
}) => {
  const getTrendColor = () => {
    switch (trendType) {
      case 'up': return 'text-emerald-500 bg-emerald-500/10';
      case 'down': return 'text-rose-500 bg-rose-500/10';
      default: return 'text-slate-400 bg-slate-800';
    }
  };

  return (
    <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all duration-300 shadow-sm relative overflow-hidden group">
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-indigo-500 group-hover:text-indigo-400 group-hover:border-slate-700 transition-colors">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="flex items-baseline space-x-2">
        <h3 className="text-2xl font-bold text-white tracking-tight">{value}</h3>
        {trend && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${getTrendColor()}`}>
            {trend}
          </span>
        )}
      </div>
      {description && (
        <p className="text-slate-500 text-xs mt-2 leading-relaxed">{description}</p>
      )}
    </div>
  );
};
