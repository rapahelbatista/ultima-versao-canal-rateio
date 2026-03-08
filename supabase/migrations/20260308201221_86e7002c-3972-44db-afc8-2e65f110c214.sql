
CREATE TABLE public.purchase_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  document_type text NOT NULL CHECK (document_type IN ('cpf', 'cnpj')),
  document_number text NOT NULL,
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text,
  usage_type text NOT NULL CHECK (usage_type IN ('internal', 'resale')),
  how_found_us text,
  agreed_anti_piracy boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone (public) to insert (the form is public)
CREATE POLICY "Anyone can submit purchase request"
  ON public.purchase_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can view submissions
CREATE POLICY "Admins can view purchase requests"
  ON public.purchase_requests
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
