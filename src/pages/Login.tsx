import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/index'
import { TrendingUp } from 'lucide-react'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      if (mode === 'login') {
        await signIn(email, password)
      } else {
        await signUp(email, password)
        setSuccess('Conta criada! Verifique seu e-mail para confirmar.')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="rounded-xl bg-primary/10 p-3 mb-3">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <h1 className="font-display font-bold text-2xl tracking-tight">Portfolio VC</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === 'login' ? 'Entre na sua conta' : 'Crie sua conta'}
          </p>
        </div>

        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {error && (
              <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>
            )}
            {success && (
              <p className="text-xs text-[hsl(var(--status-healthy))] bg-[hsl(var(--status-healthy))]/10 px-3 py-2 rounded-md">{success}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Carregando...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground mt-4">
            {mode === 'login' ? 'Não tem conta?' : 'Já tem conta?'}{' '}
            <button
              type="button"
              className="text-primary hover:underline font-medium"
              onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setError(''); setSuccess('') }}
            >
              {mode === 'login' ? 'Cadastre-se' : 'Entrar'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
