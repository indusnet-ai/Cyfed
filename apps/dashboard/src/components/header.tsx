"use client";

import React from 'react';
import { RefreshCw, Radio } from 'lucide-react';
import { HealthIndicator } from '@/components/design-system/HealthIndicator';
import { useSystemHealth } from '@/hooks/useSystemHealth';
import { useFederationStatus } from '@/hooks/useFederationStatus';
import { useLanguage } from '@/context/useLanguageContext';

export const Header: React.FC = () => {
  const health = useSystemHealth();
  const federation = useFederationStatus();
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="h-16 bg-[#090d16] border-b border-slate-900 flex items-center justify-between px-8 z-30">
      {/* Title/Status */}
      <div className="flex items-center gap-3">
        <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">
          {t('systemState', 'System State')}:
        </span>
        <span className={`text-[10px] px-2 py-0.5 rounded font-extrabold uppercase tracking-wider ${
          federation.status === 'training' 
            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
            : 'bg-slate-800 text-slate-400'
        }`}>
          {federation.status === 'training' ? t('flTrainingActive', 'FL Training Active') : t('idle', 'Idle')}
        </span>
      </div>

      {/* Health Checks Metrics */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-1.5 border-r border-slate-900 pr-5">
          <Radio className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-2">
            {t('coreHealth', 'Core Health')}:
          </span>
          <div className="flex gap-4">
            <HealthIndicator status={health.flowerServer} label={t('superLink', 'SuperLink')} />
            <HealthIndicator status={health.supabase} label={t('database', 'Database')} />
          </div>
        </div>

        {/* Language Dropdown Selector */}
        <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 shadow-sm">
          <span className="text-[9px] font-extrabold uppercase text-indigo-400 tracking-wider">Lang:</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'en' | 'ta')}
            className="bg-transparent text-[10px] text-white font-bold tracking-wider uppercase cursor-pointer outline-none border-none focus:ring-0 p-0"
          >
            <option value="en" className="bg-[#090d16] text-white">EN</option>
            <option value="ta" className="bg-[#090d16] text-white">தமிழ்</option>
          </select>
        </div>

        <button 
          onClick={() => window.location.reload()}
          className="p-2 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-400 hover:text-white transition-all shadow-sm"
          title={t('refreshDashboardData', 'Refresh Dashboard Data')}
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
