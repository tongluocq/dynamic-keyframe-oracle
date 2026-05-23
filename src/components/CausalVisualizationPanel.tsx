/**
 * Causal Visualization Panel for IMSCHM
 * 
 * Provides 5 key visualizations:
 * 1. Causal Effect Change by Intervention (time series)
 * 2. Frame-level Causal Delta Distribution (histogram)
 * 3. Causal Signal Landscape (scatter: Effect Size vs Uncertainty)
 * 4. Causal DAG Relationships (node-edge graph)
 * 5. Counterfactual Sweep (Pressure Magnitude vs Causal Effect)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  Cell,
  ReferenceLine
} from 'recharts';
import {
  TrendingUp,
  BarChart3,
  CircleDot,
  GitBranch,
  Sliders,
  Play,
  Loader2
} from 'lucide-react';
import { InferenceResult } from '@/hooks/useEnhancedCVGG';
import { CausalRelation } from '@/types/industrial';

interface CausalVisualizationPanelProps {
  inferenceHistory: InferenceResult[];
  causalGraph: Map<string, CausalRelation[]>;
  onCounterfactualSweep?: (pressureValues: number[]) => Promise<{ pressure: number; effect: number }[]>;
}

interface CausalEffectTimePoint {
  sample: number;
  ATE: number;
  CATE: number;
  directEffect: number;
  indirectEffect: number;
  timestamp: number;
}

interface CausalDelta {
  bin: string;
  count: number;
  binStart: number;
  binEnd: number;
}

interface LandscapePoint {
  effectSize: number;
  uncertainty: number;
  label: string;
  type: 'ATE' | 'CATE' | 'direct' | 'indirect';
}

interface DAGNode {
  id: string;
  x: number;
  y: number;
  label: string;
  type: 'cause' | 'effect' | 'mediator' | 'confounder';
}

interface DAGEdge {
  from: string;
  to: string;
  strength: number;
  weight?: number;     // effect magnitude (do-calculus ATE proxy)
  confidence?: number; // 0..1 statistical confidence
  lag?: number;        // discovered temporal lag (samples)
  source?: 'inferred' | 'ideal';
}

const CausalVisualizationPanel: React.FC<CausalVisualizationPanelProps> = ({
  inferenceHistory,
  causalGraph,
  onCounterfactualSweep
}) => {
  const [activeTab, setActiveTab] = useState('timeseries');
  const [isRunningCounterfactual, setIsRunningCounterfactual] = useState(false);
  const [counterfactualResults, setCounterfactualResults] = useState<{ pressure: number; effect: number }[]>([]);
  const [pressureRange, setPressureRange] = useState<[number, number]>([0, 200]);

  // 1. Causal Effect Time Series Data
  const causalEffectTimeSeries = useMemo((): CausalEffectTimePoint[] => {
    return inferenceHistory.map((result, idx) => ({
      sample: idx + 1,
      ATE: result.causalEffects.ATE,
      CATE: result.causalEffects.CATE,
      directEffect: result.causalEffects.directEffect,
      indirectEffect: result.causalEffects.indirectEffect,
      timestamp: Date.now() - (inferenceHistory.length - idx) * 1000
    }));
  }, [inferenceHistory]);

  // 2. Frame-level Causal Delta Distribution
  const causalDeltaDistribution = useMemo((): CausalDelta[] => {
    if (inferenceHistory.length < 2) return [];

    const deltas: number[] = [];
    for (let i = 1; i < inferenceHistory.length; i++) {
      const prevATE = inferenceHistory[i - 1].causalEffects.ATE;
      const currATE = inferenceHistory[i].causalEffects.ATE;
      deltas.push(currATE - prevATE);
    }

    if (deltas.length === 0) return [];

    // Create histogram bins
    const minDelta = Math.min(...deltas);
    const maxDelta = Math.max(...deltas);
    const range = maxDelta - minDelta || 1;
    const numBins = Math.min(20, Math.max(5, Math.floor(Math.sqrt(deltas.length))));
    const binWidth = range / numBins;

    const bins: CausalDelta[] = [];
    for (let i = 0; i < numBins; i++) {
      const binStart = minDelta + i * binWidth;
      const binEnd = binStart + binWidth;
      const count = deltas.filter(d => d >= binStart && d < binEnd).length;
      bins.push({
        bin: `${binStart.toFixed(3)}`,
        count,
        binStart,
        binEnd
      });
    }

    return bins;
  }, [inferenceHistory]);

  // 3. Causal Signal Landscape (Effect Size vs Uncertainty)
  const causalLandscape = useMemo((): LandscapePoint[] => {
    if (inferenceHistory.length < 3) return [];

    // Calculate mean and std for each effect type
    const effects = {
      ATE: inferenceHistory.map(r => r.causalEffects.ATE),
      CATE: inferenceHistory.map(r => r.causalEffects.CATE),
      direct: inferenceHistory.map(r => r.causalEffects.directEffect),
      indirect: inferenceHistory.map(r => r.causalEffects.indirectEffect)
    };

    const calcStats = (arr: number[]) => {
      const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
      const variance = arr.reduce((acc, val) => acc + (val - mean) ** 2, 0) / arr.length;
      return { mean, std: Math.sqrt(variance) };
    };

    const points: LandscapePoint[] = [];

    // Add current window statistics
    const windowSize = Math.min(10, inferenceHistory.length);
    const recentEffects = {
      ATE: effects.ATE.slice(-windowSize),
      CATE: effects.CATE.slice(-windowSize),
      direct: effects.direct.slice(-windowSize),
      indirect: effects.indirect.slice(-windowSize)
    };

    Object.entries(recentEffects).forEach(([type, values]) => {
      const stats = calcStats(values);
      points.push({
        effectSize: Math.abs(stats.mean),
        uncertainty: stats.std,
        label: type.toUpperCase(),
        type: type as LandscapePoint['type']
      });
    });

    // Add individual sample points for scatter
    inferenceHistory.slice(-20).forEach((result, idx) => {
      // Calculate local uncertainty using rolling window
      const start = Math.max(0, idx - 2);
      const end = idx + 1;
      const localATEs = effects.ATE.slice(start, end);
      const localStd = localATEs.length > 1 
        ? Math.sqrt(localATEs.reduce((acc, val, _, arr) => 
            acc + (val - arr.reduce((a, b) => a + b, 0) / arr.length) ** 2, 0) / localATEs.length)
        : 0.01;

      points.push({
        effectSize: Math.abs(result.causalEffects.ATE),
        uncertainty: localStd,
        label: `Sample ${idx + 1}`,
        type: 'ATE'
      });
    });

    return points;
  }, [inferenceHistory]);

  // 4. DAG layout helper — positions nodes for a 400x320 viewBox with generous spacing
  const layoutDAG = (rawEdges: DAGEdge[], extraNodes: string[]): { nodes: DAGNode[]; edges: DAGEdge[] } => {
    const nodeSet = new Set<string>(extraNodes);
    rawEdges.forEach(e => { nodeSet.add(e.from); nodeSet.add(e.to); });
    const nodeArray = Array.from(nodeSet);

    const layers = new Map<string, number>();
    const inDegree = new Map<string, number>();
    nodeArray.forEach(n => inDegree.set(n, 0));
    rawEdges.forEach(e => inDegree.set(e.to, (inDegree.get(e.to) || 0) + 1));

    let currentLayer = 0;
    const remaining = new Set(nodeArray);
    const workingInDeg = new Map(inDegree);
    while (remaining.size > 0) {
      let layerNodes = Array.from(remaining).filter(n => (workingInDeg.get(n) || 0) === 0);
      if (layerNodes.length === 0) layerNodes = [remaining.values().next().value as string];
      layerNodes.forEach(n => {
        layers.set(n, currentLayer);
        remaining.delete(n);
        rawEdges.filter(e => e.from === n).forEach(e => {
          workingInDeg.set(e.to, (workingInDeg.get(e.to) || 1) - 1);
        });
      });
      currentLayer++;
    }

    const maxLayer = Math.max(currentLayer, 1);
    const nodesPerLayer = new Map<number, string[]>();
    layers.forEach((layer, node) => {
      if (!nodesPerLayer.has(layer)) nodesPerLayer.set(layer, []);
      nodesPerLayer.get(layer)!.push(node);
    });

    const W = 400, H = 320, padX = 50, padY = 30;
    const positioned: DAGNode[] = [];
    nodesPerLayer.forEach((layerNodes, layer) => {
      layerNodes.forEach((nodeId, idx) => {
        const total = layerNodes.length;
        const x = maxLayer === 1 ? W / 2 : padX + (layer / (maxLayer - 1)) * (W - 2 * padX);
        const y = padY + ((idx + 1) / (total + 1)) * (H - 2 * padY);
        positioned.push({
          id: nodeId, x, y,
          label: nodeId.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()),
          type: layer === 0 ? 'cause' : layer === maxLayer - 1 ? 'effect' : 'mediator',
        });
      });
    });
    return { nodes: positioned, edges: rawEdges };
  };

  // Inferred DAG from learned causal graph
  const dagData = useMemo(() => {
    const edges: DAGEdge[] = [];
    const nodeSet = new Set<string>();
    causalGraph.forEach((relations, source) => {
      nodeSet.add(source);
      relations.forEach(rel => {
        nodeSet.add(rel.effect);
        edges.push({ from: rel.cause, to: rel.effect, strength: rel.strength });
      });
    });
    return layoutDAG(edges, Array.from(nodeSet));
  }, [causalGraph]);

  // Ideal reference DAG — canonical cross-domain pathway projected onto the same nodes
  // Domain cascade: electrical → hydraulic → mechanical → thermal → cutting
  const idealDagData = useMemo(() => {
    const domainOrder = ['electrical', 'hydraulic', 'mechanical', 'thermal', 'cutting'];
    const nodesByDomain = new Map<string, string[]>();
    dagData.nodes.forEach(n => {
      const dom = n.id.split('_')[0];
      if (!nodesByDomain.has(dom)) nodesByDomain.set(dom, []);
      nodesByDomain.get(dom)!.push(n.id);
    });
    const edges: DAGEdge[] = [];
    for (let i = 0; i < domainOrder.length - 1; i++) {
      const up = nodesByDomain.get(domainOrder[i]) || [];
      const down = nodesByDomain.get(domainOrder[i + 1]) || [];
      up.forEach(u => down.forEach(d => edges.push({ from: u, to: d, strength: 0.9 })));
    }
    nodesByDomain.forEach(list => {
      for (let i = 0; i < list.length - 1; i++) edges.push({ from: list[i], to: list[i + 1], strength: 0.55 });
    });
    return layoutDAG(edges, dagData.nodes.map(n => n.id));
  }, [dagData]);

  // Structural agreement metrics between inferred and ideal DAGs (Jaccard)
  const dagAgreement = useMemo(() => {
    const norm = (e: DAGEdge) => `${e.from}->${e.to}`;
    const inferred = new Set(dagData.edges.map(norm));
    const ideal = new Set(idealDagData.edges.map(norm));
    let intersect = 0;
    inferred.forEach(e => { if (ideal.has(e)) intersect++; });
    const union = new Set([...inferred, ...ideal]).size || 1;
    const precision = inferred.size ? intersect / inferred.size : 0;
    const recall = ideal.size ? intersect / ideal.size : 0;
    return {
      jaccard: intersect / union,
      precision, recall,
      f1: precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0,
      intersect, inferredCount: inferred.size, idealCount: ideal.size,
    };
  }, [dagData, idealDagData]);

  // 5. Run Counterfactual Sweep
  const handleCounterfactualSweep = async () => {
    if (!onCounterfactualSweep) return;

    setIsRunningCounterfactual(true);
    try {
      const pressureValues = [];
      const numPoints = 20;
      for (let i = 0; i <= numPoints; i++) {
        pressureValues.push(pressureRange[0] + (pressureRange[1] - pressureRange[0]) * (i / numPoints));
      }
      const results = await onCounterfactualSweep(pressureValues);
      setCounterfactualResults(results);
    } catch (error) {
      console.error('Counterfactual sweep failed:', error);
    } finally {
      setIsRunningCounterfactual(false);
    }
  };

  const effectColors = {
    ATE: 'hsl(var(--primary))',
    CATE: 'hsl(var(--chart-2))',
    direct: 'hsl(var(--chart-3))',
    indirect: 'hsl(var(--chart-4))'
  };

  return (
    <Card className="border-2 border-primary/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Causal Effect Visualizations
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 text-xs">
            <TabsTrigger value="timeseries" className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span className="hidden sm:inline">Time Series</span>
            </TabsTrigger>
            <TabsTrigger value="distribution" className="flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              <span className="hidden sm:inline">Delta Dist.</span>
            </TabsTrigger>
            <TabsTrigger value="landscape" className="flex items-center gap-1">
              <CircleDot className="h-3 w-3" />
              <span className="hidden sm:inline">Landscape</span>
            </TabsTrigger>
            <TabsTrigger value="dag" className="flex items-center gap-1">
              <GitBranch className="h-3 w-3" />
              <span className="hidden sm:inline">DAG</span>
            </TabsTrigger>
            <TabsTrigger value="counterfactual" className="flex items-center gap-1">
              <Sliders className="h-3 w-3" />
              <span className="hidden sm:inline">Sweep</span>
            </TabsTrigger>
          </TabsList>

          {/* 1. Causal Effect Time Series */}
          <TabsContent value="timeseries" className="mt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Causal Effect Change by Intervention</h4>
                <Badge variant="outline">{causalEffectTimeSeries.length} samples</Badge>
              </div>
              {causalEffectTimeSeries.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={causalEffectTimeSeries}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="sample" 
                      label={{ value: 'Sample', position: 'insideBottom', offset: -5 }}
                      className="text-xs fill-muted-foreground"
                    />
                    <YAxis 
                      label={{ value: 'Effect Value', angle: -90, position: 'insideLeft' }}
                      className="text-xs fill-muted-foreground"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))' 
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="ATE" stroke={effectColors.ATE} strokeWidth={2} dot={false} name="ATE" />
                    <Line type="monotone" dataKey="CATE" stroke={effectColors.CATE} strokeWidth={2} dot={false} name="CATE" />
                    <Line type="monotone" dataKey="directEffect" stroke={effectColors.direct} strokeWidth={1.5} dot={false} name="Direct" />
                    <Line type="monotone" dataKey="indirectEffect" stroke={effectColors.indirect} strokeWidth={1.5} dot={false} name="Indirect" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Run inference to see causal effect time series
                </div>
              )}
            </div>
          </TabsContent>

          {/* 2. Frame-level Causal Delta Distribution */}
          <TabsContent value="distribution" className="mt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Frame-level Causal Delta Distribution</h4>
                <Badge variant="outline">{causalDeltaDistribution.length} bins</Badge>
              </div>
              {causalDeltaDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={causalDeltaDistribution}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="bin"
                      label={{ value: 'Delta (ΔATE)', position: 'insideBottom', offset: -5 }}
                      className="text-xs fill-muted-foreground"
                      tick={{ fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }}
                      className="text-xs fill-muted-foreground"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))' 
                      }}
                      formatter={(value: number) => [value, 'Count']}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <ReferenceLine x="0" stroke="hsl(var(--destructive))" strokeDasharray="5 5" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Need at least 2 inference results to compute deltas
                </div>
              )}
            </div>
          </TabsContent>

          {/* 3. Causal Signal Landscape */}
          <TabsContent value="landscape" className="mt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Causal Signal Landscape</h4>
                <Badge variant="outline">{causalLandscape.length} points</Badge>
              </div>
              {causalLandscape.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      type="number" 
                      dataKey="effectSize" 
                      name="Effect Size"
                      label={{ value: 'Effect Size', position: 'insideBottom', offset: -5 }}
                      className="text-xs fill-muted-foreground"
                    />
                    <YAxis 
                      type="number" 
                      dataKey="uncertainty" 
                      name="Uncertainty"
                      label={{ value: 'Uncertainty (std dev)', angle: -90, position: 'insideLeft' }}
                      className="text-xs fill-muted-foreground"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))' 
                      }}
                      formatter={(value: number) => value.toFixed(4)}
                    />
                    <Scatter data={causalLandscape} fill="hsl(var(--primary))">
                      {causalLandscape.map((point, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={effectColors[point.type] || 'hsl(var(--muted-foreground))'} 
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Need at least 3 inference results for landscape
                </div>
              )}
            </div>
          </TabsContent>

          {/* 4. Causal DAG Visualization — inferred vs ideal side-by-side */}
          <TabsContent value="dag" className="mt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="text-sm font-medium">Causal Relationships (DAG) — Inferred vs Ideal Reference</h4>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline">Inferred: {dagData.nodes.length}N / {dagData.edges.length}E</Badge>
                  <Badge variant="outline">Ideal: {idealDagData.nodes.length}N / {idealDagData.edges.length}E</Badge>
                  <Badge variant="secondary">
                    F1 {(dagAgreement.f1 * 100).toFixed(1)}% · J {(dagAgreement.jaccard * 100).toFixed(1)}%
                  </Badge>
                </div>
              </div>

              {dagData.nodes.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {([
                      { title: 'Inferred DAG (CVGG output)', data: dagData, stroke: 'hsl(var(--primary))', markerId: 'arrow-inferred' },
                      { title: 'Ideal DAG (domain ground-truth)', data: idealDagData, stroke: 'hsl(var(--chart-2))', markerId: 'arrow-ideal' },
                    ]).map(({ title, data, stroke, markerId }) => (
                      <div key={markerId} className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground">{title}</div>
                        <div className="relative h-[340px] border rounded-lg bg-muted/20 overflow-hidden">
                          <svg width="100%" height="100%" viewBox="0 0 400 320" preserveAspectRatio="xMidYMid meet">
                            <defs>
                              <marker id={markerId} markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill={stroke} />
                              </marker>
                            </defs>
                            {data.edges.map((edge, idx) => {
                              const fromNode = data.nodes.find(n => n.id === edge.from);
                              const toNode = data.nodes.find(n => n.id === edge.to);
                              if (!fromNode || !toNode) return null;
                              // Shorten line so arrow doesn't hide under circle (r=10)
                              const dx = toNode.x - fromNode.x;
                              const dy = toNode.y - fromNode.y;
                              const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                              const r = 12;
                              const x2 = toNode.x - (dx / dist) * r;
                              const y2 = toNode.y - (dy / dist) * r;
                              return (
                                <line
                                  key={`edge-${idx}`}
                                  x1={fromNode.x} y1={fromNode.y} x2={x2} y2={y2}
                                  stroke={stroke}
                                  strokeWidth={Math.max(1, edge.strength * 2.5)}
                                  strokeOpacity={0.55}
                                  markerEnd={`url(#${markerId})`}
                                />
                              );
                            })}
                            {data.nodes.map((node, idx) => (
                              <g key={`node-${idx}`}>
                                <circle
                                  cx={node.x} cy={node.y} r={10}
                                  fill={
                                    node.type === 'cause' ? 'hsl(var(--chart-1))' :
                                    node.type === 'effect' ? 'hsl(var(--chart-2))' :
                                    node.type === 'confounder' ? 'hsl(var(--chart-4))' :
                                    'hsl(var(--chart-3))'
                                  }
                                  stroke="hsl(var(--background))"
                                  strokeWidth={1.5}
                                />
                                <text
                                  x={node.x} y={node.y + 22}
                                  textAnchor="middle"
                                  fontSize={10}
                                  fill="hsl(var(--foreground))"
                                  className="select-none"
                                >
                                  {node.label.length > 16 ? node.label.substring(0, 14) + '…' : node.label}
                                </text>
                              </g>
                            ))}
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Comparison summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div className="border rounded p-2">
                      <div className="text-muted-foreground">Precision</div>
                      <div className="font-mono text-sm">{(dagAgreement.precision * 100).toFixed(1)}%</div>
                    </div>
                    <div className="border rounded p-2">
                      <div className="text-muted-foreground">Recall</div>
                      <div className="font-mono text-sm">{(dagAgreement.recall * 100).toFixed(1)}%</div>
                    </div>
                    <div className="border rounded p-2">
                      <div className="text-muted-foreground">F1</div>
                      <div className="font-mono text-sm">{(dagAgreement.f1 * 100).toFixed(1)}%</div>
                    </div>
                    <div className="border rounded p-2">
                      <div className="text-muted-foreground">Edges matched</div>
                      <div className="font-mono text-sm">{dagAgreement.intersect} / {dagAgreement.idealCount}</div>
                    </div>
                  </div>

                  <div className="flex gap-3 text-xs flex-wrap">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[hsl(var(--chart-1))]" /> Cause
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[hsl(var(--chart-3))]" /> Mediator
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[hsl(var(--chart-2))]" /> Effect
                    </span>
                    <span className="text-muted-foreground ml-auto">
                      Ideal pathway: electrical → hydraulic → mechanical → thermal → cutting
                    </span>
                  </div>
                </>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Causal structure not yet discovered. Run simulation longer.
                </div>
              )}
            </div>
          </TabsContent>


          {/* 5. Counterfactual Sweep */}
          <TabsContent value="counterfactual" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Counterfactual Sweep</h4>
                <Badge variant="outline">{counterfactualResults.length} points</Badge>
              </div>
              
              {/* Pressure Range Control */}
              <div className="space-y-2">
                <Label className="text-xs">Pressure Range (bar)</Label>
                <div className="flex items-center gap-4">
                  <span className="text-xs w-12">{pressureRange[0]}</span>
                  <Slider
                    value={pressureRange}
                    onValueChange={(v) => setPressureRange(v as [number, number])}
                    min={0}
                    max={300}
                    step={10}
                    className="flex-1"
                  />
                  <span className="text-xs w-12">{pressureRange[1]}</span>
                </div>
              </div>

              <Button 
                onClick={handleCounterfactualSweep} 
                disabled={isRunningCounterfactual || !onCounterfactualSweep}
                size="sm"
              >
                {isRunningCounterfactual ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Run Counterfactual Sweep
              </Button>

              {counterfactualResults.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={counterfactualResults}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="pressure" 
                      label={{ value: 'Pressure Magnitude (bar)', position: 'insideBottom', offset: -5 }}
                      className="text-xs fill-muted-foreground"
                    />
                    <YAxis 
                      label={{ value: 'Estimated Causal Effect', angle: -90, position: 'insideLeft' }}
                      className="text-xs fill-muted-foreground"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))' 
                      }}
                      formatter={(value: number) => [value.toFixed(4), 'Causal Effect']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="effect" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))', r: 3 }}
                    />
                    <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground border rounded-lg">
                  {onCounterfactualSweep 
                    ? 'Click "Run Counterfactual Sweep" to generate data'
                    : 'Counterfactual sweep requires Enhanced CVGG model'}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CausalVisualizationPanel;
