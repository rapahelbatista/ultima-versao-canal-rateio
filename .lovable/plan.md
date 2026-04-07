

# Plano: Health Check + Registro Automático do ZapMeow com Retry

## O que será feito

Substituir o registro "cego" atual (etapa 11/11) por uma verificação robusta que:
1. Testa se o ZapMeow está respondendo (com retry e timeout)
2. Testa se a API do Monitor está respondendo
3. Só registra o ZapMeow no banco se ambos estiverem OK
4. Mostra feedback claro de sucesso/falha para cada serviço

## Mudanças no `instalador_single.sh`

### Substituir bloco da Etapa 11/11 (linhas ~3106-3121)

O novo bloco fará:

```text
1. Health check do ZapMeow (até 60s, polling a cada 3s)
   - GET http://localhost:{porta}/api
   - Se OK → marca zapmeow_ok=true
   - Se falha → aviso amarelo, continua sem registrar

2. Health check da API Monitor (até 30s, polling a cada 3s)
   - GET http://localhost:3200/api/health (ou /)
   - Se OK → marca api_ok=true
   - Se falha → aviso amarelo

3. Se ambos OK:
   - Criar instância: POST /api/equipechat/qrcode
   - Registrar no banco: POST /api/register-zapmeow
   - Verificar resposta do registro (checar HTTP status)
   - Se registro OK → verde "ZapMeow registrado"
   - Se falha → amarelo "Registro falhou, tente manualmente"

4. Resumo de status:
   ✅ ZapMeow: rodando (porta 8900)
   ✅ API Monitor: rodando (porta 3200)
   ✅ Registro: concluído
   -- ou --
   ⚠️ ZapMeow: não acessível
   ⚠️ Registro: pendente (acesse o painel para configurar)
```

### Detalhes técnicos
- O loop de health check usa `curl -sf` com timeout de 5s por tentativa
- A resposta do registro é capturada e validada (HTTP 200 + JSON `success: true`)
- Um arquivo `/home/deploy/monitor/.zapmeow-registered` é criado se o registro for bem-sucedido, para evitar re-registros em atualizações futuras

