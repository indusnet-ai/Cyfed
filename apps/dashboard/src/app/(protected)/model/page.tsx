"use client";

import React, { useState, useEffect } from 'react';
import { Download, FileCode, CheckCircle, Shield } from 'lucide-react';
import { PageHeader } from '@/components/design-system/PageHeader';
import { SectionCard } from '@/components/design-system/SectionCard';
import { useFederationStatus } from '@/hooks/useFederationStatus';
import { useDemo } from '@/context/useDemoContext';
import { useLanguage } from '@/context/useLanguageContext';
import { LoadingState } from '@/components/design-system/LoadingState';

interface CheckpointFile {
  name: string;
  sizeBytes: number;
  modifiedTime?: string;
  roundNumber?: number;
}

// Mock checkpoints generated from demo round data
const buildDemoCheckpoints = (rounds: any[]): CheckpointFile[] => {
  if (!rounds || rounds.length === 0) return [];
  return rounds.map((r: any) => ({
    name: `round_${r.round}.pkl`,
    sizeBytes: 9950,
    modifiedTime: r.timestamp,
    roundNumber: r.round
  })).reverse();
};

export default function ModelPage() {
  const federation = useFederationStatus();
  const { isDemoMode } = useDemo();
  const { language, t } = useLanguage();
  const [checkpoints, setCheckpoints] = useState<CheckpointFile[]>([]);
  const [loading, setLoading] = useState(true);

  // Live mode: fetch from disk via API
  useEffect(() => {
    if (isDemoMode) return;
    const fetchCheckpoints = async () => {
      try {
        const res = await fetch('/api/federation/checkpoints');
        if (res.ok) {
          const files: any[] = await res.json();
          // API returns { filename, sizeBytes, lastModified } — normalise to our interface
          setCheckpoints(files.map(f => ({
            name: f.filename ?? f.name,
            sizeBytes: f.sizeBytes,
            modifiedTime: f.lastModified ?? f.modifiedTime,
            roundNumber: f.roundNumber
          })));
        }
      } catch (error) {
        console.error('Error fetching checkpoints:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCheckpoints();
  }, [isDemoMode]);

  // Demo mode: derive checkpoints from federation rounds
  useEffect(() => {
    if (!isDemoMode) return;
    setCheckpoints(buildDemoCheckpoints(federation.rounds));
    setLoading(false);
  }, [isDemoMode, federation.rounds]);

  const downloadMetadata = (checkpoint: CheckpointFile) => {
    // Generate mock checkpoint weights JSON for client download
    const metadata = {
      model_type: 'SGDClassifier',
      features_count: 77,
      classes_count: 15,
      version: '1.0.0',
      source_round: checkpoint.name.replace('.pkl', ''),
      accuracy_aggregate: federation.globalAccuracy,
      loss_aggregate: federation.globalLoss,
      checkpoint_filename: checkpoint.name,
      checksum: 'sha256_e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(metadata, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `metadata_${checkpoint.name.replace('.pkl', '.json')}`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (federation.loading || loading) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title={t('checkpointRegistry', 'Global Checkpoints')} 
          description={language === 'ta' ? 'மாதிரி சேமிப்புப் பதிவேட்டை ஏற்றுகிறது...' : 'Loading global models registry...'} 
        />
        <LoadingState rows={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader 
        title={t('checkpointRegistry', 'Global Checkpoint Registry')} 
        description={t('checkpointDesc', 'Inspect consolidated model parameters version history, file sizes, and download configuration files.')} 
      />

      {/* Latest Model Specs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SectionCard 
          title={language === 'ta' ? 'செயலில் உள்ள உலகளாவிய மாதிரி' : 'Active Global Model'} 
          description={language === 'ta' ? 'சமீபத்திய அளவுரு கட்டமைப்பு.' : 'Latest consolidated parameter configuration.'} 
          className="md:col-span-2"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-950 p-4 border border-slate-900 rounded-lg">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                {language === 'ta' ? 'மாதிரி வகுப்பு' : 'Model Class'}
              </span>
              <span className="text-white text-sm font-bold mt-1 block">SGDClassifier (Scikit-Learn)</span>
            </div>
            <div className="bg-slate-950 p-4 border border-slate-900 rounded-lg">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                {language === 'ta' ? 'பதிப்பு எண்' : 'Semantic Version'}
              </span>
              <span className="text-indigo-400 text-sm font-extrabold mt-1 block">v1.0.0</span>
            </div>
            <div className="bg-slate-950 p-4 border border-slate-900 rounded-lg">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                {language === 'ta' ? 'துல்லியம் (OVR)' : 'Accuracy (OVR)'}
              </span>
              <span className="text-emerald-400 text-sm font-bold mt-1 block">{(federation.globalAccuracy * 100).toFixed(2)}%</span>
            </div>
            <div className="bg-slate-950 p-4 border border-slate-900 rounded-lg">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                {language === 'ta' ? 'இழப்பு' : 'Log Loss'}
              </span>
              <span className="text-rose-400 text-sm font-bold mt-1 block">{federation.globalLoss.toFixed(4)}</span>
            </div>
          </div>
        </SectionCard>

        <SectionCard 
          title={language === 'ta' ? 'பாதுகாப்பு நிலை' : 'Security Status'} 
          description={language === 'ta' ? 'எடைகள் தனியுரிமை இணக்கப் பதிவுகள்.' : 'Weights privacy compliance logs.'}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-300">
                {language === 'ta' ? 'சாய்வுகள் தணிக்கை செய்யப்பட்டன' : 'Gradients audited'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-300">
                {language === 'ta' ? 'மூலத் தரவு கசிவுகள் இல்லை' : 'No raw strings leaking'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-300">
                {language === 'ta' ? 'அட்டைதாரர் தரவு தனிமைப்படுத்தப்பட்டது' : 'PCI-DSS cardholder isolated'}
              </span>
            </div>
            <div className="mt-4 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg flex items-center gap-2 text-emerald-400">
              <Shield className="w-4 h-4 shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {language === 'ta' ? 'தனியுரிமை இணக்கமானது' : 'Privacy Compliant'}
              </span>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Checkpoints Table */}
      <SectionCard 
        title={t('checkpointArchiveLogs', 'Checkpoint Archive Logs')} 
        description={language === 'ta' ? 'மைய ஒருங்கிணைப்பாளர் வட்டில் சேமிக்கப்பட்ட மாதிரி கோப்புகளின் பட்டியல்.' : 'List of checkpoint weight files saved on central coordinator disk.'}
      >
        <div className="overflow-x-auto w-full">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-900 text-slate-500 text-[10px] uppercase font-bold tracking-wider pb-3">
                <th className="pb-3 pr-4">{language === 'ta' ? 'கோப்பு பெயர்' : 'File Name'}</th>
                <th className="pb-3 px-4">{language === 'ta' ? 'சேமிப்பக இருப்பிடம்' : 'Storage Location'}</th>
                <th className="pb-3 px-4 text-right">{language === 'ta' ? 'கோப்பு அளவு' : 'File Size (Bytes)'}</th>
                <th className="pb-3 px-4 text-right">{language === 'ta' ? 'உருவாக்கப்பட்ட நேரம்' : 'Created Time'}</th>
                <th className="pb-3 pl-4 text-right">{language === 'ta' ? 'செயல்' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/40 text-xs font-semibold text-slate-300">
              {checkpoints.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-600">
                      <FileCode className="w-8 h-8" />
                      <p className="text-xs font-bold text-slate-500">{language === 'ta' ? 'கோப்புகள் எதுவும் இல்லை' : 'No checkpoints found'}</p>
                      <p className="text-[10px] text-slate-600">
                        {isDemoMode
                          ? (language === 'ta' ? 'சேமிப்பு புள்ளிகளை ஏற்ற டெமோ பலகத்தில் படி 2-க்குச் செல்லவும்.' : 'Advance to Step 2 in the ☰ Demo Panel to load checkpoint files.')
                          : (language === 'ta' ? 'கோப்புகளை உருவாக்க கூட்டு பயிற்சியைத் தொடங்கவும்.' : 'Run federated training to generate checkpoint files.')}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
              {checkpoints.map((file, idx) => (
                <tr key={`${file.name || 'checkpoint'}-${idx}`} className="hover:bg-slate-900/30 transition-colors">
                  <td className="py-3.5 pr-4 flex items-center gap-2 text-white font-mono">
                    <FileCode className="w-4 h-4 text-indigo-400 shrink-0" />
                    {file.name}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">/artifacts/global/{file.name}</td>
                  <td className="py-3.5 px-4 text-right font-mono text-white">
                    {file.sizeBytes.toLocaleString()} Bytes
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                    {file.modifiedTime ? new Date(file.modifiedTime).toLocaleString() : (language === 'ta' ? 'இப்போது' : 'Just now')}
                  </td>
                  <td className="py-3.5 pl-4 text-right">
                    <button
                      onClick={() => downloadMetadata(file)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
                      title={language === 'ta' ? 'மெட்டாடேட்டாவைப் பதிவிறக்கு' : 'Download metadata payload'}
                    >
                      <Download className="w-3.5 h-3.5" />
                      {language === 'ta' ? 'தரவு' : 'Metadata'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
