-- Ensure all tables have proper types and structure
-- This migration will refresh the database schema to generate proper TypeScript types

-- Add any missing constraints or ensure table structure is correct
DO $$ 
BEGIN
    -- Check if unidade table exists and has correct structure
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'unidade' AND table_schema = 'public') THEN
        CREATE TABLE public.unidade (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            tenant_id UUID NOT NULL,
            nome TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );
        
        -- Enable RLS
        ALTER TABLE public.unidade ENABLE ROW LEVEL SECURITY;
        
        -- Add policies
        CREATE POLICY "Users can view unidades from their tenant" ON public.unidade FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.tenant_id = unidade.tenant_id));
        CREATE POLICY "Users can create unidades in their tenant" ON public.unidade FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.tenant_id = unidade.tenant_id));
        CREATE POLICY "Users can update unidades in their tenant" ON public.unidade FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.tenant_id = unidade.tenant_id));
    END IF;
    
    -- Ensure banda_integrante table structure is correct
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'banda_integrante' AND column_name = 'tenant_id') THEN
        ALTER TABLE public.banda_integrante ADD COLUMN tenant_id UUID;
        UPDATE public.banda_integrante SET tenant_id = (SELECT tenant_id FROM public.banda WHERE banda.id = banda_integrante.banda_id);
        ALTER TABLE public.banda_integrante ALTER COLUMN tenant_id SET NOT NULL;
    END IF;
    
    -- Ensure banda_repertorio table structure is correct  
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'banda_repertorio' AND column_name = 'tenant_id') THEN
        ALTER TABLE public.banda_repertorio ADD COLUMN tenant_id UUID;
        UPDATE public.banda_repertorio SET tenant_id = (SELECT tenant_id FROM public.banda WHERE banda.id = banda_repertorio.banda_id);
        ALTER TABLE public.banda_repertorio ALTER COLUMN tenant_id SET NOT NULL;
    END IF;
    
    -- Ensure banda_rider_tecnico table structure is correct
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'banda_rider_tecnico' AND column_name = 'tenant_id') THEN
        ALTER TABLE public.banda_rider_tecnico ADD COLUMN tenant_id UUID;
        UPDATE public.banda_rider_tecnico SET tenant_id = (SELECT tenant_id FROM public.banda WHERE banda.id = banda_rider_tecnico.banda_id);
        ALTER TABLE public.banda_rider_tecnico ALTER COLUMN tenant_id SET NOT NULL;
    END IF;
    
    -- Ensure banda_mapa_palco table structure is correct
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'banda_mapa_palco' AND column_name = 'tenant_id') THEN
        ALTER TABLE public.banda_mapa_palco ADD COLUMN tenant_id UUID;
        UPDATE public.banda_mapa_palco SET tenant_id = (SELECT tenant_id FROM public.banda WHERE banda.id = banda_mapa_palco.banda_id);
        ALTER TABLE public.banda_mapa_palco ALTER COLUMN tenant_id SET NOT NULL;
    END IF;
    
    -- Ensure banda_setlist table structure is correct
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'banda_setlist' AND column_name = 'tenant_id') THEN
        ALTER TABLE public.banda_setlist ADD COLUMN tenant_id UUID;
        UPDATE public.banda_setlist SET tenant_id = (SELECT tenant_id FROM public.banda WHERE banda.id = banda_setlist.banda_id);
        ALTER TABLE public.banda_setlist ALTER COLUMN tenant_id SET NOT NULL;
    END IF;
    
    -- Ensure banda_setlist_musica table structure is correct
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'banda_setlist_musica' AND column_name = 'tenant_id') THEN
        ALTER TABLE public.banda_setlist_musica ADD COLUMN tenant_id UUID;
        UPDATE public.banda_setlist_musica SET tenant_id = (SELECT tenant_id FROM public.banda_setlist WHERE banda_setlist.id = banda_setlist_musica.setlist_id);
        ALTER TABLE public.banda_setlist_musica ALTER COLUMN tenant_id SET NOT NULL;
    END IF;
    
END $$;