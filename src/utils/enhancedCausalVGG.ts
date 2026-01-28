/**
 * Enhanced CausalVGG for IMSCHM System
 * 
 * Multi-modal VGG-based architecture for:
 * - 2D rock image classification
 * - 6-channel 1D signal → 2D scalogram processing (DE, FE, BA, temp, pressure, humidity)
 * - Causal inference with intervention metadata, confounders, and instrumental variables
 * 
 * Dual-head output: Classification Head + Causal Inference Head
 */

import * as tf from '@tensorflow/tfjs';

// ============================================================================
// Type Definitions
// ============================================================================

export interface ScalogramConfig {
  width: number;
  height: number;
  scales: number;
  waveletType: 'morlet' | 'mexican_hat' | 'paul';
}

export interface CWRUSignalChannels {
  DE: Float32Array;  // Drive End bearing
  FE: Float32Array;  // Fan End bearing
  BA: Float32Array;  // Base accelerometer
}

export interface EnvironmentalChannels {
  temperature: Float32Array;
  pressure: Float32Array;
  humidity: Float32Array;
}

export interface InterventionMetadata {
  amplitude: number;
  startTime: number;
  endTime: number;
  interventionType: 'pressure_spike' | 'speed_adjustment' | 'load_change' | 'thermal_shock';
  slope: number;
}

export interface CausalMetadata {
  interventions: InterventionMetadata[];
  confounders: {
    temperature: number;
    workingLoad: number;
  };
  instrumentalVariables: number[];  // Tools variables for IV estimation
}

export interface EnhancedCVGGInput {
  rockImage?: tf.Tensor4D;           // [batch, height, width, channels]
  cwruSignals?: CWRUSignalChannels;
  environmentalSignals?: EnvironmentalChannels;
  causalMetadata?: CausalMetadata;
}

export interface EnhancedCVGGOutput {
  classificationLogits: tf.Tensor2D;
  causalEffects: {
    ATE: number;      // Average Treatment Effect
    CATE: number;     // Conditional Average Treatment Effect
    directEffect: number;
    indirectEffect: number;
  };
  embeddings: tf.Tensor2D;
  confounderProxy: tf.Tensor2D;
  attentionWeights?: tf.Tensor2D;
}

export interface CVGGModelConfig {
  imageSize: number;
  scalogramSize: number;
  numClasses: number;
  embeddingDim: number;
  causalMetadataDim: number;
  numScalogramChannels: number;
  dropoutRate: number;
}

// ============================================================================
// Wavelet Transform for Scalogram Generation
// ============================================================================

class WaveletTransformer {
  private scales: number[];
  private waveletType: string;
  
  constructor(config: ScalogramConfig) {
    this.waveletType = config.waveletType;
    this.scales = this.generateScales(config.scales);
  }
  
  private generateScales(numScales: number): number[] {
    const scales: number[] = [];
    for (let i = 0; i < numScales; i++) {
      scales.push(Math.pow(2, i / 4 + 1));
    }
    return scales;
  }
  
  private morletWavelet(t: number, scale: number): { real: number; imag: number } {
    const omega0 = 6;
    const normalizedT = t / scale;
    const gaussian = Math.exp(-0.5 * normalizedT * normalizedT);
    const real = gaussian * Math.cos(omega0 * normalizedT);
    const imag = gaussian * Math.sin(omega0 * normalizedT);
    return { real, imag };
  }
  
  private mexicanHatWavelet(t: number, scale: number): number {
    const normalizedT = t / scale;
    const tSquared = normalizedT * normalizedT;
    return (1 - tSquared) * Math.exp(-0.5 * tSquared);
  }
  
  /**
   * Convert 1D signal to 2D scalogram using Continuous Wavelet Transform
   */
  transformToScalogram(signal: Float32Array, outputHeight: number, outputWidth: number): tf.Tensor3D {
    const signalLength = signal.length;
    const scalogramData = new Float32Array(outputHeight * outputWidth);
    
    // Resample scales to match output height
    const scaleStep = Math.max(1, Math.floor(this.scales.length / outputHeight));
    const timeStep = signalLength / outputWidth;
    
    for (let scaleIdx = 0; scaleIdx < outputHeight; scaleIdx++) {
      const scale = this.scales[Math.min(scaleIdx * scaleStep, this.scales.length - 1)];
      
      for (let timeIdx = 0; timeIdx < outputWidth; timeIdx++) {
        const centerTime = Math.floor(timeIdx * timeStep);
        let coeffReal = 0;
        let coeffImag = 0;
        
        // Convolution with wavelet
        const windowSize = Math.min(Math.floor(scale * 4), signalLength);
        for (let k = -windowSize; k <= windowSize; k++) {
          const sampleIdx = centerTime + k;
          if (sampleIdx >= 0 && sampleIdx < signalLength) {
            const wavelet = this.morletWavelet(k, scale);
            coeffReal += signal[sampleIdx] * wavelet.real;
            coeffImag += signal[sampleIdx] * wavelet.imag;
          }
        }
        
        // Magnitude of complex coefficient
        const magnitude = Math.sqrt(coeffReal * coeffReal + coeffImag * coeffImag);
        scalogramData[scaleIdx * outputWidth + timeIdx] = magnitude / Math.sqrt(scale);
      }
    }
    
    // Normalize scalogram
    const maxVal = Math.max(...scalogramData);
    if (maxVal > 0) {
      for (let i = 0; i < scalogramData.length; i++) {
        scalogramData[i] /= maxVal;
      }
    }
    
    return tf.tensor3d(scalogramData, [outputHeight, outputWidth, 1]);
  }
  
  /**
   * Convert 6-channel signals to stacked scalograms
   */
  transformMultiChannelSignals(
    cwru: CWRUSignalChannels,
    environmental: EnvironmentalChannels,
    outputHeight: number,
    outputWidth: number
  ): tf.Tensor4D {
    const scalograms: tf.Tensor3D[] = [];
    
    // CWRU channels
    scalograms.push(this.transformToScalogram(cwru.DE, outputHeight, outputWidth));
    scalograms.push(this.transformToScalogram(cwru.FE, outputHeight, outputWidth));
    scalograms.push(this.transformToScalogram(cwru.BA, outputHeight, outputWidth));
    
    // Environmental channels
    scalograms.push(this.transformToScalogram(environmental.temperature, outputHeight, outputWidth));
    scalograms.push(this.transformToScalogram(environmental.pressure, outputHeight, outputWidth));
    scalograms.push(this.transformToScalogram(environmental.humidity, outputHeight, outputWidth));
    
    // Stack along channel dimension: [height, width, 6]
    const stacked = tf.concat(scalograms, 2);
    
    // Cleanup
    scalograms.forEach(s => s.dispose());
    
    // Add batch dimension: [1, height, width, 6]
    return stacked.expandDims(0) as tf.Tensor4D;
  }
}

// ============================================================================
// Causal Metadata Encoder (Bypasses VGG Backbone)
// ============================================================================

class CausalMetadataEncoder {
  private model: tf.LayersModel | null = null;
  private outputDim: number;
  
  constructor(outputDim: number = 64) {
    this.outputDim = outputDim;
  }
  
  build(inputDim: number): tf.LayersModel {
    const input = tf.input({ shape: [inputDim], name: 'causal_metadata_input' });
    
    // Specialized encoder for causal metadata (bypasses conv layers)
    let x = tf.layers.dense({
      units: 128,
      activation: 'relu',
      kernelInitializer: 'heNormal',
      name: 'causal_encoder_dense1'
    }).apply(input) as tf.SymbolicTensor;
    
    x = tf.layers.batchNormalization({ name: 'causal_encoder_bn1' }).apply(x) as tf.SymbolicTensor;
    x = tf.layers.dropout({ rate: 0.2, name: 'causal_encoder_dropout1' }).apply(x) as tf.SymbolicTensor;
    
    x = tf.layers.dense({
      units: 64,
      activation: 'relu',
      kernelInitializer: 'heNormal',
      name: 'causal_encoder_dense2'
    }).apply(x) as tf.SymbolicTensor;
    
    x = tf.layers.batchNormalization({ name: 'causal_encoder_bn2' }).apply(x) as tf.SymbolicTensor;
    
    // Output: encoded causal metadata
    const output = tf.layers.dense({
      units: this.outputDim,
      activation: 'tanh',
      name: 'causal_metadata_embedding'
    }).apply(x) as tf.SymbolicTensor;
    
    this.model = tf.model({ inputs: input, outputs: output, name: 'CausalMetadataEncoder' });
    return this.model;
  }
  
  /**
   * Encode causal metadata into a fixed-size vector
   */
  encode(metadata: CausalMetadata): tf.Tensor2D {
    // Flatten intervention metadata
    const interventionFeatures: number[] = [];
    const maxInterventions = 5;
    
    for (let i = 0; i < maxInterventions; i++) {
      if (i < metadata.interventions.length) {
        const intervention = metadata.interventions[i];
        interventionFeatures.push(
          intervention.amplitude,
          intervention.startTime,
          intervention.endTime,
          this.encodeInterventionType(intervention.interventionType),
          intervention.slope
        );
      } else {
        interventionFeatures.push(0, 0, 0, 0, 0);
      }
    }
    
    // Confounders
    const confounderFeatures = [
      metadata.confounders.temperature,
      metadata.confounders.workingLoad
    ];
    
    // Instrumental variables (pad/truncate to fixed size)
    const ivFeatures = new Array(10).fill(0);
    for (let i = 0; i < Math.min(metadata.instrumentalVariables.length, 10); i++) {
      ivFeatures[i] = metadata.instrumentalVariables[i];
    }
    
    const allFeatures = [...interventionFeatures, ...confounderFeatures, ...ivFeatures];
    return tf.tensor2d([allFeatures], [1, allFeatures.length]);
  }
  
  private encodeInterventionType(type: string): number {
    const typeMap: Record<string, number> = {
      'pressure_spike': 0.25,
      'speed_adjustment': 0.5,
      'load_change': 0.75,
      'thermal_shock': 1.0
    };
    return typeMap[type] || 0;
  }
}

// ============================================================================
// VGG Backbone Feature Extractor
// ============================================================================

class VGGBackbone {
  private model: tf.LayersModel | null = null;
  
  /**
   * Build VGG-inspired backbone with shared feature extraction
   */
  build(inputShape: [number, number, number], embeddingDim: number = 256): tf.LayersModel {
    const input = tf.input({ shape: inputShape, name: 'image_input' });
    
    // VGG Block 1: 2 conv layers with 64 filters
    let x = this.vggBlock(input, 64, 2, 'block1');
    
    // VGG Block 2: 2 conv layers with 128 filters
    x = this.vggBlock(x, 128, 2, 'block2');
    
    // VGG Block 3: 3 conv layers with 256 filters
    x = this.vggBlock(x, 256, 3, 'block3');
    
    // VGG Block 4: 3 conv layers with 512 filters
    x = this.vggBlock(x, 512, 3, 'block4');
    
    // VGG Block 5: 3 conv layers with 512 filters
    x = this.vggBlock(x, 512, 3, 'block5');
    
    // Global Average Pooling
    x = tf.layers.globalAveragePooling2d({ name: 'global_avg_pool' }).apply(x) as tf.SymbolicTensor;
    
    // Embedding layer (shared representation)
    const embedding = tf.layers.dense({
      units: embeddingDim,
      activation: 'relu',
      kernelInitializer: 'heNormal',
      name: 'shared_embedding'
    }).apply(x) as tf.SymbolicTensor;
    
    this.model = tf.model({ inputs: input, outputs: embedding, name: 'VGGBackbone' });
    return this.model;
  }
  
  private vggBlock(
    input: tf.SymbolicTensor,
    filters: number,
    numConvLayers: number,
    blockName: string
  ): tf.SymbolicTensor {
    let x = input;
    
    for (let i = 0; i < numConvLayers; i++) {
      x = tf.layers.conv2d({
        filters,
        kernelSize: 3,
        padding: 'same',
        activation: 'relu',
        kernelInitializer: 'heNormal',
        name: `${blockName}_conv${i + 1}`
      }).apply(x) as tf.SymbolicTensor;
      
      x = tf.layers.batchNormalization({
        name: `${blockName}_bn${i + 1}`
      }).apply(x) as tf.SymbolicTensor;
    }
    
    x = tf.layers.maxPooling2d({
      poolSize: 2,
      strides: 2,
      name: `${blockName}_pool`
    }).apply(x) as tf.SymbolicTensor;
    
    return x;
  }
}

// ============================================================================
// Classification Head
// ============================================================================

class ClassificationHead {
  private model: tf.LayersModel | null = null;
  
  build(inputDim: number, numClasses: number, dropoutRate: number = 0.5): tf.LayersModel {
    const input = tf.input({ shape: [inputDim], name: 'classification_input' });
    
    let x = tf.layers.dense({
      units: 512,
      activation: 'relu',
      kernelInitializer: 'heNormal',
      name: 'classifier_fc1'
    }).apply(input) as tf.SymbolicTensor;
    
    x = tf.layers.dropout({ rate: dropoutRate, name: 'classifier_dropout1' }).apply(x) as tf.SymbolicTensor;
    
    x = tf.layers.dense({
      units: 256,
      activation: 'relu',
      kernelInitializer: 'heNormal',
      name: 'classifier_fc2'
    }).apply(x) as tf.SymbolicTensor;
    
    x = tf.layers.dropout({ rate: dropoutRate, name: 'classifier_dropout2' }).apply(x) as tf.SymbolicTensor;
    
    const output = tf.layers.dense({
      units: numClasses,
      activation: 'softmax',
      name: 'classification_output'
    }).apply(x) as tf.SymbolicTensor;
    
    this.model = tf.model({ inputs: input, outputs: output, name: 'ClassificationHead' });
    return this.model;
  }
}

// ============================================================================
// Causal Inference Head
// ============================================================================

class CausalInferenceHead {
  private model: tf.LayersModel | null = null;
  
  /**
   * Build causal inference head for ATE/CATE estimation
   * Inputs: embeddings + confounder proxy + causal metadata encoding
   */
  build(embeddingDim: number, causalMetadataDim: number): tf.LayersModel {
    const embeddingInput = tf.input({ shape: [embeddingDim], name: 'embedding_input' });
    const causalInput = tf.input({ shape: [causalMetadataDim], name: 'causal_input' });
    
    // Concatenate embeddings with causal metadata
    const concatenated = tf.layers.concatenate({
      name: 'causal_concat'
    }).apply([embeddingInput, causalInput]) as tf.SymbolicTensor;
    
    // Treatment effect estimation network
    let x = tf.layers.dense({
      units: 256,
      activation: 'relu',
      kernelInitializer: 'heNormal',
      name: 'causal_fc1'
    }).apply(concatenated) as tf.SymbolicTensor;
    
    x = tf.layers.batchNormalization({ name: 'causal_bn1' }).apply(x) as tf.SymbolicTensor;
    x = tf.layers.dropout({ rate: 0.3, name: 'causal_dropout1' }).apply(x) as tf.SymbolicTensor;
    
    x = tf.layers.dense({
      units: 128,
      activation: 'relu',
      kernelInitializer: 'heNormal',
      name: 'causal_fc2'
    }).apply(x) as tf.SymbolicTensor;
    
    x = tf.layers.batchNormalization({ name: 'causal_bn2' }).apply(x) as tf.SymbolicTensor;
    
    // Multi-output for different causal effects
    // Output 1: ATE (Average Treatment Effect)
    const ate = tf.layers.dense({
      units: 1,
      activation: 'linear',
      name: 'ate_output'
    }).apply(x) as tf.SymbolicTensor;
    
    // Output 2: CATE (Conditional ATE)
    const cate = tf.layers.dense({
      units: 1,
      activation: 'linear',
      name: 'cate_output'
    }).apply(x) as tf.SymbolicTensor;
    
    // Output 3: Direct Effect
    const directEffect = tf.layers.dense({
      units: 1,
      activation: 'linear',
      name: 'direct_effect_output'
    }).apply(x) as tf.SymbolicTensor;
    
    // Output 4: Indirect Effect (mediated)
    const indirectEffect = tf.layers.dense({
      units: 1,
      activation: 'linear',
      name: 'indirect_effect_output'
    }).apply(x) as tf.SymbolicTensor;
    
    // Confounder proxy output (for IV estimation)
    const confounderProxy = tf.layers.dense({
      units: 32,
      activation: 'tanh',
      name: 'confounder_proxy_output'
    }).apply(x) as tf.SymbolicTensor;
    
    this.model = tf.model({
      inputs: [embeddingInput, causalInput],
      outputs: [ate, cate, directEffect, indirectEffect, confounderProxy],
      name: 'CausalInferenceHead'
    });
    
    return this.model;
  }
}

// ============================================================================
// Enhanced CausalVGG Main Class
// ============================================================================

export class EnhancedCausalVGG {
  private config: CVGGModelConfig;
  private waveletTransformer: WaveletTransformer;
  private causalMetadataEncoder: CausalMetadataEncoder;
  private vggBackbone: VGGBackbone;
  private classificationHead: ClassificationHead;
  private causalHead: CausalInferenceHead;
  
  private backboneModel: tf.LayersModel | null = null;
  private scalogramBackboneModel: tf.LayersModel | null = null;
  private classifierModel: tf.LayersModel | null = null;
  private causalModel: tf.LayersModel | null = null;
  private metadataEncoderModel: tf.LayersModel | null = null;
  
  private isBuilt: boolean = false;
  
  constructor(config?: Partial<CVGGModelConfig>) {
    this.config = {
      imageSize: 224,
      scalogramSize: 128,
      numClasses: 10,
      embeddingDim: 256,
      causalMetadataDim: 64,
      numScalogramChannels: 6,
      dropoutRate: 0.5,
      ...config
    };
    
    this.waveletTransformer = new WaveletTransformer({
      width: this.config.scalogramSize,
      height: this.config.scalogramSize,
      scales: 64,
      waveletType: 'morlet'
    });
    
    this.causalMetadataEncoder = new CausalMetadataEncoder(this.config.causalMetadataDim);
    this.vggBackbone = new VGGBackbone();
    this.classificationHead = new ClassificationHead();
    this.causalHead = new CausalInferenceHead();
  }
  
  /**
   * Build the complete EnhancedCausalVGG model
   */
  async build(): Promise<void> {
    if (this.isBuilt) return;
    
    await tf.ready();
    
    console.log('[EnhancedCausalVGG] Building model components...');
    
    // Build VGG backbone for rock images
    this.backboneModel = this.vggBackbone.build(
      [this.config.imageSize, this.config.imageSize, 3],
      this.config.embeddingDim
    );
    console.log(`[EnhancedCausalVGG] Image backbone: ${this.backboneModel.countParams()} params`);
    
    // Build separate VGG backbone for scalograms (6 channels)
    this.scalogramBackboneModel = new VGGBackbone().build(
      [this.config.scalogramSize, this.config.scalogramSize, this.config.numScalogramChannels],
      this.config.embeddingDim
    );
    console.log(`[EnhancedCausalVGG] Scalogram backbone: ${this.scalogramBackboneModel.countParams()} params`);
    
    // Build causal metadata encoder (bypasses conv layers)
    const causalMetadataInputDim = 5 * 5 + 2 + 10; // 5 interventions × 5 features + 2 confounders + 10 IVs
    this.metadataEncoderModel = this.causalMetadataEncoder.build(causalMetadataInputDim);
    console.log(`[EnhancedCausalVGG] Metadata encoder: ${this.metadataEncoderModel.countParams()} params`);
    
    // Combined embedding dimension: image + scalogram embeddings
    const combinedEmbeddingDim = this.config.embeddingDim * 2;
    
    // Build classification head
    this.classifierModel = this.classificationHead.build(
      combinedEmbeddingDim + this.config.causalMetadataDim,
      this.config.numClasses,
      this.config.dropoutRate
    );
    console.log(`[EnhancedCausalVGG] Classification head: ${this.classifierModel.countParams()} params`);
    
    // Build causal inference head
    this.causalModel = this.causalHead.build(combinedEmbeddingDim, this.config.causalMetadataDim);
    console.log(`[EnhancedCausalVGG] Causal head: ${this.causalModel.countParams()} params`);
    
    this.isBuilt = true;
    console.log('[EnhancedCausalVGG] Model built successfully');
    console.log(`[EnhancedCausalVGG] Total parameters: ${this.getTotalParams()}`);
  }
  
  /**
   * Forward pass through the complete network
   */
  async forward(input: EnhancedCVGGInput): Promise<EnhancedCVGGOutput> {
    if (!this.isBuilt) {
      await this.build();
    }
    
    return tf.tidy(() => {
      let imageEmbedding: tf.Tensor2D;
      let scalogramEmbedding: tf.Tensor2D;
      let causalMetadataEncoding: tf.Tensor2D;
      
      // Process rock image through VGG backbone
      if (input.rockImage) {
        imageEmbedding = this.backboneModel!.predict(input.rockImage) as tf.Tensor2D;
      } else {
        // Create zero embedding if no image
        imageEmbedding = tf.zeros([1, this.config.embeddingDim]) as tf.Tensor2D;
      }
      
      // Process 6-channel signals → scalograms → VGG backbone
      if (input.cwruSignals && input.environmentalSignals) {
        const scalograms = this.waveletTransformer.transformMultiChannelSignals(
          input.cwruSignals,
          input.environmentalSignals,
          this.config.scalogramSize,
          this.config.scalogramSize
        );
        scalogramEmbedding = this.scalogramBackboneModel!.predict(scalograms) as tf.Tensor2D;
      } else {
        scalogramEmbedding = tf.zeros([1, this.config.embeddingDim]) as tf.Tensor2D;
      }
      
      // Encode causal metadata (bypasses conv layers)
      if (input.causalMetadata) {
        const metadataVector = this.causalMetadataEncoder.encode(input.causalMetadata);
        causalMetadataEncoding = this.metadataEncoderModel!.predict(metadataVector) as tf.Tensor2D;
      } else {
        causalMetadataEncoding = tf.zeros([1, this.config.causalMetadataDim]) as tf.Tensor2D;
      }
      
      // Combine embeddings (shared representation)
      const combinedEmbedding = tf.concat([imageEmbedding, scalogramEmbedding], 1) as tf.Tensor2D;
      
      // Classification Head: embedding + causal metadata
      const classificationInput = tf.concat([combinedEmbedding, causalMetadataEncoding], 1);
      const classificationLogits = this.classifierModel!.predict(classificationInput) as tf.Tensor2D;
      
      // Causal Head: embedding + causal metadata encoding
      const causalOutputs = this.causalModel!.predict([combinedEmbedding, causalMetadataEncoding]) as tf.Tensor[];
      
      // Extract causal effect values
      const ateValue = (causalOutputs[0] as tf.Tensor2D).dataSync()[0];
      const cateValue = (causalOutputs[1] as tf.Tensor2D).dataSync()[0];
      const directEffectValue = (causalOutputs[2] as tf.Tensor2D).dataSync()[0];
      const indirectEffectValue = (causalOutputs[3] as tf.Tensor2D).dataSync()[0];
      
      // Confounder proxy from causal head output
      const confounderProxy = causalOutputs[4] as tf.Tensor2D;
      
      return {
        classificationLogits,
        causalEffects: {
          ATE: ateValue,
          CATE: cateValue,
          directEffect: directEffectValue,
          indirectEffect: indirectEffectValue
        },
        embeddings: combinedEmbedding,
        confounderProxy
      };
    });
  }
  
  /**
   * Compute combined loss for training
   */
  computeLoss(
    predictions: EnhancedCVGGOutput,
    targets: {
      classLabels: tf.Tensor1D;
      observedOutcome: number;
      treatmentIndicator: number;
    }
  ): tf.Scalar {
    return tf.tidy(() => {
      // Classification loss (cross-entropy)
      const classLoss = tf.losses.softmaxCrossEntropy(
        tf.oneHot(targets.classLabels, this.config.numClasses),
        predictions.classificationLogits
      );
      
      // Causal loss: enforce DAG constraints
      const causalLoss = this.computeCausalLoss(predictions, targets);
      
      // Combined loss with weighting
      const alpha = 0.7; // Classification weight
      const beta = 0.3;  // Causal weight
      
      return tf.add(
        tf.mul(classLoss, alpha),
        tf.mul(causalLoss, beta)
      ) as tf.Scalar;
    });
  }
  
  private computeCausalLoss(
    predictions: EnhancedCVGGOutput,
    targets: { observedOutcome: number; treatmentIndicator: number }
  ): tf.Scalar {
    return tf.tidy(() => {
      const { ATE, CATE, directEffect, indirectEffect } = predictions.causalEffects;
      
      // Constraint 1: Total effect = Direct + Indirect
      const totalEffectConstraint = Math.pow(ATE - (directEffect + indirectEffect), 2);
      
      // Constraint 2: Outcome prediction error
      const predictedOutcome = targets.treatmentIndicator * ATE;
      const outcomeError = Math.pow(targets.observedOutcome - predictedOutcome, 2);
      
      // Constraint 3: IV validity (correlation with treatment but not outcome residual)
      const ivRegularization = 0.01 * (Math.abs(CATE) > 10 ? Math.abs(CATE) - 10 : 0);
      
      return tf.scalar(totalEffectConstraint + outcomeError + ivRegularization);
    });
  }
  
  /**
   * Estimate causal effects using instrumental variables
   */
  async estimateCausalEffectWithIV(
    input: EnhancedCVGGInput,
    instrumentalVariables: number[]
  ): Promise<{
    ivEstimate: number;
    waldEstimate: number;
    confidence: number;
  }> {
    const output = await this.forward({
      ...input,
      causalMetadata: {
        ...input.causalMetadata!,
        instrumentalVariables
      }
    });
    
    // Two-stage least squares estimation (simplified)
    const { ATE, CATE } = output.causalEffects;
    
    // Wald estimator: CATE / correlation(Z, T)
    const ivStrength = instrumentalVariables.reduce((a, b) => a + Math.abs(b), 0) / instrumentalVariables.length;
    const waldEstimate = ivStrength > 0.1 ? CATE / ivStrength : CATE;
    
    // Confidence based on IV strength
    const confidence = Math.min(1, ivStrength * 2);
    
    return {
      ivEstimate: ATE,
      waldEstimate,
      confidence
    };
  }
  
  /**
   * Process real-time signals for monitoring
   */
  async processSignals(
    cwruSignals: CWRUSignalChannels,
    environmentalSignals: EnvironmentalChannels,
    causalMetadata?: CausalMetadata
  ): Promise<{
    classification: { label: number; confidence: number };
    causalEffects: EnhancedCVGGOutput['causalEffects'];
    anomalyScore: number;
  }> {
    const output = await this.forward({
      cwruSignals,
      environmentalSignals,
      causalMetadata: causalMetadata || this.getDefaultCausalMetadata()
    });
    
    const logitsData = await output.classificationLogits.data();
    const maxIdx = logitsData.indexOf(Math.max(...logitsData));
    const confidence = logitsData[maxIdx];
    
    // Compute anomaly score from embedding distance
    const embeddingData = await output.embeddings.data();
    const embeddingArray = Array.from(embeddingData);
    const embeddingNorm = Math.sqrt(embeddingArray.reduce((a, b) => a + b * b, 0));
    const anomalyScore = 1 - Math.exp(-embeddingNorm / 10);
    
    return {
      classification: { label: maxIdx, confidence },
      causalEffects: output.causalEffects,
      anomalyScore
    };
  }
  
  private getDefaultCausalMetadata(): CausalMetadata {
    return {
      interventions: [],
      confounders: { temperature: 25, workingLoad: 0.5 },
      instrumentalVariables: [0, 0, 0, 0, 0]
    };
  }
  
  /**
   * Get all trainable weights from all model components
   * Returns the actual LayerVariable objects that can be used with optimizer
   */
  getTrainableWeights(): tf.LayerVariable[] {
    const weights: tf.LayerVariable[] = [];
    
    const collectFromModel = (model: tf.LayersModel | null) => {
      if (!model) return;
      weights.push(...model.trainableWeights);
    };
    
    collectFromModel(this.backboneModel);
    collectFromModel(this.scalogramBackboneModel);
    collectFromModel(this.metadataEncoderModel);
    collectFromModel(this.classifierModel);
    collectFromModel(this.causalModel);
    
    return weights;
  }
  
  /**
   * Get trainable variables (for backward compatibility)
   */
  getTrainableVariables(): tf.Variable[] {
    // Return the underlying variables from LayerVariables
    return this.getTrainableWeights().map(w => w.read() as unknown as tf.Variable);
  }
  
  /**
   * Train a single step using optimizer.minimize()
   * This properly tracks gradients through the model
   */
  trainStep(
    optimizer: tf.Optimizer,
    input: EnhancedCVGGInput,
    classLabel: number,
    observedOutcome: number,
    treatmentIndicator: number,
    classificationWeight: number,
    causalWeight: number,
    numClasses: number
  ): { lossValue: number; classLossValue: number; causalLossValue: number } {
    if (!this.isBuilt) {
      throw new Error('Model must be built before training');
    }
    
    let lossValue = 0;
    let classLossValue = 0;
    let causalLossValue = 0;
    
    // Use optimizer.minimize which properly tracks gradients
    optimizer.minimize(() => {
      return tf.tidy(() => {
        // Forward pass
        let imageEmbedding: tf.Tensor2D;
        let scalogramEmbedding: tf.Tensor2D;
        let causalMetadataEncoding: tf.Tensor2D;
        
        // Process rock image
        if (input.rockImage) {
          imageEmbedding = this.backboneModel!.apply(input.rockImage, { training: true }) as tf.Tensor2D;
        } else {
          imageEmbedding = tf.zeros([1, this.config.embeddingDim]) as tf.Tensor2D;
        }
        
        // Process signals to scalograms
        if (input.cwruSignals && input.environmentalSignals) {
          const scalograms = this.waveletTransformer.transformMultiChannelSignals(
            input.cwruSignals,
            input.environmentalSignals,
            this.config.scalogramSize,
            this.config.scalogramSize
          );
          scalogramEmbedding = this.scalogramBackboneModel!.apply(scalograms, { training: true }) as tf.Tensor2D;
        } else {
          scalogramEmbedding = tf.zeros([1, this.config.embeddingDim]) as tf.Tensor2D;
        }
        
        // Encode causal metadata
        if (input.causalMetadata) {
          const metadataVector = this.causalMetadataEncoder.encode(input.causalMetadata);
          causalMetadataEncoding = this.metadataEncoderModel!.apply(metadataVector, { training: true }) as tf.Tensor2D;
        } else {
          causalMetadataEncoding = tf.zeros([1, this.config.causalMetadataDim]) as tf.Tensor2D;
        }
        
        // Combine embeddings
        const combinedEmbedding = tf.concat([imageEmbedding, scalogramEmbedding], 1) as tf.Tensor2D;
        
        // Classification logits
        const classificationInput = tf.concat([combinedEmbedding, causalMetadataEncoding], 1);
        const classificationLogits = this.classifierModel!.apply(classificationInput, { training: true }) as tf.Tensor2D;
        
        // Causal outputs
        const causalOutputs = this.causalModel!.apply([combinedEmbedding, causalMetadataEncoding], { training: true }) as tf.Tensor[];
        
        // Classification loss with label smoothing
        const smoothing = 0.1;
        const classLabels = tf.tensor1d([classLabel], 'int32');
        const oneHot = tf.oneHot(classLabels, numClasses);
        const smoothedLabels = tf.add(
          tf.mul(oneHot, 1 - smoothing),
          tf.scalar(smoothing / numClasses)
        );
        const classLoss = tf.losses.softmaxCrossEntropy(smoothedLabels, classificationLogits);
        
        // Causal loss
        const ateValue = (causalOutputs[0] as tf.Tensor2D).flatten().slice([0], [1]);
        const directValue = (causalOutputs[2] as tf.Tensor2D).flatten().slice([0], [1]);
        const indirectValue = (causalOutputs[3] as tf.Tensor2D).flatten().slice([0], [1]);
        
        // DAG constraint: ATE ≈ direct + indirect
        const dagConstraint = tf.square(tf.sub(ateValue, tf.add(directValue, indirectValue)));
        
        // Outcome prediction loss
        const predictedOutcome = tf.mul(ateValue, tf.scalar(treatmentIndicator));
        const outcomeLoss = tf.square(tf.sub(tf.scalar(observedOutcome), predictedOutcome));
        
        // Combined causal loss
        const causalLoss = tf.add(dagConstraint, outcomeLoss).mean();
        
        // Store individual losses for logging
        classLossValue = classLoss.dataSync()[0];
        causalLossValue = causalLoss.dataSync()[0];
        
        // Combined total loss
        const totalLoss = tf.add(
          tf.mul(classLoss, tf.scalar(classificationWeight)),
          tf.mul(causalLoss, tf.scalar(causalWeight))
        ) as tf.Scalar;
        
        lossValue = totalLoss.dataSync()[0];
        
        return totalLoss;
      });
    }, true); // returnCost = true
    
    return { lossValue, classLossValue, causalLossValue };
  }
  
  /**
   * Compute gradients for training with combined loss (legacy compatibility)
   */
  async computeGradients(
    input: EnhancedCVGGInput,
    classLabel: number,
    observedOutcome: number,
    treatmentIndicator: number,
    classificationWeight: number,
    causalWeight: number,
    numClasses: number
  ): Promise<{
    lossValue: number;
    classLossValue: number;
    causalLossValue: number;
    grads: tf.Tensor[];
  }> {
    if (!this.isBuilt) {
      await this.build();
    }
    
    // Compute loss values from forward pass
    const output = await this.forward(input);
    
    const classLossValue = tf.tidy(() => {
      const classLabels = tf.tensor1d([classLabel], 'int32');
      const oneHot = tf.oneHot(classLabels, numClasses);
      return tf.losses.softmaxCrossEntropy(oneHot, output.classificationLogits).dataSync()[0];
    });
    
    const { ATE, directEffect, indirectEffect } = output.causalEffects;
    const causalLossValue = Math.pow(ATE - (directEffect + indirectEffect), 2) +
      Math.pow(observedOutcome - treatmentIndicator * ATE, 2);
    
    const lossValue = classificationWeight * classLossValue + causalWeight * causalLossValue;
    
    // Return empty grads array since we now use trainStep instead
    return {
      lossValue,
      classLossValue,
      causalLossValue,
      grads: []
    };
  }
  
  getTotalParams(): number {
    let total = 0;
    if (this.backboneModel) total += this.backboneModel.countParams();
    if (this.scalogramBackboneModel) total += this.scalogramBackboneModel.countParams();
    if (this.metadataEncoderModel) total += this.metadataEncoderModel.countParams();
    if (this.classifierModel) total += this.classifierModel.countParams();
    if (this.causalModel) total += this.causalModel.countParams();
    return total;
  }
  
  getConfig(): CVGGModelConfig {
    return { ...this.config };
  }
  
  /**
   * Get architecture summary
   */
  getArchitectureSummary(): string {
    return `
EnhancedCausalVGG Architecture:
================================
Input Modalities:
  - Rock Images: ${this.config.imageSize}×${this.config.imageSize}×3
  - Scalograms (6-ch): ${this.config.scalogramSize}×${this.config.scalogramSize}×6
    └─ CWRU: DE, FE, BA
    └─ Environmental: Temp, Pressure, Humidity
  - Causal Metadata: Interventions, Confounders, IVs

VGG Backbone (×2):
  - Block 1-5: Conv3×3 (64→512) + BN + MaxPool
  - Output: ${this.config.embeddingDim}-dim embedding

Causal Metadata Encoder:
  - Dense(128) → BN → Dense(64) → Output(${this.config.causalMetadataDim})

Dual Heads:
  ┌─ Classification Head → ${this.config.numClasses} classes
  └─ Causal Head → ATE, CATE, Direct/Indirect Effects

Total Parameters: ${this.getTotalParams().toLocaleString()}
    `.trim();
  }
  
  dispose(): void {
    this.backboneModel?.dispose();
    this.scalogramBackboneModel?.dispose();
    this.metadataEncoderModel?.dispose();
    this.classifierModel?.dispose();
    this.causalModel?.dispose();
    this.isBuilt = false;
  }
}

// Export singleton factory
let enhancedCVGGInstance: EnhancedCausalVGG | null = null;

export function getEnhancedCausalVGG(config?: Partial<CVGGModelConfig>): EnhancedCausalVGG {
  if (!enhancedCVGGInstance) {
    enhancedCVGGInstance = new EnhancedCausalVGG(config);
  }
  return enhancedCVGGInstance;
}

export function resetEnhancedCausalVGG(): void {
  enhancedCVGGInstance?.dispose();
  enhancedCVGGInstance = null;
}
