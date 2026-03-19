'use client'

import { useState } from 'react'
import type { Group, Bookmark } from '@/lib/types'

interface QuickBarProps {
  groups: Group[]
  pinnedBookmarks: { bookmark: Bookmark; groupId: string }[]
  adminMode: boolean
}

function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).hostname
    return `https://favicon.im/${domain}`
  } catch {
    return ''
  }
}

const AVATAR_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
]

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0xffffff
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

function PinnedItem({ bookmark }: { bookmark: Bookmark }) {
  const [imgError, setImgError] = useState(false)
  const faviconUrl = getFaviconUrl(bookmark.url)
  const avatarColor = getAvatarColor(bookmark.name)

  return (
    <a
      href={bookmark.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col items-center gap-1.5 px-2 py-1.5 rounded-xl hover:bg-accent transition-colors cursor-pointer min-w-[56px] max-w-[72px]"
      title={bookmark.name}
    >
      <div
        className="size-9 rounded-xl overflow-hidden flex items-center justify-center text-white text-sm font-semibold shadow-sm group-hover:scale-105 transition-transform"
        style={imgError || !faviconUrl ? { backgroundColor: avatarColor } : undefined}
      >
        {!imgError && faviconUrl ? (
          <img
            src={faviconUrl}
            alt={bookmark.name}
            width={36}
            height={36}
            className="size-full object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <span>{bookmark.name.charAt(0).toUpperCase()}</span>
        )}
      </div>
      <span className="text-[11px] text-muted-foreground group-hover:text-foreground transition-colors truncate w-full text-center leading-tight">
        {bookmark.name}
      </span>
    </a>
  )
}

export function QuickBar({ groups, pinnedBookmarks, adminMode }: QuickBarProps) {
  const hasPinned = pinnedBookmarks.length > 0

  return (
    <div className="border-b border-border bg-background/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Group anchor nav */}
        <div className="flex items-center gap-1 py-2 overflow-x-auto scrollbar-none">
          {groups.map((group) => (
            <a
              key={group.id}
              href={`#group-${group.id}`}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors whitespace-nowrap flex-shrink-0"
            >
              <span
                className="size-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: group.color }}
              />
              {group.name}
            </a>
          ))}
        </div>

        {/* Pinned / Quick-access row */}
        {(hasPinned || adminMode) && (
          <div className="pb-2">
            <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none">
              {hasPinned ? (
                pinnedBookmarks.map(({ bookmark }) => (
                  <PinnedItem key={bookmark.id} bookmark={bookmark} />
                ))
              ) : (
                adminMode && (
                  <p className="text-xs text-muted-foreground py-2 px-1">
                    在书签卡片上点击图钉图标，将其添加到常用应用栏
                  </p>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
