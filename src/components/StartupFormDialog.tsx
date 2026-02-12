import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input, Label, Select, SelectTrigger, SelectContent, SelectItem, SelectValue, Textarea } from '@/components/ui/index'
import { StartupFormData, Startup } from '@/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: StartupFormData) => Promise<void>
  startup?: Startup
}

const SECTORS = [
  'SaaS', 'Fintech', 'Healthtech', 'Edtech', 'Logtech',
  'Agtech', 'E-commerce', 'Marketplace', 'Deep Tech', 'Outro',
]

export default function StartupFormDialog({ open, onOpenChange, onSubmit, startup }: Props) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<StartupFormData>({
    name: '', sector: '', status: 'healthy', logoUrl: '', contactEmail: '',
  })

  useEffect(() => {
    if (startup) {
      setForm({
        name: startup.name,
        sector: startup.sector,
        status: startup.status,
        logoUrl: startup.logoUrl ?? '',
        contactEmail: startup.contactEmail,
      })
    } else {
      setForm({ name: '', sector: '', status: 'healthy', logoUrl: '', contactEmail: '' })
    }
  }, [startup, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit(form)
      onOpenChange(false)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{startup ? 'Editar Startup' : 'Nova Startup'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              placeholder="Nome da startup"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail de contato *</Label>
            <Input
              id="email"
              type="email"
              placeholder="founders@startup.com"
              value={form.contactEmail}
              onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))}
              required
            />
            <p className="text-[10px] text-muted-foreground">Usado para envio automático do forms mensal</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Setor *</Label>
              <Select value={form.sector} onValueChange={v => setForm(f => ({ ...f, sector: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  {SECTORS.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Status *</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as StartupFormData['status'] }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="healthy">Saudável</SelectItem>
                  <SelectItem value="attention">Atenção</SelectItem>
                  <SelectItem value="critical">Crítico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="logo">URL do Logo (opcional)</Label>
            <Input
              id="logo"
              placeholder="https://..."
              value={form.logoUrl}
              onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? 'Salvando...' : startup ? 'Salvar' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
