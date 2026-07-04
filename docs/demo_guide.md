# FedSOC AI: MVP Demonstration Guide

This guide outlines step-by-step presentation scripts, elevator pitches, and talking points for demonstrating the FedSOC AI Command Center platform.

---

## 1. The 5-Minute Elevator Demonstration Script

- **Step 1: Introduction (1 Minute)**
  - *Action*: Open the root marketing page at `/`.
  - *Talking Points*: "FedSOC AI is a collaborative threat intelligence platform. Legacy SIEM systems require exfiltrating all raw security logs to a central data lake, which incurs massive database bills and privacy liabilities. With FedSOC AI, raw logs remain local. We train a global cybersecurity classifier by exchanging only model parameters."
- **Step 2: Dashboard Overview & Nodes (1 Minute)**
  - *Action*: Click 'Launch Command Center' to open `/dashboard`. Enable **Demo Mode** via the floating panel.
  - *Talking Points*: "Here is the Executive Dashboard. Currently, we have 4 organizations connected: a bank, a hospital, a retail shop, and a telecom carrier. They are active but idle."
- **Step 3: Trigger Training (1 Minute)**
  - *Action*: Advance Demo Control Panel to **Step 2: FL Training**.
  - *Talking Points*: "I will now trigger a federated learning training round. In real-time, the nodes transition to 'Training' status. The Flower SuperLink coordinator broadcasts weights, the clients fit their local estimators, and send weights back. In 3 rounds, global accuracy rises from 70% to 97.96%."
- **Step 4: Simulate Threat & Explanations (1.5 Minutes)**
  - *Action*: Advance to **Step 5: Alert Trigger**. Then navigate to `/analyst` on the sidebar.
  - *Talking Points*: "Let's trigger a DDoS attack scenario. Instantly, an alert flashes. We open the AI SOC Analyst page. The local Llama 3.1 model has synthesized a structured incident report. We see the confidence, MITRE ATT&CK techniques, and containment steps. We can also audit the feature importance explainability charts showing that count and srv_count parameters triggered the alert."
- **Step 5: Corporate ROI (0.5 Minute)**
  - *Action*: Click `/business` in the sidebar.
  - *Talking Points*: "Finally, we see the business value. We saved 99.99% in network bandwidth, GDPR compliance is verified, and database ingestion bills are reduced by thousands of dollars per node annually."

---

## 2. Accelerator Demo Day FAQs

- **Q: Does federated learning decrease threat detection accuracy?**
  - *A*: No. Benchmarks show that our federated SGD and XGBoost models achieve 97.96% accuracy, matching centralized baselines while retaining data sovereignty.
- **Q: What LLM models run in the analyst workspace?**
  - *A*: By default, we run local Llama 3.1/3.3 models via Ollama to ensure zero log data leaves the organization, but we also support pluggable OpenAI GPT providers.
- **Q: How does this help with GDPR?**
  - *A*: Under GDPR, network flows containing raw IPs are protected. FedSOC keeps these logs localized within regional client networks.
