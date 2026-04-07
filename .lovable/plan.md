

# Plano: Corrigir `create-admin.js`

## Problema

O arquivo `create-admin.js` tem um comentário bash (`#!/bin/bash` e `#`) nas primeiras linhas, mas é um arquivo JavaScript. O Node.js não entende `#` como comentário (exceto shebang `#!` na linha 1, e mesmo assim só `#!/usr/bin/env node`).

## Correção

Reescrever as duas primeiras linhas do `monitor-api/create-admin.js`:

```javascript
#!/usr/bin/env node
// EquipeChat Monitor — Script de criação do admin inicial
```

Linha 1: shebang válido para Node.js
Linha 2: comentário JavaScript (`//`) em vez de bash (`#`)

## Arquivo alterado

- `monitor-api/create-admin.js` — linhas 1-2 apenas

