/**
 * Counterfactual Query Panel
 * 
 * Interactive UI for "What if?" causal queries
 * Uses CVGG causal estimates + CounterfactualEngine
 * Now includes Simple DAG visualization for counterfactual pathways
 * Saves results to persistent storage
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  HelpCircle,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  Play,
  RotateCcw,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  GitBranch,
  Save,
} from 'lucide-react';
import { SystemState, IndustrialDomain } from '@/types/industrial';
import { InferenceResult } from '@/hooks/useEnhancedCVGG';
import {
  getCounterfactualEngine,
  InterventionQuery,
  CounterfactualResult,
  PRESET_INTERVENTIONS,
} from '@/utils/counterfactualEngine';
import SimpleDAG, { buildInterventionDAG } from '@/components/SimpleDAG';
import { saveOperationResult } from '@/utils/resultsStorage';
import { useToast } from '@/hooks/use-toast';

interface CounterfactualQueryPanelProps {
  currentState: SystemState | null;
  cvggResult: InferenceResult | null;
}

const domainColors: Record<IndustrialDomain, string> = {
  hydraulic: 'text-blue-400',
  mechanical: 'text-gray-400',
  thermal: 'text-red-400',
  electrical: 'text-yellow-400',
  cutting: 'text-green-400',
};

const riskBadgeConfig = {
  increased: { color: 'bg-red-500/20 text-red-400 border-red-500/50', icon: TrendingUp },
  decreased: { color: 'bg-green-500/20 text-green-400 border-green-500/50', icon: TrendingDown },
  unchanged: { color: 'bg-gray-500/20 text-gray-400 border-gray-500/50', icon: Minus },
};

const CounterfactualQueryPanel: React.FC<CounterfactualQueryPanelProps> = ({
  currentState,
  cvggResult,
}) => {
  const { toast } = useToast();
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [customVariable, setCustomVariable] = useState<string>('thrust');
  const [customValue, setCustomValue] = useState<number>(10);
  const [customType, setCustomType] = useState<'relative' | 'absolute'>('relative');
  const [results, setResults] = useState<CounterfactualResult[]>([]);
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');

  const engine = useMemo(() => getCounterfactualEngine(), []);
  const availableVariables = useMemo(() => engine.getAvailableVariables(), [engine]);

  const runPresetQuery = (presetId: string) => {
    if (!currentState) return;
    
    const preset = PRESET_INTERVENTIONS.find(p => p.id === presetId);
    if (!preset) return;

    const result = engine.evaluateIntervention(preset, currentState, cvggResult || undefined);
    setResults(prev => [result, ...prev.slice(0, 4)]); // Keep last 5
    setSelectedPreset(presetId);
    
    // Save to results storage
    saveOperationResult('counterfactual', result, {
      modelMode: 'counterfactual',
    });
    
    toast({
      title: 'What-If Query Saved',
      description: `Counterfactual result for "${preset.description}" saved.`,
    });
  };

  const runCustomQuery = () => {
    if (!currentState) return;

    const query: InterventionQuery = {
      id: `custom-${Date.now()}`,
      variable: customVariable,
      domain: availableVariables.find(v => v.variable === customVariable)?.domain || 'mechanical',
      currentValue: 0,
      interventionValue: customValue,
      interventionType: customType,
      description: `Custom: ${customVariable} ${customType === 'relative' ? `${customValue > 0 ? '+' : ''}${customValue}%` : `set to ${customValue}`}`,
    };

    const result = engine.evaluateIntervention(query, currentState, cvggResult || undefined);
    setResults(prev => [result, ...prev.slice(0, 4)]);
    
    // Save to results storage
    saveOperationResult('counterfactual', result, {
      modelMode: 'counterfactual',
    });
    
    toast({
      title: 'Custom Query Saved',
      description: `Counterfactual result saved to results panel.`,
    });
  };

  const clearResults = () => {
    setResults([]);
    setSelectedPreset('');
  };

  if (!currentState) {
    return (
      <Card className="border-muted">
        <CardContent className="py-8 text-center text-muted-foreground">
          <HelpCircle className="h-8 w-8 mx-auto mb-2" />
          <p>Waiting for system state data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            <span>Counterfactual Query Engine</span>
            <Badge variant="outline" className="ml-2">
              <GitBranch className="h-3 w-3 mr-1" />
              CVGG + Causal Inference
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* CVGG Calibration Status */}
          <div className="flex items-center gap-2 mb-2">
            {cvggResult ? (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/50 border">
                <CheckCircle className="h-3 w-3 mr-1" />
                CVGG-Calibrated · ATE={cvggResult.causalEffects?.ATE?.toFixed(4) ?? '--'}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-yellow-400 border-yellow-400/50">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Domain-Knowledge Only (run CVGG Inference for calibration)
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Ask "What if?" questions to understand causal impacts of interventions.
            Results combine CVGG causal estimates with domain knowledge.
          </p>
        </CardContent>
      </Card>

      {/* Query Interface */}
      <Card>
        <CardContent className="pt-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'presets' | 'custom')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="presets">
                <Lightbulb className="h-4 w-4 mr-2" />
                Preset Queries
              </TabsTrigger>
              <TabsTrigger value="custom">
                <Zap className="h-4 w-4 mr-2" />
                Custom Query
              </TabsTrigger>
            </TabsList>

            <TabsContent value="presets" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {PRESET_INTERVENTIONS.map((preset) => (
                  <Button
                    key={preset.id}
                    variant={selectedPreset === preset.id ? 'default' : 'outline'}
                    className="justify-start h-auto py-3 px-4"
                    onClick={() => runPresetQuery(preset.id)}
                  >
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-xs ${domainColors[preset.domain]}`}>
                          {preset.domain}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {preset.interventionType === 'relative' ? `${preset.interventionValue}%` : preset.interventionValue}
                        </span>
                      </div>
                      <p className="mt-1 text-sm">{preset.description}</p>
                    </div>
                  </Button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="custom" className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Variable</Label>
                  <Select value={customVariable} onValueChange={setCustomVariable}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableVariables.map((v) => (
                        <SelectItem key={v.variable} value={v.variable}>
                          <span className={domainColors[v.domain]}>
                            {v.variable.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs text-muted-foreground ml-2">({v.unit})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Change Type</Label>
                  <Select value={customType} onValueChange={(v) => setCustomType(v as 'relative' | 'absolute')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relative">Relative (%)</SelectItem>
                      <SelectItem value="absolute">Absolute Value</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>
                    {customType === 'relative' ? 'Change (%)' : 'Target Value'}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={customValue}
                      onChange={(e) => setCustomValue(parseFloat(e.target.value) || 0)}
                      className="flex-1"
                    />
                    <Button onClick={runCustomQuery}>
                      <Play className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {customType === 'relative' && (
                <div className="space-y-2">
                  <Slider
                    value={[customValue]}
                    onValueChange={([v]) => setCustomValue(v)}
                    min={-50}
                    max={50}
                    step={5}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>-50%</span>
                    <span>{customValue > 0 ? '+' : ''}{customValue}%</span>
                    <span>+50%</span>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-base">
              <span>Counterfactual Results ({results.length})</span>
              <Button variant="ghost" size="sm" onClick={clearResults}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {results.map((result, idx) => (
                  <CounterfactualResultCard key={`${result.query.id}-${idx}`} result={result} />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const CounterfactualResultCard: React.FC<{ result: CounterfactualResult }> = ({ result }) => {
  const riskConfig = riskBadgeConfig[result.riskChange];
  const RiskIcon = riskConfig.icon;

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-medium">{result.query.description}</h4>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className={domainColors[result.query.domain]}>
              {result.query.domain}
            </Badge>
            <Badge className={riskConfig.color}>
              <RiskIcon className="h-3 w-3 mr-1" />
              Risk {result.riskChange}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {(result.confidence * 100).toFixed(0)}% confidence
            </span>
          </div>
        </div>
      </div>

      {/* Effects Summary */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-background rounded p-2">
          <div className="text-xs text-muted-foreground">Causal Effect</div>
          <div className={`font-semibold ${result.causalEffect > 0 ? 'text-red-400' : 'text-green-400'}`}>
            {result.causalEffect > 0 ? '+' : ''}{(result.causalEffect * 100).toFixed(1)}%
          </div>
        </div>
        <div className="bg-background rounded p-2">
          <div className="text-xs text-muted-foreground">Direct Effect</div>
          <div className="font-semibold">
            {result.directEffect > 0 ? '+' : ''}{(result.directEffect * 100).toFixed(1)}%
          </div>
        </div>
        <div className="bg-background rounded p-2">
          <div className="text-xs text-muted-foreground">Indirect Effect</div>
          <div className="font-semibold">
            {result.indirectEffect > 0 ? '+' : ''}{(result.indirectEffect * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Outcome Comparison */}
      <div className="flex items-center justify-center gap-4 py-2">
        <div className="text-center">
          <div className="text-xs text-muted-foreground">Baseline Risk</div>
          <div className="font-mono text-lg">{(result.baselineOutcome * 100).toFixed(1)}%</div>
        </div>
        <ArrowRight className="h-5 w-5 text-muted-foreground" />
        <div className="text-center">
          <div className="text-xs text-muted-foreground">Counterfactual Risk</div>
          <div className={`font-mono text-lg ${result.counterfactualOutcome > result.baselineOutcome ? 'text-red-400' : 'text-green-400'}`}>
            {(result.counterfactualOutcome * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Simple DAG Visualization */}
      <div className="pt-2">
        <SimpleDAG
          {...buildInterventionDAG(
            result.query.variable,
            [
              { variable: 'direct', effect: result.directEffect },
              { variable: 'indirect', effect: result.indirectEffect }
            ],
            result.affectedVariables.slice(0, 3).map(av => ({
              variable: av.variable,
              effect: av.predictedChange
            })),
            'Counterfactual',
            result.counterfactualOutcome - result.baselineOutcome
          )}
          title="Counterfactual Causal Pathway"
          height={160}
          showLegend={false}
        />
      </div>

      {/* Affected Variables */}
      {result.affectedVariables.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-medium">Cascading Effects:</div>
          <div className="flex flex-wrap gap-1">
            {result.affectedVariables.slice(0, 4).map((av, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {av.variable.replace(/_/g, ' ')}
                <span className={`ml-1 ${av.predictedChange > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {av.predictedChange > 0 ? '↑' : '↓'}
                  {Math.abs(av.predictedChange * 100).toFixed(0)}%
                </span>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Explanation */}
      <div className="text-xs text-muted-foreground bg-background/50 rounded p-2 whitespace-pre-line">
        {result.explanation}
      </div>
    </div>
  );
};

export default CounterfactualQueryPanel;
