
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Activity, Zap, Thermometer, Wrench, Droplets, Play, Pause, RotateCcw, Brain, Cpu, Lightbulb, HelpCircle, Crosshair, CheckCircle2, XCircle, Shield, BookOpen, FileText, Database, Save, Rocket, FlaskConical, Network } from 'lucide-react';
import { PhysicsSimulator } from '@/utils/physicsSimulator';
import { FailureSimulator } from '@/utils/failureSimulator';
import { CausalDiscovery } from '@/utils/causalInference';
import { SystemState, SensorReading, CausalRelation } from '@/types/industrial';
import EnhancedCVGGPanel from '@/components/EnhancedCVGGPanel';
import CausalVisualizationPanel from '@/components/CausalVisualizationPanel';
import PrescriptiveAIPanel from '@/components/PrescriptiveAIPanel';
import CounterfactualQueryPanel from '@/components/CounterfactualQueryPanel';
import CausalInterventionPanel from '@/components/CausalInterventionPanel';
import CausalVerificationPanel from '@/components/CausalVerificationPanel';
import CausalExamplesPanel from '@/components/CausalExamplesPanel';
import OperationCasesPanel from '@/components/OperationCasesPanel';
import CausalKnowledgeBasePanel from '@/components/CausalKnowledgeBasePanel';
import OperationResultsPanel from '@/components/OperationResultsPanel';
import RoadmapPanel from '@/components/RoadmapPanel';
import KnowledgeGraphPanel from '@/components/KnowledgeGraphPanel';
import CausalityComparisonPanel from '@/components/CausalityComparisonPanel';
import LanguageSelector from '@/components/LanguageSelector';
import { useLanguage } from '@/contexts/LanguageContext';
import { InferenceResult, useEnhancedCVGG } from '@/hooks/useEnhancedCVGG';
import { saveOperationResult } from '@/utils/resultsStorage';
import { getSystemDiagnostics } from '@/utils/systemDiagnostics';

type ModelMode = 'none' | 'neural' | 'enhanced-cvgg' | 'prescriptive' | 'counterfactual' | 'intervention' | 'verification' | 'examples' | 'cases' | 'knowledge' | 'results' | 'roadmap' | 'comparison' | 'kg' | 'experiment';

// Function Status Card Component
const FunctionStatusCard: React.FC<{ cvggResult: InferenceResult | null; modelMode: ModelMode }> = ({ cvggResult, modelMode }) => {
  const { t } = useLanguage();
  
  const functions = [
    { name: 'Causal Effect (ATE/CATE)', status: cvggResult ? 'complete' : 'ready', module: 'CVGG' },
    { name: 'Causal Intervention (do-calculus)', status: modelMode === 'intervention' ? 'active' : 'ready', module: 'IMSCHM' },
    { name: 'Counterfactual (What-If)', status: modelMode === 'counterfactual' ? 'active' : 'ready', module: 'IMSCHM' },
    { name: 'Prescriptive AI', status: modelMode === 'prescriptive' ? 'active' : 'ready', module: 'IMSCHM' },
    { name: 'Decision Making', status: modelMode === 'prescriptive' ? 'active' : 'ready', module: 'IMSCHM' },
    { name: 'Dataset Verification', status: modelMode === 'verification' ? 'active' : 'ready', module: 'IMSCHM' },
    { name: 'Interpretability', status: cvggResult ? 'complete' : 'ready', module: 'Both' },
  ];

  return (
    <Card className="border-muted/50">
      <CardHeader className="py-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="h-4 w-4" />
          {t('function.status')}
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2">
        <div className="flex flex-wrap gap-2">
          {functions.map(f => (
            <Badge 
              key={f.name} 
              variant="outline" 
              className={`text-xs ${
                f.status === 'complete' ? 'bg-green-500/20 text-green-400 border-green-500/50' :
                f.status === 'active' ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' :
                'bg-muted/30 text-muted-foreground'
              }`}
            >
              {f.status === 'complete' && <CheckCircle2 className="h-3 w-3 mr-1" />}
              {f.status === 'active' && <Activity className="h-3 w-3 mr-1" />}
              {f.name} ({f.module})
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const IndustrialMonitor = () => {
  const { t } = useLanguage();
  const [simulator] = useState(() => new PhysicsSimulator());
  const [failureSimulator] = useState(() => new FailureSimulator(simulator));
  const [causalAnalyzer] = useState(() => new CausalDiscovery());
  
  const [isRunning, setIsRunning] = useState(false);
  const [currentState, setCurrentState] = useState<SystemState | null>(null);
  const [sensorData, setSensorData] = useState<SensorReading[]>([]);
  const [causalGraph, setCausalGraph] = useState<Map<string, CausalRelation[]>>(new Map());
  const [anomalies, setAnomalies] = useState<Array<{sensor: string, anomaly_score: number, causal_pathway?: string}>>([]);
  const [activeFailures, setActiveFailures] = useState<Array<{id: string, name: string, severity: number, domain: string}>>([]);
  const [failureSeverities, setFailureSeverities] = useState<Record<string, number>>({});
  
  // Model modes
  const [modelMode, setModelMode] = useState<ModelMode>('none');
  const [neuralModelInfo, setNeuralModelInfo] = useState<{initialized: boolean, parameters: number} | null>(null);
  const [cvggInferenceResult, setCvggInferenceResult] = useState<InferenceResult | null>(null);
  
  // Inference history for visualizations
  const [inferenceHistory, setInferenceHistory] = useState<InferenceResult[]>([]);
  
  // CVGG hook for counterfactual sweep
  const cvggHook = useEnhancedCVGG();
  
  // Sensor history for CVGG
  const [sensorHistory, setSensorHistory] = useState<{
    vibrationX: number[];
    vibrationY: number[];
    vibrationZ: number[];
  }>({ vibrationX: [], vibrationY: [], vibrationZ: [] });

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isRunning) {
      interval = setInterval(() => {
        // Step simulation
        const newState = simulator.step();
        setCurrentState(newState);
        
        // Update sensor history for CVGG
        setSensorHistory(prev => ({
          vibrationX: [...prev.vibrationX, newState.mechanical.vibration_x].slice(-1024),
          vibrationY: [...prev.vibrationY, newState.mechanical.vibration_y].slice(-1024),
          vibrationZ: [...prev.vibrationZ, newState.mechanical.vibration_z].slice(-1024)
        }));
        
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
        
        // Detect anomalies (async when in neural mode)
        causalAnalyzer.detectCausalAnomalies(readings).then(detectedAnomalies => {
          setAnomalies(detectedAnomalies);
        });
        
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
    const severity = failureSeverities[failureId] ?? 0.1;
    failureSimulator.injectFailure(failureId, severity);
  };

  const handleClearFailures = () => {
    failureSimulator.clearAllFailures();
    setActiveFailures([]);
  };

  const handleToggleNeuralMode = useCallback(async () => {
    if (modelMode !== 'neural') {
      // Enable neural mode
      await causalAnalyzer.enableNeuralMode();
      const encoder = causalAnalyzer.getNeuralEncoder();
      if (encoder) {
        const info = encoder.getModelInfo();
        setNeuralModelInfo(info);
      }
      setModelMode('neural');
    } else {
      // Disable neural mode
      causalAnalyzer.disableNeuralMode();
      setModelMode('none');
      setNeuralModelInfo(null);
    }
  }, [modelMode, causalAnalyzer]);

  const handleCvggInferenceResult = useCallback((result: InferenceResult) => {
    setCvggInferenceResult(result);
    // Add to inference history for visualizations (keep last 100)
    setInferenceHistory(prev => [...prev, result].slice(-100));
    
    // Log to diagnostics
    const diag = getSystemDiagnostics();
    diag.logSuccess('CVGG', `Inference: ${result.classification.className} (${(result.classification.confidence * 100).toFixed(0)}%)`);
    
    // Update trust scores
    diag.updateTrustFromPipeline({
      hasSimulation: isRunning || (sensorData.length > 0),
      hasFailureInjection: activeFailures.length > 0,
      hasCVGGTraining: true,
      hasCVGGInference: true,
      hasIntervention: false,
      hasCounterfactual: false,
      hasPrescriptive: false,
      cvggConfidence: result.classification.confidence,
      ateValue: result.causalEffects.ATE,
    });
    
    // Save to results storage
    saveOperationResult('cvgg_inference', result, {
      modelMode: 'enhanced-cvgg',
      systemState: currentState ? {
        hydraulic_pressure: currentState.hydraulic.pressure,
        system_temp: currentState.thermal.system_temp,
        mechanical_torque: currentState.mechanical.torque,
      } : undefined,
    });
  }, [currentState, isRunning, sensorData.length, activeFailures.length]);

  // Counterfactual sweep handler
  const handleCounterfactualSweep = useCallback(async (pressureValues: number[]): Promise<{ pressure: number; effect: number }[]> => {
    if (!cvggHook.modelState.isBuilt) {
      await cvggHook.initializeModel();
    }

    const results: { pressure: number; effect: number }[] = [];
    
    for (const pressure of pressureValues) {
      // Generate signals with varied pressure
      const cwruSignals = cvggHook.generateCWRUSignals(
        sensorHistory.vibrationX.length > 0 ? sensorHistory.vibrationX : [0],
        sensorHistory.vibrationY.length > 0 ? sensorHistory.vibrationY : [0],
        sensorHistory.vibrationZ.length > 0 ? sensorHistory.vibrationZ : [0]
      );

      const environmentalSignals = cvggHook.generateEnvironmentalSignals(
        currentState ? [currentState.thermal.system_temp] : [25],
        [pressure], // Varied pressure
        [50]
      );

      const causalMetadata = cvggHook.createCausalMetadata(
        [{
          amplitude: pressure / 200, // Normalize to 0-1
          interventionType: 'pressure_spike',
          startTime: 0,
          endTime: 1,
          slope: 0.5
        }],
        currentState?.thermal.system_temp || 25,
        0.5
      );

      const result = await cvggHook.runInference({
        cwruSignals,
        environmentalSignals,
        causalMetadata
      });

      if (result) {
        results.push({
          pressure,
          effect: result.causalEffects.ATE
        });
      }
    }

    return results;
  }, [cvggHook, sensorHistory, currentState]);

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
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t('app.title')}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t('app.subtitle')}</p>
          <div className="flex items-center gap-4 mt-2">
            {modelMode === 'neural' && neuralModelInfo && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Brain className="h-4 w-4" />
                <span>Neural Causal VGG • {neuralModelInfo.parameters.toLocaleString()} params</span>
              </div>
            )}
            {modelMode === 'enhanced-cvgg' && cvggInferenceResult && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Cpu className="h-4 w-4 text-primary" />
                <span>EnhancedCVGG: {cvggInferenceResult.classification.className} ({(cvggInferenceResult.classification.confidence * 100).toFixed(0)}%)</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {/* Language Selector */}
          <LanguageSelector />
          
          {/* Model Mode Selector */}
          <Tabs value={modelMode} onValueChange={(v) => setModelMode(v as ModelMode)} className="mr-2">
            <TabsList className="h-9">
              <TabsTrigger value="none" className="text-xs px-2">Off</TabsTrigger>
              <TabsTrigger value="neural" className="text-xs px-2" onClick={handleToggleNeuralMode}>
                <Brain className="h-3 w-3 mr-1" />
                Neural
              </TabsTrigger>
              <TabsTrigger value="enhanced-cvgg" className="text-xs px-2">
                <Cpu className="h-3 w-3 mr-1" />
                CVGG
              </TabsTrigger>
              <TabsTrigger value="intervention" className="text-xs px-2">
                <Crosshair className="h-3 w-3 mr-1" />
                {t('tab.intervention')}
              </TabsTrigger>
              <TabsTrigger value="counterfactual" className="text-xs px-2">
                <HelpCircle className="h-3 w-3 mr-1" />
                {t('tab.whatif')}
              </TabsTrigger>
              <TabsTrigger value="prescriptive" className="text-xs px-2">
                <Lightbulb className="h-3 w-3 mr-1" />
                {t('tab.prescriptive')}
              </TabsTrigger>
              <TabsTrigger value="verification" className="text-xs px-2">
                <Shield className="h-3 w-3 mr-1" />
                {t('tab.verification')}
              </TabsTrigger>
              <TabsTrigger value="examples" className="text-xs px-2">
                <BookOpen className="h-3 w-3 mr-1" />
                {t('tab.examples')}
              </TabsTrigger>
              <TabsTrigger value="cases" className="text-xs px-2">
                <FileText className="h-3 w-3 mr-1" />
                {t('tab.cases')}
              </TabsTrigger>
              <TabsTrigger value="knowledge" className="text-xs px-2">
                <Database className="h-3 w-3 mr-1" />
                {t('tab.knowledge')}
              </TabsTrigger>
              <TabsTrigger value="results" className="text-xs px-2">
                <Save className="h-3 w-3 mr-1" />
                {t('tab.results') || 'Results'}
              </TabsTrigger>
              <TabsTrigger value="roadmap" className="text-xs px-2">
                <Rocket className="h-3 w-3 mr-1" />
                Roadmap
              </TabsTrigger>
              <TabsTrigger value="kg" className="text-xs px-2">
                <Network className="h-3 w-3 mr-1" />
                KG
              </TabsTrigger>
              <TabsTrigger value="comparison" className="text-xs px-2">
                <FlaskConical className="h-3 w-3 mr-1" />
                Comparison
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button 
            onClick={() => setIsRunning(!isRunning)}
            variant={isRunning ? "destructive" : "default"}
          >
            {isRunning ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {isRunning ? t('control.stop') : t('control.start')}
          </Button>
          <Button onClick={handleClearFailures} variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            {t('control.reset')}
          </Button>
        </div>
      </div>

      {/* Function Completion Status Card */}
      <FunctionStatusCard 
        cvggResult={cvggInferenceResult}
        modelMode={modelMode}
      />

      {/* EnhancedCVGG Panel - Show when CVGG mode is active */}
      {modelMode === 'enhanced-cvgg' && (
        <EnhancedCVGGPanel
          currentState={currentState}
          sensorHistory={sensorHistory}
          onInferenceResult={handleCvggInferenceResult}
        />
      )}

      {/* Causal Intervention Panel - Show when do() mode is active */}
      {modelMode === 'intervention' && (
        <CausalInterventionPanel
          currentState={currentState}
          cvggResult={cvggInferenceResult}
        />
      )}

      {/* Counterfactual Query Panel - Show when What-If mode is active */}
      {modelMode === 'counterfactual' && (
        <CounterfactualQueryPanel
          currentState={currentState}
          cvggResult={cvggInferenceResult}
        />
      )}

      {/* Prescriptive AI Panel - Show when Prescriptive mode is active */}
      {modelMode === 'prescriptive' && (
        <PrescriptiveAIPanel
          currentState={currentState}
          anomalies={anomalies}
          activeFailures={activeFailures}
          causalGraph={causalGraph}
          cvggResult={cvggInferenceResult}
          inferenceHistory={inferenceHistory}
        />
      )}

      {/* Causal Verification Panel - Show when Verify mode is active */}
      {modelMode === 'verification' && (
        <CausalVerificationPanel
          sensorData={sensorData}
          isRunning={isRunning}
        />
      )}

      {/* Causal Examples Panel - Show when Examples mode is active */}
      {modelMode === 'examples' && (
        <CausalExamplesPanel />
      )}

      {/* Operation Cases Panel - Show when Cases mode is active */}
      {modelMode === 'cases' && (
        <OperationCasesPanel />
      )}

      {/* Causal Knowledge Base Panel - Show when Knowledge mode is active */}
      {modelMode === 'knowledge' && (
        <CausalKnowledgeBasePanel
          causalGraph={causalGraph}
          onImportComplete={(count) => {
            console.log(`Imported ${count} causal relationships`);
            saveOperationResult('knowledge_import', {
              operation: 'Import from Causal Graph',
              nodesAffected: count,
              edgesAffected: count,
            });
          }}
        />
      )}

      {/* Operation Results Panel - Show when Results mode is active */}
      {modelMode === 'results' && (
        <OperationResultsPanel />
      )}

      {/* Roadmap Panel - Show when Roadmap mode is active */}
      {modelMode === 'roadmap' && (
        <RoadmapPanel />
      )}

      {/* Knowledge Graph Panel - Hybrid FMEA × Causal */}
      {modelMode === 'kg' && (
        <KnowledgeGraphPanel causalGraph={causalGraph} />
      )}

      {/* Causality Comparison Panel */}
      {modelMode === 'comparison' && (
        <CausalityComparisonPanel cvggResult={cvggInferenceResult} />
      )}

      {/* Causal Visualization Panel */}
      {(inferenceHistory.length > 0 || causalGraph.size > 0) && modelMode !== 'prescriptive' && modelMode !== 'counterfactual' && modelMode !== 'intervention' && modelMode !== 'verification' && modelMode !== 'roadmap' && modelMode !== 'comparison' && (
        <CausalVisualizationPanel
          inferenceHistory={inferenceHistory}
          causalGraph={causalGraph}
          onCounterfactualSweep={modelMode === 'enhanced-cvgg' ? handleCounterfactualSweep : undefined}
        />
      )}

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
                <div className="space-y-3">
                  {failureSimulator.getFailureModes().map((mode) => {
                    const severity = failureSeverities[mode.id] ?? 0.1;
                    const isActive = activeFailures.some(f => f.id === mode.id);
                    return (
                      <div key={mode.id} className="flex items-center gap-3 p-2 border rounded">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{mode.name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground w-16">
                              {(severity * 100).toFixed(0)}%
                            </span>
                            <input
                              type="range"
                              min={1}
                              max={100}
                              value={severity * 100}
                              onChange={(e) => setFailureSeverities(prev => ({
                                ...prev,
                                [mode.id]: Number(e.target.value) / 100
                              }))}
                              className="flex-1 h-2 accent-primary"
                              disabled={isActive}
                            />
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={isActive ? "secondary" : "outline"}
                          onClick={() => handleInjectFailure(mode.id)}
                          disabled={isActive}
                          className="shrink-0"
                        >
                          {isActive ? 'Active' : 'Inject'}
                        </Button>
                      </div>
                    );
                  })}
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
                        {anomaly.causal_pathway ? `Pathway: ${anomaly.causal_pathway}` : 'Causal expectation violated'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {modelMode === 'neural' && <Brain className="h-3 w-3 text-purple-500" />}
                      {modelMode === 'enhanced-cvgg' && <Cpu className="h-3 w-3 text-primary" />}
                      <Badge variant={anomaly.anomaly_score > 0.7 ? 'destructive' : 'secondary'}>
                        {(anomaly.anomaly_score * 100).toFixed(0)}%
                      </Badge>
                    </div>
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
          <div className="flex items-center justify-between">
            <CardTitle>Discovered Causal Relationships</CardTitle>
            {modelMode !== 'none' && (
              <Badge variant="outline" className="flex items-center gap-1">
                {modelMode === 'neural' && <Brain className="h-3 w-3" />}
                {modelMode === 'enhanced-cvgg' && <Cpu className="h-3 w-3" />}
                {modelMode === 'neural' ? 'Neural-Augmented' : 'EnhancedCVGG'}
              </Badge>
            )}
          </div>
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
