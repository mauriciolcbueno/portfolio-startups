import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useData } from '@/contexts/DataContext'
import Layout from '@/components/Layout'
import StatusBadge from '@/components/StatusBadge'
import StartupFormDialog from '@/components/StartupFormDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input, Label, Textarea } from '@/components/ui/index'
import { ArrowLeft, Edit2, Trash2, Plus, Copy, CheckCheck, Loader2 } from 'lucide-react'
import { formatCurrency, formatMonth, getMonthName } from '@/lib/utils'
import { StartupFormData } from '@/types'

export default function StartupDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { startups, updateStartup, deleteStartup, getStartupMetrics, getStartupMeetings, addMeeting } = useData()
  
  const startup = startups.find(s => s.id === id)
  const metrics = getStartupMetrics(id ?? '')
  const meetings = getStartupMeetings(id ?? '')

  const [editOpen, setEditOpen] = useState(false)
  const [meetingOpen, setMeetingOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [meetingForm, setMeetingForm] = useState({ date: '', notes: '' })
  const [meetingLoading, setMeetingLoading] = useState(false)

  if (!startup) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    )
  }

  const formUrl = `${window.location.origin}/forms/${startup.id}`

  const copyFormLink = async () => {
    await navigator.clipboard.writeText(formUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleUpdate = async (data: StartupFormData) => {
    await updateStartup(startup.id, data)
  }

  const handleDelete = async () => {
    if (confirm(`Tem certeza que deseja remover "${startup.name}"?`)) {
      await deleteStartup(startup.id)
      navigate('/')
    }
  }

  const handleAddMeeting = async (e: React.FormEvent) => {
    e.preventDefault()
    setMeetingLoading(true)
    try {
      await addMeeting({ startupId: startup.id, date: meetingForm.date, notes: meetingForm.notes })
      setMeetingForm({ date: '', notes: '' })
      setMeetingOpen(false)
    } catch (err) {
      console.error(err)
    } finally {
      setMeetingLoading(false)
    }
  }

  const latestMetrics = metrics[0]

  return (
    <Layout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              {startup.logoUrl ? (
                <img src={startup.logoUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">{startup.name.charAt(0)}</span>
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold tracking-tight">{startup.name}</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">{startup.sector}</span>
                  <span className="text-muted-foreground">·</span>
                  <StatusBadge status={startup.status} />
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Edit2 className="h-3.5 w-3.5 mr-1.5" />
              Editar
            </Button>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={handleDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* AI Health justification */}
        {startup.healthJustification && (
          <div className="bg-card border rounded-xl p-4 mb-4 flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-1.5 shrink-0 mt-0.5">
              <span className="text-primary text-[11px] font-bold leading-none">IA</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Análise de Saúde</p>
                {startup.healthUpdatedAt && (
                  <span className="text-[10px] text-muted-foreground">
                    · {new Date(startup.healthUpdatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </span>
                )}
              </div>
              <p className="text-sm text-foreground leading-relaxed">{startup.healthJustification}</p>
            </div>
          </div>
        )}

        {/* Form link */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-primary">Link do Forms Mensal</p>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate max-w-sm">{formUrl}</p>
          </div>
          <Button variant="outline" size="sm" onClick={copyFormLink}>
            {copied ? <CheckCheck className="h-3.5 w-3.5 mr-1.5 text-[hsl(var(--status-healthy))]" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
            {copied ? 'Copiado!' : 'Copiar'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Métricas recentes */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-display font-semibold text-base">Histórico de Métricas</h2>
            {metrics.length === 0 ? (
              <div className="bg-card border rounded-xl p-8 text-center text-muted-foreground text-sm">
                Nenhum dado ainda. Aguardando o primeiro report.
              </div>
            ) : (
              <div className="space-y-3">
                {metrics.map(m => (
                  <Card key={m.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-display font-semibold text-sm capitalize">
                          {getMonthName(m.month)} {m.year}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <p className="text-[10px] text-muted-foreground">Receita</p>
                          <p className="text-sm font-semibold">{formatCurrency(m.revenue)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Caixa</p>
                          <p className="text-sm font-semibold">{formatCurrency(m.cashBalance)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Burn/EBITDA</p>
                          <p className={`text-sm font-semibold ${m.ebitdaOrBurn < 0 ? 'text-[hsl(var(--status-critical))]' : 'text-[hsl(var(--status-healthy))]'}`}>
                            {formatCurrency(m.ebitdaOrBurn)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Headcount</p>
                          <p className="text-sm font-semibold">{m.headcount}</p>
                        </div>
                      </div>
                      {(m.highlights || m.nextSteps) && (
                        <div className="mt-3 pt-3 border-t space-y-2">
                          {m.highlights && (
                            <div>
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Destaques</p>
                              <p className="text-xs text-foreground mt-0.5">{m.highlights}</p>
                            </div>
                          )}
                          {m.nextSteps && (
                            <div>
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Próximos passos</p>
                              <p className="text-xs text-foreground mt-0.5">{m.nextSteps}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Reuniões */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-base">Reuniões</h2>
              <Button size="sm" variant="outline" onClick={() => setMeetingOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Registrar
              </Button>
            </div>
            {meetings.length === 0 ? (
              <div className="bg-card border rounded-xl p-6 text-center text-muted-foreground text-sm">
                Nenhuma reunião registrada.
              </div>
            ) : (
              <div className="space-y-2">
                {meetings.map(m => (
                  <div key={m.id} className="bg-card border rounded-xl p-3">
                    <p className="text-xs font-semibold">
                      {new Date(m.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                    {m.notes && <p className="text-xs text-muted-foreground mt-1">{m.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <StartupFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        onSubmit={handleUpdate}
        startup={startup}
      />

      {/* Meeting Dialog */}
      <Dialog open={meetingOpen} onOpenChange={setMeetingOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Registrar Reunião</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddMeeting} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="date">Data *</Label>
              <Input
                id="date"
                type="date"
                value={meetingForm.date}
                onChange={e => setMeetingForm(f => ({ ...f, date: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                placeholder="Resumo da reunião, decisões tomadas..."
                value={meetingForm.notes}
                onChange={e => setMeetingForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setMeetingOpen(false)}>Cancelar</Button>
              <Button type="submit" size="sm" disabled={meetingLoading}>
                {meetingLoading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  )
}
