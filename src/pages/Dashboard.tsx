import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSEO } from "@/hooks/useSEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, DollarSign, Music2, Users, TrendingUp, AlertTriangle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { CreateEventDialog } from "@/components/events/CreateEventDialog";
import { EventEditModal } from "@/components/events/EventEditModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthProvider";
import { useEventModal } from "@/hooks/useEventModal";
import { useFinancialChartData } from "@/hooks/useFinancialChartData";

import type { EventItem } from "@/pages/Events";

interface DashboardMetrics {
  active_bands: number;
  upcoming_events: number;
  total_members: number;
  monthly_revenue: number;
  monthly_expenses?: number;
  monthly_balance?: number;
  pending_payouts?: number;
}

interface UpcomingEvent {
  id: string;
  titulo: string;
  inicio: string;
  tipo: string;
  local?: string;
  banda_nome?: string;
}

interface ChartData {
  name: string;
  receita: number;
  despesas: number;
}

// Função de formatação de data memoizada fora do componente
const formatEventDate = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Dados do gráfico agora vêm do hook useFinancialChartData (dados reais)

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { eventId: selectedEventId, isOpen: isModalOpen, open: openModal, close: closeModal } = useEventModal();
  
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics>({
    active_bands: 0,
    upcoming_events: 0,
    total_members: 0,
    monthly_revenue: 0,
  });
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasTenantId, setHasTenantId] = useState<boolean | null>(null);
  
  // Controle para evitar múltiplas chamadas simultâneas
  const isLoadingRef = useRef(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadCountRef = useRef(0);

  // Hook para dados reais do gráfico financeiro
  const { chartData, loading: chartLoading, error: chartError } = useFinancialChartData(
    user?.user_metadata?.tenant_id || 'd93bd1e5-245e-4a40-9027-4bd669ccc390'
  );

  useSEO({
    title: "Dashboard — LA Music Hub",
    description: "Visão geral de bandas, eventos e finanças.",
    canonical: window.location.origin + "/dashboard",
  });

  const checkUserTenantId = useCallback(async () => {
    try {
      if (!user?.id) {
        setHasTenantId(false);
        return false;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error checking tenant_id:', profileError);
        setHasTenantId(false);
        return false;
      }

      const hasValidTenantId = profile?.tenant_id != null;
      setHasTenantId(hasValidTenantId);
      return hasValidTenantId;
    } catch (error) {
      console.error('Error in checkUserTenantId:', error);
      setHasTenantId(false);
      return false;
    }
  }, [user?.id]);

  const loadDashboardData = useCallback(async () => {
    // Incrementar contador de chamadas para logs
    loadCountRef.current += 1;
    const currentLoadId = loadCountRef.current;
    console.log(`Dashboard: loadDashboardData chamada #${currentLoadId} iniciada`);
    
    // Verificar se já há uma chamada em andamento
    if (isLoadingRef.current) {
      console.log(`Dashboard: loadDashboardData #${currentLoadId} cancelada - já há uma chamada em andamento`);
      return;
    }
    
    // Marcar como carregando
    isLoadingRef.current = true;
    try {
      setIsLoading(true);
      setError(null);
      
      // Verificar se o usuário tem tenant_id válido antes de fazer qualquer consulta
      const hasValidTenant = await checkUserTenantId();
      
      if (!hasValidTenant) {
        throw new Error('Usuário não possui tenant_id configurado. Entre em contato com o administrador.');
      }
      
      // Usar apenas get_dashboard_metrics() que já tem permissões corretas
      const { data: metrics, error: metricsError } = await supabase
        .rpc('get_dashboard_metrics');
      
      if (metricsError) {
        console.error('Metrics error:', metricsError);
        throw new Error(`Erro ao carregar métricas: ${metricsError.message}`);
      }
      
      // Verificar se a função retornou erro de tenant_id
      if (metrics && typeof metrics === 'object' && 'error' in metrics) {
        throw new Error('Usuário não possui tenant_id configurado. Entre em contato com o administrador.');
      }
      
      // Validar e definir métricas usando APENAS os dados de get_dashboard_metrics()
      if (metrics && typeof metrics === 'object' && !Array.isArray(metrics)) {
        const metricsObj = metrics as Record<string, unknown>;
        
        const validatedMetrics: DashboardMetrics = {
          active_bands: typeof metricsObj.active_bands === 'number' ? metricsObj.active_bands : Number(metricsObj.active_bands) || 0,
          upcoming_events: typeof metricsObj.upcoming_events === 'number' ? metricsObj.upcoming_events : Number(metricsObj.upcoming_events) || 0,
          total_members: typeof metricsObj.total_members === 'number' ? metricsObj.total_members : Number(metricsObj.total_members) || 0,
          monthly_revenue: typeof metricsObj.monthly_revenue === 'number' ? metricsObj.monthly_revenue : Number(metricsObj.monthly_revenue) || 0
        };
        
        setDashboardMetrics(validatedMetrics);
      } else {
        throw new Error('Formato de dados inválido retornado pela função get_dashboard_metrics');
      }

      // Carregar eventos próximos dos próximos 6 meses
      const sixMonthsFromNow = new Date();
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
      
      const eventsResult = await supabase
        .from('evento')
        .select('id, titulo, inicio, tipo, local')
        .gte('inicio', new Date().toISOString())
        .lte('inicio', sixMonthsFromNow.toISOString())
        .order('inicio', { ascending: true })
        .limit(10);
      
      if (eventsResult.error) {
        console.error('Events error:', eventsResult.error);
        throw new Error(`Erro ao carregar eventos: ${eventsResult.error.message}`);
      }
      
      // Validação de UUID
      const isValidUUID = (uuid: string): boolean => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
      };
      
      // Validar dados dos eventos
      if (eventsResult.data && Array.isArray(eventsResult.data)) {
        const validatedEvents: UpcomingEvent[] = eventsResult.data
          .filter(event => {
            const eventId = String(event.id || '');
            if (!isValidUUID(eventId)) {
              console.warn('Dashboard: Evento com ID inválido filtrado:', eventId);
              return false;
            }
            return true;
          })
          .map(event => ({
            id: String(event.id),
            titulo: String(event.titulo || 'Evento sem título'),
            inicio: String(event.inicio || ''),
            tipo: String(event.tipo || ''),
            local: event.local ? String(event.local) : undefined,
            banda_nome: undefined
          }));
        setUpcomingEvents(validatedEvents);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao carregar dados';
      console.error('Error loading dashboard data:', error);
      setError(errorMessage);
      
      // Mostrar toast apenas se não for erro de tenant_id (que já é mostrado na UI)
      if (!errorMessage.includes('tenant_id')) {
        toast({
          title: "Erro ao carregar dados",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      // Garantir que isLoading seja false apenas após sucesso completo
      setIsLoading(false);
      isLoadingRef.current = false;
      console.log(`Dashboard: loadDashboardData #${currentLoadId} finalizada`);
    }
  }, [user?.id, toast, checkUserTenantId]);

  // Função com debounce para evitar chamadas muito frequentes
  const loadDashboardDataWithDebounce = useCallback(() => {
    // Limpar timeout anterior se existir
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Configurar novo timeout de 500ms
    debounceTimeoutRef.current = setTimeout(() => {
      loadDashboardData();
    }, 500);
  }, [loadDashboardData]);

  useEffect(() => {
    console.log('Dashboard: useEffect executado - carregando dados iniciais');
    loadDashboardDataWithDebounce();
    
    // Cleanup: limpar timeout quando componente for desmontado
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        console.log('Dashboard: Timeout de debounce limpo no cleanup');
      }
    };
  }, [loadDashboardDataWithDebounce]);

  const handleCreateEvent = useCallback(async () => {
    try {
      // The CreateEventDialog now handles the API call internally
      // Just reload the dashboard data to show the new event
      console.log('Dashboard: Recarregando dados após criação de evento');
      await loadDashboardData();
      toast({
        title: "Evento criado",
        description: "O evento foi criado com sucesso!",
      });
    } catch (error) {
      console.error('Error after creating event:', error);
    }
  }, [loadDashboardData, toast]);

  // Memoizar valores formatados para evitar recálculos desnecessários
  const formattedMetrics = useMemo(() => ({
    activeBands: (dashboardMetrics.active_bands || 0).toString(),
    upcomingEvents: (dashboardMetrics.upcoming_events || 0).toString(),
    totalMembers: (dashboardMetrics.total_members || 0).toString(),
    monthlyRevenue: `R$ ${(dashboardMetrics.monthly_revenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  }), [dashboardMetrics]);

  return (
    <main className="container mx-auto space-y-6 px-6 py-8">
      <header className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Resumo das suas atividades</p>
        </div>
        <CreateEventDialog open={false} onOpenChange={() => {}} onCreate={handleCreateEvent} />
      </header>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {hasTenantId === false && (
        <Card className="border-yellow-500 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-700">
              <AlertTriangle className="h-4 w-4" />
              <p className="text-sm font-medium">
                Configuração pendente: Entre em contato com o administrador para configurar seu acesso.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Bandas Ativas"
          value={formattedMetrics.activeBands}
          icon={<Music2 className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <StatCard
          title="Próximos Eventos"
          value={formattedMetrics.upcomingEvents}
          icon={<CalendarDays className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <StatCard
          title="Total de Membros"
          value={formattedMetrics.totalMembers}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <StatCard
          title="Receita Mensal"
          value={formattedMetrics.monthlyRevenue}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoading}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Receitas vs Despesas
            </CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            {chartLoading ? (
              <div className="flex items-center justify-center h-[350px]">
                <div className="text-muted-foreground">Carregando dados financeiros...</div>
              </div>
            ) : chartError ? (
              <div className="flex items-center justify-center h-[350px]">
                <div className="text-red-500">Erro ao carregar dados: {chartError}</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={chartData}>
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `R$${value}`}
                />
                <Tooltip
                  formatter={(value, name) => [
                    `R$ ${value}`,
                    name === 'receita' ? 'Receita' : 'Despesas'
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="receita"
                  stackId="1"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="despesas"
                  stackId="1"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  fillOpacity={0.6}
                />
              </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Próximos Eventos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : upcomingEvents.length > 0 ? (
                upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => openModal(event.id, 'dashboard')}
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {event.titulo}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatEventDate(event.inicio)} • {event.tipo}
                      </p>
                      {event.local && (
                        <p className="text-xs text-muted-foreground">
                          📍 {event.local}
                        </p>
                      )}
                    </div>
                    <Button variant="ghost" size="sm">
                      Ver detalhes
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold">Nenhum evento próximo</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Crie um novo evento para começar.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedEventId && (
        <EventEditModal
          eventId={selectedEventId}
          open={isModalOpen}
          onOpenChange={closeModal}
          onEventUpdated={loadDashboardData}
        />
      )}
    </main>
  );
};

// Função formatEventDate movida para o topo do arquivo

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  isLoading?: boolean;
}

function StatCard({ title, value, icon, isLoading = false }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-7 bg-muted animate-pulse rounded" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}

export default Dashboard;
