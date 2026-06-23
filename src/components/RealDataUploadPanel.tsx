/**
 * RealDataUploadPanel
 * ----------------------------------------------------------------------
 * Lets users upload real rock images and CWRU bearing CSV files into
 * Lovable Cloud storage so they persist across reloads / browsers.
 *
 * Storage buckets (private, anon-readable via RLS):
 *   - rock-images   : <fault_class>/<uuid>_<original>.jpg|png
 *   - cwru-signals  : <fault_class>/<uuid>_<original>.csv
 *
 * Metadata tables:
 *   - public.rock_samples
 *   - public.cwru_samples
 *
 * Expected CWRU CSV format (header required):
 *   t,DE,FE,BA
 *   0.0000,0.0123,-0.0041,0.0007
 *   ...
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Database, Image as ImageIcon, Upload, Trash2, Info, CheckCircle2, AlertCircle, Loader2, FileDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const ROCK_CLASSES = [
  'granite_intact', 'granite_fractured',
  'sandstone_intact', 'sandstone_fractured',
  'limestone_intact', 'limestone_fractured',
  'other',
] as const;

const CWRU_CLASSES = ['normal', 'inner_race', 'outer_race', 'ball'] as const;

interface RockRow {
  id: string; storage_path: string; filename: string; fault_class: string;
  size_bytes: number | null; created_at: string; source: string | null;
}
interface CwruRow {
  id: string; storage_path: string; filename: string; fault_class: string;
  fault_size_in: number | null; load_hp: number | null; rpm: number | null;
  sample_rate_hz: number | null; row_count: number | null;
  size_bytes: number | null; created_at: string; source: string | null;
}

const RealDataUploadPanel: React.FC = () => {
  const { toast } = useToast();

  // ---- Rock images state
  const [rockClass, setRockClass] = useState<string>(ROCK_CLASSES[0]);
  const [rockSource, setRockSource] = useState('');
  const [rockFiles, setRockFiles] = useState<FileList | null>(null);
  const [rockUploading, setRockUploading] = useState(false);
  const [rocks, setRocks] = useState<RockRow[]>([]);

  // ---- CWRU state
  const [cwruClass, setCwruClass] = useState<string>(CWRU_CLASSES[0]);
  const [cwruFaultSize, setCwruFaultSize] = useState<string>('');
  const [cwruLoadHp, setCwruLoadHp] = useState<string>('0');
  const [cwruRpm, setCwruRpm] = useState<string>('1797');
  const [cwruRate, setCwruRate] = useState<string>('12000');
  const [cwruSource, setCwruSource] = useState('CWRU Bearing Data Center');
  const [cwruFile, setCwruFile] = useState<File | null>(null);
  const [cwruUploading, setCwruUploading] = useState(false);
  const [cwrus, setCwrus] = useState<CwruRow[]>([]);

  const refresh = useCallback(async () => {
    const [{ data: r }, { data: c }] = await Promise.all([
      supabase.from('rock_samples').select('*').order('created_at', { ascending: false }),
      supabase.from('cwru_samples').select('*').order('created_at', { ascending: false }),
    ]);
    setRocks((r as RockRow[]) || []);
    setCwrus((c as CwruRow[]) || []);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // ---------- Rock upload ----------
  const handleRockUpload = useCallback(async () => {
    if (!rockFiles || rockFiles.length === 0) return;
    setRockUploading(true);
    let ok = 0, fail = 0;
    for (const file of Array.from(rockFiles)) {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${rockClass}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('rock-images').upload(path, file, { upsert: false, contentType: file.type });
      if (upErr) { fail++; continue; }
      const { error: dbErr } = await supabase.from('rock_samples').insert({
        storage_path: path, filename: file.name, fault_class: rockClass,
        source: rockSource || null, size_bytes: file.size,
      });
      if (dbErr) { fail++; } else { ok++; }
    }
    setRockUploading(false);
    setRockFiles(null);
    toast({
      title: `Uploaded ${ok} image${ok === 1 ? '' : 's'}`,
      description: fail ? `${fail} failed` : 'All files saved to Lovable Cloud',
    });
    refresh();
  }, [rockFiles, rockClass, rockSource, refresh, toast]);

  const handleRockDelete = useCallback(async (row: RockRow) => {
    await supabase.storage.from('rock-images').remove([row.storage_path]);
    await supabase.from('rock_samples').delete().eq('id', row.id);
    refresh();
  }, [refresh]);

  // ---------- CWRU upload (validates header) ----------
  const validateCwruCsv = (text: string): { ok: boolean; rows: number; msg?: string } => {
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length < 2) return { ok: false, rows: 0, msg: 'File is empty' };
    const header = lines[0].toLowerCase().replace(/\s+/g, '');
    const required = ['t,de,fe,ba', 'time,de,fe,ba'];
    if (!required.includes(header)) {
      return { ok: false, rows: 0, msg: `Header must be "t,DE,FE,BA". Got: "${lines[0]}"` };
    }
    return { ok: true, rows: lines.length - 1 };
  };

  const handleCwruUpload = useCallback(async () => {
    if (!cwruFile) return;
    setCwruUploading(true);
    const text = await cwruFile.text();
    const check = validateCwruCsv(text);
    if (!check.ok) {
      toast({ title: 'CSV rejected', description: check.msg, variant: 'destructive' });
      setCwruUploading(false);
      return;
    }
    const path = `${cwruClass}/${crypto.randomUUID()}.csv`;
    const { error: upErr } = await supabase.storage
      .from('cwru-signals').upload(path, cwruFile, { upsert: false, contentType: 'text/csv' });
    if (upErr) {
      toast({ title: 'Upload failed', description: upErr.message, variant: 'destructive' });
      setCwruUploading(false);
      return;
    }
    const { error: dbErr } = await supabase.from('cwru_samples').insert({
      storage_path: path,
      filename: cwruFile.name,
      fault_class: cwruClass,
      fault_size_in: cwruFaultSize ? Number(cwruFaultSize) : null,
      load_hp: cwruLoadHp ? Number(cwruLoadHp) : null,
      rpm: cwruRpm ? Number(cwruRpm) : null,
      sample_rate_hz: cwruRate ? Number(cwruRate) : 12000,
      row_count: check.rows,
      source: cwruSource || null,
      size_bytes: cwruFile.size,
    });
    if (dbErr) {
      toast({ title: 'Metadata save failed', description: dbErr.message, variant: 'destructive' });
    } else {
      toast({ title: 'CWRU file uploaded', description: `${check.rows} samples · ${cwruClass}` });
    }
    setCwruUploading(false);
    setCwruFile(null);
    refresh();
  }, [cwruFile, cwruClass, cwruFaultSize, cwruLoadHp, cwruRpm, cwruRate, cwruSource, refresh, toast]);

  const handleCwruDelete = useCallback(async (row: CwruRow) => {
    await supabase.storage.from('cwru-signals').remove([row.storage_path]);
    await supabase.from('cwru_samples').delete().eq('id', row.id);
    refresh();
  }, [refresh]);

  const handleDownload = useCallback(async (bucket: string, path: string, filename: string) => {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60);
    if (error || !data) return;
    const a = document.createElement('a');
    a.href = data.signedUrl; a.download = filename; a.click();
  }, []);

  const rockCounts = ROCK_CLASSES.map(c => [c, rocks.filter(r => r.fault_class === c).length] as const);
  const cwruCounts = CWRU_CLASSES.map(c => [c, cwrus.filter(r => r.fault_class === c).length] as const);

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Real Data Upload — Cloud Storage
          </span>
          <Badge variant="outline">Persistent</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="rocks">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="rocks"><ImageIcon className="h-4 w-4 mr-1" />Rock images</TabsTrigger>
            <TabsTrigger value="cwru"><Database className="h-4 w-4 mr-1" />CWRU CSV</TabsTrigger>
            <TabsTrigger value="help"><Info className="h-4 w-4 mr-1" />How to prepare</TabsTrigger>
          </TabsList>

          {/* ============ ROCK IMAGES ============ */}
          <TabsContent value="rocks" className="space-y-4 pt-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Folder convention</AlertTitle>
              <AlertDescription>
                Files are saved as <code>rock-images/&lt;fault_class&gt;/&lt;uuid&gt;.ext</code>.
                The <strong>fault class is the label</strong> used during training.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Fault class (label)</Label>
                <Select value={rockClass} onValueChange={setRockClass}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROCK_CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Source / citation (optional)</Label>
                <Input className="h-9" value={rockSource} onChange={e => setRockSource(e.target.value)}
                       placeholder="e.g. Site A, 2024-05-12" />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Image files (multi-select OK · jpg / png / webp)</Label>
              <Input type="file" accept="image/*" multiple
                     onChange={e => setRockFiles(e.target.files)} disabled={rockUploading} />
            </div>

            <Button onClick={handleRockUpload}
                    disabled={!rockFiles || rockFiles.length === 0 || rockUploading}
                    className="w-full">
              {rockUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              {rockUploading ? 'Uploading…' : `Upload ${rockFiles?.length || 0} image(s) to "${rockClass}"`}
            </Button>

            <div className="flex flex-wrap gap-1">
              {rockCounts.map(([c, n]) => (
                <Badge key={c} variant={n > 0 ? 'default' : 'outline'}>{c}: {n}</Badge>
              ))}
            </div>

            <div>
              <Label className="text-sm">Stored ({rocks.length})</Label>
              <ScrollArea className="h-48 border rounded p-2 mt-1">
                {rocks.length === 0 && <p className="text-xs text-muted-foreground">No rock images uploaded yet.</p>}
                {rocks.map(r => (
                  <div key={r.id} className="flex items-center justify-between text-xs py-1 border-b last:border-b-0">
                    <span className="truncate flex-1 mr-2">
                      <Badge variant="secondary" className="mr-1">{r.fault_class}</Badge>
                      {r.filename}
                    </span>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-6 w-6"
                              onClick={() => handleDownload('rock-images', r.storage_path, r.filename)}>
                        <FileDown className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6"
                              onClick={() => handleRockDelete(r)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
          </TabsContent>

          {/* ============ CWRU CSV ============ */}
          <TabsContent value="cwru" className="space-y-4 pt-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Required CSV format</AlertTitle>
              <AlertDescription className="text-xs font-mono whitespace-pre">
{`t,DE,FE,BA
0.0000000,0.0123,-0.0041,0.0007
0.0000833,0.0118,-0.0039,0.0008
...`}
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Fault class</Label>
                <Select value={cwruClass} onValueChange={setCwruClass}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CWRU_CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Fault size (in.)</Label>
                <Input className="h-9" type="number" step="0.001" value={cwruFaultSize}
                       onChange={e => setCwruFaultSize(e.target.value)} placeholder="0.007 / 0.014 / 0.021" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Motor load (HP)</Label>
                <Input className="h-9" type="number" step="1" value={cwruLoadHp}
                       onChange={e => setCwruLoadHp(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">RPM</Label>
                <Input className="h-9" type="number" value={cwruRpm}
                       onChange={e => setCwruRpm(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Sample rate (Hz)</Label>
                <Input className="h-9" type="number" value={cwruRate}
                       onChange={e => setCwruRate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Source</Label>
                <Input className="h-9" value={cwruSource}
                       onChange={e => setCwruSource(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">CWRU CSV file</Label>
              <Input type="file" accept=".csv,text/csv"
                     onChange={e => setCwruFile(e.target.files?.[0] || null)} disabled={cwruUploading} />
              {cwruFile && (
                <p className="text-xs text-muted-foreground">{cwruFile.name} · {(cwruFile.size/1024).toFixed(1)} KB</p>
              )}
            </div>

            <Button onClick={handleCwruUpload} disabled={!cwruFile || cwruUploading} className="w-full">
              {cwruUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              {cwruUploading ? 'Validating + uploading…' : `Upload CSV to "${cwruClass}"`}
            </Button>

            <div className="flex flex-wrap gap-1">
              {cwruCounts.map(([c, n]) => (
                <Badge key={c} variant={n > 0 ? 'default' : 'outline'}>{c}: {n}</Badge>
              ))}
            </div>

            <div>
              <Label className="text-sm">Stored ({cwrus.length})</Label>
              <ScrollArea className="h-48 border rounded p-2 mt-1">
                {cwrus.length === 0 && <p className="text-xs text-muted-foreground">No CWRU files uploaded yet.</p>}
                {cwrus.map(r => (
                  <div key={r.id} className="flex items-center justify-between text-xs py-1 border-b last:border-b-0">
                    <span className="truncate flex-1 mr-2">
                      <Badge variant="secondary" className="mr-1">{r.fault_class}</Badge>
                      {r.filename}
                      <span className="text-muted-foreground ml-1">
                        ({r.row_count ?? '?'} rows · {r.load_hp ?? '?'}HP · {r.rpm ?? '?'}rpm)
                      </span>
                    </span>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-6 w-6"
                              onClick={() => handleDownload('cwru-signals', r.storage_path, r.filename)}>
                        <FileDown className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6"
                              onClick={() => handleCwruDelete(r)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
          </TabsContent>

          {/* ============ HELP ============ */}
          <TabsContent value="help" className="space-y-3 pt-4 text-sm">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Recommended folder structure (on your machine)</AlertTitle>
              <AlertDescription>
                <pre className="text-xs mt-2 whitespace-pre">{`rocks/
  granite_intact/      *.jpg | *.png  (any resolution; auto-resized to 128x128)
  granite_fractured/
  sandstone_intact/
  sandstone_fractured/
  limestone_intact/
  limestone_fractured/

cwru/
  normal/              N_0hp.csv, N_1hp.csv, ...
  inner_race/          IR007_0hp.csv, IR014_0hp.csv, ...
  outer_race/          OR007@6_0hp.csv, ...
  ball/                B007_0hp.csv, ...`}</pre>
                <p className="mt-2">Select the matching <strong>fault class</strong> in the dropdown
                  before each batch — that becomes the training label.</p>
              </AlertDescription>
            </Alert>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Converting CWRU .mat → CSV (one time)</AlertTitle>
              <AlertDescription>
                The official CWRU files are MATLAB <code>.mat</code>. Convert each file with this
                Python snippet, then upload the CSV here:
                <pre className="text-xs mt-2 whitespace-pre overflow-x-auto">{`# pip install scipy numpy
from scipy.io import loadmat
import numpy as np, csv, glob, os

FS = 12000  # or 48000 depending on the file
for path in glob.glob("*.mat"):
    m = loadmat(path)
    de = next(v for k,v in m.items() if k.endswith("_DE_time"))
    fe = next((v for k,v in m.items() if k.endswith("_FE_time")), np.zeros_like(de))
    ba = next((v for k,v in m.items() if k.endswith("_BA_time")), np.zeros_like(de))
    de, fe, ba = de.flatten(), fe.flatten(), ba.flatten()
    n = min(len(de), len(fe), len(ba))
    t = np.arange(n) / FS
    out = os.path.splitext(path)[0] + ".csv"
    with open(out, "w", newline="") as f:
        w = csv.writer(f); w.writerow(["t","DE","FE","BA"])
        for i in range(n): w.writerow([t[i], de[i], fe[i], ba[i]])
    print(out)`}</pre>
              </AlertDescription>
            </Alert>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Where to download the originals</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside text-xs space-y-1 mt-1">
                  <li><strong>CWRU Bearing Data Center</strong> — <code>engineering.case.edu/bearingdatacenter</code></li>
                  <li><strong>NASA IMS Bearing</strong> — <code>data.nasa.gov</code> (search "IMS bearing")</li>
                  <li><strong>MFPT Bearing Fault</strong> — <code>mfpt.org/fault-data-sets</code></li>
                  <li><strong>Rock images</strong> — Kaggle "Rock Classification" / "Rock Lithology" datasets,
                      or USGS public collections.</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Persistence</AlertTitle>
              <AlertDescription className="text-xs">
                Files live in Lovable Cloud storage and persist across reloads, browsers, and devices.
                They are <strong>not</strong> committed to GitHub — the repo only holds the upload UI.
                To bundle a fixed demo set into the repo instead, drop files under
                <code> public/datasets/&lt;type&gt;/&lt;class&gt;/</code> and they will ship with the build.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default RealDataUploadPanel;
