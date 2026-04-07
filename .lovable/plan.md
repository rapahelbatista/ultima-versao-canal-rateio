

# Plano: Duas Opções de Instalação — Local (Embutido) + Git Clone

## O que será feito

Adicionar um **sub-menu** na função `instalar_painel_monitor()` que permite escolher entre dois modos de instalação:

```text
[1] Instalação LOCAL (embutido no script — sem Git)
[2] Instalação via GIT (clone de repositório GitHub)
```

## Mudanças no código

### Arquivo: `instalador_single.sh`

**1. Sub-menu de escolha** — Logo após a confirmação inicial ("Deseja continuar? S/N"), adicionar um menu perguntando o modo:
- Opção 1: Local (comportamento atual — extrai `MONITOR_ARCHIVE_B64`)
- Opção 2: Git — pede URL do repositório, token opcional, faz `git clone`, e roda `npm run build` do frontend

**2. Modo Git — fluxo adicional:**
- Solicita URL do repositório GitHub
- Pergunta se é repositório privado → pede token de acesso
- Faz `git clone` para `/home/deploy/monitor`
- Instala dependências do frontend (`npm install`) e faz build (`npm run build`)
- O `VITE_API_URL` é configurado via `.env` antes do build
- O restante (DB, API, Nginx, SSL, Admin, CLI) segue **idêntico** ao modo local

**3. Refatoração interna:**
- Extrair as etapas 1-2 e 4-9 (que são comuns) para que ambos os modos compartilhem o mesmo código
- Apenas a **Etapa 3** difere:
  - Local: `echo "$MONITOR_ARCHIVE_B64" | base64 -d | tar xz -C /home/deploy`
  - Git: `git clone → npm install → npm run build`

**4. Atualizar a descrição no banner** para mostrar ambas as opções disponíveis.

**5. CLI `monitor-cli update`** — No modo Git, o comando `update` fará `git pull + npm install + npm run build + pm2 restart`. No modo local, mantém a mensagem atual de re-executar o instalador. Um arquivo `/home/deploy/monitor/.install-mode` guardará qual modo foi usado.

## Detalhes técnicos

- O modo Git requer `git` instalado (será adicionado ao `apt-get install`)
- O build do frontend no modo Git precisa de mais RAM (~1GB) — será adicionado um aviso
- Um arquivo `.install-mode` (`local` ou `git`) será salvo em `/home/deploy/monitor/` para o CLI saber como atualizar

