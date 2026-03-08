#!/bin/bash

###############################################################################
#  Instalador ZapMeow (Meow API) — EquipeChat
#  Configura o ZapMeow como serviço REST para WhatsApp no mesmo servidor
#  do sistema antipirataria.
###############################################################################

set -euo pipefail

# ── CORES ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; NC='\033[0m'; BOLD='\033[1m'

banner() {
  clear
  echo -e "${CYAN}${BOLD}"
  echo "╔══════════════════════════════════════════════════════════╗"
  echo "║       🐱 ZapMeow — Instalador EquipeChat               ║"
  echo "║       WhatsApp API REST via Whatsmeow                   ║"
  echo "╚══════════════════════════════════════════════════════════╝"
  echo -e "${NC}"
}

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# ── VERIFICAÇÕES ───────────────────────────────────────────────────────────
banner

if [[ $EUID -ne 0 ]]; then
  err "Execute como root: sudo bash $0"
fi

ZAPMEOW_DIR="/opt/zapmeow"
ZAPMEOW_PORT="${ZAPMEOW_PORT:-8900}"
DOMAIN=""
USE_SSL="n"

echo -e "${BOLD}Configuração inicial:${NC}"
echo ""

read -rp "Porta para o ZapMeow [${ZAPMEOW_PORT}]: " input_port
ZAPMEOW_PORT="${input_port:-$ZAPMEOW_PORT}"

read -rp "Domínio para o ZapMeow (deixe vazio para usar IP): " DOMAIN
if [[ -n "$DOMAIN" ]]; then
  read -rp "Configurar SSL com Certbot? (s/n) [n]: " USE_SSL
  USE_SSL="${USE_SSL:-n}"
fi

echo ""
log "Porta: ${ZAPMEOW_PORT}"
log "Domínio: ${DOMAIN:-$(curl -s4 ifconfig.me || echo 'IP local')}"
log "SSL: ${USE_SSL}"
echo ""

# ── DEPENDÊNCIAS ───────────────────────────────────────────────────────────
log "Atualizando pacotes..."
apt-get update -qq

log "Instalando dependências..."
apt-get install -y -qq git curl wget unzip nginx certbot python3-certbot-nginx > /dev/null 2>&1

# ── DOCKER ─────────────────────────────────────────────────────────────────
if ! command -v docker &> /dev/null; then
  log "Instalando Docker..."
  curl -fsSL https://get.docker.com | bash > /dev/null 2>&1
  systemctl enable docker
  systemctl start docker
  log "Docker instalado com sucesso"
else
  log "Docker já instalado: $(docker --version)"
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
  log "Instalando Docker Compose..."
  apt-get install -y -qq docker-compose-plugin > /dev/null 2>&1
fi

# ── ZAPMEOW ────────────────────────────────────────────────────────────────
log "Configurando ZapMeow..."

mkdir -p "$ZAPMEOW_DIR"
cd "$ZAPMEOW_DIR"

# docker-compose.yml
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

# .env
cat > .env <<ENV
# ZapMeow Configuration
PORT=8900
DATABASE_URL=file:./data/zapmeow.db
ENV

mkdir -p data

log "Iniciando container ZapMeow..."
docker compose up -d 2>/dev/null || docker-compose up -d 2>/dev/null

# Espera o serviço subir
log "Aguardando ZapMeow iniciar..."
for i in $(seq 1 30); do
  if curl -s "http://localhost:${ZAPMEOW_PORT}/api" > /dev/null 2>&1; then
    break
  fi
  sleep 2
done

# ── NGINX ──────────────────────────────────────────────────────────────────
if [[ -n "$DOMAIN" ]]; then
  log "Configurando Nginx para ${DOMAIN}..."

  cat > "/etc/nginx/sites-available/zapmeow" <<NGINX
server {
    listen 80;
    server_name ${DOMAIN};

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
  rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
  nginx -t && systemctl reload nginx

  if [[ "${USE_SSL,,}" == "s" ]]; then
    log "Configurando SSL com Certbot..."
    certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email || warn "Falha no SSL. Configure manualmente."
  fi
fi

# ── CRIAR INSTÂNCIA ───────────────────────────────────────────────────────
log "Criando instância WhatsApp padrão..."

INSTANCE_ID="equipechat"
API_BASE="http://localhost:${ZAPMEOW_PORT}/api"

# Tenta criar instância (a API pode já ter criado uma default)
sleep 3
INSTANCE_RESPONSE=$(curl -s -X POST "${API_BASE}/${INSTANCE_ID}/qrcode" 2>/dev/null || echo "{}")

# ── SCRIPT DE GERENCIAMENTO ───────────────────────────────────────────────
cat > /usr/local/bin/zapmeow <<'SCRIPT'
#!/bin/bash
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; NC='\033[0m'; BOLD='\033[1m'

ZAPMEOW_DIR="/opt/zapmeow"
cd "$ZAPMEOW_DIR"

show_menu() {
  clear
  echo -e "${CYAN}${BOLD}"
  echo "╔══════════════════════════════════════════════════════════╗"
  echo "║       🐱 ZapMeow — Gerenciador EquipeChat               ║"
  echo "╚══════════════════════════════════════════════════════════╝"
  echo -e "${NC}"
  echo -e "  ${BOLD}1)${NC} Ver status do container"
  echo -e "  ${BOLD}2)${NC} Reiniciar ZapMeow"
  echo -e "  ${BOLD}3)${NC} Ver logs"
  echo -e "  ${BOLD}4)${NC} Parar ZapMeow"
  echo -e "  ${BOLD}5)${NC} Iniciar ZapMeow"
  echo -e "  ${BOLD}6)${NC} Atualizar ZapMeow"
  echo -e "  ${BOLD}7)${NC} Gerar QR Code"
  echo -e "  ${BOLD}8)${NC} Ver informações da API"
  echo -e "  ${BOLD}0)${NC} Sair"
  echo ""
}

while true; do
  show_menu
  read -rp "Opção: " opt
  case $opt in
    1) docker compose ps 2>/dev/null || docker-compose ps; read -rp "Pressione Enter..." ;;
    2) docker compose restart 2>/dev/null || docker-compose restart; echo -e "${GREEN}Reiniciado!${NC}"; read -rp "Pressione Enter..." ;;
    3) docker compose logs --tail=50 2>/dev/null || docker-compose logs --tail=50; read -rp "Pressione Enter..." ;;
    4) docker compose stop 2>/dev/null || docker-compose stop; echo -e "${YELLOW}Parado.${NC}"; read -rp "Pressione Enter..." ;;
    5) docker compose up -d 2>/dev/null || docker-compose up -d; echo -e "${GREEN}Iniciado!${NC}"; read -rp "Pressione Enter..." ;;
    6) docker compose pull && docker compose up -d 2>/dev/null || docker-compose pull && docker-compose up -d; echo -e "${GREEN}Atualizado!${NC}"; read -rp "Pressione Enter..." ;;
    7) 
      PORT=$(grep "ZAPMEOW_PORT" /opt/zapmeow/.env 2>/dev/null | cut -d= -f2 || echo "8900")
      curl -s "http://localhost:${PORT:-8900}/api/equipechat/qrcode" | python3 -m json.tool 2>/dev/null || echo "Acesse: http://localhost:${PORT:-8900}/api/equipechat/qrcode"
      read -rp "Pressione Enter..." ;;
    8)
      PORT=$(grep "ZAPMEOW_PORT" /opt/zapmeow/.env 2>/dev/null | cut -d= -f2 || echo "8900")
      echo -e "${CYAN}API Base:${NC} http://localhost:${PORT:-8900}/api"
      echo -e "${CYAN}Swagger:${NC} http://localhost:${PORT:-8900}/api/swagger/index.html"
      echo -e "${CYAN}Instância:${NC} equipechat"
      read -rp "Pressione Enter..." ;;
    0) exit 0 ;;
    *) echo "Opção inválida" ;;
  esac
done
SCRIPT

chmod +x /usr/local/bin/zapmeow

# Salvar porta no .env para referência
echo "ZAPMEOW_PORT=${ZAPMEOW_PORT}" >> .env

# ── RESUMO FINAL ──────────────────────────────────────────────────────────
PUBLIC_IP=$(curl -s4 ifconfig.me 2>/dev/null || echo "seu-ip")
API_URL="${DOMAIN:+https://${DOMAIN}}"
API_URL="${API_URL:-http://${PUBLIC_IP}:${ZAPMEOW_PORT}}"

echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║       ✅ ZapMeow instalado com sucesso!                  ║${NC}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BOLD}API URL:${NC}        ${CYAN}${API_URL}/api${NC}"
echo -e "  ${BOLD}Swagger:${NC}        ${CYAN}${API_URL}/api/swagger/index.html${NC}"
echo -e "  ${BOLD}Instância:${NC}      ${CYAN}equipechat${NC}"
echo -e "  ${BOLD}QR Code:${NC}        ${CYAN}${API_URL}/api/equipechat/qrcode${NC}"
echo -e "  ${BOLD}Gerenciador:${NC}    ${CYAN}zapmeow${NC} (execute no terminal)"
echo ""
echo -e "  ${YELLOW}⚠️  Configure no painel antipirataria:${NC}"
echo -e "     URL da API: ${BOLD}${API_URL}/api${NC}"
echo -e "     Instance ID: ${BOLD}equipechat${NC}"
echo ""
echo -e "  ${YELLOW}📱 Escaneie o QR Code no painel para conectar o WhatsApp${NC}"
echo ""
