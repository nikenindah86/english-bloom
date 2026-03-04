
-- Create materials storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('materials', 'materials', true);

-- Allow authenticated users to read files
CREATE POLICY "Authenticated users can read materials files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'materials');

-- Allow teachers to upload files
CREATE POLICY "Teachers can upload materials files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'materials'
  AND public.has_role(auth.uid(), 'teacher')
);

-- Allow teachers to delete files
CREATE POLICY "Teachers can delete materials files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'materials'
  AND public.has_role(auth.uid(), 'teacher')
);

-- Allow teachers to view all user_roles (needed for student management)
CREATE POLICY "Teachers can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'teacher'));
