import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Settings,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { EnhancedCausalPipeline, EnhancedPipelineResult, PipelineConfig, TreatmentMetadata } from '@/utils/enhancedPipeline';
import { SystemState, SensorReading } from '@/types/industrial';

interface EnhancedCausalMonitorProps {
  currentState: SystemState;
  sensorReadings: SensorReading[];
  isRunning: boolean;
}

const EnhancedCausalMonitor: React.FC<EnhancedCausalMonitorProps> = ({
  currentState,
  sensorReadings,
  isRunning
}) => {
  const [pipeline] = useState(() => new EnhancedCausalPipeline());
  const [result, setResult] = useState<EnhancedPipelineResult | null>(null);
  const [config, setConfig] = useState<PipelineConfig>(pipeline.getConfig());
  const [treatmentMeta, setTreatmentMeta] = useState<TreatmentMetadata>({
    magnitude: 1.0,
    start_time: 300,
    end_time: 600,
    slope: 0.002,
    type_id: 1
  });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isRunning && sensorReadings.length > 0) {
      processCurrentState();
    }
  }, [currentState, sensorReadings, isRunning]);

  const processCurrentState = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      const pipelineResult = await pipeline.processSystemState(
        currentState,
        sensorReadings,
        treatmentMeta
      );
      setResult(pipelineResult);
    } catch (error) {
      console.error('Pipeline processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfigChange = (key: keyof PipelineConfig, value: boolean | number) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    pipeline.updateConfig(newConfig);
  };

  const handleReset = () => {
    pipeline.reset();
    setResult(null);
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return <CheckCircle className="h-4 w-4" />;
      case 'medium': return <Activity className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'critical': return <XCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-6 w-6 text-primary" />
              <CardTitle>Enhanced Causal Health Monitor</CardTitle>
              {isProcessing && <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={isProcessing}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
              <Badge variant={isRunning ? "default" : "secondary"}>
                {isRunning ? <Play className="h-3 w-3 mr-1" /> : <Pause className="h-3 w-3 mr-1" />}
                {isRunning ? 'Running' : 'Paused'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Traditional Causal</label>
              <Switch
                checked={config.enableTraditionalCausal}
                onCheckedChange={(checked) => handleConfigChange('enableTraditionalCausal', checked)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Deep Learning</label>
              <Switch
                checked={config.enableDeepLearning}
                onCheckedChange={(checked) => handleConfigChange('enableDeepLearning', checked)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Monte Carlo</label>
              <Switch
                checked={config.enableMonteCarloUncertainty}
                onCheckedChange={(checked) => handleConfigChange('enableMonteCarloUncertainty', checked)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Counterfactual</label>
              <Switch
                checked={config.enableCounterfactualAnalysis}
                onCheckedChange={(checked) => handleConfigChange('enableCounterfactualAnalysis', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="causal">Causal Analysis</TabsTrigger>
            <TabsTrigger value="deep-learning">Deep Learning</TabsTrigger>
            <TabsTrigger value="uncertainty">Uncertainty</TabsTrigger>
            <TabsTrigger value="training">Training</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Risk Assessment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {getRiskIcon(result.riskLevel)}
                    <span>Risk Assessment</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Badge className={getRiskColor(result.riskLevel)}>
                      {result.riskLevel.toUpperCase()}
                    </Badge>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Confidence</span>
                        <span>{(result.confidence * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={result.confidence * 100} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Classification Results */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Classification</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {result.vggClassification.length > 0 && (
                      <>
                        {['Normal', 'Hydraulic', 'Mechanical', 'Thermal'].map((label, index) => (
                          <div key={label} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>{label}</span>
                              <span>{(result.vggClassification[index] * 100).toFixed(1)}%</span>
                            </div>
                            <Progress value={result.vggClassification[index] * 100} className="h-1" />
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Causal Effect */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>Causal Effect</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-2xl font-bold">
                      {result.vggCausalEffect.toFixed(3)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Treatment Impact
                    </div>
                    {result.counterfactualResult && (
                      <div className="text-sm">
                        <div>Factual: {result.counterfactualResult.factual_effect.toFixed(3)}</div>
                        <div>Counterfactual: {result.counterfactualResult.counterfactual_effect.toFixed(3)}</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.recommendedActions.map((action, index) => (
                    <Alert key={index}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{action}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Causal Analysis Tab */}
          <TabsContent value="causal" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Causal Graph</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    {result.causalGraph.size > 0 
                      ? `${result.causalGraph.size} causal relationships discovered`
                      : 'Insufficient data for causal discovery'
                    }
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Anomalies Detected</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {result.anomalies.length > 0 ? (
                      result.anomalies.map((anomaly, index) => (
                        <div key={index} className="flex justify-between">
                          <span className="text-sm">{anomaly.sensor}</span>
                          <Badge variant="outline">
                            {anomaly.anomaly_score.toFixed(3)}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground">No anomalies detected</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Deep Learning Tab */}
          <TabsContent value="deep-learning" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>CausalVGG Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm font-medium">Model Confidence</div>
                    <div className="text-2xl font-bold">{(result.vggConfidence * 100).toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Causal Effect</div>
                    <div className="text-2xl font-bold">{result.vggCausalEffect.toFixed(3)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Interventions</div>
                    <div className="text-2xl font-bold">{result.detectedInterventions.length}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Uncertainty Tab */}
          <TabsContent value="uncertainty" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Monte Carlo Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium">Causal Mean</div>
                    <div className="text-lg font-bold">{result.monteCarloResult.causal_mean.toFixed(3)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Causal Std</div>
                    <div className="text-lg font-bold">{result.monteCarloResult.causal_std.toFixed(3)}</div>
                  </div>
                </div>
                
                {result.detectedInterventions.length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm font-medium mb-2">Detected Interventions</div>
                    <div className="space-y-2">
                      {result.detectedInterventions.map((intervention, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>Intervention {intervention.index}</span>
                          <span>Effect: {intervention.effect.toFixed(3)} ± {intervention.uncertainty.toFixed(3)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Training Tab */}
          <TabsContent value="training" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Training Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                {result.trainingMetrics && Object.keys(result.trainingMetrics).length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm font-medium">Training Loss</div>
                      <div className="text-lg font-bold">
                        {result.trainingMetrics.train_loss?.slice(-1)[0]?.toFixed(4) || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Training Accuracy</div>
                      <div className="text-lg font-bold">
                        {((result.trainingMetrics.train_acc?.slice(-1)[0] || 0) * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Validation Loss</div>
                      <div className="text-lg font-bold">
                        {result.trainingMetrics.val_loss?.slice(-1)[0]?.toFixed(4) || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Validation Accuracy</div>
                      <div className="text-lg font-bold">
                        {((result.trainingMetrics.val_acc?.slice(-1)[0] || 0) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Training metrics not available</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default EnhancedCausalMonitor;