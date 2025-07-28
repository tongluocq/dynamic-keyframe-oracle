import { SensorReading } from '@/types/industrial';

export interface TreatmentMetadata {
  magnitude: number;
  start_time: number;
  end_time: number;
  slope: number;
  type_id: number;
}

export interface CausalVGGOutput {
  class_logits: number[];
  causal_effect: number;
  confidence: number;
}

export interface MonteCarloResult {
  logits_mean: number[];
  logits_std: number[];
  causal_mean: number;
  causal_std: number;
}

export interface CounterfactualResult {
  factual_effect: number;
  counterfactual_effect: number;
  treatment_impact: number;
}

export class CausalVGGSimulator {
  private trainingHistory: {
    train_loss: number[];
    train_acc: number[];
    val_loss: number[];
    val_acc: number[];
    val_precision: number[];
    val_recall: number[];
    val_f1: number[];
    train_causal_effect: number[];
    val_causal_effect: number[];
  } = {
    train_loss: [],
    train_acc: [],
    val_loss: [],
    val_acc: [],
    val_precision: [],
    val_recall: [],
    val_f1: [],
    train_causal_effect: [],
    val_causal_effect: []
  };

  private currentEpoch: number = 0;
  private maxEpochs: number = 10;

  constructor() {
    this.initializeModel();
  }

  private initializeModel(): void {
    // Simulate initial training state
    this.currentEpoch = 0;
  }

  // Simulate CausalVGG forward pass
  public forward(sensorData: SensorReading[], treatmentMeta: TreatmentMetadata): CausalVGGOutput {
    // Convert sensor data to feature representation
    const features = this.extractFeatures(sensorData);
    
    // Simulate VGG feature extraction + causal head
    const class_logits = this.simulateClassification(features);
    const causal_effect = this.simulateCausalEffect(features, treatmentMeta);
    const confidence = this.calculateConfidence(features);

    return {
      class_logits,
      causal_effect,
      confidence
    };
  }

  private extractFeatures(sensorData: SensorReading[]): number[] {
    // Simulate feature extraction from multi-channel sensor data
    const features: number[] = [];
    
    // Group by domain and calculate statistical features
    const domains = ['hydraulic', 'mechanical', 'thermal', 'electrical', 'cutting'];
    
    domains.forEach(domain => {
      const domainData = sensorData.filter(r => r.domain === domain);
      if (domainData.length > 0) {
        const values = domainData.map(r => r.value);
        features.push(
          this.mean(values),
          this.std(values),
          this.max(values) - this.min(values), // range
          this.skewness(values)
        );
      } else {
        features.push(0, 0, 0, 0); // padding for missing domain
      }
    });

    return features;
  }

  private simulateClassification(features: number[]): number[] {
    // Simulate 4-class classification (Normal, Fault1, Fault2, Fault3)
    const weights = [
      [0.8, 0.1, 0.05, 0.05], // Normal bias
      [0.1, 0.7, 0.1, 0.1],   // Hydraulic fault bias
      [0.05, 0.1, 0.8, 0.05], // Mechanical fault bias
      [0.05, 0.1, 0.05, 0.8]  // Thermal fault bias
    ];

    // Use feature magnitude to determine fault type tendency
    const featureMagnitude = Math.sqrt(features.reduce((sum, f) => sum + f * f, 0));
    const classIndex = Math.min(Math.floor(featureMagnitude / 2), 3);
    
    return weights[classIndex].map(w => w + (Math.random() - 0.5) * 0.1);
  }

  private simulateCausalEffect(features: number[], treatmentMeta: TreatmentMetadata): number {
    // Simulate causal effect based on treatment and features
    const treatmentStrength = treatmentMeta.magnitude * 
      (treatmentMeta.end_time - treatmentMeta.start_time) / 1000;
    
    const featureInteraction = features.reduce((sum, f, i) => 
      sum + f * Math.sin(i * 0.5), 0) / features.length;

    return treatmentStrength * featureInteraction * (0.5 + Math.random() * 0.5);
  }

  private calculateConfidence(features: number[]): number {
    // Simulate model confidence based on feature consistency
    const variance = this.variance(features);
    return Math.max(0.1, Math.min(0.95, 1.0 / (1.0 + variance * 0.1)));
  }

  // Monte Carlo prediction simulation
  public monteCarloPredict(sensorData: SensorReading[], treatmentMeta: TreatmentMetadata, iterations: number = 20): MonteCarloResult {
    const logits: number[][] = [];
    const effects: number[] = [];

    for (let i = 0; i < iterations; i++) {
      // Add noise to simulate dropout during inference
      const noisySensorData = sensorData.map(r => ({
        ...r,
        value: r.value + (Math.random() - 0.5) * 0.1
      }));

      const result = this.forward(noisySensorData, treatmentMeta);
      logits.push(result.class_logits);
      effects.push(result.causal_effect);
    }

    return {
      logits_mean: this.meanArray(logits),
      logits_std: this.stdArray(logits),
      causal_mean: this.mean(effects),
      causal_std: this.std(effects)
    };
  }

  // Counterfactual prediction
  public counterfactualPredict(
    sensorData: SensorReading[], 
    originalMeta: TreatmentMetadata, 
    interventionMeta: TreatmentMetadata
  ): CounterfactualResult {
    const factual = this.forward(sensorData, originalMeta);
    const counterfactual = this.forward(sensorData, interventionMeta);

    return {
      factual_effect: factual.causal_effect,
      counterfactual_effect: counterfactual.causal_effect,
      treatment_impact: counterfactual.causal_effect - factual.causal_effect
    };
  }

  // Simulate training step
  public trainStep(sensorBatch: SensorReading[][], treatmentBatch: TreatmentMetadata[], labels: number[]): void {
    if (this.currentEpoch >= this.maxEpochs) return;

    // Simulate training metrics
    const trainLoss = 2.0 * Math.exp(-this.currentEpoch * 0.2) + Math.random() * 0.1;
    const trainAcc = Math.min(0.95, 0.4 + this.currentEpoch * 0.08 + Math.random() * 0.05);
    const valLoss = trainLoss * 1.1 + Math.random() * 0.05;
    const valAcc = trainAcc * 0.95 + Math.random() * 0.03;

    // Simulate causal effect learning
    const causalEffect = Math.sin(this.currentEpoch * 0.5) * 0.3 + Math.random() * 0.1;

    this.trainingHistory.train_loss.push(trainLoss);
    this.trainingHistory.train_acc.push(trainAcc);
    this.trainingHistory.val_loss.push(valLoss);
    this.trainingHistory.val_acc.push(valAcc);
    this.trainingHistory.val_precision.push(valAcc + Math.random() * 0.02);
    this.trainingHistory.val_recall.push(valAcc + Math.random() * 0.02);
    this.trainingHistory.val_f1.push(valAcc + Math.random() * 0.01);
    this.trainingHistory.train_causal_effect.push(causalEffect);
    this.trainingHistory.val_causal_effect.push(causalEffect * 0.9);

    this.currentEpoch++;
  }

  public getTrainingHistory() {
    return { ...this.trainingHistory };
  }

  public getCurrentEpoch(): number {
    return this.currentEpoch;
  }

  public isTrainingComplete(): boolean {
    return this.currentEpoch >= this.maxEpochs;
  }

  // Detect interventions based on causal effects
  public detectInterventions(
    monteCarloResult: MonteCarloResult, 
    thresholdEffect: number = 0.2, 
    thresholdUncertainty: number = 0.05
  ): Array<{index: number, effect: number, uncertainty: number}> {
    const flags: Array<{index: number, effect: number, uncertainty: number}> = [];
    
    if (Math.abs(monteCarloResult.causal_mean) > thresholdEffect && 
        monteCarloResult.causal_std > thresholdUncertainty) {
      flags.push({
        index: 0,
        effect: monteCarloResult.causal_mean,
        uncertainty: monteCarloResult.causal_std
      });
    }

    return flags;
  }

  // Utility functions
  private mean(arr: number[]): number {
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
  }

  private std(arr: number[]): number {
    const m = this.mean(arr);
    const variance = arr.reduce((sum, val) => sum + (val - m) ** 2, 0) / arr.length;
    return Math.sqrt(variance);
  }

  private variance(arr: number[]): number {
    const m = this.mean(arr);
    return arr.reduce((sum, val) => sum + (val - m) ** 2, 0) / arr.length;
  }

  private max(arr: number[]): number {
    return Math.max(...arr);
  }

  private min(arr: number[]): number {
    return Math.min(...arr);
  }

  private skewness(arr: number[]): number {
    const m = this.mean(arr);
    const s = this.std(arr);
    return arr.reduce((sum, val) => sum + Math.pow((val - m) / s, 3), 0) / arr.length;
  }

  private meanArray(arrays: number[][]): number[] {
    if (arrays.length === 0) return [];
    const result = new Array(arrays[0].length).fill(0);
    for (const arr of arrays) {
      for (let i = 0; i < arr.length; i++) {
        result[i] += arr[i];
      }
    }
    return result.map(sum => sum / arrays.length);
  }

  private stdArray(arrays: number[][]): number[] {
    if (arrays.length === 0) return [];
    const means = this.meanArray(arrays);
    const result = new Array(arrays[0].length).fill(0);
    
    for (const arr of arrays) {
      for (let i = 0; i < arr.length; i++) {
        result[i] += Math.pow(arr[i] - means[i], 2);
      }
    }
    
    return result.map(sum => Math.sqrt(sum / arrays.length));
  }
}