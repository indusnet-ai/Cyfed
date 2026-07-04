import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { NodeHeartbeatSchema } from '@fedsoc/schemas';
import { createLogger } from '@fedsoc/shared';

const logger = createLogger('api-heartbeat');

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parseResult = NodeHeartbeatSchema.safeParse(body);
    
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.format() }, { status: 400 });
    }

    const { id, status, datasetSize } = parseResult.data;
    
    const updatePayload: any = {
      status,
      lastActive: new Date().toISOString(),
    };

    if (datasetSize !== undefined) {
      updatePayload.datasetSize = datasetSize;
    }

    const { data, error } = await supabase
      .from('nodes')
      .update(updatePayload)
      .match({ id });

    if (error) {
      logger.error({ error, id }, 'Failed to update heartbeat in Supabase');
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    logger.error({ err }, 'Heartbeat handler error');
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
