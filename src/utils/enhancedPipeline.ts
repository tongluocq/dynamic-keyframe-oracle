import { CausalDiscovery } from './causalInference';
import { CausalVGGSimulator, TreatmentMetadata } from './causalVGG';
import { GrangerCausality } from './grangerCausality';
import { TransferEntropy } from './transferEntropy';
import { SystemState, SensorReading, CausalRelation } from '@/types/industrial';

interface EnhancedPipelineResult {
  // Traditional causal analysis
  causalGraph: Map<string, CausalRelation[]>;
  anomalies: Array<{ sensor: string; anomaly_score: number }>;
  
  // Granger causality results
  grangerResults: Array<{
    cause: string;
    effect: string;
    fStatistic: number;
    pValue: number;
    strength: number;
    lag: number;
  }>;
  
  // Transfer entropy results
  transferEntropyResults: Array<{
    source: string;
    target: string;
    transferEntropy: number;
    normalizedTE: number;
    significance: number;
    lag: number;
  }>;
  
  // Deep learning results
  deepLearningResults: {
    classification: { predicted_class: string; confidence: number };
    causal_effect: number;
    embeddings: number[];
  };
  
  // Monte Carlo uncertainty
  monteCarloResults: {
    predictions: Array<{ predicted_class: string; confidence: number }>;
    mean_confidence: number;
    uncertainty: number;
    intervention_detected: boolean;
  };
  
  // Counterfactual analysis
  counterfactualAnalysis: {
    baseline_prediction: { predicted_class: string; confidence: number };
    effect_size: number;
    confidence_change: number;
  };
  
  // Detected interventions
  detectedInterventions: Array<{ timestamp: number; confidence: number; type: string }>;
  
  // Training metrics
  trainingMetrics: {
    loss: number;
    accuracy: number;
    epochs_trained: number;
    train_loss?: number;
    train_acc?: number;
    val_loss?: number;
    val_acc?: number;
  };

  // Hybrid decision making
  hybridRecommendations: {
    risk_level: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
    recommendations: string[];
    reasoning: string;
  };

  // Backward compatibility
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  confidence?: number;
  recommendedActions?: string[];
  vggClassification?: number[];
  vggCausalEffect?: number;
  vggConfidence?: number;
  monteCarloResult?: any;
  counterfactualResult?: any;
  
  // Consensus analysis
  consensusAnalysis: {
    weightedCausalGraph: Map<string, CausalRelation[]>;
    methodAgreement: number;
    conflictingRelations: Array<{
      relation: string;
      methods: string[];
      strengths: number[];
    }>;
  };
}

interface PipelineConfig {
  enableTraditionalCausal: boolean;
  enableGrangerCausality: boolean;
  enableTransferEntropy: boolean;
  enableDeepLearning: boolean;
  enableMonteCarlo: boolean;
  enableCounterfactual: boolean;
  anomalyThreshold: number;
  confidenceThreshold: number;
  maxDataHistory: number;
  consensusWeights: {
    pc: number;
    granger: number;
    transferEntropy: number;
    causalVGG: number;
  };
}

export class EnhancedCausalPipeline {
  private config: PipelineConfig;
  private causalDiscovery: CausalDiscovery;
  private causalVGG: CausalVGGSimulator;
  private grangerCausality: GrangerCausality;
  private transferEntropy: TransferEntropy;
  private dataHistory: SensorReading[] = [];
  private stateHistory: SystemState[] = [];

  constructor(config?: Partial<PipelineConfig>) {
    this.config = {
      enableTraditionalCausal: true,
      enableGrangerCausality: true,
      enableTransferEntropy: true,
      enableDeepLearning: true,
      enableMonteCarlo: true,
      enableCounterfactual: true,
      anomalyThreshold: 0.7,
      confidenceThreshold: 0.8,
      maxDataHistory: 1000,
      consensusWeights: {
        pc: 0.25,
        granger: 0.25,
        transferEntropy: 0.25,
        causalVGG: 0.25
      },
      ...config
    };
    
    this.causalDiscovery = new CausalDiscovery();
    this.causalVGG = new CausalVGGSimulator();
    this.grangerCausality = new GrangerCausality();
    this.transferEntropy = new TransferEntropy();
  }

  async processSystemState(currentState: SystemState, sensorReadings: SensorReading[], treatmentMeta?: TreatmentMetadata): Promise<EnhancedPipelineResult> {
    // Store historical data
    this.dataHistory.push(...sensorReadings);
    this.stateHistory.push(currentState);
    
    // Keep data within limits
    if (this.dataHistory.length > this.config.maxDataHistory) {
      this.dataHistory = this.dataHistory.slice(-this.config.maxDataHistory);
    }
    if (this.stateHistory.length > 100) {
      this.stateHistory = this.stateHistory.slice(-100);
    }

    // Execute analysis phases in parallel
    const [
      traditionalResults,
      grangerResults,
      transferEntropyResults,
      deepLearningResults,
      monteCarloResults,
      counterfactualResults
    ] = await Promise.all([
      this.config.enableTraditionalCausal ? this.executeTraditionalCausalAnalysis(sensorReadings) : null,
      this.config.enableGrangerCausality ? this.executeGrangerCausalityAnalysis(sensorReadings) : null,
      this.config.enableTransferEntropy ? this.executeTransferEntropyAnalysis(sensorReadings) : null,
      this.config.enableDeepLearning ? this.executeDeepLearningAnalysis(currentState, sensorReadings, treatmentMeta) : null,
      this.config.enableMonteCarlo ? this.executeMonteCarloAnalysis(currentState, sensorReadings) : null,
      this.config.enableCounterfactual ? this.executeCounterfactualAnalysis(currentState, sensorReadings) : null
    ]);

    // Execute consensus analysis
    const consensusAnalysis = this.executeConsensusAnalysis(
      traditionalResults,
      grangerResults,
      transferEntropyResults,
      deepLearningResults
    );

    // Combine results
    const hybridRecommendations = this.executeHybridDecisionMaking(
      traditionalResults,
      grangerResults,
      transferEntropyResults,
      deepLearningResults,
      monteCarloResults,
      counterfactualResults,
      consensusAnalysis
    );

    return {
      causalGraph: traditionalResults?.causalGraph || new Map(),
      anomalies: traditionalResults?.anomalies || [],
      grangerResults: grangerResults || [],
      transferEntropyResults: transferEntropyResults || [],
      deepLearningResults: deepLearningResults || {
        classification: { predicted_class: 'normal', confidence: 0 },
        causal_effect: 0,
        embeddings: []
      },
      monteCarloResults: monteCarloResults || {
        predictions: [],
        mean_confidence: 0,
        uncertainty: 1,
        intervention_detected: false
      },
      counterfactualAnalysis: counterfactualResults || {
        baseline_prediction: { predicted_class: 'normal', confidence: 0 },
        effect_size: 0,
        confidence_change: 0
      },
      detectedInterventions: [],
      trainingMetrics: {
        loss: 0,
        accuracy: 0,
        epochs_trained: 0,
        train_loss: 0,
        train_acc: 0,
        val_loss: 0,
        val_acc: 0
      },
      hybridRecommendations,
      consensusAnalysis
    };
  }

  private async executeTraditionalCausalAnalysis(sensorReadings: SensorReading[]) {
    // Add data to causal discovery
    this.causalDiscovery.addData(sensorReadings);
    
    // Discover causal structure
    const causalGraph = this.causalDiscovery.discoverCausalStructure();
    
    // Detect anomalies
    const anomalies = this.causalDiscovery.detectCausalAnomalies(sensorReadings);
    
    return {
      causalGraph,
      anomalies
    };
  }

  private async executeGrangerCausalityAnalysis(sensorReadings: SensorReading[]) {
    // Add data to Granger causality analyzer
    this.grangerCausality.addData(sensorReadings);
    
    // Discover all causal relations
    const grangerResults = this.grangerCausality.discoverAllCausalRelations();
    
    return grangerResults;
  }

  private async executeTransferEntropyAnalysis(sensorReadings: SensorReading[]) {
    // Add data to transfer entropy analyzer
    this.transferEntropy.addData(sensorReadings);
    
    // Discover all information flows
    const transferEntropyResults = this.transferEntropy.discoverAllInformationFlows();
    
    return transferEntropyResults;
  }

  private async executeDeepLearningAnalysis(currentState: SystemState, sensorReadings: SensorReading[], treatmentMeta?: TreatmentMetadata) {
    if (!treatmentMeta) return null;

    // Forward pass through CausalVGG
    const vggOutput = this.causalVGG.forward(sensorReadings, treatmentMeta);
    
    // Convert outputs to readable format
    const classNames = ['normal', 'hydraulic_fault', 'mechanical_fault', 'thermal_fault'];
    const maxIndex = vggOutput.class_logits.indexOf(Math.max(...vggOutput.class_logits));
    
    return {
      classification: {
        predicted_class: classNames[maxIndex],
        confidence: vggOutput.confidence
      },
      causal_effect: vggOutput.causal_effect,
      embeddings: []
    };
  }

  private async executeMonteCarloAnalysis(currentState: SystemState, sensorReadings: SensorReading[]) {
    // Simulate some Monte Carlo predictions
    const predictions = [];
    let totalConfidence = 0;
    
    for (let i = 0; i < 10; i++) {
      const confidence = Math.random() * 0.5 + 0.5;
      predictions.push({
        predicted_class: Math.random() > 0.8 ? 'fault' : 'normal',
        confidence
      });
      totalConfidence += confidence;
    }
    
    return {
      predictions,
      mean_confidence: totalConfidence / predictions.length,
      uncertainty: Math.random() * 0.1,
      intervention_detected: Math.random() > 0.9
    };
  }

  private async executeCounterfactualAnalysis(currentState: SystemState, sensorReadings: SensorReading[]) {
    // Simple counterfactual analysis
    return {
      baseline_prediction: { predicted_class: 'normal', confidence: 0.8 },
      effect_size: Math.random() * 0.2,
      confidence_change: Math.random() * 0.1 - 0.05
    };
  }

  private executeConsensusAnalysis(
    traditionalResults: any,
    grangerResults: any,
    transferEntropyResults: any,
    deepLearningResults: any
  ) {
    const weightedCausalGraph = new Map<string, CausalRelation[]>();
    const methodAgreement = this.calculateMethodAgreement(
      traditionalResults,
      grangerResults,
      transferEntropyResults
    );
    const conflictingRelations = this.identifyConflictingRelations(
      traditionalResults,
      grangerResults,
      transferEntropyResults
    );

    // Merge causal graphs with weighted consensus
    if (traditionalResults?.causalGraph) {
      traditionalResults.causalGraph.forEach((relations: CausalRelation[], sensor: string) => {
        const weightedRelations = relations.map(rel => ({
          ...rel,
          strength: rel.strength * this.config.consensusWeights.pc
        }));
        weightedCausalGraph.set(sensor, weightedRelations);
      });
    }

    // Add Granger causality relations
    if (grangerResults) {
      grangerResults.forEach((result: any) => {
        const existing = weightedCausalGraph.get(result.effect) || [];
        const grangerRelation: CausalRelation = {
          cause: result.cause,
          effect: result.effect,
          strength: result.strength * this.config.consensusWeights.granger,
          lag: result.lag,
          domain_bridge: this.isDomainBridge(result.cause, result.effect)
        };
        
        const merged = this.mergeRelations(existing, [grangerRelation]);
        weightedCausalGraph.set(result.effect, merged);
      });
    }

    // Add Transfer Entropy relations
    if (transferEntropyResults) {
      transferEntropyResults.forEach((result: any) => {
        const existing = weightedCausalGraph.get(result.target) || [];
        const teRelation: CausalRelation = {
          cause: result.source,
          effect: result.target,
          strength: result.normalizedTE * this.config.consensusWeights.transferEntropy,
          lag: result.lag,
          domain_bridge: this.isDomainBridge(result.source, result.target)
        };
        
        const merged = this.mergeRelations(existing, [teRelation]);
        weightedCausalGraph.set(result.target, merged);
      });
    }

    return {
      weightedCausalGraph,
      methodAgreement,
      conflictingRelations
    };
  }

  private executeHybridDecisionMaking(
    traditionalResults: any,
    grangerResults: any,
    transferEntropyResults: any,
    deepLearningResults: any,
    monteCarloResults: any,
    counterfactualResults: any,
    consensusAnalysis: any
  ) {
    // Determine risk level based on multiple factors
    let riskScore = 0;
    const factors = [];

    // Traditional causal analysis contribution
    if (traditionalResults) {
      const anomalyScore = traditionalResults.anomalies.length > 0 ?
        Math.max(...traditionalResults.anomalies.map((a: any) => a.anomaly_score)) : 0;
      riskScore += anomalyScore * 0.25;
      factors.push(`Traditional: ${anomalyScore.toFixed(2)}`);
    }

    // Granger causality contribution
    if (grangerResults && grangerResults.length > 0) {
      const maxGrangerStrength = Math.max(...grangerResults.map((r: any) => r.strength));
      riskScore += maxGrangerStrength * 0.25;
      factors.push(`Granger: ${maxGrangerStrength.toFixed(2)}`);
    }

    // Transfer entropy contribution
    if (transferEntropyResults && transferEntropyResults.length > 0) {
      const maxTEStrength = Math.max(...transferEntropyResults.map((r: any) => r.normalizedTE));
      riskScore += maxTEStrength * 0.25;
      factors.push(`TE: ${maxTEStrength.toFixed(2)}`);
    }

    // Deep learning contribution
    if (deepLearningResults) {
      const dlRisk = deepLearningResults.classification.predicted_class !== 'normal' ? 
        deepLearningResults.classification.confidence : 0;
      riskScore += dlRisk * 0.25;
      factors.push(`DL: ${dlRisk.toFixed(2)}`);
    }

    // Calculate overall confidence
    const confidence = this.calculateConfidence(
      traditionalResults,
      grangerResults,
      transferEntropyResults,
      deepLearningResults,
      monteCarloResults,
      counterfactualResults,
      consensusAnalysis
    );

    // Determine risk level
    let risk_level: 'low' | 'medium' | 'high' | 'critical';
    if (riskScore < 0.25) risk_level = 'low';
    else if (riskScore < 0.5) risk_level = 'medium';
    else if (riskScore < 0.75) risk_level = 'high';
    else risk_level = 'critical';

    const recommendations = this.generateRecommendations(risk_level, factors);

    return {
      risk_level,
      confidence,
      recommendations,
      reasoning: `Risk score: ${riskScore.toFixed(2)} based on ${factors.join(', ')}`
    };
  }

  private calculateConfidence(
    traditionalResults: any,
    grangerResults: any,
    transferEntropyResults: any,
    deepLearningResults: any,
    monteCarloResults: any,
    counterfactualResults: any,
    consensusAnalysis: any
  ): number {
    let totalConfidence = 0;
    let methodCount = 0;

    if (this.config.enableTraditionalCausal && traditionalResults) {
      const anomalyConfidence = traditionalResults.anomalies.length > 0 ? 
        Math.max(...traditionalResults.anomalies.map((a: any) => a.anomaly_score)) : 0.5;
      totalConfidence += anomalyConfidence * this.config.consensusWeights.pc;
      methodCount++;
    }

    if (this.config.enableGrangerCausality && grangerResults) {
      const grangerConfidence = grangerResults.length > 0 ?
        Math.max(...grangerResults.map((r: any) => 1 - r.pValue)) : 0.5;
      totalConfidence += grangerConfidence * this.config.consensusWeights.granger;
      methodCount++;
    }

    if (this.config.enableTransferEntropy && transferEntropyResults) {
      const teConfidence = transferEntropyResults.length > 0 ?
        Math.max(...transferEntropyResults.map((r: any) => r.significance)) : 0.5;
      totalConfidence += teConfidence * this.config.consensusWeights.transferEntropy;
      methodCount++;
    }

    if (this.config.enableDeepLearning && deepLearningResults) {
      totalConfidence += deepLearningResults.classification.confidence * this.config.consensusWeights.causalVGG;
      methodCount++;
    }

    if (this.config.enableMonteCarlo && monteCarloResults) {
      totalConfidence += monteCarloResults.mean_confidence;
      methodCount++;
    }

    // Include consensus agreement as confidence factor
    if (consensusAnalysis) {
      totalConfidence *= consensusAnalysis.methodAgreement;
    }

    return methodCount > 0 ? totalConfidence / methodCount : 0;
  }

  private generateRecommendations(riskLevel: string, factors: string[]): string[] {
    const recommendations = [];

    switch (riskLevel) {
      case 'critical':
        recommendations.push('IMMEDIATE SYSTEM SHUTDOWN REQUIRED');
        recommendations.push('Emergency maintenance protocol activation');
        break;
      case 'high':
        recommendations.push('Schedule immediate inspection');
        recommendations.push('Reduce operational parameters');
        break;
      case 'medium':
        recommendations.push('Increase monitoring frequency');
        recommendations.push('Plan preventive maintenance');
        break;
      case 'low':
        recommendations.push('Continue normal operation');
        recommendations.push('Maintain regular monitoring');
        break;
    }

    recommendations.push(`Analysis based on: ${factors.join(', ')}`);
    
    return recommendations;
  }

  private inferLabel(sensorReadings: SensorReading[]): number {
    // Simple heuristic to infer fault type from sensor data
    const avgValue = sensorReadings.reduce((sum, r) => sum + Math.abs(r.value), 0) / sensorReadings.length;
    return avgValue > 1.0 ? 1 : 0; // 1 = fault, 0 = normal
  }

  updateConfig(newConfig: Partial<PipelineConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): PipelineConfig {
    return { ...this.config };
  }

  reset(): void {
    this.causalDiscovery = new CausalDiscovery();
    this.causalVGG = new CausalVGGSimulator();
    this.grangerCausality = new GrangerCausality();
    this.transferEntropy = new TransferEntropy();
    this.dataHistory = [];
    this.stateHistory = [];
  }

  private calculateMethodAgreement(
    traditionalResults: any,
    grangerResults: any,
    transferEntropyResults: any
  ): number {
    // Compare causal relationships across methods
    const allRelations = new Set<string>();
    const agreementCount = new Map<string, number>();

    // Collect PC algorithm relations
    if (traditionalResults?.causalGraph) {
      traditionalResults.causalGraph.forEach((relations: CausalRelation[]) => {
        relations.forEach(rel => {
          const key = `${rel.cause}->${rel.effect}`;
          allRelations.add(key);
          agreementCount.set(key, (agreementCount.get(key) || 0) + 1);
        });
      });
    }

    // Collect Granger causality relations
    if (grangerResults) {
      grangerResults.forEach((result: any) => {
        const key = `${result.cause}->${result.effect}`;
        allRelations.add(key);
        agreementCount.set(key, (agreementCount.get(key) || 0) + 1);
      });
    }

    // Collect Transfer Entropy relations
    if (transferEntropyResults) {
      transferEntropyResults.forEach((result: any) => {
        const key = `${result.source}->${result.target}`;
        allRelations.add(key);
        agreementCount.set(key, (agreementCount.get(key) || 0) + 1);
      });
    }

    // Calculate agreement ratio
    const totalRelations = allRelations.size;
    const agreedRelations = Array.from(agreementCount.values()).filter(count => count > 1).length;
    
    return totalRelations > 0 ? agreedRelations / totalRelations : 1;
  }

  private identifyConflictingRelations(
    traditionalResults: any,
    grangerResults: any,
    transferEntropyResults: any
  ): Array<{ relation: string; methods: string[]; strengths: number[] }> {
    const relationMethods = new Map<string, { methods: string[]; strengths: number[] }>();

    // Process PC algorithm results
    if (traditionalResults?.causalGraph) {
      traditionalResults.causalGraph.forEach((relations: CausalRelation[]) => {
        relations.forEach(rel => {
          const key = `${rel.cause}->${rel.effect}`;
          if (!relationMethods.has(key)) {
            relationMethods.set(key, { methods: [], strengths: [] });
          }
          const entry = relationMethods.get(key)!;
          entry.methods.push('PC');
          entry.strengths.push(rel.strength);
        });
      });
    }

    // Process Granger results
    if (grangerResults) {
      grangerResults.forEach((result: any) => {
        const key = `${result.cause}->${result.effect}`;
        if (!relationMethods.has(key)) {
          relationMethods.set(key, { methods: [], strengths: [] });
        }
        const entry = relationMethods.get(key)!;
        entry.methods.push('Granger');
        entry.strengths.push(result.strength);
      });
    }

    // Process Transfer Entropy results
    if (transferEntropyResults) {
      transferEntropyResults.forEach((result: any) => {
        const key = `${result.source}->${result.target}`;
        if (!relationMethods.has(key)) {
          relationMethods.set(key, { methods: [], strengths: [] });
        }
        const entry = relationMethods.get(key)!;
        entry.methods.push('TransferEntropy');
        entry.strengths.push(result.normalizedTE);
      });
    }

    // Find conflicting relations (significant strength differences)
    const conflicts: Array<{ relation: string; methods: string[]; strengths: number[] }> = [];
    relationMethods.forEach((value, key) => {
      if (value.methods.length > 1) {
        const strengthRange = Math.max(...value.strengths) - Math.min(...value.strengths);
        if (strengthRange > 0.3) { // Threshold for conflict
          conflicts.push({
            relation: key,
            methods: value.methods,
            strengths: value.strengths
          });
        }
      }
    });

    return conflicts;
  }

  private mergeRelations(existing: CausalRelation[], newRelations: CausalRelation[]): CausalRelation[] {
    const merged = [...existing];
    
    newRelations.forEach(newRel => {
      const existingIndex = merged.findIndex(rel => 
        rel.cause === newRel.cause && rel.effect === newRel.effect
      );
      
      if (existingIndex >= 0) {
        // Average the strengths
        merged[existingIndex].strength = (merged[existingIndex].strength + newRel.strength) / 2;
      } else {
        merged.push(newRel);
      }
    });
    
    return merged;
  }

  private isDomainBridge(sensor1: string, sensor2: string): boolean {
    const getDomain = (sensor: string) => sensor.split('_')[0];
    return getDomain(sensor1) !== getDomain(sensor2);
  }
}

export type { EnhancedPipelineResult, PipelineConfig, TreatmentMetadata };
