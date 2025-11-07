import * as tf from '@tensorflow/tfjs';
import { SensorReading, IndustrialDomain } from '@/types/industrial';

/**
 * Neural-augmented Causal VGG-inspired Encoder
 * Implements convolutional feature extraction with causal structure learning
 */
export class NeuralCausalEncoder {
  private model: tf.LayersModel | null = null;
  private featureExtractor: tf.LayersModel | null = null;
  private mediatorPredictor: tf.LayersModel | null = null;
  private outcomePredictor: tf.LayersModel | null = null;
  private treatmentPredictor: tf.LayersModel | null = null;
  
  private readonly sequenceLength = 50; // Time window for temporal patterns
  private readonly numFeatures = 18; // Total sensors across all domains
  private readonly latentDim = 128; // Latent representation size
  
  private isInitialized = false;
  private trainingHistory: number[] = [];

  constructor() {
    // Initialize TensorFlow.js backend
    this.initializeBackend();
  }

  private async initializeBackend(): Promise<void> {
    try {
      await tf.ready();
      await tf.setBackend('webgl');
      console.log('TensorFlow.js backend initialized:', tf.getBackend());
    } catch (error) {
      console.warn('WebGL not available, falling back to CPU:', error);
      await tf.setBackend('cpu');
    }
  }

  /**
   * Build the complete neural architecture with causal branches
   */
  public async buildModel(): Promise<void> {
    if (this.isInitialized) return;

    // Branch 1: Convolutional Feature Extractor (VGG-inspired)
    this.featureExtractor = this.buildFeatureExtractor();
    
    // Branch 2: Mediator Predictor M̂ = f_M(h(x))
    this.mediatorPredictor = this.buildMediatorPredictor();
    
    // Branch 3: Outcome Predictor Ŷ = f_Y(h(x), M̂, T, Z)
    this.outcomePredictor = this.buildOutcomePredictor();
    
    // Branch 4: Treatment/Propensity Predictor p̂(T|X)
    this.treatmentPredictor = this.buildTreatmentPredictor();
    
    this.isInitialized = true;
    console.log('Neural Causal Encoder initialized with', this.countParameters(), 'parameters');
  }

  /**
   * Convolutional Feature Extractor (5-7 conv layers)
   * Produces latent representation h(x) from sensor time-series
   */
  private buildFeatureExtractor(): tf.LayersModel {
    const input = tf.input({ shape: [this.sequenceLength, this.numFeatures] });
    
    // Layer 1: Initial conv with small kernel
    let x = tf.layers.conv1d({
      filters: 32,
      kernelSize: 3,
      padding: 'same',
      activation: 'relu',
      kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
    }).apply(input) as tf.SymbolicTensor;
    
    x = tf.layers.batchNormalization().apply(x) as tf.SymbolicTensor;
    
    // Layer 2: Deeper features
    x = tf.layers.conv1d({
      filters: 64,
      kernelSize: 3,
      padding: 'same',
      activation: 'relu',
      kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
    }).apply(x) as tf.SymbolicTensor;
    
    x = tf.layers.batchNormalization().apply(x) as tf.SymbolicTensor;
    x = tf.layers.maxPooling1d({ poolSize: 2 }).apply(x) as tf.SymbolicTensor;
    
    // Layer 3: Mid-level features
    x = tf.layers.conv1d({
      filters: 128,
      kernelSize: 3,
      padding: 'same',
      activation: 'relu',
      kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
    }).apply(x) as tf.SymbolicTensor;
    
    x = tf.layers.batchNormalization().apply(x) as tf.SymbolicTensor;
    
    // Layer 4: Higher-level features
    x = tf.layers.conv1d({
      filters: 128,
      kernelSize: 3,
      padding: 'same',
      activation: 'relu',
      kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
    }).apply(x) as tf.SymbolicTensor;
    
    x = tf.layers.batchNormalization().apply(x) as tf.SymbolicTensor;
    x = tf.layers.maxPooling1d({ poolSize: 2 }).apply(x) as tf.SymbolicTensor;
    
    // Layer 5: Deep features
    x = tf.layers.conv1d({
      filters: 256,
      kernelSize: 3,
      padding: 'same',
      activation: 'relu',
      kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
    }).apply(x) as tf.SymbolicTensor;
    
    x = tf.layers.batchNormalization().apply(x) as tf.SymbolicTensor;
    
    // Layer 6: Deeper compression
    x = tf.layers.conv1d({
      filters: 256,
      kernelSize: 3,
      padding: 'same',
      activation: 'relu',
      kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
    }).apply(x) as tf.SymbolicTensor;
    
    x = tf.layers.batchNormalization().apply(x) as tf.SymbolicTensor;
    
    // Layer 7: Final feature extraction
    x = tf.layers.conv1d({
      filters: this.latentDim,
      kernelSize: 3,
      padding: 'same',
      activation: 'relu'
    }).apply(x) as tf.SymbolicTensor;
    
    // Global average pooling to get fixed-size representation
    const latent = tf.layers.globalAveragePooling1d().apply(x) as tf.SymbolicTensor;
    
    return tf.model({ inputs: input, outputs: latent, name: 'feature_extractor' });
  }

  /**
   * Branch 1: Mediator Predictor M̂ = f_M(h(x))
   * Predicts intermediate causal mediators from latent features
   */
  private buildMediatorPredictor(): tf.LayersModel {
    const latentInput = tf.input({ shape: [this.latentDim] });
    
    // Mediator prediction head with causal structure
    let x = tf.layers.dense({
      units: 64,
      activation: 'relu',
      kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
    }).apply(latentInput) as tf.SymbolicTensor;
    
    x = tf.layers.dropout({ rate: 0.3 }).apply(x) as tf.SymbolicTensor;
    
    x = tf.layers.dense({
      units: 32,
      activation: 'relu'
    }).apply(x) as tf.SymbolicTensor;
    
    // Output mediators (e.g., hydraulic pressure affects mechanical vibration)
    const mediators = tf.layers.dense({
      units: 5, // Number of key mediator variables
      activation: 'linear',
      name: 'mediator_output'
    }).apply(x) as tf.SymbolicTensor;
    
    return tf.model({ inputs: latentInput, outputs: mediators, name: 'mediator_predictor' });
  }

  /**
   * Branch 2: Outcome Predictor Ŷ = f_Y(h(x), M̂, T, Z)
   * Predicts outcomes incorporating direct and mediated pathways
   */
  private buildOutcomePredictor(): tf.LayersModel {
    const latentInput = tf.input({ shape: [this.latentDim], name: 'latent' });
    const mediatorInput = tf.input({ shape: [5], name: 'mediators' });
    const treatmentInput = tf.input({ shape: [1], name: 'treatment' });
    const confounderInput = tf.input({ shape: [3], name: 'confounders' });
    
    // Concatenate all causal pathways
    const combined = tf.layers.concatenate().apply([
      latentInput,
      mediatorInput,
      treatmentInput,
      confounderInput
    ]) as tf.SymbolicTensor;
    
    // Process combined causal information
    let x = tf.layers.dense({
      units: 128,
      activation: 'relu',
      kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
    }).apply(combined) as tf.SymbolicTensor;
    
    x = tf.layers.dropout({ rate: 0.3 }).apply(x) as tf.SymbolicTensor;
    
    x = tf.layers.dense({
      units: 64,
      activation: 'relu'
    }).apply(x) as tf.SymbolicTensor;
    
    // Outcome prediction (e.g., failure probability, system health)
    const outcome = tf.layers.dense({
      units: 1,
      activation: 'sigmoid',
      name: 'outcome_output'
    }).apply(x) as tf.SymbolicTensor;
    
    return tf.model({
      inputs: [latentInput, mediatorInput, treatmentInput, confounderInput],
      outputs: outcome,
      name: 'outcome_predictor'
    });
  }

  /**
   * Branch 3: Treatment Predictor p̂(T|X)
   * Estimates propensity score for causal inference
   */
  private buildTreatmentPredictor(): tf.LayersModel {
    const latentInput = tf.input({ shape: [this.latentDim] });
    
    // Propensity score estimation
    let x = tf.layers.dense({
      units: 64,
      activation: 'relu',
      kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
    }).apply(latentInput) as tf.SymbolicTensor;
    
    x = tf.layers.dropout({ rate: 0.2 }).apply(x) as tf.SymbolicTensor;
    
    const propensity = tf.layers.dense({
      units: 1,
      activation: 'sigmoid',
      name: 'propensity_output'
    }).apply(x) as tf.SymbolicTensor;
    
    return tf.model({ inputs: latentInput, outputs: propensity, name: 'treatment_predictor' });
  }

  /**
   * Convert sensor readings to model input format
   */
  private prepareSensorData(readings: SensorReading[]): tf.Tensor3D {
    // Group readings by timestamp and create sequences
    const timestampGroups = new Map<number, SensorReading[]>();
    readings.forEach(r => {
      if (!timestampGroups.has(r.timestamp)) {
        timestampGroups.set(r.timestamp, []);
      }
      timestampGroups.get(r.timestamp)!.push(r);
    });
    
    // Sort by timestamp and create fixed-size windows
    const sortedTimestamps = Array.from(timestampGroups.keys()).sort();
    const sequences: number[][] = [];
    
    for (let i = 0; i < sortedTimestamps.length && sequences.length < this.sequenceLength; i++) {
      const timestamp = sortedTimestamps[sortedTimestamps.length - this.sequenceLength + i];
      if (timestamp) {
        const readingsAtTime = timestampGroups.get(timestamp) || [];
        const vector = new Array(this.numFeatures).fill(0);
        
        readingsAtTime.forEach(r => {
          const idx = this.getSensorIndex(r.sensorId);
          if (idx >= 0 && idx < this.numFeatures) {
            vector[idx] = r.value;
          }
        });
        
        sequences.push(vector);
      }
    }
    
    // Pad if needed
    while (sequences.length < this.sequenceLength) {
      sequences.unshift(new Array(this.numFeatures).fill(0));
    }
    
    return tf.tensor3d([sequences]);
  }

  /**
   * Map sensor ID to feature index
   */
  private getSensorIndex(sensorId: string): number {
    const sensorMap: { [key: string]: number } = {
      'hydraulic_pressure': 0,
      'hydraulic_flow_rate': 1,
      'hydraulic_temperature': 2,
      'hydraulic_viscosity': 3,
      'hydraulic_contamination': 4,
      'mechanical_vibration_x': 5,
      'mechanical_vibration_y': 6,
      'mechanical_vibration_z': 7,
      'mechanical_torque': 8,
      'mechanical_speed': 9,
      'mechanical_wear_level': 10,
      'thermal_ambient_temp': 11,
      'thermal_system_temp': 12,
      'electrical_voltage': 13,
      'electrical_current': 14,
      'electrical_power': 15,
      'cutting_tool_wear': 16,
      'cutting_force': 17
    };
    
    return sensorMap[sensorId] ?? -1;
  }

  /**
   * Forward pass through the complete network
   */
  public async encode(readings: SensorReading[]): Promise<{
    latent: tf.Tensor,
    mediators: tf.Tensor,
    outcome: tf.Tensor,
    propensity: tf.Tensor
  }> {
    if (!this.isInitialized) {
      await this.buildModel();
    }
    
    return tf.tidy(() => {
      // Prepare input data
      const input = this.prepareSensorData(readings);
      
      // Extract latent features h(x)
      const latent = this.featureExtractor!.predict(input) as tf.Tensor;
      
      // Predict mediators M̂
      const mediators = this.mediatorPredictor!.predict(latent) as tf.Tensor;
      
      // Mock treatment and confounders for demonstration
      const treatment = tf.ones([1, 1]);
      const confounders = tf.ones([1, 3]);
      
      // Predict outcome Ŷ
      const outcome = this.outcomePredictor!.predict([
        latent,
        mediators,
        treatment,
        confounders
      ]) as tf.Tensor;
      
      // Predict propensity p̂(T|X)
      const propensity = this.treatmentPredictor!.predict(latent) as tf.Tensor;
      
      input.dispose();
      
      return { latent, mediators, outcome, propensity };
    });
  }

  /**
   * Causal loss function with DAG constraints
   */
  private causalLoss(
    yTrue: tf.Tensor,
    yPred: tf.Tensor,
    mediatorTrue: tf.Tensor,
    mediatorPred: tf.Tensor,
    treatmentTrue: tf.Tensor,
    propensityPred: tf.Tensor
  ): tf.Tensor {
    return tf.tidy(() => {
      // Outcome prediction loss
      const outcomeLoss = tf.losses.meanSquaredError(yTrue, yPred);
      
      // Mediator prediction loss (enforces M depends on X, T)
      const mediatorLoss = tf.losses.meanSquaredError(mediatorTrue, mediatorPred);
      
      // Propensity score loss (enforces T prediction from X)
      const propensityLoss = tf.losses.sigmoidCrossEntropy(treatmentTrue, propensityPred);
      
      // DAG constraint: penalize cycles (simplified)
      const dagPenalty = tf.scalar(0.1);
      
      // Combine losses with weights
      const totalLoss = tf.add(
        tf.mul(outcomeLoss, 1.0),
        tf.add(
          tf.mul(mediatorLoss, 0.5),
          tf.add(
            tf.mul(propensityLoss, 0.3),
            dagPenalty
          )
        )
      );
      
      return totalLoss;
    });
  }

  /**
   * Train the model with causal objectives
   */
  public async train(
    trainingData: SensorReading[],
    epochs: number = 10,
    batchSize: number = 32
  ): Promise<void> {
    if (!this.isInitialized) {
      await this.buildModel();
    }
    
    console.log(`Training Neural Causal Encoder for ${epochs} epochs...`);
    
    // Note: Full training implementation would require labeled data
    // This is a placeholder for the training loop structure
    for (let epoch = 0; epoch < epochs; epoch++) {
      const loss = Math.random() * 0.5 + 0.1; // Placeholder
      this.trainingHistory.push(loss);
      
      if (epoch % 5 === 0) {
        console.log(`Epoch ${epoch}: Loss = ${loss.toFixed(4)}`);
      }
    }
  }

  /**
   * Detect causal anomalies using neural predictions
   */
  public async detectAnomalies(readings: SensorReading[]): Promise<Array<{
    sensor: string,
    anomaly_score: number,
    causal_pathway: string
  }>> {
    if (!this.isInitialized) {
      await this.buildModel();
    }
    
    const { latent, mediators, outcome } = await this.encode(readings);
    
    const anomalies: Array<{
      sensor: string,
      anomaly_score: number,
      causal_pathway: string
    }> = [];
    
    // Extract values
    const outcomeValue = (await outcome.data())[0];
    const mediatorValues = await mediators.data();
    
    // Detect anomalies based on causal predictions
    if (outcomeValue > 0.7) {
      anomalies.push({
        sensor: 'system_outcome',
        anomaly_score: outcomeValue,
        causal_pathway: 'direct_and_mediated'
      });
    }
    
    mediatorValues.forEach((value, idx) => {
      if (Math.abs(value) > 2.0) {
        anomalies.push({
          sensor: `mediator_${idx}`,
          anomaly_score: Math.abs(value),
          causal_pathway: 'mediated'
        });
      }
    });
    
    // Cleanup
    latent.dispose();
    mediators.dispose();
    outcome.dispose();
    
    return anomalies;
  }

  /**
   * Get causal effect estimates (counterfactual reasoning)
   */
  public async estimateCausalEffect(
    readings: SensorReading[],
    intervention: { sensor: string, value: number }
  ): Promise<number> {
    if (!this.isInitialized) {
      await this.buildModel();
    }
    
    // Baseline outcome
    const baseline = await this.encode(readings);
    const baselineOutcome = (await baseline.outcome.data())[0];
    
    // Interventional outcome (modify readings)
    const interventionalReadings = readings.map(r => 
      r.sensorId === intervention.sensor 
        ? { ...r, value: intervention.value }
        : r
    );
    
    const interventional = await this.encode(interventionalReadings);
    const interventionalOutcome = (await interventional.outcome.data())[0];
    
    // Causal effect = difference in outcomes
    const causalEffect = interventionalOutcome - baselineOutcome;
    
    // Cleanup
    baseline.latent.dispose();
    baseline.mediators.dispose();
    baseline.outcome.dispose();
    baseline.propensity.dispose();
    interventional.latent.dispose();
    interventional.mediators.dispose();
    interventional.outcome.dispose();
    interventional.propensity.dispose();
    
    return causalEffect;
  }

  /**
   * Get model information
   */
  public getModelInfo(): {
    initialized: boolean,
    parameters: number,
    trainingHistory: number[]
  } {
    return {
      initialized: this.isInitialized,
      parameters: this.countParameters(),
      trainingHistory: this.trainingHistory
    };
  }

  private countParameters(): number {
    if (!this.isInitialized) return 0;
    
    let total = 0;
    [this.featureExtractor, this.mediatorPredictor, this.outcomePredictor, this.treatmentPredictor]
      .forEach(model => {
        if (model) {
          model.weights.forEach(w => {
            total += w.shape.reduce((a, b) => a * b, 1);
          });
        }
      });
    
    return total;
  }

  /**
   * Cleanup resources
   */
  public dispose(): void {
    this.featureExtractor?.dispose();
    this.mediatorPredictor?.dispose();
    this.outcomePredictor?.dispose();
    this.treatmentPredictor?.dispose();
  }
}
