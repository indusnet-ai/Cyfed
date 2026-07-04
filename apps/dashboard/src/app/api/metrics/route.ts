import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const [nodesRes, roundsRes, incidentsRes] = await Promise.all([
      supabase.from('nodes').select('*'),
      supabase.from('rounds').select('*'),
      supabase.from('incident_reports').select('*')
    ]);

    const activeNodes = (nodesRes.data || []).filter((n: any) => n.status !== 'offline').length;
    const totalRounds = (roundsRes.data || []).length;
    const totalIncidents = (incidentsRes.data || []).length;

    // Output a JSON report containing metrics that can be easily parsed
    return NextResponse.json({
      fedsoc_active_nodes_count: activeNodes,
      fedsoc_total_rounds_executed: totalRounds,
      fedsoc_total_incidents_logged: totalIncidents,
      fedsoc_database_status: 'healthy',
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
