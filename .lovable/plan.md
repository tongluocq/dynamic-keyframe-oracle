

# Plan: Add Integrated Performance Summary Tables to Results Panel

## Problem

Currently, results from each workflow stage (CVGG training/inference, interventions, counterfactuals, prescriptive AI) are stored and displayed individually in a scattered list/table. There is no unified view that consolidates all results into comprehensive performance summary tables showing end-to-end system performance.

## Solution

Add a new **"Performance Summary"** tab in the Results panel that aggregates all stored results into 2-3 integrated tables:

### Table 1: End-to-End Pipeline Performance
Aggregates the latest result from each workflow stage into one row-per-stage table:

| Pipeline Stage | Pearl Level | Key Metric | Value | Status | Timestamp |
|---|---|---|---|---|---|
| CVGG Training | -- | Accuracy | 94.2% | Done | 10:23 |
| CVGG Inference | L1 | ATE | 0.4231 | Done | 10:25 |
| do() Intervention | L2 | Risk Reduction | -23.4% | Done | 10:27 |
| Counterfactual | L3 | Causal Effect | 15.2% | Done | 10:28 |
| Prescriptive AI | L1+L2+L3 | Health Score | 72/100 | Done | 10:30 |

### Table 2: Causal Effects Comparison
Side-by-side comparison of causal metrics across all inference/intervention/counterfactual results:

| Metric | CVGG Inference | Intervention | Counterfactual | Trend |
|---|---|---|---|---|
| ATE | 0.4231 | 0.35 (post) | 0.38 | Decreasing |
| Risk Level | 38% | 29% (post) | 33% | Improved |
| Confidence | 91.2% | 88.5% | 85.1% | Stable |

### Table 3: System Health Dashboard (single-row summary)
One consolidated row with key KPIs extracted from the latest results of each type.

## Files to Modify

| File | Changes |
|---|---|
| `src/components/OperationResultsPanel.tsx` | Add "Summary" tab alongside List/Table/Stats; add `PerformanceSummaryView` component that reads all results and builds the 3 integrated tables |
| `src/utils/resultsStorage.ts` | Add `getPerformanceSummary()` method that extracts key metrics from the latest result of each operation type and returns a structured summary object |
| `src/contexts/LanguageContext.tsx` | Add translation for "Performance Summary" tab label |

## Implementation Details

- `getPerformanceSummary()` finds the **most recent** result of each type and extracts: metric name, value, Pearl level, status
- Tables show "N/A" or "--" for stages not yet executed, making it clear which workflow steps remain
- A "Download Summary" button exports just the summary tables as Markdown
- Color-coded status: green (done/healthy), yellow (warning), red (critical), gray (not run)
- The summary auto-updates as new results are added via the existing `subscribe()` mechanism

