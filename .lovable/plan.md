

# Plano: White-Label Completo — Remover Lovable e Personalizar

## O que será feito

### 1. Remover o badge "Edit with Lovable"
- Usar a ferramenta `set_badge_visibility` para esconder o badge no site publicado.

### 2. Atualizar index.html — Remover todas as referências à Lovable
- Título: "Lovable App" → "EquipeChat — Monitor Anti-Pirataria"
- Meta description e author → EquipeChat / Raphael Batista
- Open Graph: título, descrição e imagem → remover referências ao lovable.dev
- Twitter card: remover @Lovable e imagem do lovable.dev

### 3. Domínio personalizado
- Lovable suporta domínio customizado. Você precisará configurar nas **Settings → Custom Domain** do projeto.
- Exemplo: `monitor.equipechat.com.br` apontando via CNAME para o Lovable.

## Detalhes técnicos

**Arquivos modificados:**
- `index.html` — meta tags e título

**Ferramentas usadas:**
- `set_badge_visibility(hide_badge: true)` — esconde o badge

