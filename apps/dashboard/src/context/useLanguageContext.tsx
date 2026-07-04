"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ta';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const dictionary: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    overview: 'Overview',
    aiAnalyst: 'AI SOC Analyst',
    clientMonitoring: 'Client Monitoring',
    technicalBenchmark: 'Technical Benchmark',
    globalCheckpoints: 'Global Checkpoints',
    businessValue: 'Business Value',
    systemHealth: 'System Health',
    
    // Header & Common
    systemState: 'System State',
    flTrainingActive: 'FL Training Active',
    idle: 'Idle',
    coreHealth: 'Core Health',
    secure: 'Secure',
    version: 'Version',
    
    // Overview / Command Center
    execCommandCenter: 'Executive Command Center',
    overviewDesc: 'Real-time performance metrics, compliance state, and federated learning timeline aggregates.',
    globalAccuracy: 'Global Model Accuracy',
    globalLoss: 'Global Model Loss',
    activeClients: 'Active Client Nodes',
    trainingStatus: 'Training Status',
    recentRounds: 'Recent Training Rounds',
    
    // SOC Analyst
    socAnalystWorkspace: 'AI SOC Analyst Workspace',
    socDesc: 'Transforming federated machine learning classification vectors into structured, compliance-mapped threat summaries.',
    simulateAttack: 'Simulate Attack Detection',
    incidentLogs: 'Incident Logs',
    executiveSummary: 'Executive Summary',
    technicalSummary: 'Technical Summary',
    remediationContainment: 'Containment & Remediation Checklist',
    mitreMapping: 'MITRE ATT&CK Mapping',
    explainability: 'Explainability & Feature Contributions',
    
    // Clients
    clientNodeMonitoring: 'Client Node Monitoring',
    clientDesc: 'Observe individual node learning progress, active training loops, and local dataset sizes.',
    clientName: 'Client Name',
    clientType: 'Type',
    clientStatus: 'Status',
    datasetSize: 'Dataset Size',
    lastActive: 'Last Active',
    
    // Benchmarks
    benchmarkTitle: 'Technical Benchmark Dashboard',
    benchmarkDesc: 'A complete technical evaluation verifying local baselines convergence, parameters drift, and bandwidth costs.',
    localVsGlobalAccuracy: 'Local Model vs Global Federated Model Accuracy',
    globalConvergence: 'Global Model Convergence Curves',
    clientDrift: 'Client Model Drift (L2 Weight Divergence)',
    bandwidthPerRound: 'Transmitted Bandwidth per Round',
    scalabilityProjection: 'Scalability Projection: Round Duration',
    scalabilityOverhead: 'Scalability Overhead Estimates',
    
    // Checkpoints
    checkpointRegistry: 'Global Checkpoint Registry',
    checkpointDesc: 'Inspect consolidated model parameters version history, file sizes, and download configuration files.',
    activeGlobalModel: 'Active Global Model',
    securityStatus: 'Security Status',
    checkpointArchiveLogs: 'Checkpoint Archive Logs',
    
    // Business Value
    businessTitle: 'Business Value & ROI',
    businessDesc: 'Verify how the FedCore platform reduces cloud database ingestion costs, preserves privacy, and aligns with global security regulations.',
    ingestionSavings: 'Executive Ingestion Savings',
    costProjection: 'Cost Projection',
    technicalComparison: 'Technical & Operational Comparison',
    regulatoryCompliance: 'Regulatory Compliance',
    
    // Health
    healthTitle: 'System Health & Infrastructure',
    healthDesc: 'Monitor real-time network latency, database connection status, and service logs.',
    nodeStatus: 'Node Status',
    apiHealth: 'API Health Checks',
    serviceLogs: 'Service Logs'
  },
  ta: {
    // Navigation
    overview: 'பொதுப்பார்வை',
    aiAnalyst: 'AI SOC ஆய்வாளர்',
    clientMonitoring: 'கிளையண்ட் கண்காணிப்பு',
    technicalBenchmark: 'தொழில்நுட்ப ஒப்பீடு',
    globalCheckpoints: 'உலகளாவிய சேமிப்பு புள்ளிகள்',
    businessValue: 'வணிக மதிப்பு & ROI',
    systemHealth: 'கணினி ஆரோக்கியம்',
    
    // Header & Common
    systemState: 'கணினி நிலை',
    flTrainingActive: 'கூட்டுப் பயிற்சி செயலில் உள்ளது',
    idle: 'செயலற்றது',
    coreHealth: 'முக்கிய ஆரோக்கியம்',
    secure: 'பாதுகாப்பானது',
    version: 'பதிப்பு',
    
    // Overview / Command Center
    execCommandCenter: 'நிர்வாகக் கட்டுப்பாட்டு மையம்',
    overviewDesc: 'நிகழ்நேர செயல்திறன் அளவீடுகள், இணக்க நிலை மற்றும் கூட்டு கற்றல் காலவரிசை மொத்தங்கள்.',
    globalAccuracy: 'உலகளாவிய மாதிரி துல்லியம்',
    globalLoss: 'உலகளாவிய மாதிரி இழப்பு',
    activeClients: 'செயலில் உள்ள கிளையண்ட் கணினிகள்',
    trainingStatus: 'பயிற்சி நிலை',
    recentRounds: 'சமீபத்திய பயிற்சி சுற்றுகள்',
    
    // SOC Analyst
    socAnalystWorkspace: 'AI SOC ஆய்வாளர் பணிவெளி',
    socDesc: 'கூட்டு இயந்திர கற்றல் வகைப்பாடு திசையன்களை கட்டமைக்கப்பட்ட, இணக்க-வரைபட அச்சுறுத்தல் சுருக்கங்களாக மாற்றுதல்.',
    simulateAttack: 'தாக்குதல் கண்டறிதலை உருவகப்படுத்துக',
    incidentLogs: 'சம்பவப் பதிவுகள்',
    executiveSummary: 'நிர்வாகச் சுருக்கம்',
    technicalSummary: 'தொழில்நுட்பச் சுருக்கம்',
    remediationContainment: 'கட்டுப்படுத்துதல் மற்றும் சரிசெய்தல் சரிபார்ப்புப் பட்டியல்',
    mitreMapping: 'MITRE ATT&CK வரைபடம்',
    explainability: 'விளக்கக்கூடிய தன்மை மற்றும் அம்ச பங்களிப்புகள்',
    
    // Clients
    clientNodeMonitoring: 'கிளையண்ட் முனை கண்காணிப்பு',
    clientDesc: 'தனிப்பட்ட முனை கற்றல் முன்னேற்றம், செயலில் உள்ள பயிற்சி சுழல்கள் மற்றும் உள்ளூர் தரவுத்தொகுப்பு அளவுகளைக் கவனிக்கவும்.',
    clientName: 'கிளையண்ட் பெயர்',
    clientType: 'வகை',
    clientStatus: 'நிலை',
    datasetSize: 'தரவுத்தொகுப்பு அளவு',
    lastActive: 'கடைசியாக செயல்பட்டது',
    
    // Benchmarks
    benchmarkTitle: 'தொழில்நுட்ப ஒப்பீட்டு டாஷ்போர்டு',
    benchmarkDesc: 'உள்ளூர் அடிப்படை கோடுகளின் குவிப்பு, அளவுருக்கள் நகர்வு மற்றும் அலைவரிசை செலவுகளைச் சரிபார்க்கும் முழுமையான தொழில்நுட்ப மதிப்பீடு.',
    localVsGlobalAccuracy: 'உள்ளூர் மாதிரி எதிர் உலகளாவிய கூட்டு மாதிரி துல்லியம்',
    globalConvergence: 'உலகளாவிய மாதிரி குவிவு வளைவுகள்',
    clientDrift: 'கிளையண்ட் மாதிரி நகர்வு (L2 எடை வேறுபாடு)',
    bandwidthPerRound: 'ஒரு சுற்றுக்கு அனுப்பப்பட்ட அலைவரிசை',
    scalabilityProjection: 'அளவிடுதல் கணிப்பு: சுற்று காலம்',
    scalabilityOverhead: 'அளவிடுதல் மேல்நிலை மதிப்பீடுகள்',
    
    // Checkpoints
    checkpointRegistry: 'உலகளாவிய சேமிப்பு புள்ளி பதிவகம்',
    checkpointDesc: 'ஒருங்கிணைந்த மாதிரி அளவுருக்கள் பதிப்பு வரலாறு, கோப்பு அளவுகள் ஆகியவற்றை ஆராய்ந்து கட்டமைப்பு கோப்புகளைப் பதிவிறக்கவும்.',
    activeGlobalModel: 'செயலில் உள்ள உலகளாவிய மாதிரி',
    securityStatus: 'பாதுகாப்பு நிலை',
    checkpointArchiveLogs: 'சேமிப்பு புள்ளி காப்பகப் பதிவுகள்',
    
    // Business Value
    businessTitle: 'வணிக மதிப்பு & முதலீட்டின் மீதான லாபம் (ROI)',
    businessDesc: 'FedCore தளம் எவ்வாறு கிளவுட் தரவுத்தள உட்செலுத்துதல் செலவைக் குறைக்கிறது, தனியுரிமையைப் பாதுகாக்கிறது மற்றும் உலகளாவிய பாதுகாப்பு விதிமுறைகளுடன் ஒத்துப்போகிறது என்பதைச் சரிபார்க்கவும்.',
    ingestionSavings: 'நிர்வாக உட்செலுத்துதல் சேமிப்பு',
    costProjection: 'செலவு கணிப்பு',
    technicalComparison: 'தொழில்நுட்ப மற்றும் செயல்பாட்டு ஒப்பீடு',
    regulatoryCompliance: 'ஒழுங்குமுறை இணக்கம்',
    
    // Health
    healthTitle: 'கணினி ஆரோக்கியம் & உள்கட்டமைப்பு',
    healthDesc: 'நிகழ்நேர நெட்வொர்க் தாமதம், தரவுத்தள இணைப்பு நிலை மற்றும் சேவைப் பதிவுகளைக் கண்காணிக்கவும்.',
    nodeStatus: 'முனை நிலை',
    apiHealth: 'API ஆரோக்கிய சோதனைகள்',
    serviceLogs: 'சேவை பதிவுகள்'
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const savedLang = localStorage.getItem('fedsoc_language') as Language;
    if (savedLang === 'en' || savedLang === 'ta') {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('fedsoc_language', lang);
  };

  const t = (key: string, fallback?: string): string => {
    return dictionary[language]?.[key] ?? fallback ?? key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
