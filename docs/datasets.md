# CICIDS2017 Refined Dataset Report

This report documents the structural features, label mappings, independent client statistics, and partitioning strategy for the refined **CICIDS2017 Parquet dataset**.

## 1. Global Raw Dataset Summary

- **Total Raw Rows**: 2,313,810
- **Total Columns**: 78
- **Memory Usage**: 580.93 MB
- **Duplicate Rows**: 82,004
- **Total Missing Values**: 0

## 2. Multi-Class Label Encoder Mapping

The target strings have been mapped to multiclass integer identifiers:

| Original Class Name | Encoded Integer Target |
| --- | --- |
| `Benign` | `0` |
| `Bot` | `1` |
| `DDoS` | `2` |
| `DoS GoldenEye` | `3` |
| `DoS Hulk` | `4` |
| `DoS Slowhttptest` | `5` |
| `DoS slowloris` | `6` |
| `FTP-Patator` | `7` |
| `Heartbleed` | `8` |
| `Infiltration` | `9` |
| `PortScan` | `10` |
| `SSH-Patator` | `11` |
| `Web Attack - Brute Force` | `12` |
| `Web Attack - Sql Injection` | `13` |
| `Web Attack - XSS` | `14` |

## 3. Global Threat Class Distributions

| Threat Class Name | Flow Count | Percentage |
| --- | --- | --- |
| `Benign` | 1,977,318 | 85.4572% |
| `DoS Hulk` | 172,846 | 7.4702% |
| `DDoS` | 128,014 | 5.5326% |
| `DoS GoldenEye` | 10,286 | 0.4445% |
| `FTP-Patator` | 5,931 | 0.2563% |
| `DoS slowloris` | 5,385 | 0.2327% |
| `DoS Slowhttptest` | 5,228 | 0.2259% |
| `SSH-Patator` | 3,219 | 0.1391% |
| `PortScan` | 1,956 | 0.0845% |
| `Web Attack - Brute Force` | 1,470 | 0.0635% |
| `Bot` | 1,437 | 0.0621% |
| `Web Attack - XSS` | 652 | 0.0282% |
| `Infiltration` | 36 | 0.0016% |
| `Web Attack - Sql Injection` | 21 | 0.0009% |
| `Heartbleed` | 11 | 0.0005% |

## 4. Federated Client Silo Partitioning (Non-IID)

To replicate a realistic federated environment, normal baseline (`Benign`) traffic is split disjointly among nodes, while threat vectors are dynamically routed by sorted class indices to simulate independent client security profiles:

| Client Silo | Friendly Name | Row Count | Target Attack Categories |
| --- | --- | --- | --- |
| **BANK** | `Bank` | 493,670 | DoS GoldenEye, DoS slowloris, Heartbleed, SSH-Patator |
| **HOSPITAL** | `Hospital` | 623,008 | Bot, DDoS, DoS Slowhttptest, Infiltration, Web Attack - Sql Injection |
| **RETAIL** | `Retail` | 506,197 | DoS Hulk, FTP-Patator, PortScan, Web Attack - Brute Force |
| **TELECOM** | `Telecom` | 661,161 | Benign baseline, Web Attack - XSS |

## 5. Local Preprocessing & Local Scaling Stats

Each client node independently preprocesses its dataset and fits its own `StandardScaler`. This ensures that mean and variance profiles are never leaked or shared globally. Below is a comparison of client stats post-scaling:

| Client | Total Preprocessed Rows | Cleaned Columns | Missing Values | Memory size | Attack Ratio |
| --- | --- | --- | --- | --- | --- |
| **BANK** | 493,670 | 79 | 0 | 304.24 MB | 1.36% |
| **HOSPITAL** | 623,008 | 79 | 0 | 383.69 MB | 21.83% |
| **RETAIL** | 506,197 | 79 | 0 | 312.03 MB | 3.84% |
| **TELECOM** | 661,161 | 79 | 0 | 407.76 MB | 26.37% |

## 6. Local Feature Profiles (Sample of Bank Silo)

Below is a sample of local scaling statistics fitted for the **Bank** client partition:

| Feature Column | Mean | Standard Deviation | Min | Max |
| --- | --- | --- | --- | --- |
| `Protocol` | -0.0000 | 1.0000 | -2.0376 | 1.0539 |
| `Flow Duration` | -0.0000 | 1.0000 | -0.4163 | 3.2736 |
| `Total Fwd Packets` | -0.0000 | 1.0000 | -0.0125 | 250.0796 |
| `Total Backward Packets` | 0.0000 | 1.0000 | -0.0120 | 256.0540 |
| `Fwd Packets Length Total` | -0.0000 | 1.0000 | -0.0750 | 278.0805 |
| `Bwd Packets Length Total` | 0.0000 | 1.0000 | -0.0079 | 235.8659 |
| `Fwd Packet Length Max` | 0.0000 | 1.0000 | -0.3071 | 26.8072 |
| `Fwd Packet Length Min` | -0.0000 | 1.0000 | -0.3610 | 29.7102 |
| `Fwd Packet Length Mean` | -0.0000 | 1.0000 | -0.3377 | 26.4695 |
| `Fwd Packet Length Std` | -0.0000 | 1.0000 | -0.2550 | 20.8077 |
