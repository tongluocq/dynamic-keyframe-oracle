/**
 * Causal Intervention Panel
 * 
 * Displays do-calculus interventions and their causal effects
 * Includes pre-defined interventions for all 5 failure domains + custom builder
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Crosshair, Play, CheckCircle2, XCircle, ArrowRight,
  TrendingUp, TrendingDown, Minus, RotateCcw, Zap,
  Thermometer, Droplets, Wrench, Activity, AlertTriangle,
  Info, Save, Plus, Settings2,
} from 'lucide-react';
import { SystemState, IndustrialDomain } from '@/types/industrial';
import { InferenceResult } from '@/hooks/useEnhancedCVGG';
import {
  getCausalInterventionEngine,
  INTERVENTION_EXAMPLES,
  InterventionResult,
  InterventionDefinition,
} from '@/utils/causalInterventionEngine';
import SimpleDAG, { buildInterventionDAG } from '@/components/SimpleDAG';
import { saveOperationResult, sf, sp, safeNum, shortId } from '@/utils/resultsStorage';
import { useToast } from '@/hooks/use-toast';

interface CausalInterventionPanelProps {
  currentState: SystemState | null;
  cvggResult: InferenceResult | null;
}

const domainIcons: Record<IndustrialDomain, React.ReactNode> = {
  hydraulic: <Droplets className="h-4 w-4 text-blue-400" />,
  mechanical: <Wrench className="h-4 w-4 text-gray-400" />,
  thermal: <Thermometer className="h-4 w-4 text-red-400" />,
  electrical: <Zap className="h-4 w-4 text-yellow-400" />,
  cutting: <Activity className="h-4 w-4 text-green-400" />,
};

const CUSTOM_VARIABLES = [
  { value: 'hydraulic_pressure', label: 'Hydraulic Pressure', domain: 'hydraulic' as IndustrialDomain, unit: 'bar' },
  { value: 'thrust', label: 'Thrust Force', domain: 'mechanical' as IndustrialDomain, unit: 'kN' },
  { value: 'rotation_speed', label: 'Rotation Speed', domain: 'mechanical' as IndustrialDomain, unit: 'RPM' },
  { value: 'thermal_system_temp', label: 'System Temperature', domain: 'thermal' as IndustrialDomain, unit: '°C' },
  { value: 'electrical_voltage', label: 'Electrical Voltage', domain: 'electrical' as IndustrialDomain, unit: 'V' },
  { value: 'cutting_force', label: 'Cutting Force', domain: 'cutting' as IndustrialDomain, unit: 'N' },
  { value: 'cutting_tool_wear', label: 'Tool Wear', domain: 'cutting' as IndustrialDomain, unit: '%' },
  { value: 'mechanical_torque', label: 'Mechanical Torque', domain: 'mechanical' as IndustrialDomain, unit: 'Nm' },
];

const CausalInterventionPanel: React.FC<CausalInterventionPanelProps> = ({
  currentState,
  cvggResult,
}) => {
  const { toast } = useToast();
  const [results, setResults] = useState<InterventionResult[]>([]);
  const [selectedInterventions, setSelectedInterventions] = useState<Set<string>>(new Set());
  const [customInterventions, setCustomInterventions] = useState<InterventionDefinition[]>([]);
  
  // Custom builder state
  const [customVar, setCustomVar] = useState('hydraulic_pressure');
  const [customValue, setCustomValue] = useState('0');
  const [customName, setCustomName] = useState('');
  
  const engine = useMemo(() => getCausalInterventionEngine(), []);

  const allInterventions = useMemo(() => 
    [...INTERVENTION_EXAMPLES, ...customInterventions],
    [customInterventions]
  );

  const toggleIntervention = (id: string) => {
    setSelectedInterventions(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const executeSelected = () => {
    if (!currentState) return;
    const interventions = allInterventions.filter(i => selectedInterventions.has(i.id));
    const newResults = engine.executeMultipleInterventions(interventions, currentState, cvggResult || undefined);
    setResults(prev => [...newResults, ...prev].slice(0, 20));
    const savedIds = newResults.map(result => {
      const savedId = saveOperationResult('intervention', result, { modelMode: 'intervention' });
      (result as any)._savedId = savedId;
      return savedId;
    });
    toast({ title: 'Interventions Executed', description: `${newResults.length} intervention(s) computed. IDs: ${savedIds.map(id => shortId(id)).join(', ')}` });
  };

  const executeAll = () => {
    if (!currentState) return;
    const newResults = engine.executeMultipleInterventions(INTERVENTION_EXAMPLES.slice(0, 3), currentState, cvggResult || undefined);
    setResults(prev => [...newResults, ...prev].slice(0, 20));
    setSelectedInterventions(new Set(INTERVENTION_EXAMPLES.slice(0, 3).map(i => i.id)));
    newResults.forEach(result => saveOperationResult('intervention', result, { modelMode: 'intervention' }));
    toast({ title: 'Example Interventions Saved', description: `${newResults.length} results saved.` });
  };

  const addCustomIntervention = () => {
    const varInfo = CUSTOM_VARIABLES.find(v => v.value === customVar);
    if (!varInfo) return;
    const targetVal = parseFloat(customValue);
    if (isNaN(targetVal)) return;

    const id = `custom-${Date.now()}`;
    const isAbsolute = customVar === 'thermal_system_temp' || customVar === 'cutting_tool_wear';
    const name = customName || `Custom: ${varInfo.label} ${isAbsolute ? `= ${targetVal}${varInfo.unit}` : `${targetVal > 0 ? '+' : ''}${targetVal}%`}`;

    const newIntervention: InterventionDefinition = {
      id,
      name,
      variable: customVar,
      domain: varInfo.domain,
      interventionType: 'do',
      targetValue: targetVal,
      description: isAbsolute 
        ? `do(${varInfo.label} = ${targetVal}${varInfo.unit}): Custom intervention.`
        : `do(${varInfo.label} = current × ${(1 + targetVal / 100).toFixed(2)}): Custom intervention.`,
      expectedOutcomes: ['User-defined intervention — effects computed via causal coefficients'],
    };

    setCustomInterventions(prev => [...prev, newIntervention]);
    setSelectedInterventions(prev => new Set([...prev, id]));
    setCustomName('');
    toast({ title: 'Custom Intervention Added', description: name });
  };

  const clearResults = () => {
    setResults([]);
    setSelectedInterventions(new Set());
    engine.clearHistory();
  };

  const verifiedCount = results.filter(r => r.verified).length;
  const completionStatus = results.length > 0 ? (verifiedCount / results.length) * 100 : 0;

  // Group interventions by domain
  const groupedInterventions = useMemo(() => {
    const groups: Record<IndustrialDomain, InterventionDefinition[]> = {
      hydraulic: [], mechanical: [], thermal: [], electrical: [], cutting: [],
    };
    allInterventions.forEach(i => groups[i.domain].push(i));
    return groups;
  }, [allInterventions]);

  if (!currentState) {
    return (
      <Card className="border-muted">
        <CardContent className="py-8 text-center text-muted-foreground">
          <Crosshair className="h-8 w-8 mx-auto mb-2" />
          <p>Start simulation to enable causal interventions</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crosshair className="h-5 w-5 text-primary" />
              <span>Causal Interventions (do-calculus)</span>
            </div>
            <div className="flex items-center gap-2">
              {results.length > 0 && (
                <Badge variant="outline" className="text-green-400 border-green-400/50">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {verifiedCount}/{results.length} Verified
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Execute causal interventions using do-calculus: <code className="bg-muted px-1 rounded">P(Y | do(X = x))</code>.
            All 5 failure domains covered + custom builder.
          </p>
          {results.length > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Completion Status</span>
                <span>{completionStatus.toFixed(0)}%</span>
              </div>
              <Progress value={completionStatus} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="predefined">
        <TabsList className="w-full">
          <TabsTrigger value="predefined" className="flex-1">
            <Play className="h-3 w-3 mr-1" />
            Pre-defined ({INTERVENTION_EXAMPLES.length})
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex-1">
            <Settings2 className="h-3 w-3 mr-1" />
            Custom Builder
          </TabsTrigger>
        </TabsList>

        {/* Pre-defined Interventions Tab */}
        <TabsContent value="predefined">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <span>Available Interventions by Domain</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={executeAll}>
                    <Play className="h-4 w-4 mr-1" />
                    Run 3 Examples
                  </Button>
                  <Button size="sm" onClick={executeSelected} disabled={selectedInterventions.size === 0}>
                    <Zap className="h-4 w-4 mr-1" />
                    Execute ({selectedInterventions.size})
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-2">
                {(Object.entries(groupedInterventions) as [IndustrialDomain, InterventionDefinition[]][]).map(([domain, interventions]) => (
                  interventions.length > 0 && (
                    <div key={domain} className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        {domainIcons[domain]}
                        <span className="text-sm font-semibold capitalize">{domain} Domain</span>
                        <Badge variant="outline" className="text-xs">{interventions.length}</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-6">
                        {interventions.map((intervention) => (
                          <InterventionCard
                            key={intervention.id}
                            intervention={intervention}
                            isSelected={selectedInterventions.has(intervention.id)}
                            onToggle={() => toggleIntervention(intervention.id)}
                            isCustom={intervention.id.startsWith('custom-')}
                          />
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Builder Tab */}
        <TabsContent value="custom">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Plus className="h-4 w-4" />
                Build Custom Intervention
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Target Variable</Label>
                  <Select value={customVar} onValueChange={setCustomVar}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CUSTOM_VARIABLES.map(v => (
                        <SelectItem key={v.value} value={v.value}>
                          <span className="flex items-center gap-2">
                            {domainIcons[v.domain]}
                            {v.label} ({v.unit})
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>
                    {customVar === 'thermal_system_temp' || customVar === 'cutting_tool_wear' 
                      ? 'Absolute Value' 
                      : 'Change (%)'}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={customValue}
                      onChange={(e) => setCustomValue(e.target.value)}
                      placeholder={customVar === 'thermal_system_temp' ? '60' : '-15'}
                    />
                    <span className="flex items-center text-sm text-muted-foreground">
                      {CUSTOM_VARIABLES.find(v => v.value === customVar)?.unit || '%'}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {[-30, -15, -5, 5, 15, 30].map(val => (
                      <Button
                        key={val}
                        size="sm"
                        variant="outline"
                        className="text-xs px-2 py-1 h-6"
                        onClick={() => setCustomValue(String(val))}
                      >
                        {val > 0 ? '+' : ''}{val}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Name (optional)</Label>
                  <Input
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="My intervention"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  do({CUSTOM_VARIABLES.find(v => v.value === customVar)?.label} = {
                    customVar === 'thermal_system_temp' || customVar === 'cutting_tool_wear'
                      ? `${customValue}${CUSTOM_VARIABLES.find(v => v.value === customVar)?.unit}`
                      : `current × ${(1 + (parseFloat(customValue) || 0) / 100).toFixed(2)}`
                  })
                </p>
                <Button onClick={addCustomIntervention}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add & Select
                </Button>
              </div>

              {customInterventions.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="text-sm font-medium">Custom Interventions ({customInterventions.length})</div>
                  {customInterventions.map(ci => (
                    <div key={ci.id} className="flex items-center justify-between p-2 border rounded text-sm">
                      <div className="flex items-center gap-2">
                        {domainIcons[ci.domain]}
                        <span>{ci.name}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">do()</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-base">
              <span>Intervention Results</span>
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
                  <InterventionResultCard key={`${result.intervention.id}-${idx}`} result={result} />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const InterventionCard: React.FC<{
  intervention: InterventionDefinition;
  isSelected: boolean;
  onToggle: () => void;
  isCustom?: boolean;
}> = ({ intervention, isSelected, onToggle, isCustom }) => {
  return (
    <div
      className={`border rounded-lg p-3 cursor-pointer transition-all ${
        isSelected ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
      }`}
      onClick={onToggle}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm truncate">{intervention.name}</span>
            <Badge variant="outline" className="text-xs shrink-0">
              {intervention.interventionType}()
            </Badge>
            {isCustom && (
              <Badge variant="secondary" className="text-xs shrink-0">Custom</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {intervention.description}
          </p>
          <div className="flex flex-wrap gap-1 mt-1">
            {intervention.expectedOutcomes.slice(0, 2).map((outcome, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {outcome}
              </Badge>
            ))}
          </div>
        </div>
        {isSelected && <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-1" />}
      </div>
    </div>
  );
};

const InterventionResultCard: React.FC<{ result: InterventionResult }> = ({ result }) => {
  const riskDelta = result.riskAssessment.riskDelta;
  const riskTrend = riskDelta > 0.02 ? 'increased' : riskDelta < -0.02 ? 'decreased' : 'unchanged';
  
  return (
    <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {domainIcons[result.intervention.domain]}
          <span className="font-medium">{result.intervention.name}</span>
          {result.verified ? (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          ) : (
            <Badge variant="outline" className="text-yellow-400">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Pending
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {(result.confidence * 100).toFixed(0)}% confidence
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-background rounded p-2 text-center">
          <div className="text-xs text-muted-foreground">Primary Effect</div>
          <div className={`font-semibold ${result.causalEffects.primaryEffect > 0 ? 'text-orange-400' : 'text-blue-400'}`}>
            {result.causalEffects.primaryEffect > 0 ? '+' : ''}
            {(result.causalEffects.primaryEffect * 100).toFixed(1)}%
          </div>
        </div>
        <div className="bg-background rounded p-2 text-center">
          <div className="text-xs text-muted-foreground">Secondary Effects</div>
          <div className="font-semibold">{result.causalEffects.secondaryEffects.length} pathways</div>
        </div>
        <div className="bg-background rounded p-2 text-center">
          <div className="text-xs text-muted-foreground">Total Effect</div>
          <div className={`font-semibold ${result.causalEffects.totalEffect > 0 ? 'text-red-400' : 'text-green-400'}`}>
            {result.causalEffects.totalEffect > 0 ? '+' : ''}
            {(result.causalEffects.totalEffect * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 py-2">
        <div className="text-center">
          <div className="text-xs text-muted-foreground">Pre-Intervention Risk</div>
          <div className="font-mono">{(result.riskAssessment.preInterventionRisk * 100).toFixed(1)}%</div>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <div className="text-center">
          <div className="text-xs text-muted-foreground">Post-Intervention Risk</div>
          <div className={`font-mono ${riskTrend === 'increased' ? 'text-red-400' : riskTrend === 'decreased' ? 'text-green-400' : ''}`}>
            {(result.riskAssessment.postInterventionRisk * 100).toFixed(1)}%
          </div>
        </div>
        <Badge variant="outline" className={`ml-2 ${
          riskTrend === 'increased' ? 'text-red-400' : 
          riskTrend === 'decreased' ? 'text-green-400' : 'text-gray-400'
        }`}>
          {riskTrend === 'increased' && <TrendingUp className="h-3 w-3 mr-1" />}
          {riskTrend === 'decreased' && <TrendingDown className="h-3 w-3 mr-1" />}
          {riskTrend === 'unchanged' && <Minus className="h-3 w-3 mr-1" />}
          {riskTrend}
        </Badge>
      </div>

      <div className="pt-2">
        <SimpleDAG
          {...buildInterventionDAG(
            result.intervention.variable,
            [{ variable: 'direct_effect', effect: result.causalEffects.primaryEffect }],
            result.causalEffects.secondaryEffects.slice(0, 3).map(se => ({
              variable: se.pathway,
              effect: se.effect
            })),
            'Risk',
            result.riskAssessment.riskDelta
          )}
          title="Intervention Causal Pathway"
          height={160}
          showLegend={false}
        />
      </div>

      {result.causalEffects.secondaryEffects.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-medium">Causal Pathways:</div>
          <div className="flex flex-wrap gap-1">
            {result.causalEffects.secondaryEffects.slice(0, 5).map((effect, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {effect.pathway}
                <span className={`ml-1 ${effect.effect > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {effect.effect > 0 ? '↑' : '↓'}
                  {Math.abs(effect.effect * 100).toFixed(0)}%
                </span>
              </Badge>
            ))}
          </div>
        </div>
      )}

      <Separator />
      <div className="text-xs text-muted-foreground bg-background/50 rounded p-2 whitespace-pre-line font-mono">
        {result.explanation}
      </div>
    </div>
  );
};

export default CausalInterventionPanel;
