import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ClassificationHeatmapProps {
  classificationLogits?: number[];
  predictions?: { [key: string]: number };
  timestamp?: Date;
}

const ClassificationHeatmap: React.FC<ClassificationHeatmapProps> = ({ 
  classificationLogits = [],
  predictions = {},
  timestamp 
}) => {
  const faultTypes = ['Normal', 'Hydraulic Failure', 'Mechanical Wear', 'Thermal Issue', 'Electrical Fault'];
  
  // Convert logits to probabilities using softmax
  const softmax = (logits: number[]) => {
    if (logits.length === 0) return [];
    const maxLogit = Math.max(...logits);
    const expLogits = logits.map(x => Math.exp(x - maxLogit));
    const sumExp = expLogits.reduce((a, b) => a + b, 0);
    return expLogits.map(x => x / sumExp);
  };

  const probabilities = classificationLogits.length > 0 
    ? softmax(classificationLogits) 
    : faultTypes.map(() => 0.2); // Default equal probabilities

  const getConfidenceColor = (prob: number) => {
    if (prob < 0.2) return 'bg-slate-100 dark:bg-slate-800';
    if (prob < 0.4) return 'bg-blue-200 dark:bg-blue-900';
    if (prob < 0.6) return 'bg-yellow-300 dark:bg-yellow-700';
    if (prob < 0.8) return 'bg-orange-400 dark:bg-orange-600';
    return 'bg-red-500 dark:bg-red-600';
  };

  const getTextColor = (prob: number) => {
    return prob > 0.6 ? 'text-white' : 'text-slate-900 dark:text-slate-100';
  };

  const maxProbIndex = probabilities.indexOf(Math.max(...probabilities));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Classification Confidence Heatmap
          {timestamp && (
            <Badge variant="outline" className="text-xs">
              {timestamp.toLocaleTimeString()}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {faultTypes.map((fault, index) => {
            const probability = probabilities[index] || 0;
            const isHighest = index === maxProbIndex;
            
            return (
              <div key={fault} className="relative">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${isHighest ? 'text-primary' : 'text-muted-foreground'}`}>
                    {fault}
                  </span>
                  <span className={`text-sm ${isHighest ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                    {(probability * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="relative h-8 rounded-md overflow-hidden border">
                  <div 
                    className={`h-full transition-all duration-500 ${getConfidenceColor(probability)}`}
                    style={{ width: `${probability * 100}%` }}
                  />
                  <div className={`absolute inset-0 flex items-center px-2 text-xs font-medium ${getTextColor(probability)}`}>
                    {probability > 0.1 && `${(probability * 100).toFixed(1)}%`}
                  </div>
                  {isHighest && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <Badge variant="default" className="text-xs">Predicted</Badge>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 p-3 bg-muted rounded-md">
          <div className="text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Confidence Level:</span>
              <span className="font-medium">
                {probabilities.length > 0 ? `${(Math.max(...probabilities) * 100).toFixed(1)}%` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Entropy:</span>
              <span className="font-medium">
                {probabilities.length > 0 
                  ? (-probabilities.reduce((sum, p) => sum + (p > 0 ? p * Math.log2(p) : 0), 0)).toFixed(2)
                  : 'N/A'
                }
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClassificationHeatmap;