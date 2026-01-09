/**
 * Simple DAG Component
 * 
 * A lightweight DAG visualization showing only the most important nodes:
 * - Intervention/target node (center)
 * - Direct effects (primary cascade)
 * - Secondary effects (if applicable)
 * 
 * Used in do-calculus, counterfactual, and prescriptive panels
 * for quick visualization without the complexity of the full DAG.
 */

import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { IndustrialDomain } from '@/types/industrial';

export interface SimpleDAGNode {
  id: string;
  label: string;
  type: 'intervention' | 'primary' | 'secondary' | 'outcome';
  value?: number; // Effect magnitude (e.g., +0.12 = +12%)
  domain?: IndustrialDomain;
}

export interface SimpleDAGEdge {
  from: string;
  to: string;
  strength: number; // 0-1
  label?: string;
}

interface SimpleDAGProps {
  nodes: SimpleDAGNode[];
  edges: SimpleDAGEdge[];
  title?: string;
  height?: number;
  showLegend?: boolean;
}

const nodeTypeColors: Record<SimpleDAGNode['type'], { fill: string; stroke: string; text: string }> = {
  intervention: { fill: 'hsl(var(--primary))', stroke: 'hsl(var(--primary))', text: 'hsl(var(--primary-foreground))' },
  primary: { fill: 'hsl(var(--chart-1))', stroke: 'hsl(var(--chart-1))', text: 'white' },
  secondary: { fill: 'hsl(var(--chart-2))', stroke: 'hsl(var(--chart-2))', text: 'white' },
  outcome: { fill: 'hsl(var(--chart-4))', stroke: 'hsl(var(--chart-4))', text: 'white' },
};

const domainColors: Record<IndustrialDomain, string> = {
  hydraulic: '#3b82f6',
  mechanical: '#6b7280',
  thermal: '#ef4444',
  electrical: '#eab308',
  cutting: '#22c55e',
};

const SimpleDAG: React.FC<SimpleDAGProps> = ({
  nodes,
  edges,
  title,
  height = 200,
  showLegend = true,
}) => {
  // Layout algorithm: place nodes in a left-to-right flow
  const layout = useMemo(() => {
    const width = 100; // percentage
    const nodePositions = new Map<string, { x: number; y: number }>();

    // Group nodes by type for layered layout
    const intervention = nodes.filter(n => n.type === 'intervention');
    const primary = nodes.filter(n => n.type === 'primary');
    const secondary = nodes.filter(n => n.type === 'secondary');
    const outcome = nodes.filter(n => n.type === 'outcome');

    // Calculate layer positions
    const layers = [intervention, primary, secondary, outcome].filter(l => l.length > 0);
    const layerWidth = width / (layers.length + 1);

    layers.forEach((layer, layerIndex) => {
      const x = (layerIndex + 1) * layerWidth;
      layer.forEach((node, nodeIndex) => {
        const y = (nodeIndex + 1) * (100 / (layer.length + 1));
        nodePositions.set(node.id, { x, y });
      });
    });

    return nodePositions;
  }, [nodes]);

  // Calculate SVG viewBox dimensions
  const svgWidth = 400;
  const svgHeight = height;
  const padding = 40;

  // Convert percentage positions to SVG coordinates
  const getNodeCoords = (nodeId: string) => {
    const pos = layout.get(nodeId);
    if (!pos) return { x: svgWidth / 2, y: svgHeight / 2 };
    return {
      x: padding + (pos.x / 100) * (svgWidth - 2 * padding),
      y: padding + (pos.y / 100) * (svgHeight - 2 * padding),
    };
  };

  // Arrow marker definition
  const arrowId = `arrow-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="space-y-2">
      {title && (
        <div className="text-xs font-medium text-muted-foreground flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="6" cy="6" r="3" />
            <circle cx="18" cy="18" r="3" />
            <path d="M8.5 8.5L15.5 15.5" />
          </svg>
          {title}
        </div>
      )}
      
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full bg-muted/20 rounded-lg border"
        style={{ height }}
      >
        {/* Arrow marker definition */}
        <defs>
          <marker
            id={arrowId}
            markerWidth="8"
            markerHeight="8"
            refX="7"
            refY="4"
            orient="auto"
          >
            <path
              d="M0,0 L8,4 L0,8 Z"
              fill="hsl(var(--muted-foreground))"
              opacity="0.6"
            />
          </marker>
        </defs>

        {/* Draw edges first (behind nodes) */}
        {edges.map((edge, idx) => {
          const from = getNodeCoords(edge.from);
          const to = getNodeCoords(edge.to);
          const nodeRadius = 28;
          
          // Calculate edge endpoints to stop at node boundaries
          const angle = Math.atan2(to.y - from.y, to.x - from.x);
          const startX = from.x + Math.cos(angle) * nodeRadius;
          const startY = from.y + Math.sin(angle) * nodeRadius;
          const endX = to.x - Math.cos(angle) * (nodeRadius + 8);
          const endY = to.y - Math.sin(angle) * (nodeRadius + 8);

          // Create curved path for better visualization
          const midX = (startX + endX) / 2;
          const midY = (startY + endY) / 2 - 15;

          return (
            <g key={idx}>
              <path
                d={`M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`}
                fill="none"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={1 + edge.strength * 2}
                strokeOpacity={0.4 + edge.strength * 0.4}
                markerEnd={`url(#${arrowId})`}
              />
              {edge.label && (
                <text
                  x={midX}
                  y={midY - 5}
                  textAnchor="middle"
                  className="text-[8px] fill-muted-foreground"
                >
                  {edge.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Draw nodes */}
        {nodes.map((node) => {
          const { x, y } = getNodeCoords(node.id);
          const colors = nodeTypeColors[node.type];
          const domainColor = node.domain ? domainColors[node.domain] : undefined;
          const nodeRadius = node.type === 'intervention' ? 32 : 26;

          return (
            <g key={node.id} transform={`translate(${x}, ${y})`}>
              {/* Outer glow for intervention node */}
              {node.type === 'intervention' && (
                <circle
                  r={nodeRadius + 4}
                  fill="none"
                  stroke={colors.stroke}
                  strokeWidth="2"
                  strokeOpacity="0.3"
                  strokeDasharray="4,4"
                />
              )}
              
              {/* Node circle */}
              <circle
                r={nodeRadius}
                fill={domainColor || colors.fill}
                stroke={colors.stroke}
                strokeWidth="2"
                opacity="0.9"
              />
              
              {/* Node label */}
              <text
                y="-3"
                textAnchor="middle"
                className="text-[9px] font-medium"
                fill="white"
              >
                {node.label.length > 12 ? node.label.substring(0, 10) + '...' : node.label}
              </text>
              
              {/* Value indicator */}
              {node.value !== undefined && (
                <text
                  y="10"
                  textAnchor="middle"
                  className="text-[8px] font-mono"
                  fill={node.value > 0 ? '#fbbf24' : '#4ade80'}
                >
                  {node.value > 0 ? '+' : ''}{(node.value * 100).toFixed(1)}%
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-wrap gap-2 justify-center">
          <Badge variant="outline" className="text-xs gap-1">
            <span className="w-2 h-2 rounded-full bg-primary" />
            Intervention
          </Badge>
          <Badge variant="outline" className="text-xs gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-1))' }} />
            Primary Effect
          </Badge>
          <Badge variant="outline" className="text-xs gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-2))' }} />
            Secondary
          </Badge>
          <Badge variant="outline" className="text-xs gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-4))' }} />
            Outcome
          </Badge>
        </div>
      )}
    </div>
  );
};

// Helper to build Simple DAG from intervention data
export const buildInterventionDAG = (
  interventionVariable: string,
  primaryEffects: Array<{ variable: string; effect: number }>,
  secondaryEffects: Array<{ variable: string; effect: number }>,
  outcomeVariable?: string,
  outcomeValue?: number
): { nodes: SimpleDAGNode[]; edges: SimpleDAGEdge[] } => {
  const nodes: SimpleDAGNode[] = [];
  const edges: SimpleDAGEdge[] = [];

  // Intervention node
  nodes.push({
    id: interventionVariable,
    label: interventionVariable.replace(/_/g, ' '),
    type: 'intervention',
  });

  // Primary effect nodes
  primaryEffects.forEach(pe => {
    nodes.push({
      id: pe.variable,
      label: pe.variable.replace(/_/g, ' '),
      type: 'primary',
      value: pe.effect,
    });
    edges.push({
      from: interventionVariable,
      to: pe.variable,
      strength: Math.abs(pe.effect),
    });
  });

  // Secondary effect nodes (connect from primary or intervention)
  secondaryEffects.forEach((se, idx) => {
    nodes.push({
      id: se.variable,
      label: se.variable.replace(/_/g, ' '),
      type: 'secondary',
      value: se.effect,
    });
    // Connect from a primary node if available, otherwise from intervention
    const sourceNode = primaryEffects.length > 0 
      ? primaryEffects[idx % primaryEffects.length].variable 
      : interventionVariable;
    edges.push({
      from: sourceNode,
      to: se.variable,
      strength: Math.abs(se.effect),
    });
  });

  // Outcome node
  if (outcomeVariable) {
    nodes.push({
      id: outcomeVariable,
      label: outcomeVariable,
      type: 'outcome',
      value: outcomeValue,
    });
    // Connect from secondary or primary nodes
    const sources = secondaryEffects.length > 0 ? secondaryEffects : primaryEffects;
    sources.slice(0, 2).forEach(s => {
      edges.push({
        from: s.variable,
        to: outcomeVariable,
        strength: 0.5,
      });
    });
  }

  return { nodes, edges };
};

export default SimpleDAG;
