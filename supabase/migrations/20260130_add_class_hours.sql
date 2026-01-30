-- Add default_hours to classes table
ALTER TABLE public.classes 
ADD COLUMN IF NOT EXISTS default_hours NUMERIC DEFAULT 1.0;

-- Comment on column
COMMENT ON COLUMN public.classes.default_hours IS 'Default hours consumed per class session';
