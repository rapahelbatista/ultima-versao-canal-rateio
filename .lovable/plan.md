

# Plano: Instalação Local sem Git (Tudo Embutido no Script)

## O que será feito

Modificar a função `instalar_painel_monitor()` no `instalador_single.sh` para **embutir todos os arquivos do projeto diretamente no script** usando heredocs. Assim, não precisa de Git, GitHub, nem de internet para baixar o código — tudo já vem dentro do instalador.

## Como funciona

Em vez de pedir URL do repositório e fazer `git clone`, o instalador vai:

1. **Extrair os arquivos embutidos** — O script contém o código do backend (`monitor-api/`) e o frontend já buildado (`dist/`) codificados em base64 dentro de um arquivo `.tar.gz` embutido
2. O resto do fluxo continua igual: instalar dependências, configurar PostgreSQL, Nginx, SSL, criar admin, etc.

## Mudanças no fluxo

### Removido
- Pergunta sobre URL do repositório GitHub
- Pergunta sobre repositório privado/token
- Comando `git clone`
- Necessidade de Node.js para build do frontend (já vem pronto)

### Mantido
- Subdomínios, email SSL, credenciais admin
- Verificação de DNS
- Instalação de PostgreSQL, Nginx, Certbot, Node.js, PM2
- Configuração do banco, API, SSL
- Integração ZapMeow
- CLI `monitor-cli`

## Abordagem técnica

### Opção escolhida: Arquivo tar.gz embutido em base64

O script terá no final um bloco com o conteúdo do projeto compactado:

```text
# No instalador_single.sh:
MONITOR_ARCHIVE="H4sIAAAAAAAAA+3d..."  # base64 do tar.gz

# Na função:
echo "$MONITOR_ARCHIVE" | base64 -d | tar xz -C /home/deploy/monitor
```

### O que vai dentro do tar.gz
```text
monitor/
├── monitor-api/           ← código fonte do backend (server.js, routes/, etc.)
│   ├── server.js
│   ├── db.js
│   ├── schema.sql
│   ├── create-admin.js
│   ├── package.json
│   ├── routes/
│   ├── middleware/
│   └── helpers/
└── dist/                  ← frontend já buildado (HTML/CSS/JS estático)
    ├── index.html
    └── assets/
```

### Processo de geração
1. Fazer `npm run build` do frontend para gerar `dist/`
2. Empacotar `dist/` + `monitor-api/` em `tar.gz`
3. Converter para base64 e embutir no script

### Etapa 3 do instalador (substituição do git clone)
```bash
# ANTES: git clone "$monitor_repo_url" /home/deploy/monitor
# DEPOIS:
mkdir -p /home/deploy/monitor
echo "$MONITOR_ARCHIVE" | base64 -d | tar xz -C /home/deploy/monitor
```

## Vantagem
- Zero dependência de Git/GitHub
- Funciona offline (exceto para instalar pacotes do sistema)
- Um único arquivo `.sh` contém tudo

## Detalhe importante
- O `VITE_API_URL` será injetado no `index.html` via `sed` após extração, substituindo um placeholder
- O `npm install` ainda é necessário na pasta `monitor-api/` para instalar dependências do backend (express, pg, bcrypt, etc.)

## Sequência de implementação
1. Gerar o build do frontend com placeholder para API URL
2. Criar o tar.gz com `dist/` + `monitor-api/`
3. Embutir no script como variável base64
4. Atualizar a função `instalar_painel_monitor()` removendo git clone e usando extração local
5. Ajustar o `monitor-cli update` para funcionar sem git (download de nova versão do script)

