/**
 * Causal Intervention Panel
 * 
 * Displays do-calculus interventions and their causal effects
 * Shows verification status for each intervention
 * Now includes Simple DAG visualization for intervention pathways
 * Saves results to persistent storage
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Crosshair,
  Play,
  CheckCircle2,
  XCircle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  RotateCcw,
  Zap,
  Thermometer,
  Droplets,
  Wrench,
  Activity,
  AlertTriangle,
  Info,
  Save,
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
import { saveOperationResult } from '@/utils/resultsStorage';
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

const CausalInterventionPanel: React.FC<CausalInterventionPanelProps> = ({
  currentState,
  cvggResult,
}) => {
  const { toast } = useToast();
  const [results, setResults] = useState<InterventionResult[]>([]);
  const [selectedInterventions, setSelectedInterventions] = useState<Set<string>>(new Set());
  
  const engine = useMemo(() => getCausalInterventionEngine(), []);

  const toggleIntervention = (id: string) => {
    setSelectedInterventions(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const executeSelected = () => {
    if (!currentState) return;
    
    const interventions = INTERVENTION_EXAMPLES.filter(i => selectedInterventions.has(i.id));
    const newResults = engine.executeMultipleInterventions(
      interventions,
      currentState,
      cvggResult || undefined
    );
    setResults(prev => [...newResults, ...prev].slice(0, 10));
    
    // Save each result to storage
    newResults.forEach(result => {
      saveOperationResult('intervention', result, {
        modelMode: 'intervention',
      });
    });
    
    toast({
      title: 'Interventions Executed & Saved',
      description: `${newResults.length} intervention(s) executed and saved to results.`,
    });
  };

  const executeAll = () => {
    if (!currentState) return;
    
    const newResults = engine.executeMultipleInterventions(
      INTERVENTION_EXAMPLES.slice(0, 2), // Execute first 2 as examples
      currentState,
      cvggResult || undefined
    );
    setResults(prev => [...newResults, ...prev].slice(0, 10));
    setSelectedInterventions(new Set(INTERVENTION_EXAMPLES.slice(0, 2).map(i => i.id)));
    
    // Save each result to storage
    newResults.forEach(result => {
      saveOperationResult('intervention', result, {
        modelMode: 'intervention',
      });
    });
    
    toast({
      title: 'Example Interventions Saved',
      description: `${newResults.length} intervention results saved.`,
    });
  };

  const clearResults = () => {
    setResults([]);
    setSelectedInterventions(new Set());
    engine.clearHistory();
  };

  const verifiedCount = results.filter(r => r.verified).length;
  const completionStatus = results.length > 0 ? (verifiedCount / results.length) * 100 : 0;

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
      {/* Header with Status */}
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
            Execute causal interventions using do-calculus: <code className="bg-muted px-1 rounded">P(Y | do(X = x))</code>
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

      {/* Intervention Examples */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-base">
            <span>Available Interventions</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={executeAll}>
                <Play className="h-4 w-4 mr-1" />
                Run 2 Examples
              </Button>
              <Button 
                size="sm" 
                onClick={executeSelected}
                disabled={selectedInterventions.size === 0}
              >
                <Zap className="h-4 w-4 mr-1" />
                Execute ({selectedInterventions.size})
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {INTERVENTION_EXAMPLES.map((intervention) => (
              <InterventionCard
                key={intervention.id}
                intervention={intervention}
                isSelected={selectedInterventions.has(intervention.id)}
                onToggle={() => toggleIntervention(intervention.id)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

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
}> = ({ intervention, isSelected, onToggle }) => {
  return (
    <div
      className={`border rounded-lg p-3 cursor-pointer transition-all ${
        isSelected
          ? 'border-primary bg-primary/10'
          : 'border-border hover:border-primary/50'
      }`}
      onClick={onToggle}
    >
      <div className="flex items-start gap-3">
        <div className="mt-1">
          {domainIcons[intervention.domain]}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{intervention.name}</span>
            <Badge variant="outline" className="text-xs">
              {intervention.interventionType}()
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {intervention.description}
          </p>
          <div className="flex flex-wrap gap-1 mt-2">
            {intervention.expectedOutcomes.slice(0, 2).map((outcome, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {outcome}
              </Badge>
            ))}
          </div>
        </div>
        {isSelected && (
          <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
        )}
      </div>
    </div>
  );
};

const InterventionResultCard: React.FC<{ result: InterventionResult }> = ({ result }) => {
  const riskDelta = result.riskAssessment.riskDelta;
  const riskTrend = riskDelta > 0.02 ? 'increased' : riskDelta < -0.02 ? 'decreased' : 'unchanged';
  
  return (
    <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
      {/* Header */}
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

      {/* Causal Effects Grid */}
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
          <div className="font-semibold">
            {result.causalEffects.secondaryEffects.length} pathways
          </div>
        </div>
        <div className="bg-background rounded p-2 text-center">
          <div className="text-xs text-muted-foreground">Total Effect</div>
          <div className={`font-semibold ${result.causalEffects.totalEffect > 0 ? 'text-red-400' : 'text-green-400'}`}>
            {result.causalEffects.totalEffect > 0 ? '+' : ''}
            {(result.causalEffects.totalEffect * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Risk Assessment */}
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

      {/* Simple DAG Visualization */}
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

      {/* Secondary Effects */}
      {result.causalEffects.secondaryEffects.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-medium">Causal Pathways:</div>
          <div className="flex flex-wrap gap-1">
            {result.causalEffects.secondaryEffects.slice(0, 4).map((effect, i) => (
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

      {/* Explanation */}
      <Separator />
      <div className="text-xs text-muted-foreground bg-background/50 rounded p-2 whitespace-pre-line font-mono">
        {result.explanation}
      </div>
    </div>
  );
};

export default CausalInterventionPanel;
