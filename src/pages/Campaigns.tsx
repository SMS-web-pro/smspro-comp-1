import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  Search,
  MessageSquare,
  Eye,
  Copy,
  Trash2,
  Send,
  Clock,
  Calendar,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input, Select } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/utils/cn'
import { formatCurrency, formatRelativeDate, truncate } from '@/lib/utils'

export function CampaignsPage() {
  const { campaigns, deleteCampaign, duplicateCampaign, addToast } = useStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [view, setView] = useState<'grid' | 'list'>('grid')

  const filtered = useMemo(() => {
    return campaigns.filter((c) => {
      const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || c.status === statusFilter
      return matchSearch && matchStatus
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [campaigns, search, statusFilter])

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`Supprimer la campagne "${name}" ?`)) return
    deleteCampaign(id)
    addToast({ type: 'success', title: 'Campagne supprimée' })
  }

  const handleDuplicate = (id: number) => {
    duplicateCampaign(id)
    addToast({ type: 'success', title: 'Campagne dupliquée' })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Campagnes</h1>
          <p className="text-sm text-slate-500 mt-1">
            {campaigns.length} campagne(s) • {campaigns.filter((c) => c.status === 'sent').length} envoyée(s)
          </p>
        </div>
        <Link to="/campaigns/new">
          <Button leftIcon={<Plus className="h-4 w-4" />}>Nouvelle campagne</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Rechercher une campagne..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'Tous les statuts' },
                { value: 'draft', label: 'Brouillons' },
                { value: 'scheduled', label: 'Planifiées' },
                { value: 'sending', label: 'En cours' },
                { value: 'sent', label: 'Envoyées' },
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
                Grille
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

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={MessageSquare}
            title="Aucune campagne"
            description="Créez votre première campagne SMS pour commencer."
            action={{ label: 'Nouvelle campagne', onClick: () => window.location.assign('/campaigns/new') }}
          />
        </Card>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((camp) => (
            <Card key={camp.id} className="hover:shadow-md transition-all group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <Badge status={camp.status} />
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <button
                      onClick={() => handleDuplicate(camp.id)}
                      className="rounded p-1 hover:bg-slate-100"
                      title="Dupliquer"
                      aria-label="Dupliquer"
                    >
                      <Copy className="h-3.5 w-3.5 text-slate-500" />
                    </button>
                    <button
                      onClick={() => handleDelete(camp.id, camp.name)}
                      className="rounded p-1 hover:bg-red-50"
                      title="Supprimer"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </button>
                  </div>
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2 line-clamp-2">
                  {camp.name}
                </h3>
                <p className="text-sm text-slate-600 line-clamp-3 mb-4 min-h-[3.6rem]">
                  {truncate(camp.message, 120)}
                </p>
                {camp.stats ? (
                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 mb-3">
                    <div className="text-center">
                      <p className="text-lg font-bold text-slate-900">{camp.stats.total_sent}</p>
                      <p className="text-[10px] text-slate-500 uppercase">Envoyés</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-emerald-600">{camp.stats.delivery_rate}%</p>
                      <p className="text-[10px] text-slate-500 uppercase">Délivrés</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-slate-900">{formatCurrency(camp.stats.total_cost)}</p>
                      <p className="text-[10px] text-slate-500 uppercase">Coût</p>
                    </div>
                  </div>
                ) : (
                  <div className="py-3 border-y border-slate-100 mb-3 text-center">
                    <p className="text-xs text-slate-500">
                      {camp.status === 'draft' ? '📝 Brouillon non envoyé' : '⏰ En attente d\'envoi'}
                    </p>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    {camp.scheduled_at ? (
                      <><Calendar className="h-3 w-3" />{formatRelativeDate(camp.scheduled_at)}</>
                    ) : camp.sent_at ? (
                      <><Send className="h-3 w-3" />{formatRelativeDate(camp.sent_at)}</>
                    ) : (
                      <><Clock className="h-3 w-3" />{formatRelativeDate(camp.created_at)}</>
                    )}
                  </span>
                  <Link to={`/campaigns/${camp.id}`} className="font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
                    Détails <Eye className="h-3 w-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Nom</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Statut</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Envoyés</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Délivrés</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Coût</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Date</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((camp) => (
                  <tr key={camp.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link to={`/campaigns/${camp.id}`} className="font-medium text-slate-900 hover:text-primary-600">
                        {camp.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3"><Badge status={camp.status} size="sm" /></td>
                    <td className="px-4 py-3 text-slate-700">{camp.stats?.total_sent || '—'}</td>
                    <td className="px-4 py-3 text-emerald-600 font-medium">
                      {camp.stats ? `${camp.stats.delivery_rate}%` : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{camp.stats ? formatCurrency(camp.stats.total_cost) : '—'}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {camp.sent_at ? formatRelativeDate(camp.sent_at) : formatRelativeDate(camp.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Link to={`/campaigns/${camp.id}`} className="rounded p-1.5 hover:bg-slate-100" title="Voir">
                          <Eye className="h-4 w-4 text-slate-500" />
                        </Link>
                        <button onClick={() => handleDuplicate(camp.id)} className="rounded p-1.5 hover:bg-slate-100" title="Dupliquer">
                          <Copy className="h-4 w-4 text-slate-500" />
                        </button>
                        <button onClick={() => handleDelete(camp.id, camp.name)} className="rounded p-1.5 hover:bg-red-50" title="Supprimer">
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
    </div>
  )
}
