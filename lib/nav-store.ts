'use client'

// State management for navigation bookmarks with cloud sync support

import { useState, useEffect, useCallback, useRef } from 'react'
import { v4 as uuid } from 'uuid'
import type { Group, Bookmark, Theme, NavData } from './types'
import { DEFAULT_DATA } from './default-data'

const STORAGE_KEY = 'mininav_data'
const THEME_KEY = 'mininav_theme'
const TITLE_KEY = 'mininav_title'
const TOKEN_KEY = 'mininav_token'

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

function saveGroupsLocal(groups: Group[]) {
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

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function useNavStore() {
  const [groups, setGroupsState] = useState<Group[]>(() => loadGroups())
  const [theme, setThemeState] = useState<Theme>(() => loadTheme())
  const [title, setTitleState] = useState<string>(() => loadTitle())
  const [adminMode, setAdminMode] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const syncToCloud = useCallback((data: Group[]) => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
    }
    syncTimeoutRef.current = setTimeout(async () => {
      try {
        setSyncing(true)
        const token = getToken()
        const res = await fetch('/api/data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ groups: data }),
        })
        const result = await res.json()
        console.log('[v0] Cloud sync result:', result)
      } catch (err) {
        console.log('[v0] Cloud sync failed:', err)
      } finally {
        setSyncing(false)
      }
    }, 500)
  }, [])

  useEffect(() => {
    async function loadFromCloud() {
      try {
        console.log('[v0] Loading from cloud...')
        const token = getToken()
        const res = await fetch('/api/data', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (res.ok) {
          const cloudData = await res.json()
          console.log('[v0] Cloud data received:', cloudData)
          
          if (cloudData.groups && Array.isArray(cloudData.groups)) {
            // Check if cloud data is default (all group ids start with 'default-')
            const isCloudDefault = cloudData.groups.every((g: Group) => 
              g.id.startsWith('default-')
            )
            
            // Get current local data
            const localData = loadGroups()
            const isLocalDefault = localData.every((g: Group) => 
              g.id.startsWith('default-')
            )
            
            console.log('[v0] isCloudDefault:', isCloudDefault, 'isLocalDefault:', isLocalDefault)
            
            if (isCloudDefault && !isLocalDefault) {
              // Cloud has default but local has real data - push local to cloud
              console.log('[v0] Cloud is default, local has real data - syncing local to cloud')
              syncToCloud(localData)
            } else if (!isCloudDefault) {
              // Cloud has real data - use it
              console.log('[v0] Cloud has real data - updating local')
              setGroupsState(cloudData.groups)
              saveGroupsLocal(cloudData.groups)
            } else {
              // Both are default - keep local
              console.log('[v0] Both are default - keeping local')
            }
          }
        }
      } catch (err) {
        console.log('[v0] Load from cloud failed:', err)
      }
    }
    loadFromCloud()
  }, [syncToCloud])

  const setGroups = useCallback(
    (g: Group[] | ((prev: Group[]) => Group[])) => {
      setGroupsState((prev) => {
        const next = typeof g === 'function' ? g(prev) : g
        saveGroupsLocal(next)
        syncToCloud(next)
        return next
      })
    },
    [syncToCloud]
  )

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    localStorage.setItem(THEME_KEY, t)
  }, [])

  const setTitle = useCallback((t: string) => {
    setTitleState(t)
    localStorage.setItem(TITLE_KEY, t)
  }, [])

  useEffect(() => {
    const html = document.documentElement
    html.classList.remove('theme-sepia', 'theme-dark')
    if (theme === 'sepia') html.classList.add('theme-sepia')
    if (theme === 'dark') html.classList.add('theme-dark')
  }, [theme])

  const addGroup = useCallback(
    (name: string, color: string) => {
      setGroups((prev) => [
        ...prev,
        { id: uuid(), name, order: prev.length, color, bookmarks: [] },
      ])
    },
    [setGroups]
  )

  const updateGroup = useCallback(
    (id: string, name: string, color: string) => {
      setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, name, color } : g)))
    },
    [setGroups]
  )

  const deleteGroup = useCallback(
    (id: string) => {
      setGroups((prev) => prev.filter((g) => g.id !== id))
    },
    [setGroups]
  )

  const reorderGroups = useCallback(
    (newOrder: Group[]) => {
      const reordered = newOrder.map((g, i) => ({ ...g, order: i }))
      setGroups(reordered)
    },
    [setGroups]
  )

  const addBookmark = useCallback(
    (groupId: string, name: string, url: string, icon?: string) => {
      setGroups((prev) =>
        prev.map((g) => {
          if (g.id !== groupId) return g
          const bm: Bookmark = {
            id: uuid(),
            name,
            url,
            order: g.bookmarks.length,
            icon: icon || undefined,
          }
          return { ...g, bookmarks: [...g.bookmarks, bm] }
        })
      )
    },
    [setGroups]
  )

  const updateBookmark = useCallback(
    (
      groupId: string,
      bookmarkId: string,
      name: string,
      url: string,
      icon?: string,
      newGroupId?: string
    ) => {
      setGroups((prev) => {
        if (!newGroupId || newGroupId === groupId) {
          return prev.map((g) => {
            if (g.id !== groupId) return g
            return {
              ...g,
              bookmarks: g.bookmarks.map((b) =>
                b.id === bookmarkId ? { ...b, name, url, icon: icon || undefined } : b
              ),
            }
          })
        }
        let movedBm: Bookmark | null = null
        const updated = prev.map((g) => {
          if (g.id === groupId) {
            const bm = g.bookmarks.find((b) => b.id === bookmarkId)
            if (bm) movedBm = { ...bm, name, url, icon: icon || undefined }
            return { ...g, bookmarks: g.bookmarks.filter((b) => b.id !== bookmarkId) }
          }
          return g
        })
        if (!movedBm) return prev
        return updated.map((g) => {
          if (g.id !== newGroupId) return g
          return {
            ...g,
            bookmarks: [...g.bookmarks, { ...movedBm!, order: g.bookmarks.length }],
          }
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

  const normalizeImportData = useCallback((data: NavData): Group[] => {
    const defaultColors = [
      '#3B82F6',
      '#10B981',
      '#F59E0B',
      '#EF4444',
      '#8B5CF6',
      '#EC4899',
      '#06B6D4',
      '#84CC16',
    ]

    return (data.groups || []).map((g, gIndex) => {
      const groupId = g.id || uuid()
      const groupColor = g.color || defaultColors[gIndex % defaultColors.length]

      const normalizedBookmarks: Bookmark[] = (g.bookmarks || []).map((b, bIndex) => ({
        id: b.id || uuid(),
        name: b.name,
        url: b.url,
        order: typeof b.order === 'number' ? b.order : bIndex,
        pinned: b.pinned ?? false,
        icon: b.icon || undefined,
      }))

      return {
        id: groupId,
        name: g.name,
        order: typeof g.order === 'number' ? g.order : gIndex,
        color: groupColor,
        bookmarks: normalizedBookmarks,
      }
    })
  }, [])

  const importData = useCallback(
    (data: NavData, mode: 'overwrite' | 'merge') => {
      const normalizedGroups = normalizeImportData(data)

      if (mode === 'overwrite') {
        setGroups(normalizedGroups)
      } else {
        setGroups((prev) => {
          const merged = [...prev]
          for (const incoming of normalizedGroups) {
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
    [setGroups, normalizeImportData]
  )

  return {
    groups,
    theme,
    title,
    adminMode,
    syncing,
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
