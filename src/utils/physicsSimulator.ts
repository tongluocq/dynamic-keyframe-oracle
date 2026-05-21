
import { SystemState, HydraulicState, MechanicalState, ThermalState, ElectricalState, CuttingState } from '@/types/industrial';

export class PhysicsSimulator {
  private currentState: SystemState;
  private timeStep: number = 0.1; // seconds
  private noise_level: number = 0.05;

  constructor() {
    this.currentState = this.initializeState();
  }

  private initializeState(): SystemState {
    return {
      hydraulic: {
        pressure: 150 + Math.random() * 50, // bar
        flow_rate: 10 + Math.random() * 5, // L/min
        temperature: 40 + Math.random() * 10, // °C
        viscosity: 30 + Math.random() * 5, // cSt
        contamination: 0.1 + Math.random() * 0.05 // %
      },
      mechanical: {
        vibration_x: 0.5 + Math.random() * 0.3, // mm/s
        vibration_y: 0.5 + Math.random() * 0.3,
        vibration_z: 0.5 + Math.random() * 0.3,
        torque: 100 + Math.random() * 20, // Nm
        speed: 1800 + Math.random() * 200, // rpm
        wear_level: 0.05 + Math.random() * 0.02 // %
      },
      thermal: {
        ambient_temp: 20 + Math.random() * 5, // °C
        system_temp: 45 + Math.random() * 10,
        heat_dissipation: 500 + Math.random() * 100, // W
        thermal_gradient: 15 + Math.random() * 5 // °C/m
      },
      electrical: {
        voltage: 380 + Math.random() * 20, // V
        current: 15 + Math.random() * 5, // A
        power: 5700 + Math.random() * 500, // W
        frequency: 50 + Math.random() * 0.5, // Hz
        phase_shift: Math.random() * 5 // degrees
      },
      cutting: {
        tool_wear: 0.1 + Math.random() * 0.05, // %
        cutting_force: 800 + Math.random() * 200, // N
        surface_quality: 0.8 + Math.random() * 0.15, // Ra
        chip_formation: 0.7 + Math.random() * 0.2 // efficiency
      }
    };
  }

  // Physics-based causal relationships
  private updateHydraulicSystem(state: SystemState): HydraulicState {
    const newState = { ...state.hydraulic };
    
    // Temperature affects viscosity (causal relation)
    newState.viscosity = 30 + (newState.temperature - 40) * 0.5;
    
    // Pressure derived from 150 bar baseline, modulated by contamination & electrical power (non-compounding)
    const contamination_factor = Math.max(0.5, 1 - newState.contamination * 0.1);
    const power_factor = Math.max(0.5, Math.min(1.5, state.electrical.power / 6000));
    newState.pressure = 150 * contamination_factor * power_factor
      + (Math.random() - 0.5) * this.noise_level * 150;
    newState.flow_rate = Math.max(1, newState.flow_rate + (Math.random() - 0.5) * this.noise_level * 10);
    
    return newState;
  }

  private updateMechanicalSystem(state: SystemState): MechanicalState {
    const newState = { ...state.mechanical };
    
    // Hydraulic pressure affects torque (causal relation)
    newState.torque = 100 + (state.hydraulic.pressure - 150) * 0.5;
    
    // Wear level affects vibration (causal relation)
    const wear_factor = 1 + newState.wear_level * 2;
    newState.vibration_x = 0.5 * wear_factor;
    newState.vibration_y = 0.5 * wear_factor;
    newState.vibration_z = 0.5 * wear_factor;
    
    // Thermal effects on mechanical components (clamped, non-compounding from 1800 rpm baseline)
    const thermal_factor_mech = 1 + Math.max(-0.2, Math.min(0.2, (state.thermal.system_temp - 45) * 0.01));
    newState.speed = 1800 * thermal_factor_mech;
    
    // Gradual wear progression
    newState.wear_level += 0.0001 * this.timeStep;
    
    // Add noise
    newState.vibration_x += (Math.random() - 0.5) * this.noise_level;
    newState.vibration_y += (Math.random() - 0.5) * this.noise_level;
    newState.vibration_z += (Math.random() - 0.5) * this.noise_level;
    
    return newState;
  }

  private updateThermalSystem(state: SystemState): ThermalState {
    const newState = { ...state.thermal };
    
    // Electrical power generates heat (causal relation)
    const heat_from_electrical = state.electrical.power * 0.02;
    newState.system_temp = newState.ambient_temp + heat_from_electrical;
    
    // Mechanical friction generates heat (causal relation)
    const friction_heat = state.mechanical.torque * 0.01;
    newState.system_temp += friction_heat;
    
    // Heat dissipation affects system temperature
    newState.system_temp -= newState.heat_dissipation * 0.001;
    
    // Add noise
    newState.system_temp += (Math.random() - 0.5) * this.noise_level * 2;
    
    return newState;
  }

  private updateElectricalSystem(state: SystemState): ElectricalState {
    const newState = { ...state.electrical };
    
    // Mechanical load affects current (causal relation)
    newState.current = 15 + (state.mechanical.torque - 100) * 0.05;
    
    // Power calculation (V * I * cos(phi))
    newState.power = newState.voltage * newState.current * Math.cos(newState.phase_shift * Math.PI / 180);
    
    // Thermal effects on electrical resistance (clamped, non-compounding from 380 V baseline)
    const temp_factor = 1 + Math.max(-0.1, Math.min(0.1, (state.thermal.system_temp - 45) * 0.001));
    newState.voltage = 380 * temp_factor + (Math.random() - 0.5) * this.noise_level * 10;
    newState.current = Math.max(0, newState.current + (Math.random() - 0.5) * this.noise_level * 2);

    // Recompute power with stabilized V/I
    newState.power = newState.voltage * newState.current * Math.cos(newState.phase_shift * Math.PI / 180);
    
    return newState;
  }

  private updateCuttingSystem(state: SystemState): CuttingState {
    const newState = { ...state.cutting };
    
    // Mechanical vibration affects surface quality (causal relation)
    const vibration_total = Math.sqrt(
      state.mechanical.vibration_x ** 2 + 
      state.mechanical.vibration_y ** 2 + 
      state.mechanical.vibration_z ** 2
    );
    newState.surface_quality = 1.0 - vibration_total * 0.1;
    
    // Tool wear affects cutting force (causal relation)
    newState.cutting_force = 800 + newState.tool_wear * 1000;
    
    // Thermal effects on tool wear
    const thermal_wear = (state.thermal.system_temp - 45) * 0.0001;
    newState.tool_wear += thermal_wear * this.timeStep;
    
    // Add noise
    newState.cutting_force += (Math.random() - 0.5) * this.noise_level * 50;
    
    return newState;
  }

  public step(): SystemState {
    // Update all systems based on causal relationships
    this.currentState = {
      hydraulic: this.updateHydraulicSystem(this.currentState),
      mechanical: this.updateMechanicalSystem(this.currentState),
      thermal: this.updateThermalSystem(this.currentState),
      electrical: this.updateElectricalSystem(this.currentState),
      cutting: this.updateCuttingSystem(this.currentState)
    };
    
    return { ...this.currentState };
  }

  public getCurrentState(): SystemState {
    return { ...this.currentState };
  }

  public injectFailure(domain: string, failureType: string, severity: number): void {
    switch (domain) {
      case 'hydraulic':
        if (failureType === 'leak') {
          this.currentState.hydraulic.pressure *= (1 - severity * 0.3);
          this.currentState.hydraulic.flow_rate *= (1 - severity * 0.2);
        }
        break;
      case 'mechanical':
        if (failureType === 'bearing_wear') {
          this.currentState.mechanical.wear_level += severity * 0.1;
          this.currentState.mechanical.vibration_x *= (1 + severity);
          this.currentState.mechanical.vibration_y *= (1 + severity);
          this.currentState.mechanical.vibration_z *= (1 + severity);
        }
        break;
      case 'electrical':
        if (failureType === 'voltage_drop') {
          this.currentState.electrical.voltage *= (1 - severity * 0.1);
        }
        break;
    }
  }
}
