import { useState, useEffect } from 'react';
import { useDemo } from '../context/useDemoContext';

export interface RoundData {
  round: number;
  accuracy: number;
  loss: number;
  precision?: number;
  recall?: number;
  f1?: number;
  participatingNodes?: string[];
  duration?: number;
  aggregationTime?: number;
  timestamp: string;
}

export interface FederationStatus {
  status: 'idle' | 'training' | 'error';
  currentRound: number;
  activeClientsCount: number;
  globalAccuracy: number;
  globalLoss: number;
  globalF1: number;
  bandwidthSaved: number;
  privacyPreserved: boolean;
  latestCheckpoint: string;
  rounds: RoundData[];
  loading: boolean;
}

const EMPTY: FederationStatus = {
  status: 'idle',
  currentRound: 0,
  activeClientsCount: 0,
  globalAccuracy: 0.0,
  globalLoss: 0.0,
  globalF1: 0.0,
  bandwidthSaved: 0.0,
  privacyPreserved: true,
  latestCheckpoint: 'None',
  rounds: [],
  loading: true,
};

export function useFederationStatus(pollingIntervalMs = 6000): FederationStatus {
  const { isDemoMode, getStepData, currentStep } = useDemo();
  const [liveData, setLiveData] = useState<FederationStatus>(EMPTY);
  const [demoData, setDemoData] = useState<FederationStatus>(EMPTY);

  // ── Live mode polling ──────────────────────────────────────────
  useEffect(() => {
    if (isDemoMode) return;

    const fetchData = async () => {
      try {
        const [statusRes, roundsRes] = await Promise.all([
          fetch('/api/federation/status'),
          fetch('/api/federation/rounds'),
        ]);

        let statusInfo = { status: 'idle', activeClientsCount: 0, currentRound: 0 };
        if (statusRes.ok) statusInfo = await statusRes.json();

        let rounds: RoundData[] = [];
        if (roundsRes.ok) rounds = await roundsRes.json();
        rounds = rounds.sort((a, b) => a.round - b.round);

        const latest = rounds[rounds.length - 1];
        setLiveData({
          status: statusInfo.status as 'idle' | 'training' | 'error',
          currentRound: statusInfo.currentRound || (latest ? latest.round : 0),
          activeClientsCount: statusInfo.activeClientsCount || 4,
          globalAccuracy: latest ? latest.accuracy : 0.0,
          globalLoss: latest ? latest.loss : 0.0,
          globalF1: latest ? (latest.f1 || latest.accuracy * 0.55) : 0.0,
          bandwidthSaved: 99.99,
          privacyPreserved: true,
          latestCheckpoint: latest ? `round_${latest.round}.pkl` : 'None',
          rounds,
          loading: false,
        });
      } catch {
        setLiveData(prev => ({ ...prev, loading: false }));
      }
    };

    fetchData();
    const id = setInterval(fetchData, pollingIntervalMs);
    return () => clearInterval(id);
  }, [pollingIntervalMs, isDemoMode]);

  // ── Demo mode: re-derive data whenever step or scenario changes ──
  useEffect(() => {
    if (!isDemoMode) return;

    const stepData = getStepData(currentStep);
    const rounds: RoundData[] = (stepData?.rounds ?? []).map((r: any) => ({
      round: r.round,
      accuracy: r.accuracy,
      loss: r.loss,
      f1: r.f1,
      timestamp: r.timestamp ?? new Date().toISOString(),
    }));
    const latest = rounds[rounds.length - 1];

    setDemoData({
      status: stepData?.status ?? 'idle',
      currentRound: stepData?.currentRound ?? 0,
      activeClientsCount: stepData?.organizations?.length ?? 4,
      globalAccuracy: stepData?.globalAccuracy ?? 0.0,
      globalLoss: stepData?.globalLoss ?? 0.0,
      globalF1: stepData?.globalF1 ?? 0.0,
      bandwidthSaved: 99.99,
      privacyPreserved: true,
      latestCheckpoint: latest ? `round_${latest.round}.pkl` : 'None',
      rounds,
      loading: false,
    });
  }, [isDemoMode, currentStep, getStepData]);

  return isDemoMode ? demoData : liveData;
}
