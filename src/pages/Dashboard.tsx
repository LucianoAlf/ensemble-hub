import { useState, useEffect } from "react";
import { useSEO } from "@/hooks/useSEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, DollarSign, Music2, Users, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { CreateEventDialog } from "@/components/events/CreateEventDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { EventItem } from "@/pages/Events";

interface DashboardMetrics {
  active_bands: number;
  upcoming_events: number;
  total_members: number;
  monthly_revenue: number;
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

const chartData: ChartData[] = [
  { name: 'Jan', receita: 2400, despesas: 1400 },
  { name: 'Fev', receita: 2210, despesas: 1100 },
  { name: 'Mar', receita: 3290, despesas: 2000 },
  { name: 'Abr', receita: 2780, despesas: 1900 },
  { name: 'Mai', receita: 3890, despesas: 2300 },
  { name: 'Jun', receita: 4490, despesas: 2400 },
];

const Dashboard = () => {
  const { toast } = useToast();
  const [openEventDialog, setOpenEventDialog] = useState(false);
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics>({
    active_bands: 0,
    upcoming_events: 0,
    total_members: 0,
    monthly_revenue: 0
  });
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useSEO({
    title: "Dashboard — LA Music Hub",
    description: "Visão geral de bandas, eventos e finanças.",
    canonical: window.location.origin + "/dashboard",
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load dashboard metrics
      const { data: metrics, error: metricsError } = await supabase
        .rpc('get_dashboard_metrics');
      
      if (metricsError) {
        console.error('Metrics error:', metricsError);
        throw new Error(`Erro ao carregar métricas: ${metricsError.message}`);
      }
      
      // Validate and set metrics with proper type checking
      if (metrics && typeof metrics === 'object' && !Array.isArray(metrics)) {
        const metricsObj = metrics as Record<string, unknown>;
        const validatedMetrics: DashboardMetrics = {
          active_bands: typeof metricsObj.active_bands === 'number' ? metricsObj.active_bands : Number(metricsObj.active_bands) || 0,
          upcoming_events: typeof metricsObj.upcoming_events === 'number' ? metricsObj.upcoming_events : Number(metricsObj.upcoming_events) || 0,
          total_members: typeof metricsObj.total_members === 'number' ? metricsObj.total_members : Number(metricsObj.total_members) || 0,
          monthly_revenue: typeof metricsObj.monthly_revenue === 'number' ? metricsObj.monthly_revenue : Number(metricsObj.monthly_revenue) || 0
        };
        setDashboardMetrics(validatedMetrics);
      }

      // Load upcoming events (no limit to show all future events)
      const { data: events, error: eventsError } = await supabase
        .from('vw_eventos_proximos')
        .select('id, titulo, inicio, tipo, local, banda_nome');
      
      if (eventsError) {
        console.error('Events error:', eventsError);
        throw new Error(`Erro ao carregar eventos: ${eventsError.message}`);
      }
      
      // Validate events data
      if (events && Array.isArray(events)) {
        const validatedEvents: UpcomingEvent[] = events.map(event => ({
          id: String(event.id || ''),
          titulo: String(event.titulo || 'Evento sem título'),
          inicio: String(event.inicio || ''),
          tipo: String(event.tipo || ''),
          local: event.local ? String(event.local) : undefined,
          banda_nome: event.banda_nome ? String(event.banda_nome) : undefined
        }));
        setUpcomingEvents(validatedEvents);
      }
      console.log('Events raw data:', events);
console.log('Events error:', eventsError);

// Validate events data
if (events && Array.isArray(events)) {
  console.log('Events validated, length:', events.length);
  const validatedEvents: UpcomingEvent[] = events.map(event => ({
    id: String(event.id || ''),
    titulo: String(event.titulo || 'Evento sem título'),
    inicio: String(event.inicio || ''),
    tipo: String(event.tipo || ''),
    local: event.local ? String(event.local) : undefined,
    banda_nome: event.banda_nome ? String(event.banda_nome) : undefined
  }));
  console.log('Validated events:', validatedEvents);
  setUpcomingEvents(validatedEvents);
} else {
  console.log('No events or not array:', events);
}

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao carregar dados';
      console.error('Error loading dashboard data:', error);
      setError(errorMessage);
      toast({
        title: "Erro ao carregar dados",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    try {
      // The CreateEventDialog now handles the API call internally
      // Just reload the dashboard data to show the new event
      await loadDashboardData();
      toast({
        title: "Evento criado",
        description: "O evento foi criado com sucesso!",
      });
    } catch (error) {
      console.error('Error after creating event:', error);
    }
  };

  return (
    <main className="container mx-auto space-y-6 px-6 py-8">
      <header className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Resumo das suas atividades</p>
        </div>
        <Button variant="hero" onClick={() => setOpenEventDialog(true)}>
          <CalendarDays className="mr-2 h-4 w-4"/>
          Novo Evento
        </Button>
      </header>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive text-center">{error}</p>
            <Button 
              variant="outline" 
              className="mt-4 w-full" 
              onClick={loadDashboardData}
              disabled={isLoading}
            >
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      )}

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Bandas Ativas" 
          value={String(dashboardMetrics.active_bands)} 
          icon={<Music2 className="h-4 w-4"/>} 
          isLoading={isLoading}
        />
        <StatCard 
          title="Próximos Eventos" 
          value={String(dashboardMetrics.upcoming_events)} 
          icon={<CalendarDays className="h-4 w-4"/>} 
          isLoading={isLoading}
        />
        <StatCard 
          title="Receita Mensal" 
          value={`R$ ${dashboardMetrics.monthly_revenue.toLocaleString('pt-BR')}`} 
          icon={<DollarSign className="h-4 w-4"/>} 
          isLoading={isLoading}
        />
        <StatCard 
          title="Integrantes" 
          value={String(dashboardMetrics.total_members)} 
          icon={<Users className="h-4 w-4"/>} 
          isLoading={isLoading}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="inline-flex items-center gap-2"><TrendingUp className="h-4 w-4"/>Receita vs Despesas</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))"/>
                <YAxis stroke="hsl(var(--muted-foreground))"/>
                <Tooltip cursor={{ stroke: 'hsl(var(--border))' }} contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--popover-foreground))' }}/>
                <Area type="monotone" dataKey="receita" stroke="hsl(var(--primary))" fill="url(#colorReceita)" strokeWidth={2}/>
                <Area type="monotone" dataKey="despesas" stroke="hsl(var(--accent))" fill="url(#colorDespesas)" strokeWidth={2}/>
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Próximos Eventos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
            {upcomingEvents.length > 0 ? upcomingEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">{event.titulo}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatEventDate(event.inicio)} • {event.banda_nome || 'Sem banda'}
                  </p>
                </div>
                <Button variant="ghost" size="sm">Ver</Button>
              </div>
            )) : (
              <div className="text-center py-4 text-muted-foreground">
                <p>Nenhum evento próximo</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <CreateEventDialog 
        open={openEventDialog} 
        onOpenChange={setOpenEventDialog} 
        onCreate={handleCreateEvent} 
      />
    </main>
  );
};

function formatEventDate(isoString: string) {
  const date = new Date(isoString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

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
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {isLoading ? (
            <div className="h-8 w-16 bg-muted animate-pulse rounded" />
          ) : (
            value
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {isLoading ? 'Carregando...' : 'Atualizado agora'}
        </p>
      </CardContent>
    </Card>
  );
}

export default Dashboard;
