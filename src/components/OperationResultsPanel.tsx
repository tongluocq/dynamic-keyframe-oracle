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
  GraduationCap,
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
  getPerformanceSummary,
  downloadPerformanceSummary,
  PerformanceSummary,
  sf, sp, safeNum, shortId, WORKFLOW_SOURCE,
} from '@/utils/resultsStorage';
import DatasetDemoPanel from '@/components/DatasetDemoPanel';

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
  const [activeTab, setActiveTab] = useState<'summary' | 'list' | 'table' | 'total' | 'statistics'>('summary');

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

  const handleExportEDAReport = () => {
    import('@/utils/edaReportGenerator').then(({ downloadEDAReport }) => {
      downloadEDAReport();
    });
  };

  const handleExportThesisChapter = () => {
    const currentResults = storage.getResults();
    import('@/utils/thesisChapterReport').then(({ downloadThesisChapterReport }) => {
      downloadThesisChapterReport(currentResults);
    });
  };

  const handleExportAcademicReport = () => {
    const currentResults = storage.getResults();
    import('@/utils/imschmAcademicReport').then(({ downloadIMSCHMAcademicReport }) => {
      downloadIMSCHMAcademicReport(currentResults);
    });
  };

  const handleExportComparisonReport = () => {
    const currentResults = storage.getResults();
    import('@/utils/cvggImschmComparisonReport').then(({ downloadCVGGIMSCHMComparisonReport }) => {
      downloadCVGGIMSCHMComparisonReport(currentResults);
    });
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
            <Button variant="default" size="sm" onClick={handleExportEDAReport} className="bg-teal-600 hover:bg-teal-700">
              <BarChart3 className="h-4 w-4 mr-2" />
              {t('results.generateEDA') || 'Generate EDA Report'}
            </Button>
            <Button variant="default" size="sm" onClick={handleExportThesisChapter} className="bg-indigo-600 hover:bg-indigo-700">
              <GraduationCap className="h-4 w-4 mr-2" />
              {t('results.generateThesisChapter') || 'Generate Thesis Chapter'}
            </Button>
            <Button variant="default" size="sm" onClick={handleExportAcademicReport} className="bg-rose-600 hover:bg-rose-700">
              <FileText className="h-4 w-4 mr-2" />
              {t('results.generateAcademicReport') || 'Generate IMSCHM Report'}
            </Button>
            <Button variant="default" size="sm" onClick={handleExportComparisonReport} className="bg-amber-600 hover:bg-amber-700">
              <BarChart3 className="h-4 w-4 mr-2" />
              {t('results.generateComparison') || 'CVGG vs IMSCHM'}
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
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
                <TabsList className="h-8">
                  <TabsTrigger value="summary" className="text-xs px-2">{t('results.summary') || 'Summary'}</TabsTrigger>
                  <TabsTrigger value="list" className="text-xs px-2">List</TabsTrigger>
                  <TabsTrigger value="table" className="text-xs px-2">Table</TabsTrigger>
                  <TabsTrigger value="total" className="text-xs px-2">Total</TabsTrigger>
                  <TabsTrigger value="statistics" className="text-xs px-2">Stats</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeTab === 'summary' ? (
              <PerformanceSummaryView results={results} />
            ) : activeTab === 'list' ? (
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
            ) : activeTab === 'total' ? (
              <TotalTableView results={sortedResults} />
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

      {/* Dataset Demo */}
      <DatasetDemoPanel />
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
  const source = WORKFLOW_SOURCE[result.type];
  const opId = shortId(result.id);

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
              <Badge variant="secondary" className="text-[10px] font-mono shrink-0 px-1.5">{opId}</Badge>
              <span className="font-medium text-sm truncate">{config.label}</span>
              {source.step > 0 && (
                <Badge variant="outline" className="text-[10px] shrink-0 px-1.5">
                  {source.icon} Step {source.step}
                </Badge>
              )}
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
  const source = WORKFLOW_SOURCE[result.type];
  const opId = shortId(result.id);

  return (
    <ScrollArea className="h-[500px] pr-4">
      <div className="space-y-4">
        {/* Header with ID and Source */}
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-muted ${config.color}`}>
            {config.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{config.label}</h3>
              <Badge variant="secondary" className="text-[10px] font-mono">{opId}</Badge>
              {source.step > 0 && (
                <Badge variant="outline" className="text-[10px]">
                  {source.icon} Workflow Step {source.step}: {source.label}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatTimestamp(result.timestamp)} · Full ID: {result.id}
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
          <MetricCard label="Final Accuracy" value={sp(r.data.finalAccuracy)} />
          <MetricCard label="Final Loss" value={sf(r.data.finalLoss)} />
          <MetricCard label="Samples" value={r.data.config.samples} />
        </div>
      );
    }
    case 'cvgg_inference': {
      const r = result as CVGGInferenceResult;
      return (
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="Classification" value={r.data.classification.className} />
          <MetricCard label="Confidence" value={sp(r.data.classification.confidence)} />
          <MetricCard label="ATE" value={sf(r.data.causalEffects.ATE)} />
          <MetricCard label="CATE" value={sf(r.data.causalEffects.CATE)} />
        </div>
      );
    }
    case 'intervention': {
      const r = result as InterventionOperationResult;
      return (
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="Intervention" value={r.data.intervention.name} />
          <MetricCard label="Primary Effect" value={sp(r.data.causalEffects.primaryEffect)} />
          <MetricCard label="Pre-Risk" value={sp(r.data.riskAssessment.preInterventionRisk)} />
          <MetricCard label="Post-Risk" value={sp(r.data.riskAssessment.postInterventionRisk)} />
          <MetricCard label="Risk Δ" value={`${safeNum(r.data.riskAssessment.riskDelta) > 0 ? '+' : ''}${sf(safeNum(r.data.riskAssessment.riskDelta) * 100, 1)}%`} />
          <MetricCard label="Command" value={`do(${r.data.intervention.variable} = ${r.data.intervention.targetValue})`} />
        </div>
      );
    }
    case 'counterfactual': {
      const r = result as CounterfactualOperationResult;
      return (
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="Baseline" value={sp(r.data.baselineOutcome)} />
          <MetricCard label="Counterfactual" value={sp(r.data.counterfactualOutcome)} />
          <MetricCard label="Causal Effect" value={sp(r.data.causalEffect)} />
          <MetricCard label="Confidence" value={sp(r.data.confidence)} />
        </div>
      );
    }
    case 'prescriptive': {
      const r = result as PrescriptiveOperationResult;
      return (
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="System Health" value={`${sf(r.data.systemHealthScore, 0)}/100`} />
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
function extractCompactData(result: StoredResult): { metrics: string; configParams: string; command: string } {
  switch (result.type) {
    case 'cvgg_training': {
      const r = result as CVGGTrainingResult;
      return {
        metrics: `Acc:${sp(r.data.finalAccuracy)} Loss:${sf(r.data.finalLoss, 3)}`,
        configParams: `e:${r.data.epochs} lr:${r.data.config.learningRate} n:${r.data.config.samples}`,
        command: `train(epochs=${r.data.epochs}, lr=${r.data.config.learningRate})`
      };
    }
    case 'cvgg_inference': {
      const r = result as CVGGInferenceResult;
      return {
        metrics: `${r.data.classification.className} (${sp(r.data.classification.confidence, 0)})`,
        configParams: `ATE:${sf(r.data.causalEffects.ATE, 3)} CATE:${sf(r.data.causalEffects.CATE, 3)}`,
        command: `infer(state)`
      };
    }
    case 'intervention': {
      const r = result as InterventionOperationResult;
      return {
        metrics: `Δ Risk:${sf(safeNum(r.data.riskAssessment.riskDelta) * 100, 1)}%`,
        configParams: `pre:${sp(r.data.riskAssessment.preInterventionRisk, 0)} → post:${sp(r.data.riskAssessment.postInterventionRisk, 0)}`,
        command: `do(${r.data.intervention.variable} = ${r.data.intervention.targetValue})`
      };
    }
    case 'counterfactual': {
      const r = result as CounterfactualOperationResult;
      return {
        metrics: `Effect:${sp(r.data.causalEffect)} Conf:${sp(r.data.confidence, 0)}`,
        configParams: `base:${sp(r.data.baselineOutcome, 0)} → cf:${sp(r.data.counterfactualOutcome, 0)}`,
        command: `if(${r.data.query.variable} ${r.data.query.direction} ${sf(safeNum(r.data.query.magnitude) * 100, 0)}%)`
      };
    }
    case 'prescriptive': {
      const r = result as PrescriptiveOperationResult;
      return {
        metrics: `Health:${sf(r.data.systemHealthScore, 0)} Risk:${r.data.riskLevel}`,
        configParams: `${r.data.recommendations.length} recs, ${r.data.topPriority?.priority || 'none'}`,
        command: `prescribe()`
      };
    }
    case 'example':
      return { metrics: 'CVGG Example', configParams: 'Normal/Fault patterns', command: 'example()' };
    case 'case':
      return { metrics: 'Case Study', configParams: 'L1/L2/L3 operations', command: 'case()' };
    case 'knowledge_import':
    case 'knowledge_export':
    case 'knowledge_query':
      return { metrics: 'Knowledge Base', configParams: 'Graph operation', command: 'knowledge()' };
    default:
      return { metrics: '--', configParams: '--', command: '--' };
  }
}

// Total Table View — comprehensive view with IDs, sources, commands, and all key metrics
const TotalTableView: React.FC<{ results: StoredResult[] }> = ({ results }) => {
  if (results.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="font-medium">No results saved yet</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[500px]">
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
          <TableRow>
            <TableHead className="text-xs w-[70px]">Op ID</TableHead>
            <TableHead className="text-xs w-[40px]">Step</TableHead>
            <TableHead className="text-xs w-[90px]">Type</TableHead>
            <TableHead className="text-xs">Command</TableHead>
            <TableHead className="text-xs">Key Metrics</TableHead>
            <TableHead className="text-xs">Details</TableHead>
            <TableHead className="text-xs w-[70px]">Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((result) => {
            const config = operationTypeConfig[result.type];
            const { metrics, configParams, command } = extractCompactData(result);
            const source = WORKFLOW_SOURCE[result.type];
            const opId = shortId(result.id);

            return (
              <TableRow key={result.id} className="h-9 text-xs">
                <TableCell className="py-1">
                  <Badge variant="secondary" className="text-[10px] font-mono px-1">{opId}</Badge>
                </TableCell>
                <TableCell className="py-1 text-center">
                  {source.step > 0 ? (
                    <span title={`Step ${source.step}: ${source.label}`} className="text-sm">{source.icon}</span>
                  ) : (
                    <span className="text-muted-foreground">--</span>
                  )}
                </TableCell>
                <TableCell className="py-1">
                  <Badge variant="outline" className={cn("text-[10px] px-1", config.color)}>
                    {config.icon}
                    <span className="ml-1">{config.label.split(' ')[0]}</span>
                  </Badge>
                </TableCell>
                <TableCell className="py-1 font-mono text-[10px] text-muted-foreground max-w-[160px] truncate" title={command}>
                  {command}
                </TableCell>
                <TableCell className="py-1 font-mono text-[10px]">
                  {metrics}
                </TableCell>
                <TableCell className="py-1 text-muted-foreground font-mono text-[10px]">
                  {configParams}
                </TableCell>
                <TableCell className="py-1 font-mono text-[10px] text-muted-foreground">
                  {new Date(result.timestamp).toLocaleTimeString()}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <div className="mt-2 p-2 bg-muted/30 rounded text-xs text-muted-foreground">
        Total: {results.length} operations · 
        Steps covered: {[...new Set(results.map(r => WORKFLOW_SOURCE[r.type].step).filter(s => s > 0))].sort().map(s => `${s}`).join(', ') || 'none'}
      </div>
    </ScrollArea>
  );
};

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

// Workflow steps for the guide
const WORKFLOW_STEPS = [
  { step: 1, name: 'Start', icon: '▶️', description: 'Start simulation' },
  { step: 2, name: 'Inject', icon: '⚠️', description: 'Inject failure mode' },
  { step: 3, name: 'Train', icon: '🧠', description: 'CVGG Training' },
  { step: 4, name: 'Infer', icon: '📊', description: 'CVGG Inference (L1)' },
  { step: 5, name: 'do()', icon: '⚡', description: 'Intervention (L2)' },
  { step: 6, name: 'What-If', icon: '❓', description: 'Counterfactual (L3)' },
  { step: 7, name: 'Prescribe', icon: '💡', description: 'Prescriptive AI' },
];

// Performance Summary View Component
const PerformanceSummaryView: React.FC<{ results: StoredResult[] }> = ({ results }) => {
  const { t } = useLanguage();
  const summary = useMemo(() => getPerformanceSummary(), [results]);

  const formatTime = (ts: number | null) => {
    if (!ts) return '--';
    return new Date(ts).toLocaleTimeString();
  };

  // Determine completed steps based on pipeline stages
  const completedSteps = useMemo(() => {
    const completed = new Set<number>();
    completed.add(1); // Start is always considered done if viewing results
    summary.pipelineStages.forEach(stage => {
      if (stage.status === 'done') {
        if (stage.stage === 'CVGG Training') completed.add(3);
        if (stage.stage === 'CVGG Inference') completed.add(4);
        if (stage.stage === 'Intervention') { completed.add(2); completed.add(5); }
        if (stage.stage === 'Counterfactual') { completed.add(2); completed.add(6); }
        if (stage.stage === 'Prescriptive') completed.add(7);
      }
    });
    return completed;
  }, [summary.pipelineStages]);

  return (
    <ScrollArea className="h-[500px] pr-2">
      <div className="space-y-4">
        {/* Workflow Sequence Guide */}
        <div className="bg-muted/30 rounded-lg p-3">
          <h4 className="text-xs font-semibold flex items-center gap-2 mb-2 text-muted-foreground">
            <ChevronRight className="h-3 w-3" />
            {t('results.workflowGuide') || 'Recommended Workflow Sequence'}
          </h4>
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {WORKFLOW_STEPS.map((ws, idx) => (
              <React.Fragment key={ws.step}>
                <div 
                  className={cn(
                    "flex flex-col items-center min-w-[52px] p-1.5 rounded-md transition-all",
                    completedSteps.has(ws.step) 
                      ? "bg-primary/20 border border-primary/40" 
                      : "bg-background border border-border opacity-60"
                  )}
                  title={ws.description}
                >
                  <span className="text-sm">{ws.icon}</span>
                  <span className="text-[10px] font-medium mt-0.5">{ws.name}</span>
                  {completedSteps.has(ws.step) && (
                    <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5" />
                  )}
                </div>
                {idx < WORKFLOW_STEPS.length - 1 && (
                  <ChevronRight className={cn(
                    "h-3 w-3 flex-shrink-0",
                    completedSteps.has(ws.step) && completedSteps.has(WORKFLOW_STEPS[idx + 1].step)
                      ? "text-primary"
                      : "text-muted-foreground/40"
                  )} />
                )}
              </React.Fragment>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 italic">
            {t('results.workflowHint') || 'Follow this sequence: Start → Inject Failure → Train CVGG → Run Inference → Execute do()/What-If → Get Recommendations'}
          </p>
        </div>

        {/* Table 1: Pipeline Performance */}
        <div>
          <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-primary" />
            {t('results.pipelinePerformance') || 'End-to-End Pipeline Performance'}
          </h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Stage</TableHead>
                <TableHead className="text-xs">Pearl</TableHead>
                <TableHead className="text-xs">Metric</TableHead>
                <TableHead className="text-xs">Value</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.pipelineStages.map((stage) => (
                <TableRow key={stage.stage} className="h-8">
                  <TableCell className="py-1 text-xs font-medium">{stage.stage}</TableCell>
                  <TableCell className="py-1">
                    <Badge variant="outline" className="text-xs">{stage.pearlLevel}</Badge>
                  </TableCell>
                  <TableCell className="py-1 text-xs text-muted-foreground">{stage.keyMetric}</TableCell>
                  <TableCell className="py-1 text-xs font-mono font-semibold">{stage.value}</TableCell>
                  <TableCell className="py-1">
                    {stage.status === 'done' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                    )}
                  </TableCell>
                  <TableCell className="py-1 text-xs text-muted-foreground font-mono">
                    {formatTime(stage.timestamp)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Separator />

        {/* Table 2: Causal Effects Comparison */}
        <div>
          <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            {t('results.causalComparison') || 'Causal Effects Comparison'}
          </h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Metric</TableHead>
                <TableHead className="text-xs">CVGG Inference</TableHead>
                <TableHead className="text-xs">Intervention</TableHead>
                <TableHead className="text-xs">Counterfactual</TableHead>
                <TableHead className="text-xs">Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.causalEffects.map((row) => (
                <TableRow key={row.metric} className="h-8">
                  <TableCell className="py-1 text-xs font-medium">{row.metric}</TableCell>
                  <TableCell className="py-1 text-xs font-mono">{row.cvggInference}</TableCell>
                  <TableCell className="py-1 text-xs font-mono">{row.intervention}</TableCell>
                  <TableCell className="py-1 text-xs font-mono">{row.counterfactual}</TableCell>
                  <TableCell className="py-1 text-xs">
                    <Badge variant={row.trend.includes('Decreasing') ? 'default' : row.trend.includes('Increasing') ? 'destructive' : 'outline'} className="text-xs">
                      {row.trend}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Separator />

        {/* Table 3: System Health KPIs */}
        <div>
          <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
            <Brain className="h-4 w-4 text-primary" />
            {t('results.systemHealth') || 'System Health Dashboard'}
          </h4>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-primary">{summary.systemHealth.totalOperations}</div>
              <div className="text-xs text-muted-foreground">Total Ops</div>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-primary">{summary.systemHealth.pipelineCompletion}</div>
              <div className="text-xs text-muted-foreground">Pipeline</div>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-primary">{summary.systemHealth.latestHealthScore}</div>
              <div className="text-xs text-muted-foreground">Health</div>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <div className={cn("text-lg font-bold", 
                summary.systemHealth.latestRiskLevel === 'LOW' ? 'text-green-500' :
                summary.systemHealth.latestRiskLevel === 'MEDIUM' ? 'text-yellow-500' :
                summary.systemHealth.latestRiskLevel === 'HIGH' || summary.systemHealth.latestRiskLevel === 'CRITICAL' ? 'text-red-500' :
                'text-muted-foreground'
              )}>
                {summary.systemHealth.latestRiskLevel}
              </div>
              <div className="text-xs text-muted-foreground">Risk Level</div>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <div className="text-lg font-bold font-mono">{summary.systemHealth.avgATE}</div>
              <div className="text-xs text-muted-foreground">Avg ATE</div>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <div className="text-lg font-bold font-mono">{summary.systemHealth.avgConfidence}</div>
              <div className="text-xs text-muted-foreground">Avg Confidence</div>
            </div>
          </div>
        </div>

        {/* Download button */}
        <Button variant="outline" size="sm" className="w-full" onClick={() => downloadPerformanceSummary()}>
          <FileDown className="h-4 w-4 mr-2" />
          {t('results.downloadSummary') || 'Download Performance Summary'}
        </Button>
      </div>
    </ScrollArea>
  );
};

export default OperationResultsPanel;
