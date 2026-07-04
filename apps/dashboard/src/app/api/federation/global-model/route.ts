import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createLogger } from '@fedsoc/shared';

const logger = createLogger('api-federation-global-model');

export async function GET() {
  try {
    const { data: models, error } = await supabase
      .from('global_models')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1);
      
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    const latestModel = models && models.length > 0 ? models[0] : null;
    return NextResponse.json(latestModel);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { version, checkpointPath, accuracy, loss, precision, recall, f1, roundNumber } = body;
    
    if (!version || !checkpointPath || roundNumber === undefined) {
      return NextResponse.json({ error: 'Missing version, checkpointPath or roundNumber' }, { status: 400 });
    }

    logger.info({ version, checkpointPath, roundNumber }, 'Recording new global model checkpoint');

    const modelPayload = {
      version,
      checkpointPath,
      accuracy: accuracy || 0.0,
      loss: loss || 0.0,
      precision: precision || 0.0,
      recall: recall || 0.0,
      f1: f1 || 0.0,
      roundNumber,
      timestamp: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('global_models').insert(modelPayload);
    
    if (error) {
      logger.error({ error }, 'Failed to save global model checkpoint to Supabase');
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    logger.error({ err }, 'Federation Global Model POST handler error');
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
