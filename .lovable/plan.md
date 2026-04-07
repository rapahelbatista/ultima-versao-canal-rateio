

# Plano: Ajustes para instalação do zero funcionar (API + WhatsApp)

## Problemas identificados

1. **`create-admin.js` linha 3**: ainda tem comentário bash (`# Execute após...`) que causa `SyntaxError` no Node.js — impede criação do admin na instalação
2. **`whatsapp-proxy` sem tratamento de erro de fetch**: se o ZapMeow estiver offline, `await r.json()` falha com exceção não tratada (fetch para `localhost:8900` retorna connection refused)
3. **`register-zapmeow.js` sem autenticação**: endpoint público permite qualquer pessoa registrar/alterar a URL do ZapMeow — risco de segurança
4. **`whatsapp-welcome.js` sem autenticação**: endpoint público permite envio de mensagens sem login
5. **Health check do instalador (etapa 11)**: usa `curl -sf` no `/api` do ZapMeow mas a rota real pode variar — precisa de fallback robusto

## Correções

### 1. Corrigir `create-admin.js` (linha 3)
Trocar `# Execute após a instalação: node create-admin.js` por `// Execute após a instalação: node create-admin.js`

### 2. Proteger `whatsapp-proxy.js` contra ZapMeow offline
Envolver cada `fetch()` em try/catch individual para retornar erro amigável (`{ error: "ZapMeow não acessível" }`) em vez de crash 500

### 3. Adicionar autenticação ao `register-zapmeow.js`
Adicionar `verifyToken, requireAdmin` como middleware — só admin pode registrar/alterar ZapMeow

### 4. Adicionar autenticação ao `whatsapp-welcome.js`
Adicionar `verifyToken` como middleware mínimo — ou manter público mas adicionar validação de rate-limit básica. Como é usado internamente pelo sistema de formulários, manter público mas adicionar validação de campos mais rigorosa.

### 5. Melhorar resiliência do `whatsapp-proxy.js`
Adicionar timeout de 10s nos fetch para ZapMeow para evitar que a API fique travada se o container estiver lento

## Arquivos a alterar

| Arquivo | Mudança |
|---------|---------|
| `monitor-api/create-admin.js` | Linha 3: `#` → `//` |
| `monitor-api/routes/whatsapp-proxy.js` | Try/catch em cada fetch + timeout 10s |
| `monitor-api/routes/register-zapmeow.js` | Adicionar `verifyToken, requireAdmin` |
| `monitor-api/helpers/whatsapp.js` | Timeout no fetch (10s) |

## Resultado
Instalação do zero funciona sem erros: admin é criado corretamente, ZapMeow é registrado, e a API do WhatsApp responde com erros amigáveis mesmo se o container ainda não subiu.

