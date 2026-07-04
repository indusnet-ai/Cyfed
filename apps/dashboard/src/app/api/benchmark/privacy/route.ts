import { NextResponse } from 'next/server';
import { getSafeBenchmarkData } from '@/lib/benchmark';

const BENCHMARK_PATH = 'E:/CyberFed AI/artifacts/global/benchmark_summary.json';

export async function GET() {
  try {
    const data = getSafeBenchmarkData(BENCHMARK_PATH);
    if (!data) {
      return NextResponse.json(
        { error: 'Benchmark data has not been generated yet.' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      privacy: data.privacy
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
