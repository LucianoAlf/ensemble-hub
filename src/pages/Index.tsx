import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-music.jpg";
import { ArrowRight, Music2, Users, DollarSign, CalendarDays } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import { Link } from "react-router-dom";

const Index = () => {
  useSEO({
    title: "LA BAND PILOT — Gestão de Bandas",
    description: "Gerencie bandas, eventos e finanças em um único hub moderno.",
    canonical: window.location.origin,
  });

  return (
    <main>
      <section className="relative overflow-hidden">
        <img
          src={heroImage}
          alt="Palco moderno com luzes neon roxo e ciano, instrumentos e público"
          className="absolute inset-0 h-full w-full object-cover opacity-40"
          decoding="async"
        />
        <div className="relative mx-auto flex min-h-[78vh] max-w-6xl flex-col items-center justify-center px-6 text-center">
          <div className="pointer-events-none absolute -inset-40 -z-10 bg-[radial-gradient(1200px_600px_at_50%_-10%,hsl(var(--accent)/0.15),transparent)]" />
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/40 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Music2 className="h-3.5 w-3.5" /> Plataforma para músicos, produtores e escolas
          </p>
          <h1 className="mx-auto max-w-3xl text-balance text-4xl font-bold tracking-tight md:text-6xl">
            Gestão de Bandas, Eventos e Financeiro em um só lugar
          </h1>
          <p className="mt-4 max-w-2xl text-balance text-muted-foreground md:text-lg">
            Organize bandas, setlists, eventos, contratos e pagamentos com um fluxo simples e poderoso.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button variant="hero" size="xl" asChild className="group transition-all duration-300 ease-in-out hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-0.5 hover:scale-105 active:scale-95">
              <Link to="/dashboard">
                Explorar Dashboard
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:rotate-12 group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button variant="outline" size="xl" asChild className="group bg-black border-black text-white transition-all duration-300 ease-in-out hover:bg-purple-900 hover:border-purple-900 hover:shadow-lg hover:shadow-purple-500/20 hover:-translate-y-0.5 active:scale-95">
              <Link to="/auth" className="text-white hover:text-white focus:text-white">
                Faça seu Cadastro
              </Link>
            </Button>
          </div>
          <div className="mt-10 grid w-full gap-4 sm:grid-cols-3">
            <Feature icon={<Users className="h-4 w-4" />} title="Gestão Completa de Bandas">
              Organize membros, instrumentos, repertórios e cronogramas em um só lugar.
            </Feature>
            <Feature icon={<DollarSign className="h-4 w-4" />} title="Controle Financeiro Inteligente">
              Gerencie cachês, despesas, splits entre membros e relatórios detalhados.
            </Feature>
            <Feature icon={<CalendarDays className="h-4 w-4" />} title="Agenda de Shows e Eventos">
              Planeje apresentações, ensaios, contratos e acompanhe sua agenda musical.
            </Feature>
          </div>
        </div>
      </section>
    </main>
  );
};

function Feature({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="group cursor-pointer rounded-xl border bg-card/60 p-4 text-left backdrop-blur transition-all duration-300 ease-in-out hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 hover:scale-[1.02] hover:border-primary/20 active:scale-[0.98]">
      <div className="mb-2 inline-flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        <span>{title}</span>
      </div>
      <p className="text-sm text-foreground/90 transition-colors duration-300 group-hover:text-foreground">{children}</p>
    </div>
  );
}

export default Index;
