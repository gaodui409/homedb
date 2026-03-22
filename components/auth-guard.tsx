'use client'

import { useState, useEffect, ReactNode } from 'react'
import { Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { getToken, setToken, clearToken } from '@/lib/use-nav-store'

interface AuthGuardProps {
  children: ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Check authentication on mount
  useEffect(() => {
    async function checkAuth() {
      const existingToken = getToken()
      
      // If no token, check if auth is required
      if (!existingToken) {
        try {
          const res = await fetch('/api/auth')
          const data = await res.json()
          if (data.noAuth) {
            // No password required
            setToken('no-auth-required')
            setStatus('authenticated')
            return
          }
        } catch {
          // API error, require auth
        }
        setStatus('unauthenticated')
        return
      }

      // Validate existing token
      try {
        const res = await fetch('/api/auth', {
          headers: { Authorization: `Bearer ${existingToken}` },
        })
        const data = await res.json()
        if (data.valid) {
          setStatus('authenticated')
        } else {
          clearToken() // Clear invalid/stale token
          setStatus('unauthenticated')
        }
      } catch {
        // On error, try to use existing token anyway
        setStatus('authenticated')
      }
    }

    checkAuth()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await res.json()

      if (res.ok && data.token) {
        setToken(data.token)
        setStatus('authenticated')
      } else {
        setError(data.error || '验证失败')
      }
    } catch {
      setError('网络错误，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="size-8 text-muted-foreground animate-spin" />
      </div>
    )
  }

  if (status === 'authenticated') {
    return <>{children}</>
  }

  // Unauthenticated - show login form
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-card rounded-2xl shadow-lg border border-border p-8">
          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="size-8 text-primary" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">请输入访问密码</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="输入密码"
                className="w-full h-12 px-4 pr-12 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                autoFocus
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting || !password}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  验证中...
                </>
              ) : (
                '进入'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
