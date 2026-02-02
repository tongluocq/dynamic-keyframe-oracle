

# Plan: Enhance Examples Panel with Causal Pathway Visualization and Input-Output Explanation

## Summary

The current Examples panel shows CVGG ATE/CATE examples for Normal and Fault conditions, but the explanations are incomplete - they do not clearly describe:
1. What sensor data variations differentiate Normal from Fault conditions
2. How rock image features contribute to the classification
3. The complete causal pathway from multi-modal inputs to the four output values (Direct, Indirect, ATE, CATE)
4. How causal variables interact with each other

This plan adds a **Causal Architecture DAG** visualization and enriched explanations that trace the complete information flow from sensor inputs through CVGG to causal effect outputs.

---

## What Will Be Built

### 1. New Mermaid-Style DAG Visualization Component

A new **CVGGArchitectureDAG** component that visualizes:

```text
Input Layer                      CVGG Processing                    Output Layer
+----------------------+    +------------------------+    +------------------+
| Sensor Signals (6ch) |    | VGG Backbone          |    | Direct Effect    |
| - DE, FE, BA accel   |--->| Scalogram Transform   |--->| Indirect Effect  |
| - Temp, Press, Humid |    | Feature Extraction    |    | ATE              |
+----------------------+    +------------------------+    | CATE             |
                                       |                   +------------------+
+----------------------+    +------------------------+
| Rock Images (2D)     |--->| VGG Image Backbone    |--+
| - Texture features   |    | Feature Extraction    |  |
| - Geological context |    +------------------------+  |
+----------------------+               |                |
                                       v                v
+----------------------+    +------------------------+
| Causal Metadata      |    | Combined Embedding    |
| - Interventions      |--->| Classification Head   |
| - Confounders        |    | Causal Inference Head |
| - Instrumental Vars  |    +------------------------+
+----------------------+
```

### 2. Enhanced Example Data Structure

Add new fields to `CausalEffectExample` in `exampleGenerator.ts`:

- **inputSignature**: Describes what sensor patterns characterize this condition
  - Normal: Lower amplitude vibrations, stable thermal readings
  - Fault: High-frequency bearing vibration spikes, thermal gradient anomalies
  
- **causalPathway**: Array describing the causal chain from input to output
  
- **variableInteractions**: Describes how causal variables affect each other

### 3. Updated CausalEffectCard Component

Enhance the card in `CausalExamplesPanel.tsx` to include:

- **Input Characteristics Section**: Shows what sensor/image patterns caused this condition
- **Simple DAG Visualization**: Shows the causal pathway for this specific example
- **Variable Interaction Table**: Shows how variables influence each other

---

## Technical Details

### File: `src/utils/exampleGenerator.ts`

Add new fields to the `CausalEffectExample` interface:

```typescript
interface InputSignature {
  sensorPatterns: {
    channel: string;
    pattern: string;
    normalRange: string;
    observedValue: string;
    anomalyLevel: 'none' | 'low' | 'medium' | 'high';
  }[];
  rockImageFeatures: {
    feature: string;
    description: string;
  }[];
  causalMetadataState: {
    activeInterventions: number;
    confounderLevel: string;
  };
}

interface CausalPathway {
  stage: string;
  component: string;
  input: string;
  output: string;
  transformation: string;
}

interface VariableInteraction {
  from: string;
  to: string;
  mechanism: string;
  strength: number;
  direction: 'positive' | 'negative';
}
```

### File: `src/components/CausalExamplesPanel.tsx`

1. Add new **InputSignatureSection** sub-component
2. Add **CausalPathwayDAG** using the existing `SimpleDAG` component
3. Add **VariableInteractionTable** component
4. Update `CausalEffectCard` to include these new sections

### File: `src/utils/exampleGenerator.ts` - Updated Examples

#### Normal Example Enhanced Data:

```typescript
{
  // ... existing fields ...
  inputSignature: {
    sensorPatterns: [
      { channel: 'DE (Drive End)', pattern: 'Sinusoidal, low amplitude', 
        normalRange: '0.1-0.3g', observedValue: '0.22g', anomalyLevel: 'none' },
      { channel: 'FE (Fan End)', pattern: 'Periodic, consistent', 
        normalRange: '0.05-0.2g', observedValue: '0.15g', anomalyLevel: 'none' },
      { channel: 'Temperature', pattern: 'Stable, gradual rise', 
        normalRange: '45-65C', observedValue: '58C', anomalyLevel: 'none' },
      { channel: 'Pressure', pattern: 'Consistent operating pressure', 
        normalRange: '380-400 kN', observedValue: '392 kN', anomalyLevel: 'none' },
    ],
    rockImageFeatures: [
      { feature: 'Uniform texture', description: 'Consistent geological formation' },
      { feature: 'Normal hardness', description: 'Expected cutting resistance' }
    ],
    causalMetadataState: { activeInterventions: 0, confounderLevel: 'Low' }
  },
  causalPathway: [
    { stage: 'Input', component: 'Wavelet Transform', 
      input: '6-channel signals', output: '128x128 scalograms', 
      transformation: 'Morlet CWT' },
    { stage: 'Feature', component: 'VGG Backbone', 
      input: 'Scalograms + Rock image', output: '512-dim embedding', 
      transformation: 'Conv2D layers' },
    { stage: 'Causal', component: 'Causal Head', 
      input: 'Embedding + Metadata', output: 'ATE/CATE/DE/IE', 
      transformation: 'Treatment effect estimation' }
  ],
  variableInteractions: [
    { from: 'Thrust Pressure', to: 'Cutting Force', mechanism: 'Hydraulic transfer', 
      strength: 0.75, direction: 'positive' },
    { from: 'Cutting Force', to: 'Vibration', mechanism: 'Mechanical coupling', 
      strength: 0.45, direction: 'positive' },
    { from: 'Vibration', to: 'Temperature', mechanism: 'Friction heat', 
      strength: 0.30, direction: 'positive' }
  ]
}
```

#### Fault Example Enhanced Data:

```typescript
{
  // ... existing fields ...
  inputSignature: {
    sensorPatterns: [
      { channel: 'DE (Drive End)', pattern: 'High-frequency spikes, irregular', 
        normalRange: '0.1-0.3g', observedValue: '0.89g', anomalyLevel: 'high' },
      { channel: 'FE (Fan End)', pattern: 'Harmonic overtones present', 
        normalRange: '0.05-0.2g', observedValue: '0.45g', anomalyLevel: 'medium' },
      { channel: 'Temperature', pattern: 'Rapid thermal gradient', 
        normalRange: '45-65C', observedValue: '78C', anomalyLevel: 'high' },
      { channel: 'Vibration X/Y/Z', pattern: 'Cross-axis correlation anomaly', 
        normalRange: 'Uncorrelated', observedValue: 'r=0.82', anomalyLevel: 'high' },
    ],
    rockImageFeatures: [
      { feature: 'Hard inclusion detected', description: 'Unexpected high-hardness zone' },
      { feature: 'Fracture patterns', description: 'Stress concentration indicators' }
    ],
    causalMetadataState: { activeInterventions: 0, confounderLevel: 'High' }
  },
  variableInteractions: [
    { from: 'Bearing Wear', to: 'Vibration Amplitude', mechanism: 'Mechanical degradation', 
      strength: 0.92, direction: 'positive' },
    { from: 'Vibration', to: 'Thermal Load', mechanism: 'Friction cascade', 
      strength: 0.68, direction: 'positive' },
    { from: 'Thermal Load', to: 'Lubricant Viscosity', mechanism: 'Thermal thinning', 
      strength: 0.55, direction: 'negative' },
    { from: 'Lubricant Viscosity', to: 'Bearing Wear', mechanism: 'Lubrication failure', 
      strength: 0.78, direction: 'negative' }
  ]
}
```

---

## Visual Design

### Input Signature Section
```text
+----------------------------------------------+
| Sensor Input Patterns                        |
+----------------------------------------------+
| Channel          | Observed | Status        |
+------------------+----------+---------------+
| DE Accelerometer | 0.89g    | [HIGH ANOMALY]|
| FE Accelerometer | 0.45g    | [MED ANOMALY] |
| Temperature      | 78 C     | [HIGH ANOMALY]|
| Pressure         | 392 kN   | [NORMAL]      |
+------------------+----------+---------------+
```

### Causal Pathway DAG (using SimpleDAG)
Shows: Input Variables -> Mediators -> CVGG Processing -> Effect Outputs

### Variable Interaction Flow
```text
Bearing Wear ----[+0.92]----> Vibration Amplitude
       |                            |
       |                            v [+0.68]
       |                       Thermal Load
       |                            |
       +----[-0.78]-----> Lubricant <--[-0.55]--+
                          Viscosity
```

---

## Implementation Steps

1. **Update `exampleGenerator.ts`**
   - Extend `CausalEffectExample` interface with new fields
   - Add `inputSignature`, `causalPathway`, and `variableInteractions` to both examples
   - Add helper functions for formatting

2. **Create new sub-components in `CausalExamplesPanel.tsx`**
   - `InputSignatureTable`: Displays sensor patterns with anomaly badges
   - `CausalPathwaySection`: Uses SimpleDAG to visualize the pathway
   - `VariableInteractionFlow`: Shows variable-to-variable causal links

3. **Enhance `CausalEffectCard`**
   - Add collapsible sections for detailed input analysis
   - Integrate SimpleDAG for inline causal pathway visualization
   - Add "Why Fault?" / "Why Normal?" explanation text

4. **Update text explanations**
   - Rewrite `interpretation` and `tbmContext` with clearer cause-effect language
   - Add explicit statements about which input variations cause which output changes

---

## Expected Outcome

After implementation, the Examples panel will clearly show:

1. **What input data variations differentiate Normal from Fault**:
   - Specific sensor amplitude differences (e.g., DE 0.22g vs 0.89g)
   - Rock image feature differences
   - Confounder state differences

2. **How inputs flow through CVGG to produce outputs**:
   - Visual DAG showing Input -> Scalogram -> VGG -> Embedding -> Causal Head -> Effects
   
3. **How causal variables interact**:
   - Bearing Wear -> Vibration -> Thermal -> Lubricant feedback loop (fault case)
   - Thrust -> Cutting Force -> Vibration stable chain (normal case)

4. **Why each output value is what it is**:
   - ATE=0.4231 because high vibration (0.89g vs normal 0.22g) has strong causal effect
   - CATE=0.5872 is higher because fault condition amplifies the effect
   - Direct Effect (0.3918) vs Indirect Effect (0.1954) shows 66% direct mechanical path

