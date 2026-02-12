export type StartupStatus = 'healthy' | 'attention' | 'critical'

export interface Startup {
  id: string
  userId: string
  name: string
  sector: string
  status: StartupStatus
  logoUrl?: string
  contactEmail: string
  createdAt: string
  // Campos preenchidos pela análise de IA
  healthJustification?: string
  healthUpdatedAt?: string
}

export interface Metrics {
  id: string
  startupId: string
  month: number
  year: number
  revenue: number
  cashBalance: number
  ebitdaOrBurn: number
  headcount: number
  highlights?: string
  nextSteps?: string
  createdAt: string
}

export interface Meeting {
  id: string
  startupId: string
  date: string
  notes?: string
  createdAt: string
}

export interface StartupFormData {
  name: string
  sector: string
  status: StartupStatus
  logoUrl?: string
  contactEmail: string
}
