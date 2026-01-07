-- Allow anyone to insert batches (for external data management)
CREATE POLICY "Anyone can insert batches"
ON public.batches
FOR INSERT
WITH CHECK (true);

-- Allow anyone to update batches (for external data management)
CREATE POLICY "Anyone can update batches"
ON public.batches
FOR UPDATE
USING (true);