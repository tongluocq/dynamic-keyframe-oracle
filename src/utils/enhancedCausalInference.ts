import { SensorReading, CausalRelation } from '@/types/industrial';
import { VGGCausalNetwork, GraphCausalNetwork } from './neuralNetworks';

export class EnhancedCausalInference {
  private vggNetwork: VGGCausalNetwork;
  private graphNetwork: GraphCausalNetwork;
  private historicalData: SensorReading[] = [];
  private windowSize: number = 100;

  constructor() {
    this.vggNetwork = new VGGCausalNetwork();
    this.graphNetwork = new GraphCausalNetwork();
  }

  public addData(readings: SensorReading[]): void {
    this.historicalData.push(...readings);
    // Keep only recent data
    if (this.historicalData.length > 1000) {
      this.historicalData = this.historicalData.slice(-1000);
    }
  }

  public analyzeWithVGG(currentReadings: SensorReading[]): {
    causalRelations: CausalRelation[];
    faultPrediction: 'normal' | 'fault';
    confidence: number;
  } {
    // Use recent historical data for analysis
    const analysisData = this.historicalData.slice(-this.windowSize);
    
    const result = this.vggNetwork.processData([...analysisData, ...currentReadings]);
    
    // Convert neural network output to causal relations
    const causalRelations = this.interpretVGGCausalOutput(result.causalRelations, currentReadings);
    
    // Interpret fault prediction
    const faultPrediction = result.faultPrediction[0] > result.faultPrediction[1] ? 'fault' : 'normal';
    
    return {
      causalRelations,
      faultPrediction,
      confidence: result.confidence
    };
  }

  public analyzeWithGraphNN(currentReadings: SensorReading[]): {
    causalGraph: Map<string, CausalRelation[]>;
    anomalies: Array<{sensor: string, anomaly_score: number}>;
    globalHealth: number;
  } {
    // Create graph structure from sensor data
    const { nodes, edges } = this.createGraphFromSensorData(currentReadings);
    
    const result = this.graphNetwork.processGraph(nodes, edges, currentReadings);
    
    // Convert anomaly scores to expected format
    const anomalies = result.anomalyScores.map(a => ({
      sensor: a.sensor,
      anomaly_score: Math.min(1, Math.max(0, a.score / 3)) // Normalize to 0-1
    }));
    
    return {
      causalGraph: result.causalGraph,
      anomalies,
      globalHealth: result.globalHealthScore
    };
  }

  public compareApproaches(currentReadings: SensorReading[]): {
    vggResults: ReturnType<EnhancedCausalInference['analyzeWithVGG']>;
    graphResults: ReturnType<EnhancedCausalInference['analyzeWithGraphNN']>;
    comparison: {
      agreement: number;
      recommendedApproach: 'vgg' | 'graph' | 'hybrid';
      reasoning: string;
    };
  } {
    const vggResults = this.analyzeWithVGG(currentReadings);
    const graphResults = this.analyzeWithGraphNN(currentReadings);
    
    // Calculate agreement between approaches
    const agreement = this.calculateAgreement(vggResults, graphResults);
    
    // Determine recommended approach
    const { recommendedApproach, reasoning } = this.determineRecommendation(
      vggResults, 
      graphResults, 
      agreement
    );
    
    return {
      vggResults,
      graphResults,
      comparison: {
        agreement,
        recommendedApproach,
        reasoning
      }
    };
  }

  private interpretVGGCausalOutput(output: number[], readings: SensorReading[]): CausalRelation[] {
    const relations: CausalRelation[] = [];
    const sensorIds = [...new Set(readings.map(r => r.sensorId))];
    const n = sensorIds.length;
    
    // Interpret the causal matrix output
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          const index = i * n + j;
          if (index < output.length && Math.abs(output[index]) > 0.3) {
            relations.push({
              cause: sensorIds[i],
              effect: sensorIds[j],
              strength: Math.abs(output[index]),
              lag: 0.1, // Default lag
              domain_bridge: this.isDomainBridge(sensorIds[i], sensorIds[j])
            });
          }
        }
      }
    }
    
    return relations;
  }

  private createGraphFromSensorData(readings: SensorReading[]): {
    nodes: Array<{id: string, features: number[], domain: string}>;
    edges: Array<{source: string, target: string, weight: number}>;
  } {
    const sensorGroups = new Map<string, SensorReading[]>();
    
    // Group readings by sensor
    readings.forEach(reading => {
      if (!sensorGroups.has(reading.sensorId)) {
        sensorGroups.set(reading.sensorId, []);
      }
      sensorGroups.get(reading.sensorId)!.push(reading);
    });
    
    // Create nodes
    const nodes = Array.from(sensorGroups.entries()).map(([sensorId, sensorReadings]) => ({
      id: sensorId,
      features: sensorReadings.map(r => r.value),
      domain: sensorReadings[0]?.domain || 'unknown'
    }));
    
    // Create edges based on correlation
    const edges: Array<{source: string, target: string, weight: number}> = [];
    const sensorIds = Array.from(sensorGroups.keys());
    
    for (let i = 0; i < sensorIds.length; i++) {
      for (let j = i + 1; j < sensorIds.length; j++) {
        const data1 = sensorGroups.get(sensorIds[i])!.map(r => r.value);
        const data2 = sensorGroups.get(sensorIds[j])!.map(r => r.value);
        
        const correlation = this.calculateCorrelation(data1, data2);
        if (Math.abs(correlation) > 0.1) {
          edges.push({
            source: sensorIds[i],
            target: sensorIds[j],
            weight: Math.abs(correlation)
          });
        }
      }
    }
    
    return { nodes, edges };
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    if (n === 0) return 0;
    
    const meanX = x.slice(0, n).reduce((a, b) => a + b, 0) / n;
    const meanY = y.slice(0, n).reduce((a, b) => a + b, 0) / n;
    
    let numerator = 0;
    let denomX = 0;
    let denomY = 0;
    
    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      numerator += dx * dy;
      denomX += dx * dx;
      denomY += dy * dy;
    }
    
    const denom = Math.sqrt(denomX * denomY);
    return denom === 0 ? 0 : numerator / denom;
  }

  private calculateAgreement(
    vggResults: ReturnType<EnhancedCausalInference['analyzeWithVGG']>,
    graphResults: ReturnType<EnhancedCausalInference['analyzeWithGraphNN']>
  ): number {
    // Compare fault detection agreement
    const faultAgreement = vggResults.faultPrediction === 'fault' ? 
      (1 - graphResults.globalHealth) : graphResults.globalHealth;
    
    // Compare causal relation count similarity
    const vggRelationCount = vggResults.causalRelations.length;
    const graphRelationCount = Array.from(graphResults.causalGraph.values())
      .reduce((sum, relations) => sum + relations.length, 0);
    
    const relationAgreement = vggRelationCount > 0 && graphRelationCount > 0 ?
      Math.min(vggRelationCount, graphRelationCount) / Math.max(vggRelationCount, graphRelationCount) : 0;
    
    return (faultAgreement + relationAgreement) / 2;
  }

  private determineRecommendation(
    vggResults: ReturnType<EnhancedCausalInference['analyzeWithVGG']>,
    graphResults: ReturnType<EnhancedCausalInference['analyzeWithGraphNN']>,
    agreement: number
  ): { recommendedApproach: 'vgg' | 'graph' | 'hybrid'; reasoning: string } {
    if (agreement > 0.8) {
      return {
        recommendedApproach: 'hybrid',
        reasoning: 'High agreement between approaches - use hybrid for maximum confidence'
      };
    }
    
    if (vggResults.confidence > 0.8 && graphResults.globalHealth < 0.5) {
      return {
        recommendedApproach: 'vgg',
        reasoning: 'VGG shows high confidence in fault detection'
      };
    }
    
    if (graphResults.anomalies.length > 3 && vggResults.confidence < 0.6) {
      return {
        recommendedApproach: 'graph',
        reasoning: 'Graph network detects multiple anomalies with better granularity'
      };
    }
    
    return {
      recommendedApproach: 'hybrid',
      reasoning: 'Mixed signals - hybrid approach recommended for comprehensive analysis'
    };
  }

  private isDomainBridge(sensor1: string, sensor2: string): boolean {
    const domain1 = sensor1.split('_')[0];
    const domain2 = sensor2.split('_')[0];
    return domain1 !== domain2;
  }
}
