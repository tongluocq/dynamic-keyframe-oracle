import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, 
  Lightbulb, Brain, GitBranch, ArrowRight, Zap, Thermometer,
  Activity, Target, DollarSign, Clock, Info, BarChart3,
  ChevronDown, ChevronUp, Waves, CircleDot, ArrowRightLeft, Network
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  CAUSAL_EFFECT_EXAMPLES,
  CAUSAL_INTERVENTION_EXAMPLES,
  COUNTERFACTUAL_EXAMPLES,
  PRESCRIPTIVE_EXAMPLES,
  DECISION_MAKING_EXAMPLES,
  FLOAT_VALUE_REFERENCES,
  formatFloat,
  getRiskChangeColor,
  getPriorityColor,
  type CausalEffectExample,
  type CausalInterventionExample,
  type CounterfactualExample,
  type PrescriptiveExample,
  type DecisionMakingExample,
  type InputSignature,
  type CausalPathwayStep,
  type VariableInteraction
} from '@/utils/exampleGenerator';
import {
  CausalEffectChart,
  InterventionChart,
  CounterfactualChart,
  PrescriptiveChart,
  DecisionChart
} from '@/components/ExampleCharts';
import SimpleDAG, { buildInterventionDAG, SimpleDAGNode, SimpleDAGEdge } from '@/components/SimpleDAG';

export const CausalExamplesPanel: React.FC = () => {
  const { t } = useLanguage();

  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          <CardTitle className="text-lg">{t('examplesPanel')}</CardTitle>
        </div>
        <CardDescription>{t('examplesDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="causal-effects" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-4">
            <TabsTrigger value="causal-effects" className="text-xs">
              <Activity className="h-3 w-3 mr-1" />
              {t('causalEffects')}
            </TabsTrigger>
            <TabsTrigger value="do-calculus" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              {t('doCalculus')}
            </TabsTrigger>
            <TabsTrigger value="counterfactual" className="text-xs">
              <GitBranch className="h-3 w-3 mr-1" />
              {t('counterfactual')}
            </TabsTrigger>
            <TabsTrigger value="prescriptive" className="text-xs">
              <Brain className="h-3 w-3 mr-1" />
              {t('prescriptiveAI')}
            </TabsTrigger>
            <TabsTrigger value="decision-vs-prescriptive" className="text-xs">
              <Target className="h-3 w-3 mr-1" />
              {t('decisionVsPrescriptive')}
            </TabsTrigger>
          </TabsList>

          {/* Causal Effects Tab */}
          <TabsContent value="causal-effects">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-400">
                    CVGG ATE/CATE
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {t('causalEffectDescription')}
                  </span>
                </div>
                
                {CAUSAL_EFFECT_EXAMPLES.map((example) => (
                  <CausalEffectCard key={example.id} example={example} />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* do-Calculus Intervention Tab */}
          <TabsContent value="do-calculus">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="bg-orange-500/10 text-orange-400">
                    do(X = x)
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {t('doCalculusDescription')}
                  </span>
                </div>
                
                {CAUSAL_INTERVENTION_EXAMPLES.map((example) => (
                  <InterventionCard key={example.id} example={example} />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Counterfactual Tab */}
          <TabsContent value="counterfactual">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="bg-purple-500/10 text-purple-400">
                    What-If Analysis
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {t('counterfactualDescription')}
                  </span>
                </div>
                
                {COUNTERFACTUAL_EXAMPLES.map((example) => (
                  <CounterfactualCard key={example.id} example={example} />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Prescriptive AI Tab */}
          <TabsContent value="prescriptive">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="bg-green-500/10 text-green-400">
                    AI Recommendations
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {t('prescriptiveDescription')}
                  </span>
                </div>
                
                {PRESCRIPTIVE_EXAMPLES.map((example) => (
                  <PrescriptiveCard key={example.id} example={example} />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Decision vs Prescriptive Tab */}
          <TabsContent value="decision-vs-prescriptive">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                <ComparisonHeader />
                
                {DECISION_MAKING_EXAMPLES.map((example) => (
                  <DecisionMakingCard key={example.id} example={example} />
                ))}

                <Separator className="my-4" />
                
                <FloatValueReferenceTable />
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

// ============================================
// SUB-COMPONENTS
// ============================================

const CausalEffectCard: React.FC<{ example: CausalEffectExample }> = ({ example }) => {
  const { t } = useLanguage();
  const isNormal = example.condition === 'normal';
  const [showInputDetails, setShowInputDetails] = useState(false);
  const [showPathway, setShowPathway] = useState(false);
  const [showInteractions, setShowInteractions] = useState(false);
  
  // Build DAG nodes and edges from variable interactions
  const buildVariableInteractionDAG = (interactions: VariableInteraction[]): { nodes: SimpleDAGNode[], edges: SimpleDAGEdge[] } => {
    const nodeMap = new Map<string, SimpleDAGNode>();
    const edges: SimpleDAGEdge[] = [];
    
    interactions.forEach((interaction, idx) => {
      // Add source node if not exists
      if (!nodeMap.has(interaction.from)) {
        nodeMap.set(interaction.from, {
          id: interaction.from,
          label: interaction.from,
          type: idx === 0 ? 'intervention' : 'primary',
          value: interaction.direction === 'positive' ? interaction.strength : -interaction.strength
        });
      }
      // Add target node if not exists
      if (!nodeMap.has(interaction.to)) {
        nodeMap.set(interaction.to, {
          id: interaction.to,
          label: interaction.to,
          type: 'secondary',
          value: interaction.direction === 'positive' ? interaction.strength : -interaction.strength
        });
      }
      // Add edge
      edges.push({
        from: interaction.from,
        to: interaction.to,
        strength: interaction.strength,
        label: interaction.direction === 'positive' ? `+${(interaction.strength * 100).toFixed(0)}%` : `-${(interaction.strength * 100).toFixed(0)}%`
      });
    });
    
    return { nodes: Array.from(nodeMap.values()), edges };
  };
  
  const dagData = buildVariableInteractionDAG(example.variableInteractions);
  
  return (
    <Card className={`border-l-4 ${isNormal ? 'border-l-green-500' : 'border-l-red-500'} bg-card/30`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isNormal ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            )}
            <CardTitle className="text-sm">{example.title}</CardTitle>
          </div>
          <Badge variant={isNormal ? 'secondary' : 'destructive'}>
            {isNormal ? t('normalOperation') : t('faultCondition')}
          </Badge>
        </div>
        <CardDescription className="text-xs">{example.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Matplotlib-style Chart */}
        <div className="bg-background/50 rounded-lg p-3 border border-border/30">
          <div className="flex items-center gap-1 mb-2">
            <BarChart3 className="h-3 w-3 text-primary" />
            <span className="text-xs font-semibold text-muted-foreground">Effect Decomposition</span>
          </div>
          <CausalEffectChart example={example} />
        </div>

        {/* Float Values Table */}
        <div className="bg-background/50 rounded-lg p-3">
          <h4 className="text-xs font-semibold mb-2 text-muted-foreground">{t('floatValues')}</h4>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-blue-500/10 rounded p-2">
              <span className="text-muted-foreground">ATE:</span>
              <span className="ml-1 font-mono font-bold text-blue-400">{formatFloat(example.values.ATE)}</span>
            </div>
            <div className="bg-purple-500/10 rounded p-2">
              <span className="text-muted-foreground">CATE:</span>
              <span className="ml-1 font-mono font-bold text-purple-400">{formatFloat(example.values.CATE)}</span>
            </div>
            <div className="bg-green-500/10 rounded p-2">
              <span className="text-muted-foreground">{t('confidence')}:</span>
              <span className="ml-1 font-mono font-bold text-green-400">{formatFloat(example.values.confidence)}</span>
            </div>
            <div className="bg-orange-500/10 rounded p-2">
              <span className="text-muted-foreground">{t('directEffect')}:</span>
              <span className="ml-1 font-mono font-bold text-orange-400">{formatFloat(example.values.directEffect)}</span>
            </div>
            <div className="bg-pink-500/10 rounded p-2">
              <span className="text-muted-foreground">{t('indirectEffect')}:</span>
              <span className="ml-1 font-mono font-bold text-pink-400">{formatFloat(example.values.indirectEffect)}</span>
            </div>
            <div className="bg-cyan-500/10 rounded p-2">
              <span className="text-muted-foreground">p-value:</span>
              <span className="ml-1 font-mono font-bold text-cyan-400">{formatFloat(example.values.pValue)}</span>
            </div>
          </div>
        </div>

        {/* NEW: Why Explanation Box */}
        <div className={`rounded-lg p-3 border ${isNormal ? 'bg-green-500/5 border-green-500/30' : 'bg-red-500/5 border-red-500/30'}`}>
          <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
            <Lightbulb className={`h-3 w-3 ${isNormal ? 'text-green-400' : 'text-red-400'}`} />
            {isNormal ? 'Why Normal?' : 'Why Fault?'}
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">{example.whyExplanation}</p>
        </div>

        {/* NEW: Collapsible Input Signature Section */}
        <Collapsible open={showInputDetails} onOpenChange={setShowInputDetails}>
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between bg-background/50 rounded-lg p-2 hover:bg-background/70 transition-colors">
              <div className="flex items-center gap-2">
                <Waves className="h-4 w-4 text-blue-400" />
                <span className="text-xs font-semibold">Sensor Input Patterns</span>
              </div>
              {showInputDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <InputSignatureTable signature={example.inputSignature} />
          </CollapsibleContent>
        </Collapsible>

        {/* NEW: Collapsible Causal Pathway Section */}
        <Collapsible open={showPathway} onOpenChange={setShowPathway}>
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between bg-background/50 rounded-lg p-2 hover:bg-background/70 transition-colors">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-purple-400" />
                <span className="text-xs font-semibold">CVGG Processing Pathway</span>
              </div>
              {showPathway ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CausalPathwaySection pathway={example.causalPathway} />
          </CollapsibleContent>
        </Collapsible>

        {/* NEW: Collapsible Variable Interactions DAG */}
        <Collapsible open={showInteractions} onOpenChange={setShowInteractions}>
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between bg-background/50 rounded-lg p-2 hover:bg-background/70 transition-colors">
              <div className="flex items-center gap-2">
                <Network className="h-4 w-4 text-orange-400" />
                <span className="text-xs font-semibold">Variable Interaction DAG</span>
              </div>
              {showInteractions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 space-y-3">
              <SimpleDAG 
                nodes={dagData.nodes} 
                edges={dagData.edges} 
                title="Causal Variable Interactions"
                height={180}
                showLegend={false}
              />
              <VariableInteractionTable interactions={example.variableInteractions} />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Interpretation */}
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Info className="h-3 w-3 text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">{example.interpretation}</p>
          </div>
          <div className="flex items-start gap-2">
            <Zap className="h-3 w-3 text-yellow-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-yellow-200/80">{example.tbmContext}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================
// NEW SUB-COMPONENTS FOR ENHANCED VISUALIZATION
// ============================================

const InputSignatureTable: React.FC<{ signature: InputSignature }> = ({ signature }) => {
  const getAnomalyBadge = (level: 'none' | 'low' | 'medium' | 'high') => {
    const styles = {
      none: 'bg-green-500/20 text-green-400 border-green-500/30',
      low: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      medium: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      high: 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    const labels = { none: 'NORMAL', low: 'LOW', medium: 'MEDIUM', high: 'HIGH' };
    return <Badge variant="outline" className={`text-[10px] ${styles[level]}`}>{labels[level]}</Badge>;
  };

  return (
    <div className="mt-2 space-y-3">
      {/* Sensor Patterns Table */}
      <div className="bg-background/30 rounded-lg p-2">
        <h5 className="text-xs font-semibold mb-2 flex items-center gap-1">
          <Activity className="h-3 w-3 text-blue-400" />
          Sensor Readings
        </h5>
        <Table>
          <TableHeader>
            <TableRow className="text-[10px]">
              <TableHead className="h-6 py-1">Channel</TableHead>
              <TableHead className="h-6 py-1">Pattern</TableHead>
              <TableHead className="h-6 py-1">Normal</TableHead>
              <TableHead className="h-6 py-1">Observed</TableHead>
              <TableHead className="h-6 py-1">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-[10px]">
            {signature.sensorPatterns.map((sensor, idx) => (
              <TableRow key={idx}>
                <TableCell className="py-1 font-mono">{sensor.channel}</TableCell>
                <TableCell className="py-1 text-muted-foreground">{sensor.pattern}</TableCell>
                <TableCell className="py-1 font-mono text-green-400">{sensor.normalRange}</TableCell>
                <TableCell className="py-1 font-mono font-bold">{sensor.observedValue}</TableCell>
                <TableCell className="py-1">{getAnomalyBadge(sensor.anomalyLevel)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Rock Image Features */}
      <div className="bg-background/30 rounded-lg p-2">
        <h5 className="text-xs font-semibold mb-2 flex items-center gap-1">
          <CircleDot className="h-3 w-3 text-purple-400" />
          Rock Image Features
        </h5>
        <div className="space-y-1">
          {signature.rockImageFeatures.map((feature, idx) => (
            <div key={idx} className="flex items-start gap-2 text-[10px]">
              <Badge variant="outline" className="text-[9px] bg-purple-500/10">{feature.feature}</Badge>
              <span className="text-muted-foreground">{feature.description}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Causal Metadata State */}
      <div className="flex gap-4 text-[10px]">
        <div className="bg-background/30 rounded p-2">
          <span className="text-muted-foreground">Active Interventions:</span>
          <span className="ml-1 font-mono font-bold">{signature.causalMetadataState.activeInterventions}</span>
        </div>
        <div className="bg-background/30 rounded p-2">
          <span className="text-muted-foreground">Confounder Level:</span>
          <Badge variant="outline" className={`ml-1 text-[9px] ${
            signature.causalMetadataState.confounderLevel === 'Low' ? 'text-green-400' : 
            signature.causalMetadataState.confounderLevel === 'Medium' ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {signature.causalMetadataState.confounderLevel}
          </Badge>
        </div>
      </div>
    </div>
  );
};

const CausalPathwaySection: React.FC<{ pathway: CausalPathwayStep[] }> = ({ pathway }) => {
  return (
    <div className="mt-2 bg-background/30 rounded-lg p-3">
      <div className="space-y-2">
        {pathway.map((step, idx) => (
          <div key={idx} className="flex items-center gap-2">
            {/* Stage Badge */}
            <Badge variant="outline" className={`text-[9px] min-w-[50px] justify-center ${
              step.stage === 'Input' ? 'bg-blue-500/10 text-blue-400' :
              step.stage === 'Feature' ? 'bg-purple-500/10 text-purple-400' :
              step.stage === 'Fusion' ? 'bg-orange-500/10 text-orange-400' :
              'bg-green-500/10 text-green-400'
            }`}>
              {step.stage}
            </Badge>
            
            {/* Arrow */}
            <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            
            {/* Content */}
            <div className="flex-1 bg-background/50 rounded p-2 text-[10px]">
              <div className="font-semibold text-foreground">{step.component}</div>
              <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
                <span className="text-blue-400">{step.input}</span>
                <ArrowRight className="h-2 w-2" />
                <span className="text-green-400">{step.output}</span>
              </div>
              <div className="text-muted-foreground/70 italic mt-0.5">{step.transformation}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const VariableInteractionTable: React.FC<{ interactions: VariableInteraction[] }> = ({ interactions }) => {
  return (
    <div className="bg-background/30 rounded-lg p-2">
      <Table>
        <TableHeader>
          <TableRow className="text-[10px]">
            <TableHead className="h-6 py-1">From</TableHead>
            <TableHead className="h-6 py-1">To</TableHead>
            <TableHead className="h-6 py-1">Mechanism</TableHead>
            <TableHead className="h-6 py-1">Effect</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="text-[10px]">
          {interactions.map((interaction, idx) => (
            <TableRow key={idx}>
              <TableCell className="py-1 font-mono text-blue-400">{interaction.from}</TableCell>
              <TableCell className="py-1 font-mono text-purple-400">{interaction.to}</TableCell>
              <TableCell className="py-1 text-muted-foreground">{interaction.mechanism}</TableCell>
              <TableCell className="py-1">
                <span className={`font-mono font-bold ${interaction.direction === 'positive' ? 'text-red-400' : 'text-green-400'}`}>
                  {interaction.direction === 'positive' ? '+' : '-'}{(interaction.strength * 100).toFixed(0)}%
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const InterventionCard: React.FC<{ example: CausalInterventionExample }> = ({ example }) => {
  const { t } = useLanguage();
  const riskChange = example.riskAssessment.interventionRisk - example.riskAssessment.baselineRisk;
  const isRiskIncreased = riskChange > 0;
  
  return (
    <Card className="border-l-4 border-l-orange-500 bg-card/30">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4 text-orange-400" />
            {example.title}
          </CardTitle>
          <Badge className={isRiskIncreased ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}>
            {isRiskIncreased ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {isRiskIncreased ? '+' : ''}{(riskChange * 100).toFixed(1)}% {t('risk')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* do-Command Display */}
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
          <code className="text-sm font-mono text-orange-300">{example.command}</code>
        </div>

        {/* do-Calculus Notation */}
        <div className="bg-background/50 rounded-lg p-3">
          <h4 className="text-xs font-semibold mb-2 text-muted-foreground">{t('doCalculusNotation')}</h4>
          <code className="text-xs font-mono text-primary/80">{example.doCalculus.notation}</code>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">{t('targetVariable')}:</span>
            <span className="font-mono text-orange-400">{example.doCalculus.variable} = {example.doCalculus.targetValue} {example.doCalculus.unit}</span>
          </div>
        </div>

        {/* Primary Effects */}
        <div className="bg-background/50 rounded-lg p-3">
          <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
            <ArrowRight className="h-3 w-3 text-orange-400" />
            {t('primaryEffects')}
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {example.primaryEffects.map((effect, idx) => (
              <div key={idx} className="bg-orange-500/10 rounded p-2 text-xs">
                <span className="text-muted-foreground">{effect.variable}:</span>
                <span className={`ml-1 font-mono font-bold ${effect.value > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {effect.change}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Secondary (Cascade) Effects */}
        <div className="bg-background/50 rounded-lg p-3">
          <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
            <GitBranch className="h-3 w-3 text-purple-400" />
            {t('secondaryEffects')}
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {example.secondaryEffects.map((effect, idx) => (
              <div key={idx} className="bg-purple-500/10 rounded p-2 text-xs">
                <span className="text-muted-foreground">{effect.variable}:</span>
                <span className={`ml-1 font-mono font-bold ${effect.value > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {effect.change}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Matplotlib-style Chart */}
        <div className="bg-background/50 rounded-lg p-3 border border-border/30">
          <div className="flex items-center gap-1 mb-2">
            <BarChart3 className="h-3 w-3 text-orange-400" />
            <span className="text-xs font-semibold text-muted-foreground">Cascade Visualization</span>
          </div>
          <InterventionChart example={example} />
        </div>

        {/* Risk Assessment */}
        <div className="bg-background/50 rounded-lg p-3">
          <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-yellow-400" />
            {t('riskAssessment')}
          </h4>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-blue-500/10 rounded p-2">
              <span className="text-muted-foreground">{t('baselineRisk')}:</span>
              <span className="ml-1 font-mono font-bold text-blue-400">{(example.riskAssessment.baselineRisk * 100).toFixed(1)}%</span>
            </div>
            <div className={`rounded p-2 ${isRiskIncreased ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
              <span className="text-muted-foreground">{t('interventionRisk')}:</span>
              <span className={`ml-1 font-mono font-bold ${isRiskIncreased ? 'text-red-400' : 'text-green-400'}`}>
                {(example.riskAssessment.interventionRisk * 100).toFixed(1)}%
              </span>
            </div>
            <div className="bg-cyan-500/10 rounded p-2">
              <span className="text-muted-foreground">{t('confidence')}:</span>
              <span className="ml-1 font-mono font-bold text-cyan-400">{(example.riskAssessment.confidence * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Interpretation */}
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Info className="h-3 w-3 text-orange-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">{example.interpretation}</p>
          </div>
          <div className="flex items-start gap-2">
            <Zap className="h-3 w-3 text-yellow-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-yellow-200/80">{example.tbmContext}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const CounterfactualCard: React.FC<{ example: CounterfactualExample }> = ({ example }) => {
  const { t } = useLanguage();
  const RiskIcon = example.riskChange === 'increased' ? TrendingUp : 
                   example.riskChange === 'decreased' ? TrendingDown : Minus;
  
  return (
    <Card className="border-l-4 border-l-purple-500 bg-card/30">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-purple-400" />
            {example.title}
          </CardTitle>
          <Badge className={getRiskChangeColor(example.riskChange)}>
            <RiskIcon className="h-3 w-3 mr-1" />
            {t(`risk${example.riskChange.charAt(0).toUpperCase() + example.riskChange.slice(1)}`)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Command Display */}
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
          <code className="text-sm font-mono text-purple-300">{example.command}</code>
        </div>

        {/* Intervention Details */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">{example.intervention.variable}:</span>
            <span className="font-mono text-red-400">{example.intervention.fromValue}</span>
            <ArrowRight className="h-3 w-3" />
            <span className="font-mono text-green-400">{example.intervention.toValue}</span>
            <span className="text-muted-foreground">{example.intervention.unit}</span>
          </div>
        </div>

        {/* Matplotlib-style Chart */}
        <div className="bg-background/50 rounded-lg p-3 border border-border/30">
          <div className="flex items-center gap-1 mb-2">
            <BarChart3 className="h-3 w-3 text-purple-400" />
            <span className="text-xs font-semibold text-muted-foreground">Trajectory Visualization</span>
          </div>
          <CounterfactualChart example={example} />
        </div>

        {/* Float Values Table */}
        <div className="bg-background/50 rounded-lg p-3">
          <h4 className="text-xs font-semibold mb-2 text-muted-foreground">{t('floatValues')}</h4>
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead className="h-8">{t('metric')}</TableHead>
                <TableHead className="h-8">{t('value')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs">
              <TableRow>
                <TableCell className="py-1">{t('baselineOutcome')} (Y₀)</TableCell>
                <TableCell className="py-1 font-mono text-blue-400">{formatFloat(example.values.baselineOutcome)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="py-1">{t('counterfactualOutcome')} (Y₁)</TableCell>
                <TableCell className="py-1 font-mono text-purple-400">{formatFloat(example.values.counterfactualOutcome)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="py-1">{t('causalEffect')} (Δ)</TableCell>
                <TableCell className={`py-1 font-mono font-bold ${example.values.causalEffect > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {example.values.causalEffect > 0 ? '+' : ''}{formatFloat(example.values.causalEffect)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="py-1">{t('directEffect')}</TableCell>
                <TableCell className="py-1 font-mono text-orange-400">{formatFloat(example.values.directEffect)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="py-1">{t('indirectEffect')}</TableCell>
                <TableCell className="py-1 font-mono text-pink-400">{formatFloat(example.values.indirectEffect)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="py-1">{t('confidence')}</TableCell>
                <TableCell className="py-1 font-mono text-green-400">{formatFloat(example.values.confidence)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Interpretation */}
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Info className="h-3 w-3 text-purple-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">{example.interpretation}</p>
          </div>
          <div className="flex items-start gap-2">
            <Thermometer className="h-3 w-3 text-yellow-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-yellow-200/80">{example.tbmContext}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const PrescriptiveCard: React.FC<{ example: PrescriptiveExample }> = ({ example }) => {
  const { t } = useLanguage();
  
  return (
    <Card className="border-l-4 border-l-green-500 bg-card/30">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="h-4 w-4 text-green-400" />
            {example.title}
          </CardTitle>
          <Badge className={getPriorityColor(example.priority)}>
            {example.priority.toUpperCase()}
          </Badge>
        </div>
        <CardDescription className="text-xs">{example.trigger}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Action Command */}
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
          <code className="text-sm font-mono text-green-300">{example.action}</code>
        </div>

        {/* Recommendation */}
        <div className="bg-background/50 rounded-lg p-3">
          <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
            <Lightbulb className="h-3 w-3 text-yellow-400" />
            {t('recommendation')}
          </h4>
          <p className="text-sm font-medium">{example.recommendation}</p>
        </div>

        {/* Matplotlib-style Chart */}
        <div className="bg-background/50 rounded-lg p-3 border border-border/30">
          <div className="flex items-center gap-1 mb-2">
            <BarChart3 className="h-3 w-3 text-green-400" />
            <span className="text-xs font-semibold text-muted-foreground">Impact Radar</span>
          </div>
          <PrescriptiveChart example={example} />
        </div>

        {/* Float Values */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-blue-500/10 rounded p-2">
            <span className="text-muted-foreground">ATE:</span>
            <span className={`ml-1 font-mono font-bold ${example.values.ATE < 0 ? 'text-green-400' : 'text-red-400'}`}>
              {example.values.ATE > 0 ? '+' : ''}{formatFloat(example.values.ATE)}
            </span>
          </div>
          <div className="bg-green-500/10 rounded p-2">
            <span className="text-muted-foreground">{t('riskReduction')}:</span>
            <span className="ml-1 font-mono font-bold text-green-400">{(example.values.riskReduction * 100).toFixed(2)}%</span>
          </div>
          <div className="bg-yellow-500/10 rounded p-2 flex items-center gap-1">
            <DollarSign className="h-3 w-3 text-yellow-400" />
            <span className="text-muted-foreground">{t('costSaving')}:</span>
            <span className="ml-1 font-mono font-bold text-yellow-400">${example.values.costSaving}K</span>
          </div>
          <div className="bg-cyan-500/10 rounded p-2 flex items-center gap-1">
            <Clock className="h-3 w-3 text-cyan-400" />
            <span className="text-muted-foreground">{t('downtimeAvoided')}:</span>
            <span className="ml-1 font-mono font-bold text-cyan-400">{example.values.downtimeAvoidance}h</span>
          </div>
          <div className="bg-orange-500/10 rounded p-2">
            <span className="text-muted-foreground">{t('directEffect')}:</span>
            <span className="ml-1 font-mono font-bold text-orange-400">{formatFloat(example.values.directEffect)}</span>
          </div>
          <div className="bg-purple-500/10 rounded p-2">
            <span className="text-muted-foreground">{t('confidence')}:</span>
            <span className="ml-1 font-mono font-bold text-purple-400">{(example.values.confidence * 100).toFixed(2)}%</span>
          </div>
        </div>

        {/* Interpretation */}
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Info className="h-3 w-3 text-green-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">{example.interpretation}</p>
          </div>
          <div className="flex items-start gap-2">
            <Zap className="h-3 w-3 text-yellow-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-yellow-200/80">{example.tbmContext}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ComparisonHeader: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <Card className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border-primary/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Target className="h-4 w-4" />
          {t('prescriptiveVsDecision')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-green-400" />
              <span className="font-semibold text-green-400">{t('prescriptiveAI')}</span>
            </div>
            <ul className="space-y-1 text-muted-foreground list-disc list-inside">
              <li>{t('prescriptiveFeature1')}</li>
              <li>{t('prescriptiveFeature2')}</li>
              <li>{t('prescriptiveFeature3')}</li>
            </ul>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-400" />
              <span className="font-semibold text-blue-400">{t('decisionMaking')}</span>
            </div>
            <ul className="space-y-1 text-muted-foreground list-disc list-inside">
              <li>{t('decisionFeature1')}</li>
              <li>{t('decisionFeature2')}</li>
              <li>{t('decisionFeature3')}</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const DecisionMakingCard: React.FC<{ example: DecisionMakingExample }> = ({ example }) => {
  const { t } = useLanguage();
  
  return (
    <Card className="border-l-4 border-l-blue-500 bg-card/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Target className="h-4 w-4 text-blue-400" />
          {example.title}
        </CardTitle>
        <CardDescription className="text-xs">{example.context}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Matplotlib-style Chart */}
        <div className="bg-background/50 rounded-lg p-3 border border-border/30">
          <div className="flex items-center gap-1 mb-2">
            <BarChart3 className="h-3 w-3 text-blue-400" />
            <span className="text-xs font-semibold text-muted-foreground">Decision Comparison</span>
          </div>
          <DecisionChart example={example} />
        </div>

        {/* Prescriptive Inputs */}
        <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
          <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
            <Brain className="h-3 w-3 text-green-400" />
            {t('prescriptiveInputs')}
          </h4>
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead className="h-6">{t('action')}</TableHead>
                <TableHead className="h-6">{t('score')}</TableHead>
                <TableHead className="h-6">{t('riskReduction')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs">
              {example.prescriptiveInputs.recommendations.map((rec, idx) => (
                <TableRow key={idx} className={idx === 0 ? 'bg-green-500/10' : ''}>
                  <TableCell className="py-1">{rec.action}</TableCell>
                  <TableCell className="py-1 font-mono">{rec.score.toFixed(2)}</TableCell>
                  <TableCell className="py-1 font-mono text-green-400">{(rec.riskReduction * 100).toFixed(0)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Decision Output */}
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
          <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
            <Target className="h-3 w-3 text-blue-400" />
            {t('decisionOutput')}
          </h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-400" />
              <span className="font-medium">{example.decision.selectedAction}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-background/50 rounded p-2">
                <span className="text-muted-foreground">{t('executionCost')}:</span>
                <span className="ml-1 font-mono font-bold text-yellow-400">${example.decision.executionCost.toLocaleString()}</span>
              </div>
              <div className="bg-background/50 rounded p-2">
                <span className="text-muted-foreground">{t('budget')}:</span>
                <span className="ml-1 font-mono text-muted-foreground">${example.decision.budget.toLocaleString()}</span>
              </div>
              <div className="bg-background/50 rounded p-2">
                <span className="text-muted-foreground">{t('riskReduction')}:</span>
                <span className="ml-1 font-mono font-bold text-green-400">{(example.decision.expectedRiskReduction * 100).toFixed(0)}%</span>
              </div>
              <div className="bg-background/50 rounded p-2">
                <span className="text-muted-foreground">{t('timeline')}:</span>
                <span className="ml-1 font-mono text-cyan-400">{example.decision.timeline}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Interpretation */}
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Info className="h-3 w-3 text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">{example.interpretation}</p>
          </div>
          <div className="flex items-start gap-2">
            <Zap className="h-3 w-3 text-yellow-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-yellow-200/80">{example.tbmContext}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const FloatValueReferenceTable: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <Card className="bg-card/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          {t('floatValueReference')}
        </CardTitle>
        <CardDescription className="text-xs">{t('floatValueReferenceDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead className="h-8">{t('metric')}</TableHead>
              <TableHead className="h-8">{t('symbol')}</TableHead>
              <TableHead className="h-8">{t('range')}</TableHead>
              <TableHead className="h-8">{t('interpretation')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-xs">
            {FLOAT_VALUE_REFERENCES.map((ref, idx) => (
              <TableRow key={idx}>
                <TableCell className="py-1 font-medium">{ref.metric}</TableCell>
                <TableCell className="py-1 font-mono text-primary">{ref.symbol}</TableCell>
                <TableCell className="py-1 font-mono text-muted-foreground">{ref.range}</TableCell>
                <TableCell className="py-1 text-muted-foreground">{ref.interpretation}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default CausalExamplesPanel;
