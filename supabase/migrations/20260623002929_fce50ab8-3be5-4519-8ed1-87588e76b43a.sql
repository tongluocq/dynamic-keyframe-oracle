
-- Rock image metadata
CREATE TABLE public.rock_samples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path text NOT NULL UNIQUE,
  filename text NOT NULL,
  fault_class text NOT NULL,
  source text,
  notes text,
  size_bytes bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rock_samples TO anon, authenticated;
GRANT ALL ON public.rock_samples TO service_role;
ALTER TABLE public.rock_samples ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rock_samples open read" ON public.rock_samples FOR SELECT USING (true);
CREATE POLICY "rock_samples open insert" ON public.rock_samples FOR INSERT WITH CHECK (true);
CREATE POLICY "rock_samples open delete" ON public.rock_samples FOR DELETE USING (true);

-- CWRU sample metadata
CREATE TABLE public.cwru_samples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path text NOT NULL UNIQUE,
  filename text NOT NULL,
  fault_class text NOT NULL,           -- normal | inner_race | outer_race | ball
  fault_size_in numeric,               -- 0.007, 0.014, 0.021 ...
  load_hp numeric,                     -- 0, 1, 2, 3
  rpm integer,
  sample_rate_hz integer DEFAULT 12000,
  row_count integer,
  source text,
  notes text,
  size_bytes bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cwru_samples TO anon, authenticated;
GRANT ALL ON public.cwru_samples TO service_role;
ALTER TABLE public.cwru_samples ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cwru_samples open read" ON public.cwru_samples FOR SELECT USING (true);
CREATE POLICY "cwru_samples open insert" ON public.cwru_samples FOR INSERT WITH CHECK (true);
CREATE POLICY "cwru_samples open delete" ON public.cwru_samples FOR DELETE USING (true);

-- Storage policies: allow anon + authenticated to read/write/delete inside these two buckets only
CREATE POLICY "rock-images anon read"   ON storage.objects FOR SELECT USING (bucket_id = 'rock-images');
CREATE POLICY "rock-images anon insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'rock-images');
CREATE POLICY "rock-images anon delete" ON storage.objects FOR DELETE USING (bucket_id = 'rock-images');

CREATE POLICY "cwru-signals anon read"   ON storage.objects FOR SELECT USING (bucket_id = 'cwru-signals');
CREATE POLICY "cwru-signals anon insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'cwru-signals');
CREATE POLICY "cwru-signals anon delete" ON storage.objects FOR DELETE USING (bucket_id = 'cwru-signals');
