# Non-LLM Knowledge-Graph Construction — Reference Families vs. IMSCHM

> Where does IMSCHM's Stage-2-equivalent knowledge graph sit against the six
> canonical non-LLM KG-construction families used in biomedical signal
> processing? This document maps each family to concrete files in this
> repository, gives a side-by-side comparison table, and lists the gaps
> that remain if IMSCHM were to be judged against the reference "Stage 2"
> spec (typed nodes + typed edges + per-edge provenance + `prove-kg`).

**Scope.** Documentation only. No code, UI, backend, or dependency changes
are proposed here. Follow-ups are listed at the end as non-binding
suggestions.

**Constraint.** All approaches considered are strictly **LLM-free**. No
GPT / Claude / BioGPT extraction pipeline is used or proposed. Every edge
is either engineered by a rule, learned by a statistical / causal
algorithm, or emitted by an in-repo neural head (CVGG).

**"KG" definition used throughout.** A knowledge graph here means
**typed nodes + typed edges with provenance**, *not* a flat correlation
matrix and *not* an unlabelled adjacency. Both tiers matter — the
hierarchical taxonomy (Tier 1) and the scoped causal graph (Tier 2).

---

## 1. Recap of the six non-LLM KG families

### 1.1 Ontology-anchored mapping
Map engineered signal features through a clinical or industrial ontology
(SNOMED-CT, UMLS, HPO, FMA, MeSH — or, on the industrial side, ISO-13374
/ MIMOSA CRIS / FMEA) using hand-written threshold rules.

```
feature  →  rule(feature)  →  concept node  →  (concept, ISA, disease)
```

Nodes are typed by construction; edges are mostly hierarchical (ISA,
part-of) with a handful of `evidence_of` edges.

### 1.2 Statistical association graphs
Undirected graph from a feature matrix via Pearson / Spearman
correlation, mutual information, or partial correlation (graphical
lasso). Widely used in HRV, EEG functional connectivity, EMG synergy.

```
A_ij = 1{ |ρ_ij| ≥ τ }        # or  Σ⁻¹  thresholded (graphical lasso)
```

Edges are **association**, not causal. Nodes are anonymous variables.

### 1.3 Causal discovery from observational data
PC, FCI, GES, LiNGAM, NOTEARS, DirectLiNGAM applied to a feature matrix
to recover a DAG / CPDAG.

```
NOTEARS:  min_W  ½‖X − XW‖² + λ‖W‖₁   s.t.   h(W) = tr(e^{W⊙W}) − d = 0
```

Directional edges, anonymous variables (needs a separate ontology step
before it counts as a KG).

### 1.4 Granger / Transfer-Entropy graphs
Directed edges from time-series predictability. Dominant in EEG/MEG
effective connectivity and HRV–respiration coupling.

```
Granger:  i → j   iff   Var[ε_j | past_j] > Var[ε_j | past_j, past_i]
TE_{i→j} = Σ p(j_{t+1}, j_t^k, i_t^l) · log p(j_{t+1}|j_t^k,i_t^l) / p(j_{t+1}|j_t^k)
```

Directional, typed only by channel/anatomy, no disease taxonomy.

### 1.5 GNN / graph-signal-processing derived KGs
Learn an adjacency from embeddings (k-NN graph on learned features, or a
soft adjacency inside a GAT / GraphSAGE), then prune by edge weight.

```
A = softmax( φ(f_i)ᵀ ψ(f_j) ) ,    keep top-k per node
```

Adaptive and data-driven, but nodes are uninterpretable unless a
separate concept-mapping step is added.

### 1.6 Expert-curated rule bases turned into graphs
PhysioNet / CinC rule books, AHA guidelines, FMEA sheets encoded as
`IF feature ∈ range THEN concept` rules and rendered as a graph. Static,
high precision, low recall.

---

## 2. Family-by-family mapping to IMSCHM

Pipeline context (per `mem://projects/imschm/architecture/hybrid-pipeline`):
**Simulate → Inject Fault → Train CVGG → Infer → Intervene / What-If**.
Every KG artefact in the repo is produced at one of the last three
stages.

### 1.1 Ontology-anchored mapping — **Partial**

- `src/components/KnowledgeGraphPanel.tsx` defines a hand-coded FMEA
  taxonomy: `FMEA_NODES` (5 tiers: Equipment → Subsystem → Component →
  Failure Mode → Maintenance Action) and `FMEA_EDGES` (ISA / part-of
  style hierarchy).
- Each FMEA node carries a `causalRefs: string[]` field that pins it to
  named causal variables (e.g. `hydraulic_pressure`,
  `mechanical_vibration_x`). This is the concept-to-variable bridge.
- **What's missing vs. a true ontology anchor.** No external ID system
  (no SNOMED / UMLS analogue such as ISO-13374 / MIMOSA CRIS codes on
  each node). The taxonomy is intrinsic to this repo, so it cannot be
  cross-linked to third-party knowledge bases.

### 1.2 Statistical association graphs — **Indirect only**

- No standalone correlation- or graphical-lasso graph is produced or
  displayed.
- Pearson / mutual information appears **inside** the PC algorithm's
  conditional-independence tests in `src/utils/causalInference.ts:42`+
  ("Simplified PC Algorithm for causal discovery"), but the intermediate
  association matrix is never exposed as a first-class KG product.

### 1.3 Causal discovery (PC / NOTEARS / LiNGAM) — **Yes (PC + NOTEARS-adjacent)**

- **PC algorithm** — `src/utils/causalInference.ts:42` implements a
  simplified PC pass. Emitted edges are tagged with
  `discoveredBy: 'pc_algorithm'` in `src/utils/causalGraphRAG.ts:296`.
- **NOTEARS-style DAG penalty** — the CVGG head enforces a soft
  DAG-constraint loss `|ATE − (DE + IE)|²` (see
  `src/components/CausalKnowledgeBasePanel.tsx:1055` for the compare
  table entry; implementation lives in `src/utils/enhancedCausalVGG.ts`).
  This is not classical NOTEARS acyclicity (`h(W) = tr(e^{W⊙W}) − d`)
  but plays the same role: a differentiable regulariser that biases the
  learned adjacency toward causal consistency.
- **Not present**: FCI, GES, LiNGAM, DirectLiNGAM.

### 1.4 Granger / Transfer Entropy — **Yes**

- Both algorithms live in `src/utils/causalInference.ts` alongside PC.
- Downstream, edges are typed by discovery method in
  `src/utils/causalGraphRAG.ts:39`:
  `discoveredBy: 'cvgg' | 'pc_algorithm' | 'granger' | 'transfer_entropy' | 'manual'`.
- Fusion is consensus-voting across PC / Granger / TE per the memory
  `mem://projects/imschm/causal/discovery`. `CausalGraphRAG.addEdge`
  (`src/utils/causalGraphRAG.ts:230`) appends an `evidence` string every
  time a new discovery method re-asserts the same edge, so the fusion
  history is preserved edge-by-edge.

### 1.5 GNN / learned adjacency — **Yes (CVGG variant)**

- `src/utils/enhancedCausalVGG.ts` implements the **EnhancedCausalVGG**
  dual-backbone model with **cross-modal attention** and an **ATE head**
  (see memory `mem://projects/imschm/models/enhanced-causal-vgg`).
  Attention weights over sensor / image modalities behave as a soft
  learned adjacency, and the ATE head reads out a scalar effect per
  (treatment, outcome).
- IMSCHM does not build a k-NN graph over Stage-1 embeddings, and it
  does not use GAT / GraphSAGE. The "graph" is implicit in the causal
  head rather than a materialised `A` matrix that gets pruned top-k.
- Edges emitted from CVGG land in the RAG store tagged
  `discoveredBy: 'cvgg'` (`src/utils/causalGraphRAG.ts:39`).

### 1.6 Expert-curated rule base → graph — **Yes**

- The FMEA skeleton itself (`FMEA_NODES` + `FMEA_EDGES` in
  `src/components/KnowledgeGraphPanel.tsx`) is exactly a rule-base
  rendered as a graph: `IF Subsystem = Hydraulic THEN Component ∈ {Pump,
  Seal} THEN Failure ∈ {Leak} THEN Action = Reseal`.
- `KnowledgeGraphPanel.tsx` also defines a **domain-knowledge fallback**
  set of causal edges (`fallbackPairs`, in the same file's `useMemo`
  block) used when no live causal graph has been discovered yet —
  another hand-curated rule set rendered as edges.

---

## 3. Comparison table

Same axes as the reference "Stage 2" table; final column is the IMSCHM
Stage-2 equivalent as it exists today.

| Axis | 1.1 Ontology mapping | 1.2 Stat. assoc. | 1.3 Causal discovery (PC / NOTEARS) | 1.4 Granger / TE | 1.5 GNN adjacency | 1.6 Expert rule base | **IMSCHM (Stage 2 equivalent)** |
|---|---|---|---|---|---|---|---|
| Input | engineered features | features | features | raw time series | embeddings | features | Sensor windows (1024 samples × 3 axes) + rock images + `environmentalSignals` + FMEA metadata |
| Node typing | typed (ontology) | anonymous | anonymous | channel-typed | anonymous | typed | **Typed**: 5-tier FMEA taxonomy + named causal variables (`hydraulic_pressure`, `mechanical_vibration_x`, …) |
| Edge semantics | hierarchical | correlation | causal (CPDAG) | directional predictability | learned weight | rule | **Two tiers, not unified**: Tier-1 hierarchical (`FMEA_EDGES`), Tier-2 causal (`CausalEdge` with `strength`, `lag`, `discoveredBy`) |
| Provenance per edge | source citation | p-value | bootstrap frequency | F-stat / p-value | weight only | rule id | Thin: `weight`, `confidence`, `lag`, `discoveredBy`, plus an appended `evidence` string list (`causalGraphRAG.ts:230-264`). No p-value, no bootstrap freq, no `evidence_type ∈ {expert, mined}`, no per-cohort audit. |
| Adaptivity to new cohort | none | recompute | recompute from scratch | recompute | retrain GNN | none | Rebuild-per-run. `importFromCausalGraph` (`causalGraphRAG.ts:288`) re-ingests the whole live graph each pipeline pass; there is no online edge-trust update. |
| Validation story | citation | significance test | stability selection | surrogate data | held-out AUC | clinician review | Dataset-level only via `src/utils/causalDatasetVerification.ts`. **No `prove-kg`**: no cohort-split Jaccard, no λ=0 ablation, no permutation null on the KG itself. |
| LLM dependency | none | none | none | none | none | none | **none** |

---

## 4. Gap analysis vs. the reference Stage-2 spec

Ordered roughly by "cost to close" — cheapest first.

1. **No external ontology anchor.**
   The FMEA taxonomy is intrinsic to `KnowledgeGraphPanel.tsx`. A true
   Stage-2 KG would carry external IDs on every node so it can be
   cross-linked. In the industrial domain the natural analogues are:
   - **ISO-13374** condition-monitoring / diagnostic categories.
   - **MIMOSA CRIS** (Common Relational Information Schema) asset and
     failure taxonomy.
   - **ISO-14224** reliability-data taxonomy (subunit / component /
     failure-mode codes).
   None of these are referenced today.

2. **Thin per-edge provenance.**
   `CausalEdge.metadata` currently carries `discoveredBy`, `weight`,
   `confidence`, `lag`, and a free-form `evidence: string[]` log
   (`src/utils/causalGraphRAG.ts:32-39, 230-264`). The reference Stage-2
   spec expects a structured provenance object per edge:
   - `evidence_type ∈ {expert, mined}`.
   - Statistical test used (`pc | granger | te | cvgg_ate`).
   - p-value or bootstrap frequency.
   - `mechanism` string (short human-readable rationale).
   - Per-cohort audit trail (which sessions / experiments produced it).

3. **No `prove-kg`-style validation of the KG itself.**
   `src/utils/causalDatasetVerification.ts` validates that the
   *simulated dataset* is well-formed, but there is no validation loop
   that stress-tests the *edges*. The reference spec expects:
   - **Cohort-split Jaccard** — rebuild the KG on disjoint splits;
     report edge-set Jaccard.
   - **λ=0 ablation** — turn off the DAG-constraint loss and re-train;
     measure how many edges survive.
   - **Permutation null** — permute treatment labels; report false-edge
     rate at the current threshold, produce a pass/fail verdict.

4. **No online edge-trust update (Loops 1/2/3).**
   Each pipeline run overwrites the causal graph via
   `importFromCausalGraph` rather than incrementally re-weighting edge
   trust. There is no equivalent of Loop 1 (concept-projector update),
   Loop 2 (edge-weight update), or Loop 3 (taxonomy update from data).

5. **Two tiers are visually cross-linked, not schematically unified.**
   `KnowledgeGraphPanel.tsx` renders two SVGs side-by-side with
   click-through cross-highlighting (`resolveHighlight` in the same
   file). This is a UX bridge, not a data-model bridge — there is no
   single `KGNode` type carrying both an FMEA tier and its causal
   variable ID. A Stage-2 spec would use one typed node schema with a
   `tier: 'hierarchical' | 'causal'` discriminator.

---

## 5. Net assessment

IMSCHM covers **five of the six families**: 1.1 (partial), 1.3, 1.4,
1.5, and 1.6. It intentionally skips a standalone 1.2 product. It is
**LLM-free**, which matches the reference constraint exactly.

The three material gaps against the reference Stage-2 spec are:

1. **External-ontology anchoring** (ISO-13374 / MIMOSA / ISO-14224 IDs
   on FMEA nodes).
2. **Structured per-edge provenance** with statistical evidence and
   `evidence_type ∈ {expert, mined}`.
3. **A `prove-kg` validation panel** (cohort-split Jaccard + λ=0
   ablation + permutation null → verdict).

Closing these three would put IMSCHM on par with the reference Stage-2
KG spec while remaining strictly LLM-free.

---

## 6. Suggested next steps (non-binding)

These are not implemented here; they are follow-up planning candidates.

1. **Extend `CausalRelation` / `CausalEdge`** (`src/types/industrial.ts`,
   `src/utils/causalGraphRAG.ts`) with a structured
   `provenance: { evidence_type: 'expert' | 'mined', test: string,
   pValue?: number, bootstrapFreq?: number, mechanism?: string,
   cohortIds: string[] }` field. Populate it from PC / Granger / TE /
   CVGG at the point of emission.
2. **Add a unified two-tier `KGNode` schema** so `FMEA_NODES` and the
   causal variables share one node type with a `tier` discriminator and
   an optional `externalId` (ISO-13374 / MIMOSA / ISO-14224).
3. **Add a `ProveKgPanel` component** that runs on demand:
   cohort-split Jaccard across the last N sessions (already tracked via
   `resultsStorage.ts`), a λ=0 ablation re-training pass, a
   permutation-null baseline, and a single pass/fail verdict per edge.
