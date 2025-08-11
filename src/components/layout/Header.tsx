import { Link, NavLink } from "react-router-dom";
import { Music, LayoutGrid, Users, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-gradient-to-br from-primary to-sidebar-ring flex items-center justify-center">
            <Music className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold tracking-tight">LA Music Hub</span>
        </Link>

        <nav className="hidden gap-6 md:flex">
          <NavLink to="/dashboard" className={({isActive}) => 
            `text-sm transition-colors hover:text-foreground ${isActive ? 'text-foreground' : 'text-muted-foreground'}`
          }>
            <span className="inline-flex items-center gap-2"><LayoutGrid className="h-4 w-4"/>Dashboard</span>
          </NavLink>
          <NavLink to="/bands" className={({isActive}) => 
            `text-sm transition-colors hover:text-foreground ${isActive ? 'text-foreground' : 'text-muted-foreground'}`
          }>
            <span className="inline-flex items-center gap-2"><Users className="h-4 w-4"/>Bandas</span>
          </NavLink>
          <NavLink to="/events" className={({isActive}) => 
            `text-sm transition-colors hover:text-foreground ${isActive ? 'text-foreground' : 'text-muted-foreground'}`
          }>
            <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4"/>Eventos</span>
          </NavLink>
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link to="/dashboard">Demo</Link>
          </Button>
          <Button variant="hero" asChild>
            <Link to="#">Entrar</Link>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
