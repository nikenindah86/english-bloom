
CREATE TABLE public.assignment_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(assignment_id, material_id)
);

ALTER TABLE public.assignment_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers full access assignment_materials"
  ON public.assignment_materials FOR ALL
  USING (public.has_role(auth.uid(), 'teacher'))
  WITH CHECK (public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Students can view assignment materials"
  ON public.assignment_materials FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
      JOIN public.profiles p ON p.class_id = a.class_id
      WHERE a.id = assignment_materials.assignment_id
      AND p.id = auth.uid()
    )
  );
