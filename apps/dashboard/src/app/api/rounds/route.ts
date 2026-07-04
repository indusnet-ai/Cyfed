import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createLogger } from '@fedsoc/shared';

const logger = createLogger('api-rounds');

export async function GET() {
  try {
    const { data: rounds, error } = await supabase.from('rounds').select('*');
    if (error) {
      logger.error({ error }, 'Failed to fetch rounds from Supabase');
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    // Sort rounds by roundId ascending
    const sortedRounds = (rounds || []).sort((a: any, b: any) => a.roundId - b.roundId);
    return NextResponse.json(sortedRounds);
  } catch (err: any) {
    logger.error({ err }, 'Rounds GET handler error');
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { round, accuracy, loss, participatingNodes } = body;
    
    if (round === undefined || accuracy === undefined || loss === undefined) {
      return NextResponse.json({ error: 'Missing round, accuracy or loss metrics' }, { status: 400 });
    }

    logger.info({ round, accuracy, loss, participatingNodes }, 'Recording completed FL round');

    const roundPayload = {
      round,
      accuracy,
      loss,
      participatingNodes: participatingNodes || [],
      timestamp: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('rounds').insert(roundPayload);
    
    if (error) {
      logger.error({ error }, 'Failed to save round to Supabase');
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    logger.error({ err }, 'Rounds POST handler error');
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
