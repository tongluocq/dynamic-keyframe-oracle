
import { SensorReading, CausalRelation } from '@/types/industrial';
import { NeuralCausalEncoder } from './neuralCausalEncoder';

export class CausalDiscovery {
  private data: SensorReading[] = [];
  private causalGraph: Map<string, CausalRelation[]> = new Map();
  private neuralEncoder: NeuralCausalEncoder | null = null;
  private useNeuralMode: boolean = false;

  public addData(readings: SensorReading[]): void {
    this.data.push(...readings);
  }

  /**
   * Enable neural-augmented causal discovery mode
   */
  public async enableNeuralMode(): Promise<void> {
    if (!this.neuralEncoder) {
      this.neuralEncoder = new NeuralCausalEncoder();
      await this.neuralEncoder.buildModel();
    }
    this.useNeuralMode = true;
    console.log('Neural causal mode enabled');
  }

  /**
   * Disable neural mode and fall back to traditional PC algorithm
   */
  public disableNeuralMode(): void {
    this.useNeuralMode = false;
    console.log('Neural causal mode disabled');
  }

  /**
   * Get neural encoder for advanced operations
   */
  public getNeuralEncoder(): NeuralCausalEncoder | null {
    return this.neuralEncoder;
  }

  // Simplified PC Algorithm for causal discovery
  public discoverCausalStructure(alpha: number = 0.05): Map<string, CausalRelation[]> {
    const sensors = [...new Set(this.data.map(r => r.sensorId))];
    const correlations = this.calculateCorrelations(sensors);
    
    // Initialize fully connected graph
    const graph = new Map<string, Set<string>>();
    sensors.forEach(sensor => {
      graph.set(sensor, new Set(sensors.filter(s => s !== sensor)));
    });

    // Remove edges based on conditional independence
    this.removeIndependentEdges(graph, correlations, alpha);
    
    // Convert to causal relations
    this.causalGraph = this.convertToCausalRelations(graph, correlations);
    
    return this.causalGraph;
  }

  private calculateCorrelations(sensors: string[]): Map<string, Map<string, number>> {
    const correlations = new Map<string, Map<string, number>>();
    
    sensors.forEach(sensor1 => {
      const corr1 = new Map<string, number>();
      sensors.forEach(sensor2 => {
        if (sensor1 !== sensor2) {
          const data1 = this.data.filter(r => r.sensorId === sensor1).map(r => r.value);
          const data2 = this.data.filter(r => r.sensorId === sensor2).map(r => r.value);
          
          if (data1.length > 0 && data2.length > 0) {
            const correlation = this.pearsonCorrelation(data1, data2);
            corr1.set(sensor2, correlation);
          }
        }
      });
      correlations.set(sensor1, corr1);
    });
    
    return correlations;
  }

  private pearsonCorrelation(x: number[], y: number[]): number {
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

  private removeIndependentEdges(
    graph: Map<string, Set<string>>, 
    correlations: Map<string, Map<string, number>>, 
    alpha: number
  ): void {
    // Simplified independence test based on correlation threshold
    const threshold = 0.1; // Minimum correlation to maintain edge
    
    graph.forEach((neighbors, sensor) => {
      const toRemove: string[] = [];
      neighbors.forEach(neighbor => {
        const corr = correlations.get(sensor)?.get(neighbor) || 0;
        if (Math.abs(corr) < threshold) {
          toRemove.push(neighbor);
        }
      });
      
      toRemove.forEach(neighbor => neighbors.delete(neighbor));
    });
  }

  private convertToCausalRelations(
    graph: Map<string, Set<string>>, 
    correlations: Map<string, Map<string, number>>
  ): Map<string, CausalRelation[]> {
    const causalGraph = new Map<string, CausalRelation[]>();
    
    graph.forEach((neighbors, sensor) => {
      const relations: CausalRelation[] = [];
      neighbors.forEach(neighbor => {
        const correlation = correlations.get(sensor)?.get(neighbor) || 0;
        const strength = Math.abs(correlation);
        
        // Determine causality direction based on domain knowledge and temporal order
        const isDomainBridge = this.isDomainBridge(sensor, neighbor);
        
        relations.push({
          cause: sensor,
          effect: neighbor,
          strength: strength,
          lag: this.estimateTimeLag(sensor, neighbor),
          domain_bridge: isDomainBridge
        });
      });
      
      causalGraph.set(sensor, relations);
    });
    
    return causalGraph;
  }

  private isDomainBridge(sensor1: string, sensor2: string): boolean {
    // Simple heuristic based on sensor naming convention
    const domain1 = sensor1.split('_')[0];
    const domain2 = sensor2.split('_')[0];
    return domain1 !== domain2;
  }

  private estimateTimeLag(cause: string, effect: string): number {
    // Simplified lag estimation based on domain knowledge
    const domainLags = {
      'electrical_hydraulic': 0.5,
      'hydraulic_mechanical': 1.0,
      'mechanical_thermal': 2.0,
      'thermal_electrical': 1.5,
      'default': 0.1
    };
    
    const causeDomain = cause.split('_')[0];
    const effectDomain = effect.split('_')[0];
    const key = `${causeDomain}_${effectDomain}`;
    
    return domainLags[key as keyof typeof domainLags] || domainLags.default;
  }

  public getCausalGraph(): Map<string, CausalRelation[]> {
    return this.causalGraph;
  }

  // Interventional anomaly detection with optional neural mode
  public async detectCausalAnomalies(currentReadings: SensorReading[]): Promise<Array<{sensor: string, anomaly_score: number, causal_pathway?: string}>> {
    // Use neural encoder if enabled
    if (this.useNeuralMode && this.neuralEncoder) {
      const neuralAnomalies = await this.neuralEncoder.detectAnomalies(currentReadings);
      return neuralAnomalies;
    }
    
    // Fall back to traditional method
    const anomalies: Array<{sensor: string, anomaly_score: number}> = [];
    
    currentReadings.forEach(reading => {
      const expectedValue = this.predictFromCausalParents(reading.sensorId, currentReadings);
      const anomalyScore = Math.abs(reading.value - expectedValue) / Math.max(Math.abs(expectedValue), 1);
      
      if (anomalyScore > 0.3) { // Threshold for anomaly detection
        anomalies.push({
          sensor: reading.sensorId,
          anomaly_score: anomalyScore
        });
      }
    });
    
    return anomalies;
  }

  private predictFromCausalParents(sensorId: string, currentReadings: SensorReading[]): number {
    const causalParents = this.getCausalParents(sensorId);
    
    if (causalParents.length === 0) {
      // No causal parents, use historical average
      const historicalData = this.data.filter(r => r.sensorId === sensorId);
      return historicalData.reduce((sum, r) => sum + r.value, 0) / historicalData.length;
    }
    
    // Simple linear combination of causal parents
    let prediction = 0;
    let totalWeight = 0;
    
    causalParents.forEach(relation => {
      const parentReading = currentReadings.find(r => r.sensorId === relation.cause);
      if (parentReading) {
        prediction += parentReading.value * relation.strength;
        totalWeight += relation.strength;
      }
    });
    
    return totalWeight > 0 ? prediction / totalWeight : 0;
  }

  private getCausalParents(sensorId: string): CausalRelation[] {
    const parents: CausalRelation[] = [];
    
    this.causalGraph.forEach((relations, cause) => {
      relations.forEach(relation => {
        if (relation.effect === sensorId) {
          parents.push(relation);
        }
      });
    });
    
    return parents;
  }
}
