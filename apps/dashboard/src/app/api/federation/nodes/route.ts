import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: nodes, error } = await supabase.from('nodes').select('*');
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Prune nodes that haven't sent a heartbeat in the last 60 seconds
    const now = Date.now();
    const prunedNodes = (nodes || []).map((node: any) => {
      const lastActiveTime = new Date(node.lastActive).getTime();
      if (node.status !== 'offline' && (now - lastActiveTime) > 60000) {
        node.status = 'offline';
      }
      return node;
    });

    return NextResponse.json(prunedNodes);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
