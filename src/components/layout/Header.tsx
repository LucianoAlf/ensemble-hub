import { Link, NavLink } from "react-router-dom";
import { Music, LayoutGrid, Users, CalendarDays, DollarSign, LogOut, WifiOff, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthProvider";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

const Header = () => {
  const { user, signOut } = useAuth();
  const { isOnline, queuedOperationsCount } = useNetworkStatus();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <img 
            src="https://i.imgur.com/0MJGdMM.png" 
            alt="LA Band Pilot Logo" 
            className="h-8 w-8 rounded-md object-contain"
          />
          <span className="font-semibold tracking-tight">LA Band Pilot</span>
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
          <NavLink to="/financeiro" className={({isActive}) => 
            `text-sm transition-colors hover:text-foreground ${isActive ? 'text-foreground' : 'text-muted-foreground'}`
          }>
            <span className="inline-flex items-center gap-2"><DollarSign className="h-4 w-4"/>Financeiro</span>
          </NavLink>
        </nav>

        <div className="flex items-center gap-3">
          {!user ? (
            <>
              <Button variant="ghost" asChild className="invisible">
                <span>Placeholder</span>
              </Button>
              <Button variant="hero" asChild>
                <Link to="/auth">Entrar</Link>
              </Button>
            </>
          ) : (
            <>
              {/* Network Status Indicator */}
              <div className="flex items-center gap-2">
                {!isOnline && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <WifiOff className="h-3 w-3" />
                    Offline
                  </Badge>
                )}
                {queuedOperationsCount > 0 && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Wifi className="h-3 w-3" />
                    {queuedOperationsCount} pendente{queuedOperationsCount > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              <span className="hidden text-sm text-muted-foreground md:inline">{user.email}</span>
              <Button variant="outline" onClick={async () => { await signOut(); }}>
                <LogOut className="mr-2 h-4 w-4" /> Sair
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
