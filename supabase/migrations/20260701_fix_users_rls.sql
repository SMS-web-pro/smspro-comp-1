-- Add INSERT policy for users table (needed for upsert from client)
-- The handle_new_user() trigger uses SECURITY DEFINER, but client-side upsert needs this
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
CREATE POLICY "Users can insert own data" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);
