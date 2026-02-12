import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { DataProvider } from '@/contexts/DataContext'
import Dashboard from '@/pages/Dashboard'
import StartupDetail from '@/pages/StartupDetail'
import Login from '@/pages/Login'
import MonthlyForm from '@/pages/MonthlyForm'

function PrivateRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return (
    <DataProvider>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/startup/:id" element={<StartupDetail />} />
      </Routes>
    </DataProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/forms/:startupId" element={<MonthlyForm />} />

          {/* Protected routes */}
          <Route path="/*" element={<PrivateRoutes />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
