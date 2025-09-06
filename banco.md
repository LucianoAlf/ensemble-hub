# Documentação Completa do Banco de Dados - Ensemble Hub

## Visão Geral

O banco de dados do Ensemble Hub é baseado no PostgreSQL 17.4.1.069 hospedado no Supabase (Projeto: LA Band Pilot - ID: legnxdmlmagysxirfiwe). O sistema utiliza uma arquitetura multi-tenant com isolamento por `tenant_id` e implementa Row Level Security (RLS) para controle de acesso.

**Região**: sa-east-1 (São Paulo)  
**Status**: ACTIVE_HEALTHY  
**Engine**: PostgreSQL 17

## Estrutura de Schemas

### Schema `public`
Contém as tabelas principais da aplicação:

#### Tabelas de Autenticação e Usuários
- **profiles**: Perfis de usuários com informações básicas
- **tenants**: Organizações/empresas no sistema
- **user_tenants**: Relacionamento usuário-tenant com roles

#### Tabelas de Bandas
- **banda**: Informações das bandas (18 colunas, RLS ativo, 1 registro)
- **banda_membro**: Membros das bandas (7 colunas, RLS ativo, 0 registros)
- **banda_integrante**: Integrantes das bandas (8 colunas, RLS DESABILITADO ⚠️, 1 registro)
- **banda_repertorio**: Repertório das bandas (8 colunas, RLS ativo, 0 registros)
- **banda_setlist**: Setlists das bandas (8 colunas, RLS ativo, 0 registros)
- **banda_rider_tecnico**: Rider técnico das bandas (30+ colunas, RLS ativo, 0 registros)
- **banda_mapa_palco**: Mapa de palco das bandas (16 colunas, RLS ativo, 3 registros)

#### Tabelas de Eventos
- **evento**: Eventos/apresentações (16 colunas, RLS ativo, 0 registros)
- **evento_banda**: Relacionamento N:N entre eventos e bandas (4 colunas, RLS ativo, 0 registros)

#### Tabelas Financeiras
- **financeiro**: Sistema financeiro legado (8 colunas, RLS ativo, 0 registros)
- **transactions**: Transações financeiras modernas (16 colunas, RLS ativo, 0 registros)
- **payouts**: Pagamentos realizados (14 colunas, RLS ativo, 0 registros)

#### Tabelas de Infraestrutura
- **unidade**: Unidades/filiais (5 colunas, RLS ativo, 0 registros)
- **salas**: Salas para eventos (não encontrada na análise atual)

### Schema `auth`
Gerenciado pelo Supabase Auth:
- **users**: Usuários do sistema de autenticação
- **sessions**: Sessões ativas
- **refresh_tokens**: Tokens de renovação
- **audit_log_entries**: Log de auditoria
- **identities**: Identidades de provedores externos
- **instances**: Instâncias de autenticação
- **mfa_***: Tabelas para autenticação multi-fator
- **sso_***: Tabelas para Single Sign-On

### Schema `core`
Contém tabelas específicas do domínio:
- **pessoa**: Pessoas do sistema (alunos, professores, etc.)

## Views Principais

### Views de Bandas
- **vw_bandas_lista**: Lista completa de bandas com contagem de membros
- **vw_bandas_ativas**: Contagem de bandas ativas por tenant/unidade

### Views de Eventos
- **vw_eventos_proximos**: Eventos dos próximos 30 dias
- **vw_eventos_todos**: Todos os eventos dos últimos 90 dias
- **vw_proximos_eventos**: Contagem de eventos futuros por tenant/unidade

### Views de Pessoas
- **vw_alunos_participantes**: Alunos que participam de bandas
- **vw_total_alunos**: Contagem total de alunos por tenant/unidade

## Funções RPC (Remote Procedure Calls)

### Funções de Criação
- **create_banda()**: Cria nova banda e adiciona criador como membro
- **create_evento()**: Cria novo evento (2 versões - com e sem múltiplas bandas)

### Funções de Consulta
- **get_evento_full()**: Retorna evento completo com bandas associadas
- **get_dashboard_metrics()**: Métricas do dashboard com filtro por tenant
- **get_dashboard_metrics_no_tenant()**: Métricas sem filtro de tenant
- **get_alunos_participantes()**: Lista alunos participantes de bandas
- **get_user_tenant_id()**: Retorna tenant_id do usuário atual

### Funções de Atualização
- **update_evento_full()**: Atualiza evento completo com validações de segurança

### Funções de Sistema
- **handle_new_user()**: Trigger para criar tenant ao registrar usuário
- **profiles_set_id()**: Trigger para gerar ID de perfil
- **update_updated_at_column()**: Trigger para atualizar timestamp

## Extensões Instaladas

### Extensões Ativas
- **pg_stat_statements** (1.10): Estatísticas de consultas
- **uuid-ossp** (1.1): Geração de UUIDs
- **pgcrypto** (1.3): Funções criptográficas
- **supabase_vault** (0.2.8): Cofre de segredos do Supabase
- **plpgsql** (1.0): Linguagem procedural
- **pg_graphql** (1.5.9): Suporte GraphQL

### Extensões Disponíveis (não instaladas)
- **vector**: Para embeddings e busca semântica
- **postgis**: Para dados geoespaciais
- **pg_cron**: Para tarefas agendadas
- **pg_net**: Para requisições HTTP

## Relacionamentos e Correlações

### Hierarquia Multi-tenant
```
tenants (1) ←→ (N) user_tenants (N) ←→ (1) profiles
    ↓
    ├── banda (tenant_id)
    ├── evento (tenant_id)
    ├── transactions (tenant_id)
    ├── payouts (tenant_id)
    └── unidades (tenant_id)
```

### Relacionamentos de Bandas
```
banda (1) ←→ (N) banda_membro (N) ←→ (1) profiles
banda (1) ←→ (N) banda_integrante
banda (N) ←→ (N) evento (via evento_banda)
```

### Relacionamentos de Eventos
```
evento (1) ←→ (N) evento_banda (N) ←→ (1) banda
evento (N) ←→ (1) unidades
evento (N) ←→ (1) salas
```

## Problemas de Segurança Identificados

### CRÍTICOS (ERROR)
1. **Tabela banda_integrante**: RLS desabilitado apesar de ter políticas definidas
   - Políticas existem mas RLS não está ativo
   - Exposição de dados entre tenants

### AVISOS (WARN)
1. **Funções com search_path mutável**:
   - `create_evento`
   - `handle_new_user`
   - `profiles_set_id`
   - `get_user_tenant_id`

2. **Configurações de Auth**:
   - OTP com expiração muito longa (>1 hora)
   - Proteção contra senhas vazadas desabilitada

## Migrações Aplicadas

O banco possui várias migrações aplicadas, incluindo:
- Correções de ambiguidade em `create_evento`
- Verificações de permissões de delete
- Correções de RLS para eventos
- Outras migrações sem nome específico

## Métricas de Uso

### Tabelas com Dados
- **auth.users**: 1 usuário
- **profiles**: 1 perfil
- **tenants**: 1 tenant
- **user_tenants**: 1 relacionamento
- Demais tabelas: vazias (ambiente de desenvolvimento)

### Performance
- RLS habilitado na maioria das tabelas
- Índices automáticos do Supabase
- Triggers para auditoria e timestamps

## Recomendações de Melhoria

### Segurança
1. **URGENTE**: Habilitar RLS na tabela `banda_integrante`
2. Configurar search_path fixo nas funções
3. Reduzir expiração do OTP para <1 hora
4. Habilitar proteção contra senhas vazadas

### Performance
1. Considerar instalação da extensão `vector` para busca semântica
2. Implementar `pg_cron` para tarefas de limpeza
3. Monitorar `pg_stat_statements` para otimização de queries

### Estrutura
1. Padronizar nomenclatura (banda_membro vs banda_integrante)
2. Documentar melhor as funções RPC
3. Implementar soft delete onde apropriado
4. Adicionar constraints de validação

## Correlação Completa com a Aplicação

### Funcionalidades Implementadas e Conectadas

#### Dashboard (`/dashboard`)
- **Métricas**: Usa função `get_dashboard_metrics()` para buscar:
  - Bandas ativas → tabela `banda` (campo `ativa = true`)
  - Eventos próximos → tabela `evento` (filtro por data `inicio`)
  - Total de membros → tabela `banda_integrante` (campo `ativo = true`)
  - Receita mensal → campo `orcamento` da tabela `evento`
- **Eventos próximos**: Query direta na tabela `evento` com `gte('inicio', new Date().toISOString())`
- **Gráfico financeiro**: Dados estáticos (⚠️ não conectado ao banco)
- **Modal de eventos**: Integração com `EventEditModal` via `useEventModal`

#### Gestão de Bandas (`/bands`)
- **Listagem**: Usa view `vw_bandas_lista` via `useSupabaseOptimized`
- **Criação**: Função `create_banda()` que cria banda e adiciona criador como membro
- **Visualização**: `CompleteBandDialog` com dados completos da banda
- **Cache**: Sistema de cache com TTL de 60 segundos (chave: "bands:list")
- **Busca**: Filtro local por nome e gênero

#### Gestão de Eventos (`/events`)
- **Listagem**: Query na tabela `evento` com:
  - Filtro de 90 dias: `gte("inicio", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))`
  - Ordenação por data: `order("inicio", { ascending: true })`
- **Criação**: Função `create_evento()` com suporte a múltiplas bandas via array `p_banda_ids`
- **Edição**: Modal `EventEditModal` com função `update_evento_full()`
- **Exclusão**: Delete direto ou via RPC `delete_evento_full` para FK constraints
- **Cache**: Sistema de cache com TTL de 5 minutos (chave: "events:all-v2")
- **Validação**: Validação de UUID e sanitização de dados

#### Sistema Financeiro (`/financeiro`)
- **Dashboard Financeiro**: 
  - `FinanceDashboard` usa `useRealFinancialData` hook
  - Busca dados das tabelas `transactions` e `payouts` via `realFinancialService`
  - Métricas calculadas via `financialCalculationService`
  - Suporte completo a multi-tenant com validação de `tenant_id`
- **Movimentações**: `FinanceMovements` para gerenciar transações
- **Relatórios**: `FinanceReports` para análise de dados financeiros
- **Filtros**: `CompactFilters` para filtrar dados por período/categoria

### Serviços e Arquitetura

#### `useSupabaseOptimized`
- Sistema de cache inteligente para queries Supabase
- Controle de abort signals para cancelar requests
- Retry automático em caso de erro
- Suporte a TTL configurável por query

#### `realFinancialService`
- Abstração completa para dados financeiros reais
- Métodos implementados:
  - `getFinancialSummary()`: Resumo financeiro por tenant
  - `getUpcomingPayments()`: Pagamentos próximos
  - `getRecentEvents()`: Eventos recentes com cálculos financeiros
  - `getAllTransactions()`: Todas as transações do tenant
- Conversão entre formatos de dados via `financialCalculationService`

#### `useRealFinancialData`
- Hook principal para dados financeiros com estados granulares:
  - Loading states separados (summary, payments, events)
  - Error handling específico por tipo de dados
  - Refresh automático e manual
- Integração com `useTenant` para validação de acesso

#### `useTenant`
- Hook para gerenciar tenant do usuário atual
- Validação de `tenant_id` no perfil do usuário
- Estados de loading e error específicos para tenant

### Autenticação e Autorização

#### `AuthProvider`
- Contexto React para gerenciar estado de autenticação
- Integração com Supabase Auth (`supabase.auth`)
- Gerenciamento de sessões e tokens
- Controle de acesso baseado em usuário autenticado

#### Row Level Security (RLS)
- **Implementado**: Maioria das tabelas com RLS ativo
- **Políticas**: Filtro automático por `tenant_id` via `auth.uid()`
- **Problema crítico**: `banda_integrante` com RLS desabilitado
- **Isolamento**: Dados completamente isolados entre organizações

### Hooks Especializados

#### `useEventModal`
- Gerenciamento de estado para modais de eventos
- Suporte a modos: 'view' | 'edit'
- Integração com Dashboard e Events pages

#### `useToast`
- Sistema de notificações da aplicação
- Feedback para operações CRUD
- Tratamento de erros com mensagens amigáveis

### Problemas de Correlação Identificados

#### Tabelas Não Utilizadas na Aplicação
1. **banda_repertorio**: Estrutura completa mas sem interface
2. **banda_setlist**: Estrutura completa mas sem interface  
3. **banda_rider_tecnico**: 30+ campos mas sem interface
4. **financeiro**: Tabela legada, substituída por `transactions`
5. **unidade**: Referenciada em FKs mas não utilizada na UI
6. **salas**: Referenciada em `evento.sala_id` mas tabela não encontrada

#### Inconsistências Estruturais
1. **banda_membro vs banda_integrante**: 
   - Duas tabelas com propósitos similares
   - `banda_membro` conecta com `auth.users`
   - `banda_integrante` tem campos específicos (instrumento, papel)
   - Uso inconsistente na aplicação
2. **Sistema financeiro duplo**: 
   - `financeiro` (legado, 8 campos)
   - `transactions` (moderno, 16 campos)
   - Aplicação usa apenas `transactions`

#### Views Subutilizadas
1. **vw_eventos_proximos**: Criada mas aplicação faz query direta
2. **vw_eventos_todos**: Criada mas aplicação faz query direta
3. **vw_alunos_participantes**: Relacionada ao schema `core.pessoa` não utilizado
4. **vw_total_alunos**: Relacionada ao schema `core.pessoa` não utilizado

#### Funcionalidades Faltantes
1. **Gestão de Repertório**: Tabela `banda_repertorio` sem interface
2. **Gestão de Setlists**: Tabela `banda_setlist` sem interface
3. **Rider Técnico**: Tabela `banda_rider_tecnico` sem interface
4. **Gestão de Unidades**: Tabela `unidade` sem interface
5. **Sistema de Salas**: FK existe mas tabela não encontrada
6. **Relatórios Avançados**: Dados financeiros coletados mas relatórios básicos

## Conclusão

O banco de dados está bem estruturado para um sistema multi-tenant, mas possui problemas críticos de segurança que precisam ser corrigidos imediatamente. A arquitetura suporta bem o domínio de bandas e eventos, com boa separação de responsabilidades entre schemas.