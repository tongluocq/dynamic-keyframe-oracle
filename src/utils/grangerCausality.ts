import { SensorReading } from '@/types/industrial';

interface GrangerResult {
  cause: string;
  effect: string;
  fStatistic: number;
  pValue: number;
  strength: number;
  lag: number;
}

interface TimeSeriesData {
  [sensorId: string]: number[];
}

export class GrangerCausality {
  private data: TimeSeriesData = {};
  private maxLag: number = 5;
  private minSamples: number = 50;

  constructor(maxLag: number = 5) {
    this.maxLag = maxLag;
  }

  addData(readings: SensorReading[]): void {
    readings.forEach(reading => {
      if (!this.data[reading.sensorId]) {
        this.data[reading.sensorId] = [];
      }
      this.data[reading.sensorId].push(reading.value);
    });

    // Keep only recent data to maintain performance
    Object.keys(this.data).forEach(sensorId => {
      if (this.data[sensorId].length > 1000) {
        this.data[sensorId] = this.data[sensorId].slice(-1000);
      }
    });
  }

  testGrangerCausality(cause: string, effect: string, lag: number = 1): GrangerResult | null {
    const causeData = this.data[cause];
    const effectData = this.data[effect];

    if (!causeData || !effectData || 
        causeData.length < this.minSamples || 
        effectData.length < this.minSamples) {
      return null;
    }

    const minLength = Math.min(causeData.length, effectData.length);
    const alignedCause = causeData.slice(-minLength);
    const alignedEffect = effectData.slice(-minLength);

    try {
      // Restricted model: effect predicted by its own past values
      const restrictedSSR = this.calculateSSR(alignedEffect, lag, []);
      
      // Unrestricted model: effect predicted by its own past + cause's past
      const unrestrictedSSR = this.calculateSSR(alignedEffect, lag, alignedCause);

      if (restrictedSSR <= unrestrictedSSR) {
        return {
          cause,
          effect,
          fStatistic: 0,
          pValue: 1,
          strength: 0,
          lag
        };
      }

      // Calculate F-statistic
      const n = minLength - lag;
      const fStatistic = ((restrictedSSR - unrestrictedSSR) / lag) / 
                        (unrestrictedSSR / (n - 2 * lag - 1));

      // Approximate p-value using F-distribution approximation
      const pValue = this.approximateFTest(fStatistic, lag, n - 2 * lag - 1);
      
      // Calculate strength as normalized effect size
      const strength = Math.min((restrictedSSR - unrestrictedSSR) / restrictedSSR, 1);

      return {
        cause,
        effect,
        fStatistic,
        pValue,
        strength,
        lag
      };
    } catch (error) {
      console.warn(`Granger causality test failed for ${cause} -> ${effect}:`, error);
      return null;
    }
  }

  discoverAllCausalRelations(): GrangerResult[] {
    const results: GrangerResult[] = [];
    const sensors = Object.keys(this.data);

    for (let i = 0; i < sensors.length; i++) {
      for (let j = 0; j < sensors.length; j++) {
        if (i !== j) {
          for (let lag = 1; lag <= this.maxLag; lag++) {
            const result = this.testGrangerCausality(sensors[i], sensors[j], lag);
            if (result && result.pValue < 0.05 && result.strength > 0.1) {
              results.push(result);
            }
          }
        }
      }
    }

    return results.sort((a, b) => b.strength - a.strength);
  }

  private calculateSSR(y: number[], lag: number, x: number[] = []): number {
    const n = y.length;
    if (n <= lag) return Infinity;

    // Build design matrix
    const X: number[][] = [];
    const Y: number[] = [];

    for (let i = lag; i < n; i++) {
      const row: number[] = [1]; // intercept
      
      // Add lagged y values
      for (let l = 1; l <= lag; l++) {
        row.push(y[i - l]);
      }
      
      // Add lagged x values if provided
      if (x.length > 0) {
        for (let l = 1; l <= lag; l++) {
          row.push(x[i - l]);
        }
      }
      
      X.push(row);
      Y.push(y[i]);
    }

    // Ordinary Least Squares
    const beta = this.solveOLS(X, Y);
    if (!beta) return Infinity;

    // Calculate residuals and SSR
    let ssr = 0;
    for (let i = 0; i < X.length; i++) {
      const predicted = X[i].reduce((sum, xi, j) => sum + xi * beta[j], 0);
      const residual = Y[i] - predicted;
      ssr += residual * residual;
    }

    return ssr;
  }

  private solveOLS(X: number[][], y: number[]): number[] | null {
    try {
      // X'X
      const XtX = this.matrixMultiply(this.transpose(X), X);
      
      // X'y
      const Xty = this.vectorMultiply(this.transpose(X), y);
      
      // (X'X)^-1 * X'y
      const XtXInv = this.matrixInverse(XtX);
      if (!XtXInv) return null;
      
      return this.vectorMultiply(XtXInv, Xty);
    } catch (error) {
      return null;
    }
  }

  private transpose(matrix: number[][]): number[][] {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const result: number[][] = [];
    
    for (let j = 0; j < cols; j++) {
      result[j] = [];
      for (let i = 0; i < rows; i++) {
        result[j][i] = matrix[i][j];
      }
    }
    
    return result;
  }

  private matrixMultiply(A: number[][], B: number[][]): number[][] {
    const rowsA = A.length;
    const colsA = A[0].length;
    const colsB = B[0].length;
    const result: number[][] = [];
    
    for (let i = 0; i < rowsA; i++) {
      result[i] = [];
      for (let j = 0; j < colsB; j++) {
        let sum = 0;
        for (let k = 0; k < colsA; k++) {
          sum += A[i][k] * B[k][j];
        }
        result[i][j] = sum;
      }
    }
    
    return result;
  }

  private vectorMultiply(matrix: number[][], vector: number[]): number[] {
    const result: number[] = [];
    for (let i = 0; i < matrix.length; i++) {
      let sum = 0;
      for (let j = 0; j < vector.length; j++) {
        sum += matrix[i][j] * vector[j];
      }
      result[i] = sum;
    }
    return result;
  }

  private matrixInverse(matrix: number[][]): number[][] | null {
    const n = matrix.length;
    const identity: number[][] = [];
    const augmented: number[][] = [];
    
    // Create augmented matrix [A | I]
    for (let i = 0; i < n; i++) {
      identity[i] = new Array(n).fill(0);
      identity[i][i] = 1;
      augmented[i] = [...matrix[i], ...identity[i]];
    }
    
    // Gaussian elimination
    for (let i = 0; i < n; i++) {
      // Find pivot
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
          maxRow = k;
        }
      }
      
      // Swap rows
      [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
      
      // Check for singular matrix
      if (Math.abs(augmented[i][i]) < 1e-10) {
        return null;
      }
      
      // Make diagonal element 1
      const pivot = augmented[i][i];
      for (let j = 0; j < 2 * n; j++) {
        augmented[i][j] /= pivot;
      }
      
      // Eliminate column
      for (let k = 0; k < n; k++) {
        if (k !== i) {
          const factor = augmented[k][i];
          for (let j = 0; j < 2 * n; j++) {
            augmented[k][j] -= factor * augmented[i][j];
          }
        }
      }
    }
    
    // Extract inverse matrix
    const inverse: number[][] = [];
    for (let i = 0; i < n; i++) {
      inverse[i] = augmented[i].slice(n);
    }
    
    return inverse;
  }

  private approximateFTest(fStat: number, df1: number, df2: number): number {
    // Simple approximation for F-test p-value
    // In practice, you'd use a proper F-distribution implementation
    if (fStat < 1) return 1;
    if (fStat > 10) return 0.001;
    
    // Rough approximation
    return Math.exp(-fStat / 2);
  }

  reset(): void {
    this.data = {};
  }

  getStoredData(): TimeSeriesData {
    return { ...this.data };
  }
}
