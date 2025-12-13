/**
 * EnhancedCausalVGG Control Panel Component
 */

import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Brain,
  Upload,
  Play,
  Square,
  RotateCcw,
  Activity,
  Zap,
  BarChart3,
  Image,
  Waves,
  Settings,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useEnhancedCVGG, TrainingConfig, InferenceResult } from '@/hooks/useEnhancedCVGG';
import { SystemState } from '@/types/industrial';

interface EnhancedCVGGPanelProps {
  currentState: SystemState | null;
  sensorHistory: { vibrationX: number[]; vibrationY: number[]; vibrationZ: number[] };
  onInferenceResult?: (result: InferenceResult) => void;
}

const EnhancedCVGGPanel: React.FC<EnhancedCVGGPanelProps> = ({
  currentState,
  sensorHistory,
  onInferenceResult
}) => {
  const {
    modelState,
    trainingProgress,
    trainingHistory,
    classNames,
    initializeModel,
    runInference,
    train,
    stopTraining,
    resetModel,
    processRockImage,
    generateCWRUSignals,
    generateEnvironmentalSignals,
    createCausalMetadata,
    generateSyntheticSamples,
    getModelSummary
  } = useEnhancedCVGG();

  const [activeTab, setActiveTab] = useState('inference');
  const [rockImageFile, setRockImageFile] = useState<File | null>(null);
  const [rockImagePreview, setRockImagePreview] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<InferenceResult | null>(null);
  
  // Training config
  const [trainingConfig, setTrainingConfig] = useState<TrainingConfig>({
    epochs: 10,
    batchSize: 8,
    learningRate: 0.001,
    classificationWeight: 0.7,
    causalWeight: 0.3,
    validationSplit: 0.2
  });
  const [numSyntheticSamples, setNumSyntheticSamples] = useState(100);

  // Intervention parameters
  const [interventionAmplitude, setInterventionAmplitude] = useState(0.5);
  const [interventionType, setInterventionType] = useState<'pressure_spike' | 'speed_adjustment' | 'load_change' | 'thermal_shock'>('load_change');
  const [temperature, setTemperature] = useState(25);
  const [workingLoad, setWorkingLoad] = useState(0.5);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRockImageFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setRockImagePreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleRunInference = useCallback(async () => {
    if (!modelState.isBuilt) {
      await initializeModel();
    }

    // Build input from current state and rock image
    const cwruSignals = generateCWRUSignals(
      sensorHistory.vibrationX.length > 0 ? sensorHistory.vibrationX : [0],
      sensorHistory.vibrationY.length > 0 ? sensorHistory.vibrationY : [0],
      sensorHistory.vibrationZ.length > 0 ? sensorHistory.vibrationZ : [0]
    );

    const environmentalSignals = generateEnvironmentalSignals(
      currentState ? [currentState.thermal.system_temp] : [25],
      currentState ? [currentState.hydraulic.pressure] : [100],
      [50] // Default humidity
    );

    const causalMetadata = createCausalMetadata(
      interventionAmplitude > 0 ? [{
        amplitude: interventionAmplitude,
        interventionType,
        startTime: 0,
        endTime: 1,
        slope: 0.5
      }] : [],
      temperature,
      workingLoad
    );

    let rockImageTensor = undefined;
    if (rockImageFile) {
      rockImageTensor = await processRockImage(rockImageFile) || undefined;
    }

    const result = await runInference({
      rockImage: rockImageTensor,
      cwruSignals,
      environmentalSignals,
      causalMetadata
    });

    if (result) {
      setLastResult(result);
      onInferenceResult?.(result);
    }
  }, [
    modelState.isBuilt,
    initializeModel,
    generateCWRUSignals,
    generateEnvironmentalSignals,
    createCausalMetadata,
    processRockImage,
    runInference,
    sensorHistory,
    currentState,
    rockImageFile,
    interventionAmplitude,
    interventionType,
    temperature,
    workingLoad,
    onInferenceResult
  ]);

  const handleStartTraining = useCallback(async () => {
    if (!modelState.isBuilt) {
      await initializeModel();
    }

    const samples = generateSyntheticSamples(numSyntheticSamples);
    await train(samples, trainingConfig);
  }, [
    modelState.isBuilt,
    initializeModel,
    generateSyntheticSamples,
    numSyntheticSamples,
    train,
    trainingConfig
  ]);

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Enhanced CausalVGG
          </CardTitle>
          <div className="flex items-center gap-2">
            {modelState.isBuilt ? (
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Ready
              </Badge>
            ) : modelState.isLoading ? (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading
              </Badge>
            ) : (
              <Badge variant="outline">Not Initialized</Badge>
            )}
            {modelState.totalParams > 0 && (
              <Badge variant="outline">
                {(modelState.totalParams / 1e6).toFixed(2)}M params
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="inference" className="flex items-center gap-1">
              <Activity className="h-4 w-4" />
              Inference
            </TabsTrigger>
            <TabsTrigger value="training" className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              Training
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-1">
              <Settings className="h-4 w-4" />
              Config
            </TabsTrigger>
          </TabsList>

          {/* Inference Tab */}
          <TabsContent value="inference" className="space-y-4">
            {/* Rock Image Upload */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                Rock Image (Optional)
              </Label>
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Image
                </Button>
                {rockImageFile && (
                  <span className="text-sm text-muted-foreground self-center">
                    {rockImageFile.name}
                  </span>
                )}
              </div>
              {rockImagePreview && (
                <div className="w-24 h-24 border rounded overflow-hidden">
                  <img
                    src={rockImagePreview}
                    alt="Rock sample"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            {/* Signal Status */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Waves className="h-4 w-4" />
                Signal Channels (Auto from Sensors)
              </Label>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 bg-muted rounded">
                  <span className="font-medium">CWRU:</span> DE, FE, BA
                </div>
                <div className="p-2 bg-muted rounded">
                  <span className="font-medium">Env:</span> T, P, H
                </div>
              </div>
            </div>

            {/* Intervention Controls */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Causal Intervention
              </Label>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Intervention Amplitude</span>
                  <span>{interventionAmplitude.toFixed(2)}</span>
                </div>
                <Slider
                  value={[interventionAmplitude]}
                  onValueChange={([v]) => setInterventionAmplitude(v)}
                  min={0}
                  max={1}
                  step={0.05}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Temperature (°C)</Label>
                  <Input
                    type="number"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value) || 25)}
                    className="h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Working Load</Label>
                  <Input
                    type="number"
                    value={workingLoad}
                    onChange={(e) => setWorkingLoad(parseFloat(e.target.value) || 0.5)}
                    min={0}
                    max={1}
                    step={0.1}
                    className="h-8"
                  />
                </div>
              </div>
            </div>

            {/* Run Inference Button */}
            <Button
              onClick={handleRunInference}
              disabled={modelState.mode !== 'idle' && modelState.mode !== 'inference'}
              className="w-full"
            >
              {modelState.mode === 'inference' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Run Inference
            </Button>

            {/* Results */}
            {lastResult && (
              <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Classification</span>
                  <Badge>{lastResult.classification.className}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Confidence: {(lastResult.classification.confidence * 100).toFixed(1)}%</div>
                  <div>Anomaly: {(lastResult.anomalyScore * 100).toFixed(1)}%</div>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium">Causal Effects:</span>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div>ATE: {lastResult.causalEffects.ATE.toFixed(4)}</div>
                    <div>CATE: {lastResult.causalEffects.CATE.toFixed(4)}</div>
                    <div>Direct: {lastResult.causalEffects.directEffect.toFixed(4)}</div>
                    <div>Indirect: {lastResult.causalEffects.indirectEffect.toFixed(4)}</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Processing: {lastResult.processingTimeMs.toFixed(0)}ms
                </div>
              </div>
            )}
          </TabsContent>

          {/* Training Tab */}
          <TabsContent value="training" className="space-y-4">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Epochs</Label>
                  <Input
                    type="number"
                    value={trainingConfig.epochs}
                    onChange={(e) => setTrainingConfig(prev => ({
                      ...prev,
                      epochs: parseInt(e.target.value) || 10
                    }))}
                    className="h-8"
                    disabled={trainingProgress.isTraining}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Samples</Label>
                  <Input
                    type="number"
                    value={numSyntheticSamples}
                    onChange={(e) => setNumSyntheticSamples(parseInt(e.target.value) || 100)}
                    className="h-8"
                    disabled={trainingProgress.isTraining}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Learning Rate</Label>
                <Input
                  type="number"
                  value={trainingConfig.learningRate}
                  onChange={(e) => setTrainingConfig(prev => ({
                    ...prev,
                    learningRate: parseFloat(e.target.value) || 0.001
                  }))}
                  step={0.0001}
                  className="h-8"
                  disabled={trainingProgress.isTraining}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Classification Weight</span>
                  <span>{trainingConfig.classificationWeight.toFixed(2)}</span>
                </div>
                <Slider
                  value={[trainingConfig.classificationWeight]}
                  onValueChange={([v]) => setTrainingConfig(prev => ({
                    ...prev,
                    classificationWeight: v,
                    causalWeight: 1 - v
                  }))}
                  min={0}
                  max={1}
                  step={0.05}
                  disabled={trainingProgress.isTraining}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Causal: {trainingConfig.causalWeight.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Training Progress */}
            {trainingProgress.isTraining && (
              <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Epoch {trainingProgress.epoch}/{trainingProgress.totalEpochs}</span>
                  <span>{((trainingProgress.epoch / trainingProgress.totalEpochs) * 100).toFixed(0)}%</span>
                </div>
                <Progress value={(trainingProgress.epoch / trainingProgress.totalEpochs) * 100} />
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>Loss: {trainingProgress.loss.toFixed(4)}</div>
                  <div>Accuracy: {(trainingProgress.accuracy * 100).toFixed(1)}%</div>
                  <div>Class Loss: {trainingProgress.classificationLoss.toFixed(4)}</div>
                  <div>Causal Loss: {trainingProgress.causalLoss.toFixed(4)}</div>
                </div>
              </div>
            )}

            {/* Training History Chart */}
            {trainingHistory.length > 0 && !trainingProgress.isTraining && (
              <div className="space-y-2">
                <Label className="text-sm">Training History</Label>
                <ScrollArea className="h-24 border rounded p-2">
                  {trainingHistory.map((h, i) => (
                    <div key={i} className="flex justify-between text-xs py-0.5">
                      <span>Epoch {h.epoch}</span>
                      <span>Loss: {h.loss.toFixed(4)}</span>
                      <span>Acc: {(h.accuracy * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            )}

            {/* Training Controls */}
            <div className="flex gap-2">
              <Button
                onClick={handleStartTraining}
                disabled={trainingProgress.isTraining}
                className="flex-1"
              >
                {trainingProgress.isTraining ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                {trainingProgress.isTraining ? 'Training...' : 'Start Training'}
              </Button>
              {trainingProgress.isTraining && (
                <Button variant="destructive" onClick={stopTraining}>
                  <Square className="h-4 w-4" />
                </Button>
              )}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button
                  onClick={initializeModel}
                  disabled={modelState.isBuilt || modelState.isLoading}
                  variant="outline"
                  className="flex-1"
                >
                  {modelState.isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Brain className="h-4 w-4 mr-2" />
                  )}
                  Initialize Model
                </Button>
                <Button
                  onClick={resetModel}
                  variant="outline"
                  disabled={modelState.isLoading || trainingProgress.isTraining}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>

              {modelState.isBuilt && (
                <ScrollArea className="h-48 border rounded p-3">
                  <pre className="text-xs font-mono whitespace-pre-wrap">
                    {getModelSummary()}
                  </pre>
                </ScrollArea>
              )}

              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>EnhancedCausalVGG processes:</span>
                </div>
                <ul className="list-disc list-inside pl-4">
                  <li>Rock images (128×128×3)</li>
                  <li>6-channel scalograms from signals</li>
                  <li>Causal metadata (interventions, confounders, IVs)</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default EnhancedCVGGPanel;
