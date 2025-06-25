
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CausalRelation } from '@/types/industrial';

interface CausalGraphCardProps {
  causalGraph: Map<string, CausalRelation[]>;
}

const CausalGraphCard: React.FC<CausalGraphCardProps> = ({ causalGraph }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Discovered Causal Relationships</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {causalGraph.size === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              Causal discovery in progress... (need more data)
            </div>
          ) : (
            Array.from(causalGraph.entries()).map(([cause, relations]) => (
              relations.map((relation, index) => (
                <div key={`${cause}-${index}`} className="flex items-center justify-between p-2 border rounded text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{relation.cause}</span>
                    <span>→</span>
                    <span>{relation.effect}</span>
                    {relation.domain_bridge && (
                      <Badge variant="outline" className="text-xs">cross-domain</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      Strength: {relation.strength.toFixed(2)}
                    </span>
                    <span className="text-muted-foreground">
                      Lag: {relation.lag.toFixed(1)}s
                    </span>
                  </div>
                </div>
              ))
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CausalGraphCard;
