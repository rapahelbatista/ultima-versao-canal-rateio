

# Plano: Instalador faz login JWT antes de registrar ZapMeow

## Problema
O endpoint `POST /api/register-zapmeow` agora exige `verifyToken` + `requireAdmin`. O instalador faz a chamada sem autenticação — resulta em HTTP 401.

## Solução
No `instalador_single.sh`, antes do `curl` de registro, fazer login na API local com as credenciais do admin recém-criado para obter um token JWT, e usá-lo no header `Authorization: Bearer <token>`.

## Alteração (1 arquivo)

### `instalador_single.sh` — linhas ~3161-3164

Substituir o bloco de registro por:

```bash
# Fazer login para obter token JWT
login_response=$(curl -s -X POST "http://localhost:3200/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@equipechat.com\",\"password\":\"${ADMIN_PASS}\"}" 2>/dev/null)

jwt_token=$(echo "$login_response" | grep -o '"token":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$jwt_token" ]; then
  printf "${YELLOW}   ⚠️  Registro: não foi possível autenticar — registre manualmente${WHITE}\n"
else
  # Registrar no banco via API com token JWT
  reg_response=$(curl -s -w "\n%{http_code}" -X POST "http://localhost:3200/api/register-zapmeow" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${jwt_token}" \
    -d "{\"zapmeow_url\":\"http://localhost:${zapmeow_port}/api\",\"instance_id\":\"equipechat\"}" 2>/dev/null)
  # ... resto do tratamento de resposta igual
fi
```

A variável `$ADMIN_PASS` já existe no instalador (é a senha gerada ou `densomicro0060` usada no `create-admin.js`). Se não existir como variável, será necessário defini-la no ponto do script onde o admin é criado.

## Resultado
O registro automático do ZapMeow passa a funcionar com autenticação, sem expor endpoints administrativos publicamente.

