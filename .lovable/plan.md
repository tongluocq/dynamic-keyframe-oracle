## Goal

Apply Plan 2 to stabilize the Counterfactual Sweep curve, while making the **data source** for every sweep explicit in the GUI: what comes from the in-app physics simulator (Start button), what comes from manual user controls, and what is held fixed during one experiment.

## Data source audit (what answers your first question)

Tracing the current pipeline:

| Quantity used by the sweep | Where it comes from | Manual or system? |
|---|---|---|
| `sensorHistory.vibrationX/Y/Z` (1024-sample rolling buffer) | `PhysicsSimulator.step()` called every 100 ms while **Start** is on (`IndustrialMonitor.tsx` lines 116–127) | System (stochastic; changes every tick) |
| `currentState.thermal.system_temp` | Same simulator step | System |
| `currentState.hydraulic.pressure` baseline | Same simulator step (also mutated by injected faults) | System + manual fault injection |
| `pressureRange` slider | `CausalVisualizationPanel.tsx` line 732 | Manual |
| Injected failures and severities | "Inject Fault" controls → `failureSimulator` | Manual |
| CVGG model weights | Trained once via Initialize → Train | System (frozen after training) |

So **Start** is the *only* source of streaming sensor data; it drives `sensorHistory` and `currentState`. Manual controls only choose the pressure range, the failures, and when to train. The sweep instability comes from re-reading the still-running simulator buffers on every click.

## Changes

### 1. `src/components/IndustrialMonitor.tsx` — freeze background + MC replicates

Refactor `handleCounterfactualSweep` (lines 266–314) to:

- **Snapshot** `sensorHistory` and `currentState` into local consts at function entry. Reuse the same snapshot for every pressure point (no re-reads from React state mid-loop).
- Accept an options arg `{ replicates?: number }` (default 5). For each pressure value, run inference `replicates` times and return `{ pressure, effect: mean, std, lower, upper }` where bounds are `mean ± std`.
- Return type becomes `{ pressure: number; effect: number; std: number; lower: number; upper: number }[]`.
- Also return a `meta` object (via a new sibling handler or by storing in a ref) describing the frozen snapshot: timestamp, buffer length, baseline pressure/temp, whether the simulator was running, active failures. This feeds the Data Source badge below.

### 2. `src/components/CausalVisualizationPanel.tsx` — confidence band + data-source badge

- Update `onCounterfactualSweep` prop signature to the new return type, and update local `counterfactualResults` state accordingly.
- Replace the single `<Line>` with a Recharts composition:
  - `<Area dataKey="upper" / "lower">` rendered as a shaded band (use `--primary` at low opacity), or a `<ReferenceArea>`-style stacked area trick.
  - Solid `<Line dataKey="effect">` for the mean.
  - Keep the `y=0` reference line.
- Add a **"Data Source" panel** above the chart (small card with two columns):
  - **Frozen for this sweep** (system, auto): baseline pressure, system temp, vibration buffer length, snapshot timestamp, active failures at snapshot time. Label: badge "System · Frozen".
  - **Manual inputs**: pressure range (slider), MC replicates (new small input, default 5, range 1–20). Label: badge "Manual".
- Add a small legend line under the chart: "Shaded band = ±1σ over N Monte-Carlo replicates on the frozen background. Re-click Start → Run Sweep to refresh the snapshot."
- Keep the existing CSV/JSON export hooks working with the new fields (`effect`, `std`, `lower`, `upper`).

### 3. Global "Data Source" indicator (small, header-level)

In `IndustrialMonitor.tsx` near the Start button (around line 423), add a compact badge group:

- `Live Simulator: ● running / ○ paused` — driven by `isRunning`.
- `Sensor buffer: N / 1024 samples` — from `sensorHistory.vibrationX.length`.
- `Manual faults: K active` — from `activeFailures.length`.

This makes it visually obvious on every screen that streaming data comes from the Start button, while faults and sweep parameters are manual.

### 4. No changes to physics, CVGG model, training, or other panels.

## Why this satisfies your requirements

- **Plan 2 applied**: frozen background + Monte-Carlo confidence band → stable mean curve, honest uncertainty.
- **Flexibility preserved**: every new Start cycle or new sweep click takes a fresh snapshot, so different experiments can use different data sources.
- **Relatively fixed per experiment**: within one sweep, the background is locked, so the curve only varies along the do(pressure) axis.
- **GUI clarity**: the new Data Source panel and header badges make explicit which values come from the simulator (system) and which from manual controls.

## Technical notes

- Recharts band: easiest implementation is two stacked `<Area>` series — a transparent `lower` baseline area plus a `(upper - lower)` area on top with `fillOpacity≈0.2`. Alternatively render as `<Area dataKey="upper">` + `<Area dataKey="lower">` with `fill="transparent"` for the lower and a custom gradient.
- MC replicate count is bounded (≤20) to keep the sweep responsive; each replicate is one CVGG forward pass.
- Snapshot is a deep copy via `structuredClone` to prevent later simulator ticks from mutating arrays in place.
- The exported CSV/JSON from the Visualization panel will gain `std`, `lower`, `upper` columns/fields automatically.
