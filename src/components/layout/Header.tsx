import { Link, NavLink } from "react-router-dom";
import { Music, LayoutGrid, Users, CalendarDays, DollarSign, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthProvider";
import { useNavigationShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";

const Header = () => {
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Ativar atalhos de navegação (funcionalidade mantida, apenas sem indicadores visuais)
  useNavigationShortcuts();

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

        <nav id="main-navigation" className="hidden gap-6 md:flex" role="navigation" aria-label="Navegação principal">
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
          {/* Mobile Menu Button */}
          {isMobile && user && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          )}

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
              <span className="hidden text-sm text-muted-foreground md:inline">{user.email}</span>
              <Button variant="outline" onClick={async () => { await signOut(); }} className="hidden md:flex">
                <LogOut className="mr-2 h-4 w-4" /> Sair
              </Button>
              {/* Mobile Logout */}
              {isMobile && (
                <Button variant="ghost" size="icon" onClick={async () => { await signOut(); }} className="md:hidden">
                  <LogOut className="h-5 w-5" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobile && mobileMenuOpen && user && (
        <div className="absolute top-14 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
          <nav className="container mx-auto px-4 py-4 space-y-2" role="navigation" aria-label="Navegação mobile">
            <NavLink 
              to="/dashboard" 
              className={({isActive}) => 
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                }`
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              <LayoutGrid className="h-4 w-4"/>
              Dashboard
            </NavLink>
            <NavLink 
              to="/bands" 
              className={({isActive}) => 
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                }`
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              <Users className="h-4 w-4"/>
              Bandas
            </NavLink>
            <NavLink 
              to="/events" 
              className={({isActive}) => 
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                }`
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              <CalendarDays className="h-4 w-4"/>
              Eventos
            </NavLink>
            <NavLink 
              to="/financeiro" 
              className={({isActive}) => 
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                }`
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              <DollarSign className="h-4 w-4"/>
              Financeiro
            </NavLink>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
