import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // 1. Fetch all training rounds
    const { data: rounds, error: roundsError } = await supabase
      .from('training_rounds')
      .select('*')
      .order('round', { ascending: true });
      
    if (roundsError) {
      return NextResponse.json({ error: roundsError.message }, { status: 500 });
    }
    
    // 2. Fetch all checkpoints/global model metadata
    const { data: models, error: modelsError } = await supabase
      .from('global_models')
      .select('*')
      .order('roundNumber', { ascending: true });
      
    if (modelsError) {
      return NextResponse.json({ error: modelsError.message }, { status: 500 });
    }
    
    // 3. Fetch nodes count
    const { data: nodes, error: nodesError } = await supabase
      .from('nodes')
      .select('id, status, lastActive');
      
    if (nodesError) {
      return NextResponse.json({ error: nodesError.message }, { status: 500 });
    }
    
    const now = Date.now();
    const activeNodes = (nodes || []).filter((node: any) => {
      const lastActiveTime = new Date(node.lastActive).getTime();
      return node.status !== 'offline' && (now - lastActiveTime) < 60000;
    });

    // 4. Construct telemetry stats
    const rounds_telemetry = (rounds || []).map((r: any) => ({
      round: r.round,
      accuracy: r.accuracy,
      loss: r.loss,
      precision: r.precision,
      recall: r.recall,
      f1: r.f1,
      durationSeconds: r.duration,
      aggregationTimeSeconds: r.aggregationTime,
      participatingClientsCount: r.participatingNodes ? r.participatingNodes.length : 0
    }));

    const metricsSummary = {
      totalRoundsCompleted: rounds_telemetry.length,
      averageAccuracy: rounds_telemetry.length > 0
        ? rounds_telemetry.reduce((acc: number, r: any) => acc + r.accuracy, 0) / rounds_telemetry.length
        : 0.0,
      averageLoss: rounds_telemetry.length > 0
        ? rounds_telemetry.reduce((acc: number, r: any) => acc + r.loss, 0) / rounds_telemetry.length
        : 0.0,
      totalDurationSeconds: rounds_telemetry.reduce((acc: number, r: any) => acc + r.durationSeconds, 0),
      activeClientsCount: activeNodes.length,
      rounds: rounds_telemetry,
      checkpoints: (models || []).map((m: any) => ({
        version: m.version,
        round: m.roundNumber,
        path: m.checkpointPath,
        timestamp: m.timestamp
      }))
    };

    return NextResponse.json(metricsSummary);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
