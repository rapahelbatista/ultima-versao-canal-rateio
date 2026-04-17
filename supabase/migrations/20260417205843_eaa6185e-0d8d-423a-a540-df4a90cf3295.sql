ALTER TABLE public.installations
ADD COLUMN IF NOT EXISTS deploy_password text,
ADD COLUMN IF NOT EXISTS master_password text;