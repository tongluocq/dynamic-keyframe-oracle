
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplets, Wrench, Thermometer, Zap, Activity } from 'lucide-react';
import { SystemState } from '@/types/industrial';

interface SystemOverviewCardProps {
  currentState: SystemState;
}

const SystemOverviewCard: React.FC<SystemOverviewCardProps> = ({ currentState }) => {
  return (
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
  );
};

export default SystemOverviewCard;
