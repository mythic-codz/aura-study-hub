-- Add structured_data column to batches table for hierarchical content
ALTER TABLE public.batches 
ADD COLUMN IF NOT EXISTS structured_data JSONB DEFAULT '{}'::jsonb;

-- Add comment explaining the structure
COMMENT ON COLUMN public.batches.structured_data IS 'Hierarchical structure: { subjects: [{ name, topics: [{ name, videos: [], pdfs: [] }] }] }';