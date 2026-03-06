
CREATE TABLE public.gemini_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key text NOT NULL,
  label text NOT NULL DEFAULT 'API Key',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE public.gemini_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers full access gemini_api_keys"
  ON public.gemini_api_keys FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'teacher'::app_role))
  WITH CHECK (has_role(auth.uid(), 'teacher'::app_role));
