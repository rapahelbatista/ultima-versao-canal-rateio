

# Plano: Adicionar Opção [4] ao Instalador — Painel Monitor Completo

## O que será feito

Adicionar a opção **[4] Instalar Painel Monitor Anti-Pirataria** ao menu principal do `instalador_single.sh`. Essa opção instala automaticamente:

- **PostgreSQL** (banco `monitor_db` + schema completo)
- **API Express** (monitor-api na porta 3200, gerenciada pelo PM2)
- **Frontend React** (build estático servido pelo Nginx)
- **Nginx** (2 subdomínios: painel + API, com SSL via Certbot)
- **Admin inicial** (cria usuário admin no banco)
- **Integração ZapMeow** (opcional, registra instância existente)
- **CLI de manutenção** (`monitor-cli update/logs/status`)

## Fluxo da instalação

1. Solicita: URL do repositório GitHub, subdomínio do painel, subdomínio da API, email SSL, email/senha admin
2. Verifica DNS dos 2 subdomínios
3. Instala Node.js 20 + PostgreSQL + Nginx + Certbot (se não existirem)
4. Cria banco `monitor_db`, usuário e executa `schema.sql`
5. Clona repositório, instala dependências do `monitor-api/`, cria `.env`
6. Inicia API com PM2
7. Faz build do frontend com `VITE_API_URL` configurado
8. Configura Nginx (SPA fallback + reverse proxy para API)
9. Gera SSL com Certbot
10. Cria admin inicial via `node create-admin.js`
11. Pergunta se quer registrar ZapMeow existente
12. Cria comando global `monitor-cli`
13. Exibe resumo com URLs e credenciais

## Detalhes técnicos

### Arquivo modificado
- `instalador_single.sh` — adicionar:
  - Nova opção `[4]` no menu (entre opção 3 e 0)
  - Função `instalar_painel_monitor()` (~200 linhas)
  - Função auxiliar `atualizar_painel_monitor()` para updates futuros

### Estrutura na VPS após instalação
```text
/home/deploy/monitor/
├── monitor-api/
│   ├── .env          ← DB_HOST, JWT_SECRET, PORT=3200
│   ├── server.js
│   ├── routes/
│   └── node_modules/
├── dist/             ← build estático do frontend
│   └── index.html
└── .env              ← VITE_API_URL=https://api-monitor.dominio.com
```

### Nginx
- `monitor.dominio.com` → `root /home/deploy/monitor/dist` (SPA)
- `api-monitor.dominio.com` → `proxy_pass http://localhost:3200`

### Pré-requisitos
- Projeto conectado ao GitHub (Settings → GitHub)
- 2 registros A no DNS apontando para o IP da VPS
- VPS com Ubuntu 20+ e acesso root

