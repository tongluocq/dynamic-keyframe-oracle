
import React, { useState, useEffect } from 'react';
import { PhysicsSimulator } from '@/utils/physicsSimulator';
import { FailureSimulator } from '@/utils/failureSimulator';
import { CausalDiscovery } from '@/utils/causalInference';
import { SystemState, SensorReading, CausalRelation } from '@/types/industrial';
import SimulationControls from './SimulationControls';
import SystemOverviewCard from './SystemOverviewCard';
import ActiveFailuresCard from './ActiveFailuresCard';
import CausalAnomaliesCard from './CausalAnomaliesCard';
import CausalGraphCard from './CausalGraphCard';
import EnhancedCausalMonitor from './EnhancedCausalMonitor';
import VisualizationDashboard from './VisualizationDashboard';

const IndustrialMonitor = () => {
  const [simulator] = useState(() => new PhysicsSimulator());
  const [failureSimulator] = useState(() => new FailureSimulator(simulator));
  const [causalAnalyzer] = useState(() => new CausalDiscovery());
  
  const [isRunning, setIsRunning] = useState(false);
  const [currentState, setCurrentState] = useState<SystemState | null>(null);
  const [sensorData, setSensorData] = useState<SensorReading[]>([]);
  const [causalGraph, setCausalGraph] = useState<Map<string, CausalRelation[]>>(new Map());
  const [anomalies, setAnomalies] = useState<Array<{sensor: string, anomaly_score: number}>>([]);
  const [activeFailures, setActiveFailures] = useState<Array<{id: string, name: string, severity: number, domain: string}>>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning) {
      interval = setInterval(() => {
        // Step simulation
        const newState = simulator.step();
        setCurrentState(newState);
        
        // Progress failures
        failureSimulator.progressFailures(0.1);
        setActiveFailures(failureSimulator.getActiveFailures());
        
        // Convert state to sensor readings
        const readings = convertStateToSensorReadings(newState);
        setSensorData(prev => [...prev, ...readings].slice(-1000)); // Keep last 1000 readings
        
        // Update causal analysis
        causalAnalyzer.addData(readings);
        
        // Perform causal discovery every 10 steps
        if (sensorData.length % 100 === 0 && sensorData.length > 0) {
          const discoveredGraph = causalAnalyzer.discoverCausalStructure();
          setCausalGraph(discoveredGraph);
        }
        
        // Detect anomalies
        const detectedAnomalies = causalAnalyzer.detectCausalAnomalies(readings);
        setAnomalies(detectedAnomalies);
        
      }, 100); // 100ms interval
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, sensorData.length, simulator, failureSimulator, causalAnalyzer]);

  const convertStateToSensorReadings = (state: SystemState): SensorReading[] => {
    const timestamp = Date.now();
    const readings: SensorReading[] = [];
    
    // Hydraulic sensors
    readings.push(
      { timestamp, value: state.hydraulic.pressure, sensorId: 'hydraulic_pressure', domain: 'hydraulic' },
      { timestamp, value: state.hydraulic.flow_rate, sensorId: 'hydraulic_flow_rate', domain: 'hydraulic' },
      { timestamp, value: state.hydraulic.temperature, sensorId: 'hydraulic_temperature', domain: 'hydraulic' },
      { timestamp, value: state.hydraulic.viscosity, sensorId: 'hydraulic_viscosity', domain: 'hydraulic' }
    );
    
    // Mechanical sensors
    readings.push(
      { timestamp, value: state.mechanical.vibration_x, sensorId: 'mechanical_vibration_x', domain: 'mechanical' },
      { timestamp, value: state.mechanical.vibration_y, sensorId: 'mechanical_vibration_y', domain: 'mechanical' },
      { timestamp, value: state.mechanical.vibration_z, sensorId: 'mechanical_vibration_z', domain: 'mechanical' },
      { timestamp, value: state.mechanical.torque, sensorId: 'mechanical_torque', domain: 'mechanical' },
      { timestamp, value: state.mechanical.speed, sensorId: 'mechanical_speed', domain: 'mechanical' },
      { timestamp, value: state.mechanical.wear_level, sensorId: 'mechanical_wear_level', domain: 'mechanical' }
    );
    
    // Thermal sensors
    readings.push(
      { timestamp, value: state.thermal.system_temp, sensorId: 'thermal_system_temp', domain: 'thermal' },
      { timestamp, value: state.thermal.heat_dissipation, sensorId: 'thermal_heat_dissipation', domain: 'thermal' }
    );
    
    // Electrical sensors
    readings.push(
      { timestamp, value: state.electrical.voltage, sensorId: 'electrical_voltage', domain: 'electrical' },
      { timestamp, value: state.electrical.current, sensorId: 'electrical_current', domain: 'electrical' },
      { timestamp, value: state.electrical.power, sensorId: 'electrical_power', domain: 'electrical' }
    );
    
    // Cutting sensors
    readings.push(
      { timestamp, value: state.cutting.tool_wear, sensorId: 'cutting_tool_wear', domain: 'cutting' },
      { timestamp, value: state.cutting.cutting_force, sensorId: 'cutting_cutting_force', domain: 'cutting' },
      { timestamp, value: state.cutting.surface_quality, sensorId: 'cutting_surface_quality', domain: 'cutting' }
    );
    
    return readings;
  };

  const handleToggleSimulation = () => {
    setIsRunning(!isRunning);
  };

  const handleInjectFailure = (failureId: string) => {
    failureSimulator.injectFailure(failureId, 0.1);
  };

  const handleClearFailures = () => {
    failureSimulator.clearAllFailures();
    setActiveFailures([]);
  };

  return (
    <div className="p-6 space-y-6">
      <SimulationControls
        isRunning={isRunning}
        onToggleSimulation={handleToggleSimulation}
        onClearFailures={handleClearFailures}
      />

      {currentState && (
        <SystemOverviewCard currentState={currentState} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActiveFailuresCard
          activeFailures={activeFailures}
          failureSimulator={failureSimulator}
          onInjectFailure={handleInjectFailure}
        />

        <CausalAnomaliesCard anomalies={anomalies} />
      </div>

      <CausalGraphCard causalGraph={causalGraph} />

      {/* Enhanced Causal Monitor */}
      {currentState && sensorData.length > 0 && (
        <EnhancedCausalMonitor
          currentState={currentState}
          sensorReadings={sensorData.slice(-20)} // Recent readings
          isRunning={isRunning}
        />
      )}
    </div>
  );
};

export default IndustrialMonitor;
