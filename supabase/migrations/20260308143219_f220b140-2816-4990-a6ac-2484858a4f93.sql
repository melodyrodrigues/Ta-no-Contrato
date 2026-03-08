
CREATE TABLE public.contract_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Contrato sem título',
  contract_text TEXT NOT NULL,
  analysis_result TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contract_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analyses"
  ON public.contract_analyses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses"
  ON public.contract_analyses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own analyses"
  ON public.contract_analyses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
