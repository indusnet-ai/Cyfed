import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { NodeRegisterSchema } from '@fedsoc/schemas';
import { createLogger } from '@fedsoc/shared';

const logger = createLogger('api-nodes');

export async function GET() {
  try {
    const { data: nodes, error } = await supabase.from('nodes').select('*');
    if (error) {
      logger.error({ error }, 'Failed to fetch nodes from Supabase');
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Prune nodes that haven't sent a heartbeat in the last 30 seconds
    const now = Date.now();
    const updatedNodes = (nodes || []).map((node: any) => {
      const lastActiveTime = new Date(node.lastActive).getTime();
      if (node.status !== 'offline' && (now - lastActiveTime) > 30000) {
        node.status = 'offline';
      }
      return node;
    });

    return NextResponse.json(updatedNodes);
  } catch (err: any) {
    logger.error({ err }, 'Nodes GET handler error');
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Missing client id parameter' }, { status: 400 });
    }

    const body = await req.json();
    const parseResult = NodeRegisterSchema.safeParse(body);
    
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.format() }, { status: 400 });
    }

    const { name, type, status, ipAddress, datasetSize } = parseResult.data;
    
    const nodePayload = {
      id,
      name,
      type,
      status,
      ipAddress: ipAddress || '127.0.0.1',
      datasetSize: datasetSize || 0,
      lastActive: new Date().toISOString(),
    };

    logger.info({ nodePayload }, 'Upserting node registration');
    const { data, error } = await supabase.from('nodes').upsert(nodePayload);

    if (error) {
      logger.error({ error }, 'Failed to upsert node to Supabase');
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    logger.error({ err }, 'Nodes POST handler error');
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
