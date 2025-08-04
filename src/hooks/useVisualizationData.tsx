import { useState, useEffect, useCallback } from 'react';
import { SystemState, SensorReading, ActiveFailure, CausalRelation } from '@/types/industrial';

interface VisualizationDataStore {
  systemStateHistory: Array<{ timestamp: Date; systemState: SystemState }>;
  sensorDataHistory: Array<{ timestamp: Date; sensorData: SensorReading[] }>;
  failureHistory: Array<{ timestamp: Date; failures: ActiveFailure[] }>;
  causalGraphHistory: Array<{ timestamp: Date; graph: Map<string, CausalRelation[]> }>;
  classificationHistory: Array<{ timestamp: Date; logits: number[] }>;
  causalEffectHistory: Array<{ timestamp: Date; effect: number }>;
  maxHistoryLength: number;
}

interface UseVisualizationDataOptions {
  maxHistoryLength?: number;
  enableDataCollection?: boolean;
}

export const useVisualizationData = (options: UseVisualizationDataOptions = {}) => {
  const { maxHistoryLength = 100, enableDataCollection = true } = options;

  const [dataStore, setDataStore] = useState<VisualizationDataStore>({
    systemStateHistory: [],
    sensorDataHistory: [],
    failureHistory: [],
    causalGraphHistory: [],
    classificationHistory: [],
    causalEffectHistory: [],
    maxHistoryLength
  });

  // Function to trim history arrays to max length
  const trimHistory = useCallback(<T,>(array: T[], maxLength: number): T[] => {
    return array.length > maxLength ? array.slice(-maxLength) : array;
  }, []);

  // Add new system state to history
  const addSystemState = useCallback((systemState: SystemState) => {
    if (!enableDataCollection) return;
    
    setDataStore(prev => ({
      ...prev,
      systemStateHistory: trimHistory([
        ...prev.systemStateHistory,
        { timestamp: new Date(), systemState }
      ], maxHistoryLength)
    }));
  }, [enableDataCollection, maxHistoryLength, trimHistory]);

  // Add new sensor data to history
  const addSensorData = useCallback((sensorData: SensorReading[]) => {
    if (!enableDataCollection) return;
    
    setDataStore(prev => ({
      ...prev,
      sensorDataHistory: trimHistory([
        ...prev.sensorDataHistory,
        { timestamp: new Date(), sensorData }
      ], maxHistoryLength)
    }));
  }, [enableDataCollection, maxHistoryLength, trimHistory]);

  // Add new failure data to history
  const addFailures = useCallback((failures: ActiveFailure[]) => {
    if (!enableDataCollection) return;
    
    setDataStore(prev => ({
      ...prev,
      failureHistory: trimHistory([
        ...prev.failureHistory,
        { timestamp: new Date(), failures }
      ], maxHistoryLength)
    }));
  }, [enableDataCollection, maxHistoryLength, trimHistory]);

  // Add new causal graph to history
  const addCausalGraph = useCallback((graph: Map<string, CausalRelation[]>) => {
    if (!enableDataCollection) return;
    
    setDataStore(prev => ({
      ...prev,
      causalGraphHistory: trimHistory([
        ...prev.causalGraphHistory,
        { timestamp: new Date(), graph: new Map(graph) }
      ], maxHistoryLength)
    }));
  }, [enableDataCollection, maxHistoryLength, trimHistory]);

  // Add new classification result to history
  const addClassificationResult = useCallback((logits: number[]) => {
    if (!enableDataCollection) return;
    
    setDataStore(prev => ({
      ...prev,
      classificationHistory: trimHistory([
        ...prev.classificationHistory,
        { timestamp: new Date(), logits: [...logits] }
      ], maxHistoryLength)
    }));
  }, [enableDataCollection, maxHistoryLength, trimHistory]);

  // Add new causal effect to history
  const addCausalEffect = useCallback((effect: number) => {
    if (!enableDataCollection) return;
    
    setDataStore(prev => ({
      ...prev,
      causalEffectHistory: trimHistory([
        ...prev.causalEffectHistory,
        { timestamp: new Date(), effect }
      ], maxHistoryLength)
    }));
  }, [enableDataCollection, maxHistoryLength, trimHistory]);

  // Clear all history
  const clearHistory = useCallback(() => {
    setDataStore(prev => ({
      ...prev,
      systemStateHistory: [],
      sensorDataHistory: [],
      failureHistory: [],
      causalGraphHistory: [],
      classificationHistory: [],
      causalEffectHistory: []
    }));
  }, []);

  // Get latest data points
  const getLatestData = useCallback(() => {
    return {
      systemState: dataStore.systemStateHistory[dataStore.systemStateHistory.length - 1]?.systemState,
      sensorData: dataStore.sensorDataHistory[dataStore.sensorDataHistory.length - 1]?.sensorData || [],
      failures: dataStore.failureHistory[dataStore.failureHistory.length - 1]?.failures || [],
      causalGraph: dataStore.causalGraphHistory[dataStore.causalGraphHistory.length - 1]?.graph || new Map(),
      classificationLogits: dataStore.classificationHistory[dataStore.classificationHistory.length - 1]?.logits || [],
      causalEffect: dataStore.causalEffectHistory[dataStore.causalEffectHistory.length - 1]?.effect || 0
    };
  }, [dataStore]);

  // Get data within time window
  const getDataInTimeWindow = useCallback((windowMinutes: number = 30) => {
    const cutoffTime = new Date(Date.now() - windowMinutes * 60 * 1000);
    
    return {
      systemStateHistory: dataStore.systemStateHistory.filter(item => item.timestamp > cutoffTime),
      sensorDataHistory: dataStore.sensorDataHistory.filter(item => item.timestamp > cutoffTime),
      failureHistory: dataStore.failureHistory.filter(item => item.timestamp > cutoffTime),
      causalGraphHistory: dataStore.causalGraphHistory.filter(item => item.timestamp > cutoffTime),
      classificationHistory: dataStore.classificationHistory.filter(item => item.timestamp > cutoffTime),
      causalEffectHistory: dataStore.causalEffectHistory.filter(item => item.timestamp > cutoffTime)
    };
  }, [dataStore]);

  // Generate synthetic training metrics for demonstration
  const generateTrainingMetrics = useCallback(() => {
    const epochs = 20;
    return Array.from({ length: epochs }, (_, i) => ({
      epoch: i + 1,
      train_loss: 0.9 - (i * 0.03) + Math.random() * 0.1,
      val_loss: 0.95 - (i * 0.025) + Math.random() * 0.1,
      train_acc: 0.5 + (i * 0.02) + Math.random() * 0.05,
      val_acc: 0.48 + (i * 0.022) + Math.random() * 0.05,
      train_causal_effect: Math.sin(i * 0.3) * 0.4 + Math.random() * 0.1,
      val_causal_effect: Math.sin(i * 0.3) * 0.35 + Math.random() * 0.08,
    }));
  }, []);

  // Get statistics about collected data
  const getDataStatistics = useCallback(() => {
    return {
      totalDataPoints: dataStore.systemStateHistory.length,
      dataCollectionDuration: dataStore.systemStateHistory.length > 0 
        ? Date.now() - dataStore.systemStateHistory[0].timestamp.getTime()
        : 0,
      averageFailures: dataStore.failureHistory.length > 0
        ? dataStore.failureHistory.reduce((sum, item) => sum + item.failures.length, 0) / dataStore.failureHistory.length
        : 0,
      causalRelationships: dataStore.causalGraphHistory.length > 0
        ? Array.from(dataStore.causalGraphHistory[dataStore.causalGraphHistory.length - 1].graph.values())
            .reduce((sum, relations) => sum + relations.length, 0)
        : 0
    };
  }, [dataStore]);

  return {
    // Data access
    dataStore,
    getLatestData,
    getDataInTimeWindow,
    getDataStatistics,
    
    // Data modification
    addSystemState,
    addSensorData,
    addFailures,
    addCausalGraph,
    addClassificationResult,
    addCausalEffect,
    clearHistory,
    
    // Utilities
    generateTrainingMetrics,
    
    // Configuration
    enableDataCollection,
    maxHistoryLength
  };
};