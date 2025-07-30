import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CausalRelation, ActiveFailure } from '@/types/industrial';
import { AlertTriangle, ArrowRight, Zap, Clock } from 'lucide-react';

interface FailurePropagationFlowProps {
  activeFailures: ActiveFailure[];
  causalGraph: Map<string, CausalRelation[]>;
  onClearFailures?: () => void;
}

interface PropagationStep {
  id: string;
  sourceFailure: string;
  targetSystem: string;
  strength: number;
  lag: number;
  probability: number;
  domain: string;
  timestamp: Date;
}

const FailurePropagationFlow: React.FC<FailurePropagationFlowProps> = ({ 
  activeFailures = [],
  causalGraph,
  onClearFailures 
}) => {
  // Generate propagation predictions based on active failures and causal graph
  const generatePropagationSteps = (): PropagationStep[] => {
    const steps: PropagationStep[] = [];
    
    activeFailures.forEach(failure => {
      // Find related causal relationships
      causalGraph.forEach((relations, cause) => {
        relations.forEach(relation => {
          // Check if this failure could cause other effects
          if (failure.failure_id.toLowerCase().includes(relation.cause.toLowerCase()) ||
              failure.description.toLowerCase().includes(relation.cause.toLowerCase())) {
            
            const step: PropagationStep = {
              id: `${failure.failure_id}-${relation.effect}`,
              sourceFailure: failure.failure_id,
              targetSystem: relation.effect,
              strength: relation.strength,
              lag: relation.lag,
              probability: Math.min(0.95, relation.strength * 0.8 + Math.random() * 0.2),
              domain: relation.domain_bridge ? 'cross-domain' : 'same-domain',
              timestamp: new Date(Date.now() + relation.lag * 1000)
            };
            steps.push(step);
          }
        });
      });
    });
    
    return steps.sort((a, b) => a.lag - b.lag);
  };

  const propagationSteps = generatePropagationSteps();
  
  // Group steps by severity
  const criticalSteps = propagationSteps.filter(step => step.probability > 0.7);
  const warningSteps = propagationSteps.filter(step => step.probability > 0.4 && step.probability <= 0.7);
  const lowRiskSteps = propagationSteps.filter(step => step.probability <= 0.4);

  const getSeverityColor = (probability: number) => {
    if (probability > 0.7) return 'text-red-600 dark:text-red-400';
    if (probability > 0.4) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getSeverityBadge = (probability: number) => {
    if (probability > 0.7) return 'destructive';
    if (probability > 0.4) return 'secondary';
    return 'outline';
  };

  const formatFailureId = (id: string) => {
    return id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getTimeToPropagation = (lag: number) => {
    if (lag < 60) return `${lag.toFixed(0)}s`;
    if (lag < 3600) return `${(lag / 60).toFixed(1)}m`;
    return `${(lag / 3600).toFixed(1)}h`;
  };

  const calculateRiskScore = () => {
    return propagationSteps.reduce((score, step) => score + step.probability * step.strength, 0);
  };

  const riskScore = calculateRiskScore();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Failure Propagation Flow
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Risk Score: {riskScore.toFixed(2)}
            </Badge>
            {onClearFailures && activeFailures.length > 0 && (
              <Button variant="outline" size="sm" onClick={onClearFailures}>
                Clear All
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Current Active Failures */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Current Active Failures ({activeFailures.length})
            </h4>
            {activeFailures.length === 0 ? (
              <div className="text-center text-muted-foreground py-4 bg-muted rounded-md">
                No active failures detected
              </div>
            ) : (
              <div className="space-y-2">
                {activeFailures.map(failure => (
                  <div key={failure.failure_id} className="flex items-center justify-between p-3 border rounded-md bg-muted">
                    <div>
                      <div className="font-medium">{formatFailureId(failure.failure_id)}</div>
                      <div className="text-sm text-muted-foreground">{failure.description}</div>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive" className="text-xs">
                        Severity: {failure.severity.toFixed(1)}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        Duration: {((Date.now() - failure.timestamp.getTime()) / 1000 / 60).toFixed(0)}m
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Propagation Predictions */}
          {propagationSteps.length > 0 && (
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Predicted Propagation Timeline
              </h4>
              
              {/* Critical Propagations */}
              {criticalSteps.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                    Critical Risk ({criticalSteps.length})
                  </h5>
                  <div className="space-y-2">
                    {criticalSteps.slice(0, 5).map(step => (
                      <div key={step.id} className="flex items-center p-3 border-l-4 border-red-500 bg-red-50 dark:bg-red-950 rounded-r-md">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{formatFailureId(step.sourceFailure)}</span>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            <span>{step.targetSystem}</span>
                            {step.domain === 'cross-domain' && (
                              <Badge variant="outline" className="text-xs">Cross-Domain</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            ETA: {getTimeToPropagation(step.lag)} | Strength: {step.strength.toFixed(2)}
                          </div>
                        </div>
                        <Badge variant={getSeverityBadge(step.probability)} className="text-xs">
                          {(step.probability * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warning Propagations */}
              {warningSteps.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-2">
                    Medium Risk ({warningSteps.length})
                  </h5>
                  <div className="space-y-2">
                    {warningSteps.slice(0, 3).map(step => (
                      <div key={step.id} className="flex items-center p-3 border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950 rounded-r-md">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{formatFailureId(step.sourceFailure)}</span>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            <span>{step.targetSystem}</span>
                            {step.domain === 'cross-domain' && (
                              <Badge variant="outline" className="text-xs">Cross-Domain</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            ETA: {getTimeToPropagation(step.lag)} | Strength: {step.strength.toFixed(2)}
                          </div>
                        </div>
                        <Badge variant={getSeverityBadge(step.probability)} className="text-xs">
                          {(step.probability * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Low Risk Propagations */}
              {lowRiskSteps.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">
                    Low Risk ({lowRiskSteps.length})
                  </h5>
                  <div className="space-y-1">
                    {lowRiskSteps.slice(0, 2).map(step => (
                      <div key={step.id} className="flex items-center p-2 border-l-4 border-green-500 bg-green-50 dark:bg-green-950 rounded-r-md">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-sm">
                            <span>{formatFailureId(step.sourceFailure)}</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <span>{step.targetSystem}</span>
                          </div>
                        </div>
                        <Badge variant={getSeverityBadge(step.probability)} className="text-xs">
                          {(step.probability * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Summary Statistics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
            <div className="text-center p-3 bg-muted rounded-md">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {criticalSteps.length}
              </div>
              <div className="text-xs text-muted-foreground">Critical Risks</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-md">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {warningSteps.length}
              </div>
              <div className="text-xs text-muted-foreground">Medium Risks</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-md">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {lowRiskSteps.length}
              </div>
              <div className="text-xs text-muted-foreground">Low Risks</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-md">
              <div className="text-2xl font-bold text-primary">
                {propagationSteps.filter(s => s.domain === 'cross-domain').length}
              </div>
              <div className="text-xs text-muted-foreground">Cross-Domain</div>
            </div>
          </div>

          {propagationSteps.length === 0 && activeFailures.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <div className="text-lg font-medium">No Propagation Risks</div>
              <div className="text-sm">System is operating normally with no predicted failure propagation</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FailurePropagationFlow;