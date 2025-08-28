import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthProvider';

export const useTenantId = () => {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchTenantId = async () => {
      if (!user) {
        setTenantId(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('tenant_id')
          .eq('id', user.id)
          .single();

        if (fetchError) {
          console.error('Erro ao buscar tenant_id:', fetchError);
          setError(fetchError.message);
          setTenantId(null);
        } else {
          setTenantId(data?.tenant_id || null);
        }
      } catch (err) {
        console.error('Erro inesperado ao buscar tenant_id:', err);
        setError('Erro inesperado');
        setTenantId(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTenantId();
  }, [user]);

  return { tenantId, loading, error };
};