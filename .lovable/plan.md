

# Plan: Verify & Fix CVGG→do()/What-If Data Flow + NaN Elimination

## Problem Analysis

After thorough code inspection, I identified several root causes for persistent NaN values and data flow issues:

### Bug 1: Workflow indicator stage name mismatch
In `OperationResultsPanel.tsx` line 961, the check uses `stage.stage === 'Intervention'` but the actual stage name in `resultsStorage.ts` is `'do() Intervention'`. Same issue for `'Counterfactual'` — it matches but `'Prescriptive'` doesn't match `'Prescriptive AI'`. This means the workflow guide never lights up steps 5/7 correctly.

### Bug 2: `latest()` returns first match, but results are stored newest-first via `unshift()`
The `latest()` function uses `results.find()` which returns the **first** (newest) result — this is correct. No bug here.

### Bug 3: CVGG data not reaching do()/What-If engines properly
The `cvggResult` is passed as an optional parameter. When it's `null` (user hasn't run inference yet), the engines use fallback values (`0.75` confidence, `0.2` ATE). However, the **core theoretical issue** is:
- **do() and What-If can run without CVGG**, but their results are less accurate (use hardcoded coefficients instead of learned ones)
- **CVGG provides ATE/CATE** which should calibrate the intervention/counterfactual effect magnitudes
- Currently, the `calculateDirectEffect` in counterfactualEngine uses `cvggResult?.causalEffects?.ATE` as the base effect — this is correct architecture

### Bug 4: `intRiskDelta` can produce misleading display
`riskDelta = postInterventionRisk - preInterventionRisk`. When both risks are computed from a state where no failure is injected, the delta is often 0 or very small, producing `0.0%` rather than NaN — but if `safeFixed` receives a value like `0.0 * 100 = 0`, it shows `0.0%` which looks like "no result."

### Bug 5: Explanation generator has unguarded division
In `causalInterventionEngine.ts` line 459: `Math.abs(((newValue - currentValue) / currentValue) * 100)` — if `currentValue` is 0, this produces `NaN` or `Infinity` in the explanation text even though the main computation is guarded.

## Implementation Plan

### 1. Fix workflow stage name matching in OperationResultsPanel
Update the `completedSteps` logic (lines 958-966) to match actual stage names: `'do() Intervention'`, `'Prescriptive AI'`.

### 2. Guard explanation generator against division by zero
In `causalInterventionEngine.ts` `generateExplanation()`, add safe division check for `changePct` calculation.

### 3. Add CVGG data flow validation layer
Create a validation step in both engines that:
- Checks if `cvggResult` is present and logs a diagnostic warning if missing
- When CVGG provides ATE/CATE, scale the intervention coefficients by the learned effects
- Display a visible indicator in the do()/What-If panels showing whether CVGG data is being used ("CVGG-calibrated" vs "Domain-knowledge only")

### 4. Add CVGG data source indicator to do()/What-If panels
Show a badge/indicator in `CausalInterventionPanel` and `CounterfactualQueryPanel` that tells users:
- Whether CVGG inference has been run
- Whether the results are CVGG-calibrated or using fallback coefficients
- What the CVGG-provided ATE value is (if available)

### 5. Fix Results Summary to show meaningful values when data exists
- Ensure `intRiskDelta` display distinguishes between "0.0% (computed, no change)" and "--" (not run)
- Add the CVGG calibration status to the Causal Effects Comparison table
- Wrap all remaining unguarded arithmetic in the explanation templates with safe helpers

### Files to modify:
- `src/components/OperationResultsPanel.tsx` — fix stage name matching, add calibration column
- `src/utils/causalInterventionEngine.ts` — guard explanation generator, add CVGG calibration indicator
- `src/utils/counterfactualEngine.ts` — add CVGG calibration indicator
- `src/components/CausalInterventionPanel.tsx` — show CVGG data source badge
- `src/components/CounterfactualQueryPanel.tsx` — show CVGG data source badge
- `src/utils/resultsStorage.ts` — add calibration status to summary tables

