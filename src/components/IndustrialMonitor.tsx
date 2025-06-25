
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Activity, Zap, Thermometer, Wrench, Droplets, Play, Pause, RotateCcw } from 'lucide-react';
import { PhysicsSimulator } from '@/utils/physicsSimulator';
import { FailureSimulator } from '@/utils/failureSimulator';
import { CausalDiscovery } from '@/utils/causalInference';
import { SystemState, SensorReading, CausalRelation } from '@/types/industrial';

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

  const handleInjectFailure = (failureId: string) => {
    failureSimulator.injectFailure(failureId, 0.1);
  };

  const handleClearFailures = () => {
    failureSimulator.clearAllFailures();
    setActiveFailures([]);
  };

  const getDomainIcon = (domain: string) => {
    switch (domain) {
      case 'hydraulic': return <Droplets className="h-4 w-4" />;
      case 'mechanical': return <Wrench className="h-4 w-4" />;
      case 'thermal': return <Thermometer className="h-4 w-4" />;
      case 'electrical': return <Zap className="h-4 w-4" />;
      case 'cutting': return <Activity className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: number) => {
    if (severity > 0.7) return 'destructive';
    if (severity > 0.4) return 'secondary';
    return 'outline';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Industrial Multi-System Causal Health Monitor</h1>
        <div className="flex gap-2">
          <Button 
            onClick={() => setIsRunning(!isRunning)}
            variant={isRunning ? "destructive" : "default"}
          >
            {isRunning ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {isRunning ? "Stop" : "Start"} Simulation
          </Button>
          <Button onClick={handleClearFailures} variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear Failures
          </Button>
        </div>
      </div>

      {/* System Overview */}
      {currentState && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Hydraulic System */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hydraulic</CardTitle>
              <Droplets className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-xs">
                <div>Pressure: {currentState.hydraulic.pressure.toFixed(1)} bar</div>
                <div>Flow: {currentState.hydraulic.flow_rate.toFixed(1)} L/min</div>
                <div>Temp: {currentState.hydraulic.temperature.toFixed(1)}°C</div>
              </div>
            </CardContent>
          </Card>

          {/* Mechanical System */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mechanical</CardTitle>
              <Wrench className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-xs">
                <div>Vibration: {Math.sqrt(currentState.mechanical.vibration_x ** 2 + currentState.mechanical.vibration_y ** 2).toFixed(2)} mm/s</div>
                <div>Torque: {currentState.mechanical.torque.toFixed(1)} Nm</div>
                <div>Wear: {(currentState.mechanical.wear_level * 100).toFixed(1)}%</div>
              </div>
            </CardContent>
          </Card>

          {/* Thermal System */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Thermal</CardTitle>
              <Thermometer className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-xs">
                <div>System: {currentState.thermal.system_temp.toFixed(1)}°C</div>
                <div>Ambient: {currentState.thermal.ambient_temp.toFixed(1)}°C</div>
                <div>Dissipation: {currentState.thermal.heat_dissipation.toFixed(0)}W</div>
              </div>
            </CardContent>
          </Card>

          {/* Electrical System */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Electrical</CardTitle>
              <Zap className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-xs">
                <div>Voltage: {currentState.electrical.voltage.toFixed(1)}V</div>
                <div>Current: {currentState.electrical.current.toFixed(1)}A</div>
                <div>Power: {currentState.electrical.power.toFixed(0)}W</div>
              </div>
            </CardContent>
          </Card>

          {/* Cutting System */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cutting</CardTitle>
              <Activity className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-xs">
                <div>Tool Wear: {(currentState.cutting.tool_wear * 100).toFixed(1)}%</div>
                <div>Force: {currentState.cutting.cutting_force.toFixed(0)}N</div>
                <div>Quality: {currentState.cutting.surface_quality.toFixed(2)}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Failures */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Active Failures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeFailures.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  No active failures detected
                </div>
              ) : (
                activeFailures.map((failure) => (
                  <div key={failure.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-2">
                      {getDomainIcon(failure.domain)}
                      <div>
                        <div className="font-medium">{failure.name}</div>
                        <div className="text-sm text-muted-foreground">{failure.domain} domain</div>
                      </div>
                    </div>
                    <Badge variant={getSeverityColor(failure.severity) as any}>
                      {(failure.severity * 100).toFixed(0)}%
                    </Badge>
                  </div>
                ))
              )}
              
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Inject Failure:</h4>
                <div className="flex gap-2 flex-wrap">
                  {failureSimulator.getFailureModes().map((mode) => (
                    <Button
                      key={mode.id}
                      size="sm"
                      variant="outline"
                      onClick={() => handleInjectFailure(mode.id)}
                      disabled={activeFailures.some(f => f.id === mode.id)}
                    >
                      {mode.name}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Causal Anomalies */}
        <Card>
          <CardHeader>
            <CardTitle>Causal Anomalies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {anomalies.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  No causal anomalies detected
                </div>
              ) : (
                anomalies.map((anomaly, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">{anomaly.sensor}</div>
                      <div className="text-sm text-muted-foreground">
                        Causal expectation violated
                      </div>
                    </div>
                    <Badge variant={anomaly.anomaly_score > 0.7 ? 'destructive' : 'secondary'}>
                      {(anomaly.anomaly_score * 100).toFixed(0)}%
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Causal Graph Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Discovered Causal Relationships</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {causalGraph.size === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                Causal discovery in progress... (need more data)
              </div>
            ) : (
              Array.from(causalGraph.entries()).map(([cause, relations]) => (
                relations.map((relation, index) => (
                  <div key={`${cause}-${index}`} className="flex items-center justify-between p-2 border rounded text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{relation.cause}</span>
                      <span>→</span>
                      <span>{relation.effect}</span>
                      {relation.domain_bridge && (
                        <Badge variant="outline" className="text-xs">cross-domain</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        Strength: {relation.strength.toFixed(2)}
                      </span>
                      <span className="text-muted-foreground">
                        Lag: {relation.lag.toFixed(1)}s
                      </span>
                    </div>
                  </div>
                ))
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IndustrialMonitor;
