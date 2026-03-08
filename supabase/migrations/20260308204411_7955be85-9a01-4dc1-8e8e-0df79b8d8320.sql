
CREATE TABLE public.whatsapp_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zapmeow_url text NOT NULL,
  instance_id text NOT NULL DEFAULT 'equipechat',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_config ENABLE ROW LEVEL SECURITY;

-- Admins can manage config
CREATE POLICY "Admins full access on whatsapp_config"
  ON public.whatsapp_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Service role can read (for edge functions)
CREATE POLICY "Service role read whatsapp_config"
  ON public.whatsapp_config FOR SELECT TO service_role
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_whatsapp_config_updated_at
  BEFORE UPDATE ON public.whatsapp_config
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
