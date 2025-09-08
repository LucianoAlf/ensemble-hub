import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';
import { supabase } from '@/integrations/supabase/client';

interface TenantContextValue {
  tenantId: string | null;
  loading: boolean;
  error: string | null;
  refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant deve ser usado dentro de um TenantProvider');
  }
  return context;
};

interface TenantProviderProps {
  children: React.ReactNode;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTenantId = async () => {
    if (!user?.id) {
      setTenantId(null);
      setError('Usuário não autenticado');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Buscar o perfil do usuário
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (profile?.tenant_id) {
        setTenantId(profile.tenant_id);
        setError(null);
        return;
      }

      // Se não encontrou perfil ou tenant_id, criar com valor padrão
      if (profileError?.code === 'PGRST116' || !profile?.tenant_id) {
        // Valor padrão temporário - em produção seria gerado dinamicamente
        const defaultTenantId = 'd93bd1e5-245e-4a40-9027-4bd669ccc390';
        
        const { data: upsertedProfile, error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            tenant_id: defaultTenantId,
            display_name: user.email?.split('@')[0] || 'Usuário',
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          })
          .select('tenant_id')
          .single();

        if (upsertError) {
          console.error('Erro ao criar/atualizar perfil:', upsertError);
          setError('Erro ao configurar acesso do usuário');
          setTenantId(null);
          return;
        }

        if (upsertedProfile?.tenant_id) {
          setTenantId(upsertedProfile.tenant_id);
          setError(null);
          return;
        }
      }

      console.error('Erro inesperado ao buscar tenant:', profileError);
      setError('Erro ao configurar acesso do usuário');
      setTenantId(null);
      
    } catch (err) {
      console.error('Erro ao buscar tenant:', err);
      setError('Erro inesperado ao buscar tenant');
      setTenantId(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenantId();
  }, [user?.id, user?.email]);

  const value: TenantContextValue = {
    tenantId,
    loading,
    error,
    refreshTenant: fetchTenantId
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};
