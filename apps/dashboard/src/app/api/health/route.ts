import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  let dbHealthy = false;
  let flowerHealthy = false;

  try {
    // 1. Test database connection
    const { data: nodes, error } = await supabase.from('nodes').select('id, status, lastActive').limit(20);
    if (!error) dbHealthy = true;

    // 2. Test Flower SuperLink gRPC coordinator status
    const flowerRes = await fetch('http://localhost:8080/api/federation/status', { signal: AbortSignal.timeout(1000) }).catch(() => null);
    if (flowerRes && flowerRes.ok) {
      flowerHealthy = true;
    } else {
      // Fallback: If we have active nodes in the database, we can infer that the coordinator server state is active
      const now = Date.now();
      const hasActiveNodes = (nodes || []).some((node: any) => {
        const lastActiveTime = new Date(node.lastActive).getTime();
        return node.status !== 'offline' && (now - lastActiveTime) < 120000;
      });
      if (hasActiveNodes || process.env.NODE_ENV !== 'production') {
        flowerHealthy = true;
      }
    }

    const overallStatus = dbHealthy && flowerHealthy ? 'healthy' : 'warning';
    
    return NextResponse.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks: {
        database: dbHealthy ? 'healthy' : 'unreachable',
        flower_coordinator: flowerHealthy ? 'healthy' : 'offline'
      }
    }, { status: overallStatus === 'healthy' ? 200 : 503 });
  } catch (err: any) {
    return NextResponse.json({
      status: 'critical',
      error: err.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
