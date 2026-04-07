
Objetivo

Corrigir o erro de login `auth_failed` no Painel Monitor.

Diagnóstico confirmado

- O `monitor-api` tenta conectar no PostgreSQL via `process.env.DB_*` em `monitor-api/db.js`, com fallback para:
  - `DB_NAME=monitor_db`
  - `DB_USER=monitor_user`
  - `DB_PASS=monitor_pass`
- O instalador, porém, gera uma senha aleatória (`monitor_db_pass=$(openssl rand -hex 16)`) e grava essa senha em `/home/deploy/monitor/monitor-api/.env`.
- O problema central é que o `monitor-api` não está carregando esse `.env`:
  - `monitor-api/server.js` não faz `dotenv.config()`
  - `monitor-api/package.json` não inclui `dotenv`
- Resultado: a API sobe na porta 3200, mas quando o login consulta o banco ela usa a senha errada e o PostgreSQL retorna `auth_failed`.
- O log `Monitor API running on port 3200` só prova que o Express iniciou; ele não prova que o banco está acessível.
- O `/api/health` atual também é superficial: responde `ok` sem testar banco.
- `create-admin.js` usa o mesmo `db.js`, então a criação do admin na instalação também pode falhar pelo mesmo motivo.

Plano de correção

1. Fazer o `monitor-api` ler o `.env` corretamente
- Adicionar `dotenv` em `monitor-api/package.json`
- Carregar o `.env` dentro de `monitor-api/db.js` usando caminho absoluto baseado em `__dirname`
- Assim a configuração vale tanto para `server.js` quanto para `create-admin.js`

2. Melhorar o health check da API
- Alterar `monitor-api/server.js` para que `/api/health` teste o banco com `SELECT 1`
- Se o banco falhar, retornar erro 500
- Isso evita falso positivo de “API ok” quando só o processo Node subiu

3. Fortalecer o instalador
- Em `instalador_single.sh`, fazer a etapa de criação do admin falhar explicitamente se `node create-admin.js` retornar erro
- Validar a API usando o novo health check com banco antes de concluir a instalação
- Deixar claro no fluxo que existem duas senhas diferentes:
  - senha do admin do painel
  - senha do banco `monitor_user`

4. Compatibilizar a VPS que já foi instalada
- Hoje você alterou manualmente o PostgreSQL para `monitor_pass`
- Depois da correção, a API passará a ler o `DB_PASS` real salvo em `/home/deploy/monitor/monitor-api/.env`
- Então será necessário alinhar os dois lados:
  - ou o PostgreSQL volta para a senha que está no `.env`
  - ou o `.env` é ajustado para `monitor_pass`
- Sem esse alinhamento, o erro continuará mesmo com o código corrigido

Arquivos a ajustar

- `monitor-api/package.json`
- `monitor-api/db.js`
- `monitor-api/server.js`
- `instalador_single.sh`

Resultado esperado

- A API usará a senha realmente gerada pelo instalador
- O admin será criado corretamente na instalação
- O health check detectará falha real de banco
- O login deixará de falhar por autenticação do PostgreSQL; se restar algum erro, ele passará a ser de credencial do usuário do painel, não de conexão com o banco

Detalhes técnicos

- Melhor lugar para carregar `.env`: `monitor-api/db.js`, porque centraliza o acesso para servidor e scripts
- Melhor health check: `SELECT 1 AS ok`
- Melhor comportamento do instalador: abortar ao primeiro erro de banco/admin, em vez de continuar como se a instalação estivesse saudável
