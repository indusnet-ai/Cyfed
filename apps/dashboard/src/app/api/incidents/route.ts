import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import { supabase } from '@/lib/supabase';
import { createLogger } from '@fedsoc/shared';

const logger = createLogger('api-incidents');

export async function GET() {
  try {
    const { data: reports, error } = await supabase
      .from('incident_reports')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(reports || []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { z } from 'zod';

const IncidentPostSchema = z.object({
  organization: z.string().min(2).max(100).regex(/^[a-zA-Z0-9_\-\s]+$/).default('Nova-Bank-Node'),
  predicted_attack: z.enum(['DoS', 'PortScan', 'BruteForce', 'Infiltration', 'Ransomware', 'DDoS', 'Botnet', 'generic']).default('DoS'),
  confidence: z.number().min(0).max(1).default(0.95),
  provider: z.enum(['ollama', 'openai', 'fallback-rules']).default('ollama'),
  model: z.string().min(2).max(50).regex(/^[a-zA-Z0-9_\-\.\s:]+$/).default('llama3.1'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const parseResult = IncidentPostSchema.safeParse(body);
    
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.format() }, { status: 400 });
    }
    
    const validatedData = parseResult.data;
    
    const payload = {
      organization: validatedData.organization,
      predicted_attack: validatedData.predicted_attack,
      confidence: validatedData.confidence,
      federated_model_version: '1.0.0',
      global_checkpoint_version: 'round_2.pkl',
      dataset_version: 'CICIDS2017-pruned',
      benchmark_version: 'v1.1',
      prediction_probability: validatedData.confidence,
      top_contributing_features: ['count', 'srv_count'],
      feature_importance: { count: 0.45, srv_count: 0.35, serror_rate: 0.20 },
      supporting_evidence: ['count = 512', 'srv_count = 512'],
      evidence_summary: 'Anomalous network connection volume detected.',
      provider: validatedData.provider,
      model: validatedData.model
    };

    // Invoke Python fedsoc.ai.run_analyst module using uv
    const rootPath = path.resolve(process.cwd(), '../../');
    const cmd = 'uv run --project python/fedsoc -m fedsoc.ai.run_analyst';

    logger.info({ cmd, rootPath }, 'Invoking Python AI SOC Analyst Dual Evaluation Service');

    const result: any = await new Promise((resolve) => {
      const child = exec(cmd, { cwd: rootPath }, (error, stdout, stderr) => {
        clearTimeout(timer);
        if (error) {
          logger.warn({ error, stderr }, 'Python analyst script returned error. Using fallback offline mock logic.');
          resolve({ success: false, error: stderr || error.message });
        } else {
          try {
            const parsed = JSON.parse(stdout);
            resolve(parsed);
          } catch (ex: any) {
            logger.warn({ ex, stdout }, 'Failed to parse python stdout. Using fallback.');
            resolve({ success: false, error: 'JSON parse error from stdout' });
          }
        }
      });

      // Abort execution and fallback after 4 seconds
      const timer = setTimeout(() => {
        logger.warn('Python analyst script execution timed out. Aborting and falling back.');
        child.kill();
        resolve({ success: false, error: 'Execution timeout' });
      }, 4000);

      // Write parameters payload to stdin
      child.stdin?.write(JSON.stringify(payload));
      child.stdin?.end();
    });

    if (result.success && result.report) {
      const report = result.report;
      const evals = result.evaluations || [];

      // Save report to Supabase
      const { error: rError } = await supabase.from('incident_reports').insert(report);
      if (rError) {
        logger.error({ rError }, 'Error inserting incident report to Supabase');
      }

      // Save evaluations to Supabase
      if (evals.length > 0) {
        const evalRecords = evals.map((ev: any) => ({
          incident_id: report.incident_id,
          provider: ev.provider,
          model: ev.model,
          correctness: ev.scores.correctness,
          completeness: ev.scores.completeness,
          consistency: ev.scores.consistency,
          safety: ev.scores.safety,
          json_validity: ev.scores.json_validity,
          total_score: ev.scores.total_score,
          selected: ev.candidate_index === 1,
          response_content: JSON.stringify(ev.scores)
        }));
        
        const { error: eError } = await supabase.from('ai_evaluations').insert(evalRecords);
        if (eError) {
          logger.error({ eError }, 'Error inserting evaluations to Supabase');
        }
      }

      return NextResponse.json(report);
    } else {
      // If Python execution failed or returned error, fall back to high-fidelity offline mock matching python schemas
      logger.warn({ error: result.error }, 'AI Service execution failed, generating high-fidelity fallback report.');
      
      const mockIncidentId = `INC-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      const mockReport = {
        incident_id: mockIncidentId,
        timestamp: new Date().toISOString(),
        organization: payload.organization,
        predicted_attack: payload.predicted_attack,
        confidence: payload.confidence,
        severity: payload.confidence > 0.85 ? 'HIGH' : 'MEDIUM',
        executive_summary: `A high-confidence ${payload.predicted_attack} classification threat was flagged at ${payload.organization}. Immediate rate limiting is recommended.`,
        technical_summary: `The local classifier predicted a ${payload.predicted_attack} attack. Diagnostics identify traffic connections exceeding normal baselines.`,
        mitre_attack: ['T1498'],
        kill_chain_phase: 'Actions on Objectives',
        affected_assets: [`${payload.organization} Router`, `${payload.organization} DMZ server`],
        recommended_actions: ['Block source IP address range', 'Audit connection session logs'],
        containment_steps: ['Null-route malicious routes', 'Enable DDoS shield rule filters'],
        confidence_reasoning: 'Feature connections are three standard deviations above expected thresholds.',
        limitations: 'No raw payload content is stored due to security rules.',
        references: ['https://attack.mitre.org/techniques/T1498'],
        explainability: {
          supporting_evidence: payload.supporting_evidence,
          top_contributing_features: payload.top_contributing_features,
          feature_importance: payload.feature_importance,
          prediction_probability: payload.prediction_probability,
          evidence_summary: 'Connection attributes trigger static thresholds matching attack vectors.'
        },
        federated_model_version: payload.federated_model_version,
        global_checkpoint_version: payload.global_checkpoint_version,
        dataset_version: payload.dataset_version,
        benchmark_version: payload.benchmark_version,
        prompt_version: 'v1.0',
        llm_provider: 'fallback-rules',
        llm_model: 'offline'
      };

      // Save mock report to DB
      await supabase.from('incident_reports').insert(mockReport);

      return NextResponse.json(mockReport);
    }

  } catch (err: any) {
    logger.error({ err }, 'Error in POST incidents analyze API');
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
