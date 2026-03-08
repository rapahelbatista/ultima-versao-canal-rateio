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
UBUNTU_VERSION=$(lsb_release -sr 2>/dev/null || echo "24.04")
ARQUIVO_VARIAVEIS="VARIAVEIS_INSTALACAO_LICENCAS"
ARQUIVO_ETAPAS="ETAPA_INSTALACAO_LICENCAS"
ip_atual=$(curl -s http://checkip.amazonaws.com)

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
  printf "  ${WHITE}Versão do Instalador: ${BLUE}1.0${WHITE}\n"
  printf "\n"
  printf "  ${MAGENTA}╔══════════════════════════════════════════════════════════════╗${WHITE}\n"
  printf "  ${MAGENTA}║${WHITE}                                                              ${MAGENTA}║${WHITE}\n"
  printf "  ${MAGENTA}║${WHITE}   ${CYAN}🔐 GERENCIADOR DE LICENÇAS DO EQUIPECHAT${WHITE}                  ${MAGENTA}║${WHITE}\n"
  printf "  ${MAGENTA}║${WHITE}                                                              ${MAGENTA}║${WHITE}\n"
  printf "  ${MAGENTA}║${WHITE}   Sistema de monitoramento e controle de instalações.        ${MAGENTA}║${WHITE}\n"
  printf "  ${MAGENTA}║${WHITE}   Gerencie licenças, bloqueie instalações piratas e          ${MAGENTA}║${WHITE}\n"
  printf "  ${MAGENTA}║${WHITE}   monitore todos os seus servidores em tempo real.           ${MAGENTA}║${WHITE}\n"
  printf "  ${MAGENTA}║${WHITE}                                                              ${MAGENTA}║${WHITE}\n"
  printf "  ${MAGENTA}╚══════════════════════════════════════════════════════════════╝${WHITE}\n"
  printf "\n"
  printf "  ${RED}╔══════════════════════════════════════════════════════════════╗${WHITE}\n"
  printf "  ${RED}║${WHITE}  ${RED}⚠  AVISO LEGAL:${WHITE} Pirataria é crime (Lei 9.609/98).        ${RED}║${WHITE}\n"
  printf "  ${RED}║${WHITE}  Este sistema é licenciado e protegido por direitos          ${RED}║${WHITE}\n"
  printf "  ${RED}║${WHITE}  autorais. O uso não autorizado é ${RED}PROIBIDO${WHITE}.                 ${RED}║${WHITE}\n"
  printf "  ${RED}║${WHITE}                                                              ${RED}║${WHITE}\n"
  printf "  ${RED}║${WHITE}  ${YELLOW}🔍 Seu IP está sendo monitorado: ${CYAN}${ip_atual}${WHITE}           ${RED}║${WHITE}\n"
  printf "  ${RED}║${WHITE}  ${YELLOW}📅 Data: ${CYAN}$(date '+%d/%m/%Y %H:%M:%S')${WHITE}                      ${RED}║${WHITE}\n"
  printf "  ${RED}╚══════════════════════════════════════════════════════════════╝${WHITE}\n"
  printf "\n"
}

# Função para manipular erros
trata_erro() {
  printf "${RED}Erro encontrado na etapa $1. Encerrando o script.${WHITE}\n"
  salvar_etapa "$1"
  exit 1
}

# Salvar variáveis
salvar_variaveis() {
  echo "subdominio_licencas=${subdominio_licencas}" >$ARQUIVO_VARIAVEIS
  echo "email_deploy=${email_deploy}" >>$ARQUIVO_VARIAVEIS
  echo "senha_deploy=${senha_deploy}" >>$ARQUIVO_VARIAVEIS
  echo "github_token=${github_token}" >>$ARQUIVO_VARIAVEIS
  echo "repo_url=${repo_url}" >>$ARQUIVO_VARIAVEIS
  echo "licencas_port=${licencas_port}" >>$ARQUIVO_VARIAVEIS
}

# Carregar variáveis
carregar_variaveis() {
  if [ -f $ARQUIVO_VARIAVEIS ]; then
    source $ARQUIVO_VARIAVEIS
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
  instalacao_licencas
}

# Pergunta se deseja continuar ou recomeçar
verificar_arquivos_existentes() {
  if [ -f $ARQUIVO_VARIAVEIS ] && [ -f $ARQUIVO_ETAPAS ]; then
    banner
    printf "${YELLOW} >> Dados de instalação anteriores detectados.\n"
    echo
    carregar_etapa
    if [ "$etapa" -eq 10 ]; then
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
    elif [ "$etapa" -lt 10 ]; then
      printf "${YELLOW} >> Instalação Incompleta Detectada na etapa $etapa. \n"
      printf "${WHITE} >> Deseja continuar de onde parou? (S/N): ${WHITE}\n"
      echo
      read -p "> " escolha
      echo
      escolha=$(echo "${escolha}" | tr '[:lower:]' '[:upper:]')
      if [ "$escolha" == "S" ]; then
        instalacao_licencas
      else
        printf "${GREEN} >> Voltando ao menu principal...${WHITE}\n"
        sleep 5
        menu
      fi
    fi
  else
    instalacao_licencas
  fi
}

# Menu principal
menu() {
  while true; do
    banner
    printf "${WHITE} Selecione abaixo a opção desejada: \n"
    echo
    printf "   [${BLUE}1${WHITE}] Instalar Gerenciador de Licenças\n"
    printf "   [${BLUE}2${WHITE}] Atualizar Gerenciador de Licenças\n"
    printf "   [${BLUE}3${WHITE}] Status dos Serviços\n"
    printf "   [${BLUE}0${WHITE}] Sair\n"
    echo
    read -p "> " option
    case "${option}" in
    1)
      verificar_arquivos_existentes
      ;;
    2)
      atualizar_licencas
      ;;
    3)
      status_servicos
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

# Etapa de instalação
instalacao_licencas() {
  carregar_etapa
  if [ "$etapa" == "0" ]; then
    questoes_dns || trata_erro "questoes_dns"
    verificar_dns || trata_erro "verificar_dns"
    questoes_variaveis || trata_erro "questoes_variaveis"
    define_porta || trata_erro "define_porta"
    confirma_dados_instalacao || trata_erro "confirma_dados_instalacao"
    salvar_variaveis || trata_erro "salvar_variaveis"
    salvar_etapa 1
  fi
  if [ "$etapa" -le "1" ]; then
    atualiza_vps || trata_erro "atualiza_vps"
    salvar_etapa 2
  fi
  if [ "$etapa" -le "2" ]; then
    config_timezone || trata_erro "config_timezone"
    salvar_etapa 3
  fi
  if [ "$etapa" -le "3" ]; then
    config_firewall || trata_erro "config_firewall"
    salvar_etapa 4
  fi
  if [ "$etapa" -le "4" ]; then
    instala_node || trata_erro "instala_node"
    salvar_etapa 5
  fi
  if [ "$etapa" -le "5" ]; then
    instala_nginx || trata_erro "instala_nginx"
    salvar_etapa 6
  fi
  if [ "$etapa" -le "6" ]; then
    instala_git || trata_erro "instala_git"
    salvar_etapa 7
  fi
  if [ "$etapa" -le "7" ]; then
    baixa_codigo || trata_erro "baixa_codigo"
    salvar_etapa 8
  fi
  if [ "$etapa" -le "8" ]; then
    instala_app || trata_erro "instala_app"
    salvar_etapa 9
  fi
  if [ "$etapa" -le "9" ]; then
    config_nginx || trata_erro "config_nginx"
    fim_instalacao
    salvar_etapa 10
  fi
}

sair() {
  exit 0
}

################################################################
#                       COLETA DE DADOS                        #
################################################################

questoes_dns() {
  banner
  printf "${WHITE} >> Insira o domínio/subdomínio para o Gerenciador de Licenças\n"
  printf "${WHITE} >> (Ex: licencas.seudominio.com.br): \n"
  echo
  read -p "> " subdominio_licencas
  echo
  subdominio_licencas=$(echo "${subdominio_licencas}" | sed 's|https://||g' | sed 's|http://||g' | cut -d'/' -f1)
}

verificar_dns() {
  banner
  printf "${WHITE} >> Verificando o DNS do domínio/subdomínio...\n"
  echo
  sleep 2
  sudo apt-get install dnsutils -y >/dev/null 2>&1

  local resolved_ip=$(dig +short ${subdominio_licencas} @8.8.8.8)
  if [[ "${resolved_ip}" != "${ip_atual}"* ]] || [ -z "${resolved_ip}" ]; then
    printf "${YELLOW} >> AVISO: DNS de ${subdominio_licencas} não aponta para este IP (${ip_atual}).${WHITE}\n"
    printf "${WHITE} >> IP resolvido: ${resolved_ip:-nenhum}${WHITE}\n"
    echo
    printf "${WHITE} >> Deseja continuar mesmo assim? (S/N): ${WHITE}\n"
    read -p "> " continuar_dns
    continuar_dns=$(echo "${continuar_dns}" | tr '[:lower:]' '[:upper:]')
    if [ "${continuar_dns}" != "S" ]; then
      printf "${RED} >> Instalação cancelada. Configure o DNS e tente novamente.${WHITE}\n"
      sleep 3
      menu
      return 0
    fi
  else
    printf "${GREEN} >> DNS OK! ${subdominio_licencas} aponta para ${ip_atual}${WHITE}\n"
    sleep 2
  fi
}

questoes_variaveis() {
  banner
  printf "${WHITE} >> Digite o seu melhor email (para certificado SSL): \n"
  echo
  read -p "> " email_deploy
  echo
  banner
  printf "${WHITE} >> Insira uma senha para o servidor: \n"
  echo
  read -p "> " senha_deploy
  echo
  banner
  printf "${WHITE} >> Digite seu TOKEN de acesso pessoal do GitHub: \n"
  printf "${WHITE} >> Passo a Passo para gerar o seu TOKEN: ${BLUE}https://bit.ly/token-github ${WHITE}\n"
  echo
  read -p "> " github_token
  echo
  banner
  printf "${WHITE} >> Digite a URL do repositório do Gerenciador de Licenças no GitHub: \n"
  echo
  read -p "> " repo_url
  echo
}

define_porta() {
  banner
  printf "${WHITE} >> Usar a porta padrão (3000) para o Gerenciador de Licenças? (S/N): ${WHITE}\n"
  echo
  read -p "> " use_default_port
  use_default_port=$(echo "${use_default_port}" | tr '[:upper:]' '[:lower:]')
  echo

  if [ "${use_default_port}" = "s" ] || [ -z "${use_default_port}" ]; then
    licencas_port=3000
  else
    while true; do
      printf "${WHITE} >> Qual porta deseja usar? ${WHITE}\n"
      echo
      read -p "> " licencas_port
      echo
      if ! lsof -i:${licencas_port} &>/dev/null; then
        break
      else
        printf "${RED} >> A porta ${licencas_port} já está em uso. Por favor, escolha outra.${WHITE}\n"
        echo
      fi
    done
  fi
  sleep 2
}

confirma_dados_instalacao() {
  banner
  printf " >> Confira abaixo os dados dessa instalação! \n"
  echo
  printf "   ${WHITE}Domínio: --------------->> ${YELLOW}${subdominio_licencas}\n"
  printf "   ${WHITE}Email: ----------------->> ${YELLOW}${email_deploy}\n"
  printf "   ${WHITE}Senha Servidor: -------->> ${YELLOW}${senha_deploy}\n"
  printf "   ${WHITE}Token GitHub: ---------->> ${YELLOW}${github_token}\n"
  printf "   ${WHITE}URL do Repositório: ---->> ${YELLOW}${repo_url}\n"
  printf "   ${WHITE}Porta: ----------------->> ${YELLOW}${licencas_port}\n"
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

################################################################
#                         INSTALAÇÃO                           #
################################################################

atualiza_vps() {
  banner
  printf "${WHITE} >> Atualizando o sistema operacional...\n"
  echo
  {
    sudo DEBIAN_FRONTEND=noninteractive apt update -y
    sudo DEBIAN_FRONTEND=noninteractive apt upgrade -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold"
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y build-essential curl wget
    sleep 2
  } || trata_erro "atualiza_vps"
}

config_timezone() {
  banner
  printf "${WHITE} >> Configurando Timezone...\n"
  echo
  {
    sudo timedatectl set-timezone America/Sao_Paulo
    sleep 2
  } || trata_erro "config_timezone"
}

config_firewall() {
  banner
  printf "${WHITE} >> Configurando o firewall (Portas 22, 80, 443)...\n"
  echo
  {
    sudo ufw allow 22/tcp >/dev/null 2>&1
    sudo ufw allow 80/tcp >/dev/null 2>&1
    sudo ufw allow 443/tcp >/dev/null 2>&1
    sudo ufw --force enable >/dev/null 2>&1
    sleep 2
  } || trata_erro "config_firewall"
}

instala_node() {
  banner
  printf "${WHITE} >> Instalando Node.js...\n"
  echo
  {
    sudo su - root <<'NODEINSTALL'
    rm -f /etc/apt/sources.list.d/nodesource.list 2>/dev/null
    rm -f /etc/apt/sources.list.d/nodesource*.list 2>/dev/null

    printf " >> Instalando Node.js 20.x LTS...\n"
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - 2>&1 | grep -v "does not have a Release file" || {
      printf " >> Tentando Node.js 22.x...\n"
      curl -fsSL https://deb.nodesource.com/setup_22.x | bash - 2>&1 | grep -v "does not have a Release file" || {
        printf " >> Erro ao configurar repositório.\n"
        exit 1
      }
    }

    apt-get update -y 2>&1 | grep -v "does not have a Release file" || true
    apt-get install -y nodejs || exit 1

    if ! command -v node &> /dev/null; then
      printf " >> Erro: Node.js não encontrado.\n"
      exit 1
    fi

    printf " >> Node.js instalado: "
    node --version
    printf " >> npm instalado: "
    npm --version

    # Instalar PM2 globalmente
    npm install -g pm2 || {
      printf " >> Erro ao instalar PM2.\n"
      exit 1
    }

    pm2 --version || exit 1
NODEINSTALL

    sleep 2
  } || trata_erro "instala_node"
}

instala_nginx() {
  banner
  printf "${WHITE} >> Instalando Nginx...\n"
  echo
  {
    sudo apt install -y nginx
    sudo rm -f /etc/nginx/sites-enabled/default

    sleep 2

    # Instalar Certbot via Snap
    sudo apt install -y snapd
    sudo snap install core 2>/dev/null || true
    sudo snap refresh core 2>/dev/null || true
    sudo apt-get remove certbot -y 2>/dev/null || true
    sudo snap install --classic certbot
    sudo ln -sf /snap/bin/certbot /usr/bin/certbot

    sudo systemctl restart nginx
    sleep 2
  } || trata_erro "instala_nginx"
}

instala_git() {
  banner
  printf "${WHITE} >> Instalando Git...\n"
  echo
  {
    sudo apt install -y git
    sleep 2
  } || trata_erro "instala_git"
}

# Função para codificar URL
codifica_url() {
  local length="${#1}"
  for ((i = 0; i < length; i++)); do
    local c="${1:i:1}"
    case $c in
    [a-zA-Z0-9.~_-]) printf "$c" ;;
    *) printf '%%%02X' "'$c" ;;
    esac
  done
}

baixa_codigo() {
  banner
  printf "${WHITE} >> Fazendo download do Gerenciador de Licenças...\n"
  echo
  {
    if [ -z "${repo_url}" ] || [ -z "${github_token}" ]; then
      printf "${RED} >> Erro: URL do repositório ou token do GitHub não definidos.\n${WHITE}"
      exit 1
    fi

    github_token_encoded=$(codifica_url "${github_token}")
    github_url=$(echo ${repo_url} | sed "s|https://|https://${github_token_encoded}@|")

    dest_dir="/opt/licencas-equipechat/"

    # Remover diretório existente se necessário
    if [ -d "${dest_dir}" ]; then
      printf "${YELLOW} >> Diretório existente encontrado. Removendo...${WHITE}\n"
      rm -rf "${dest_dir}"
    fi

    git clone ${github_url} ${dest_dir}

    if [ $? -eq 0 ]; then
      printf "${GREEN} >> Código baixado com sucesso!${WHITE}\n"
    else
      printf "${RED} >> Falha ao baixar o código! Verifique o token e a URL.${WHITE}\n"
      exit 1
    fi

    sleep 2
  } || trata_erro "baixa_codigo"
}

instala_app() {
  banner
  printf "${WHITE} >> Instalando dependências e compilando o Gerenciador de Licenças...\n"
  echo
  {
    cd /opt/licencas-equipechat/

    if [ ! -f "package.json" ]; then
      printf "${RED} >> ERRO: package.json não encontrado!${WHITE}\n"
      exit 1
    fi

    # Instalar dependências
    npm install --force

    # Build da aplicação
    npm run build

    if [ ! -d "dist" ]; then
      printf "${RED} >> ERRO: Build falhou! Diretório dist não encontrado.${WHITE}\n"
      exit 1
    fi

    # Criar arquivo server.js para servir o build
    cat > /opt/licencas-equipechat/server.js << 'SERVEREOF'
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, 'dist');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

const server = http.createServer((req, res) => {
  let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath);

  if (!ext) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // SPA fallback
      fs.readFile(path.join(DIST_DIR, 'index.html'), (err2, data2) => {
        if (err2) {
          res.writeHead(500);
          res.end('Internal Server Error');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data2);
      });
      return;
    }
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Gerenciador de Licenças rodando na porta ${PORT}`);
});
SERVEREOF

    # Iniciar com PM2
    pm2 delete licencas-equipechat 2>/dev/null || true
    PORT=${licencas_port} pm2 start server.js --name licencas-equipechat
    pm2 save
    pm2 startup 2>/dev/null || true

    printf "${GREEN} >> Aplicação instalada e iniciada com sucesso!${WHITE}\n"
    sleep 2
  } || trata_erro "instala_app"
}

config_nginx() {
  banner
  printf "${WHITE} >> Configurando Nginx para o Gerenciador de Licenças...\n"
  echo
  {
    local hostname_licencas=$(echo "${subdominio_licencas}" | sed 's|https://||g' | sed 's|http://||g')

    sudo bash -c "cat > /etc/nginx/sites-available/licencas-equipechat << 'END'
server {
  server_name ${hostname_licencas};

  location / {
    proxy_pass http://127.0.0.1:${licencas_port};
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

    sudo ln -sf /etc/nginx/sites-available/licencas-equipechat /etc/nginx/sites-enabled/

    if sudo nginx -t 2>/dev/null; then
      sudo systemctl reload nginx
      printf "${GREEN} >> Nginx configurado com sucesso!${WHITE}\n"
    else
      printf "${RED} >> ERRO: Configuração do Nginx inválida!${WHITE}\n"
      return 1
    fi

    sleep 2

    banner
    printf "${WHITE} >> Emitindo certificado SSL para ${hostname_licencas}...\n"
    echo
    sudo certbot -m "${email_deploy}" \
      --nginx \
      --agree-tos \
      --expand \
      -n \
      -d "${hostname_licencas}" || {
      printf "${YELLOW} >> Aviso: Falha no SSL. Tente manualmente: certbot --nginx -d ${hostname_licencas}${WHITE}\n"
      sleep 3
    }

    sleep 2
  } || trata_erro "config_nginx"
}

fim_instalacao() {
  banner
  printf "${GREEN}══════════════════════════════════════════════════════════════════${WHITE}\n"
  printf "${GREEN}   ✅ INSTALAÇÃO CONCLUÍDA COM SUCESSO!${WHITE}\n"
  printf "${GREEN}══════════════════════════════════════════════════════════════════${WHITE}\n"
  echo
  printf "   ${WHITE}🔐 Gerenciador de Licenças do Equipechat${WHITE}\n"
  echo
  printf "   ${WHITE}URL: ${BLUE}https://${subdominio_licencas}${WHITE}\n"
  printf "   ${WHITE}Porta: ${BLUE}${licencas_port}${WHITE}\n"
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

atualizar_licencas() {
  banner
  printf "${WHITE} >> Atualizando o Gerenciador de Licenças...\n"
  echo

  carregar_variaveis

  if [ -z "${repo_url}" ] || [ -z "${github_token}" ]; then
    printf "${RED} >> ERRO: Variáveis de instalação não encontradas. Reinstale o sistema.${WHITE}\n"
    sleep 3
    return
  fi

  {
    cd /opt/licencas-equipechat/

    # Parar serviço
    pm2 stop licencas-equipechat 2>/dev/null || true

    # Atualizar código
    git fetch origin
    git reset --hard origin/main 2>/dev/null || git reset --hard origin/master 2>/dev/null

    # Reinstalar e rebuildar
    rm -rf node_modules 2>/dev/null || true
    npm install --force
    npm run build

    # Reiniciar
    pm2 restart licencas-equipechat
    pm2 save

    printf "${GREEN} >> Atualização concluída com sucesso!${WHITE}\n"
    sleep 3
  } || {
    printf "${RED} >> Erro durante a atualização.${WHITE}\n"
    pm2 restart licencas-equipechat 2>/dev/null
    sleep 3
  }
}

################################################################
#                      STATUS DOS SERVIÇOS                     #
################################################################

status_servicos() {
  banner
  printf "${WHITE} >> Status dos Serviços:\n"
  echo

  printf "   ${CYAN}PM2:${WHITE}\n"
  pm2 list 2>/dev/null || printf "   ${RED}PM2 não encontrado${WHITE}\n"
  echo

  printf "   ${CYAN}Nginx:${WHITE} "
  if systemctl is-active --quiet nginx; then
    printf "${GREEN}Ativo${WHITE}\n"
  else
    printf "${RED}Inativo${WHITE}\n"
  fi

  echo
  printf "${WHITE}>> Pressione Enter para voltar ao menu...${WHITE}\n"
  read -p ""
}

carregar_variaveis
menu
