import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BookOpen,
  FlaskConical,
  Shield,
  ChevronRight,
  Play,
  Cpu
} from 'lucide-react';
import { SensorReading } from '@/types/industrial';
import {
  CausalDatasetVerifier,
  CausalVerificationSuite,
  VerificationResult,
  PhysicsGrounding,
  PHYSICS_GROUNDINGS,
  generateCausalEvidenceExamples,
  CausalEvidence
} from '@/utils/causalDatasetVerification';
import { InferenceResult } from '@/hooks/useEnhancedCVGG';

interface CausalVerificationPanelProps {
  sensorData: SensorReading[];
  isRunning: boolean;
  cvggResult?: InferenceResult | null;
}

interface CVGGCheck {
  name: string;
  passed: boolean;
  value: string;
  rationale: string;
}

function verifyCVGGResult(r: InferenceResult): { checks: CVGGCheck[]; passed: number; total: number } {
  const { ATE, CATE, directEffect, indirectEffect } = r.causalEffects;
  const decompErr = Math.abs((directEffect + indirectEffect) - ATE);
  const isNormal = r.classification.className === 'Normal';
  const conf = r.classification.confidence;
  const checks: CVGGCheck[] = [
    {
      name: 'Non-trivial ATE',
      passed: Math.abs(ATE) > 0.01,
      value: `ATE = ${ATE.toFixed(4)}`,
      rationale: 'A genuine causal model must produce a measurable do-effect, not zero.'
    },
    {
      name: 'Mediation decomposition consistency (ATE ≈ Direct + Indirect)',
      passed: decompErr < 0.15 * Math.max(Math.abs(ATE), 0.05),
      value: `|Δ| = ${decompErr.toFixed(4)} (Direct=${directEffect.toFixed(3)}, Indirect=${indirectEffect.toFixed(3)})`,
      rationale: 'Pearl mediation: total effect = direct + indirect; large gap → ill-formed pathway.'
    },
    {
      name: 'CATE heterogeneity (CATE ≠ ATE)',
      passed: Math.abs(CATE - ATE) > 1e-3,
      value: `CATE − ATE = ${(CATE - ATE).toFixed(4)}`,
      rationale: 'Cheat-sheet models output identical CATE/ATE; real conditioning shifts the estimate.'
    },
    {
      name: 'Confidence in plausible range (not 1.0)',
      passed: conf > 0.4 && conf < 0.999,
      value: `confidence = ${(conf * 100).toFixed(1)}%`,
      rationale: 'Exactly 1.0 indicates overfitting or label leakage; <0.4 indicates under-trained.'
    },
    {
      name: 'Anomaly score consistent with class',
      passed: isNormal ? r.anomalyScore < 0.5 : r.anomalyScore > 0.3,
      value: `anomaly = ${r.anomalyScore.toFixed(3)}, class = ${r.classification.className}`,
      rationale: 'Independent anomaly head must agree with classification — guards against label cheating.'
    },
    {
      name: 'Real inference latency (> 0 ms)',
      passed: r.processingTimeMs > 0,
      value: `t = ${r.processingTimeMs.toFixed(1)} ms`,
      rationale: 'Zero latency would imply a cached/pre-baked answer rather than live forward-pass.'
    }
  ];
  return { checks, passed: checks.filter(c => c.passed).length, total: checks.length };
}

const CausalVerificationPanel: React.FC<CausalVerificationPanelProps> = ({
  sensorData,
  isRunning,
  cvggResult
}) => {
  const [verifier] = useState(() => new CausalDatasetVerifier());
  const [verificationResult, setVerificationResult] = useState<CausalVerificationSuite | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [dataCollected, setDataCollected] = useState(0);

  useEffect(() => {
    if (sensorData.length > 0) {
      verifier.addData(sensorData);
      setDataCollected(prev => prev + 1);
    }
  }, [sensorData, verifier]);

  const runVerification = () => {
    setIsVerifying(true);
    setTimeout(() => {
      const result = verifier.runFullVerification();
      setVerificationResult(result);
      setIsVerifying(false);
    }, 500);
  };

  const physicsGroundings = PHYSICS_GROUNDINGS;
  const evidenceExamples = generateCausalEvidenceExamples();

  return (
    <div className="space-y-4">
      {/* Header with Verification Status */}
      <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-primary" />
              Causal Dataset Verification
            </CardTitle>
            <Badge variant={verificationResult?.passedTests === verificationResult?.totalTests ? "default" : "secondary"}>
              {dataCollected} live samples streamed
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            This panel provides evidence to refute the criticism that the IMSCHM causality dataset
            is a "cheat-sheet trick". The verification suite tests for realistic causal properties.
          </p>

          {/* Sample-source explanation */}
          <div className="mb-4 p-3 rounded-md border border-primary/20 bg-background/60 text-xs space-y-2">
            <div className="flex items-center gap-2 font-semibold text-primary">
              <BookOpen className="h-3.5 w-3.5" />
              Where do these samples come from?
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Samples are <span className="font-medium text-foreground">streamed live from the running
              project simulation</span> (physics + failure-injection pipeline in this app), <span className="font-medium">not</span> from
              an uploaded file. Each tick of the monitor pushes one multi-sensor reading
              (<code className="px-1 rounded bg-muted">SensorReading[]</code>) into the verifier's rolling buffer.
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
              <li><span className="text-foreground font-medium">Source:</span> in-app simulator (Simulate → Inject Fault stages)</li>
              <li><span className="text-foreground font-medium">Rate:</span> 1 sample per sensor update tick</li>
              <li><span className="text-foreground font-medium">Minimum:</span> 50 samples needed to compute lag-correlations &amp; partial-correlation statistics reliably</li>
              <li><span className="text-foreground font-medium">Status:</span> {isRunning
                ? <span className="text-green-500 font-medium">● Live — collecting from active simulation</span>
                : <span className="text-amber-500 font-medium">● Paused — start the monitor to collect more</span>}</li>
            </ul>
            <p className="text-[11px] text-muted-foreground/80 italic">
              Uploaded CSV/JSON datasets are not currently wired into this verifier; this keeps verification
              tied to the same ground-truth physics the rest of the pipeline uses.
            </p>
          </div>

          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Buffer fill</span>
            <span className="font-mono">{Math.min(dataCollected, 50)}/50 min · {dataCollected} total</span>
          </div>
          <Progress value={Math.min(100, (dataCollected / 50) * 100)} className="h-1.5 mb-3" />

          <Button
            onClick={runVerification}
            disabled={isVerifying || dataCollected < 50}
            className="w-full"
          >
            {isVerifying ? (
              <>Running Verification...</>
            ) : dataCollected < 50 ? (
              <>
                <Play className="h-4 w-4 mr-2" />
                {isRunning
                  ? `Collecting from live simulation… need ${50 - dataCollected} more`
                  : `Start the monitor to collect ${50 - dataCollected} more samples`}
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Verification Suite on {dataCollected} live samples
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="verification" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="verification">
            <FlaskConical className="h-4 w-4 mr-1" />
            Data Tests
          </TabsTrigger>
          <TabsTrigger value="cvgg">
            <Cpu className="h-4 w-4 mr-1" />
            CVGG {cvggResult ? <span className="ml-1 h-1.5 w-1.5 rounded-full bg-green-500 inline-block" /> : <span className="ml-1 h-1.5 w-1.5 rounded-full bg-muted-foreground/40 inline-block" />}
          </TabsTrigger>
          <TabsTrigger value="physics">
            <BookOpen className="h-4 w-4 mr-1" />
            Physics
          </TabsTrigger>
          <TabsTrigger value="evidence">
            <Shield className="h-4 w-4 mr-1" />
            Evidence
          </TabsTrigger>
        </TabsList>

        {/* CVGG Results Verification Tab */}
        <TabsContent value="cvgg" className="mt-4">
          {cvggResult ? (() => {
            const { checks, passed, total } = verifyCVGGResult(cvggResult);
            const allPass = passed === total;
            return (
              <div className="space-y-4">
                <Card className={allPass ? "border-green-500/50 bg-green-500/5" : "border-yellow-500/50 bg-yellow-500/5"}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-primary" />
                        CVGG Inference Verification
                      </span>
                      <span className="text-lg font-bold">{passed}/{total}</span>
                    </div>
                    <Progress value={(passed / total) * 100} className="h-2 mb-2" />
                    <p className="text-xs text-muted-foreground">
                      Verifies that the last EnhancedCVGG inference produced internally-consistent,
                      non-trivial causal outputs (ATE, mediation decomposition, CATE heterogeneity,
                      confidence calibration, anomaly–class agreement, real forward-pass latency).
                    </p>
                    <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                      <Badge variant="outline">Class: {cvggResult.classification.className}</Badge>
                      <Badge variant="outline">ATE: {cvggResult.causalEffects.ATE.toFixed(3)}</Badge>
                      <Badge variant="outline">CATE: {cvggResult.causalEffects.CATE.toFixed(3)}</Badge>
                      <Badge variant="outline">Latency: {cvggResult.processingTimeMs.toFixed(1)} ms</Badge>
                    </div>
                  </CardContent>
                </Card>

                <ScrollArea className="h-[380px]">
                  <div className="space-y-3">
                    {checks.map((c, i) => (
                      <Card key={i} className={c.passed ? "border-green-500/30" : "border-red-500/30"}>
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-3">
                            {c.passed
                              ? <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                              : <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-sm">{c.name}</h4>
                                <Badge variant={c.passed ? "default" : "destructive"} className="text-xs">
                                  {c.passed ? "PASSED" : "FAILED"}
                                </Badge>
                              </div>
                              <div className="mt-2 p-2 bg-muted/50 rounded text-xs font-mono">{c.value}</div>
                              <p className="text-xs text-muted-foreground mt-2">{c.rationale}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            );
          })() : (
            <Card className="bg-muted/30">
              <CardContent className="pt-6 text-center space-y-3">
                <Cpu className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="text-sm font-medium">No CVGG inference result yet</p>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Switch to the <span className="font-semibold text-foreground">CVGG</span> tab, then run
                  <span className="font-semibold text-foreground"> Initialize → Train → Inference</span>.
                  When CVGG completes a forward pass, its <span className="font-mono">{`{ATE, CATE, direct, indirect, anomalyScore}`}</span> output
                  becomes available here and this tab will automatically run six structural checks against it
                  (alongside the data-level tests in the <span className="font-semibold text-foreground">Data Tests</span> tab).
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>


        {/* Verification Tests Tab */}
        <TabsContent value="verification" className="mt-4">
          {verificationResult ? (
            <div className="space-y-4">
              {/* Summary */}
              <Card className={verificationResult.passedTests === verificationResult.totalTests 
                ? "border-green-500/50 bg-green-500/5" 
                : "border-yellow-500/50 bg-yellow-500/5"}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Verification Score</span>
                    <span className="text-lg font-bold">
                      {verificationResult.passedTests}/{verificationResult.totalTests}
                    </span>
                  </div>
                  <Progress 
                    value={(verificationResult.passedTests / verificationResult.totalTests) * 100} 
                    className="h-2 mb-2"
                  />
                  <p className="text-sm text-muted-foreground">
                    {verificationResult.conclusion}
                  </p>
                </CardContent>
              </Card>

              {/* Individual Test Results */}
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {verificationResult.results.map((result, idx) => (
                    <TestResultCard key={idx} result={result} />
                  ))}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <Card className="bg-muted/30">
              <CardContent className="pt-6 text-center">
                <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-sm">
                  {dataCollected < 50
                    ? <>Streaming from the <span className="font-medium text-foreground">live in-app simulator</span> — {dataCollected}/50 samples buffered. {isRunning ? 'Simulation is running.' : 'Start the monitor to continue collecting.'}</>
                    : "Click 'Run Verification Suite' to test dataset realism on the live-streamed samples."
                  }
                </p>
                {dataCollected < 50 && (
                  <Progress value={(dataCollected / 50) * 100} className="h-1 mt-4 max-w-xs mx-auto" />
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Physics Groundings Tab */}
        <TabsContent value="physics" className="mt-4">
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {physicsGroundings.map((grounding, idx) => (
                <PhysicsGroundingCard key={idx} grounding={grounding} index={idx + 1} />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Evidence Examples Tab */}
        <TabsContent value="evidence" className="mt-4">
          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              <Card className="bg-primary/5 border-primary/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Why This Is NOT a Cheat-Sheet</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <p>A "cheat-sheet" approach would:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Show perfect correlations (r=1.0) for all causal links</li>
                    <li>Have no time delays between cause and effect</li>
                    <li>Show no spurious correlations from confounders</li>
                    <li>Treat do(X) and observe(X) identically</li>
                  </ul>
                  <p className="font-medium text-primary mt-4">Our simulation:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Adds stochastic noise (5% CV)</li>
                    <li>Models realistic time lags (thermal inertia, etc.)</li>
                    <li>Includes hidden confounders (ambient temperature)</li>
                    <li>Properly implements do-calculus edge breaking</li>
                  </ul>
                </CardContent>
              </Card>

              {evidenceExamples.map((evidence, idx) => (
                <EvidenceCard key={idx} evidence={evidence} index={idx + 1} />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Sub-components
const TestResultCard: React.FC<{ result: VerificationResult }> = ({ result }) => (
  <Card className={result.passed ? "border-green-500/30" : "border-red-500/30"}>
    <CardContent className="pt-4">
      <div className="flex items-start gap-3">
        {result.passed ? (
          <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
        ) : (
          <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">{result.testName}</h4>
            <Badge variant={result.passed ? "default" : "destructive"} className="text-xs">
              {result.passed ? "PASSED" : "FAILED"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{result.description}</p>
          <div className="mt-2 p-2 bg-muted/50 rounded text-xs font-mono">
            {result.evidence}
          </div>
          {Object.keys(result.statistics).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.entries(result.statistics).slice(0, 4).map(([key, value]) => (
                <Badge key={key} variant="outline" className="text-xs">
                  {key}: {typeof value === 'number' ? value.toFixed(3) : value}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

const PhysicsGroundingCard: React.FC<{ grounding: PhysicsGrounding; index: number }> = ({ 
  grounding, 
  index 
}) => (
  <Card>
    <CardContent className="pt-4">
      <div className="flex items-start gap-3">
        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
          {index}
        </div>
        <div className="flex-1">
          <Badge variant="secondary" className="mb-2">{grounding.domain}</Badge>
          <div className="font-mono text-sm bg-muted/50 p-2 rounded mb-2">
            {grounding.equation}
          </div>
          <p className="text-sm font-medium">{grounding.physicalLaw}</p>
          <p className="text-xs text-muted-foreground mt-1">
            <BookOpen className="h-3 w-3 inline mr-1" />
            {grounding.reference}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
);

const EvidenceCard: React.FC<{ evidence: CausalEvidence; index: number }> = ({ 
  evidence, 
  index 
}) => (
  <Card>
    <CardContent className="pt-4">
      <div className="flex items-start gap-3">
        <div className="h-6 w-6 rounded-full bg-accent/10 flex items-center justify-center text-xs font-bold text-accent-foreground flex-shrink-0">
          {index}
        </div>
        <div className="flex-1 space-y-2">
          <h4 className="font-medium text-sm">{evidence.scenario}</h4>
          
          <div className="space-y-1 text-xs">
            <div className="flex items-start gap-2">
              <ChevronRight className="h-3 w-3 mt-0.5 text-muted-foreground" />
              <div>
                <span className="font-medium">Hypothesis:</span>
                <span className="text-muted-foreground ml-1">{evidence.hypothesis}</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <ChevronRight className="h-3 w-3 mt-0.5 text-muted-foreground" />
              <div>
                <span className="font-medium">Experiment:</span>
                <span className="text-muted-foreground ml-1">{evidence.experiment}</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <ChevronRight className="h-3 w-3 mt-0.5 text-muted-foreground" />
              <div>
                <span className="font-medium">Observation:</span>
                <span className="text-muted-foreground ml-1">{evidence.observation}</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <ChevronRight className="h-3 w-3 mt-0.5 text-green-500" />
              <div>
                <span className="font-medium text-green-600">Conclusion:</span>
                <span className="ml-1">{evidence.conclusion}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-3 p-2 bg-green-500/10 border border-green-500/30 rounded text-xs">
            <Shield className="h-3 w-3 inline mr-1 text-green-500" />
            <span className="font-medium">Refutes "Cheat-Sheet":</span>
            <span className="text-muted-foreground ml-1">{evidence.refutesTrick}</span>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default CausalVerificationPanel;
