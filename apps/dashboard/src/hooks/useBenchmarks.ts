import { useState, useEffect } from 'react';
import { useDemo } from '../context/useDemoContext';

export interface BenchmarkData {
  localVsGlobal: Record<string, { local: any; global: any }>;
  convergence: Array<{
    round: number;
    accuracy: number;
    loss: number;
    precision: number;
    recall: number;
    macro_f1: number;
    weighted_f1: number;
  }>;
  clientDrift: Record<string, number[]>;
  communication: Array<{
    round: number;
    model_size_kb: number;
    upload_size_kb: number;
    download_size_kb: number;
    total_bandwidth_kb: number;
    communication_time_sec: number;
    aggregation_time_sec: number;
    total_training_time_sec: number;
  }>;
  scalability: Array<{
    clients_count: number;
    estimated_round_duration_sec: number;
    estimated_bandwidth_kb: number;
    storage_overhead_mb: number;
    aggregation_overhead_sec: number;
  }>;
  loading: boolean;
}

const EMPTY_BENCH: BenchmarkData = {
  localVsGlobal: {},
  convergence: [],
  clientDrift: {},
  communication: [],
  scalability: [],
  loading: true,
};

export function useBenchmarks() {
  const { isDemoMode, getStepData, currentStep } = useDemo();
  const [liveData, setLiveData] = useState<BenchmarkData>(EMPTY_BENCH);
  const [demoData, setDemoData] = useState<BenchmarkData>(EMPTY_BENCH);

  // ── Live mode fetch ──
  useEffect(() => {
    if (isDemoMode) return;
    const fetchBenchmarks = async () => {
      try {
        const [summaryRes, convergenceRes, commRes, scalRes] = await Promise.all([
          fetch('/api/benchmark/summary'),
          fetch('/api/benchmark/convergence'),
          fetch('/api/benchmark/communication'),
          fetch('/api/benchmark/scalability'),
        ]);
        const summaryData  = summaryRes.ok  ? await summaryRes.json()     : { localVsGlobal: {} };
        const convData     = convergenceRes.ok ? await convergenceRes.json() : { convergence: [], clientDrift: {} };
        const commData     = commRes.ok     ? await commRes.json()         : { communication: [] };
        const scalData     = scalRes.ok     ? await scalRes.json()         : { scalability: [] };
        setLiveData({
          localVsGlobal: summaryData.localVsGlobal,
          convergence:   convData.convergence,
          clientDrift:   convData.clientDrift,
          communication: commData.communication,
          scalability:   scalData.scalability,
          loading: false,
        });
      } catch {
        setLiveData(prev => ({ ...prev, loading: false }));
      }
    };
    fetchBenchmarks();
  }, [isDemoMode]);

  // ── Demo mode: re-derive on every step change ──
  useEffect(() => {
    if (!isDemoMode) return;
    const stepData   = getStepData(currentStep);
    const benchmarks = stepData?.benchmarks ?? {};
    setDemoData({
      localVsGlobal: benchmarks.localVsGlobal  ?? {},
      convergence:   benchmarks.convergence    ?? [],
      clientDrift:   benchmarks.clientDrift    ?? {},
      communication: benchmarks.communication  ?? [],
      scalability:   benchmarks.scalability    ?? [],
      loading: false,
    });
  }, [isDemoMode, currentStep, getStepData]);

  return isDemoMode ? demoData : liveData;
}
