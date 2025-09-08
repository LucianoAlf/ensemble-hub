import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const handleAuthError = async (error: Error | { message?: string }) => {
      console.error('Auth error:', error);
      if (error?.message?.includes('refresh token') || error?.message?.includes('Invalid Refresh Token')) {
        console.log('Invalid refresh token detected, clearing session...');
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        toast('Sessão expirada', { description: 'Por favor, faça login novamente.' });
      }
    };

    // 1) Set up auth listener with error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!isMounted) return;
      
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      // Handle specific auth events
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully');
      } else if (event === 'USER_UPDATED') {
        console.log('User updated');
      }
    });

    // 2) Get initial session with error handling
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          await handleAuthError(error);
        } else if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        await handleAuthError(error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn: AuthContextValue["signIn"] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast("Falha no login", { description: error.message });
    } else {
      toast("Bem-vindo!", { description: "Login realizado com sucesso." });
    }
    return { error: error as Error | null };
  };

  const signUp: AuthContextValue["signUp"] = async (email, password, firstName, lastName) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { 
        emailRedirectTo: redirectUrl,
        data: {
          first_name: firstName,
          last_name: lastName,
        }
      },
    });
    if (error) {
      toast("Erro ao criar conta", { description: error.message });
    } else {
      toast("Verifique seu e-mail", { description: "Enviamos um link de confirmação." });
    }
    return { error: error as Error | null };
  };

  const signInWithGoogle: AuthContextValue["signInWithGoogle"] = async () => {
    try {
      // Detectar se está em ambiente restrito (como Windsurf)
      let isRestrictedEnvironment = false;
      try {
        isRestrictedEnvironment = window !== window.top || 
                                 navigator.userAgent.includes('Windsurf') ||
                                 window.location !== window.parent.location;
      } catch (e) {
        isRestrictedEnvironment = true;
      }

      const currentOrigin = window.location.origin;
      const redirectUrl = currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1') 
        ? `${currentOrigin}/auth` 
        : `${currentOrigin}/dashboard`;
      
      // Sempre usar redirecionamento direto para evitar problemas de popup
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: { access_type: 'offline', prompt: 'consent' },
          scopes: 'email profile openid',
          skipBrowserRedirect: false
        }
      });

      if (error) {
        console.error("Erro no login com Google:", error);
        if (isRestrictedEnvironment) {
          toast("Popup bloqueado", { 
            description: "Por favor, permita popups e tente novamente." 
          });
        } else {
          toast("Erro no login", { description: error.message });
        }
        return { error };
      }

      if (data?.url) {
        // Forçar redirecionamento na mesma janela
        window.location.replace(data.url);
        return { error: null };
      }

      return { error: null };
    } catch (error) {
      console.error("Erro ao fazer login com Google:", error);
      toast("Erro inesperado", { description: "Tente novamente." });
      return { error: error as Error };
    }
  };

  const signOut: AuthContextValue["signOut"] = async () => {
    try {
      // Limpar storage local primeiro
      localStorage.clear();
      sessionStorage.clear();
      
      // Forçar atualização do estado imediatamente
      setSession(null);
      setUser(null);
      
      // Tentar logout do Supabase silenciosamente
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await supabase.auth.signOut({ scope: 'local' });
        }
      } catch (supabaseError) {
        console.log("Erro ignorado do Supabase durante logout:", supabaseError);
      }
      
      toast("Até breve", { description: "Você saiu da sua conta." });
      return { error: null };
    } catch (error) {
      console.error("Erro inesperado no logout:", error);
      // Garantir limpeza e atualização de estado
      localStorage.clear();
      sessionStorage.clear();
      setSession(null);
      setUser(null);
      toast("Logout realizado", { description: "Sessão encerrada." });
      return { error: null };
    }
  };

  const value = useMemo<AuthContextValue>(() => ({ user, session, loading, signIn, signUp, signOut, signInWithGoogle }), [user, session, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
