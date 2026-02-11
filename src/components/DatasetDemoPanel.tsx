/**
 * Dataset Demo Panel
 * 
 * Displays 10 rows of simulated multi-modal input dataset
 * with CWRU accelerometer channels (DE, FE, BA),
 * environmental sensors (T, P, H), and rock image filenames.
 * Supports CSV and JSON export with selectable simulation methods.
 */

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { FileJson, FileSpreadsheet, TableProperties, Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  generateDataset, getMethodInfo,
  SIMULATION_METHODS, type SimulationMethod, type DatasetRow,
} from '@/utils/datasetSimulation';

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const DatasetDemoPanel: React.FC = () => {
  const { t } = useLanguage();
  const [method, setMethod] = useState<SimulationMethod>('hash');
  const dataset = useMemo(() => generateDataset(method), [method]);
  const info = getMethodInfo(method);

  const handleExportCSV = () => {
    const headers = ['Sample_ID', 'CWRU_DE(g)', 'CWRU_FE(g)', 'CWRU_BA(g)', 'Env_Temperature(°C)', 'Env_Pressure(kPa)', 'Env_Humidity(%)', 'Rock_Image', 'Label'];
    const rows = dataset.map(r => [
      r.sample_id, r.cwru_de, r.cwru_fe, r.cwru_ba,
      r.env_temperature, r.env_pressure, r.env_humidity,
      r.rock_image, r.label,
    ]);
    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    downloadFile(csv, `imschm-dataset-${method}-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
  };

  const handleExportJSON = () => {
    const json = JSON.stringify({
      exportedAt: new Date().toISOString(),
      simulationMethod: { id: info.id, name: info.name, formula: info.formula },
      description: `IMSCHM Multi-Modal Input Dataset Demo (10 samples, ${info.name})`,
      channels: {
        cwru_de: 'CWRU Drive End Accelerometer (g)',
        cwru_fe: 'CWRU Fan End Accelerometer (g)',
        cwru_ba: 'CWRU Base Accelerometer (g)',
        env_temperature: 'Environmental Temperature (°C)',
        env_pressure: 'Environmental Pressure (kPa)',
        env_humidity: 'Environmental Humidity (%)',
        rock_image: 'TBM Rock Face Image Filename',
        label: 'Bearing Fault Class (CWRU Standard)',
      },
      samples: dataset,
    }, null, 2);
    downloadFile(json, `imschm-dataset-${method}-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
  };

  return (
    <Card className="border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-transparent">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <TableProperties className="h-5 w-5 text-amber-500" />
            <span>{t('results.datasetDemo') || 'Dataset Demo (10 Samples)'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Select value={method} onValueChange={(v) => setMethod(v as SimulationMethod)}>
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SIMULATION_METHODS.map(m => (
                  <SelectItem key={m.id} value={m.id} className="text-xs">
                    {m.shortName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="outline" className="text-xs whitespace-nowrap">
              6 signal + 1 image channels
            </Badge>
          </div>
        </CardTitle>
        <CardDescription className="text-xs">
          Simulated multi-modal input: 3 CWRU accelerometer channels (DE, FE, BA), 3 environmental sensors (T, P, H), and rock image filenames.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Method description card */}
        <div className="rounded-md border border-muted p-3 space-y-2 bg-muted/30">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-amber-500 shrink-0" />
            <span className="text-xs font-semibold">{info.name}</span>
          </div>
          <p className="text-xs text-muted-foreground">{info.description}</p>
          <div className="font-mono text-xs bg-background/60 rounded px-2 py-1 border border-border">
            {info.formula}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
            <div>
              <span className="text-xs font-medium flex items-center gap-1 mb-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" /> Strengths
              </span>
              <ul className="text-xs text-muted-foreground space-y-0.5">
                {info.strengths.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-1">
                    <span className="text-green-500 mt-0.5">•</span> {s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <span className="text-xs font-medium flex items-center gap-1 mb-1">
                <AlertTriangle className="h-3 w-3 text-yellow-500" /> Limitations
              </span>
              <ul className="text-xs text-muted-foreground space-y-0.5">
                {info.limitations.map((l, idx) => (
                  <li key={idx} className="flex items-start gap-1">
                    <span className="text-yellow-500 mt-0.5">•</span> {l}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Data table */}
        <ScrollArea className="w-full">
          <div className="min-w-[800px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs w-[70px]">ID</TableHead>
                  <TableHead className="text-xs text-right">DE (g)</TableHead>
                  <TableHead className="text-xs text-right">FE (g)</TableHead>
                  <TableHead className="text-xs text-right">BA (g)</TableHead>
                  <TableHead className="text-xs text-right">Temp (°C)</TableHead>
                  <TableHead className="text-xs text-right">Press (kPa)</TableHead>
                  <TableHead className="text-xs text-right">Humid (%)</TableHead>
                  <TableHead className="text-xs">Rock Image</TableHead>
                  <TableHead className="text-xs">Label</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataset.map((row) => (
                  <TableRow key={row.sample_id} className="text-xs font-mono">
                    <TableCell className="py-1.5 font-semibold">{row.sample_id}</TableCell>
                    <TableCell className="py-1.5 text-right">{row.cwru_de.toFixed(4)}</TableCell>
                    <TableCell className="py-1.5 text-right">{row.cwru_fe.toFixed(4)}</TableCell>
                    <TableCell className="py-1.5 text-right">{row.cwru_ba.toFixed(4)}</TableCell>
                    <TableCell className="py-1.5 text-right">{row.env_temperature.toFixed(1)}</TableCell>
                    <TableCell className="py-1.5 text-right">{row.env_pressure.toFixed(2)}</TableCell>
                    <TableCell className="py-1.5 text-right">{row.env_humidity.toFixed(1)}</TableCell>
                    <TableCell className="py-1.5 text-muted-foreground">{row.rock_image}</TableCell>
                    <TableCell className="py-1.5">
                      <Badge
                        variant={row.label === 'Normal' ? 'default' : 'destructive'}
                        className="text-xs px-1.5 py-0"
                      >
                        {row.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportJSON}>
            <FileJson className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DatasetDemoPanel;
