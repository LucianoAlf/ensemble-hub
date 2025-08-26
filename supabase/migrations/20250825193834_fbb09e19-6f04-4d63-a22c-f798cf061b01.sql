-- Create missing tables that are referenced in the code but don't exist

-- Create unidade table
CREATE TABLE public.unidade (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on unidade
ALTER TABLE public.unidade ENABLE ROW LEVEL SECURITY;

-- Create policies for unidade
CREATE POLICY "Users can view unidades from their tenant" 
ON public.unidade 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() AND profiles.tenant_id = unidade.tenant_id
));

CREATE POLICY "Users can create unidades in their tenant" 
ON public.unidade 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() AND profiles.tenant_id = unidade.tenant_id
));

CREATE POLICY "Users can update unidades in their tenant" 
ON public.unidade 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() AND profiles.tenant_id = unidade.tenant_id
));

-- Add trigger for updated_at on unidade
CREATE TRIGGER update_unidade_updated_at
BEFORE UPDATE ON public.unidade
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add foreign key constraint to banda table for unidade_id
ALTER TABLE public.banda 
ADD CONSTRAINT fk_banda_unidade 
FOREIGN KEY (unidade_id) REFERENCES public.unidade(id);

-- Add foreign key constraint to banda_integrante table for banda_id
ALTER TABLE public.banda_integrante 
ADD CONSTRAINT fk_banda_integrante_banda 
FOREIGN KEY (banda_id) REFERENCES public.banda(id) ON DELETE CASCADE;

-- Add foreign key constraint to banda_repertorio table for banda_id
ALTER TABLE public.banda_repertorio 
ADD CONSTRAINT fk_banda_repertorio_banda 
FOREIGN KEY (banda_id) REFERENCES public.banda(id) ON DELETE CASCADE;

-- Add foreign key constraint to banda_rider_tecnico table for banda_id
ALTER TABLE public.banda_rider_tecnico 
ADD CONSTRAINT fk_banda_rider_tecnico_banda 
FOREIGN KEY (banda_id) REFERENCES public.banda(id) ON DELETE CASCADE;

-- Add foreign key constraint to banda_mapa_palco table for banda_id
ALTER TABLE public.banda_mapa_palco 
ADD CONSTRAINT fk_banda_mapa_palco_banda 
FOREIGN KEY (banda_id) REFERENCES public.banda(id) ON DELETE CASCADE;

-- Add foreign key constraint to evento table for banda_id
ALTER TABLE public.evento 
ADD CONSTRAINT fk_evento_banda 
FOREIGN KEY (banda_id) REFERENCES public.banda(id);

-- Add foreign key constraint to evento table for unidade_id
ALTER TABLE public.evento 
ADD CONSTRAINT fk_evento_unidade 
FOREIGN KEY (unidade_id) REFERENCES public.unidade(id);

-- Add foreign key constraint to evento_banda table for evento_id and banda_id
ALTER TABLE public.evento_banda 
ADD CONSTRAINT fk_evento_banda_evento 
FOREIGN KEY (evento_id) REFERENCES public.evento(id) ON DELETE CASCADE;

ALTER TABLE public.evento_banda 
ADD CONSTRAINT fk_evento_banda_banda 
FOREIGN KEY (banda_id) REFERENCES public.banda(id) ON DELETE CASCADE;