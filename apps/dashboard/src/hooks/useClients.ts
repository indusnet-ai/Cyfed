import { useState, useEffect } from 'react';
import { useDemo } from '../context/useDemoContext';

export interface FLNode {
  id: string;
  name: string;
  type: string;
  status: string;
  ipAddress?: string;
  datasetSize?: number;
  lastActive?: string | number;
}

export function useClients(pollingIntervalMs = 8000) {
  const { isDemoMode, getStepData, currentStep } = useDemo();
  const [liveClients, setLiveClients] = useState<FLNode[]>([]);
  const [demoClients, setDemoClients] = useState<FLNode[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Live polling ──
  useEffect(() => {
    if (isDemoMode) return;
    const fetch_ = async () => {
      try {
        const res = await fetch('/api/federation/nodes');
        if (res.ok) setLiveClients(await res.json());
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetch_();
    const id = setInterval(fetch_, pollingIntervalMs);
    return () => clearInterval(id);
  }, [pollingIntervalMs, isDemoMode]);

  // ── Demo: re-derive when step changes ──
  useEffect(() => {
    if (!isDemoMode) return;
    const stepData = getStepData(currentStep);
    setDemoClients(stepData?.organizations ?? []);
    setLoading(false);
  }, [isDemoMode, currentStep, getStepData]);

  if (isDemoMode) {
    return { clients: demoClients, loading: false, refetch: () => {} };
  }
  return { clients: liveClients, loading, refetch: () => {} };
}
