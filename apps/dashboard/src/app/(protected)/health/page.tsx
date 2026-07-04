"use client";

import React from 'react';
import { 
  Database, 
  Cpu, 
  Globe, 
  CheckCircle2, 
  AlertTriangle,
  Server,
  FolderLock
} from 'lucide-react';
import { PageHeader } from '@/components/design-system/PageHeader';
import { SectionCard } from '@/components/design-system/SectionCard';
import { HealthIndicator } from '@/components/design-system/HealthIndicator';
import { useSystemHealth } from '@/hooks/useSystemHealth';
import { useLanguage } from '@/context/useLanguageContext';
import { LoadingState } from '@/components/design-system/LoadingState';

export default function HealthPage() {
  const health = useSystemHealth();
  const { language, t } = useLanguage();

  if (health.loading) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title={t('healthTitle', 'System Health')} 
          description={language === 'ta' ? 'நிகழ்நேர இணைப்பு நிலை சோதனைகளை ஏற்றுகிறது...' : 'Loading real-time connection status check logs...'} 
        />
        <LoadingState rows={5} />
      </div>
    );
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'healthy': return language === 'ta' ? 'ஆன்லைன் (செயலில்)' : 'Online (Active)';
      case 'warning': return language === 'ta' ? 'எச்சரிக்கை (அதிக தாமதம்)' : 'Warning (High Latency)';
      case 'critical': default: return language === 'ta' ? 'ஆஃப்லைன் (பிழை)' : 'Offline (Error)';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader 
        title={t('healthTitle', 'System Infrastructure Health')} 
        description={t('healthDesc', 'Inspect connections logs between the central server coordinator, databases, local clients, and dashboard REST endpoints.')} 
      />

      {/* Health Checks Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SectionCard 
          title={language === 'ta' ? 'ஃபிளவர் சர்வர் ஒருங்கிணைப்பாளர்' : 'Flower Server Coordinator'} 
          description={language === 'ta' ? 'போர்ட் 8080-இல் gRPC சூப்பர்லிங்க் கேட்கிறது.' : 'gRPC superlink listener on port 8080.'}
        >
          <div className="flex flex-col justify-between h-32">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-semibold">
                {language === 'ta' ? 'இணைக்கப்பட்ட செயலில் உள்ள கிளையண்டுகள்' : 'Active Clients Connected'}
              </span>
              <span className="text-xs font-bold text-white font-mono">
                {health.connectedClients} {language === 'ta' ? 'கிளையண்டுகள்' : 'Clients'}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-900 pt-3">
              <span className="text-xs text-slate-400 font-semibold">{language === 'ta' ? 'நிலை காட்டி' : 'Status Indicator'}</span>
              <HealthIndicator status={health.flowerServer} label={getStatusText(health.flowerServer)} />
            </div>
          </div>
        </SectionCard>

        <SectionCard 
          title={language === 'ta' ? 'Supabase தரவுத்தள நிகழ்வு' : 'Supabase Database Instance'} 
          description={language === 'ta' ? 'PostgreSQL தரவுத்தள அட்டவணைகள் ஒத்திசைவு.' : 'PostgreSQL DB tables registry sync.'}
        >
          <div className="flex flex-col justify-between h-32">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-semibold">{language === 'ta' ? 'இலக்கு SSL போர்ட்' : 'Target SSL Port'}</span>
              <span className="text-xs font-bold text-slate-400 font-mono">5432 (TCP)</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-900 pt-3">
              <span className="text-xs text-slate-400 font-semibold">{language === 'ta' ? 'நிலை காட்டி' : 'Status Indicator'}</span>
              <HealthIndicator status={health.supabase} label={getStatusText(health.supabase)} />
            </div>
          </div>
        </SectionCard>

        <SectionCard 
          title={language === 'ta' ? 'டாஷ்போர்டு REST API-கள்' : 'Dashboard REST APIs'} 
          description={language === 'ta' ? 'டாஷ்போர்டு சர்வர் பக்க வழிகள் (/api/federation).' : 'Dashboard server-side routes (/api/federation).'}
        >
          <div className="flex flex-col justify-between h-32">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-semibold">{language === 'ta' ? 'நிலை குறியீடு பதில்' : 'Status Code Response'}</span>
              <span className="text-xs font-bold text-emerald-400 font-mono">200 OK</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-900 pt-3">
              <span className="text-xs text-slate-400 font-semibold">{language === 'ta' ? 'நிலை காட்டி' : 'Status Indicator'}</span>
              <HealthIndicator status={health.dashboard} label={getStatusText(health.dashboard)} />
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Subsystem Heartbeats Log */}
      <SectionCard 
        title={language === 'ta' ? 'கணினி முனை கண்டறிதல்' : 'System Node Diagnostics'} 
        description={language === 'ta' ? 'இயங்குதள செயல்பாடுகளுக்கான கண்டறிதல் மாறிகள்.' : 'Diagnostic variables for platform operations.'}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-900 pb-3 hover:bg-slate-900/10 p-2 rounded transition-colors">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <span className="text-xs text-white font-bold block">{language === 'ta' ? 'GRPC செய்தி அளவு வரம்பு' : 'GRPC Message Size Limit'}</span>
                <span className="text-[10px] text-slate-500">{language === 'ta' ? 'அளவுரு எடைகள் பதிவேற்றங்களுக்கான அதிகபட்ச பரிமாற்ற அளவு' : 'Maximum transfer size for parameter weights uploads'}</span>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-400 font-mono">100 MB</span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-900 pb-3 hover:bg-slate-900/10 p-2 rounded transition-colors">
            <div className="flex items-center gap-2">
              <FolderLock className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <span className="text-xs text-white font-bold block">{language === 'ta' ? 'சேமிப்பு புள்ளி கோப்பக அனுமதிகள்' : 'Checkpoint Directory Permissions'}</span>
                <span className="text-[10px] text-slate-500">{language === 'ta' ? 'ஒருங்கிணைப்பாளர் வட்டில் படிக்க/எழுத அனுமதிகள்' : 'Read/Write permissions on coordinator disk'}</span>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-400 font-mono">WRITE_ENABLED (0755)</span>
          </div>

          <div className="flex items-center justify-between hover:bg-slate-900/10 p-2 rounded transition-colors">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <span className="text-xs text-white font-bold block">{language === 'ta' ? 'இதயத் துடிப்பு நிலை கண்காணிப்பு' : 'Heartbeat Status Tracker'}</span>
                <span className="text-[10px] text-slate-500">{language === 'ta' ? 'ஆன்லைன்/ஆஃப்லைன் முனை குறிச்சொல் காலம்' : 'Online/offline node tagging duration'}</span>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-400 font-mono">60s {language === 'ta' ? 'வரம்பு' : 'Threshold'}</span>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
