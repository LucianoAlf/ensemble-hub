import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

interface UseTenantReturn {
  tenantId: string | null;
  loading: boolean;
  error: string | null;
  hasTenant: boolean;
  refreshTenant: () => Promise<void>;
}

/**
 * Hook para obter o tenant_id do usuário autenticado
 */
export const useTenant = (): UseTenantReturn => {
  const { user } = useAuth();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTenantId = useCallback(async () => {
    if (!user?.id) {
      setTenantId(null);
      setError('Usuário não autenticado');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Primeiro, tentar buscar o perfil existente
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      // Se o perfil existe e tem tenant_id, usar ele
      if (profile?.tenant_id) {
        setTenantId(profile.tenant_id);
        setError(null);
        return;
      }

      // Se não encontrou perfil (erro PGRST116) ou perfil sem tenant_id, criar/atualizar
      if (profileError?.code === 'PGRST116' || !profile?.tenant_id) {
        console.log('Perfil não encontrado ou sem tenant_id, criando/atualizando...');
        
        const defaultTenantId = 'd93bd1e5-245e-4a40-9027-4bd669ccc390';
        
        // Tentar criar ou atualizar o perfil
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
          console.error('Error creating/updating profile:', upsertError);
          setError('Erro ao criar perfil do usuário');
          setTenantId(null);
          return;
        }

        if (upsertedProfile?.tenant_id) {
          setTenantId(upsertedProfile.tenant_id);
          setError(null);
          console.log('Perfil criado/atualizado com sucesso:', upsertedProfile.tenant_id);
          return;
        }
      }

      // Se chegou aqui, algo deu errado
      console.error('Unexpected error in fetchTenantId:', profileError);
      setError('Erro ao configurar acesso do usuário');
      setTenantId(null);
      
    } catch (err) {
      console.error('Error in fetchTenantId:', err);
      setError('Erro inesperado ao buscar tenant');
      setTenantId(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.email]);

  useEffect(() => {
    fetchTenantId();
  }, [fetchTenantId]);

  return {
    tenantId,
    loading,
    error,
    hasTenant: !!tenantId,
    refreshTenant: fetchTenantId
  };
};

export default useTenant;