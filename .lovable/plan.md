
Objetivo: restaurar o layout “como era no EquipeChat” no modo de campanhas, eliminando a renderização crua mostrada na imagem.

1. Causa raiz identificada
- O app está entrando no modo `CAMPAIGN_ONLY_MODE`, porque `frontend/src/config/featureFlags.js` define essa flag como `true` por padrão.
- Quando essa flag está ativa, `frontend/src/routes/index.js` troca o layout padrão (`LoggedInLayout`) por `CampaignLayout`.
- O problema é que `frontend/src/layout/CampaignLayout.js` e `frontend/src/pages/CampaignsHome/index.js` foram escritos com classes utilitárias do Tailwind (`flex`, `bg-white`, `rounded-xl`, `text-slate-700`, etc.).
- O projeto não possui configuração ativa do Tailwind no frontend: não há import global de Tailwind nem arquivos de configuração em uso. Resultado: essas classes não geram CSS e a tela aparece como HTML cru, exatamente como na imagem.

2. O que corrigir
- Remover a dependência visual de Tailwind no fluxo de campanhas.
- Reescrever o `CampaignLayout` para Material-UI v4, seguindo o padrão já usado no restante do sistema.
- Reescrever a `CampaignsHome` para Material-UI v4, preservando:
  - sidebar
  - topbar
  - dashboard inicial
  - cards de métricas
  - ações rápidas
  - estados vazios e loading

3. Estratégia de implementação
- Arquivo `frontend/src/layout/CampaignLayout.js`
  - substituir toda a estrutura baseada em `className` utilitária por `makeStyles` + componentes MUI (`Box`/`Paper` se já houver compatibilidade, ou `div` estilizada via `makeStyles`, `IconButton`, `Button`, `Typography`, `Avatar`, `Badge`);
  - manter a mesma navegação, grupos de menu, colapso lateral, logout e cabeçalho;
  - preservar o comportamento atual de rotas e permissões.
- Arquivo `frontend/src/pages/CampaignsHome/index.js`
  - migrar o dashboard para MUI com cards, grid responsivo, botões e placeholders;
  - manter a lógica atual de busca de estatísticas, auto-refresh e navegação rápida;
  - corrigir estados visuais para quando não houver dados.
- Revisar os componentes do modo campanhas que ainda usem utilitários Tailwind para evitar o mesmo problema em outras telas relacionadas.

4. Resultado esperado
- O sistema volta a ter layout visual consistente no modo campanhas.
- A tela `/api-keys` e as demais páginas deixam de aparecer “sem CSS”.
- O modo campanhas passa a seguir o mesmo padrão visual/tecnológico do resto do EquipeChat, sem depender de Tailwind.

5. Detalhes técnicos
- Não vou ativar Tailwind no projeto como solução principal, porque isso adicionaria outra camada de styling em um frontend já padronizado em Material-UI v4.
- A correção mais estável é migrar os arquivos do modo campanhas para MUI.
- A flag `CAMPAIGN_ONLY_MODE` poderá continuar ativa; o problema não é a flag em si, e sim o layout alternativo estar implementado com classes sem CSS correspondente.

6. Ordem recomendada
1) Migrar `CampaignLayout.js` para MUI
2) Migrar `CampaignsHome/index.js` para MUI
3) Revisar páginas do fluxo campanhas que ainda usem classes Tailwind
4) Validar visualmente as rotas principais do modo campanhas (`/`, `/campaigns`, `/campaigns-kanban`, `/api-keys`, `/webhooks`, `/reports`)

7. Impacto
- Sem mudança de backend
- Sem alteração de lógica de autenticação
- Mudança apenas de frontend/estilização estrutural do modo campanhas
