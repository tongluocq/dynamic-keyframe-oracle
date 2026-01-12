import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  Thermometer, 
  Droplets, 
  Wrench,
  Zap,
  Activity,
  Brain,
  Target,
  TrendingUp,
  Clock,
  DollarSign,
  Shield,
  BookOpen,
  ChevronRight,
  Layers
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface CasePhase {
  title: string;
  content: string[];
  codeBlock?: string;
  highlight?: 'success' | 'warning' | 'critical' | 'info';
}

interface OperationCase {
  id: number;
  title: string;
  scenario: string;
  pearlLevel: string;
  trainingGoal: string;
  keyModules: string[];
  phases: CasePhase[];
  summary: {
    ateRange: string;
    riskLevel: string;
    decision: string;
  };
}

const OperationCasesPanel: React.FC = () => {
  const { t } = useLanguage();
  const [expandedCase, setExpandedCase] = useState<string | null>(null);

  const cases: OperationCase[] = [
    {
      id: 1,
      title: t('case1.title') || 'Case 1: Normal Operation Baseline - Startup to Steady State',
      scenario: t('case1.scenario') || 'TBM initial startup and transition to stable boring operation',
      pearlLevel: 'L1 (Observation)',
      trainingGoal: t('case1.trainingGoal') || 'Establish baseline understanding of normal CVGG outputs and healthy causal relationships',
      keyModules: ['Physics Simulator', 'Baseline CVGG', 'Causal Discovery'],
      phases: [
        {
          title: 'Phase 1: TBM Startup (t=0 to t=60s)',
          content: [
            'Physics Simulator initializes with nominal values:',
            '• hydraulic_pressure = 150 bar',
            '• system_temp = 25°C',
            '• thrust = 360 kN',
            'Sensor readings stabilize over 60 seconds with 5% Gaussian noise',
            'Cross-domain causal bridges establish: Electrical → Hydraulic → Mechanical'
          ],
          highlight: 'info'
        },
        {
          title: 'Phase 2: Signal Monitoring (t=60s to t=300s)',
          content: [
            '18 sensors across 5 domains:',
            '• Hydraulic: 5 sensors (pressure, flow_rate, temperature, viscosity, level)',
            '• Mechanical: 6 sensors (vibration_x, vibration_y, vibration_z, torque, speed, wear_level)',
            '• Thermal: 4 sensors (system_temp, ambient_temp, heat_dissipation, thermal_gradient)',
            '• Electrical: 5 sensors (voltage, current, power, frequency, power_factor)',
            '• Cutting: 4 sensors (tool_wear, cutting_force, surface_quality, chip_formation)',
            'Sampling rate: 10 Hz (100ms intervals)',
            'Window size: 50 time steps = 5 seconds historical context',
            'Noise level: σ = 5% of signal magnitude'
          ],
          highlight: 'info'
        },
        {
          title: 'Phase 3: Causal Discovery (PC Algorithm)',
          content: [
            'Complete graph initialization: 18 nodes, 306 initial edges',
            'Conditional independence testing with threshold r < 0.3',
            'Final DAG: ~45 significant edges discovered',
            'Cross-domain bridges identified:',
            '• pressure → torque (r=0.82)',
            '• power → temperature (r=0.76)',
            '• vibration → wear (r=0.68)'
          ],
          codeBlock: `PC Algorithm Result:
Nodes: 18
Initial Edges: 306
Final Edges: 45
Skeleton Construction: 2.3s
Edge Orientation: 0.8s`,
          highlight: 'success'
        },
        {
          title: 'Phase 4: CVGG Baseline Analysis',
          content: [
            'EnhancedCVGG inference on steady-state signals:',
            '• ATE = 0.0823 (low - stable operation)',
            '• CATE = 0.0912 (within normal range)',
            '• directEffect = 0.0547',
            '• indirectEffect = 0.0276',
            '• confidence = 0.8547',
            '• System Health Score = 94/100'
          ],
          codeBlock: `CVGG Output:
{
  "classification": "normal_operation",
  "confidence": 0.8547,
  "causalEffects": {
    "ATE": 0.0823,
    "CATE": 0.0912,
    "directEffect": 0.0547,
    "indirectEffect": 0.0276
  },
  "systemHealth": 94
}`,
          highlight: 'success'
        },
        {
          title: 'Phase 5: State Progress Reporting',
          content: [
            'All domains within operational thresholds',
            'No anomalies detected (all scores < 0.3)',
            'Prescriptive AI generates monitoring recommendations only',
            'Decision: Continue normal operation, schedule routine maintenance at t+72h'
          ],
          highlight: 'success'
        }
      ],
      summary: {
        ateRange: '0.05 - 0.12',
        riskLevel: 'LOW',
        decision: 'Continue normal operation'
      }
    },
    {
      id: 2,
      title: t('case2.title') || 'Case 2: Gradual Bearing Wear Detection - Early Warning Success',
      scenario: t('case2.scenario') || 'Detect early bearing degradation before catastrophic failure',
      pearlLevel: 'L3 (Counterfactual)',
      trainingGoal: t('case2.trainingGoal') || 'Demonstrate early warning capability - detection at severity=0.48 prevents catastrophic failure at severity>0.85',
      keyModules: ['Failure Simulator', 'Anomaly Detection', 'Counterfactual Engine', 'Prescriptive AI'],
      phases: [
        {
          title: 'Phase 1: Initial Condition (t=0)',
          content: [
            'Normal operation baseline established',
            'Bearing wear level: 12% (within acceptable range)',
            'Failure Simulator: bearing_wear failure injected at severity=0.15',
            'Progression type: gradual (slow accumulation)'
          ],
          highlight: 'info'
        },
        {
          title: 'Phase 2: Progressive Degradation (t=0 to t=1800s = 30 min)',
          content: [
            'Failure progression model:',
            'severity(t+1) = severity(t) + 0.001 × Δt × (1 + severity(t))',
            '',
            'Timeline:',
            '• t=0s: severity = 0.15, vibration_x = baseline',
            '• t=600s: severity = 0.32, vibration_x increases by 15%',
            '• t=1200s: severity = 0.48, vibration crosses warning threshold',
            '• t=1800s: severity = 0.62 (if no intervention)'
          ],
          codeBlock: `Failure Progression:
t=0s:    severity=0.15  vibration=1.2 mm/s
t=600s:  severity=0.32  vibration=1.38 mm/s (+15%)
t=1200s: severity=0.48  vibration=1.68 mm/s (+40%) ⚠️ WARNING
t=1800s: severity=0.62  vibration=2.1 mm/s (+75%)`,
          highlight: 'warning'
        },
        {
          title: 'Phase 3: Causal Anomaly Detection',
          content: [
            'Anomaly score calculation: anomaly_score = |actual - predicted| / expected',
            '',
            'Detected anomalies:',
            '• mechanical_vibration_x: score = 0.67 (HIGH)',
            '• mechanical_vibration_y: score = 0.54 (MEDIUM)',
            '• mechanical_torque: score = 0.42 (MEDIUM)',
            '',
            'Causal pathway identified:',
            'bearing_wear → vibration_amplitude → mechanical_stress → thermal_increase',
            '',
            'Time lag detection: 2-5 steps between wear progression and vibration response'
          ],
          highlight: 'warning'
        },
        {
          title: 'Phase 4: CVGG Fault Analysis',
          content: [
            'EnhancedCVGG inference under fault condition:',
            '• ATE = 0.3847 (elevated - fault condition)',
            '• CATE = 0.4523 (amplified under stress)',
            '• directEffect = 0.2918 (bearing → vibration)',
            '• indirectEffect = 0.0929 (vibration → thermal cascade)',
            '• confidence = 0.8912',
            '• pValue = 0.0012 (statistically significant)'
          ],
          codeBlock: `CVGG Fault Output:
{
  "classification": "inner_race_fault",
  "confidence": 0.8912,
  "causalEffects": {
    "ATE": 0.3847,
    "CATE": 0.4523,
    "directEffect": 0.2918,
    "indirectEffect": 0.0929
  },
  "pValue": 0.0012
}`,
          highlight: 'warning'
        },
        {
          title: 'Phase 5: Counterfactual Query',
          content: [
            'Query: "IF(bearing_wear = 0.12 → 0.48) THEN ?"',
            '',
            'Counterfactual analysis results:',
            '• Baseline outcome: 0.23 (23% failure risk)',
            '• Counterfactual outcome: 0.41 (41% failure risk)',
            '• Causal effect: +0.18 (18% risk increase attributed to bearing wear)',
            '• Confidence: 0.8923',
            '',
            'Interpretation: Bearing wear progression directly responsible for 18% increased failure risk'
          ],
          codeBlock: `Counterfactual Result:
{
  "query": "IF(bearing_wear = 0.12 → 0.48)",
  "baseline_outcome": 0.23,
  "counterfactual_outcome": 0.41,
  "causal_effect": 0.18,
  "confidence": 0.8923,
  "attribution": "bearing_wear"
}`,
          highlight: 'info'
        },
        {
          title: 'Phase 6: Prescriptive AI Recommendation',
          content: [
            'Generated recommendations ranked by causal impact:',
            '',
            'Priority: HIGH',
            'Action: "Schedule bearing inspection within 24h"',
            'Risk Reduction: 35%',
            'Cost Saving: $28,500',
            'Downtime Avoidance: 8.5 hours',
            'Confidence: 0.8723'
          ],
          codeBlock: `Prescriptive Output:
{
  "priority": "HIGH",
  "action": "Schedule bearing inspection within 24h",
  "metrics": {
    "riskReduction": 0.35,
    "costSaving": 28500,
    "downtimeAvoided": 8.5
  },
  "confidence": 0.8723
}`,
          highlight: 'success'
        },
        {
          title: 'Phase 7: Decision Making',
          content: [
            'Options evaluated:',
            '1. Immediate replacement: $45,000, 12h downtime',
            '2. Scheduled inspection: $12,000, 4h downtime (SELECTED)',
            '3. Monitoring only: $2,000, 0h downtime (insufficient risk reduction)',
            '',
            'Decision: Scheduled inspection (balanced cost/risk)',
            'Execution timeline: 4-6 hours during next maintenance window'
          ],
          highlight: 'success'
        }
      ],
      summary: {
        ateRange: '0.35 - 0.50',
        riskLevel: 'MEDIUM-HIGH',
        decision: 'Schedule bearing inspection within 24h'
      }
    },
    {
      id: 3,
      title: t('case3.title') || 'Case 3: Thermal Overload Emergency - Immediate Intervention',
      scenario: t('case3.scenario') || 'Sudden thermal spike requiring emergency response',
      pearlLevel: 'L2 (Intervention)',
      trainingGoal: t('case3.trainingGoal') || 'Demonstrate emergency response pathway - CRITICAL priority bypasses normal scheduling',
      keyModules: ['Failure Simulator (sudden)', 'do-Calculus', 'Emergency Prescriptive AI'],
      phases: [
        {
          title: 'Phase 1: Trigger Event (t=0)',
          content: [
            'Normal operation: system_temp = 62°C',
            'Failure injection: thermal_overload with sudden progression type',
            'External cause: Cutterhead encounters high-friction geological layer',
            'Warning: Sudden failures escalate 200× faster after threshold'
          ],
          highlight: 'info'
        },
        {
          title: 'Phase 2: Rapid Escalation (t=0 to t=120s)',
          content: [
            'Sudden failure progression: After threshold (0.5), rate jumps 200×',
            '',
            'Timeline:',
            '• t=0s: severity=0.0, temp=62°C (NORMAL)',
            '• t=30s: severity=0.35, temp=68°C (ELEVATED)',
            '• t=60s: severity=0.52, temp=78°C (THRESHOLD CROSSED)',
            '• t=90s: severity=0.72, temp=89°C (CRITICAL ZONE)',
            '• t=120s: severity=0.85, temp=95°C (EMERGENCY)',
            '',
            'Rate of change: 0.33°C/second in critical zone'
          ],
          codeBlock: `Thermal Escalation Timeline:
t=0s:   severity=0.00  temp=62°C  [NORMAL]
t=30s:  severity=0.35  temp=68°C  [ELEVATED]
t=60s:  severity=0.52  temp=78°C  [THRESHOLD] ⚠️
t=90s:  severity=0.72  temp=89°C  [CRITICAL] 🔴
t=120s: severity=0.85  temp=95°C  [EMERGENCY] 🚨`,
          highlight: 'critical'
        },
        {
          title: 'Phase 3: Multi-Domain Cascade Detection',
          content: [
            'Causal chain identified:',
            'thermal → hydraulic_viscosity → mechanical_friction → electrical_load',
            '',
            'Cross-domain bridges all activate simultaneously',
            '',
            'Anomaly scores across domains:',
            '• thermal_system_temp: 0.89 (CRITICAL)',
            '• hydraulic_viscosity: 0.72 (HIGH)',
            '• mechanical_wear_level: 0.65 (HIGH)',
            '• electrical_power: 0.58 (MEDIUM)'
          ],
          highlight: 'critical'
        },
        {
          title: 'Phase 4: CVGG Emergency Analysis',
          content: [
            'EnhancedCVGG emergency inference:',
            '• ATE = 0.5823 (CRITICAL - immediate intervention required)',
            '• CATE = 0.7234 (amplified in thermal overload context)',
            '• directEffect = 0.4156 (thermal → failure)',
            '• indirectEffect = 0.1667 (cascade through all domains)',
            '• confidence = 0.9456',
            '• System Health Score = 28/100'
          ],
          codeBlock: `CVGG Emergency Output:
{
  "classification": "thermal_overload_critical",
  "confidence": 0.9456,
  "causalEffects": {
    "ATE": 0.5823,
    "CATE": 0.7234,
    "directEffect": 0.4156,
    "indirectEffect": 0.1667
  },
  "systemHealth": 28,
  "priority": "CRITICAL"
}`,
          highlight: 'critical'
        },
        {
          title: 'Phase 5: do-Calculus Intervention',
          content: [
            'Intervention: do(Temperature = 60°C) - Force cooling',
            '',
            'P(SystemFailure | do(Temperature = 60°C))',
            '',
            'Primary effects:',
            '• lubricant_viscosity: +12% (normalized)',
            '• thermal_expansion: -8.5%',
            '',
            'Secondary effects:',
            '• bearing_friction: +3.2%',
            '• seal_integrity: +5.7%',
            '',
            'Risk reduction: 0.89 → 0.45 (50% reduction)'
          ],
          codeBlock: `do-Calculus Result:
Intervention: do(Temperature = 60°C)

P(SystemFailure | do(Temp=60)) = 0.45

Effects:
├── lubricant_viscosity: +12%
├── thermal_expansion: -8.5%
├── bearing_friction: +3.2%
└── seal_integrity: +5.7%

Risk: 0.89 → 0.45 (50% reduction)`,
          highlight: 'success'
        },
        {
          title: 'Phase 6: Emergency Prescriptive Response',
          content: [
            'Priority: CRITICAL (auto-execute enabled)',
            '',
            'Actions (ranked by urgency):',
            '1. Immediate TBM stop (score=0.98) ← AUTO-EXECUTE',
            '2. Emergency cooling activation (score=0.95) ← AUTO-EXECUTE',
            '3. Reduce thrust to 80% (score=0.87) ← CONFIRM REQUIRED',
            '',
            'Risk Reduction: 65%',
            'Execution: IMMEDIATE (no scheduling delay)'
          ],
          highlight: 'critical'
        },
        {
          title: 'Phase 7: Emergency Decision',
          content: [
            'Auto-executed actions:',
            '• TBM stop command sent',
            '• Emergency cooling activation',
            '',
            'Human confirmation required:',
            '• Thrust reduction decision (approved by operator)',
            '',
            'Post-intervention monitoring:',
            '• 15-minute cooldown period initiated',
            '• Resume criteria: temp < 65°C for 5 consecutive minutes',
            '',
            'Outcome: System stabilized at t+18 minutes'
          ],
          highlight: 'success'
        }
      ],
      summary: {
        ateRange: '0.55 - 0.75',
        riskLevel: 'CRITICAL',
        decision: 'Emergency stop + cooling (auto-execute)'
      }
    },
    {
      id: 4,
      title: t('case4.title') || 'Case 4: Hydraulic Leak Diagnosis - Root Cause Tracing',
      scenario: t('case4.scenario') || 'Identify and trace hydraulic leak through causal pathways',
      pearlLevel: 'L2+L3 (Intervention + Counterfactual)',
      trainingGoal: t('case4.trainingGoal') || 'Demonstrate causal pathway tracing from symptom to root cause using CVGG embeddings',
      keyModules: ['PC Algorithm', 'CVGG Latent Analysis', 'Mediator Detection', 'Multi-Action Prescriptive'],
      phases: [
        {
          title: 'Phase 1: Symptom Detection (t=0)',
          content: [
            'Observed symptoms:',
            '• Thrust force declining despite constant command',
            '• Multiple sensors affected: pressure, flow_rate, torque',
            '',
            'Failure injection: hydraulic_leak with gradual progression, severity=0.35',
            '',
            'Challenge: Symptoms appear in mechanical domain, root cause in hydraulic'
          ],
          highlight: 'warning'
        },
        {
          title: 'Phase 2: Causal Graph Analysis',
          content: [
            'PC Algorithm discovers causal structure:',
            '',
            'Discovered relationships:',
            '• hydraulic_pressure → mechanical_torque (r=0.82, lag=1.0s)',
            '• hydraulic_flow_rate → hydraulic_pressure (r=0.78, lag=0.5s)',
            '• hydraulic_leak [hidden] → flow_rate, pressure, torque',
            '',
            'Confounder detected:',
            'Ambient temperature creating spurious viscosity-voltage correlation'
          ],
          codeBlock: `Causal Structure:
hydraulic_leak (hidden)
    ├── flow_rate (r=-0.85)
    ├── pressure (r=-0.78)
    └── [cascade]
        ├── torque (r=-0.65)
        └── thrust (r=-0.72)

Confounder: ambient_temp
    ├── viscosity (spurious)
    └── voltage (spurious)`,
          highlight: 'info'
        },
        {
          title: 'Phase 3: Root Cause Identification via CVGG',
          content: [
            'Latent embedding analysis:',
            '• Cluster 1: Normal operation patterns',
            '• Cluster 2: Leak-induced patterns (current state matched)',
            '',
            'Mediator analysis:',
            '• pressure_induced_stress: -0.35 (decreasing)',
            '• flow_rate_anomaly: 0.42 (increasing)',
            '',
            'Root cause confidence scores:',
            '• hydraulic_leak: 0.87 (HIGHEST)',
            '• pump_degradation: 0.23',
            '• seal_failure: 0.15'
          ],
          codeBlock: `Root Cause Analysis:
Latent Cluster: leak_induced_pattern

Mediators:
├── pressure_induced_stress: -0.35
└── flow_rate_anomaly: +0.42

Confidence:
├── hydraulic_leak: 0.87 ★
├── pump_degradation: 0.23
└── seal_failure: 0.15`,
          highlight: 'success'
        },
        {
          title: 'Phase 4: Effect Decomposition',
          content: [
            'Total Effect on System Performance: -0.38',
            '',
            'Effect decomposition:',
            '• Direct Effect (leak → performance): -0.28 (74%)',
            '• Indirect via pressure drop: -0.07 (18%)',
            '• Indirect via torque reduction: -0.03 (8%)',
            '',
            'CVGG outputs:',
            '• ATE = -0.38 (negative = performance degradation)',
            '• CATE = -0.45 (amplified under high-demand conditions)'
          ],
          codeBlock: `Effect Decomposition:
Total Effect: -0.38

├── Direct (leak→perf): -0.28 (74%)
├── Via pressure: -0.07 (18%)
└── Via torque: -0.03 (8%)

ATE: -0.38
CATE: -0.45 (high-demand context)`,
          highlight: 'warning'
        },
        {
          title: 'Phase 5: Counterfactual Root Cause Verification',
          content: [
            'Query: "What if there were no hydraulic leak?"',
            '',
            'IF(leak_severity = 0.35 → 0.0) THEN ?',
            '',
            'Results:',
            '• Baseline: performance = 0.72',
            '• Counterfactual: performance = 0.94',
            '• Causal attribution: 0.22 (22% performance loss due to leak)',
            '• Confidence: 0.8923',
            '',
            'Verification: Removing leak restores 96% of expected performance'
          ],
          highlight: 'success'
        },
        {
          title: 'Phase 6: Multi-Action Prescriptive Plan',
          content: [
            'Staged recommendation sequence:',
            '',
            '1. Isolate affected circuit (immediate)',
            '   → Risk reduction: 25% (contain leak)',
            '',
            '2. Activate backup hydraulic line (1 hour)',
            '   → Risk reduction: 45% (restore function)',
            '',
            '3. Schedule leak repair (next maintenance window)',
            '   → Risk reduction: 78% (permanent fix)',
            '',
            'Cumulative risk reduction: 78%'
          ],
          codeBlock: `Multi-Action Plan:
Step 1: Isolate circuit
  Time: Immediate
  Risk Δ: -25%
  
Step 2: Activate backup
  Time: +1 hour
  Risk Δ: -45% (cumulative)
  
Step 3: Repair leak
  Time: Next window
  Risk Δ: -78% (cumulative)`,
          highlight: 'success'
        },
        {
          title: 'Phase 7: Resource-Constrained Decision',
          content: [
            'Constraints:',
            '• Budget: $50,000 maintenance reserve',
            '• Available crews: 1 team',
            '• Time window: 8 hours',
            '',
            'Options evaluated:',
            '• Emergency repair: $65,000 (over budget, rejected)',
            '• Staged approach: $45,000 (within budget, SELECTED)',
            '• Monitoring only: $5,000 (insufficient risk reduction)',
            '',
            'Decision: Staged repair with temporary bypass',
            'Expected outcome: 78% risk reduction within budget'
          ],
          highlight: 'success'
        }
      ],
      summary: {
        ateRange: '-0.35 to -0.50',
        riskLevel: 'MEDIUM',
        decision: 'Staged repair with temporary bypass'
      }
    },
    {
      id: 5,
      title: t('case5.title') || 'Case 5: Multi-Fault Competing Causes - Complex Decision Scenario',
      scenario: t('case5.scenario') || 'Multiple simultaneous faults requiring prioritized response',
      pearlLevel: 'L1+L2+L3 (All Levels)',
      trainingGoal: t('case5.trainingGoal') || 'Demonstrate complex multi-fault diagnosis with causal disentanglement and resource-constrained optimization',
      keyModules: ['Multi-Fault Detection', 'Causal Disentanglement', 'IV Estimation', 'Multi-Decision Optimization'],
      phases: [
        {
          title: 'Phase 1: Complex Fault Environment (t=0)',
          content: [
            'Active failures injected simultaneously:',
            '',
            '1. voltage_fluctuation (electrical, intermittent, severity=0.45)',
            '2. tool_wear_excessive (cutting, gradual, severity=0.55)',
            '3. Minor thermal elevation (not yet failure, temp=68°C)',
            '',
            'Challenge: Faults interact and amplify each other'
          ],
          highlight: 'warning'
        },
        {
          title: 'Phase 2: Competing Causal Signals',
          content: [
            'Anomaly detection across all domains:',
            '',
            '• electrical_voltage: score=0.52 (intermittent pattern)',
            '• cutting_tool_wear: score=0.67 (steady increase)',
            '• cutting_force: score=0.58 (degraded efficiency)',
            '• thermal_system_temp: score=0.38 (warning zone)',
            '',
            'Problem: Voltage fluctuation affects ALL domains (confounding)'
          ],
          highlight: 'warning'
        },
        {
          title: 'Phase 3: Causal Disentanglement',
          content: [
            'CVGG confounder proxy estimation:',
            '',
            'confounder_proxy = [0.67, 0.23, 0.45]',
            '• Component 1: Electrical instability (0.67) - PRIMARY',
            '• Component 2: Geological variation (0.23)',
            '• Component 3: Equipment aging (0.45)',
            '',
            'Disentanglement allows isolating individual fault effects'
          ],
          codeBlock: `Confounder Analysis:
confounder_proxy: [0.67, 0.23, 0.45]

Components:
├── Electrical instability: 0.67 (primary)
├── Geological variation: 0.23
└── Equipment aging: 0.45

Disentangled effects now calculable`,
          highlight: 'info'
        },
        {
          title: 'Phase 4: Independent Causal Effects (IV Estimation)',
          content: [
            'Instrumental Variable estimation for each fault:',
            '',
            'Fault 1 (Voltage):',
            '• ATE_isolated = 0.23',
            '• Pathway: voltage → current → motor_torque → cutting_force',
            '',
            'Fault 2 (Tool Wear):',
            '• ATE_isolated = 0.34',
            '• Pathway: wear → cutting_force → vibration → thermal',
            '',
            'Interaction Effect:',
            '• ATE_interaction = 0.12',
            '• Combined effect exceeds sum by 12% (synergistic damage)'
          ],
          codeBlock: `IV Estimation Results:

Fault 1 (Voltage):
  ATE_isolated: 0.23
  Pathway: voltage→current→torque→force

Fault 2 (Tool Wear):
  ATE_isolated: 0.34
  Pathway: wear→force→vibration→thermal

Interaction:
  ATE_interaction: 0.12
  Note: Synergistic (exceeds additive)`,
          highlight: 'info'
        },
        {
          title: 'Phase 5: Priority Ranking via Causal Importance',
          content: [
            'Causal Importance Score = ATE × severity × cascade_potential',
            '',
            'Ranking:',
            '• Fault 2 (Tool Wear): 0.34 × 0.55 × 1.8 = 0.337 ← HIGHER PRIORITY',
            '• Fault 1 (Voltage): 0.23 × 0.45 × 2.3 = 0.238',
            '• Thermal (precursor): 0.15 × 0.38 × 2.1 = 0.120',
            '',
            'Prioritized order: Tool Wear > Voltage > Thermal'
          ],
          codeBlock: `Priority Ranking:
Score = ATE × severity × cascade

1. Tool Wear: 0.34×0.55×1.8 = 0.337 ★
2. Voltage:   0.23×0.45×2.3 = 0.238
3. Thermal:   0.15×0.38×2.1 = 0.120

Order: Tool Wear > Voltage > Thermal`,
          highlight: 'success'
        },
        {
          title: 'Phase 6: Multi-Intervention Prescriptive Plan',
          content: [
            'Parallel Actions Recommended:',
            '',
            '┌─ Priority 1: Tool replacement (cutting domain)',
            '│   Risk reduction: 42%',
            '│   Cost: $12,000',
            '│   Timeline: 3-4 hours',
            '│',
            '├─ Priority 2: Voltage stabilizer check (electrical domain)',
            '│   Risk reduction: 28%',
            '│   Cost: $3,500',
            '│   Timeline: 1-2 hours',
            '│',
            '└─ Priority 3: Preemptive cooling increase (thermal domain)',
            '    Risk reduction: 15%',
            '    Cost: $500',
            '    Timeline: Immediate',
            '',
            'Combined Risk Reduction: 67% (with interaction benefits)'
          ],
          highlight: 'success'
        },
        {
          title: 'Phase 7: Optimized Multi-Decision',
          content: [
            'Resource constraints:',
            '• Available maintenance crew: 2 teams',
            '• Budget: $20,000',
            '• Time window: 6 hours',
            '',
            'Optimization result:',
            '• Selected: Tool replacement (Team A) + Voltage check (Team B)',
            '• Deferred: Enhanced cooling (monitor only)',
            '',
            'Rationale:',
            '• Tools + Voltage = $15,500 (within budget)',
            '• Parallel execution = 4 hours (within window)',
            '• Combined risk reduction = 58%',
            '• Thermal can wait (score=0.38 < 0.5 threshold)',
            '',
            'Post-decision: Re-evaluate thermal after primary fixes'
          ],
          codeBlock: `Optimization Result:

Selected (parallel):
├── Tool replacement (Team A)
│   Cost: $12,000
│   Time: 3-4h
└── Voltage check (Team B)
    Cost: $3,500
    Time: 1-2h

Total: $15,500 / $20,000 budget
Time: 4h / 6h window
Risk Δ: -58%

Deferred: Thermal (monitor)`,
          highlight: 'success'
        }
      ],
      summary: {
        ateRange: '0.23 - 0.46 (combined)',
        riskLevel: 'HIGH (multi-fault)',
        decision: 'Parallel tool replacement + voltage stabilization'
      }
    }
  ];

  const getHighlightStyles = (highlight?: string) => {
    switch (highlight) {
      case 'success':
        return 'border-l-4 border-l-green-500 bg-green-500/5';
      case 'warning':
        return 'border-l-4 border-l-yellow-500 bg-yellow-500/5';
      case 'critical':
        return 'border-l-4 border-l-red-500 bg-red-500/5';
      case 'info':
        return 'border-l-4 border-l-blue-500 bg-blue-500/5';
      default:
        return 'border-l-4 border-l-muted';
    }
  };

  const getPearlLevelBadge = (level: string) => {
    if (level.includes('L1') && level.includes('L2') && level.includes('L3')) {
      return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">All Levels</Badge>;
    }
    if (level.includes('L3')) {
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">L3 Counterfactual</Badge>;
    }
    if (level.includes('L2')) {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/50">L2 Intervention</Badge>;
    }
    return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/50">L1 Observation</Badge>;
  };

  const getRiskLevelBadge = (level: string) => {
    if (level.includes('CRITICAL')) {
      return <Badge variant="destructive">CRITICAL</Badge>;
    }
    if (level.includes('HIGH')) {
      return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/50">HIGH</Badge>;
    }
    if (level.includes('MEDIUM')) {
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">MEDIUM</Badge>;
    }
    return <Badge className="bg-green-500/20 text-green-400 border-green-500/50">LOW</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-primary" />
            {t('operationCases.title') || 'Industrial Operation Cases'}
          </CardTitle>
          <p className="text-muted-foreground">
            {t('operationCases.description') || '5 comprehensive cases illustrating IMSCHM processes from TBM startup to decision making. Each case covers signal monitoring, state progress reporting, causal analysis, and final decisions.'}
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {cases.map((c) => (
              <div key={c.id} className="p-3 border rounded-lg hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg font-bold text-primary">#{c.id}</span>
                  {getPearlLevelBadge(c.pearlLevel)}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{c.scenario}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Case Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            {t('operationCases.summaryTable') || 'Case Summary'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Case</th>
                  <th className="text-left p-2">Scenario</th>
                  <th className="text-left p-2">Pearl Level</th>
                  <th className="text-left p-2">ATE Range</th>
                  <th className="text-left p-2">Risk</th>
                  <th className="text-left p-2">Decision</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => (
                  <tr key={c.id} className="border-b hover:bg-muted/30">
                    <td className="p-2 font-medium">#{c.id}</td>
                    <td className="p-2 max-w-xs truncate">{c.scenario}</td>
                    <td className="p-2">{getPearlLevelBadge(c.pearlLevel)}</td>
                    <td className="p-2 font-mono text-xs">{c.summary.ateRange}</td>
                    <td className="p-2">{getRiskLevelBadge(c.summary.riskLevel)}</td>
                    <td className="p-2 max-w-xs truncate text-muted-foreground">{c.summary.decision}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Cases */}
      <Accordion type="single" collapsible value={expandedCase || undefined} onValueChange={setExpandedCase}>
        {cases.map((c) => (
          <AccordionItem key={c.id} value={`case-${c.id}`} className="border rounded-lg mb-4 overflow-hidden">
            <AccordionTrigger className="px-4 hover:no-underline hover:bg-muted/30">
              <div className="flex items-center gap-4 flex-1">
                <span className="text-2xl font-bold text-primary">#{c.id}</span>
                <div className="text-left flex-1">
                  <h3 className="font-semibold">{c.title}</h3>
                  <p className="text-sm text-muted-foreground">{c.scenario}</p>
                </div>
                <div className="flex gap-2">
                  {getPearlLevelBadge(c.pearlLevel)}
                  {getRiskLevelBadge(c.summary.riskLevel)}
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              {/* Key Modules */}
              <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Key Modules
                </h4>
                <div className="flex flex-wrap gap-2">
                  {c.keyModules.map((module, i) => (
                    <Badge key={i} variant="outline">{module}</Badge>
                  ))}
                </div>
              </div>

              {/* Training Goal */}
              <div className="mb-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                <h4 className="text-sm font-medium mb-1 flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Training Goal
                </h4>
                <p className="text-sm text-muted-foreground">{c.trainingGoal}</p>
              </div>

              {/* Phases */}
              <div className="space-y-4">
                {c.phases.map((phase, i) => (
                  <div key={i} className={`p-4 rounded-lg ${getHighlightStyles(phase.highlight)}`}>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <ChevronRight className="h-4 w-4" />
                      {phase.title}
                    </h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {phase.content.map((line, j) => (
                        <p key={j} className={line.startsWith('•') ? 'ml-4' : ''}>{line}</p>
                      ))}
                    </div>
                    {phase.codeBlock && (
                      <pre className="mt-3 p-3 bg-black/50 rounded text-xs font-mono text-green-400 overflow-x-auto">
                        {phase.codeBlock}
                      </pre>
                    )}
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Case Summary
                </h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">ATE Range:</span>
                    <p className="font-mono">{c.summary.ateRange}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Risk Level:</span>
                    <p>{getRiskLevelBadge(c.summary.riskLevel)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Final Decision:</span>
                    <p className="font-medium">{c.summary.decision}</p>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default OperationCasesPanel;
