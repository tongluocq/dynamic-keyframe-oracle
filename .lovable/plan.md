# Audit result & proposed enhancement

## What the Experiment Panel currently covers

`src/components/ExperimentPanel.tsx` (1,335 lines) provides:

- **5 validation tiers** with UI cards, charts, and per-tier narrative (Design / Purpose / Theory / Algorithms):
  1. Algorithmic Baseline (SHD, F1, ROC — PC vs Granger vs CVGG)
  2. Multi-Scale Temporal (wavelet stability)
  3. Environmental Fusion (modality ablation)
  4. Counterfactual (PEHE, trajectory RMSE)
  5. Closed-Loop (latency, FAR, confusion matrix)
- **Rationale Chain** badge (Cause → Mechanism → Observable) tied to tier completion
- **Downloads**: HTML report, CSV (multi-section, chart-reproducible), JSON, SVG figure bundle

## Gaps against your request

The panel is **validation-focused**, not a full project write-up. Missing from both the UI and the downloadable HTML:

| Topic | In panel? | Elsewhere in project? |
|---|---|---|
| Physics simulator (5 domains, coupling) | ❌ | `physicsSimulator.ts`, DATASET_OVERVIEW.md |
| Failure injector mechanics | ❌ | `failureSimulator.ts` |
| CVGG architecture (dual-VGG, DAG loss) | Partial (mentioned) | NEURAL_CAUSAL_ARCHITECTURE.md |
| Causal discovery (PC / Granger / TE / consensus) | Only Tier 1 metrics | `causalInference.ts` |
| do-calculus intervention engine | ❌ | `causalInterventionEngine.ts` |
| Counterfactual SCM engine | Only Tier 4 metrics | `counterfactualEngine.ts` |
| Prescriptive AI | ❌ | `prescriptiveAI.ts` |
| Knowledge Graph (ontology + causal) | ❌ | `KnowledgeGraphPanel.tsx`, KG_APPROACHES_COMPARISON.md |
| Pearl's hierarchy framing (L1/L2/L3) | Brief sentence | Multiple docs |
| Dataset details, real-data uploads | ❌ | DATASET_OVERVIEW.md |
| Entry-level tutorial tone / glossary | ❌ | — |

Existing downloadable docs (`imschmAcademicReport`, `thesisChapterReport`, `cvggImschmComparisonReport`, root `.md` files) are **thesis/architecture style**, not tutorial style, and are **not exposed from the Experiment Panel**.

## Proposed changes

### 1. Add "Project Overview & Theory" section to the Experiment Panel UI
A new collapsible card above the 5-tier cards containing entry-level explanations of:
- What IMSCHM is trying to prove (problem statement, one paragraph)
- Pearl's 3-rung hierarchy with plain-language examples
- The 8-step pipeline diagram (ASCII)
- CVGG in one page: dual-VGG backbones + causal head + DAG-consistency loss
- Discovery engines (PC / Granger / TE / consensus) in plain language
- do-calculus, counterfactual, prescriptive AI — one paragraph each
- Knowledge Graph role
- Glossary (ATE, CATE, DE, IE, SHD, PEHE, do(), SCM…)

Written for an entry-level learner: short sentences, one formula per concept, an analogy where useful.

### 2. New downloadable "Experiment Handbook" (single self-contained HTML)
Add a **Download → Handbook (HTML)** button. New file `src/utils/experimentHandbookReport.ts` generates one document with:

```
1. Introduction (what/why, target reader)
2. Background theory (Pearl hierarchy, causal DAGs, SCM) — with analogies
3. System architecture (IMSCHM vs CVGG, 8-step pipeline)
4. Data & simulation (physics domains, failure injection, real-data uploads)
5. CVGG deep-dive (backbones, heads, DAG loss, training loop)
6. Causal engines (discovery, do-calculus, counterfactual, prescriptive, KG)
7. Experiment design — the 5 tiers (embedded SVGs + narratives — reuse existing)
8. Results & discussion (auto-filled from current run + interpretation guide)
9. Limitations & future work
10. Glossary + reading list
```

Embeds the same SVG figures already built in the panel; auto-fills with the latest run's metrics; renders standalone (no external assets).

### 3. Also expose a Markdown variant
Same handbook as `.md` for easy reading/printing (Download → Handbook (MD)).

### Technical notes
- No changes to backend / simulation / engines — pure documentation + UI additions.
- Reuse existing `buildTier*SVG` builders and `TIER_NARRATIVE` array.
- New util file keeps `ExperimentPanel.tsx` from growing further; panel only wires two new buttons.
- No new dependencies.

## Deliverables
- Updated `src/components/ExperimentPanel.tsx` (overview card + 2 new download buttons)
- New `src/utils/experimentHandbookReport.ts` (HTML + MD generators)
- No changes to routing, data model, or other panels.