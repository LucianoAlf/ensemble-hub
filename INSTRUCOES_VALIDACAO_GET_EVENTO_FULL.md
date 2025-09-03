# Validação: get_evento_full retorna "Evento não encontrado"

## Como executar a validação

1. **Abra o Supabase Dashboard** e vá para o SQL Editor
2. **Copie o conteúdo** do arquivo `validate_get_evento_full.sql`
3. **Substitua o ID do evento** pela UUID que aparece no log do console (ex: `8bd5616c-3326-4533-8fca-28d1f4789eb1`)
4. **Execute as consultas** uma por uma ou todas de uma vez

## O que cada consulta verifica

### 1. `SELECT auth.uid() as user_id;`
- **Objetivo**: Verificar se o usuário está autenticado
- **Resultado esperado**: UUID do usuário logado
- **Se retornar NULL**: Problema de autenticação

### 2. `SELECT tenant_id FROM public.profiles WHERE id = auth.uid();`
- **Objetivo**: Obter o tenant_id do usuário atual
- **Resultado esperado**: UUID do tenant
- **Se retornar NULL**: Usuário não tem perfil ou tenant_id não definido

### 3. `SELECT id, tenant_id FROM public.evento WHERE id = 'UUID_DO_EVENTO';`
- **Objetivo**: Verificar se o evento existe e qual seu tenant_id
- **Resultado esperado**: ID e tenant_id do evento
- **Se retornar vazio**: Evento não existe na base de dados

### 4. `SELECT public.get_evento_full('UUID_DO_EVENTO');`
- **Objetivo**: Testar a função RPC diretamente
- **Resultado esperado**: JSON com dados do evento ou NULL
- **Se retornar NULL**: A função não encontrou o evento (problema de tenant ou RLS)

### 5. Comparação de tenant_id
- **Objetivo**: Verificar se o tenant do usuário coincide com o tenant do evento
- **Resultado esperado**: 'MATCH'
- **Se retornar 'MISMATCH'**: **ESTA É A CAUSA MAIS PROVÁVEL DO PROBLEMA**

### 6. Verificação da função
- **Objetivo**: Confirmar que a função existe e suas permissões
- **Resultado esperado**: Nome da função e tipo de segurança

## Possíveis causas e soluções

### Causa 1: Mismatch de tenant_id
**Sintoma**: Consulta 5 retorna 'MISMATCH'
**Causa**: O evento pertence a um tenant diferente do usuário
**Solução**: Verificar se o usuário deveria ter acesso a este evento ou se há problema na atribuição de tenant

### Causa 2: RLS (Row Level Security) muito restritivo
**Sintoma**: Consulta 3 encontra o evento, mas consulta 4 retorna NULL
**Causa**: A política RLS da função `get_evento_full` está bloqueando o acesso
**Solução**: Revisar as políticas RLS da tabela `evento` e da função

### Causa 3: Evento não existe
**Sintoma**: Consulta 3 retorna vazio
**Causa**: O ID do evento não existe na base de dados
**Solução**: Verificar se o ID está correto ou se o evento foi deletado

### Causa 4: Problema de autenticação
**Sintoma**: Consulta 1 retorna NULL
**Causa**: Usuário não está autenticado corretamente
**Solução**: Fazer logout/login ou verificar token de autenticação

## Próximos passos após a validação

Após executar as consultas, compartilhe os resultados para que possamos:
1. Identificar a causa exata do problema
2. Implementar a correção apropriada
3. Testar a solução no EventEditModal