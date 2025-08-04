import { SensorReading } from '@/types/industrial';

interface TransferEntropyResult {
  source: string;
  target: string;
  transferEntropy: number;
  normalizedTE: number;
  significance: number;
  lag: number;
}

interface BinnedData {
  [sensorId: string]: number[];
}

export class TransferEntropy {
  private data: { [sensorId: string]: number[] } = {};
  private bins: number = 10;
  private maxLag: number = 5;
  private minSamples: number = 100;

  constructor(bins: number = 10, maxLag: number = 5) {
    this.bins = bins;
    this.maxLag = maxLag;
  }

  addData(readings: SensorReading[]): void {
    readings.forEach(reading => {
      if (!this.data[reading.sensorId]) {
        this.data[reading.sensorId] = [];
      }
      this.data[reading.sensorId].push(reading.value);
    });

    // Keep only recent data
    Object.keys(this.data).forEach(sensorId => {
      if (this.data[sensorId].length > 1000) {
        this.data[sensorId] = this.data[sensorId].slice(-1000);
      }
    });
  }

  calculateTransferEntropy(source: string, target: string, lag: number = 1): TransferEntropyResult | null {
    const sourceData = this.data[source];
    const targetData = this.data[target];

    if (!sourceData || !targetData || 
        sourceData.length < this.minSamples || 
        targetData.length < this.minSamples) {
      return null;
    }

    const minLength = Math.min(sourceData.length, targetData.length);
    const alignedSource = sourceData.slice(-minLength);
    const alignedTarget = targetData.slice(-minLength);

    try {
      // Discretize data
      const binnedSource = this.discretizeData(alignedSource);
      const binnedTarget = this.discretizeData(alignedTarget);

      // Calculate Transfer Entropy: TE(X->Y) = H(Y_t|Y_{t-1}) - H(Y_t|Y_{t-1}, X_{t-lag})
      const te = this.computeTE(binnedSource, binnedTarget, lag);
      
      // Calculate significance using surrogate data
      const significance = this.calculateSignificance(binnedSource, binnedTarget, lag, te);
      
      // Normalize by target entropy
      const targetEntropy = this.calculateEntropy(binnedTarget.slice(lag));
      const normalizedTE = targetEntropy > 0 ? te / targetEntropy : 0;

      return {
        source,
        target,
        transferEntropy: te,
        normalizedTE,
        significance,
        lag
      };
    } catch (error) {
      console.warn(`Transfer entropy calculation failed for ${source} -> ${target}:`, error);
      return null;
    }
  }

  discoverAllInformationFlows(): TransferEntropyResult[] {
    const results: TransferEntropyResult[] = [];
    const sensors = Object.keys(this.data);

    for (let i = 0; i < sensors.length; i++) {
      for (let j = 0; j < sensors.length; j++) {
        if (i !== j) {
          for (let lag = 1; lag <= this.maxLag; lag++) {
            const result = this.calculateTransferEntropy(sensors[i], sensors[j], lag);
            if (result && result.significance > 0.95 && result.normalizedTE > 0.05) {
              results.push(result);
            }
          }
        }
      }
    }

    return results.sort((a, b) => b.normalizedTE - a.normalizedTE);
  }

  private discretizeData(data: number[]): number[] {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;
    
    if (range === 0) {
      return new Array(data.length).fill(0);
    }

    return data.map(value => {
      const bin = Math.floor(((value - min) / range) * (this.bins - 1));
      return Math.min(bin, this.bins - 1);
    });
  }

  private computeTE(source: number[], target: number[], lag: number): number {
    const n = target.length - lag;
    if (n <= 0) return 0;

    // Build state vectors
    const targetPresent = target.slice(lag);
    const targetPast = target.slice(lag - 1, -1);
    const sourcePast = source.slice(0, n);

    // Calculate joint and conditional entropies
    const H_Y_t_given_Y_past = this.calculateConditionalEntropy(targetPresent, targetPast);
    const H_Y_t_given_Y_past_X_past = this.calculateConditionalEntropy3(
      targetPresent, targetPast, sourcePast
    );

    return H_Y_t_given_Y_past - H_Y_t_given_Y_past_X_past;
  }

  private calculateEntropy(data: number[]): number {
    const counts = new Map<number, number>();
    
    data.forEach(value => {
      counts.set(value, (counts.get(value) || 0) + 1);
    });

    const total = data.length;
    let entropy = 0;

    counts.forEach(count => {
      const p = count / total;
      if (p > 0) {
        entropy -= p * Math.log2(p);
      }
    });

    return entropy;
  }

  private calculateConditionalEntropy(Y: number[], X: number[]): number {
    if (Y.length !== X.length) return 0;

    const jointCounts = new Map<string, number>();
    const marginalCounts = new Map<number, number>();

    for (let i = 0; i < Y.length; i++) {
      const joint = `${Y[i]},${X[i]}`;
      jointCounts.set(joint, (jointCounts.get(joint) || 0) + 1);
      marginalCounts.set(X[i], (marginalCounts.get(X[i]) || 0) + 1);
    }

    const total = Y.length;
    let conditionalEntropy = 0;

    jointCounts.forEach((jointCount, joint) => {
      const [y, x] = joint.split(',').map(Number);
      const marginalCount = marginalCounts.get(x) || 0;
      
      if (marginalCount > 0) {
        const pJoint = jointCount / total;
        const pConditional = jointCount / marginalCount;
        
        if (pConditional > 0) {
          conditionalEntropy -= pJoint * Math.log2(pConditional);
        }
      }
    });

    return conditionalEntropy;
  }

  private calculateConditionalEntropy3(Y: number[], X1: number[], X2: number[]): number {
    if (Y.length !== X1.length || Y.length !== X2.length) return 0;

    const jointCounts = new Map<string, number>();
    const marginalCounts = new Map<string, number>();

    for (let i = 0; i < Y.length; i++) {
      const joint = `${Y[i]},${X1[i]},${X2[i]}`;
      const marginal = `${X1[i]},${X2[i]}`;
      
      jointCounts.set(joint, (jointCounts.get(joint) || 0) + 1);
      marginalCounts.set(marginal, (marginalCounts.get(marginal) || 0) + 1);
    }

    const total = Y.length;
    let conditionalEntropy = 0;

    jointCounts.forEach((jointCount, joint) => {
      const parts = joint.split(',').map(Number);
      const marginal = `${parts[1]},${parts[2]}`;
      const marginalCount = marginalCounts.get(marginal) || 0;
      
      if (marginalCount > 0) {
        const pJoint = jointCount / total;
        const pConditional = jointCount / marginalCount;
        
        if (pConditional > 0) {
          conditionalEntropy -= pJoint * Math.log2(pConditional);
        }
      }
    });

    return conditionalEntropy;
  }

  private calculateSignificance(
    source: number[], 
    target: number[], 
    lag: number, 
    originalTE: number
  ): number {
    const numSurrogates = 50;
    let higherCount = 0;

    for (let i = 0; i < numSurrogates; i++) {
      // Create surrogate by shuffling source data
      const shuffledSource = this.shuffleArray([...source]);
      const surrogateTE = this.computeTE(shuffledSource, target, lag);
      
      if (surrogateTE >= originalTE) {
        higherCount++;
      }
    }

    return 1 - (higherCount / numSurrogates);
  }

  private shuffleArray(array: number[]): number[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  reset(): void {
    this.data = {};
  }

  getStoredData(): { [sensorId: string]: number[] } {
    return { ...this.data };
  }

  // Utility method to calculate mutual information
  calculateMutualInformation(source: string, target: string): number {
    const sourceData = this.data[source];
    const targetData = this.data[target];

    if (!sourceData || !targetData) return 0;

    const minLength = Math.min(sourceData.length, targetData.length);
    const binnedSource = this.discretizeData(sourceData.slice(-minLength));
    const binnedTarget = this.discretizeData(targetData.slice(-minLength));

    const entropySource = this.calculateEntropy(binnedSource);
    const entropyTarget = this.calculateEntropy(binnedTarget);
    const jointEntropy = this.calculateJointEntropy(binnedSource, binnedTarget);

    return entropySource + entropyTarget - jointEntropy;
  }

  private calculateJointEntropy(X: number[], Y: number[]): number {
    if (X.length !== Y.length) return 0;

    const jointCounts = new Map<string, number>();
    
    for (let i = 0; i < X.length; i++) {
      const joint = `${X[i]},${Y[i]}`;
      jointCounts.set(joint, (jointCounts.get(joint) || 0) + 1);
    }

    const total = X.length;
    let entropy = 0;

    jointCounts.forEach(count => {
      const p = count / total;
      if (p > 0) {
        entropy -= p * Math.log2(p);
      }
    });

    return entropy;
  }
}
