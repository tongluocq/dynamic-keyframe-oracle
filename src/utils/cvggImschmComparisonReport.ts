/**
 * CVGG vs IMSCHM Comparison Report Generator
 * 
 * Generates a comprehensive academic report comparing:
 * - Module/Engine level: CVGG (Causal VGG) core capabilities
 * - System level: IMSCHM application layer capabilities
 * - Complementary collaboration between the two layers
 * - Potential upgrade trends and future directions
 */

import { StoredResult } from './resultsStorage';

function generateComparisonReport(results: StoredResult[]): string {
  const timestamp = new Date().toISOString();
  const sessionStats = {
    cvgg: results.filter(r => r.type === 'cvgg_training' || r.type === 'cvgg_inference').length,
    intervention: results.filter(r => r.type === 'intervention').length,
    counterfactual: results.filter(r => r.type === 'counterfactual').length,
    prescriptive: results.filter(r => r.type === 'prescriptive').length,
    total: results.length,
  };

  return `# CVGG vs IMSCHM: Module-Level Engine and System-Level Architecture Comparison

> **Report Type**: Architectural Comparison & Upgrade Trend Analysis  
> **Generated**: ${timestamp}  
> **Session Data**: ${sessionStats.total} recorded operations (${sessionStats.cvgg} CVGG, ${sessionStats.intervention} Interventions, ${sessionStats.counterfactual} Counterfactuals, ${sessionStats.prescriptive} Prescriptive)

---

## 1. Introduction: Why This Comparison Matters

In causal AI for industrial health monitoring, a critical architectural decision is the boundary between the **core inference engine** and the **application system** that wraps it. CVGG (Causal VGG) and IMSCHM (Industrial Multi-System Causal Health Monitoring) represent two distinct but tightly coupled layers:

- **CVGG** operates at the **module/engine level** — it is a numerical causal effect estimator that takes multi-modal inputs and produces quantified causal metrics.
- **IMSCHM** operates at the **system level** — it orchestrates simulation, discovery, reasoning, decision support, and visualization around the CVGG core.

Understanding their complementary roles is essential for:
1. Identifying which innovations belong to the engine vs. the system
2. Planning independent upgrade paths for each layer
3. Ensuring the interface contract between them supports future extensions

---

## 2. CVGG: Module/Engine Level Analysis

### 2.1 Core Responsibility

CVGG is a **numerical causal effect measurement engine**. Its sole responsibility is:

> Given multi-modal inputs (sensor scalograms, rock images, causal metadata), estimate the causal effect of a treatment variable on an outcome variable.

### 2.2 Architecture

| Component | Specification | Role |
|-----------|--------------|------|
| Image VGG Backbone | 5 blocks (64→128→256→512→512), GAP → 256-dim | Rock image feature extraction |
| Scalogram VGG Backbone | 5 blocks, 6-channel input, GAP → 256-dim | CWRU-style signal feature extraction |
| Causal Metadata Encoder | 37-dim → 128 → 64 → 64-dim (tanh) | Structured causal variable encoding |
| Classification Head | 576-dim → 512 → 256 → 10 classes | Fault type prediction (softmax) |
| Causal Inference Head | 512+64 → 256 → 128 → 4 outputs + 32-dim confounder | ATE, CATE, DE, IE estimation |

### 2.3 Outputs (What CVGG Produces)

| Metric | Description | Normal Range | Fault Range |
|--------|-------------|-------------|-------------|
| ATE (Average Treatment Effect) | Mean causal effect of treatment | 0.05–0.20 | 0.30–0.75 |
| CATE (Conditional ATE) | Subgroup-specific causal effect | 0.10–0.25 | 0.40–0.90 |
| DE (Direct Effect / NDE) | Effect not mediated by other variables | 0.05–0.15 | 0.25–0.60 |
| IE (Indirect Effect / NIE) | Effect mediated through causal pathways | 0.02–0.08 | 0.10–0.30 |
| Confounder Proxy | 32-dim latent confounder representation | Low variance | High variance |

### 2.4 Key Innovation: DAG-Constrained Loss

$$L_{total} = L_{class} + \\lambda_1 L_{causal} + \\lambda_2 L_{DAG}$$

Where:
$$L_{DAG} = |ATE - (DE + IE)|^2$$

This structural consistency term enforces that causal decomposition respects the DAG structure. This is a **module-level innovation** — it exists entirely within CVGG and does not depend on IMSCHM.

### 2.5 What CVGG Does NOT Do

| Capability | CVGG Provides? | Why Not |
|-----------|---------------|---------|
| Causal structure discovery | ❌ | Requires PC/Granger/TE algorithms |
| do-calculus intervention | ❌ | Requires intervention engine with adjustment formulas |
| Counterfactual reasoning | ❌ | Requires SCM-based abduction-action-prediction |
| Prescriptive recommendations | ❌ | Requires optimization over causal effects |
| Data simulation | ❌ | Requires physics and failure simulators |
| Visualization | ❌ | Requires UI rendering layer |
| Multi-language support | ❌ | Application concern |

---

## 3. IMSCHM: System Level Analysis

### 3.1 Core Responsibility

IMSCHM is a **complete causal AI application system** for industrial health monitoring. It provides:

> End-to-end pipeline from raw physics simulation through causal discovery, neural inference, multi-level causal reasoning, to actionable decision support with interactive visualization.

### 3.2 The 8-Step Hybrid Pipeline

| Step | Component | Layer | Input | Output |
|------|-----------|-------|-------|--------|
| 1 | Physics Simulator | IMSCHM | Domain parameters | 25+ state variables across 5 domains |
| 2 | Failure Injector | IMSCHM | Normal states + fault config | Degraded sensor readings |
| 3 | Causal Discovery | IMSCHM | Sensor time series | DAG structure (edges + strengths) |
| 4 | Neural Encoder | Bridge | Raw features | Latent causal embeddings |
| 5 | **CVGG Inference** | **CVGG Core** | Scalograms + images + metadata | ATE, CATE, DE, IE |
| 6 | Intervention/Counterfactual | IMSCHM | CVGG outputs + DAG | do() results, What-If answers |
| 7 | Prescriptive AI | IMSCHM | Causal effects + constraints | Ranked recommendations |
| 8 | Visualization | IMSCHM | All outputs | Interactive dashboard |

**Key insight**: CVGG occupies exactly **one step** (Step 5) of the 8-step pipeline. IMSCHM provides the other seven.

### 3.3 Algorithms IMSCHM Provides Beyond CVGG

| Algorithm/Engine | Pearl Level | Purpose |
|-----------------|-------------|---------|
| PC Algorithm | L1 | Constraint-based causal structure learning |
| Granger Causality | L1 | Temporal causal precedence detection |
| Transfer Entropy | L1 | Information-theoretic causal flow |
| 4-Method Consensus Fusion | L1 | Conflict resolution across discovery methods |
| do-Calculus Engine | L2 | Interventional effect estimation with adjustment |
| Counterfactual Engine | L3 | SCM-based abduction-action-prediction |
| Prescriptive AI | Decision | Budget-constrained causal recommendation optimization |
| Physics Simulator | Data | 5-domain cross-coupled state evolution |
| Failure Simulator | Data | Progressive degradation injection |
| Causal Graph RAG | Knowledge | Graph-native multi-hop causal reasoning |
| Dataset Verification Suite | Validation | 6-test realism and non-triviality verification |
| EDA Report Generator | Analysis | Statistical + causal diagnostic analysis |

### 3.4 What IMSCHM Does NOT Do Without CVGG

| Capability | IMSCHM Alone? | Why Not |
|-----------|--------------|---------|
| Quantified causal effect (ATE/CATE) | ❌ | Requires CVGG's trained inference head |
| Multi-modal feature fusion | ❌ | Requires dual VGG backbone architecture |
| DAG-consistent decomposition (DE+IE=ATE) | ❌ | Requires CVGG's constrained loss training |
| Image-based causal analysis | ❌ | Requires VGG image backbone |
| Confounder proxy estimation | ❌ | Requires CVGG's latent confounder branch |

---

## 4. Complementary Collaboration: How They Work Together

### 4.1 Interface Contract

The collaboration between CVGG and IMSCHM follows a clear interface contract:

\`\`\`
IMSCHM → CVGG:
  - Sensor scalograms (6-channel wavelet transforms)
  - Rock/geological images (224×224 RGB)
  - Causal metadata vector (37-dim: treatment, confounders, instruments)

CVGG → IMSCHM:
  - ATE: float (average treatment effect)
  - CATE: float (conditional average treatment effect)
  - DE: float (direct/natural direct effect)
  - IE: float (indirect/natural indirect effect)
  - Confounder proxy: float[32] (latent confounder representation)
  - Classification: int (fault class, 0-9)
  - Confidence: float (prediction confidence)
\`\`\`

### 4.2 Collaboration Flow Across Pearl's Hierarchy

| Pearl Level | CVGG Role | IMSCHM Role | Collaboration |
|-------------|-----------|-------------|---------------|
| **L1 (Association)** | Produces baseline ATE from observational data | Discovers causal DAG structure; triggers anomaly detection | CVGG quantifies what IMSCHM discovers structurally |
| **L2 (Intervention)** | Provides causal effect estimates under do() | Implements adjustment formula; propagates effects through DAG | IMSCHM uses CVGG's ATE as the effect magnitude in interventional calculations |
| **L3 (Counterfactual)** | Provides factual baseline effects | Runs abduction-action-prediction over SCM | IMSCHM compares CVGG's factual output against counterfactual scenario |
| **Decision** | Provides effect rankings for variables | Optimizes recommendations under budget constraints | IMSCHM ranks actions by CVGG-estimated causal impact |

### 4.3 Complementarity Analysis

| Dimension | CVGG Contribution | IMSCHM Contribution | Why Both Needed |
|-----------|-------------------|---------------------|-----------------|
| **Depth** | Deep causal quantification (float-precision effects) | Broad causal reasoning (structure + intervention + counterfactual) | Quantification without reasoning is blind; reasoning without quantification is empty |
| **Modality** | Multi-modal fusion (images + signals + metadata) | Uni-modal time series (sensor readings) | Industrial monitoring needs both image and signal analysis |
| **Learning** | Learns causal effects from data (gradient-based) | Discovers causal structure from statistics (constraint-based) | Structure discovery guides where to measure effects |
| **Abstraction** | Low-level: tensor operations, loss optimization | High-level: causal queries, decision optimization | Different abstraction layers serve different stakeholders |
| **Validation** | Internal: DAG-constrained loss consistency | External: 6-test verification suite, EDA diagnostics | Both internal and external validation are required |

### 4.4 Dependency Analysis

\`\`\`
IMSCHM can operate without CVGG:
  ✓ Physics simulation
  ✓ Causal discovery (PC, Granger, TE)
  ✓ Basic anomaly detection
  ✗ Quantified causal effects (ATE/CATE)
  ✗ Multi-modal analysis
  ✗ DAG-consistent decomposition

CVGG can operate without IMSCHM:
  ✓ Inference on pre-prepared inputs
  ✓ Training with labeled data
  ✗ Data generation (needs simulator)
  ✗ Causal structure (needs discovery)
  ✗ Higher-level reasoning (needs engines)
  ✗ Decision support (needs prescriptive AI)
  ✗ Visualization (needs dashboard)
\`\`\`

**Conclusion**: CVGG is a necessary but not sufficient component. IMSCHM without CVGG loses quantification depth. CVGG without IMSCHM loses operational context and reasoning breadth. Together they form a complete L1+L2+L3 causal AI system.

---

## 5. Quantitative Comparison

### 5.1 Scope Comparison

| Metric | CVGG | IMSCHM (excl. CVGG) | Total System |
|--------|------|---------------------|-------------|
| Source files | 1 (enhancedCausalVGG.ts) | 15+ modules | 16+ |
| Algorithms | 1 (dual-VGG + causal head) | 12+ (PC, Granger, TE, do-calc, CF, Prescriptive, etc.) | 13+ |
| Pearl levels covered | L1 (partial) | L1 + L2 + L3 + Decision | L1 + L2 + L3 + Decision |
| Input modalities | 3 (image, scalogram, metadata) | 1 (time series) | 3 + time series |
| Output types | 6 (ATE, CATE, DE, IE, class, confounder) | 20+ (DAG, interventions, counterfactuals, recommendations, reports) | 26+ |
| Parameters (est.) | ~15M (dual VGG-16 + heads) | ~0 (algorithmic, no learned weights) | ~15M |
| Training required | Yes (supervised + DAG loss) | No (algorithmic/rule-based) | Partial |

### 5.2 Pearl's Hierarchy Coverage

| Level | Capability | CVGG | IMSCHM | Combined |
|-------|-----------|------|--------|----------|
| L1 | Observational association | ✓ (ATE baseline) | ✓ (PC, Granger, TE) | ✓✓ |
| L1 | Anomaly detection | Partial (via ATE threshold) | ✓ (causal pathway tracing) | ✓✓ |
| L2 | Interventional queries | ✗ | ✓ (do-calculus engine) | ✓ |
| L2 | Adjustment formula | ✗ | ✓ (backdoor/frontdoor) | ✓ |
| L3 | Counterfactual queries | ✗ | ✓ (SCM abduction-action-prediction) | ✓ |
| L3 | Closest possible world | ✗ | ✓ (structural equation inversion) | ✓ |
| Decision | Recommendation ranking | Partial (effect magnitude) | ✓ (budget-constrained optimization) | ✓✓ |

### 5.3 Session Evidence

${sessionStats.total > 0 ? `
Based on ${sessionStats.total} recorded operations in the current session:
- CVGG operations: ${sessionStats.cvgg} (${((sessionStats.cvgg / Math.max(sessionStats.total, 1)) * 100).toFixed(1)}% of total)
- Intervention operations: ${sessionStats.intervention} (IMSCHM L2)
- Counterfactual operations: ${sessionStats.counterfactual} (IMSCHM L3)
- Prescriptive operations: ${sessionStats.prescriptive} (IMSCHM Decision)

This distribution illustrates that CVGG provides the foundational measurements, while IMSCHM's higher-level engines consume and extend these measurements across Pearl's hierarchy.

${generateComparisonDynamicSection(results)}
` : `No session data available. Run operations in the dashboard to populate this section with empirical evidence.`}

---

## 6. Potential Upgrade Trends

### 6.1 CVGG Core Upgrades (Module Level)

| Upgrade | Current State | Target State | Impact | Priority |
|---------|--------------|-------------|--------|----------|
| **Vision Transformer backbone** | VGG-16 (2014) | ViT/DeiT (2020+) | Better spatial attention, fewer parameters | High |
| **Temporal attention** | Static scalogram input | Temporal Transformer over signal windows | Captures temporal causal dynamics | High |
| **Heterogeneous treatment effects** | Single CATE | CATE with X-learner/DR-learner | More precise subgroup effects | Medium |
| **Sensitivity analysis** | Fixed confounder proxy | Rosenbaum bounds, E-value computation | Quantifies unmeasured confounding risk | Medium |
| **Multi-task causal heads** | Single 4-output head | Domain-specific heads (per subsystem) | Finer-grained causal decomposition | Medium |
| **Uncertainty quantification** | Point estimates | Bayesian CVGG with posterior over ATE | Calibrated confidence intervals | High |
| **Causal representation learning** | Fixed metadata encoder | Variational causal autoencoder | Learns causal factors from data | Low |

### 6.2 IMSCHM System Upgrades (Application Level)

| Upgrade | Current State | Target State | Impact | Priority |
|---------|--------------|-------------|--------|----------|
| **Real sensor integration** | Physics simulation only | MQTT/OPC-UA live sensor feeds | Production deployment readiness | High |
| **Continuous causal discovery** | Batch PC algorithm | Online causal discovery (PCMCI+) | Adapts to distribution shifts | High |
| **Causal reinforcement learning** | Static prescriptive rules | Causal RL policy optimization | Learns optimal intervention policies | Medium |
| **Multi-agent causal reasoning** | Single-system analysis | Fleet-level cross-machine causal transfer | Scales to industrial fleets | Medium |
| **Explainability layer** | Text-based explanations | Natural language generation (LLM) | Operator-friendly causal narratives | Medium |
| **Digital twin integration** | Standalone simulation | Synchronized digital twin with real equipment | Continuous model validation | High |
| **Federated causal learning** | Centralized data | Privacy-preserving cross-site learning | Multi-site deployment | Low |

### 6.3 Interface Upgrades (Collaboration Layer)

| Upgrade | Current State | Target State | Impact |
|---------|--------------|-------------|--------|
| **Streaming inference** | Batch CVGG calls | Real-time streaming with backpressure | Low-latency monitoring |
| **Causal effect caching** | No caching | LRU cache with DAG-invalidation | Faster repeated queries |
| **Multi-CVGG ensemble** | Single model | Ensemble of CVGG variants with meta-learning | Robust effect estimation |
| **Bidirectional feedback** | CVGG → IMSCHM only | IMSCHM discovery guides CVGG retraining | Closed-loop improvement |
| **Standardized causal API** | Ad-hoc interface | OpenAPI/gRPC with causal effect schema | Interoperability |

### 6.4 Upgrade Dependency Map

\`\`\`
Independent CVGG upgrades (no IMSCHM changes needed):
  ├── ViT backbone replacement
  ├── Bayesian uncertainty
  └── Sensitivity analysis (E-value)

Independent IMSCHM upgrades (no CVGG changes needed):
  ├── Real sensor integration (MQTT/OPC-UA)
  ├── Online causal discovery (PCMCI+)
  └── LLM explainability layer

Co-dependent upgrades (both layers must evolve):
  ├── Streaming inference (CVGG output format + IMSCHM consumer)
  ├── Bidirectional feedback (CVGG retraining API + IMSCHM trigger)
  ├── Multi-CVGG ensemble (new CVGG variants + IMSCHM meta-learner)
  └── Causal RL (CVGG as environment model + IMSCHM as policy optimizer)
\`\`\`

---

## 7. Architectural Recommendations

### 7.1 Short-Term (Next Version)

1. **Formalize the CVGG-IMSCHM interface** as a typed API contract (TypeScript interface) to enable independent testing and versioning.
2. **Add uncertainty quantification** to CVGG outputs — every ATE/CATE should carry a confidence interval, not just a point estimate.
3. **Implement streaming inference** to support real-time monitoring scenarios where batch processing is too slow.

### 7.2 Medium-Term (6-12 Months)

4. **Replace VGG backbone with Vision Transformer** — the ViT architecture provides better attention mechanisms for identifying causal-relevant image regions.
5. **Integrate online causal discovery** (PCMCI+) to enable IMSCHM to adapt its DAG structure as the data distribution shifts during operation.
6. **Add bidirectional feedback** where IMSCHM's discovery results guide CVGG's attention and retraining priorities.

### 7.3 Long-Term (Research Directions)

7. **Causal Reinforcement Learning**: Use CVGG as the causal world model and IMSCHM as the policy optimizer to learn optimal intervention strategies from experience.
8. **Federated Causal Learning**: Enable cross-site deployment where multiple IMSCHM instances share causal structure knowledge without sharing raw data.
9. **Foundation Model Integration**: Replace hand-crafted causal metadata encoding with a causal foundation model that learns causal representations from large-scale industrial data.

---

## 8. Summary

| Aspect | CVGG (Module) | IMSCHM (System) |
|--------|--------------|-----------------|
| **Scope** | Single inference step | End-to-end 8-step pipeline |
| **Innovation** | DAG-constrained dual-VGG causal estimation | Hybrid causal discovery + multi-level reasoning |
| **Pearl Level** | L1 (partial) | L1 + L2 + L3 + Decision |
| **Modality** | Multi-modal (image + signal + metadata) | Time-series + structured data |
| **Learning** | Gradient-based (supervised) | Algorithmic (unsupervised/rule-based) |
| **Standalone** | Limited (needs data pipeline) | Partial (loses quantification depth) |
| **Key output** | Float-precision causal effects | Actionable decisions with explanations |

**Core thesis**: CVGG and IMSCHM are **architecturally complementary** — CVGG provides the measurement precision that IMSCHM's reasoning engines require, while IMSCHM provides the operational context and multi-level reasoning framework that gives CVGG's numerical outputs actionable meaning. Neither layer alone constitutes a complete causal AI system for industrial health monitoring. Their upgrade paths are partially independent (backbone modernization, sensor integration) and partially co-dependent (streaming inference, causal RL), which argues for maintaining a clean interface contract between them.

---

*Report generated by IMSCHM Comparison Analysis Engine*  
*Timestamp: ${timestamp}*
`;
}

export function downloadCVGGIMSCHMComparisonReport(results: StoredResult[]): void {
  const report = generateComparisonReport(results);
  const blob = new Blob([report], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  a.href = url;
  a.download = `CVGG_vs_IMSCHM_Comparison_${ts}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
