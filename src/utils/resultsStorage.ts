/**
 * Results Storage System for IMSCHM
 * 
 * Centralized storage for all operation results:
 * - CVGG training/inference history
 * - Causal intervention (do-calculus) results
 * - Counterfactual (What-If) query results
 * - Prescriptive AI recommendations
 * - Examples and cases execution logs
 * - Knowledge base operations
 * 
 * Supports export to JSON, CSV, and permanent file downloads.
 */

import { InferenceResult } from '@/hooks/useEnhancedCVGG';
import { InterventionResult } from '@/utils/causalInterventionEngine';
import { CounterfactualResult } from '@/utils/counterfactualEngine';
import { PrescriptiveOutput, Recommendation } from '@/utils/prescriptiveAI';

// Result type definitions
export type OperationType = 
  | 'cvgg_training'
  | 'cvgg_inference' 
  | 'intervention'
  | 'counterfactual'
  | 'prescriptive'
  | 'example'
  | 'case'
  | 'knowledge_import'
  | 'knowledge_export'
  | 'knowledge_query';

export interface BaseResult {
  id: string;
  type: OperationType;
  timestamp: number;
  sessionId: string;
  metadata: {
    modelMode?: string;
    systemState?: Record<string, number>;
  };
}

export interface CVGGTrainingResult extends BaseResult {
  type: 'cvgg_training';
  data: {
    epochs: number;
    finalLoss: number;
    finalAccuracy: number;
    classificationLoss: number;
    causalLoss: number;
    trainingHistory: Array<{
      epoch: number;
      loss: number;
      accuracy: number;
    }>;
    config: {
      learningRate: number;
      batchSize: number;
      samples: number;
    };
  };
}

export interface CVGGInferenceResult extends BaseResult {
  type: 'cvgg_inference';
  data: InferenceResult;
}

export interface InterventionOperationResult extends BaseResult {
  type: 'intervention';
  data: InterventionResult;
}

export interface CounterfactualOperationResult extends BaseResult {
  type: 'counterfactual';
  data: CounterfactualResult;
}

export interface PrescriptiveOperationResult extends BaseResult {
  type: 'prescriptive';
  data: PrescriptiveOutput;
}

export interface ExampleOperationResult extends BaseResult {
  type: 'example';
  data: {
    exampleType: 'causal_effect' | 'intervention' | 'counterfactual' | 'prescriptive' | 'decision';
    exampleId: string;
    values: Record<string, number>;
    interpretation: string;
  };
}

export interface CaseOperationResult extends BaseResult {
  type: 'case';
  data: {
    caseId: number;
    caseTitle: string;
    pearlLevel: string;
    phasesCompleted: number;
    summary: {
      ateRange: string;
      riskLevel: string;
      decision: string;
    };
  };
}

export interface KnowledgeOperationResult extends BaseResult {
  type: 'knowledge_import' | 'knowledge_export' | 'knowledge_query';
  data: {
    operation: string;
    nodesAffected?: number;
    edgesAffected?: number;
    queryText?: string;
    queryResult?: string;
    exportFormat?: string;
  };
}

export type StoredResult = 
  | CVGGTrainingResult
  | CVGGInferenceResult
  | InterventionOperationResult
  | CounterfactualOperationResult
  | PrescriptiveOperationResult
  | ExampleOperationResult
  | CaseOperationResult
  | KnowledgeOperationResult;

// Result explanation templates
const EXPLANATION_TEMPLATES: Record<OperationType, (result: StoredResult) => string> = {
  cvgg_training: (result) => {
    const r = result as CVGGTrainingResult;
    return `**CVGG Training Completed**\n\n` +
      `Trained for ${r.data.epochs} epochs with ${r.data.config.samples} samples.\n` +
      `Final loss: ${r.data.finalLoss.toFixed(4)} (Classification: ${r.data.classificationLoss.toFixed(4)}, Causal: ${r.data.causalLoss.toFixed(4)})\n` +
      `Final accuracy: ${(r.data.finalAccuracy * 100).toFixed(1)}%\n\n` +
      `**Interpretation:** The model has learned to classify system states while simultaneously learning causal relationships. ` +
      `Lower causal loss indicates better estimation of Average Treatment Effects (ATE) and Conditional ATE (CATE).`;
  },
  cvgg_inference: (result) => {
    const r = result as CVGGInferenceResult;
    const d = r.data;
    return `**CVGG Inference Result**\n\n` +
      `Classification: ${d.classification.className} (${(d.classification.confidence * 100).toFixed(1)}% confidence)\n` +
      `Anomaly Score: ${(d.anomalyScore * 100).toFixed(1)}%\n\n` +
      `**Causal Effects:**\n` +
      `- ATE (Average Treatment Effect): ${d.causalEffects.ATE.toFixed(4)}\n` +
      `- CATE (Conditional ATE): ${d.causalEffects.CATE.toFixed(4)}\n` +
      `- Direct Effect: ${d.causalEffects.directEffect.toFixed(4)}\n` +
      `- Indirect Effect: ${d.causalEffects.indirectEffect.toFixed(4)}\n\n` +
      `**Interpretation:** ATE of ${d.causalEffects.ATE.toFixed(4)} indicates ` +
      `${d.causalEffects.ATE > 0.3 ? 'significant causal impact - intervention may be needed' : 
        d.causalEffects.ATE > 0.1 ? 'moderate causal activity - monitoring recommended' : 
        'normal causal levels - system operating stably'}.`;
  },
  intervention: (result) => {
    const r = result as InterventionOperationResult;
    const d = r.data;
    return `**Causal Intervention (do-calculus)**\n\n` +
      `Intervention: ${d.intervention.name}\n` +
      `do(${d.intervention.variable} = ${d.intervention.targetValue})\n\n` +
      `**Causal Effects:**\n` +
      `- Primary Effect: ${(d.causalEffects.primaryEffect * 100).toFixed(1)}%\n` +
      `- Total Effect: ${(d.causalEffects.totalEffect * 100).toFixed(1)}%\n` +
      `- Secondary Pathways: ${d.causalEffects.secondaryEffects.length}\n\n` +
      `**Risk Assessment:**\n` +
      `- Pre-intervention: ${(d.riskAssessment.preInterventionRisk * 100).toFixed(1)}%\n` +
      `- Post-intervention: ${(d.riskAssessment.postInterventionRisk * 100).toFixed(1)}%\n` +
      `- Change: ${d.riskAssessment.riskDelta > 0 ? '+' : ''}${(d.riskAssessment.riskDelta * 100).toFixed(1)}%\n\n` +
      `**Interpretation:** ${d.explanation}`;
  },
  counterfactual: (result) => {
    const r = result as CounterfactualOperationResult;
    const d = r.data;
    return `**Counterfactual Analysis (What-If)**\n\n` +
      `Query: ${d.query.description}\n\n` +
      `**Results:**\n` +
      `- Baseline Outcome: ${(d.baselineOutcome * 100).toFixed(1)}%\n` +
      `- Counterfactual Outcome: ${(d.counterfactualOutcome * 100).toFixed(1)}%\n` +
      `- Causal Effect: ${(d.causalEffect * 100).toFixed(1)}%\n` +
      `- Risk Change: ${d.riskChange}\n` +
      `- Confidence: ${(d.confidence * 100).toFixed(1)}%\n\n` +
      `**Affected Variables:**\n${d.affectedVariables.slice(0, 3).map(v => 
        `- ${v.variable}: ${v.predictedChange > 0 ? '+' : ''}${(v.predictedChange * 100).toFixed(1)}%`
      ).join('\n')}\n\n` +
      `**Interpretation:** ${d.explanation}`;
  },
  prescriptive: (result) => {
    const r = result as PrescriptiveOperationResult;
    const d = r.data;
    return `**Prescriptive AI Analysis**\n\n` +
      `System Health: ${d.systemHealthScore.toFixed(0)}/100\n` +
      `Risk Level: ${d.riskLevel.toUpperCase()}\n\n` +
      `**Summary:** ${d.summary}\n\n` +
      `**Top Recommendations (${d.recommendations.length} total):**\n` +
      d.recommendations.slice(0, 3).map((rec, i) => 
        `${i + 1}. [${rec.priority.toUpperCase()}] ${rec.title}\n` +
        `   Risk Reduction: ${(rec.estimatedImpact.riskReduction * 100).toFixed(0)}%, ` +
        `Cost Saving: $${rec.estimatedImpact.costSaving.toFixed(0)}`
      ).join('\n\n') +
      `\n\n**Interpretation:** The prescriptive AI has analyzed current system state and causal relationships ` +
      `to generate actionable recommendations prioritized by impact and urgency.`;
  },
  example: (result) => {
    const r = result as ExampleOperationResult;
    return `**Example Execution: ${r.data.exampleType.replace(/_/g, ' ').toUpperCase()}**\n\n` +
      `Example ID: ${r.data.exampleId}\n\n` +
      `**Values:**\n${Object.entries(r.data.values).map(([k, v]) => 
        `- ${k}: ${typeof v === 'number' ? v.toFixed(4) : v}`
      ).join('\n')}\n\n` +
      `**Interpretation:** ${r.data.interpretation}`;
  },
  case: (result) => {
    const r = result as CaseOperationResult;
    return `**Operation Case Study: Case ${r.data.caseId}**\n\n` +
      `Title: ${r.data.caseTitle}\n` +
      `Pearl Level: ${r.data.pearlLevel}\n` +
      `Phases Completed: ${r.data.phasesCompleted}\n\n` +
      `**Summary:**\n` +
      `- ATE Range: ${r.data.summary.ateRange}\n` +
      `- Risk Level: ${r.data.summary.riskLevel}\n` +
      `- Decision: ${r.data.summary.decision}\n\n` +
      `**Interpretation:** This case demonstrates ${r.data.pearlLevel} reasoning ` +
      `through the IMSCHM causal analysis pipeline.`;
  },
  knowledge_import: (result) => {
    const r = result as KnowledgeOperationResult;
    return `**Knowledge Base Import**\n\n` +
      `Operation: ${r.data.operation}\n` +
      `Nodes Affected: ${r.data.nodesAffected || 0}\n` +
      `Edges Affected: ${r.data.edgesAffected || 0}\n\n` +
      `**Interpretation:** Causal relationships have been imported into the Graph RAG knowledge base ` +
      `for use in multi-hop reasoning and causal queries.`;
  },
  knowledge_export: (result) => {
    const r = result as KnowledgeOperationResult;
    return `**Knowledge Base Export**\n\n` +
      `Format: ${r.data.exportFormat || 'JSON'}\n` +
      `Nodes: ${r.data.nodesAffected || 0}\n` +
      `Edges: ${r.data.edgesAffected || 0}\n\n` +
      `**Interpretation:** Causal knowledge graph exported for external integration ` +
      `(Neo4j, GraphML, JSON-LD compatible).`;
  },
  knowledge_query: (result) => {
    const r = result as KnowledgeOperationResult;
    return `**Knowledge Base Query**\n\n` +
      `Query: "${r.data.queryText || 'N/A'}"\n\n` +
      `**Result:**\n${r.data.queryResult || 'No results'}\n\n` +
      `**Interpretation:** Natural language query processed through Graph RAG ` +
      `causal reasoning engine.`;
  },
};

/**
 * Results Storage Manager
 * Singleton class for managing all operation results
 */
export class ResultsStorage {
  private results: StoredResult[] = [];
  private sessionId: string;
  private maxResults: number = 1000;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.loadFromLocalStorage();
  }

  /**
   * Generate unique ID for results
   */
  private generateId(): string {
    return `result-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add a result to storage
   */
  addResult<T extends StoredResult>(
    type: OperationType,
    data: T['data'],
    metadata: BaseResult['metadata'] = {}
  ): string {
    const id = this.generateId();
    const result = {
      id,
      type,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      metadata,
      data,
    } as StoredResult;

    this.results.unshift(result);
    
    // Trim to max results
    if (this.results.length > this.maxResults) {
      this.results = this.results.slice(0, this.maxResults);
    }

    this.saveToLocalStorage();
    this.notifyListeners();
    
    return id;
  }

  /**
   * Get all results
   */
  getResults(): StoredResult[] {
    return [...this.results];
  }

  /**
   * Get results by type
   */
  getResultsByType(type: OperationType): StoredResult[] {
    return this.results.filter(r => r.type === type);
  }

  /**
   * Get results by session
   */
  getResultsBySession(sessionId: string): StoredResult[] {
    return this.results.filter(r => r.sessionId === sessionId);
  }

  /**
   * Get current session results
   */
  getCurrentSessionResults(): StoredResult[] {
    return this.getResultsBySession(this.sessionId);
  }

  /**
   * Get result by ID
   */
  getResult(id: string): StoredResult | undefined {
    return this.results.find(r => r.id === id);
  }

  /**
   * Get explanation for a result
   */
  getExplanation(result: StoredResult): string {
    const template = EXPLANATION_TEMPLATES[result.type];
    if (template) {
      return template(result);
    }
    return 'No explanation available for this result type.';
  }

  /**
   * Clear all results
   */
  clearAll(): void {
    this.results = [];
    this.saveToLocalStorage();
    this.notifyListeners();
  }

  /**
   * Clear results by type
   */
  clearByType(type: OperationType): void {
    this.results = this.results.filter(r => r.type !== type);
    this.saveToLocalStorage();
    this.notifyListeners();
  }

  /**
   * Delete a specific result
   */
  deleteResult(id: string): boolean {
    const initialLength = this.results.length;
    this.results = this.results.filter(r => r.id !== id);
    if (this.results.length !== initialLength) {
      this.saveToLocalStorage();
      this.notifyListeners();
      return true;
    }
    return false;
  }

  /**
   * Export results to JSON
   */
  exportToJSON(filter?: { type?: OperationType; sessionId?: string }): string {
    let data = this.results;
    if (filter?.type) {
      data = data.filter(r => r.type === filter.type);
    }
    if (filter?.sessionId) {
      data = data.filter(r => r.sessionId === filter.sessionId);
    }
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      sessionId: this.sessionId,
      totalResults: data.length,
      results: data,
    }, null, 2);
  }

  /**
   * Export results to CSV
   */
  exportToCSV(filter?: { type?: OperationType }): string {
    let data = this.results;
    if (filter?.type) {
      data = data.filter(r => r.type === filter.type);
    }

    const headers = ['id', 'type', 'timestamp', 'sessionId', 'summary'];
    const rows = data.map(r => [
      r.id,
      r.type,
      new Date(r.timestamp).toISOString(),
      r.sessionId,
      this.getResultSummary(r).replace(/,/g, ';'),
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');
  }

  /**
   * Get a brief summary of a result
   */
  getResultSummary(result: StoredResult): string {
    switch (result.type) {
      case 'cvgg_training':
        return `Training: ${(result as CVGGTrainingResult).data.epochs} epochs, acc=${((result as CVGGTrainingResult).data.finalAccuracy * 100).toFixed(1)}%`;
      case 'cvgg_inference':
        return `Inference: ${(result as CVGGInferenceResult).data.classification.className} (${((result as CVGGInferenceResult).data.classification.confidence * 100).toFixed(0)}%)`;
      case 'intervention':
        return `do(): ${(result as InterventionOperationResult).data.intervention.name}`;
      case 'counterfactual':
        return `What-If: ${(result as CounterfactualOperationResult).data.query.description.substring(0, 50)}...`;
      case 'prescriptive':
        return `AI: ${(result as PrescriptiveOperationResult).data.recommendations.length} recommendations, health=${(result as PrescriptiveOperationResult).data.systemHealthScore.toFixed(0)}`;
      case 'example':
        return `Example: ${(result as ExampleOperationResult).data.exampleType}`;
      case 'case':
        return `Case ${(result as CaseOperationResult).data.caseId}: ${(result as CaseOperationResult).data.caseTitle.substring(0, 30)}...`;
      case 'knowledge_import':
      case 'knowledge_export':
      case 'knowledge_query':
        return `Knowledge: ${(result as KnowledgeOperationResult).data.operation}`;
      default:
        return 'Unknown operation';
    }
  }

  /**
   * Download results as file
   */
  downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Export and download as JSON
   */
  downloadJSON(filter?: { type?: OperationType }): void {
    const json = this.exportToJSON(filter);
    const filename = `imschm-results-${new Date().toISOString().split('T')[0]}.json`;
    this.downloadFile(json, filename, 'application/json');
  }

  /**
   * Export and download as CSV
   */
  downloadCSV(filter?: { type?: OperationType }): void {
    const csv = this.exportToCSV(filter);
    const filename = `imschm-results-${new Date().toISOString().split('T')[0]}.csv`;
    this.downloadFile(csv, filename, 'text/csv');
  }

  /**
   * Get statistics about stored results
   */
  getStatistics(): Record<OperationType, number> {
    const stats: Partial<Record<OperationType, number>> = {};
    for (const result of this.results) {
      stats[result.type] = (stats[result.type] || 0) + 1;
    }
    return stats as Record<OperationType, number>;
  }

  /**
   * Subscribe to changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  /**
   * Save to localStorage
   */
  private saveToLocalStorage(): void {
    try {
      localStorage.setItem('imschm-results', JSON.stringify(this.results.slice(0, 100))); // Store last 100 only
    } catch (e) {
      console.warn('Failed to save results to localStorage:', e);
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem('imschm-results');
      if (stored) {
        this.results = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load results from localStorage:', e);
    }
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }
}

// Singleton instance
let storageInstance: ResultsStorage | null = null;

export function getResultsStorage(): ResultsStorage {
  if (!storageInstance) {
    storageInstance = new ResultsStorage();
  }
  return storageInstance;
}

/**
 * Helper hook-style function to add results from components
 */
export function saveOperationResult(
  type: OperationType,
  data: any,
  metadata?: BaseResult['metadata']
): string {
  return getResultsStorage().addResult(type, data, metadata);
}
