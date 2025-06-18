
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CausalAnomaliesCardProps {
  anomalies: Array<{sensor: string, anomaly_score: number}>;
}

const CausalAnomaliesCard: React.FC<CausalAnomaliesCardProps> = ({ anomalies }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Causal Anomalies</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {anomalies.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              No causal anomalies detected
            </div>
          ) : (
            anomalies.map((anomaly, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium">{anomaly.sensor}</div>
                  <div className="text-sm text-muted-foreground">
                    Causal expectation violated
                  </div>
                </div>
                <Badge variant={anomaly.anomaly_score > 0.7 ? 'destructive' : 'secondary'}>
                  {(anomaly.anomaly_score * 100).toFixed(0)}%
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CausalAnomaliesCard;
