
import { FailureMode, SystemState, IndustrialDomain } from '@/types/industrial';
import { PhysicsSimulator } from './physicsSimulator';

export class FailureSimulator {
  private failureModes: FailureMode[] = [];
  private activeFailures: Map<string, number> = new Map(); // failureId -> progression
  private simulator: PhysicsSimulator;

  constructor(simulator: PhysicsSimulator) {
    this.simulator = simulator;
    this.initializeFailureModes();
  }

  private initializeFailureModes(): void {
    this.failureModes = [
      {
        id: 'hydraulic_leak',
        name: 'Hydraulic System Leak',
        domain: 'hydraulic',
        progression_type: 'gradual',
        severity: 'high',
        causal_chain: [
          { cause: 'hydraulic_pressure', effect: 'hydraulic_flow_rate', strength: 0.8, lag: 0.1, domain_bridge: false },
          { cause: 'hydraulic_pressure', effect: 'mechanical_torque', strength: 0.6, lag: 0.5, domain_bridge: true }
        ]
      },
      {
        id: 'bearing_wear',
        name: 'Bearing Wear',
        domain: 'mechanical',
        progression_type: 'gradual',
        severity: 'medium',
        causal_chain: [
          { cause: 'mechanical_wear_level', effect: 'mechanical_vibration_x', strength: 0.9, lag: 0.1, domain_bridge: false },
          { cause: 'mechanical_wear_level', effect: 'mechanical_vibration_y', strength: 0.9, lag: 0.1, domain_bridge: false },
          { cause: 'mechanical_vibration_x', effect: 'cutting_surface_quality', strength: 0.7, lag: 1.0, domain_bridge: true }
        ]
      },
      {
        id: 'thermal_overload',
        name: 'Thermal Overload',
        domain: 'thermal',
        progression_type: 'sudden',
        severity: 'high',
        causal_chain: [
          { cause: 'electrical_power', effect: 'thermal_system_temp', strength: 0.8, lag: 2.0, domain_bridge: true },
          { cause: 'thermal_system_temp', effect: 'hydraulic_viscosity', strength: 0.6, lag: 1.0, domain_bridge: true },
          { cause: 'thermal_system_temp', effect: 'electrical_voltage', strength: 0.5, lag: 0.5, domain_bridge: true }
        ]
      },
      {
        id: 'voltage_fluctuation',
        name: 'Electrical Voltage Fluctuation',
        domain: 'electrical',
        progression_type: 'intermittent',
        severity: 'medium',
        causal_chain: [
          { cause: 'electrical_voltage', effect: 'electrical_power', strength: 0.9, lag: 0.1, domain_bridge: false },
          { cause: 'electrical_power', effect: 'hydraulic_pressure', strength: 0.7, lag: 0.3, domain_bridge: true },
          { cause: 'electrical_power', effect: 'mechanical_speed', strength: 0.6, lag: 0.2, domain_bridge: true }
        ]
      },
      {
        id: 'tool_wear_excessive',
        name: 'Excessive Tool Wear',
        domain: 'cutting',
        progression_type: 'gradual',
        severity: 'high',
        causal_chain: [
          { cause: 'cutting_tool_wear', effect: 'cutting_cutting_force', strength: 0.8, lag: 0.1, domain_bridge: false },
          { cause: 'cutting_cutting_force', effect: 'mechanical_torque', strength: 0.6, lag: 0.2, domain_bridge: true },
          { cause: 'cutting_tool_wear', effect: 'cutting_surface_quality', strength: 0.9, lag: 0.1, domain_bridge: false }
        ]
      }
    ];
  }

  public injectFailure(failureId: string, initialSeverity: number = 0.1): void {
    const failureMode = this.failureModes.find(f => f.id === failureId);
    if (!failureMode) {
      console.warn(`Unknown failure mode: ${failureId}`);
      return;
    }

    this.activeFailures.set(failureId, initialSeverity);
    console.log(`Injected failure: ${failureMode.name} with severity ${initialSeverity}`);
  }

  public progressFailures(timeStep: number): void {
    this.activeFailures.forEach((severity, failureId) => {
      const failureMode = this.failureModes.find(f => f.id === failureId);
      if (!failureMode) return;

      let newSeverity = severity;

      switch (failureMode.progression_type) {
        case 'gradual':
          // Exponential progression for gradual failures
          newSeverity = Math.min(1.0, severity + 0.001 * timeStep * (1 + severity));
          break;
        case 'sudden':
          // Sudden jump after threshold
          if (severity < 0.5) {
            newSeverity = severity + 0.0005 * timeStep;
          } else {
            newSeverity = Math.min(1.0, severity + 0.1 * timeStep);
          }
          break;
        case 'intermittent':
          // Oscillating pattern
          const oscillation = Math.sin(Date.now() * 0.001) * 0.1;
          newSeverity = Math.max(0, Math.min(1.0, severity + oscillation + 0.0002 * timeStep));
          break;
      }

      this.activeFailures.set(failureId, newSeverity);

      // Apply failure effects to simulator
      this.applyFailureEffects(failureMode, newSeverity);
    });
  }

  private applyFailureEffects(failureMode: FailureMode, severity: number): void {
    switch (failureMode.id) {
      case 'hydraulic_leak':
        this.simulator.injectFailure('hydraulic', 'leak', severity);
        break;
      case 'bearing_wear':
        this.simulator.injectFailure('mechanical', 'bearing_wear', severity);
        break;
      case 'voltage_fluctuation':
        this.simulator.injectFailure('electrical', 'voltage_drop', severity);
        break;
      // Add more failure effect mappings as needed
    }
  }

  public getActiveFailures(): Array<{id: string, name: string, severity: number, domain: IndustrialDomain}> {
    return Array.from(this.activeFailures.entries()).map(([id, severity]) => {
      const failureMode = this.failureModes.find(f => f.id === id)!;
      return {
        id,
        name: failureMode.name,
        severity,
        domain: failureMode.domain
      };
    });
  }

  public getFailureModes(): FailureMode[] {
    return [...this.failureModes];
  }

  public clearFailure(failureId: string): void {
    this.activeFailures.delete(failureId);
  }

  public clearAllFailures(): void {
    this.activeFailures.clear();
  }
}
