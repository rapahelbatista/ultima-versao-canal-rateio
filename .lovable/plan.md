

# Plano: Remover armazenamento de senhas em texto plano

## Objetivo
Eliminar `deploy_password` e `master_password` de todo o fluxo — coleta, armazenamento, exibição — para conformidade com LGPD. Essas credenciais não são necessárias para controle antipirataria.

## Alterações

### 1. Migração do banco de dados (Supabase)
- Remover as colunas `deploy_password` e `master_password` da tabela `installations`

### 2. Edge Function `register-installation/index.ts`
- Remover extração de `deploy_password` e `master_password` do body
- Remover do `safeData`, do `insert` e do `update`

### 3. Edge Function `check-block-status/index.ts`
- Verificar se referencia essas colunas (provavelmente não) — nenhuma alteração esperada

### 4. Frontend `src/pages/MonitorDashboard.tsx`
- Remover `deploy_password` e `master_password` da interface `Installation`
- Remover as linhas de exibição `["Senha Deploy", ...]` e `["Senha Master", ...]`

### 5. Backend Express (referência legada)
- `backend/src/helpers/registerInstallation.ts` — remover `deploy_password` e `master_password` do payload
- `backend/src/controllers/InstallationLogController.ts` — remover os campos
- `backend/src/models/InstallationLog.ts` — remover as colunas do modelo

### 6. Monitor API local (`monitor-api/routes/register-installation.js`)
- Remover os campos do destructuring, do `safe`, e das queries SQL

### 7. Instalador (`instalador_single.sh`)
- Remover `deploy_password` e `master_password` do payload JSON enviado ao monitor
- Remover coleta dessas senhas para envio (manter a coleta local que o sistema precisa para funcionar)

## Resultado
Senhas administrativas nunca mais são transmitidas nem armazenadas no monitor. O controle antipirataria continua funcionando normalmente via IP/URL/hostname.

