

# Plano: Self-Hosting Completo na VPS (Sem Lovable/Supabase)

## Visao Geral

Migrar **todo o sistema** para rodar 100% na sua VPS: frontend, backend (API), banco de dados e WhatsApp. Zero dependencia de Lovable ou servicos externos (exceto Resend para emails, opcional).

## Arquitetura Final na VPS

```text
VPS (Ubuntu)
├── Nginx (reverse proxy + SSL)
│   ├── monitor.seudominio.com.br → /home/deploy/monitor/dist (frontend estático)
│   └── api-monitor.seudominio.com.br → localhost:3200 (API Express)
├── PostgreSQL (banco local)
│   └── database: monitor_db
├── API Express (Node.js + PM2)
│   ├── /api/check-block-status
│   ├── /api/register-installation
│   ├── /api/manage-installations
│   ├── /api/whatsapp-proxy
│   ├── /api/whatsapp-welcome
│   ├── /api/register-zapmeow
│   ├── /api/setup-admin
│   └── /api/auth/login
└── ZapMeow (Docker — já instalado)
```

## O que sera feito

### 1. Criar backend Express.js local (`monitor-api/`)
Novo projeto Node.js/Express com:
- **7 rotas** convertidas das Edge Functions atuais para Express
- **Auth local** com bcrypt + jsonwebtoken (JWT) em vez de Supabase Auth
- **PostgreSQL local** via `pg` (node-postgres) em vez de Supabase client
- **Middleware de auth** para rotas protegidas (verifica JWT no header)
- **PM2** para manter rodando

### 2. Criar schema SQL para PostgreSQL local
Tabelas:
- `users` (id, email, password_hash, created_at)
- `user_roles` (id, user_id, role)
- `installations` (id, ip, frontend_url, backend_url, admin_url, deploy_password, master_password, hostname, os_info, installer_version, is_blocked, block_reason, blocked_at, created_at, updated_at)
- `purchase_links` (id, token, client_label, status, created_at)
- `purchase_requests` (id, link_id, contact_name, contact_email, contact_phone, company_name, document_type, document_number, usage_type, how_found_us, agreed_anti_piracy, notes, created_at)
- `whatsapp_config` (id, zapmeow_url, instance_id, is_active, created_at, updated_at)
- `whatsapp_templates` (id, template_key, title, message_body, is_active, created_at, updated_at)

### 3. Modificar o frontend React
- Trocar `supabase.from(...)` por chamadas `fetch()` ao backend Express local
- Trocar `supabase.auth.signIn/signUp` por `/api/auth/login`
- Variavel de ambiente: `VITE_API_URL=https://api-monitor.seudominio.com.br`
- Remover dependencia do `@supabase/supabase-js`

### 4. Atualizar o instalador (`instalador_single.sh`)
Nova opcao no menu que:
1. Instala Node.js 20, PostgreSQL, Nginx, Certbot
2. Cria banco `monitor_db` com todas as tabelas
3. Clona repositorio do GitHub
4. Faz build do frontend (`npm run build`)
5. Instala e inicia a API com PM2
6. Configura Nginx (2 subdomínios: frontend + API)
7. SSL via Certbot
8. Cria usuario admin inicial
9. Integra com ZapMeow (se presente)

## Detalhes tecnicos

### Mapeamento Edge Functions → Express Routes

| Edge Function | Rota Express | Auth |
|---|---|---|
| check-block-status | GET/POST /api/check-block-status | Publico |
| register-installation | POST /api/register-installation | Publico |
| manage-installations | GET/POST /api/manage-installations | Admin JWT |
| whatsapp-proxy | POST /api/whatsapp-proxy | Admin JWT |
| whatsapp-welcome | POST /api/whatsapp-welcome | Publico |
| register-zapmeow | POST /api/register-zapmeow | Publico |
| setup-admin | POST /api/setup-admin | Admin JWT |
| — | POST /api/auth/login | Publico |

### Arquivos criados/modificados
- `monitor-api/` — novo diretório com o backend Express completo
  - `server.js`, `routes/`, `middleware/auth.js`, `db.js`, `schema.sql`
- `src/integrations/supabase/client.ts` → substituido por `src/lib/api.ts` (fetch wrapper)
- `src/pages/*.tsx` — trocar chamadas Supabase por API local
- `src/App.tsx` — trocar auth Supabase por auth JWT local
- `instalador_single.sh` — nova opcao de menu

### Pre-requisitos
1. Conectar projeto ao GitHub (Settings → GitHub)
2. VPS com Ubuntu 20+ e root
3. Subdomínios apontando para o IP da VPS (2 registros A)

## Sequencia de implementacao
1. Criar `monitor-api/` (backend Express + schema SQL)
2. Criar `src/lib/api.ts` (cliente HTTP para substituir Supabase)
3. Refatorar paginas do frontend para usar API local
4. Refatorar auth (login/sessao) para JWT local
5. Atualizar instalador com nova opcao de deploy completo

