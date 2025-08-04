
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnhancedCausalInference } from '@/utils/enhancedCausalInference';
import { SensorReading } from '@/types/industrial';
import { Brain, Network, TrendingUp, AlertTriangle } from 'lucide-react';

interface AnalysisResults {
  vggResults: {
    causalRelations: Array<{cause: string, effect: string, strength: number, lag: number, domain_bridge: boolean}>;
    faultPrediction: 'normal' | 'fault';
    confidence: number;
  };
  graphResults: {
    causalGraph: Map<string, Array<{cause: string, effect: string, strength: number, lag: number, domain_bridge: boolean}>>;
    anomalies: Array<{sensor: string, anomaly_score: number}>;
    globalHealth: number;
  };
  comparison: {
    agreement: number;
    recommendedApproach: 'vgg' | 'graph' | 'hybrid';
    reasoning: string;
  };
}

interface NeuralNetworkComparisonProps {
  currentReadings: SensorReading[];
  isRunning: boolean;
}

const NeuralNetworkComparison: React.FC<NeuralNetworkComparisonProps> = ({
  currentReadings,
  isRunning
}) => {
  const [enhancedAnalyzer] = useState(() => new EnhancedCausalInference());
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
  const [activeTab, setActiveTab] = useState('comparison');

  useEffect(() => {
    if (isRunning && currentReadings.length > 0) {
      enhancedAnalyzer.addData(currentReadings);
      
      // Perform analysis every 10 readings to avoid performance issues
      if (currentReadings.length % 10 === 0) {
        const results = enhancedAnalyzer.compareApproaches(currentReadings);
        setAnalysisResults(results);
      }
    }
  }, [currentReadings, isRunning, enhancedAnalyzer]);

  const runAnalysis = () => {
    if (currentReadings.length > 0) {
      const results = enhancedAnalyzer.compareApproaches(currentReadings);
      setAnalysisResults(results);
    }
  };

  if (!analysisResults) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Neural Network Causal Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Button onClick={runAnalysis} disabled={currentReadings.length === 0}>
              Start Neural Analysis
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Comparing VGG-based and Graph Neural Network approaches
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { vggResults, graphResults, comparison } = analysisResults;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Neural Network Causal Analysis Comparison
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
            <TabsTrigger value="vgg">VGG Approach</TabsTrigger>
            <TabsTrigger value="graph">Graph NN</TabsTrigger>
          </TabsList>

          <TabsContent value="comparison" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Agreement Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(comparison.agreement * 100).toFixed(1)}%
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={comparison.agreement > 0.8 ? 'default' : 'secondary'}>
                      {comparison.agreement > 0.8 ? 'High' : 'Moderate'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Recommended</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-semibold capitalize">
                    {comparison.recommendedApproach}
                  </div>
                  <Badge variant="outline" className="mt-2">
                    {comparison.recommendedApproach === 'hybrid' ? 'Best of Both' : 
                     comparison.recommendedApproach === 'vgg' ? 'Pattern Focus' : 'Structure Focus'}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    {vggResults.faultPrediction === 'fault' || graphResults.globalHealth < 0.5 ? (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    )}
                    <span className="font-medium">
                      {vggResults.faultPrediction === 'fault' || graphResults.globalHealth < 0.5 
                        ? 'Issues Detected' : 'System Healthy'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Reasoning</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {comparison.reasoning}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vgg" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">VGG Classification</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Prediction:</span>
                      <Badge variant={vggResults.faultPrediction === 'fault' ? 'destructive' : 'default'}>
                        {vggResults.faultPrediction}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Confidence:</span>
                      <span className="font-medium">
                        {(vggResults.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Causal Relations Found</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {vggResults.causalRelations.length}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Discovered relationships
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">VGG Workflow</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>1. Sensor data preprocessing & correlation analysis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>2. Peter-Clark algorithm layer for causal discovery</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>3. Modified VGG layers for 1D sensor pattern recognition</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>4. Classification layer for fault/normal detection</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="graph" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Graph Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Global Health:</span>
                      <Badge variant={graphResults.globalHealth > 0.7 ? 'default' : 'destructive'}>
                        {(graphResults.globalHealth * 100).toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Anomalies:</span>
                      <span className="font-medium">
                        {graphResults.anomalies.length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Causal Graph Size</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Array.from(graphResults.causalGraph.values())
                      .reduce((sum, relations) => sum + relations.length, 0)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Graph edges discovered
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Graph NN Workflow</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>1. Node embedding initialization with domain features</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>2. Message passing for causal relationship discovery</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>3. Graph attention mechanism for anomaly detection</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>4. Global health assessment via graph aggregation</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {graphResults.anomalies.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Detected Anomalies</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {graphResults.anomalies.slice(0, 5).map((anomaly, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span>{anomaly.sensor}</span>
                        <Badge variant={anomaly.anomaly_score > 0.7 ? 'destructive' : 'secondary'}>
                          {(anomaly.anomaly_score * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default NeuralNetworkComparison;
