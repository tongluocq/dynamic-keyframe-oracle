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
  ReferenceLine,
  ComposedChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  BarChart3,
  CircleDot,
  GitBranch,
  Sliders,
  Play,
  Loader2,
  Database,
  Lock,
  Hand
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { InferenceResult } from '@/hooks/useEnhancedCVGG';
import { CausalRelation } from '@/types/industrial';

export interface SweepPoint {
  pressure: number;
  effect: number;
  std: number;
  lower: number;
  upper: number;
}

export interface SweepMeta {
  timestamp: number;
  bufferLength: number;
  baselinePressure: number;
  systemTemp: number;
  isRunning: boolean;
  activeFailures: number;
  replicates: number;
}

interface CausalVisualizationPanelProps {
  inferenceHistory: InferenceResult[];
  causalGraph: Map<string, CausalRelation[]>;
  onCounterfactualSweep?: (
    pressureValues: number[],
    opts?: { replicates?: number }
  ) => Promise<{ points: SweepPoint[]; meta: SweepMeta }>;
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
  const [counterfactualResults, setCounterfactualResults] = useState<SweepPoint[]>([]);
  const [sweepMeta, setSweepMeta] = useState<SweepMeta | null>(null);
  const [pressureRange, setPressureRange] = useState<[number, number]>([0, 200]);
  const [replicates, setReplicates] = useState<number>(5);

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

  // 4. DAG layout helper — radial/star layout: hub = highest out-degree node, others on concentric rings by BFS distance
  const layoutDAG = (rawEdges: DAGEdge[], extraNodes: string[]): { nodes: DAGNode[]; edges: DAGEdge[] } => {
    const nodeSet = new Set<string>(extraNodes);
    rawEdges.forEach(e => { nodeSet.add(e.from); nodeSet.add(e.to); });
    const nodeArray = Array.from(nodeSet);

    // Pick hub: highest out-degree (most downstream effects); tiebreaker = lowest in-degree
    const outDeg = new Map<string, number>();
    const inDeg = new Map<string, number>();
    nodeArray.forEach(n => { outDeg.set(n, 0); inDeg.set(n, 0); });
    rawEdges.forEach(e => {
      outDeg.set(e.from, (outDeg.get(e.from) || 0) + 1);
      inDeg.set(e.to, (inDeg.get(e.to) || 0) + 1);
    });
    const hub = nodeArray.slice().sort((a, b) => {
      const oa = outDeg.get(a) || 0, ob = outDeg.get(b) || 0;
      if (ob !== oa) return ob - oa;
      return (inDeg.get(a) || 0) - (inDeg.get(b) || 0);
    })[0] || nodeArray[0];

    // BFS distance from hub on undirected adjacency → ring index
    const adj = new Map<string, Set<string>>();
    nodeArray.forEach(n => adj.set(n, new Set()));
    rawEdges.forEach(e => { adj.get(e.from)?.add(e.to); adj.get(e.to)?.add(e.from); });
    const dist = new Map<string, number>();
    dist.set(hub, 0);
    const queue: string[] = [hub];
    while (queue.length) {
      const n = queue.shift()!;
      adj.get(n)?.forEach(m => {
        if (!dist.has(m)) { dist.set(m, (dist.get(n) || 0) + 1); queue.push(m); }
      });
    }
    let maxRing = 0;
    dist.forEach(d => { if (d > maxRing) maxRing = d; });
    nodeArray.forEach(n => { if (!dist.has(n)) dist.set(n, maxRing + 1); });
    maxRing = Math.max(maxRing, 1);
    if (Array.from(dist.values()).some(d => d === maxRing + 1)) maxRing += 1;

    const rings = new Map<number, string[]>();
    dist.forEach((d, n) => {
      if (!rings.has(d)) rings.set(d, []);
      rings.get(d)!.push(n);
    });

    const W = 640, H = 460;
    const cx = W / 2, cy = H / 2;
    const rMax = Math.min(W, H) / 2 - 55;
    const positioned: DAGNode[] = [];

    rings.forEach((ringNodes, ringIdx) => {
      if (ringIdx === 0) {
        positioned.push({
          id: hub, x: cx, y: cy,
          label: hub.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()),
          type: 'cause',
        });
        return;
      }
      const r = (ringIdx / maxRing) * rMax;
      const count = ringNodes.length;
      const angleOffset = (ringIdx % 2) * (Math.PI / Math.max(count, 1));
      ringNodes.forEach((nodeId, idx) => {
        const angle = angleOffset + (idx / count) * 2 * Math.PI - Math.PI / 2;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        const isLeaf = (outDeg.get(nodeId) || 0) === 0;
        positioned.push({
          id: nodeId, x, y,
          label: nodeId.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()),
          type: isLeaf ? 'effect' : 'mediator',
        });
      });
    });

    return { nodes: positioned, edges: rawEdges };
  };

  // Inferred DAG from learned causal graph — carries weight/confidence/lag
  const dagData = useMemo(() => {
    const edges: DAGEdge[] = [];
    const nodeSet = new Set<string>();
    // Collect all strengths to derive a normalized confidence proxy
    const allStrengths: number[] = [];
    causalGraph.forEach(rels => rels.forEach(r => allStrengths.push(Math.abs(r.strength))));
    const maxS = Math.max(0.001, ...allStrengths);
    causalGraph.forEach((relations, source) => {
      nodeSet.add(source);
      relations.forEach(rel => {
        nodeSet.add(rel.effect);
        const w = Math.abs(rel.strength);
        edges.push({
          from: rel.cause,
          to: rel.effect,
          strength: rel.strength,
          weight: w,
          confidence: Math.min(1, w / maxS),
          lag: rel.lag,
          source: 'inferred',
        });
      });
    });
    return layoutDAG(edges, Array.from(nodeSet));
  }, [causalGraph]);

  // Ideal reference DAG — canonical cross-domain pathway projected onto the same nodes
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
      up.forEach(u => down.forEach(d => edges.push({
        from: u, to: d, strength: 0.9,
        weight: 0.9, confidence: 1.0, lag: 1, source: 'ideal',
      })));
    }
    nodesByDomain.forEach(list => {
      for (let i = 0; i < list.length - 1; i++) edges.push({
        from: list[i], to: list[i + 1], strength: 0.55,
        weight: 0.55, confidence: 1.0, lag: 0, source: 'ideal',
      });
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
                        <div className="relative h-[460px] border rounded-lg bg-muted/20 overflow-hidden">
                          <svg width="100%" height="100%" viewBox="0 0 640 460" preserveAspectRatio="xMidYMid meet">
                            <defs>
                              <marker id={markerId} markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill={stroke} />
                              </marker>
                            </defs>
                            {data.edges.map((edge, idx) => {
                              const fromNode = data.nodes.find(n => n.id === edge.from);
                              const toNode = data.nodes.find(n => n.id === edge.to);
                              if (!fromNode || !toNode) return null;
                              const dx = toNode.x - fromNode.x;
                              const dy = toNode.y - fromNode.y;
                              const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                              const r = 14;
                              const x1 = fromNode.x + (dx / dist) * r;
                              const y1 = fromNode.y + (dy / dist) * r;
                              const x2 = toNode.x - (dx / dist) * r;
                              const y2 = toNode.y - (dy / dist) * r;
                              const mx = (x1 + x2) / 2;
                              const my = (y1 + y2) / 2;
                              const w = edge.weight ?? edge.strength ?? 0;
                              const c = edge.confidence ?? 0.5;
                              const lag = edge.lag ?? 0;
                              // Width scales with weight, opacity with confidence, dashing for low-conf
                              const sw = Math.max(1, w * 4.5);
                              const op = 0.35 + c * 0.55;
                              const dash = c < 0.4 ? '4,3' : undefined;
                              const label = `w${w.toFixed(2)} · c${(c * 100).toFixed(0)}% · L${lag}`;
                              return (
                                <g key={`edge-${idx}`}>
                                  <title>{`${edge.from} → ${edge.to}\nweight=${w.toFixed(3)}  confidence=${(c*100).toFixed(1)}%  lag=${lag}`}</title>
                                  <line
                                    x1={x1} y1={y1} x2={x2} y2={y2}
                                    stroke={stroke}
                                    strokeWidth={sw}
                                    strokeOpacity={op}
                                    strokeDasharray={dash}
                                    markerEnd={`url(#${markerId})`}
                                  />
                                  <rect
                                    x={mx - 38} y={my - 7} width={76} height={12} rx={3}
                                    fill="hsl(var(--background))" fillOpacity={0.78}
                                    stroke={stroke} strokeOpacity={0.4} strokeWidth={0.5}
                                  />
                                  <text
                                    x={mx} y={my + 2}
                                    textAnchor="middle"
                                    fontSize={8.5}
                                    fill="hsl(var(--foreground))"
                                    className="select-none font-mono"
                                  >
                                    {label}
                                  </text>
                                </g>
                              );
                            })}
                            {data.nodes.map((node, idx) => (
                              <g key={`node-${idx}`}>
                                <circle
                                  cx={node.x} cy={node.y} r={14}
                                  fill={
                                    node.type === 'cause' ? 'hsl(var(--chart-1))' :
                                    node.type === 'effect' ? 'hsl(var(--chart-2))' :
                                    node.type === 'confounder' ? 'hsl(var(--chart-4))' :
                                    'hsl(var(--chart-3))'
                                  }
                                  stroke="hsl(var(--background))"
                                  strokeWidth={2}
                                />
                                <text
                                  x={node.x} y={node.y + 28}
                                  textAnchor="middle"
                                  fontSize={11}
                                  fontWeight={500}
                                  fill="hsl(var(--foreground))"
                                  className="select-none"
                                >
                                  {node.label.length > 18 ? node.label.substring(0, 16) + '…' : node.label}
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

                  <div className="flex gap-3 text-xs flex-wrap items-center">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[hsl(var(--chart-1))]" /> Cause
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[hsl(var(--chart-3))]" /> Mediator
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[hsl(var(--chart-2))]" /> Effect
                    </span>
                    <span className="text-muted-foreground border-l pl-3 ml-1">
                      Edge: <span className="font-mono">w</span> thickness = effect ·
                      <span className="font-mono"> c</span> opacity = confidence (dashed if &lt;40%) ·
                      <span className="font-mono"> L</span> = temporal lag
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
