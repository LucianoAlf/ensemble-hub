import { useSEO } from "@/hooks/useSEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, DollarSign, Music2, Users, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { name: 'Jan', receita: 2400, despesas: 1400 },
  { name: 'Fev', receita: 2210, despesas: 1100 },
  { name: 'Mar', receita: 3290, despesas: 2000 },
  { name: 'Abr', receita: 2780, despesas: 1900 },
  { name: 'Mai', receita: 3890, despesas: 2300 },
  { name: 'Jun', receita: 4490, despesas: 2400 },
];

const Dashboard = () => {
  useSEO({
    title: "Dashboard — LA Music Hub",
    description: "Visão geral de bandas, eventos e finanças.",
    canonical: window.location.origin + "/dashboard",
  });

  return (
    <main className="container mx-auto space-y-6 px-6 py-8">
      <header className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Resumo das suas atividades</p>
        </div>
        <Button variant="hero"><CalendarDays className="mr-2 h-4 w-4"/>Novo Evento</Button>
      </header>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Bandas Ativas" value="12" icon={<Music2 className="h-4 w-4"/>} />
        <StatCard title="Próximos Eventos" value="5" icon={<CalendarDays className="h-4 w-4"/>} />
        <StatCard title="Receita Mensal" value="R$ 18.450" icon={<DollarSign className="h-4 w-4"/>} />
        <StatCard title="Integrantes" value="42" icon={<Users className="h-4 w-4"/>} />
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
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">Show no Blue Note</p>
                  <p className="text-sm text-muted-foreground">20/12 • 21h • Banda XYZ</p>
                </div>
                <Button variant="ghost" size="sm">Ver</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </main>
  );
};

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
