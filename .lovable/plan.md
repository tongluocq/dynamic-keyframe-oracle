

# IMSCHM Operation Flow -- Verification of Your Statements

## Statement 1: "Start will generate dataset, including Active Failures and Causal Anomalies"

**Mostly Correct, with clarification:**

- **Start** triggers `isRunning=true`, which starts a 100ms interval loop that:
  - Calls `simulator.step()` → generates real-time sensor readings across 5 domains
  - Calls `failureSimulator.progressFailures()` → updates Active Failures (but failures must first be **manually injected** via the failure injection buttons; Start alone does not create failures)
  - Feeds readings into `causalAnalyzer.addData()` → runs PC algorithm every 100 readings
  - Calls `causalAnalyzer.detectCausalAnomalies()` → updates Causal Anomalies display

So: Start generates the **live sensor stream** and runs **traditional PC-based causal discovery + anomaly detection** automatically. Active Failures only appear if the user injects them via the failure buttons.

## Statement 2: "Based on the dataset, different option branches do causality"

**Correct.** The tab buttons (do(), What-if, Prescriptive, Verify, Knowledge) all receive `currentState`, `sensorData`, `causalGraph`, or `anomalies` as props -- all of which are populated by Start. These panels consume the live data to perform their respective causal reasoning.

- `do()` (Intervention) -- receives `currentState` + `cvggResult`
- `What-if` (Counterfactual) -- receives `currentState` + `cvggResult`
- `Prescriptive` -- receives `currentState`, `anomalies`, `activeFailures`, `causalGraph`, `cvggResult`, `inferenceHistory`
- `Verify` -- receives `sensorData` + `isRunning`
- `Knowledge` -- receives `causalGraph`
- `Results` -- reads from localStorage (saved results from all operations)

## Statement 3: "Cases and Examples are independent, derived from saved history data"

**Partially Correct, but more precisely:**

- `<CausalExamplesPanel />` -- receives **no props at all**. It uses entirely **hardcoded/pre-built example data** (not saved history). It is fully independent of Start.
- `<OperationCasesPanel />` -- also receives **no props**. It uses **pre-built case study data**, not user session history. Also fully independent.

So they are independent of Start, but they use **built-in demonstration data**, not "saved history." The saved history lives in the **Results** tab.

## Statement 4: "CVGG then can be used by order: Config, Training, Inference"

**Correct.** The `EnhancedCVGGPanel` implements a sequential workflow:
1. Config (set hyperparameters)
2. Training (build and train model)
3. Inference (run on live sensor data)

This requires Start to be running for meaningful inference (it needs `currentState` and `sensorHistory`).

## Statement 5: "From Results, must rely on above data and operation, then Report will be generated"

**Correct.** The Results panel:
- Displays `StoredResult` entries saved to localStorage by other operations (CVGG training/inference, interventions, counterfactuals, etc.)
- Report generation buttons (EDA, IMSCHM Academic, Thesis Chapter, CVGG vs IMSCHM Comparison) pull from these stored results
- The Dataset Demo panel within Results generates its own simulated data independently

---

## Summary: Corrected Operation Flow

```text
┌─────────────────────────────────────────────────────┐
│  START (required first for live data)                │
│  ├── Physics Simulator → 5-domain sensor stream     │
│  ├── Failure Injection (manual) → Active Failures   │
│  ├── PC Algorithm (auto) → Causal Graph             │
│  └── Anomaly Detection (auto) → Causal Anomalies   │
└──────────────┬──────────────────────────────────────┘
               │ feeds live data to
               ▼
┌─────────────────────────────────────────────────────┐
│  DEPENDENT BRANCHES (need Start data)               │
│  ├── CVGG: Config → Train → Inference               │
│  ├── do() Intervention                              │
│  ├── What-if Counterfactual                         │
│  ├── Prescriptive AI                                │
│  ├── Verify (dataset verification)                  │
│  └── Knowledge Base                                 │
└──────────────┬──────────────────────────────────────┘
               │ saves results to localStorage
               ▼
┌─────────────────────────────────────────────────────┐
│  RESULTS (aggregates all saved operations)          │
│  ├── View/filter/export stored results              │
│  ├── Dataset Demo (independent simulation)          │
│  └── Report Generation (6 report types)             │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  INDEPENDENT (no Start needed)                      │
│  ├── Examples: pre-built demonstration data         │
│  └── Cases: pre-built operation case studies        │
└─────────────────────────────────────────────────────┘
```

**Key corrections to your understanding:**
1. Active Failures require **manual injection** -- Start alone doesn't create them
2. Cases and Examples use **built-in hardcoded data**, not saved history
3. The do(), What-if, and Prescriptive panels can technically open without Start, but will show empty/default data without the live sensor stream

