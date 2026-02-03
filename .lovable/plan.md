

# Plan: Add Excel-Like Compact Table View for Results & Configuration

## Summary

Add a new **compact spreadsheet-style table view** to the Results panel that displays all operation results and their configuration parameters in a dense, Excel-like format. This will provide a more efficient way to scan through many results at once, with sortable columns and inline parameter visibility.

---

## What Will Be Built

### 1. New "Table" Tab in Results Panel

Add a third view mode alongside the existing "List" and "Stats" tabs:

```text
+--------------------------------------------------+
| Results (42)                    [List] [Table] [Stats] |
+--------------------------------------------------+
```

### 2. Compact Table Structure

A dense spreadsheet-style table with the following columns:

| Time | Type | Key Metrics | Config | Status |
|------|------|-------------|--------|--------|
| 2m ago | CVGG Train | Acc: 89.2%, Loss: 0.124 | epochs:5, lr:0.001, samples:50 | Done |
| 5m ago | Intervention | do(pressure=400), Risk: -15.2% | domain: hydraulic | Verified |
| 8m ago | What-If | Effect: +12.3%, Conf: 87% | baseline: 0.45 | Success |
| 12m ago | Prescriptive | Health: 78, Risk: medium | 3 recommendations | Alert |

### 3. Feature Set

- **Sortable columns**: Click headers to sort by time, type, or key metrics
- **Condensed row height**: ~32px per row vs current ~72px cards
- **Inline parameters**: Show configuration values in a dedicated column
- **Color-coded type badges**: Quick visual identification
- **Hover expansion**: Show full details on row hover
- **Row selection**: Click to view full explanation in side panel
- **Sticky headers**: Keep column headers visible while scrolling

---

## Technical Details

### File: `src/components/OperationResultsPanel.tsx`

#### 1. Add new imports and state

```typescript
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Update activeTab type
const [activeTab, setActiveTab] = useState<'list' | 'table' | 'statistics'>('list');
const [sortColumn, setSortColumn] = useState<'timestamp' | 'type'>('timestamp');
const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
```

#### 2. Add sorting logic

```typescript
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
```

#### 3. Add CompactTableView component

```typescript
const CompactTableView: React.FC<{
  results: StoredResult[];
  selectedId: string | null;
  onSelect: (result: StoredResult) => void;
  onDelete: (id: string) => void;
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
  onSort: (column: string) => void;
}> = ({ results, selectedId, onSelect, onDelete, sortColumn, sortDirection, onSort }) => {
  return (
    <ScrollArea className="h-[500px]">
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
          <TableRow>
            <TableHead className="w-[80px] cursor-pointer" onClick={() => onSort('timestamp')}>
              Time {sortColumn === 'timestamp' && (sortDirection === 'desc' ? '↓' : '↑')}
            </TableHead>
            <TableHead className="w-[120px] cursor-pointer" onClick={() => onSort('type')}>
              Type {sortColumn === 'type' && (sortDirection === 'desc' ? '↓' : '↑')}
            </TableHead>
            <TableHead>Key Metrics</TableHead>
            <TableHead>Configuration</TableHead>
            <TableHead className="w-[60px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((result) => (
            <CompactTableRow 
              key={result.id} 
              result={result} 
              isSelected={selectedId === result.id}
              onSelect={onSelect}
              onDelete={onDelete}
            />
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
};
```

#### 4. Add CompactTableRow component

```typescript
const CompactTableRow: React.FC<{
  result: StoredResult;
  isSelected: boolean;
  onSelect: (result: StoredResult) => void;
  onDelete: (id: string) => void;
}> = ({ result, isSelected, onSelect, onDelete }) => {
  const config = operationTypeConfig[result.type];
  const { metrics, configParams } = extractCompactData(result);
  
  return (
    <TableRow 
      className={cn(
        "cursor-pointer h-8 text-xs",
        isSelected && "bg-primary/10"
      )}
      onClick={() => onSelect(result)}
    >
      <TableCell className="py-1 font-mono text-muted-foreground">
        {formatRelativeTime(result.timestamp)}
      </TableCell>
      <TableCell className="py-1">
        <Badge variant="outline" className={cn("text-xs", config.color)}>
          {config.icon}
          <span className="ml-1">{config.label.split(' ')[0]}</span>
        </Badge>
      </TableCell>
      <TableCell className="py-1 font-mono">
        {metrics}
      </TableCell>
      <TableCell className="py-1 text-muted-foreground font-mono">
        {configParams}
      </TableCell>
      <TableCell className="py-1">
        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => {
          e.stopPropagation();
          onDelete(result.id);
        }}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </TableCell>
    </TableRow>
  );
};
```

#### 5. Add extractCompactData helper function

```typescript
function extractCompactData(result: StoredResult): { metrics: string; configParams: string } {
  switch (result.type) {
    case 'cvgg_training': {
      const r = result as CVGGTrainingResult;
      return {
        metrics: `Acc:${(r.data.finalAccuracy*100).toFixed(1)}% Loss:${r.data.finalLoss.toFixed(3)}`,
        configParams: `e:${r.data.epochs} lr:${r.data.config.learningRate} n:${r.data.config.samples}`
      };
    }
    case 'cvgg_inference': {
      const r = result as CVGGInferenceResult;
      return {
        metrics: `${r.data.classification.className} (${(r.data.classification.confidence*100).toFixed(0)}%)`,
        configParams: `ATE:${r.data.causalEffects.ATE.toFixed(3)} CATE:${r.data.causalEffects.CATE.toFixed(3)}`
      };
    }
    case 'intervention': {
      const r = result as InterventionOperationResult;
      return {
        metrics: `do(${r.data.intervention.variable}) Δ:${(r.data.riskAssessment.riskDelta*100).toFixed(1)}%`,
        configParams: `pre:${(r.data.riskAssessment.preInterventionRisk*100).toFixed(0)}% post:${(r.data.riskAssessment.postInterventionRisk*100).toFixed(0)}%`
      };
    }
    case 'counterfactual': {
      const r = result as CounterfactualOperationResult;
      return {
        metrics: `Effect:${(r.data.causalEffect*100).toFixed(1)}% Conf:${(r.data.confidence*100).toFixed(0)}%`,
        configParams: `base:${(r.data.baselineOutcome*100).toFixed(0)}% cf:${(r.data.counterfactualOutcome*100).toFixed(0)}%`
      };
    }
    case 'prescriptive': {
      const r = result as PrescriptiveOperationResult;
      return {
        metrics: `Health:${r.data.systemHealthScore.toFixed(0)} Risk:${r.data.riskLevel}`,
        configParams: `${r.data.recommendations.length} recs, priority:${r.data.topPriority?.priority || 'none'}`
      };
    }
    // ... other cases
    default:
      return { metrics: '-', configParams: '-' };
  }
}
```

#### 6. Update TabsList in main component

```typescript
<Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'list' | 'table' | 'statistics')}>
  <TabsList className="h-8">
    <TabsTrigger value="list" className="text-xs px-2">List</TabsTrigger>
    <TabsTrigger value="table" className="text-xs px-2">Table</TabsTrigger>
    <TabsTrigger value="statistics" className="text-xs px-2">Stats</TabsTrigger>
  </TabsList>
</Tabs>

{/* Content area */}
{activeTab === 'list' && <ResultsList ... />}
{activeTab === 'table' && <CompactTableView ... />}
{activeTab === 'statistics' && <StatisticsView ... />}
```

---

## Visual Design

### Table View Layout

```text
+---------------------------------------------------------------------------------+
| Time ↓    | Type         | Key Metrics                    | Configuration      |
+---------------------------------------------------------------------------------+
| 2m ago    | [🧠 CVGG]    | Acc:89.2% Loss:0.124          | e:5 lr:0.001 n:50  |
| 5m ago    | [⚡ do()]    | do(pressure) Δ:-15.2%         | pre:45% post:30%   |
| 8m ago    | [❓ What-If] | Effect:+12.3% Conf:87%        | base:45% cf:57%    |
| 12m ago   | [💡 AI]      | Health:78 Risk:medium         | 3 recs, high       |
| 15m ago   | [🧠 Infer]   | Normal (94%)                  | ATE:0.12 CATE:0.15 |
| 18m ago   | [📕 Case]    | Case 3: Thermal Overload      | L2 intervention    |
+---------------------------------------------------------------------------------+
```

### Row Density Comparison

Current List View: ~72px per item (icon, title, badge, description)
New Table View: ~32px per item (single row with all data)

**Result**: Display 2-3x more results in the same viewport height

---

## Implementation Steps

1. **Import Table components**
   - Add imports for Table, TableHeader, TableBody, TableRow, TableCell, TableHead

2. **Add sorting state and logic**
   - Add sortColumn and sortDirection state
   - Create sortedResults memoized computation

3. **Create extractCompactData helper**
   - Extract key metrics and config for each operation type
   - Return condensed string representations

4. **Create CompactTableView component**
   - Scrollable table with sticky headers
   - Sortable columns with click handlers
   - Compact row rendering

5. **Create CompactTableRow component**
   - Dense row with inline badges
   - Hover highlight and selection state
   - Delete action button

6. **Update main panel tabs**
   - Add "Table" tab option
   - Render CompactTableView when selected
   - Maintain selection sync with detail panel

---

## Benefits

1. **Space Efficiency**: See 2-3x more results at once
2. **Quick Scanning**: Consistent column layout for fast comparison
3. **Parameter Visibility**: Configuration values immediately visible
4. **Sortable**: Organize by time or type
5. **Excel-Familiar**: Users can scan like a spreadsheet
6. **Maintains Detail Panel**: Click any row to see full explanation

---

## Files to Modify

- **`src/components/OperationResultsPanel.tsx`**: Add CompactTableView, extractCompactData, sorting logic, and new tab

