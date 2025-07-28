
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Activity, Zap, Thermometer, Wrench, Droplets } from 'lucide-react';
import { FailureSimulator } from '@/utils/failureSimulator';

interface ActiveFailuresCardProps {
  activeFailures: Array<{id: string, name: string, severity: number, domain: string}>;
  failureSimulator: FailureSimulator;
  onInjectFailure: (failureId: string) => void;
}

const ActiveFailuresCard: React.FC<ActiveFailuresCardProps> = ({ 
  activeFailures, 
  failureSimulator, 
  onInjectFailure 
}) => {
  const getDomainIcon = (domain: string) => {
    switch (domain) {
      case 'hydraulic': return <Droplets className="h-4 w-4" />;
      case 'mechanical': return <Wrench className="h-4 w-4" />;
      case 'thermal': return <Thermometer className="h-4 w-4" />;
      case 'electrical': return <Zap className="h-4 w-4" />;
      case 'cutting': return <Activity className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: number) => {
    if (severity > 0.7) return 'destructive';
    if (severity > 0.4) return 'secondary';
    return 'outline';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          Active Failures
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activeFailures.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              No active failures detected
            </div>
          ) : (
            activeFailures.map((failure) => (
              <div key={failure.id} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-2">
                  {getDomainIcon(failure.domain)}
                  <div>
                    <div className="font-medium">{failure.name}</div>
                    <div className="text-sm text-muted-foreground">{failure.domain} domain</div>
                  </div>
                </div>
                <Badge variant={getSeverityColor(failure.severity) as any}>
                  {(failure.severity * 100).toFixed(0)}%
                </Badge>
              </div>
            ))
          )}
          
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">Inject Failure:</h4>
            <div className="flex gap-2 flex-wrap">
              {failureSimulator.getFailureModes().map((mode) => (
                <Button
                  key={mode.id}
                  size="sm"
                  variant="outline"
                  onClick={() => onInjectFailure(mode.id)}
                  disabled={activeFailures.some(f => f.id === mode.id)}
                >
                  {mode.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActiveFailuresCard;
