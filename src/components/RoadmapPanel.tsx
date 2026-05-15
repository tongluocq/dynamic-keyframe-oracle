/**
 * Full Roadmap Panel
 * A comprehensive project roadmap displayed like a typical website/service status page.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2, Circle, AlertTriangle, Clock, Rocket,
  Target, Zap, Brain, Shield, Database, Globe, Cpu,
  ArrowRight, Calendar, TrendingUp, Layers, FileText, Code
} from 'lucide-react';

type RoadmapStatus = 'completed' | 'in_progress' | 'planned' | 'future';

interface RoadmapItem {
  title: string;
  description: string;
  status: RoadmapStatus;
  category: string;
  milestone?: string;
  dependencies?: string[];
}

interface MilestoneGroup {
  version: string;
  title: string;
  date: string;
  status: RoadmapStatus;
  progress: number;
  items: RoadmapItem[];
}

const MILESTONES: MilestoneGroup[] = [
  {
    version: 'v1.0',
    title: 'Core Simulation & Causal Discovery',
    date: 'Completed',
    status: 'completed',
    progress: 100,
    items: [
      { title: 'Physics-based 5-domain simulation', description: 'Hydraulic, Mechanical, Thermal, Electrical, Cutting sensor simulation grounded in engineering equations', status: 'completed', category: 'Core' },
      { title: 'PC Algorithm causal discovery', description: 'Constraint-based structure learning from observational data', status: 'completed', category: 'Causal' },
      { title: 'Granger Causality analysis', description: 'Time-series causal direction detection using temporal precedence', status: 'completed', category: 'Causal' },
      { title: 'Transfer Entropy estimation', description: 'Information-theoretic measure of directed information flow', status: 'completed', category: 'Causal' },
      { title: 'Failure injection engine', description: '8 fault modes across all industrial domains with severity control', status: 'completed', category: 'Core' },
      { title: 'Real-time monitoring dashboard', description: 'Live sensor data display with anomaly detection alerts', status: 'completed', category: 'UI' },
    ],
  },
  {
    version: 'v1.5',
    title: 'CVGG Neural Causal Engine',
    date: 'Completed',
    status: 'completed',
    progress: 100,
    items: [
      { title: 'Dual VGG backbone architecture', description: 'Rock image + signal scalogram dual-path feature extraction', status: 'completed', category: 'Model' },
      { title: 'DAG-constrained loss function', description: 'L_class + L_causal + λ·|ATE-(DE+IE)|² consistency constraint', status: 'completed', category: 'Model' },
      { title: 'ATE/CATE/DE/IE estimation', description: 'Full causal effect decomposition from neural inference', status: 'completed', category: 'Causal' },
      { title: 'In-browser TensorFlow.js training', description: 'Client-side model training without server dependency', status: 'completed', category: 'Model' },
      { title: 'Causal metadata encoder', description: 'Treatment/Confounder/IV encoding for causal identification', status: 'completed', category: 'Model' },
    ],
  },
  {
    version: 'v2.0',
    title: 'Causal Reasoning & Decision Support',
    date: 'Completed',
    status: 'completed',
    progress: 100,
    items: [
      { title: 'do-calculus intervention engine', description: "Pearl's do(X=x) operator with causal coefficient propagation", status: 'completed', category: 'Causal' },
      { title: 'SCM-based counterfactual engine', description: 'What-if scenario analysis using structural causal models', status: 'completed', category: 'Causal' },
      { title: 'Prescriptive AI recommendations', description: 'Ranked maintenance actions with cost-benefit analysis', status: 'completed', category: 'AI' },
      { title: 'Graph RAG knowledge store', description: 'Neo4j/GraphML/JSON-LD exportable causal knowledge graph', status: 'completed', category: 'Data' },
      { title: '8 specialized report generators', description: 'Academic, thesis, EDA, comparison, and technical reports', status: 'completed', category: 'Docs' },
      { title: 'Multi-language support', description: 'English, Japanese, Chinese, Spanish UI localization', status: 'completed', category: 'UI' },
      { title: 'Session history & results export', description: 'Persistent operation logging with JSON/CSV/Markdown export', status: 'completed', category: 'Data' },
    ],
  },
  {
    version: 'v2.5',
    title: 'Trust, Verification & Self-Diagnostics',
    date: 'Current',
    status: 'in_progress',
    progress: 70,
    items: [
      { title: '6-test verification suite', description: 'Statistical validation: non-trivial discovery, noise realism, confounder detection', status: 'completed', category: 'Trust' },
      { title: 'Dynamic trust scoring', description: 'Live trust metrics updated from pipeline execution and diagnostics', status: 'completed', category: 'Trust' },
      { title: 'Self-closure error diagnostics', description: 'Automatic error logging with solution suggestions — no silent failures', status: 'completed', category: 'Trust' },
      { title: 'NaN/Infinity safety guards', description: 'All computation paths protected with isValidNum checks and fallback values', status: 'completed', category: 'Trust' },
      { title: 'CWRU benchmark alignment', description: 'Vibration RMS values validated against Case Western Reserve bearing data', status: 'in_progress', category: 'Trust', dependencies: ['Real CWRU dataset loader'] },
      { title: 'Comprehensive roadmap panel', description: 'Full project status page with milestones, progress, and gap analysis', status: 'completed', category: 'UI' },
    ],
  },
  {
    version: 'v3.0',
    title: 'Real-World Data Integration & Knowledge Graph',
    date: 'Q3 2026',
    status: 'in_progress',
    progress: 25,
    items: [
      { title: 'Hybrid Knowledge Graph (FMEA × Causal)', description: 'Dual-view KG panel: traditional industrial FMEA workflow side-by-side with CVGG/PC/Granger causal pathway, with linked cross-highlighting between equipment-component-failure-action nodes and causal variables', status: 'completed', category: 'Causal' },
      { title: 'CWRU Bearing dataset loader', description: 'Direct import of Case Western Reserve University bearing fault data', status: 'planned', category: 'Data', dependencies: ['File parser for .mat format'] },
      { title: 'NASA IMS dataset support', description: 'Prognostics Center of Excellence bearing run-to-failure data', status: 'planned', category: 'Data' },
      { title: 'FEMTO bearing dataset', description: 'PRONOSTIA platform accelerated degradation test data', status: 'planned', category: 'Data' },
      { title: 'CSV/Parquet data import', description: 'Generic industrial sensor data import with column mapping', status: 'planned', category: 'Data' },
      { title: 'Multi-run averaging', description: 'Statistical stability via repeated execution with averaged results', status: 'planned', category: 'Model' },
    ],
  },
  {
    version: 'v3.5',
    title: 'Advanced AI & Architecture',
    date: 'Q4 2026',
    status: 'future',
    progress: 0,
    items: [
      { title: 'Vision Transformer (ViT) backbone', description: 'Replace VGG with ViT for multi-modal feature extraction with attention', status: 'future', category: 'Model' },
      { title: 'Bayesian uncertainty quantification', description: 'Confidence intervals and uncertainty bands on all causal estimates', status: 'future', category: 'Model' },
      { title: 'GPU-accelerated WebGPU training', description: 'Leverage WebGPU API for 10-50x training speedup in browser', status: 'future', category: 'Infra' },
      { title: 'Causal Reinforcement Learning', description: 'Evolve prescriptive AI toward model-based causal RL policies', status: 'future', category: 'AI' },
      { title: 'Automated hyperparameter tuning', description: 'Bayesian optimization for learning rate, architecture search', status: 'future', category: 'Model' },
    ],
  },
  {
    version: 'v4.0',
    title: 'Deployment & Enterprise',
    date: '2027',
    status: 'future',
    progress: 0,
    items: [
      { title: 'Cloud backend (Lovable Cloud)', description: 'Persistent database, user auth, and collaborative sessions', status: 'future', category: 'Infra' },
      { title: 'Edge deployment (TF Lite / ONNX)', description: 'Lightweight inference models for PLC/SCADA integration', status: 'future', category: 'Infra' },
      { title: 'Real-time sensor API gateway', description: 'MQTT/OPC-UA industrial protocol support', status: 'future', category: 'Infra' },
      { title: 'Federated learning for multi-site', description: 'Privacy-preserving model training across distributed facilities', status: 'future', category: 'AI' },
      { title: 'Formal certification (ISO/IEC)', description: 'Safety-critical system standards compliance documentation', status: 'future', category: 'Compliance' },
      { title: 'Domain adaptation / transfer learning', description: 'Train on one equipment type, deploy on another with minimal data', status: 'future', category: 'AI' },
    ],
  },
];

const statusConfig: Record<RoadmapStatus, { icon: React.ReactNode; label: string; color: string }> = {
  completed: { icon: <CheckCircle2 className="h-4 w-4" />, label: 'Completed', color: 'text-green-500 bg-green-500/10 border-green-500/30' },
  in_progress: { icon: <Clock className="h-4 w-4" />, label: 'In Progress', color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30' },
  planned: { icon: <Target className="h-4 w-4" />, label: 'Planned', color: 'text-blue-500 bg-blue-500/10 border-blue-500/30' },
  future: { icon: <Circle className="h-4 w-4" />, label: 'Future', color: 'text-muted-foreground bg-muted/20 border-muted/40' },
};

const categoryIcons: Record<string, React.ReactNode> = {
  Core: <Zap className="h-3 w-3" />,
  Causal: <Brain className="h-3 w-3" />,
  Model: <Cpu className="h-3 w-3" />,
  UI: <Layers className="h-3 w-3" />,
  Data: <Database className="h-3 w-3" />,
  Trust: <Shield className="h-3 w-3" />,
  AI: <Brain className="h-3 w-3" />,
  Docs: <FileText className="h-3 w-3" />,
  Infra: <Globe className="h-3 w-3" />,
  Compliance: <Shield className="h-3 w-3" />,
};

const RoadmapPanel: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('timeline');

  const totalItems = MILESTONES.flatMap(m => m.items).length;
  const completedItems = MILESTONES.flatMap(m => m.items).filter(i => i.status === 'completed').length;
  const inProgressItems = MILESTONES.flatMap(m => m.items).filter(i => i.status === 'in_progress').length;
  const overallProgress = Math.round((completedItems / totalItems) * 100);

  // Category breakdown
  const categories = Array.from(new Set(MILESTONES.flatMap(m => m.items.map(i => i.category))));
  const categoryStats = categories.map(cat => {
    const items = MILESTONES.flatMap(m => m.items).filter(i => i.category === cat);
    const done = items.filter(i => i.status === 'completed').length;
    return { category: cat, total: items.length, done, pct: Math.round((done / items.length) * 100) };
  });

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-background to-muted/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Rocket className="h-5 w-5 text-primary" />
              IMSCHM Project Roadmap
              <Badge variant="outline" className="ml-2 text-xs">v2.5 Current</Badge>
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Development milestones, progress tracking, and feature gap analysis
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{overallProgress}%</div>
            <div className="text-xs text-muted-foreground">{completedItems}/{totalItems} features</div>
          </div>
        </div>
        <Progress value={overallProgress} className="h-2 mt-2" />
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Completed', count: completedItems, color: 'text-green-500', bg: 'bg-green-500/10 border-green-500/30' },
            { label: 'In Progress', count: inProgressItems, color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/30' },
            { label: 'Planned', count: MILESTONES.flatMap(m => m.items).filter(i => i.status === 'planned').length, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/30' },
            { label: 'Future', count: MILESTONES.flatMap(m => m.items).filter(i => i.status === 'future').length, color: 'text-muted-foreground', bg: 'bg-muted/20 border-muted/40' },
          ].map((s, i) => (
            <div key={i} className={`rounded-lg p-3 text-center border ${s.bg}`}>
              <div className={`text-2xl font-bold ${s.color}`}>{s.count}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="timeline" className="text-xs">
              <Calendar className="h-3 w-3 mr-1" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="categories" className="text-xs">
              <Layers className="h-3 w-3 mr-1" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="gaps" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Gaps & Dependencies
            </TabsTrigger>
          </TabsList>

          {/* Timeline View */}
          <TabsContent value="timeline">
            <ScrollArea className="h-[500px]">
              <div className="space-y-6 pr-3">
                {MILESTONES.map((milestone, mIdx) => (
                  <div key={mIdx} className="relative">
                    {/* Timeline connector */}
                    {mIdx < MILESTONES.length - 1 && (
                      <div className="absolute left-4 top-12 bottom-0 w-0.5 bg-border" />
                    )}
                    
                    {/* Milestone header */}
                    <div className={`flex items-center gap-3 mb-3 p-3 rounded-lg border ${statusConfig[milestone.status].color}`}>
                      <div className="shrink-0">{statusConfig[milestone.status].icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{milestone.version}</span>
                          <span className="text-sm">{milestone.title}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground">{milestone.date}</span>
                          <Progress value={milestone.progress} className="h-1.5 flex-1 max-w-32" />
                          <span className="text-xs font-medium">{milestone.progress}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="ml-8 space-y-2">
                      {milestone.items.map((item, iIdx) => (
                        <div
                          key={iIdx}
                          className="flex items-start gap-3 p-2 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
                        >
                          <div className="mt-0.5 shrink-0">
                            {item.status === 'completed' ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : item.status === 'in_progress' ? (
                              <Clock className="h-4 w-4 text-yellow-500" />
                            ) : item.status === 'planned' ? (
                              <Target className="h-4 w-4 text-blue-500" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium">{item.title}</span>
                              <Badge variant="outline" className="text-[10px] h-4 px-1">
                                {categoryIcons[item.category]}
                                <span className="ml-1">{item.category}</span>
                              </Badge>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{item.description}</p>
                            {item.dependencies && (
                              <div className="flex items-center gap-1 mt-1">
                                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                <span className="text-[10px] text-muted-foreground italic">
                                  Depends on: {item.dependencies.join(', ')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Categories View */}
          <TabsContent value="categories">
            <ScrollArea className="h-[500px]">
              <div className="space-y-4 pr-3">
                {categoryStats.sort((a, b) => b.pct - a.pct).map((cat, idx) => (
                  <div key={idx} className="border rounded-lg p-3 bg-muted/20">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {categoryIcons[cat.category] || <Code className="h-3 w-3" />}
                        <span className="text-sm font-medium">{cat.category}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{cat.done}/{cat.total} ({cat.pct}%)</span>
                    </div>
                    <Progress value={cat.pct} className="h-1.5 mb-2" />
                    <div className="space-y-1">
                      {MILESTONES.flatMap(m => m.items)
                        .filter(i => i.category === cat.category)
                        .map((item, iIdx) => (
                          <div key={iIdx} className="flex items-center gap-2 text-[10px]">
                            {item.status === 'completed' ? (
                              <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                            ) : item.status === 'in_progress' ? (
                              <Clock className="h-3 w-3 text-yellow-500 shrink-0" />
                            ) : (
                              <Circle className="h-3 w-3 text-muted-foreground shrink-0" />
                            )}
                            <span className={item.status === 'completed' ? '' : 'text-muted-foreground'}>
                              {item.title}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Gaps & Dependencies */}
          <TabsContent value="gaps">
            <ScrollArea className="h-[500px]">
              <div className="space-y-4 pr-3">
                {/* Key Gaps */}
                <div className="border rounded-lg p-4 bg-destructive/5 border-destructive/20">
                  <h4 className="text-sm font-semibold flex items-center gap-2 text-destructive mb-3">
                    <AlertTriangle className="h-4 w-4" />
                    Key Gaps — What's Missing for Production
                  </h4>
                  <div className="space-y-2">
                    {[
                      { gap: 'Real-world dataset validation', impact: 'Critical', desc: 'Currently physics-simulated only; CWRU/NASA/FEMTO benchmarks needed to prove generalization' },
                      { gap: 'Persistent backend', impact: 'High', desc: 'All data lives in browser memory/localStorage; need Cloud for multi-session persistence' },
                      { gap: 'Uncertainty quantification', impact: 'High', desc: 'Point estimates only; Bayesian confidence intervals needed for safety-critical decisions' },
                      { gap: 'Industrial protocol support', impact: 'Medium', desc: 'No MQTT/OPC-UA gateway; cannot connect to live PLC/SCADA systems' },
                      { gap: 'Model versioning & A/B testing', impact: 'Medium', desc: 'No model registry; each session trains fresh; cannot compare model versions' },
                      { gap: 'Formal safety certification', impact: 'Low (current)', desc: 'ISO 13849 / IEC 62443 compliance not yet documented' },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3 bg-background/50 rounded p-2">
                        <Badge variant="outline" className={`text-[10px] shrink-0 mt-0.5 ${
                          item.impact === 'Critical' ? 'border-destructive text-destructive' :
                          item.impact === 'High' ? 'border-yellow-500 text-yellow-500' :
                          'border-muted-foreground text-muted-foreground'
                        }`}>
                          {item.impact}
                        </Badge>
                        <div>
                          <div className="text-xs font-medium">{item.gap}</div>
                          <div className="text-[10px] text-muted-foreground">{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dependency Graph */}
                <div className="border rounded-lg p-4 bg-muted/20">
                  <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Feature Dependencies
                  </h4>
                  <div className="space-y-2 font-mono text-[10px]">
                    {[
                      'CWRU Data Loader → Benchmark Validation → Trust Score Upgrade',
                      'WebGPU Support → GPU Training → Large Model Support → ViT Backbone',
                      'Cloud Backend → User Auth → Session Persistence → Collaboration',
                      'MQTT Gateway → Live Sensor Feed → Real-time Inference → Edge Deployment',
                      'Bayesian UQ → Confidence Intervals → Safety Certification',
                    ].map((chain, idx) => (
                      <div key={idx} className="flex items-center gap-1 bg-background/50 rounded p-2">
                        {chain.split(' → ').map((step, sIdx, arr) => (
                          <React.Fragment key={sIdx}>
                            <span className={sIdx === 0 ? 'text-primary' : sIdx === arr.length - 1 ? 'text-green-500' : 'text-muted-foreground'}>
                              {step}
                            </span>
                            {sIdx < arr.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />}
                          </React.Fragment>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Accomplishments highlight */}
                <div className="border rounded-lg p-4 bg-green-500/5 border-green-500/20">
                  <h4 className="text-sm font-semibold flex items-center gap-2 text-green-500 mb-3">
                    <CheckCircle2 className="h-4 w-4" />
                    Key Accomplishments
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      'Full Pearl Hierarchy (L1-L3)',
                      'Browser-native deep learning',
                      'Physics-grounded simulation',
                      'Self-diagnosing error system',
                      'Multi-format knowledge export',
                      'Prescriptive decision support',
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-[10px] bg-background/50 rounded px-2 py-1">
                        <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default RoadmapPanel;
