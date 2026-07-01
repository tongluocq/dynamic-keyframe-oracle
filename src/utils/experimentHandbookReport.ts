/**
 * experimentHandbookReport — Entry-level "Experiment Handbook" for IMSCHM / CVGG.
 *
 * Produces one self-contained HTML document and a Markdown variant that a new
 * learner can read end-to-end: problem framing, Pearl's hierarchy, architecture,
 * data & simulation, CVGG deep-dive, every causal engine, the 5-tier experiment
 * suite (with embedded SVG figures + narratives), results interpretation,
 * limitations, and a glossary.
 *
 * Takes the same `results` object and `TIER_NARRATIVE` array the ExperimentPanel
 * already builds, plus the six SVG figure builders — nothing else.
 */

export interface HandbookInputs {
  seed: number;
  results: any;
  figures: Record<string, string>; // filename -> raw <svg>...</svg> string
  narrative: Array<{ id: string; title: string; design: string; purpose: string; theory: string; algorithms: string }>;
}

/* -------------------------------------------------------------------------- */
/* Static entry-level narrative — reused by HTML and MD builders              */
/* -------------------------------------------------------------------------- */
const OVERVIEW = {
  intro: `IMSCHM (Intelligent Multi-Scale Causal Health Monitoring) is a research-grade dashboard that watches a Tunnel Boring Machine (TBM) and answers three kinds of questions: "what is happening?", "what would happen if I changed something?", and "what should I do next?". The engine at the middle of the stack is CVGG (Causal Variational Graph network), a deep model that turns raw sensor and image streams into calibrated causal effect numbers.`,
  audience: `This handbook is written for readers who are new to causal AI. Every concept is introduced with a short plain-language definition, one formula (only where it clarifies the idea), and a mining/tunnelling analogy. All numbers in the results section come from the run of the Experiment Panel you started; re-running with a different seed reproduces or refreshes them.`,
  pearl: [
    { rung: 'Rung 1 — Association', symbol: 'P(Y | X)', tunnel: '"Whenever cutter torque rises, motor temperature rises 30 s later." — a pattern the machine has already seen.' },
    { rung: 'Rung 2 — Intervention', symbol: 'P(Y | do(X = x))', tunnel: '"If I forcibly cap advance-rate at 40 mm/min, what will motor temperature do?" — even if we have never actually capped it before.' },
    { rung: 'Rung 3 — Counterfactual', symbol: 'P(Y_{X = x*} | X = x, Y = y)', tunnel: '"Given that the motor tripped at 96°C under the actual advance rate, would it still have tripped if the operator had backed off 15%?"' },
  ],
  pipeline: `Physics Simulator → Failure Injector → Causal Discovery (PC / Granger / TE + consensus) → Neural Encoder → CVGG Inference (ATE / CATE / DE / IE) → do-Calculus Intervention → Counterfactual SCM → Prescriptive AI → Knowledge Graph / Visualization`,
  cvgg: `CVGG has two visual "eyes" (VGG-16 backbones — one for rock/geology images, one for 6-channel wavelet scalograms of the sensor stream) and a metadata encoder that consumes structured causal variables (treatment, confounders, instruments). Their features are concatenated and fed to two heads: a classification head (fault type) and a causal-effect head that outputs four numbers — ATE, CATE, DE, IE — plus a 32-dim latent confounder proxy. The training loss is L_class + λ₁·L_causal + λ₂·|ATE − (DE + IE)|²; the last term is the DAG-consistency penalty and is the model's structural innovation.`,
  engines: [
    { name: 'Causal discovery (L1)', desc: 'PC algorithm strips edges by conditional-independence tests; Granger tests whether one series predicts another; Transfer Entropy measures information flow. A 4-method consensus vote turns the three lists into a single DAG.' },
    { name: 'do-Calculus engine (L2)', desc: 'Given the DAG and CVGG\'s ATE, computes P(Y | do(X = x*)) using backdoor / frontdoor adjustment. Used by the "Intervention" tab.' },
    { name: 'Counterfactual SCM engine (L3)', desc: 'Abduction (infer hidden noise from what actually happened) → Action (rewrite the structural equation) → Prediction (roll forward). Answers "what would have happened?" questions.' },
    { name: 'Prescriptive AI', desc: 'Ranks candidate actions by CVGG-estimated causal impact under budget / safety constraints and returns an ordered recommendation list.' },
    { name: 'Knowledge Graph', desc: 'Fuses a domain FMEA ontology (Equipment → Subsystem → Component → Failure) with the learned causal graph, so operators can see the traditional maintenance view and the discovered causal view side by side.' },
  ],
  glossary: [
    ['ATE',   'Average Treatment Effect — mean causal effect of a treatment on an outcome across the whole population.'],
    ['CATE',  'Conditional ATE — the same effect estimated inside a subgroup (e.g. Hard-rock conditions only).'],
    ['DE / NDE', 'Natural Direct Effect — the piece of the treatment\'s influence that does NOT flow through other measured variables.'],
    ['IE / NIE', 'Natural Indirect Effect — the piece that flows through mediator variables.'],
    ['DAG',   'Directed Acyclic Graph — arrows show cause → effect, no cycles allowed.'],
    ['SCM',   'Structural Causal Model — a DAG plus one equation per node describing how it is generated.'],
    ['do(X = x)', 'Pearl\'s intervention operator — "forcibly set X to x", overriding whatever would have set it otherwise.'],
    ['SHD',   'Structural Hamming Distance — number of edge additions / deletions / reversals between two DAGs.'],
    ['PEHE',  'Precision in Estimation of Heterogeneous Effects — standard counterfactual-error metric.'],
    ['FAR',   'False Alarm Rate — fraction of normal states misclassified as faults.'],
    ['Scalogram', 'Time-frequency image obtained by continuous wavelet transform of a 1-D sensor signal.'],
  ],
  limitations: [
    'All data shown in the panel is browser-simulated; validation against a real field TBM has not been performed in this dashboard.',
    'CVGG here is a lightweight in-browser training loop, not the full-parameter version implied by the architecture diagram.',
    'The ground-truth DAG in Tier 1 is a stylised 5-node cascade; real TBM DAGs are larger and sparser.',
    'Counterfactual PEHE is estimated on synthetic potential outcomes, which upper-bounds achievable realism.',
  ],
  reading: [
    'Pearl, J. (2009) Causality — the canonical textbook.',
    'Spirtes, Glymour & Scheines (2000) Causation, Prediction, and Search — PC algorithm.',
    'Zheng et al. (2018) DAGs with NO TEARS — the h(W) = tr(e^{W∘W}) − d constraint used in CVGG\'s DAG loss.',
    'Hill (2011) Bayesian nonparametric modeling for causal inference — PEHE origin.',
    'Simonyan & Zisserman (2014) Very Deep Convolutional Networks — VGG backbones used by CVGG.',
  ],
};

/* -------------------------------------------------------------------------- */
/* HTML builder                                                               */
/* -------------------------------------------------------------------------- */
export function buildHandbookHTML(inputs: HandbookInputs): string {
  const { seed, results, figures, narrative } = inputs;
  const t1 = results.tier1.algorithms;
  const now = new Date().toISOString();

  const pearlRows = OVERVIEW.pearl.map(p =>
    `<tr><td><strong>${p.rung}</strong></td><td><code>${p.symbol}</code></td><td>${p.tunnel}</td></tr>`
  ).join('');

  const engineRows = OVERVIEW.engines.map(e =>
    `<tr><td><strong>${e.name}</strong></td><td>${e.desc}</td></tr>`
  ).join('');

  const glossaryRows = OVERVIEW.glossary.map(([k, v]) =>
    `<tr><td><code>${k}</code></td><td>${v}</td></tr>`
  ).join('');

  const tierBlock = (id: string, figKey: string, caption: string, extraTable = '') => {
    const n = narrative.find(x => x.id === id)!;
    return `
<h3 id="${id}">${n.title}</h3>
<div class="narrative">
  <p><strong>Design.</strong> ${n.design}</p>
  <p><strong>Purpose.</strong> ${n.purpose}</p>
  <p><strong>Theory.</strong> ${n.theory}</p>
  <p><strong>Algorithms in this project.</strong> ${n.algorithms}</p>
</div>
<div class="figure">${figures[figKey]}<div class="figure-caption">${caption}</div></div>
${extraTable}`;
  };

  const tier1Table = `
<table><tr><th>Algorithm</th><th>SHD</th><th>Precision</th><th>Recall</th><th>F1</th><th>FPR</th></tr>
${(['PC','Granger','CVGG'] as const).map(alg => {
  const m = t1[alg].metrics;
  return `<tr><td><strong>${alg}</strong></td><td>${m.shd}</td><td>${m.precision.toFixed(3)}</td><td>${m.recall.toFixed(3)}</td><td>${m.f1.toFixed(3)}</td><td>${m.fpr.toFixed(3)}</td></tr>`;
}).join('')}
</table>`;

  const html = `<!doctype html><html><head><meta charset="utf-8">
<title>IMSCHM / CVGG Experiment Handbook — Seed ${seed}</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;max-width:960px;margin:2rem auto;padding:0 1rem;color:#1a1a1a;line-height:1.6}
  h1{border-bottom:3px solid #0d7a5f;padding-bottom:.4rem}
  h2{color:#0d7a5f;margin-top:2.4rem;border-left:4px solid #0d7a5f;padding-left:.6rem}
  h3{color:#334155;margin-top:1.6rem}
  table{border-collapse:collapse;width:100%;margin:1rem 0;font-size:.9rem}
  th,td{border:1px solid #ddd;padding:.5rem .7rem;text-align:left;vertical-align:top}
  th{background:#f3f7f5}
  code{background:#f3f3f3;padding:.1rem .3rem;border-radius:.2rem;font-size:.9em}
  .callout{background:#eef5f2;border-left:4px solid #0d7a5f;padding:.8rem 1rem;border-radius:.3rem;margin:1rem 0}
  .narrative{background:#f8fafc;border-left:3px solid #0d7a5f;padding:.7rem 1rem;margin:.8rem 0;font-size:.92rem}
  .narrative p{margin:.35rem 0}
  .figure{margin:1rem 0;padding:.6rem;border:1px solid #e2e8f0;border-radius:.4rem;background:#fff;text-align:center}
  .figure svg{max-width:100%;height:auto}
  .figure-caption{font-size:.82rem;color:#64748b;margin-top:.3rem;font-style:italic}
  .toc{background:#f8fafc;padding:.9rem 1rem;border-radius:.4rem;margin:1.4rem 0}
  .toc a{color:#0d7a5f;text-decoration:none;display:block;padding:.15rem 0}
  pre.ascii{background:#0f172a;color:#e2e8f0;padding:.9rem;border-radius:.4rem;font-size:.8rem;overflow-x:auto}
  .metric{display:inline-block;background:#eef5f2;padding:.25rem .6rem;border-radius:.3rem;margin:.15rem;font-size:.85rem}
</style></head><body>

<h1>IMSCHM / CVGG Experiment Handbook</h1>
<p><em>An entry-level, self-contained guide to what the project does, how it does it, and what the numbers on the Experiment Panel actually mean.</em></p>
<p><strong>Seed:</strong> ${seed} &nbsp; <strong>Generated:</strong> ${now}</p>

<div class="toc">
  <strong>Contents</strong>
  <a href="#s1">1. Introduction — what problem IMSCHM solves</a>
  <a href="#s2">2. Background theory — Pearl's hierarchy in plain language</a>
  <a href="#s3">3. System architecture — IMSCHM vs CVGG</a>
  <a href="#s4">4. Data & simulation</a>
  <a href="#s5">5. CVGG deep-dive</a>
  <a href="#s6">6. Causal engines around CVGG</a>
  <a href="#s7">7. Experiment design — the five tiers</a>
  <a href="#s8">8. Results & how to read them</a>
  <a href="#s9">9. Limitations & future work</a>
  <a href="#s10">10. Glossary & further reading</a>
</div>

<h2 id="s1">1. Introduction — what problem IMSCHM solves</h2>
<p>${OVERVIEW.intro}</p>
<div class="callout">${OVERVIEW.audience}</div>

<h2 id="s2">2. Background theory — Pearl's hierarchy in plain language</h2>
<p>Judea Pearl organises causal questions into three "rungs". A model that only answers rung 1 cannot answer rung 2 or 3 — it needs extra structure. IMSCHM aims to cover all three.</p>
<table><tr><th>Rung</th><th>Formal form</th><th>Tunnelling example</th></tr>${pearlRows}</table>
<p>A <strong>DAG (Directed Acyclic Graph)</strong> is how we write down which variable causes which. A <strong>Structural Causal Model (SCM)</strong> is a DAG plus one equation per node saying <em>how</em> that node is generated from its parents plus unobserved noise. Everything CVGG and its engines do is defined on top of an SCM.</p>

<h2 id="s3">3. System architecture — IMSCHM vs CVGG</h2>
<p>The project has two layers that are easy to confuse:</p>
<ul>
  <li><strong>CVGG</strong> is the <em>inference engine</em>: one step of the pipeline that turns inputs into calibrated causal-effect numbers.</li>
  <li><strong>IMSCHM</strong> is the <em>system</em> around it: simulation, discovery, higher-level reasoning, visualisation.</li>
</ul>
<pre class="ascii">${OVERVIEW.pipeline}</pre>
<p>CVGG occupies exactly one step; the other steps are provided by IMSCHM. This is why the two are described as complementary rather than competing.</p>

<h2 id="s4">4. Data & simulation</h2>
<p>Live data in the dashboard is generated by a 5-domain physics simulator (Electrical, Hydraulic, Mechanical, Thermal, Cutting) with cross-domain coupling. A separate failure injector can degrade the state along realistic failure modes (bearing wear, seal leak, thermal runaway, etc.). Real datasets (CWRU vibration signals, rock images) can also be uploaded through the Real-Data panel. The Experiment Panel itself uses seeded synthetic data so runs are exactly reproducible.</p>

<h2 id="s5">5. CVGG deep-dive</h2>
<p>${OVERVIEW.cvgg}</p>
<div class="callout"><strong>Why the DAG-consistency loss matters.</strong> Without <code>|ATE − (DE + IE)|²</code>, the four causal outputs could drift into an internally inconsistent state (an effect that is not the sum of its direct and indirect parts). Penalising that gap forces the model to respect the structural decomposition Pearl's framework demands.</div>

<h2 id="s6">6. Causal engines around CVGG</h2>
<table><tr><th>Engine</th><th>What it does</th></tr>${engineRows}</table>

<h2 id="s7">7. Experiment design — the five tiers</h2>
<p>Each tier is a targeted evidence source. Together they cover all three Pearl rungs plus closed-loop deployability.</p>
${tierBlock('tier1', 'tier1_dag_comparison.svg',
  'Figure 1.1 — Ground-truth vs CVGG-inferred DAG. Green solid = ground-truth; dashed orange = inferred.',
  tier1Table + `<div class="figure">${figures['tier1_roc.svg']}<div class="figure-caption">Figure 1.2 — ROC sweep. Curves further from the diagonal separate true edges from spurious ones more cleanly.</div></div>`)}
${tierBlock('tier2', 'tier2_wavelet.svg',
  'Figure 2.1 — Wavelet decomposition (low- vs high-frequency bands). Orange shading marks CVGG causal-shift detections.')}
${tierBlock('tier3', 'tier3_ablation.svg',
  'Figure 3.1 — Modality ablation across geological complexity. Fusion gains grow in fractured / fault zones.')}
${tierBlock('tier4', 'tier4_counterfactual.svg',
  'Figure 4.1 — Factual (red) vs counterfactual (green) motor-temperature trajectory under do(advance-rate −15%).')}
${tierBlock('tier5', 'tier5_latency.svg',
  'Figure 5.1 — Per-stage closed-loop latency breakdown.')}

<h2 id="s8">8. Results & how to read them</h2>
<p>From the current seed (${seed}), the headline numbers are:</p>
<p>
  <span class="metric">CVGG F1 = ${t1.CVGG.metrics.f1.toFixed(3)}</span>
  <span class="metric">CVGG FPR = ${t1.CVGG.metrics.fpr.toFixed(3)}</span>
  <span class="metric">Temporal stability = ${results.tier2.stability}</span>
  <span class="metric">Fusion ATE gain = +${results.tier3.ateImprovement}%</span>
  <span class="metric">√PEHE = ${results.tier4.rootPEHE}</span>
  <span class="metric">End-to-end latency = ${results.tier5.totalLatency} ms</span>
  <span class="metric">FAR = ${results.tier5.far}</span>
</p>
<p><strong>Reading guide.</strong> F1 &gt; 0.75 and FPR &lt; 0.20 in Tier 1 means CVGG is not just correlating — it is respecting the confounder edge. Temporal stability near 1 means micro and macro faults are both being caught. Positive ATE gain in Tier 3 means the image modality is doing real causal work rather than adding noise. Small √PEHE in Tier 4 means counterfactual predictions are trustworthy enough for prescriptive control. End-to-end latency below ~1000 ms with a low FAR is the criterion for real-time deployability in Tier 5.</p>

<h2 id="s9">9. Limitations & future work</h2>
<ul>${OVERVIEW.limitations.map(x => `<li>${x}</li>`).join('')}</ul>
<p>Planned upgrades include swapping the VGG image backbone for a Vision Transformer, adding uncertainty intervals to every ATE / CATE output (Bayesian CVGG), and integrating live MQTT/OPC-UA sensor feeds for on-machine deployment.</p>

<h2 id="s10">10. Glossary & further reading</h2>
<table><tr><th>Term</th><th>Meaning</th></tr>${glossaryRows}</table>
<h3>Reading list</h3>
<ul>${OVERVIEW.reading.map(x => `<li>${x}</li>`).join('')}</ul>

<hr>
<p style="font-size:.8rem;color:#64748b">Handbook auto-generated from the Experiment Panel. Re-run the panel to refresh the figures and headline metrics.</p>
</body></html>`;
  return html;
}

/* -------------------------------------------------------------------------- */
/* Markdown builder — same content, no embedded SVGs (references filenames)   */
/* -------------------------------------------------------------------------- */
export function buildHandbookMarkdown(inputs: HandbookInputs): string {
  const { seed, results, narrative } = inputs;
  const t1 = results.tier1.algorithms;
  const now = new Date().toISOString();

  const tierMD = (id: string, figFile: string) => {
    const n = narrative.find(x => x.id === id)!;
    return `### ${n.title}

**Design.** ${n.design}

**Purpose.** ${n.purpose}

**Theory.** ${n.theory}

**Algorithms in this project.** ${n.algorithms}

*Figure:* \`${figFile}\` (download separately via the "SVG Figures" button).
`;
  };

  return `# IMSCHM / CVGG Experiment Handbook

*An entry-level, self-contained guide to what the project does, how it does it, and what the numbers on the Experiment Panel actually mean.*

**Seed:** ${seed} · **Generated:** ${now}

---

## 1. Introduction
${OVERVIEW.intro}

> ${OVERVIEW.audience}

## 2. Background theory — Pearl's hierarchy

| Rung | Formal form | Tunnelling example |
|---|---|---|
${OVERVIEW.pearl.map(p => `| **${p.rung}** | \`${p.symbol}\` | ${p.tunnel} |`).join('\n')}

A **DAG** encodes cause → effect arrows; an **SCM** adds one generating equation per node. All CVGG outputs are defined on top of an SCM.

## 3. System architecture — IMSCHM vs CVGG
- **CVGG** — the inference engine (one step).
- **IMSCHM** — the system around it (simulation, discovery, reasoning, UI).

\`\`\`
${OVERVIEW.pipeline}
\`\`\`

## 4. Data & simulation
Live data is generated by a 5-domain physics simulator with cross-domain coupling plus an optional failure injector. Real datasets (CWRU vibration, rock images) can be uploaded via the Real-Data panel. Experiment-Panel data is seeded synthetic so runs are exactly reproducible.

## 5. CVGG deep-dive
${OVERVIEW.cvgg}

> Without the \`|ATE − (DE + IE)|²\` penalty the four causal outputs could drift into an internally inconsistent state. Penalising the gap forces structural consistency.

## 6. Causal engines around CVGG
${OVERVIEW.engines.map(e => `- **${e.name}** — ${e.desc}`).join('\n')}

## 7. Experiment design — the five tiers
${['tier1','tier2','tier3','tier4','tier5'].map((id,i) => tierMD(id, ['tier1_dag_comparison.svg','tier2_wavelet.svg','tier3_ablation.svg','tier4_counterfactual.svg','tier5_latency.svg'][i])).join('\n')}

## 8. Results & how to read them

| Metric | Value |
|---|---|
| CVGG F1 (Tier 1) | ${t1.CVGG.metrics.f1.toFixed(3)} |
| CVGG FPR (Tier 1) | ${t1.CVGG.metrics.fpr.toFixed(3)} |
| Temporal stability (Tier 2) | ${results.tier2.stability} |
| Fusion ATE gain (Tier 3) | +${results.tier3.ateImprovement}% |
| √PEHE (Tier 4) | ${results.tier4.rootPEHE} |
| End-to-end latency (Tier 5) | ${results.tier5.totalLatency} ms |
| False-alarm rate (Tier 5) | ${results.tier5.far} |

**Reading guide.** F1 > 0.75 and FPR < 0.20 in Tier 1 → CVGG is respecting the confounder edge. Temporal stability near 1 → micro and macro faults are both caught. Positive Tier 3 ATE gain → the image modality is doing real causal work. Small √PEHE → counterfactuals are trustworthy enough for prescriptive control. Sub-second latency with low FAR → real-time deployable.

## 9. Limitations & future work
${OVERVIEW.limitations.map(x => `- ${x}`).join('\n')}

Planned upgrades: ViT image backbone, Bayesian CVGG for uncertainty, live MQTT/OPC-UA sensor integration.

## 10. Glossary
${OVERVIEW.glossary.map(([k,v]) => `- **${k}** — ${v}`).join('\n')}

### Further reading
${OVERVIEW.reading.map(x => `- ${x}`).join('\n')}

---
*Handbook auto-generated from the Experiment Panel. Re-run the panel to refresh the figures and headline metrics.*
`;
}
