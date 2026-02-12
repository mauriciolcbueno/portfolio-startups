import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '@/contexts/DataContext'
import Layout from '@/components/Layout'
import StatusBadge from '@/components/StatusBadge'
import StartupFormDialog from '@/components/StartupFormDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Building2, DollarSign, HeartPulse, ClipboardCheck, CalendarCheck, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Startup } from '@/types'

export default function Dashboard() {
  const { startups, addStartup, getLatestMetrics, metrics, meetings, loading } = useData()
  const [formOpen, setFormOpen] = useState(false)

  const analytics = useMemo(() => {
    const total = startups.length
    if (total === 0) return null

    const totalRevenue = startups.reduce((sum, s) => {
      const m = getLatestMetrics(s.id)
      return sum + (m?.revenue ?? 0)
    }, 0)

    const healthy = startups.filter(s => s.status === 'healthy').length
    const attention = startups.filter(s => s.status === 'attention').length
    const critical = startups.filter(s => s.status === 'critical').length

    const now = new Date()
    const curMonth = now.getMonth() + 1
    const curYear = now.getFullYear()
    const responded = startups.filter(s =>
      metrics.some(m => m.startupId === s.id && m.month === curMonth && m.year === curYear)
    ).length

    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    const routinesOk = startups.filter(s =>
      meetings.some(m => m.startupId === s.id && new Date(m.date) >= ninetyDaysAgo)
    ).length

    return {
      totalRevenue,
      healthyPct: Math.round((healthy / total) * 100),
      attentionPct: Math.round((attention / total) * 100),
      criticalPct: Math.round((critical / total) * 100),
      respondedPct: Math.round((responded / total) * 100),
      routinesPct: Math.round((routinesOk / total) * 100),
    }
  }, [startups, metrics, meetings, getLatestMetrics])

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {startups.length} startup{startups.length !== 1 ? 's' : ''} no portfólio
            </p>
          </div>
          <Button onClick={() => setFormOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Nova Startup
          </Button>
        </div>

        {analytics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2.5">
                    <DollarSign className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Receita do Portfólio</p>
                    <p className="text-lg font-bold">{formatCurrency(analytics.totalRevenue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-accent/10 p-2.5">
                    <HeartPulse className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Saúde do Portfólio</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-semibold text-[hsl(var(--status-healthy))]">{analytics.healthyPct}%</span>
                      <span className="text-xs font-semibold text-[hsl(var(--status-attention))]">{analytics.attentionPct}%</span>
                      <span className="text-xs font-semibold text-[hsl(var(--status-critical))]">{analytics.criticalPct}%</span>
                    </div>
                    <div className="flex h-1.5 w-full rounded-full overflow-hidden mt-1.5 bg-muted">
                      <div className="bg-[hsl(var(--status-healthy))]" style={{ width: `${analytics.healthyPct}%` }} />
                      <div className="bg-[hsl(var(--status-attention))]" style={{ width: `${analytics.attentionPct}%` }} />
                      <div className="bg-[hsl(var(--status-critical))]" style={{ width: `${analytics.criticalPct}%` }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2.5">
                    <ClipboardCheck className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Report Mensal</p>
                    <p className="text-lg font-bold">{analytics.respondedPct}%</p>
                    <p className="text-[10px] text-muted-foreground">responderam este mês</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-accent/10 p-2.5">
                    <CalendarCheck className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Rotinas em Dia</p>
                    <p className="text-lg font-bold">{analytics.routinesPct}%</p>
                    <p className="text-[10px] text-muted-foreground">conselho nos últimos 90d</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {startups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Nenhuma startup cadastrada</h3>
            <p className="text-sm text-muted-foreground mb-4">Adicione sua primeira startup ao portfólio</p>
            <Button onClick={() => setFormOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              Adicionar
            </Button>
          </div>
        ) : (
          <div className="bg-card rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">STARTUP</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">STATUS</th>
                    <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3">RECEITA</th>
                    <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3">CAIXA</th>
                    <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3">BURN/EBITDA</th>
                    <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3">HEADCOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {startups.map((s: Startup) => {
                    const m = getLatestMetrics(s.id)
                    return (
                      <tr key={s.id} className="border-b last:border-b-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <Link to={`/startup/${s.id}`} className="flex items-center gap-3 group">
                            {s.logoUrl ? (
                              <img src={s.logoUrl} alt="" className="h-8 w-8 rounded-md object-cover bg-muted" />
                            ) : (
                              <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                                <span className="text-xs font-bold text-primary">{s.name.charAt(0)}</span>
                              </div>
                            )}
                            <div>
                              <span className="font-medium text-sm group-hover:text-accent transition-colors">{s.name}</span>
                              <span className="block text-xs text-muted-foreground">{s.sector}</span>
                            </div>
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <div className="relative group/tip inline-block">
                            <StatusBadge status={s.status} />
                            {s.healthJustification && (
                              <div className="absolute left-0 top-full mt-1.5 z-10 w-64 rounded-lg border bg-card shadow-lg p-3 text-xs text-foreground leading-relaxed hidden group-hover/tip:block">
                                <p className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider mb-1">Análise IA</p>
                                {s.healthJustification}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium">{m ? formatCurrency(m.revenue) : '—'}</td>
                        <td className="px-4 py-3 text-right text-sm font-medium">{m ? formatCurrency(m.cashBalance) : '—'}</td>
                        <td className="px-4 py-3 text-right text-sm font-medium">{m ? formatCurrency(m.ebitdaOrBurn) : '—'}</td>
                        <td className="px-4 py-3 text-right text-sm font-medium">{m ? m.headcount : '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <StartupFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={addStartup}
      />
    </Layout>
  )
}
