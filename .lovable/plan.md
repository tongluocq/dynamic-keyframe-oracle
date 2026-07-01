## Deliverable

Create a single new markdown document at the repo root:

- **`KG_APPROACHES_COMPARISON.md`**

No code changes, no dependencies, no UI changes. Documentation only.

## Structure of the document

1. **Purpose & scope**
   - What "KG" means here (typed nodes + typed edges + provenance).
   - Explicitly LLM-free — same constraint as the reference note.
   - Scope note: covers Stage-2-equivalent structures in IMSCHM (FMEA taxonomy + causal graph + CVGG DAG loss).

2. **Recap of the 6 non-LLM KG families** (condensed, 3–4 lines each, with the same minimal math already provided):
   1.1 Ontology-anchored mapping
   1.2 Statistical association graphs
   1.3 Causal discovery (PC / NOTEARS / LiNGAM)
   1.4 Granger / Transfer Entropy
   1.5 GNN / learned adjacency
   1.6 Expert-curated rule bases

3. **Family-by-family mapping to IMSCHM** — for each family:
   - Used? (Yes / Partial / Indirect / No)
   - File & line evidence, e.g.
     - 1.1 → `src/components/KnowledgeGraphPanel.tsx` (FMEA_NODES, FMEA_EDGES, causalRefs)
     - 1.3 → `src/utils/causalInference.ts` (PC), `src/utils/enhancedCausalVGG.ts` (DAG-constraint loss `|ATE−(DE+IE)|²`, NOTEARS-adjacent)
     - 1.4 → `src/utils/causalInference.ts` (Granger, TE) + `src/utils/causalGraphRAG.ts` `discoveredBy: 'granger' | 'transfer_entropy'`
     - 1.5 → `src/utils/enhancedCausalVGG.ts` (cross-modal attention + ATE head as learned adjacency)
     - 1.6 → `KnowledgeGraphPanel.tsx` `fallbackPairs` + FMEA skeleton
     - 1.2 → not standalone; correlation/MI only appears inside PC independence tests
   - Short note on how it's wired into the pipeline (Simulate → Inject → Train CVGG → Infer → Intervene).

4. **Comparison table** — one row per family plus a final "IMSCHM Stage-2 equivalent" column, in the same axes as the reference table (Input / Node typing / Edge semantics / Provenance / Adaptivity / Validation / LLM dependency).

5. **Gap analysis (what IMSCHM is missing vs the reference Stage-2 spec)**
   - No external ontology anchor (no SNOMED/UMLS analogue; suggest ISO-13374 / MIMOSA CRIS as the industrial equivalent).
   - Per-edge provenance is thin: currently only `strength`, `lag`, `discoveredBy` on `CausalRelation` / `CausalEdge`. Missing `evidence_type ∈ {expert, mined}`, p-value/bootstrap frequency, mechanism string, per-cohort audit.
   - No `prove-kg`-style validation (cohort-split Jaccard, λ=0 ablation, permutation null). `causalDatasetVerification.ts` validates the dataset, not KG edges.
   - No online edge-trust updates (Loops 1/2/3). KG is rebuilt per run instead of incrementally re-weighted.
   - FMEA tier and causal tier are visually cross-highlighted (dual SVG) but not unified into one typed two-tier graph schema.

6. **Suggested next steps (non-binding, for later planning)**
   - Extend `CausalRelation` / `CausalEdge` with a `provenance` object.
   - Add a unified two-tier node/edge schema so Tier-1 (hierarchical) and Tier-2 (causal) live in one graph.
   - Add a `prove-kg` panel: cohort-split Jaccard + permutation null + ablation summary.

## Technical details

- File format: GitHub-flavoured Markdown, no emojis in section headers.
- Tables use standard Markdown pipes.
- All code references use `path/to/file.ts:Lstart-Lend` style so they are clickable in IDEs.
- Length target: ~400–600 lines; hard cap 800.
- No changes to `src/`, `supabase/`, `package.json`, or any config.

## Out of scope

- Implementing provenance fields, `prove-kg`, or ontology anchoring.
- Any UI or backend change.
- Editing existing docs (`NEURAL_CAUSAL_ARCHITECTURE.md`, `TECHNICAL_REPORT_IMSCHM.md`, `README.md`, `.lovable/plan.md`).
