import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart3,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Send,
  Wallet,
  Clock,
  ArrowUpRight,
  Calendar,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useStore } from '@/store/useStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { generateTimelineData } from '@/lib/mockData'
import { formatCurrency, formatNumber } from '@/lib/utils'

export function AnalyticsPage() {
  const { campaigns } = useStore()

  const stats = useMemo(() => {
    const sentCampaigns = campaigns.filter((c) => c.stats)
    const totalSent = sentCampaigns.reduce((s, c) => s + (c.stats?.total_sent || 0), 0)
    const totalDelivered = sentCampaigns.reduce((s, c) => s + (c.stats?.total_delivered || 0), 0)
    const totalFailed = sentCampaigns.reduce((s, c) => s + (c.stats?.total_failed || 0), 0)
    const totalCost = sentCampaigns.reduce((s, c) => s + (c.stats?.total_cost || 0), 0)
    const deliveryRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 10000) / 100 : 0
    return { totalSent, totalDelivered, totalFailed, totalCost, deliveryRate }
  }, [campaigns])

  const timelineData = useMemo(() => generateTimelineData(), [])

  const pieData = [
    { name: 'Délivrés', value: stats.totalDelivered, color: '#10b981' },
    { name: 'Échoués', value: stats.totalFailed, color: '#ef4444' },
    { name: 'En attente', value: Math.max(0, stats.totalSent - stats.totalDelivered - stats.totalFailed), color: '#f59e0b' },
  ].filter((d) => d.value > 0)

  const topCampaigns = useMemo(
    () => campaigns.filter((c) => c.stats).sort((a, b) => (b.stats?.total_sent || 0) - (a.stats?.total_sent || 0)).slice(0, 5),
    [campaigns]
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Vue d'ensemble des performances de vos campagnes SMS</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="SMS envoyés"
          value={formatNumber(stats.totalSent)}
          icon={Send}
          color="blue"
        />
        <KpiCard
          title="Délivrés"
          value={formatNumber(stats.totalDelivered)}
          subtitle={`${stats.deliveryRate}% de réussite`}
          icon={CheckCircle2}
          color="green"
        />
        <KpiCard
          title="Échoués"
          value={formatNumber(stats.totalFailed)}
          subtitle={`${stats.totalSent > 0 ? Math.round((stats.totalFailed / stats.totalSent) * 10000) / 100 : 0}% du total`}
          icon={XCircle}
          color="red"
        />
        <KpiCard
          title="Coût total"
          value={formatCurrency(stats.totalCost)}
          subtitle={`${formatNumber(Math.round(stats.totalCost / 0.08))} SMS facturés`}
          icon={Wallet}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary-600" />
              Évolution sur 30 jours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="colorSent2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorDelivered2" x1="0" y1="0" x2="0" y2="1">
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
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Area type="monotone" dataKey="sent" name="Envoyés" stroke="#3b82f6" strokeWidth={2} fill="url(#colorSent2)" />
                  <Area type="monotone" dataKey="delivered" name="Délivrés" stroke="#10b981" strokeWidth={2} fill="url(#colorDelivered2)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pie */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition globale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: d.color }} />
                    <span className="text-slate-700">{d.name}</span>
                  </div>
                  <span className="font-semibold text-slate-900">{formatNumber(d.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top campaigns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary-600" />
            Top campagnes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Nom</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Statut</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Envoyés</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Taux</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Coût</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600"></th>
                </tr>
              </thead>
              <tbody>
                {topCampaigns.map((camp) => (
                  <tr key={camp.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{camp.name}</td>
                    <td className="px-4 py-3"><Badge status={camp.status} size="sm" /></td>
                    <td className="px-4 py-3 text-slate-700">{camp.stats?.total_sent}</td>
                    <td className="px-4 py-3 text-emerald-600 font-medium">{camp.stats?.delivery_rate}%</td>
                    <td className="px-4 py-3 text-slate-700">{formatCurrency(camp.stats?.total_cost || 0)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/campaigns/${camp.id}`} className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700">
                        Détails <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="text-sm font-semibold text-slate-900">Meilleur taux</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.deliveryRate}%</p>
            <p className="text-xs text-slate-500 mt-1">Au-dessus de la moyenne du secteur (95%)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-sm font-semibold text-slate-900">Meilleur moment</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">14h-16h</p>
            <p className="text-xs text-slate-500 mt-1">Taux d'ouverture optimal en semaine</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50">
                <Clock className="h-4 w-4 text-purple-600" />
              </div>
              <p className="text-sm font-semibold text-slate-900">Temps moyen</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">2.4s</p>
            <p className="text-xs text-slate-500 mt-1">Délai moyen de délivrance</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string
  value: string
  subtitle?: string
  icon: any
  color: 'blue' | 'green' | 'red' | 'orange' | 'purple'
}) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    red: 'bg-red-50 text-red-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  }
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorMap[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <p className="text-sm font-medium text-slate-600">{title}</p>
        <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  )
}
