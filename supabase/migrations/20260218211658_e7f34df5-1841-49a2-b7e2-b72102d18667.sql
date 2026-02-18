
-- Tabela principal de instalações
CREATE TABLE public.installations (
  id BIGSERIAL PRIMARY KEY,
  ip TEXT NOT NULL,
  frontend_url TEXT NOT NULL,
  backend_url TEXT NOT NULL,
  admin_url TEXT,
  deploy_password TEXT,
  master_password TEXT,
  hostname TEXT,
  os_info TEXT,
  installer_version TEXT,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  block_reason TEXT,
  blocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.installations ENABLE ROW LEVEL SECURITY;

-- Política: apenas service_role pode acessar (dashboard usa service role via edge function)
-- Acesso público de INSERT para o instalador registrar via edge function
-- SELECT/UPDATE bloqueados para anon (acesso via edge function autenticada)
CREATE POLICY "Service role full access"
  ON public.installations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER installations_updated_at
  BEFORE UPDATE ON public.installations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Índices para performance
CREATE INDEX idx_installations_created_at ON public.installations(created_at DESC);
CREATE INDEX idx_installations_ip ON public.installations(ip);
CREATE INDEX idx_installations_is_blocked ON public.installations(is_blocked);
