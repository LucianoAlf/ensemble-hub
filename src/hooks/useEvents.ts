import { useCallback } from "react";
import { useSupabaseOptimized } from "./useSupabaseOptimized";

export interface Event {
  id: string;
  titulo: string;
  tipo?: string;
  inicio: string;
  local?: string;
  endereco?: string;
  orcamento?: number;
  descricao?: string;
  status?: string;
}

export interface EventSelectOption {
  id: string;
  title: string;
  type?: string;
  date: string;
  venue?: string;
}

export function useEvents() {
  const { query } = useSupabaseOptimized();

  const getEvents = useCallback(async () => {
    try {
      const result = await query(
        async ({ client, signal }) => {
          const query = client
            .from("evento")
            .select("id, titulo, tipo, inicio, local, endereco, orcamento, descricao, status")
            .gte("inicio", new Date().toISOString()) // Apenas eventos futuros
            .order("inicio", { ascending: true });
          
          if (signal) {
            query.abortSignal(signal);
          }
          
          return query;
        },
        {
          cache: {
            enabled: true,
            ttlMs: 300000, // 5 minutos
            key: "events:select-list",
          },
          enableAbortSignal: true,
        }
      );

      if (result.error) {
        console.error("Erro ao carregar eventos:", result.error);
        throw result.error;
      }

      return result.data || [];
    } catch (error) {
      console.error("Erro no hook useEvents:", error);
      throw error;
    }
  }, [query]);

  const getEventsForSelect = useCallback(async (): Promise<EventSelectOption[]> => {
    try {
      const events = await getEvents();
      return events.map((event: Event) => ({
        id: event.id,
        title: event.titulo,
        type: event.tipo,
        date: event.inicio,
        venue: event.local,
      }));
    } catch (error) {
      console.error("Erro ao carregar eventos para seleção:", error);
      return [];
    }
  }, [getEvents]);

  const getFutureEvents = useCallback(async () => {
    try {
      const result = await query(
        async ({ client, signal }) => {
          const query = client
            .from("evento")
            .select("id, titulo, tipo, inicio, local")
            .gte("inicio", new Date().toISOString())
            .order("inicio", { ascending: true })
            .limit(50); // Limitar para performance
          
          if (signal) {
            query.abortSignal(signal);
          }
          
          return query;
        },
        {
          cache: {
            enabled: true,
            ttlMs: 300000, // 5 minutos
            key: "events:future-list",
          },
          enableAbortSignal: true,
        }
      );

      if (result.error) {
        console.error("Erro ao carregar eventos futuros:", result.error);
        throw result.error;
      }

      return result.data || [];
    } catch (error) {
      console.error("Erro ao carregar eventos futuros:", error);
      throw error;
    }
  }, [query]);

  return {
    getEvents,
    getEventsForSelect,
    getFutureEvents,
  };
}