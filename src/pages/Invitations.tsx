import { useState, useMemo } from 'react'
import {
  Mail,
  Plus,
  Search,
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Copy,
  Trash2,
  Sparkles,
  TrendingUp,
  Send,
  Link as LinkIcon,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { useStore } from '@/store/useStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/utils/cn'
import { formatRelativeDate, formatDate } from '@/lib/utils'
import type { Invitation } from '@/types'

const typeLabels = {
  event: { label: 'Événement', icon: Sparkles, color: 'purple' },
  appointment: { label: 'Rendez-vous', icon: Calendar, color: 'blue' },
  offer: { label: 'Offre spéciale', icon: TrendingUp, color: 'amber' },
  vip: { label: 'VIP', icon: Sparkles, color: 'rose' },
  reminder: { label: 'Rappel', icon: Clock, color: 'slate' },
}

const responseLabels: Record<string, { label: string; color: string; icon: any }> = {
  accepted: { label: 'Accepté', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  declined: { label: 'Refusé', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
  maybe: { label: 'Peut-être', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: HelpCircle },
  pending: { label: 'En attente', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Clock },
}

export function InvitationsPage() {
  const {
    invitations,
    contacts,
    addInvitation,
    deleteInvitation,
    respondToInvitation,
    addToast,
  } = useStore()
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [selectedInv, setSelectedInv] = useState<Invitation | null>(null)
  const [responseContactId, setResponseContactId] = useState<number | null>(null)
  const [responseType, setResponseType] = useState<'accepted' | 'declined' | 'maybe'>('accepted')

  const filtered = useMemo(() => {
    return invitations.filter((i) =>
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.description?.toLowerCase().includes(search.toLowerCase())
    )
  }, [invitations, search])

  const stats = useMemo(() => {
    const total = invitations.length
    const totalInvited = invitations.reduce((s, i) => s + i.responses.length, 0)
    const accepted = invitations.reduce(
      (s, i) => s + i.responses.filter((r) => r.response === 'accepted').length,
      0
    )
    const declined = invitations.reduce(
      (s, i) => s + i.responses.filter((r) => r.response === 'declined').length,
      0
    )
    const pending = invitations.reduce(
      (s, i) => s + i.responses.filter((r) => r.response === 'pending').length,
      0
    )
    return { total, totalInvited, accepted, declined, pending, conversionRate: totalInvited > 0 ? (accepted / totalInvited) * 100 : 0 }
  }, [invitations])

  const handleDelete = (inv: Invitation) => {
    if (!confirm(`Supprimer l'invitation "${inv.title}" ?`)) return
    deleteInvitation(inv.id)
    addToast({ type: 'success', title: 'Invitation supprimée' })
  }

  const handleCopyLink = (token: string) => {
    const link = `${window.location.origin}/i/${token}`
    navigator.clipboard.writeText(link)
    addToast({ type: 'success', title: 'Lien copié !', description: link })
  }

  const handleSimulateResponse = () => {
    if (!selectedInv || !responseContactId) return
    respondToInvitation(selectedInv.unique_token, responseType, responseContactId)
    addToast({ type: 'success', title: 'Réponse enregistrée (simulation)' })
    setResponseContactId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Mail className="h-6 w-6 text-purple-500" />
            Invitations
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Envoyez et suivez les invitations à vos événements, RDV et offres
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>
          Nouvelle invitation
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBox label="Invitations actives" value={stats.total} sub="en cours" icon={Mail} color="purple" />
        <StatBox label="Invités au total" value={stats.totalInvited} sub="personnes contactées" icon={Users} color="blue" />
        <StatBox label="Taux d'acceptation" value={`${stats.conversionRate.toFixed(1)}%`} sub={`${stats.accepted} acceptées`} icon={CheckCircle2} color="emerald" />
        <StatBox label="En attente" value={stats.pending} sub="n'ont pas encore répondu" icon={Clock} color="amber" />
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <Input
            placeholder="Rechercher une invitation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </CardContent>
      </Card>

      {/* Invitations grid */}
      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={Mail}
            title="Aucune invitation"
            description="Créez votre première invitation événementielle."
            action={{ label: 'Nouvelle invitation', onClick: () => setShowCreate(true) }}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((inv) => {
            const tc = typeLabels[inv.type]
            const Icon = tc.icon
            const responses = inv.responses
            const acceptedCount = responses.filter((r) => r.response === 'accepted').length
            const declinedCount = responses.filter((r) => r.response === 'declined').length
            const maybeCount = responses.filter((r) => r.response === 'maybe').length
            const pendingCount = responses.filter((r) => r.response === 'pending').length
            const totalGuests = responses
              .filter((r) => r.response === 'accepted')
              .reduce((s, r) => s + r.guests_count, 0)

            const pieData = [
              { name: 'Accepté', value: acceptedCount, color: '#10b981' },
              { name: 'Refusé', value: declinedCount, color: '#ef4444' },
              { name: 'Peut-être', value: maybeCount, color: '#f59e0b' },
              { name: 'En attente', value: pendingCount, color: '#94a3b8' },
            ].filter((d) => d.value > 0)

            return (
              <Card
                key={inv.id}
                className={cn(
                  'hover:shadow-md transition-all cursor-pointer',
                  selectedInv?.id === inv.id && 'ring-2 ring-primary-500'
                )}
                onClick={() => setSelectedInv(inv)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={cn(
                        'flex h-11 w-11 items-center justify-center rounded-lg flex-shrink-0',
                        tc.color === 'purple' ? 'bg-purple-50 text-purple-600' :
                        tc.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                        tc.color === 'amber' ? 'bg-amber-50 text-amber-600' :
                        tc.color === 'rose' ? 'bg-rose-50 text-rose-600' :
                        'bg-slate-100 text-slate-600'
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 truncate">{inv.title}</h3>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{inv.description}</p>
                      </div>
                    </div>
                    <Badge variant={inv.status === 'active' ? 'success' : 'gray'} size="sm">
                      {inv.status === 'active' ? 'Active' : inv.status}
                    </Badge>
                  </div>

                  {/* Meta */}
                  <div className="space-y-1.5 mb-4 text-xs">
                    {inv.event_date && (
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        <span>{formatDate(inv.event_date, 'EEEE d MMMM yyyy à HH:mm')}</span>
                      </div>
                    )}
                    {inv.location && (
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        <span className="truncate">{inv.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <LinkIcon className="h-3 w-3 text-slate-400" />
                      <code className="font-mono text-[10px] truncate">/i/{inv.unique_token.substring(0, 16)}...</code>
                    </div>
                  </div>

                  {/* Réponses summary */}
                  {responses.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        {pieData.length > 0 && (
                          <div className="h-14 w-14 flex-shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={15} outerRadius={28} dataKey="value">
                                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                        <div className="flex-1 min-w-0 space-y-1">
                          {pieData.map((d) => (
                            <div key={d.name} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1">
                                <div className="h-2 w-2 rounded-sm" style={{ backgroundColor: d.color }} />
                                <span className="text-slate-600">{d.name}</span>
                              </div>
                              <span className="font-semibold text-slate-900">{d.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-100 p-2 flex flex-col justify-center">
                        <p className="text-[10px] text-purple-700 font-medium uppercase">Invités confirmés</p>
                        <p className="text-2xl font-bold text-purple-900">{totalGuests}</p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Copy className="h-3.5 w-3.5" />}
                      onClick={(e) => { e.stopPropagation(); handleCopyLink(inv.unique_token) }}
                    >
                      Copier lien
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Send className="h-3.5 w-3.5" />}
                      onClick={(e) => { e.stopPropagation(); addToast({ type: 'info', title: 'Envoi en masse', description: 'Sélectionnez une campagne' }) }}
                    >
                      Envoyer
                    </Button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(inv) }}
                      className="ml-auto rounded p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Selected invitation detail / responses */}
      {selectedInv && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Réponses : {selectedInv.title}</span>
              <button
                onClick={() => setSelectedInv(null)}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Fermer
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Simulate response */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 mb-4">
              <p className="text-xs font-semibold text-slate-700 mb-2">🧪 Simuler une réponse (test)</p>
              <div className="flex flex-wrap gap-2">
                <select
                  value={responseContactId || ''}
                  onChange={(e) => setResponseContactId(Number(e.target.value))}
                  className="flex-1 min-w-[200px] h-9 px-3 rounded-lg border border-slate-300 text-sm bg-white"
                >
                  <option value="">Choisir un contact...</option>
                  {contacts.slice(0, 30).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.first_name} {c.last_name} ({c.phone})
                    </option>
                  ))}
                </select>
                <select
                  value={responseType}
                  onChange={(e) => setResponseType(e.target.value as any)}
                  className="h-9 px-3 rounded-lg border border-slate-300 text-sm bg-white"
                >
                  <option value="accepted">✓ Accepte</option>
                  <option value="declined">✗ Refuse</option>
                  <option value="maybe">? Peut-être</option>
                </select>
                <Button onClick={handleSimulateResponse} disabled={!responseContactId} size="sm">
                  Enregistrer
                </Button>
              </div>
            </div>

            {/* Responses list */}
            <div className="space-y-2">
              {selectedInv.responses.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-6">Aucune réponse pour le moment</p>
              ) : (
                selectedInv.responses.map((resp) => {
                  const contact = contacts.find((c) => c.id === resp.contact_id)
                  const rLabel = responseLabels[resp.response]
                  const RIcon = rLabel.icon
                  return (
                    <div
                      key={resp.id}
                      className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 text-xs font-semibold flex-shrink-0">
                        {(contact?.first_name?.[0] || '') + (contact?.last_name?.[0] || '')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {contact ? `${contact.first_name} ${contact.last_name}` : 'Inconnu'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="font-mono">{resp.phone}</span>
                          {resp.responded_at && (
                            <>
                              <span>•</span>
                              <span>{formatRelativeDate(resp.responded_at)}</span>
                            </>
                          )}
                          {resp.guests_count > 0 && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-0.5">
                                <Users className="h-3 w-3" />
                                {resp.guests_count}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <span className={cn('inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium', rLabel.color)}>
                        <RIcon className="h-3 w-3" />
                        {rLabel.label}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create modal */}
      <InvitationFormModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSave={(data) => {
          addInvitation(data as any)
          addToast({ type: 'success', title: 'Invitation créée !' })
          setShowCreate(false)
        }}
      />
    </div>
  )
}

function StatBox({ label, value, sub, icon: Icon, color }: { label: string; value: string | number; sub: string; icon: any; color: 'purple' | 'blue' | 'emerald' | 'amber' }) {
  const colorMap = {
    purple: 'bg-purple-50 text-purple-600',
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
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

function InvitationFormModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean
  onClose: () => void
  onSave: (data: Omit<Invitation, 'id' | 'responses' | 'created_at' | 'unique_token' | 'status'>) => void
}) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'event' as Invitation['type'],
    event_date: '',
    location: '',
    max_guests: 2,
    response_deadline: '',
  })

  useMemo(() => {
    setForm({
      title: '',
      description: '',
      type: 'event',
      event_date: '',
      location: '',
      max_guests: 2,
      response_deadline: '',
    })
  }, [open])

  const handleSubmit = () => {
    if (!form.title.trim()) return
    onSave({
      user_id: 'user-1',
      title: form.title,
      description: form.description,
      type: form.type,
      event_date: form.event_date ? new Date(form.event_date).toISOString() : undefined,
      location: form.location,
      max_guests: form.max_guests,
      response_deadline: form.response_deadline ? new Date(form.response_deadline).toISOString() : undefined,
    })
  }

  return (
    <Modal open={open} onClose={onClose} title="Nouvelle invitation" size="lg">
      <div className="space-y-4">
        <Input
          label="Titre *"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Ex: Soirée VIP Black Friday"
        />
        <Textarea
          label="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Décrivez l'événement..."
          rows={3}
        />
        <Select
          label="Type"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value as any })}
          options={[
            { value: 'event', label: '🎉 Événement' },
            { value: 'appointment', label: '📅 Rendez-vous' },
            { value: 'offer', label: '🎁 Offre spéciale' },
            { value: 'vip', label: '⭐ VIP' },
            { value: 'reminder', label: '⏰ Rappel' },
          ]}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Date de l'événement"
            type="datetime-local"
            value={form.event_date}
            onChange={(e) => setForm({ ...form, event_date: e.target.value })}
          />
          <Input
            label="Date limite de réponse"
            type="datetime-local"
            value={form.response_deadline}
            onChange={(e) => setForm({ ...form, response_deadline: e.target.value })}
          />
        </div>
        <Input
          label="Lieu / Adresse"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          placeholder="Galerie Anspach 12, Bruxelles"
        />
        <Input
          label="Nombre max d'invités par personne"
          type="number"
          value={String(form.max_guests)}
          onChange={(e) => setForm({ ...form, max_guests: Number(e.target.value) })}
        />
      </div>
      <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-slate-200">
        <Button variant="outline" onClick={onClose}>Annuler</Button>
        <Button onClick={handleSubmit} disabled={!form.title.trim()}>
          Créer l'invitation
        </Button>
      </div>
    </Modal>
  )
}
