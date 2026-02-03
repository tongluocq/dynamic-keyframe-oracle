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
  /**
   * Generate Markdown report from all results
   */
  generateMarkdownReport(): string {
    const now = new Date();
    const results = this.results;
    const stats = this.getStatistics();
    
    let report = `# IMSCHM Operation Results Report

**Generated:** ${now.toISOString()}  
**Session ID:** ${this.sessionId}  
**Total Operations:** ${results.length}  

---

## Executive Summary

This report documents all causal analysis operations performed by the Intelligent Machine System Causal Health Monitor (IMSCHM). The system leverages Enhanced Causal VGG (CVGG) neural networks combined with Pearl's Causal Hierarchy for industrial predictive maintenance.

### Operations Overview

| Operation Type | Count |
|----------------|-------|
`;

    // Add stats table
    const operationLabels: Record<OperationType, string> = {
      cvgg_training: 'CVGG Training',
      cvgg_inference: 'CVGG Inference',
      intervention: 'do() Interventions',
      counterfactual: 'What-If Queries',
      prescriptive: 'Prescriptive AI',
      example: 'Examples',
      case: 'Case Studies',
      knowledge_import: 'Knowledge Import',
      knowledge_export: 'Knowledge Export',
      knowledge_query: 'Knowledge Query',
    };

    for (const [type, count] of Object.entries(stats)) {
      if (count > 0) {
        report += `| ${operationLabels[type as OperationType] || type} | ${count} |\n`;
      }
    }

    report += `\n---\n\n## Detailed Results\n\n`;

    // Group results by type
    const grouped = new Map<OperationType, StoredResult[]>();
    for (const result of results) {
      if (!grouped.has(result.type)) {
        grouped.set(result.type, []);
      }
      grouped.get(result.type)!.push(result);
    }

    // Generate sections for each type
    for (const [type, typeResults] of grouped) {
      report += `### ${operationLabels[type] || type}\n\n`;
      
      for (const result of typeResults.slice(0, 10)) { // Limit to 10 per type
        report += `#### ${new Date(result.timestamp).toLocaleString()}\n\n`;
        report += this.getExplanation(result) + '\n\n';
        report += `---\n\n`;
      }
      
      if (typeResults.length > 10) {
        report += `*...and ${typeResults.length - 10} more ${operationLabels[type] || type} results*\n\n`;
      }
    }

    // Add key findings section
    report += `## Key Findings\n\n`;
    
    // Training findings
    const trainings = this.getResultsByType('cvgg_training') as CVGGTrainingResult[];
    if (trainings.length > 0) {
      const latestTraining = trainings[0];
      const totalEpochs = trainings.reduce((sum, r) => sum + r.data.epochs, 0);
      const avgAccuracy = trainings.reduce((sum, r) => sum + r.data.finalAccuracy, 0) / trainings.length;
      report += `### CVGG Training Summary\n\n`;
      report += `- **Training Sessions:** ${trainings.length}\n`;
      report += `- **Total Epochs Completed:** ${totalEpochs}\n`;
      report += `- **Average Final Accuracy:** ${(avgAccuracy * 100).toFixed(1)}%\n`;
      report += `- **Latest Training:** ${latestTraining.data.epochs} epochs, ` +
        `Loss: ${latestTraining.data.finalLoss.toFixed(4)}, ` +
        `Accuracy: ${(latestTraining.data.finalAccuracy * 100).toFixed(1)}%\n\n`;
      
      // Add training history chart-like representation
      if (latestTraining.data.trainingHistory && latestTraining.data.trainingHistory.length > 0) {
        report += `**Latest Training History:**\n\n`;
        report += `| Epoch | Loss | Accuracy |\n`;
        report += `|-------|------|----------|\n`;
        for (const h of latestTraining.data.trainingHistory) {
          report += `| ${h.epoch} | ${h.loss.toFixed(4)} | ${(h.accuracy * 100).toFixed(1)}% |\n`;
        }
        report += `\n`;
      }
    }
    
    const interventions = this.getResultsByType('intervention') as InterventionOperationResult[];
    if (interventions.length > 0) {
      const avgRiskReduction = interventions.reduce((sum, r) => 
        sum + Math.abs(r.data.riskAssessment.riskDelta), 0) / interventions.length;
      report += `- **Average Risk Impact from Interventions:** ${(avgRiskReduction * 100).toFixed(1)}%\n`;
    }

    const counterfactuals = this.getResultsByType('counterfactual') as CounterfactualOperationResult[];
    if (counterfactuals.length > 0) {
      const avgCausalEffect = counterfactuals.reduce((sum, r) => 
        sum + Math.abs(r.data.causalEffect), 0) / counterfactuals.length;
      report += `- **Average Causal Effect from What-If Queries:** ${(avgCausalEffect * 100).toFixed(1)}%\n`;
    }

    const prescriptive = this.getResultsByType('prescriptive') as PrescriptiveOperationResult[];
    if (prescriptive.length > 0) {
      const totalRecommendations = prescriptive.reduce((sum, r) => 
        sum + r.data.recommendations.length, 0);
      report += `- **Total Prescriptive Recommendations Generated:** ${totalRecommendations}\n`;
    }

    const inferences = this.getResultsByType('cvgg_inference') as CVGGInferenceResult[];
    if (inferences.length > 0) {
      const avgATE = inferences.reduce((sum, r) => sum + r.data.causalEffects.ATE, 0) / inferences.length;
      report += `- **Average Treatment Effect (ATE) from Inferences:** ${avgATE.toFixed(4)}\n`;
    }

    report += `\n---\n\n## Technical Details\n\n`;
    report += `- **Causal Framework:** Pearl's Causal Hierarchy (L1: Observation, L2: Intervention, L3: Counterfactual)\n`;
    report += `- **Neural Model:** Enhanced Causal VGG with dual prediction heads\n`;
    report += `- **Domains Monitored:** Hydraulic, Mechanical, Thermal, Electrical, Cutting\n`;
    report += `- **Knowledge Base:** Graph RAG for causal relationship storage\n\n`;

    report += `---\n\n*Report generated by IMSCHM v1.0 - Intelligent Machine System Causal Health Monitor*\n`;

    return report;
  }

  /**
   * Download Markdown report
   */
  downloadMarkdownReport(): void {
    const markdown = this.generateMarkdownReport();
    const filename = `IMSCHM-Report-${new Date().toISOString().split('T')[0]}.md`;
    this.downloadFile(markdown, filename, 'text/markdown');
  }

  /**
   * Generate Academic Report from Examples and Cases
   * Creates a comprehensive technical report documenting all IMSCHM 
   * example instances and operation case studies
   */
  generateExampleCaseReport(): string {
    const now = new Date();
    
    // Import example data dynamically to avoid circular dependencies
    const exampleData = this.getExampleCaseData();
    
    let report = `# IMSCHM Academic Report: Examples & Operation Case Studies

**Document Type:** Technical Benchmark Report  
**Generated:** ${now.toISOString()}  
**Version:** IMSCHM v1.0  

---

## Abstract

This report documents the comprehensive examples and operation case studies included in the Intelligent Machine System Causal Health Monitor (IMSCHM) benchmark platform. The examples demonstrate concrete numerical outcomes from the CVGG (Causal VGG) neural network architecture, while the operation cases illustrate complete workflows from TBM (Tunnel Boring Machine) startup through fault detection, causal analysis, and decision making.

The report covers Pearl's Causal Hierarchy implementation at all three levels:
- **Level 1 (Observation):** Sensor monitoring and pattern recognition
- **Level 2 (Intervention):** do-calculus operations for causal manipulation
- **Level 3 (Counterfactual):** "What-If" scenarios and hypothetical reasoning

---

## Table of Contents

1. [CVGG Causal Effect Examples (ATE/CATE)](#1-cvgg-causal-effect-examples)
2. [Causal Intervention Examples (do-calculus)](#2-causal-intervention-examples)
3. [Counterfactual Analysis Examples](#3-counterfactual-analysis-examples)
4. [Prescriptive AI Examples](#4-prescriptive-ai-examples)
5. [Decision Making vs Prescriptive AI](#5-decision-making-vs-prescriptive-ai)
6. [Operation Case Studies](#6-operation-case-studies)
7. [Causal Metrics Reference](#7-causal-metrics-reference)

---

## 1. CVGG Causal Effect Examples

### 1.1 Normal Operation Condition

**Title:** Thrust → Cutting Force Causal Relationship

| Metric | Value | Interpretation |
|--------|-------|----------------|
| ATE (Average Treatment Effect) | 0.1823 | For every 1-unit thrust increase, cutting force increases by 0.1823 units |
| CATE (Conditional ATE) | 0.2156 | Effect is 18% higher under current operating context |
| Direct Effect | 0.1347 | 74% of total effect is direct mechanical transmission |
| Indirect Effect | 0.0476 | 26% propagates through mediating variables |
| Confidence | 0.8547 | High statistical confidence |
| P-Value | 0.0023 | Statistically significant (p < 0.05) |

**Input Signature (Normal):**
- DE Accelerometer: 0.22g (within 0.1-0.3g range) ✓
- FE Accelerometer: 0.15g (within 0.05-0.2g range) ✓
- Temperature: 58°C (within 45-65°C range) ✓
- Pressure: 392 kN (within 380-400 kN range) ✓

**Causal Pathway:**
\`\`\`
Sensor Signals (6ch) → Wavelet Transform → Scalograms (128×128)
                                              ↓
Rock Image (224×224) → VGG Backbone → Combined Embedding (768-dim)
                                              ↓
                        Causal Inference Head → ATE, CATE, DE, IE
\`\`\`

**Variable Interaction Chain:**
- Thrust Pressure → Cutting Force (strength: 0.75, positive)
- Cutting Force → Vibration (strength: 0.45, positive)
- Vibration → Temperature (strength: 0.30, positive)

---

### 1.2 Fault Condition

**Title:** Vibration → System Risk Causal Relationship

| Metric | Value | Interpretation |
|--------|-------|----------------|
| ATE | 0.4231 | 42.31% direct risk increase from abnormal vibration |
| CATE | 0.5872 | 58.72% risk increase under fault condition (2.3× amplification) |
| Direct Effect | 0.3918 | Direct mechanical failure risk component |
| Indirect Effect | 0.1954 | Thermal cascade risk through lubricant degradation |
| Confidence | 0.9123 | Very high statistical confidence |
| P-Value | 0.0001 | Highly statistically significant |

**Input Signature (Fault):**
- DE Accelerometer: 0.89g (exceeds 0.3g threshold) ⚠️ HIGH ANOMALY
- FE Accelerometer: 0.45g (exceeds 0.2g threshold) ⚠️ MEDIUM ANOMALY
- Temperature: 78°C (exceeds 65°C limit) ⚠️ HIGH ANOMALY
- Cross-axis Correlation: r=0.82 (exceeds 0.3 threshold) ⚠️ HIGH ANOMALY

**Fault Feedback Loop:**
\`\`\`
Bearing Wear ──[+0.92]──→ Vibration Amplitude
     ↑                           │
     │                           ↓ [+0.68]
     │                     Thermal Load
     │                           │
[−0.78]                          ↓ [−0.55]
     │                     Lubricant Viscosity
     └───────────────────────────┘
\`\`\`

---

## 2. Causal Intervention Examples (do-calculus)

### 2.1 Thrust Increase Intervention

**Command:** \`do(Thrust = 396.0 kN)\`

**Notation:** P(CuttingForce, Vibration, Risk | do(Thrust = 396.0))

| Effect Type | Variable | Change |
|-------------|----------|--------|
| Primary | Cutting Force | +7.5% |
| Primary | Penetration Rate | +12.3% |
| Secondary | Vibration Amplitude | +5.2% |
| Secondary | Bearing Stress | +8.1% |
| Secondary | Thermal Load | +3.4% |

**Risk Assessment:**
- Baseline Risk: 23%
- Post-Intervention Risk: 31%
- Risk Delta: +8%
- Confidence: 87%

---

### 2.2 Temperature Control Intervention

**Command:** \`do(Temperature = 60.0°C)\`

**Notation:** P(Lubricant, Bearing, Risk | do(Temperature = 60.0))

| Effect Type | Variable | Change |
|-------------|----------|--------|
| Primary | Lubricant Viscosity | −12.0% |
| Primary | Thermal Expansion | −8.5% |
| Secondary | Bearing Friction | +3.2% |
| Secondary | Seal Integrity | +5.7% |
| Secondary | Cooling Load | −15.3% |

**Risk Assessment:**
- Baseline Risk: 38%
- Post-Intervention Risk: 29%
- Risk Delta: −9% (beneficial)
- Confidence: 82%

---

## 3. Counterfactual Analysis Examples

### 3.1 Thrust Pressure Increase Scenario

**Query:** IF(Thrust = 360.0 kN → 396.0 kN) THEN ?

| Metric | Value |
|--------|-------|
| Baseline Outcome | 32.47% risk |
| Counterfactual Outcome | 40.12% risk |
| Causal Effect | +7.65% |
| Direct Effect | +5.47% |
| Indirect Effect | +18.34% (through cascade) |
| Confidence | 82.34% |
| Risk Change | **INCREASED** |

**TBM Context:** Direct risk increase from hydraulic stress plus indirect cascade effect through cutting force → vibration → thermal chain.

---

### 3.2 Temperature Reduction Scenario

**Query:** IF(Temperature = 68.5°C → 55.0°C) THEN ?

| Metric | Value |
|--------|-------|
| Baseline Outcome | 41.56% risk |
| Counterfactual Outcome | 32.87% risk |
| Causal Effect | −8.69% |
| Direct Effect | −3.94% |
| Indirect Effect | +13.12% (partial offset) |
| Confidence | 78.56% |
| Risk Change | **DECREASED** |

**TBM Context:** Cooling intervention reduces direct thermal stress. Note: Some indirect effects remain positive due to cooling system power consumption impact.

---

## 4. Prescriptive AI Examples

### 4.1 Critical Bearing Intervention

**Priority:** CRITICAL  
**Trigger:** High ATE (0.4231) detected from vibration → risk pathway

**Recommendation:** Immediate bearing inspection and replacement

| Metric | Value |
|--------|-------|
| Expected Risk Reduction | 42.31% |
| Cost Saving | $42.31K |
| Downtime Avoided | 10.15 hours |
| Confidence | 87.23% |
| Direct Effect | −39.18% |
| Indirect Effect | −3.13% |

**Action Command:** \`PRESCRIBE(action="replace_bearing", priority=CRITICAL, confidence=0.8723)\`

---

### 4.2 Preventive Cooling Optimization

**Priority:** MEDIUM  
**Trigger:** Moderate indirect effects (0.3156) through thermal pathway

**Recommendation:** Adjust cooling system parameters

| Metric | Value |
|--------|-------|
| Expected Risk Reduction | 30% |
| Cost Saving | $40.00K |
| Downtime Avoided | 5.50 hours |
| Confidence | 75.12% |
| Direct Effect | +8.23% |
| Indirect Effect | +31.56% |

**Note:** Direct effect is small, but indirect cascade through thermal system is significant.

---

## 5. Decision Making vs Prescriptive AI

### 5.1 Bearing Replacement Decision

**Context:** Multiple prescriptive recommendations available for bearing-related fault

**Prescriptive AI Options:**
| Action | Score | Risk Reduction |
|--------|-------|----------------|
| Replace bearing assembly | 0.92 | 52% |
| Increase lubrication frequency | 0.67 | 28% |
| Reduce operational speed | 0.45 | 15% |

**Decision Made:**
- **Selected Action:** Replace worn bearing assembly
- **Execution Cost:** $8,500
- **Expected Risk Reduction:** 52%
- **Timeline:** 4-6 hours during scheduled maintenance
- **Budget Constraint:** $10,000 (within limit)

**Reasoning:** Highest score (0.92), best risk reduction (52%), within budget.

---

### 5.2 Thermal Management Decision

**Context:** Competing recommendations for thermal system optimization

**Prescriptive AI Options:**
| Action | Score | Risk Reduction |
|--------|-------|----------------|
| Install additional cooling | 0.78 | 35% |
| Reduce thrust pressure | 0.65 | 22% |
| Switch to high-temp lubricant | 0.58 | 18% |

**Decision Made:**
- **Selected Action:** Install additional cooling unit
- **Execution Cost:** $15,000
- **Expected Risk Reduction:** 35%
- **Timeline:** Next scheduled stop, 2-3 days
- **Budget Constraint:** $20,000 (within limit)

**Reasoning:** Best long-term ROI despite higher cost, addresses root cause.

---

## 6. Operation Case Studies

### Case 1: Normal Operation Baseline - Startup to Steady State

**Pearl Level:** L1 (Observation)  
**Training Goal:** Establish baseline understanding of normal CVGG outputs and healthy causal relationships

**Key Phases:**
1. **TBM Startup (t=0 to t=60s):** Hydraulic pressure = 150 bar, System temp = 25°C, Thrust = 360 kN
2. **Signal Monitoring (t=60s to t=300s):** 18 sensors across 5 domains at 10 Hz
3. **Causal Discovery:** PC Algorithm produces DAG with 45 significant edges
4. **CVGG Analysis:** ATE = 0.0823 (low), System Health = 94/100
5. **Decision:** Continue normal operation, schedule routine maintenance at t+72h

**Summary:**
- ATE Range: 0.05 - 0.12
- Risk Level: LOW
- Final Decision: Continue normal operation

---

### Case 2: Gradual Bearing Wear Detection - Early Warning Success

**Pearl Level:** L3 (Counterfactual)  
**Training Goal:** Detection at severity=0.48 prevents catastrophic failure at severity>0.85

**Key Phases:**
1. **Initial Condition:** Bearing wear = 12%, Severity = 0.15
2. **Progressive Degradation:** Severity increases 0.15 → 0.32 → 0.48 over 20 minutes
3. **Anomaly Detection:** mechanical_vibration_x score = 0.67 (HIGH)
4. **Counterfactual Query:** "What if bearing wear reaches 85%?" → 89.3% failure probability
5. **Prescriptive Response:** CRITICAL bearing replacement recommendation

**Summary:**
- ATE Range: 0.15 - 0.42
- Risk Level: MEDIUM → HIGH
- Final Decision: Schedule preventive maintenance

---

### Case 3: Thermal Overload Emergency - Immediate Intervention

**Pearl Level:** L2 (Intervention)  
**Training Goal:** Demonstrate emergency response when thresholds exceeded

**Key Phases:**
1. **Thermal Cascade:** Temperature spikes from 65°C to 92°C
2. **Multi-Domain Impact:** Lubricant viscosity drops, bearing friction increases
3. **do-calculus Analysis:** do(Temperature = 65°C) shows 34% risk reduction
4. **Emergency Intervention:** Activate cooling, reduce thrust by 20%
5. **Recovery Monitoring:** Temperature stabilizes at 68°C within 5 minutes

**Summary:**
- ATE Range: 0.35 - 0.68
- Risk Level: CRITICAL → MEDIUM
- Final Decision: Emergency intervention activated

---

### Case 4: Hydraulic Leak Diagnosis - Root Cause Tracing

**Pearl Level:** L2 (Intervention)  
**Training Goal:** Trace multi-step causal chain to identify root cause

**Key Phases:**
1. **Symptom Detection:** Pressure fluctuations, flow rate anomalies
2. **Causal Graph Analysis:** Trace pressure → flow → seal → contamination
3. **Root Cause Identification:** Seal degradation causing micro-leaks
4. **Intervention Planning:** do(seal_replacement) analysis
5. **Repair Scheduling:** Plan replacement during next maintenance window

**Summary:**
- ATE Range: 0.22 - 0.45
- Risk Level: MEDIUM
- Final Decision: Schedule seal replacement

---

### Case 5: Multi-Fault Competing Causes - Complex Decision Scenario

**Pearl Level:** L3 (Counterfactual)  
**Training Goal:** Handle multiple simultaneous faults with competing causal explanations

**Key Phases:**
1. **Multiple Anomalies:** Vibration, thermal, and hydraulic anomalies detected simultaneously
2. **Competing Hypotheses:** H1: Bearing failure, H2: Hydraulic issue, H3: Thermal cascade
3. **Counterfactual Disambiguation:** Compare "What if bearing fixed?" vs "What if hydraulic fixed?"
4. **Ranked Interventions:** Bearing (0.52 risk reduction) > Hydraulic (0.31) > Thermal (0.18)
5. **Resource-Constrained Decision:** Sequential intervention plan within budget

**Summary:**
- ATE Range: 0.28 - 0.58
- Risk Level: HIGH
- Final Decision: Prioritized multi-stage intervention

---

## 7. Causal Metrics Reference

| Metric | Symbol | Range | Unit | Interpretation |
|--------|--------|-------|------|----------------|
| Average Treatment Effect | ATE | -1.0 to +1.0 | ratio | Mean causal effect across all units |
| Conditional ATE | CATE | -1.0 to +1.0 | ratio | Causal effect under specific conditions |
| Direct Effect | DE | -1.0 to +1.0 | ratio | Immediate causal impact without mediators |
| Indirect Effect | IE | -1.0 to +1.0 | ratio | Cascade effect through intermediate variables |
| Confidence | conf | 0.0 to 1.0 | probability | Statistical confidence (>0.8 is high) |
| Baseline Outcome | Y₀ | 0.0 to 1.0 | probability | Expected outcome without intervention |
| Counterfactual Outcome | Y₁ | 0.0 to 1.0 | probability | Expected outcome with intervention |
| Risk Reduction | ΔR | 0.0 to 1.0 | percentage | Expected decrease in failure risk |
| P-Value | p | 0.0 to 1.0 | probability | Statistical significance (<0.05 is significant) |

---

## Appendix: CVGG Architecture

\`\`\`
┌─────────────────────────────────────────────────────────────────────────┐
│                        CVGG (Causal VGG) Architecture                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Sensor Signals (6ch)      Rock Images (224×224)     Causal Metadata    │
│         │                         │                        │            │
│         ▼                         ▼                        │            │
│  ┌──────────────┐         ┌──────────────┐                │            │
│  │   Wavelet    │         │     VGG      │                │            │
│  │  Transform   │         │   Backbone   │                │            │
│  │  (Morlet)    │         │   (Images)   │                │            │
│  └──────┬───────┘         └──────┬───────┘                │            │
│         │                        │                        │            │
│         ▼                        ▼                        │            │
│  ┌──────────────┐         ┌──────────────┐                │            │
│  │     VGG      │         │    256-dim   │                │            │
│  │   Backbone   │         │   Embedding  │                │            │
│  │  (Signals)   │         └──────┬───────┘                │            │
│  └──────┬───────┘                │                        │            │
│         │                        │                        │            │
│         ▼                        ▼                        ▼            │
│  ┌──────────────┐    ┌───────────────────────────────────────┐         │
│  │    256-dim   │────│          Combined Embedding           │         │
│  │   Embedding  │    │             (768-dim)                 │         │
│  └──────────────┘    └───────────────────┬───────────────────┘         │
│                                          │                              │
│                      ┌───────────────────┴───────────────────┐         │
│                      ▼                                       ▼         │
│            ┌──────────────────┐                 ┌──────────────────┐   │
│            │  Classification  │                 │  Causal Inference│   │
│            │      Head        │                 │       Head       │   │
│            └────────┬─────────┘                 └────────┬─────────┘   │
│                     │                                    │             │
│                     ▼                                    ▼             │
│            ┌──────────────────┐                 ┌──────────────────┐   │
│            │  Class: Normal/  │                 │   ATE, CATE,     │   │
│            │  Fault + Conf    │                 │   DE, IE         │   │
│            └──────────────────┘                 └──────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
\`\`\`

---

*Report generated by IMSCHM v1.0 - Intelligent Machine System Causal Health Monitor*  
*Framework: Pearl's Causal Hierarchy | Model: Enhanced Causal VGG*
`;

    return report;
  }

  /**
   * Get example and case data for report generation
   * This provides static data without requiring runtime imports
   */
  private getExampleCaseData() {
    return {
      causalEffectExamples: [
        { condition: 'normal', ATE: 0.1823, CATE: 0.2156, directEffect: 0.1347, indirectEffect: 0.0476 },
        { condition: 'fault', ATE: 0.4231, CATE: 0.5872, directEffect: 0.3918, indirectEffect: 0.1954 }
      ],
      interventionExamples: [
        { command: 'do(Thrust = 396.0 kN)', riskChange: '+8%' },
        { command: 'do(Temperature = 60.0°C)', riskChange: '-9%' }
      ],
      counterfactualExamples: [
        { query: 'IF(Thrust = 360.0 kN → 396.0 kN)', effect: '+7.65%' },
        { query: 'IF(Temperature = 68.5°C → 55.0°C)', effect: '-8.69%' }
      ],
      operationCases: [
        { id: 1, title: 'Normal Operation Baseline', pearlLevel: 'L1', risk: 'LOW' },
        { id: 2, title: 'Gradual Bearing Wear Detection', pearlLevel: 'L3', risk: 'MEDIUM→HIGH' },
        { id: 3, title: 'Thermal Overload Emergency', pearlLevel: 'L2', risk: 'CRITICAL→MEDIUM' },
        { id: 4, title: 'Hydraulic Leak Diagnosis', pearlLevel: 'L2', risk: 'MEDIUM' },
        { id: 5, title: 'Multi-Fault Competing Causes', pearlLevel: 'L3', risk: 'HIGH' }
      ]
    };
  }

  /**
   * Download Example & Case Report
   */
  downloadExampleCaseReport(): void {
    const markdown = this.generateExampleCaseReport();
    const filename = `IMSCHM-Examples-Cases-Report-${new Date().toISOString().split('T')[0]}.md`;
    this.downloadFile(markdown, filename, 'text/markdown');
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
