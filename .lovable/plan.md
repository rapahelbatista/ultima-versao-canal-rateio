

## Ajustes finais do layout InboxNew

Quatro problemas visuais a corrigir, todos no `frontend/src/styles/inboxNew.css` + um pequeno ajuste no popover do Follow UP:

### 1. Botão Follow UP "atrás" do actionbar (img 3)

O botão Follow UP fica visível atrás da actionbar branca pois é renderizado dentro de `TicketActionButtonsCustom` (que está oculto por CSS), mas o `<FloupSelector />` em si não tem o mesmo seletor `actionButtons`.

**Fix:** ampliar a regra de ocultação para incluir o wrapper do FloupSelector (Button com classe `MuiButton-root` dentro de `[class*="actionButtons"]`) e garantir `z-index` superior na `.inbox-chat-actionbar`. Aumentar `padding-right` do `[class*="ticketHeader"]` de 132px para 180px para abrir espaço ao actionbar e sumir o botão fantasma atrás.

### 2. Barra de Tags duplicada renderizando (img 2)

O `<TagsContainer />` renderiza dentro de `<Paper>` sem classe identificável, então `[class*="TagsContainer"]` não pega. O `:has(> .MuiAutocomplete-root)` é frágil.

**Fix:** seletor mais robusto:
```css
.inbox-new .MuiPaper-root:has(.MuiAutocomplete-root[role]),
.inbox-new main.inbox-chat .MuiPaper-root:has(input[placeholder="Tags"]),
.inbox-new main.inbox-chat > div > .MuiPaper-elevation1:not([class*="MessageInput"]):not([class*="ticketHeader"]) {
  display: none !important;
}
```
Adicionalmente esconder via JS-friendly: `.inbox-new [class*="ticketRoot"] > .MuiPaper-root:nth-of-type(1)` quando contém Autocomplete.

### 3. Ícones e textos muito grandes no MessageInput (img 5)

Os ícones `<Mood/>`, `<AccountTree/>`, `<Create/>` etc renderizam direto dentro de `IconButton` no `classes.newMessageBox` mas em tamanho default (24px+padding). O input tem fonte herdada grande.

**Fix:** adicionar regras escopadas:
```css
.inbox-new [class*="newMessageBox"] .MuiIconButton-root {
  padding: 6px !important;
  width: 36px !important;
  height: 36px !important;
}
.inbox-new [class*="newMessageBox"] .MuiIconButton-root .MuiSvgIcon-root,
.inbox-new [class*="newMessageBox"] svg {
  width: 20px !important;
  height: 20px !important;
  font-size: 20px !important;
}
.inbox-new [class*="messageInputWrapper"] textarea,
.inbox-new [class*="messageInputWrapper"] .MuiInputBase-input {
  font-size: 13.5px !important;
  line-height: 1.4 !important;
  padding: 8px 14px !important;
}
.inbox-new [class*="newMessageBox"] [class*="invertedFabMenu"] svg {
  width: 18px !important;
  height: 18px !important;
}
```

### 4. Popover Follow UP com label sobreposto + texto exagerado (img 1)

No `FloupSelector/index.js` linha 411-434, o `InputLabel shrink` fica posicionado sobre o `MenuItem em <em>Escolher template...</em>`, criando texto duplicado em itálico grande.

**Fix no JSX** (`frontend/src/components/FloupSelector/index.js`):
- Trocar `<InputLabel shrink>Selecionar Follow UP</InputLabel>` por uma label simples acima do Select (`<Typography variant="caption">`), removendo o overlap
- Trocar `<em>Escolher template...</em>` por texto normal cinza (`<span style={{ color: '#94a3b8' }}>Escolher template…</span>`)
- Reduzir `Schedule` de fontSize 18 para 16 e padronizar cor para `#475569` (cinza neutro, sem azul forte)

### Arquivos afetados

- `frontend/src/styles/inboxNew.css` (ajustes 1, 2, 3)
- `frontend/src/components/FloupSelector/index.js` (ajuste 4 — popover)

### Resultado esperado

- Sem botão fantasma atrás do actionbar
- Sem barra branca de Tags acima do chat
- Ícones e fonte do input proporcionais (20px ícones / 13.5px texto)
- Popover Follow UP limpo, sem label sobreposto e com cor neutra

