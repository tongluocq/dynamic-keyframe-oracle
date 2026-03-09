/**
 * Counterfactual Query Engine for IMSCHM
 * 
 * Answers causal questions like:
 * - "What if thrust increases by 10%?"
 * - "What would happen if temperature drops to 60°C?"
 * 
 * Distribution:
 * - CVGG: Provides base causal effects (ATE, CATE, embeddings)
 * - CounterfactualEngine: Uses CVGG outputs to compute interventional predictions
 */

import { SystemState, IndustrialDomain, SensorReading } from '@/types/industrial';
import { InferenceResult } from '@/hooks/useEnhancedCVGG';

export interface InterventionQuery {
  id: string;
  variable: string;
  domain: IndustrialDomain;
  currentValue: number;
  interventionValue: number;
  interventionType: 'absolute' | 'relative' | 'delta';
  description: string;
}

export interface CounterfactualResult {
  query: InterventionQuery;
  baselineOutcome: number;
  counterfactualOutcome: number;
  causalEffect: number;
  directEffect: number;
  indirectEffect: number;
  confidence: number;
  affectedVariables: Array<{
    variable: string;
    predictedChange: number;
    pathway: string;
  }>;
  riskChange: 'increased' | 'decreased' | 'unchanged';
  explanation: string;
}

export interface CounterfactualScenario {
  name: string;
  description: string;
  interventions: InterventionQuery[];
  combinedOutcome: number;
  feasibility: 'high' | 'medium' | 'low';
  recommendation: string;
}

// Sensor variable mappings for intervention queries
const VARIABLE_CONFIG: Record<string, {
  domain: IndustrialDomain;
  unit: string;
  normalRange: [number, number];
  causalParents: string[];
  causalChildren: string[];
}> = {
  'hydraulic_pressure': {
    domain: 'hydraulic',
    unit: 'bar',
    normalRange: [100, 160],
    causalParents: ['hydraulic_flow_rate', 'hydraulic_temperature'],
    causalChildren: ['mechanical_vibration_x', 'cutting_force', 'thermal_system_temp'],
  },
  'mechanical_torque': {
    domain: 'mechanical',
    unit: 'Nm',
    normalRange: [50, 150],
    causalParents: ['electrical_power', 'mechanical_speed'],
    causalChildren: ['mechanical_wear_level', 'thermal_system_temp', 'cutting_force'],
  },
  'thrust': {
    domain: 'mechanical',
    unit: 'kN',
    normalRange: [100, 500],
    causalParents: ['hydraulic_pressure', 'mechanical_torque'],
    causalChildren: ['cutting_force', 'mechanical_wear_level', 'penetration_rate'],
  },
  'rotation_speed': {
    domain: 'mechanical',
    unit: 'rpm',
    normalRange: [1, 10],
    causalParents: ['electrical_power', 'mechanical_torque'],
    causalChildren: ['mechanical_vibration_x', 'cutting_force', 'thermal_system_temp'],
  },
  'cutter_head_torque': {
    domain: 'cutting',
    unit: 'kNm',
    normalRange: [500, 2000],
    causalParents: ['rotation_speed', 'thrust', 'rock_strength'],
    causalChildren: ['cutting_tool_wear', 'penetration_rate', 'thermal_system_temp'],
  },
  'thermal_system_temp': {
    domain: 'thermal',
    unit: '°C',
    normalRange: [40, 70],
    causalParents: ['mechanical_torque', 'hydraulic_pressure', 'electrical_power'],
    causalChildren: ['hydraulic_viscosity', 'mechanical_wear_level'],
  },
  'electrical_power': {
    domain: 'electrical',
    unit: 'kW',
    normalRange: [500, 2000],
    causalParents: ['electrical_voltage', 'electrical_current'],
    causalChildren: ['mechanical_torque', 'thermal_system_temp'],
  },
};

// Preset counterfactual queries for TBM operations
// These are "What if?" scenarios - observational counterfactuals
export const PRESET_COUNTERFACTUAL_QUERIES: InterventionQuery[] = [
  // ==========================================
  // EXAMPLE 1: Thrust Increase Counterfactual
  // ==========================================
  {
    id: 'cf-thrust-increase-10',
    variable: 'thrust',
    domain: 'mechanical',
    currentValue: 0,
    interventionValue: 10,
    interventionType: 'relative',
    description: 'EXAMPLE 1: What if thrust increases by 10%?',
  },
  // ==========================================
  // EXAMPLE 2: Temperature Control Counterfactual  
  // ==========================================
  {
    id: 'cf-temp-control-55',
    variable: 'thermal_system_temp',
    domain: 'thermal',
    currentValue: 0,
    interventionValue: 55,
    interventionType: 'absolute',
    description: 'EXAMPLE 2: What if temperature is maintained at 55°C?',
  },
  // Additional counterfactual queries
  {
    id: 'cf-thrust-decrease-20',
    variable: 'thrust',
    domain: 'mechanical',
    currentValue: 0,
    interventionValue: -20,
    interventionType: 'relative',
    description: 'What if thrust decreases by 20%?',
  },
  {
    id: 'cf-rotation-increase-5',
    variable: 'rotation_speed',
    domain: 'mechanical',
    currentValue: 0,
    interventionValue: 5,
    interventionType: 'relative',
    description: 'What if rotation speed increases by 5%?',
  },
  {
    id: 'cf-temp-set-60',
    variable: 'thermal_system_temp',
    domain: 'thermal',
    currentValue: 0,
    interventionValue: 60,
    interventionType: 'absolute',
    description: 'What if system temperature is controlled at 60°C?',
  },
  {
    id: 'cf-pressure-increase-15',
    variable: 'hydraulic_pressure',
    domain: 'hydraulic',
    currentValue: 0,
    interventionValue: 15,
    interventionType: 'relative',
    description: 'What if hydraulic pressure increases by 15%?',
  },
];

// Alias for backward compatibility
export const PRESET_INTERVENTIONS = PRESET_COUNTERFACTUAL_QUERIES;

/**
 * Counterfactual Query Engine
 * Computes "What if?" scenarios using causal inference
 */
export class CounterfactualEngine {
  private causalCoefficients: Map<string, Map<string, number>> = new Map();
  
  constructor() {
    this.initializeCausalCoefficients();
  }

  /**
   * Initialize causal effect coefficients based on domain knowledge
   * These could be learned from data or CVGG outputs
   */
  private initializeCausalCoefficients(): void {
    // Hydraulic → Mechanical effects
    this.setCoefficient('hydraulic_pressure', 'mechanical_vibration_x', 0.35);
    this.setCoefficient('hydraulic_pressure', 'cutting_force', 0.45);
    this.setCoefficient('hydraulic_pressure', 'thrust', 0.8);
    
    // Thrust → Outcomes
    this.setCoefficient('thrust', 'cutting_force', 0.7);
    this.setCoefficient('thrust', 'penetration_rate', 0.6);
    this.setCoefficient('thrust', 'mechanical_wear_level', 0.4);
    this.setCoefficient('thrust', 'cutter_head_torque', 0.5);
    
    // Rotation → Outcomes
    this.setCoefficient('rotation_speed', 'cutter_head_torque', 0.6);
    this.setCoefficient('rotation_speed', 'mechanical_vibration_x', 0.5);
    this.setCoefficient('rotation_speed', 'thermal_system_temp', 0.3);
    
    // Temperature effects
    this.setCoefficient('thermal_system_temp', 'hydraulic_viscosity', -0.4);
    this.setCoefficient('thermal_system_temp', 'mechanical_wear_level', 0.25);
    
    // Torque effects
    this.setCoefficient('mechanical_torque', 'mechanical_wear_level', 0.35);
    this.setCoefficient('mechanical_torque', 'thermal_system_temp', 0.4);
    this.setCoefficient('cutter_head_torque', 'cutting_tool_wear', 0.55);
  }

  private setCoefficient(cause: string, effect: string, value: number): void {
    if (!this.causalCoefficients.has(cause)) {
      this.causalCoefficients.set(cause, new Map());
    }
    this.causalCoefficients.get(cause)!.set(effect, value);
  }

  private getCoefficient(cause: string, effect: string): number {
    return this.causalCoefficients.get(cause)?.get(effect) || 0;
  }

  /**
   * Execute a single counterfactual query
   */
  evaluateIntervention(
    query: InterventionQuery,
    currentState: SystemState,
    cvggResult?: InferenceResult
  ): CounterfactualResult {
    // Get current value from state
    const currentValue = this.getVariableValue(query.variable, currentState);
    const updatedQuery = { ...query, currentValue };
    
    // Calculate intervention magnitude
    let newValue: number;
    switch (query.interventionType) {
      case 'absolute':
        newValue = query.interventionValue;
        break;
      case 'relative':
        newValue = currentValue * (1 + query.interventionValue / 100);
        break;
      case 'delta':
        newValue = currentValue + query.interventionValue;
        break;
      default:
        newValue = query.interventionValue;
    }
    
    const deltaValue = newValue - currentValue;
    // Safely compute relativeDelta - avoid division by zero and handle edge cases
    let relativeDelta: number;
    if (currentValue !== 0 && isFinite(currentValue)) {
      relativeDelta = deltaValue / currentValue;
    } else if (deltaValue !== 0) {
      // If currentValue is 0, use a reasonable default based on the delta
      relativeDelta = deltaValue > 0 ? 0.1 : -0.1; // 10% effect estimate
    } else {
      relativeDelta = 0;
    }
    // Clamp relativeDelta to reasonable bounds
    relativeDelta = Math.max(-1, Math.min(1, relativeDelta));
    
    // Calculate direct effect
    const directEffect = this.calculateDirectEffect(query.variable, relativeDelta, cvggResult);
    
    // Calculate indirect effects through mediators
    const indirectEffects = this.calculateIndirectEffects(query.variable, relativeDelta);
    const totalIndirectEffect = indirectEffects.reduce((sum, e) => sum + Math.abs(e.predictedChange), 0);
    
    // Total causal effect
    const causalEffect = directEffect + totalIndirectEffect * 0.5;
    
    // Compute outcomes
    const baselineOutcome = this.computeSystemRisk(currentState);
    const counterfactualOutcome = baselineOutcome + causalEffect * 0.3;
    
    // Use CVGG estimates if available
    const confidence = cvggResult 
      ? Math.min(0.95, cvggResult.classification.confidence + 0.1)
      : 0.7;

    // Determine risk change
    let riskChange: 'increased' | 'decreased' | 'unchanged';
    if (counterfactualOutcome > baselineOutcome + 0.05) {
      riskChange = 'increased';
    } else if (counterfactualOutcome < baselineOutcome - 0.05) {
      riskChange = 'decreased';
    } else {
      riskChange = 'unchanged';
    }

    // Generate explanation
    const explanation = this.generateExplanation(
      query, 
      currentValue, 
      newValue, 
      causalEffect, 
      indirectEffects,
      riskChange
    );

    return {
      query: updatedQuery,
      baselineOutcome,
      counterfactualOutcome,
      causalEffect,
      directEffect,
      indirectEffect: totalIndirectEffect,
      confidence,
      affectedVariables: indirectEffects,
      riskChange,
      explanation,
    };
  }

  /**
   * Evaluate multiple interventions simultaneously
   */
  evaluateScenario(
    name: string,
    description: string,
    interventions: InterventionQuery[],
    currentState: SystemState,
    cvggResult?: InferenceResult
  ): CounterfactualScenario {
    const results = interventions.map(q => 
      this.evaluateIntervention(q, currentState, cvggResult)
    );

    // Combine effects (with diminishing returns for multiple interventions)
    const combinedEffect = results.reduce((sum, r, idx) => {
      const weight = 1 / Math.pow(1.5, idx); // Diminishing weight
      return sum + r.causalEffect * weight;
    }, 0);

    const baselineRisk = this.computeSystemRisk(currentState);
    const combinedOutcome = Math.max(0, Math.min(1, baselineRisk + combinedEffect * 0.25));

    // Assess feasibility
    let feasibility: 'high' | 'medium' | 'low' = 'high';
    const maxDelta = Math.max(...interventions.map(q => Math.abs(q.interventionValue)));
    if (maxDelta > 30) feasibility = 'low';
    else if (maxDelta > 15) feasibility = 'medium';

    // Generate recommendation
    const avgRiskChange = results.reduce((sum, r) => 
      sum + (r.riskChange === 'decreased' ? -1 : r.riskChange === 'increased' ? 1 : 0), 0
    ) / results.length;

    let recommendation: string;
    if (avgRiskChange < -0.3 && feasibility !== 'low') {
      recommendation = 'Recommended: This scenario reduces overall system risk.';
    } else if (avgRiskChange > 0.3) {
      recommendation = 'Caution: This scenario may increase system risk.';
    } else {
      recommendation = 'Neutral: Monitor system response if implementing.';
    }

    return {
      name,
      description,
      interventions,
      combinedOutcome,
      feasibility,
      recommendation,
    };
  }

  private calculateDirectEffect(
    variable: string,
    relativeDelta: number,
    cvggResult?: InferenceResult
  ): number {
    // Use CVGG ATE if available, otherwise use domain knowledge
    const rawATE = cvggResult?.causalEffects?.ATE;
    const baseEffect = (rawATE != null && isFinite(rawATE) && !isNaN(rawATE)) ? rawATE : 0.2;
    
    // Ensure relativeDelta is valid
    const safeRelativeDelta = (isFinite(relativeDelta) && !isNaN(relativeDelta)) ? relativeDelta : 0;
    
    // Scale by intervention magnitude
    const scaledEffect = baseEffect * safeRelativeDelta;
    
    // Return clamped value to prevent extreme results
    return Math.max(-1, Math.min(1, scaledEffect));
  }

  private calculateIndirectEffects(
    variable: string,
    relativeDelta: number
  ): Array<{ variable: string; predictedChange: number; pathway: string }> {
    const effects: Array<{ variable: string; predictedChange: number; pathway: string }> = [];
    
    const config = VARIABLE_CONFIG[variable];
    if (!config) return effects;

    // Calculate effects on children
    config.causalChildren.forEach(child => {
      const coefficient = this.getCoefficient(variable, child);
      if (coefficient !== 0) {
        effects.push({
          variable: child,
          predictedChange: coefficient * relativeDelta,
          pathway: `${variable} → ${child}`,
        });
      }
    });

    // Second-order effects (children of children)
    effects.forEach(e => {
      const childConfig = VARIABLE_CONFIG[e.variable];
      if (childConfig) {
        childConfig.causalChildren.forEach(grandchild => {
          const coefficient = this.getCoefficient(e.variable, grandchild);
          if (coefficient !== 0 && !effects.find(x => x.variable === grandchild)) {
            effects.push({
              variable: grandchild,
              predictedChange: coefficient * e.predictedChange * 0.5, // Diminished
              pathway: `${variable} → ${e.variable} → ${grandchild}`,
            });
          }
        });
      }
    });

    return effects;
  }

  private getVariableValue(variable: string, state: SystemState): number {
    // Map variable names to state values
    const valueMap: Record<string, number> = {
      'hydraulic_pressure': state.hydraulic.pressure,
      'hydraulic_flow_rate': state.hydraulic.flow_rate,
      'hydraulic_temperature': state.hydraulic.temperature,
      'mechanical_torque': state.mechanical.torque,
      'mechanical_vibration_x': state.mechanical.vibration_x,
      'mechanical_wear_level': state.mechanical.wear_level * 100,
      'thermal_system_temp': state.thermal.system_temp,
      'electrical_power': state.electrical.power,
      'cutting_force': state.cutting.cutting_force,
      'cutting_tool_wear': state.cutting.tool_wear * 100,
      // TBM specific (simulated from related values)
      'thrust': state.hydraulic.pressure * 3, // Simulated relationship
      'rotation_speed': state.mechanical.speed / 100, // Simulated relationship
      'cutter_head_torque': state.mechanical.torque * 10,
      'penetration_rate': state.cutting.cutting_force / 10,
    };

    return valueMap[variable] ?? 0;
  }

  private computeSystemRisk(state: SystemState): number {
    // Aggregate risk from multiple factors
    let risk = 0;
    
    // Pressure risk
    if (state.hydraulic.pressure > 170) risk += 0.2;
    else if (state.hydraulic.pressure > 150) risk += 0.1;
    
    // Temperature risk
    if (state.thermal.system_temp > 75) risk += 0.25;
    else if (state.thermal.system_temp > 65) risk += 0.1;
    
    // Wear risk
    risk += state.mechanical.wear_level * 0.3;
    risk += state.cutting.tool_wear * 0.2;
    
    // Vibration risk
    if (state.mechanical.vibration_x > 5) risk += 0.15;
    
    return Math.min(1, risk);
  }

  private generateExplanation(
    query: InterventionQuery,
    currentValue: number,
    newValue: number,
    causalEffect: number,
    indirectEffects: Array<{ variable: string; predictedChange: number; pathway: string }>,
    riskChange: 'increased' | 'decreased' | 'unchanged'
  ): string {
    const config = VARIABLE_CONFIG[query.variable];
    const unit = config?.unit || '';
    const changeDesc = newValue > currentValue ? 'increases' : 'decreases';
    const magnitude = Math.abs(((newValue - currentValue) / currentValue) * 100).toFixed(1);
    
    let explanation = `If ${query.variable.replace(/_/g, ' ')} ${changeDesc} from ${currentValue.toFixed(1)}${unit} to ${newValue.toFixed(1)}${unit} (${magnitude}% change):\n`;
    
    // Add direct effect
    explanation += `\n• Direct causal effect: ${causalEffect > 0 ? '+' : ''}${(causalEffect * 100).toFixed(1)}% on system outcome`;
    
    // Add significant indirect effects
    const significantEffects = indirectEffects.filter(e => Math.abs(e.predictedChange) > 0.05);
    if (significantEffects.length > 0) {
      explanation += `\n• Predicted cascading effects:`;
      significantEffects.slice(0, 3).forEach(e => {
        const dir = e.predictedChange > 0 ? '↑' : '↓';
        explanation += `\n  - ${e.variable.replace(/_/g, ' ')} ${dir} ${Math.abs(e.predictedChange * 100).toFixed(1)}%`;
      });
    }
    
    // Add risk summary
    explanation += `\n\n• Overall risk: ${riskChange}`;
    
    return explanation;
  }

  /**
   * Get all available intervention variables
   */
  getAvailableVariables(): Array<{
    variable: string;
    domain: IndustrialDomain;
    unit: string;
    normalRange: [number, number];
  }> {
    return Object.entries(VARIABLE_CONFIG).map(([variable, config]) => ({
      variable,
      domain: config.domain,
      unit: config.unit,
      normalRange: config.normalRange,
    }));
  }
}

// Singleton instance
let engineInstance: CounterfactualEngine | null = null;

export function getCounterfactualEngine(): CounterfactualEngine {
  if (!engineInstance) {
    engineInstance = new CounterfactualEngine();
  }
  return engineInstance;
}
