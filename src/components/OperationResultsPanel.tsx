/**
 * Operation Results Panel
 * 
 * Displays saved operation results from all IMSCHM modules:
 * - CVGG training/inference
 * - Causal interventions (do-calculus)
 * - Counterfactual queries (What-If)
 * - Prescriptive AI recommendations
 * - Examples and Cases
 * - Knowledge base operations
 * 
 * Provides:
 * - Result listing with filtering
 * - Detailed explanations
 * - Export to JSON/CSV
 * - Statistics dashboard
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  Database,
  Download,
  Trash2,
  FileJson,
  FileSpreadsheet,
  Brain,
  Zap,
  HelpCircle,
  Lightbulb,
  BookOpen,
  FileText,
  Activity,
  Clock,
  BarChart3,
  ChevronRight,
  RefreshCw,
  Info,
  CheckCircle2,
  AlertTriangle,
  FileDown,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  getResultsStorage,
  StoredResult,
  OperationType,
  CVGGTrainingResult,
  CVGGInferenceResult,
  InterventionOperationResult,
  CounterfactualOperationResult,
  PrescriptiveOperationResult,
} from '@/utils/resultsStorage';

const operationTypeConfig: Record<OperationType, { icon: React.ReactNode; label: string; color: string }> = {
  cvgg_training: { icon: <Brain className="h-4 w-4" />, label: 'CVGG Training', color: 'text-blue-400' },
  cvgg_inference: { icon: <Activity className="h-4 w-4" />, label: 'CVGG Inference', color: 'text-cyan-400' },
  intervention: { icon: <Zap className="h-4 w-4" />, label: 'do() Intervention', color: 'text-orange-400' },
  counterfactual: { icon: <HelpCircle className="h-4 w-4" />, label: 'What-If Query', color: 'text-purple-400' },
  prescriptive: { icon: <Lightbulb className="h-4 w-4" />, label: 'Prescriptive AI', color: 'text-green-400' },
  example: { icon: <BookOpen className="h-4 w-4" />, label: 'Example', color: 'text-yellow-400' },
  case: { icon: <FileText className="h-4 w-4" />, label: 'Case Study', color: 'text-pink-400' },
  knowledge_import: { icon: <Database className="h-4 w-4" />, label: 'Knowledge Import', color: 'text-indigo-400' },
  knowledge_export: { icon: <Download className="h-4 w-4" />, label: 'Knowledge Export', color: 'text-indigo-400' },
  knowledge_query: { icon: <Database className="h-4 w-4" />, label: 'Knowledge Query', color: 'text-indigo-400' },
};

const OperationResultsPanel: React.FC = () => {
  const { t } = useLanguage();
  const storage = useMemo(() => getResultsStorage(), []);
  
  const [results, setResults] = useState<StoredResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<StoredResult | null>(null);
  const [filterType, setFilterType] = useState<OperationType | 'all'>('all');
  const [sortColumn, setSortColumn] = useState<'timestamp' | 'type'>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [activeTab, setActiveTab] = useState<'list' | 'table' | 'statistics'>('list');

  // Subscribe to storage changes
  useEffect(() => {
    const loadResults = () => {
      setResults(storage.getResults());
    };
    loadResults();
    return storage.subscribe(loadResults);
  }, [storage]);

  // Filtered results
  const filteredResults = useMemo(() => {
    if (filterType === 'all') return results;
    return results.filter(r => r.type === filterType);
  }, [results, filterType]);

  // Sorted results for table view
  const sortedResults = useMemo(() => {
    return [...filteredResults].sort((a, b) => {
      if (sortColumn === 'timestamp') {
        return sortDirection === 'desc' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp;
      }
      if (sortColumn === 'type') {
        return sortDirection === 'desc' 
          ? b.type.localeCompare(a.type) 
          : a.type.localeCompare(b.type);
      }
      return 0;
    });
  }, [filteredResults, sortColumn, sortDirection]);

  // Sort handler
  const handleSort = (column: 'timestamp' | 'type') => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  // Statistics
  const statistics = useMemo(() => storage.getStatistics(), [results]);
  const totalResults = results.length;
  const currentSessionResults = storage.getCurrentSessionResults().length;

  const handleExportJSON = () => {
    storage.downloadJSON(filterType !== 'all' ? { type: filterType } : undefined);
  };

  const handleExportCSV = () => {
    storage.downloadCSV(filterType !== 'all' ? { type: filterType } : undefined);
  };

  const handleExportReport = () => {
    storage.downloadMarkdownReport();
  };

  const handleExportExampleCaseReport = () => {
    storage.downloadExampleCaseReport();
  };

  const handleExportDatasetReport = () => {
    storage.downloadDatasetSimulationReport();
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all saved results? This cannot be undone.')) {
      storage.clearAll();
      setSelectedResult(null);
    }
  };

  const handleDeleteResult = (id: string) => {
    storage.deleteResult(id);
    if (selectedResult?.id === id) {
      setSelectedResult(null);
    }
  };

  const formatTimestamp = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleString();
  };

  const formatRelativeTime = (ts: number) => {
    const diff = Date.now() - ts;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <span>{t('results.title') || 'Operation Results'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {currentSessionResults} this session
              </Badge>
              <Badge variant="secondary">
                {totalResults} total
              </Badge>
            </div>
          </CardTitle>
          <CardDescription>
            {t('results.description') || 'View, explain, and export all operation results from CVGG, interventions, counterfactuals, and more.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Select value={filterType} onValueChange={(v) => setFilterType(v as OperationType | 'all')}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="cvgg_training">CVGG Training</SelectItem>
                <SelectItem value="cvgg_inference">CVGG Inference</SelectItem>
                <SelectItem value="intervention">Interventions</SelectItem>
                <SelectItem value="counterfactual">Counterfactuals</SelectItem>
                <SelectItem value="prescriptive">Prescriptive AI</SelectItem>
                <SelectItem value="example">Examples</SelectItem>
                <SelectItem value="case">Cases</SelectItem>
                <SelectItem value="knowledge_import">Knowledge Import</SelectItem>
                <SelectItem value="knowledge_export">Knowledge Export</SelectItem>
                <SelectItem value="knowledge_query">Knowledge Query</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={handleExportJSON}>
              <FileJson className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="default" size="sm" onClick={handleExportReport}>
              <FileDown className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
            <Button variant="default" size="sm" onClick={handleExportExampleCaseReport} className="bg-purple-600 hover:bg-purple-700">
              <BookOpen className="h-4 w-4 mr-2" />
              {t('results.generateExampleCase') || 'Generate Example&Case'}
            </Button>
            <Button variant="default" size="sm" onClick={handleExportDatasetReport} className="bg-emerald-600 hover:bg-emerald-700">
              <Database className="h-4 w-4 mr-2" />
              {t('results.generateDatasetReport') || 'Generate Dataset Report'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleClearAll} className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Results List */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span>Results ({filteredResults.length})</span>
              </div>
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'list' | 'table' | 'statistics')}>
                <TabsList className="h-8">
                  <TabsTrigger value="list" className="text-xs px-2">List</TabsTrigger>
                  <TabsTrigger value="table" className="text-xs px-2">Table</TabsTrigger>
                  <TabsTrigger value="statistics" className="text-xs px-2">Stats</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeTab === 'list' ? (
              <ScrollArea className="h-[500px] pr-4">
                {filteredResults.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">No results saved yet</p>
                    <p className="text-sm mt-1">
                      Run CVGG training, interventions, or other operations to see results here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredResults.map((result) => (
                      <ResultListItem
                        key={result.id}
                        result={result}
                        isSelected={selectedResult?.id === result.id}
                        onClick={() => setSelectedResult(result)}
                        onDelete={() => handleDeleteResult(result.id)}
                        formatRelativeTime={formatRelativeTime}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
            ) : activeTab === 'table' ? (
              <CompactTableView 
                results={sortedResults}
                selectedId={selectedResult?.id || null}
                onSelect={(result) => setSelectedResult(result)}
                onDelete={handleDeleteResult}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
                formatRelativeTime={formatRelativeTime}
              />
            ) : (
              <StatisticsView statistics={statistics} results={results} />
            )}
          </CardContent>
        </Card>

        {/* Result Detail & Explanation */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Info className="h-4 w-4" />
              <span>Result Explanation</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedResult ? (
              <ResultDetail result={selectedResult} formatTimestamp={formatTimestamp} />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <ChevronRight className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">Select a result to view details</p>
                <p className="text-sm mt-1">
                  Click on any result from the list to see its full explanation and data.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Result List Item Component
interface ResultListItemProps {
  result: StoredResult;
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
  formatRelativeTime: (ts: number) => string;
}

const ResultListItem: React.FC<ResultListItemProps> = ({
  result,
  isSelected,
  onClick,
  onDelete,
  formatRelativeTime,
}) => {
  const config = operationTypeConfig[result.type];
  const storage = getResultsStorage();
  const summary = storage.getResultSummary(result);

  return (
    <div
      className={`border rounded-lg p-3 cursor-pointer transition-all ${
        isSelected
          ? 'border-primary bg-primary/10'
          : 'border-border hover:border-primary/50 hover:bg-muted/30'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`mt-0.5 ${config.color}`}>
            {config.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate">{config.label}</span>
              <Badge variant="outline" className="text-xs shrink-0">
                <Clock className="h-3 w-3 mr-1" />
                {formatRelativeTime(result.timestamp)}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {summary}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 opacity-50 hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

// Result Detail Component
interface ResultDetailProps {
  result: StoredResult;
  formatTimestamp: (ts: number) => string;
}

const ResultDetail: React.FC<ResultDetailProps> = ({ result, formatTimestamp }) => {
  const storage = getResultsStorage();
  const explanation = storage.getExplanation(result);
  const config = operationTypeConfig[result.type];

  return (
    <ScrollArea className="h-[500px] pr-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-muted ${config.color}`}>
            {config.icon}
          </div>
          <div>
            <h3 className="font-semibold">{config.label}</h3>
            <p className="text-xs text-muted-foreground">
              {formatTimestamp(result.timestamp)}
            </p>
          </div>
        </div>

        <Separator />

        {/* Explanation */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-400" />
            Explanation
          </h4>
          <div className="bg-muted/30 rounded-lg p-4 text-sm whitespace-pre-line font-mono leading-relaxed">
            {explanation}
          </div>
        </div>

        {/* Type-specific details */}
        <TypeSpecificDetails result={result} />

        {/* Raw Data */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <FileJson className="h-4 w-4 text-blue-400" />
            Raw Data
          </h4>
          <div className="bg-muted/30 rounded-lg p-4 text-xs font-mono overflow-x-auto">
            <pre>{JSON.stringify(result.data, null, 2)}</pre>
          </div>
        </div>

        {/* Metadata */}
        {Object.keys(result.metadata).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Metadata</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(result.metadata).map(([key, value]) => (
                <Badge key={key} variant="outline" className="text-xs">
                  {key}: {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

// Type-specific details component
const TypeSpecificDetails: React.FC<{ result: StoredResult }> = ({ result }) => {
  switch (result.type) {
    case 'cvgg_training': {
      const r = result as CVGGTrainingResult;
      return (
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="Epochs" value={r.data.epochs} />
          <MetricCard label="Final Accuracy" value={`${(r.data.finalAccuracy * 100).toFixed(1)}%`} />
          <MetricCard label="Final Loss" value={r.data.finalLoss.toFixed(4)} />
          <MetricCard label="Samples" value={r.data.config.samples} />
        </div>
      );
    }
    case 'cvgg_inference': {
      const r = result as CVGGInferenceResult;
      return (
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="Classification" value={r.data.classification.className} />
          <MetricCard label="Confidence" value={`${(r.data.classification.confidence * 100).toFixed(1)}%`} />
          <MetricCard label="ATE" value={r.data.causalEffects.ATE.toFixed(4)} />
          <MetricCard label="CATE" value={r.data.causalEffects.CATE.toFixed(4)} />
        </div>
      );
    }
    case 'intervention': {
      const r = result as InterventionOperationResult;
      return (
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="Intervention" value={r.data.intervention.name} />
          <MetricCard label="Primary Effect" value={`${(r.data.causalEffects.primaryEffect * 100).toFixed(1)}%`} />
          <MetricCard label="Pre-Risk" value={`${(r.data.riskAssessment.preInterventionRisk * 100).toFixed(1)}%`} />
          <MetricCard label="Post-Risk" value={`${(r.data.riskAssessment.postInterventionRisk * 100).toFixed(1)}%`} />
        </div>
      );
    }
    case 'counterfactual': {
      const r = result as CounterfactualOperationResult;
      return (
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="Baseline" value={`${(r.data.baselineOutcome * 100).toFixed(1)}%`} />
          <MetricCard label="Counterfactual" value={`${(r.data.counterfactualOutcome * 100).toFixed(1)}%`} />
          <MetricCard label="Causal Effect" value={`${(r.data.causalEffect * 100).toFixed(1)}%`} />
          <MetricCard label="Confidence" value={`${(r.data.confidence * 100).toFixed(1)}%`} />
        </div>
      );
    }
    case 'prescriptive': {
      const r = result as PrescriptiveOperationResult;
      return (
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="System Health" value={`${r.data.systemHealthScore.toFixed(0)}/100`} />
          <MetricCard label="Risk Level" value={r.data.riskLevel.toUpperCase()} />
          <MetricCard label="Recommendations" value={r.data.recommendations.length} />
          <MetricCard label="Top Priority" value={r.data.topPriority?.priority || 'None'} />
        </div>
      );
    }
    default:
      return null;
  }
};

// Metric Card Component
const MetricCard: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="bg-muted/30 rounded-lg p-3">
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="font-semibold mt-1">{value}</div>
  </div>
);

// Extract compact data for table view
function extractCompactData(result: StoredResult): { metrics: string; configParams: string } {
  switch (result.type) {
    case 'cvgg_training': {
      const r = result as CVGGTrainingResult;
      return {
        metrics: `Acc:${(r.data.finalAccuracy * 100).toFixed(1)}% Loss:${r.data.finalLoss.toFixed(3)}`,
        configParams: `e:${r.data.epochs} lr:${r.data.config.learningRate} n:${r.data.config.samples}`
      };
    }
    case 'cvgg_inference': {
      const r = result as CVGGInferenceResult;
      return {
        metrics: `${r.data.classification.className} (${(r.data.classification.confidence * 100).toFixed(0)}%)`,
        configParams: `ATE:${r.data.causalEffects.ATE.toFixed(3)} CATE:${r.data.causalEffects.CATE.toFixed(3)}`
      };
    }
    case 'intervention': {
      const r = result as InterventionOperationResult;
      return {
        metrics: `do(${r.data.intervention.variable}) Δ:${(r.data.riskAssessment.riskDelta * 100).toFixed(1)}%`,
        configParams: `pre:${(r.data.riskAssessment.preInterventionRisk * 100).toFixed(0)}% post:${(r.data.riskAssessment.postInterventionRisk * 100).toFixed(0)}%`
      };
    }
    case 'counterfactual': {
      const r = result as CounterfactualOperationResult;
      return {
        metrics: `Effect:${(r.data.causalEffect * 100).toFixed(1)}% Conf:${(r.data.confidence * 100).toFixed(0)}%`,
        configParams: `base:${(r.data.baselineOutcome * 100).toFixed(0)}% cf:${(r.data.counterfactualOutcome * 100).toFixed(0)}%`
      };
    }
    case 'prescriptive': {
      const r = result as PrescriptiveOperationResult;
      return {
        metrics: `Health:${r.data.systemHealthScore.toFixed(0)} Risk:${r.data.riskLevel}`,
        configParams: `${r.data.recommendations.length} recs, ${r.data.topPriority?.priority || 'none'}`
      };
    }
    case 'example':
      return {
        metrics: 'CVGG Example',
        configParams: 'Normal/Fault patterns'
      };
    case 'case':
      return {
        metrics: 'Case Study',
        configParams: 'L1/L2/L3 operations'
      };
    case 'knowledge_import':
    case 'knowledge_export':
    case 'knowledge_query':
      return {
        metrics: 'Knowledge Base',
        configParams: 'Graph operation'
      };
    default:
      return { metrics: '-', configParams: '-' };
  }
}

// Compact Table View Component
interface CompactTableViewProps {
  results: StoredResult[];
  selectedId: string | null;
  onSelect: (result: StoredResult) => void;
  onDelete: (id: string) => void;
  sortColumn: 'timestamp' | 'type';
  sortDirection: 'asc' | 'desc';
  onSort: (column: 'timestamp' | 'type') => void;
  formatRelativeTime: (ts: number) => string;
}

const CompactTableView: React.FC<CompactTableViewProps> = ({
  results,
  selectedId,
  onSelect,
  onDelete,
  sortColumn,
  sortDirection,
  onSort,
  formatRelativeTime,
}) => {
  if (results.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="font-medium">No results saved yet</p>
        <p className="text-sm mt-1">
          Run CVGG training, interventions, or other operations to see results here.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[500px]">
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
          <TableRow>
            <TableHead 
              className="w-[80px] cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onSort('timestamp')}
            >
              <span className="flex items-center gap-1">
                Time {sortColumn === 'timestamp' && (sortDirection === 'desc' ? '↓' : '↑')}
              </span>
            </TableHead>
            <TableHead 
              className="w-[120px] cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onSort('type')}
            >
              <span className="flex items-center gap-1">
                Type {sortColumn === 'type' && (sortDirection === 'desc' ? '↓' : '↑')}
              </span>
            </TableHead>
            <TableHead>Key Metrics</TableHead>
            <TableHead>Configuration</TableHead>
            <TableHead className="w-[50px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((result) => {
            const config = operationTypeConfig[result.type];
            const { metrics, configParams } = extractCompactData(result);
            
            return (
              <TableRow
                key={result.id}
                className={cn(
                  "cursor-pointer h-10 text-xs transition-colors",
                  selectedId === result.id && "bg-primary/10"
                )}
                onClick={() => onSelect(result)}
              >
                <TableCell className="py-1 font-mono text-muted-foreground text-xs">
                  {formatRelativeTime(result.timestamp)}
                </TableCell>
                <TableCell className="py-1">
                  <Badge variant="outline" className={cn("text-xs px-1.5 py-0.5", config.color)}>
                    {config.icon}
                    <span className="ml-1">{config.label.split(' ')[0]}</span>
                  </Badge>
                </TableCell>
                <TableCell className="py-1 font-mono text-xs">
                  {metrics}
                </TableCell>
                <TableCell className="py-1 text-muted-foreground font-mono text-xs">
                  {configParams}
                </TableCell>
                <TableCell className="py-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 opacity-50 hover:opacity-100" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(result.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </ScrollArea>
  );
};

// Statistics View Component
const StatisticsView: React.FC<{
  statistics: Record<OperationType, number>;
  results: StoredResult[];
}> = ({ statistics, results }) => {
  const totalOperations = Object.values(statistics).reduce((a, b) => a + (b || 0), 0);
  
  const operationTypes: OperationType[] = [
    'cvgg_training', 'cvgg_inference', 'intervention', 'counterfactual',
    'prescriptive', 'example', 'case', 'knowledge_import', 'knowledge_export', 'knowledge_query'
  ];

  return (
    <div className="space-y-4">
      <div className="text-center py-4">
        <div className="text-4xl font-bold text-primary">{totalOperations}</div>
        <div className="text-sm text-muted-foreground">Total Operations</div>
      </div>

      <Separator />

      <div className="space-y-3">
        {operationTypes.map((type) => {
          const count = statistics[type] || 0;
          const config = operationTypeConfig[type];
          const percentage = totalOperations > 0 ? (count / totalOperations) * 100 : 0;

          return (
            <div key={type} className="flex items-center gap-3">
              <div className={config.color}>{config.icon}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{config.label}</span>
                  <span className="font-mono">{count}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OperationResultsPanel;
