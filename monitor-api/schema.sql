-- EquipeChat Monitor — PostgreSQL Schema
-- Execute: psql -U monitor_user -d monitor_db -f schema.sql

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TYPE app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

CREATE TABLE IF NOT EXISTS installations (
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

CREATE TABLE IF NOT EXISTS purchase_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  client_label TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS purchase_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID REFERENCES purchase_links(id),
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  company_name TEXT NOT NULL,
  document_type TEXT NOT NULL,
  document_number TEXT NOT NULL,
  usage_type TEXT NOT NULL,
  how_found_us TEXT,
  agreed_anti_piracy BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS whatsapp_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zapmeow_url TEXT NOT NULL,
  instance_id TEXT NOT NULL DEFAULT 'equipechat',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT NOT NULL,
  title TEXT NOT NULL,
  message_body TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Default templates
INSERT INTO whatsapp_templates (template_key, title, message_body) VALUES
  ('welcome', 'Boas-vindas', E'🎉 *Olá, {{contact_name}}!*\n\nSeja muito bem-vindo(a) ao *EquipeChat*! 🚀\n\nRecebemos o formulário de aquisição da empresa *{{company_name}}* com sucesso. ✅\n\n— *Equipe EquipeChat*'),
  ('block', 'Aviso de Bloqueio', E'⚠️ *AVISO DE BLOQUEIO*\n\nPrezado(a) *{{contact_name}}*,\n\nA instalação *{{hostname}}* da empresa *{{company_name}}* foi bloqueada.\n\nMotivo: {{reason}}\nData: {{date}}\n\n— *EquipeChat*'),
  ('unblock', 'Aviso de Desbloqueio', E'✅ *DESBLOQUEIO*\n\nPrezado(a) *{{contact_name}}*,\n\nA instalação *{{hostname}}* da empresa *{{company_name}}* foi desbloqueada com sucesso.\n\nData: {{date}}\n\n— *EquipeChat*')
ON CONFLICT DO NOTHING;
