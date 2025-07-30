import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { SystemState } from '@/types/industrial';

interface SystemEvolutionData {
  timestamp: Date;
  systemState: SystemState;
}

interface SystemEvolutionDashboardProps {
  evolutionData: SystemEvolutionData[];
  currentState?: SystemState;
  timeWindow?: number; // minutes
}

const SystemEvolutionDashboard: React.FC<SystemEvolutionDashboardProps> = ({ 
  evolutionData = [],
  currentState,
  timeWindow = 30 
}) => {
  // Generate sample data if none provided
  const generateSampleData = (): SystemEvolutionData[] => {
    const now = new Date();
    return Array.from({ length: 50 }, (_, i) => {
      const timestamp = new Date(now.getTime() - (49 - i) * 30000); // 30-second intervals
      const noise = () => (Math.random() - 0.5) * 0.1;
      
      return {
        timestamp,
        systemState: {
          hydraulic: {
            pressure: 150 + Math.sin(i * 0.1) * 20 + noise() * 10,
            flow_rate: 2.5 + Math.cos(i * 0.08) * 0.5 + noise() * 0.2,
            temperature: 45 + Math.sin(i * 0.05) * 5 + noise() * 2,
            viscosity: 0.02 + noise() * 0.005,
            contamination: 0.1 + noise() * 0.05
          },
          mechanical: {
            vibration_x: 0.5 + Math.abs(Math.sin(i * 0.15)) * 0.3 + noise() * 0.1,
            vibration_y: 0.4 + Math.abs(Math.cos(i * 0.16)) * 0.2 + noise() * 0.08,
            vibration_z: 0.3 + Math.abs(Math.sin(i * 0.14)) * 0.2 + noise() * 0.06,
            speed: 1800 + Math.sin(i * 0.06) * 100 + noise() * 20,
            torque: 250 + Math.cos(i * 0.09) * 30 + noise() * 10,
            wear_level: Math.min(1, (i / 49) * 0.3 + noise() * 0.05)
          },
          thermal: {
            system_temp: 75 + Math.sin(i * 0.07) * 8 + noise() * 3,
            ambient_temp: 25 + Math.sin(i * 0.03) * 3 + noise() * 1,
            thermal_gradient: 0.8 + Math.cos(i * 0.11) * 0.15 + noise() * 0.05,
            heat_dissipation: 120 + Math.sin(i * 0.08) * 15 + noise() * 5
          },
          electrical: {
            voltage: 220 + Math.sin(i * 0.13) * 5 + noise() * 2,
            current: 15 + Math.cos(i * 0.1) * 2 + noise() * 1,
            power: 3300 + Math.sin(i * 0.14) * 200 + noise() * 100,
            frequency: 50 + noise() * 0.1,
            phase_shift: 0.05 + noise() * 0.02
          },
          cutting: {
            cutting_force: 100 + Math.sin(i * 0.16) * 10 + noise() * 5,
            tool_wear: Math.min(1, (i / 49) * 0.4 + noise() * 0.05),
            surface_quality: 0.9 - Math.min(0.3, (i / 49) * 0.2) + noise() * 0.05,
            chip_formation: 0.7 + Math.cos(i * 0.12) * 0.2 + noise() * 0.1
          }
        }
      };
    });
  };

  const data = evolutionData.length > 0 ? evolutionData : generateSampleData();
  
    // Transform data for charts
  const chartData = data.map(item => ({
    time: item.timestamp.toLocaleTimeString(),
    timestamp: item.timestamp.getTime(),
    // Hydraulic
    hydraulic_pressure: item.systemState.hydraulic.pressure,
    hydraulic_flow: item.systemState.hydraulic.flow_rate,
    hydraulic_temp: item.systemState.hydraulic.temperature,
    hydraulic_viscosity: item.systemState.hydraulic.viscosity * 1000, // Convert to convenient scale
    // Mechanical
    vibration_x: item.systemState.mechanical.vibration_x,
    speed: item.systemState.mechanical.speed,
    torque: item.systemState.mechanical.torque,
    wear_level: item.systemState.mechanical.wear_level * 100,
    // Thermal
    system_temp: item.systemState.thermal.system_temp,
    ambient_temp: item.systemState.thermal.ambient_temp,
    thermal_gradient: item.systemState.thermal.thermal_gradient * 100,
    heat_dissipation: item.systemState.thermal.heat_dissipation,
    // Electrical
    voltage: item.systemState.electrical.voltage,
    current: item.systemState.electrical.current,
    power: item.systemState.electrical.power,
    frequency: item.systemState.electrical.frequency,
    // Cutting
    cutting_force: item.systemState.cutting.cutting_force,
    tool_wear: item.systemState.cutting.tool_wear * 100,
    surface_quality: item.systemState.cutting.surface_quality * 100
  }));

  const getCurrentStatus = () => {
    if (!currentState) return 'Unknown';
    
    const hydraulicHealth = (currentState.hydraulic.pressure / 200); // Normalize to 0-1
    const mechanicalHealth = 1 - currentState.mechanical.wear_level;
    const thermalHealth = Math.max(0, 1 - (currentState.thermal.system_temp - 25) / 100); // Normalize temp
    const electricalHealth = Math.min(1, currentState.electrical.power / 4000); // Normalize power
    const cuttingHealth = currentState.cutting.surface_quality;
    
    const overallHealth = (hydraulicHealth + mechanicalHealth + thermalHealth + electricalHealth + cuttingHealth) / 5;
    
    if (overallHealth > 0.8) return 'Excellent';
    if (overallHealth > 0.6) return 'Good';
    if (overallHealth > 0.4) return 'Fair';
    return 'Critical';
  };

  const status = getCurrentStatus();
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Excellent': return 'text-green-600 dark:text-green-400';
      case 'Good': return 'text-blue-600 dark:text-blue-400';
      case 'Fair': return 'text-yellow-600 dark:text-yellow-400';
      case 'Critical': return 'text-red-600 dark:text-red-400';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          System State Evolution Dashboard
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {timeWindow}min window
            </Badge>
            <Badge variant="outline" className={getStatusColor(status)}>
              {status}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* System Health Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {currentState && [
              { name: 'Hydraulic', value: (currentState.hydraulic.pressure / 200) * 100, unit: '%' },
              { name: 'Mechanical', value: (1 - currentState.mechanical.wear_level) * 100, unit: '%' },
              { name: 'Thermal', value: Math.max(0, (1 - (currentState.thermal.system_temp - 25) / 100)) * 100, unit: '%' },
              { name: 'Electrical', value: Math.min(100, (currentState.electrical.power / 4000) * 100), unit: '%' },
              { name: 'Cutting', value: currentState.cutting.surface_quality * 100, unit: '%' }
            ].map(system => (
              <div key={system.name} className="text-center p-3 bg-muted rounded-md">
                <div className="text-2xl font-bold text-primary">
                  {system.value.toFixed(1)}{system.unit}
                </div>
                <div className="text-xs text-muted-foreground">{system.name} Health</div>
              </div>
            ))}
          </div>

          {/* Critical Parameters Chart */}
          <div className="space-y-4">
            <h4 className="font-medium">Critical Parameters Evolution</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="time" 
                    className="text-xs"
                    interval="preserveStartEnd"
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="hydraulic_pressure" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Hydraulic Pressure"
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="system_temp" 
                    stroke="hsl(var(--destructive))" 
                    strokeWidth={2}
                    name="System Temperature"
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="vibration_x" 
                    stroke="hsl(var(--secondary))" 
                    strokeWidth={2}
                    name="Vibration X"
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="voltage" 
                    stroke="hsl(var(--accent))" 
                    strokeWidth={2}
                    name="Voltage"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Efficiency Trends */}
          <div className="space-y-4">
            <h4 className="font-medium">System Efficiency Trends</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="time" 
                    className="text-xs"
                    interval="preserveStartEnd"
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis 
                    className="text-xs"
                    domain={[0, 100]}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="hydraulic_viscosity" 
                    stackId="1"
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary) / 0.3)"
                    name="Hydraulic Viscosity"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="thermal_gradient" 
                    stackId="2"
                    stroke="hsl(var(--secondary))" 
                    fill="hsl(var(--secondary) / 0.3)"
                    name="Thermal Gradient %"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="surface_quality" 
                    stackId="3"
                    stroke="hsl(var(--accent))" 
                    fill="hsl(var(--accent) / 0.3)"
                    name="Surface Quality %"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* System Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Performance Metrics</h4>
              <div className="space-y-2 text-sm">
                {currentState && [
                  { label: 'Average Temperature', value: `${((currentState.thermal.system_temp + currentState.thermal.ambient_temp) / 2).toFixed(1)}°C` },
                  { label: 'Power Consumption', value: `${(currentState.electrical.power / 1000).toFixed(2)}kW` },
                  { label: 'Overall Vibration', value: `${currentState.mechanical.vibration_x.toFixed(3)}mm/s` },
                  { label: 'System Uptime', value: '98.5%' }
                ].map(metric => (
                  <div key={metric.label} className="flex justify-between p-2 bg-muted rounded">
                    <span>{metric.label}</span>
                    <span className="font-medium">{metric.value}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Trend Analysis</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-2 bg-muted rounded">
                  <span>Data Points</span>
                  <span className="font-medium">{chartData.length}</span>
                </div>
                <div className="flex justify-between p-2 bg-muted rounded">
                  <span>Sampling Rate</span>
                  <span className="font-medium">30s</span>
                </div>
                <div className="flex justify-between p-2 bg-muted rounded">
                  <span>System Status</span>
                  <span className={`font-medium ${getStatusColor(status)}`}>{status}</span>
                </div>
                <div className="flex justify-between p-2 bg-muted rounded">
                  <span>Last Update</span>
                  <span className="font-medium">
                    {data.length > 0 ? new Date(data[data.length - 1].timestamp).toLocaleTimeString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemEvolutionDashboard;