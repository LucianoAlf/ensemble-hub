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
    // 1) Set up auth listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
    });

    // 2) Then get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn: AuthContextValue["signIn"] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast("Falha no login", { description: error.message });
    } else {
      toast("Bem-vindo!", { description: "Login realizado com sucesso." });
    }
    return { error: error ? new Error(error.message) : null };
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
    return { error: error ? new Error(error.message) : null };
  };

  const signInWithGoogle: AuthContextValue["signInWithGoogle"] = async () => {
    try {
      console.log("Iniciando autenticação Google...");
      
      // Verificação segura de iframe
      try {
        if (window !== window.top) {
          console.warn("App detectado em iframe, usando fallback...");
          toast("Redirecionamento necessário", { 
            description: "Por favor, abra o app em uma nova aba para fazer login com Google." 
          });
          // Abrir em nova aba como fallback
          const newWindow = window.open(window.location.href, '_blank');
          if (newWindow) {
            return { error: null };
          }
        }
      } catch (e) {
        // Ignora erro de segurança na verificação de iframe
        console.log("Verificação de iframe ignorada devido a restrições de segurança");
      }
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        console.error("Erro no OAuth:", error);
        toast("Erro no login com Google", { description: error.message });
        return { error: error ? new Error(error.message) : null };
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
            return { error: new Error("Redirecionamento bloqueado") };
          }
        }
      }
      
      return { error: null };
    } catch (error) {
      console.error("Erro ao fazer login com Google:", error);
      toast("Erro inesperado", { description: "Tente novamente." });
      return { error: error instanceof Error ? error : new Error(String(error)) };
    }
  };

  const signOut: AuthContextValue["signOut"] = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast("Erro ao sair", { description: error.message });
    } else {
      toast("Até breve", { description: "Você saiu da sua conta." });
    }
    return { error: error ? new Error(error.message) : null };
  };

  const value = useMemo<AuthContextValue>(() => ({ user, session, loading, signIn, signUp, signOut, signInWithGoogle }), [user, session, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
