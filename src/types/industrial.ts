
export interface SensorReading {
  timestamp: number;
  value: number;
  sensorId: string;
  domain: IndustrialDomain;
}

export interface SystemState {
  hydraulic: HydraulicState;
  mechanical: MechanicalState;
  thermal: ThermalState;
  electrical: ElectricalState;
  cutting: CuttingState;
}

export interface HydraulicState {
  pressure: number;
  flow_rate: number;
  temperature: number;
  viscosity: number;
  contamination: number;
}

export interface MechanicalState {
  vibration_x: number;
  vibration_y: number;
  vibration_z: number;
  torque: number;
  speed: number;
  wear_level: number;
}

export interface ThermalState {
  ambient_temp: number;
  system_temp: number;
  heat_dissipation: number;
  thermal_gradient: number;
}

export interface ElectricalState {
  voltage: number;
  current: number;
  power: number;
  frequency: number;
  phase_shift: number;
}

export interface CuttingState {
  tool_wear: number;
  cutting_force: number;
  surface_quality: number;
  chip_formation: number;
}

export type IndustrialDomain = 'hydraulic' | 'mechanical' | 'thermal' | 'electrical' | 'cutting';

export interface CausalRelation {
  cause: string;
  effect: string;
  strength: number;
  lag: number;
  domain_bridge: boolean;
}

export interface FailureMode {
  id: string;
  name: string;
  domain: IndustrialDomain;
  progression_type: 'gradual' | 'sudden' | 'intermittent';
  severity: 'low' | 'medium' | 'high';
  causal_chain: CausalRelation[];
}

export interface BenchmarkMetrics {
  causal_discovery_accuracy: number;
  failure_prediction_accuracy: number;
  root_cause_precision: number;
  intervention_effectiveness: number;
  false_alarm_rate: number;
}
