-- Create banda_integrante table
-- This table stores band members/integrants information

CREATE TABLE public.banda_integrante (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  banda_id UUID NOT NULL,
  nome TEXT NOT NULL,
  instrumento TEXT NOT NULL,
  funcao TEXT,
  telefone TEXT,
  email TEXT,
  instagram TEXT,
  facebook TEXT,
  youtube TEXT,
  spotify TEXT,
  data_entrada DATE NOT NULL DEFAULT CURRENT_DATE,
  data_saida DATE,
  ativo BOOLEAN DEFAULT true,
  observacoes TEXT,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on banda_integrante
ALTER TABLE public.banda_integrante ENABLE ROW LEVEL SECURITY;

-- Create policies for banda_integrante
CREATE POLICY "Users can view banda_integrante from their tenant" 
ON public.banda_integrante 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() AND profiles.tenant_id = banda_integrante.tenant_id
));

CREATE POLICY "Users can create banda_integrante in their tenant" 
ON public.banda_integrante 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() AND profiles.tenant_id = banda_integrante.tenant_id
));

CREATE POLICY "Users can update banda_integrante in their tenant" 
ON public.banda_integrante 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() AND profiles.tenant_id = banda_integrante.tenant_id
));

CREATE POLICY "Users can delete banda_integrante in their tenant" 
ON public.banda_integrante 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() AND profiles.tenant_id = banda_integrante.tenant_id
));

-- Add trigger for updated_at on banda_integrante
CREATE TRIGGER update_banda_integrante_updated_at
BEFORE UPDATE ON public.banda_integrante
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add foreign key constraint to banda_integrante table for banda_id
-- (This constraint was already attempted in a previous migration but the table didn't exist)
ALTER TABLE public.banda_integrante 
ADD CONSTRAINT fk_banda_integrante_banda 
FORIGN KEY (banda_id) REFERENCES public.banda(id) ON DELETE CASCADE;

-- Add index for better performance
CREATE INDEX idx_banda_integrante_banda_id ON public.banda_integrante(banda_id);
CREATE INDEX idx_banda_integrante_tenant_id ON public.banda_integrante(tenant_id);
CREATE INDEX idx_banda_integrante_ativo ON public.banda_integrante(ativo);