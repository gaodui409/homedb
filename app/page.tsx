import { ClientOnly } from '@/components/client-only'
import { AuthGuard } from '@/components/auth-guard'
import { NavApp } from '@/components/nav-app'

export default function HomePage() {
  return (
    <ClientOnly
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <span className="text-muted-foreground text-sm">加载中…</span>
        </div>
      }
    >
      <AuthGuard>
        <NavApp />
      </AuthGuard>
    </ClientOnly>
  )
}
