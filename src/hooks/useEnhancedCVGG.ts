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

  // Training loop with combined loss
  const train = useCallback(async (
    samples: TrainingSample[],
    config: TrainingConfig
  ): Promise<boolean> => {
    if (!modelRef.current || !modelState.isBuilt) {
      console.warn('[useEnhancedCVGG] Model not ready for training');
      return false;
    }
    
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
    
    // Create optimizer
    const optimizer = tf.train.adam(learningRate);
    
    try {
      for (let epoch = 0; epoch < epochs; epoch++) {
        if (abortControllerRef.current.signal.aborted) {
          console.log('[useEnhancedCVGG] Training aborted');
          break;
        }
        
        let epochLoss = 0;
        let epochClassLoss = 0;
        let epochCausalLoss = 0;
        let correctPredictions = 0;
        let totalSamples = 0;
        
        // Shuffle samples
        const shuffled = [...samples].sort(() => Math.random() - 0.5);
        
        // Process in batches
        for (let batchStart = 0; batchStart < shuffled.length; batchStart += batchSize) {
          const batchEnd = Math.min(batchStart + batchSize, shuffled.length);
          const batchSamples = shuffled.slice(batchStart, batchEnd);
          
          for (const sample of batchSamples) {
            // Forward pass
            const output = await modelRef.current!.forward(sample.input);
            
            // Calculate losses synchronously
            const classLossValue = tf.tidy(() => {
              const classLabels = tf.tensor1d([sample.classLabel], 'int32');
              const oneHot = tf.oneHot(classLabels, CLASS_NAMES.length);
              const classLoss = tf.losses.softmaxCrossEntropy(oneHot, output.classificationLogits);
              return classLoss.dataSync()[0];
            });
            
            // Causal loss calculation
            const { ATE, directEffect, indirectEffect } = output.causalEffects;
            const totalEffectConstraint = Math.pow(ATE - (directEffect + indirectEffect), 2);
            const predictedOutcome = sample.treatmentIndicator * ATE;
            const outcomeError = Math.pow(sample.observedOutcome - predictedOutcome, 2);
            const causalLossValue = totalEffectConstraint + outcomeError;
            
            // Combined loss
            const lossValue = classificationWeight * classLossValue + causalWeight * causalLossValue;
            
            epochLoss += lossValue;
            epochClassLoss += classLossValue;
            epochCausalLoss += causalLossValue;
            
            // Check accuracy
            const predictions = await output.classificationLogits.data();
            const predictionsArray = Array.from(predictions);
            const predictedClass = predictionsArray.indexOf(Math.max(...predictionsArray));
            if (predictedClass === sample.classLabel) correctPredictions++;
            totalSamples++;
          }
        }
        
        // Calculate epoch metrics
        const avgLoss = epochLoss / totalSamples;
        const avgClassLoss = epochClassLoss / totalSamples;
        const avgCausalLoss = epochCausalLoss / totalSamples;
        const accuracy = correctPredictions / totalSamples;
        
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
        
        console.log(`[useEnhancedCVGG] Epoch ${epoch + 1}/${epochs} - Loss: ${avgLoss.toFixed(4)}, Accuracy: ${(accuracy * 100).toFixed(1)}%`);
        
        // Allow UI to update
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      setTrainingProgress(prev => ({ ...prev, isTraining: false }));
      setModelState(prev => ({ ...prev, mode: 'idle' }));
      
      return true;
    } catch (error) {
      console.error('[useEnhancedCVGG] Training error:', error);
      setTrainingProgress(prev => ({ ...prev, isTraining: false }));
      setModelState(prev => ({ ...prev, mode: 'idle' }));
      return false;
    }
  }, [modelState.isBuilt]);

  // Stop training
  const stopTraining = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  // Generate synthetic training samples
  const generateSyntheticSamples = useCallback((count: number): TrainingSample[] => {
    const samples: TrainingSample[] = [];
    
    for (let i = 0; i < count; i++) {
      const classLabel = Math.floor(Math.random() * CLASS_NAMES.length);
      
      // Generate synthetic vibration signals based on class
      const baseFreq = 10 + classLabel * 5;
      const signalLength = 1024;
      
      const vibX: number[] = [];
      const vibY: number[] = [];
      const vibZ: number[] = [];
      
      for (let j = 0; j < signalLength; j++) {
        const t = j / 1000;
        vibX.push(Math.sin(2 * Math.PI * baseFreq * t) + 0.5 * Math.random());
        vibY.push(Math.cos(2 * Math.PI * baseFreq * 0.8 * t) + 0.3 * Math.random());
        vibZ.push(Math.sin(2 * Math.PI * baseFreq * 1.2 * t + Math.PI / 4) + 0.4 * Math.random());
      }
      
      const cwruSignals = generateCWRUSignals(vibX, vibY, vibZ);
      
      const temperature = 20 + Math.random() * 30;
      const pressure = 90 + Math.random() * 20;
      const humidity = 40 + Math.random() * 40;
      
      const environmentalSignals = generateEnvironmentalSignals(
        Array(signalLength).fill(temperature),
        Array(signalLength).fill(pressure),
        Array(signalLength).fill(humidity)
      );
      
      const treatmentIndicator = Math.random() > 0.5 ? 1 : 0;
      const observedOutcome = treatmentIndicator * (0.5 + 0.5 * Math.random()) + 0.2 * Math.random();
      
      samples.push({
        input: {
          cwruSignals,
          environmentalSignals,
          causalMetadata: createCausalMetadata(
            treatmentIndicator > 0 ? [{ amplitude: 0.5, interventionType: 'load_change' }] : [],
            temperature,
            0.5 + 0.5 * Math.random()
          )
        },
        classLabel,
        observedOutcome,
        treatmentIndicator
      });
    }
    
    return samples;
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
    getModelSummary
  };
}
