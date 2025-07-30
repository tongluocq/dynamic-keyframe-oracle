import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Badge } from '@/components/ui/badge';

interface TrainingMetric {
  epoch: number;
  train_loss: number;
  val_loss: number;
  train_acc: number;
  val_acc: number;
  train_causal_effect: number;
  val_causal_effect: number;
}

interface CausalEffectEvolutionProps {
  trainingMetrics?: TrainingMetric[];
  realtimeCausalEffect?: number;
  isTraining?: boolean;
}

const CausalEffectEvolution: React.FC<CausalEffectEvolutionProps> = ({ 
  trainingMetrics = [],
  realtimeCausalEffect = 0,
  isTraining = false 
}) => {
  // Generate sample data if no training metrics available
  const defaultMetrics: TrainingMetric[] = Array.from({ length: 10 }, (_, i) => ({
    epoch: i + 1,
    train_loss: 0.8 - (i * 0.05) + Math.random() * 0.1,
    val_loss: 0.85 - (i * 0.04) + Math.random() * 0.1,
    train_acc: 0.6 + (i * 0.03) + Math.random() * 0.05,
    val_acc: 0.58 + (i * 0.032) + Math.random() * 0.05,
    train_causal_effect: Math.sin(i * 0.5) * 0.3 + Math.random() * 0.1,
    val_causal_effect: Math.sin(i * 0.5) * 0.25 + Math.random() * 0.08,
  }));

  const data = trainingMetrics.length > 0 ? trainingMetrics : defaultMetrics;
  
  const latestMetrics = data[data.length - 1];
  const currentEffect = realtimeCausalEffect || latestMetrics?.train_causal_effect || 0;

  const getEffectTrend = () => {
    if (data.length < 2) return 'stable';
    const recent = data.slice(-3);
    const avgChange = recent.reduce((sum, metric, idx) => {
      if (idx === 0) return sum;
      return sum + (metric.train_causal_effect - recent[idx - 1].train_causal_effect);
    }, 0) / (recent.length - 1);
    
    if (avgChange > 0.05) return 'increasing';
    if (avgChange < -0.05) return 'decreasing';
    return 'stable';
  };

  const trend = getEffectTrend();
  const getTrendColor = () => {
    switch (trend) {
      case 'increasing': return 'text-red-600 dark:text-red-400';
      case 'decreasing': return 'text-green-600 dark:text-green-400';
      default: return 'text-blue-600 dark:text-blue-400';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'increasing': return '↗️';
      case 'decreasing': return '↘️';
      default: return '➡️';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Causal Effect Evolution Over Time
          <div className="flex items-center gap-2">
            {isTraining && (
              <Badge variant="default" className="animate-pulse">Training</Badge>
            )}
            <Badge variant="outline" className={getTrendColor()}>
              {getTrendIcon()} {trend}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current Effect Display */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-md">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {Math.abs(currentEffect).toFixed(3)}
              </div>
              <div className="text-xs text-muted-foreground">Current Effect</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary">
                {latestMetrics?.train_acc ? (latestMetrics.train_acc * 100).toFixed(1) : 'N/A'}%
              </div>
              <div className="text-xs text-muted-foreground">Training Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">
                {data.length}
              </div>
              <div className="text-xs text-muted-foreground">Epochs Trained</div>
            </div>
          </div>

          {/* Evolution Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="epoch" 
                  className="text-xs"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fontSize: 12 }}
                  domain={['dataMin - 0.1', 'dataMax + 0.1']}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                  formatter={(value: number, name: string) => [
                    typeof value === 'number' ? value.toFixed(4) : value,
                    name.replace('_', ' ').toUpperCase()
                  ]}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="train_causal_effect" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Training Causal Effect"
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="val_causal_effect" 
                  stroke="hsl(var(--secondary))" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Validation Causal Effect"
                  dot={{ fill: 'hsl(var(--secondary))', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <div className="font-medium">Training Statistics</div>
              <div className="text-muted-foreground">
                Mean Effect: {data.length > 0 ? (data.reduce((sum, m) => sum + m.train_causal_effect, 0) / data.length).toFixed(4) : 'N/A'}
              </div>
              <div className="text-muted-foreground">
                Std Dev: {data.length > 0 ? Math.sqrt(data.reduce((sum, m) => sum + Math.pow(m.train_causal_effect - (data.reduce((s, x) => s + x.train_causal_effect, 0) / data.length), 2), 0) / data.length).toFixed(4) : 'N/A'}
              </div>
            </div>
            <div className="space-y-1">
              <div className="font-medium">Convergence Status</div>
              <div className="text-muted-foreground">
                Status: {Math.abs(currentEffect) < 0.1 ? 'Converging' : 'Diverging'}
              </div>
              <div className="text-muted-foreground">
                Stability: {trend === 'stable' ? 'High' : 'Medium'}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CausalEffectEvolution;