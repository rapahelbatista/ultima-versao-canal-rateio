

# Plano: Adicionar Instalação do Painel Monitor + WhatsApp ao Instalador

## Visão Geral

O instalador `instalador_single-2.sh` será modificado para incluir uma nova opção no menu que instala o **Painel Monitor Anti-Pirataria** (este projeto React/Vite) na VPS do operador, junto com o serviço de notificações WhatsApp (ZapMeow). Assim, o operador terá tudo rodando no seu próprio domínio, sem referência à Lovable.

## O que será feito

### 1. Nova opção no menu principal: "Instalar Painel Monitor"
- Adicionada como opção `[11]` no menu
- Solicita:
  - Subdomínio para o painel (ex: `monitor.equipechat.com.br`)
  - Email para SSL
  - Porta (padrão: 4000)

### 2. Função `instalar_painel_monitor()`
A função fará:

1. **Verificar DNS** do subdomínio informado
2. **Clonar o repositório** do painel do GitHub (precisa conectar o projeto ao GitHub primeiro nas Settings do Lovable)
3. **Criar o `.env`** com as variáveis do backend na nuvem:
   ```
   VITE_SUPABASE_URL=https://cicwzhpsiewdpugmceqm.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGci...
   VITE_SUPABASE_PROJECT_ID=cicwzhpsiewdpugmceqm
   ```
4. **Build** (`npm install && npm run build`) — gera pasta `dist/`
5. **Servir com Nginx** como site estático (SPA fallback com `try_files`)
6. **SSL com Certbot**
7. **Registrar no ZapMeow** — chamar a Edge Function `register-zapmeow` com a URL da instância ZapMeow local (se existir)

### 3. Integração com ZapMeow (notificações WhatsApp)
- Pergunta se o usuário já tem ZapMeow instalado na VPS
- Se sim: registra a URL no painel via Edge Function
- Se não: oferece instalar (chama o `instalador_whatsmeow.sh` existente e depois registra)

### 4. Comando CLI global
- Cria um alias `monitor-cli` para facilitar manutenção:
  - `monitor-cli logs` — ver logs do Nginx
  - `monitor-cli update` — git pull + rebuild
  - `monitor-cli status` — verificar se o site está acessível

## Detalhes técnicos

### Arquivos modificados
- **`instalador_single-2.sh`** — novo arquivo gerado com as modificações:
  - Novas funções: `instalar_painel_monitor()`, `atualizar_painel_monitor()`
  - Menu principal: nova opção `[11]`
  
### Arquitetura do deploy do painel
```text
/home/deploy/monitor/
├── .env                    ← variáveis Supabase
├── dist/                   ← build estático do Vite
│   ├── index.html
│   ├── assets/
│   └── ...
└── package.json

Nginx (sites-available/monitor):
  root /home/deploy/monitor/dist;
  try_files $uri $uri/ /index.html;  ← SPA fallback
```

### Pré-requisitos
1. **Conectar o projeto ao GitHub** (Settings → GitHub no Lovable) para permitir `git clone` na VPS
2. Subdomínio apontando para o IP da VPS (registro A no DNS)
3. VPS com Ubuntu 20+ e acesso root

### Variáveis sensíveis
- A `PUBLISHABLE_KEY` (anon key) é pública por design — seguro incluir no script
- Nenhuma service_role_key é exposta — toda autenticação passa pelas Edge Functions

## Sequência de implementação
1. Gerar o novo `instalador_single-2.sh` com a função `instalar_painel_monitor()` adicionada
2. Adicionar ao menu principal como opção `[11]`
3. Incluir lógica de registro do ZapMeow após instalação do painel

