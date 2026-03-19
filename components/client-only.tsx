'use client'

import { useEffect, useState } from 'react'

/**
 * Renders children only after the component has mounted on the client.
 * Prevents SSR/CSR hydration mismatches caused by localStorage-driven state.
 */
export function ClientOnly({ children, fallback = null }: {
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return <>{fallback}</>
  return <>{children}</>
}
