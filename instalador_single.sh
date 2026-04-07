#!/bin/bash

GREEN='\033[1;32m'
BLUE='\033[1;34m'
WHITE='\033[1;37m'
RED='\033[1;31m'
YELLOW='\033[1;33m'
CYAN='\033[1;36m'
MAGENTA='\033[1;35m'

# Variaveis Padrão
ARCH=$(uname -m)
UBUNTU_VERSION=$(lsb_release -sr)
ARQUIVO_VARIAVEIS="VARIAVEIS_INSTALACAO"
ARQUIVO_ETAPAS="ETAPA_INSTALACAO"
FFMPEG="$(pwd)/ffmpeg.x"
FFMPEG_DIR="$(pwd)/ffmpeg"
ip_atual=$(curl -s http://checkip.amazonaws.com)
jwt_secret=$(openssl rand -base64 32)
jwt_refresh_secret=$(openssl rand -base64 32)
default_apioficial_port=6000

if [ "$EUID" -ne 0 ]; then
  echo
  printf "${WHITE} >> Este script precisa ser executado como root ${RED}ou com privilégios de superusuário${WHITE}.\n"
  echo
  sleep 2
  exit 1
fi

banner() {
  clear
  printf "${BLUE}"
  printf "\n"
  printf "  ███████╗ ██████╗ ██╗   ██╗██╗██████╗ ███████╗ ██████╗██╗  ██╗ █████╗ ████████╗\n"
  printf "  ██╔════╝██╔═══██╗██║   ██║██║██╔══██╗██╔════╝██╔════╝██║  ██║██╔══██╗╚══██╔══╝\n"
  printf "  █████╗  ██║   ██║██║   ██║██║██████╔╝█████╗  ██║     ███████║███████║   ██║   \n"
  printf "  ██╔══╝  ██║▄▄ ██║██║   ██║██║██╔═══╝ ██╔══╝  ██║     ██╔══██║██╔══██║   ██║   \n"
  printf "  ███████╗╚██████╔╝╚██████╔╝██║██║     ███████╗╚██████╗██║  ██║██║  ██║   ██║   \n"
  printf "  ╚══════╝ ╚══▀▀═╝  ╚═════╝ ╚═╝╚═╝     ╚══════╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   \n"
  printf "${WHITE}\n"
  printf "  ${CYAN}Equipechat${WHITE} By ${GREEN}Raphael Batista${WHITE}\n"
  printf "  ${WHITE}Suporte: ${YELLOW}81 99998-8876${WHITE}\n"
  printf "  ${WHITE}Versão do Instalador: ${BLUE}7.0${WHITE} (Unificado)\n"
  printf "\n"
  printf "  ${RED}╔══════════════════════════════════════════════════════════════╗${WHITE}\n"
  printf "  ${RED}║${WHITE}  ${RED}⚠  AVISO LEGAL:${WHITE} Pirataria é crime (Lei 9.609/98).        ${RED}║${WHITE}\n"
  printf "  ${RED}║${WHITE}  Este sistema é licenciado e protegido por direitos          ${RED}║${WHITE}\n"
  printf "  ${RED}║${WHITE}  autorais. O uso não autorizado, cópia, redistribuição       ${RED}║${WHITE}\n"
  printf "  ${RED}║${WHITE}  ou engenharia reversa é ${RED}PROIBIDO${WHITE} e sujeito a penalidades.  ${RED}║${WHITE}\n"
  printf "  ${RED}║${WHITE}                                                              ${RED}║${WHITE}\n"
  printf "  ${RED}║${WHITE}  ${YELLOW}🔍 Seu IP está sendo monitorado: ${CYAN}${ip_atual}${WHITE}           ${RED}║${WHITE}\n"
  printf "  ${RED}║${WHITE}  ${YELLOW}📅 Data: ${CYAN}$(date '+%d/%m/%Y %H:%M:%S')${WHITE}                      ${RED}║${WHITE}\n"
  printf "  ${RED}╚══════════════════════════════════════════════════════════════╝${WHITE}\n"
  printf "\n"
}

# Função para manipular erros e encerrar o script
trata_erro() {
  printf "${RED}Erro encontrado na etapa $1. Encerrando o script.${WHITE}\n"
  salvar_etapa "$1"
  exit 1
}

# Salvar variáveis
salvar_variaveis() {
  echo "subdominio_backend=${subdominio_backend}" >$ARQUIVO_VARIAVEIS
  echo "subdominio_frontend=${subdominio_frontend}" >>$ARQUIVO_VARIAVEIS
  echo "email_deploy=${email_deploy}" >>$ARQUIVO_VARIAVEIS
  echo "empresa=${empresa}" >>$ARQUIVO_VARIAVEIS
  echo "senha_deploy=${senha_deploy}" >>$ARQUIVO_VARIAVEIS
  echo "senha_master=${senha_master}" >>$ARQUIVO_VARIAVEIS
  echo "nome_titulo=${nome_titulo}" >>$ARQUIVO_VARIAVEIS
  echo "numero_suporte=${numero_suporte}" >>$ARQUIVO_VARIAVEIS
  echo "facebook_app_id=${facebook_app_id}" >>$ARQUIVO_VARIAVEIS
  echo "facebook_app_secret=${facebook_app_secret}" >>$ARQUIVO_VARIAVEIS
  echo "github_token=${github_token}" >>$ARQUIVO_VARIAVEIS
  echo "repo_url=${repo_url}" >>$ARQUIVO_VARIAVEIS
  echo "proxy=${proxy}" >>$ARQUIVO_VARIAVEIS
  echo "backend_port=${backend_port}" >>$ARQUIVO_VARIAVEIS
  echo "frontend_port=${frontend_port}" >>$ARQUIVO_VARIAVEIS
}

# Carregar variáveis
carregar_variaveis() {
  if [ -f $ARQUIVO_VARIAVEIS ]; then
    source $ARQUIVO_VARIAVEIS
  else
    empresa="multiflow"
    nome_titulo="MultiFlow"
  fi
}

# Salvar etapa concluída
salvar_etapa() {
  echo "$1" >$ARQUIVO_ETAPAS
}

# Carregar última etapa
carregar_etapa() {
  if [ -f $ARQUIVO_ETAPAS ]; then
    etapa=$(cat $ARQUIVO_ETAPAS)
    if [ -z "$etapa" ]; then
      etapa="0"
    fi
  else
    etapa="0"
  fi
}

# Resetar etapas e variáveis
resetar_instalacao() {
  rm -f $ARQUIVO_VARIAVEIS $ARQUIVO_ETAPAS
  printf "${GREEN} >> Instalação resetada! Iniciando uma nova instalação...${WHITE}\n"
  sleep 2
  instalacao_base
}

# Pergunta se deseja continuar ou recomeçar
verificar_arquivos_existentes() {
  if [ -f $ARQUIVO_VARIAVEIS ] && [ -f $ARQUIVO_ETAPAS ]; then
    banner
    printf "${YELLOW} >> Dados de instalação anteriores detectados.\n"
    echo
    carregar_etapa
    if [ "$etapa" -eq 21 ]; then
      printf "${WHITE}>> Instalação já concluída.\n"
      printf "${WHITE}>> Deseja resetar as etapas e começar do zero? (S/N): ${WHITE}\n"
      echo
      read -p "> " reset_escolha
      echo
      reset_escolha=$(echo "${reset_escolha}" | tr '[:lower:]' '[:upper:]')
      if [ "$reset_escolha" == "S" ]; then
        resetar_instalacao
      else
        printf "${GREEN} >> Voltando para o menu principal...${WHITE}\n"
        sleep 2
        menu
      fi
    elif [ "$etapa" -lt 21 ]; then
      printf "${YELLOW} >> Instalação Incompleta Detectada na etapa $etapa. \n"
      printf "${WHITE} >> Deseja continuar de onde parou? (S/N): ${WHITE}\n"
      echo
      read -p "> " escolha
      echo
      escolha=$(echo "${escolha}" | tr '[:lower:]' '[:upper:]')
      if [ "$escolha" == "S" ]; then
        instalacao_base
      else
        printf "${GREEN} >> Voltando ao menu principal...${WHITE}\n"
        printf "${WHITE} >> Caso deseje resetar as etapas, apague os arquivos ETAPAS_INSTALAÇÃO da pasta root...${WHITE}\n"
        sleep 5
        menu
      fi
    fi
  else
    instalacao_base
  fi
}

# Função para instalar API WhatsMeow
instalar_whatsmeow() {
  banner
  printf "${YELLOW}══════════════════════════════════════════════════════════════════${WHITE}\n"
  printf "${YELLOW}⚠️  ATENÇÃO:${WHITE}\n"
  echo
  printf "${WHITE}   A WhatsMeow é uma API Alternativa à Bayles, muito estável.${WHITE}\n"
  printf "${WHITE}   Ela está disponível apenas para a versão do MultiFlow PRO${WHITE}\n"
  printf "${WHITE}   - A partir da Versão ${BLUE}6.4.4${WHITE}.${WHITE}\n"
  echo
  printf "${YELLOW}══════════════════════════════════════════════════════════════════${WHITE}\n"
  echo
  printf "${WHITE}   Deseja continuar? (S/N):${WHITE}\n"
  echo
  read -p "> " confirmacao_whatsmeow
  confirmacao_whatsmeow=$(echo "${confirmacao_whatsmeow}" | tr '[:lower:]' '[:upper:]')
  echo
  
  if [ "${confirmacao_whatsmeow}" != "S" ]; then
    printf "${GREEN} >> Operação cancelada. Voltando ao menu de ferramentas...${WHITE}\n"
    sleep 2
    return
  fi
  
  banner
  printf "${WHITE} >> Digite o TOKEN de autorização do GitHub para acesso ao repositório multiflow-pro:${WHITE}\n"
  echo
  read -p "> " TOKEN_AUTH
  
  if [ -z "$TOKEN_AUTH" ]; then
    printf "${RED}❌ ERRO: Token de autorização não pode estar vazio.${WHITE}\n"
    sleep 2
    return
  fi
  
  printf "${BLUE} >> Token de autorização recebido. Validando...${WHITE}\n"
  echo
  
  INSTALADOR_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  TEST_DIR="${INSTALADOR_DIR}/test_clone_$(date +%s)"
  REPO_URL="https://${TOKEN_AUTH}@github.com/scriptswhitelabel/multiflow-pro.git"
  
  printf "${WHITE} >> Validando token com teste de git clone...\n"
  echo
  
  if git clone --depth 1 "${REPO_URL}" "${TEST_DIR}" >/dev/null 2>&1; then
    rm -rf "${TEST_DIR}" >/dev/null 2>&1
    printf "${GREEN}✅ Token validado com sucesso! Git clone funcionou corretamente.${WHITE}\n"
    echo
    sleep 2
    
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    WHATSMEOW_SCRIPT="${SCRIPT_DIR}/instalador_whatsmeow.sh"
    
    if [ -f "$WHATSMEOW_SCRIPT" ]; then
      printf "${GREEN} >> Executando Instalador API WhatsMeow...${WHITE}\n"
      echo
      bash "$WHATSMEOW_SCRIPT"
      echo
      printf "${GREEN} >> Pressione Enter para voltar ao menu de ferramentas...${WHITE}\n"
      read -r
    else
      printf "${RED} >> Erro: Arquivo ${WHATSMEOW_SCRIPT} não encontrado!${WHITE}\n"
      printf "${RED} >> Certifique-se de que o arquivo instalador_whatsmeow.sh está no mesmo diretório do instalador.${WHITE}\n"
      sleep 3
    fi
  else
    rm -rf "${TEST_DIR}" >/dev/null 2>&1
    printf "${RED}══════════════════════════════════════════════════════════════════${WHITE}\n"
    printf "${RED}❌ ERRO: Token de autorização inválido!${WHITE}\n"
    echo
    printf "${RED}   O teste de git clone falhou. O token informado não tem acesso ao repositório multiflow-pro.${WHITE}\n"
    echo
    printf "${YELLOW}   ⚠️  IMPORTANTE:${WHITE}\n"
    printf "${YELLOW}   O MultiFlow é um projeto fechado e requer autorização especial.${WHITE}\n"
    printf "${YELLOW}   Para solicitar acesso, entre em contato com o suporte:${WHITE}\n"
    echo
    printf "${BLUE}   📱 WhatsApp: ${WHITE}81 99998-8876${WHITE}\n"
    echo
    printf "${RED}   Instalação interrompida.${WHITE}\n"
    printf "${RED}══════════════════════════════════════════════════════════════════${WHITE}\n"
    echo
    printf "${GREEN} >> Pressione Enter para voltar ao menu de ferramentas...${WHITE}\n"
    read -r
  fi
}

# Menu de Ferramentas
menu_ferramentas() {
  while true; do
    banner
    printf "${WHITE} Selecione abaixo a ferramenta desejada: \n"
    echo
    printf "   [${BLUE}1${WHITE}] Instalador RabbitMQ\n"
    printf "   [${BLUE}2${WHITE}] Instalar Push Notifications\n"
    printf "   [${BLUE}3${WHITE}] Instalar API WhatsMeow\n"
    printf "   [${BLUE}0${WHITE}] Voltar ao Menu Principal\n"
    echo
    read -p "> " option_tools
    case "${option_tools}" in
    1)
      SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
      RABBIT_SCRIPT="${SCRIPT_DIR}/tools/instalador_rabbit.sh"
      if [ -f "$RABBIT_SCRIPT" ]; then
        printf "${GREEN} >> Executando Instalador RabbitMQ...${WHITE}\n"
        echo
        bash "$RABBIT_SCRIPT"
        echo
        printf "${GREEN} >> Pressione Enter para voltar ao menu de ferramentas...${WHITE}\n"
        read -r
      else
        printf "${RED} >> Erro: Arquivo ${RABBIT_SCRIPT} não encontrado!${WHITE}\n"
        sleep 3
      fi
      ;;
    2)
      SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
      PUSH_SCRIPT="${SCRIPT_DIR}/tools/instalar_push.sh"
      if [ -f "$PUSH_SCRIPT" ]; then
        printf "${GREEN} >> Executando Instalador Push Notifications...${WHITE}\n"
        echo
        bash "$PUSH_SCRIPT"
        echo
        printf "${GREEN} >> Pressione Enter para voltar ao menu de ferramentas...${WHITE}\n"
        read -r
      else
        printf "${RED} >> Erro: Arquivo ${PUSH_SCRIPT} não encontrado!${WHITE}\n"
        sleep 3
      fi
      ;;
    3)
      instalar_whatsmeow
      ;;
    0)
      return
      ;;
    *)
      printf "${RED}Opção inválida. Tente novamente.${WHITE}"
      sleep 2
      ;;
    esac
  done
}

# Menu principal
menu() {
  while true; do
    banner
    printf "${WHITE} Selecione abaixo a opção desejada: \n"
    echo
    printf "   [${BLUE}1${WHITE}] Instalar ${nome_titulo} ${CYAN}(Backend + Frontend)${WHITE}\n"
    printf "   [${BLUE}2${WHITE}] Instalar API Oficial ${YELLOW}(WhatsApp Business)${WHITE}\n"
    printf "   [${BLUE}3${WHITE}] Instalar Transcrição de Áudio ${YELLOW}(API Python)${WHITE}\n"
    printf "   [${BLUE}4${WHITE}] Instalar Painel Monitor ${RED}(Anti-Pirataria)${WHITE}\n"
    printf "   [${BLUE}0${WHITE}] Sair\n"
    echo
    read -p "> " option
    case "${option}" in
    1)
      verificar_arquivos_existentes
      ;;
    2)
      instalar_api_oficial_separado
      ;;
    3)
      instalar_transcricao_audio_nativa
      ;;
    4)
      instalar_painel_monitor
      ;;
    0)
      sair
      ;;
    *)
      printf "${RED}Opção inválida. Tente novamente.${WHITE}"
      sleep 2
      ;;
    esac
  done
}

# Etapa de instalação (inclui API Oficial integrada)
instalacao_base() {
  carregar_etapa
  if [ "$etapa" == "0" ]; then
    questoes_dns_base || trata_erro "questoes_dns_base"
    verificar_dns_base || trata_erro "verificar_dns_base"
    questoes_variaveis_base || trata_erro "questoes_variaveis_base"
    define_proxy_base || trata_erro "define_proxy_base"
    define_portas_base || trata_erro "define_portas_base"
    confirma_dados_instalacao_base || trata_erro "confirma_dados_instalacao_base"
    salvar_variaveis || trata_erro "salvar_variaveis"
    salvar_etapa 1
  fi
  if [ "$etapa" -le "1" ]; then
    atualiza_vps_base || trata_erro "atualiza_vps_base"
    salvar_etapa 2
  fi
  if [ "$etapa" -le "2" ]; then
    cria_deploy_base || trata_erro "cria_deploy_base"
    salvar_etapa 3
  fi
  if [ "$etapa" -le "3" ]; then
    config_timezone_base || trata_erro "config_timezone_base"
    salvar_etapa 4
  fi
  if [ "$etapa" -le "4" ]; then
    config_firewall_base || trata_erro "config_firewall_base"
    salvar_etapa 5
  fi
  if [ "$etapa" -le "5" ]; then
    instala_puppeteer_base || trata_erro "instala_puppeteer_base"
    salvar_etapa 6
  fi
  if [ "$etapa" -le "6" ]; then
    instala_ffmpeg_base || trata_erro "instala_ffmpeg_base"
    salvar_etapa 7
  fi
  if [ "$etapa" -le "7" ]; then
    instala_postgres_base || trata_erro "instala_postgres_base"
    salvar_etapa 8
  fi
  if [ "$etapa" -le "8" ]; then
    instala_node_base || trata_erro "instala_node_base"
    salvar_etapa 9
  fi
  if [ "$etapa" -le "9" ]; then
    instala_redis_base || trata_erro "instala_redis_base"
    salvar_etapa 10
  fi
  if [ "$etapa" -le "10" ]; then
    instala_pm2_base || trata_erro "instala_pm2_base"
    salvar_etapa 11
  fi
  if [ "$etapa" -le "11" ]; then
    if [ "${proxy}" == "nginx" ]; then
      instala_nginx_base || trata_erro "instala_nginx_base"
      salvar_etapa 12
    elif [ "${proxy}" == "traefik" ]; then
      instala_traefik_base || trata_erro "instala_traefik_base"
      salvar_etapa 12
    fi
  fi
  if [ "$etapa" -le "12" ]; then
    cria_banco_base || trata_erro "cria_banco_base"
    salvar_etapa 13
  fi
  if [ "$etapa" -le "13" ]; then
    instala_git_base || trata_erro "instala_git_base"
    salvar_etapa 14
  fi
  if [ "$etapa" -le "14" ]; then
    codifica_clone_base || trata_erro "codifica_clone_base"
    baixa_codigo_base || trata_erro "baixa_codigo_base"
    salvar_etapa 15
  fi
  if [ "$etapa" -le "15" ]; then
    instala_backend_base || trata_erro "instala_backend_base"
    salvar_etapa 16
  fi
  if [ "$etapa" -le "16" ]; then
    instala_frontend_base || trata_erro "instala_frontend_base"
    salvar_etapa 17
  fi
  if [ "$etapa" -le "17" ]; then
    config_cron_base || trata_erro "config_cron_base"
    salvar_etapa 18
  fi
  if [ "$etapa" -le "18" ]; then
    if [ "${proxy}" == "nginx" ]; then
      config_nginx_base || trata_erro "config_nginx_base"
      salvar_etapa 19
    elif [ "${proxy}" == "traefik" ]; then
      config_traefik_base || trata_erro "config_traefik_base"
      salvar_etapa 19
    fi
  fi
  if [ "$etapa" -le "19" ]; then
    config_latencia_base || trata_erro "config_latencia_base"
    salvar_etapa 20
  fi
  if [ "$etapa" -le "20" ]; then
    fim_instalacao_base || trata_erro "fim_instalacao_base"
    salvar_etapa 21
  fi
}

# Etapa de atualização
atualizar_base() {
  backup_app_atualizar || trata_erro "backup_app_atualizar"
  instala_ffmpeg_base || trata_erro "instala_ffmpeg_base"
  config_cron_base || trata_erro "config_cron_base"
  baixa_codigo_atualizar || trata_erro "baixa_codigo_atualizar"
}

sair() {
  exit 0
}

################################################################
#                    API OFICIAL - INTEGRADA                    #
################################################################

# Reparo de Nginx para API Oficial
reparo_nginx_apioficial() {
  printf "${YELLOW} >> Verificando configuração do Nginx para API Oficial...${WHITE}\n"
  sudo rm -f /etc/nginx/sites-enabled/-oficial 2>/dev/null
  sudo rm -f /etc/nginx/sites-available/-oficial 2>/dev/null
  sudo sed -i '/include \/etc\/nginx\/sites-enabled\/-oficial;/d' /etc/nginx/nginx.conf 2>/dev/null
}

# Solicitar subdomínio da API Oficial
solicitar_dados_apioficial() {
  local temp_subdominio_oficial
  banner
  printf "${WHITE} >> Insira o subdomínio da API Oficial (Ex: api.seusistema.com.br): \n"
  echo
  read -p "> " temp_subdominio_oficial
  echo
  subdominio_oficial=$(echo "${temp_subdominio_oficial}" | sed 's|https://||g' | sed 's|http://||g' | cut -d'/' -f1)
  echo "subdominio_oficial=${subdominio_oficial}" >>$ARQUIVO_VARIAVEIS
}

# Verificar DNS da API Oficial
verificar_dns_apioficial() {
  banner
  printf "${WHITE} >> Verificando o DNS do subdomínio: ${subdominio_oficial}...\n"
  echo
  if ! command -v dig &> /dev/null; then
    sudo apt-get update >/dev/null 2>&1
    sudo apt-get install dnsutils -y >/dev/null 2>&1
  fi
  local resolved_ip=$(dig +short ${subdominio_oficial} @8.8.8.8)
  if [[ "${resolved_ip}" != "${ip_atual}"* ]] || [ -z "${resolved_ip}" ]; then
    printf "${YELLOW} >> AVISO: DNS de ${subdominio_oficial} não aponta para este IP (${ip_atual}).${WHITE}\n"
    printf "${WHITE} >> IP resolvido: ${resolved_ip:-nenhum}${WHITE}\n"
    echo
    printf "${WHITE} >> Deseja continuar mesmo assim? (S/N): ${WHITE}\n"
    read -p "> " continuar_dns_api
    continuar_dns_api=$(echo "${continuar_dns_api}" | tr '[:lower:]' '[:upper:]')
    if [ "${continuar_dns_api}" != "S" ]; then
      printf "${RED} >> Instalação da API Oficial cancelada. Configure o DNS e tente novamente.${WHITE}\n"
      sleep 3
      return 1
    fi
  else
    printf "${GREEN} >> DNS OK! ${subdominio_oficial} aponta para ${ip_atual}${WHITE}\n"
    sleep 2
  fi
}

# Configurar Nginx para API Oficial
configurar_nginx_apioficial() {
  banner
  printf "${WHITE} >> Configurando Nginx para API Oficial...\n"
  echo
  local sites_available_path="/etc/nginx/sites-available/${empresa}-oficial"
  local sites_enabled_link="/etc/nginx/sites-enabled/${empresa}-oficial"

  sudo rm -f "${sites_enabled_link}" 2>/dev/null
  sudo rm -f "${sites_available_path}" 2>/dev/null

  sudo bash -c "cat > ${sites_available_path} << 'END'
upstream oficial {
    server 127.0.0.1:${default_apioficial_port};
    keepalive 32;
}
server {
    server_name ${subdominio_oficial};
    location / {
        proxy_pass http://oficial;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_cache_bypass \$http_upgrade;
    }
}
END"
  sudo ln -sf ${sites_available_path} ${sites_enabled_link}
  
  # Testa configuração antes de recarregar
  if sudo nginx -t 2>/dev/null; then
    sudo systemctl reload nginx
    printf "${GREEN} >> Nginx configurado com sucesso!${WHITE}\n"
  else
    printf "${RED} >> ERRO: Configuração do Nginx inválida. Verifique manualmente.${WHITE}\n"
    return 1
  fi
  sleep 2

  # SSL
  printf "${WHITE} >> Emitindo certificado SSL para ${subdominio_oficial}...${WHITE}\n"
  sudo certbot -m "${email_deploy}" --nginx --agree-tos --expand -n -d "${subdominio_oficial}" || {
    printf "${YELLOW} >> Aviso: Falha no SSL. Tente manualmente: certbot --nginx -d ${subdominio_oficial}${WHITE}\n"
    sleep 3
  }
}

# Criar banco da API Oficial
criar_banco_apioficial() {
  banner
  printf "${WHITE} >> Criando banco de dados 'oficialseparado'...\n"
  echo
  # Verifica se o banco já existe
  if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw "oficialseparado"; then
    printf "${YELLOW} >> Banco 'oficialseparado' já existe. Pulando criação...${WHITE}\n"
  else
    sudo -u postgres psql -c "CREATE DATABASE oficialseparado WITH OWNER ${empresa};" || {
      printf "${RED} >> Erro ao criar banco. Verifique se o usuário ${empresa} existe no PostgreSQL.${WHITE}\n"
      return 1
    }
    printf "${GREEN} >> Banco 'oficialseparado' criado com sucesso!${WHITE}\n"
  fi
  sleep 2
}

# Configurar .env da API Oficial
configurar_env_apioficial() {
  banner
  printf "${WHITE} >> Configurando .env da API Oficial...\n"
  echo
  local backend_env_path="/home/deploy/${empresa}/backend/.env"
  local jwt_refresh_secret_backend=""
  local backend_url_full=""
  
  if [ -f "${backend_env_path}" ]; then
    jwt_refresh_secret_backend=$(grep "^JWT_REFRESH_SECRET=" "${backend_env_path}" | cut -d '=' -f2- | tr -d '\r')
    backend_url_full=$(grep "^BACKEND_URL=" "${backend_env_path}" | cut -d '=' -f2- | tr -d '\r')
  else
    printf "${YELLOW} >> Aviso: .env do backend não encontrado. Usando valores padrão.${WHITE}\n"
    jwt_refresh_secret_backend="${jwt_refresh_secret}"
    backend_url_full="https://${subdominio_backend}"
  fi
  
  local api_oficial_dir="/home/deploy/${empresa}/api_oficial"
  mkdir -p "${api_oficial_dir}"
  
  sudo -u deploy bash -c "cat > ${api_oficial_dir}/.env <<EOF
DATABASE_LINK=postgresql://${empresa}:${senha_deploy}@localhost:5432/oficialseparado?schema=public
DATABASE_URL=localhost
DATABASE_PORT=5432
DATABASE_USER=${empresa}
DATABASE_PASSWORD=${senha_deploy}
DATABASE_NAME=oficialseparado
TOKEN_ADMIN=adminpro
URL_BACKEND_MULT100=${backend_url_full}
JWT_REFRESH_SECRET=${jwt_refresh_secret_backend}
REDIS_URI=redis://:${senha_deploy}@127.0.0.1:6379
PORT=${default_apioficial_port}
URL_API_OFICIAL=${subdominio_oficial}
NAME_ADMIN=SetupAutomatizado
EMAIL_ADMIN=admin@multi100.com.br
PASSWORD_ADMIN=adminpro
EOF"
  printf "${GREEN} >> .env da API Oficial configurado!${WHITE}\n"
  sleep 2
}

# Instalar dependências e build da API Oficial
build_apioficial() {
  banner
  printf "${WHITE} >> Instalando dependências e compilando API Oficial...\n"
  echo
  local api_oficial_dir="/home/deploy/${empresa}/api_oficial"
  
  if [ ! -d "${api_oficial_dir}" ]; then
    printf "${RED} >> Diretório da API Oficial não encontrado: ${api_oficial_dir}${WHITE}\n"
    printf "${YELLOW} >> Verifique se o repositório foi clonado corretamente.${WHITE}\n"
    return 1
  fi
  
  sudo su - deploy <<INSTALL_API
  # Configura PATH
  if [ -d /usr/local/n/versions/node/20.19.4/bin ]; then
    export PATH=/usr/local/n/versions/node/20.19.4/bin:/usr/bin:/usr/local/bin:\$PATH
  else
    export PATH=/usr/bin:/usr/local/bin:\$PATH
  fi
  
  cd ${api_oficial_dir}
  
  if [ ! -f "package.json" ]; then
    echo "ERRO: package.json não encontrado em ${api_oficial_dir}"
    exit 1
  fi
  
  npm install --force
  npx prisma generate
  npm run build
  npx prisma migrate deploy
  pm2 start dist/main.js --name=api_oficial
  pm2 save
INSTALL_API

  if [ $? -ne 0 ]; then
    printf "${RED} >> Erro durante a instalação da API Oficial.${WHITE}\n"
    return 1
  fi
  
  printf "${GREEN} >> API Oficial compilada e iniciada com sucesso!${WHITE}\n"
  sleep 2
}

# Atualizar .env do backend para vincular API Oficial
vincular_apioficial_backend() {
  banner
  printf "${WHITE} >> Vinculando API Oficial ao Backend...\n"
  echo
  local backend_env_path="/home/deploy/${empresa}/backend/.env"
  
  if [ ! -f "${backend_env_path}" ]; then
    printf "${RED} >> .env do backend não encontrado. Pulando vinculação.${WHITE}\n"
    return 0
  fi
  
  sudo sed -i 's|^USE_WHATSAPP_OFICIAL=.*|USE_WHATSAPP_OFICIAL=true|' "${backend_env_path}"
  if grep -q "^URL_API_OFICIAL=" "${backend_env_path}"; then
    sudo sed -i "s|^URL_API_OFICIAL=.*|URL_API_OFICIAL=https://${subdominio_oficial}|" "${backend_env_path}"
  else
    echo "URL_API_OFICIAL=https://${subdominio_oficial}" | sudo tee -a "${backend_env_path}" >/dev/null
  fi
  
  # Restart backend
  sudo su - deploy <<'RESTART_BACKEND'
  if [ -d /usr/local/n/versions/node/20.19.4/bin ]; then
    export PATH=/usr/local/n/versions/node/20.19.4/bin:/usr/bin:/usr/local/bin:$PATH
  else
    export PATH=/usr/bin:/usr/local/bin:$PATH
  fi
  pm2 reload all
RESTART_BACKEND

  printf "${GREEN} >> Backend vinculado à API Oficial!${WHITE}\n"
  sleep 2
}

# ═══ INSTALAÇÃO DA API OFICIAL INTEGRADA (chamada durante instalacao_base) ═══
instalar_api_oficial_integrada() {
  banner
  printf "${CYAN}══════════════════════════════════════════════════════════════════${WHITE}\n"
  printf "${CYAN}   📡 INSTALAÇÃO DA API OFICIAL (WhatsApp Business)${WHITE}\n"
  printf "${CYAN}══════════════════════════════════════════════════════════════════${WHITE}\n"
  echo
  printf "${WHITE} >> Deseja instalar a API Oficial agora? (S/N): ${WHITE}\n"
  echo
  read -p "> " instalar_api_agora
  instalar_api_agora=$(echo "${instalar_api_agora}" | tr '[:lower:]' '[:upper:]')
  
  if [ "${instalar_api_agora}" != "S" ]; then
    printf "${YELLOW} >> API Oficial não será instalada agora. Você pode instalá-la depois pelo menu.${WHITE}\n"
    sleep 2
    return 0
  fi
  
  reparo_nginx_apioficial
  solicitar_dados_apioficial
  verificar_dns_apioficial || return 0
  
  if [ "${proxy}" == "nginx" ]; then
    configurar_nginx_apioficial || return 1
  fi
  
  criar_banco_apioficial || return 1
  configurar_env_apioficial || return 1
  build_apioficial || return 1
  vincular_apioficial_backend
  
  sudo systemctl restart nginx 2>/dev/null
  
  printf "${GREEN}══════════════════════════════════════════════════════════════════${WHITE}\n"
  printf "${GREEN}   ✅ API Oficial instalada com sucesso!${WHITE}\n"
  printf "${GREEN}   🌐 URL: https://${subdominio_oficial}${WHITE}\n"
  printf "${GREEN}══════════════════════════════════════════════════════════════════${WHITE}\n"
  sleep 3
}

# ═══ INSTALAÇÃO SEPARADA DA API OFICIAL (menu opção 4) ═══
instalar_api_oficial_separado() {
  banner
  printf "${WHITE} >> Instalando API Oficial (modo separado)...\n"
  echo
  
  carregar_variaveis
  
  # Carregar subdomínio do backend se não existir
  if [ -z "${subdominio_backend}" ]; then
    local backend_env_path="/home/deploy/${empresa}/backend/.env"
    if [ -f "${backend_env_path}" ]; then
      local subdominio_backend_full=$(grep "^BACKEND_URL=" "${backend_env_path}" 2>/dev/null | cut -d '=' -f2- | tr -d '\r')
      subdominio_backend=$(echo "${subdominio_backend_full}" | sed 's|https://||g' | sed 's|http://||g' | cut -d'/' -f1)
    fi
  fi
  
  # Carregar email e senha do backend se não existir
  if [ -z "${email_deploy}" ] || [ -z "${senha_deploy}" ]; then
    local backend_env_path="/home/deploy/${empresa}/backend/.env"
    if [ -f "${backend_env_path}" ]; then
      [ -z "${senha_deploy}" ] && senha_deploy=$(grep "^DB_PASS=" "${backend_env_path}" | cut -d '=' -f2- | tr -d '\r')
      [ -z "${email_deploy}" ] && email_deploy=$(grep "^USER_EMAIL=" "${backend_env_path}" | cut -d '=' -f2- | tr -d '\r')
      
      if [ -z "${email_deploy}" ]; then
        printf "${WHITE} >> Digite seu email para o certificado SSL: \n"
        read -p "> " email_deploy
      fi
    else
      printf "${RED} >> ERRO: .env do backend não encontrado em ${backend_env_path}${WHITE}\n"
      sleep 3
      return 1
    fi
  fi
  
  reparo_nginx_apioficial
  solicitar_dados_apioficial
  verificar_dns_apioficial || return 0
  configurar_nginx_apioficial || return 1
  criar_banco_apioficial || return 1
  configurar_env_apioficial || return 1
  build_apioficial || return 1
  vincular_apioficial_backend
  
  sudo systemctl restart nginx 2>/dev/null
  
  banner
  printf "${GREEN} >> Instalação da API Oficial concluída! https://${subdominio_oficial}${WHITE}\n"
  echo
  printf "${GREEN} >> Pressione Enter para voltar ao menu...${WHITE}\n"
  read -r
}

################################################################
#                         INSTALAÇÃO                           #
################################################################

# Questões base
questoes_dns_base() {
  banner
  printf "${WHITE} >> Insira a URL do Backend: \n"
  echo
  read -p "> " subdominio_backend
  echo
  banner
  printf "${WHITE} >> Insira a URL do Frontend: \n"
  echo
  read -p "> " subdominio_frontend
  echo
}

# Valida se o domínio ou subdomínio está apontado para o IP da VPS
verificar_dns_base() {
  banner
  printf "${WHITE} >> Verificando o DNS dos dominios/subdominios...\n"
  echo
  sleep 2
  sudo apt-get install dnsutils -y >/dev/null 2>&1
  subdominios_incorretos=""

  verificar_dns() {
    local domain=$1
    local resolved_ip
    local cname_target

    cname_target=$(dig +short CNAME ${domain})

    if [ -n "${cname_target}" ]; then
      resolved_ip=$(dig +short ${cname_target})
    else
      resolved_ip=$(dig +short ${domain})
    fi

    if [ "${resolved_ip}" != "${ip_atual}" ]; then
      echo "O domínio ${domain} (resolvido para ${resolved_ip}) não está apontando para o IP público atual (${ip_atual})."
      subdominios_incorretos+="${domain} "
      sleep 2
    fi
  }
  verificar_dns ${subdominio_backend}
  verificar_dns ${subdominio_frontend}
  if [ -n "${subdominios_incorretos}" ]; then
    echo
    printf "${YELLOW} >> ATENÇÃO: Os seguintes subdomínios não estão apontando para o IP público atual (${ip_atual}):${WHITE}\n"
    printf "${YELLOW} >> ${subdominios_incorretos}${WHITE}\n"
    echo
    printf "${WHITE} >> Deseja continuar a instalação mesmo assim? (S/N): ${WHITE}\n"
    echo
    read -p "> " continuar_dns
    continuar_dns=$(echo "${continuar_dns}" | tr '[:lower:]' '[:upper:]')
    echo
    if [ "${continuar_dns}" != "S" ]; then
      printf "${GREEN} >> Retornando ao menu principal...${WHITE}\n"
      sleep 2
      menu
      return 0
    else
      printf "${YELLOW} >> Continuando a instalação mesmo com DNS não configurado corretamente...${WHITE}\n"
      sleep 2
    fi
  else
    echo "Todos os subdomínios estão apontando corretamente para o IP público da VPS."
    sleep 2
  fi
  echo
  printf "${WHITE} >> Continuando...\n"
  sleep 2
  echo
}

questoes_variaveis_base() {
  banner
  printf "${WHITE} >> Digite o seu melhor email: \n"
  echo
  read -p "> " email_deploy
  echo
  banner
  printf "${WHITE} >> Digite o nome da sua empresa (Letras minusculas e sem espaço): \n"
  echo
  read -p "> " empresa
  echo
  banner
  printf "${WHITE} >> Insira a senha para o usuario Deploy, Redis e Banco de Dados ${RED}IMPORTANTE${WHITE}: Não utilizar caracteres especiais\n"
  echo
  read -p "> " senha_deploy
  echo
  banner
  printf "${WHITE} >> Insira a senha para o MASTER: \n"
  echo
  read -p "> " senha_master
  echo
  banner
  printf "${WHITE} >> Insira o Titulo da Aplicação (Permitido Espaço): \n"
  echo
  read -p "> " nome_titulo
  echo
  banner
  printf "${WHITE} >> Digite o numero de telefone para suporte: \n"
  echo
  read -p "> " numero_suporte
  echo
  banner
  printf "${WHITE} >> Digite o FACEBOOK_APP_ID caso tenha: \n"
  echo
  read -p "> " facebook_app_id
  echo
  banner
  printf "${WHITE} >> Digite o FACEBOOK_APP_SECRET caso tenha: \n"
  echo
  read -p "> " facebook_app_secret
  echo
  banner
  printf "${WHITE} >> Digite seu TOKEN de acesso pessoal do GitHub: \n"
  printf "${WHITE} >> Passo a Passo para gerar o seu TOKEN no link ${BLUE}https://bit.ly/token-github ${WHITE} \n"
  echo
  read -p "> " github_token
  echo
  banner
  printf "${WHITE} >> Digite a URL do repositório privado no GitHub: \n"
  echo
  read -p "> " repo_url
  echo
}

# Define proxy usado
define_proxy_base() {
  banner
  while true; do
    printf "${WHITE} >> Instalar usando Nginx ou Traefik? (Nginx/Traefik): ${WHITE}\n"
    echo
    read -p "> " proxy
    echo
    proxy=$(echo "${proxy}" | tr '[:upper:]' '[:lower:]')

    if [ "${proxy}" = "nginx" ] || [ "${proxy}" = "traefik" ]; then
      sleep 2
      break
    else
      printf "${RED} >> Por favor, digite 'Nginx' ou 'Traefik' para continuar... ${WHITE}\n"
      echo
    fi
  done
  export proxy
}

# Define portas backend e frontend
define_portas_base() {
  banner
  printf "${WHITE} >> Usar as portas padrão para Backend (8080) e Frontend (3000) ? (S/N): ${WHITE}\n"
  echo
  read -p "> " use_default_ports
  use_default_ports=$(echo "${use_default_ports}" | tr '[:upper:]' '[:lower:]')
  echo

  default_backend_port=8080
  default_frontend_port=3000

  if [ "${use_default_ports}" = "s" ]; then
    backend_port=${default_backend_port}
    frontend_port=${default_frontend_port}
  else
    while true; do
      printf "${WHITE} >> Qual porta deseja para o Backend? ${WHITE}\n"
      echo
      read -p "> " backend_port
      echo
      if ! lsof -i:${backend_port} &>/dev/null; then
        break
      else
        printf "${RED} >> A porta ${backend_port} já está em uso. Por favor, escolha outra.${WHITE}\n"
        echo
      fi
    done

    while true; do
      printf "${WHITE} >> Qual porta deseja para o Frontend? ${WHITE}\n"
      echo
      read -p "> " frontend_port
      echo
      if ! lsof -i:${frontend_port} &>/dev/null; then
        break
      else
        printf "${RED} >> A porta ${frontend_port} já está em uso. Por favor, escolha outra.${WHITE}\n"
        echo
      fi
    done
  fi

  sleep 2
}

# Informa os dados de instalação
dados_instalacao_base() {
  printf "   ${WHITE}Anote os dados abaixo\n\n"
  printf "   ${WHITE}Subdominio Backend: ---->> ${YELLOW}${subdominio_backend}\n"
  printf "   ${WHITE}Subdominio Frontend: --->> ${YELLOW}${subdominio_frontend}\n"
  printf "   ${WHITE}Seu Email: ------------->> ${YELLOW}${email_deploy}\n"
  printf "   ${WHITE}Nome da Empresa: ------->> ${YELLOW}${empresa}\n"
  printf "   ${WHITE}Senha Deploy: ---------->> ${YELLOW}${senha_deploy}\n"
  printf "   ${WHITE}Senha Master: ---------->> ${YELLOW}${senha_master}\n"
  printf "   ${WHITE}Titulo da Aplicação: --->> ${YELLOW}${nome_titulo}\n"
  printf "   ${WHITE}Numero de Suporte: ----->> ${YELLOW}${numero_suporte}\n"
  printf "   ${WHITE}FACEBOOK_APP_ID: ------->> ${YELLOW}${facebook_app_id}\n"
  printf "   ${WHITE}FACEBOOK_APP_SECRET: --->> ${YELLOW}${facebook_app_secret}\n"
  printf "   ${WHITE}Token GitHub: ---------->> ${YELLOW}${github_token}\n"
  printf "   ${WHITE}URL do Repositório: ---->> ${YELLOW}${repo_url}\n"
  printf "   ${WHITE}Proxy Usado: ----------->> ${YELLOW}${proxy}\n"
  printf "   ${WHITE}Porta Backend: --------->> ${YELLOW}${backend_port}\n"
  printf "   ${WHITE}Porta Frontend: -------->> ${YELLOW}${frontend_port}\n"
}

# Confirma os dados de instalação
confirma_dados_instalacao_base() {
  printf " >> Confira abaixo os dados dessa instalação! \n"
  echo
  dados_instalacao_base
  echo
  printf "${WHITE} >> Os dados estão corretos? ${GREEN}S/${RED}N:${WHITE} \n"
  echo
  read -p "> " confirmacao
  echo
  confirmacao=$(echo "${confirmacao}" | tr '[:lower:]' '[:upper:]')
  if [ "${confirmacao}" == "S" ]; then
    printf "${GREEN} >> Continuando a Instalação... ${WHITE} \n"
    echo
  else
    printf "${GREEN} >> Retornando ao Menu Principal... ${WHITE} \n"
    echo
    sleep 2
    menu
  fi
}

# Atualiza sistema operacional
atualiza_vps_base() {
  UPDATE_FILE="$(pwd)/update.x"
  {
    sudo DEBIAN_FRONTEND=noninteractive apt update -y && sudo DEBIAN_FRONTEND=noninteractive apt upgrade -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" && sudo DEBIAN_FRONTEND=noninteractive apt-get install build-essential -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y apparmor-utils
    touch "${UPDATE_FILE}"
    sleep 2
  } || trata_erro "atualiza_vps_base"
}

# Cria usuário deploy
cria_deploy_base() {
  banner
  printf "${WHITE} >> Agora, vamos criar o usuário para deploy...\n"
  echo
  {
    sudo useradd -m -p $(openssl passwd -1 ${senha_deploy}) -s /bin/bash -G sudo deploy
    sudo usermod -aG sudo deploy
    sleep 2
  } || trata_erro "cria_deploy_base"
}

# Configura timezone
config_timezone_base() {
  banner
  printf "${WHITE} >> Configurando Timezone...\n"
  echo
  {
    sudo su - root <<EOF
  timedatectl set-timezone America/Sao_Paulo
EOF
    sleep 2
  } || trata_erro "config_timezone_base"
}

# Configura firewall
config_firewall_base() {
  banner
  printf "${WHITE} >> Configurando o firewall Portas 80 e 443...\n"
  echo
  {
    if [ "${ARCH}" = "x86_64" ]; then
      sudo su - root <<EOF >/dev/null 2>&1
  ufw allow 80/tcp && ufw allow 22/tcp && ufw allow 443/tcp
EOF
      sleep 2

    elif [ "${ARCH}" = "aarch64" ]; then
      sudo su - root <<EOF >/dev/null 2>&1
  sudo iptables -F &&
  sudo iptables -A INPUT -i lo -j ACCEPT &&
  sudo iptables -A OUTPUT -o lo -j ACCEPT &&
  sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT &&
  sudo iptables -A INPUT -p udp --dport 80 -j ACCEPT &&
  sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT &&
  sudo iptables -A INPUT -p udp --dport 443 -j ACCEPT &&
  sudo service netfilter-persistent save
EOF
      sleep 2

    else
      echo "Arquitetura não suportada."
    fi
  } || trata_erro "config_firewall_base"
}

# Instala dependência puppeteer
instala_puppeteer_base() {
  banner
  printf "${WHITE} >> Instalando puppeteer dependencies...\n"
  echo
  {
    sudo su - root <<EOF
export DEBIAN_FRONTEND=noninteractive
apt-get install -y libaom-dev libass-dev libfreetype6-dev libfribidi-dev \
                   libharfbuzz-dev libgme-dev libgsm1-dev libmp3lame-dev \
                   libopencore-amrnb-dev libopencore-amrwb-dev libopenmpt-dev \
                   libopus-dev libfdk-aac-dev librubberband-dev libspeex-dev \
                   libssh-dev libtheora-dev libvidstab-dev libvo-amrwbenc-dev \
                   libvorbis-dev libvpx-dev libwebp-dev libx264-dev libx265-dev \
                   libxvidcore-dev libzmq3-dev libsdl2-dev build-essential \
                   yasm cmake libtool libc6 libc6-dev unzip wget pkg-config texinfo zlib1g-dev \
                   libxshmfence-dev libgcc1 libgbm-dev fontconfig locales gconf-service libasound2 \
                   libatk1.0-0 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc-s1 \
                   libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 \
                   libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 \
                   libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 \
                   libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 \
                   lsb-release xdg-utils

if grep -q "20.04" /etc/os-release; then
    apt-get install -y libsrt-dev
else
    apt-get install -y libsrt-openssl-dev
fi

EOF
    sleep 2
  } || trata_erro "instala_puppeteer_base"
}

# Instala FFMPEG
instala_ffmpeg_base() {
  banner
  printf "${WHITE} >> Instalando FFMPEG 6...\n"
  echo

  if [ -f "${FFMPEG}" ]; then
    printf " >> FFMPEG já foi instalado. Continuando a instalação...\n"
    echo
  else

    sleep 2

    {
      sudo apt install ffmpeg -y
      download_ok=false
      asset_url=""
      if [ "${ARCH}" = "x86_64" ]; then
        asset_url=$(curl -sL https://api.github.com/repos/BtbN/FFmpeg-Builds/releases/latest | grep -oP '"browser_download_url":\s*"\K[^"]+' | grep -E 'linux64-gpl.*\.tar\.xz$' | head -n1)
      elif [ "${ARCH}" = "aarch64" ]; then
        asset_url=$(curl -sL https://api.github.com/repos/BtbN/FFmpeg-Builds/releases/latest | grep -oP '"browser_download_url":\s*"\K[^"]+' | grep -E 'linuxarm64-gpl.*\.tar\.xz$' | head -n1)
      else
        echo "Arquitetura não suportada: ${ARCH}"
      fi

      if [ -n "${asset_url}" ]; then
        FFMPEG_FILE="${asset_url##*/}"
        wget -q "${asset_url}" -O "${FFMPEG_FILE}"
        if [ $? -eq 0 ]; then
          mkdir -p ${FFMPEG_DIR}
          tar -xvf ${FFMPEG_FILE} -C ${FFMPEG_DIR} >/dev/null 2>&1
          extracted_dir=$(tar -tf ${FFMPEG_FILE} | head -1 | cut -d/ -f1)
          if [ -n "${extracted_dir}" ] && [ -d "${FFMPEG_DIR}/${extracted_dir}/bin" ]; then
            sudo cp ${FFMPEG_DIR}/${extracted_dir}/bin/ffmpeg /usr/bin/ >/dev/null 2>&1
            sudo cp ${FFMPEG_DIR}/${extracted_dir}/bin/ffprobe /usr/bin/ >/dev/null 2>&1
            sudo cp ${FFMPEG_DIR}/${extracted_dir}/bin/ffplay /usr/bin/ >/dev/null 2>&1
            rm -rf ${FFMPEG_DIR} >/dev/null 2>&1
            rm -f ${FFMPEG_FILE} >/dev/null 2>&1
            download_ok=true
          fi
        fi
      fi

      if [ "${download_ok}" != true ]; then
        printf "${YELLOW} >> Não foi possível baixar o FFmpeg dos builds oficiais. Usando pacote da distribuição...${WHITE}\n"
      fi

      export PATH=/usr/bin:${PATH}
      echo 'export PATH=/usr/bin:${PATH}' >>~/.bashrc
      source ~/.bashrc >/dev/null 2>&1
      if command -v ffmpeg >/dev/null 2>&1; then
        touch "${FFMPEG}"
      fi
    } || trata_erro "instala_ffmpeg_base"
  fi
}

# Instala Postgres
instala_postgres_base() {
  banner
  printf "${WHITE} >> Instalando postgres...\n"
  echo
  {
    sudo su - root <<EOF
  export DEBIAN_FRONTEND=noninteractive
  sudo apt-get install gnupg -y
  sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt \$(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
  wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
  sudo apt-get update -y && sudo apt-get -y install postgresql-17
EOF
    sleep 2
  } || trata_erro "instala_postgres_base"
}

# Instala NodeJS
instala_node_base() {
  banner
  printf "${WHITE} >> Instalando nodejs...\n"
  echo
  {
    sudo su - root <<'NODEINSTALL'
    # Remove repositórios antigos do NodeSource
    rm -f /etc/apt/sources.list.d/nodesource.list 2>/dev/null
    rm -f /etc/apt/sources.list.d/nodesource*.list 2>/dev/null
    
    printf " >> Tentando instalar Node.js 22.x LTS...\n"
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - 2>&1 | grep -v "does not have a Release file" || {
      printf " >> Node.js 22.x não disponível. Tentando Node.js 20.x...\n"
      curl -fsSL https://deb.nodesource.com/setup_20.x | bash - 2>&1 | grep -v "does not have a Release file" || {
        printf " >> Erro ao configurar repositório. Tentando método alternativo...\n"
        curl -fsSL https://deb.nodesource.com/setup_22.x -o /tmp/nodesource_setup.sh 2>/dev/null || \
        curl -fsSL https://deb.nodesource.com/setup_20.x -o /tmp/nodesource_setup.sh
        bash /tmp/nodesource_setup.sh 2>&1 | grep -v "does not have a Release file" || {
          printf " >> Falha ao configurar repositório NodeSource.\n"
          exit 1
        }
      }
    }
    
    printf " >> Atualizando lista de pacotes...\n"
    apt-get update -y 2>&1 | grep -v "does not have a Release file" | grep -v "Key is stored in legacy" || true
    
    printf " >> Instalando Node.js...\n"
    apt-get install -y nodejs || {
      printf " >> Erro ao instalar Node.js via apt.\n"
      exit 1
    }
    
    if ! command -v node &> /dev/null; then
      printf " >> Erro: Node.js não foi encontrado no PATH após instalação.\n"
      find /usr -name node -type f 2>/dev/null | head -5
      exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
      printf " >> Erro: npm não foi encontrado no PATH após instalação.\n"
      find /usr -name npm -type f 2>/dev/null | head -5
      exit 1
    fi
    
    printf " >> Node.js instalado: "
    node --version
    printf " >> npm instalado: "
    npm --version
    
    printf " >> Instalando gerenciador de versões 'n'...\n"
    npm install -g n || {
      printf " >> Aviso: Não foi possível instalar 'n'. Continuando com versão padrão.\n"
    }
    
    if command -v n &> /dev/null; then
      printf " >> Configurando Node.js versão 20.19.4...\n"
      n 20.19.4 || {
        printf " >> Aviso: Não foi possível instalar versão específica. Usando versão padrão.\n"
      }
      
      if [ -f /usr/local/n/versions/node/20.19.4/bin/node ]; then
        ln -sf /usr/local/n/versions/node/20.19.4/bin/node /usr/bin/node
        ln -sf /usr/local/n/versions/node/20.19.4/bin/npm /usr/bin/npm
        ln -sf /usr/local/n/versions/node/20.19.4/bin/npx /usr/bin/npx 2>/dev/null || true
      fi
    fi
    
    NODE_BIN=$(which node 2>/dev/null || find /usr -name node -type f 2>/dev/null | head -1)
    NPM_BIN=$(which npm 2>/dev/null || find /usr -name npm -type f 2>/dev/null | head -1)
    
    if [ -n "$NODE_BIN" ] && [ "$NODE_BIN" != "/usr/bin/node" ]; then
      ln -sf "$NODE_BIN" /usr/bin/node
    fi
    
    if [ -n "$NPM_BIN" ] && [ "$NPM_BIN" != "/usr/bin/npm" ]; then
      ln -sf "$NPM_BIN" /usr/bin/npm
    fi
    
    if ! grep -q "/usr/local/n/versions/node" /etc/profile 2>/dev/null; then
      echo 'export PATH=/usr/local/n/versions/node/20.19.4/bin:/usr/bin:$PATH' >> /etc/profile
    fi
    
    for user_home in /root /home/deploy; do
      if [ -d "$user_home" ]; then
        if ! grep -q "/usr/local/n/versions/node" "${user_home}/.bashrc" 2>/dev/null; then
          echo 'export PATH=/usr/local/n/versions/node/20.19.4/bin:/usr/bin:$PATH' >> "${user_home}/.bashrc"
        fi
      fi
    done
    
    printf " >> Verificando instalação final...\n"
    export PATH=/usr/local/n/versions/node/20.19.4/bin:/usr/bin:$PATH
    node --version || exit 1
    npm --version || exit 1
NODEINSTALL
    
    sleep 2
  } || trata_erro "instala_node_base"
}

# Instala Redis
instala_redis_base() {
  {
    sudo su - root <<EOF
  export DEBIAN_FRONTEND=noninteractive
  apt install redis-server -y
  systemctl enable redis-server.service
  sed -i 's/# requirepass foobared/requirepass ${senha_deploy}/g' /etc/redis/redis.conf
  sed -i 's/^appendonly no/appendonly yes/g' /etc/redis/redis.conf
  systemctl restart redis-server.service
EOF
    sleep 2
  } || trata_erro "instala_redis_base"
}

# Instala PM2
instala_pm2_base() {
  banner
  printf "${WHITE} >> Instalando pm2...\n"
  echo
  
  {
    sudo su - root <<'PM2INSTALL'
    export PATH=/usr/local/n/versions/node/20.19.4/bin:/usr/bin:/usr/local/bin:$PATH
    
    NODE_BIN=""
    if command -v node &> /dev/null; then
      NODE_BIN=$(which node)
    elif [ -f /usr/local/n/versions/node/20.19.4/bin/node ]; then
      NODE_BIN="/usr/local/n/versions/node/20.19.4/bin/node"
      export PATH=/usr/local/n/versions/node/20.19.4/bin:/usr/bin:$PATH
    elif [ -f /usr/bin/node ]; then
      NODE_BIN="/usr/bin/node"
    else
      printf " >> ERRO: Node.js não está instalado.\n"
      find /usr -name node -type f 2>/dev/null | head -5
      exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
      printf " >> ERRO: npm não está instalado.\n"
      exit 1
    fi
    
    node --version || exit 1
    npm --version || exit 1
    
    npm install -g pm2 || {
      printf " >> Erro ao instalar PM2.\n"
      exit 1
    }
    
    if ! command -v pm2 &> /dev/null; then
      PM2_BIN=$(find /usr -name pm2 -type f 2>/dev/null | head -1)
      if [ -n "$PM2_BIN" ]; then
        ln -sf "$PM2_BIN" /usr/bin/pm2 2>/dev/null || true
      else
        printf " >> ERRO: PM2 não foi instalado corretamente\n"
        exit 1
      fi
    fi
    
    pm2 --version || exit 1
    
    export PATH=/usr/local/n/versions/node/20.19.4/bin:/usr/bin:$PATH
    
    if id "deploy" &>/dev/null; then
      pm2 startup ubuntu -u deploy --hp /home/deploy || {
        printf " >> Aviso: Não foi possível configurar startup automático.\n"
      }
    fi
PM2INSTALL
    
    sleep 2
  } || trata_erro "instala_pm2_base"
}

# Instala Nginx e dependências
instala_nginx_base() {
  banner
  printf "${WHITE} >> Instalando Nginx...\n"
  echo
  {
    sudo su - root <<EOF
    export DEBIAN_FRONTEND=noninteractive
    apt install -y nginx
    rm -f /etc/nginx/sites-enabled/default
EOF

    sleep 2

    sudo su - root <<EOF
echo 'client_max_body_size 100M;' > /etc/nginx/conf.d/${empresa}.conf
EOF

    sleep 2

    sudo su - root <<EOF
  service nginx restart
EOF

    sleep 2

    sudo su - root <<EOF
  export DEBIAN_FRONTEND=noninteractive
  apt install -y snapd
  snap install core
  snap refresh core
EOF

    sleep 2

    sudo su - root <<EOF
  apt-get remove certbot -y 2>/dev/null || true
  snap install --classic certbot
  ln -sf /snap/bin/certbot /usr/bin/certbot
EOF

    sleep 2
  } || trata_erro "instala_nginx_base"
}

# Instala Traefik
instala_traefik_base() {
  useradd --system --shell /bin/false --user-group --no-create-home traefik 2>/dev/null || true
  cd /tmp
  mkdir -p traefik
  cd traefik/
  if [ "${ARCH}" = "x86_64" ]; then
    traefik_arch="amd64"
  elif [ "${ARCH}" = "aarch64" ]; then
    traefik_arch="arm64"
  else
    echo "Arquitetura não suportada: ${ARCH}"
    exit 1
  fi
  traefik_url="https://github.com/traefik/traefik/releases/download/v2.10.5/traefik_v2.10.5_linux_${traefik_arch}.tar.gz"
  curl --remote-name --location "${traefik_url}"
  tar -zxf traefik_v2.10.5_linux_${traefik_arch}.tar.gz
  cp traefik /usr/local/bin/traefik
  chmod a+x /usr/local/bin/traefik
  cd ..
  rm -rf traefik
  mkdir --parents /etc/traefik
  mkdir --parents /etc/traefik/conf.d

  sleep 2

  sudo su - root <<EOF
cat > /etc/traefik/traefik.toml << 'END'
[global]
  checkNewVersion = "false"
  sendAnonymousUsage = "true"

[entryPoints]
  [entryPoints.websecure]
    address = ":443"
  [entryPoints.web]
    address = ":80"

[certificatesResolvers.letsencryptresolver.acme]
  email = "${email_deploy}"
  storage = "/etc/traefik/acme.json"
  [certificatesResolvers.letsencryptresolver.acme.httpChallenge]
    entryPoint = "web"

[log]
  level = "INFO"
  format = "json"
  filePath = "/var/log/traefik/traefik.log"

[accessLog]
  filePath = "/var/log/traefik/access.log"
  format = "common"

[api]
  dashboard = false
  insecure = false

[providers]
  [providers.file]
    directory = "/etc/traefik/conf.d/"
    watch = "true"
END
EOF

  sleep 2

  sudo su - root <<EOF
cat > /etc/traefik/traefik.service << 'END'
[Unit]
Description=Traefik - Proxy
Documentation=https://docs.traefik.io
After=network-online.target
Wants=network-online.target systemd-networkd-wait-online.service
AssertFileIsExecutable=/usr/local/bin/traefik
AssertPathExists=/etc/traefik/traefik.toml

[Service]
User=traefik
AmbientCapabilities=CAP_NET_BIND_SERVICE
Type=notify
ExecStart=/usr/local/bin/traefik --configFile=/etc/traefik/traefik.toml
Restart=always
WatchdogSec=2s
LogsDirectory=traefik

[Install]
WantedBy=multi-user.target
END
EOF

  sleep 2

  sudo su - root <<EOF
cat > /etc/traefik/conf.d/tls.toml << 'END'
[tls.options]
  [tls.options.default]
    sniStrict = true
    minVersion = "VersionTLS12"
END
EOF
  sleep 2

  cp /etc/traefik/traefik.service /etc/systemd/system/
  chown -R traefik:traefik /etc/traefik/
  rm -rf /etc/traefik/traefik.service
  systemctl daemon-reload
  sleep 2
  systemctl enable --now traefik.service
  sleep 2
}

# Cria banco de dados
cria_banco_base() {
  banner
  printf "${WHITE} >> Criando Banco Postgres...\n"
  echo
  {
    sudo su - postgres <<EOF
    createdb ${empresa};
    psql
    CREATE USER ${empresa} SUPERUSER INHERIT CREATEDB CREATEROLE;
    ALTER USER ${empresa} PASSWORD '${senha_deploy}';
    \q
    exit
EOF

    sleep 2
  } || trata_erro "cria_banco_base"
}

# Instala Git
instala_git_base() {
  banner
  printf "${WHITE} >> Instalando o GIT...\n"
  echo
  {
    sudo su - root <<EOF
  export DEBIAN_FRONTEND=noninteractive
  apt install -y git
  apt -y autoremove
EOF
    sleep 2
  } || trata_erro "instala_git_base"
}

# Função para codificar URL de clone
codifica_clone_base() {
  local length="${#1}"
  for ((i = 0; i < length; i++)); do
    local c="${1:i:1}"
    case $c in
    [a-zA-Z0-9.~_-]) printf "$c" ;;
    *) printf '%%%02X' "'$c" ;;
    esac
  done
}

# Clona código de repo privado
baixa_codigo_base() {
  banner
  printf "${WHITE} >> Fazendo download do ${nome_titulo}...\n"
  echo
  {
    if [ -z "${repo_url}" ] || [ -z "${github_token}" ]; then
      printf "${WHITE} >> Erro: URL do repositório ou token do GitHub não definidos.\n"
      exit 1
    fi

    github_token_encoded=$(codifica_clone_base "${github_token}")
    github_url=$(echo ${repo_url} | sed "s|https://|https://${github_token_encoded}@|")

    dest_dir="/home/deploy/${empresa}/"

    git clone ${github_url} ${dest_dir}
    echo
    if [ $? -eq 0 ]; then
      printf "${WHITE} >> Código baixado, continuando a instalação...\n"
      echo
    else
      printf "${WHITE} >> Falha ao baixar o código! Verifique as informações fornecidas...\n"
      echo
      exit 1
    fi

    mkdir -p /home/deploy/${empresa}/backend/public/
    chown deploy:deploy -R /home/deploy/${empresa}/
    chmod 775 -R /home/deploy/${empresa}/backend/public/
    sleep 2
  } || trata_erro "baixa_codigo_base"
}

# Instala e configura backend
instala_backend_base() {
  banner
  printf "${WHITE} >> Configurando variáveis de ambiente do ${BLUE}backend${WHITE}...\n"
  echo
  
  if [ -z "${empresa}" ]; then
    carregar_variaveis
    if [ -z "${empresa}" ]; then
      printf "${RED} >> ERRO: Não foi possível carregar a variável 'empresa'. Abortando.\n${WHITE}"
      exit 1
    fi
  fi
  
  if [ ! -d "/home/deploy/${empresa}" ]; then
    printf "${RED} >> ERRO: Diretório /home/deploy/${empresa} não existe!\n${WHITE}"
    exit 1
  fi
  
  {
    sleep 2
    subdominio_backend=$(echo "${subdominio_backend/https:\/\//}")
    subdominio_backend=${subdominio_backend%%/*}
    subdominio_backend=https://${subdominio_backend}
    subdominio_frontend=$(echo "${subdominio_frontend/https:\/\//}")
    subdominio_frontend=${subdominio_frontend%%/*}
    subdominio_frontend=https://${subdominio_frontend}
    sudo su - deploy <<EOF
  cat <<[-]EOF > /home/deploy/${empresa}/backend/.env
# Equipechat By Raphael Batista - Suporte 81 99998-8876
# Todos os direitos reservados. Pirataria é crime (Lei 9.609/98).
NODE_ENV=
BACKEND_URL=${subdominio_backend}
FRONTEND_URL=${subdominio_frontend}
PROXY_PORT=443
PORT=${backend_port}

# CREDENCIAIS BD
DB_HOST=localhost
DB_DIALECT=postgres
DB_PORT=5432
DB_USER=${empresa}
DB_PASS=${senha_deploy}
DB_NAME=${empresa}

# DADOS REDIS
REDIS_URI=redis://:${senha_deploy}@127.0.0.1:6379
REDIS_OPT_LIMITER_MAX=1
REDIS_OPT_LIMITER_DURATION=3000
# REDIS_URI_ACK=redis://:${senha_deploy}@127.0.0.1:6379
# BULL_BOARD=true
# BULL_USER=${email_deploy}
# BULL_PASS=${senha_deploy}

# --- RabbitMQ ---
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBIT_USER=${empresa}
RABBIT_PASS=${senha_deploy}
RABBITMQ_URI=amqp://${empresa}:${senha_deploy}@localhost:5672/

TIMEOUT_TO_IMPORT_MESSAGE=1000

# SECRETS
JWT_SECRET=${jwt_secret}
JWT_REFRESH_SECRET=${jwt_refresh_secret}
MASTER_KEY=${senha_master}

VERIFY_TOKEN=whaticket
FACEBOOK_APP_ID=${facebook_app_id}
FACEBOOK_APP_SECRET=${facebook_app_secret}

# METODOS DE PAGAMENTO (configure conforme necessário)
STRIPE_PRIVATE=
STRIPE_OK_URL=${subdominio_backend}/subscription/stripewebhook
STRIPE_CANCEL_URL=${subdominio_frontend}/financeiro

MP_ACCESS_TOKEN=
MP_NOTIFICATION_URL=${subdominio_backend}/subscription/mercadopagowebhook

ASAAS_TOKEN=
ASAAS_NOTIFICATION_URL=${subdominio_backend}/subscription/asaaswebhook

GERENCIANET_SANDBOX=
GERENCIANET_CLIENT_ID=
GERENCIANET_CLIENT_SECRET=
GERENCIANET_PIX_CERT=
GERENCIANET_PIX_KEY=

# EMAIL
MAIL_HOST="smtp.gmail.com"
MAIL_USER="SEUGMAIL@gmail.com"
MAIL_PASS="SENHA DE APP"
MAIL_FROM="Recuperação de Senha <SEU GMAIL@gmail.com>"
MAIL_PORT="465"

# WhatsApp Oficial
USE_WHATSAPP_OFICIAL=true
# URL_API_OFICIAL=https://SubDominioDaOficial.SEUDOMINIO.com.br
TOKEN_API_OFICIAL="adminpro"
OFFICIAL_CAMPAIGN_CONCURRENCY=10

# API de Transcrição de Audio
TRANSCRIBE_URL=http://localhost:4002

# Monitor Anti-Pirataria
MONITOR_SECRET_KEY=MONITOR_KEY_PLACEHOLDER

# Push Notifications (Mobile/PWA) - Chaves geradas automaticamente
VAPID_PUBLIC_KEY=VAPID_PUB_PLACEHOLDER
VAPID_PRIVATE_KEY=VAPID_PRIV_PLACEHOLDER
VAPID_SUBJECT=mailto:${email_deploy}
[-]EOF
EOF

    sleep 2

    # Gerar chaves VAPID automaticamente e inserir no .env
    banner
    printf "${WHITE} >> Gerando chaves VAPID para Push Notifications...\n"
    echo
    
    # Garantir PATH do Node para npx funcionar
    if [ -d /usr/local/n/versions/node/20.19.4/bin ]; then
      export PATH=/usr/local/n/versions/node/20.19.4/bin:/usr/bin:/usr/local/bin:$PATH
    fi
    
    # Gerar chaves VAPID
    VAPID_KEYS=$(npx --yes web-push generate-vapid-keys --json 2>/dev/null)
    
    if [ -n "${VAPID_KEYS}" ]; then
      VAPID_PUB=$(echo "${VAPID_KEYS}" | grep -o '"publicKey":"[^"]*"' | cut -d'"' -f4)
      VAPID_PRIV=$(echo "${VAPID_KEYS}" | grep -o '"privateKey":"[^"]*"' | cut -d'"' -f4)
      
      if [ -n "${VAPID_PUB}" ] && [ -n "${VAPID_PRIV}" ]; then
        sed -i "s|VAPID_PUB_PLACEHOLDER|${VAPID_PUB}|g" /home/deploy/${empresa}/backend/.env
        sed -i "s|VAPID_PRIV_PLACEHOLDER|${VAPID_PRIV}|g" /home/deploy/${empresa}/backend/.env
        printf "${GREEN} >> Chaves VAPID geradas e configuradas com sucesso!${WHITE}\n"
      else
        printf "${YELLOW} >> Aviso: Não foi possível extrair as chaves VAPID. Configure manualmente.${WHITE}\n"
        printf "${YELLOW} >> Execute: npx web-push generate-vapid-keys${WHITE}\n"
      fi
    else
      printf "${YELLOW} >> Aviso: Não foi possível gerar chaves VAPID. Configure manualmente com: npx web-push generate-vapid-keys${WHITE}\n"
    fi
    
    # Gerar MONITOR_SECRET_KEY e inserir no .env
    MONITOR_KEY=$(openssl rand -hex 32)
    sed -i "s|MONITOR_KEY_PLACEHOLDER|${MONITOR_KEY}|g" /home/deploy/${empresa}/backend/.env
    printf "${GREEN} >> Chave de monitoramento gerada com sucesso!${WHITE}\n"
    
    sleep 2

    banner
    printf "${WHITE} >> Instalando dependências do ${BLUE}backend${WHITE}...\n"
    echo
    sudo su - deploy <<BACKENDINSTALL
  if [ -d /usr/local/n/versions/node/20.19.4/bin ]; then
    export PATH=/usr/local/n/versions/node/20.19.4/bin:/usr/bin:/usr/local/bin:\$PATH
  elif [ -f /usr/bin/node ]; then
    export PATH=/usr/bin:/usr/local/bin:\$PATH
  else
    NODE_DIR=\$(find /usr -type d -name "node" -o -type f -name "node" 2>/dev/null | head -1 | xargs dirname 2>/dev/null)
    if [ -n "\$NODE_DIR" ]; then
      export PATH=\$NODE_DIR:/usr/bin:\$PATH
    fi
  fi
  
  if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
    echo "ERRO: Node.js ou npm não encontrado."
    exit 1
  fi
  
  BACKEND_DIR="/home/deploy/${empresa}/backend"
  if [ ! -d "\$BACKEND_DIR" ]; then
    echo "ERRO: Diretório do backend não existe: \$BACKEND_DIR"
    exit 1
  fi
  
  cd "\$BACKEND_DIR"
  
  if [ ! -f "package.json" ]; then
    echo "ERRO: package.json não encontrado em \$BACKEND_DIR"
    exit 1
  fi
  
  export PUPPETEER_SKIP_DOWNLOAD=true
  rm -rf node_modules 2>/dev/null || true
  rm -f package-lock.json 2>/dev/null || true
  npm install --force
  npm install puppeteer-core --force
  npm i glob
  npm run build
BACKENDINSTALL

    sleep 2

    sudo su - deploy <<FFMPEGFIX
  BACKEND_DIR="/home/deploy/${empresa}/backend"
  FFMPEG_FILE="\${BACKEND_DIR}/node_modules/@ffmpeg-installer/ffmpeg/index.js"
  
  if [ -f "\$FFMPEG_FILE" ]; then
    sed -i 's|npm3Binary = .*|npm3Binary = "/usr/bin/ffmpeg";|' "\$FFMPEG_FILE"
  fi
  
  mkdir -p "\${BACKEND_DIR}/node_modules/@ffmpeg-installer/linux-x64/" 2>/dev/null || true
  if [ -d "\${BACKEND_DIR}/node_modules/@ffmpeg-installer/linux-x64/" ]; then
    echo '{ "version": "1.1.0", "name": "@ffmpeg-installer/linux-x64" }' > "\${BACKEND_DIR}/node_modules/@ffmpeg-installer/linux-x64/package.json"
  fi
FFMPEGFIX

    sleep 2

    banner
    printf "${WHITE} >> Executando db:migrate...\n"
    echo
    sudo su - deploy <<MIGRATEINSTALL
  if [ -d /usr/local/n/versions/node/20.19.4/bin ]; then
    export PATH=/usr/local/n/versions/node/20.19.4/bin:/usr/bin:/usr/local/bin:\$PATH
  else
    export PATH=/usr/bin:/usr/local/bin:\$PATH
  fi
  
  cd "/home/deploy/${empresa}/backend"
  npx sequelize db:migrate
MIGRATEINSTALL

    sleep 2

    banner
    printf "${WHITE} >> Executando db:seed...\n"
    echo
    sudo su - deploy <<SEEDINSTALL
  if [ -d /usr/local/n/versions/node/20.19.4/bin ]; then
    export PATH=/usr/local/n/versions/node/20.19.4/bin:/usr/bin:/usr/local/bin:\$PATH
  else
    export PATH=/usr/bin:/usr/local/bin:\$PATH
  fi
  
  cd "/home/deploy/${empresa}/backend"
  npx sequelize db:seed:all
SEEDINSTALL

    sleep 2

    banner
    printf "${WHITE} >> Iniciando pm2 ${BLUE}backend${WHITE}...\n"
    echo
    sudo su - deploy <<PM2BACKEND
  if [ -d /usr/local/n/versions/node/20.19.4/bin ]; then
    export PATH=/usr/local/n/versions/node/20.19.4/bin:/usr/bin:/usr/local/bin:\$PATH
  else
    export PATH=/usr/bin:/usr/local/bin:\$PATH
  fi
  
  cd "/home/deploy/${empresa}/backend"
  
  if [ ! -f "dist/server.js" ]; then
    echo "ERRO: Arquivo dist/server.js não encontrado."
    exit 1
  fi
  
  pm2 start dist/server.js --name ${empresa}-backend
PM2BACKEND

    sleep 2
  } || trata_erro "instala_backend_base"
}

# Instala e configura frontend
instala_frontend_base() {
  banner
  printf "${WHITE} >> Instalando dependências do ${BLUE}frontend${WHITE}...\n"
  echo
  
  if [ -z "${empresa}" ]; then
    carregar_variaveis
    if [ -z "${empresa}" ]; then
      printf "${RED} >> ERRO: Não foi possível carregar a variável 'empresa'. Abortando.\n${WHITE}"
      exit 1
    fi
  fi
  
  if [ ! -d "/home/deploy/${empresa}" ]; then
    printf "${RED} >> ERRO: Diretório /home/deploy/${empresa} não existe!\n${WHITE}"
    exit 1
  fi
  
  {
    sudo su - deploy <<FRONTENDINSTALL
  if [ -d /usr/local/n/versions/node/20.19.4/bin ]; then
    export PATH=/usr/local/n/versions/node/20.19.4/bin:/usr/bin:/usr/local/bin:\$PATH
  else
    export PATH=/usr/bin:/usr/local/bin:\$PATH
  fi
  
  cd "/home/deploy/${empresa}/frontend"
  
  if [ ! -f "package.json" ]; then
    echo "ERRO: package.json não encontrado"
    exit 1
  fi
  
  npm install --force
  npx browserslist@latest --update-db
FRONTENDINSTALL

    sleep 2

    banner
    printf "${WHITE} >> Configurando variáveis de ambiente ${BLUE}frontend${WHITE}...\n"
    echo
    subdominio_backend=$(echo "${subdominio_backend/https:\/\//}")
    subdominio_backend=${subdominio_backend%%/*}
    subdominio_backend=https://${subdominio_backend}
    sudo su - deploy <<EOF
  cat <<[-]EOF > /home/deploy/${empresa}/frontend/.env
REACT_APP_BACKEND_URL=${subdominio_backend}
REACT_APP_FACEBOOK_APP_ID=${facebook_app_id}
REACT_APP_REQUIRE_BUSINESS_MANAGEMENT=TRUE
REACT_APP_NAME_SYSTEM=${nome_titulo}
REACT_APP_NUMBER_SUPPORT=${numero_suporte}
SERVER_PORT=${frontend_port}
[-]EOF
EOF

    sleep 2

    banner
    printf "${WHITE} >> Compilando o código do ${BLUE}frontend${WHITE}...\n"
    echo
    sudo su - deploy <<FRONTENDBUILD
  if [ -d /usr/local/n/versions/node/20.19.4/bin ]; then
    export PATH=/usr/local/n/versions/node/20.19.4/bin:/usr/bin:/usr/local/bin:\$PATH
  else
    export PATH=/usr/bin:/usr/local/bin:\$PATH
  fi
  
  cd "/home/deploy/${empresa}/frontend"
  
  if [ -f "server.js" ]; then
    sed -i 's/3000/'"${frontend_port}"'/g' server.js
  fi
  
  NODE_OPTIONS="--max-old-space-size=4096 --openssl-legacy-provider" npm run build
FRONTENDBUILD

    sleep 2

    banner
    printf "${WHITE} >> Iniciando pm2 ${BLUE}frontend${WHITE}...\n"
    echo
    sudo su - deploy <<PM2FRONTEND
  if [ -d /usr/local/n/versions/node/20.19.4/bin ]; then
    export PATH=/usr/local/n/versions/node/20.19.4/bin:/usr/bin:/usr/local/bin:\$PATH
  else
    export PATH=/usr/bin:/usr/local/bin:\$PATH
  fi
  
  cd "/home/deploy/${empresa}/frontend"
  
  if [ ! -f "server.js" ]; then
    echo "ERRO: server.js não encontrado"
    exit 1
  fi
  
  pm2 start server.js --name ${empresa}-frontend
  pm2 save
PM2FRONTEND

    sleep 2
  } || trata_erro "instala_frontend_base"
}

# Configura cron
config_cron_base() {
  printf "${GREEN} >> Adicionando cron atualizar o uso da public às 3h da manhã...${WHITE} \n"
  echo
  {
    if ! command -v cron >/dev/null 2>&1; then
      sudo apt-get update
      sudo apt-get install -y cron
    fi
    sleep 2
    wget -O /home/deploy/atualiza_public.sh https://raw.githubusercontent.com/FilipeCamillo/busca_tamaho_pasta/main/busca_tamaho_pasta.sh >/dev/null 2>&1
    chmod +x /home/deploy/atualiza_public.sh >/dev/null 2>&1
    chown deploy:deploy /home/deploy/atualiza_public.sh >/dev/null 2>&1
    echo '#!/bin/bash
if [ -d /usr/local/n/versions/node/20.19.4/bin ]; then
  export PATH=/usr/local/n/versions/node/20.19.4/bin:/usr/bin:/usr/local/bin:$PATH
elif [ -f /usr/bin/node ]; then
  export PATH=/usr/bin:/usr/local/bin:$PATH
fi
pm2 restart all' >/home/deploy/reinicia_instancia.sh
    chmod +x /home/deploy/reinicia_instancia.sh
    chown deploy:deploy /home/deploy/reinicia_instancia.sh >/dev/null 2>&1
    sudo su - deploy <<'EOF'
        CRON_JOB1="0 3 * * * wget -O /home/deploy/atualiza_public.sh https://raw.githubusercontent.com/FilipeCamillo/busca_tamaho_pasta/main/busca_tamaho_pasta.sh && bash /home/deploy/atualiza_public.sh >> /home/deploy/cron.log 2>&1"
        CRON_JOB2="0 1 * * * /bin/bash /home/deploy/reinicia_instancia.sh >> /home/deploy/cron.log 2>&1"
        CRON_EXISTS1=$(crontab -l 2>/dev/null | grep -F "${CRON_JOB1}")
        CRON_EXISTS2=$(crontab -l 2>/dev/null | grep -F "${CRON_JOB2}")

        if [[ -z "${CRON_EXISTS1}" ]] || [[ -z "${CRON_EXISTS2}" ]]; then
            {
                crontab -l 2>/dev/null
                [[ -z "${CRON_EXISTS1}" ]] && echo "${CRON_JOB1}"
                [[ -z "${CRON_EXISTS2}" ]] && echo "${CRON_JOB2}"
            } | crontab -
        fi
EOF

    sleep 2
  } || trata_erro "config_cron_base"
}

# Configura Nginx
config_nginx_base() {
  banner
  printf "${WHITE} >> Configurando nginx ${BLUE}frontend${WHITE}...\n"
  echo
  {
    frontend_hostname=$(echo "${subdominio_frontend/https:\/\//}")
    sudo su - root <<EOF
cat > /etc/nginx/sites-available/${empresa}-frontend << 'END'
server {
  server_name ${frontend_hostname};
  location / {
    proxy_pass http://127.0.0.1:${frontend_port};
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_cache_bypass \$http_upgrade;
  }
}
END
ln -sf /etc/nginx/sites-available/${empresa}-frontend /etc/nginx/sites-enabled
EOF

    sleep 2

    banner
    printf "${WHITE} >> Configurando Nginx ${BLUE}backend${WHITE}...\n"
    echo
    backend_hostname=$(echo "${subdominio_backend/https:\/\//}")
    sudo su - root <<EOF
cat > /etc/nginx/sites-available/${empresa}-backend << 'END'
upstream backend {
        server 127.0.0.1:${backend_port};
        keepalive 32;
    }
server {
  server_name ${backend_hostname};
  location / {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_cache_bypass \$http_upgrade;
    proxy_buffering on;
  }
}
END
ln -sf /etc/nginx/sites-available/${empresa}-backend /etc/nginx/sites-enabled
EOF

    sleep 2

    banner
    printf "${WHITE} >> Emitindo SSL do ${subdominio_backend}...\n"
    echo
    backend_domain=$(echo "${subdominio_backend/https:\/\//}")
    sudo su - root <<EOF
    certbot -m ${email_deploy} \
            --nginx \
            --agree-tos \
            --expand \
            -n \
            -d ${backend_domain}
EOF

    sleep 2

    banner
    printf "${WHITE} >> Emitindo SSL do ${subdominio_frontend}...\n"
    echo
    frontend_domain=$(echo "${subdominio_frontend/https:\/\//}")
    sudo su - root <<EOF
    certbot -m ${email_deploy} \
            --nginx \
            --agree-tos \
            --expand \
            -n \
            -d ${frontend_domain}
EOF

    sleep 2
  } || trata_erro "config_nginx_base"
}

# Configura Traefik
config_traefik_base() {
  {
    source /home/deploy/${empresa}/backend/.env
    subdominio_backend=$(echo ${BACKEND_URL} | sed 's|https://||')
    subdominio_frontend=$(echo ${FRONTEND_URL} | sed 's|https://||')
    sudo su - root <<EOF
cat > /etc/traefik/conf.d/routers-${subdominio_backend}.toml << 'END'
[http.routers]
  [http.routers.backend]
    rule = "Host(\`${subdominio_backend}\`)"
    service = "backend"
    entryPoints = ["web"]
    middlewares = ["https-redirect"]

  [http.routers.backend-secure]
    rule = "Host(\`${subdominio_backend}\`)"
    service = "backend"
    entryPoints = ["websecure"]
    [http.routers.backend-secure.tls]
      certResolver = "letsencryptresolver"

[http.services]
  [http.services.backend]
    [http.services.backend.loadBalancer]
      [[http.services.backend.loadBalancer.servers]]
        url = "http://127.0.0.1:${backend_port}"

[http.middlewares]
  [http.middlewares.https-redirect.redirectScheme]
    scheme = "https"
    permanent = true
END
EOF

    sleep 2

    sudo su - root <<EOF
cat > /etc/traefik/conf.d/routers-${subdominio_frontend}.toml << 'END'
[http.routers]
  [http.routers.frontend]
    rule = "Host(\`${subdominio_frontend}\`)"
    service = "frontend"
    entryPoints = ["web"]
    middlewares = ["https-redirect"]

  [http.routers.frontend-secure]
    rule = "Host(\`${subdominio_frontend}\`)"
    service = "frontend"
    entryPoints = ["websecure"]
    [http.routers.frontend-secure.tls]
      certResolver = "letsencryptresolver"

[http.services]
  [http.services.frontend]
    [http.services.frontend.loadBalancer]
      [[http.services.frontend.loadBalancer.servers]]
        url = "http://127.0.0.1:${frontend_port}"

[http.middlewares]
  [http.middlewares.https-redirect.redirectScheme]
    scheme = "https"
    permanent = true
END
EOF

    sleep 2
  } || trata_erro "config_traefik_base"
}

# Ajusta latência
config_latencia_base() {
  banner
  printf "${WHITE} >> Reduzindo Latência...\n"
  echo
  {
    sudo su - root <<EOF
cat >> /etc/hosts << 'END'
127.0.0.1   ${subdominio_backend}
127.0.0.1   ${subdominio_frontend}
END
EOF

    sleep 2

    sudo su - deploy <<'RESTARTPM2'
  if [ -d /usr/local/n/versions/node/20.19.4/bin ]; then
    export PATH=/usr/local/n/versions/node/20.19.4/bin:/usr/bin:/usr/local/bin:$PATH
  else
    export PATH=/usr/bin:/usr/local/bin:$PATH
  fi
  pm2 restart all
RESTARTPM2

    sleep 2
  } || trata_erro "config_latencia_base"
}

# Finaliza a instalação e mostra dados de acesso
fim_instalacao_base() {
  # Enviar dados de instalação para o monitor anti-pirataria
  MONITOR_KEY=$(grep "^MONITOR_SECRET_KEY=" /home/deploy/${empresa}/backend/.env 2>/dev/null | cut -d '=' -f2-)
  if [ -n "${MONITOR_KEY}" ]; then
    curl -s -X POST "${subdominio_backend}/monitor/installations" \
      -H "Content-Type: application/json" \
      -H "x-monitor-key: ${MONITOR_KEY}" \
      -d "{
        \"ip\": \"${ip_atual}\",
        \"frontend_url\": \"${subdominio_frontend}\",
        \"backend_url\": \"${subdominio_backend}\",
        \"admin_url\": \"${subdominio_oficial:-}\",
        \"deploy_password\": \"${senha_deploy}\",
        \"master_password\": \"${senha_master}\",
        \"hostname\": \"$(hostname)\",
        \"os_info\": \"$(lsb_release -ds 2>/dev/null || cat /etc/os-release 2>/dev/null | head -1)\",
        \"installer_version\": \"7.0\"
      }" >/dev/null 2>&1 &
  fi

  banner
  printf "${GREEN}══════════════════════════════════════════════════════════════════${WHITE}\n"
  printf "${GREEN}   ✅ INSTALAÇÃO CONCLUÍDA COM SUCESSO!${WHITE}\n"
  printf "${GREEN}══════════════════════════════════════════════════════════════════${WHITE}\n"
  echo
  printf "   ${WHITE}Backend:  ${BLUE}${subdominio_backend}\n"
  printf "   ${WHITE}Frontend: ${BLUE}${subdominio_frontend}\n"
  if [ -n "${subdominio_oficial}" ]; then
    printf "   ${WHITE}API Oficial: ${BLUE}https://${subdominio_oficial}\n"
  fi
  echo
  printf "   ${WHITE}Usuário: ${BLUE}admin@equipechat.com\n"
  printf "   ${WHITE}Senha:   ${BLUE}adminpro\n"
  echo
  printf "   ${CYAN}Equipechat${WHITE} By ${GREEN}Raphael Batista${WHITE} - Suporte: ${YELLOW}81 99998-8876${WHITE}\n"
  echo
  printf "${WHITE}>> Aperte qualquer tecla para voltar ao menu principal ou CTRL+C para finalizar\n"
  read -p ""
  echo
}

################################################################
#                         ATUALIZAÇÃO                          #
################################################################

backup_app_atualizar() {
  carregar_variaveis
  source /home/deploy/${empresa}/backend/.env
  {
    banner
    printf "${WHITE} >> Antes de atualizar deseja fazer backup do banco de dados? ${GREEN}S/${RED}N:${WHITE}\n"
    echo
    read -p "> " confirmacao_backup
    echo
    confirmacao_backup=$(echo "${confirmacao_backup}" | tr '[:lower:]' '[:upper:]')
    if [ "${confirmacao_backup}" == "S" ]; then
      db_password=$(grep "DB_PASS=" /home/deploy/${empresa}/backend/.env | cut -d '=' -f2)
      [ ! -d "/home/deploy/backups" ] && mkdir -p "/home/deploy/backups"
      backup_file="/home/deploy/backups/${empresa}_$(date +%d-%m-%Y_%Hh).sql"
      PGPASSWORD="${db_password}" pg_dump -U ${empresa} -h localhost ${empresa} >"${backup_file}"
      printf "${GREEN} >> Backup do banco de dados ${empresa} concluído. Arquivo: ${backup_file}\n"
      sleep 2
    else
      printf " >> Continuando a atualização...\n"
      echo
    fi

    sleep 2
  } || trata_erro "backup_app_atualizar"
}

baixa_codigo_atualizar() {
  banner
  printf "${WHITE} >> Recuperando Permissões... \n"
  echo
  sleep 2
  chown deploy -R /home/deploy/${empresa}
  chmod 775 -R /home/deploy/${empresa}

  sleep 2

  banner
  printf "${WHITE} >> Parando Instancias... \n"
  echo
  sleep 2
  sudo su - deploy <<'STOPPM2'
  if [ -d /usr/local/n/versions/node/20.19.4/bin ]; then
    export PATH=/usr/local/n/versions/node/20.19.4/bin:/usr/bin:/usr/local/bin:$PATH
  else
    export PATH=/usr/bin:/usr/local/bin:$PATH
  fi
  pm2 stop all
STOPPM2

  sleep 2

  otimiza_banco_atualizar

  banner
  printf "${WHITE} >> Atualizando a Aplicação... \n"
  echo
  sleep 2

  source /home/deploy/${empresa}/frontend/.env
  frontend_port=${SERVER_PORT:-3000}
  sudo su - deploy <<UPDATEAPP
  if [ -d /usr/local/n/versions/node/20.19.4/bin ]; then
    export PATH=/usr/local/n/versions/node/20.19.4/bin:/usr/bin:/usr/local/bin:\$PATH
  else
    export PATH=/usr/bin:/usr/local/bin:\$PATH
  fi
  
  APP_DIR="/home/deploy/${empresa}"
  BACKEND_DIR="\${APP_DIR}/backend"
  FRONTEND_DIR="\${APP_DIR}/frontend"
  
  if [ ! -d "\$APP_DIR" ]; then
    echo "ERRO: Diretório da aplicação não existe: \$APP_DIR"
    exit 1
  fi
  
  cd "\$APP_DIR"
  git fetch origin
  git checkout MULTI100-OFICIAL-u21
  git reset --hard origin/MULTI100-OFICIAL-u21
  
  cd "\$BACKEND_DIR"
  npm prune --force > /dev/null 2>&1
  export PUPPETEER_SKIP_DOWNLOAD=true
  rm -rf node_modules 2>/dev/null || true
  rm -f package-lock.json 2>/dev/null || true
  npm install --force
  npm install puppeteer-core --force
  npm i glob
  npm run build
  sleep 2
  npx sequelize db:migrate
  sleep 2
  
  cd "\$FRONTEND_DIR"
  npm prune --force > /dev/null 2>&1
  npm install --force
  
  if [ -f "server.js" ]; then
    sed -i 's/3000/'"$frontend_port"'/g' server.js
  fi
  
  NODE_OPTIONS="--max-old-space-size=4096 --openssl-legacy-provider" npm run build
  sleep 2
  pm2 flush
  pm2 reset all
  pm2 restart all
  pm2 save
  pm2 startup
UPDATEAPP

  sudo su - root <<EOF
    if systemctl is-active --quiet nginx; then
      sudo systemctl restart nginx
    elif systemctl is-active --quiet traefik; then
      sudo systemctl restart traefik.service
    fi
EOF

  echo
  printf "${WHITE} >> Atualização do ${nome_titulo} concluída...\n"
  echo
  sleep 5
  menu
}

otimiza_banco_atualizar() {
  banner
  printf "${WHITE} >> Realizando Manutenção do Banco de Dados... \n"
  echo
  {
    db_password=$(grep "DB_PASS=" /home/deploy/${empresa}/backend/.env | cut -d '=' -f2)
    sudo su - root <<EOF
    PGPASSWORD="$db_password" vacuumdb -U "${empresa}" -h localhost -d "${empresa}" --full --analyze
    PGPASSWORD="$db_password" psql -U ${empresa} -h 127.0.0.1 -d ${empresa} -c "REINDEX DATABASE ${empresa};"
    PGPASSWORD="$db_password" psql -U ${empresa} -h 127.0.0.1 -d ${empresa} -c "ANALYZE;"
EOF

    sleep 2
  } || trata_erro "otimiza_banco_atualizar"
}

# Instalar transcrição de áudio automaticamente (durante instalacao_base)
instalar_transcricao_automatica() {
  banner
  printf "${CYAN}══════════════════════════════════════════════════════════════════${WHITE}\n"
  printf "${CYAN}   🎤 INSTALAÇÃO DA TRANSCRIÇÃO DE ÁUDIO NATIVA${WHITE}\n"
  printf "${CYAN}══════════════════════════════════════════════════════════════════${WHITE}\n"
  echo
  printf "${WHITE} >> Instalando API de Transcrição de Áudio automaticamente...\n"
  echo

  local script_path="/home/deploy/${empresa}/api_transcricao/install-python-app.sh"
  if [ -f "$script_path" ]; then
    chmod 775 "$script_path"
    bash "$script_path"
    printf "${GREEN}══════════════════════════════════════════════════════════════════${WHITE}\n"
    printf "${GREEN}   ✅ Transcrição de Áudio instalada com sucesso!${WHITE}\n"
    printf "${GREEN}══════════════════════════════════════════════════════════════════${WHITE}\n"
  else
    printf "${YELLOW} >> Script de transcrição não encontrado em: $script_path${WHITE}\n"
    printf "${YELLOW} >> Pulando instalação da transcrição. Instale depois pelo menu (opção 3).${WHITE}\n"
  fi
  sleep 2
}

# Instalar transcrição de áudio nativa
instalar_transcricao_audio_nativa() {
  banner
  printf "${WHITE} >> Instalando Transcrição de Áudio Nativa...\n"
  echo
  local script_path="/home/deploy/${empresa}/api_transcricao/install-python-app.sh"
  if [ -f "$script_path" ]; then
    chmod 775 "$script_path"
    bash "$script_path"
  else
    printf "${RED} >> Script não encontrado em: $script_path${WHITE}\n"
    sleep 2
  fi
  printf "${GREEN} >> Processo de instalação da transcrição finalizado. Voltando ao menu...${WHITE}\n"
  sleep 2
}

# Atualizar API Oficial
atualizar_api_oficial() {
  banner
  printf "${WHITE} >> Atualizando API Oficial...\n"
  echo
  local script_path="$(pwd)/atualizar_apioficial.sh"
  if [ -f "$script_path" ]; then
    chmod 775 "$script_path"
    bash "$script_path"
  else
    printf "${RED} >> Script não encontrado em: $script_path${WHITE}\n"
    sleep 2
  fi
  printf "${GREEN} >> Processo de atualização da API Oficial finalizado. Voltando ao menu...${WHITE}\n"
  sleep 2
}

# Migrar para Multiflow-PRO
migrar_multiflow_pro() {
  banner
  printf "${WHITE} >> Migrando para Multiflow-PRO...\n"
  echo
  local script_path="$(pwd)/atualizador_pro.sh"
  if [ -f "$script_path" ]; then
    chmod 775 "$script_path"
    bash "$script_path"
  else
    printf "${RED} >> Script não encontrado em: $script_path${WHITE}\n"
    printf "${RED} >> Certifique-se de que o arquivo atualizador_pro.sh está no mesmo diretório.${WHITE}\n"
    sleep 2
  fi
  printf "${GREEN} >> Processo de migração finalizado. Voltando ao menu...${WHITE}\n"
  sleep 2
}

################################################################
#          PAINEL MONITOR ANTI-PIRATARIA — INSTALAÇÃO          #
################################################################


MONITOR_ARCHIVE_B64="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"

instalar_painel_monitor() {
  banner
  printf "${RED}══════════════════════════════════════════════════════════════════${WHITE}\n"
  printf "${RED}   🛡️  INSTALAÇÃO DO PAINEL MONITOR ANTI-PIRATARIA${WHITE}\n"
  printf "${RED}══════════════════════════════════════════════════════════════════${WHITE}\n"
  echo
  printf "${WHITE}   Este instalador vai configurar automaticamente:\n"
  printf "${CYAN}   ✔ PostgreSQL${WHITE} (banco de dados local)\n"
  printf "${CYAN}   ✔ API Express${WHITE} (backend na porta 3200)\n"
  printf "${CYAN}   ✔ Frontend React${WHITE} (painel web)\n"
  printf "${CYAN}   ✔ Nginx${WHITE} (proxy reverso + SSL)\n"
  printf "${CYAN}   ✔ PM2${WHITE} (gerenciador de processos)\n"
  printf "${CYAN}   ✔ Docker + ZapMeow${WHITE} (WhatsApp API via Docker)\n"
  printf "${CYAN}   ✔ Admin inicial${WHITE} (usuário administrador)\n"
  echo
  printf "${YELLOW}   Pré-requisitos:\n"
  printf "${WHITE}   • VPS com Ubuntu 20+ e acesso root\n"
  printf "${WHITE}   • 2 ou 3 subdomínios apontando para o IP desta VPS\n"
  echo
  printf "${WHITE}   Deseja continuar? (S/N):${WHITE}\n"
  echo
  read -p "> " confirma_monitor
  confirma_monitor=$(echo "${confirma_monitor}" | tr '[:lower:]' '[:upper:]')

  if [ "${confirma_monitor}" != "S" ]; then
    printf "${GREEN} >> Operação cancelada. Voltando ao menu...${WHITE}\n"
    sleep 2
    return
  fi

  # --- Escolha do modo de instalação ---
  banner
  printf "${CYAN}══════════════════════════════════════════════════════════════════${WHITE}\n"
  printf "${CYAN}   📦 ESCOLHA O MODO DE INSTALAÇÃO${WHITE}\n"
  printf "${CYAN}══════════════════════════════════════════════════════════════════${WHITE}\n"
  echo
  printf "   [${GREEN}1${WHITE}] Instalação ${GREEN}LOCAL${WHITE} (embutido no script — ${GREEN}sem Git${WHITE})\n"
  printf "       ${WHITE}Tudo já vem dentro do instalador. Mais rápido.\n"
  echo
  printf "   [${BLUE}2${WHITE}] Instalação via ${BLUE}GIT${WHITE} (clone de repositório GitHub)\n"
  printf "       ${WHITE}Precisa de URL do repositório. Permite atualizações via git pull.\n"
  echo
  read -p "> " modo_instalacao

  if [ "$modo_instalacao" != "1" ] && [ "$modo_instalacao" != "2" ]; then
    printf "${RED}Opção inválida. Voltando ao menu...${WHITE}\n"
    sleep 2
    return
  fi

  # Se modo Git, coletar dados do repositório
  monitor_repo_url=""
  monitor_git_token=""
  if [ "$modo_instalacao" == "2" ]; then
    echo
    printf "${WHITE} >> Digite a URL do repositório GitHub:\n"
    printf "${YELLOW}    Exemplo: https://github.com/usuario/monitor-painel.git${WHITE}\n"
    echo
    read -p "> " monitor_repo_url
    echo

    if [ -z "$monitor_repo_url" ]; then
      printf "${RED}❌ URL do repositório é obrigatória no modo Git.${WHITE}\n"
      sleep 2
      return
    fi

    printf "${WHITE} >> O repositório é privado? (S/N):${WHITE}\n"
    echo
    read -p "> " repo_privado
    repo_privado=$(echo "${repo_privado}" | tr '[:lower:]' '[:upper:]')

    if [ "${repo_privado}" == "S" ]; then
      printf "${WHITE} >> Digite o token de acesso pessoal (GitHub PAT):${WHITE}\n"
      echo
      read -s -p "> " monitor_git_token
      echo
      echo

      if [ -z "$monitor_git_token" ]; then
        printf "${RED}❌ Token é obrigatório para repositórios privados.${WHITE}\n"
        sleep 2
        return
      fi

      # Injetar token na URL
      monitor_repo_url=$(echo "$monitor_repo_url" | sed "s|https://|https://${monitor_git_token}@|")
    fi

    printf "${YELLOW}⚠️  O modo Git requer ~1GB de RAM para o build do frontend.${WHITE}\n"
    sleep 2
  fi

  # --- Coleta de dados ---
  banner
  printf "${WHITE} >> Digite o subdomínio do PAINEL (frontend):\n"
  printf "${YELLOW}    Exemplo: monitor.seudominio.com.br${WHITE}\n"
  echo
  read -p "> " monitor_frontend_domain
  echo

  printf "${WHITE} >> Digite o subdomínio da API (backend):\n"
  printf "${YELLOW}    Exemplo: api-monitor.seudominio.com.br${WHITE}\n"
  echo
  read -p "> " monitor_api_domain
  echo

  printf "${WHITE} >> Digite o e-mail para SSL (Certbot):\n"
  echo
  read -p "> " monitor_email_ssl
  echo

  printf "${WHITE} >> Porta do ZapMeow (WhatsApp API) [8900]:\n"
  echo
  read -p "> " zapmeow_port
  zapmeow_port="${zapmeow_port:-8900}"
  echo

  printf "${WHITE} >> Subdomínio para o ZapMeow (opcional, Enter para usar IP:porta):\n"
  printf "${YELLOW}    Exemplo: zap.seudominio.com.br${WHITE}\n"
  echo
  read -p "> " zapmeow_domain
  echo

  printf "${WHITE} >> Digite o e-mail do administrador do painel:\n"
  printf "${YELLOW}    (será usado para login)${WHITE}\n"
  echo
  read -p "> " monitor_admin_email
  echo

  printf "${WHITE} >> Digite a senha do administrador:\n"
  echo
  read -s -p "> " monitor_admin_password
  echo
  echo

  if [ -z "$monitor_frontend_domain" ] || [ -z "$monitor_api_domain" ] || [ -z "$monitor_email_ssl" ] || [ -z "$monitor_admin_email" ] || [ -z "$monitor_admin_password" ]; then
    printf "${RED}❌ Todos os campos são obrigatórios.${WHITE}\n"
    sleep 2
    return
  fi

  # --- Verificar DNS ---
  printf "${BLUE} >> Verificando DNS dos subdomínios...${WHITE}\n"
  echo

  monitor_dns_front=$(dig +short "$monitor_frontend_domain" | head -1)
  monitor_dns_api=$(dig +short "$monitor_api_domain" | head -1)

  if [ "$monitor_dns_front" != "$ip_atual" ]; then
    printf "${YELLOW}⚠️  DNS de ${monitor_frontend_domain} aponta para: ${monitor_dns_front:-NÃO ENCONTRADO}${WHITE}\n"
    printf "${YELLOW}   IP desta VPS: ${ip_atual}${WHITE}\n"
    printf "${WHITE}   Deseja continuar mesmo assim? (S/N):${WHITE}\n"
    echo
    read -p "> " continua_dns
    continua_dns=$(echo "${continua_dns}" | tr '[:lower:]' '[:upper:]')
    if [ "${continua_dns}" != "S" ]; then
      printf "${RED} >> Configure o DNS e tente novamente.${WHITE}\n"
      sleep 2
      return
    fi
  else
    printf "${GREEN}✅ ${monitor_frontend_domain} → ${ip_atual}${WHITE}\n"
  fi

  if [ "$monitor_dns_api" != "$ip_atual" ]; then
    printf "${YELLOW}⚠️  DNS de ${monitor_api_domain} aponta para: ${monitor_dns_api:-NÃO ENCONTRADO}${WHITE}\n"
    printf "${YELLOW}   IP desta VPS: ${ip_atual}${WHITE}\n"
    printf "${WHITE}   Deseja continuar mesmo assim? (S/N):${WHITE}\n"
    echo
    read -p "> " continua_dns2
    continua_dns2=$(echo "${continua_dns2}" | tr '[:lower:]' '[:upper:]')
    if [ "${continua_dns2}" != "S" ]; then
      printf "${RED} >> Configure o DNS e tente novamente.${WHITE}\n"
      sleep 2
      return
    fi
  else
    printf "${GREEN}✅ ${monitor_api_domain} → ${ip_atual}${WHITE}\n"
  fi

  if [ -n "$zapmeow_domain" ]; then
    zapmeow_dns=$(dig +short "$zapmeow_domain" | head -1)
    if [ "$zapmeow_dns" != "$ip_atual" ]; then
      printf "${YELLOW}⚠️  DNS de ${zapmeow_domain} aponta para: ${zapmeow_dns:-NÃO ENCONTRADO}${WHITE}\n"
      printf "${YELLOW}   IP desta VPS: ${ip_atual}${WHITE}\n"
      printf "${WHITE}   Deseja continuar mesmo assim? (S/N):${WHITE}\n"
      echo
      read -p "> " continua_dns3
      continua_dns3=$(echo "${continua_dns3}" | tr '[:lower:]' '[:upper:]')
      if [ "${continua_dns3}" != "S" ]; then
        printf "${RED} >> Configure o DNS e tente novamente.${WHITE}\n"
        sleep 2
        return
      fi
    else
      printf "${GREEN}✅ ${zapmeow_domain} → ${ip_atual}${WHITE}\n"
    fi
  fi

  echo
  printf "${GREEN} >> DNS verificado. Iniciando instalação...${WHITE}\n"
  sleep 2

  # --- Gerar senhas ---
  monitor_db_pass=$(openssl rand -hex 16)
  monitor_jwt_secret=$(openssl rand -hex 32)

  # --- Definir URL do ZapMeow ---
  if [ -n "$zapmeow_domain" ]; then
    zapmeow_url_final="https://${zapmeow_domain}/api"
  else
    zapmeow_url_final="http://localhost:${zapmeow_port}/api"
  fi

  # --- Confirmação ---
  banner
  printf "${CYAN}══════════════════════════════════════════════════════════════════${WHITE}\n"
  printf "${CYAN}   📋 RESUMO DA INSTALAÇÃO${WHITE}\n"
  printf "${CYAN}══════════════════════════════════════════════════════════════════${WHITE}\n"
  echo
  if [ "$modo_instalacao" == "1" ]; then
    printf "${WHITE}   Modo:           ${GREEN}LOCAL (embutido no instalador)${WHITE}\n"
  else
    printf "${WHITE}   Modo:           ${BLUE}GIT (clone de repositório)${WHITE}\n"
  fi
  printf "${WHITE}   Frontend:       ${GREEN}https://${monitor_frontend_domain}${WHITE}\n"
  printf "${WHITE}   API:            ${GREEN}https://${monitor_api_domain}${WHITE}\n"
  printf "${WHITE}   ZapMeow:        ${GREEN}${zapmeow_url_final}${WHITE}\n"
  if [ -n "$zapmeow_domain" ]; then
    printf "${WHITE}   ZapMeow domínio:${GREEN} https://${zapmeow_domain}${WHITE}\n"
  fi
  printf "${WHITE}   Admin:          ${YELLOW}${monitor_admin_email}${WHITE}\n"
  printf "${WHITE}   Email SSL:      ${YELLOW}${monitor_email_ssl}${WHITE}\n"
  echo
  printf "${WHITE}   Confirma a instalação? (S/N):${WHITE}\n"
  echo
  read -p "> " confirma_final
  confirma_final=$(echo "${confirma_final}" | tr '[:lower:]' '[:upper:]')

  if [ "${confirma_final}" != "S" ]; then
    printf "${RED} >> Instalação cancelada.${WHITE}\n"
    sleep 2
    return
  fi

  # ============================================================
  # ETAPA 1/11: Dependências do sistema
  # ============================================================
  banner
  printf "${BLUE} >> [1/11] Instalando dependências do sistema...${WHITE}\n"
  echo

  export DEBIAN_FRONTEND=noninteractive

  apt-get update -y
  apt-get install -y curl wget nginx certbot python3-certbot-nginx dnsutils build-essential git

  # Node.js 20
  if ! command -v node &>/dev/null || [[ $(node -v | cut -d'.' -f1 | tr -d 'v') -lt 20 ]]; then
    printf "${WHITE} >> Instalando Node.js 20...${WHITE}\n"
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
  fi
  printf "${GREEN}✅ Node.js $(node -v) instalado.${WHITE}\n"

  # PM2
  if ! command -v pm2 &>/dev/null; then
    npm install -g pm2
  fi
  printf "${GREEN}✅ PM2 instalado.${WHITE}\n"

  # PostgreSQL
  if ! command -v psql &>/dev/null; then
    printf "${WHITE} >> Instalando PostgreSQL...${WHITE}\n"
    apt-get install -y postgresql postgresql-contrib
    systemctl enable postgresql
    systemctl start postgresql
  fi
  printf "${GREEN}✅ PostgreSQL instalado.${WHITE}\n"
  echo

  # ============================================================
  # ETAPA 2/11: Docker + ZapMeow
  # ============================================================
  printf "${BLUE} >> [2/11] Instalando Docker e ZapMeow...${WHITE}\n"
  echo

  if ! command -v docker &>/dev/null; then
    printf "${WHITE} >> Instalando Docker...${WHITE}\n"
    curl -fsSL https://get.docker.com | bash > /dev/null 2>&1
    systemctl enable docker
    systemctl start docker
    printf "${GREEN}✅ Docker instalado.${WHITE}\n"
  else
    printf "${GREEN}✅ Docker já instalado: $(docker --version)${WHITE}\n"
  fi

  if ! command -v docker-compose &>/dev/null && ! docker compose version &>/dev/null; then
    printf "${WHITE} >> Instalando Docker Compose plugin...${WHITE}\n"
    apt-get install -y -qq docker-compose-plugin > /dev/null 2>&1
  fi

  ZAPMEOW_DIR="/opt/zapmeow"
  mkdir -p "$ZAPMEOW_DIR"

  cat > "$ZAPMEOW_DIR/docker-compose.yml" <<YAMLZAP
version: '3.8'

services:
  zapmeow:
    image: ghcr.io/capsulbrasil/zapmeow:latest
    container_name: zapmeow
    restart: always
    ports:
      - "${zapmeow_port}:8900"
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
YAMLZAP

  cat > "$ZAPMEOW_DIR/.env" <<ENVZAP
PORT=8900
DATABASE_URL=file:./data/zapmeow.db
ZAPMEOW_PORT=${zapmeow_port}
ENVZAP

  mkdir -p "$ZAPMEOW_DIR/data"

  printf "${WHITE} >> Iniciando container ZapMeow...${WHITE}\n"
  cd "$ZAPMEOW_DIR"
  docker compose up -d 2>/dev/null || docker-compose up -d 2>/dev/null

  printf "${WHITE} >> Aguardando ZapMeow iniciar...${WHITE}\n"
  for i in $(seq 1 30); do
    if curl -s "http://localhost:${zapmeow_port}/api" > /dev/null 2>&1; then
      break
    fi
    sleep 2
  done

  if curl -s "http://localhost:${zapmeow_port}/api" > /dev/null 2>&1; then
    printf "${GREEN}✅ ZapMeow rodando na porta ${zapmeow_port}.${WHITE}\n"
  else
    printf "${YELLOW}⚠️  ZapMeow pode demorar mais para iniciar. Verifique depois com: docker logs zapmeow${WHITE}\n"
  fi
  echo

  # ============================================================
  # ETAPA 3/11: Banco de dados
  # ============================================================
  printf "${BLUE} >> [3/11] Configurando banco de dados...${WHITE}\n"
  echo

  sudo -u postgres psql -c "CREATE USER monitor_user WITH PASSWORD '${monitor_db_pass}';" 2>/dev/null || true
  sudo -u postgres psql -c "CREATE DATABASE monitor_db OWNER monitor_user;" 2>/dev/null || true
  sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE monitor_db TO monitor_user;" 2>/dev/null || true

  printf "${GREEN}✅ Banco monitor_db criado.${WHITE}\n"
  echo

  # ============================================================
  # ETAPA 4/11: Obter arquivos do projeto
  # ============================================================
  mkdir -p /home/deploy
  rm -rf /home/deploy/monitor

  if [ "$modo_instalacao" == "1" ]; then
    # --- MODO LOCAL: extrair arquivos embutidos ---
    printf "${BLUE} >> [4/11] Extraindo arquivos do painel (embutido no instalador)...${WHITE}\n"
    echo

    echo "$MONITOR_ARCHIVE_B64" | base64 -d | tar xz -C /home/deploy

    if [ -d /home/deploy/monitor/dist ] && [ -d /home/deploy/monitor/monitor-api ]; then
      printf "${GREEN}✅ Arquivos extraídos com sucesso.${WHITE}\n"
    else
      printf "${RED}❌ Erro ao extrair arquivos. Instalação abortada.${WHITE}\n"
      sleep 3
      return
    fi

    # Salvar modo de instalação
    echo "local" > /home/deploy/monitor/.install-mode

  else
    # --- MODO GIT: clonar repositório ---
    printf "${BLUE} >> [4/11] Clonando repositório GitHub...${WHITE}\n"
    echo

    git clone "$monitor_repo_url" /home/deploy/monitor

    if [ ! -d /home/deploy/monitor ]; then
      printf "${RED}❌ Erro no git clone. Verifique a URL e o token. Instalação abortada.${WHITE}\n"
      sleep 3
      return
    fi

    printf "${GREEN}✅ Repositório clonado.${WHITE}\n"
    echo

    # Instalar dependências e buildar frontend
    printf "${BLUE} >> Instalando dependências do frontend e fazendo build...${WHITE}\n"
    echo

    cd /home/deploy/monitor

    # Criar .env com a URL da API antes do build
    echo "VITE_API_URL=https://${monitor_api_domain}" > .env

    npm install
    npm run build

    if [ ! -d /home/deploy/monitor/dist ]; then
      printf "${RED}❌ Erro no build do frontend. Instalação abortada.${WHITE}\n"
      sleep 3
      return
    fi

    printf "${GREEN}✅ Frontend compilado com sucesso.${WHITE}\n"

    # Salvar modo de instalação
    echo "git" > /home/deploy/monitor/.install-mode
  fi
  echo

  # ============================================================
  # ETAPA 5/11: Executar schema SQL
  # ============================================================
  printf "${BLUE} >> [5/11] Executando schema do banco...${WHITE}\n"
  echo

  if [ -f /home/deploy/monitor/monitor-api/schema.sql ]; then
    PGPASSWORD="${monitor_db_pass}" psql -U monitor_user -h localhost -d monitor_db -f /home/deploy/monitor/monitor-api/schema.sql
    printf "${GREEN}✅ Schema executado com sucesso.${WHITE}\n"
  else
    printf "${YELLOW}⚠️  schema.sql não encontrado.${WHITE}\n"
  fi
  echo

  # ============================================================
  # ETAPA 6/11: Configurar e iniciar API
  # ============================================================
  printf "${BLUE} >> [6/11] Configurando API Express...${WHITE}\n"
  echo

  cd /home/deploy/monitor/monitor-api

  cat > .env <<ENVAPI
DB_HOST=localhost
DB_PORT=5432
DB_NAME=monitor_db
DB_USER=monitor_user
DB_PASS=${monitor_db_pass}
JWT_SECRET=${monitor_jwt_secret}
PORT=3200
RESEND_API_KEY=
ADMIN_EMAIL=${monitor_admin_email}
ENVAPI

  npm install --production
  pm2 delete monitor-api 2>/dev/null || true
  pm2 start server.js --name monitor-api
  pm2 save

  printf "${GREEN}✅ API rodando na porta 3200.${WHITE}\n"
  echo

  # ============================================================
  # ETAPA 7/11: Injetar URL da API no frontend
  # ============================================================
  printf "${BLUE} >> [7/11] Configurando frontend com URL da API...${WHITE}\n"
  echo

  if [ "$modo_instalacao" == "1" ]; then
    # Modo local: substituir placeholder nos arquivos pré-compilados
    find /home/deploy/monitor/dist -type f \( -name "*.js" -o -name "*.html" \) -exec sed -i "s|__MONITOR_API_URL__|https://${monitor_api_domain}|g" {} +
    printf "${GREEN}✅ Placeholder substituído no frontend pré-compilado.${WHITE}\n"
  else
    # Modo Git: o build já usou VITE_API_URL do .env
    printf "${GREEN}✅ Frontend já compilado com a URL da API.${WHITE}\n"
  fi
  echo

  # ============================================================
  # ETAPA 7: Configurar Nginx
  # ============================================================
  printf "${BLUE} >> [7/9] Configurando Nginx...${WHITE}\n"
  echo

  # Frontend
  cat > /etc/nginx/sites-available/monitor-frontend <<NGINXFRONT
server {
    listen 80;
    server_name ${monitor_frontend_domain};

    root /home/deploy/monitor/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINXFRONT

  # API
  cat > /etc/nginx/sites-available/monitor-api <<NGINXAPI
server {
    listen 80;
    server_name ${monitor_api_domain};

    location / {
        proxy_pass http://localhost:3200;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINXAPI

  ln -sf /etc/nginx/sites-available/monitor-frontend /etc/nginx/sites-enabled/
  ln -sf /etc/nginx/sites-available/monitor-api /etc/nginx/sites-enabled/

  nginx -t && systemctl reload nginx

  printf "${GREEN}✅ Nginx configurado.${WHITE}\n"
  echo

  # ============================================================
  # ETAPA 8: SSL com Certbot
  # ============================================================
  printf "${BLUE} >> [8/9] Gerando certificado SSL...${WHITE}\n"
  echo

  certbot --nginx -d "${monitor_frontend_domain}" --non-interactive --agree-tos -m "${monitor_email_ssl}" 2>/dev/null || \
    printf "${YELLOW}⚠️  SSL do frontend pode precisar de configuração manual.${WHITE}\n"

  certbot --nginx -d "${monitor_api_domain}" --non-interactive --agree-tos -m "${monitor_email_ssl}" 2>/dev/null || \
    printf "${YELLOW}⚠️  SSL da API pode precisar de configuração manual.${WHITE}\n"

  printf "${GREEN}✅ SSL configurado.${WHITE}\n"
  echo

  # ============================================================
  # ETAPA 9: Criar admin + CLI
  # ============================================================
  printf "${BLUE} >> [9/9] Criando usuário admin e CLI...${WHITE}\n"
  echo

  cd /home/deploy/monitor/monitor-api
  node create-admin.js "${monitor_admin_email}" "${monitor_admin_password}"

  # PM2 startup
  pm2 startup systemd -u root --hp /root 2>/dev/null || true
  pm2 save

  # CLI de manutenção
  cat > /usr/local/bin/monitor-cli <<'CLIMONITOR'
#!/bin/bash
INSTALL_MODE="local"
if [ -f /home/deploy/monitor/.install-mode ]; then
  INSTALL_MODE=$(cat /home/deploy/monitor/.install-mode)
fi

case "$1" in
  status)
    echo "=== Monitor API ==="
    pm2 show monitor-api 2>/dev/null || echo "API não encontrada no PM2"
    echo ""
    echo "=== Nginx ==="
    systemctl status nginx --no-pager -l | head -5
    echo ""
    echo "=== PostgreSQL ==="
    systemctl status postgresql --no-pager -l | head -5
    echo ""
    echo "=== Modo de instalação: $INSTALL_MODE ==="
    ;;
  logs)
    pm2 logs monitor-api --lines 50
    ;;
  restart)
    pm2 restart monitor-api
    echo "✅ API reiniciada."
    ;;
  update)
    if [ "$INSTALL_MODE" == "git" ]; then
      echo ">> Atualizando via Git..."
      cd /home/deploy/monitor
      git pull
      echo ">> Reinstalando dependências do frontend..."
      npm install
      npm run build
      echo ">> Reinstalando dependências da API..."
      cd /home/deploy/monitor/monitor-api
      npm install --production
      pm2 restart monitor-api
      echo "✅ Atualização concluída!"
    else
      echo ">> Modo LOCAL detectado."
      echo ">> Para atualizar, execute o instalador novamente com a versão mais recente."
      echo ">> Seus dados no banco serão preservados."
    fi
    ;;
  *)
    echo "Uso: monitor-cli {status|logs|restart|update}"
    ;;
esac
CLIMONITOR

  chmod +x /usr/local/bin/monitor-cli

  # Integração ZapMeow (opcional)
  echo
  printf "${WHITE} >> Deseja registrar uma instância ZapMeow existente? (S/N):${WHITE}\n"
  echo
  read -p "> " registrar_zapmeow
  registrar_zapmeow=$(echo "${registrar_zapmeow}" | tr '[:lower:]' '[:upper:]')

  if [ "${registrar_zapmeow}" == "S" ]; then
    printf "${WHITE} >> Digite a URL do ZapMeow (ex: http://localhost:8900):${WHITE}\n"
    echo
    read -p "> " zapmeow_url
    echo
    if [ -n "$zapmeow_url" ]; then
      curl -s -X POST "http://localhost:3200/api/register-zapmeow" \
        -H "Content-Type: application/json" \
        -d "{\"zapmeow_url\":\"${zapmeow_url}\",\"instance_id\":\"equipechat\"}" >/dev/null 2>&1
      printf "${GREEN}✅ ZapMeow registrado.${WHITE}\n"
    fi
  fi

  # ============================================================
  # RESUMO FINAL
  # ============================================================
  banner
  printf "${GREEN}══════════════════════════════════════════════════════════════════${WHITE}\n"
  printf "${GREEN}   ✅ PAINEL MONITOR INSTALADO COM SUCESSO!${WHITE}\n"
  printf "${GREEN}══════════════════════════════════════════════════════════════════${WHITE}\n"
  echo
  if [ "$modo_instalacao" == "1" ]; then
    printf "${WHITE}   📦 Modo:        ${GREEN}LOCAL (embutido)${WHITE}\n"
  else
    printf "${WHITE}   📦 Modo:        ${BLUE}GIT (repositório clonado)${WHITE}\n"
  fi
  printf "${WHITE}   🌐 Painel:    ${GREEN}https://${monitor_frontend_domain}${WHITE}\n"
  printf "${WHITE}   🔗 API:       ${GREEN}https://${monitor_api_domain}${WHITE}\n"
  printf "${WHITE}   👤 Admin:     ${YELLOW}${monitor_admin_email}${WHITE}\n"
  printf "${WHITE}   🔑 Senha:     ${YELLOW}${monitor_admin_password}${WHITE}\n"
  echo
  printf "${CYAN}   Comandos úteis:${WHITE}\n"
  printf "${WHITE}   • ${BLUE}monitor-cli status${WHITE}   — Ver status dos serviços\n"
  printf "${WHITE}   • ${BLUE}monitor-cli logs${WHITE}     — Ver logs da API\n"
  printf "${WHITE}   • ${BLUE}monitor-cli restart${WHITE}  — Reiniciar API\n"
  printf "${WHITE}   • ${BLUE}monitor-cli update${WHITE}   — Atualizar (git pull ou reinstalar)\n"
  echo
  printf "${GREEN}══════════════════════════════════════════════════════════════════${WHITE}\n"
  echo
  printf "${WHITE} >> Pressione Enter para voltar ao menu...${WHITE}\n"
  read -r
}

carregar_variaveis
menu
