import { useState, useEffect } from 'react';
import { useDemo } from '../context/useDemoContext';

export interface BusinessValueData {
  comparison: Record<string, { centralized: string; federated: string }>;
  privacy_impact: {
    raw_dataset_size_gb: number;
    total_model_update_size_kb: number;
    bandwidth_reduction_percentage: number;
  };
  regulatory_alignment: Record<string, string>;
  cost_projections: Record<string, {
    centralized_storage_mb: number;
    federated_storage_mb: number;
    bandwidth_saved_pct: number;
  }>;
  executive_summary: Record<string, string>;
}

export function useBusinessValue() {
  const { isDemoMode } = useDemo();
  const [data, setData] = useState<BusinessValueData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBusinessValue = async () => {
    try {
      const res = await fetch('/api/benchmark/business');
      if (res.ok) {
        const payload = await res.json();
        setData(payload.business);
      }
    } catch (error) {
      console.error('Error fetching business value:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isDemoMode) return;
    fetchBusinessValue();
  }, [isDemoMode]);

  if (isDemoMode) {
    return {
      data: {
        comparison: {
          "Raw Data Transfer": { centralized: "100% of raw log files must be uploaded to cloud repositories.", federated: "0% raw network flows leave local client firewalls." },
          "Privacy & Security Risk": { centralized: "High. Central data lakes create single targets for breaches.", federated: "Extremely Low. Only model updates are transmitted." },
          "Regulatory Compliance": { centralized: "Complex audits. Involves third-party cross-border transfers.", federated: "Compliant-by-design (GDPR, HIPAA, PCI-DSS, ISO 27001)." },
          "Ingestion Storage Cost": { centralized: "Huge cloud disk ingestion bills to host petabytes of logs.", federated: "Virtually Zero. Local storage is retained by clients." },
          "Data Ownership": { centralized: "Relinquished to centralized host aggregation provider.", federated: "Retained 100% locally by the creating organization." }
        },
        privacy_impact: {
          raw_dataset_size_gb: 2.28,
          total_model_update_size_kb: 224.0,
          bandwidth_reduction_percentage: 99.99
        },
        regulatory_alignment: {
          GDPR: "Compliant", HIPAA: "Compliant", "PCI-DSS": "Compliant", "ISO 27001": "Compliant"
        },
        cost_projections: {
          "4 Nodes": { centralized_storage_mb: 9120, federated_storage_mb: 0.16, bandwidth_saved_pct: 99.99 },
          "25 Nodes": { centralized_storage_mb: 57000, federated_storage_mb: 1.0, bandwidth_saved_pct: 99.99 },
          "100 Nodes": { centralized_storage_mb: 228000, federated_storage_mb: 4.0, bandwidth_saved_pct: 99.99 }
        },
        executive_summary: {
          savings: "$45,200 annual cloud database savings estimated per 10 client silos.",
          audits: "Continuous zero-leakage parameter updates verified."
        }
      },
      loading: false
    };
  }

  return { data, loading };
}
