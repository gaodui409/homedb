import { ClientOnly } from '@/components/client-only'
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
      <NavApp />
    </ClientOnly>
  )
}
