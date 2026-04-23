
## Ajustes no Chat do InboxNew

Corrigir três problemas visíveis na tela atual:
1. **Fundo amarelado** vindo do papel de parede do WhatsApp (`whatsBackground`) que vaza no chat.
2. **Conteúdo cortado** (faixa cinza `#Chamado 2 - Sem Fila`, barra de tags amarela, mensagens iniciais escondidas).
3. **Ícones do rodapé** (lápis vermelho de assinatura, kanban, balão) destoam do layout novo — precisam ficar em estilo Lucide minimalista.

### O que será feito

**1. Eliminar o fundo amarelo (CSS — `frontend/src/styles/inboxNew.css`)**
- Forçar `background-image: none !important` e `background-color: #f8fafc !important` em **todos** os seletores da `MessagesList` (incluindo `#messagesList`, `[id="messagesList"]`, `[class*="messagesList"]`, `[class*="messagesListWrapper"]`).
- Sobrescrever o `style` inline aplicado pelo `makeStyles` usando seletores com maior especificidade (`.inbox-new div[class*="messagesList"]`).
- Usar um fundo neutro claro (`#f8fafc`) no modo light e (`#0b0b0d`) no modo dark — coerente com o resto do painel.

**2. Remover elementos que cortam o chat**
- Esconder a faixa cinza **`#Chamado N - Sem Fila`** (renderizada pelo `MessagesList` como divider de tickets) dentro do `.inbox-new` — já temos essa info no header do chat e no painel lateral.
- Esconder a barra de **Tags** acima do chat (já há regra, mas não está pegando — reforçar com `[class*="ContactTag"]`, `[class*="TagsContainer"]`, `.MuiPaper-root.MuiPaper-elevation1` que envolve o Autocomplete de tags).
- Garantir que `MessagesList` ocupe 100% do espaço entre header e input (`flex: 1; min-height: 0`).

**3. Modernizar ícones do rodapé do input**
- Esconder os ícones legados que não fazem parte do novo layout:
  - Lápis vermelho (assinatura) — `[aria-label*="sign"]`, `[class*="signSwitch"]`
  - Kanban / trigger flow rosa — `[aria-label*="trigger-flow"]`
  - Balão extra de mensagem interativa — `[aria-label*="interactive"]`
- Manter apenas: **emoji**, **anexo (clip "+")**, **microfone** e **enviar** — todos com cor neutra `#64748b` e hover discreto, sem backgrounds coloridos.
- Padronizar tamanho (36×36) e remover sombras dos FABs internos para casarem com a estética minimalista do header.

**4. Dark mode coerente**
- Atualizar `body[data-theme="dark"]` para usar `#0b0b0d` como fundo da `messagesList` (em vez de qualquer cor amarelada herdada) e manter os balões com bom contraste.

### Arquivos afetados
- `frontend/src/styles/inboxNew.css` (todas as alterações são CSS — sem mudança de lógica)

### Resultado esperado
Chat com fundo cinza-claro uniforme (`#f8fafc`), sem faixa amarela, sem barra de tags duplicada, sem divisor "#Chamado X - Sem Fila", e rodapé do input com apenas 4 ícones modernos (emoji, anexo, microfone, enviar) em estilo Lucide.
