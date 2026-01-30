/**
 * Prescriptive AI & Decision Making Panel
 * 
 * IMSCHM-level component that displays AI-generated recommendations
 * based on CVGG causal estimates and system state analysis.
 * Now includes Simple DAG visualization for recommendation impact pathways.
 * Saves results to persistent storage.
 */

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Brain,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  Target,
  TrendingUp,
  Shield,
  Zap,
  Wrench,
  Thermometer,
  Droplets,
  Activity,
  Save,
} from 'lucide-react';
import { SystemState, CausalRelation, IndustrialDomain } from '@/types/industrial';
import { InferenceResult } from '@/hooks/useEnhancedCVGG';
import {
  getPrescriptiveAIEngine,
  PrescriptiveOutput,
  Recommendation,
  Priority,
  DecisionContext,
} from '@/utils/prescriptiveAI';
import SimpleDAG, { SimpleDAGNode, SimpleDAGEdge } from '@/components/SimpleDAG';
import { saveOperationResult } from '@/utils/resultsStorage';

interface PrescriptiveAIPanelProps {
  currentState: SystemState | null;
  anomalies: Array<{ sensor: string; anomaly_score: number; causal_pathway?: string }>;
  activeFailures: Array<{ id: string; name: string; severity: number; domain: string }>;
  causalGraph: Map<string, CausalRelation[]>;
  cvggResult: InferenceResult | null;
  inferenceHistory: InferenceResult[];
}

const priorityConfig: Record<Priority, { color: string; icon: React.ReactNode; label: string }> = {
  critical: {
    color: 'bg-red-500/20 text-red-400 border-red-500/50',
    icon: <AlertTriangle className="h-4 w-4" />,
    label: 'Critical',
  },
  high: {
    color: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
    icon: <Zap className="h-4 w-4" />,
    label: 'High',
  },
  medium: {
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    icon: <Clock className="h-4 w-4" />,
    label: 'Medium',
  },
  low: {
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    icon: <CheckCircle className="h-4 w-4" />,
    label: 'Low',
  },
};

const domainIcons: Record<IndustrialDomain, React.ReactNode> = {
  hydraulic: <Droplets className="h-4 w-4 text-blue-400" />,
  mechanical: <Wrench className="h-4 w-4 text-gray-400" />,
  thermal: <Thermometer className="h-4 w-4 text-red-400" />,
  electrical: <Zap className="h-4 w-4 text-yellow-400" />,
  cutting: <Activity className="h-4 w-4 text-green-400" />,
};

const riskColors: Record<string, string> = {
  low: 'text-green-400',
  moderate: 'text-yellow-400',
  high: 'text-orange-400',
  critical: 'text-red-400',
};

const PrescriptiveAIPanel: React.FC<PrescriptiveAIPanelProps> = ({
  currentState,
  anomalies,
  activeFailures,
  causalGraph,
  cvggResult,
  inferenceHistory,
}) => {
  const [expandedRecommendations, setExpandedRecommendations] = useState<Set<string>>(new Set());

  const prescriptiveOutput = useMemo((): PrescriptiveOutput => {
    const engine = getPrescriptiveAIEngine();
    const context: DecisionContext = {
      currentState,
      anomalies,
      activeFailures,
      causalGraph,
      cvggResult,
      inferenceHistory,
    };
    return engine.analyze(context);
  }, [currentState, anomalies, activeFailures, causalGraph, cvggResult, inferenceHistory]);

  // Save prescriptive output when it changes (debounced)
  useEffect(() => {
    if (prescriptiveOutput && prescriptiveOutput.recommendations.length > 0) {
      // Only save if there are meaningful recommendations
      const timer = setTimeout(() => {
        saveOperationResult('prescriptive', prescriptiveOutput, {
          modelMode: 'prescriptive',
          systemState: currentState ? {
            systemHealth: prescriptiveOutput.systemHealthScore,
          } : undefined,
        });
      }, 1000); // Debounce to avoid too many saves
      
      return () => clearTimeout(timer);
    }
  }, [prescriptiveOutput.recommendations.length, prescriptiveOutput.systemHealthScore]);

  const toggleRecommendation = (id: string) => {
    setExpandedRecommendations(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const { recommendations, systemHealthScore, riskLevel, summary, topPriority } = prescriptiveOutput;

  return (
    <div className="space-y-4">
      {/* Header Card with System Health */}
      <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <span>Prescriptive AI & Decision Support</span>
            </div>
            <Badge variant="outline" className={riskColors[riskLevel]}>
              Risk: {riskLevel.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* System Health Score */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">System Health</span>
                <span className="font-bold">{systemHealthScore.toFixed(0)}%</span>
              </div>
              <Progress 
                value={systemHealthScore} 
                className="h-2"
              />
            </div>

            {/* Summary */}
            <div className="md:col-span-2 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-400 shrink-0" />
              <span className="text-sm">{summary}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Priority Recommendation */}
      {topPriority && (
        <Card className={`border-2 ${topPriority.priority === 'critical' ? 'border-red-500/50 bg-red-500/5' : 'border-orange-500/30 bg-orange-500/5'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4" />
              Top Priority Action
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  {domainIcons[topPriority.domain]}
                  <span className="font-semibold">{topPriority.title}</span>
                  <Badge className={priorityConfig[topPriority.priority].color}>
                    {priorityConfig[topPriority.priority].icon}
                    <span className="ml-1">{priorityConfig[topPriority.priority].label}</span>
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{topPriority.description}</p>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {topPriority.timeToAction}
                  </span>
                  <span className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    {(topPriority.confidence * 100).toFixed(0)}% confidence
                  </span>
                </div>
              </div>
              <div className="text-right space-y-1">
                <div className="text-xs text-muted-foreground">Estimated Impact</div>
                <div className="flex items-center gap-1 text-sm">
                  <TrendingUp className="h-3 w-3 text-green-400" />
                  <span>-{(topPriority.estimatedImpact.riskReduction * 100).toFixed(0)}% risk</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Recommendations */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-base">
            <span>All Recommendations ({recommendations.length})</span>
            <div className="flex gap-2">
              {(['critical', 'high', 'medium', 'low'] as Priority[]).map(p => {
                const count = recommendations.filter(r => r.priority === p).length;
                if (count === 0) return null;
                return (
                  <Badge key={p} variant="outline" className={`text-xs ${priorityConfig[p].color}`}>
                    {count} {p}
                  </Badge>
                );
              })}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {recommendations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-400" />
                  <p>No recommendations at this time.</p>
                  <p className="text-sm">System is operating optimally.</p>
                </div>
              ) : (
                recommendations.map((rec) => (
                  <RecommendationCard
                    key={rec.id}
                    recommendation={rec}
                    isExpanded={expandedRecommendations.has(rec.id)}
                    onToggle={() => toggleRecommendation(rec.id)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

interface RecommendationCardProps {
  recommendation: Recommendation;
  isExpanded: boolean;
  onToggle: () => void;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  isExpanded,
  onToggle,
}) => {
  const config = priorityConfig[recommendation.priority];

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <div className={`border rounded-lg p-3 ${isExpanded ? 'bg-muted/30' : ''}`}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {domainIcons[recommendation.domain]}
              <span className="font-medium text-sm">{recommendation.title}</span>
              <Badge className={`text-xs ${config.color}`}>
                {config.label}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{recommendation.timeToAction}</span>
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="mt-3 pt-3 border-t space-y-3">
            <p className="text-sm text-muted-foreground">{recommendation.description}</p>

            {/* Simple DAG for Recommendation Impact */}
            <RecommendationDAG recommendation={recommendation} />

            {/* Causal Basis */}
            <div className="flex items-center gap-2 text-xs">
              <Brain className="h-3 w-3 text-primary" />
              <span className="text-muted-foreground">Causal Basis:</span>
              <code className="bg-muted px-1 rounded">{recommendation.causalBasis}</code>
            </div>

            {/* Suggested Actions */}
            <div className="space-y-1">
              <div className="text-xs font-medium">Suggested Actions:</div>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-0.5">
                {recommendation.suggestedActions.map((action, i) => (
                  <li key={i}>{action}</li>
                ))}
              </ul>
            </div>

            {/* Impact Metrics */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-muted/50 rounded p-2">
                <div className="text-xs text-muted-foreground">Risk Reduction</div>
                <div className="font-semibold text-green-400">
                  {(recommendation.estimatedImpact.riskReduction * 100).toFixed(0)}%
                </div>
              </div>
              <div className="bg-muted/50 rounded p-2">
                <div className="text-xs text-muted-foreground">Cost Saving</div>
                <div className="font-semibold text-blue-400">
                  {recommendation.estimatedImpact.costSaving.toFixed(0)}
                </div>
              </div>
              <div className="bg-muted/50 rounded p-2">
                <div className="text-xs text-muted-foreground">Downtime Avoided</div>
                <div className="font-semibold text-yellow-400">
                  {recommendation.estimatedImpact.downtimeAvoidance.toFixed(0)}h
                </div>
              </div>
            </div>

            {/* Related Sensors */}
            <div className="flex flex-wrap gap-1">
              {recommendation.relatedSensors.map((sensor) => (
                <Badge key={sensor} variant="outline" className="text-xs">
                  {sensor}
                </Badge>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

// Simple DAG component for recommendation impact visualization
const RecommendationDAG: React.FC<{ recommendation: Recommendation }> = ({ recommendation }) => {
  const dagData = useMemo(() => {
    const nodes: SimpleDAGNode[] = [];
    const edges: SimpleDAGEdge[] = [];

    // Action/intervention node
    nodes.push({
      id: 'action',
      label: recommendation.title.length > 15 ? recommendation.title.substring(0, 12) + '...' : recommendation.title,
      type: 'intervention',
      domain: recommendation.domain,
    });

    // Related sensors as primary effects
    recommendation.relatedSensors.slice(0, 2).forEach((sensor, idx) => {
      nodes.push({
        id: sensor,
        label: sensor.replace(/_/g, ' '),
        type: 'primary',
      });
      edges.push({
        from: 'action',
        to: sensor,
        strength: 0.7,
      });
    });

    // Impact metrics as secondary/outcome nodes
    nodes.push({
      id: 'risk',
      label: 'Risk',
      type: 'secondary',
      value: -recommendation.estimatedImpact.riskReduction,
    });
    
    nodes.push({
      id: 'outcome',
      label: 'System Health',
      type: 'outcome',
      value: recommendation.estimatedImpact.riskReduction,
    });

    // Connect sensors to risk
    recommendation.relatedSensors.slice(0, 2).forEach(sensor => {
      edges.push({
        from: sensor,
        to: 'risk',
        strength: 0.5,
      });
    });

    // Connect risk to outcome
    edges.push({
      from: 'risk',
      to: 'outcome',
      strength: 0.8,
    });

    return { nodes, edges };
  }, [recommendation]);

  return (
    <SimpleDAG
      nodes={dagData.nodes}
      edges={dagData.edges}
      title="Recommendation Impact Pathway"
      height={140}
      showLegend={false}
    />
  );
};

export default PrescriptiveAIPanel;
