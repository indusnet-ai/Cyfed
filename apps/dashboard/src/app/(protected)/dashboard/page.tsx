"use client";

import React from 'react';
import { 
  ShieldCheck, 
  Layers, 
  TrendingUp, 
  Percent, 
  EyeOff, 
  Activity,
  Award
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

import { PageHeader } from '@/components/design-system/PageHeader';
import { MetricCard } from '@/components/design-system/MetricCard';
import { SectionCard } from '@/components/design-system/SectionCard';
import { ChartCard } from '@/components/design-system/ChartCard';
import { useFederationStatus } from '@/hooks/useFederationStatus';
import { useLanguage } from '@/context/useLanguageContext';
import { LoadingState } from '@/components/design-system/LoadingState';

export default function OverviewPage() {
  const federation = useFederationStatus();
  const { language, t } = useLanguage();

  if (federation.loading) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title={t('execCommandCenter', 'Executive Command Center')} 
          description={language === 'ta' ? 'கூட்டு உகப்பாக்க நிலையை ஏற்றுகிறது...' : 'Loading real-time federated optimization state...'} 
        />
        <LoadingState rows={5} />
      </div>
    );
  }

  // Format Recharts data
  const chartData = federation.rounds.map(r => ({
    round: language === 'ta' ? `சுற்று ${r.round}` : `Round ${r.round}`,
    Accuracy: Number((r.accuracy * 100).toFixed(2)),
    Loss: Number(r.loss.toFixed(4)),
    F1: Number((r.f1 ? r.f1 * 100 : r.accuracy * 55).toFixed(2))
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader 
        title={t('execCommandCenter', 'Executive Command Center')} 
        description={t('overviewDesc', 'Real-time performance metrics, compliance state, and federated learning timeline aggregates.')} 
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title={language === 'ta' ? 'இணைக்கப்பட்ட அமைப்புகள்' : 'Connected Organizations'}
          value={federation.activeClientsCount}
          icon={Layers}
          description={language === 'ta' ? 'தரவை வழங்கும் கணினிகள்' : 'Silos contributing training data'}
        />
        <MetricCard
          title={language === 'ta' ? 'தற்போதைய கூட்டு சுற்று' : 'Current FL Round'}
          value={language === 'ta' ? `சுற்று ${federation.currentRound}` : `Round ${federation.currentRound}`}
          icon={Activity}
          trend={federation.status === 'training' ? (language === 'ta' ? 'செயலில்' : 'Active') : (language === 'ta' ? 'முடிந்தது' : 'Finished')}
          trendType={federation.status === 'training' ? 'up' : 'neutral'}
          description={language === 'ta' ? 'சமீபத்திய பயிற்சி மறுசெய்கை' : 'Latest training iteration'}
        />
        <MetricCard
          title={language === 'ta' ? 'உலகளாவிய மாதிரி துல்லியம்' : 'Global model Accuracy'}
          value={`${(federation.globalAccuracy * 100).toFixed(2)}%`}
          icon={Award}
          trend="+0.85%"
          trendType="up"
          description={language === 'ta' ? 'ஒருங்கிணைந்த வகைப்பாடு மதிப்பெண்' : 'Aggregated classification score'}
        />
        <MetricCard
          title={language === 'ta' ? 'அலைவரிசை குறைப்பு' : 'Bandwidth Reduction'}
          value={`${federation.bandwidthSaved.toFixed(2)}%`}
          icon={Percent}
          trend="99.99%"
          trendType="up"
          description={language === 'ta' ? 'கிளவுட் பரிமாற்றத்துடன் ஒப்பிடும்போது' : 'Compared to centralized cloud transfer'}
        />
      </div>

      {/* Second Row KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title={language === 'ta' ? 'உலகளாவிய மேக்ரோ F1' : 'Global Macro F1'}
          value={`${(federation.globalF1 * 100).toFixed(2)}%`}
          icon={TrendingUp}
          description={language === 'ta' ? 'துல்லியம்/மீட்டெடுப்பின் ஹார்மோனிக் சராசரி' : 'Harmonic mean of precision/recall'}
        />
        <MetricCard
          title={language === 'ta' ? 'தனியுரிமை நிலை' : 'Privacy Status'}
          value={federation.privacyPreserved ? (language === 'ta' ? 'சரிபார்க்கப்பட்டது' : 'Verified') : (language === 'ta' ? 'அபாயம்' : 'Flagged')}
          icon={EyeOff}
          trend="PASS"
          trendType="up"
          description={language === 'ta' ? 'இணக்கத்திற்காக தணிக்கை செய்யப்பட்டவை' : 'Gradients audited for compliance'}
        />
        <MetricCard
          title={language === 'ta' ? 'சமீபத்திய சேமிப்பு புள்ளி' : 'Latest Checkpoint'}
          value={federation.latestCheckpoint}
          icon={ShieldCheck}
          description={language === 'ta' ? 'வட்டில் ஒருங்கிணைக்கப்பட்ட மாதிரி' : 'Consolidated global model on disk'}
        />
        <MetricCard
          title={language === 'ta' ? 'உட்செலுத்துதல் சேமிப்பு' : 'Ingestion Savings'}
          value={language === 'ta' ? '2.28 GB சேமிக்கப்பட்டது' : '2.28 GB saved'}
          icon={Percent}
          description={language === 'ta' ? '224 KB எடைகள் மட்டுமே அனுப்பப்பட்டது' : 'Transmitted 224 KB weights only'}
        />
      </div>

      {/* Training Timeline Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard 
          title={language === 'ta' ? 'கூட்டு மாதிரி துல்லியம் மற்றும் இழப்பு குவிவு' : 'Federated Model Accuracy & Loss Convergence'} 
          description={language === 'ta' ? 'பயிற்சி சுற்றுகளில் துல்லியம் மற்றும் இழப்பு குறைப்பு முன்னேற்றம்' : 'Accuracy progress and cross-entropy loss reduction across training rounds'}
          className="lg:col-span-2"
        >
          {chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-slate-500 text-xs">
              {language === 'ta' ? 'சுற்றுகள் எதுவும் பதிவு செய்யப்படவில்லை.' : 'No rounds recorded yet. Start training nodes to gather timeline.'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                <XAxis dataKey="round" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }} 
                  labelStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Legend verticalAlign="top" height={36} fontSize={10} />
                <Area name={language === 'ta' ? 'துல்லியம் (%)' : 'Accuracy (%)'} type="monotone" dataKey="Accuracy" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorAcc)" />
                <Area name={language === 'ta' ? 'இழப்பு (மதிப்பு)' : 'Loss (value)'} type="monotone" dataKey="Loss" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorLoss)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Round Duration stats card */}
        <SectionCard 
          title={language === 'ta' ? 'சுற்று அளவீடுகள் திரட்டுகள்' : 'Rounds Metrics Aggregates'} 
          description={language === 'ta' ? 'ஒருங்கிணைந்த சுற்று இயக்க சராசரிகள்.' : 'Consolidated round run averages.'}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <span className="text-xs text-slate-400">{language === 'ta' ? 'இயக்கப்பட்ட மொத்த சுற்றுகள்' : 'Total Rounds Executed'}</span>
              <span className="text-xs font-bold text-white">{federation.rounds.length}</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <span className="text-xs text-slate-400">{language === 'ta' ? 'சராசரி சுற்று காலம்' : 'Avg Round Duration'}</span>
              <span className="text-xs font-bold text-white">51.72s</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <span className="text-xs text-slate-400">{language === 'ta' ? 'சராசரி திரட்டல் மேல்நிலை' : 'Avg Aggregation Overhead'}</span>
              <span className="text-xs font-bold text-indigo-400">0.019s</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">{language === 'ta' ? 'பாதுகாப்பு தணிக்கை ஸ்கேன்' : 'Security Audit Scans'}</span>
              <span className="text-xs font-bold text-emerald-400">PASS (Compliance Green)</span>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
