import { createClient } from '@supabase/supabase-js';
import { FLNode, FLRoundInfo } from '@fedsoc/shared';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Mock database store for local development without Supabase credentials
class MockSupabaseClient {
  private nodes: Map<string, FLNode> = new Map();
  private rounds: FLRoundInfo[] = [];
  private incidentReports: any[] = [];
  private aiEvaluations: any[] = [];
  private promptVersions: any[] = [];
  private auditLogs: any[] = [];
  private globalModels: any[] = [];

  constructor() {
    // Populate some default dummy nodes
    const initialNodes: FLNode[] = [
      { id: '11111111-1111-1111-1111-111111111111', name: 'Boston-Central-Hospital', type: 'hospital', status: 'idle', lastActive: new Date().toISOString(), datasetSize: 1500 },
      { id: '22222222-2222-2222-2222-222222222222', name: 'Apex-Retail-POS', type: 'retail', status: 'idle', lastActive: new Date().toISOString(), datasetSize: 5000 },
      { id: '33333333-3333-3333-3333-333333333333', name: 'Nova-Bank-Node', type: 'bank', status: 'offline', lastActive: new Date(Date.now() - 3600000).toISOString(), datasetSize: 2200 },
      { id: '44444444-4444-4444-4444-444444444444', name: 'Nova-Telecom-Node', type: 'telecom', status: 'offline', lastActive: new Date(Date.now() - 3600000).toISOString(), datasetSize: 4200 }
    ];
    initialNodes.forEach(node => this.nodes.set(node.id, node));

    // Populate initial round metrics
    this.rounds = [
      { roundId: 1, status: 'completed', startedAt: new Date(Date.now() - 7200000).toISOString(), completedAt: new Date(Date.now() - 7100000).toISOString(), participatingNodes: [initialNodes[0].id, initialNodes[1].id], metrics: { round: 1, loss: 0.45, accuracy: 0.72, timestamp: new Date(Date.now() - 7100000).toISOString() } },
      { roundId: 2, status: 'completed', startedAt: new Date(Date.now() - 3600000).toISOString(), completedAt: new Date(Date.now() - 3500000).toISOString(), participatingNodes: [initialNodes[0].id, initialNodes[1].id], metrics: { round: 2, loss: 0.31, accuracy: 0.81, timestamp: new Date(Date.now() - 3500000).toISOString() } }
    ];

    // Populate mock incident reports
    this.incidentReports = [
      {
        incident_id: 'INC-2026-001',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        organization: 'Nova-Bank-Node',
        predicted_attack: 'DoS',
        confidence: 0.985,
        severity: 'HIGH',
        executive_summary: 'A high-confidence Denial of Service (DoS) attack has been identified targeting the Nova-Bank-Node. Immediate protective containment actions are advised.',
        technical_summary: 'Classified based on a rapid rise in connection count and service connection count variables. Inflow rate suggests a volumetric resource exhaustion attempt targeting open web applications.',
        mitre_attack: ['T1498', 'T1498.001'],
        kill_chain_phase: 'Actions on Objectives',
        affected_assets: ['Nova-Bank-Node Web Services', 'External DMZ Gateway'],
        recommended_actions: ['Deploy rate limiting at edge routers', 'Inspect external network route paths for spoofed addresses'],
        containment_steps: ['Null-route origin IP addresses', 'Enable Cloudflare DDoS mitigation rules'],
        confidence_reasoning: 'Model features count and srv_count were 3 standard deviations above normal baselines.',
        limitations: 'Encrypted payloads prevent detailed packet inspection.',
        references: ['https://attack.mitre.org/techniques/T1498'],
        explainability: {
          supporting_evidence: ['count = 512 (Threshold: 120)', 'srv_count = 512 (Threshold: 100)'],
          top_contributing_features: ['count', 'srv_count', 'serror_rate'],
          feature_importance: { count: 0.45, srv_count: 0.35, serror_rate: 0.20 },
          prediction_probability: 0.985,
          evidence_summary: 'Abnormal traffic connection volume flags DDoS signature with extreme feature weights contribution.'
        },
        federated_model_version: '1.0.0',
        global_checkpoint_version: 'round_2.pkl',
        dataset_version: 'CICIDS2017-pruned',
        benchmark_version: 'v1.1',
        prompt_version: 'v1.0',
        llm_provider: 'ollama',
        llm_model: 'llama3.1'
      }
    ];

    this.promptVersions = [
      { version: 'v1.0', template: 'Convert security variables into Incident intelligence', created_at: new Date().toISOString() }
    ];

    this.auditLogs = [];
    this.globalModels = [
      { version: '1.0.2', checkpointPath: 'E:\\CyberFed AI\\artifacts\\global\\round_2.pkl', accuracy: 0.81, loss: 0.31, precision: 0.79, recall: 0.80, f1: 0.79, roundNumber: 2, timestamp: new Date(Date.now() - 3500000).toISOString() },
      { version: '1.0.1', checkpointPath: 'E:\\CyberFed AI\\artifacts\\global\\round_1.pkl', accuracy: 0.72, loss: 0.45, precision: 0.70, recall: 0.71, f1: 0.70, roundNumber: 1, timestamp: new Date(Date.now() - 7100000).toISOString() }
    ];
  }

  from(table: string) {
    const self = this;
    
    class QueryBuilder {
      private isInsert = false;
      private isUpdate = false;
      private isUpsert = false;
      private insertValues: any = null;
      private updateValues: any = null;
      private upsertValues: any = null;
      private updateFilter: any = null;
      private sortCol: string | null = null;
      private sortAsc = false;
      private limitCount: number | null = null;

      select(query: string = '*') {
        return this;
      }
      
      order(column: string, options?: { ascending?: boolean }) {
        this.sortCol = column;
        this.sortAsc = options?.ascending ?? false;
        return this;
      }
      
      limit(count: number) {
        this.limitCount = count;
        return this;
      }
      
      insert(values: any) {
        this.isInsert = true;
        this.insertValues = values;
        return this;
      }
      
      upsert(values: any) {
        this.isUpsert = true;
        this.upsertValues = values;
        return this;
      }
      
      update(values: any) {
        this.isUpdate = true;
        this.updateValues = values;
        return this;
      }
      
      match(filter: any) {
        this.updateFilter = filter;
        return this;
      }
      
      async then(resolve: any) {
        try {
          if (this.isInsert) {
            const values = this.insertValues;
            const items = Array.isArray(values) ? values : [values];
            if (table === 'rounds' || table === 'training_rounds') {
              items.forEach(item => {
                const newRound: FLRoundInfo = {
                  roundId: item.round || self.rounds.length + 1,
                  status: 'completed',
                  startedAt: new Date().toISOString(),
                  completedAt: new Date().toISOString(),
                  participatingNodes: item.participatingNodes || [],
                  metrics: {
                    round: item.round,
                    loss: item.loss,
                    accuracy: item.accuracy,
                    timestamp: new Date().toISOString()
                  }
                };
                self.rounds.push(newRound);
              });
              resolve({ data: items, error: null });
            } else if (table === 'nodes') {
              items.forEach(item => {
                self.nodes.set(item.id, item);
              });
              resolve({ data: items, error: null });
            } else if (table === 'incident_reports') {
              items.forEach(item => {
                self.incidentReports.push(item);
              });
              resolve({ data: items, error: null });
            } else if (table === 'ai_evaluations') {
              items.forEach(item => {
                self.aiEvaluations.push(item);
              });
              resolve({ data: items, error: null });
            } else if (table === 'prompt_versions') {
              items.forEach(item => {
                self.promptVersions.push(item);
              });
              resolve({ data: items, error: null });
            } else if (table === 'audit_logs') {
              items.forEach(item => {
                self.auditLogs.push(item);
              });
              resolve({ data: items, error: null });
            } else if (table === 'global_models') {
              items.forEach(item => {
                self.globalModels.push(item);
              });
              resolve({ data: items, error: null });
            } else {
              resolve({ data: items, error: null });
            }
          } else if (this.isUpsert) {
            const values = this.upsertValues;
            if (table === 'nodes') {
              const list = Array.isArray(values) ? values : [values];
              list.forEach((item: any) => {
                const existing = self.nodes.get(item.id) || {};
                const merged = { ...existing, ...item, lastActive: new Date().toISOString() } as FLNode;
                self.nodes.set(item.id, merged);
              });
              resolve({ data: list, error: null });
            } else {
              resolve({ data: Array.isArray(values) ? values : [values], error: null });
            }
          } else if (this.isUpdate) {
            const values = this.updateValues;
            const filter = this.updateFilter || {};
            if (table === 'nodes' && filter.id) {
              const existing = self.nodes.get(filter.id);
              if (existing) {
                const merged = { ...existing, ...values, lastActive: new Date().toISOString() } as FLNode;
                self.nodes.set(filter.id, merged);
                resolve({ data: [merged], error: null });
                return;
              }
            }
            resolve({ data: [], error: null });
          } else {
            // Normal Select Query
            let resultData: any[] = [];
            if (table === 'nodes') {
              resultData = Array.from(self.nodes.values()).map((node: any) => {
                // Keep the mock nodes fresh so they do not prune/offline after 60s in local development
                if (node.status !== 'offline') {
                  return { ...node, lastActive: new Date().toISOString() };
                }
                return node;
              });
            } else if (table === 'rounds' || table === 'training_rounds') {
              if (table === 'training_rounds') {
                resultData = self.rounds.map(r => ({
                  round: r.roundId,
                  loss: r.metrics?.loss ?? 0,
                  accuracy: r.metrics?.accuracy ?? 0,
                  timestamp: r.metrics?.timestamp ?? new Date().toISOString()
                }));
              } else {
                resultData = self.rounds;
              }
            } else if (table === 'incident_reports') {
              resultData = self.incidentReports;
            } else if (table === 'ai_evaluations') {
              resultData = self.aiEvaluations;
            } else if (table === 'prompt_versions') {
              resultData = self.promptVersions;
            } else if (table === 'audit_logs') {
              resultData = self.auditLogs;
            } else if (table === 'global_models') {
              resultData = self.globalModels;
            }

            // Apply sort
            if (this.sortCol) {
              const col = this.sortCol;
              const asc = this.sortAsc;
              resultData.sort((a, b) => {
                const valA = a[col];
                const valB = b[col];
                if (valA < valB) return asc ? -1 : 1;
                if (valA > valB) return asc ? 1 : -1;
                return 0;
              });
            }

            // Apply limit
            if (this.limitCount !== null) {
              resultData = resultData.slice(0, this.limitCount);
            }

            resolve({ data: resultData, error: null });
          }
        } catch (e: any) {
          resolve({ data: [], error: { message: e.message } });
        }
      }
    }

    return new QueryBuilder();
  }
}

// Export Supabase client. Fall back to mock if URL is missing
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (new MockSupabaseClient() as any);
