import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { withFallbacks, FallbackUtils } from '@/lib/fallback-manager';
import { toast } from "@/components/ui/sonner";
import { detectMobileDevice } from '@/hooks/use-mobile';

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
    const result = await withFallbacks({
      primary: async () => {
        // Detectar dispositivo mobile usando hook otimizado
        const isMobile = detectMobileDevice();
        
        let isRestrictedEnvironment = false;
        try {
          isRestrictedEnvironment = window !== window.top || 
                                   navigator.userAgent.includes('Windsurf') ||
                                   window.location !== window.parent.location;
        } catch (e) {
          isRestrictedEnvironment = true;
        }
        
        const currentOrigin = window.location.origin;
        
        // URLs de redirecionamento específicas para mobile e desktop
        let redirectUrl;
        if (currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1')) {
          redirectUrl = `${currentOrigin}/auth`;
        } else {
          // Para produção, usar URL específica baseada no dispositivo
          redirectUrl = isMobile ? `${currentOrigin}/auth` : `${currentOrigin}/dashboard`;
        }
        
        // Configuração otimizada para mobile
        const oauthOptions = {
          redirectTo: redirectUrl,
          queryParams: isMobile 
            ? { 
                access_type: 'offline', 
                prompt: 'select_account',
                response_type: 'code',
                include_granted_scopes: 'true'
              }
            : { 
                access_type: 'offline', 
                prompt: 'consent' 
              },
          scopes: 'email profile openid',
          skipBrowserRedirect: false
        };
        
        console.log(`🔍 Dispositivo detectado: ${isMobile ? 'Mobile' : 'Desktop'}`);
        console.log(`🔗 Redirect URL: ${redirectUrl}`);
        
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: oauthOptions
        });
        
        if (error) {
          console.error('❌ Erro OAuth Google:', error);
          if (isRestrictedEnvironment) {
            toast("Popup bloqueado", { description: "Por favor, permita popups e tente novamente." });
          } else if (isMobile) {
            toast("Erro no login mobile", { description: "Tente abrir em uma nova aba ou usar outro navegador." });
          } else {
            toast("Erro no login", { description: error.message });
          }
          throw error;
        }
        
        if (data?.url) {
          console.log(`✅ Redirecionando para: ${data.url}`);
          // Para mobile, usar replace para evitar problemas de navegação
          if (isMobile) {
            window.location.replace(data.url);
          } else {
            window.location.href = data.url;
          }
          return { error: null };
        }
        return { error: null };
      },
      fallbacks: [
        // Fallback 1: Tentar com configuração simplificada para mobile
        async () => {
          const isMobile = detectMobileDevice();
          
          const currentOrigin = window.location.origin;
          const redirectUrl = `${currentOrigin}/auth`;
          
          console.log('🔄 Tentando fallback 1 - Configuração simplificada');
          
          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
              redirectTo: redirectUrl,
              queryParams: isMobile 
                ? { prompt: 'select_account' }
                : { prompt: 'consent' },
              skipBrowserRedirect: false
            }
          });
          
          if (error) throw error;
          if (data?.url) {
            console.log('✅ Fallback 1 sucesso, redirecionando...');
            if (isMobile) {
              // Para mobile, tentar abrir em nova aba se replace falhar
              try {
                window.location.replace(data.url);
              } catch (e) {
                window.open(data.url, '_self');
              }
            } else {
              window.location.href = data.url;
            }
            return { error: null };
          }
          return { error: null };
        },
        // Fallback 2: Tentar com window.open para mobile
        async () => {
          const isMobile = detectMobileDevice();
          
          if (!isMobile) {
            throw new Error('Fallback apenas para mobile');
          }
          
          const currentOrigin = window.location.origin;
          const redirectUrl = `${currentOrigin}/auth`;
          
          console.log('🔄 Tentando fallback 2 - Window.open para mobile');
          
          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
              redirectTo: redirectUrl,
              queryParams: { 
                prompt: 'select_account',
                response_type: 'code'
              },
              skipBrowserRedirect: true // Não redirecionar automaticamente
            }
          });
          
          if (error) throw error;
          if (data?.url) {
            console.log('✅ Fallback 2 sucesso, abrindo nova aba...');
            // Tentar abrir em nova aba/janela
            const authWindow = window.open(data.url, '_blank', 'width=500,height=600,scrollbars=yes,resizable=yes');
            
            if (authWindow) {
              // Monitorar se a janela foi fechada (usuário completou auth)
              const checkClosed = setInterval(() => {
                if (authWindow.closed) {
                  clearInterval(checkClosed);
                  // Recarregar a página para verificar se auth foi bem-sucedida
                  setTimeout(() => window.location.reload(), 1000);
                }
              }, 1000);
            } else {
              // Se popup foi bloqueado, tentar redirect direto
              window.location.href = data.url;
            }
            return { error: null };
          }
          return { error: null };
        },
        // Fallback 2: Usar sessão local se disponível
        FallbackUtils.createCacheStrategy('google_auth_session', 15 * 60 * 1000)
      ],
      timeout: 10000,
      onFallback: (index, error) => {
        logger.warn('Fallback de autenticação Google ativado', {
          context: 'auth_google',
          fallbackIndex: index,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });

    if (result.success) {
      // Salvar sessão no cache para fallback futuro
      if (result.data && !result.usedFallback) {
        FallbackUtils.saveToCache('google_auth_session', result.data);
      }
      return result.data || { error: null };
    } else {
      toast("Erro inesperado", { description: "Tente novamente." });
      return { error: new Error('Falha na autenticação Google') };
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
