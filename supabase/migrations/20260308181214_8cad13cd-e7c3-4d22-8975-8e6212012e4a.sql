
-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- Create a PERMISSIVE policy instead so admins can actually read roles
CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
  );
