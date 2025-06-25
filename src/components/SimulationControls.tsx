
import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface SimulationControlsProps {
  isRunning: boolean;
  onToggleSimulation: () => void;
  onClearFailures: () => void;
}

const SimulationControls: React.FC<SimulationControlsProps> = ({
  isRunning,
  onToggleSimulation,
  onClearFailures
}) => {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-3xl font-bold">Industrial Multi-System Causal Health Monitor</h1>
      <div className="flex gap-2">
        <Button 
          onClick={onToggleSimulation}
          variant={isRunning ? "destructive" : "default"}
        >
          {isRunning ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
          {isRunning ? "Stop" : "Start"} Simulation
        </Button>
        <Button onClick={onClearFailures} variant="outline">
          <RotateCcw className="h-4 w-4 mr-2" />
          Clear Failures
        </Button>
      </div>
    </div>
  );
};

export default SimulationControls;
