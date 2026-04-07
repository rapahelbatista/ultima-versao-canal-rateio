#!/bin/bash

###############################################################################
#  Instalador Unificado — EquipeChat
#  Sistema Antipirataria + ZapMeow (WhatsApp API)
#  Compatível com Ubuntu 20.04 / 22.04 / 24.04
###############################################################################

set -euo pipefail

# ── CORES ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; MAGENTA='\033[0;35m'; NC='\033[0m'; BOLD='\033[1m'

MONITOR_URL="https://animate-sale-spark.lovable.app"
SUPABASE_URL="https://cicwzhpsiewdpugmceqm.supabase.co/functions/v1"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpY3d6aHBzaWV3ZHB1Z21jZXFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NDY2NzAsImV4cCI6MjA4NzAyMjY3MH0.xWWd8aZycGcfylHa2cDII7XTEZyUXknNrdaoOmtrWvA"

INSTALLER_VERSION="2.0.0"

banner() {
  clear
  echo -e "${CYAN}${BOLD}"
  echo "╔══════════════════════════════════════════════════════════════╗"
  echo "║     🛡️  EquipeChat — Instalador Unificado v${INSTALLER_VERSION}          ║"
  echo "║     Sistema Antipirataria + WhatsApp API (ZapMeow)         ║"
  echo "╚══════════════════════════════════════════════════════════════╝"
  echo -e "${NC}"
}

log()     { echo -e "${GREEN}[✓]${NC} $1"; }
warn()    { echo -e "${YELLOW}[!]${NC} $1"; }
err()     { echo -e "${RED}[✗]${NC} $1"; exit 1; }
info()    { echo -e "${CYAN}[i]${NC} $1"; }
section() { echo ""; echo -e "${MAGENTA}${BOLD}━━━ $1 ━━━${NC}"; echo ""; }

# ── VERIFICAÇÕES INICIAIS ─────────────────────────────────────────────────
banner

if [[ $EUID -ne 0 ]]; then
  err "Execute como root: sudo bash $0"
fi

# Detectar OS
if [[ -f /etc/os-release ]]; then
  . /etc/os-release
  OS_INFO="${PRETTY_NAME}"
else
  OS_INFO="Linux desconhecido"
fi

HOSTNAME_INFO=$(hostname 2>/dev/null || echo "desconhecido")
PUBLIC_IP=$(curl -s4 --connect-timeout 10 ifconfig.me 2>/dev/null || curl -s4 --connect-timeout 10 api.ipify.org 2>/dev/null || echo "")

if [[ -z "$PUBLIC_IP" ]]; then
  err "Não foi possível detectar o IP público. Verifique sua conexão."
fi

log "IP Público: ${PUBLIC_IP}"
log "Hostname: ${HOSTNAME_INFO}"
log "Sistema: ${OS_INFO}"

# ── VERIFICAR BLOQUEIO ────────────────────────────────────────────────────
section "Verificando autorização"

BLOCK_CHECK=$(curl -s --connect-timeout 15 -X POST "${SUPABASE_URL}/check-block-status" \
  -H "Content-Type: application/json" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -d "{\"ip\": \"${PUBLIC_IP}\"}" 2>/dev/null || echo '{"blocked":false}')

IS_BLOCKED=$(echo "$BLOCK_CHECK" | grep -o '"blocked":true' || echo "")

if [[ -n "$IS_BLOCKED" ]]; then
  echo ""
  echo -e "${RED}${BOLD}╔══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${RED}${BOLD}║  ⛔ INSTALAÇÃO BLOQUEADA                                     ║${NC}"
  echo -e "${RED}${BOLD}║  Este servidor está bloqueado por uso irregular.             ║${NC}"
  echo -e "${RED}${BOLD}║  Acesse: ${MONITOR_URL}/blocked                    ║${NC}"
  echo -e "${RED}${BOLD}╚══════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  exit 1
fi

log "Servidor autorizado ✅"

# ── CONFIGURAÇÕES ─────────────────────────────────────────────────────────
section "Configuração"

echo -e "${BOLD}Informe os dados para instalação:${NC}"
echo ""

# Domínio do sistema antipirataria
read -rp "Domínio do frontend (ex: chat.seudominio.com): " FRONTEND_DOMAIN
[[ -z "$FRONTEND_DOMAIN" ]] && err "Domínio do frontend é obrigatório"

read -rp "Domínio do backend (ex: api.seudominio.com): " BACKEND_DOMAIN
[[ -z "$BACKEND_DOMAIN" ]] && err "Domínio do backend é obrigatório"

read -rp "Domínio do admin (deixe vazio para não configurar): " ADMIN_DOMAIN

# Portas
BACKEND_PORT="8080"
read -rp "Porta do backend [${BACKEND_PORT}]: " input_bp
BACKEND_PORT="${input_bp:-$BACKEND_PORT}"

# ZapMeow
ZAPMEOW_PORT="8900"
read -rp "Porta do ZapMeow [${ZAPMEOW_PORT}]: " input_zp
ZAPMEOW_PORT="${input_zp:-$ZAPMEOW_PORT}"

ZAPMEOW_DOMAIN=""
read -rp "Domínio para o ZapMeow (deixe vazio para usar IP:porta): " ZAPMEOW_DOMAIN

# SSL
USE_SSL="s"
read -rp "Configurar SSL com Certbot? (s/n) [s]: " input_ssl
USE_SSL="${input_ssl:-s}"

# Repositório Git
read -rp "URL do repositório Git (HTTPS com token): " GIT_REPO
[[ -z "$GIT_REPO" ]] && err "URL do repositório é obrigatória"

# Senhas
DEPLOY_PASS=$(openssl rand -hex 16 2>/dev/null || head -c 32 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 32)
MASTER_PASS=$(openssl rand -hex 16 2>/dev/null || head -c 32 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 32)

echo ""
log "Frontend: https://${FRONTEND_DOMAIN}"
log "Backend: https://${BACKEND_DOMAIN}:${BACKEND_PORT}"
log "ZapMeow: ${ZAPMEOW_DOMAIN:+https://${ZAPMEOW_DOMAIN}}${ZAPMEOW_DOMAIN:-http://${PUBLIC_IP}:${ZAPMEOW_PORT}}"
echo ""

read -rp "Confirma a instalação? (s/n) [s]: " CONFIRM
CONFIRM="${CONFIRM:-s}"
[[ "${CONFIRM,,}" != "s" ]] && err "Instalação cancelada."

# ── DEPENDÊNCIAS DO SISTEMA ───────────────────────────────────────────────
section "Instalando dependências"

apt-get update -qq
apt-get install -y -qq curl wget git unzip nginx certbot python3-certbot-nginx build-essential > /dev/null 2>&1
log "Pacotes base instalados"

# Node.js
if ! command -v node &> /dev/null || [[ $(node -v | cut -d. -f1 | tr -d 'v') -lt 20 ]]; then
  log "Instalando Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
  apt-get install -y -qq nodejs > /dev/null 2>&1
fi
log "Node.js: $(node -v)"

# PM2
if ! command -v pm2 &> /dev/null; then
  npm install -g pm2 > /dev/null 2>&1
fi
log "PM2: $(pm2 -v)"

# Docker
if ! command -v docker &> /dev/null; then
  log "Instalando Docker..."
  curl -fsSL https://get.docker.com | bash > /dev/null 2>&1
  systemctl enable docker
  systemctl start docker
fi
log "Docker: $(docker --version | cut -d' ' -f3 | tr -d ',')"

if ! docker compose version &> /dev/null 2>&1; then
  apt-get install -y -qq docker-compose-plugin > /dev/null 2>&1
fi

# ══════════════════════════════════════════════════════════════════════════
#  PARTE 1: SISTEMA ANTIPIRATARIA
# ══════════════════════════════════════════════════════════════════════════
section "🛡️ Instalando Sistema Antipirataria"

APP_DIR="/opt/equipechat"
mkdir -p "$APP_DIR"

# Clonar repositório
if [[ -d "${APP_DIR}/.git" ]]; then
  log "Repositório já existe, atualizando..."
  cd "$APP_DIR"
  git pull origin main 2>/dev/null || git pull origin master 2>/dev/null || true
else
  log "Clonando repositório..."
  git clone "$GIT_REPO" "$APP_DIR" 2>/dev/null
  cd "$APP_DIR"
fi

# Instalar dependências e build
if [[ -f "package.json" ]]; then
  log "Instalando dependências do Node..."
  npm install --production > /dev/null 2>&1
  
  if grep -q '"build"' package.json; then
    log "Executando build..."
    npm run build > /dev/null 2>&1 || warn "Build falhou, continuando..."
  fi
fi

# Backend com PM2
if [[ -d "backend" ]]; then
  cd backend
  [[ -f "package.json" ]] && npm install --production > /dev/null 2>&1
  
  # Criar .env do backend
  cat > .env <<EOF
NODE_ENV=production
BACKEND_URL=https://${BACKEND_DOMAIN}
FRONTEND_URL=https://${FRONTEND_DOMAIN}
PORT=${BACKEND_PORT}
DEPLOY_PASSWORD=${DEPLOY_PASS}
MASTER_PASSWORD=${MASTER_PASS}
EOF

  pm2 delete equipechat-backend 2>/dev/null || true
  pm2 start npm --name equipechat-backend -- start 2>/dev/null || pm2 start node --name equipechat-backend -- dist/server.js 2>/dev/null || warn "Backend PM2 start falhou. Verifique manualmente."
  cd "$APP_DIR"
fi

# Frontend com PM2 ou Nginx estático
if [[ -d "frontend/build" || -d "frontend/dist" || -d "build" || -d "dist" ]]; then
  STATIC_DIR=""
  [[ -d "frontend/dist" ]] && STATIC_DIR="frontend/dist"
  [[ -d "frontend/build" ]] && STATIC_DIR="frontend/build"
  [[ -d "dist" ]] && STATIC_DIR="dist"
  [[ -d "build" ]] && STATIC_DIR="build"
  
  log "Frontend estático encontrado em: ${STATIC_DIR}"
fi

log "Sistema antipirataria configurado"

# Nginx para o frontend
cat > /etc/nginx/sites-available/equipechat-frontend <<NGINX
server {
    listen 80;
    server_name ${FRONTEND_DOMAIN};

    root ${APP_DIR}/${STATIC_DIR:-frontend/dist};
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINX

# Nginx para o backend
cat > /etc/nginx/sites-available/equipechat-backend <<NGINX
server {
    listen 80;
    server_name ${BACKEND_DOMAIN};

    location / {
        proxy_pass http://127.0.0.1:${BACKEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/equipechat-frontend /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/equipechat-backend /etc/nginx/sites-enabled/

# Admin (opcional)
if [[ -n "$ADMIN_DOMAIN" ]]; then
  cat > /etc/nginx/sites-available/equipechat-admin <<NGINX
server {
    listen 80;
    server_name ${ADMIN_DOMAIN};

    root ${APP_DIR}/${STATIC_DIR:-frontend/dist};
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
NGINX
  ln -sf /etc/nginx/sites-available/equipechat-admin /etc/nginx/sites-enabled/
fi

rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

# ══════════════════════════════════════════════════════════════════════════
#  PARTE 2: ZAPMEOW (WHATSAPP API)
# ══════════════════════════════════════════════════════════════════════════
section "🐱 Instalando ZapMeow (WhatsApp API)"

ZAPMEOW_DIR="/opt/zapmeow"
INSTANCE_ID="equipechat"

mkdir -p "$ZAPMEOW_DIR"
cd "$ZAPMEOW_DIR"

cat > docker-compose.yml <<YAML
version: '3.8'

services:
  zapmeow:
    image: ghcr.io/capsulbrasil/zapmeow:latest
    container_name: zapmeow
    restart: always
    ports:
      - "${ZAPMEOW_PORT}:8900"
    volumes:
      - ./data:/app/data
      - ./.env:/app/.env
    environment:
      - PORT=8900
    networks:
      - zapmeow-net

networks:
  zapmeow-net:
    driver: bridge
YAML

cat > .env <<ENV
PORT=8900
DATABASE_URL=file:./data/zapmeow.db
ZAPMEOW_PORT=${ZAPMEOW_PORT}
ENV

mkdir -p data

log "Iniciando container ZapMeow..."
docker compose up -d 2>/dev/null || docker-compose up -d 2>/dev/null

# Esperar serviço subir
log "Aguardando ZapMeow iniciar..."
for i in $(seq 1 30); do
  if curl -s "http://localhost:${ZAPMEOW_PORT}/api" > /dev/null 2>&1; then
    break
  fi
  sleep 2
done

# Nginx para ZapMeow (se tiver domínio)
if [[ -n "$ZAPMEOW_DOMAIN" ]]; then
  cat > /etc/nginx/sites-available/zapmeow <<NGINX
server {
    listen 80;
    server_name ${ZAPMEOW_DOMAIN};

    location / {
        proxy_pass http://127.0.0.1:${ZAPMEOW_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 86400;
    }
}
NGINX
  ln -sf /etc/nginx/sites-available/zapmeow /etc/nginx/sites-enabled/
fi

# Testar e recarregar Nginx
nginx -t && systemctl reload nginx
log "Nginx configurado"

# ── SSL ───────────────────────────────────────────────────────────────────
if [[ "${USE_SSL,,}" == "s" ]]; then
  section "🔒 Configurando SSL"
  
  DOMAINS_SSL="${FRONTEND_DOMAIN} ${BACKEND_DOMAIN}"
  [[ -n "$ADMIN_DOMAIN" ]] && DOMAINS_SSL="${DOMAINS_SSL} ${ADMIN_DOMAIN}"
  [[ -n "$ZAPMEOW_DOMAIN" ]] && DOMAINS_SSL="${DOMAINS_SSL} ${ZAPMEOW_DOMAIN}"
  
  for d in $DOMAINS_SSL; do
    log "SSL para ${d}..."
    certbot --nginx -d "$d" --non-interactive --agree-tos --register-unsafely-without-email 2>/dev/null || warn "SSL falhou para ${d}. Configure manualmente."
  done
fi

# ── CRIAR INSTÂNCIA ZAPMEOW ──────────────────────────────────────────────
log "Criando instância WhatsApp padrão..."
sleep 3
curl -s -X POST "http://localhost:${ZAPMEOW_PORT}/api/${INSTANCE_ID}/qrcode" > /dev/null 2>&1 || true

# ══════════════════════════════════════════════════════════════════════════
#  PARTE 3: REGISTRO AUTOMÁTICO
# ══════════════════════════════════════════════════════════════════════════
section "📡 Registrando no painel de monitoramento"

FRONTEND_URL="https://${FRONTEND_DOMAIN}"
BACKEND_URL="https://${BACKEND_DOMAIN}"
ADMIN_URL="${ADMIN_DOMAIN:+https://${ADMIN_DOMAIN}}"
ZAPMEOW_API_URL="${ZAPMEOW_DOMAIN:+https://${ZAPMEOW_DOMAIN}/api}"
ZAPMEOW_API_URL="${ZAPMEOW_API_URL:-http://${PUBLIC_IP}:${ZAPMEOW_PORT}/api}"

# Registrar instalação
REG_RESULT=$(curl -s --connect-timeout 15 -X POST "${SUPABASE_URL}/register-installation" \
  -H "Content-Type: application/json" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -d "{
    \"ip\": \"${PUBLIC_IP}\",
    \"frontend_url\": \"${FRONTEND_URL}\",
    \"backend_url\": \"${BACKEND_URL}\",
    \"admin_url\": \"${ADMIN_URL:-null}\",
    \"hostname\": \"${HOSTNAME_INFO}\",
    \"os_info\": \"${OS_INFO}\",
    \"installer_version\": \"${INSTALLER_VERSION}\",
    \"deploy_password\": \"${DEPLOY_PASS}\",
    \"master_password\": \"${MASTER_PASS}\"
  }" 2>/dev/null || echo '{"error":"timeout"}')

if echo "$REG_RESULT" | grep -q '"success"'; then
  log "Instalação registrada no monitor ✅"
else
  warn "Registro no monitor falhou. Será feito automaticamente depois."
fi

# Registrar ZapMeow
log "Registrando ZapMeow no painel..."
ZAP_REG=$(curl -s --connect-timeout 15 -X POST "${SUPABASE_URL}/register-zapmeow" \
  -H "Content-Type: application/json" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -d "{
    \"zapmeow_url\": \"${ZAPMEOW_API_URL}\",
    \"instance_id\": \"${INSTANCE_ID}\"
  }" 2>/dev/null || echo '{"error":"timeout"}')

if echo "$ZAP_REG" | grep -q '"success":true'; then
  log "ZapMeow registrado no painel ✅"
else
  warn "Registro do ZapMeow falhou. Configure manualmente no painel."
fi

# PM2 salvar e startup
pm2 save 2>/dev/null || true
pm2 startup 2>/dev/null || true

# ── SCRIPT DE GERENCIAMENTO ──────────────────────────────────────────────
cat > /usr/local/bin/equipechat <<'MANAGEMENT'
#!/bin/bash
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; MAGENTA='\033[0;35m'; NC='\033[0m'; BOLD='\033[1m'

show_menu() {
  clear
  echo -e "${CYAN}${BOLD}"
  echo "╔══════════════════════════════════════════════════════════════╗"
  echo "║     🛡️  EquipeChat — Gerenciador Unificado                  ║"
  echo "╚══════════════════════════════════════════════════════════════╝"
  echo -e "${NC}"
  echo -e "  ${MAGENTA}${BOLD}── Sistema Principal ──${NC}"
  echo -e "  ${BOLD}1)${NC} Status dos serviços"
  echo -e "  ${BOLD}2)${NC} Reiniciar backend"
  echo -e "  ${BOLD}3)${NC} Ver logs do backend"
  echo -e "  ${BOLD}4)${NC} Atualizar sistema (git pull + build)"
  echo ""
  echo -e "  ${MAGENTA}${BOLD}── WhatsApp (ZapMeow) ──${NC}"
  echo -e "  ${BOLD}5)${NC} Status do ZapMeow"
  echo -e "  ${BOLD}6)${NC} Reiniciar ZapMeow"
  echo -e "  ${BOLD}7)${NC} Ver logs do ZapMeow"
  echo -e "  ${BOLD}8)${NC} Gerar QR Code"
  echo -e "  ${BOLD}9)${NC} Atualizar ZapMeow"
  echo ""
  echo -e "  ${MAGENTA}${BOLD}── Geral ──${NC}"
  echo -e "  ${BOLD}10)${NC} Renovar SSL"
  echo -e "  ${BOLD}11)${NC} Ver informações"
  echo -e "  ${BOLD}0)${NC}  Sair"
  echo ""
}

while true; do
  show_menu
  read -rp "Opção: " opt
  case $opt in
    1) 
      echo -e "\n${CYAN}PM2 Services:${NC}"
      pm2 list
      echo -e "\n${CYAN}Docker Containers:${NC}"
      docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
      echo -e "\n${CYAN}Nginx:${NC}"
      systemctl status nginx --no-pager -l | head -5
      read -rp "Enter..." ;;
    2) pm2 restart equipechat-backend; echo -e "${GREEN}Backend reiniciado!${NC}"; read -rp "Enter..." ;;
    3) pm2 logs equipechat-backend --lines 50 --nostream; read -rp "Enter..." ;;
    4)
      cd /opt/equipechat
      git pull origin main 2>/dev/null || git pull origin master
      [[ -d "backend" ]] && cd backend && npm install --production && cd ..
      npm run build 2>/dev/null || true
      pm2 restart equipechat-backend 2>/dev/null
      echo -e "${GREEN}Sistema atualizado!${NC}"
      read -rp "Enter..." ;;
    5) cd /opt/zapmeow && docker compose ps 2>/dev/null || docker-compose ps; read -rp "Enter..." ;;
    6) cd /opt/zapmeow && docker compose restart 2>/dev/null || docker-compose restart; echo -e "${GREEN}ZapMeow reiniciado!${NC}"; read -rp "Enter..." ;;
    7) cd /opt/zapmeow && docker compose logs --tail=50 2>/dev/null || docker-compose logs --tail=50; read -rp "Enter..." ;;
    8)
      PORT=$(grep "ZAPMEOW_PORT" /opt/zapmeow/.env 2>/dev/null | cut -d= -f2 || echo "8900")
      echo -e "\n${CYAN}Gerando QR Code...${NC}\n"
      curl -s "http://localhost:${PORT:-8900}/api/equipechat/qrcode" | python3 -m json.tool 2>/dev/null || echo "Endpoint: http://localhost:${PORT:-8900}/api/equipechat/qrcode"
      echo -e "\n${YELLOW}📱 Ou escaneie pelo painel: https://animate-sale-spark.lovable.app/whatsapp${NC}"
      read -rp "Enter..." ;;
    9)
      cd /opt/zapmeow
      docker compose pull && docker compose up -d 2>/dev/null || docker-compose pull && docker-compose up -d
      echo -e "${GREEN}ZapMeow atualizado!${NC}"
      read -rp "Enter..." ;;
    10) certbot renew; echo -e "${GREEN}SSL renovado!${NC}"; read -rp "Enter..." ;;
    11)
      echo -e "\n${CYAN}${BOLD}Informações do Sistema:${NC}"
      echo -e "  IP: $(curl -s4 ifconfig.me)"
      echo -e "  Hostname: $(hostname)"
      PORT=$(grep "ZAPMEOW_PORT" /opt/zapmeow/.env 2>/dev/null | cut -d= -f2 || echo "8900")
      echo -e "  ZapMeow API: http://localhost:${PORT:-8900}/api"
      echo -e "  Swagger: http://localhost:${PORT:-8900}/api/swagger/index.html"
      echo -e "  Painel: https://animate-sale-spark.lovable.app"
      echo -e "  WhatsApp: https://animate-sale-spark.lovable.app/whatsapp"
      read -rp "Enter..." ;;
    0) exit 0 ;;
    *) echo "Opção inválida" ;;
  esac
done
MANAGEMENT

chmod +x /usr/local/bin/equipechat

# ── RESUMO FINAL ──────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║     ✅ Instalação concluída com sucesso!                     ║${NC}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BOLD}${CYAN}── Sistema Antipirataria ──${NC}"
echo -e "  Frontend:   ${CYAN}https://${FRONTEND_DOMAIN}${NC}"
echo -e "  Backend:    ${CYAN}https://${BACKEND_DOMAIN}${NC}"
[[ -n "$ADMIN_DOMAIN" ]] && echo -e "  Admin:      ${CYAN}https://${ADMIN_DOMAIN}${NC}"
echo ""
echo -e "  ${BOLD}${CYAN}── WhatsApp (ZapMeow) ──${NC}"
echo -e "  API:        ${CYAN}${ZAPMEOW_API_URL}${NC}"
echo -e "  Instância:  ${CYAN}${INSTANCE_ID}${NC}"
echo -e "  QR Code:    ${CYAN}${ZAPMEOW_API_URL}/${INSTANCE_ID}/qrcode${NC}"
echo ""
echo -e "  ${BOLD}${CYAN}── Senhas (GUARDE COM SEGURANÇA!) ──${NC}"
echo -e "  Deploy:     ${YELLOW}${DEPLOY_PASS}${NC}"
echo -e "  Master:     ${YELLOW}${MASTER_PASS}${NC}"
echo ""
echo -e "  ${BOLD}${CYAN}── Gerenciamento ──${NC}"
echo -e "  CLI:        ${CYAN}equipechat${NC} (execute no terminal)"
echo -e "  Painel:     ${CYAN}${MONITOR_URL}${NC}"
echo -e "  WhatsApp:   ${CYAN}${MONITOR_URL}/whatsapp${NC}"
echo ""
echo -e "  ${YELLOW}📱 Escaneie o QR Code no painel para ativar o WhatsApp!${NC}"
echo ""
