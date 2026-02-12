import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { Startup, Metrics, Meeting, StartupFormData } from '@/types'

interface DataContextValue {
  startups: Startup[]
  metrics: Metrics[]
  meetings: Meeting[]
  loading: boolean
  addStartup: (data: StartupFormData) => Promise<void>
  updateStartup: (id: string, data: Partial<StartupFormData>) => Promise<void>
  deleteStartup: (id: string) => Promise<void>
  addMetrics: (data: Omit<Metrics, 'id' | 'createdAt'>) => Promise<void>
  addMeeting: (data: Omit<Meeting, 'id' | 'createdAt'>) => Promise<void>
  getLatestMetrics: (startupId: string) => Metrics | undefined
  getStartupMetrics: (startupId: string) => Metrics[]
  getStartupMeetings: (startupId: string) => Meeting[]
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [startups, setStartups] = useState<Startup[]>([])
  const [metrics, setMetrics] = useState<Metrics[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [{ data: s }, { data: m }, { data: mt }] = await Promise.all([
      supabase.from('startups').select('*').order('created_at', { ascending: false }),
      supabase.from('metrics').select('*').order('year', { ascending: false }).order('month', { ascending: false }),
      supabase.from('meetings').select('*').order('date', { ascending: false }),
    ])

    if (s) setStartups(s.map(mapStartup))
    if (m) setMetrics(m.map(mapMetrics))
    if (mt) setMeetings(mt.map(mapMeeting))
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const addStartup = async (data: StartupFormData) => {
    const { data: user } = await supabase.auth.getUser()
    const { error } = await supabase.from('startups').insert({
      name: data.name,
      sector: data.sector,
      status: data.status,
      logo_url: data.logoUrl,
      contact_email: data.contactEmail,
      user_id: user.user?.id,
    })
    if (error) throw error
    await fetchAll()
  }

  const updateStartup = async (id: string, data: Partial<StartupFormData>) => {
    const { error } = await supabase.from('startups').update({
      name: data.name,
      sector: data.sector,
      status: data.status,
      logo_url: data.logoUrl,
      contact_email: data.contactEmail,
    }).eq('id', id)
    if (error) throw error
    await fetchAll()
  }

  const deleteStartup = async (id: string) => {
    const { error } = await supabase.from('startups').delete().eq('id', id)
    if (error) throw error
    await fetchAll()
  }

  const addMetrics = async (data: Omit<Metrics, 'id' | 'createdAt'>) => {
    const { error } = await supabase.from('metrics').upsert({
      startup_id: data.startupId,
      month: data.month,
      year: data.year,
      revenue: data.revenue,
      cash_balance: data.cashBalance,
      ebitda_or_burn: data.ebitdaOrBurn,
      headcount: data.headcount,
      highlights: data.highlights,
      next_steps: data.nextSteps,
    }, { onConflict: 'startup_id,month,year' })
    if (error) throw error
    await fetchAll()
  }

  const addMeeting = async (data: Omit<Meeting, 'id' | 'createdAt'>) => {
    const { error } = await supabase.from('meetings').insert({
      startup_id: data.startupId,
      date: data.date,
      notes: data.notes,
    })
    if (error) throw error
    await fetchAll()
  }

  const getLatestMetrics = (startupId: string): Metrics | undefined => {
    return metrics.find(m => m.startupId === startupId)
  }

  const getStartupMetrics = (startupId: string): Metrics[] => {
    return metrics.filter(m => m.startupId === startupId)
  }

  const getStartupMeetings = (startupId: string): Meeting[] => {
    return meetings.filter(m => m.startupId === startupId)
  }

  return (
    <DataContext.Provider value={{
      startups, metrics, meetings, loading,
      addStartup, updateStartup, deleteStartup,
      addMetrics, addMeeting,
      getLatestMetrics, getStartupMetrics, getStartupMeetings,
    }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}

// Mappers snake_case → camelCase
function mapStartup(row: Record<string, unknown>): Startup {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    sector: row.sector as string,
    status: row.status as Startup['status'],
    logoUrl: row.logo_url as string | undefined,
    contactEmail: row.contact_email as string,
    createdAt: row.created_at as string,
    healthJustification: row.health_justification as string | undefined,
    healthUpdatedAt: row.health_updated_at as string | undefined,
  }
}

function mapMetrics(row: Record<string, unknown>): Metrics {
  return {
    id: row.id as string,
    startupId: row.startup_id as string,
    month: row.month as number,
    year: row.year as number,
    revenue: row.revenue as number,
    cashBalance: row.cash_balance as number,
    ebitdaOrBurn: row.ebitda_or_burn as number,
    headcount: row.headcount as number,
    highlights: row.highlights as string | undefined,
    nextSteps: row.next_steps as string | undefined,
    createdAt: row.created_at as string,
  }
}

function mapMeeting(row: Record<string, unknown>): Meeting {
  return {
    id: row.id as string,
    startupId: row.startup_id as string,
    date: row.date as string,
    notes: row.notes as string | undefined,
    createdAt: row.created_at as string,
  }
}
