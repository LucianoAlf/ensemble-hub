import { useCallback } from "react";
import { useSupabaseOptimized } from "./useSupabaseOptimized";

export interface Band {
  id: string;
  nome: string;
  genero?: string;
  descricao?: string;
  logo_url?: string;
}

export interface BandSelectOption {
  id: string;
  name: string;
  genre?: string;
}

export function useBands() {
  const { query } = useSupabaseOptimized();

  const getBands = useCallback(async () => {
    try {
      const result = await query(
        async ({ client, signal }) =>
          client
            .from("vw_bandas_lista")
            .select("id, nome, genero, descricao, logo_url")
            .order("nome", { ascending: true })
            .abortSignal(signal),
        {
          cache: {
            enabled: true,
            ttlMs: 300000, // 5 minutos
            key: "bands:select-list",
          },
          enableAbortSignal: true,
        }
      );

      if (result.error) {
        console.error("Erro ao carregar bandas:", result.error);
        throw result.error;
      }

      return result.data || [];
    } catch (error) {
      console.error("Erro no hook useBands:", error);
      throw error;
    }
  }, [query]);

  const getBandsForSelect = useCallback(async (): Promise<BandSelectOption[]> => {
    try {
      const bands = await getBands();
      return bands.map((band: Band) => ({
        id: band.id,
        name: band.nome,
        genre: band.genero,
      }));
    } catch (error) {
      console.error("Erro ao carregar bandas para seleção:", error);
      return [];
    }
  }, [getBands]);

  return {
    getBands,
    getBandsForSelect,
  };
}