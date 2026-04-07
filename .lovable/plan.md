

# Plano: Unificar ZapMeow na Opção [4] do Instalador

## O que será feito

Integrar a instalação do **ZapMeow** (Docker) diretamente dentro da função `instalar_painel_monitor()`, eliminando a necessidade de instalar separadamente. A opção [4] passará a instalar tudo: PostgreSQL, API, Frontend, Nginx, SSL **e ZapMeow**.

## Mudanças no `instalador_single.sh`

### 1. Atualizar banner da opção [4]
Adicionar `✔ ZapMeow (WhatsApp API via Docker)` na lista de componentes instalados (linha ~2512).

### 2. Coletar dados do ZapMeow na coleta de dados (após linha ~2608)
- Perguntar porta do ZapMeow (padrão: 8900)
- Perguntar se deseja subdomínio para o ZapMeow (ex: `zap.seudominio.com.br`) ou usar IP:porta diretamente

### 3. Nova etapa entre as etapas 1 e 2: Instalar Docker + ZapMeow
Inserir após a instalação de dependências do sistema (após linha ~2737):
- Instalar Docker (se não existir)
- Instalar Docker Compose plugin
- Criar `/opt/zapmeow/` com `docker-compose.yml` e `.env`
- Executar `docker compose up -d`
- Aguardar o serviço iniciar (loop de health check)

### 4. Nginx: adicionar bloco do ZapMeow (se subdomínio informado)
Após os blocos Nginx existentes do frontend e API (~linha 2919), adicionar um terceiro server block para o ZapMeow com proxy_pass para `localhost:8900` e suporte a WebSocket.

### 5. SSL: incluir subdomínio do ZapMeow no Certbot
Adicionar mais um `certbot --nginx -d` para o subdomínio do ZapMeow (após linha ~2939).

### 6. Registro automático do ZapMeow na API
Substituir o bloco atual de "registrar ZapMeow existente?" (linhas 3012-3030) por um registro **automático** — já que acabamos de instalar o ZapMeow, sabemos a URL:
```bash
curl -s -X POST "http://localhost:3200/api/register-zapmeow" \
  -H "Content-Type: application/json" \
  -d '{"zapmeow_url":"http://localhost:8900/api","instance_id":"equipechat"}'
```

### 7. Atualizar resumo final
Adicionar informações do ZapMeow: URL, porta, QR Code, subdomínio (se configurado).

### 8. Atualizar `monitor-cli`
Adicionar comandos `zapmeow-status`, `zapmeow-logs`, `zapmeow-restart` ao CLI, e mostrar status do Docker/ZapMeow no comando `status`.

### 9. Re-numerar etapas
De `[1/9]` a `[9/9]` → `[1/11]` a `[11/11]` para incluir Docker e ZapMeow como etapas explícitas.

## Resultado
A opção **[4]** instala o sistema completo em um único passo: banco, API, frontend, Nginx, SSL, ZapMeow e registro automático. O operador só precisa escanear o QR Code no painel após a instalação.

