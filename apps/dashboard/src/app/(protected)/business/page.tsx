"use client";

import React from 'react';
import { 
  Building2, 
  Database, 
  ShieldCheck, 
  HelpCircle, 
  Network, 
  Percent, 
  CheckCircle,
  FileCheck2,
  DollarSign
} from 'lucide-react';
import { PageHeader } from '@/components/design-system/PageHeader';
import { SectionCard } from '@/components/design-system/SectionCard';
import { useBusinessValue } from '@/hooks/useBusinessValue';
import { useLanguage } from '@/context/useLanguageContext';
import { LoadingState } from '@/components/design-system/LoadingState';
import { ProgressRing } from '@/components/design-system/ProgressRing';

export default function BusinessPage() {
  const { data, loading } = useBusinessValue();
  const { language, t } = useLanguage();

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title={t('businessTitle', 'Business Value & ROI')} 
          description={language === 'ta' ? 'கார்ப்பரேட் இணக்கம் மற்றும் உள்கட்டமைப்பு செலவு கணிப்புகளை ஏற்றுகிறது...' : 'Loading corporate compliance and infrastructure cost projections...'} 
        />
        <LoadingState rows={6} />
      </div>
    );
  }

  const comparisonItems = language === 'ta' ? [
    { metric: 'மூல தரவு பரிமாற்றம்', centralized: '100% மூல பாதுகாப்பு பதிவுகள் கிளவுட் களஞ்சியங்களில் பதிவேற்றப்பட வேண்டும்.', federated: '0% மூல நெட்வொர்க் டிராபிக் கிளையண்ட் ஃபயர்வால் பாதுகாப்புக்கு வெளியே செல்வதில்லை.', icon: Network },
    { metric: 'தனியுரிமை மற்றும் பாதுகாப்பு அபாயம்', centralized: 'அதிகம். மையப்படுத்தப்பட்ட தரவு அமைப்புகள் எளிதில் தாக்கப்படலாம்.', federated: 'மிகவும் குறைவு. மாதிரி புதுப்பிப்புகள் மட்டுமே அனுப்பப்படும்.', icon: ShieldCheck },
    { metric: 'ஒழுங்குமுறை இணக்கம்', centralized: 'சிக்கலான தணிக்கைகள் மற்றும் மூன்றாம் தரப்பு தரவுப் பரிமாற்றங்கள் தேவை.', federated: 'வடிவமைப்பிலேயே இணக்கமானது (GDPR, HIPAA, PCI-DSS, ISO 27001).', icon: FileCheck2 },
    { metric: 'தரவு உட்செலுத்துதல் சேமிப்பு செலவு', centralized: 'பெட்டாபைட் கணக்கான பதிவுகளைச் சேமிக்க பிரம்மாண்டமான கிளவுட் கட்டணம் தேவை.', federated: 'கிட்டத்தட்ட பூஜ்ஜியம். உள்ளூர் சேமிப்பகம் கிளையண்டுகளால் தக்கவைக்கப்படுகிறது.', icon: Database },
    { metric: 'தரவு உரிமை', centralized: 'மையப்படுத்தப்பட்ட ஹோஸ்ட் சேவை வழங்குநரிடம் ஒப்படைக்கப்படுகிறது.', federated: 'உருவாக்கிய நிறுவனத்தால் 100% உள்ளூரிலேயே தக்கவைக்கப்படுகிறது.', icon: Building2 }
  ] : [
    { metric: 'Raw Data Transfer', centralized: '100% of raw log files must be uploaded to cloud repositories.', federated: '0% raw network flows leave local client firewalls.', icon: Network },
    { metric: 'Privacy & Security Risk', centralized: 'High. Central data lakes create single targets for breaches.', federated: 'Extremely Low. Only model updates are transmitted.', icon: ShieldCheck },
    { metric: 'Regulatory Compliance', centralized: 'Complex audits. Involves third-party cross-border transfers.', federated: 'Compliant-by-design (GDPR, HIPAA, PCI-DSS, ISO 27001).', icon: FileCheck2 },
    { metric: 'Ingestion Storage Cost', centralized: 'Huge cloud disk ingestion bills to host petabytes of logs.', federated: 'Virtually Zero. Local storage is retained by clients.', icon: Database },
    { metric: 'Data Ownership', centralized: 'Relinquished to centralized host aggregation provider.', federated: 'Retained 100% locally by the creating organization.', icon: Building2 }
  ];

  const savingsDesc = language === 'ta'
    ? `மூலப் பாதுகாப்புப் பதிவுகளுக்குப் பதிலாகப் பொதுவான மாதிரி அளவுருக்களை மட்டுமே மாற்றுவதன் மூலம், நெட்வொர்க் பரிமாற்றம் ${data.privacy_impact.raw_dataset_size_gb} GB-லிருந்து ${data.privacy_impact.total_model_update_size_kb} KB ஆகக் குறைகிறது.`
    : `By transmitting only abstract model parameters rather than uncompressed security logs, network transmission drops from ${data.privacy_impact.raw_dataset_size_gb} GB to ${data.privacy_impact.total_model_update_size_kb} KB.`;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader 
        title={t('businessTitle', 'Business Value & ROI')} 
        description={t('businessDesc', 'Verify how the FedCore platform reduces cloud database ingestion costs, preserves privacy, and aligns with global security regulations.')} 
      />

      {/* ROI Executive Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SectionCard 
          title={t('ingestionSavings', 'Executive Ingestion Savings')} 
          description={language === 'ta' ? 'ஒப்பீட்டு நெட்வொர்க் டிராபிக் மேல்நிலை.' : 'Comparative network traffic overhead.'} 
          className="md:col-span-2 flex flex-col justify-between"
        >
          <div className="flex items-center gap-6">
            <ProgressRing percentage={data.privacy_impact.bandwidth_reduction_percentage} size={90} strokeWidth={8} color="stroke-emerald-400" />
            <div>
              <h4 className="text-xl font-bold text-white">
                {language === 'ta' ? '99.99% அலைவரிசை குறைப்பு' : '99.99% Bandwidth Reduction'}
              </h4>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                {savingsDesc}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 border-t border-slate-900 pt-4">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                {language === 'ta' ? 'மூல தரவுத்தொகுப்பு அளவு' : 'Raw Dataset Size'}
              </span>
              <span className="text-white text-sm font-bold mt-0.5 block">{data.privacy_impact.raw_dataset_size_gb} GB</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                {language === 'ta' ? 'மாதிரி புதுப்பிப்பு அளவு' : 'Update Size'}
              </span>
              <span className="text-indigo-400 text-sm font-extrabold mt-0.5 block">{data.privacy_impact.total_model_update_size_kb} KB</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                {language === 'ta' ? 'சேமிக்கப்பட்ட அலைவரிசை' : 'Total Bandwidth Saved'}
              </span>
              <span className="text-emerald-400 text-sm font-bold mt-0.5 block">2.279 GB</span>
            </div>
          </div>
        </SectionCard>

        <SectionCard 
          title={t('costProjection', 'Cost Projection')} 
          description={language === 'ta' ? 'மதிப்பிடப்பட்ட மைய சேமிப்பக சேமிப்பு கட்டண ஒப்பீடு.' : 'Estimated central storage storage billing comparison.'}
        >
          <div className="space-y-4">
            <div className="border-b border-slate-900 pb-3">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                {language === 'ta' ? '4 நிறுவனங்கள்' : '4 Organizations'}
              </span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-slate-400">{language === 'ta' ? 'மையப்படுத்தப்பட்டது: 9.12 GB' : 'Centralized: 9.12 GB'}</span>
                <span className="text-xs font-bold text-emerald-400">{language === 'ta' ? 'கூட்டு AI: 0.16 KB' : 'Federated: 0.16 KB'}</span>
              </div>
            </div>
            <div className="border-b border-slate-900 pb-3">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                {language === 'ta' ? '25 நிறுவனங்கள்' : '25 Organizations'}
              </span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-slate-400">{language === 'ta' ? 'மையப்படுத்தப்பட்டது: 57.00 GB' : 'Centralized: 57.00 GB'}</span>
                <span className="text-xs font-bold text-emerald-400">{language === 'ta' ? 'கூட்டு AI: 1.00 KB' : 'Federated: 1.00 KB'}</span>
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                {language === 'ta' ? '100 நிறுவனங்கள்' : '100 Organizations'}
              </span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-slate-400">{language === 'ta' ? 'மையப்படுத்தப்பட்டது: 228.00 GB' : 'Centralized: 228.00 GB'}</span>
                <span className="text-xs font-bold text-emerald-400">{language === 'ta' ? 'கூட்டு AI: 4.00 KB' : 'Federated: 4.00 KB'}</span>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Centralized vs Federated Comparison Table */}
      <SectionCard 
        title={t('technicalComparison', 'Technical & Operational Comparison')} 
        description={language === 'ta' ? 'மையப்படுத்தப்பட்ட AI மாதிரி பயிற்சிக்கும் கூட்டு மாதிரி புதுப்பிப்புகளுக்கும் இடையிலான விரிவான ஒப்பீடு.' : 'Detailed comparison between centralized AI model training and federated gradient updates.'}
      >
        <div className="overflow-x-auto w-full">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-900 text-slate-500 text-[10px] uppercase font-bold tracking-wider pb-3">
                <th className="pb-3 pr-4">{language === 'ta' ? 'மதிப்பீட்டு அளவீடு' : 'Evaluation Metric'}</th>
                <th className="pb-3 px-4">{language === 'ta' ? 'மையப்படுத்தப்பட்ட AI' : 'Centralized AI'}</th>
                <th className="pb-3 pl-4">{language === 'ta' ? 'கூட்டு AI (FedSOC)' : 'FedSOC Federated AI'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/40 text-xs font-semibold text-slate-300">
              {comparisonItems.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <tr key={idx} className="hover:bg-slate-900/30 transition-colors">
                    <td className="py-3.5 pr-4 flex items-center gap-2 text-white font-bold uppercase tracking-wider">
                      <Icon className="w-4 h-4 text-indigo-400 shrink-0" />
                      {item.metric}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 leading-relaxed">{item.centralized}</td>
                    <td className="py-3.5 pl-4 text-white font-bold leading-relaxed">{item.federated}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Regulatory Compliance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-white text-xs font-bold uppercase tracking-wider">GDPR</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            {language === 'ta' 
              ? 'மூல நெட்வொர்க் டிராபிக் தரவை உள்ளூரிலேயே வைத்திருப்பதன் மூலம் பிரிவு 25 (வடிவமைப்பு தனியுரிமை) விதியை நிறைவு செய்கிறது.' 
              : 'Satisfies Article 25 (Privacy-by-Design) by keeping raw network traffic flows localized inside the EU firewalls.'}
          </p>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-white text-xs font-bold uppercase tracking-wider">HIPAA</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            {language === 'ta'
              ? 'பாதுகாக்கப்பட்ட சுகாதாரத் தகவல்கள் (PHI) எதுவும் வெளியில் நகலெடுக்கப்படுவதில்லை, இதனால் விதிமுறைகள் முழுமையாகப் பேணப்படுகின்றன.'
              : 'No Protected Health Information (PHI) is copied off-site, satisfying healthcare confidentiality standards.'}
          </p>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-white text-xs font-bold uppercase tracking-wider">PCI-DSS</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            {language === 'ta'
              ? 'தேவை 3-க்கு இணங்குகிறது. கட்டண நெட்வொர்க்குகள் முதன்மை தரவுத்தளங்களுக்கு மூலத் தரவை அனுப்பாமல் உள்ளூரிலேயே பயிற்சியை இயக்குகின்றன.'
              : 'Requirement 3 compliant. Payment networks run training locally without copying raw log flows to secondary databases.'}
          </p>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-white text-xs font-bold uppercase tracking-wider">ISO 27001</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            {language === 'ta'
              ? 'கட்டுப்பாடு A.8.11 (தரவு மறைத்தல்/தனியுரிமை) விதிகளின்படி உலகளாவிய எடையைக் கணித ரீதியாக மட்டுமே திரட்டுகிறது.'
              : 'Satisfies Control A.8.11 (Data Masking/Privacy) by enforcing mathematically aggregated parameter transactions.'}
          </p>
        </div>
      </div>
    </div>
  );
}
