/**
 * Knowledge Graph Panel — Dual View
 *
 * Left:  Traditional industrial workflow KG (FMEA-style)
 *        Equipment → Subsystem → Component → Failure Mode → Maintenance Action
 * Right: Causality-derived KG
 *        Variables and edges discovered by CVGG / PC / Granger / Transfer Entropy,
 *        weighted by ATE / correlation strength.
 *
 * Linked highlighting: selecting a node on either side highlights its causal
 * cross-references on the other side, so engineers can read traditional FMEA
 * structure side-by-side with the data-driven causal pathway.
 */

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Network, Workflow, GitBranch, Info } from 'lucide-react';
import { CausalRelation } from '@/types/industrial';

// ============= Industrial FMEA Workflow Graph (TBM domain knowledge) =============

type FmeaTier = 'equipment' | 'subsystem' | 'component' | 'failure' | 'action';

interface FmeaNode {
  id: string;
  label: string;
  tier: FmeaTier;
  /** Variables in the causal graph this node maps to (for cross-highlighting). */
  causalRefs: string[];
}

interface FmeaEdge {
  from: string;
  to: string;
}

const FMEA_NODES: FmeaNode[] = [
  // Equipment
  { id: 'tbm', label: 'TBM Machine', tier: 'equipment', causalRefs: [] },

  // Subsystems
  { id: 'sub_hyd',  label: 'Hydraulic',  tier: 'subsystem', causalRefs: ['hydraulic_pressure', 'hydraulic_flow', 'hydraulic_temperature'] },
  { id: 'sub_mech', label: 'Mechanical', tier: 'subsystem', causalRefs: ['mechanical_vibration_x', 'mechanical_torque', 'mechanical_speed', 'mechanical_wear_level'] },
  { id: 'sub_thrm', label: 'Thermal',    tier: 'subsystem', causalRefs: ['thermal_system_temp', 'thermal_gradient'] },
  { id: 'sub_elec', label: 'Electrical', tier: 'subsystem', causalRefs: ['electrical_voltage', 'electrical_current', 'electrical_power'] },
  { id: 'sub_cut',  label: 'Cutting',    tier: 'subsystem', causalRefs: ['cutting_tool_wear', 'cutting_force'] },

  // Components
  { id: 'cmp_pump',     label: 'Hyd. Pump',     tier: 'component', causalRefs: ['hydraulic_pressure', 'hydraulic_flow'] },
  { id: 'cmp_bearing',  label: 'Main Bearing',  tier: 'component', causalRefs: ['mechanical_vibration_x', 'mechanical_wear_level', 'thermal_system_temp'] },
  { id: 'cmp_motor',    label: 'Drive Motor',   tier: 'component', causalRefs: ['electrical_current', 'electrical_power', 'mechanical_torque'] },
  { id: 'cmp_cutter',   label: 'Cutter Head',   tier: 'component', causalRefs: ['cutting_force', 'cutting_tool_wear', 'mechanical_torque'] },
  { id: 'cmp_seal',     label: 'Hyd. Seal',     tier: 'component', causalRefs: ['hydraulic_pressure', 'hydraulic_temperature'] },

  // Failure modes
  { id: 'fm_leak',      label: 'Hyd. Leak',         tier: 'failure', causalRefs: ['hydraulic_pressure', 'hydraulic_flow'] },
  { id: 'fm_wear',      label: 'Bearing Wear',      tier: 'failure', causalRefs: ['mechanical_vibration_x', 'mechanical_wear_level'] },
  { id: 'fm_overheat',  label: 'Thermal Overload',  tier: 'failure', causalRefs: ['thermal_system_temp', 'thermal_gradient'] },
  { id: 'fm_overcur',   label: 'Overcurrent',       tier: 'failure', causalRefs: ['electrical_current', 'electrical_power'] },
  { id: 'fm_dull',      label: 'Cutter Dulling',    tier: 'failure', causalRefs: ['cutting_tool_wear', 'cutting_force'] },

  // Maintenance actions
  { id: 'act_reseal',    label: 'Reseal / Refill',     tier: 'action', causalRefs: ['hydraulic_pressure'] },
  { id: 'act_lubricate', label: 'Lubricate Bearing',   tier: 'action', causalRefs: ['mechanical_wear_level', 'thermal_system_temp'] },
  { id: 'act_cooldown',  label: 'Reduce Load / Cool',  tier: 'action', causalRefs: ['thermal_system_temp', 'mechanical_torque'] },
  { id: 'act_protect',   label: 'Trip Protection',     tier: 'action', causalRefs: ['electrical_current'] },
  { id: 'act_replace',   label: 'Replace Cutter',      tier: 'action', causalRefs: ['cutting_tool_wear'] },
];

const FMEA_EDGES: FmeaEdge[] = [
  // Equipment -> Subsystem
  ...['sub_hyd','sub_mech','sub_thrm','sub_elec','sub_cut'].map(s => ({ from: 'tbm', to: s })),
  // Subsystem -> Component
  { from: 'sub_hyd', to: 'cmp_pump' },  { from: 'sub_hyd', to: 'cmp_seal' },
  { from: 'sub_mech', to: 'cmp_bearing' },
  { from: 'sub_elec', to: 'cmp_motor' },
  { from: 'sub_cut',  to: 'cmp_cutter' },
  { from: 'sub_thrm', to: 'cmp_bearing' },
  { from: 'sub_mech', to: 'cmp_motor' },
  { from: 'sub_mech', to: 'cmp_cutter' },
  // Component -> Failure
  { from: 'cmp_pump', to: 'fm_leak' }, { from: 'cmp_seal', to: 'fm_leak' },
  { from: 'cmp_bearing', to: 'fm_wear' }, { from: 'cmp_bearing', to: 'fm_overheat' },
  { from: 'cmp_motor', to: 'fm_overcur' }, { from: 'cmp_motor', to: 'fm_overheat' },
  { from: 'cmp_cutter', to: 'fm_dull' },
  // Failure -> Action
  { from: 'fm_leak', to: 'act_reseal' },
  { from: 'fm_wear', to: 'act_lubricate' },
  { from: 'fm_overheat', to: 'act_cooldown' },
  { from: 'fm_overcur', to: 'act_protect' },
  { from: 'fm_dull', to: 'act_replace' },
];

const TIER_ORDER: FmeaTier[] = ['equipment', 'subsystem', 'component', 'failure', 'action'];
const TIER_LABEL: Record<FmeaTier, string> = {
  equipment: 'Equipment',
  subsystem: 'Subsystem',
  component: 'Component',
  failure: 'Failure Mode',
  action: 'Maintenance Action',
};
const TIER_COLOR: Record<FmeaTier, string> = {
  equipment: 'hsl(var(--primary))',
  subsystem: 'hsl(var(--chart-1))',
  component: 'hsl(var(--chart-2))',
  failure: 'hsl(var(--destructive))',
  action: 'hsl(var(--chart-4))',
};

// ============= Props =============

interface KnowledgeGraphPanelProps {
  /** Optional live causal graph from IndustrialMonitor (PC/Granger/TE consensus). */
  causalGraph?: Map<string, CausalRelation[]>;
}

// ============= Layout helpers =============

interface Pt { x: number; y: number; }

function layoutFmea(width: number, height: number): Map<string, Pt> {
  const positions = new Map<string, Pt>();
  const padX = 60, padY = 30;
  const usableW = width - 2 * padX;
  const usableH = height - 2 * padY;
  TIER_ORDER.forEach((tier, ti) => {
    const tierNodes = FMEA_NODES.filter(n => n.tier === tier);
    const x = padX + (TIER_ORDER.length === 1 ? usableW / 2 : (ti / (TIER_ORDER.length - 1)) * usableW);
    tierNodes.forEach((n, ni) => {
      const y = padY + ((ni + 1) / (tierNodes.length + 1)) * usableH;
      positions.set(n.id, { x, y });
    });
  });
  return positions;
}

function layoutCausal(
  variables: string[],
  width: number,
  height: number
): Map<string, Pt> {
  const positions = new Map<string, Pt>();
  if (variables.length === 0) return positions;
  // Group by domain prefix (substring before first underscore)
  const groups = new Map<string, string[]>();
  variables.forEach(v => {
    const dom = v.split('_')[0] || 'misc';
    if (!groups.has(dom)) groups.set(dom, []);
    groups.get(dom)!.push(v);
  });
  const domainList = Array.from(groups.keys());
  const padX = 60, padY = 30;
  const usableW = width - 2 * padX;
  const usableH = height - 2 * padY;
  domainList.forEach((dom, di) => {
    const list = groups.get(dom)!;
    const x = padX + (domainList.length === 1 ? usableW / 2 : (di / Math.max(1, domainList.length - 1)) * usableW);
    list.forEach((v, vi) => {
      const y = padY + ((vi + 1) / (list.length + 1)) * usableH;
      positions.set(v, { x, y });
    });
  });
  return positions;
}

// ============= Component =============

const KnowledgeGraphPanel: React.FC<KnowledgeGraphPanelProps> = ({ causalGraph }) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<'dual' | 'fmea' | 'causal'>('dual');

  // Aggregate causal nodes/edges from passed graph (or fall back to FMEA refs)
  const { causalVars, causalEdges, isLive } = useMemo(() => {
    const edges: Array<{ from: string; to: string; w: number; src: string }> = [];
    const vars = new Set<string>();
    if (causalGraph && causalGraph.size > 0) {
      causalGraph.forEach((rels, src) => {
        vars.add(src);
        rels.forEach(r => {
          vars.add(r.effect);
          edges.push({ from: r.cause, to: r.effect, w: r.strength, src: 'live' });
        });
      });
      return { causalVars: Array.from(vars), causalEdges: edges, isLive: true };
    }
    // Fallback: build a representative TBM causal skeleton from FMEA refs
    FMEA_NODES.forEach(n => n.causalRefs.forEach(v => vars.add(v)));
    const fallbackPairs: Array<[string, string, number]> = [
      ['hydraulic_pressure', 'hydraulic_flow', 0.78],
      ['hydraulic_flow', 'cutting_force', 0.55],
      ['mechanical_torque', 'mechanical_wear_level', 0.62],
      ['mechanical_wear_level', 'mechanical_vibration_x', 0.71],
      ['mechanical_vibration_x', 'thermal_system_temp', 0.48],
      ['thermal_system_temp', 'thermal_gradient', 0.66],
      ['electrical_current', 'electrical_power', 0.83],
      ['electrical_power', 'mechanical_torque', 0.59],
      ['cutting_force', 'cutting_tool_wear', 0.74],
      ['cutting_tool_wear', 'mechanical_torque', 0.41],
      ['thermal_system_temp', 'mechanical_wear_level', 0.37],
    ];
    fallbackPairs.forEach(([a, b, w]) => {
      vars.add(a); vars.add(b);
      edges.push({ from: a, to: b, w, src: 'domain' });
    });
    return { causalVars: Array.from(vars), causalEdges: edges, isLive: false };
  }, [causalGraph]);

  // Cross-reference resolver
  const resolveHighlight = useMemo(() => {
    if (!selected) return { fmeaSet: new Set<string>(), causalSet: new Set<string>() };
    const fmeaSet = new Set<string>();
    const causalSet = new Set<string>();

    // If selected is an FMEA node id
    const fmea = FMEA_NODES.find(n => n.id === selected);
    if (fmea) {
      fmeaSet.add(fmea.id);
      fmea.causalRefs.forEach(v => causalSet.add(v));
      return { fmeaSet, causalSet };
    }
    // Otherwise it's a causal variable
    causalSet.add(selected);
    FMEA_NODES.forEach(n => {
      if (n.causalRefs.includes(selected)) fmeaSet.add(n.id);
    });
    return { fmeaSet, causalSet };
  }, [selected]);

  // SVG dimensions
  const W = 520, H = 480;
  const fmeaPos = useMemo(() => layoutFmea(W, H), []);
  const causalPos = useMemo(() => layoutCausal(causalVars, W, H), [causalVars]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5" />
          Knowledge Graph — Industrial Workflow × Causal Pathway
        </CardTitle>
        <CardDescription className="flex flex-wrap items-center gap-2">
          <span>Dual view: traditional FMEA structure on the left, causality-derived graph on the right.</span>
          <Badge variant={isLive ? 'default' : 'secondary'} className="ml-1">
            {isLive ? 'Live causal graph' : 'Domain skeleton (run pipeline for live edges)'}
          </Badge>
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs value={view} onValueChange={(v) => setView(v as typeof view)} className="mb-3">
          <TabsList>
            <TabsTrigger value="dual">Dual View</TabsTrigger>
            <TabsTrigger value="fmea"><Workflow className="h-3 w-3 mr-1" />FMEA Workflow</TabsTrigger>
            <TabsTrigger value="causal"><GitBranch className="h-3 w-3 mr-1" />Causal Graph</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className={view === 'dual' ? 'grid lg:grid-cols-2 gap-4' : ''}>
          {(view === 'dual' || view === 'fmea') && (
            <FmeaSvg
              W={W} H={H}
              positions={fmeaPos}
              highlightSet={resolveHighlight.fmeaSet}
              hasSelection={!!selected}
              onSelect={(id) => setSelected(prev => prev === id ? null : id)}
            />
          )}
          {(view === 'dual' || view === 'causal') && (
            <CausalSvg
              W={W} H={H}
              positions={causalPos}
              edges={causalEdges}
              highlightSet={resolveHighlight.causalSet}
              hasSelection={!!selected}
              onSelect={(id) => setSelected(prev => prev === id ? null : id)}
            />
          )}
        </div>

        {/* Selection inspector */}
        <div className="mt-4 p-3 rounded-lg border bg-muted/20 text-xs">
          {!selected ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Info className="h-3 w-3" />
              Click a node on either side to highlight its cross-references on the other graph.
            </div>
          ) : (
            <SelectionDetails selected={selected} causalEdges={causalEdges} />
          )}
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap gap-2">
          {TIER_ORDER.map(t => (
            <Badge key={t} variant="outline" className="text-xs gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: TIER_COLOR[t] }} />
              {TIER_LABEL[t]}
            </Badge>
          ))}
          <Badge variant="outline" className="text-xs gap-1">
            <span className="w-2 h-2 rounded-full bg-foreground" /> Causal variable
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

// ============= Subviews =============

const FmeaSvg: React.FC<{
  W: number; H: number;
  positions: Map<string, Pt>;
  highlightSet: Set<string>;
  hasSelection: boolean;
  onSelect: (id: string) => void;
}> = ({ W, H, positions, highlightSet, hasSelection, onSelect }) => (
  <div>
    <div className="text-xs font-medium mb-1 flex items-center gap-1">
      <Workflow className="h-3 w-3" /> Industrial Workflow (FMEA)
    </div>
    <ScrollArea className="border rounded-lg bg-muted/10" style={{ height: H + 16 }}>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
        <defs>
          <marker id="fmea-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="hsl(var(--muted-foreground))" opacity="0.7" />
          </marker>
        </defs>
        {FMEA_EDGES.map((e, i) => {
          const a = positions.get(e.from), b = positions.get(e.to);
          if (!a || !b) return null;
          const active = highlightSet.has(e.from) && highlightSet.has(e.to);
          return (
            <line
              key={i}
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke={active ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}
              strokeOpacity={hasSelection && !active ? 0.15 : 0.55}
              strokeWidth={active ? 2 : 1}
              markerEnd="url(#fmea-arrow)"
            />
          );
        })}
        {FMEA_NODES.map(n => {
          const p = positions.get(n.id);
          if (!p) return null;
          const isHi = highlightSet.has(n.id);
          const dim = hasSelection && !isHi ? 0.35 : 1;
          return (
            <g
              key={n.id}
              transform={`translate(${p.x}, ${p.y})`}
              style={{ cursor: 'pointer', opacity: dim }}
              onClick={() => onSelect(n.id)}
            >
              <rect
                x={-44} y={-12} width={88} height={24} rx={6}
                fill={TIER_COLOR[n.tier]} fillOpacity={isHi ? 0.95 : 0.8}
                stroke={isHi ? 'hsl(var(--foreground))' : 'transparent'}
                strokeWidth={isHi ? 1.5 : 0}
              />
              <text textAnchor="middle" y={4} className="text-[9px] font-medium" fill="white">
                {n.label}
              </text>
            </g>
          );
        })}
      </svg>
    </ScrollArea>
  </div>
);

const CausalSvg: React.FC<{
  W: number; H: number;
  positions: Map<string, Pt>;
  edges: Array<{ from: string; to: string; w: number; src: string }>;
  highlightSet: Set<string>;
  hasSelection: boolean;
  onSelect: (id: string) => void;
}> = ({ W, H, positions, edges, highlightSet, hasSelection, onSelect }) => (
  <div>
    <div className="text-xs font-medium mb-1 flex items-center gap-1">
      <GitBranch className="h-3 w-3" /> Causality-Derived Graph
    </div>
    <ScrollArea className="border rounded-lg bg-muted/10" style={{ height: H + 16 }}>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
        <defs>
          <marker id="causal-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="hsl(var(--chart-1))" opacity="0.8" />
          </marker>
        </defs>
        {edges.map((e, i) => {
          const a = positions.get(e.from), b = positions.get(e.to);
          if (!a || !b) return null;
          const active = highlightSet.has(e.from) || highlightSet.has(e.to);
          return (
            <line
              key={i}
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke={active ? 'hsl(var(--primary))' : 'hsl(var(--chart-1))'}
              strokeOpacity={hasSelection && !active ? 0.1 : 0.4 + e.w * 0.4}
              strokeWidth={1 + e.w * 2}
              markerEnd="url(#causal-arrow)"
            />
          );
        })}
        {Array.from(positions.entries()).map(([id, p]) => {
          const isHi = highlightSet.has(id);
          const dim = hasSelection && !isHi ? 0.3 : 1;
          const label = id.replace(/_/g, ' ');
          const short = label.length > 16 ? label.slice(0, 14) + '…' : label;
          return (
            <g
              key={id}
              transform={`translate(${p.x}, ${p.y})`}
              style={{ cursor: 'pointer', opacity: dim }}
              onClick={() => onSelect(id)}
            >
              <circle
                r={isHi ? 16 : 12}
                fill="hsl(var(--background))"
                stroke={isHi ? 'hsl(var(--primary))' : 'hsl(var(--chart-1))'}
                strokeWidth={isHi ? 2.5 : 1.5}
              />
              <text textAnchor="middle" y={isHi ? 30 : 26} className="text-[9px]" fill="hsl(var(--foreground))">
                {short}
              </text>
            </g>
          );
        })}
      </svg>
    </ScrollArea>
  </div>
);

const SelectionDetails: React.FC<{
  selected: string;
  causalEdges: Array<{ from: string; to: string; w: number; src: string }>;
}> = ({ selected, causalEdges }) => {
  const fmea = FMEA_NODES.find(n => n.id === selected);
  if (fmea) {
    return (
      <div className="space-y-1">
        <div className="font-medium">
          {TIER_LABEL[fmea.tier]}: <span className="text-primary">{fmea.label}</span>
        </div>
        <div className="text-muted-foreground">
          Mapped causal variables: {fmea.causalRefs.length === 0
            ? <em>none (top-level node)</em>
            : fmea.causalRefs.map(v => <Badge key={v} variant="outline" className="text-[10px] mr-1">{v}</Badge>)}
        </div>
      </div>
    );
  }
  // Causal variable
  const ins = causalEdges.filter(e => e.to === selected);
  const outs = causalEdges.filter(e => e.from === selected);
  const linked = FMEA_NODES.filter(n => n.causalRefs.includes(selected));
  return (
    <div className="space-y-1">
      <div className="font-medium">
        Causal variable: <span className="text-primary">{selected.replace(/_/g, ' ')}</span>
      </div>
      <div className="text-muted-foreground">
        In-edges: {ins.length} · Out-edges: {outs.length}
      </div>
      <div className="text-muted-foreground">
        FMEA touch-points: {linked.length === 0
          ? <em>none</em>
          : linked.map(n => <Badge key={n.id} variant="outline" className="text-[10px] mr-1">{n.label}</Badge>)}
      </div>
    </div>
  );
};

export default KnowledgeGraphPanel;
