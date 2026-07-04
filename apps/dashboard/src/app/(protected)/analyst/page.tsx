"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/useAuthContext';
import { useDemo } from '@/context/useDemoContext';
import { 
  ShieldAlert, 
  Terminal, 
  Download, 
  Layers, 
  Activity, 
  CheckCircle,
  FileText,
  AlertTriangle,
  Play,
  CheckSquare,
  Square,
  HelpCircle,
  Server
} from 'lucide-react';
import { PageHeader } from '@/components/design-system/PageHeader';
import { SectionCard } from '@/components/design-system/SectionCard';
import { StatusBadge } from '@/components/design-system/StatusBadge';
import { ProgressRing } from '@/components/design-system/ProgressRing';
import { InfoTooltip } from '@/components/design-system/InfoTooltip';
import { LoadingState } from '@/components/design-system/LoadingState';

export default function AIAnalystPage() {
  const { role } = useAuth();
  const { isDemoMode, getStepData, currentStep } = useDemo();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSimulateModal, setShowSimulateModal] = useState(false);

  // Simulation form state
  const [simOrg, setSimOrg] = useState('Nova-Bank-Node');
  const [simAttack, setSimAttack] = useState('DoS');
  const [simConfidence, setSimConfidence] = useState('0.985');
  const [simProvider, setSimProvider] = useState('ollama');

  // ── Live mode: fetch from API ──────────────────────────────────
  useEffect(() => {
    if (isDemoMode) return;
    const fetchIncidents = async () => {
      try {
        const res = await fetch('/api/incidents');
        if (res.ok) {
          const data = await res.json();
          setIncidents(data);
          if (data.length > 0) setSelectedIncident(data[0]);
        }
      } catch (error) {
        console.error('Error fetching incident reports:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchIncidents();
  }, [isDemoMode]);

  // ── Demo mode: load incidents from scenario JSON on every step ──
  useEffect(() => {
    if (!isDemoMode) return;
    const stepData = getStepData(currentStep);
    const demoIncidents: any[] = stepData?.incidents ?? [];
    setIncidents(demoIncidents);
    if (demoIncidents.length > 0) {
      setSelectedIncident(demoIncidents[0]);
    } else {
      setSelectedIncident(null);
    }
    setLoading(false);
  }, [isDemoMode, currentStep, getStepData]);

  const handleSimulate = async () => {
    setSubmitting(true);
    try {
      let features: Record<string,number> = { count: 512, srv_count: 512, serror_rate: 0.2 };
      let evidence = ['count = 512 (Threshold: 120)', 'srv_count = 512 (Threshold: 100)'];
      if (simAttack === 'PortScan') {
        features = { count: 80, srv_count: 180, serror_rate: 0.05 };
        evidence = ['srv_count = 180 (Threshold: 50)', 'destination port scan pattern'];
      } else if (simAttack === 'BruteForce') {
        features = { count: 320, srv_count: 5, serror_rate: 0.8 };
        evidence = ['serror_rate = 0.8 (Threshold: 0.1)', 'high SSH socket connection failure rates'];
      } else if (simAttack === 'Infiltration') {
        features = { count: 45, srv_count: 12, serror_rate: 0.01, dst_host_count: 220 };
        evidence = ['dst_host_count = 220 (Threshold: 30)', 'lateral movement signature detected'];
      }

      // ── Demo Mode: inject a mock incident locally (no Ollama needed) ──
      if (isDemoMode) {
        const mockIncident = {
          incident_id: `INC-DEMO-${Date.now()}`,
          timestamp: new Date().toISOString(),
          organization: simOrg,
          predicted_attack: simAttack,
          confidence: parseFloat(simConfidence),
          severity: parseFloat(simConfidence) > 0.9 ? 'CRITICAL' : 'HIGH',
          executive_summary: `A ${simAttack} attack pattern was detected on ${simOrg}. The federated model flagged this with ${Math.round(parseFloat(simConfidence)*100)}% confidence based on volumetric anomaly features. Immediate investigation is advised.`,
          technical_summary: `The local XGBoost model at ${simOrg} classified inbound traffic as ${simAttack}. Key features exceeded operational thresholds by 4.3σ. Global model aggregation confirmed cross-silo consistency.`,
          mitre_attack: simAttack === 'DoS' ? ['T1498','T1499'] : simAttack === 'PortScan' ? ['T1046'] : simAttack === 'BruteForce' ? ['T1110'] : ['T1078'],
          kill_chain_phase: simAttack === 'PortScan' ? 'Reconnaissance' : simAttack === 'DoS' ? 'Impact' : 'Lateral Movement',
          containment_steps: [
            `Isolate ${simOrg} edge ingress firewall rules immediately`,
            'Block source IP range at perimeter gateway',
            'Enable rate-limiting on affected service endpoints',
            'Capture full packet trace for forensic analysis'
          ],
          recommended_actions: [
            'Notify CISO and incident response team',
            'Escalate to Tier 2 SOC analyst for validation',
            'Submit threat intelligence to ISAC sharing platform'
          ],
          explainability: {
            top_contributing_features: Object.keys(features),
            feature_importance: features,
            supporting_evidence: evidence,
            evidence_summary: `Volumetric feature counts exceed normal operating levels for ${simOrg}.`,
            prediction_probability: parseFloat(simConfidence)
          },
          federated_model_version: 'v2.3.1',
          global_checkpoint_version: 'round_3.pkl',
          llm_provider: 'Demo Mode',
          llm_model: 'Simulated Report'
        };
        setIncidents(prev => [mockIncident, ...prev]);
        setSelectedIncident(mockIncident);
        setShowSimulateModal(false);
        setSubmitting(false);
        return;
      }

      // ── Live Mode: call real API with Ollama ──
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization: simOrg,
          predicted_attack: simAttack,
          confidence: parseFloat(simConfidence),
          provider: simProvider,
          top_contributing_features: Object.keys(features),
          feature_importance: features,
          supporting_evidence: evidence,
          evidence_summary: `Volumetric feature counts exceed normal system operating levels.`
        })
      });
      if (res.ok) {
        const newIncident = await res.json();
        setIncidents(prev => [newIncident, ...prev]);
        setSelectedIncident(newIncident);
        setShowSimulateModal(false);
        await fetch('/api/audit-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_role: role, action: 'SIMULATE_ATTACK', target: `Simulated ${simAttack} for ${simOrg}` })
        });
      }
    } catch (err) {
      console.error('Simulation trigger error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const exportJSON = (incident: any) => {
    fetch('/api/audit-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_role: role,
        action: 'EXPORT_JSON',
        target: `Exported incident report ${incident.incident_id} as JSON`
      })
    }).catch(() => null);

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(incident, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `incident_${incident.incident_id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const exportMarkdown = (incident: any) => {
    fetch('/api/audit-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_role: role,
        action: 'EXPORT_MARKDOWN',
        target: `Exported incident report ${incident.incident_id} as Markdown`
      })
    }).catch(() => null);

    const md = `# FedSOC Incident Intelligence Report: ${incident.incident_id}
Generated on: ${new Date(incident.timestamp).toLocaleString()}
Client Node: ${incident.organization}
Severity: ${incident.severity}

## 1. Executive Summary
${incident.executive_summary}

## 2. Technical Summary
${incident.technical_summary}

## 3. Machine Learning Explainability & Feature Contribution
- Predicted Class: ${incident.predicted_attack} (Confidence: ${Math.round(incident.confidence * 100)}%)
- Evidence Summary: ${incident.explainability?.evidence_summary || 'N/A'}
- Contributing Features: ${incident.explainability?.top_contributing_features?.join(', ') || 'N/A'}

## 4. Threat Mapping
- MITRE ATT&CK Reference: ${incident.mitre_attack?.join(', ') || 'N/A'}
- Cyber Kill Chain Phase: ${incident.kill_chain_phase}

## 5. Containment & Remediation Checklist
${incident.containment_steps?.map((step: string) => `- [ ] ${step}`).join('\n')}
${incident.recommended_actions?.map((act: string) => `- [ ] ${act}`).join('\n')}

## 6. Governance Metadata
- Federated Model Version: ${incident.federated_model_version}
- Checkpoint: ${incident.global_checkpoint_version}
- LLM Evaluator: ${incident.llm_provider} (${incident.llm_model})
`;

    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(md);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `incident_${incident.incident_id}.md`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="AI SOC Analyst Workspace" description="Initializing intelligent threat triaging agent..." />
        <LoadingState rows={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader 
        title="AI SOC Analyst Workspace" 
        description="Transforming federated machine learning classification vectors into structured, compliance-mapped threat summaries."
        action={
          role !== 'viewer' ? (
            <button
              onClick={() => setShowSimulateModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-md"
            >
              <Play className="w-3.5 h-3.5" />
              Simulate Attack Detection
            </button>
          ) : null
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Incidents List */}
        <div className="space-y-4">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Incident Logs</span>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {/* Demo Mode empty state hint */}
            {isDemoMode && incidents.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-10 px-4 border border-dashed border-slate-800 rounded-xl text-center">
                <ShieldAlert className="w-8 h-8 text-slate-600" />
                <div>
                  <p className="text-xs font-bold text-slate-400">No Incidents Yet</p>
                  <p className="text-[10px] text-slate-600 mt-1 leading-relaxed">
                    In Demo Mode, advance to <span className="text-indigo-400 font-bold">Step 5</span> using the ☰ panel to trigger an attack alert — or click <span className="text-indigo-400 font-bold">"Simulate Attack Detection"</span> above.
                  </p>
                </div>
              </div>
            )}
            {incidents.map((inc) => {
              const isSelected = selectedIncident?.incident_id === inc.incident_id;
              const severityColors = 
                inc.severity === 'CRITICAL' ? 'border-rose-500/30 bg-rose-500/5 text-rose-400' :
                inc.severity === 'HIGH' ? 'border-amber-500/30 bg-amber-500/5 text-amber-400' :
                'border-slate-800 bg-slate-900/30 text-slate-300';
              return (
                <div
                  key={inc.incident_id}
                  onClick={() => setSelectedIncident(inc)}
                  className={`border rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                    isSelected 
                      ? 'border-indigo-500 bg-indigo-500/5' 
                      : 'border-slate-800 bg-[#0f172a] hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-slate-500 font-mono">{inc.incident_id}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold border ${severityColors}`}>
                      {inc.severity}
                    </span>
                  </div>
                  <h4 className="text-white text-xs font-bold">{inc.predicted_attack} Attack Classified</h4>
                  <div className="flex items-center justify-between mt-3 text-[10px] text-slate-400 font-semibold">
                    <span>{inc.organization}</span>
                    <span className="text-emerald-400">{Math.round(inc.confidence * 100)}% Confidence</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column: Active Detail Panel */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedIncident ? (
            <div className="flex flex-col items-center justify-center p-12 border border-dashed border-slate-800 rounded-xl text-center min-h-[300px]">
              <ShieldAlert className="w-10 h-10 text-slate-500 mb-3" />
              <h5 className="text-sm font-bold text-white tracking-tight">No incident selected</h5>
              <p className="text-slate-400 text-xs mt-1 max-w-xs leading-relaxed">
                Click on a threat detection log in the left panel to inspect detailed security analysis report.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Toolbar */}
              <div className="flex items-center justify-between bg-[#0f172a] border border-slate-800 p-3.5 rounded-xl">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Active Analysis Target:</span>
                  <h3 className="text-white font-bold text-sm mt-0.5">{selectedIncident.incident_id}</h3>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => exportJSON(selectedIncident)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg text-xs font-semibold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    JSON
                  </button>
                  <button 
                    onClick={() => exportMarkdown(selectedIncident)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg text-xs font-semibold"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Markdown
                  </button>
                </div>
              </div>

              {/* Severity & Confidence Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <SectionCard title="Assessment Indicators" description="General status of threat metrics.">
                  <div className="flex items-center gap-4 py-2">
                    <ProgressRing percentage={selectedIncident.confidence * 100} size={70} strokeWidth={6} color="stroke-indigo-500" />
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block uppercase">Calculated Severity</span>
                      <span className={`text-sm font-extrabold uppercase mt-1 block ${
                        selectedIncident.severity === 'CRITICAL' ? 'text-rose-500' :
                        selectedIncident.severity === 'HIGH' ? 'text-amber-500' : 'text-slate-300'
                      }`}>
                        {selectedIncident.severity}
                      </span>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="Silo Environment" description="Where the threat was reported.">
                  <div className="space-y-1.5 py-2">
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold block uppercase">Organization</span>
                      <span className="text-white text-xs font-bold block">{selectedIncident.organization}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold block uppercase">Kill Chain Phase</span>
                      <span className="text-indigo-400 text-xs font-bold block">{selectedIncident.kill_chain_phase}</span>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="Impacted System Assets" description="Silo internal components.">
                  <div className="space-y-1 py-1 max-h-16 overflow-y-auto">
                    {selectedIncident.affected_assets?.map((asset: string, idx: number) => (
                      <span key={idx} className="block text-[10px] text-slate-300 font-semibold bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                        {asset}
                      </span>
                    ))}
                  </div>
                </SectionCard>
              </div>

              {/* Explanatory Summaries */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SectionCard title="Executive Summary" description="High-level CISO management brief.">
                  <p className="text-slate-300 text-xs leading-relaxed">{selectedIncident.executive_summary}</p>
                </SectionCard>

                <SectionCard title="Technical Investigation Brief" description="Developer logs and traffic pattern analysis.">
                  <p className="text-slate-300 text-xs leading-relaxed">{selectedIncident.technical_summary}</p>
                </SectionCard>
              </div>

              {/* Explainability Section */}
              {selectedIncident.explainability && (
                <SectionCard title="Machine Learning Explainability & Feature Contribution" description="Audit parameters tracing feature weights in the federated model.">
                  <div className="space-y-4">
                    <div className="p-3 bg-slate-950 border border-slate-900 rounded-lg">
                      <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block mb-2">Supporting Evidence</span>
                      <ul className="list-disc list-inside text-slate-300 text-xs space-y-1">
                        {selectedIncident.explainability.supporting_evidence?.map((evidence: string, idx: number) => (
                          <li key={idx} className="font-mono">{evidence}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2">Contributing Features Weights</span>
                        <div className="space-y-2">
                          {Object.entries(selectedIncident.explainability.feature_importance || {}).map(([key, val]: any) => (
                            <div key={key} className="space-y-1">
                              <div className="flex justify-between text-[10px] font-mono">
                                <span className="text-slate-400">{key}</span>
                                <span className="text-white font-bold">{val}</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, val * 100)}%` }}></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col justify-between p-3 bg-slate-950 border border-slate-900 rounded-lg">
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Explainability Evidence Summary</span>
                          <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">{selectedIncident.explainability.evidence_summary}</p>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-4 border-t border-slate-900 pt-2 flex justify-between font-semibold">
                          <span>Classifier Prob Score:</span>
                          <span className="text-indigo-400 font-bold">{(selectedIncident.explainability.prediction_probability * 100).toFixed(2)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              )}

              {/* MITRE ATT&CK & Remediation Checklists */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SectionCard title="Mitigation Action Checklist" description="Recommended operational responses.">
                  <div className="space-y-2 max-h-36 overflow-y-auto">
                    {selectedIncident.containment_steps?.map((step: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 text-xs">
                        <Square className="w-4 h-4 text-rose-500 shrink-0 mt-0.5 cursor-pointer" />
                        <span className="text-slate-300 font-semibold">{step}</span>
                      </div>
                    ))}
                    {selectedIncident.recommended_actions?.map((action: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 text-xs">
                        <Square className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5 cursor-pointer" />
                        <span className="text-slate-300">{action}</span>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard title="MITRE ATT&CK Threat Mapping" description="Mappings based on predicted attack variables.">
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {selectedIncident.mitre_attack?.map((tech: string, idx: number) => (
                        <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-amber-500/20 bg-amber-500/5 text-amber-400">
                          {tech}
                        </span>
                      ))}
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold block uppercase mb-1">Citations & References</span>
                      <div className="space-y-1">
                        {selectedIncident.references?.map((ref: string, idx: number) => (
                          <a key={idx} href={ref} target="_blank" rel="noopener noreferrer" className="block text-[10px] text-indigo-400 hover:underline truncate">
                            {ref}
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </div>

              {/* Governance & Traceability Metadata */}
              <SectionCard title="Compliance Traceability Metadata" description="Audit parameters linking predictions to training snapshots.">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px] font-mono">
                  <div>
                    <span className="text-slate-500 block">Model Version</span>
                    <span className="text-white font-bold">{selectedIncident.federated_model_version}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Checkpoint File</span>
                    <span className="text-white font-bold">{selectedIncident.global_checkpoint_version}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">LLM Evaluator</span>
                    <span className="text-indigo-400 font-bold">{selectedIncident.llm_provider} ({selectedIncident.llm_model})</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Prompt version</span>
                    <span className="text-white font-bold">{selectedIncident.prompt_version}</span>
                  </div>
                </div>
              </SectionCard>
            </div>
          )}
        </div>
      </div>

      {/* Simulate Modal */}
      {showSimulateModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl relative">
            <h3 className="text-lg font-bold text-white tracking-tight mb-4">Simulate Attack Detection</h3>
            
            <div className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1.5">Reporting Organization Node</label>
                <select
                  value={simOrg}
                  onChange={(e) => setSimOrg(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                >
                  <option value="Nova-Bank-Node">Nova-Bank-Node</option>
                  <option value="Apex-Retail-POS">Apex-Retail-POS</option>
                  <option value="Boston-Central-Hospital">Boston-Central-Hospital</option>
                  <option value="Nova-Telecom-Node">Nova-Telecom-Node</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1.5">Predicted Attack Label</label>
                <select
                  value={simAttack}
                  onChange={(e) => setSimAttack(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                >
                  <option value="DoS">DoS</option>
                  <option value="PortScan">PortScan</option>
                  <option value="BruteForce">BruteForce</option>
                  <option value="Infiltration">Infiltration</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1.5">Model Confidence (0.0 - 1.0)</label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={simConfidence}
                  onChange={(e) => setSimConfidence(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1.5">AI LLM Provider</label>
                <select
                  value={simProvider}
                  onChange={(e) => setSimProvider(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                >
                  <option value="ollama">Ollama (Local Llama3.1)</option>
                  <option value="openai">OpenAI (GPT-4o-mini)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 border-t border-slate-900 pt-4">
              <button
                onClick={() => setShowSimulateModal(false)}
                disabled={submitting}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 rounded-lg text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSimulate}
                disabled={submitting}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
              >
                {submitting ? 'Analyzing...' : 'Trigger Analysis'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
