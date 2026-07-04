import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createLogger } from '@fedsoc/shared';

const logger = createLogger('api-federation-rounds');

export async function GET() {
  try {
    const { data: rounds, error } = await supabase.from('training_rounds').select('*');
    if (error) {
      logger.error({ error }, 'Failed to fetch training_rounds from Supabase');
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const sortedRounds = (rounds || []).sort((a: any, b: any) => a.round - b.round);
    return NextResponse.json(sortedRounds);
  } catch (err: any) {
    logger.error({ err }, 'Federation Rounds GET handler error');
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { round, accuracy, loss, precision, recall, f1, duration, aggregationTime, participatingNodes } = body;
    
    if (round === undefined || accuracy === undefined || loss === undefined) {
      return NextResponse.json({ error: 'Missing round, accuracy or loss metrics' }, { status: 400 });
    }

    logger.info({ round, accuracy, loss, participatingNodes }, 'Recording completed FedCore FL round');

    const roundPayload = {
      round,
      accuracy,
      loss,
      precision: precision || 0.0,
      recall: recall || 0.0,
      f1: f1 || 0.0,
      participatingNodes: participatingNodes || [],
      duration: duration || 0.0,
      aggregationTime: aggregationTime || 0.0,
      timestamp: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('training_rounds').insert(roundPayload);
    
    if (error) {
      logger.error({ error }, 'Failed to save round to Supabase training_rounds');
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Also write to deprecated rounds table for backward compatibility with frontend queries
    try {
      const legacyPayload = {
        round,
        accuracy,
        loss,
        participatingNodes: participatingNodes || [],
        timestamp: new Date().toISOString(),
      };
      await supabase.from('rounds').insert(legacyPayload);
    } catch (e) {
      logger.debug({ e }, 'Failed to write legacy compatibility round log. Ignoring.');
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    logger.error({ err }, 'Federation Rounds POST handler error');
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
