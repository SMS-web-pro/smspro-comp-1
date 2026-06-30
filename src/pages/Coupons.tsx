import { useState, useMemo } from 'react'
import {
  Ticket,
  Plus,
  Search,
  Copy,
  Trash2,
  Edit2,
  Gift,
  Percent,
  DollarSign,
  Truck,
  Calendar,
  Users,
  TrendingUp,
  CheckCircle2,
  Sparkles,
  ShoppingBag,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useStore } from '@/store/useStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/utils/cn'
import { formatCurrency } from '@/lib/utils'
import type { Coupon } from '@/types'

const typeConfig = {
  percentage: { icon: Percent, label: 'Pourcentage', color: 'blue', example: '-20%' },
  fixed_amount: { icon: DollarSign, label: 'Montant fixe', color: 'emerald', example: '-5€' },
  free_shipping: { icon: Truck, label: 'Livraison offerte', color: 'purple', example: 'GRATUIT' },
  gift: { icon: Gift, label: 'Cadeau', color: 'amber', example: 'GIFT' },
}

export function CouponsPage() {
  const { coupons, contacts, addCoupon, updateCoupon, deleteCoupon, useCoupon, couponUsages, addToast } = useStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'inactive'>('all')
  const [showCreate, setShowCreate] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [testCode, setTestCode] = useState('')
  const [testContactId, setTestContactId] = useState<number | null>(null)

  const filtered = useMemo(() => {
    const now = new Date()
    return coupons.filter((c) => {
      const matchSearch = !search ||
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        c.description?.toLowerCase().includes(search.toLowerCase())
      let matchStatus = true
      if (statusFilter === 'active') {
        matchStatus = c.is_active && new Date(c.valid_until) > now
      } else if (statusFilter === 'expired') {
        matchStatus = new Date(c.valid_until) < now
      } else if (statusFilter === 'inactive') {
        matchStatus = !c.is_active
      }
      return matchSearch && matchStatus
    })
  }, [coupons, search, statusFilter])

  const stats = useMemo(() => {
    const now = new Date()
    const active = coupons.filter((c) => c.is_active && new Date(c.valid_until) > now)
    const totalUses = coupons.reduce((s, c) => s + c.current_uses, 0)
    const totalRevenue = couponUsages.reduce((s, u) => s + (u.order_value || 0), 0)
    return {
      total: coupons.length,
      active: active.length,
      totalUses,
      totalRevenue,
      conversionRate: coupons.length > 0 ? (totalUses / coupons.reduce((s, c) => s + (c.max_uses || 100), 0)) * 100 : 0,
    }
  }, [coupons, couponUsages])

  // Usage chart data
  const usageChartData = useMemo(() => {
    const last7days = Array.from({ length: 7 }).map((_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      const dateStr = date.toISOString().split('T')[0]
      const count = couponUsages.filter((u) => u.used_at.startsWith(dateStr)).length
      return {
        date: date.toLocaleDateString('fr-BE', { day: '2-digit', month: '2-digit' }),
        utilisations: count,
      }
    })
    return last7days
  }, [couponUsages])

  const handleDelete = (coupon: Coupon) => {
    if (!confirm(`Supprimer le coupon "${coupon.code}" ?\n${coupon.current_uses} utilisation(s) sera/perdue(s).`)) return
    deleteCoupon(coupon.id)
    addToast({ type: 'success', title: 'Coupon supprimé' })
  }

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    addToast({ type: 'success', title: 'Code copié !', description: code })
  }

  const handleTestUse = () => {
    if (!testCode || !testContactId) {
      addToast({ type: 'error', title: 'Sélectionnez un code et un contact' })
      return
    }
    const success = useCoupon(testCode, testContactId)
    if (success) {
      addToast({ type: 'success', title: 'Coupon utilisé !', description: `Le contact a bénéficié de la réduction` })
      setTestCode('')
      setTestContactId(null)
    } else {
      addToast({ type: 'error', title: 'Coupon invalide', description: 'Vérifiez la date, le statut et les limites' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Ticket className="h-6 w-6 text-amber-500" />
            Coupons & Promotions
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Créez et suivez vos codes promo envoyés par SMS
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>
          Nouveau coupon
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBox label="Coupons actifs" value={stats.active} sub={`sur ${stats.total}`} icon={Ticket} color="amber" />
        <StatBox label="Utilisations totales" value={stats.totalUses} sub="tous coupons" icon={Users} color="blue" />
        <StatBox label="Revenu généré" value={formatCurrency(stats.totalRevenue)} sub="commandes avec coupon" icon={ShoppingBag} color="emerald" />
        <StatBox label="Taux d'utilisation" value={`${stats.conversionRate.toFixed(1)}%`} sub="codes utilisés" icon={TrendingUp} color="purple" />
      </div>

      {/* Usage chart */}
      {couponUsages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Utilisations des 7 derniers jours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={usageChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="utilisations" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test coupon */}
      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
        <CardContent className="p-5">
          <div className="flex items-start gap-3 mb-3">
            <Sparkles className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900">Tester l'utilisation d'un coupon</p>
              <p className="text-xs text-amber-700">Simulez une utilisation pour vérifier que tout fonctionne</p>
            </div>
          </div>
          <div className="flex items-end gap-2 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Code du coupon"
                value={testCode}
                onChange={(e) => setTestCode(e.target.value.toUpperCase())}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Select
                value={testContactId?.toString() || ''}
                onChange={(e) => setTestContactId(Number(e.target.value))}
                options={[
                  { value: '', label: 'Sélectionner un contact...' },
                  ...contacts.filter((c) => c.opted_in).slice(0, 50).map((c) => ({
                    value: c.id.toString(),
                    label: `${c.first_name} ${c.last_name} (${c.phone})`,
                  })),
                ]}
              />
            </div>
            <Button onClick={handleTestUse} leftIcon={<CheckCircle2 className="h-4 w-4" />}>
              Tester
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search & filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Rechercher un coupon..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              options={[
                { value: 'all', label: 'Tous les statuts' },
                { value: 'active', label: '✓ Actifs' },
                { value: 'expired', label: '⚠️ Expirés' },
                { value: 'inactive', label: '✗ Désactivés' },
              ]}
            />
            <div className="flex rounded-lg border border-slate-300 p-0.5">
              <button
                onClick={() => setView('grid')}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                  view === 'grid' ? 'bg-primary-100 text-primary-700' : 'text-slate-600 hover:bg-slate-50'
                )}
              >
                Cartes
              </button>
              <button
                onClick={() => setView('list')}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                  view === 'list' ? 'bg-primary-100 text-primary-700' : 'text-slate-600 hover:bg-slate-50'
                )}
              >
                Liste
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coupons list */}
      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={Ticket}
            title="Aucun coupon"
            description="Créez votre premier code promotionnel."
            action={{ label: 'Nouveau coupon', onClick: () => setShowCreate(true) }}
          />
        </Card>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((coupon) => (
            <CouponCard
              key={coupon.id}
              coupon={coupon}
              usages={couponUsages.filter((u) => u.coupon_id === coupon.id)}
              onCopy={() => handleCopy(coupon.code)}
              onEdit={() => setEditingCoupon(coupon)}
              onDelete={() => handleDelete(coupon)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Code</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Type</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Valeur</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Validité</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Utilisations</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Statut</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <code className="font-mono font-bold text-sm bg-slate-100 px-2 py-1 rounded">{c.code}</code>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="info" size="sm">{typeConfig[c.type].label}</Badge>
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {c.type === 'percentage' ? `-${c.value}%` :
                       c.type === 'fixed_amount' ? `-${formatCurrency(c.value)}` :
                       c.type === 'free_shipping' ? 'OFFERT' :
                       c.value}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      Jusqu'au {new Date(c.valid_until).toLocaleDateString('fr-BE')}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold">{c.current_uses}</span>
                      {c.max_uses && <span className="text-slate-500">/{c.max_uses}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <CouponStatusBadge coupon={c} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button onClick={() => handleCopy(c.code)} className="rounded p-1.5 hover:bg-slate-100" title="Copier">
                          <Copy className="h-4 w-4 text-slate-500" />
                        </button>
                        <button onClick={() => setEditingCoupon(c)} className="rounded p-1.5 hover:bg-slate-100" title="Modifier">
                          <Edit2 className="h-4 w-4 text-slate-500" />
                        </button>
                        <button onClick={() => handleDelete(c)} className="rounded p-1.5 hover:bg-red-50" title="Supprimer">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create/Edit modal */}
      <CouponFormModal
        open={showCreate || editingCoupon !== null}
        coupon={editingCoupon}
        onClose={() => {
          setShowCreate(false)
          setEditingCoupon(null)
        }}
        onSave={(data) => {
          if (editingCoupon) {
            updateCoupon(editingCoupon.id, data)
            addToast({ type: 'success', title: 'Coupon mis à jour' })
          } else {
            addCoupon(data as any)
            addToast({ type: 'success', title: 'Coupon créé !' })
          }
          setShowCreate(false)
          setEditingCoupon(null)
        }}
      />
    </div>
  )
}

function CouponCard({
  coupon,
  usages,
  onCopy,
  onEdit,
  onDelete,
}: {
  coupon: Coupon
  usages: any[]
  onCopy: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const tc = typeConfig[coupon.type]
  const Icon = tc.icon
  const usagePercent = coupon.max_uses ? (coupon.current_uses / coupon.max_uses) * 100 : 0
  const totalRevenue = usages.reduce((s, u) => s + (u.order_value || 0), 0)

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        {/* Header visuel */}
        <div className={cn(
          'rounded-lg p-4 mb-4 relative overflow-hidden',
          tc.color === 'blue' ? 'bg-gradient-to-br from-blue-500 to-blue-700' :
          tc.color === 'emerald' ? 'bg-gradient-to-br from-emerald-500 to-emerald-700' :
          tc.color === 'purple' ? 'bg-gradient-to-br from-purple-500 to-purple-700' :
          'bg-gradient-to-br from-amber-500 to-orange-600'
        )}>
          <div className="absolute -right-4 -top-4 opacity-20">
            <Icon className="h-24 w-24 text-white" />
          </div>
          <div className="relative">
            <p className="text-xs text-white/80 font-medium uppercase tracking-wider">
              {tc.label}
            </p>
            <p className="text-3xl font-bold text-white mt-1">
              {coupon.type === 'percentage' ? `-${coupon.value}%` :
               coupon.type === 'fixed_amount' ? `-${formatCurrency(coupon.value)}` :
               coupon.type === 'free_shipping' ? 'OFFERT' :
               coupon.value}
            </p>
          </div>
        </div>

        {/* Code */}
        <div className="flex items-center justify-between mb-3">
          <code className="font-mono font-bold text-sm bg-slate-100 px-3 py-1.5 rounded border-2 border-dashed border-slate-300">
            {coupon.code}
          </code>
          <button onClick={onCopy} className="rounded p-1.5 hover:bg-slate-100" aria-label="Copier le code">
            <Copy className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        {coupon.description && (
          <p className="text-sm text-slate-700 mb-3 line-clamp-2">{coupon.description}</p>
        )}

        {/* Usage bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-600">Utilisations</span>
            <span className="font-semibold text-slate-900">
              {coupon.current_uses}{coupon.max_uses && ` / ${coupon.max_uses}`}
            </span>
          </div>
          {coupon.max_uses && (
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all',
                  usagePercent > 80 ? 'bg-amber-500' :
                  usagePercent > 50 ? 'bg-blue-500' : 'bg-emerald-500'
                )}
                style={{ width: `${Math.min(100, usagePercent)}%` }}
              />
            </div>
          )}
        </div>

        {/* Stats */}
        {totalRevenue > 0 && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2 mb-3 flex items-center justify-between">
            <span className="text-xs text-emerald-700">Revenu généré</span>
            <span className="text-sm font-bold text-emerald-900">{formatCurrency(totalRevenue)}</span>
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(coupon.valid_until).toLocaleDateString('fr-BE')}
          </span>
          <CouponStatusBadge coupon={coupon} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onEdit} leftIcon={<Edit2 className="h-3.5 w-3.5" />} fullWidth>
            Modifier
          </Button>
          <button
            onClick={onDelete}
            className="rounded-lg p-2 text-slate-500 hover:text-red-600 hover:bg-red-50"
            aria-label="Supprimer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  )
}

function CouponStatusBadge({ coupon }: { coupon: Coupon }) {
  const now = new Date()
  const expired = new Date(coupon.valid_until) < now
  const exhausted = coupon.max_uses && coupon.current_uses >= coupon.max_uses
  if (!coupon.is_active) return <Badge variant="gray" size="sm">Désactivé</Badge>
  if (expired) return <Badge variant="danger" size="sm">Expiré</Badge>
  if (exhausted) return <Badge variant="warning" size="sm">Épuisé</Badge>
  return <Badge status="active" size="sm" />
}

function StatBox({ label, value, sub, icon: Icon, color }: { label: string; value: string | number; sub: string; icon: any; color: 'amber' | 'blue' | 'emerald' | 'purple' }) {
  const colorMap = {
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600',
  }
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorMap[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <p className="text-sm font-medium text-slate-600">{label}</p>
        <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
        <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
      </CardContent>
    </Card>
  )
}

function CouponFormModal({
  open,
  coupon,
  onClose,
  onSave,
}: {
  open: boolean
  coupon: Coupon | null
  onClose: () => void
  onSave: (data: Omit<Coupon, 'id' | 'current_uses' | 'created_at'>) => void
}) {
  const [form, setForm] = useState({
    code: coupon?.code || '',
    type: coupon?.type || ('percentage' as const),
    value: coupon?.value || 10,
    description: coupon?.description || '',
    valid_from: coupon?.valid_from?.split('T')[0] || new Date().toISOString().split('T')[0],
    valid_until: coupon?.valid_until?.split('T')[0] || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    max_uses: coupon?.max_uses?.toString() || '',
    per_contact_limit: coupon?.per_contact_limit || 1,
    terms: coupon?.terms || '',
    is_active: coupon?.is_active ?? true,
  })

  useMemo(() => {
    setForm({
      code: coupon?.code || '',
      type: coupon?.type || 'percentage',
      value: coupon?.value || 10,
      description: coupon?.description || '',
      valid_from: coupon?.valid_from?.split('T')[0] || new Date().toISOString().split('T')[0],
      valid_until: coupon?.valid_until?.split('T')[0] || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      max_uses: coupon?.max_uses?.toString() || '',
      per_contact_limit: coupon?.per_contact_limit || 1,
      terms: coupon?.terms || '',
      is_active: coupon?.is_active ?? true,
    })
  }, [coupon, open])

  const handleSubmit = () => {
    if (!form.code.trim()) return
    onSave({
      user_id: 'user-1',
      campaign_id: coupon?.campaign_id,
      code: form.code.toUpperCase().trim(),
      type: form.type,
      value: Number(form.value),
      description: form.description,
      valid_from: new Date(form.valid_from).toISOString(),
      valid_until: new Date(form.valid_until).toISOString(),
      max_uses: form.max_uses ? Number(form.max_uses) : undefined,
      per_contact_limit: form.per_contact_limit,
      is_active: form.is_active,
      terms: form.terms,
    })
  }

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 10; i++) code += chars[Math.floor(Math.random() * chars.length)]
    setForm({ ...form, code })
  }

  return (
    <Modal open={open} onClose={onClose} title={coupon ? 'Modifier le coupon' : 'Nouveau coupon'} size="lg">
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            label="Code du coupon *"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            placeholder="PROMO20"
            helperText="Le code tapé par le client"
            className="flex-1"
          />
          <div className="flex items-end">
            <Button variant="outline" onClick={generateCode} size="md">
              🎲 Générer
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Type"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as any })}
            options={[
              { value: 'percentage', label: '% Pourcentage' },
              { value: 'fixed_amount', label: '€ Montant fixe' },
              { value: 'free_shipping', label: '🚚 Livraison offerte' },
              { value: 'gift', label: '🎁 Cadeau' },
            ]}
          />
          <Input
            label={form.type === 'percentage' ? 'Réduction (%)' : form.type === 'fixed_amount' ? 'Réduction (€)' : 'Valeur'}
            type="number"
            value={form.value}
            onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
          />
        </div>

        <Input
          label="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Ex: Black Friday - 25% sur tout"
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Valide du"
            type="date"
            value={form.valid_from}
            onChange={(e) => setForm({ ...form, valid_from: e.target.value })}
          />
          <Input
            label="Valide jusqu'au"
            type="date"
            value={form.valid_until}
            onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Max utilisations"
            type="number"
            value={form.max_uses}
            onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
            placeholder="Illimité si vide"
          />
          <Input
            label="Max par contact"
            type="number"
            value={String(form.per_contact_limit)}
            onChange={(e) => setForm({ ...form, per_contact_limit: Number(e.target.value) })}
          />
        </div>

        <Textarea
          label="Conditions d'utilisation"
          value={form.terms}
          onChange={(e) => setForm({ ...form, terms: e.target.value })}
          placeholder="Non cumulable. Valable sur tout le catalogue."
          rows={2}
        />
      </div>

      <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-slate-200">
        <Button variant="outline" onClick={onClose}>Annuler</Button>
        <Button onClick={handleSubmit} disabled={!form.code.trim()}>
          {coupon ? 'Enregistrer' : 'Créer le coupon'}
        </Button>
      </div>
    </Modal>
  )
}
