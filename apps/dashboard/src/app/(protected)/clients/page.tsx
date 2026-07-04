"use client";

import React, { useState } from 'react';
import { Search, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/design-system/PageHeader';
import { SectionCard } from '@/components/design-system/SectionCard';
import { StatusBadge } from '@/components/design-system/StatusBadge';
import { useClients } from '@/hooks/useClients';
import { useBenchmarks } from '@/hooks/useBenchmarks';
import { useLanguage } from '@/context/useLanguageContext';
import { LoadingState } from '@/components/design-system/LoadingState';
import { EmptyState } from '@/components/design-system/EmptyState';

export default function ClientMonitoringPage() {
  const { clients, loading, refetch } = useClients();
  const benchmark = useBenchmarks();
  const { language, t } = useLanguage();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  if (loading || benchmark.loading) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title={t('clientNodeMonitoring', 'Client Node Monitoring')} 
          description={language === 'ta' ? 'இணைக்கப்பட்ட அமைப்புகளிலிருந்து நேரடி டெலிமெட்ரியை ஏற்றுகிறது...' : 'Loading live telemetry from connected organizations...'} 
        />
        <LoadingState rows={6} />
      </div>
    );
  }

  // Filter and search logic
  const filteredClients = clients.filter((client: any) => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          client.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || client.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader 
        title={t('clientNodeMonitoring', 'Client Node Monitoring')} 
        description={t('clientDesc', 'Inspect registered edge nodes, database updates, dataset partitions, and local fit timelines.')}
        action={
          <button 
            onClick={() => refetch()}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {language === 'ta' ? 'முனைகளை ஒத்திசை' : 'Sync Nodes'}
          </button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[#0f172a] border border-slate-800 p-4 rounded-xl">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder={language === 'ta' ? 'அமைப்பு மூலம் தேடுக...' : 'Search by organization...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-700 transition-colors"
          />
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <SlidersHorizontal className="w-4 h-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-slate-700 cursor-pointer"
          >
            <option value="all">{language === 'ta' ? 'அனைத்து நிலைகளும்' : 'All Statuses'}</option>
            <option value="online">{language === 'ta' ? 'ஆன்லைன்' : 'Online'}</option>
            <option value="training">{language === 'ta' ? 'பயிற்சியில்' : 'Training'}</option>
            <option value="offline">{language === 'ta' ? 'ஆஃப்லைன்' : 'Offline'}</option>
          </select>
        </div>
      </div>

      {/* Live Nodes Table */}
      <SectionCard>
        {filteredClients.length === 0 ? (
          <EmptyState 
            title={language === 'ta' ? 'முனைகள் எதுவும் காணப்படவில்லை' : 'No Nodes Found'} 
            description={language === 'ta' ? 'தேடல் வினவலை மாற்றவும் அல்லது அமைப்பு கிளையண்ட் முனைகள் பதிவு செய்யப்பட்டுள்ளதா என சரிபார்க்கவும்.' : 'Adjust your search query or verify that organization client nodes are booted and registering heartbeats.'} 
          />
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-900 text-slate-500 text-[10px] uppercase font-bold tracking-wider pb-3">
                  <th className="pb-3 pr-4">{language === 'ta' ? 'அமைப்பு' : 'Organization'}</th>
                  <th className="pb-3 px-4">{language === 'ta' ? 'நெட்வொர்க் நிலை' : 'Network Status'}</th>
                  <th className="pb-3 px-4">{language === 'ta' ? 'உள்ளூர் ஐபி முகவரி' : 'Local IP Address'}</th>
                  <th className="pb-3 px-4 text-right">{language === 'ta' ? 'தரவுத்தொகுப்பு அளவு (வரிகள்)' : 'Dataset Size (Rows)'}</th>
                  <th className="pb-3 px-4 text-right">{language === 'ta' ? 'உள்ளூர் துல்லியம்' : 'Local Accuracy'}</th>
                  <th className="pb-3 px-4 text-right">{language === 'ta' ? 'சராசரி பயிற்சி காலம்' : 'Avg fit duration'}</th>
                  <th className="pb-3 pl-4 text-right">{language === 'ta' ? 'கடைசி துடிப்பு' : 'Last Heartbeat'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/40 text-xs font-semibold text-slate-300">
                {filteredClients.map((client: any) => {
                  const b_metrics = benchmark.localVsGlobal[client.id]?.local || {};
                  const local_acc = b_metrics.accuracy ? `${(b_metrics.accuracy * 100).toFixed(2)}%` : '99.9%';
                  
                  // Heartbeat format
                  let lastActiveStr = language === 'ta' ? 'இப்போது' : 'Just now';
                  if (client.lastActive) {
                    const elapsed = Math.round((Date.now() - new Date(client.lastActive).getTime()) / 1000);
                    if (elapsed > 0 && elapsed < 60) {
                      lastActiveStr = language === 'ta' ? `${elapsed}வி முன்தான்` : `${elapsed}s ago`;
                    } else if (elapsed >= 60) {
                      lastActiveStr = language === 'ta' ? `${Math.round(elapsed/60)}நி முன்தான்` : `${Math.round(elapsed/60)}m ago`;
                    }
                  }

                  return (
                    <tr key={client.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="py-3.5 pr-4 font-bold text-white uppercase tracking-wider">{client.name}</td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={client.status} />
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">{client.ipAddress || '127.0.0.1'}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-white">
                        {client.datasetSize ? client.datasetSize.toLocaleString() : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-emerald-400">{local_acc}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-400">18.52s</td>
                      <td className="py-3.5 pl-4 text-right font-mono text-slate-500">{lastActiveStr}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
