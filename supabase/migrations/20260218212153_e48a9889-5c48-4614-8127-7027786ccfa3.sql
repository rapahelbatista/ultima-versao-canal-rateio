
-- Adicionar constraint única para upsert por ip + frontend_url
ALTER TABLE public.installations 
  ADD CONSTRAINT installations_ip_frontend_url_key UNIQUE (ip, frontend_url);
