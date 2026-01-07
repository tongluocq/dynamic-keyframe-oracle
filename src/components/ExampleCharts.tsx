// Matplotlib-style charts for IMSCHM example visualizations
import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
} from 'recharts';
import { 
  type CausalEffectExample,
  type CausalInterventionExample,
  type CounterfactualExample,
  type PrescriptiveExample,
  type DecisionMakingExample
} from '@/utils/exampleGenerator';

// ============================================
// CHART 1: CAUSAL EFFECT COMPARISON (ATE/CATE)
// ============================================

interface CausalEffectChartProps {
  example: CausalEffectExample;
}

export const CausalEffectChart: React.FC<CausalEffectChartProps> = ({ example }) => {
  const data = [
    {
      name: 'Direct',
      value: example.values.directEffect,
      fill: 'hsl(var(--chart-1))'
    },
    {
      name: 'Indirect',
      value: example.values.indirectEffect,
      fill: 'hsl(var(--chart-2))'
    },
    {
      name: 'ATE',
      value: example.values.ATE,
      fill: 'hsl(var(--chart-3))'
    },
    {
      name: 'CATE',
      value: example.values.CATE,
      fill: 'hsl(var(--chart-4))'
    }
  ];

  const confidenceData = [
    { name: 'Conf', value: example.values.confidence, fill: 'hsl(142, 76%, 36%)' },
    { name: 'Uncert', value: 1 - example.values.confidence, fill: 'hsl(0, 0%, 30%)' }
  ];

  return (
    <div className="w-full space-y-2">
      <div className="text-xs font-semibold text-muted-foreground mb-1">Effect Decomposition</div>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 50, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis 
            type="number" 
            domain={[-0.1, 0.7]} 
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={(v) => v.toFixed(2)}
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            width={45}
          />
          <Tooltip 
            formatter={(value: number) => [value.toFixed(4), 'Effect']}
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))', 
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
              fontSize: '11px'
            }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
          <ReferenceLine x={0} stroke="hsl(var(--foreground))" strokeWidth={1} />
        </BarChart>
      </ResponsiveContainer>
      
      {/* Statistical significance indicator */}
      <div className="flex items-center gap-2 text-xs">
        <div className="flex-1 bg-muted/30 rounded h-2 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-emerald-400" 
            style={{ width: `${example.values.confidence * 100}%` }}
          />
        </div>
        <span className="text-muted-foreground">
          p={example.values.pValue.toFixed(4)} {example.values.pValue < 0.05 ? '✓' : ''}
        </span>
      </div>
    </div>
  );
};

// ============================================
// CHART 2: DO-CALCULUS INTERVENTION CASCADE
// ============================================

interface InterventionChartProps {
  example: CausalInterventionExample;
}

export const InterventionChart: React.FC<InterventionChartProps> = ({ example }) => {
  // Combine primary and secondary effects for cascade visualization
  const cascadeData = [
    ...example.primaryEffects.map((e, i) => ({
      name: e.variable.replace(/_/g, ' ').substring(0, 12),
      value: e.value * 100,
      type: 'Primary',
      fill: e.value > 0 ? 'hsl(0, 72%, 51%)' : 'hsl(142, 76%, 36%)'
    })),
    ...example.secondaryEffects.map((e, i) => ({
      name: e.variable.replace(/_/g, ' ').substring(0, 12),
      value: e.value * 100,
      type: 'Secondary',
      fill: e.value > 0 ? 'hsl(25, 95%, 53%)' : 'hsl(173, 58%, 39%)'
    }))
  ];

  // Risk comparison data
  const riskData = [
    { name: 'Baseline', risk: example.riskAssessment.baselineRisk * 100, fill: 'hsl(217, 91%, 60%)' },
    { name: 'Post-Intervention', risk: example.riskAssessment.interventionRisk * 100, fill: example.riskAssessment.interventionRisk > example.riskAssessment.baselineRisk ? 'hsl(0, 72%, 51%)' : 'hsl(142, 76%, 36%)' }
  ];

  return (
    <div className="w-full space-y-3">
      <div className="text-xs font-semibold text-muted-foreground">Effect Cascade (% Change)</div>
      <ResponsiveContainer width="100%" height={100}>
        <BarChart data={cascadeData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }}
            angle={-15}
            textAnchor="end"
            height={35}
          />
          <YAxis 
            tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={(v) => `${v > 0 ? '+' : ''}${v.toFixed(0)}%`}
            width={40}
          />
          <Tooltip 
            formatter={(value: number) => [`${value > 0 ? '+' : ''}${value.toFixed(1)}%`, 'Change']}
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))', 
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
              fontSize: '11px'
            }}
          />
          <ReferenceLine y={0} stroke="hsl(var(--foreground))" strokeWidth={1} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {cascadeData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Risk before/after comparison */}
      <div className="text-xs font-semibold text-muted-foreground">Risk Comparison</div>
      <div className="flex items-center gap-2">
        <div className="flex-1 space-y-1">
          <div className="flex justify-between text-xs">
            <span>Baseline</span>
            <span className="font-mono">{(example.riskAssessment.baselineRisk * 100).toFixed(1)}%</span>
          </div>
          <div className="h-3 bg-muted/30 rounded overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all" 
              style={{ width: `${example.riskAssessment.baselineRisk * 100}%` }}
            />
          </div>
        </div>
        <div className="text-xl font-bold text-muted-foreground">→</div>
        <div className="flex-1 space-y-1">
          <div className="flex justify-between text-xs">
            <span>After</span>
            <span className={`font-mono ${example.riskAssessment.interventionRisk > example.riskAssessment.baselineRisk ? 'text-red-400' : 'text-green-400'}`}>
              {(example.riskAssessment.interventionRisk * 100).toFixed(1)}%
            </span>
          </div>
          <div className="h-3 bg-muted/30 rounded overflow-hidden">
            <div 
              className={`h-full transition-all ${example.riskAssessment.interventionRisk > example.riskAssessment.baselineRisk ? 'bg-red-500' : 'bg-green-500'}`}
              style={{ width: `${example.riskAssessment.interventionRisk * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// CHART 3: COUNTERFACTUAL TRAJECTORY
// ============================================

interface CounterfactualChartProps {
  example: CounterfactualExample;
}

export const CounterfactualChart: React.FC<CounterfactualChartProps> = ({ example }) => {
  // Create trajectory data showing the counterfactual path
  const trajectoryData = [
    { 
      point: 'Initial', 
      baseline: example.values.baselineOutcome, 
      counterfactual: example.values.baselineOutcome,
      x: 0
    },
    { 
      point: 'Treatment', 
      baseline: example.values.baselineOutcome, 
      counterfactual: example.values.baselineOutcome + (example.values.counterfactualOutcome - example.values.baselineOutcome) * 0.3,
      x: 1
    },
    { 
      point: 'Response', 
      baseline: example.values.baselineOutcome, 
      counterfactual: example.values.baselineOutcome + (example.values.counterfactualOutcome - example.values.baselineOutcome) * 0.7,
      x: 2
    },
    { 
      point: 'Final', 
      baseline: example.values.baselineOutcome, 
      counterfactual: example.values.counterfactualOutcome,
      x: 3
    }
  ];

  // Effect decomposition
  const effectData = [
    { name: 'Direct', value: example.values.directEffect * 100, fill: 'hsl(25, 95%, 53%)' },
    { name: 'Indirect', value: example.values.indirectEffect * 100, fill: 'hsl(280, 65%, 60%)' },
    { name: 'Total', value: example.values.causalEffect * 100, fill: example.values.causalEffect > 0 ? 'hsl(0, 72%, 51%)' : 'hsl(142, 76%, 36%)' }
  ];

  return (
    <div className="w-full space-y-3">
      <div className="text-xs font-semibold text-muted-foreground">Counterfactual Trajectory</div>
      <ResponsiveContainer width="100%" height={100}>
        <LineChart data={trajectoryData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis 
            dataKey="point" 
            tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis 
            domain={[0, 0.6]}
            tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
            width={35}
          />
          <Tooltip 
            formatter={(value: number) => [`${(value * 100).toFixed(2)}%`, 'Risk']}
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))', 
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
              fontSize: '11px'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="baseline" 
            stroke="hsl(217, 91%, 60%)" 
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 3, fill: 'hsl(217, 91%, 60%)' }}
            name="Baseline (Y₀)"
          />
          <Line 
            type="monotone" 
            dataKey="counterfactual" 
            stroke="hsl(280, 65%, 60%)" 
            strokeWidth={2}
            dot={{ r: 4, fill: 'hsl(280, 65%, 60%)' }}
            name="Counterfactual (Y₁)"
          />
          <Legend 
            wrapperStyle={{ fontSize: '10px' }}
            iconSize={8}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Effect breakdown bars */}
      <div className="text-xs font-semibold text-muted-foreground">Effect Decomposition</div>
      <ResponsiveContainer width="100%" height={60}>
        <BarChart data={effectData} layout="vertical" margin={{ top: 0, right: 30, left: 45, bottom: 0 }}>
          <XAxis 
            type="number"
            tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={(v) => `${v > 0 ? '+' : ''}${v.toFixed(0)}%`}
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
            width={40}
          />
          <Tooltip 
            formatter={(value: number) => [`${value > 0 ? '+' : ''}${value.toFixed(2)}%`, 'Effect']}
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))', 
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
              fontSize: '11px'
            }}
          />
          <ReferenceLine x={0} stroke="hsl(var(--foreground))" strokeWidth={1} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {effectData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// ============================================
// CHART 4: PRESCRIPTIVE AI IMPACT RADAR
// ============================================

interface PrescriptiveChartProps {
  example: PrescriptiveExample;
}

export const PrescriptiveChart: React.FC<PrescriptiveChartProps> = ({ example }) => {
  // Radar data for multi-dimensional impact
  const radarData = [
    { metric: 'Risk Red.', value: example.values.riskReduction * 100, fullMark: 100 },
    { metric: 'Confidence', value: example.values.confidence * 100, fullMark: 100 },
    { metric: 'Cost Save', value: Math.min(example.values.costSaving, 100), fullMark: 100 },
    { metric: 'Time Save', value: Math.min(example.values.downtimeAvoidance * 5, 100), fullMark: 100 },
    { metric: '|Direct|', value: Math.abs(example.values.directEffect) * 100, fullMark: 100 },
  ];

  // Benefit breakdown
  const benefitData = [
    { name: 'Risk Reduction', value: example.values.riskReduction * 100, fill: 'hsl(142, 76%, 36%)' },
    { name: 'Cost Saving', value: example.values.costSaving, fill: 'hsl(48, 96%, 53%)' },
    { name: 'Time Saved', value: example.values.downtimeAvoidance * 5, fill: 'hsl(199, 89%, 48%)' },
  ];

  return (
    <div className="w-full space-y-2">
      <div className="text-xs font-semibold text-muted-foreground">Multi-Factor Impact Analysis</div>
      <ResponsiveContainer width="100%" height={140}>
        <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis 
            dataKey="metric" 
            tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }}
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 100]} 
            tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={(v) => `${v}`}
          />
          <Radar
            name="Impact"
            dataKey="value"
            stroke="hsl(142, 76%, 36%)"
            fill="hsl(142, 76%, 36%)"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Tooltip 
            formatter={(value: number) => [`${value.toFixed(1)}%`, 'Score']}
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))', 
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
              fontSize: '11px'
            }}
          />
        </RadarChart>
      </ResponsiveContainer>

      {/* Benefit summary bars */}
      <div className="grid grid-cols-3 gap-1">
        {benefitData.map((item, idx) => (
          <div key={idx} className="text-center">
            <div className="h-12 bg-muted/20 rounded relative overflow-hidden">
              <div 
                className="absolute bottom-0 left-0 right-0 transition-all"
                style={{ 
                  height: `${Math.min(item.value, 100)}%`, 
                  backgroundColor: item.fill 
                }}
              />
            </div>
            <div className="text-[8px] text-muted-foreground mt-1 truncate">{item.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// CHART 5: DECISION MAKING COMPARISON
// ============================================

interface DecisionChartProps {
  example: DecisionMakingExample;
}

export const DecisionChart: React.FC<DecisionChartProps> = ({ example }) => {
  // Recommendation comparison data
  const optionsData = example.prescriptiveInputs.recommendations.map((rec, idx) => ({
    name: rec.action.substring(0, 15) + (rec.action.length > 15 ? '...' : ''),
    score: rec.score * 100,
    riskReduction: rec.riskReduction * 100,
    selected: idx === 0,
    fill: idx === 0 ? 'hsl(142, 76%, 36%)' : 'hsl(217, 91%, 60%)'
  }));

  // Cost vs benefit area
  const costBenefitData = [
    { name: 'Budget', value: example.decision.budget / 1000, type: 'limit' },
    { name: 'Cost', value: example.decision.executionCost / 1000, type: 'actual' },
    { name: 'Benefit', value: example.decision.expectedRiskReduction * 100, type: 'benefit' },
  ];

  return (
    <div className="w-full space-y-2">
      <div className="text-xs font-semibold text-muted-foreground">Option Comparison (Score vs Risk Reduction)</div>
      <ResponsiveContainer width="100%" height={100}>
        <ComposedChart data={optionsData} margin={{ top: 5, right: 20, left: 10, bottom: 25 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }}
            angle={-10}
            textAnchor="end"
            height={40}
          />
          <YAxis 
            yAxisId="left"
            tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={(v) => `${v}%`}
            width={35}
          />
          <Tooltip 
            formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]}
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))', 
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
              fontSize: '11px'
            }}
          />
          <Bar yAxisId="left" dataKey="score" name="Score" radius={[4, 4, 0, 0]}>
            {optionsData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.selected ? 'hsl(142, 76%, 36%)' : 'hsl(217, 91%, 60%)'} 
                opacity={entry.selected ? 1 : 0.5}
              />
            ))}
          </Bar>
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="riskReduction" 
            stroke="hsl(280, 65%, 60%)" 
            strokeWidth={2}
            dot={{ r: 4, fill: 'hsl(280, 65%, 60%)' }}
            name="Risk Reduction"
          />
          <Legend 
            wrapperStyle={{ fontSize: '9px' }}
            iconSize={8}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Budget utilization */}
      <div className="text-xs font-semibold text-muted-foreground">Budget Utilization</div>
      <div className="relative h-4 bg-muted/30 rounded overflow-hidden">
        <div 
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 to-emerald-400"
          style={{ width: `${(example.decision.executionCost / example.decision.budget) * 100}%` }}
        />
        <div className="absolute top-0 left-0 right-0 h-full flex items-center justify-between px-2 text-[10px]">
          <span className="text-white font-medium drop-shadow">${(example.decision.executionCost / 1000).toFixed(1)}K used</span>
          <span className="text-muted-foreground">${(example.decision.budget / 1000).toFixed(0)}K budget</span>
        </div>
      </div>
    </div>
  );
};

export default {
  CausalEffectChart,
  InterventionChart,
  CounterfactualChart,
  PrescriptiveChart,
  DecisionChart
};
