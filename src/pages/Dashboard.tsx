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

const data = [
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
  const [dashboardMetrics, setDashboardMetrics] = useState({
    active_bands: 12,
    upcoming_events: 5,
    total_members: 42,
    monthly_revenue: 18450
  });
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);

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
      console.log('Loading dashboard data...');
      
      // Load dashboard metrics
      const { data: metrics, error: metricsError } = await supabase
        .rpc('get_dashboard_metrics');
      
      console.log('Dashboard metrics response:', { metrics, metricsError });
      
      if (metricsError) {
        console.error('Metrics error:', metricsError);
        throw metricsError;
      }
      
      if (metrics && typeof metrics === 'object' && !Array.isArray(metrics)) {
        const metricsObj = metrics as Record<string, any>;
        console.log('Setting metrics:', metricsObj);
        setDashboardMetrics({
          active_bands: Number(metricsObj.active_bands) || 0,
          upcoming_events: Number(metricsObj.upcoming_events) || 0,
          total_members: Number(metricsObj.total_members) || 0,
          monthly_revenue: Number(metricsObj.monthly_revenue) || 0
        });
      }

      // Load upcoming events
      const { data: events, error: eventsError } = await supabase
        .from('vw_eventos_proximos')
        .select('*')
        .limit(4);
      
      console.log('Events response:', { events, eventsError });
      
      if (eventsError) {
        console.error('Events error:', eventsError);
        throw eventsError;
      }
      if (events) setUpcomingEvents(events);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Keep default values on error
    }
  };

  const handleCreateEvent = async (eventData: EventItem) => {
    // The CreateEventDialog now handles the API call internally
    // Just reload the dashboard data to show the new event
    loadDashboardData();
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

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Bandas Ativas" value={String(dashboardMetrics.active_bands || 0)} icon={<Music2 className="h-4 w-4"/>} />
        <StatCard title="Próximos Eventos" value={String(dashboardMetrics.upcoming_events || 0)} icon={<CalendarDays className="h-4 w-4"/>} />
        <StatCard title="Receita Mensal" value={`R$ ${(dashboardMetrics.monthly_revenue || 0).toLocaleString('pt-BR')}`} icon={<DollarSign className="h-4 w-4"/>} />
        <StatCard title="Integrantes" value={String(dashboardMetrics.total_members || 0)} icon={<Users className="h-4 w-4"/>} />
      </section>

      <section className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="inline-flex items-center gap-2"><TrendingUp className="h-4 w-4"/>Receita vs Despesas</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
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
          <CardContent className="space-y-3">
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

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">Atualizado agora</p>
      </CardContent>
    </Card>
  );
}

export default Dashboard;
