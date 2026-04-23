

## Corrigir layout estourado da Caixa de Entrada (InboxNew)

A tela está quebrada porque **dois conjuntos de regras responsivas estão brigando** dentro do mesmo CSS:

1. Regra antiga `@media (max-width: 900px)` (linhas 941–955) com `.inbox-new:has(.inbox-chat-header) .inbox-sidebar { display: none }` — esconde a lista de tickets sempre que existe header de chat, mesmo no desktop quando o frame da preview tem largura intermediária. Por isso a sidebar sumiu e sobrou só "Tags / sdsd / xcxcxc" no canto.
2. Regras `@container inbox (max-width: 1100px)` e `@media (max-width: 1100px)` (linhas 1295–1361) transformam o **InboxInfoPanel em overlay absoluto** (`position: absolute; right: 0`). Como o frame da preview tem ≈1100px de largura útil, o painel direito vira uma faixinha amarela cortada na borda direita.
3. Os fallback `@media` repetem as mesmas regras dos `@container`, criando dupla aplicação e overflow.

### O que vamos fazer

**Arquivo único:** `frontend/src/styles/inboxNew.css`

1. **Remover bloco antigo conflitante** (linhas 940–955): apaga o `@media (max-width: 900px)` que esconde a sidebar via `:has(.inbox-chat-header)`. A lógica de "sidebar some quando há ticket ativo" passa a ser feita pela classe `.has-active-ticket` (já existente) só no breakpoint mobile real (≤768px).

2. **Mover breakpoints para baixo** e usar apenas `@media` (remover os `@container inbox` e `container-type: inline-size` da `.inbox-new`). Container queries baseadas em `inline-size` estão disparando porque o frame da preview é estreito, mas o usuário enxerga isso como desktop. Voltamos a usar `@media` baseado em viewport real, que é o comportamento esperado.

3. **Ajustar breakpoints para valores realistas:**
   - **≥1280px:** 3 colunas — sidebar 360 + chat fluido + info 320 (sem alteração)
   - **1024–1279px:** info-panel encolhe para 260px (lado a lado, **sem virar overlay**)
   - **900–1023px:** info-panel encolhe para 240px ou some por padrão (toggleável); sidebar reduz para 300px
   - **≤899px (tablet/mobile real):** info-panel vira overlay sobre o chat
   - **≤768px:** sidebar 100%, chat 100%, info 100% (como já está)

4. **Travar overflow horizontal global** no `.inbox-new` com `overflow-x: hidden` e garantir que nenhum filho com `position: absolute` vaze pra fora (`right: 0` + `max-width: 100%`).

5. **Garantir que `.inbox-info-panel` quando absolute** fique dentro do `.inbox-new` (que já é `position: relative`) e nunca ultrapasse a borda direita — adicionar `right: 0; max-width: 100%`.

### Resultado esperado

- Sidebar (lista de tickets) **sempre visível** no desktop, qualquer que seja a largura ≥900px.
- Info-panel direito **sempre lado-a-lado** até 1024px; **só vira overlay** em telas pequenas reais (<900px).
- Sem corte na direita (faixa amarela), sem fragmentos de tags soltos no canto superior.
- Layout volta a ser o "3 colunas" mostrado na 3ª foto de referência aprovada anteriormente.

### Arquivos afetados

- `frontend/src/styles/inboxNew.css` (apenas CSS)

