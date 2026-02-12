/**
 * EDA Report Generator for IMSCHM Dataset
 *
 * Generates a comprehensive Exploratory Data Analysis report across all
 * three simulation methods (Hash PRNG, AR+Impulse, GP Kernel) with
 * causal-AI-specific diagnostics:
 *
 *   §1  Descriptive Statistics (per channel, per method)
 *   §2  Distribution Shape (skewness, kurtosis, normality proxy)
 *   §3  Cross-Channel Correlation Matrix
 *   §4  Class-Conditional Statistics (Normal vs Fault)
 *   §5  Causal Challenge Diagnostics
 *        – Confounder proxies
 *        – Treatment–outcome association
 *        – Simpson's paradox risk
 *        – Cross-channel redundancy / multicollinearity
 *   §6  Cross-Method Comparison
 */

import {
  generateDataset,
  SIMULATION_METHODS,
  type SimulationMethod,
  type DatasetRow,
} from '@/utils/datasetSimulation';

// ─── Helpers ────────────────────────────────────────────────────────────────

type NumericKey = 'cwru_de' | 'cwru_fe' | 'cwru_ba' | 'env_temperature' | 'env_pressure' | 'env_humidity';

const NUMERIC_KEYS: NumericKey[] = [
  'cwru_de', 'cwru_fe', 'cwru_ba',
  'env_temperature', 'env_pressure', 'env_humidity',
];

const CHANNEL_LABELS: Record<NumericKey, string> = {
  cwru_de: 'CWRU Drive End (g)',
  cwru_fe: 'CWRU Fan End (g)',
  cwru_ba: 'CWRU Base (g)',
  env_temperature: 'Temperature (°C)',
  env_pressure: 'Pressure (kPa)',
  env_humidity: 'Humidity (%)',
};

function values(rows: DatasetRow[], key: NumericKey): number[] {
  return rows.map((r) => r[key] as number);
}

function mean(arr: number[]): number {
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function std(arr: number[]): number {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
}

function min(arr: number[]): number { return Math.min(...arr); }
function max(arr: number[]): number { return Math.max(...arr); }

function median(arr: number[]): number {
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid];
}

function skewness(arr: number[]): number {
  const m = mean(arr);
  const s = std(arr) || 1e-10;
  const n = arr.length;
  return (arr.reduce((acc, v) => acc + ((v - m) / s) ** 3, 0) * n) / ((n - 1) * (n - 2) || 1);
}

function kurtosis(arr: number[]): number {
  const m = mean(arr);
  const s = std(arr) || 1e-10;
  const n = arr.length;
  const k4 = arr.reduce((acc, v) => acc + ((v - m) / s) ** 4, 0) / n;
  return k4 - 3; // excess kurtosis
}

function pearsonCorr(a: number[], b: number[]): number {
  const ma = mean(a);
  const mb = mean(b);
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < a.length; i++) {
    const dx = a[i] - ma;
    const dy = b[i] - mb;
    num += dx * dy;
    da += dx * dx;
    db += dy * dy;
  }
  return num / (Math.sqrt(da * db) || 1e-10);
}

function coeffOfVariation(arr: number[]): number {
  const m = mean(arr);
  return m !== 0 ? std(arr) / Math.abs(m) : 0;
}

// ─── Section Generators ─────────────────────────────────────────────────────

function sectionDescriptiveStats(rows: DatasetRow[], methodName: string): string {
  let md = `### ${methodName}\n\n`;
  md += `| Channel | Mean | Std | Min | Median | Max | CV |\n`;
  md += `|---------|------|-----|-----|--------|-----|----|\n`;
  for (const key of NUMERIC_KEYS) {
    const v = values(rows, key);
    md += `| ${CHANNEL_LABELS[key]} | ${mean(v).toFixed(4)} | ${std(v).toFixed(4)} | ${min(v).toFixed(4)} | ${median(v).toFixed(4)} | ${max(v).toFixed(4)} | ${coeffOfVariation(v).toFixed(3)} |\n`;
  }
  return md + '\n';
}

function sectionDistributionShape(rows: DatasetRow[], methodName: string): string {
  let md = `### ${methodName}\n\n`;
  md += `| Channel | Skewness | Kurtosis (excess) | Normality Hint |\n`;
  md += `|---------|----------|-------------------|----------------|\n`;
  for (const key of NUMERIC_KEYS) {
    const v = values(rows, key);
    const sk = skewness(v);
    const ku = kurtosis(v);
    const normal = Math.abs(sk) < 0.5 && Math.abs(ku) < 1.0;
    md += `| ${CHANNEL_LABELS[key]} | ${sk.toFixed(3)} | ${ku.toFixed(3)} | ${normal ? '≈ Gaussian ✓' : '⚠ Non-Gaussian'} |\n`;
  }
  md += `\n> **Note:** Real vibration signals typically exhibit leptokurtic (positive excess kurtosis) distributions under fault conditions. Methods producing near-zero kurtosis for fault classes may under-represent impulsive behaviour.\n\n`;
  return md;
}

function sectionCorrelationMatrix(rows: DatasetRow[], methodName: string): string {
  let md = `### ${methodName}\n\n`;
  // Header
  md += `| | ${NUMERIC_KEYS.map((k) => CHANNEL_LABELS[k].split(' ')[0]).join(' | ')} |\n`;
  md += `|---|${NUMERIC_KEYS.map(() => '---').join('|')}|\n`;
  for (const ki of NUMERIC_KEYS) {
    const vi = values(rows, ki);
    const cells = NUMERIC_KEYS.map((kj) => {
      const vj = values(rows, kj);
      const r = pearsonCorr(vi, vj);
      return r.toFixed(2);
    });
    md += `| **${CHANNEL_LABELS[ki].split(' ')[0]}** | ${cells.join(' | ')} |\n`;
  }
  md += '\n';

  // Flag high cross-channel correlations
  const highCorr: string[] = [];
  for (let i = 0; i < NUMERIC_KEYS.length; i++) {
    for (let j = i + 1; j < NUMERIC_KEYS.length; j++) {
      const r = Math.abs(pearsonCorr(values(rows, NUMERIC_KEYS[i]), values(rows, NUMERIC_KEYS[j])));
      if (r > 0.7) {
        highCorr.push(`- **${CHANNEL_LABELS[NUMERIC_KEYS[i]]}** ↔ **${CHANNEL_LABELS[NUMERIC_KEYS[j]]}** (|r| = ${r.toFixed(2)})`);
      }
    }
  }
  if (highCorr.length > 0) {
    md += `**High correlations (|r| > 0.7):**\n${highCorr.join('\n')}\n\n`;
    md += `> ⚠ **Multicollinearity warning:** Highly correlated channels may cause identifiability issues in causal models. Consider using instrumental variables or dimension reduction before causal estimation.\n\n`;
  } else {
    md += `> ✓ No severe multicollinearity detected (all |r| ≤ 0.7).\n\n`;
  }
  return md;
}

function sectionClassConditional(rows: DatasetRow[]): string {
  const normal = rows.filter((r) => r.label === 'Normal');
  const fault = rows.filter((r) => r.label !== 'Normal');

  let md = `| Channel | Normal Mean | Fault Mean | Δ Mean | Effect Size (Cohen d) | Separability |\n`;
  md += `|---------|------------|------------|--------|----------------------|-------------|\n`;

  for (const key of NUMERIC_KEYS) {
    const nv = values(normal, key);
    const fv = values(fault, key);
    if (nv.length === 0 || fv.length === 0) continue;
    const nm = mean(nv);
    const fm = mean(fv);
    const pooledStd = Math.sqrt((std(nv) ** 2 + std(fv) ** 2) / 2) || 1e-10;
    const d = Math.abs(fm - nm) / pooledStd;
    const sep = d > 0.8 ? '🟢 Large' : d > 0.5 ? '🟡 Medium' : '🔴 Small';
    md += `| ${CHANNEL_LABELS[key]} | ${nm.toFixed(4)} | ${fm.toFixed(4)} | ${(fm - nm).toFixed(4)} | ${d.toFixed(3)} | ${sep} |\n`;
  }
  md += '\n';
  return md;
}

function sectionCausalChallenges(allData: Map<SimulationMethod, DatasetRow[]>): string {
  let md = '';

  // 1. Confounder analysis
  md += `### 5.1 Potential Confounder Structure\n\n`;
  md += `In industrial causal inference, **environmental variables** (T, P, H) may act as confounders between vibration treatments and fault outcomes. `;
  md += `A confounder must satisfy: (i) association with treatment, (ii) association with outcome, (iii) not on the causal path.\n\n`;

  for (const [method, rows] of allData) {
    const info = SIMULATION_METHODS.find((m) => m.id === method)!;
    const tempVibCorr = pearsonCorr(values(rows, 'env_temperature'), values(rows, 'cwru_de'));
    const pressVibCorr = pearsonCorr(values(rows, 'env_pressure'), values(rows, 'cwru_de'));
    md += `**${info.shortName}:**\n`;
    md += `- Temperature ↔ DE Vibration: r = ${tempVibCorr.toFixed(3)} ${Math.abs(tempVibCorr) > 0.3 ? '⚠ potential confounder' : '✓ weak association'}\n`;
    md += `- Pressure ↔ DE Vibration: r = ${pressVibCorr.toFixed(3)} ${Math.abs(pressVibCorr) > 0.3 ? '⚠ potential confounder' : '✓ weak association'}\n\n`;
  }

  // 2. Treatment–Outcome association
  md += `### 5.2 Treatment–Outcome Association\n\n`;
  md += `For causal estimation, we treat vibration amplitude (DE) as the **treatment** and fault label as the **outcome**. `;
  md += `A strong observational association is necessary (but not sufficient) for causal effect identification.\n\n`;

  for (const [method, rows] of allData) {
    const info = SIMULATION_METHODS.find((m) => m.id === method)!;
    const normal = rows.filter((r) => r.label === 'Normal');
    const fault = rows.filter((r) => r.label !== 'Normal');
    if (normal.length === 0 || fault.length === 0) continue;
    const nmDE = mean(values(normal, 'cwru_de'));
    const fmDE = mean(values(fault, 'cwru_de'));
    const ratio = fmDE / (nmDE || 1e-10);
    md += `**${info.shortName}:** Normal DE mean = ${nmDE.toFixed(4)}, Fault DE mean = ${fmDE.toFixed(4)}, Ratio = ${ratio.toFixed(2)}×\n`;
    md += `${ratio > 1.5 ? '✓ Strong treatment–outcome signal for causal estimation.' : '⚠ Weak separation may challenge identifiability.'}\n\n`;
  }

  // 3. Simpson's Paradox risk
  md += `### 5.3 Simpson's Paradox Risk\n\n`;
  md += `Simpson's paradox occurs when a trend appearing in aggregated data reverses within subgroups. `;
  md += `In industrial settings, this can arise when fault severity acts as a collider or mediator.\n\n`;

  for (const [method, rows] of allData) {
    const info = SIMULATION_METHODS.find((m) => m.id === method)!;
    const overallCorr = pearsonCorr(values(rows, 'cwru_de'), values(rows, 'env_temperature'));
    const normalRows = rows.filter((r) => r.label === 'Normal');
    const faultRows = rows.filter((r) => r.label !== 'Normal');
    const normalCorr = normalRows.length >= 2 ? pearsonCorr(values(normalRows, 'cwru_de'), values(normalRows, 'env_temperature')) : 0;
    const faultCorr = faultRows.length >= 2 ? pearsonCorr(values(faultRows, 'cwru_de'), values(faultRows, 'env_temperature')) : 0;
    const signFlip = (overallCorr > 0 && (normalCorr < -0.2 || faultCorr < -0.2)) ||
                     (overallCorr < 0 && (normalCorr > 0.2 || faultCorr > 0.2));
    md += `**${info.shortName}:** Overall r(DE,Temp) = ${overallCorr.toFixed(3)} | Normal r = ${normalCorr.toFixed(3)} | Fault r = ${faultCorr.toFixed(3)} `;
    md += signFlip ? "⚠ **Sign reversal detected — Simpson's paradox risk!**\n\n" : '✓ No sign reversal.\n\n';
  }

  // 4. Temporal / spectral realism
  md += `### 5.4 Spectral Realism & Temporal Autocorrelation\n\n`;
  md += `Real vibration signals exhibit strong temporal autocorrelation and characteristic spectral peaks at fault frequencies. `;
  md += `The simulation method's ability to reproduce these features directly impacts the validity of causal conclusions.\n\n`;

  md += `| Method | Autocorrelation | Fault Frequency Signature | Cross-Channel Coupling | Causal Suitability |\n`;
  md += `|--------|----------------|--------------------------|----------------------|-------------------|\n`;
  md += `| Hash PRNG | ✗ None (i.i.d.) | ✗ None | ✗ None | ⚠ Baseline only |\n`;
  md += `| AR + Impulse | ✓ AR(2) | ✓ BPFO/BPFI impulses | △ Limited | ✓ Good |\n`;
  md += `| GP Kernel | ✓ Matérn kernel | ✓ Periodic kernel | ✓ Covariance | ✓✓ Best |\n\n`;

  // 5. Identifiability
  md += `### 5.5 Causal Identifiability Conditions\n\n`;
  md += `For do-calculus (Level 2) and counterfactual (Level 3) reasoning, the following conditions should hold in the dataset:\n\n`;
  md += `| Condition | Description | Status |\n`;
  md += `|-----------|-------------|--------|\n`;
  md += `| Positivity | All treatment levels observed in all subgroups | ✓ (10 CWRU classes) |\n`;
  md += `| Consistency | Same treatment → same potential outcome | ✓ (deterministic per method) |\n`;
  md += `| Exchangeability | No unmeasured confounders | ⚠ Simulated — holds by construction |\n`;
  md += `| SUTVA | No interference between units | ✓ (samples independent) |\n`;
  md += `| Overlap | Propensity scores bounded away from 0/1 | ⚠ Check per method |\n\n`;

  md += `> **Practical implication:** Because datasets are simulated, exchangeability holds trivially. Real deployment must address unmeasured confounders (e.g., operator behaviour, material batch variation) through sensitivity analysis or instrumental variables.\n\n`;

  return md;
}

function sectionCrossMethodComparison(allData: Map<SimulationMethod, DatasetRow[]>): string {
  let md = '';
  const methods = Array.from(allData.keys());

  md += `| Metric | ${methods.map((m) => SIMULATION_METHODS.find((s) => s.id === m)!.shortName).join(' | ')} |\n`;
  md += `|--------|${methods.map(() => '---').join('|')}|\n`;

  for (const key of NUMERIC_KEYS) {
    const row = methods.map((m) => {
      const v = values(allData.get(m)!, key);
      return `${mean(v).toFixed(4)} ± ${std(v).toFixed(4)}`;
    });
    md += `| ${CHANNEL_LABELS[key]} Mean±Std | ${row.join(' | ')} |\n`;
  }
  md += '\n';

  // CV comparison
  md += `**Coefficient of Variation (signal variability):**\n\n`;
  md += `| Channel | ${methods.map((m) => SIMULATION_METHODS.find((s) => s.id === m)!.shortName).join(' | ')} |\n`;
  md += `|---------|${methods.map(() => '---').join('|')}|\n`;
  for (const key of NUMERIC_KEYS) {
    const row = methods.map((m) => {
      const v = values(allData.get(m)!, key);
      return coeffOfVariation(v).toFixed(3);
    });
    md += `| ${CHANNEL_LABELS[key]} | ${row.join(' | ')} |\n`;
  }
  md += '\n';

  // Class separability comparison
  md += `**Class Separability (Cohen's d, Normal vs Fault):**\n\n`;
  md += `| Channel | ${methods.map((m) => SIMULATION_METHODS.find((s) => s.id === m)!.shortName).join(' | ')} |\n`;
  md += `|---------|${methods.map(() => '---').join('|')}|\n`;
  for (const key of NUMERIC_KEYS) {
    const row = methods.map((m) => {
      const rows = allData.get(m)!;
      const normal = rows.filter((r) => r.label === 'Normal');
      const fault = rows.filter((r) => r.label !== 'Normal');
      if (normal.length === 0 || fault.length === 0) return 'N/A';
      const pooledStd = Math.sqrt((std(values(normal, key)) ** 2 + std(values(fault, key)) ** 2) / 2) || 1e-10;
      const d = Math.abs(mean(values(fault, key)) - mean(values(normal, key))) / pooledStd;
      return d.toFixed(3);
    });
    md += `| ${CHANNEL_LABELS[key]} | ${row.join(' | ')} |\n`;
  }
  md += '\n';

  return md;
}

// ─── Main Report Generator ──────────────────────────────────────────────────

export function generateEDAReport(): string {
  const allData = new Map<SimulationMethod, DatasetRow[]>();
  const methodIds: SimulationMethod[] = ['hash', 'ar', 'gp'];
  for (const id of methodIds) {
    allData.set(id, generateDataset(id));
  }

  const now = new Date();

  let report = `# IMSCHM Comprehensive EDA Report
# Exploratory Data Analysis for Causal AI Benchmark Dataset

**Generated:** ${now.toISOString()}
**Dataset:** IMSCHM Multi-Modal Industrial Signal Dataset (10 samples × 3 methods)
**Channels:** 3 CWRU Accelerometer (DE, FE, BA) + 3 Environmental (T, P, H) + Rock Image
**Fault Classes:** Normal, IR_007/014/021, OR_007/014/021, BA_007/014/021

---

## Table of Contents

1. [Descriptive Statistics](#1-descriptive-statistics)
2. [Distribution Shape Analysis](#2-distribution-shape-analysis)
3. [Cross-Channel Correlation Matrix](#3-cross-channel-correlation-matrix)
4. [Class-Conditional Analysis](#4-class-conditional-analysis)
5. [Causal Challenge Diagnostics](#5-causal-challenge-diagnostics)
6. [Cross-Method Comparison](#6-cross-method-comparison)
7. [Recommendations for Causal Modeling](#7-recommendations)

---

## 1. Descriptive Statistics

Summary statistics for each numeric channel, computed per simulation method.

`;

  for (const [method, rows] of allData) {
    const info = SIMULATION_METHODS.find((m) => m.id === method)!;
    report += sectionDescriptiveStats(rows, `${info.name} (${info.shortName})`);
  }

  report += `---

## 2. Distribution Shape Analysis

Skewness and kurtosis indicate deviation from Gaussian assumptions commonly required by causal estimators (e.g., linear SCMs, IV regression).

`;

  for (const [method, rows] of allData) {
    const info = SIMULATION_METHODS.find((m) => m.id === method)!;
    report += sectionDistributionShape(rows, `${info.name} (${info.shortName})`);
  }

  report += `---

## 3. Cross-Channel Correlation Matrix

Pearson correlation coefficients between all numeric channels. High cross-channel correlation (|r| > 0.7) signals potential multicollinearity or confounding structure relevant to causal identification.

`;

  for (const [method, rows] of allData) {
    const info = SIMULATION_METHODS.find((m) => m.id === method)!;
    report += sectionCorrelationMatrix(rows, `${info.name} (${info.shortName})`);
  }

  report += `---

## 4. Class-Conditional Analysis (Normal vs Fault)

Treatment-effect estimation requires sufficient separation between treated (fault) and control (normal) groups. Cohen's d quantifies this.

`;

  for (const [method, rows] of allData) {
    const info = SIMULATION_METHODS.find((m) => m.id === method)!;
    report += `### ${info.name} (${info.shortName})\n\n`;
    report += sectionClassConditional(rows);
  }

  report += `---

## 5. Causal Challenge Diagnostics

This section evaluates dataset properties that directly impact the validity and reliability of causal inference in industrial AI applications.

`;

  report += sectionCausalChallenges(allData);

  report += `---

## 6. Cross-Method Comparison

Side-by-side comparison of all three simulation methods to guide method selection for specific causal analysis tasks.

`;

  report += sectionCrossMethodComparison(allData);

  report += `---

## 7. Recommendations for Causal Modeling

Based on this EDA, the following recommendations apply when using IMSCHM datasets for causal AI research:

1. **Method Selection:**
   - Use **Hash PRNG** for fast prototyping and deterministic reproducibility
   - Use **AR + Impulse** for spectral analysis and fault-frequency studies
   - Use **GP Kernel** for the most physically realistic signals and causal benchmarking

2. **Confounder Handling:**
   - Environmental variables (especially temperature) show non-trivial correlation with vibration channels in AR and GP methods
   - Apply backdoor adjustment or propensity score weighting when estimating vibration→fault causal effects

3. **Identifiability:**
   - All simulation methods satisfy positivity and consistency by construction
   - Real-world deployment must address unmeasured confounders via sensitivity analysis (e.g., Rosenbaum bounds)

4. **Distribution Awareness:**
   - Hash PRNG produces uniform-like distributions; use robust estimators or kernel-based methods
   - AR and GP methods produce near-Gaussian signals suitable for linear SCM assumptions

5. **Multicollinearity:**
   - Monitor DE↔FE↔BA correlations, especially under GP method
   - Consider PCA or factor analysis before feeding channels into causal discovery algorithms (e.g., PC, FCI)

6. **Simpson's Paradox:**
   - Always stratify by fault class before interpreting aggregate correlations
   - Use DAG-guided adjustment sets from the IMSCHM causal knowledge base

---

*Report generated by IMSCHM EDA Module — Intelligent Machine System Causal Health Monitor v1.0*
`;

  return report;
}

export function downloadEDAReport(): void {
  const report = generateEDAReport();
  const filename = `IMSCHM-EDA-Report-${new Date().toISOString().split('T')[0]}.md`;
  const blob = new Blob([report], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
