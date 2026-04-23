

## Corrigir Layout da Caixa de Entrada (InboxNew)

A regra atual `position: fixed; inset: 0; z-index: 50` na `.inbox-new` faz a tela cobrir o **menu lateral do app** e empurra todo o conteúdo, gerando o corte da esquerda, a sumida do header do chat e o painel direito cortado. Vamos restaurar o comportamento de "ocupar apenas a área de conteúdo" (igual à terceira foto de referência).

### O que será feito (CSS-only — `frontend/src/styles/inboxNew.css`)

**1. Remover o overlay fixo**
- Tirar `position: fixed; inset: 0; z-index: 50` da `.inbox-new`.
- Trocar por `position: relative; height: 100dvh; width: 100%; flex: 1 1 auto; min-height: 0` para que o componente respeite o slot do layout principal (à direita do menu lateral).

**2. Parar de esconder/forçar o shell do app**
- Remover as regras que escondem `header.MuiAppBar-root` e `[class*="appBar"]` — elas estavam quebrando a régua superior e desalinhando o conteúdo.
- Remover as regras agressivas em `body:has(.inbox-new) main / [class*="content"] / [class*="MainContainer"]` que zeram padding/margin globais.
- Manter apenas: `html, body, #root { overflow: hidden; height: 100dvh }` quando a inbox estiver ativa, para evitar **scroll duplo** sem mexer no shell.

**3. Garantir que o painel ocupe 100% do slot**
- `.inbox-new { display: flex; height: 100%; min-height: 0 }` dentro do container pai (que já é `flex: 1`).
- Confirmar que `html:has(.inbox-new), body:has(.inbox-new) #root` ficam com `height: 100dvh` para o `100%` da `.inbox-new` ter referência.

**4. Painel de informações à direita**
- Manter `.inbox-info-panel` com `width: 320px; flex-shrink: 0` para não ser cortado em viewports estreitos (1257px do usuário comporta tranquilamente: 360 sidebar + chat fluido + 320 info).
- Em `< 1280px`: reduzir `inbox-info-panel` para 280px.
- Em `< 1100px`: esconder o `inbox-info-panel` por padrão (acessível via botão de info no actionbar).

**5. Header do chat visível**
- A actionbar flutuante (`.inbox-chat-actionbar` com `position: absolute; top: 14px; right: 18px`) estava sobrepondo o header do Ticket (que tem `min-height: 64px`). Aumentar o `padding-top` do header interno e empurrar a actionbar para `top: 16px; right: 20px` mantendo z-index 5.
- Remover o `.inbox-chat-header` customizado vazio se não houver ticket selecionado (manter só o empty state).

### Resultado esperado (igual à 3ª foto de referência)
```
[ Menu app ][ Lista tickets 360px ][ Chat fluido ][ Info 320px ]
   ↑ visível        ↑ não cortado      ↑ centralizado   ↑ não cortado
```
- Sem scroll vertical na página
- Sem corte na esquerda (menu do app aparece)
- Sem corte na direita (painel Info inteiro)
- Header do chat (avatar + nome + Aceitar) visível no topo
- Input de mensagem fixo no rodapé

### Arquivos afetados
- `frontend/src/styles/inboxNew.css` (apenas CSS — sem mudança de lógica/JS)

