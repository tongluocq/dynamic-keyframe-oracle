
import { SensorReading, CausalRelation } from '@/types/industrial';

// Base Neural Network Layer Interface
interface Layer {
  forward(input: number[]): number[];
}

// Peter-Clark Algorithm Layer for Causal Discovery
class PCAlgorithmLayer implements Layer {
  private correlationThreshold: number = 0.1;
  private independenceThreshold: number = 0.05;

  forward(input: number[]): number[] {
    // PC Algorithm implementation as a neural layer
    // Input: flattened correlation matrix
    // Output: causal adjacency matrix
    const n = Math.sqrt(input.length);
    const correlationMatrix = this.reshapeToMatrix(input, n);
    const causalMatrix = this.applyCausalInference(correlationMatrix);
    return this.flattenMatrix(causalMatrix);
  }

  private reshapeToMatrix(input: number[], size: number): number[][] {
    const matrix: number[][] = [];
    for (let i = 0; i < size; i++) {
      matrix[i] = input.slice(i * size, (i + 1) * size);
    }
    return matrix;
  }

  private applyCausalInference(correlationMatrix: number[][]): number[][] {
    const n = correlationMatrix.length;
    const causalMatrix = Array(n).fill(0).map(() => Array(n).fill(0));
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i !== j && Math.abs(correlationMatrix[i][j]) > this.correlationThreshold) {
          // Simplified causal direction inference
          causalMatrix[i][j] = correlationMatrix[i][j] > 0 ? 1 : -1;
        }
      }
    }
    return causalMatrix;
  }

  private flattenMatrix(matrix: number[][]): number[] {
    return matrix.flat();
  }
}

// Pearson Correlation Layer
class PearsonCorrelationLayer implements Layer {
  forward(input: number[]): number[] {
    // Input: sensor readings matrix (flattened)
    // Output: correlation coefficients
    const sensorCount = Math.sqrt(input.length);
    const correlations: number[] = [];
    
    for (let i = 0; i < sensorCount; i++) {
      for (let j = i + 1; j < sensorCount; j++) {
        const correlation = this.calculateCorrelation(
          input.slice(i * sensorCount, (i + 1) * sensorCount),
          input.slice(j * sensorCount, (j + 1) * sensorCount)
        );
        correlations.push(correlation);
      }
    }
    return correlations;
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    if (n === 0) return 0;
    
    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;
    
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
}

// Modified VGG Layer for 1D Sensor Data
class ModifiedVGGLayer implements Layer {
  private weights: number[][];
  private biases: number[];
  private kernelSize: number;
  private stride: number;

  constructor(inputSize: number, outputSize: number, kernelSize: number = 3, stride: number = 1) {
    this.kernelSize = kernelSize;
    this.stride = stride;
    this.weights = this.initializeWeights(inputSize, outputSize);
    this.biases = Array(outputSize).fill(0).map(() => Math.random() * 0.1);
  }

  private initializeWeights(inputSize: number, outputSize: number): number[][] {
    const weights: number[][] = [];
    for (let i = 0; i < outputSize; i++) {
      weights[i] = Array(this.kernelSize).fill(0).map(() => Math.random() * 0.1 - 0.05);
    }
    return weights;
  }

  forward(input: number[]): number[] {
    // 1D Convolution operation
    const output: number[] = [];
    const outputLength = Math.floor((input.length - this.kernelSize) / this.stride) + 1;
    
    for (let i = 0; i < outputLength; i++) {
      let sum = 0;
      for (let j = 0; j < this.kernelSize; j++) {
        sum += input[i * this.stride + j] * this.weights[0][j];
      }
      output.push(Math.max(0, sum + this.biases[0])); // ReLU activation
    }
    return output;
  }
}

// VGG-based Neural Network for Causal Analysis and Fault Detection
export class VGGCausalNetwork {
  private correlationLayer: PearsonCorrelationLayer;
  private pcLayer: PCAlgorithmLayer;
  private vggLayers: ModifiedVGGLayer[];
  private classificationLayer: ModifiedVGGLayer;

  constructor() {
    this.correlationLayer = new PearsonCorrelationLayer();
    this.pcLayer = new PCAlgorithmLayer();
    this.vggLayers = [
      new ModifiedVGGLayer(100, 64, 3, 1), // First VGG block
      new ModifiedVGGLayer(64, 32, 3, 1),  // Second VGG block
      new ModifiedVGGLayer(32, 16, 3, 1)   // Third VGG block
    ];
    this.classificationLayer = new ModifiedVGGLayer(16, 2, 1, 1); // Binary classification
  }

  public processData(sensorReadings: SensorReading[]): {
    causalRelations: number[];
    faultPrediction: number[];
    confidence: number;
  } {
    // Step 1: Convert sensor readings to matrix format
    const sensorMatrix = this.preprocessSensorData(sensorReadings);
    
    // Step 2: Calculate correlations
    const correlations = this.correlationLayer.forward(sensorMatrix);
    
    // Step 3: Apply PC Algorithm for causal discovery
    const causalMatrix = this.pcLayer.forward(correlations);
    
    // Step 4: Process through VGG backbone for feature extraction
    let features = this.convert1Dto2D(sensorMatrix);
    for (const layer of this.vggLayers) {
      features = layer.forward(features);
    }
    
    // Step 5: Classification for fault detection
    const faultPrediction = this.classificationLayer.forward(features);
    
    // Step 6: Calculate confidence
    const confidence = this.calculateConfidence(faultPrediction);
    
    return {
      causalRelations: causalMatrix,
      faultPrediction: faultPrediction,
      confidence: confidence
    };
  }

  private preprocessSensorData(readings: SensorReading[]): number[] {
    const sensorGroups = new Map<string, number[]>();
    
    readings.forEach(reading => {
      if (!sensorGroups.has(reading.sensorId)) {
        sensorGroups.set(reading.sensorId, []);
      }
      sensorGroups.get(reading.sensorId)!.push(reading.value);
    });
    
    return Array.from(sensorGroups.values()).flat();
  }

  private convert1Dto2D(data: number[]): number[] {
    // Convert 1D sensor data to 2D-like representation for VGG processing
    const windowSize = 10;
    const stride = 5;
    const result: number[] = [];
    
    for (let i = 0; i <= data.length - windowSize; i += stride) {
      const window = data.slice(i, i + windowSize);
      result.push(...window);
    }
    
    return result;
  }

  private calculateConfidence(prediction: number[]): number {
    const max = Math.max(...prediction);
    const sum = prediction.reduce((a, b) => a + b, 0);
    return sum > 0 ? max / sum : 0;
  }
}

// Graph Neural Network Node
interface GraphNode {
  id: string;
  features: number[];
  domain: string;
}

// Graph Neural Network Edge
interface GraphEdge {
  source: string;
  target: string;
  weight: number;
}

// Graph Neural Network for Causal Analysis
export class GraphCausalNetwork {
  private nodeEmbeddingSize: number = 64;
  private hiddenSize: number = 32;
  private outputSize: number = 16;

  constructor() {}

  public processGraph(
    nodes: GraphNode[], 
    edges: GraphEdge[], 
    sensorReadings: SensorReading[]
  ): {
    causalGraph: Map<string, CausalRelation[]>;
    anomalyScores: Array<{sensor: string, score: number}>;
    globalHealthScore: number;
  } {
    // Step 1: Initialize node embeddings
    const nodeEmbeddings = this.initializeNodeEmbeddings(nodes);
    
    // Step 2: Message passing for causal discovery
    const updatedEmbeddings = this.messagePassingCausal(nodeEmbeddings, edges);
    
    // Step 3: Graph attention for anomaly detection
    const attentionScores = this.computeAttention(updatedEmbeddings, edges);
    
    // Step 4: Generate causal relationships
    const causalGraph = this.generateCausalGraph(updatedEmbeddings, edges);
    
    // Step 5: Anomaly detection
    const anomalyScores = this.detectAnomalies(attentionScores, sensorReadings);
    
    // Step 6: Global health assessment
    const globalHealthScore = this.calculateGlobalHealth(anomalyScores);
    
    return {
      causalGraph,
      anomalyScores,
      globalHealthScore
    };
  }

  private initializeNodeEmbeddings(nodes: GraphNode[]): Map<string, number[]> {
    const embeddings = new Map<string, number[]>();
    
    nodes.forEach(node => {
      // Random initialization with domain-specific bias
      const embedding = Array(this.nodeEmbeddingSize).fill(0).map(() => Math.random() * 0.1);
      
      // Add domain-specific features
      const domainBias = this.getDomainBias(node.domain);
      embedding.forEach((val, idx) => {
        embedding[idx] = val + domainBias[idx % domainBias.length];
      });
      
      embeddings.set(node.id, embedding);
    });
    
    return embeddings;
  }

  private getDomainBias(domain: string): number[] {
    const biases = {
      'hydraulic': [0.1, 0.2, 0.1, 0.0],
      'mechanical': [0.2, 0.1, 0.3, 0.1],
      'thermal': [0.0, 0.3, 0.1, 0.2],
      'electrical': [0.3, 0.0, 0.2, 0.1],
      'cutting': [0.1, 0.1, 0.2, 0.3]
    };
    
    return biases[domain as keyof typeof biases] || [0.1, 0.1, 0.1, 0.1];
  }

  private messagePassingCausal(
    embeddings: Map<string, number[]>, 
    edges: GraphEdge[]
  ): Map<string, number[]> {
    const updatedEmbeddings = new Map<string, number[]>();
    
    embeddings.forEach((embedding, nodeId) => {
      const neighbors = edges.filter(e => e.source === nodeId || e.target === nodeId);
      let aggregatedMessage = [...embedding];
      
      neighbors.forEach(edge => {
        const neighborId = edge.source === nodeId ? edge.target : edge.source;
        const neighborEmbedding = embeddings.get(neighborId);
        
        if (neighborEmbedding) {
          // Weighted aggregation
          aggregatedMessage.forEach((val, idx) => {
            aggregatedMessage[idx] += neighborEmbedding[idx] * edge.weight * 0.1;
          });
        }
      });
      
      // Apply activation function
      aggregatedMessage = aggregatedMessage.map(val => Math.tanh(val));
      updatedEmbeddings.set(nodeId, aggregatedMessage);
    });
    
    return updatedEmbeddings;
  }

  private computeAttention(
    embeddings: Map<string, number[]>, 
    edges: GraphEdge[]
  ): Map<string, number> {
    const attentionScores = new Map<string, number>();
    
    embeddings.forEach((embedding, nodeId) => {
      // Compute attention score based on embedding magnitude and connectivity
      const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
      const connectivity = edges.filter(e => e.source === nodeId || e.target === nodeId).length;
      
      const attention = magnitude * Math.log(1 + connectivity);
      attentionScores.set(nodeId, attention);
    });
    
    return attentionScores;
  }

  private generateCausalGraph(
    embeddings: Map<string, number[]>, 
    edges: GraphEdge[]
  ): Map<string, CausalRelation[]> {
    const causalGraph = new Map<string, CausalRelation[]>();
    
    embeddings.forEach((embedding, nodeId) => {
      const relations: CausalRelation[] = [];
      
      edges.forEach(edge => {
        if (edge.source === nodeId) {
          const targetEmbedding = embeddings.get(edge.target);
          if (targetEmbedding) {
            // Calculate causal strength based on embedding similarity
            const similarity = this.cosineSimilarity(embedding, targetEmbedding);
            
            relations.push({
              cause: nodeId,
              effect: edge.target,
              strength: Math.abs(similarity),
              lag: edge.weight * 10, // Convert weight to time lag
              domain_bridge: this.isDomainBridge(nodeId, edge.target)
            });
          }
        }
      });
      
      if (relations.length > 0) {
        causalGraph.set(nodeId, relations);
      }
    });
    
    return causalGraph;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, idx) => sum + val * b[idx], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    
    return magnitudeA > 0 && magnitudeB > 0 ? dotProduct / (magnitudeA * magnitudeB) : 0;
  }

  private isDomainBridge(source: string, target: string): boolean {
    const sourceDomain = source.split('_')[0];
    const targetDomain = target.split('_')[0];
    return sourceDomain !== targetDomain;
  }

  private detectAnomalies(
    attentionScores: Map<string, number>, 
    sensorReadings: SensorReading[]
  ): Array<{sensor: string, score: number}> {
    const anomalies: Array<{sensor: string, score: number}> = [];
    
    // Calculate statistical thresholds
    const scores = Array.from(attentionScores.values());
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const std = Math.sqrt(scores.reduce((sum, val) => sum + (val - mean) ** 2, 0) / scores.length);
    const threshold = mean + 2 * std; // 2-sigma threshold
    
    attentionScores.forEach((score, nodeId) => {
      if (score > threshold) {
        anomalies.push({
          sensor: nodeId,
          score: (score - mean) / std // Normalized anomaly score
        });
      }
    });
    
    return anomalies;
  }

  private calculateGlobalHealth(anomalies: Array<{sensor: string, score: number}>): number {
    if (anomalies.length === 0) return 1.0;
    
    const totalAnomalyScore = anomalies.reduce((sum, anomaly) => sum + anomaly.score, 0);
    const avgAnomalyScore = totalAnomalyScore / anomalies.length;
    
    // Convert to health score (0-1, where 1 is perfect health)
    return Math.max(0, 1 - avgAnomalyScore / 5);
  }
}
