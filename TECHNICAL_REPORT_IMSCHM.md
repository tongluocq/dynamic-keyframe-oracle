# Technical Report: IMSCHM - Intelligent Manufacturing System Causal Health Monitor

## A Comprehensive Causal Inference Framework for Industrial Predictive Maintenance

---

**Document Version:** 1.0  
**Date:** January 2026  
**Classification:** Academic Technical Report

---

## Abstract

This technical report presents the Intelligent Manufacturing System Causal Health Monitor (IMSCHM), a comprehensive web-based platform for industrial predictive maintenance that integrates Causal Variational Gated Graphs (CVGG) with advanced causal inference capabilities. The system architecture distinguishes between two primary functional layers: (1) the CVGG core, which provides raw causal effect measurements including Average Treatment Effect (ATE), Conditional Average Treatment Effect (CATE), and direct/indirect effect decomposition; and (2) the IMSCHM application layer, which handles simulation, visualization, decision-making, and human-interpretable outputs. This report clarifies the contribution of each non-CVGG component to the overall system functionality.

**Keywords:** Causal Inference, Predictive Maintenance, Industrial IoT, Deep Learning, Counterfactual Reasoning, Prescriptive Analytics, TensorFlow.js

---

## 1. Introduction

### 1.1 Background and Motivation

Modern industrial systems, particularly Tunnel Boring Machines (TBMs), operate as complex multi-domain physical systems where hydraulic, mechanical, thermal, electrical, and cutting subsystems exhibit intricate causal interdependencies. Traditional predictive maintenance approaches based on correlation analysis fail to distinguish between spurious associations and true causal relationships, limiting their effectiveness for intervention planning and counterfactual reasoning.

### 1.2 System Overview

IMSCHM addresses these limitations by implementing a causality-aware monitoring system that answers three fundamental causal questions:

1. **Associational Queries (L1):** "What is P(Y|X)?" — Observational predictions
2. **Interventional Queries (L2):** "What is P(Y|do(X=x))?" — Causal interventions  
3. **Counterfactual Queries (L3):** "What would Y have been if X had been x'?" — Hypothetical reasoning

### 1.3 Component Distribution

The IMSCHM platform is structured as follows:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              IMSCHM Platform                             │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                     CVGG Core (Numerical Engine)                 │    │
│  │  • ATE/CATE Estimation        • IV Estimation                   │    │
│  │  • Direct/Indirect Effects    • Confounder Proxy                │    │
│  │  • Classification Logits      • Latent Embeddings               │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                    │                                     │
│                                    ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                IMSCHM Application Layer (Non-CVGG)              │    │
│  ├─────────────────────────────────────────────────────────────────┤    │
│  │  PhysicsSimulator      │  Counterfactual Engine    │            │    │
│  │  CausalDiscovery       │  Prescriptive AI Engine   │            │    │
│  │  FailureSimulator      │  Decision Support UI      │            │    │
│  │  NeuralCausalEncoder   │  Visualization Layer      │            │    │
│  │  CausalIntervention    │  Interpretability         │            │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. CVGG Core: Causal Effect Measurement Engine

### 2.1 Architectural Overview

The CVGG (Causal Variational Gated Graph) core is implemented in `enhancedCausalVGG.ts` and provides the foundational causal effect measurements upon which all other system components depend.

### 2.2 Core Outputs

| Output | Type | Description |
|--------|------|-------------|
| `ATE` | Float | Average Treatment Effect across all samples |
| `CATE` | Float | Conditional Average Treatment Effect for subpopulations |
| `directEffect` | Float | Effect not mediated through intermediate variables |
| `indirectEffect` | Float | Effect mediated through causal pathways |
| `classificationLogits` | Tensor | Multi-class failure classification probabilities |
| `embeddings` | Tensor | Latent representation for downstream tasks |
| `confounderProxy` | Tensor | Estimated unobserved confounders for IV estimation |

### 2.3 CVGG Architecture

```
Input Modalities
     │
     ├──► Rock Image ──────► VGG Backbone (5 blocks) ──┐
     │                                                   │
     ├──► 6-ch Scalogram ──► VGG Backbone (shared) ────┼──► Shared Embedding
     │                                                   │
     └──► Causal Metadata ──► Bypass Encoder ──────────┘
                                    │
                ┌───────────────────┴───────────────────┐
                ▼                                       ▼
        Classification Head                    Causal Inference Head
              │                                        │
              ▼                                        ▼
        Class Logits                         ATE, CATE, Direct,
                                            Indirect, Confounder
```

### 2.4 What CVGG Does NOT Provide

CVGG provides **numerical estimates** but does not:
- Generate human-readable recommendations
- Simulate physical system dynamics
- Provide DAG visualization
- Perform causal structure discovery from data
- Answer specific "What if?" questions

These capabilities are provided by the IMSCHM application layer components described below.

---

## 3. Physics Simulator: Ground Truth Data Generation

### 3.1 Component Location
`src/utils/physicsSimulator.ts`

### 3.2 Purpose and Contribution

The Physics Simulator serves as the **ground truth generator** for the IMSCHM system, implementing domain-specific causal relationships based on engineering first principles. This component is essential for:

1. **Training Data Generation:** Provides causally-structured synthetic data for model training
2. **Validation:** Enables verification of causal discovery algorithms
3. **Demonstration:** Allows real-time demonstration without physical sensors

### 3.3 Implemented Causal Relationships

The simulator implements five cross-domain causal pathways:

```
                    Electrical Power
                          │
                          ▼
    ┌─────────► Hydraulic Pressure ◄───────────┐
    │                   │                       │
    │                   ▼                       │
    │           Mechanical Torque               │
    │                   │                       │
    │                   ▼                       │
    │           Mechanical Vibration            │
    │                   │                       │
Temperature ◄──────────┘                       │
    │                                           │
    ▼                                           │
Hydraulic Viscosity                    Tool Wear ──► Surface Quality
    │                                           ▲
    └───────────────────────────────────────────┘
```

**Key Causal Equations:**

1. **Hydraulic-Mechanical Bridge:**
   ```
   Torque = 100 + (Pressure - 150) × 0.5
   ```

2. **Thermal-Viscosity Relationship:**
   ```
   Viscosity = 30 + (Temperature - 40) × 0.5
   ```

3. **Wear-Vibration Amplification:**
   ```
   Vibration = 0.5 × (1 + WearLevel × 2)
   ```

4. **Electrical-Thermal Coupling:**
   ```
   SystemTemp = AmbientTemp + Power × 0.02 + Torque × 0.01 - Dissipation × 0.001
   ```

### 3.4 Contribution to IMSCHM

| Capability | Physics Simulator Role |
|------------|------------------------|
| Data Streaming | Generates real-time sensor values |
| Causal Ground Truth | Encodes known causal mechanisms |
| Failure Injection | Accepts severity parameters for fault simulation |
| Noise Modeling | Adds realistic measurement noise (σ = 5%) |

---

## 4. Causal Discovery Engine: Structure Learning

### 4.1 Component Location
`src/utils/causalInference.ts`

### 4.2 Purpose and Contribution

The Causal Discovery Engine learns the causal DAG structure from observational data using a simplified PC (Peter-Clark) algorithm. This is distinct from CVGG, which assumes a known causal structure.

### 4.3 Algorithm Implementation

**Step 1: Complete Graph Initialization**
```typescript
sensors.forEach(sensor => {
  graph.set(sensor, new Set(sensors.filter(s => s !== sensor)));
});
```

**Step 2: Correlation-Based Edge Removal**
```typescript
const correlation = pearsonCorrelation(data1, data2);
if (Math.abs(correlation) < threshold) {
  removeEdge(sensor1, sensor2);
}
```

**Step 3: Causal Direction Assignment**
- Uses domain knowledge for edge orientation
- Implements time-lag estimation based on physical propagation delays

### 4.4 Cross-Domain Bridge Detection

```typescript
private isDomainBridge(sensor1: string, sensor2: string): boolean {
  const domain1 = sensor1.split('_')[0]; // e.g., "hydraulic"
  const domain2 = sensor2.split('_')[0]; // e.g., "mechanical"
  return domain1 !== domain2;
}
```

### 4.5 Time Lag Estimation

| Causal Pathway | Estimated Lag (seconds) |
|----------------|------------------------|
| Electrical → Hydraulic | 0.5 |
| Hydraulic → Mechanical | 1.0 |
| Mechanical → Thermal | 2.0 |
| Thermal → Electrical | 1.5 |
| Default | 0.1 |

### 4.6 Contribution to IMSCHM

- **DAG Visualization:** Provides edges and strengths for network display
- **Anomaly Context:** Identifies causal parents for anomaly attribution
- **CVGG Input:** Discovered structure informs CVGG's causal metadata

---

## 5. Neural Causal Encoder: Deep Causal Learning

### 5.1 Component Location
`src/utils/neuralCausalEncoder.ts`

### 5.2 Purpose and Contribution

The Neural Causal Encoder extends traditional causal discovery with deep learning, implementing a VGG-inspired convolutional architecture with explicit causal branches. This component bridges the gap between pure statistical causal discovery and neural network-based feature learning.

### 5.3 Architecture

```
Input: [batch, 50, 18] time-series
           │
    ┌──────┴──────┐
    ▼             │
Conv1D Block 1    │
(32 filters)      │
    │             │
    ▼             │
Conv1D Block 2    │
(64 filters)      │
    │             │
    ▼             │
Conv1D Block 3    │
(128 filters)     │
    │             │
    ▼             │
Conv1D Block 4    │
(256 filters)     │
    │             │
    ▼             │
Conv1D Block 5    │
(256 filters)     │
    │             │
    ▼             │
Conv1D Block 6    │
(128-d latent)    │
    │             │
    ▼             │
Global Avg Pool ──┼─────────────────────────────────────┐
    │             │                                      │
    │             ▼                                      ▼
    │      Mediator Predictor                   Treatment Predictor
    │      M̂ = f_M(h(x))                        p̂(T|X)
    │             │                                      │
    │             ▼                                      │
    └────────►  Outcome Predictor  ◄─────────────────────┘
              Ŷ = f_Y(h(x), M̂, T, Z)
```

### 5.4 Causal Branches

**Branch 1: Mediator Predictor**
- Predicts 5 key mediator variables (e.g., vibration from pressure)
- Enables path-specific effect decomposition

**Branch 2: Outcome Predictor**
- Inputs: latent features + mediators + treatment + confounders
- Outputs: failure probability (sigmoid activation)

**Branch 3: Treatment Predictor**
- Propensity score estimation for IPW (Inverse Probability Weighting)
- Enables deconfounding through propensity stratification

### 5.5 Causal Loss Function

```typescript
totalLoss = λ₁·MSE(yTrue, yPred)           // Outcome loss
          + λ₂·MSE(mediatorTrue, mediatorPred)  // Mediator loss
          + λ₃·BCE(treatmentTrue, propensity)   // Propensity loss
          + λ₄·DAGPenalty                       // Acyclicity constraint
```

### 5.6 Contribution to IMSCHM

| Capability | Neural Encoder Role |
|------------|---------------------|
| Latent Representation | Provides 128-d embeddings for downstream tasks |
| Anomaly Detection | Neural-based anomaly scoring with causal pathways |
| Propensity Estimation | Enables causal effect estimation under confounding |
| Mediator Analysis | Decomposes effects into direct/indirect components |

---

## 6. Failure Simulator: Fault Injection Engine

### 6.1 Component Location
`src/utils/failureSimulator.ts`

### 6.2 Purpose and Contribution

The Failure Simulator implements realistic industrial failure modes with causal chain propagation. It serves as the **intervention mechanism** for testing the system's counterfactual reasoning capabilities.

### 6.3 Implemented Failure Modes

| Failure ID | Domain | Progression | Causal Chain Length |
|------------|--------|-------------|---------------------|
| `hydraulic_leak` | Hydraulic | Gradual | 2 hops |
| `bearing_wear` | Mechanical | Gradual | 3 hops |
| `thermal_overload` | Thermal | Sudden | 3 hops |
| `voltage_fluctuation` | Electrical | Intermittent | 3 hops |
| `tool_wear_excessive` | Cutting | Gradual | 3 hops |

### 6.4 Progression Models

**Gradual Failure:**
```typescript
severity(t+1) = severity(t) + 0.001 × Δt × (1 + severity(t))
```

**Sudden Failure:**
```typescript
if (severity < 0.5) {
  severity(t+1) = severity(t) + 0.0005 × Δt
} else {
  severity(t+1) = severity(t) + 0.1 × Δt  // Catastrophic phase
}
```

**Intermittent Failure:**
```typescript
oscillation = sin(t × 0.001) × 0.1
severity(t+1) = severity(t) + oscillation + 0.0002 × Δt
```

### 6.5 Causal Chain Example: Hydraulic Leak

```
Hydraulic Leak Injection (severity = 0.5)
           │
           ▼
    Pressure × 0.7 ──────────────────────┐
           │                              │
           ▼                              ▼
    Flow Rate × 0.8              Mechanical Torque ↓
           │                              │
           ▼                              ▼
    System Performance ↓          Cutting Force ↓
```

### 6.6 Contribution to IMSCHM

- **Ground Truth Interventions:** Provides known causal effects for validation
- **Training Data Augmentation:** Generates labeled failure data
- **What-If Testing:** Enables "What if leak severity = 0.8?" queries

---

## 7. Causal Intervention Engine: do-Calculus Implementation

### 7.1 Component Location
`src/utils/causalInterventionEngine.ts`

### 7.2 Purpose and Contribution

The Causal Intervention Engine implements Pearl's do-calculus for computing interventional distributions P(Y|do(X=x)). This is distinct from observational conditioning P(Y|X=x).

### 7.3 do-Calculus vs. Conditioning

```
Observational: P(Y | X = x)
               "What is Y when we observe X = x?"
               
Interventional: P(Y | do(X = x))
                "What is Y when we force X = x?"
                Breaks all incoming arrows to X
```

### 7.4 Intervention Definition Structure

```typescript
interface InterventionDefinition {
  id: string;
  name: string;
  variable: string;
  domain: IndustrialDomain;
  interventionType: 'do' | 'observe';
  targetValue: number;
  description: string;
  expectedOutcomes: string[];
}
```

### 7.5 Implemented Intervention Examples

**Example 1: Thrust Increase (10%)**
```typescript
{
  id: 'int-thrust-increase-10',
  name: 'Increase Thrust by 10%',
  variable: 'thrust',
  interventionType: 'do',
  targetValue: 10,
  description: 'do(Thrust = current × 1.10)'
}
```

**Example 2: Temperature Control (60°C)**
```typescript
{
  id: 'int-temp-control-60',
  name: 'Control Temperature at 60°C',
  variable: 'thermal_system_temp',
  interventionType: 'do',
  targetValue: 60,
  description: 'do(Temperature = 60°C)'
}
```

### 7.6 Causal Effect Computation

```typescript
// Primary effect: direct change
const primaryEffect = relativeDelta;

// Secondary effects via causal coefficients
Object.entries(CAUSAL_COEFFICIENTS[variable]).forEach(([effect, coef]) => {
  secondaryEffects.push({
    variable: effect,
    effect: coef * relativeDelta,
    pathway: `do(${variable}) → ${effect}`
  });
});

// Total effect with attenuation
const totalEffect = primaryEffect + Σ|secondaryEffects| × 0.3;
```

### 7.7 Causal Coefficient Matrix

| Cause | Effect | Coefficient |
|-------|--------|-------------|
| thrust | cutting_force | 0.75 |
| thrust | penetration_rate | 0.65 |
| thrust | mechanical_wear_level | 0.40 |
| thermal_system_temp | hydraulic_viscosity | -0.45 |
| thermal_system_temp | mechanical_wear_level | 0.30 |
| hydraulic_pressure | thrust | 0.80 |
| rotation_speed | mechanical_vibration | 0.55 |
| rotation_speed | cutting_tool_wear | 0.45 |

### 7.8 Contribution to IMSCHM

| Capability | Intervention Engine Role |
|------------|--------------------------|
| do(X=x) Queries | Computes interventional distributions |
| Effect Decomposition | Separates primary from cascading effects |
| Risk Assessment | Pre/post intervention risk comparison |
| Verification | Marks interventions as verified/computed |

---

## 8. Counterfactual Engine: "What if?" Reasoning

### 8.1 Component Location
`src/utils/counterfactualEngine.ts`

### 8.2 Purpose and Contribution

The Counterfactual Engine answers Level 3 causal questions: "What would have happened if X had been different?" This requires reasoning about alternative realities given the observed factual state.

### 8.3 Distinction from Intervention Engine

| Aspect | Intervention Engine | Counterfactual Engine |
|--------|--------------------|-----------------------|
| Question Type | "What if we do X?" | "What if X had been x'?" |
| Starting Point | Current state | Hypothetical alternative |
| Use Case | Planning future actions | Explaining past outcomes |
| Implementation | do-calculus | Structural Counterfactuals |

### 8.4 Counterfactual Query Structure

```typescript
interface InterventionQuery {
  id: string;
  variable: string;
  domain: IndustrialDomain;
  currentValue: number;
  interventionValue: number;
  interventionType: 'absolute' | 'relative' | 'delta';
  description: string;
}
```

### 8.5 Preset Counterfactual Scenarios

**Scenario 1: Thrust Increase**
```
Query: "What if thrust increases by 10%?"
Current: thrust = 450 kN
Counterfactual: thrust = 495 kN

Results:
  ├── Cutting force: ↑ 7.5%
  ├── Penetration rate: ↑ 6.5%
  ├── Tool wear: ↑ 4.0%
  └── Risk: Increased
```

**Scenario 2: Temperature Control**
```
Query: "What if temperature is maintained at 55°C?"
Current: temp = 72°C
Counterfactual: temp = 55°C

Results:
  ├── Hydraulic viscosity: ↑ 4.5% (normalized)
  ├── Mechanical wear: ↓ 3.0%
  ├── Efficiency: ↑ 2.0%
  └── Risk: Decreased
```

### 8.6 Counterfactual Computation Algorithm

```typescript
function evaluateIntervention(query, currentState, cvggResult) {
  // 1. Compute new value
  switch (query.interventionType) {
    case 'absolute': newValue = query.interventionValue; break;
    case 'relative': newValue = currentValue × (1 + query.interventionValue/100); break;
    case 'delta': newValue = currentValue + query.interventionValue; break;
  }
  
  // 2. Calculate direct effect (from CVGG ATE)
  directEffect = cvggResult.ATE × relativeDelta;
  
  // 3. Propagate indirect effects through causal graph
  indirectEffects = propagateThroughDAG(variable, relativeDelta);
  
  // 4. Compute risk change
  baselineRisk = computeSystemRisk(currentState);
  counterfactualRisk = baselineRisk + causalEffect × 0.3;
  
  // 5. Generate explanation
  return generateExplanation(query, effects, riskChange);
}
```

### 8.7 CVGG Integration

The Counterfactual Engine **consumes** CVGG outputs:
- Uses `ATE` to scale direct effects
- Uses `CATE` for subpopulation-specific counterfactuals
- Uses `confidence` to weight result reliability

### 8.8 Contribution to IMSCHM

| Capability | Counterfactual Engine Role |
|------------|----------------------------|
| "What if?" Queries | Answers hypothetical causal questions |
| Root Cause Analysis | "What if sensor X had not failed?" |
| Scenario Comparison | Multi-intervention scenario evaluation |
| Risk Prediction | Counterfactual risk assessment |

---

## 9. Prescriptive AI Engine: Decision Support

### 9.1 Component Location
`src/utils/prescriptiveAI.ts`

### 9.2 Purpose and Contribution

The Prescriptive AI Engine transforms numerical causal estimates from CVGG into actionable maintenance recommendations. This is the primary **decision-making interface** for human operators.

### 9.3 Input Context

```typescript
interface DecisionContext {
  currentState: SystemState | null;
  anomalies: Array<{sensor, anomaly_score, causal_pathway}>;
  activeFailures: Array<{id, name, severity, domain}>;
  causalGraph: Map<string, CausalRelation[]>;
  cvggResult: InferenceResult | null;
  inferenceHistory: InferenceResult[];
}
```

### 9.4 Recommendation Structure

```typescript
interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  actionType: 'immediate' | 'scheduled' | 'monitoring' | 'preventive';
  domain: IndustrialDomain;
  confidence: number;
  causalBasis: string;  // The causal justification
  estimatedImpact: {
    riskReduction: number;
    costSaving: number;
    downtimeAvoidance: number;
  };
  suggestedActions: string[];
  relatedSensors: string[];
  timeToAction: string;
}
```

### 9.5 Decision Pipeline

```
CVGG Output (ATE, CATE, Effects)
         │
         ▼
┌────────────────────────────────────────┐
│        Prescriptive AI Engine          │
├────────────────────────────────────────┤
│ 1. Analyze Causal Effects              │
│    └── If ATE > 0.3 → High priority    │
│                                        │
│ 2. Analyze Active Failures             │
│    └── Map severity to action type     │
│                                        │
│ 3. Analyze Anomalies                   │
│    └── Score > 0.6 → Monitoring alert  │
│                                        │
│ 4. Check System Thresholds             │
│    └── Pressure > 180 → Immediate      │
│                                        │
│ 5. Analyze Causal Paths                │
│    └── Cross-domain bridges → Prevent  │
└────────────────────────────────────────┘
         │
         ▼
Prioritized Recommendations
```

### 9.6 Threshold Configuration

```typescript
const THRESHOLDS = {
  ATE_HIGH: 0.3,           // Significant treatment effect
  ATE_MODERATE: 0.15,      // Moderate treatment effect
  CATE_SIGNIFICANT: 0.25,  // Subpopulation-specific effect
  ANOMALY_CRITICAL: 0.8,   // Critical anomaly score
  ANOMALY_HIGH: 0.6,       // High anomaly score
  WEAR_CRITICAL: 0.85,     // Critical wear level
  PRESSURE_HIGH: 180,      // High hydraulic pressure (bar)
  TEMP_HIGH: 75,           // High system temperature (°C)
  VIBRATION_HIGH: 5        // High vibration (mm/s)
};
```

### 9.7 Domain-Specific Intervention Strategies

```typescript
const INTERVENTION_STRATEGIES = {
  hydraulic: {
    primary: ['Reduce system pressure', 'Check for leaks', 'Replace hydraulic fluid'],
    secondary: ['Inspect seals', 'Clean filters', 'Verify pump operation']
  },
  mechanical: {
    primary: ['Reduce rotational speed', 'Balance rotating components', 'Replace worn bearings'],
    secondary: ['Lubricate joints', 'Check alignment', 'Tighten loose connections']
  },
  thermal: {
    primary: ['Increase cooling capacity', 'Reduce load', 'Clean heat exchangers'],
    secondary: ['Check coolant levels', 'Inspect fans', 'Verify thermal paste']
  },
  electrical: {
    primary: ['Check power supply stability', 'Inspect motor windings', 'Replace capacitors'],
    secondary: ['Clean contacts', 'Check grounding', 'Verify phase balance']
  },
  cutting: {
    primary: ['Replace cutting tool', 'Adjust cutting parameters', 'Inspect tool holder'],
    secondary: ['Check coolant flow', 'Verify feed rate', 'Inspect chip evacuation']
  }
};
```

### 9.8 System Health Scoring

```typescript
calculateHealthScore(context: DecisionContext): number {
  let score = 100;
  
  // Deduct for anomalies
  context.anomalies.forEach(a => {
    score -= a.anomaly_score * 15;
  });
  
  // Deduct for active failures
  context.activeFailures.forEach(f => {
    score -= f.severity * 25;
  });
  
  // Deduct for high causal effects (system instability)
  if (context.cvggResult) {
    const ate = Math.abs(context.cvggResult.causalEffects.ATE);
    score -= ate * 20;
  }
  
  return Math.max(0, Math.min(100, score));
}
```

### 9.9 Contribution to IMSCHM

| Capability | Prescriptive AI Role |
|------------|---------------------|
| Recommendation Generation | Human-readable action items |
| Priority Assignment | Critical → Low ranking |
| Risk Quantification | Impact estimation in %, hours, $ |
| Causal Justification | Links recommendations to CVGG outputs |
| System Health Score | Aggregate 0-100 metric |

---

## 10. Visualization and Interpretability Layer

### 10.1 Component Locations
- `src/components/IndustrialMonitor.tsx` (Main Dashboard)
- `src/components/NetworkMonitor.tsx` (Causal DAG Display)
- `src/components/EnhancedCVGGPanel.tsx` (CVGG Outputs)
- `src/components/CausalInterventionPanel.tsx` (do() Interface)
- `src/components/CounterfactualQueryPanel.tsx` (What-If Interface)
- `src/components/PrescriptiveAIPanel.tsx` (Recommendations)

### 10.2 Information Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        IMSCHM Dashboard                                  │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐             │
│  │    Monitor     │  │    Network     │  │    CVGG        │             │
│  │  (Real-time)   │  │  (DAG View)    │  │  (Effects)     │             │
│  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘             │
│          │                   │                   │                       │
│          └───────────────────┼───────────────────┘                       │
│                              │                                           │
│                              ▼                                           │
│  ┌───────────────────────────────────────────────────────────┐          │
│  │              Causal Analysis Panels                        │          │
│  ├───────────────────────────────────────────────────────────┤          │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐    │          │
│  │  │   do()      │  │   What-If   │  │   Prescriptive  │    │          │
│  │  │ Intervention│  │ Counterfact.│  │   Recommend.    │    │          │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘    │          │
│  └───────────────────────────────────────────────────────────┘          │
│                              │                                           │
│                              ▼                                           │
│  ┌───────────────────────────────────────────────────────────┐          │
│  │              Function Completion Status                    │          │
│  │  ✓ Causal Effect (CVGG)    ✓ Counterfactual (IMSCHM)     │          │
│  │  ✓ Intervention (IMSCHM)   ✓ Prescriptive AI (IMSCHM)    │          │
│  │  ✓ Decision Making (Both)  ✓ Interpretability (IMSCHM)   │          │
│  └───────────────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 10.3 Interpretability Features

1. **DAG Visualization:** Interactive network graph of causal relationships
2. **Effect Heatmaps:** Color-coded causal effect magnitudes
3. **Pathway Tracing:** Visual highlighting of causal chains
4. **Confidence Indicators:** Uncertainty quantification display
5. **Temporal Lag Display:** Time-lagged causal effects

---

## 11. System Workflow: End-to-End Causal Analysis

### 11.1 Complete Processing Pipeline

```
Step 1: Data Generation
┌──────────────────────┐
│  Physics Simulator   │ ──► SystemState
└──────────────────────┘
         │
         ▼
Step 2: Failure Injection (Optional)
┌──────────────────────┐
│  Failure Simulator   │ ──► Modified State
└──────────────────────┘
         │
         ▼
Step 3: Causal Discovery
┌──────────────────────┐
│  CausalDiscovery     │ ──► Causal DAG
└──────────────────────┘
         │
         ▼
Step 4: Neural Encoding
┌──────────────────────┐
│ NeuralCausalEncoder  │ ──► Latent h(x), Mediators
└──────────────────────┘
         │
         ▼
Step 5: CVGG Inference
┌──────────────────────┐
│  EnhancedCausalVGG   │ ──► ATE, CATE, Effects
└──────────────────────┘
         │
         ├─────────────────────────────────────────┐
         ▼                                         ▼
Step 6a: Intervention            Step 6b: Counterfactual
┌──────────────────────┐        ┌──────────────────────┐
│  CausalIntervention  │        │ CounterfactualEngine │
│  Engine              │        │                      │
└──────────────────────┘        └──────────────────────┘
         │                                         │
         └─────────────────┬───────────────────────┘
                           ▼
Step 7: Prescriptive Recommendations
┌──────────────────────────────────────────────────────┐
│              Prescriptive AI Engine                  │
│  • Priority Ranking                                  │
│  • Domain-Specific Actions                           │
│  • Risk Quantification                               │
└──────────────────────────────────────────────────────┘
         │
         ▼
Step 8: Visualization & Decision Support
┌──────────────────────────────────────────────────────┐
│              IndustrialMonitor Dashboard             │
│  • Real-time Monitoring                              │
│  • Interactive DAG                                   │
│  • Function Status Display                           │
└──────────────────────────────────────────────────────┘
```

---

## 12. Contribution Summary Table

| Component | File | Primary Contribution | Depends On | Outputs To |
|-----------|------|---------------------|------------|------------|
| **Physics Simulator** | `physicsSimulator.ts` | Ground truth data generation | None | All components |
| **Failure Simulator** | `failureSimulator.ts` | Fault injection with causal chains | Physics Simulator | Physics Simulator, Monitoring |
| **Causal Discovery** | `causalInference.ts` | DAG structure learning (PC algorithm) | Sensor data | CVGG, Visualization |
| **Neural Encoder** | `neuralCausalEncoder.ts` | Deep causal feature extraction | Sensor data | CVGG, Anomaly detection |
| **CVGG Core** | `enhancedCausalVGG.ts` | ATE/CATE estimation | All above | Intervention, Counterfactual, Prescriptive |
| **Intervention Engine** | `causalInterventionEngine.ts` | do-calculus computation | CVGG, System State | Prescriptive AI, UI |
| **Counterfactual Engine** | `counterfactualEngine.ts` | "What if?" reasoning | CVGG, System State | Prescriptive AI, UI |
| **Prescriptive AI** | `prescriptiveAI.ts` | Human-readable recommendations | All above | UI Dashboard |
| **Visualization** | `IndustrialMonitor.tsx` | Interactive decision support | All above | Human operators |

---

## 13. Mathematical Foundations

### 13.1 Average Treatment Effect (ATE)

$$\text{ATE} = \mathbb{E}[Y(1) - Y(0)] = \mathbb{E}[Y | do(T=1)] - \mathbb{E}[Y | do(T=0)]$$

### 13.2 Conditional Average Treatment Effect (CATE)

$$\text{CATE}(x) = \mathbb{E}[Y(1) - Y(0) | X = x]$$

### 13.3 Direct and Indirect Effects

$$\text{Total Effect} = \text{Direct Effect} + \text{Indirect Effect}$$

$$\text{NDE} = \mathbb{E}[Y(1, M(0)) - Y(0, M(0))]$$
$$\text{NIE} = \mathbb{E}[Y(1, M(1)) - Y(1, M(0))]$$

### 13.4 do-Calculus (Pearl)

$$P(Y | do(X)) = \sum_z P(Y | X, Z=z) P(Z=z) \text{ (Backdoor Adjustment)}$$

### 13.5 Counterfactual Reasoning

$$Y_{x'}(u) = Y(u) + \frac{\partial Y}{\partial X} (x' - x)$$

---

## 14. Conclusion

The IMSCHM platform demonstrates a clear separation of concerns between the CVGG numerical core and the application-layer components that handle simulation, reasoning, and decision support. The non-CVGG components contribute essential functionality:

1. **Physics Simulator:** Provides causally-structured ground truth data
2. **Failure Simulator:** Enables controlled fault injection experiments
3. **Causal Discovery:** Learns DAG structure from observational data
4. **Neural Causal Encoder:** Bridges deep learning with causal inference
5. **Intervention Engine:** Implements Pearl's do-calculus for P(Y|do(X))
6. **Counterfactual Engine:** Answers "What if?" questions at Level 3
7. **Prescriptive AI:** Translates numerical estimates to human-readable recommendations

This architecture enables IMSCHM to answer the full hierarchy of causal questions while maintaining modularity and interpretability for industrial predictive maintenance applications.

---

## References

1. Pearl, J. (2009). *Causality: Models, Reasoning, and Inference*. Cambridge University Press.
2. Peters, J., Janzing, D., & Schölkopf, B. (2017). *Elements of Causal Inference*. MIT Press.
3. Rubin, D. B. (1974). Estimating causal effects of treatments in randomized and nonrandomized studies. *Journal of Educational Psychology*, 66(5), 688-701.
4. Simonyan, K., & Zisserman, A. (2015). Very deep convolutional networks for large-scale image recognition. *ICLR 2015*.
5. Spirtes, P., Glymour, C., & Scheines, R. (2000). *Causation, Prediction, and Search*. MIT Press.

---

## Appendix A: Code Structure

```
src/
├── utils/
│   ├── enhancedCausalVGG.ts      # CVGG Core
│   ├── physicsSimulator.ts        # Data Generation
│   ├── failureSimulator.ts        # Fault Injection
│   ├── causalInference.ts         # DAG Discovery
│   ├── neuralCausalEncoder.ts     # Deep Causal Learning
│   ├── causalInterventionEngine.ts # do-Calculus
│   ├── counterfactualEngine.ts    # What-If Reasoning
│   └── prescriptiveAI.ts          # Decision Support
├── components/
│   ├── IndustrialMonitor.tsx      # Main Dashboard
│   ├── NetworkMonitor.tsx         # DAG Visualization
│   ├── EnhancedCVGGPanel.tsx      # CVGG Display
│   ├── CausalInterventionPanel.tsx # do() Interface
│   ├── CounterfactualQueryPanel.tsx # What-If Interface
│   ├── CausalVisualizationPanel.tsx # Causal Display
│   └── PrescriptiveAIPanel.tsx    # Recommendations
├── hooks/
│   └── useEnhancedCVGG.ts         # React Hook for CVGG
└── types/
    └── industrial.ts               # TypeScript Definitions
```

---

*End of Technical Report*
