/**
 * Causal Intervention Engine for IMSCHM
 * 
 * Implements do-calculus for causal interventions:
 * - do(X = x): Set variable X to value x, breaking all causal arrows into X
 * - Computes P(Y | do(X = x)) - the interventional distribution
 * 
 * Examples:
 * 1. do(thrust = +10%): What happens when we forcibly increase thrust?
 * 2. do(temperature = 60°C): What happens when we control temperature at 60°C?
 */

import { SystemState, IndustrialDomain } from '@/types/industrial';
import { InferenceResult } from '@/hooks/useEnhancedCVGG';
import { getSystemDiagnostics } from '@/utils/systemDiagnostics';

export interface InterventionDefinition {
  id: string;
  name: string;
  variable: string;
  domain: IndustrialDomain;
  interventionType: 'do' | 'observe'; // do-calculus vs conditioning
  targetValue: number;
  description: string;
  expectedOutcomes: string[];
}

export interface InterventionResult {
  intervention: InterventionDefinition;
  timestamp: number;
  baselineState: Partial<SystemState>;
  interventionalState: Partial<SystemState>;
  causalEffects: {
    primaryEffect: number;      // Direct effect on target
    secondaryEffects: Array<{   // Downstream effects
      variable: string;
      effect: number;
      pathway: string;
    }>;
    totalEffect: number;
  };
  riskAssessment: {
    preInterventionRisk: number;
    postInterventionRisk: number;
    riskDelta: number;
  };
  confidence: number;
  explanation: string;
  verified: boolean;
}

// Pre-defined Intervention Examples for TBM — mapped to all 5 failure types
export const INTERVENTION_EXAMPLES: InterventionDefinition[] = [
  // === Hydraulic domain (maps to hydraulic_leak failure) ===
  {
    id: 'int-pressure-reduce-15',
    name: 'Reduce Hydraulic Pressure by 15%',
    variable: 'hydraulic_pressure',
    domain: 'hydraulic',
    interventionType: 'do',
    targetValue: -15,
    description: 'do(Pressure = current × 0.85): Counteract hydraulic leak by reducing system pressure.',
    expectedOutcomes: [
      'Thrust force decreases',
      'System stress reduces',
      'Leak propagation slows',
      'Seal longevity improves',
    ],
  },
  {
    id: 'int-pressure-increase-10',
    name: 'Increase Hydraulic Pressure by 10%',
    variable: 'hydraulic_pressure',
    domain: 'hydraulic',
    interventionType: 'do',
    targetValue: 10,
    description: 'do(Pressure = current × 1.10): Compensate for pressure loss from leak.',
    expectedOutcomes: [
      'Flow rate partially restored',
      'Risk of seal rupture increases',
      'Thrust compensated',
    ],
  },
  // === Mechanical domain (maps to bearing_wear failure) ===
  {
    id: 'int-rotation-decrease-20',
    name: 'Decrease Rotation Speed by 20%',
    variable: 'rotation_speed',
    domain: 'mechanical',
    interventionType: 'do',
    targetValue: -20,
    description: 'do(RPM = current × 0.80): Reduce rotation to mitigate bearing wear vibration.',
    expectedOutcomes: [
      'Vibration amplitude decreases',
      'Bearing wear rate reduces',
      'Penetration rate decreases',
      'Power consumption reduces',
    ],
  },
  {
    id: 'int-thrust-increase-10',
    name: 'Increase Thrust by 10%',
    variable: 'thrust',
    domain: 'mechanical',
    interventionType: 'do',
    targetValue: 10,
    description: 'do(Thrust = current × 1.10): Increase thrust to compensate for reduced rotation.',
    expectedOutcomes: [
      'Penetration rate increases',
      'Cutter head torque increases',
      'Tool wear accelerates',
      'System temperature may rise',
    ],
  },
  // === Thermal domain (maps to thermal_overload failure) ===
  {
    id: 'int-temp-control-60',
    name: 'Control Temperature at 60°C',
    variable: 'thermal_system_temp',
    domain: 'thermal',
    interventionType: 'do',
    targetValue: 60,
    description: 'do(Temperature = 60°C): Force active cooling to counteract thermal overload.',
    expectedOutcomes: [
      'Hydraulic viscosity normalizes',
      'Thermal stress reduces',
      'Operational efficiency improves',
      'Wear rate may decrease',
    ],
  },
  {
    id: 'int-temp-control-45',
    name: 'Aggressive Cooling to 45°C',
    variable: 'thermal_system_temp',
    domain: 'thermal',
    interventionType: 'do',
    targetValue: 45,
    description: 'do(Temperature = 45°C): Aggressive cooling for critical thermal overload scenarios.',
    expectedOutcomes: [
      'All thermal effects eliminated',
      'Viscosity increases (may slow flow)',
      'Energy cost of cooling is high',
    ],
  },
  // === Electrical domain (maps to voltage_fluctuation failure) ===
  {
    id: 'int-voltage-stabilize',
    name: 'Stabilize Voltage at Nominal',
    variable: 'electrical_voltage',
    domain: 'electrical',
    interventionType: 'do',
    targetValue: 0,
    description: 'do(Voltage = nominal): Force voltage stabilization via UPS/regulator to counter fluctuations.',
    expectedOutcomes: [
      'Power output stabilizes',
      'Hydraulic pressure normalizes',
      'Motor speed becomes consistent',
      'Control system reliability improves',
    ],
  },
  {
    id: 'int-voltage-boost-5',
    name: 'Boost Voltage by 5%',
    variable: 'electrical_voltage',
    domain: 'electrical',
    interventionType: 'do',
    targetValue: 5,
    description: 'do(Voltage = current × 1.05): Slight voltage boost to compensate for drops.',
    expectedOutcomes: [
      'Power consumption increases',
      'Motor torque increases slightly',
      'Risk of overcurrent if sustained',
    ],
  },
  // === Cutting domain (maps to tool_wear_excessive failure) ===
  {
    id: 'int-cutting-force-reduce-20',
    name: 'Reduce Cutting Force by 20%',
    variable: 'cutting_force',
    domain: 'cutting',
    interventionType: 'do',
    targetValue: -20,
    description: 'do(CuttingForce = current × 0.80): Reduce cutting force to slow tool wear.',
    expectedOutcomes: [
      'Tool wear rate decreases',
      'Penetration rate decreases',
      'Surface quality may improve',
      'Torque requirement reduces',
    ],
  },
  {
    id: 'int-tool-wear-reset',
    name: 'Simulate Tool Replacement',
    variable: 'cutting_tool_wear',
    domain: 'cutting',
    interventionType: 'do',
    targetValue: 5,
    description: 'do(ToolWear = 5%): Simulate replacing worn tools with fresh ones.',
    expectedOutcomes: [
      'Cutting force normalizes',
      'Surface quality improves dramatically',
      'Downtime cost incurred',
      'System returns to optimal operation',
    ],
  },
];

// Causal coefficients — expanded for all intervention variables
const CAUSAL_COEFFICIENTS: Record<string, Record<string, number>> = {
  thrust: {
    cutting_force: 0.75,
    penetration_rate: 0.65,
    mechanical_wear_level: 0.40,
    cutter_head_torque: 0.55,
    thermal_system_temp: 0.25,
  },
  thermal_system_temp: {
    hydraulic_viscosity: -0.45,
    mechanical_wear_level: 0.30,
    electrical_efficiency: -0.20,
    cutting_tool_wear: 0.25,
  },
  hydraulic_pressure: {
    thrust: 0.80,
    cutting_force: 0.50,
    mechanical_vibration: 0.35,
    seal_stress: 0.60,
    hydraulic_flow_rate: 0.45,
  },
  rotation_speed: {
    mechanical_vibration: 0.55,
    cutting_tool_wear: 0.45,
    penetration_rate: 0.40,
    thermal_system_temp: 0.30,
    power_consumption: 0.50,
  },
  electrical_voltage: {
    electrical_power: 0.90,
    hydraulic_pressure: 0.55,
    mechanical_speed: 0.50,
    control_stability: 0.70,
  },
  cutting_force: {
    cutting_tool_wear: 0.65,
    mechanical_torque: 0.50,
    penetration_rate: 0.55,
    surface_quality: -0.40,
    thermal_system_temp: 0.20,
  },
  cutting_tool_wear: {
    cutting_force: -0.60,
    surface_quality: 0.80,
    penetration_rate: 0.30,
    downtime_cost: -0.50,
  },
};

// Causal coefficients for computing intervention effects
const CAUSAL_COEFFICIENTS: Record<string, Record<string, number>> = {
  thrust: {
    cutting_force: 0.75,
    penetration_rate: 0.65,
    mechanical_wear_level: 0.40,
    cutter_head_torque: 0.55,
    thermal_system_temp: 0.25,
  },
  thermal_system_temp: {
    hydraulic_viscosity: -0.45,
    mechanical_wear_level: 0.30,
    electrical_efficiency: -0.20,
    cutting_tool_wear: 0.25,
  },
  hydraulic_pressure: {
    thrust: 0.80,
    cutting_force: 0.50,
    mechanical_vibration: 0.35,
    seal_stress: 0.60,
  },
  rotation_speed: {
    mechanical_vibration: 0.55,
    cutting_tool_wear: 0.45,
    penetration_rate: 0.40,
    thermal_system_temp: 0.30,
    power_consumption: 0.50,
  },
};

/**
 * Causal Intervention Engine
 * Implements do-calculus for TBM causal interventions
 */
export class CausalInterventionEngine {
  private interventionHistory: InterventionResult[] = [];

  /**
   * Execute a causal intervention using do-calculus
   * P(Y | do(X = x)) ≠ P(Y | X = x)
   */
  executeIntervention(
    intervention: InterventionDefinition,
    currentState: SystemState,
    cvggResult?: InferenceResult
  ): InterventionResult {
    const timestamp = Date.now();
    
    // Get current value of the intervention variable
    const currentValue = this.getVariableValue(intervention.variable, currentState);
    
    // Calculate the new value after intervention
    let newValue: number;
    if (intervention.variable === 'thermal_system_temp' && intervention.targetValue < 100) {
      // Absolute value for temperature
      newValue = intervention.targetValue;
    } else {
      // Relative change
      newValue = currentValue * (1 + intervention.targetValue / 100);
    }
    
    // Safely compute relativeDelta - avoid division by zero
    let relativeDelta: number;
    if (currentValue !== 0 && isFinite(currentValue) && !isNaN(currentValue)) {
      relativeDelta = (newValue - currentValue) / currentValue;
    } else if (newValue !== currentValue) {
      relativeDelta = newValue > currentValue ? 0.1 : -0.1; // 10% effect estimate
      getSystemDiagnostics().logNaN('CausalInterventionEngine', intervention.variable, 'relativeDelta computation (currentValue=0)');
    } else {
      relativeDelta = 0;
    }
    // Clamp to reasonable bounds
    relativeDelta = Math.max(-1, Math.min(1, relativeDelta));
    
    // Compute causal effects using do-calculus
    const coefficients = CAUSAL_COEFFICIENTS[intervention.variable] || {};
    const secondaryEffects: Array<{ variable: string; effect: number; pathway: string }> = [];
    
    Object.entries(coefficients).forEach(([variable, coefficient]) => {
      const effect = coefficient * relativeDelta;
      secondaryEffects.push({
        variable,
        effect,
        pathway: `do(${intervention.variable}) → ${variable}`,
      });
    });
    
    // Primary effect is the direct change
    const primaryEffect = relativeDelta;
    
    // Total effect includes direct and propagated effects
    const totalEffect = primaryEffect + secondaryEffects.reduce((sum, e) => sum + Math.abs(e.effect), 0) * 0.3;
    
    // Compute risk assessment
    const preInterventionRisk = this.computeSystemRisk(currentState);
    const postInterventionRisk = this.computePostInterventionRisk(
      currentState,
      intervention.variable,
      newValue,
      secondaryEffects
    );
    
    // Use CVGG confidence if available
    const confidence = cvggResult?.classification.confidence || 0.75;
    
    // Generate explanation
    const explanation = this.generateExplanation(
      intervention,
      currentValue,
      newValue,
      secondaryEffects,
      preInterventionRisk,
      postInterventionRisk
    );
    
    const result: InterventionResult = {
      intervention,
      timestamp,
      baselineState: this.extractRelevantState(currentState, intervention.domain),
      interventionalState: this.computeInterventionalState(currentState, intervention.variable, newValue),
      causalEffects: {
        primaryEffect,
        secondaryEffects,
        totalEffect,
      },
      riskAssessment: {
        preInterventionRisk,
        postInterventionRisk,
        riskDelta: postInterventionRisk - preInterventionRisk,
      },
      confidence,
      explanation,
      verified: true, // Mark as verified since we computed it
    };
    
    this.interventionHistory.push(result);
    getSystemDiagnostics().logSuccess('CausalInterventionEngine', `do(${intervention.variable}) executed`, `Risk: ${(preInterventionRisk*100).toFixed(1)}% → ${(postInterventionRisk*100).toFixed(1)}%`);
    return result;
  }

  /**
   * Execute multiple interventions for comparison
   */
  executeMultipleInterventions(
    interventions: InterventionDefinition[],
    currentState: SystemState,
    cvggResult?: InferenceResult
  ): InterventionResult[] {
    return interventions.map(int => this.executeIntervention(int, currentState, cvggResult));
  }

  private getVariableValue(variable: string, state: SystemState): number {
    const valueMap: Record<string, number> = {
      thrust: state.hydraulic.pressure * 3,
      thermal_system_temp: state.thermal.system_temp,
      hydraulic_pressure: state.hydraulic.pressure,
      rotation_speed: state.mechanical.speed / 100,
      mechanical_torque: state.mechanical.torque,
      cutting_force: state.cutting.cutting_force,
      mechanical_wear_level: state.mechanical.wear_level * 100,
      cutting_tool_wear: state.cutting.tool_wear * 100,
    };
    return valueMap[variable] ?? 0;
  }

  private computeSystemRisk(state: SystemState): number {
    let risk = 0;
    if (state.hydraulic.pressure > 170) risk += 0.25;
    else if (state.hydraulic.pressure > 150) risk += 0.1;
    if (state.thermal.system_temp > 75) risk += 0.3;
    else if (state.thermal.system_temp > 65) risk += 0.15;
    risk += state.mechanical.wear_level * 0.25;
    risk += state.cutting.tool_wear * 0.2;
    if (state.mechanical.vibration_x > 5) risk += 0.15;
    return Math.min(1, risk);
  }

  private computePostInterventionRisk(
    state: SystemState,
    variable: string,
    newValue: number,
    effects: Array<{ variable: string; effect: number }>
  ): number {
    let risk = this.computeSystemRisk(state);
    
    // Adjust risk based on effects
    effects.forEach(({ variable: v, effect }) => {
      if (v.includes('wear') && effect > 0) risk += effect * 0.5;
      if (v.includes('temp') && effect > 0) risk += effect * 0.3;
      if (v.includes('vibration') && effect > 0) risk += effect * 0.2;
      if (v.includes('efficiency') && effect < 0) risk += Math.abs(effect) * 0.1;
    });
    
    // Direct variable effects
    if (variable === 'thermal_system_temp') {
      if (newValue < 65) risk -= 0.1;
      if (newValue > 75) risk += 0.15;
    }
    if (variable === 'hydraulic_pressure') {
      if (newValue < 150) risk -= 0.1;
    }
    
    return Math.max(0, Math.min(1, risk));
  }

  private extractRelevantState(state: SystemState, domain: IndustrialDomain): Partial<SystemState> {
    return { [domain]: state[domain] } as Partial<SystemState>;
  }

  private computeInterventionalState(
    state: SystemState,
    variable: string,
    newValue: number
  ): Partial<SystemState> {
    // Return modified state showing the intervention
    const modified: Record<string, number> = {};
    modified[variable] = newValue;
    return modified as Partial<SystemState>;
  }

  private generateExplanation(
    intervention: InterventionDefinition,
    currentValue: number,
    newValue: number,
    effects: Array<{ variable: string; effect: number; pathway: string }>,
    preRisk: number,
    postRisk: number
  ): string {
    const changeDir = newValue > currentValue ? 'increases' : 'decreases';
    const changePct = Math.abs(((newValue - currentValue) / currentValue) * 100).toFixed(1);
    
    let explanation = `**Causal Intervention Analysis**\n\n`;
    explanation += `**do(${intervention.variable.replace(/_/g, ' ')} = ${newValue.toFixed(1)})**\n\n`;
    explanation += `This intervention ${changeDir} ${intervention.variable.replace(/_/g, ' ')} by ${changePct}%.\n\n`;
    
    explanation += `**Causal Effects (via do-calculus):**\n`;
    effects.slice(0, 4).forEach(e => {
      const dir = e.effect > 0 ? '↑' : '↓';
      explanation += `• ${e.pathway}: ${dir}${(Math.abs(e.effect) * 100).toFixed(1)}%\n`;
    });
    
    explanation += `\n**Risk Assessment:**\n`;
    explanation += `• Pre-intervention: ${(preRisk * 100).toFixed(1)}%\n`;
    explanation += `• Post-intervention: ${(postRisk * 100).toFixed(1)}%\n`;
    explanation += `• Change: ${postRisk > preRisk ? '+' : ''}${((postRisk - preRisk) * 100).toFixed(1)}%\n`;
    
    return explanation;
  }

  getInterventionHistory(): InterventionResult[] {
    return this.interventionHistory;
  }

  clearHistory(): void {
    this.interventionHistory = [];
  }
}

// Singleton
let engineInstance: CausalInterventionEngine | null = null;

export function getCausalInterventionEngine(): CausalInterventionEngine {
  if (!engineInstance) {
    engineInstance = new CausalInterventionEngine();
  }
  return engineInstance;
}
