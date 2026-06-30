-- =====================================================
-- VIEWS MANQUANTES — exécuter dans le SQL Editor Supabase
-- =====================================================

-- Vue : engagement par utilisateur (utilisée par Dashboard)
CREATE OR REPLACE VIEW public.v_user_engagement AS
SELECT
  u.id AS user_id,
  COUNT(DISTINCT c.id) AS total_contacts,
  COUNT(DISTINCT c.id) FILTER (WHERE c.opted_in) AS active_contacts,
  COUNT(DISTINCT camp.id) AS total_campaigns,
  COUNT(DISTINCT camp.id) FILTER (WHERE camp.status = 'sent') AS sent_campaigns,
  COALESCE(SUM(s.total_sent), 0) AS total_sms_sent,
  COALESCE(SUM(s.total_delivered), 0) AS total_delivered,
  COALESCE(SUM(s.total_read), 0) AS total_read,
  COALESCE(SUM(s.total_clicked), 0) AS total_clicked,
  COALESCE(SUM(s.total_cost), 0) AS total_cost
FROM public.users u
LEFT JOIN public.contacts c ON c.user_id = u.id
LEFT JOIN public.campaigns camp ON camp.user_id = u.id
LEFT JOIN public.campaign_stats s ON s.campaign_id = camp.id
GROUP BY u.id;

-- Vue : timeline des envois (30 derniers jours, utilisée par Dashboard)
CREATE OR REPLACE VIEW public.v_send_timeline AS
SELECT
  DATE(sl.sent_at) AS date,
  camp.user_id,
  COUNT(*) AS sent,
  COUNT(*) FILTER (WHERE sl.status = 'delivered') AS delivered,
  COUNT(*) FILTER (WHERE (sl.engagement->>'read_at') IS NOT NULL) AS read_count
FROM public.sms_logs sl
JOIN public.campaigns camp ON camp.id = sl.campaign_id
WHERE sl.sent_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(sl.sent_at), camp.user_id
ORDER BY date DESC;

-- Politique : service role bypass RLS pour les webhooks
DROP POLICY IF EXISTS "Service role can insert sms_logs" ON public.sms_logs;
CREATE POLICY "Service role can insert sms_logs" ON public.sms_logs
  FOR INSERT WITH CHECK (true);
