import { useState, useEffect } from 'react';
import { useDemo } from '../context/useDemoContext';

export interface SystemHealthData {
  flowerServer: 'healthy' | 'warning' | 'critical';
  supabase: 'healthy' | 'warning' | 'critical';
  dashboard: 'healthy' | 'warning' | 'critical';
  connectedClients: number;
  apiHealth: 'healthy' | 'warning' | 'critical';
  checkpointStorage: 'healthy' | 'warning' | 'critical';
  heartbeatStatus: 'healthy' | 'warning' | 'critical';
  loading: boolean;
}

export function useSystemHealth(pollingIntervalMs = 10000) {
  const { isDemoMode } = useDemo();
  const [health, setHealth] = useState<SystemHealthData>({
    flowerServer: 'healthy',
    supabase: 'healthy',
    dashboard: 'healthy',
    connectedClients: 4,
    apiHealth: 'healthy',
    checkpointStorage: 'healthy',
    heartbeatStatus: 'healthy',
    loading: true,
  });

  const checkHealth = async () => {
    try {
      const [privRes, nodeRes] = await Promise.all([
        fetch('/api/benchmark/privacy'),
        fetch('/api/federation/nodes')
      ]);

      let privacyAuditPassed = true;
      if (privRes.ok) {
        const priv = await privRes.json();
        privacyAuditPassed = priv.privacy?.raw_logs_audit_passed ?? true;
      }

      let activeCount = 4;
      if (nodeRes.ok) {
        const nodes = await nodeRes.json();
        activeCount = nodes.filter((n: any) => n.status !== 'offline').length;
      }

      setHealth({
        flowerServer: activeCount > 0 ? 'healthy' : 'warning',
        supabase: 'healthy',
        dashboard: 'healthy',
        connectedClients: activeCount,
        apiHealth: 'healthy',
        checkpointStorage: privacyAuditPassed ? 'healthy' : 'warning',
        heartbeatStatus: 'healthy',
        loading: false,
      });
    } catch (error) {
      console.error('Error checking system health:', error);
      setHealth(prev => ({
        ...prev,
        flowerServer: 'critical',
        supabase: 'critical',
        loading: false
      }));
    }
  };

  useEffect(() => {
    if (isDemoMode) return;
    checkHealth();
    const interval = setInterval(checkHealth, pollingIntervalMs);
    return () => clearInterval(interval);
  }, [pollingIntervalMs, isDemoMode]);

  if (isDemoMode) {
    return {
      flowerServer: 'healthy',
      supabase: 'healthy',
      dashboard: 'healthy',
      connectedClients: 4,
      apiHealth: 'healthy',
      checkpointStorage: 'healthy',
      heartbeatStatus: 'healthy',
      loading: false
    };
  }

  return health;
}
