import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SystemState, SensorReading, ActiveFailure, CausalRelation } from '@/types/industrial';
import { useVisualizationData } from '@/hooks/useVisualizationData';

// Import visualization components
import ClassificationHeatmap from './visualizations/ClassificationHeatmap';
import CausalEffectEvolution from './visualizations/CausalEffectEvolution';
import CrossDomainMatrix from './visualizations/CrossDomainMatrix';
import SystemEvolutionDashboard from './visualizations/SystemEvolutionDashboard';
import FailurePropagationFlow from './visualizations/FailurePropagationFlow';

interface VisualizationDashboardProps {
  currentState?: SystemState;
  sensorReadings?: SensorReading[];
  activeFailures?: ActiveFailure[];
  causalGraph?: Map<string, CausalRelation[]>;
  classificationLogits?: number[];
  causalEffect?: number;
  isRunning?: boolean;
  onClearFailures?: () => void;
}

const VisualizationDashboard: React.FC<VisualizationDashboardProps> = ({
  currentState,
  sensorReadings = [],
  activeFailures = [],
  causalGraph = new Map(),
  classificationLogits = [],
  causalEffect = 0,
  isRunning = false,
  onClearFailures
}) => {
  const {
    dataStore,
    addSystemState,
    addSensorData,
    addFailures,
    addCausalGraph,
    addClassificationResult,
    addCausalEffect,
    clearHistory,
    getLatestData,
    getDataInTimeWindow,
    generateTrainingMetrics,
    getDataStatistics
  } = useVisualizationData({
    maxHistoryLength: 100,
    enableDataCollection: true
  });

  // Update data store when new data arrives
  React.useEffect(() => {
    if (currentState) addSystemState(currentState);
  }, [currentState, addSystemState]);

  React.useEffect(() => {
    if (sensorReadings.length > 0) addSensorData(sensorReadings);
  }, [sensorReadings, addSensorData]);

  React.useEffect(() => {
    if (activeFailures.length > 0) addFailures(activeFailures);
  }, [activeFailures, addFailures]);

  React.useEffect(() => {
    if (causalGraph.size > 0) addCausalGraph(causalGraph);
  }, [causalGraph, addCausalGraph]);

  React.useEffect(() => {
    if (classificationLogits.length > 0) addClassificationResult(classificationLogits);
  }, [classificationLogits, addClassificationResult]);

  React.useEffect(() => {
    if (causalEffect !== 0) addCausalEffect(causalEffect);
  }, [causalEffect, addCausalEffect]);

  const latestData = getLatestData();
  const timeWindowData = getDataInTimeWindow(30);
  const trainingMetrics = generateTrainingMetrics();
  const statistics = getDataStatistics();

  const getSystemStatus = () => {
    if (!isRunning) return 'Stopped';
    if (activeFailures.length > 0) return 'Issues Detected';
    return 'Normal Operation';
  };

  const getStatusColor = () => {
    if (!isRunning) return 'text-muted-foreground';
    if (activeFailures.length > 0) return 'text-red-600 dark:text-red-400';
    return 'text-green-600 dark:text-green-400';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            Advanced Visualization Dashboard
            <Badge variant="outline" className={getStatusColor()}>
              {getSystemStatus()}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {statistics.totalDataPoints} data points
            </Badge>
            <Button variant="outline" size="sm" onClick={clearHistory}>
              Clear History
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="classification" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="classification">Classification</TabsTrigger>
            <TabsTrigger value="evolution">Evolution</TabsTrigger>
            <TabsTrigger value="cross-domain">Cross-Domain</TabsTrigger>
            <TabsTrigger value="system-state">System State</TabsTrigger>
            <TabsTrigger value="propagation">Propagation</TabsTrigger>
          </TabsList>

          <TabsContent value="classification" className="space-y-4">
            <ClassificationHeatmap
              classificationLogits={latestData.classificationLogits}
              timestamp={new Date()}
            />
          </TabsContent>

          <TabsContent value="evolution" className="space-y-4">
            <CausalEffectEvolution
              trainingMetrics={trainingMetrics}
              realtimeCausalEffect={latestData.causalEffect}
              isTraining={isRunning}
            />
          </TabsContent>

          <TabsContent value="cross-domain" className="space-y-4">
            <CrossDomainMatrix
              causalGraph={latestData.causalGraph}
            />
          </TabsContent>

          <TabsContent value="system-state" className="space-y-4">
            <SystemEvolutionDashboard
              evolutionData={timeWindowData.systemStateHistory}
              currentState={latestData.systemState}
              timeWindow={30}
            />
          </TabsContent>

          <TabsContent value="propagation" className="space-y-4">
            <FailurePropagationFlow
              activeFailures={latestData.failures}
              causalGraph={latestData.causalGraph}
              onClearFailures={onClearFailures}
            />
          </TabsContent>
        </Tabs>

        {/* Data Collection Statistics */}
        <div className="mt-6 p-4 bg-muted rounded-md">
          <h4 className="font-medium mb-2">Data Collection Statistics</h4>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="flex justify-between">
              <span>Collection Duration:</span>
              <span className="font-medium">
                {statistics.dataCollectionDuration > 0 
                  ? `${(statistics.dataCollectionDuration / 1000 / 60).toFixed(1)}m` 
                  : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Average Failures:</span>
              <span className="font-medium">{statistics.averageFailures.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span>Causal Relations:</span>
              <span className="font-medium">{statistics.causalRelationships}</span>
            </div>
            <div className="flex justify-between">
              <span>Update Rate:</span>
              <span className="font-medium">Real-time</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VisualizationDashboard;