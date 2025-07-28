import { SystemState, SensorReading, CausalRelation, IndustrialDomain } from '@/types/industrial';
import { CausalVGGSimulator, TreatmentMetadata, MonteCarloResult, CounterfactualResult } from './causalVGG';
import { CausalDiscovery } from './causalInference';

export type { TreatmentMetadata } from './causalVGG';

export interface EnhancedPipelineResult {
  // Traditional causal analysis
  causalGraph: Map<string, CausalRelation[]>;
  anomalies: Array<{sensor: string, anomaly_score: number}>;
  
  // Deep learning results
  vggClassification: number[];
  vggCausalEffect: number;
  vggConfidence: number;
  
  // Monte Carlo uncertainty
  monteCarloResult: MonteCarloResult;
  
  // Counterfactual analysis
  counterfactualResult?: CounterfactualResult;
  
  // Intervention detection
  detectedInterventions: Array<{index: number, effect: number, uncertainty: number}>;
  
  // Training metrics
  trainingMetrics: any;
  
  // Hybrid recommendation
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendedActions: string[];
  confidence: number;
}

export interface PipelineConfig {
  enableTraditionalCausal: boolean;
  enableDeepLearning: boolean;
  enableMonteCarloUncertainty: boolean;
  enableCounterfactualAnalysis: boolean;
  interventionThreshold: number;
  uncertaintyThreshold: number;
}

export class EnhancedCausalPipeline {
  private causalDiscovery: CausalDiscovery;
  private causalVGG: CausalVGGSimulator;
  private config: PipelineConfig;
  
  private sensorHistory: SensorReading[] = [];
  private stateHistory: SystemState[] = [];

  constructor(config: Partial<PipelineConfig> = {}) {
    this.config = {
      enableTraditionalCausal: true,
      enableDeepLearning: true,
      enableMonteCarloUncertainty: true,
      enableCounterfactualAnalysis: true,
      interventionThreshold: 0.2,
      uncertaintyThreshold: 0.05,
      ...config
    };

    this.causalDiscovery = new CausalDiscovery();
    this.causalVGG = new CausalVGGSimulator();
  }

  // Main pipeline execution
  public async processSystemState(
    currentState: SystemState, 
    sensorReadings: SensorReading[],
    treatmentMeta?: TreatmentMetadata
  ): Promise<EnhancedPipelineResult> {
    
    // Store historical data
    this.stateHistory.push(currentState);
    this.sensorHistory.push(...sensorReadings);
    
    // Keep only recent history (last 1000 readings)
    if (this.sensorHistory.length > 1000) {
      this.sensorHistory = this.sensorHistory.slice(-1000);
    }
    if (this.stateHistory.length > 100) {
      this.stateHistory = this.stateHistory.slice(-100);
    }

    const result: EnhancedPipelineResult = {
      causalGraph: new Map(),
      anomalies: [],
      vggClassification: [],
      vggCausalEffect: 0,
      vggConfidence: 0,
      monteCarloResult: {
        logits_mean: [],
        logits_std: [],
        causal_mean: 0,
        causal_std: 0
      },
      detectedInterventions: [],
      trainingMetrics: {},
      riskLevel: 'low',
      recommendedActions: [],
      confidence: 0
    };

    // Phase 1: Traditional Causal Analysis (if enabled)
    if (this.config.enableTraditionalCausal) {
      await this.executeTraditionalCausalAnalysis(sensorReadings, result);
    }

    // Phase 2: Deep Learning Analysis (if enabled)
    if (this.config.enableDeepLearning && treatmentMeta) {
      await this.executeDeepLearningAnalysis(sensorReadings, treatmentMeta, result);
    }

    // Phase 3: Monte Carlo Uncertainty Quantification (if enabled)
    if (this.config.enableMonteCarloUncertainty && treatmentMeta) {
      await this.executeMonteCarloAnalysis(sensorReadings, treatmentMeta, result);
    }

    // Phase 4: Counterfactual Analysis (if enabled)
    if (this.config.enableCounterfactualAnalysis && treatmentMeta) {
      await this.executeCounterfactualAnalysis(sensorReadings, treatmentMeta, result);
    }

    // Phase 5: Hybrid Decision Making
    this.executeHybridDecisionMaking(result);

    return result;
  }

  private async executeTraditionalCausalAnalysis(
    sensorReadings: SensorReading[], 
    result: EnhancedPipelineResult
  ): Promise<void> {
    // Add current data to causal discovery
    this.causalDiscovery.addData(sensorReadings);

    // Discover causal structure if we have enough data
    if (this.sensorHistory.length > 200) {
      result.causalGraph = this.causalDiscovery.discoverCausalStructure();
    }

    // Detect anomalies
    result.anomalies = this.causalDiscovery.detectCausalAnomalies(sensorReadings);
  }

  private async executeDeepLearningAnalysis(
    sensorReadings: SensorReading[], 
    treatmentMeta: TreatmentMetadata, 
    result: EnhancedPipelineResult
  ): Promise<void> {
    // CausalVGG forward pass
    const vggOutput = this.causalVGG.forward(sensorReadings, treatmentMeta);
    result.vggClassification = vggOutput.class_logits;
    result.vggCausalEffect = vggOutput.causal_effect;
    result.vggConfidence = vggOutput.confidence;

    // Update training metrics
    result.trainingMetrics = this.causalVGG.getTrainingHistory();

    // Continue training if not complete
    if (!this.causalVGG.isTrainingComplete()) {
      const sensorBatch = [sensorReadings];
      const treatmentBatch = [treatmentMeta];
      const labels = [this.inferLabel(sensorReadings)];
      
      this.causalVGG.trainStep(sensorBatch, treatmentBatch, labels);
    }
  }

  private async executeMonteCarloAnalysis(
    sensorReadings: SensorReading[], 
    treatmentMeta: TreatmentMetadata, 
    result: EnhancedPipelineResult
  ): Promise<void> {
    // Monte Carlo prediction for uncertainty quantification
    result.monteCarloResult = this.causalVGG.monteCarloPredict(
      sensorReadings, 
      treatmentMeta, 
      20
    );

    // Detect interventions based on causal effects and uncertainty
    result.detectedInterventions = this.causalVGG.detectInterventions(
      result.monteCarloResult,
      this.config.interventionThreshold,
      this.config.uncertaintyThreshold
    );
  }

  private async executeCounterfactualAnalysis(
    sensorReadings: SensorReading[], 
    treatmentMeta: TreatmentMetadata, 
    result: EnhancedPipelineResult
  ): Promise<void> {
    // Create counterfactual scenario (no intervention)
    const noInterventionMeta: TreatmentMetadata = {
      magnitude: 0,
      start_time: 0,
      end_time: 0,
      slope: 0,
      type_id: 0
    };

    result.counterfactualResult = this.causalVGG.counterfactualPredict(
      sensorReadings,
      treatmentMeta,
      noInterventionMeta
    );
  }

  private executeHybridDecisionMaking(result: EnhancedPipelineResult): void {
    const factors: Array<{score: number, weight: number, source: string}> = [];

    // Traditional causal analysis contribution
    if (this.config.enableTraditionalCausal) {
      const anomalyScore = result.anomalies.reduce((sum, a) => sum + a.anomaly_score, 0);
      factors.push({
        score: Math.min(1.0, anomalyScore / 2.0),
        weight: 0.3,
        source: 'traditional_causal'
      });
    }

    // Deep learning contribution
    if (this.config.enableDeepLearning) {
      const faultProbability = Math.max(...result.vggClassification.slice(1)) || 0;
      factors.push({
        score: faultProbability,
        weight: 0.4,
        source: 'deep_learning'
      });
    }

    // Uncertainty contribution
    if (this.config.enableMonteCarloUncertainty) {
      const uncertaintyScore = result.monteCarloResult.causal_std;
      factors.push({
        score: Math.min(1.0, uncertaintyScore / 0.5),
        weight: 0.2,
        source: 'uncertainty'
      });
    }

    // Counterfactual contribution
    if (this.config.enableCounterfactualAnalysis && result.counterfactualResult) {
      const impactScore = Math.abs(result.counterfactualResult.treatment_impact);
      factors.push({
        score: Math.min(1.0, impactScore),
        weight: 0.1,
        source: 'counterfactual'
      });
    }

    // Calculate weighted risk score
    const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
    const riskScore = factors.reduce((sum, f) => sum + f.score * f.weight, 0) / totalWeight;

    // Determine risk level
    if (riskScore < 0.25) {
      result.riskLevel = 'low';
    } else if (riskScore < 0.5) {
      result.riskLevel = 'medium';
    } else if (riskScore < 0.75) {
      result.riskLevel = 'high';
    } else {
      result.riskLevel = 'critical';
    }

    // Calculate overall confidence
    result.confidence = this.calculateConfidence(factors, result);

    // Generate recommendations
    result.recommendedActions = this.generateRecommendations(result, factors);
  }

  private calculateConfidence(
    factors: Array<{score: number, weight: number, source: string}>, 
    result: EnhancedPipelineResult
  ): number {
    let confidence = 0.5; // Base confidence

    // Higher confidence with more enabled methods
    const enabledMethods = factors.length;
    confidence += enabledMethods * 0.1;

    // Confidence from VGG model
    if (this.config.enableDeepLearning) {
      confidence += result.vggConfidence * 0.3;
    }

    // Reduce confidence if high uncertainty
    if (this.config.enableMonteCarloUncertainty) {
      confidence -= result.monteCarloResult.causal_std * 0.2;
    }

    // More training epochs increase confidence
    const trainingProgress = this.causalVGG.getCurrentEpoch() / 10;
    confidence += trainingProgress * 0.2;

    return Math.max(0.1, Math.min(0.95, confidence));
  }

  private generateRecommendations(
    result: EnhancedPipelineResult, 
    factors: Array<{score: number, weight: number, source: string}>
  ): string[] {
    const recommendations: string[] = [];

    // Risk-based recommendations
    switch (result.riskLevel) {
      case 'critical':
        recommendations.push('IMMEDIATE SHUTDOWN REQUIRED');
        recommendations.push('Emergency maintenance protocol');
        break;
      case 'high':
        recommendations.push('Schedule immediate inspection');
        recommendations.push('Reduce operational load');
        break;
      case 'medium':
        recommendations.push('Increase monitoring frequency');
        recommendations.push('Plan preventive maintenance');
        break;
      case 'low':
        recommendations.push('Continue normal operation');
        recommendations.push('Regular monitoring sufficient');
        break;
    }

    // Source-specific recommendations
    factors.forEach(factor => {
      if (factor.score > 0.7) {
        switch (factor.source) {
          case 'traditional_causal':
            recommendations.push('Investigate causal anomalies detected');
            break;
          case 'deep_learning':
            recommendations.push('Deep learning model indicates fault pattern');
            break;
          case 'uncertainty':
            recommendations.push('High uncertainty - gather more data');
            break;
          case 'counterfactual':
            recommendations.push('Intervention effects detected - review treatment');
            break;
        }
      }
    });

    // Intervention-specific recommendations
    if (result.detectedInterventions.length > 0) {
      recommendations.push(`${result.detectedInterventions.length} intervention(s) detected`);
      recommendations.push('Review recent operational changes');
    }

    return [...new Set(recommendations)]; // Remove duplicates
  }

  private inferLabel(sensorReadings: SensorReading[]): number {
    // Simple heuristic to infer fault type from sensor data
    const domainAverages = new Map<IndustrialDomain, number>();
    
    ['hydraulic', 'mechanical', 'thermal', 'electrical', 'cutting'].forEach(domain => {
      const domainData = sensorReadings.filter(r => r.domain === domain as IndustrialDomain);
      if (domainData.length > 0) {
        const avg = domainData.reduce((sum, r) => sum + Math.abs(r.value), 0) / domainData.length;
        domainAverages.set(domain as IndustrialDomain, avg);
      }
    });

    // Find domain with highest average deviation
    let maxDomain: IndustrialDomain = 'hydraulic';
    let maxValue = 0;
    
    domainAverages.forEach((value, domain) => {
      if (value > maxValue) {
        maxValue = value;
        maxDomain = domain;
      }
    });

    // Map domain to label
    const domainToLabel = {
      'hydraulic': 1,
      'mechanical': 2,
      'thermal': 3,
      'electrical': 1,
      'cutting': 2
    };

    return maxValue > 1.0 ? domainToLabel[maxDomain] : 0; // 0 = normal
  }

  // Public methods for configuration
  public updateConfig(newConfig: Partial<PipelineConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getConfig(): PipelineConfig {
    return { ...this.config };
  }

  public reset(): void {
    this.sensorHistory = [];
    this.stateHistory = [];
    this.causalDiscovery = new CausalDiscovery();
    this.causalVGG = new CausalVGGSimulator();
  }
}
