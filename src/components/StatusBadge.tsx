import { StartupStatus } from '@/types'
import { cn } from '@/lib/utils'

const config: Record<StartupStatus, { label: string; className: string }> = {
  healthy: {
    label: 'Saudável',
    className: 'bg-[hsl(var(--status-healthy))]/10 text-[hsl(var(--status-healthy))] border-[hsl(var(--status-healthy))]/20',
  },
  attention: {
    label: 'Atenção',
    className: 'bg-[hsl(var(--status-attention))]/10 text-[hsl(var(--status-attention))] border-[hsl(var(--status-attention))]/20',
  },
  critical: {
    label: 'Crítico',
    className: 'bg-[hsl(var(--status-critical))]/10 text-[hsl(var(--status-critical))] border-[hsl(var(--status-critical))]/20',
  },
}

export default function StatusBadge({ status }: { status: StartupStatus }) {
  const { label, className } = config[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold', className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  )
}
