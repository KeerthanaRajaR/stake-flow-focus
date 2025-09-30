-- Create companies table
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  founders_shares NUMERIC NOT NULL,
  total_shares NUMERIC NOT NULL,
  initial_valuation NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create safe_investments table
CREATE TABLE public.safe_investments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  investor_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  discount NUMERIC NOT NULL,
  valuation_cap NUMERIC,
  converted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pricing_rounds table
CREATE TABLE public.pricing_rounds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  pre_money_valuation NUMERIC NOT NULL,
  investment NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pricing_round_investors table
CREATE TABLE public.pricing_round_investors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pricing_round_id UUID NOT NULL REFERENCES public.pricing_rounds(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  investment NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safe_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_round_investors ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for companies
CREATE POLICY "Users can view their own companies"
  ON public.companies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own companies"
  ON public.companies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own companies"
  ON public.companies FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own companies"
  ON public.companies FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for safe_investments
CREATE POLICY "Users can view safe investments for their companies"
  ON public.safe_investments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = safe_investments.company_id
      AND companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert safe investments for their companies"
  ON public.safe_investments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = safe_investments.company_id
      AND companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update safe investments for their companies"
  ON public.safe_investments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = safe_investments.company_id
      AND companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete safe investments for their companies"
  ON public.safe_investments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = safe_investments.company_id
      AND companies.user_id = auth.uid()
    )
  );

-- Create RLS policies for pricing_rounds
CREATE POLICY "Users can view pricing rounds for their companies"
  ON public.pricing_rounds FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = pricing_rounds.company_id
      AND companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert pricing rounds for their companies"
  ON public.pricing_rounds FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = pricing_rounds.company_id
      AND companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update pricing rounds for their companies"
  ON public.pricing_rounds FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = pricing_rounds.company_id
      AND companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete pricing rounds for their companies"
  ON public.pricing_rounds FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = pricing_rounds.company_id
      AND companies.user_id = auth.uid()
    )
  );

-- Create RLS policies for pricing_round_investors
CREATE POLICY "Users can view investors for their pricing rounds"
  ON public.pricing_round_investors FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pricing_rounds
      JOIN public.companies ON companies.id = pricing_rounds.company_id
      WHERE pricing_rounds.id = pricing_round_investors.pricing_round_id
      AND companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert investors for their pricing rounds"
  ON public.pricing_round_investors FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pricing_rounds
      JOIN public.companies ON companies.id = pricing_rounds.company_id
      WHERE pricing_rounds.id = pricing_round_investors.pricing_round_id
      AND companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update investors for their pricing rounds"
  ON public.pricing_round_investors FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.pricing_rounds
      JOIN public.companies ON companies.id = pricing_rounds.company_id
      WHERE pricing_rounds.id = pricing_round_investors.pricing_round_id
      AND companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete investors for their pricing rounds"
  ON public.pricing_round_investors FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.pricing_rounds
      JOIN public.companies ON companies.id = pricing_rounds.company_id
      WHERE pricing_rounds.id = pricing_round_investors.pricing_round_id
      AND companies.user_id = auth.uid()
    )
  );

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_safe_investments_updated_at
  BEFORE UPDATE ON public.safe_investments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pricing_rounds_updated_at
  BEFORE UPDATE ON public.pricing_rounds
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pricing_round_investors_updated_at
  BEFORE UPDATE ON public.pricing_round_investors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX idx_companies_user_id ON public.companies(user_id);
CREATE INDEX idx_safe_investments_company_id ON public.safe_investments(company_id);
CREATE INDEX idx_pricing_rounds_company_id ON public.pricing_rounds(company_id);
CREATE INDEX idx_pricing_round_investors_pricing_round_id ON public.pricing_round_investors(pricing_round_id);