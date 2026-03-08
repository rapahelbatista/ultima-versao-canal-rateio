
-- Table for unique form links that admins generate
CREATE TABLE public.purchase_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  client_label text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.purchase_links ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins full access on purchase_links"
  ON public.purchase_links
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Public can read by token (needed to load the form)
CREATE POLICY "Public can read purchase_links by token"
  ON public.purchase_links
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Public can update status to completed (when form is submitted)
CREATE POLICY "Public can complete purchase_links"
  ON public.purchase_links
  FOR UPDATE
  TO anon, authenticated
  USING (status = 'pending')
  WITH CHECK (status = 'completed');

-- Add link_id to purchase_requests
ALTER TABLE public.purchase_requests 
  ADD COLUMN link_id uuid REFERENCES public.purchase_links(id);
