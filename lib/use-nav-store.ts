'use client'

import { useState, useEffect, useCallback } from 'react'import { v4 as uuid } from 'uuid'
import type { Group, Bookmark, Theme, NavData } from './types'
import { DEFAULT_DATA } from './default-data'

const STORAGE_KEY = 'mininav_data'
const THEME_KEY = 'mininav_theme'
const TITLE_KEY = 'mininav_title'

function loadGroups(): Group[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_DATA
    const parsed: NavData = JSON.parse(raw)
    return parsed.groups ?? DEFAULT_DATA
  } catch {
    return DEFAULT_DATA
  }
}

function saveGroups(groups: Group[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ groups }))
  } catch {}
}

function loadTheme(): Theme {
  return (localStorage.getItem(THEME_KEY) as Theme) ?? 'light'
}

function loadTitle(): string {
  return localStorage.getItem(TITLE_KEY) ?? '我的导航'
}

export function useNavStore() {
  // This hook is only ever called inside <ClientOnly>, so localStorage is always available.
  const [groups, setGroupsState] = useState<Group[]>(() => loadGroups())
  const [theme, setThemeState] = useState<Theme>(() => loadTheme())
  const [title, setTitleState] = useState<string>(() => loadTitle())
  const [adminMode, setAdminMode] = useState(false)

  const setGroups = useCallback((g: Group[] | ((prev: Group[]) => Group[])) => {
    setGroupsState((prev) => {
      const next = typeof g === 'function' ? g(prev) : g
      saveGroups(next)
      return next
    })
  }, [])

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    localStorage.setItem(THEME_KEY, t)
  }, [])

  const setTitle = useCallback((t: string) => {
    setTitleState(t)
    localStorage.setItem(TITLE_KEY, t)
  }, [])

  // Apply theme class to html element
  useEffect(() => {
    const html = document.documentElement
    html.classList.remove('theme-sepia', 'theme-dark')
    if (theme === 'sepia') html.classList.add('theme-sepia')
    if (theme === 'dark') html.classList.add('theme-dark')
  }, [theme])

  // Groups CRUD
  const addGroup = useCallback((name: string, color: string) => {
    setGroups((prev) => [
      ...prev,
      { id: uuid(), name, order: prev.length, color, bookmarks: [] },
    ])
  }, [setGroups])

  const updateGroup = useCallback((id: string, name: string, color: string) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === id ? { ...g, name, color } : g))
    )
  }, [setGroups])

  const deleteGroup = useCallback((id: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== id))
  }, [setGroups])

  const reorderGroups = useCallback((newOrder: Group[]) => {
    const reordered = newOrder.map((g, i) => ({ ...g, order: i }))
    setGroups(reordered)
  }, [setGroups])

  // Bookmarks CRUD
  const addBookmark = useCallback(
    (groupId: string, name: string, url: string) => {
      setGroups((prev) =>
        prev.map((g) => {
          if (g.id !== groupId) return g
          const bm: Bookmark = { id: uuid(), name, url, order: g.bookmarks.length }
          return { ...g, bookmarks: [...g.bookmarks, bm] }
        })
      )
    },
    [setGroups]
  )

  const updateBookmark = useCallback(
    (groupId: string, bookmarkId: string, name: string, url: string, newGroupId?: string) => {
      setGroups((prev) => {
        if (!newGroupId || newGroupId === groupId) {
          return prev.map((g) => {
            if (g.id !== groupId) return g
            return {
              ...g,
              bookmarks: g.bookmarks.map((b) =>
                b.id === bookmarkId ? { ...b, name, url } : b
              ),
            }
          })
        }
        // Move to another group
        let movedBm: Bookmark | null = null
        const updated = prev.map((g) => {
          if (g.id === groupId) {
            const bm = g.bookmarks.find((b) => b.id === bookmarkId)
            if (bm) movedBm = { ...bm, name, url }
            return { ...g, bookmarks: g.bookmarks.filter((b) => b.id !== bookmarkId) }
          }
          return g
        })
        if (!movedBm) return prev
        return updated.map((g) => {
          if (g.id !== newGroupId) return g
          return { ...g, bookmarks: [...g.bookmarks, { ...movedBm!, order: g.bookmarks.length }] }
        })
      })
    },
    [setGroups]
  )

  const deleteBookmark = useCallback(
    (groupId: string, bookmarkId: string) => {
      setGroups((prev) =>
        prev.map((g) => {
          if (g.id !== groupId) return g
          return { ...g, bookmarks: g.bookmarks.filter((b) => b.id !== bookmarkId) }
        })
      )
    },
    [setGroups]
  )

  const reorderBookmarks = useCallback(
    (groupId: string, newOrder: Bookmark[]) => {
      setGroups((prev) =>
        prev.map((g) => {
          if (g.id !== groupId) return g
          return { ...g, bookmarks: newOrder.map((b, i) => ({ ...b, order: i })) }
        })
      )
    },
    [setGroups]
  )

  // Move a bookmark from one group to another (cross-group drag)
  const moveBookmark = useCallback(
    (fromGroupId: string, toGroupId: string, bookmarkId: string, toIndex: number) => {
      setGroups((prev) => {
        let movedBm: Bookmark | null = null
        const step1 = prev.map((g) => {
          if (g.id !== fromGroupId) return g
          movedBm = g.bookmarks.find((b) => b.id === bookmarkId) ?? null
          return { ...g, bookmarks: g.bookmarks.filter((b) => b.id !== bookmarkId) }
        })
        if (!movedBm) return prev
        return step1.map((g) => {
          if (g.id !== toGroupId) return g
          const sorted = [...g.bookmarks].sort((a, b) => a.order - b.order)
          sorted.splice(toIndex, 0, movedBm!)
          return { ...g, bookmarks: sorted.map((b, i) => ({ ...b, order: i })) }
        })
      })
    },
    [setGroups]
  )

  // Toggle pinned state
  const togglePinBookmark = useCallback(
    (groupId: string, bookmarkId: string) => {
      setGroups((prev) =>
        prev.map((g) => {
          if (g.id !== groupId) return g
          return {
            ...g,
            bookmarks: g.bookmarks.map((b) =>
              b.id === bookmarkId ? { ...b, pinned: !b.pinned } : b
            ),
          }
        })
      )
    },
    [setGroups]
  )

  // JSON Import / Export
  const exportData = useCallback(() => {
    const data: NavData = { groups }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'mininav-export.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [groups])

  const importData = useCallback(
    (data: NavData, mode: 'overwrite' | 'merge') => {
      if (mode === 'overwrite') {
        setGroups(data.groups)
      } else {
        setGroups((prev) => {
          const merged = [...prev]
          for (const incoming of data.groups) {
            const existing = merged.find((g) => g.id === incoming.id)
            if (existing) {
              const idx = merged.indexOf(existing)
              merged[idx] = {
                ...existing,
                bookmarks: [
                  ...existing.bookmarks,
                  ...incoming.bookmarks.filter(
                    (b) => !existing.bookmarks.find((eb) => eb.id === b.id)
                  ),
                ],
              }
            } else {
              merged.push(incoming)
            }
          }
          return merged
        })
      }
    },
    [setGroups]
  )

  return {
    groups,
    theme,
    title,
    adminMode,
    setTheme,
    setTitle,
    setAdminMode,
    addGroup,
    updateGroup,
    deleteGroup,
    reorderGroups,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    reorderBookmarks,
    moveBookmark,
    togglePinBookmark,
    exportData,
    importData,
  }
}

export type NavStore = ReturnType<typeof useNavStore>
