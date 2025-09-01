import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
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

  const signUp: AuthContextValue["signUp"] = async (email, password) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl },
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
      console.log("Iniciando autenticação Google...");
      
      // Verificação segura de iframe
      let isIframe = false;
      try {
        isIframe = window !== window.top;
      } catch (e) {
        isIframe = true; // Assume iframe se verificação falhar
        console.log("Verificação de iframe falhou, assumindo iframe:", e);
      }
      if (isIframe) {
        console.warn("App detectado em iframe, usando fallback...");
        toast("Redirecionamento necessário", { 
          description: "Por favor, abra o app em uma nova aba para fazer login com Google." 
        });
        const newWindow = window.open(window.location.href, '_blank');
        if (newWindow) {
          return { error: null };
        } else {
          toast("Popup bloqueado", { description: "Por favor, permita popups e tente novamente." });
          return { error: new Error("Popup bloqueado") };
        }
      }
      
      // Configuração específica para ambiente local
      const currentOrigin = window.location.origin;
      const redirectUrl = currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1') 
        ? `${currentOrigin}/auth` 
        : `${currentOrigin}/dashboard`;
      
      console.log('OAuth redirect URL:', redirectUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          scopes: 'email profile openid'
        }
      });

      if (error) {
        console.error("Erro no OAuth:", error);
        toast("Erro no login com Google", { description: error.message });
        return { error: error as Error };
      }

      // Redirecionamento seguro
      if (data?.url) {
        console.log("Redirecionando para:", data.url);
        try {
          window.location.href = data.url;
          return { data, error: null };
        } catch (redirectError) {
          console.error("Erro no redirecionamento direto:", redirectError);
          // Fallback: abrir em nova aba
          const newWindow = window.open(data.url, '_blank');
          if (newWindow) {
            toast("Redirecionamento", { description: "Login aberto em nova aba." });
            return { data, error: null };
          } else {
            toast("Erro no redirecionamento", { 
              description: "Por favor, permita pop-ups para este site." 
            });
            return { error: new Error("Redirecionamento bloqueado") as Error };
          }
        }
      }
      
      return { error: null };
    } catch (error) {
      console.error("Erro ao fazer login com Google:", error);
      toast("Erro inesperado", { description: "Tente novamente." });
      return { error: error as Error };
    }
  };

  const signOut: AuthContextValue["signOut"] = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast("Erro ao sair", { description: error.message });
    } else {
      toast("Até breve", { description: "Você saiu da sua conta." });
    }
    return { error: error as Error | null };
  };

  const value = useMemo<AuthContextValue>(() => ({ user, session, loading, signIn, signUp, signOut, signInWithGoogle }), [user, session, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
