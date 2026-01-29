/**
 * Causal Graph RAG - Graph-based Retrieval Augmented Generation for Industrial Causality
 * 
 * This module implements a graph-native knowledge store that preserves causal topology
 * and supports Pearl's Causal Hierarchy queries:
 * - L1 (Observation): Neighbor traversal for correlation queries
 * - L2 (Intervention): Subgraph isolation for do-calculus queries
 * - L3 (Counterfactual): Path tracing for what-if queries
 * 
 * Unlike traditional RAG which loses directional context through flat embeddings,
 * Graph RAG preserves edges as directed causal links with ATE/CATE weights.
 */

import { CausalRelation, IndustrialDomain } from '@/types/industrial';

// ============= Core Types =============

export interface CausalNode {
  id: string;
  label: string;
  domain: IndustrialDomain;
  nodeType: 'sensor' | 'state' | 'failure' | 'intervention' | 'outcome';
  metadata: {
    normalRange?: [number, number];
    unit?: string;
    description?: string;
    lastUpdated: number;
  };
  embedding?: number[]; // Optional vector embedding for hybrid search
}

export interface CausalEdge {
  id: string;
  source: string;
  target: string;
  weight: number; // ATE or correlation strength
  edgeType: 'causal' | 'correlation' | 'temporal' | 'intervention';
  metadata: {
    discoveredBy: 'cvgg' | 'pc_algorithm' | 'granger' | 'transfer_entropy' | 'manual';
    confidence: number;
    lag: number;
    cate?: number;
    lastUpdated: number;
    evidence: string[];
  };
}

export interface GraphQuery {
  type: 'neighbors' | 'path' | 'subgraph' | 'ancestors' | 'descendants' | 'natural_language';
  startNode?: string;
  endNode?: string;
  maxDepth?: number;
  minWeight?: number;
  query?: string;
}

export interface GraphQueryResult {
  nodes: CausalNode[];
  edges: CausalEdge[];
  paths?: string[][];
  relevanceScore: number;
  explanation: string;
}

export interface KnowledgeEntry {
  id: string;
  type: 'discovery' | 'intervention' | 'counterfactual' | 'failure' | 'maintenance';
  timestamp: number;
  content: string;
  relatedNodes: string[];
  relatedEdges: string[];
  metadata: Record<string, unknown>;
}

// ============= Export Formats =============

export interface Neo4jExport {
  nodes: Array<{
    id: string;
    labels: string[];
    properties: Record<string, unknown>;
  }>;
  relationships: Array<{
    id: string;
    type: string;
    startNode: string;
    endNode: string;
    properties: Record<string, unknown>;
  }>;
  cypherStatements: string[];
}

export interface GraphMLExport {
  xml: string;
}

export interface JSONLDExport {
  '@context': Record<string, unknown>;
  '@graph': Array<Record<string, unknown>>;
}

// ============= Main Class =============

export class CausalGraphRAG {
  private nodes: Map<string, CausalNode> = new Map();
  private edges: Map<string, CausalEdge> = new Map();
  private adjacencyList: Map<string, Set<string>> = new Map(); // node -> outgoing edges
  private reverseAdjacency: Map<string, Set<string>> = new Map(); // node -> incoming edges
  private knowledgeEntries: Map<string, KnowledgeEntry> = new Map();
  
  // Statistics
  private stats = {
    totalNodes: 0,
    totalEdges: 0,
    discoveriesAdded: 0,
    queriesProcessed: 0,
    lastUpdate: Date.now()
  };

  constructor() {
    this.initializeBaseNodes();
  }

  /**
   * Initialize base sensor and state nodes for industrial domains
   */
  private initializeBaseNodes(): void {
    const baseNodes: Omit<CausalNode, 'metadata'>[] = [
      // Hydraulic domain
      { id: 'hydraulic_pressure', label: 'Pressure', domain: 'hydraulic', nodeType: 'sensor' },
      { id: 'hydraulic_flow_rate', label: 'Flow Rate', domain: 'hydraulic', nodeType: 'sensor' },
      { id: 'hydraulic_temperature', label: 'Hydraulic Temp', domain: 'hydraulic', nodeType: 'sensor' },
      { id: 'hydraulic_viscosity', label: 'Viscosity', domain: 'hydraulic', nodeType: 'sensor' },
      
      // Mechanical domain
      { id: 'mechanical_vibration_x', label: 'Vibration X', domain: 'mechanical', nodeType: 'sensor' },
      { id: 'mechanical_vibration_y', label: 'Vibration Y', domain: 'mechanical', nodeType: 'sensor' },
      { id: 'mechanical_vibration_z', label: 'Vibration Z', domain: 'mechanical', nodeType: 'sensor' },
      { id: 'mechanical_torque', label: 'Torque', domain: 'mechanical', nodeType: 'sensor' },
      { id: 'mechanical_speed', label: 'Speed', domain: 'mechanical', nodeType: 'sensor' },
      { id: 'mechanical_wear_level', label: 'Wear Level', domain: 'mechanical', nodeType: 'sensor' },
      
      // Thermal domain
      { id: 'thermal_system_temp', label: 'System Temp', domain: 'thermal', nodeType: 'sensor' },
      { id: 'thermal_heat_dissipation', label: 'Heat Dissipation', domain: 'thermal', nodeType: 'sensor' },
      
      // Electrical domain
      { id: 'electrical_voltage', label: 'Voltage', domain: 'electrical', nodeType: 'sensor' },
      { id: 'electrical_current', label: 'Current', domain: 'electrical', nodeType: 'sensor' },
      { id: 'electrical_power', label: 'Power', domain: 'electrical', nodeType: 'sensor' },
      
      // Cutting domain
      { id: 'cutting_tool_wear', label: 'Tool Wear', domain: 'cutting', nodeType: 'sensor' },
      { id: 'cutting_cutting_force', label: 'Cutting Force', domain: 'cutting', nodeType: 'sensor' },
      { id: 'cutting_surface_quality', label: 'Surface Quality', domain: 'cutting', nodeType: 'sensor' },
      
      // Failure mode nodes
      { id: 'failure_bearing_wear', label: 'Bearing Wear', domain: 'mechanical', nodeType: 'failure' },
      { id: 'failure_thermal_overload', label: 'Thermal Overload', domain: 'thermal', nodeType: 'failure' },
      { id: 'failure_hydraulic_leak', label: 'Hydraulic Leak', domain: 'hydraulic', nodeType: 'failure' },
      { id: 'failure_electrical_fault', label: 'Electrical Fault', domain: 'electrical', nodeType: 'failure' },
    ];

    baseNodes.forEach(node => {
      this.addNode({
        ...node,
        metadata: {
          lastUpdated: Date.now(),
          description: `Base ${node.nodeType} node for ${node.domain} domain`
        }
      });
    });
  }

  // ============= Node Operations =============

  addNode(node: CausalNode): void {
    this.nodes.set(node.id, node);
    if (!this.adjacencyList.has(node.id)) {
      this.adjacencyList.set(node.id, new Set());
    }
    if (!this.reverseAdjacency.has(node.id)) {
      this.reverseAdjacency.set(node.id, new Set());
    }
    this.stats.totalNodes = this.nodes.size;
    this.stats.lastUpdate = Date.now();
  }

  getNode(id: string): CausalNode | undefined {
    return this.nodes.get(id);
  }

  getAllNodes(): CausalNode[] {
    return Array.from(this.nodes.values());
  }

  // ============= Edge Operations =============

  addEdge(edge: CausalEdge): void {
    this.edges.set(edge.id, edge);
    
    // Update adjacency lists
    const outgoing = this.adjacencyList.get(edge.source) || new Set();
    outgoing.add(edge.id);
    this.adjacencyList.set(edge.source, outgoing);
    
    const incoming = this.reverseAdjacency.get(edge.target) || new Set();
    incoming.add(edge.id);
    this.reverseAdjacency.set(edge.target, incoming);
    
    this.stats.totalEdges = this.edges.size;
    this.stats.lastUpdate = Date.now();
  }

  getEdge(id: string): CausalEdge | undefined {
    return this.edges.get(id);
  }

  getAllEdges(): CausalEdge[] {
    return Array.from(this.edges.values());
  }

  /**
   * Add or update causal relationship discovered by CVGG or other methods
   */
  addCausalDiscovery(
    source: string,
    target: string,
    weight: number,
    discoveredBy: CausalEdge['metadata']['discoveredBy'],
    confidence: number,
    lag: number = 0,
    cate?: number
  ): string {
    const edgeId = `${source}->${target}`;
    
    // Check if edge already exists
    const existing = this.edges.get(edgeId);
    if (existing) {
      // Update existing edge with new evidence
      existing.weight = (existing.weight + weight) / 2; // Moving average
      existing.metadata.confidence = Math.max(existing.metadata.confidence, confidence);
      existing.metadata.evidence.push(`${discoveredBy}@${Date.now()}: w=${weight.toFixed(4)}`);
      existing.metadata.lastUpdated = Date.now();
      if (cate !== undefined) {
        existing.metadata.cate = cate;
      }
      return edgeId;
    }

    // Create new edge
    const edge: CausalEdge = {
      id: edgeId,
      source,
      target,
      weight,
      edgeType: 'causal',
      metadata: {
        discoveredBy,
        confidence,
        lag,
        cate,
        lastUpdated: Date.now(),
        evidence: [`${discoveredBy}@${Date.now()}: w=${weight.toFixed(4)}`]
      }
    };

    this.addEdge(edge);
    this.stats.discoveriesAdded++;
    
    // Add knowledge entry
    this.addKnowledgeEntry({
      id: `discovery_${Date.now()}`,
      type: 'discovery',
      timestamp: Date.now(),
      content: `Discovered causal relationship: ${source} → ${target} (weight: ${weight.toFixed(4)}, confidence: ${(confidence * 100).toFixed(1)}%)`,
      relatedNodes: [source, target],
      relatedEdges: [edgeId],
      metadata: { discoveredBy, weight, confidence, lag }
    });

    return edgeId;
  }

  /**
   * Bulk import causal relations from CausalDiscovery module
   */
  importFromCausalGraph(causalGraph: Map<string, CausalRelation[]>): number {
    let imported = 0;
    causalGraph.forEach((relations, sourceId) => {
      relations.forEach(relation => {
        this.addCausalDiscovery(
          relation.cause,
          relation.effect,
          relation.strength,
          'pc_algorithm',
          Math.min(relation.strength, 0.95),
          relation.lag
        );
        imported++;
      });
    });
    return imported;
  }

  // ============= Knowledge Entry Operations =============

  addKnowledgeEntry(entry: KnowledgeEntry): void {
    this.knowledgeEntries.set(entry.id, entry);
  }

  getKnowledgeEntries(type?: KnowledgeEntry['type']): KnowledgeEntry[] {
    const entries = Array.from(this.knowledgeEntries.values());
    return type ? entries.filter(e => e.type === type) : entries;
  }

  // ============= Graph Queries (Pearl's Hierarchy) =============

  /**
   * L1 Query: Get neighbors (correlational relationships)
   */
  getNeighbors(nodeId: string, direction: 'out' | 'in' | 'both' = 'both'): GraphQueryResult {
    const nodes: CausalNode[] = [];
    const edges: CausalEdge[] = [];
    
    if (direction === 'out' || direction === 'both') {
      const outEdges = this.adjacencyList.get(nodeId) || new Set();
      outEdges.forEach(edgeId => {
        const edge = this.edges.get(edgeId);
        if (edge) {
          edges.push(edge);
          const targetNode = this.nodes.get(edge.target);
          if (targetNode) nodes.push(targetNode);
        }
      });
    }
    
    if (direction === 'in' || direction === 'both') {
      const inEdges = this.reverseAdjacency.get(nodeId) || new Set();
      inEdges.forEach(edgeId => {
        const edge = this.edges.get(edgeId);
        if (edge) {
          edges.push(edge);
          const sourceNode = this.nodes.get(edge.source);
          if (sourceNode) nodes.push(sourceNode);
        }
      });
    }

    this.stats.queriesProcessed++;
    
    return {
      nodes: [...new Map(nodes.map(n => [n.id, n])).values()],
      edges,
      relevanceScore: 1.0,
      explanation: `Found ${nodes.length} neighbors for node ${nodeId}`
    };
  }

  /**
   * L2 Query: Get intervention subgraph (do-calculus support)
   * Returns all nodes affected by an intervention on the target node
   */
  getInterventionSubgraph(interventionNode: string, maxDepth: number = 3): GraphQueryResult {
    const visited = new Set<string>();
    const nodes: CausalNode[] = [];
    const edges: CausalEdge[] = [];
    
    // BFS from intervention node following causal direction
    const queue: Array<{ nodeId: string; depth: number }> = [{ nodeId: interventionNode, depth: 0 }];
    
    while (queue.length > 0) {
      const { nodeId, depth } = queue.shift()!;
      
      if (visited.has(nodeId) || depth > maxDepth) continue;
      visited.add(nodeId);
      
      const node = this.nodes.get(nodeId);
      if (node) nodes.push(node);
      
      // Follow outgoing edges (causal effects)
      const outEdges = this.adjacencyList.get(nodeId) || new Set();
      outEdges.forEach(edgeId => {
        const edge = this.edges.get(edgeId);
        if (edge) {
          edges.push(edge);
          queue.push({ nodeId: edge.target, depth: depth + 1 });
        }
      });
    }

    this.stats.queriesProcessed++;
    
    return {
      nodes,
      edges,
      relevanceScore: 0.9,
      explanation: `Intervention on ${interventionNode} affects ${nodes.length - 1} downstream nodes`
    };
  }

  /**
   * L3 Query: Find causal paths (counterfactual reasoning)
   * Returns all paths from source to target
   */
  findCausalPaths(source: string, target: string, maxDepth: number = 5): GraphQueryResult {
    const paths: string[][] = [];
    const edges: CausalEdge[] = [];
    
    const dfs = (current: string, path: string[], visitedEdges: Set<string>) => {
      if (path.length > maxDepth) return;
      
      if (current === target && path.length > 1) {
        paths.push([...path]);
        return;
      }
      
      const outEdges = this.adjacencyList.get(current) || new Set();
      outEdges.forEach(edgeId => {
        if (visitedEdges.has(edgeId)) return;
        
        const edge = this.edges.get(edgeId);
        if (edge && !path.includes(edge.target)) {
          edges.push(edge);
          visitedEdges.add(edgeId);
          dfs(edge.target, [...path, edge.target], visitedEdges);
          visitedEdges.delete(edgeId);
        }
      });
    };
    
    dfs(source, [source], new Set());
    
    // Collect all nodes from paths
    const nodeIds = new Set<string>();
    paths.forEach(path => path.forEach(id => nodeIds.add(id)));
    const nodes = Array.from(nodeIds).map(id => this.nodes.get(id)!).filter(Boolean);

    this.stats.queriesProcessed++;
    
    return {
      nodes,
      edges: [...new Map(edges.map(e => [e.id, e])).values()],
      paths,
      relevanceScore: paths.length > 0 ? 0.95 : 0.1,
      explanation: `Found ${paths.length} causal paths from ${source} to ${target}`
    };
  }

  /**
   * Get ancestors (all upstream causes)
   */
  getAncestors(nodeId: string, maxDepth: number = 5): GraphQueryResult {
    const visited = new Set<string>();
    const nodes: CausalNode[] = [];
    const edges: CausalEdge[] = [];
    
    const queue: Array<{ id: string; depth: number }> = [{ id: nodeId, depth: 0 }];
    
    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      if (visited.has(id) || depth > maxDepth) continue;
      visited.add(id);
      
      const node = this.nodes.get(id);
      if (node) nodes.push(node);
      
      // Follow incoming edges (causes)
      const inEdges = this.reverseAdjacency.get(id) || new Set();
      inEdges.forEach(edgeId => {
        const edge = this.edges.get(edgeId);
        if (edge) {
          edges.push(edge);
          queue.push({ id: edge.source, depth: depth + 1 });
        }
      });
    }

    this.stats.queriesProcessed++;
    
    return {
      nodes,
      edges,
      relevanceScore: 0.9,
      explanation: `Found ${nodes.length - 1} ancestor nodes for ${nodeId}`
    };
  }

  /**
   * Get descendants (all downstream effects)
   */
  getDescendants(nodeId: string, maxDepth: number = 5): GraphQueryResult {
    return this.getInterventionSubgraph(nodeId, maxDepth);
  }

  /**
   * Natural language query processing
   * Maps common queries to graph operations
   */
  processNaturalLanguageQuery(query: string): GraphQueryResult {
    const lowerQuery = query.toLowerCase();
    
    // Pattern matching for common queries
    if (lowerQuery.includes('what causes') || lowerQuery.includes('why is')) {
      // Extract target variable
      const targetMatch = lowerQuery.match(/(?:causes?|why is)\s+(\w+)/);
      if (targetMatch) {
        const target = this.findNodeByLabel(targetMatch[1]);
        if (target) {
          return this.getAncestors(target.id);
        }
      }
    }
    
    if (lowerQuery.includes('what happens if') || lowerQuery.includes('effect of')) {
      // Extract intervention variable
      const interventionMatch = lowerQuery.match(/(?:if|effect of)\s+(\w+)/);
      if (interventionMatch) {
        const intervention = this.findNodeByLabel(interventionMatch[1]);
        if (intervention) {
          return this.getInterventionSubgraph(intervention.id);
        }
      }
    }
    
    if (lowerQuery.includes('path') || lowerQuery.includes('how does') && lowerQuery.includes('affect')) {
      // Extract source and target
      const pathMatch = lowerQuery.match(/(\w+).*(?:affect|lead to|cause)\s+(\w+)/);
      if (pathMatch) {
        const source = this.findNodeByLabel(pathMatch[1]);
        const target = this.findNodeByLabel(pathMatch[2]);
        if (source && target) {
          return this.findCausalPaths(source.id, target.id);
        }
      }
    }

    // Default: return nodes matching query terms
    const matchingNodes = this.getAllNodes().filter(node => 
      node.label.toLowerCase().includes(lowerQuery) ||
      node.id.toLowerCase().includes(lowerQuery)
    );

    this.stats.queriesProcessed++;
    
    return {
      nodes: matchingNodes,
      edges: [],
      relevanceScore: matchingNodes.length > 0 ? 0.5 : 0.1,
      explanation: `Found ${matchingNodes.length} nodes matching "${query}"`
    };
  }

  private findNodeByLabel(label: string): CausalNode | undefined {
    const lowerLabel = label.toLowerCase();
    return this.getAllNodes().find(node => 
      node.label.toLowerCase().includes(lowerLabel) ||
      node.id.toLowerCase().includes(lowerLabel)
    );
  }

  // ============= Export Functions =============

  /**
   * Export to Neo4j Cypher format
   */
  exportToNeo4j(): Neo4jExport {
    const cypherStatements: string[] = [];
    
    // Create node statements
    const nodeStatements = this.getAllNodes().map(node => {
      const labels = [node.nodeType.toUpperCase(), node.domain.toUpperCase()];
      const props = {
        id: node.id,
        label: node.label,
        domain: node.domain,
        nodeType: node.nodeType,
        ...node.metadata
      };
      return `CREATE (n:${labels.join(':')} ${JSON.stringify(props)})`;
    });
    
    // Create relationship statements
    const relStatements = this.getAllEdges().map(edge => {
      const props = {
        weight: edge.weight,
        edgeType: edge.edgeType,
        ...edge.metadata
      };
      return `MATCH (a {id: '${edge.source}'}), (b {id: '${edge.target}'}) CREATE (a)-[:CAUSES ${JSON.stringify(props)}]->(b)`;
    });
    
    cypherStatements.push(
      '// Clear existing data',
      'MATCH (n) DETACH DELETE n;',
      '',
      '// Create nodes',
      ...nodeStatements,
      '',
      '// Create relationships',
      ...relStatements
    );

    return {
      nodes: this.getAllNodes().map(node => ({
        id: node.id,
        labels: [node.nodeType.toUpperCase(), node.domain.toUpperCase()],
        properties: { ...node, metadata: undefined, ...node.metadata }
      })),
      relationships: this.getAllEdges().map(edge => ({
        id: edge.id,
        type: 'CAUSES',
        startNode: edge.source,
        endNode: edge.target,
        properties: { weight: edge.weight, ...edge.metadata }
      })),
      cypherStatements
    };
  }

  /**
   * Export to GraphML format
   */
  exportToGraphML(): GraphMLExport {
    const nodes = this.getAllNodes();
    const edges = this.getAllEdges();
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<graphml xmlns="http://graphml.graphdrawing.org/xmlns">
  <key id="label" for="node" attr.name="label" attr.type="string"/>
  <key id="domain" for="node" attr.name="domain" attr.type="string"/>
  <key id="nodeType" for="node" attr.name="nodeType" attr.type="string"/>
  <key id="weight" for="edge" attr.name="weight" attr.type="double"/>
  <key id="edgeType" for="edge" attr.name="edgeType" attr.type="string"/>
  <key id="confidence" for="edge" attr.name="confidence" attr.type="double"/>
  
  <graph id="CausalGraph" edgedefault="directed">
    ${nodes.map(n => `
    <node id="${n.id}">
      <data key="label">${n.label}</data>
      <data key="domain">${n.domain}</data>
      <data key="nodeType">${n.nodeType}</data>
    </node>`).join('')}
    
    ${edges.map(e => `
    <edge id="${e.id}" source="${e.source}" target="${e.target}">
      <data key="weight">${e.weight}</data>
      <data key="edgeType">${e.edgeType}</data>
      <data key="confidence">${e.metadata.confidence}</data>
    </edge>`).join('')}
  </graph>
</graphml>`;

    return { xml };
  }

  /**
   * Export to JSON-LD format for semantic web compatibility
   */
  exportToJSONLD(): JSONLDExport {
    const context = {
      '@vocab': 'http://example.org/causal#',
      'causes': { '@type': '@id' },
      'domain': 'http://example.org/industrial#domain',
      'weight': { '@type': 'http://www.w3.org/2001/XMLSchema#double' }
    };

    const graph = this.getAllNodes().map(node => {
      const outEdges = this.adjacencyList.get(node.id) || new Set();
      const causes = Array.from(outEdges)
        .map(edgeId => this.edges.get(edgeId))
        .filter(Boolean)
        .map(edge => ({
          '@id': edge!.target,
          'weight': edge!.weight,
          'confidence': edge!.metadata.confidence
        }));

      return {
        '@id': node.id,
        '@type': node.nodeType,
        'label': node.label,
        'domain': node.domain,
        ...(causes.length > 0 ? { 'causes': causes } : {})
      };
    });

    return {
      '@context': context,
      '@graph': graph
    };
  }

  /**
   * Export to simple JSON format
   */
  exportToJSON(): { nodes: CausalNode[]; edges: CausalEdge[]; knowledge: KnowledgeEntry[]; stats: typeof this.stats } {
    return {
      nodes: this.getAllNodes(),
      edges: this.getAllEdges(),
      knowledge: this.getKnowledgeEntries(),
      stats: this.getStats()
    };
  }

  // ============= Statistics =============

  getStats() {
    return {
      ...this.stats,
      totalNodes: this.nodes.size,
      totalEdges: this.edges.size,
      knowledgeEntries: this.knowledgeEntries.size,
      domainBreakdown: this.getDomainBreakdown(),
      edgeTypeBreakdown: this.getEdgeTypeBreakdown()
    };
  }

  private getDomainBreakdown(): Record<string, number> {
    const breakdown: Record<string, number> = {};
    this.nodes.forEach(node => {
      breakdown[node.domain] = (breakdown[node.domain] || 0) + 1;
    });
    return breakdown;
  }

  private getEdgeTypeBreakdown(): Record<string, number> {
    const breakdown: Record<string, number> = {};
    this.edges.forEach(edge => {
      breakdown[edge.edgeType] = (breakdown[edge.edgeType] || 0) + 1;
    });
    return breakdown;
  }

  /**
   * Get high-confidence causal relationships (for display)
   */
  getTopCausalRelationships(limit: number = 10): CausalEdge[] {
    return this.getAllEdges()
      .sort((a, b) => b.metadata.confidence - a.metadata.confidence)
      .slice(0, limit);
  }

  /**
   * Get nodes by domain
   */
  getNodesByDomain(domain: IndustrialDomain): CausalNode[] {
    return this.getAllNodes().filter(node => node.domain === domain);
  }

  /**
   * Clear all edges (keep nodes)
   */
  clearEdges(): void {
    this.edges.clear();
    this.adjacencyList.forEach((set) => set.clear());
    this.reverseAdjacency.forEach((set) => set.clear());
    this.stats.totalEdges = 0;
    this.stats.lastUpdate = Date.now();
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    this.nodes.clear();
    this.edges.clear();
    this.adjacencyList.clear();
    this.reverseAdjacency.clear();
    this.knowledgeEntries.clear();
    this.stats = {
      totalNodes: 0,
      totalEdges: 0,
      discoveriesAdded: 0,
      queriesProcessed: 0,
      lastUpdate: Date.now()
    };
    this.initializeBaseNodes();
  }
}

// Singleton instance for global access
export const causalGraphRAG = new CausalGraphRAG();
