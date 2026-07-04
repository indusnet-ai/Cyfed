import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // 1. Get count of active nodes
    const { data: nodes, error: nodesError } = await supabase
      .from('nodes')
      .select('id, status, lastActive');
      
    if (nodesError) {
      return NextResponse.json({ error: nodesError.message }, { status: 500 });
    }
    
    // Prune nodes that haven't sent heartbeats in 60s
    const now = Date.now();
    const activeNodes = (nodes || []).filter((node: any) => {
      const lastActiveTime = new Date(node.lastActive).getTime();
      return node.status !== 'offline' && (now - lastActiveTime) < 60000;
    });
    
    // 2. Get latest training round number
    const { data: rounds, error: roundsError } = await supabase
      .from('training_rounds')
      .select('round')
      .order('round', { ascending: false })
      .limit(1);
      
    if (roundsError) {
      return NextResponse.json({ error: roundsError.message }, { status: 500 });
    }
    
    const latestRound = rounds && rounds.length > 0 ? rounds[0].round : 0;
    
    return NextResponse.json({
      status: activeNodes.length > 0 ? 'active' : 'idle',
      activeClientsCount: activeNodes.length,
      currentRound: latestRound,
      coordinatorAddress: 'localhost:8080',
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
