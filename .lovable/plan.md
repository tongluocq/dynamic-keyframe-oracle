
# Plan: Add Dataset Simulation Report Generation

## Summary

Create a new academic report function that documents the IMSCHM dataset simulation procedure, emphasizing the multi-system physics-based simulation architecture and its rationality for causal AI benchmarking. This report will be accessible via a new button in the Results panel alongside the existing "Generate Report" and "Generate Example&Case" buttons.

---

## What Will Be Built

### New Report: "Dataset Simulation Methodology Report"

A comprehensive technical document covering:

1. **Multi-System Simulation Architecture**
   - 5-domain physics model (Hydraulic, Mechanical, Thermal, Electrical, Cutting)
   - Cross-domain causal relationships with mathematical formulations
   - State variable definitions with engineering units

2. **Data Generation Pipeline**
   - Sensor signal simulation (6-channel CWRU-style accelerometers + environmental)
   - 2D rock image integration from TBM industrial field
   - Wavelet transform to scalogram conversion
   - Causal metadata injection (interventions, confounders, instrumental variables)

3. **Rationality for Causal AI**
   - Why synthetic data with known ground-truth causality is essential for benchmarking
   - Physics-grounded equations prevent "cheat-sheet" trivial discovery
   - Verification suite proving non-trivial causal structure

4. **Causal Verification Evidence**
   - 6-test verification framework results
   - CWRU bearing dataset comparison
   - Time lag and confounder challenge results

---

## Technical Details

### File: `src/utils/resultsStorage.ts`

Add new method `generateDatasetSimulationReport()`:

```typescript
/**
 * Generate Academic Report on Dataset Simulation Methodology
 * Documents the multi-system physics-based simulation procedure
 * and its rationality for causal AI benchmarking
 */
generateDatasetSimulationReport(): string {
  const now = new Date();
  
  let report = `# IMSCHM Dataset Simulation Methodology Report

**Document Type:** Technical Methodology Report  
**Generated:** ${now.toISOString()}  
**Purpose:** Document multi-system simulation procedure and causal AI rationality

---

## Abstract

This report documents the synthetic dataset generation methodology for the 
IMSCHM benchmark platform. The simulation implements a physics-based 
multi-domain industrial system model that generates sensor data with 
verifiable ground-truth causal relationships...

## 1. Multi-System Simulation Architecture

### 1.1 Five-Domain Physical Model

The simulator models five interconnected industrial subsystems:

| Domain | State Variables | Engineering Units |
|--------|-----------------|-------------------|
| Hydraulic | pressure, flow_rate, temperature, viscosity, contamination | bar, L/min, °C, cSt, % |
| Mechanical | vibration_x/y/z, torque, speed, wear_level | mm/s, Nm, rpm, % |
| Thermal | ambient_temp, system_temp, heat_dissipation, gradient | °C, W, °C/m |
| Electrical | voltage, current, power, frequency, phase_shift | V, A, W, Hz, ° |
| Cutting | tool_wear, cutting_force, surface_quality, chip_formation | %, N, Ra, - |

### 1.2 Cross-Domain Causal Equations

The following physics-grounded equations govern cross-domain interactions:

**Hydraulic-Mechanical Bridge:**
\`\`\`
Torque = 100 + (Pressure - 150) × 0.5 + ε
\`\`\`
Physical Basis: Pascal's Law (F = P × A), Torque = Force × radius

**Electrical-Thermal Bridge:**
\`\`\`
Heat = Power × 0.02 (Joule heating)
System_Temp = Ambient + Heat + Friction_Heat - Dissipation
\`\`\`
Physical Basis: Joule's First Law (Q = I²Rt)

... [continues with all physics equations from PhysicsSimulator]

## 2. Data Generation Pipeline

### 2.1 Sensor Signal Generation

The system generates 6-channel sensor signals:

**CWRU-Style Channels (DE, FE, BA):**
- Simulated accelerometer signals based on CWRU bearing dataset characteristics
- RMS values calibrated to match real-world measurements (0.1-0.8 mm/s range)
- Includes characteristic fault frequencies (BPFO, BPFI patterns)

**Environmental Channels (Temperature, Pressure, Humidity):**
- Physics-driven evolution based on thermal equations
- Realistic noise injection (CV: 2-15%)

### 2.2 Rock Image Integration

2D rock images from TBM industrial field operations are integrated:
- Geological texture features (hardness, fracture patterns)
- Abrasive content indicators
- VGG backbone extracts 256-dim embeddings

### 2.3 Causal Metadata Injection

Structured intervention and confounder data:
- Intervention types: pressure_spike, speed_adjustment, load_change, thermal_shock
- Confounders: ambient temperature, working load
- Instrumental variables for IV estimation

## 3. Rationality for Causal AI Benchmarking

### 3.1 Why Synthetic Data with Known Ground Truth?

**The Fundamental Problem:** In real industrial data, true causal relationships 
are unknown. Discovered "causal" links may be:
- Spurious correlations from confounders
- Reverse causation
- Mediated effects misidentified as direct

**The Solution:** Synthetic data with physics-grounded ground truth enables:
- Quantitative accuracy measurement of causal discovery algorithms
- Direct comparison against known DAG structure
- Controlled injection of confounders and interventions

### 3.2 Non-Trivial Causality Guarantee

The simulation is NOT a "cheat-sheet" because:

1. **Stochastic Noise:** All variables include 5% Gaussian noise preventing 
   deterministic reverse-engineering

2. **Time Lags:** Cross-domain effects have realistic propagation delays
   (1-10 steps based on physical inertia)

3. **Hidden Confounders:** Ambient temperature affects multiple domains 
   without direct measurement

4. **Non-Linear Thresholds:** Saturation and threshold behaviors create 
   complex patterns

5. **Multi-Path Mediation:** Effects propagate through multiple intermediate 
   variables

### 3.3 Verification Suite Evidence

The CausalDatasetVerifier runs 6 tests proving non-trivial structure:

| Test | Purpose | Evidence |
|------|---------|----------|
| Non-Trivial Discovery | Direct > mediated correlation | Causal paths show 20-40% stronger correlation |
| Time Lag Verification | Thermal inertia delays | Best correlation at lag 3-5 steps |
| Noise Realism | Industrial-grade CV | 3-12% coefficient of variation |
| Confounder Challenge | Spurious < causal | Ambient→X paths dominate spurious links |
| Intervention Response | Slope matches physics | Pressure→Torque slope within 30% of expected |
| CWRU Comparison | Realistic RMS range | Simulated RMS matches CWRU: 0.1-0.8 mm/s |

## 4. Failure Mode Injection

### 4.1 Five Failure Scenarios

| ID | Name | Domain | Progression | Causal Chain |
|----|------|--------|-------------|--------------|
| hydraulic_leak | Hydraulic System Leak | hydraulic | gradual | P→F, P→T (cross-domain) |
| bearing_wear | Bearing Wear | mechanical | gradual | W→Vx, W→Vy, Vx→SQ |
| thermal_overload | Thermal Overload | thermal | sudden | E_P→T, T→μ, T→V |
| voltage_fluctuation | Voltage Fluctuation | electrical | intermittent | V→P, V→S |
| tool_wear_excessive | Excessive Tool Wear | cutting | gradual | TW→CF, CF→T, TW→SQ |

### 4.2 Progression Models

\`\`\`
Gradual: severity += 0.001 × Δt × (1 + severity)  // Exponential growth
Sudden:  severity += 0.0005 × Δt (before threshold), 0.1 × Δt (after)
Intermittent: severity += sin(t × 0.001) × 0.1 + 0.0002 × Δt
\`\`\`

## 5. Causal Graph Ground Truth

### 5.1 Known DAG Structure

\`\`\`
                    Electrical
                        │
                        ▼
Hydraulic ◄───────► Mechanical
     │                  │
     ▼                  ▼
  Thermal ◄────────► Cutting
     │
     ▼
[Ambient Confounder]
\`\`\`

### 5.2 Edge Weights and Lags

| Cause | Effect | Weight | Lag (steps) | Physical Basis |
|-------|--------|--------|-------------|----------------|
| Pressure | Torque | 0.5 | 1 | Pascal's Law |
| Torque | Vibration | 0.6 | 2 | Rotordynamics |
| Power | Temperature | 0.8 | 5 | Joule heating |
| Temperature | Viscosity | -0.7 | 3 | Arrhenius |
| Vibration | Surface Quality | -0.4 | 2 | Dynamic machining |
| Tool Wear | Cutting Force | 0.6 | 1 | Taylor equation |

## 6. Conclusion

The IMSCHM dataset simulation provides a rigorous benchmark for causal AI 
algorithms by implementing:

1. **Physics-Grounded Causality:** Equations derived from engineering first principles
2. **Multi-System Complexity:** 5 domains with 25+ state variables
3. **Realistic Challenges:** Noise, lags, confounders, non-linearities
4. **Verifiable Ground Truth:** Known DAG for algorithm accuracy measurement
5. **Industrial Relevance:** CWRU-calibrated, TBM-contextualized

This enables fair comparison of causal discovery and inference methods 
without the ambiguity inherent in purely observational industrial data.

---

## References

1. Merritt, H.E. (1967). Hydraulic Control Systems. Wiley.
2. Bird, R.B. et al. (2007). Transport Phenomena. Wiley.
3. Randall, R.B. (2011). Vibration-based Condition Monitoring.
4. CWRU Bearing Data Center. Case Western Reserve University.
5. Pearl, J. (2009). Causality: Models, Reasoning, and Inference.

---

*Report generated by IMSCHM v1.0 - Dataset Simulation Methodology Documentation*
`;

  return report;
}
```

Add download method:

```typescript
downloadDatasetSimulationReport(): void {
  const markdown = this.generateDatasetSimulationReport();
  const filename = `IMSCHM-Dataset-Simulation-Report-${new Date().toISOString().split('T')[0]}.md`;
  this.downloadFile(markdown, filename, 'text/markdown');
}
```

---

### File: `src/components/OperationResultsPanel.tsx`

Add new button in the action bar:

```typescript
<Button
  variant="outline"
  size="sm"
  onClick={() => resultsStorage.downloadDatasetSimulationReport()}
  className="text-xs bg-emerald-50 hover:bg-emerald-100 border-emerald-300"
>
  <Database className="h-4 w-4 mr-1 text-emerald-600" />
  Generate Dataset Report
</Button>
```

---

## Report Structure Summary

The generated report will have these sections:

```text
1. Abstract
2. Multi-System Simulation Architecture
   2.1 Five-Domain Physical Model (table of 25+ variables)
   2.2 Cross-Domain Causal Equations (6 physics formulations)
3. Data Generation Pipeline
   3.1 Sensor Signal Generation (CWRU-style)
   3.2 Rock Image Integration (TBM field data)
   3.3 Causal Metadata Injection
4. Rationality for Causal AI Benchmarking
   4.1 Why Synthetic Data with Ground Truth
   4.2 Non-Trivial Causality Guarantee (5 mechanisms)
   4.3 Verification Suite Evidence (6-test table)
5. Failure Mode Injection
   5.1 Five Failure Scenarios (table)
   5.2 Progression Models (equations)
6. Causal Graph Ground Truth
   6.1 Known DAG Structure (ASCII diagram)
   6.2 Edge Weights and Lags (table)
7. Conclusion
8. References
```

---

## Implementation Steps

1. **Add `generateDatasetSimulationReport()` to `resultsStorage.ts`**
   - Comprehensive Markdown generation with all physics equations
   - Include verification suite integration
   - Reference `PhysicsSimulator` and `FailureSimulator` data

2. **Add `downloadDatasetSimulationReport()` method**
   - File download trigger

3. **Add UI button in `OperationResultsPanel.tsx`**
   - Place alongside existing report buttons
   - Use Database icon with emerald color theme

4. **Add translation keys for button label**
   - English, Chinese, Japanese, Spanish support

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/utils/resultsStorage.ts` | Add `generateDatasetSimulationReport()` and `downloadDatasetSimulationReport()` methods |
| `src/components/OperationResultsPanel.tsx` | Add new button with Database icon |
| `src/contexts/LanguageContext.tsx` | Add translation for "Generate Dataset Report" label |

---

## Expected Outcome

After implementation, users can click "Generate Dataset Report" in the Results panel to download a comprehensive Markdown document that:

1. Documents the complete 5-domain physics simulation architecture
2. Lists all 25+ state variables with engineering units
3. Presents the 6 cross-domain causal equations with physical basis
4. Explains why synthetic data with known ground truth is essential for causal AI
5. Provides verification evidence from the 6-test suite
6. Documents the 5 failure modes and progression models
7. Presents the ground-truth DAG with edge weights and lags
8. Includes academic references for all physics formulations
