-- Allow Edge Functions (using service_role) to manage sms_logs
DROP POLICY IF EXISTS "Service role can manage sms_logs" ON public.sms_logs;
CREATE POLICY "Service role can manage sms_logs" ON public.sms_logs
  FOR ALL USING (true) WITH CHECK (true);

-- inbox_messages
DROP POLICY IF EXISTS "Service role can manage inbox" ON public.inbox_messages;
CREATE POLICY "Service role can manage inbox" ON public.inbox_messages
  FOR ALL USING (true) WITH CHECK (true);

-- auto_reply_rules: read-only for Edge Functions
DROP POLICY IF EXISTS "Service role can read auto_reply" ON public.auto_reply_rules;
CREATE POLICY "Service role can read auto_reply" ON public.auto_reply_rules
  FOR SELECT USING (true);

-- contacts: Edge Functions need read/write for auto-reply actions
DROP POLICY IF EXISTS "Service role can manage contacts" ON public.contacts;
CREATE POLICY "Service role can manage contacts" ON public.contacts
  FOR ALL USING (true) WITH CHECK (true);

-- audit_logs: insert-only for Edge Functions
DROP POLICY IF EXISTS "Service role can insert audit" ON public.audit_logs;
CREATE POLICY "Service role can insert audit" ON public.audit_logs
  FOR INSERT WITH CHECK (true);