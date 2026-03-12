
Problema real (reformulado):
- O erro atual não é mais “não encontrou makeWASocket”; agora é `Cannot read properties of undefined (reading 'on')` em `wbot.js`, ou seja: o retorno usado como socket não tem `ev`.
- Isso acontece porque a resolução atual do `makeWASocket` em `backend/src/libs/wbot.ts` está genérica demais (varre objetos e pega “qualquer função”), então pode selecionar função errada do módulo.
- Além disso, `initWASocket` usa `new Promise + async IIFE` sem `await`/`.catch` no IIFE interno; quando falha, vira `unhandledRejection` e o processo reinicia em loop no PM2.

Do I know what the issue is?
- Sim: seleção incorreta da factory + tratamento assíncrono frágil dentro de `initWASocket`.

Arquivos a isolar/corrigir:
1) `backend/src/libs/wbot.ts` (principal)
2) `backend/src/compat/baileys.ts` (garantir export de factory sem ambiguidade)

Plano de implementação (objetivo: parar o loop e estabilizar sessão):
1) Trocar o resolver por resolução determinística
- Remover a estratégia de “deep search em qualquer função”.
- Resolver apenas por caminhos explícitos e seguros:
  - `candidate.makeWASocket`
  - `candidate.makeWaSocket`
  - `candidate.default.makeWASocket`
  - `candidate.default.makeWaSocket`
  - `candidate.default` (se função)
  - `candidate` (se função)
- Priorizar fontes nesta ordem: runtime helper (`getMakeWASocket`), compat shim, módulo direto.

2) Validar o retorno da factory antes de registrar listeners
- Depois de criar `wsocket`, validar estrutura mínima:
  - `wsocket` objeto
  - `wsocket.ev` existente
  - `typeof wsocket.ev.on === "function"`
- Se inválido, lançar erro explícito com diagnóstico de shape (keys e tipos), sem seguir para `wsocket.ev.on(...)`.

3) Blindar `initWASocket` contra unhandled rejection
- Refatorar o bloco para capturar erros do fluxo assíncrono interno corretamente (sem IIFE solto).
- Garantir que qualquer falha vá para `reject(...)` do Promise principal.
- Evitar que erro de criação de socket derrube o processo global.

4) Ajuste no compat shim (se necessário)
- Em `backend/src/compat/baileys.ts`, garantir que `makeWASocket` exportado nunca seja objeto “ambíguo”; ou é função válida ou `undefined`.
- Não retornar objeto inteiro como fallback para `makeWASocket`.

5) Telemetria curta para fechar diagnóstico
- Logar uma vez qual “fonte” foi usada para resolver a factory.
- Logar shape do retorno (somente em erro) para confirmar que o socket tem `ev.on`.

Validação pós-fix (obrigatória):
1) `npm run build`
2) `pm2 restart emnpresa-backend`
3) `pm2 logs emnpresa-backend --lines 120`
4) Verificar ausência de:
- `makeWASocket inválido`
- `Cannot read properties of undefined (reading 'on')`
- `unhandledRejection` relacionado a `wbot.js`
5) Teste ponta a ponta:
- subir sessão WhatsApp
- gerar QR/pairing
- enviar mensagem de teste

Resultado esperado:
- Backend para de reiniciar em loop.
- Sessões iniciam sem quebrar em `wsocket.ev.on`.
- Fluxo de conexão volta a funcionar de forma consistente.
