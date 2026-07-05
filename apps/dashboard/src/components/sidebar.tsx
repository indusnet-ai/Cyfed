"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '@/context/useLanguageContext';
import { 
  Shield, 
  Cpu, 
  Terminal, 
  Activity, 
  Lock, 
  FileText, 
  Database,
  Sliders,
  Sparkles,
  BarChart2,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();

  const links = [
    { name: t('overview', 'Overview'), href: '/dashboard', icon: Activity },
    { name: t('aiAnalyst', 'AI SOC Analyst'), href: '/analyst', icon: Sparkles },
    { name: t('clientMonitoring', 'Client Monitoring'), href: '/clients', icon: Cpu },
    { name: t('technicalBenchmark', 'Technical Benchmark'), href: '/benchmark', icon: BarChart2 },
    { name: t('globalCheckpoints', 'Global Checkpoints'), href: '/model', icon: FileText },
    { name: t('businessValue', 'Business Value'), href: '/business', icon: Sliders },
    { name: t('systemHealth', 'System Health'), href: '/health', icon: Database },
  ];

  return (
    <aside className={`w-64 bg-[#090d16] border-r border-slate-900 flex flex-col h-full ${className}`}>
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-900 gap-3">
        <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <span className="font-extrabold text-sm text-white tracking-wider uppercase">Cyfed</span>
          <span className="text-[10px] text-slate-500 font-bold block -mt-1 tracking-widest uppercase">
            {t('coreHealth', 'Command Center')}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 ${
                isActive 
                  ? 'bg-indigo-600/10 border border-indigo-600/20 text-indigo-400' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4" />
              {link.name}
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="px-4 py-3 border-t border-slate-900/60">
        <button
          onClick={() => router.push('/login')}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide text-rose-400 hover:text-white hover:bg-rose-950/20 border border-transparent hover:border-rose-900/10 transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          {t('logout', 'Logout')}
        </button>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
        <span>{t('version', 'Version')} 1.0.0</span>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-emerald-400 font-bold">{t('secure', 'Secure')}</span>
        </div>
      </div>
    </aside>
  );
};
