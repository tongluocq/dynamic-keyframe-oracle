// Actual Float Value Examples for IMSCHM Causal Analysis
// These examples demonstrate concrete values for TBM device monitoring

// ============================================
// NEW: INPUT SIGNATURE INTERFACES
// ============================================

export interface SensorPattern {
  channel: string;
  pattern: string;
  normalRange: string;
  observedValue: string;
  anomalyLevel: 'none' | 'low' | 'medium' | 'high';
}

export interface RockImageFeature {
  feature: string;
  description: string;
}

export interface CausalMetadataState {
  activeInterventions: number;
  confounderLevel: string;
}

export interface InputSignature {
  sensorPatterns: SensorPattern[];
  rockImageFeatures: RockImageFeature[];
  causalMetadataState: CausalMetadataState;
}

// ============================================
// NEW: CAUSAL PATHWAY INTERFACE
// ============================================

export interface CausalPathwayStep {
  stage: string;
  component: string;
  input: string;
  output: string;
  transformation: string;
}

// ============================================
// NEW: VARIABLE INTERACTION INTERFACE
// ============================================

export interface VariableInteraction {
  from: string;
  to: string;
  mechanism: string;
  strength: number;
  direction: 'positive' | 'negative';
}

// ============================================
// ENHANCED CAUSAL EFFECT EXAMPLE INTERFACE
// ============================================

export interface CausalEffectExample {
  id: string;
  title: string;
  description: string;
  condition: 'normal' | 'fault';
  values: {
    ATE: number;
    CATE: number;
    directEffect: number;
    indirectEffect: number;
    confidence: number;
    pValue: number;
  };
  interpretation: string;
  tbmContext: string;
  // NEW: Enhanced fields for complete pathway explanation
  inputSignature: InputSignature;
  causalPathway: CausalPathwayStep[];
  variableInteractions: VariableInteraction[];
  // NEW: Why explanation connecting inputs to outputs
  whyExplanation: string;
}

export interface CounterfactualExample {
  id: string;
  title: string;
  command: string;
  intervention: {
    variable: string;
    fromValue: number;
    toValue: number;
    unit: string;
  };
  values: {
    baselineOutcome: number;
    counterfactualOutcome: number;
    causalEffect: number;
    directEffect: number;
    indirectEffect: number;
    confidence: number;
  };
  riskChange: 'increased' | 'decreased' | 'unchanged';
  interpretation: string;
  tbmContext: string;
}

export interface PrescriptiveExample {
  id: string;
  title: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  trigger: string;
  recommendation: string;
  values: {
    ATE: number;
    riskReduction: number;
    costSaving: number;
    downtimeAvoidance: number;
    confidence: number;
    directEffect: number;
    indirectEffect: number;
  };
  action: string;
  interpretation: string;
  tbmContext: string;
}

export interface DecisionMakingExample {
  id: string;
  title: string;
  context: string;
  prescriptiveInputs: {
    recommendations: Array<{
      action: string;
      score: number;
      riskReduction: number;
    }>;
  };
  decision: {
    selectedAction: string;
    executionCost: number;
    expectedRiskReduction: number;
    timeline: string;
    budget: number;
  };
  interpretation: string;
  tbmContext: string;
}

// ============================================
// CAUSAL INTERVENTION (do-CALCULUS) INTERFACE
// ============================================

export interface CausalInterventionExample {
  id: string;
  title: string;
  command: string;
  doCalculus: {
    notation: string;
    variable: string;
    targetValue: number;
    unit: string;
  };
  primaryEffects: Array<{
    variable: string;
    change: string;
    value: number;
  }>;
  secondaryEffects: Array<{
    variable: string;
    change: string;
    value: number;
  }>;
  riskAssessment: {
    baselineRisk: number;
    interventionRisk: number;
    confidence: number;
  };
  interpretation: string;
  tbmContext: string;
}

// ============================================
// CVGG CAUSAL EFFECT EXAMPLES (ATE/CATE) - ENHANCED
// ============================================

export const CAUSAL_EFFECT_EXAMPLES: CausalEffectExample[] = [
  {
    id: 'ce-normal-01',
    title: 'Normal Operation - Thrust → Cutting Force',
    description: 'Causal effect of thrust pressure on cutting force under normal conditions',
    condition: 'normal',
    values: {
      ATE: 0.1823,
      CATE: 0.2156,
      directEffect: 0.1347,
      indirectEffect: 0.0476,
      confidence: 0.8547,
      pValue: 0.0023
    },
    interpretation: 'For every 1-unit increase in thrust pressure, cutting force increases by 0.1823 units on average. The conditional effect (CATE=0.2156) is higher under this specific operating context, indicating stable proportional response within designed parameters.',
    tbmContext: 'TBM Thrust System → Cutterhead: Hydraulic thrust cylinder pressure directly affects cutting efficiency. ATE=0.1823 indicates moderate positive correlation - within safe operating range. Direct effect (0.1347) is 74% of total effect, showing clean mechanical transmission.',
    // NEW: Input Signature - What sensor data looks like for Normal condition
    inputSignature: {
      sensorPatterns: [
        { channel: 'DE (Drive End)', pattern: 'Sinusoidal, low amplitude', normalRange: '0.1-0.3g', observedValue: '0.22g', anomalyLevel: 'none' },
        { channel: 'FE (Fan End)', pattern: 'Periodic, consistent', normalRange: '0.05-0.2g', observedValue: '0.15g', anomalyLevel: 'none' },
        { channel: 'BA (Base)', pattern: 'Baseline noise only', normalRange: '0.02-0.08g', observedValue: '0.05g', anomalyLevel: 'none' },
        { channel: 'Temperature', pattern: 'Stable, gradual rise', normalRange: '45-65°C', observedValue: '58°C', anomalyLevel: 'none' },
        { channel: 'Pressure', pattern: 'Consistent operating pressure', normalRange: '380-400 kN', observedValue: '392 kN', anomalyLevel: 'none' },
        { channel: 'Humidity', pattern: 'Environmental baseline', normalRange: '30-60%', observedValue: '45%', anomalyLevel: 'none' }
      ],
      rockImageFeatures: [
        { feature: 'Uniform texture', description: 'Consistent geological formation with homogeneous grain structure' },
        { feature: 'Normal hardness', description: 'Expected cutting resistance matching design parameters (Mohs 5-6)' },
        { feature: 'No fractures', description: 'Intact rock face without stress concentration points' }
      ],
      causalMetadataState: { activeInterventions: 0, confounderLevel: 'Low' }
    },
    // NEW: Causal Pathway - How inputs flow through CVGG to outputs
    causalPathway: [
      { stage: 'Input', component: 'Wavelet Transform', input: '6-channel sensor signals (1D)', output: '6× 128×128 scalograms (2D)', transformation: 'Morlet CWT: signal → time-frequency representation' },
      { stage: 'Feature', component: 'VGG Backbone (Signals)', input: 'Scalograms', output: '256-dim signal embedding', transformation: 'Conv2D + MaxPool + ReLU layers extract vibration patterns' },
      { stage: 'Feature', component: 'VGG Backbone (Rock)', input: 'Rock image 224×224', output: '256-dim rock embedding', transformation: 'Conv2D layers extract texture/geological features' },
      { stage: 'Fusion', component: 'Combined Embedding', input: 'Signal + Rock + Metadata embeddings', output: '768-dim fused representation', transformation: 'Concatenation + Dense layer + BatchNorm' },
      { stage: 'Causal', component: 'Causal Inference Head', input: '768-dim embedding + treatment indicators', output: 'ATE, CATE, DE, IE', transformation: 'Doubly-robust estimator with propensity weighting' }
    ],
    // NEW: Variable Interactions - How causal variables affect each other
    variableInteractions: [
      { from: 'Thrust Pressure', to: 'Cutting Force', mechanism: 'Hydraulic power transfer through thrust cylinders', strength: 0.75, direction: 'positive' },
      { from: 'Cutting Force', to: 'Vibration', mechanism: 'Rock-disc impact generates mechanical oscillation', strength: 0.45, direction: 'positive' },
      { from: 'Vibration', to: 'Temperature', mechanism: 'Friction heat from bearing loads', strength: 0.30, direction: 'positive' },
      { from: 'Temperature', to: 'Lubricant', mechanism: 'Thermal viscosity regulation', strength: 0.25, direction: 'negative' }
    ],
    // NEW: Why Explanation - Connects inputs to outputs clearly
    whyExplanation: 'NORMAL: All sensor readings within expected ranges (vibration 0.22g < 0.3g threshold, temperature 58°C < 65°C limit). Rock image shows uniform texture without hard inclusions. CVGG encodes this as stable operating state → low ATE (0.1823) because thrust changes have proportional, predictable effects. The 74% direct effect ratio indicates clean mechanical coupling without cascade amplification.'
  },
  {
    id: 'ce-fault-01',
    title: 'Fault Condition - Vibration → System Risk',
    description: 'Causal effect of abnormal vibration on overall system risk',
    condition: 'fault',
    values: {
      ATE: 0.4231,
      CATE: 0.5872,
      directEffect: 0.3918,
      indirectEffect: 0.1954,
      confidence: 0.9123,
      pValue: 0.0001
    },
    interpretation: 'High ATE (0.4231) indicates abnormal vibration directly causes 42.31% increase in system risk. CATE=0.5872 shows effect is amplified to 58.72% under current fault conditions due to degraded bearing state. This represents a 2.3× amplification compared to normal operating conditions.',
    tbmContext: 'TBM Main Bearing → Risk Assessment: Detected bearing wear pattern with characteristic BPFO frequency at 89.3 Hz. directEffect=0.3918 (direct mechanical failure risk from bearing defect) + indirectEffect=0.1954 (thermal cascade risk through lubricant degradation and secondary component stress) = total 0.5872 risk elevation requiring immediate intervention.',
    // NEW: Input Signature - What sensor data looks like for Fault condition
    inputSignature: {
      sensorPatterns: [
        { channel: 'DE (Drive End)', pattern: 'High-frequency spikes, irregular envelope', normalRange: '0.1-0.3g', observedValue: '0.89g', anomalyLevel: 'high' },
        { channel: 'FE (Fan End)', pattern: 'Harmonic overtones at BPFO frequencies', normalRange: '0.05-0.2g', observedValue: '0.45g', anomalyLevel: 'medium' },
        { channel: 'BA (Base)', pattern: 'Cross-axis vibration coupling detected', normalRange: '0.02-0.08g', observedValue: '0.18g', anomalyLevel: 'medium' },
        { channel: 'Temperature', pattern: 'Rapid thermal gradient (>2°C/min rise)', normalRange: '45-65°C', observedValue: '78°C', anomalyLevel: 'high' },
        { channel: 'Pressure', pattern: 'Fluctuating with vibration harmonics', normalRange: '380-400 kN', observedValue: '415 kN', anomalyLevel: 'low' },
        { channel: 'Vibration X/Y/Z', pattern: 'Cross-axis correlation anomaly', normalRange: 'r < 0.3', observedValue: 'r = 0.82', anomalyLevel: 'high' }
      ],
      rockImageFeatures: [
        { feature: 'Hard inclusion detected', description: 'Unexpected high-hardness zone (Mohs 8+) causing impact loading' },
        { feature: 'Fracture patterns visible', description: 'Stress concentration indicators at rock face discontinuities' },
        { feature: 'Abrasive texture', description: 'High silica content increasing cutter wear rate' }
      ],
      causalMetadataState: { activeInterventions: 0, confounderLevel: 'High' }
    },
    // NEW: Causal Pathway - Same architecture, different activations
    causalPathway: [
      { stage: 'Input', component: 'Wavelet Transform', input: '6-channel signals with anomalies', output: 'Scalograms with high-energy bands', transformation: 'Morlet CWT reveals fault frequencies (BPFO, BPFI patterns)' },
      { stage: 'Feature', component: 'VGG Backbone (Signals)', input: 'Anomalous scalograms', output: '256-dim fault-indicative embedding', transformation: 'Conv filters activate on defect patterns; high activations at 89.3 Hz band' },
      { stage: 'Feature', component: 'VGG Backbone (Rock)', input: 'Rock image with inclusions', output: '256-dim stress-indicative embedding', transformation: 'Texture filters detect hardness variations and fracture edges' },
      { stage: 'Fusion', component: 'Combined Embedding', input: 'Fault signals + Stress rock + High confounders', output: '768-dim fault representation', transformation: 'Fusion layer correlates vibration anomaly with geological stress' },
      { stage: 'Causal', component: 'Causal Inference Head', input: 'Fault embedding + high-variance treatment', output: 'Elevated ATE/CATE/DE/IE', transformation: 'Propensity weights adjusted for confounder bias; higher treatment effect detected' }
    ],
    // NEW: Variable Interactions - Fault cascade loop
    variableInteractions: [
      { from: 'Bearing Wear', to: 'Vibration Amplitude', mechanism: 'Mechanical degradation causes irregular contact → spalling → impact pulses', strength: 0.92, direction: 'positive' },
      { from: 'Vibration Amplitude', to: 'Thermal Load', mechanism: 'Friction cascade: excess vibration → bearing heat → temperature spike', strength: 0.68, direction: 'positive' },
      { from: 'Thermal Load', to: 'Lubricant Viscosity', mechanism: 'Thermal thinning: oil viscosity drops exponentially with temperature', strength: 0.55, direction: 'negative' },
      { from: 'Lubricant Viscosity', to: 'Bearing Wear', mechanism: 'Lubrication failure: thin oil → metal-to-metal contact → accelerated wear', strength: 0.78, direction: 'negative' },
      { from: 'Rock Hardness', to: 'Cutting Force', mechanism: 'Hard inclusion requires higher thrust, amplifies stress', strength: 0.65, direction: 'positive' },
      { from: 'Cutting Force', to: 'Vibration Amplitude', mechanism: 'Impact loading from hard rock zones', strength: 0.72, direction: 'positive' }
    ],
    // NEW: Why Explanation - Connects inputs to outputs clearly
    whyExplanation: 'FAULT: Multiple sensor anomalies detected - DE vibration 0.89g is 3× normal (exceeds 0.3g threshold), temperature 78°C exceeds 65°C limit with rapid gradient, cross-axis correlation r=0.82 indicates bearing defect mode. Rock image shows hard inclusion causing impact loading. CVGG encodes this as degraded state → high ATE (0.4231) because vibration changes now trigger cascading failures. The fault creates a positive feedback loop: Bearing Wear → Vibration → Heat → Lubricant Loss → More Wear. CATE (0.5872) > ATE because the conditioning on current fault state reveals amplified effect. Direct effect is 67% of total, with 33% propagating through thermal cascade pathway.'
  }
];

// ============================================
// CAUSAL INTERVENTION (do-CALCULUS) EXAMPLES
// ============================================

export const CAUSAL_INTERVENTION_EXAMPLES: CausalInterventionExample[] = [
  {
    id: 'ci-thrust-01',
    title: 'Thrust Increase Intervention',
    command: 'do(Thrust = 396.0 kN)',
    doCalculus: {
      notation: 'P(CuttingForce, Vibration, Risk | do(Thrust = 396.0))',
      variable: 'Thrust',
      targetValue: 396.0,
      unit: 'kN'
    },
    primaryEffects: [
      { variable: 'cutting_force', change: '+7.5%', value: 0.075 },
      { variable: 'penetration_rate', change: '+12.3%', value: 0.123 }
    ],
    secondaryEffects: [
      { variable: 'vibration_amplitude', change: '+5.2%', value: 0.052 },
      { variable: 'bearing_stress', change: '+8.1%', value: 0.081 },
      { variable: 'thermal_load', change: '+3.4%', value: 0.034 }
    ],
    riskAssessment: {
      baselineRisk: 0.23,
      interventionRisk: 0.31,
      confidence: 0.87
    },
    interpretation: 'Forcing thrust to 396.0 kN (10% increase) directly increases cutting force and penetration. Secondary effects cascade through vibration and thermal systems.',
    tbmContext: 'TBM Thrust Cylinder: do-calculus cuts all incoming causal arrows to thrust, simulating forced hydraulic pressure increase independent of other system states.'
  },
  {
    id: 'ci-temp-01',
    title: 'Temperature Control Intervention',
    command: 'do(Temperature = 60.0°C)',
    doCalculus: {
      notation: 'P(Lubricant, Bearing, Risk | do(Temperature = 60.0))',
      variable: 'Temperature',
      targetValue: 60.0,
      unit: '°C'
    },
    primaryEffects: [
      { variable: 'lubricant_viscosity', change: '-12.0%', value: -0.12 },
      { variable: 'thermal_expansion', change: '-8.5%', value: -0.085 }
    ],
    secondaryEffects: [
      { variable: 'bearing_friction', change: '+3.2%', value: 0.032 },
      { variable: 'seal_integrity', change: '+5.7%', value: 0.057 },
      { variable: 'cooling_load', change: '-15.3%', value: -0.153 }
    ],
    riskAssessment: {
      baselineRisk: 0.38,
      interventionRisk: 0.29,
      confidence: 0.82
    },
    interpretation: 'Controlling temperature at 60°C (below current 68.5°C) reduces thermal stress. Trade-off: slightly increased bearing friction due to viscosity change.',
    tbmContext: 'TBM Cooling System: do(Temperature = 60°C) represents active cooling intervention, distinct from merely observing temperature naturally at 60°C.'
  }
];

// ============================================
// COUNTERFACTUAL (WHAT-IF) EXAMPLES
// ============================================

export const COUNTERFACTUAL_EXAMPLES: CounterfactualExample[] = [
  {
    id: 'cf-thrust-01',
    title: 'Thrust Pressure Increase Scenario',
    command: 'IF(Thrust = 360.0 kN → 396.0 kN) THEN ?',
    intervention: {
      variable: 'Thrust',
      fromValue: 360.0,
      toValue: 396.0,
      unit: 'kN'
    },
    values: {
      baselineOutcome: 0.3247,
      counterfactualOutcome: 0.4012,
      causalEffect: 0.0765,
      directEffect: 0.0547,
      indirectEffect: 0.1834,
      confidence: 0.8234
    },
    riskChange: 'increased',
    interpretation: 'Increasing thrust by 10% (360→396 kN) would increase system risk from 32.47% to 40.12%. The causal effect is +0.0765 (7.65% risk increase).',
    tbmContext: 'TBM Thrust Cylinder Pressure Simulation: Direct risk increase (0.0547) from hydraulic stress + Indirect cascade effect (0.1834) through cutting force → vibration → thermal chain.'
  },
  {
    id: 'cf-temp-01',
    title: 'Temperature Reduction Scenario',
    command: 'IF(Temperature = 68.5°C → 55.0°C) THEN ?',
    intervention: {
      variable: 'Temperature',
      fromValue: 68.5,
      toValue: 55.0,
      unit: '°C'
    },
    values: {
      baselineOutcome: 0.4156,
      counterfactualOutcome: 0.3287,
      causalEffect: -0.0869,
      directEffect: -0.0394,
      indirectEffect: 0.1312,
      confidence: 0.7856
    },
    riskChange: 'decreased',
    interpretation: 'Reducing temperature from 68.5°C to 55.0°C would decrease system risk from 41.56% to 32.87%. Negative causal effect (-0.0869) indicates beneficial intervention.',
    tbmContext: 'TBM Thermal Management: Cooling intervention reduces direct thermal stress (directEffect=-0.0394). Note: Some indirect effects remain positive (0.1312) due to cooling system power consumption impact.'
  }
];

// ============================================
// PRESCRIPTIVE AI EXAMPLES
// ============================================

export const PRESCRIPTIVE_EXAMPLES: PrescriptiveExample[] = [
  {
    id: 'pr-critical-01',
    title: 'Critical Bearing Intervention',
    priority: 'critical',
    trigger: 'High ATE (0.4231) detected from vibration → risk pathway',
    recommendation: 'Immediate bearing inspection and replacement',
    values: {
      ATE: -0.4231,
      riskReduction: 0.4231,
      costSaving: 42.31,
      downtimeAvoidance: 10.15,
      confidence: 0.8723,
      directEffect: -0.3918,
      indirectEffect: -0.0313
    },
    action: 'PRESCRIBE(action="replace_bearing", priority=CRITICAL, confidence=0.8723)',
    interpretation: 'Prescriptive AI recommends bearing replacement based on high causal effect. Expected 42.31% risk reduction with 87.23% confidence. Cost saving: $42.31K, Downtime avoided: 10.15 hours.',
    tbmContext: 'TBM Main Bearing Assembly: CVGG detected strong causal link (ATE=0.4231) between vibration anomaly and system failure risk. Prescribed intervention targets root cause.'
  },
  {
    id: 'pr-medium-01',
    title: 'Preventive Cooling Optimization',
    priority: 'medium',
    trigger: 'Moderate indirect effects (0.3156) through thermal pathway',
    recommendation: 'Adjust cooling system parameters',
    values: {
      ATE: -0.1523,
      riskReduction: 0.30,
      costSaving: 40.00,
      downtimeAvoidance: 5.50,
      confidence: 0.7512,
      directEffect: 0.0823,
      indirectEffect: 0.3156
    },
    action: 'PRESCRIBE(action="optimize_cooling", priority=MEDIUM, confidence=0.7512)',
    interpretation: 'Medium priority recommendation based on indirect thermal effects. Expected 30% risk reduction. Note: Direct effect is small (0.0823), but indirect cascade through thermal system is significant (0.3156).',
    tbmContext: 'TBM Cooling System: Thermal cascade detected - cutting friction → heat buildup → lubricant degradation. Cooling optimization interrupts this causal chain.'
  }
];

// ============================================
// DECISION MAKING vs PRESCRIPTIVE AI EXAMPLES
// ============================================

export const DECISION_MAKING_EXAMPLES: DecisionMakingExample[] = [
  {
    id: 'dm-bearing-01',
    title: 'Bearing Replacement Decision',
    context: 'Multiple prescriptive recommendations available for bearing-related fault',
    prescriptiveInputs: {
      recommendations: [
        { action: 'Replace bearing assembly', score: 0.92, riskReduction: 0.52 },
        { action: 'Increase lubrication frequency', score: 0.67, riskReduction: 0.28 },
        { action: 'Reduce operational speed', score: 0.45, riskReduction: 0.15 }
      ]
    },
    decision: {
      selectedAction: 'Replace worn bearing assembly',
      executionCost: 8500,
      expectedRiskReduction: 0.52,
      timeline: '4-6 hours during scheduled maintenance',
      budget: 10000
    },
    interpretation: 'Decision Making selected "Replace bearing" from 3 prescriptive options. Selection based on: highest score (0.92), best risk reduction (52%), within budget ($8,500 < $10,000 limit).',
    tbmContext: 'TBM Maintenance Decision: Prescriptive AI generated 3 options. Decision engine evaluated cost/benefit ratios, maintenance window constraints, and budget allocation to select optimal action.'
  },
  {
    id: 'dm-thermal-01',
    title: 'Thermal Management Decision',
    context: 'Competing recommendations for thermal system optimization',
    prescriptiveInputs: {
      recommendations: [
        { action: 'Install additional cooling', score: 0.78, riskReduction: 0.35 },
        { action: 'Reduce thrust pressure', score: 0.65, riskReduction: 0.22 },
        { action: 'Switch to high-temp lubricant', score: 0.58, riskReduction: 0.18 }
      ]
    },
    decision: {
      selectedAction: 'Install additional cooling unit',
      executionCost: 15000,
      expectedRiskReduction: 0.35,
      timeline: 'Next scheduled stop, 2-3 days',
      budget: 20000
    },
    interpretation: 'Decision Making chose cooling installation despite higher cost. Reasoning: Best long-term risk reduction (35%), addresses root cause, within expanded budget for thermal issues.',
    tbmContext: 'TBM Thermal Strategy: Decision engine weighted long-term ROI over immediate cost. Prescriptive AI identified the causal pathway; Decision Making optimized the execution strategy.'
  }
];

// ============================================
// FLOAT VALUE REFERENCE TABLE
// ============================================

export interface FloatValueReference {
  metric: string;
  symbol: string;
  range: string;
  unit: string;
  interpretation: string;
}

export const FLOAT_VALUE_REFERENCES: FloatValueReference[] = [
  { metric: 'Average Treatment Effect', symbol: 'ATE', range: '-1.0 to +1.0', unit: 'unitless ratio', interpretation: 'Mean causal effect across all units. Positive = increases outcome, Negative = decreases outcome' },
  { metric: 'Conditional ATE', symbol: 'CATE', range: '-1.0 to +1.0', unit: 'unitless ratio', interpretation: 'Causal effect under specific conditions. Often higher than ATE in targeted scenarios' },
  { metric: 'Direct Effect', symbol: 'DE', range: '-1.0 to +1.0', unit: 'unitless ratio', interpretation: 'Immediate causal impact without mediating variables' },
  { metric: 'Indirect Effect', symbol: 'IE', range: '-1.0 to +1.0', unit: 'unitless ratio', interpretation: 'Cascade effect through intermediate variables' },
  { metric: 'Confidence', symbol: 'conf', range: '0.0 to 1.0', unit: 'probability', interpretation: 'Statistical confidence in the estimated effect. >0.8 is high confidence' },
  { metric: 'Baseline Outcome', symbol: 'Y₀', range: '0.0 to 1.0', unit: 'risk probability', interpretation: 'Expected outcome without intervention' },
  { metric: 'Counterfactual Outcome', symbol: 'Y₁', range: '0.0 to 1.0', unit: 'risk probability', interpretation: 'Expected outcome with hypothetical intervention' },
  { metric: 'Risk Reduction', symbol: 'ΔR', range: '0.0 to 1.0', unit: 'percentage', interpretation: 'Expected decrease in failure risk after intervention' },
  { metric: 'P-Value', symbol: 'p', range: '0.0 to 1.0', unit: 'probability', interpretation: 'Statistical significance. <0.05 indicates significant causal relationship' }
];

// Helper function to format float values for display
export function formatFloat(value: number, decimals: number = 4): string {
  return value.toFixed(decimals);
}

// Helper function to get risk change color
export function getRiskChangeColor(change: 'increased' | 'decreased' | 'unchanged'): string {
  switch (change) {
    case 'increased': return 'text-red-500';
    case 'decreased': return 'text-green-500';
    case 'unchanged': return 'text-yellow-500';
  }
}

// Helper function to get priority color
export function getPriorityColor(priority: 'critical' | 'high' | 'medium' | 'low'): string {
  switch (priority) {
    case 'critical': return 'bg-red-500';
    case 'high': return 'bg-orange-500';
    case 'medium': return 'bg-yellow-500';
    case 'low': return 'bg-green-500';
  }
}
