# Local Intrusion Detection Model Benchmark Report

This document compares the performance of local machine learning models trained independently across the simulated organizations (**Bank**, **Hospital**, **Retail**, and **Telecom**) using the multi-class CICIDS2017 dataset.

## 1. Overall Performance Comparison Table

| Organization | Model Type | Accuracy | Precision (Macro) | Recall (Macro) | F1-Score (Macro) | ROC-AUC | Training Time |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **BANK** | `SGD` | 0.9942 | 0.6097 | 0.4467 | 0.4839 | nan | 6.64s |
| **BANK** | `XGBOOST` | 0.9991 | 0.9687 | 0.9515 | 0.9589 | nan | 49.41s |
| **HOSPITAL** | `SGD` | 0.9823 | 0.6061 | 0.4546 | 0.4816 | nan | 7.57s |
| **HOSPITAL** | `XGBOOST` | 0.9998 | 0.9905 | 0.9908 | 0.9907 | nan | 67.47s |
| **RETAIL** | `SGD` | 0.9913 | 0.9089 | 0.9084 | 0.9069 | nan | 6.22s |
| **RETAIL** | `XGBOOST` | 0.9999 | 0.9985 | 0.9986 | 0.9986 | nan | 36.85s |
| **TELECOM** | `SGD` | 0.9801 | 0.4912 | 0.4851 | 0.4880 | nan | 14.93s |
| **TELECOM** | `XGBOOST` | 0.9998 | 0.9948 | 0.8698 | 0.9115 | nan | 85.60s |

## 2. Confusion Matrices

### Bank Silo

**SGD Classifier** (Diagonal/Correct predictions: 98158 / 98734 total):
```
[[97320     5     0     0     0]
 [  284     3     0     0     0]
 [    0     0     0     0     0]
 [    0     0     0     0     0]
 [    0     0     0     0     0]]
... plus 10 more classes
```

**XGBOOST Classifier** (Diagonal/Correct predictions: 98643 / 98734 total):
```
[[97332    43     0     0     0]
 [   27   260     0     0     0]
 [    0     0     0     0     0]
 [    0     0     0     0     0]
 [    0     0     0     0     0]]
... plus 10 more classes
```

### Hospital Silo

**SGD Classifier** (Diagonal/Correct predictions: 122393 / 124602 total):
```
[[97139     0   174     0     0]
 [    0     0     0     0     0]
 [  667     0 24936     0     0]
 [    0     0     0     0     0]
 [    0     0     0     0     0]]
... plus 10 more classes
```

**XGBOOST Classifier** (Diagonal/Correct predictions: 124575 / 124602 total):
```
[[97388     0     3     0     0]
 [    0     0     0     0     0]
 [    5     0 25598     0     0]
 [    0     0     0     0     0]
 [    0     0     0     0     0]]
... plus 10 more classes
```

### Retail Silo

**SGD Classifier** (Diagonal/Correct predictions: 100355 / 101240 total):
```
[[96946     0     0   137     0]
 [    0     0     0     0     0]
 [    0     0     0     0     0]
 [  347     0     0  1710     0]
 [    0     0     0     0     0]]
... plus 10 more classes
```

**XGBOOST Classifier** (Diagonal/Correct predictions: 101231 / 101240 total):
```
[[97348     0     0     1     0]
 [    0     0     0     0     0]
 [    0     0     0     0     0]
 [    0     0     0  2057     0]
 [    0     0     0     0     0]]
... plus 10 more classes
```

### Telecom Silo

**SGD Classifier** (Diagonal/Correct predictions: 129595 / 132233 total):
```
[[96926     0     0     0   435]
 [    0     0     0     0     0]
 [    0     0     0     0     0]
 [    0     0     0     0     0]
 [ 1901     0     0     0 32669]]
... plus 10 more classes
```

**XGBOOST Classifier** (Diagonal/Correct predictions: 132204 / 132233 total):
```
[[97347     0     0     0    14]
 [    0     0     0     0     0]
 [    0     0     0     0     0]
 [    0     0     0     0     0]
 [    2     0     0     0 34568]]
... plus 10 more classes
```


## 3. XGBoost Feature Importance (Top 10 Features)

Feature importance represents the relative information gain of network flow metrics:

### Bank XGBoost Classifier
| Rank | Feature Column Name | Relative Gain Value |
| --- | --- | --- |
| 1 | `Active Mean` | 3768.7390 |
| 2 | `Bwd IAT Total` | 2356.8503 |
| 3 | `Total Backward Packets` | 1074.5801 |
| 4 | `Avg Packet Size` | 847.9364 |
| 5 | `Active Std` | 750.3748 |
| 6 | `Bwd Packets Length Total` | 641.5753 |
| 7 | `Packet Length Min` | 547.7761 |
| 8 | `Flow Packets/s` | 369.4178 |
| 9 | `Fwd Act Data Packets` | 297.3830 |
| 10 | `Flow IAT Mean` | 276.7260 |

### Hospital XGBoost Classifier
| Rank | Feature Column Name | Relative Gain Value |
| --- | --- | --- |
| 1 | `Active Std` | 13933.5732 |
| 2 | `Bwd Packet Length Std` | 3134.8386 |
| 3 | `Fwd PSH Flags` | 2732.1626 |
| 4 | `Fwd Packet Length Max` | 2696.9587 |
| 5 | `Fwd Packets Length Total` | 1792.3999 |
| 6 | `Fwd Act Data Packets` | 1760.2523 |
| 7 | `PSH Flag Count` | 1198.9695 |
| 8 | `Total Backward Packets` | 725.1028 |
| 9 | `Bwd IAT Mean` | 634.3931 |
| 10 | `Fwd Header Length` | 340.6551 |

### Retail XGBoost Classifier
| Rank | Feature Column Name | Relative Gain Value |
| --- | --- | --- |
| 1 | `Bwd Packet Length Std` | 4611.5635 |
| 2 | `Total Fwd Packets` | 4350.5737 |
| 3 | `Bwd Packets Length Total` | 3264.6929 |
| 4 | `Fwd Packet Length Mean` | 1424.8765 |
| 5 | `Idle Mean` | 1394.9862 |
| 6 | `Bwd Header Length` | 1157.5587 |
| 7 | `Down/Up Ratio` | 926.1016 |
| 8 | `Packet Length Std` | 539.4786 |
| 9 | `Fwd PSH Flags` | 266.9570 |
| 10 | `Bwd IAT Mean` | 220.9249 |

### Telecom XGBoost Classifier
| Rank | Feature Column Name | Relative Gain Value |
| --- | --- | --- |
| 1 | `Bwd Packet Length Std` | 8739.2568 |
| 2 | `FIN Flag Count` | 481.3452 |
| 3 | `Packet Length Mean` | 355.7847 |
| 4 | `Avg Packet Size` | 228.1977 |
| 5 | `Fwd IAT Min` | 213.8892 |
| 6 | `Fwd Header Length` | 212.9814 |
| 7 | `Init Bwd Win Bytes` | 168.3390 |
| 8 | `Fwd Packet Length Mean` | 153.2426 |
| 9 | `Fwd IAT Mean` | 133.9896 |
| 10 | `Idle Mean` | 78.6168 |

