/**
 * Dataset Demo Panel
 * 
 * Displays 10 rows of simulated multi-modal input dataset
 * with CWRU accelerometer channels (DE, FE, BA),
 * environmental sensors (T, P, H), and rock image filenames.
 * Supports CSV and JSON export.
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileJson, FileSpreadsheet, TableProperties } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface DatasetRow {
  sample_id: string;
  cwru_de: number;
  cwru_fe: number;
  cwru_ba: number;
  env_temperature: number;
  env_pressure: number;
  env_humidity: number;
  rock_image: string;
  label: string;
}

const ROCK_IMAGE_FILES = [
  'rock_granite_001.png',
  'rock_sandstone_002.png',
  'rock_limestone_003.png',
  'rock_basalt_004.png',
  'rock_marble_005.png',
  'rock_shale_006.png',
  'rock_quartzite_007.png',
  'rock_gneiss_008.png',
  'rock_slate_009.png',
  'rock_dolomite_010.png',
];

const LABELS = [
  'Normal', 'IR_007', 'IR_014', 'IR_021',
  'OR_007', 'OR_014', 'OR_021',
  'BA_007', 'BA_014', 'BA_021',
];

function generateDemoDataset(): DatasetRow[] {
  // Seeded pseudo-random for reproducibility
  const seed = (i: number, offset: number) => {
    const x = Math.sin(i * 9301 + offset * 49297 + 12345) * 10000;
    return x - Math.floor(x);
  };

  return Array.from({ length: 10 }, (_, i) => {
    const labelIdx = i % LABELS.length;
    const isFault = labelIdx > 0;
    const severityFactor = isFault ? (1 + (labelIdx % 3) * 0.5) : 1.0;

    // CWRU Drive End: ~0.05-0.5 g for normal, amplified for faults
    const cwru_de = parseFloat(((0.03 + seed(i, 1) * 0.08) * severityFactor + (isFault ? seed(i, 10) * 0.35 : 0)).toFixed(4));
    // CWRU Fan End: ~0.02-0.3 g
    const cwru_fe = parseFloat(((0.02 + seed(i, 2) * 0.05) * severityFactor + (isFault ? seed(i, 11) * 0.2 : 0)).toFixed(4));
    // CWRU Base Accelerometer: ~0.01-0.15 g
    const cwru_ba = parseFloat(((0.01 + seed(i, 3) * 0.04) * severityFactor + (isFault ? seed(i, 12) * 0.12 : 0)).toFixed(4));

    // Environmental channels
    const env_temperature = parseFloat((22.0 + seed(i, 4) * 18.0 + (isFault ? 8.0 : 0)).toFixed(1));
    const env_pressure = parseFloat((100.5 + seed(i, 5) * 4.0 - (isFault ? 1.5 : 0)).toFixed(2));
    const env_humidity = parseFloat((40.0 + seed(i, 6) * 30.0).toFixed(1));

    return {
      sample_id: `S${String(i + 1).padStart(4, '0')}`,
      cwru_de,
      cwru_fe,
      cwru_ba,
      env_temperature,
      env_pressure,
      env_humidity,
      rock_image: ROCK_IMAGE_FILES[i],
      label: LABELS[labelIdx],
    };
  });
}

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
  const dataset = useMemo(() => generateDemoDataset(), []);

  const handleExportCSV = () => {
    const headers = ['Sample_ID', 'CWRU_DE(g)', 'CWRU_FE(g)', 'CWRU_BA(g)', 'Env_Temperature(°C)', 'Env_Pressure(kPa)', 'Env_Humidity(%)', 'Rock_Image', 'Label'];
    const rows = dataset.map(r => [
      r.sample_id, r.cwru_de, r.cwru_fe, r.cwru_ba,
      r.env_temperature, r.env_pressure, r.env_humidity,
      r.rock_image, r.label,
    ]);
    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    downloadFile(csv, `imschm-dataset-demo-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
  };

  const handleExportJSON = () => {
    const json = JSON.stringify({
      exportedAt: new Date().toISOString(),
      description: 'IMSCHM Multi-Modal Input Dataset Demo (10 samples)',
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
    downloadFile(json, `imschm-dataset-demo-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
  };

  return (
    <Card className="border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-transparent">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <TableProperties className="h-5 w-5 text-amber-500" />
            <span>{t('results.datasetDemo') || 'Dataset Demo (10 Samples)'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              6 signal + 1 image channels
            </Badge>
          </div>
        </CardTitle>
        <CardDescription className="text-xs">
          Simulated multi-modal input: 3 CWRU accelerometer channels (DE, FE, BA), 3 environmental sensors (T, P, H), and rock image filenames. Based on CWRU bearing fault dataset conventions.
        </CardDescription>
      </CardHeader>
      <CardContent>
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

        <div className="flex gap-2 mt-4">
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
