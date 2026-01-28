/**
 * React Hook for EnhancedCausalVGG Training and Inference
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import {
  EnhancedCausalVGG,
  EnhancedCVGGInput,
  EnhancedCVGGOutput,
  CWRUSignalChannels,
  EnvironmentalChannels,
  CausalMetadata,
  InterventionMetadata,
  getEnhancedCausalVGG,
  resetEnhancedCausalVGG
} from '@/utils/enhancedCausalVGG';

// Optimized defaults for faster feedback
export const DEFAULT_SAMPLE_COUNT = 50;  // Reduced from 200
export const DEFAULT_TRAINING_CONFIG = {
  epochs: 5,           // Reduced from 20
  batchSize: 8,        // Smaller batches for more frequent UI updates
  learningRate: 0.001,
  classificationWeight: 1.0,
  causalWeight: 0.5,
  validationSplit: 0.1
};

export interface TrainingConfig {
  epochs: number;
  batchSize: number;
  learningRate: number;
  classificationWeight: number;
  causalWeight: number;
  validationSplit: number;
}

export interface TrainingProgress {
  epoch: number;
  totalEpochs: number;
  loss: number;
  classificationLoss: number;
  causalLoss: number;
  accuracy: number;
  isTraining: boolean;
}

export interface TrainingSample {
  input: EnhancedCVGGInput;
  classLabel: number;
  observedOutcome: number;
  treatmentIndicator: number;
}

export interface CVGGModelState {
  isBuilt: boolean;
  isLoading: boolean;
  totalParams: number;
  mode: 'idle' | 'inference' | 'training';
}

export interface InferenceResult {
  classification: { label: number; confidence: number; className: string };
  causalEffects: EnhancedCVGGOutput['causalEffects'];
  anomalyScore: number;
  processingTimeMs: number;
}

const CLASS_NAMES = [
  'Normal',
  'Inner Race Fault',
  'Outer Race Fault',
  'Ball Fault',
  'Cage Fault',
  'Misalignment',
  'Unbalance',
  'Looseness',
  'Rubbing',
  'Composite Fault'
];

export function useEnhancedCVGG() {
  const modelRef = useRef<EnhancedCausalVGG | null>(null);
  const [modelState, setModelState] = useState<CVGGModelState>({
    isBuilt: false,
    isLoading: false,
    totalParams: 0,
    mode: 'idle'
  });
  
  const [trainingProgress, setTrainingProgress] = useState<TrainingProgress>({
    epoch: 0,
    totalEpochs: 0,
    loss: 0,
    classificationLoss: 0,
    causalLoss: 0,
    accuracy: 0,
    isTraining: false
  });
  
  const [trainingHistory, setTrainingHistory] = useState<Array<{
    epoch: number;
    loss: number;
    accuracy: number;
  }>>([]);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize model
  const initializeModel = useCallback(async () => {
    if (modelRef.current?.getConfig()) return;
    
    setModelState(prev => ({ ...prev, isLoading: true }));
    
    try {
      modelRef.current = getEnhancedCausalVGG({
        imageSize: 128,
        scalogramSize: 64,
        numClasses: CLASS_NAMES.length,
        embeddingDim: 128,
        causalMetadataDim: 32,
        dropoutRate: 0.3
      });
      
      await modelRef.current.build();
      
      setModelState({
        isBuilt: true,
        isLoading: false,
        totalParams: modelRef.current.getTotalParams(),
        mode: 'idle'
      });
      
      console.log('[useEnhancedCVGG] Model initialized');
    } catch (error) {
      console.error('[useEnhancedCVGG] Failed to initialize:', error);
      setModelState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Process rock image from file
  const processRockImage = useCallback(async (imageFile: File): Promise<tf.Tensor4D | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 128;
          canvas.height = 128;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, 128, 128);
          
          const imageData = ctx.getImageData(0, 0, 128, 128);
          const data = new Float32Array(128 * 128 * 3);
          
          for (let i = 0; i < 128 * 128; i++) {
            data[i * 3] = imageData.data[i * 4] / 255;
            data[i * 3 + 1] = imageData.data[i * 4 + 1] / 255;
            data[i * 3 + 2] = imageData.data[i * 4 + 2] / 255;
          }
          
          const tensor = tf.tensor4d(data, [1, 128, 128, 3]);
          resolve(tensor);
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(imageFile);
    });
  }, []);

  // Generate synthetic CWRU signals from sensor readings
  const generateCWRUSignals = useCallback((
    vibrationX: number[],
    vibrationY: number[],
    vibrationZ: number[]
  ): CWRUSignalChannels => {
    const length = Math.min(vibrationX.length, vibrationY.length, vibrationZ.length, 1024);
    
    // DE (Drive End) - primarily affected by X vibration
    const DE = new Float32Array(length);
    // FE (Fan End) - primarily affected by Y vibration  
    const FE = new Float32Array(length);
    // BA (Base Accelerometer) - combination of all
    const BA = new Float32Array(length);
    
    for (let i = 0; i < length; i++) {
      DE[i] = vibrationX[i % vibrationX.length] + 0.1 * Math.random();
      FE[i] = vibrationY[i % vibrationY.length] + 0.1 * Math.random();
      BA[i] = (vibrationX[i % vibrationX.length] + 
               vibrationY[i % vibrationY.length] + 
               vibrationZ[i % vibrationZ.length]) / 3 + 0.05 * Math.random();
    }
    
    return { DE, FE, BA };
  }, []);

  // Generate environmental signals from sensor readings
  const generateEnvironmentalSignals = useCallback((
    temperature: number[],
    pressure: number[],
    humidity: number[]
  ): EnvironmentalChannels => {
    const length = 1024;
    
    return {
      temperature: Float32Array.from({ length }, (_, i) => 
        temperature[i % temperature.length] || 25 + Math.random() * 5),
      pressure: Float32Array.from({ length }, (_, i) => 
        pressure[i % pressure.length] || 100 + Math.random() * 10),
      humidity: Float32Array.from({ length }, (_, i) => 
        humidity[i % humidity.length] || 50 + Math.random() * 20)
    };
  }, []);

  // Create causal metadata from intervention parameters
  const createCausalMetadata = useCallback((
    interventions: Partial<InterventionMetadata>[] = [],
    temperature: number = 25,
    workingLoad: number = 0.5,
    instrumentalVariables: number[] = []
  ): CausalMetadata => {
    const fullInterventions: InterventionMetadata[] = interventions.map(iv => ({
      amplitude: iv.amplitude ?? 0,
      startTime: iv.startTime ?? 0,
      endTime: iv.endTime ?? 1,
      interventionType: iv.interventionType ?? 'load_change',
      slope: iv.slope ?? 0
    }));
    
    return {
      interventions: fullInterventions,
      confounders: { temperature, workingLoad },
      instrumentalVariables: instrumentalVariables.length > 0 
        ? instrumentalVariables 
        : [0.5, 0.3, 0.2, 0.1, 0]
    };
  }, []);

  // Run inference
  const runInference = useCallback(async (
    input: EnhancedCVGGInput
  ): Promise<InferenceResult | null> => {
    if (!modelRef.current || !modelState.isBuilt) {
      console.warn('[useEnhancedCVGG] Model not ready');
      return null;
    }
    
    setModelState(prev => ({ ...prev, mode: 'inference' }));
    
    const startTime = performance.now();
    
    try {
      const output = await modelRef.current.forward(input);
      
      const logitsData = await output.classificationLogits.data();
      const logitsArray = Array.from(logitsData);
      const maxIdx = logitsArray.indexOf(Math.max(...logitsArray));
      const confidence = logitsArray[maxIdx];
      
      const embeddingData = await output.embeddings.data();
      const embeddingArray = Array.from(embeddingData);
      const embeddingNorm = Math.sqrt(embeddingArray.reduce((a, b) => a + b * b, 0));
      const anomalyScore = 1 - Math.exp(-embeddingNorm / 10);
      
      const processingTimeMs = performance.now() - startTime;
      
      setModelState(prev => ({ ...prev, mode: 'idle' }));
      
      return {
        classification: {
          label: maxIdx,
          confidence,
          className: CLASS_NAMES[maxIdx] || 'Unknown'
        },
        causalEffects: output.causalEffects,
        anomalyScore,
        processingTimeMs
      };
    } catch (error) {
      console.error('[useEnhancedCVGG] Inference error:', error);
      setModelState(prev => ({ ...prev, mode: 'idle' }));
      return null;
    }
  }, [modelState.isBuilt]);

  // Training loop with combined loss and actual gradient updates
  // Uses optimizer.minimize() for proper gradient tracking
  const train = useCallback(async (
    samples: TrainingSample[],
    config: TrainingConfig = DEFAULT_TRAINING_CONFIG
  ): Promise<boolean> => {
    // Check the actual model ref, not the state (which may be stale)
    if (!modelRef.current) {
      console.warn('[useEnhancedCVGG] Model not ready for training - no model ref');
      return false;
    }
    
    // Ensure model is built
    if (!modelRef.current.getConfig()) {
      console.warn('[useEnhancedCVGG] Model not configured');
      return false;
    }
    
    console.log('[useEnhancedCVGG] Train called, model exists:', !!modelRef.current);
    
    abortControllerRef.current = new AbortController();
    
    setModelState(prev => ({ ...prev, mode: 'training' }));
    setTrainingProgress({
      epoch: 0,
      totalEpochs: config.epochs,
      loss: 0,
      classificationLoss: 0,
      causalLoss: 0,
      accuracy: 0,
      isTraining: true
    });
    setTrainingHistory([]);
    
    const { epochs, batchSize, learningRate, classificationWeight, causalWeight } = config;
    const numBatches = Math.ceil(samples.length / batchSize);
    
    console.log(`[CVGG] Starting training: ${samples.length} samples, ${epochs} epochs, batch size ${batchSize}`);
    console.log(`[CVGG] Total batches per epoch: ${numBatches}`);
    
    // Create optimizer with appropriate learning rate
    const optimizer = tf.train.adam(learningRate, 0.9, 0.999, 1e-7);
    
    try {
      for (let epoch = 0; epoch < epochs; epoch++) {
        if (abortControllerRef.current.signal.aborted) {
          console.log('[CVGG] Training aborted by user');
          break;
        }
        
        const epochStartTime = performance.now();
        let epochLoss = 0;
        let epochClassLoss = 0;
        let epochCausalLoss = 0;
        let correctPredictions = 0;
        let totalSamples = 0;
        
        // Shuffle samples
        const shuffled = [...samples].sort(() => Math.random() - 0.5);
        
        console.log(`[CVGG] Epoch ${epoch + 1}/${epochs} starting...`);
        
        // Process in batches
        for (let batchIdx = 0; batchIdx < numBatches; batchIdx++) {
          if (abortControllerRef.current.signal.aborted) break;
          
          const batchStart = batchIdx * batchSize;
          const batchEnd = Math.min(batchStart + batchSize, shuffled.length);
          const batchSamples = shuffled.slice(batchStart, batchEnd);
          
          // Process each sample in batch
          let batchLoss = 0;
          let batchClassLoss = 0;
          let batchCausalLoss = 0;
          
          for (const sample of batchSamples) {
            try {
              // Use trainStep which properly handles gradients via optimizer.minimize()
              const { lossValue, classLossValue, causalLossValue } = 
                modelRef.current!.trainStep(
                  optimizer,
                  sample.input,
                  sample.classLabel,
                  sample.observedOutcome,
                  sample.treatmentIndicator,
                  classificationWeight,
                  causalWeight,
                  CLASS_NAMES.length
                );
              
              batchLoss += lossValue;
              batchClassLoss += classLossValue;
              batchCausalLoss += causalLossValue;
              
              // Check accuracy
              const output = await modelRef.current!.forward(sample.input);
              const predictions = await output.classificationLogits.data();
              const predictionsArray = Array.from(predictions);
              const predictedClass = predictionsArray.indexOf(Math.max(...predictionsArray));
              if (predictedClass === sample.classLabel) correctPredictions++;
              totalSamples++;
            } catch (sampleError) {
              console.warn(`[CVGG] Error processing sample:`, sampleError);
              totalSamples++;
            }
          }
          
          epochLoss += batchLoss;
          epochClassLoss += batchClassLoss;
          epochCausalLoss += batchCausalLoss;
          
          // Log batch progress
          const batchAvgLoss = batchSamples.length > 0 ? batchLoss / batchSamples.length : 0;
          console.log(`[CVGG] Epoch ${epoch + 1} - Batch ${batchIdx + 1}/${numBatches} - Loss: ${batchAvgLoss.toFixed(4)}`);
          
          // CRITICAL: Yield to UI thread after each batch to prevent freezing
          await tf.nextFrame();
        }
        
        // Calculate epoch metrics
        const avgLoss = totalSamples > 0 ? epochLoss / totalSamples : 0;
        const avgClassLoss = totalSamples > 0 ? epochClassLoss / totalSamples : 0;
        const avgCausalLoss = totalSamples > 0 ? epochCausalLoss / totalSamples : 0;
        const accuracy = totalSamples > 0 ? correctPredictions / totalSamples : 0;
        const epochTime = ((performance.now() - epochStartTime) / 1000).toFixed(1);
        
        // Update progress
        setTrainingProgress({
          epoch: epoch + 1,
          totalEpochs: epochs,
          loss: avgLoss,
          classificationLoss: avgClassLoss,
          causalLoss: avgCausalLoss,
          accuracy,
          isTraining: true
        });
        
        setTrainingHistory(prev => [...prev, {
          epoch: epoch + 1,
          loss: avgLoss,
          accuracy
        }]);
        
        console.log(`[CVGG] Epoch ${epoch + 1}/${epochs} complete in ${epochTime}s - Loss: ${avgLoss.toFixed(4)}, Accuracy: ${(accuracy * 100).toFixed(1)}%`);
        
        // Yield to UI between epochs
        await tf.nextFrame();
      }
      
      optimizer.dispose();
      setTrainingProgress(prev => ({ ...prev, isTraining: false }));
      setModelState(prev => ({ ...prev, mode: 'idle' }));
      
      console.log('[CVGG] Training completed successfully');
      return true;
    } catch (error) {
      console.error('[CVGG] Training error:', error);
      optimizer.dispose();
      setTrainingProgress(prev => ({ ...prev, isTraining: false }));
      setModelState(prev => ({ ...prev, mode: 'idle' }));
      return false;
    }
  }, []);

  // Stop training
  const stopTraining = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  // Generate synthetic training samples with better class discrimination
  const generateSyntheticSamples = useCallback((count: number): TrainingSample[] => {
    const samples: TrainingSample[] = [];
    const samplesPerClass = Math.ceil(count / CLASS_NAMES.length);
    
    // Fault signatures for each class (more discriminative patterns)
    const faultSignatures = [
      { freqMultiplier: 1.0, amplitude: 1.0, modulation: 0, harmonics: 1 },      // Normal
      { freqMultiplier: 3.56, amplitude: 1.5, modulation: 0.3, harmonics: 3 },   // Inner Race
      { freqMultiplier: 2.35, amplitude: 1.3, modulation: 0.2, harmonics: 2 },   // Outer Race
      { freqMultiplier: 1.94, amplitude: 1.8, modulation: 0.4, harmonics: 4 },   // Ball Fault
      { freqMultiplier: 0.38, amplitude: 1.2, modulation: 0.5, harmonics: 2 },   // Cage Fault
      { freqMultiplier: 2.0, amplitude: 1.4, modulation: 0.1, harmonics: 2 },    // Misalignment
      { freqMultiplier: 1.0, amplitude: 2.0, modulation: 0.6, harmonics: 1 },    // Unbalance
      { freqMultiplier: 0.5, amplitude: 1.6, modulation: 0.7, harmonics: 3 },    // Looseness
      { freqMultiplier: 4.0, amplitude: 1.9, modulation: 0.3, harmonics: 5 },    // Rubbing
      { freqMultiplier: 2.5, amplitude: 2.2, modulation: 0.5, harmonics: 4 },    // Composite
    ];
    
    for (let classLabel = 0; classLabel < CLASS_NAMES.length; classLabel++) {
      const signature = faultSignatures[classLabel];
      
      for (let s = 0; s < samplesPerClass && samples.length < count; s++) {
        const baseFreq = 29.2; // CWRU motor shaft frequency (29.2 Hz at 1750 RPM)
        const faultFreq = baseFreq * signature.freqMultiplier;
        const signalLength = 1024;
        const samplingRate = 12000; // 12kHz
        
        const vibX: number[] = [];
        const vibY: number[] = [];
        const vibZ: number[] = [];
        
        // Add slight random variation
        const noiseLevel = 0.1 + 0.1 * Math.random();
        const phaseOffset = Math.random() * 2 * Math.PI;
        
        for (let j = 0; j < signalLength; j++) {
          const t = j / samplingRate;
          
          // Base signal with class-specific characteristics
          let xSig = signature.amplitude * Math.sin(2 * Math.PI * faultFreq * t + phaseOffset);
          let ySig = signature.amplitude * 0.8 * Math.cos(2 * Math.PI * faultFreq * t + phaseOffset);
          let zSig = signature.amplitude * 0.6 * Math.sin(2 * Math.PI * faultFreq * t + phaseOffset + Math.PI / 3);
          
          // Add harmonics (characteristic of bearing faults)
          for (let h = 2; h <= signature.harmonics; h++) {
            const harmAmp = signature.amplitude / (h * 1.5);
            xSig += harmAmp * Math.sin(2 * Math.PI * faultFreq * h * t);
            ySig += harmAmp * 0.7 * Math.cos(2 * Math.PI * faultFreq * h * t);
          }
          
          // Add amplitude modulation (characteristic of rotating machinery faults)
          const modEnvelope = 1 + signature.modulation * Math.sin(2 * Math.PI * baseFreq * t);
          xSig *= modEnvelope;
          ySig *= modEnvelope;
          zSig *= modEnvelope;
          
          // Add noise
          vibX.push(xSig + noiseLevel * (Math.random() - 0.5));
          vibY.push(ySig + noiseLevel * (Math.random() - 0.5));
          vibZ.push(zSig + noiseLevel * (Math.random() - 0.5));
        }
        
        const cwruSignals = generateCWRUSignals(vibX, vibY, vibZ);
        
        // Class-correlated environmental conditions
        const temperature = 25 + classLabel * 3 + Math.random() * 5;
        const pressure = 100 + (classLabel > 5 ? 10 : 0) + Math.random() * 5;
        const humidity = 50 + (classLabel % 3) * 10 + Math.random() * 10;
        
        const environmentalSignals = generateEnvironmentalSignals(
          Array(signalLength).fill(temperature),
          Array(signalLength).fill(pressure),
          Array(signalLength).fill(humidity)
        );
        
        // Treatment indicator correlated with fault severity
        const treatmentIndicator = classLabel > 0 ? (Math.random() > 0.3 ? 1 : 0) : 0;
        const faultSeverity = classLabel > 0 ? 0.3 + 0.7 * (classLabel / 9) : 0;
        const observedOutcome = treatmentIndicator * faultSeverity + 0.1 * Math.random();
        
        samples.push({
          input: {
            cwruSignals,
            environmentalSignals,
            causalMetadata: createCausalMetadata(
              treatmentIndicator > 0 ? [{ 
                amplitude: 0.3 + 0.5 * faultSeverity, 
                interventionType: 'load_change',
                startTime: 0,
                endTime: 1,
                slope: 0.1
              }] : [],
              temperature,
              0.3 + 0.5 * faultSeverity
            )
          },
          classLabel,
          observedOutcome,
          treatmentIndicator
        });
      }
    }
    
    // Shuffle the samples
    return samples.sort(() => Math.random() - 0.5);
  }, [generateCWRUSignals, generateEnvironmentalSignals, createCausalMetadata]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Get model summary
  const getModelSummary = useCallback((): string => {
    if (!modelRef.current) return 'Model not initialized';
    return modelRef.current.getArchitectureSummary();
  }, []);

  // Reset model
  const resetModel = useCallback(() => {
    resetEnhancedCausalVGG();
    modelRef.current = null;
    setModelState({
      isBuilt: false,
      isLoading: false,
      totalParams: 0,
      mode: 'idle'
    });
    setTrainingProgress({
      epoch: 0,
      totalEpochs: 0,
      loss: 0,
      classificationLoss: 0,
      causalLoss: 0,
      accuracy: 0,
      isTraining: false
    });
    setTrainingHistory([]);
  }, []);

  return {
    // State
    modelState,
    trainingProgress,
    trainingHistory,
    classNames: CLASS_NAMES,
    
    // Actions
    initializeModel,
    runInference,
    train,
    stopTraining,
    resetModel,
    
    // Utilities
    processRockImage,
    generateCWRUSignals,
    generateEnvironmentalSignals,
    createCausalMetadata,
    generateSyntheticSamples,
    getModelSummary,
    
    // Optimized defaults
    DEFAULT_SAMPLE_COUNT,
    DEFAULT_TRAINING_CONFIG
  };
}
