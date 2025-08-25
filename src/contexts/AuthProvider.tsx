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
    return { error: error as any };
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
    return { error: error as any };
  };

  const signInWithGoogle: AuthContextValue["signInWithGoogle"] = async () => {
    try {
      console.log("Iniciando autenticação Google...");
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          skipBrowserRedirect: false, // Força redirect na mesma janela
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        console.error("Erro na autenticação Google:", error);
        
        // Tratamento específico para diferentes tipos de erro
        if (error.message.includes("invalid_request") || error.message.includes("requested path is invalid")) {
          toast("Erro de configuração", { 
            description: "Verifique se o domínio ensemble-hub.lovable.app está configurado no Google Cloud Console e Supabase." 
          });
        } else {
          toast("Erro no login com Google", { description: error.message });
        }
        return { error: error as any };
      }

      console.log("Redirecionamento para Google iniciado:", data);
      
      // Forçar redirect manual se necessário
      if (data?.url) {
        console.log("Redirecionando manualmente para:", data.url);
        window.location.href = data.url;
      }
      
      toast("Redirecionando para Google...", { 
        description: "Você será redirecionado para completar a autenticação." 
      });
      
      return { error: null };
    } catch (unexpectedError) {
      console.error("Erro inesperado na autenticação Google:", unexpectedError);
      toast("Erro inesperado", { 
        description: "Ocorreu um erro inesperado. Tente novamente." 
      });
      return { error: unexpectedError as any };
    }
  };

  const signOut: AuthContextValue["signOut"] = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast("Erro ao sair", { description: error.message });
    } else {
      toast("Até breve", { description: "Você saiu da sua conta." });
    }
    return { error: error as any };
  };

  const value = useMemo<AuthContextValue>(() => ({ user, session, loading, signIn, signUp, signOut, signInWithGoogle }), [user, session, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
