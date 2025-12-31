/**
 * Prescriptive AI Module for IMSCHM
 * 
 * This module consumes CVGG causal estimates (ATE, CATE, effects) and 
 * generates actionable maintenance recommendations for TBM operations.
 * 
 * Distribution:
 * - CVGG: Provides numerical causal estimates (ATE, CATE, direct/indirect effects)
 * - IMSCHM/PrescriptiveAI: Interprets estimates and generates human-readable decisions
 */

import { SystemState, CausalRelation, IndustrialDomain } from '@/types/industrial';
import { InferenceResult } from '@/hooks/useEnhancedCVGG';

export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type ActionType = 'immediate' | 'scheduled' | 'monitoring' | 'preventive';

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  actionType: ActionType;
  domain: IndustrialDomain;
  confidence: number;
  causalBasis: string;
  estimatedImpact: {
    riskReduction: number; // 0-1
    costSaving: number; // Relative score 0-100
    downtimeAvoidance: number; // Hours
  };
  suggestedActions: string[];
  relatedSensors: string[];
  timeToAction: string; // e.g., "Immediate", "Within 24h", "Next maintenance window"
}

export interface DecisionContext {
  currentState: SystemState | null;
  anomalies: Array<{ sensor: string; anomaly_score: number; causal_pathway?: string }>;
  activeFailures: Array<{ id: string; name: string; severity: number; domain: string }>;
  causalGraph: Map<string, CausalRelation[]>;
  cvggResult: InferenceResult | null;
  inferenceHistory: InferenceResult[];
}

export interface PrescriptiveOutput {
  recommendations: Recommendation[];
  systemHealthScore: number; // 0-100
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  summary: string;
  topPriority: Recommendation | null;
}

// Thresholds for decision making
const THRESHOLDS = {
  ATE_HIGH: 0.3,
  ATE_MODERATE: 0.15,
  CATE_SIGNIFICANT: 0.25,
  ANOMALY_CRITICAL: 0.8,
  ANOMALY_HIGH: 0.6,
  WEAR_CRITICAL: 0.85,
  WEAR_HIGH: 0.7,
  PRESSURE_HIGH: 180,
  PRESSURE_LOW: 80,
  TEMP_HIGH: 75,
  VIBRATION_HIGH: 5,
};

// Domain-specific intervention strategies
const INTERVENTION_STRATEGIES: Record<IndustrialDomain, {
  primary: string[];
  secondary: string[];
}> = {
  hydraulic: {
    primary: ['Reduce system pressure', 'Check for leaks', 'Replace hydraulic fluid'],
    secondary: ['Inspect seals', 'Clean filters', 'Verify pump operation'],
  },
  mechanical: {
    primary: ['Reduce rotational speed', 'Balance rotating components', 'Replace worn bearings'],
    secondary: ['Lubricate joints', 'Check alignment', 'Tighten loose connections'],
  },
  thermal: {
    primary: ['Increase cooling capacity', 'Reduce load', 'Clean heat exchangers'],
    secondary: ['Check coolant levels', 'Inspect fans', 'Verify thermal paste'],
  },
  electrical: {
    primary: ['Check power supply stability', 'Inspect motor windings', 'Replace capacitors'],
    secondary: ['Clean contacts', 'Check grounding', 'Verify phase balance'],
  },
  cutting: {
    primary: ['Replace cutting tool', 'Adjust cutting parameters', 'Inspect tool holder'],
    secondary: ['Check coolant flow', 'Verify feed rate', 'Inspect chip evacuation'],
  },
};

/**
 * Main Prescriptive AI Engine
 */
export class PrescriptiveAIEngine {
  private lastAnalysisTime: number = 0;
  private recommendationCache: Recommendation[] = [];

  /**
   * Generate prescriptive recommendations based on current context
   */
  analyze(context: DecisionContext): PrescriptiveOutput {
    const recommendations: Recommendation[] = [];
    
    // 1. Analyze CVGG causal effects
    if (context.cvggResult) {
      recommendations.push(...this.analyzeСausalEffects(context.cvggResult, context.currentState));
    }

    // 2. Analyze active failures
    if (context.activeFailures.length > 0) {
      recommendations.push(...this.analyzeActiveFailures(context.activeFailures, context.causalGraph));
    }

    // 3. Analyze anomalies
    if (context.anomalies.length > 0) {
      recommendations.push(...this.analyzeAnomalies(context.anomalies, context.currentState));
    }

    // 4. Analyze system state thresholds
    if (context.currentState) {
      recommendations.push(...this.analyzeSystemThresholds(context.currentState));
    }

    // 5. Analyze causal graph for preventive actions
    if (context.causalGraph.size > 0) {
      recommendations.push(...this.analyzeCausalPaths(context.causalGraph, context.currentState));
    }

    // Sort by priority and confidence
    const sortedRecommendations = this.prioritizeRecommendations(recommendations);

    // Calculate system health score
    const healthScore = this.calculateHealthScore(context);
    const riskLevel = this.determineRiskLevel(healthScore, sortedRecommendations);

    // Generate summary
    const summary = this.generateSummary(sortedRecommendations, healthScore, riskLevel);

    this.recommendationCache = sortedRecommendations;
    this.lastAnalysisTime = Date.now();

    return {
      recommendations: sortedRecommendations,
      systemHealthScore: healthScore,
      riskLevel,
      summary,
      topPriority: sortedRecommendations[0] || null,
    };
  }

  private analyzeСausalEffects(cvggResult: InferenceResult, state: SystemState | null): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const { ATE, CATE, directEffect, indirectEffect } = cvggResult.causalEffects;

    // High ATE indicates significant treatment effect
    if (Math.abs(ATE) > THRESHOLDS.ATE_HIGH) {
      const isPositive = ATE > 0;
      recommendations.push({
        id: `causal-ate-${Date.now()}`,
        title: isPositive ? 'High Positive Causal Effect Detected' : 'High Negative Causal Effect Detected',
        description: `Average Treatment Effect of ${(ATE * 100).toFixed(1)}% detected. ${isPositive ? 'Current intervention is effective.' : 'Current conditions are degrading system performance.'}`,
        priority: Math.abs(ATE) > 0.5 ? 'critical' : 'high',
        actionType: isPositive ? 'monitoring' : 'immediate',
        domain: 'mechanical',
        confidence: cvggResult.classification.confidence,
        causalBasis: `ATE=${ATE.toFixed(3)}, CATE=${CATE.toFixed(3)}`,
        estimatedImpact: {
          riskReduction: Math.abs(ATE),
          costSaving: Math.abs(ATE) * 100,
          downtimeAvoidance: Math.abs(ATE) * 24,
        },
        suggestedActions: isPositive 
          ? ['Maintain current operating parameters', 'Document effective intervention for future reference']
          : ['Identify root cause of degradation', 'Consider reducing system load', 'Schedule diagnostic inspection'],
        relatedSensors: ['mechanical_vibration_x', 'mechanical_vibration_y', 'mechanical_torque'],
        timeToAction: isPositive ? 'Continue monitoring' : 'Within 4 hours',
      });
    }

    // Analyze direct vs indirect effects ratio
    if (directEffect !== undefined && indirectEffect !== undefined) {
      const directRatio = Math.abs(directEffect) / (Math.abs(directEffect) + Math.abs(indirectEffect) + 0.001);
      
      if (directRatio < 0.3 && Math.abs(indirectEffect) > 0.2) {
        recommendations.push({
          id: `causal-indirect-${Date.now()}`,
          title: 'Significant Indirect Causal Pathways',
          description: `Indirect effects (${(indirectEffect * 100).toFixed(1)}%) dominate over direct effects. Cross-domain interactions are driving system behavior.`,
          priority: 'medium',
          actionType: 'scheduled',
          domain: 'mechanical',
          confidence: 0.75,
          causalBasis: `Direct=${directEffect.toFixed(3)}, Indirect=${indirectEffect.toFixed(3)}`,
          estimatedImpact: {
            riskReduction: 0.3,
            costSaving: 40,
            downtimeAvoidance: 8,
          },
          suggestedActions: [
            'Investigate cross-domain dependencies',
            'Check upstream systems for root causes',
            'Consider holistic system calibration',
          ],
          relatedSensors: ['hydraulic_pressure', 'thermal_system_temp', 'electrical_power'],
          timeToAction: 'Next maintenance window',
        });
      }
    }

    return recommendations;
  }

  private analyzeActiveFailures(
    failures: Array<{ id: string; name: string; severity: number; domain: string }>,
    causalGraph: Map<string, CausalRelation[]>
  ): Recommendation[] {
    return failures.map(failure => {
      const domain = failure.domain as IndustrialDomain;
      const strategies = INTERVENTION_STRATEGIES[domain] || INTERVENTION_STRATEGIES.mechanical;
      
      const priority: Priority = failure.severity > 0.7 ? 'critical' : 
                                  failure.severity > 0.4 ? 'high' : 'medium';

      // Find related causal paths
      const relatedCauses: string[] = [];
      causalGraph.forEach((relations, cause) => {
        relations.forEach(rel => {
          if (rel.effect.includes(domain) || rel.cause.includes(domain)) {
            relatedCauses.push(`${rel.cause} → ${rel.effect}`);
          }
        });
      });

      return {
        id: `failure-${failure.id}-${Date.now()}`,
        title: `Active Failure: ${failure.name}`,
        description: `${failure.domain} domain failure at ${(failure.severity * 100).toFixed(0)}% severity. Immediate attention required.`,
        priority,
        actionType: failure.severity > 0.7 ? 'immediate' : 'scheduled',
        domain,
        confidence: 0.95,
        causalBasis: relatedCauses.length > 0 ? relatedCauses.slice(0, 2).join('; ') : 'Direct failure detection',
        estimatedImpact: {
          riskReduction: failure.severity,
          costSaving: failure.severity * 80,
          downtimeAvoidance: failure.severity * 16,
        },
        suggestedActions: [
          ...strategies.primary.slice(0, 2),
          ...strategies.secondary.slice(0, 1),
        ],
        relatedSensors: this.getSensorsForDomain(domain),
        timeToAction: failure.severity > 0.7 ? 'Immediate' : 'Within 24 hours',
      };
    });
  }

  private analyzeAnomalies(
    anomalies: Array<{ sensor: string; anomaly_score: number; causal_pathway?: string }>,
    state: SystemState | null
  ): Recommendation[] {
    const criticalAnomalies = anomalies.filter(a => a.anomaly_score > THRESHOLDS.ANOMALY_HIGH);
    
    return criticalAnomalies.map(anomaly => {
      const domain = this.extractDomainFromSensor(anomaly.sensor);
      const strategies = INTERVENTION_STRATEGIES[domain];

      return {
        id: `anomaly-${anomaly.sensor}-${Date.now()}`,
        title: `Anomaly: ${this.formatSensorName(anomaly.sensor)}`,
        description: `Causal anomaly detected with ${(anomaly.anomaly_score * 100).toFixed(0)}% confidence. ${anomaly.causal_pathway ? `Pathway: ${anomaly.causal_pathway}` : 'Unexpected sensor behavior.'}`,
        priority: anomaly.anomaly_score > THRESHOLDS.ANOMALY_CRITICAL ? 'high' : 'medium',
        actionType: 'monitoring',
        domain,
        confidence: anomaly.anomaly_score,
        causalBasis: anomaly.causal_pathway || 'Statistical deviation from causal expectation',
        estimatedImpact: {
          riskReduction: anomaly.anomaly_score * 0.5,
          costSaving: anomaly.anomaly_score * 30,
          downtimeAvoidance: anomaly.anomaly_score * 4,
        },
        suggestedActions: [
          `Monitor ${this.formatSensorName(anomaly.sensor)} closely`,
          ...strategies.secondary.slice(0, 2),
        ],
        relatedSensors: [anomaly.sensor],
        timeToAction: 'Monitor for 1-2 hours',
      };
    });
  }

  private analyzeSystemThresholds(state: SystemState): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Hydraulic pressure check
    if (state.hydraulic.pressure > THRESHOLDS.PRESSURE_HIGH) {
      recommendations.push({
        id: `threshold-pressure-high-${Date.now()}`,
        title: 'High Hydraulic Pressure Warning',
        description: `Pressure at ${state.hydraulic.pressure.toFixed(1)} bar exceeds safe threshold of ${THRESHOLDS.PRESSURE_HIGH} bar.`,
        priority: 'high',
        actionType: 'immediate',
        domain: 'hydraulic',
        confidence: 1.0,
        causalBasis: 'Direct threshold violation',
        estimatedImpact: {
          riskReduction: 0.7,
          costSaving: 60,
          downtimeAvoidance: 12,
        },
        suggestedActions: INTERVENTION_STRATEGIES.hydraulic.primary,
        relatedSensors: ['hydraulic_pressure', 'hydraulic_flow_rate'],
        timeToAction: 'Within 1 hour',
      });
    }

    // Temperature check
    if (state.thermal.system_temp > THRESHOLDS.TEMP_HIGH) {
      recommendations.push({
        id: `threshold-temp-high-${Date.now()}`,
        title: 'High System Temperature Alert',
        description: `System temperature at ${state.thermal.system_temp.toFixed(1)}°C exceeds threshold of ${THRESHOLDS.TEMP_HIGH}°C.`,
        priority: 'high',
        actionType: 'scheduled',
        domain: 'thermal',
        confidence: 1.0,
        causalBasis: 'Direct threshold violation',
        estimatedImpact: {
          riskReduction: 0.6,
          costSaving: 50,
          downtimeAvoidance: 8,
        },
        suggestedActions: INTERVENTION_STRATEGIES.thermal.primary,
        relatedSensors: ['thermal_system_temp', 'thermal_heat_dissipation'],
        timeToAction: 'Within 2 hours',
      });
    }

    // Wear level check
    if (state.mechanical.wear_level > THRESHOLDS.WEAR_HIGH) {
      const isCritical = state.mechanical.wear_level > THRESHOLDS.WEAR_CRITICAL;
      recommendations.push({
        id: `threshold-wear-${Date.now()}`,
        title: isCritical ? 'Critical Wear Level' : 'High Wear Level Warning',
        description: `Mechanical wear at ${(state.mechanical.wear_level * 100).toFixed(0)}% - ${isCritical ? 'replacement urgently needed' : 'schedule replacement soon'}.`,
        priority: isCritical ? 'critical' : 'high',
        actionType: isCritical ? 'immediate' : 'scheduled',
        domain: 'mechanical',
        confidence: 1.0,
        causalBasis: 'Progressive degradation monitoring',
        estimatedImpact: {
          riskReduction: 0.8,
          costSaving: 70,
          downtimeAvoidance: 24,
        },
        suggestedActions: [
          'Schedule component replacement',
          'Reduce operational load',
          'Increase lubrication frequency',
        ],
        relatedSensors: ['mechanical_wear_level', 'mechanical_vibration_x', 'mechanical_torque'],
        timeToAction: isCritical ? 'Immediate' : 'Within 48 hours',
      });
    }

    // Cutting tool wear
    if (state.cutting.tool_wear > THRESHOLDS.WEAR_HIGH) {
      recommendations.push({
        id: `threshold-tool-wear-${Date.now()}`,
        title: 'Cutting Tool Wear Alert',
        description: `Tool wear at ${(state.cutting.tool_wear * 100).toFixed(0)}% - quality degradation likely.`,
        priority: state.cutting.tool_wear > THRESHOLDS.WEAR_CRITICAL ? 'critical' : 'high',
        actionType: 'scheduled',
        domain: 'cutting',
        confidence: 1.0,
        causalBasis: 'Tool life monitoring',
        estimatedImpact: {
          riskReduction: 0.75,
          costSaving: 55,
          downtimeAvoidance: 6,
        },
        suggestedActions: INTERVENTION_STRATEGIES.cutting.primary,
        relatedSensors: ['cutting_tool_wear', 'cutting_cutting_force', 'cutting_surface_quality'],
        timeToAction: 'Next shift change',
      });
    }

    return recommendations;
  }

  private analyzeCausalPaths(
    causalGraph: Map<string, CausalRelation[]>,
    state: SystemState | null
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Find cross-domain bridges for preventive recommendations
    const crossDomainBridges: CausalRelation[] = [];
    causalGraph.forEach((relations) => {
      relations.forEach(rel => {
        if (rel.domain_bridge && rel.strength > 0.6) {
          crossDomainBridges.push(rel);
        }
      });
    });

    if (crossDomainBridges.length > 0) {
      const topBridge = crossDomainBridges.sort((a, b) => b.strength - a.strength)[0];
      recommendations.push({
        id: `causal-bridge-${Date.now()}`,
        title: 'Cross-Domain Causal Dependency',
        description: `Strong causal link (${(topBridge.strength * 100).toFixed(0)}%) detected: ${topBridge.cause} → ${topBridge.effect}. Monitor both domains together.`,
        priority: 'low',
        actionType: 'preventive',
        domain: this.extractDomainFromSensor(topBridge.cause),
        confidence: topBridge.strength,
        causalBasis: `Lag: ${topBridge.lag.toFixed(1)}s`,
        estimatedImpact: {
          riskReduction: 0.3,
          costSaving: 25,
          downtimeAvoidance: 4,
        },
        suggestedActions: [
          `Monitor ${topBridge.cause} as leading indicator`,
          `Set alerts for ${topBridge.effect} changes`,
          'Consider joint calibration of related subsystems',
        ],
        relatedSensors: [topBridge.cause, topBridge.effect],
        timeToAction: 'Ongoing',
      });
    }

    return recommendations;
  }

  private prioritizeRecommendations(recommendations: Recommendation[]): Recommendation[] {
    const priorityOrder: Record<Priority, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    return recommendations
      .sort((a, b) => {
        // First by priority
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        // Then by confidence
        return b.confidence - a.confidence;
      })
      .slice(0, 10); // Keep top 10
  }

  private calculateHealthScore(context: DecisionContext): number {
    let score = 100;

    // Deduct for active failures
    context.activeFailures.forEach(f => {
      score -= f.severity * 20;
    });

    // Deduct for anomalies
    context.anomalies.forEach(a => {
      score -= a.anomaly_score * 10;
    });

    // Deduct for CVGG negative effects
    if (context.cvggResult) {
      const ate = context.cvggResult.causalEffects.ATE;
      if (ate < 0) {
        score += ate * 30; // ATE is negative, so this subtracts
      }
    }

    // Deduct for threshold violations
    if (context.currentState) {
      if (context.currentState.mechanical.wear_level > THRESHOLDS.WEAR_HIGH) score -= 15;
      if (context.currentState.thermal.system_temp > THRESHOLDS.TEMP_HIGH) score -= 10;
      if (context.currentState.hydraulic.pressure > THRESHOLDS.PRESSURE_HIGH) score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  private determineRiskLevel(healthScore: number, recommendations: Recommendation[]): 'low' | 'moderate' | 'high' | 'critical' {
    const hasCritical = recommendations.some(r => r.priority === 'critical');
    const hasHigh = recommendations.some(r => r.priority === 'high');

    if (hasCritical || healthScore < 30) return 'critical';
    if (hasHigh || healthScore < 50) return 'high';
    if (healthScore < 75) return 'moderate';
    return 'low';
  }

  private generateSummary(recommendations: Recommendation[], healthScore: number, riskLevel: string): string {
    const criticalCount = recommendations.filter(r => r.priority === 'critical').length;
    const highCount = recommendations.filter(r => r.priority === 'high').length;

    if (criticalCount > 0) {
      return `⚠️ ${criticalCount} critical issue(s) require immediate attention. System health at ${healthScore.toFixed(0)}%.`;
    }
    if (highCount > 0) {
      return `${highCount} high-priority recommendation(s) pending. System health at ${healthScore.toFixed(0)}%.`;
    }
    if (recommendations.length > 0) {
      return `${recommendations.length} recommendation(s) for optimization. System operating normally at ${healthScore.toFixed(0)}% health.`;
    }
    return `System operating optimally. Health score: ${healthScore.toFixed(0)}%.`;
  }

  private getSensorsForDomain(domain: IndustrialDomain): string[] {
    const sensorMap: Record<IndustrialDomain, string[]> = {
      hydraulic: ['hydraulic_pressure', 'hydraulic_flow_rate', 'hydraulic_temperature', 'hydraulic_viscosity'],
      mechanical: ['mechanical_vibration_x', 'mechanical_vibration_y', 'mechanical_vibration_z', 'mechanical_torque', 'mechanical_wear_level'],
      thermal: ['thermal_system_temp', 'thermal_heat_dissipation'],
      electrical: ['electrical_voltage', 'electrical_current', 'electrical_power'],
      cutting: ['cutting_tool_wear', 'cutting_cutting_force', 'cutting_surface_quality'],
    };
    return sensorMap[domain] || [];
  }

  private extractDomainFromSensor(sensorId: string): IndustrialDomain {
    if (sensorId.startsWith('hydraulic')) return 'hydraulic';
    if (sensorId.startsWith('mechanical')) return 'mechanical';
    if (sensorId.startsWith('thermal')) return 'thermal';
    if (sensorId.startsWith('electrical')) return 'electrical';
    if (sensorId.startsWith('cutting')) return 'cutting';
    return 'mechanical';
  }

  private formatSensorName(sensorId: string): string {
    return sensorId
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}

// Singleton instance
let prescriptiveEngine: PrescriptiveAIEngine | null = null;

export function getPrescriptiveAIEngine(): PrescriptiveAIEngine {
  if (!prescriptiveEngine) {
    prescriptiveEngine = new PrescriptiveAIEngine();
  }
  return prescriptiveEngine;
}
