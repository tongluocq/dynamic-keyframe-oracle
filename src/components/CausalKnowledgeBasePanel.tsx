/**
 * Causal Knowledge Base Panel
 * 
 * Management interface for Graph RAG implementation including:
 * - Graph visualization and statistics
 * - Natural language query interface
 * - Database export options (Neo4j, GraphML, JSON-LD)
 * - Knowledge entry browser
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  Database, Search, Download, RefreshCw, Network, Brain, 
  ArrowRight, FileJson, FileCode, FileText, Trash2, Upload,
  Circle, GitBranch, Activity, Zap, Info
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  causalGraphRAG, 
  CausalNode, 
  CausalEdge, 
  GraphQueryResult,
  KnowledgeEntry 
} from '@/utils/causalGraphRAG';
import { CausalRelation } from '@/types/industrial';
import SimpleDAG from './SimpleDAG';

interface CausalKnowledgeBasePanelProps {
  causalGraph?: Map<string, CausalRelation[]>;
  onImportComplete?: (count: number) => void;
}

const domainColors: Record<string, string> = {
  hydraulic: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  mechanical: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
  thermal: 'bg-red-500/20 text-red-400 border-red-500/50',
  electrical: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  cutting: 'bg-green-500/20 text-green-400 border-green-500/50',
};

const CausalKnowledgeBasePanel: React.FC<CausalKnowledgeBasePanelProps> = ({
  causalGraph,
  onImportComplete
}) => {
  const { t } = useLanguage();
  const [stats, setStats] = useState(causalGraphRAG.getStats());
  const [searchQuery, setSearchQuery] = useState('');
  const [queryResult, setQueryResult] = useState<GraphQueryResult | null>(null);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedExportFormat, setSelectedExportFormat] = useState<string>('json');
  const [isExporting, setIsExporting] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Refresh stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(causalGraphRAG.getStats());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Import from causal graph when available
  const handleImportFromCausalGraph = useCallback(() => {
    if (causalGraph) {
      const count = causalGraphRAG.importFromCausalGraph(causalGraph);
      setStats(causalGraphRAG.getStats());
      onImportComplete?.(count);
    }
  }, [causalGraph, onImportComplete]);

  // Natural language query
  const handleQuery = useCallback(() => {
    if (!searchQuery.trim()) return;
    const result = causalGraphRAG.processNaturalLanguageQuery(searchQuery);
    setQueryResult(result);
  }, [searchQuery]);

  // Export handlers
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      let data: string;
      let filename: string;
      let mimeType: string;

      switch (selectedExportFormat) {
        case 'neo4j':
          const neo4jExport = causalGraphRAG.exportToNeo4j();
          data = neo4jExport.cypherStatements.join('\n');
          filename = 'causal_graph.cypher';
          mimeType = 'text/plain';
          break;
        case 'graphml':
          const graphmlExport = causalGraphRAG.exportToGraphML();
          data = graphmlExport.xml;
          filename = 'causal_graph.graphml';
          mimeType = 'application/xml';
          break;
        case 'jsonld':
          const jsonldExport = causalGraphRAG.exportToJSONLD();
          data = JSON.stringify(jsonldExport, null, 2);
          filename = 'causal_graph.jsonld';
          mimeType = 'application/ld+json';
          break;
        default:
          const jsonExport = causalGraphRAG.exportToJSON();
          data = JSON.stringify(jsonExport, null, 2);
          filename = 'causal_graph.json';
          mimeType = 'application/json';
      }

      // Create download
      const blob = new Blob([data], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }, [selectedExportFormat]);

  // Get top relationships for display
  const topRelationships = useMemo(() => 
    causalGraphRAG.getTopCausalRelationships(15),
    [stats.totalEdges]
  );

  // Get recent knowledge entries
  const recentKnowledge = useMemo(() =>
    causalGraphRAG.getKnowledgeEntries().slice(-10).reverse(),
    [stats.knowledgeEntries]
  );

  // Build DAG for query result
  const queryDAG = useMemo(() => {
    if (!queryResult || queryResult.nodes.length === 0) return null;
    
    return {
      nodes: queryResult.nodes.slice(0, 8).map((node, idx) => ({
        id: node.id,
        label: node.label,
        type: idx === 0 ? 'intervention' as const : 
              idx < 3 ? 'primary' as const : 'secondary' as const,
        domain: node.domain
      })),
      edges: queryResult.edges.slice(0, 10).map(edge => ({
        from: edge.source,
        to: edge.target,
        strength: edge.weight
      }))
    };
  }, [queryResult]);

  // Handle node selection for detailed view
  const handleNodeSelect = useCallback((nodeId: string) => {
    setSelectedNode(nodeId);
    const result = causalGraphRAG.getNeighbors(nodeId);
    setQueryResult(result);
  }, []);

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-background to-muted/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="h-5 w-5 text-primary" />
              {t('knowledgeBase.title') || 'Causal Knowledge Base'}
              <Badge variant="outline" className="ml-2 text-xs">
                Graph RAG
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              {t('knowledgeBase.description') || 'Graph-native knowledge store for industrial causal relationships'}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleImportFromCausalGraph}
              disabled={!causalGraph}
            >
              <Upload className="h-4 w-4 mr-1" />
              Import
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                causalGraphRAG.clearEdges();
                setStats(causalGraphRAG.getStats());
              }}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Statistics Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-primary">{stats.totalNodes}</div>
            <div className="text-xs text-muted-foreground">Nodes</div>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-chart-1">{stats.totalEdges}</div>
            <div className="text-xs text-muted-foreground">Edges</div>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-chart-2">{stats.discoveriesAdded}</div>
            <div className="text-xs text-muted-foreground">Discoveries</div>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-chart-3">{stats.queriesProcessed}</div>
            <div className="text-xs text-muted-foreground">Queries</div>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-chart-4">{stats.knowledgeEntries || 0}</div>
            <div className="text-xs text-muted-foreground">Knowledge</div>
          </div>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="overview" className="text-xs">
              <Network className="h-3 w-3 mr-1" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="query" className="text-xs">
              <Search className="h-3 w-3 mr-1" />
              Query
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="text-xs">
              <Brain className="h-3 w-3 mr-1" />
              Knowledge
            </TabsTrigger>
            <TabsTrigger value="export" className="text-xs">
              <Download className="h-3 w-3 mr-1" />
              Export
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Domain Breakdown */}
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(stats.domainBreakdown || {}).map(([domain, count]) => (
                <div 
                  key={domain}
                  className={`rounded-lg p-2 text-center border ${domainColors[domain] || 'bg-muted/30'}`}
                >
                  <div className="text-lg font-bold">{count}</div>
                  <div className="text-xs capitalize">{domain}</div>
                </div>
              ))}
            </div>

            {/* Top Causal Relationships */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                Top Causal Relationships
              </h4>
              <ScrollArea className="h-48">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Cause</TableHead>
                      <TableHead className="text-xs"></TableHead>
                      <TableHead className="text-xs">Effect</TableHead>
                      <TableHead className="text-xs">Weight</TableHead>
                      <TableHead className="text-xs">Confidence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topRelationships.map((edge) => (
                      <TableRow 
                        key={edge.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleNodeSelect(edge.source)}
                      >
                        <TableCell className="text-xs font-mono">{edge.source.split('_').slice(1).join(' ')}</TableCell>
                        <TableCell>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        </TableCell>
                        <TableCell className="text-xs font-mono">{edge.target.split('_').slice(1).join(' ')}</TableCell>
                        <TableCell className="text-xs">
                          <Badge variant="outline" className="text-xs">
                            {edge.weight.toFixed(3)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="flex items-center gap-1">
                            <div 
                              className="h-2 rounded-full bg-primary"
                              style={{ width: `${edge.metadata.confidence * 40}px` }}
                            />
                            <span>{(edge.metadata.confidence * 100).toFixed(0)}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {topRelationships.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground text-xs py-8">
                          No causal relationships discovered yet. Run simulation or import data.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </TabsContent>

          {/* Query Tab */}
          <TabsContent value="query" className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Ask: 'What causes vibration?' or 'Effect of temperature change'"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
                className="text-sm"
              />
              <Button onClick={handleQuery} size="sm">
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {/* Query Examples */}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground">Try:</span>
              {[
                'What causes vibration?',
                'Effect of pressure',
                'How does temperature affect wear?'
              ].map((example) => (
                <Button
                  key={example}
                  variant="outline"
                  size="sm"
                  className="text-xs h-6"
                  onClick={() => {
                    setSearchQuery(example);
                    const result = causalGraphRAG.processNaturalLanguageQuery(example);
                    setQueryResult(result);
                  }}
                >
                  {example}
                </Button>
              ))}
            </div>

            {/* Query Result */}
            {queryResult && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    Relevance: {(queryResult.relevanceScore * 100).toFixed(0)}%
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {queryResult.explanation}
                  </span>
                </div>

                {/* Visual DAG */}
                {queryDAG && queryDAG.nodes.length > 0 && (
                  <SimpleDAG
                    nodes={queryDAG.nodes}
                    edges={queryDAG.edges}
                    title="Query Result Graph"
                    height={180}
                    showLegend={false}
                  />
                )}

                {/* Paths if available */}
                {queryResult.paths && queryResult.paths.length > 0 && (
                  <div>
                    <h5 className="text-xs font-medium mb-1">Causal Paths Found:</h5>
                    <div className="space-y-1">
                      {queryResult.paths.slice(0, 5).map((path, idx) => (
                        <div key={idx} className="flex items-center gap-1 text-xs font-mono bg-muted/30 p-1 rounded">
                          {path.map((nodeId, i) => (
                            <React.Fragment key={nodeId}>
                              <span className="text-primary">{nodeId.split('_').slice(1).join('_')}</span>
                              {i < path.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                            </React.Fragment>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Result Nodes */}
                {queryResult.nodes.length > 0 && !queryDAG && (
                  <div className="flex flex-wrap gap-2">
                    {queryResult.nodes.slice(0, 10).map(node => (
                      <Badge
                        key={node.id}
                        variant="outline"
                        className={`text-xs cursor-pointer ${domainColors[node.domain]}`}
                        onClick={() => handleNodeSelect(node.id)}
                      >
                        {node.label}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Knowledge Tab */}
          <TabsContent value="knowledge" className="space-y-4">
            <ScrollArea className="h-64">
              {recentKnowledge.length > 0 ? (
                <div className="space-y-2">
                  {recentKnowledge.map((entry) => (
                    <div 
                      key={entry.id}
                      className="border rounded-lg p-3 bg-muted/20"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className="text-xs capitalize">
                          {entry.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-xs">{entry.content}</p>
                      <div className="flex gap-1 mt-2">
                        {entry.relatedNodes.slice(0, 3).map(nodeId => (
                          <Badge key={nodeId} variant="secondary" className="text-xs">
                            {nodeId.split('_').slice(1).join(' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No knowledge entries yet.</p>
                  <p className="text-xs">Discoveries will appear here as they are made.</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-4">
            <div className="grid gap-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Select Export Format</h4>
                <Select value={selectedExportFormat} onValueChange={setSelectedExportFormat}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">
                      <div className="flex items-center gap-2">
                        <FileJson className="h-4 w-4" />
                        JSON (Full Export)
                      </div>
                    </SelectItem>
                    <SelectItem value="neo4j">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Neo4j Cypher
                      </div>
                    </SelectItem>
                    <SelectItem value="graphml">
                      <div className="flex items-center gap-2">
                        <FileCode className="h-4 w-4" />
                        GraphML (XML)
                      </div>
                    </SelectItem>
                    <SelectItem value="jsonld">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        JSON-LD (Semantic Web)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Format descriptions */}
              <div className="bg-muted/30 rounded-lg p-3">
                {selectedExportFormat === 'json' && (
                  <div className="text-xs space-y-1">
                    <p className="font-medium">JSON Full Export</p>
                    <p className="text-muted-foreground">
                      Complete graph data including nodes, edges, knowledge entries, and statistics.
                      Best for backup and reimporting.
                    </p>
                  </div>
                )}
                {selectedExportFormat === 'neo4j' && (
                  <div className="text-xs space-y-1">
                    <p className="font-medium">Neo4j Cypher Statements</p>
                    <p className="text-muted-foreground">
                      Cypher query statements for importing into Neo4j graph database.
                      Ideal for advanced graph analytics and visualization.
                    </p>
                    <code className="block bg-background/50 p-1 rounded mt-1 text-xs">
                      MATCH (a)-[:CAUSES]-&gt;(b) WHERE a.domain = 'hydraulic'
                    </code>
                  </div>
                )}
                {selectedExportFormat === 'graphml' && (
                  <div className="text-xs space-y-1">
                    <p className="font-medium">GraphML (XML)</p>
                    <p className="text-muted-foreground">
                      Standard XML format for graph exchange. Compatible with Gephi, yEd, 
                      and other graph visualization tools.
                    </p>
                  </div>
                )}
                {selectedExportFormat === 'jsonld' && (
                  <div className="text-xs space-y-1">
                    <p className="font-medium">JSON-LD (Linked Data)</p>
                    <p className="text-muted-foreground">
                      Semantic web format for knowledge graphs. Enables integration with 
                      ontologies and reasoning engines.
                    </p>
                  </div>
                )}
              </div>

              <Button 
                onClick={handleExport} 
                disabled={isExporting || stats.totalNodes === 0}
                className="w-full"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export Graph ({stats.totalNodes} nodes, {stats.totalEdges} edges)
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CausalKnowledgeBasePanel;
