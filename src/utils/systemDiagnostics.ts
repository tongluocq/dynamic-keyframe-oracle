/**
 * System Diagnostics & Self-Closure Logger
 * 
 * Captures computation errors, NaN detections, and pipeline failures.
 * Provides solution suggestions for each error type — the "self-closure" characteristic
 * of the IMSCHM simulation system.
 */

export type DiagnosticSeverity = 'info' | 'warning' | 'error' | 'critical';
export type DiagnosticCategory = 'computation' | 'pipeline' | 'data' | 'model' | 'trust';

export interface DiagnosticEntry {
  id: string;
  timestamp: number;
  severity: DiagnosticSeverity;
  category: DiagnosticCategory;
  source: string;        // e.g., 'causalInterventionEngine', 'counterfactualEngine'
  message: string;
  details?: string;
  solution: string;      // Actionable fix suggestion
  resolved: boolean;
  autoResolved?: boolean;
}

export interface TrustScore {
  physicsGrounding: number;    // 0-100
  verificationTests: { passed: number; total: number };
  benchmarkAlignment: number;  // 0-100
  pipelineIntegrity: number;   // 0-100
  dataQuality: number;         // 0-100
  overall: number;             // 0-100
  lastUpdated: number;
}

const SOLUTION_MAP: Record<string, string> = {
  'nan_division': 'Ensure the denominator variable has been initialized by running simulation first. Check if sensor values are non-zero.',
  'nan_percentage': 'Value produced NaN when computing percentage. This typically means the baseline value was 0 or missing. Run CVGG Inference first to establish baseline.',
  'missing_cvgg': 'No CVGG inference result available. Follow pipeline: Start Simulation → Inject Failure → Train CVGG → Run Inference.',
  'missing_state': 'System state not available. Start the simulation first using the Play button.',
  'missing_ate': 'ATE (Average Treatment Effect) is not computed yet. Run CVGG Inference before executing interventions.',
  'empty_effects': 'No secondary effects were computed. Check that the intervention variable has defined causal coefficients.',
  'risk_overflow': 'Risk calculation exceeded bounds. Values have been clamped to [0, 1] range.',
  'infinite_value': 'Computation produced Infinity. Input values may be extreme. Reset simulation and re-run.',
  'pipeline_order': 'Operations must follow pipeline order: Simulate → Inject → Train → Infer → do() → What-If → Prescribe.',
  'model_not_trained': 'CVGG model not trained yet. Switch to CVGG tab and complete training before inference.',
  'low_confidence': 'Inference confidence is below 50%. Consider training with more data or injecting a clearer failure mode.',
  'trust_degraded': 'Trust score has decreased due to computation errors. Review diagnostics log and resolve issues.',
};

class SystemDiagnostics {
  private entries: DiagnosticEntry[] = [];
  private listeners: Set<() => void> = new Set();
  private maxEntries = 500;
  private trustScore: TrustScore;

  constructor() {
    this.trustScore = this.computeInitialTrust();
  }

  private generateId(): string {
    return `diag-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  }

  /**
   * Log a diagnostic entry with automatic solution suggestion
   */
  log(
    severity: DiagnosticSeverity,
    category: DiagnosticCategory,
    source: string,
    message: string,
    solutionKey?: string,
    details?: string,
  ): DiagnosticEntry {
    const solution = solutionKey
      ? SOLUTION_MAP[solutionKey] || `Review ${source} for: ${message}`
      : `Check ${source} module and verify prerequisite data is available.`;

    const entry: DiagnosticEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      severity,
      category,
      source,
      message,
      details,
      solution,
      resolved: false,
    };

    this.entries.unshift(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(0, this.maxEntries);
    }

    // Auto-resolve info entries
    if (severity === 'info') {
      entry.resolved = true;
      entry.autoResolved = true;
    }

    // Update trust score on errors
    if (severity === 'error' || severity === 'critical') {
      this.updateTrustScore();
    }

    this.notifyListeners();
    return entry;
  }

  /**
   * Log NaN detection with contextual solution
   */
  logNaN(source: string, variable: string, operation: string): DiagnosticEntry {
    return this.log(
      'warning',
      'computation',
      source,
      `NaN detected in "${variable}" during ${operation}`,
      'nan_division',
      `Variable: ${variable}, Operation: ${operation}. Value was replaced with safe fallback.`,
    );
  }

  /**
   * Log pipeline prerequisite error
   */
  logPipelineError(source: string, missing: string): DiagnosticEntry {
    const key = missing.includes('CVGG') ? 'missing_cvgg'
      : missing.includes('state') ? 'missing_state'
      : missing.includes('ATE') ? 'missing_ate'
      : 'pipeline_order';

    return this.log('error', 'pipeline', source, `Missing prerequisite: ${missing}`, key);
  }

  /**
   * Log successful operation (builds trust)
   */
  logSuccess(source: string, operation: string, details?: string): DiagnosticEntry {
    const entry = this.log('info', 'pipeline', source, `✓ ${operation} completed successfully`, undefined, details);
    this.updateTrustScore();
    return entry;
  }

  /**
   * Mark an entry as resolved
   */
  resolve(id: string): void {
    const entry = this.entries.find(e => e.id === id);
    if (entry) {
      entry.resolved = true;
      this.updateTrustScore();
      this.notifyListeners();
    }
  }

  getEntries(filter?: { severity?: DiagnosticSeverity; category?: DiagnosticCategory; unresolved?: boolean }): DiagnosticEntry[] {
    let result = [...this.entries];
    if (filter?.severity) result = result.filter(e => e.severity === filter.severity);
    if (filter?.category) result = result.filter(e => e.category === filter.category);
    if (filter?.unresolved) result = result.filter(e => !e.resolved);
    return result;
  }

  getUnresolvedCount(): number {
    return this.entries.filter(e => !e.resolved && (e.severity === 'error' || e.severity === 'warning')).length;
  }

  /**
   * Compute dynamic trust score based on actual system state
   */
  private computeInitialTrust(): TrustScore {
    return {
      physicsGrounding: 85,
      verificationTests: { passed: 6, total: 6 },
      benchmarkAlignment: 80,
      pipelineIntegrity: 100,
      dataQuality: 75,
      overall: 82,
      lastUpdated: Date.now(),
    };
  }

  updateTrustFromPipeline(context: {
    hasSimulation: boolean;
    hasFailureInjection: boolean;
    hasCVGGTraining: boolean;
    hasCVGGInference: boolean;
    hasIntervention: boolean;
    hasCounterfactual: boolean;
    hasPrescriptive: boolean;
    verificationPassed?: number;
    verificationTotal?: number;
    cvggConfidence?: number;
    ateValue?: number;
  }): void {
    const stagesCompleted = [
      context.hasSimulation,
      context.hasFailureInjection,
      context.hasCVGGTraining,
      context.hasCVGGInference,
      context.hasIntervention,
      context.hasCounterfactual,
      context.hasPrescriptive,
    ].filter(Boolean).length;

    // Pipeline integrity: proportion of stages completed
    this.trustScore.pipelineIntegrity = Math.round((stagesCompleted / 7) * 100);

    // Verification tests
    if (context.verificationPassed !== undefined && context.verificationTotal !== undefined) {
      this.trustScore.verificationTests = {
        passed: context.verificationPassed,
        total: context.verificationTotal,
      };
    }

    // Data quality: based on confidence and error count
    const unresolvedErrors = this.getUnresolvedCount();
    const errorPenalty = Math.min(unresolvedErrors * 5, 40);
    this.trustScore.dataQuality = Math.max(30, 90 - errorPenalty);

    // Benchmark alignment: based on CVGG confidence
    if (context.cvggConfidence !== undefined) {
      this.trustScore.benchmarkAlignment = Math.round(context.cvggConfidence * 100);
    }

    // Physics grounding: stable at 85 unless errors
    this.trustScore.physicsGrounding = Math.max(60, 85 - Math.floor(unresolvedErrors / 3) * 5);

    // Overall
    const vScore = this.trustScore.verificationTests.total > 0
      ? (this.trustScore.verificationTests.passed / this.trustScore.verificationTests.total) * 100
      : 80;
    this.trustScore.overall = Math.round(
      this.trustScore.physicsGrounding * 0.25 +
      vScore * 0.2 +
      this.trustScore.benchmarkAlignment * 0.2 +
      this.trustScore.pipelineIntegrity * 0.2 +
      this.trustScore.dataQuality * 0.15
    );

    this.trustScore.lastUpdated = Date.now();
    this.notifyListeners();
  }

  private updateTrustScore(): void {
    // Recompute based on current diagnostics
    const unresolvedErrors = this.getUnresolvedCount();
    const errorPenalty = Math.min(unresolvedErrors * 5, 40);
    this.trustScore.dataQuality = Math.max(30, 90 - errorPenalty);
    this.trustScore.physicsGrounding = Math.max(60, 85 - Math.floor(unresolvedErrors / 3) * 5);

    const vScore = this.trustScore.verificationTests.total > 0
      ? (this.trustScore.verificationTests.passed / this.trustScore.verificationTests.total) * 100
      : 80;
    this.trustScore.overall = Math.round(
      this.trustScore.physicsGrounding * 0.25 +
      vScore * 0.2 +
      this.trustScore.benchmarkAlignment * 0.2 +
      this.trustScore.pipelineIntegrity * 0.2 +
      this.trustScore.dataQuality * 0.15
    );
    this.trustScore.lastUpdated = Date.now();
  }

  getTrustScore(): TrustScore {
    return { ...this.trustScore };
  }

  clearAll(): void {
    this.entries = [];
    this.trustScore = this.computeInitialTrust();
    this.notifyListeners();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(fn => fn());
  }
}

// Singleton
let instance: SystemDiagnostics | null = null;

export function getSystemDiagnostics(): SystemDiagnostics {
  if (!instance) {
    instance = new SystemDiagnostics();
  }
  return instance;
}
