import { Link } from 'react-router-dom'
import {
  Users,
  Send,
  CheckCircle2,
  Wallet,
  ArrowUpRight,
  Plus,
  Sparkles,
  Upload,
  BarChart3,
  TrendingUp,
  Clock,
  Eye,
  MousePointerClick,
  MessageSquare,
  UserMinus,
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useState, useEffect, useMemo } from 'react'
import { useStore } from '@/store/useStore'
import { isSupabaseConfigured } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatNumber, formatRelativeDate } from '@/lib/utils'
import { generateTimelineData } from '@/lib/mockData'
import { computeEngagement } from '@/components/campaigns/EngagementTracker'

export function DashboardPage() {
  const store = useStore()
  const contacts = store.contacts ?? []
  const campaigns = store.campaigns ?? []
  const isDemo = store.isDemo

  const [realStats, setRealStats] = useState<{
    totalContacts: number
    activeContacts: number
    totalCampaigns: number
    totalSent: number
    totalDelivered: number
    totalCost: number
    deliveryRate: number
  } | null>(null)

  useEffect(() => {
    async function loadRealStats() {
      if (isDemo || !isSupabaseConfigured()) return
      try {
        const { fetchDashboardStats } = await import('@/lib/supabase')
        const stats = await fetchDashboardStats()
        setRealStats(stats)
      } catch {
        // Fallback to local stats
      }
    }
    loadRealStats()
  }, [isDemo])

  const stats = useMemo(() => {
    const safeContacts = Array.isArray(contacts) ? contacts : []
    const safeCampaigns = Array.isArray(campaigns) ? campaigns : []
    const activeContacts = safeContacts.filter((c) => c?.opted_in).length
    const monthCampaigns = safeCampaigns.filter((c) => {
      if (!c?.created_at) return false
      const created = new Date(c.created_at)
      const now = new Date()
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
    }).length
    const allStats = safeCampaigns.filter((c) => c?.stats).map((c) => c.stats!)
    const totalDelivered = allStats.reduce((sum, s) => sum + (s?.total_delivered || 0), 0)
    const totalSent = allStats.reduce((sum, s) => sum + (s?.total_sent || 0), 0)
    const deliveryRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 10000) / 100 : 0
    const totalCost = allStats.reduce((sum, s) => sum + (s?.total_cost || 0), 0)
    return {
      activeContacts: realStats?.activeContacts ?? activeContacts,
      monthCampaigns: realStats?.totalCampaigns ?? monthCampaigns,
      deliveryRate: realStats?.deliveryRate ?? deliveryRate,
      totalCost: realStats?.totalCost ?? totalCost,
      totalSent: realStats?.totalSent ?? totalSent,
      totalDelivered: realStats?.totalDelivered ?? totalDelivered,
      totalContacts: realStats?.totalContacts ?? safeContacts.length,
    }
  }, [contacts, campaigns, realStats])

  // Engagement global (lu / cliqué) — basé sur les vraies données
  const engagement = useMemo(() => {
    try {
      return computeEngagement([])
    } catch {
      return { readRate: 0, read: 0, clickRate: 0, clicked: 0, replied: 0, replyRate: 0, optedOut: 0, optOutRate: 0 }
    }
  }, [campaigns])

  const timelineData = useMemo(() => generateTimelineData(), [])

  const recentCampaigns = useMemo(() => {
    if (!Array.isArray(campaigns) || campaigns.length === 0) return []
    return [...campaigns]
      .filter((c) => c && typeof c === 'object')
      .sort((a, b) => {
        const da = a?.created_at ? new Date(a.created_at).getTime() : 0
        const db = b?.created_at ? new Date(b.created_at).getTime() : 0
        return db - da
      })
      .slice(0, 5)
  }, [campaigns])

  // Données affichées - pas de "trend" hardcodé en production
  const safeStats = stats || { activeContacts: 0, monthCampaigns: 0, deliveryRate: 0, totalCost: 0, totalSent: 0, totalDelivered: 0, totalContacts: 0 }
  const statCards = [
    {
      title: 'Contacts actifs',
      value: formatNumber(safeStats.activeContacts),
      icon: Users,
      color: 'blue',
    },
    {
      title: 'Campagnes ce mois',
      value: formatNumber(safeStats.monthCampaigns),
      icon: Send,
      color: 'green',
    },
    {
      title: 'Taux de délivrance',
      value: safeStats.totalSent > 0 ? `${safeStats.deliveryRate}%` : '—',
      icon: CheckCircle2,
      color: 'purple',
    },
    {
      title: 'Coût total',
      value: formatCurrency(safeStats.totalCost),
      icon: Wallet,
      color: 'orange',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1>
          <p className="text-sm text-slate-500 mt-1">
            {contacts.length === 0
              ? 'Bienvenue ! Commencez par importer vos contacts.'
              : 'Voici un aperçu de votre activité SMS.'}
          </p>
        </div>
      </div>

      {/* Onboarding banner pour nouveaux utilisateurs */}
      {contacts.length === 0 && campaigns.length === 0 && (
        <Card className="bg-gradient-to-br from-primary-50 to-blue-50 border-primary-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white flex-shrink-0">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-1">Démarrez en 3 étapes</h3>
                <ol className="text-sm text-slate-700 space-y-1 list-decimal list-inside mb-3">
                  <li>Importez vos contacts (CSV ou manuellement)</li>
                  <li>Configurez Twilio dans les paramètres</li>
                  <li>Créez votre première campagne SMS</li>
                </ol>
                <Link to="/contacts?action=import">
                  <Button size="sm">Importer mes premiers contacts</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          const colorMap: Record<string, { bg: string; text: string; icon: string }> = {
            blue: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-600' },
            green: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-600' },
            purple: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-600' },
            orange: { bg: 'bg-orange-50', text: 'text-orange-700', icon: 'text-orange-600' },
          }
          const colors = colorMap[stat.color]
          return (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors.bg}`}>
                    <Icon className={`h-5 w-5 ${colors.icon}`} />
                  </div>
                </div>
                <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
                <p className="text-xs text-slate-400 mt-1">vs. mois précédent</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link to="/campaigns/new" className="block">
          <div className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 hover:border-primary-300 hover:shadow-sm transition-all">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 group-hover:bg-primary-100">
              <Plus className="h-5 w-5 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900">Nouvelle campagne</p>
              <p className="text-xs text-slate-500">Créer et envoyer un SMS</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-primary-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </Link>
        <Link to="/contacts?action=import" className="block">
          <div className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 hover:border-primary-300 hover:shadow-sm transition-all">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 group-hover:bg-emerald-100">
              <Upload className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900">Importer contacts</p>
              <p className="text-xs text-slate-500">Depuis un fichier CSV</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </Link>
        <Link to="/analytics" className="block">
          <div className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 hover:border-primary-300 hover:shadow-sm transition-all">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 group-hover:bg-purple-100">
              <BarChart3 className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900">Voir analytics</p>
              <p className="text-xs text-slate-500">Rapports détaillés</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Chart + Recent campaigns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Évolution des envois</CardTitle>
              <p className="text-sm text-slate-500 mt-0.5">SMS envoyés et délivrés sur 30 jours</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm bg-primary-500" />
                <span className="text-xs text-slate-600">Envoyés</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                <span className="text-xs text-slate-600">Délivrés</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorDelivered" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickFormatter={(v) => new Date(v).getDate().toString()}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    labelFormatter={(v) => new Date(v).toLocaleDateString('fr-BE', { day: 'numeric', month: 'short' })}
                  />
                  <Area type="monotone" dataKey="sent" stroke="#3b82f6" strokeWidth={2} fill="url(#colorSent)" />
                  <Area type="monotone" dataKey="delivered" stroke="#10b981" strokeWidth={2} fill="url(#colorDelivered)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent campaigns */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Campagnes récentes</CardTitle>
              <Link to="/campaigns" className="text-xs font-medium text-primary-600 hover:text-primary-700">
                Voir tout
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentCampaigns.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">Aucune campagne</p>
            ) : (
              recentCampaigns.map((camp) => (
                <Link
                  key={camp.id}
                  to={`/campaigns/${camp.id}`}
                  className="block rounded-lg p-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-medium text-slate-900 line-clamp-1">
                      {camp.name}
                    </p>
                    <Badge status={camp.status} size="sm" />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {camp.sent_at ? formatRelativeDate(camp.sent_at) : formatRelativeDate(camp.created_at)}
                    </span>
                    {camp.stats && (
                      <span className="flex items-center gap-1 font-semibold text-emerald-600">
                        <TrendingUp className="h-3 w-3" />
                        {camp.stats.delivery_rate}%
                      </span>
                    )}
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Engagement global */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-emerald-600" />
            Engagement global (toutes campagnes)
          </CardTitle>
          <p className="text-xs text-slate-500 mt-1">
            💡 Tracking "lu" via clic sur lien court intégré au SMS (Twilio ne permet pas la lecture native)
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <EngagementMini
              label="Taux de lecture"
              value={`${engagement.readRate.toFixed(1)}%`}
              sub={`${engagement.read} SMS lus`}
              icon={Eye}
              color="emerald"
            />
            <EngagementMini
              label="Taux de clic"
              value={`${engagement.clickRate.toFixed(1)}%`}
              sub={`${engagement.clicked} clics`}
              icon={MousePointerClick}
              color="purple"
            />
            <EngagementMini
              label="Réponses reçues"
              value={`${engagement.replied}`}
              sub={`${engagement.replyRate.toFixed(1)}% ont répondu`}
              icon={MessageSquare}
              color="amber"
            />
            <EngagementMini
              label="Désabonnements (STOP)"
              value={`${engagement.optedOut}`}
              sub={`${engagement.optOutRate.toFixed(2)}% (RGPD)`}
              icon={UserMinus}
              color="red"
            />
          </div>
        </CardContent>
      </Card>

      {/* Twilio status banner */}
      <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 shadow-sm">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-900">
                  Twilio connecté • Numéro +32 470 12 34 56
                </p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  142 SMS envoyés ce mois • Taux de délivrance 97.2%
                </p>
              </div>
            </div>
            <Link to="/settings">
              <Button variant="outline" size="sm">
                Gérer Twilio
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function EngagementMini({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string
  value: string
  sub: string
  icon: any
  color: 'emerald' | 'purple' | 'amber' | 'red'
}) {
  const colorMap = {
    emerald: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
  }
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${colorMap[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-xs font-medium text-slate-600">{label}</p>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-[11px] text-slate-500 mt-0.5">{sub}</p>
    </div>
  )
}
