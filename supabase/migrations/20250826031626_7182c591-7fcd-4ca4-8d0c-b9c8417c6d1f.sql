-- Create transactions table for financial movements
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  type text CHECK (type IN ('income','expense')) NOT NULL,
  category text NOT NULL,
  description text,
  banda_id uuid REFERENCES public.banda(id),
  evento_id uuid REFERENCES public.evento(id),
  counterparty text,
  gross_amount numeric NOT NULL,
  fee_amount numeric DEFAULT 0,
  net_amount numeric GENERATED ALWAYS AS (gross_amount - fee_amount) STORED,
  status text CHECK (status IN ('pending','scheduled','settled')) DEFAULT 'pending',
  transaction_date date NOT NULL,
  settled_at timestamptz,
  attachment_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create payouts table for cachês and repasses
CREATE TABLE IF NOT EXISTS public.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  evento_id uuid NOT NULL REFERENCES public.evento(id),
  transaction_id uuid REFERENCES public.transactions(id),
  beneficiary_type text CHECK (beneficiary_type IN ('band','member','crew','manager')) NOT NULL,
  beneficiary_name text NOT NULL,
  beneficiary_id text,
  amount numeric NOT NULL,
  due_date date NOT NULL,
  status text CHECK (status IN ('pending','settled')) DEFAULT 'pending',
  payment_method text,
  settled_at timestamptz,
  receipt_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- RLS policies for transactions
CREATE POLICY "Users can view transactions from their tenant" 
ON public.transactions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid() AND profiles.tenant_id = transactions.tenant_id
));

CREATE POLICY "Users can create transactions in their tenant" 
ON public.transactions 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid() AND profiles.tenant_id = transactions.tenant_id
));

CREATE POLICY "Users can update transactions in their tenant" 
ON public.transactions 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid() AND profiles.tenant_id = transactions.tenant_id
));

CREATE POLICY "Users can delete transactions in their tenant" 
ON public.transactions 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid() AND profiles.tenant_id = transactions.tenant_id
));

-- RLS policies for payouts
CREATE POLICY "Users can view payouts from their tenant" 
ON public.payouts 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid() AND profiles.tenant_id = payouts.tenant_id
));

CREATE POLICY "Users can create payouts in their tenant" 
ON public.payouts 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid() AND profiles.tenant_id = payouts.tenant_id
));

CREATE POLICY "Users can update payouts in their tenant" 
ON public.payouts 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid() AND profiles.tenant_id = payouts.tenant_id
));

CREATE POLICY "Users can delete payouts in their tenant" 
ON public.payouts 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid() AND profiles.tenant_id = payouts.tenant_id
));

-- Create updated_at trigger for transactions
CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create updated_at trigger for payouts
CREATE TRIGGER update_payouts_updated_at
BEFORE UPDATE ON public.payouts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_transactions_tenant_date ON public.transactions(tenant_id, transaction_date DESC);
CREATE INDEX idx_transactions_banda ON public.transactions(banda_id);
CREATE INDEX idx_transactions_evento ON public.transactions(evento_id);
CREATE INDEX idx_payouts_tenant ON public.payouts(tenant_id);
CREATE INDEX idx_payouts_evento ON public.payouts(evento_id);
CREATE INDEX idx_payouts_due_date ON public.payouts(due_date);