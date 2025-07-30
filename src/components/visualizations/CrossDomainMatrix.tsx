import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CausalRelation } from '@/types/industrial';

interface CrossDomainMatrixProps {
  causalGraph: Map<string, CausalRelation[]>;
}

const CrossDomainMatrix: React.FC<CrossDomainMatrixProps> = ({ causalGraph }) => {
  const domains = ['hydraulic', 'mechanical', 'thermal', 'electrical', 'cutting'];
  
  // Extract cross-domain relationships
  const buildInfluenceMatrix = () => {
    const matrix: number[][] = domains.map(() => domains.map(() => 0));
    const relationshipDetails: { [key: string]: CausalRelation[] } = {};
    
    causalGraph.forEach((relations, cause) => {
      relations.forEach(relation => {
        if (relation.domain_bridge) {
          // Extract domain from sensor names (assuming format like "hydraulic_pressure")
          const causeDomain = domains.find(d => relation.cause.toLowerCase().includes(d)) || 'unknown';
          const effectDomain = domains.find(d => relation.effect.toLowerCase().includes(d)) || 'unknown';
          
          const causeIdx = domains.indexOf(causeDomain);
          const effectIdx = domains.indexOf(effectDomain);
          
          if (causeIdx !== -1 && effectIdx !== -1 && causeIdx !== effectIdx) {
            matrix[causeIdx][effectIdx] += relation.strength;
            const key = `${causeDomain}-${effectDomain}`;
            if (!relationshipDetails[key]) relationshipDetails[key] = [];
            relationshipDetails[key].push(relation);
          }
        }
      });
    });
    
    return { matrix, relationshipDetails };
  };

  const { matrix, relationshipDetails } = buildInfluenceMatrix();
  
  // Calculate maximum influence for normalization
  const maxInfluence = Math.max(...matrix.flat());
  
  const getInfluenceColor = (value: number) => {
    if (value === 0) return 'bg-slate-100 dark:bg-slate-800';
    const intensity = maxInfluence > 0 ? value / maxInfluence : 0;
    
    if (intensity < 0.2) return 'bg-blue-100 dark:bg-blue-900';
    if (intensity < 0.4) return 'bg-blue-200 dark:bg-blue-800';
    if (intensity < 0.6) return 'bg-yellow-300 dark:bg-yellow-700';
    if (intensity < 0.8) return 'bg-orange-400 dark:bg-orange-600';
    return 'bg-red-500 dark:bg-red-600';
  };

  const getTextColor = (value: number) => {
    const intensity = maxInfluence > 0 ? value / maxInfluence : 0;
    return intensity > 0.6 ? 'text-white' : 'text-slate-900 dark:text-slate-100';
  };

  const formatDomainName = (domain: string) => {
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  };

  // Calculate domain statistics
  const getDomainStats = () => {
    return domains.map((domain, idx) => {
      const outgoingInfluence = matrix[idx].reduce((sum, val) => sum + val, 0);
      const incomingInfluence = matrix.reduce((sum, row) => sum + row[idx], 0);
      const totalConnections = matrix[idx].filter(val => val > 0).length + 
                              matrix.filter(row => row[idx] > 0).length;
      
      return {
        domain,
        outgoing: outgoingInfluence,
        incoming: incomingInfluence,
        connections: totalConnections,
        netInfluence: outgoingInfluence - incomingInfluence
      };
    });
  };

  const domainStats = getDomainStats();
  const totalCrossDomainRelations = Object.values(relationshipDetails).flat().length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Cross-Domain Causal Influence Matrix
          <Badge variant="outline" className="text-xs">
            {totalCrossDomainRelations} cross-domain relations
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Influence Matrix */}
          <div className="overflow-x-auto">
            <div className="min-w-[500px]">
              {/* Header */}
              <div className="grid grid-cols-6 gap-1 mb-2">
                <div></div>
                {domains.map(domain => (
                  <div key={domain} className="text-xs font-medium text-center p-2">
                    {formatDomainName(domain)}
                  </div>
                ))}
              </div>
              
              {/* Matrix Rows */}
              {domains.map((rowDomain, rowIdx) => (
                <div key={rowDomain} className="grid grid-cols-6 gap-1 mb-1">
                  <div className="text-xs font-medium p-2 text-right">
                    {formatDomainName(rowDomain)}
                  </div>
                  {domains.map((colDomain, colIdx) => {
                    const value = matrix[rowIdx][colIdx];
                    const key = `${rowDomain}-${colDomain}`;
                    const relations = relationshipDetails[key] || [];
                    
                    return (
                      <div
                        key={colDomain}
                        className={`relative h-12 rounded border transition-all duration-200 hover:scale-105 cursor-pointer ${getInfluenceColor(value)}`}
                        title={`${formatDomainName(rowDomain)} → ${formatDomainName(colDomain)}: ${value.toFixed(3)}\n${relations.length} relations`}
                      >
                        <div className={`absolute inset-0 flex items-center justify-center text-xs font-medium ${getTextColor(value)}`}>
                          {value > 0.01 ? value.toFixed(2) : rowIdx === colIdx ? '—' : ''}
                        </div>
                        {relations.length > 0 && (
                          <div className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full opacity-70"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-slate-100 dark:bg-slate-800 rounded border"></div>
              <span>No Influence</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-200 dark:bg-blue-800 rounded border"></div>
              <span>Low</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-300 dark:bg-yellow-700 rounded border"></div>
              <span>Medium</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 dark:bg-red-600 rounded border"></div>
              <span>High</span>
            </div>
          </div>

          {/* Domain Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Domain Influence Rankings</h4>
              <div className="space-y-2">
                {domainStats
                  .sort((a, b) => b.outgoing - a.outgoing)
                  .map((stat, idx) => (
                    <div key={stat.domain} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">#{idx + 1}</Badge>
                        <span className="font-medium">{formatDomainName(stat.domain)}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Out: {stat.outgoing.toFixed(2)} | In: {stat.incoming.toFixed(2)}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Key Insights</h4>
              <div className="space-y-2 text-sm">
                <div className="p-2 bg-muted rounded">
                  <div className="font-medium">Most Influential Domain</div>
                  <div className="text-muted-foreground">
                    {formatDomainName(domainStats.reduce((max, curr) => curr.outgoing > max.outgoing ? curr : max).domain)}
                  </div>
                </div>
                <div className="p-2 bg-muted rounded">
                  <div className="font-medium">Most Affected Domain</div>
                  <div className="text-muted-foreground">
                    {formatDomainName(domainStats.reduce((max, curr) => curr.incoming > max.incoming ? curr : max).domain)}
                  </div>
                </div>
                <div className="p-2 bg-muted rounded">
                  <div className="font-medium">Total Cross-Domain Effects</div>
                  <div className="text-muted-foreground">
                    {matrix.flat().reduce((sum, val) => sum + val, 0).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CrossDomainMatrix;