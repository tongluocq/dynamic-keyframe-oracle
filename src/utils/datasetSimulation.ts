/**
 * Dataset Simulation Methods
 * 
 * Three simulation approaches for CWRU-style bearing fault data:
 * 1. Sinusoidal Hash (original) — fast, deterministic, uniform distribution
 * 2. Autoregressive (AR) Process + Fault Impulse Injection — spectral realism
 * 3. Gaussian Process with Physics-Informed Kernel — correlated, smooth signals
 */

export type SimulationMethod = 'hash' | 'ar' | 'gp';

export interface DatasetRow {
  sample_id: string;
  cwru_de: number;
  cwru_fe: number;
  cwru_ba: number;
  env_temperature: number;
  env_pressure: number;
  env_humidity: number;
  rock_image: string;
  label: string;
}

export interface SimulationMethodInfo {
  id: SimulationMethod;
  name: string;
  shortName: string;
  description: string;
  formula: string;
  strengths: string[];
  limitations: string[];
}

export const SIMULATION_METHODS: SimulationMethodInfo[] = [
  {
    id: 'hash',
    name: 'Sinusoidal Hash PRNG',
    shortName: 'Hash PRNG',
    description:
      'Deterministic pseudo-random number generator using the fractional part of a sinusoidal function. Values are linearly scaled per channel with severity multipliers for fault classes.',
    formula: 'seed(i, k) = frac(sin(i·9301 + k·49297 + 12345) × 10⁴)',
    strengths: [
      'Fast and fully reproducible',
      'Zero external dependencies',
      'Deterministic across platforms',
    ],
    limitations: [
      'No temporal autocorrelation',
      'Uniform distribution (real noise is Gaussian)',
      'No cross-channel physics coupling',
    ],
  },
  {
    id: 'ar',
    name: 'Autoregressive (AR) Process + Fault Impulse Injection',
    shortName: 'AR + Impulse',
    description:
      'Models each channel as an AR(2) process with Gaussian innovation noise. Fault conditions inject periodic exponentially-decaying impulses at characteristic bearing defect frequencies (BPFO/BPFI), producing spectral signatures consistent with real vibration data.',
    formula: 'xₜ = Σφₖxₜ₋ₖ + εₜ + A·Σh(t − nT_f),  εₜ ~ N(0, σ²)',
    strengths: [
      'Spectral realism via AR coefficients',
      'Fault-frequency impulse signatures (BPFO/BPFI)',
      'Gaussian noise distribution matches real sensors',
    ],
    limitations: [
      'Requires careful AR coefficient tuning',
      'Impulse shape is simplified (exponential decay)',
      'Limited cross-channel coupling',
    ],
  },
  {
    id: 'gp',
    name: 'Gaussian Process with Physics-Informed Kernel',
    shortName: 'GP Kernel',
    description:
      'Uses a composite covariance kernel combining Matérn smoothness, periodic shaft-rotation structure, and white noise. Fault conditions add a modulated periodic component at the defect frequency, producing correlated, physically-plausible signal trajectories.',
    formula: 'k(t,t\') = k_Matérn + k_periodic(f_r) + σ²_n·δ(t,t\')',
    strengths: [
      'Correlated, smooth signals with proper spectral density',
      'Physics-informed kernel encodes shaft rotation',
      'Supports cross-channel covariance modeling',
    ],
    limitations: [
      'Higher computational cost (O(n³) naive)',
      'Kernel hyperparameters need domain calibration',
      'Approximation needed for large sample counts',
    ],
  },
];

const ROCK_IMAGE_FILES = [
  'rock_granite_001.png',
  'rock_sandstone_002.png',
  'rock_limestone_003.png',
  'rock_basalt_004.png',
  'rock_marble_005.png',
  'rock_shale_006.png',
  'rock_quartzite_007.png',
  'rock_gneiss_008.png',
  'rock_slate_009.png',
  'rock_dolomite_010.png',
];

const LABELS = [
  'Normal', 'IR_007', 'IR_014', 'IR_021',
  'OR_007', 'OR_014', 'OR_021',
  'BA_007', 'BA_014', 'BA_021',
];

// ─── Method 1: Sinusoidal Hash PRNG ──────────────────────────────────────────

function hashSeed(i: number, offset: number): number {
  const x = Math.sin(i * 9301 + offset * 49297 + 12345) * 10000;
  return x - Math.floor(x);
}

function generateHash(): DatasetRow[] {
  return Array.from({ length: 10 }, (_, i) => {
    const labelIdx = i % LABELS.length;
    const isFault = labelIdx > 0;
    const sf = isFault ? (1 + (labelIdx % 3) * 0.5) : 1.0;

    const cwru_de = parseFloat(((0.03 + hashSeed(i, 1) * 0.08) * sf + (isFault ? hashSeed(i, 10) * 0.35 : 0)).toFixed(4));
    const cwru_fe = parseFloat(((0.02 + hashSeed(i, 2) * 0.05) * sf + (isFault ? hashSeed(i, 11) * 0.2 : 0)).toFixed(4));
    const cwru_ba = parseFloat(((0.01 + hashSeed(i, 3) * 0.04) * sf + (isFault ? hashSeed(i, 12) * 0.12 : 0)).toFixed(4));

    const env_temperature = parseFloat((22.0 + hashSeed(i, 4) * 18.0 + (isFault ? 8.0 : 0)).toFixed(1));
    const env_pressure = parseFloat((100.5 + hashSeed(i, 5) * 4.0 - (isFault ? 1.5 : 0)).toFixed(2));
    const env_humidity = parseFloat((40.0 + hashSeed(i, 6) * 30.0).toFixed(1));

    return {
      sample_id: `S${String(i + 1).padStart(4, '0')}`,
      cwru_de, cwru_fe, cwru_ba,
      env_temperature, env_pressure, env_humidity,
      rock_image: ROCK_IMAGE_FILES[i],
      label: LABELS[labelIdx],
    };
  });
}

// ─── Method 2: AR(2) + Fault Impulse Injection ──────────────────────────────

/** Seeded Gaussian via Box-Muller using sinusoidal hash */
function gaussianNoise(i: number, ch: number): number {
  const u1 = Math.max(1e-10, hashSeed(i * 7 + ch, 100));
  const u2 = hashSeed(i * 7 + ch, 200);
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/** Bearing characteristic frequencies (normalised to shaft freq = 1) */
const BPFO = 3.585; // Ball Pass Frequency Outer Race (typical 6205 bearing)
const BPFI = 5.415; // Ball Pass Frequency Inner Race

function generateAR(): DatasetRow[] {
  // AR(2) coefficients tuned for mild oscillatory behaviour
  const phi1 = 0.6;
  const phi2 = -0.25;
  const sigma_base = 0.02; // innovation noise std-dev

  return Array.from({ length: 10 }, (_, i) => {
    const labelIdx = i % LABELS.length;
    const isFault = labelIdx > 0;
    const faultType = LABELS[labelIdx];
    const severityLevel = isFault ? (1 + (labelIdx % 3)) : 0; // 1,2,3

    // Determine fault frequency based on type
    const isOuterRace = faultType.startsWith('OR');
    const isInnerRace = faultType.startsWith('IR');
    const faultFreq = isOuterRace ? BPFO : isInnerRace ? BPFI : BPFO;

    // Generate AR(2) process for each channel (simulate 64 steps, take RMS)
    const arProcess = (chOffset: number, baseAmp: number): number => {
      let x_prev2 = 0;
      let x_prev1 = 0;
      let sumSq = 0;
      const nSteps = 64;
      for (let t = 0; t < nSteps; t++) {
        const noise = gaussianNoise(i * 64 + t, chOffset) * sigma_base;
        // Fault impulse: exponentially decaying periodic hits
        let impulse = 0;
        if (isFault) {
          const phase = (t / nSteps) * faultFreq * 2 * Math.PI;
          const envelope = Math.exp(-((t % Math.round(nSteps / faultFreq)) / (nSteps * 0.1)));
          impulse = severityLevel * 0.05 * envelope * Math.sin(phase);
        }
        const x = phi1 * x_prev1 + phi2 * x_prev2 + noise + impulse;
        sumSq += x * x;
        x_prev2 = x_prev1;
        x_prev1 = x;
      }
      return parseFloat((baseAmp + Math.sqrt(sumSq / nSteps)).toFixed(4));
    };

    const cwru_de = arProcess(1, 0.03);
    const cwru_fe = arProcess(2, 0.02);
    const cwru_ba = arProcess(3, 0.01);

    // Environmental: AR(1) for temporal smoothness
    const envAR = (ch: number, base: number, range: number, faultShift: number): number => {
      const alpha = 0.8;
      let x = gaussianNoise(i, ch + 50) * range * 0.3;
      for (let t = 1; t < 8; t++) {
        x = alpha * x + (1 - alpha) * gaussianNoise(i * 8 + t, ch + 50) * range * 0.3;
      }
      return parseFloat((base + range * 0.5 + x + (isFault ? faultShift : 0)).toFixed(
        ch === 5 ? 2 : 1
      ));
    };

    return {
      sample_id: `S${String(i + 1).padStart(4, '0')}`,
      cwru_de, cwru_fe, cwru_ba,
      env_temperature: envAR(4, 22.0, 18.0, 8.0),
      env_pressure: envAR(5, 100.5, 4.0, -1.5),
      env_humidity: envAR(6, 40.0, 30.0, 0),
      rock_image: ROCK_IMAGE_FILES[i],
      label: LABELS[labelIdx],
    };
  });
}

// ─── Method 3: Gaussian Process with Physics-Informed Kernel ─────────────────

/** Matérn 3/2 kernel */
function matern32(d: number, lengthScale: number): number {
  const r = (Math.sqrt(3) * Math.abs(d)) / lengthScale;
  return (1 + r) * Math.exp(-r);
}

/** Periodic kernel (shaft rotation) */
function periodicKernel(d: number, period: number, lengthScale: number): number {
  const sinVal = Math.sin(Math.PI * d / period);
  return Math.exp(-2 * (sinVal * sinVal) / (lengthScale * lengthScale));
}

/** 
 * Simplified GP sampling: build covariance matrix for n points, 
 * then do Cholesky-like decomposition and multiply by standard normals.
 * For 10 samples this is very fast.
 */
function sampleGP(
  n: number,
  chIdx: number,
  sampleOffset: number,
  isFault: boolean,
  faultFreqNorm: number,
  severityLevel: number,
  signalVariance: number,
  noiseVariance: number,
): number[] {
  // Build covariance matrix
  const K: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  const shaftPeriod = 1.0; // normalised
  const lengthScale = 0.5;
  const periodicLS = 0.3;
  const faultPeriodicLS = 0.2;

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const d = (i - j) / n;
      let k = signalVariance * (
        0.5 * matern32(d, lengthScale) +
        0.3 * periodicKernel(d, shaftPeriod, periodicLS)
      );
      // Fault: add periodic component at defect frequency
      if (isFault) {
        k += severityLevel * 0.1 * periodicKernel(d, 1.0 / faultFreqNorm, faultPeriodicLS);
      }
      if (i === j) k += noiseVariance;
      K[i][j] = k;
    }
  }

  // Simple Cholesky decomposition (K = L·Lᵀ)
  const L: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = 0;
      for (let k = 0; k < j; k++) sum += L[i][k] * L[j][k];
      if (i === j) {
        L[i][j] = Math.sqrt(Math.max(1e-10, K[i][i] - sum));
      } else {
        L[i][j] = (K[i][j] - sum) / (L[j][j] || 1e-10);
      }
    }
  }

  // z ~ N(0, I), then x = L·z gives x ~ N(0, K)
  const z = Array.from({ length: n }, (_, idx) => gaussianNoise(sampleOffset + idx, chIdx));
  const samples = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      samples[i] += L[i][j] * z[j];
    }
  }
  return samples;
}

function generateGP(): DatasetRow[] {
  const n = 10;

  // Generate correlated vibration channels via GP
  const deRaw = sampleGP(n, 1, 0, false, BPFO, 0, 0.005, 0.001);
  const feRaw = sampleGP(n, 2, 100, false, BPFO, 0, 0.003, 0.0005);
  const baRaw = sampleGP(n, 3, 200, false, BPFO, 0, 0.002, 0.0003);

  return Array.from({ length: n }, (_, i) => {
    const labelIdx = i % LABELS.length;
    const isFault = labelIdx > 0;
    const faultType = LABELS[labelIdx];
    const severityLevel = isFault ? (1 + (labelIdx % 3)) : 0;
    const faultFreq = faultType.startsWith('OR') ? BPFO : faultType.startsWith('IR') ? BPFI : BPFO;

    // For fault samples, generate with fault kernel; for normal, use baseline
    let cwru_de: number, cwru_fe: number, cwru_ba: number;
    if (isFault) {
      const faultDE = sampleGP(8, 1, i * 50, true, faultFreq, severityLevel, 0.005, 0.001);
      const faultFE = sampleGP(8, 2, i * 50 + 10, true, faultFreq, severityLevel, 0.003, 0.0005);
      const faultBA = sampleGP(8, 3, i * 50 + 20, true, faultFreq, severityLevel, 0.002, 0.0003);
      // RMS of GP trajectory
      const rms = (arr: number[]) => Math.sqrt(arr.reduce((s, v) => s + v * v, 0) / arr.length);
      cwru_de = parseFloat((0.03 + rms(faultDE)).toFixed(4));
      cwru_fe = parseFloat((0.02 + rms(faultFE)).toFixed(4));
      cwru_ba = parseFloat((0.01 + rms(faultBA)).toFixed(4));
    } else {
      cwru_de = parseFloat((0.03 + Math.abs(deRaw[i])).toFixed(4));
      cwru_fe = parseFloat((0.02 + Math.abs(feRaw[i])).toFixed(4));
      cwru_ba = parseFloat((0.01 + Math.abs(baRaw[i])).toFixed(4));
    }

    // Environmental via GP-like smooth process
    const envGP = (ch: number, base: number, range: number, faultShift: number): number => {
      const raw = sampleGP(4, ch + 10, i * 30, false, 1, 0, range * 0.01, range * 0.002);
      const val = base + range * 0.5 + raw[0] + (isFault ? faultShift : 0);
      return parseFloat(val.toFixed(ch === 5 ? 2 : 1));
    };

    return {
      sample_id: `S${String(i + 1).padStart(4, '0')}`,
      cwru_de, cwru_fe, cwru_ba,
      env_temperature: envGP(4, 22.0, 18.0, 8.0),
      env_pressure: envGP(5, 100.5, 4.0, -1.5),
      env_humidity: envGP(6, 40.0, 30.0, 0),
      rock_image: ROCK_IMAGE_FILES[i],
      label: LABELS[labelIdx],
    };
  });
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function generateDataset(method: SimulationMethod): DatasetRow[] {
  switch (method) {
    case 'ar': return generateAR();
    case 'gp': return generateGP();
    case 'hash':
    default: return generateHash();
  }
}

export function getMethodInfo(method: SimulationMethod): SimulationMethodInfo {
  return SIMULATION_METHODS.find(m => m.id === method) || SIMULATION_METHODS[0];
}
