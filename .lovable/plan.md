
Objetivo
- Contornar a falha do editor ao restaurar uma versão antiga. Isso não é um erro do seu código; é do fluxo de restore da interface.

Ação mais segura agora
- Como você já está vendo o preview de um commit antigo, não dependa do History neste momento.
- Use o botão Restore do próprio preview dessa versão antiga.

Passo a passo
1. Recarregue a página inteira do editor.
2. Abra novamente a versão antiga pelo histórico.
3. Confirme que é a versão certa:
   - commit: `1c3013e0`
   - mensagem: `White-label branding updated`
   - data: `2026-04-07 01:17`
4. Espere o preview carregar completamente.
5. Clique em Restore na barra do preview dessa versão.

Onde achar no Lovable
- Desktop:
  - History: ícone de relógio no topo, ou menu `+` → `History`
  - Restore: na barra do preview quando a versão antiga estiver aberta
- Mobile:
  - mude para Preview mode
  - abra `History` pelo relógio ou pelo menu `...`
  - abra a versão antiga e use o botão Restore no preview

Se continuar falhando
1. Tente em janela anônima ou outro navegador.
2. Abra o projeto pelo dashboard normal e faça o restore pela aba History de lá, não por link do chat.
3. Se o botão do History falhar de novo, volte ao preview do commit antigo e restaure por ele.
4. Se mesmo assim não funcionar, o bloqueio é da interface do editor. Nesse caso, use os dados da versão acima para tentar novamente depois do refresh, sem procurar a mensagem antiga no chat.

Observação importante
- Restaurar uma versão não apaga definitivamente as versões novas; elas continuam no histórico e podem ser recuperadas depois.
