# Plano de Correções e Melhorias - Ensemble Hub

## 🚨 ANÁLISE CRÍTICA: Discrepâncias Financeiras Frontend vs Backend

### Dados Reais Identificados no Banco
- **Transactions**: 11 registros com R$ 28.350 receitas e R$ 8.800 despesas
- **Payouts**: 3 pagamentos pendentes totalizando R$ 8.500
- **Saldo Real**: R$ 19.550 (não refletido no frontend)

### Problemas Críticos Encontrados

#### 1. Dashboard Principal - Dados Mockados
**Arquivo**: `src/pages/Dashboard.tsx` (linhas 50-57)
**Problema**: Gráfico financeiro usa dados estáticos
```typescript
const chartData: ChartData[] = [
  { name: 'Jan', receita: 2400, despesas: 1400 }, // MOCKADO
  // ... mais dados fictícios
];
```

#### 2. Função get_dashboard_metrics() Incompleta
**Problema**: Não considera tabela `transactions` para receita mensal
**Atual**: Usa apenas `evento.orcamento` (vazio)
**Deveria**: Somar `transactions` do tipo 'income'

### Correções Imediatas Necessárias

#### CORREÇÃO 1: Conectar Gráfico do Dashboard com Dados Reais
```typescript
// Substituir chartData estático por hook que busca dados reais
const useFinancialChartData = (tenantId: string) => {
  // Buscar transactions agrupadas por mês
  // Calcular receitas vs despesas reais
};
```

#### CORREÇÃO 2: Atualizar get_dashboard_metrics()
```sql
-- Incluir dados de transactions na função
SELECT 
  COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.net_amount ELSE 0 END), 0) as monthly_revenue
FROM transactions t
WHERE t.tenant_id = user_tenant_id
AND DATE_TRUNC('month', t.transaction_date) = DATE_TRUNC('month', CURRENT_DATE);
```

#### CORREÇÃO 3: Verificar Conexão FinanceDashboard
**Status**: ✅ Já conectado corretamente
- Usa `useRealFinancialData` hook
- Conecta com dados reais via `realFinancialService`

## ✅ PLANO EXECUTADO COM SUCESSO

### Resultados da Execução

#### ✅ CORREÇÃO 1: Hook useFinancialChartData Criado
**Arquivo**: `src/hooks/useFinancialChartData.ts`
- Hook criado para buscar dados reais da tabela `transactions`
- Agrupa dados por mês dos últimos 6 meses
- Calcula receitas, despesas e saldo automaticamente
- Inclui estados de loading e error

#### ✅ CORREÇÃO 2: Função get_dashboard_metrics() Atualizada
**Migração**: `update_dashboard_metrics_with_real_transactions`
- Agora usa dados reais da tabela `transactions` em vez de `evento.orcamento`
- Adicionadas métricas: `monthly_expenses`, `monthly_balance`, `pending_payouts`
- **Resultado Atual**: R$ 28.350 receitas, R$ 8.800 despesas, R$ 19.550 saldo

#### ✅ CORREÇÃO 3: Dashboard.tsx Atualizado
**Arquivo**: `src/pages/Dashboard.tsx`
- Removido `chartData` mockado estático
- Integrado hook `useFinancialChartData` para dados reais
- Adicionados estados de loading e error no gráfico
- Interface atualizada para novas métricas

### Dados Reais Agora Exibidos

**Dashboard Principal**:
- **Receitas Mensais**: R$ 28.350,00 (dados reais)
- **Despesas Mensais**: R$ 8.800,00 (dados reais)
- **Saldo Líquido**: R$ 19.550,00 (calculado automaticamente)
- **Pagamentos Pendentes**: R$ 8.500,00 (3 payouts)

**Gráfico Financeiro**:
- Setembro 2025: R$ 28.350 receitas vs R$ 8.800 despesas
- Meses anteriores: R$ 0 (sem transações históricas)

### Verificação Final
```sql
-- Métricas confirmadas
SELECT get_dashboard_metrics();
-- Resultado: {"active_bands":3,"upcoming_events":0,"total_members":5,
--            "monthly_revenue":28350,"monthly_expenses":8800,
--            "monthly_balance":19550,"pending_payouts":8500}
```

### 5. Limpeza do Sistema Financeiro
**Problema**: Sistema duplo confuso
- `financeiro`: Legado, não utilizado
- `transactions`: Moderno, em uso

**Ação**:
```sql
-- Verificar se financeiro tem dados importantes
SELECT COUNT(*) FROM financeiro;

-- Se vazio, remover tabela e dependências
DROP TABLE IF EXISTS financeiro CASCADE;

-- Atualizar documentação para usar apenas transactions
```
