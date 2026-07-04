import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Check DB
    const { error } = await supabase.from('nodes').select('id').limit(1);
    if (error) {
      return NextResponse.json({ status: 'not_ready', detail: 'Database unreachable' }, { status: 503 });
    }

    return NextResponse.json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return NextResponse.json({ status: 'not_ready', error: err.message }, { status: 503 });
  }
}
