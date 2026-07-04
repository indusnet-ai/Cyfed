# Federated Learning Benchmark Overview

This document links to the comprehensive benchmark metrics and evaluations of the FedCore platform.

---

## 1. Complete Report
The detailed benchmark report, including technical performance comparisons, convergence charts, and business value metrics, is compiled at:
- **[federated_benchmark.md](file:///e:/CyberFed%20AI/docs/federated_benchmark.md)**

---

## 2. Key Findings Summary

### 2.1 Ingestion Bandwidth Reduction
By transmitting abstract model gradients instead of raw log parquets, the bandwidth requirement dropped by **99.99%**, saving **2.28 GB** of network ingestion:

- **Centralized Data Transfer**: 2.28 GB
- **Federated Data Transfer**: 224.64 KB
- **Savings Ratio**: 99.99% Ingestion Savings

### 2.2 Convergence & Accuracy
The global model aggregates features across non-IID target spaces in 3 rounds, achieving a convergent accuracy of **97.96%**:

- **Round 1 Accuracy**: 98.61%
- **Round 2 Accuracy**: 98.04%
- **Round 3 Accuracy**: 97.96%

### 2.3 Regulatory Compliance
Raw data never escapes local client node firewalls. This natively satisfies Article 25 (Privacy by Design) of **GDPR**, HIPAA security rules, PCI-DSS cardholder restrictions, and **ISO 27001** logs isolation rules.
