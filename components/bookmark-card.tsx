'use client'

import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import type { Bookmark } from '@/lib/types'

interface BookmarkCardProps {
  bookmark: Bookmark
  adminMode: boolean
  onEdit: (bookmark: Bookmark) => void
  onDelete: (id: string) => void
  // drag and drop
  draggable?: boolean
  onDragStart?: (e: React.DragEvent, id: string) => void
  onDragOver?: (e: React.DragEvent, id: string) => void
  onDrop?: (e: React.DragEvent, id: string) => void
  isDragOver?: boolean
}

function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).hostname
    return `https://favicon.im/${domain}`
  } catch {
    return ''
  }
}

function getFirstChar(name: string): string {
  return name.trim().charAt(0).toUpperCase()
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

// Simple deterministic color palette for fallback avatars
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

export function BookmarkCard({
  bookmark,
  adminMode,
  onEdit,
  onDelete,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
  isDragOver,
}: BookmarkCardProps) {
  const [imgError, setImgError] = useState(false)
  const faviconUrl = getFaviconUrl(bookmark.url)
  const avatarColor = getAvatarColor(bookmark.name)

  return (
    <div
      className={`nav-card group relative flex items-center gap-3 rounded-xl bg-card p-3 cursor-pointer select-none transition-all ${isDragOver ? 'ring-2 ring-primary ring-offset-2' : ''}`}
      draggable={draggable}
      onDragStart={(e) => onDragStart?.(e, bookmark.id)}
      onDragOver={(e) => { e.preventDefault(); onDragOver?.(e, bookmark.id) }}
      onDrop={(e) => onDrop?.(e, bookmark.id)}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('[data-action]')) return
        window.open(bookmark.url, '_blank', 'noopener,noreferrer')
      }}
      role="link"
      tabIndex={0}
      aria-label={`打开 ${bookmark.name}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          window.open(bookmark.url, '_blank', 'noopener,noreferrer')
        }
      }}
    >
      {/* Favicon */}
      <div
        className="flex-shrink-0 size-9 rounded-lg overflow-hidden flex items-center justify-center text-white text-sm font-semibold"
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
          <span>{getFirstChar(bookmark.name)}</span>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-card-foreground truncate leading-tight">
          {bookmark.name}
        </p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {getDomain(bookmark.url)}
        </p>
      </div>

      {/* Admin Actions */}
      {adminMode && (
        <div
          data-action="admin"
          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <button
            data-action="edit"
            onClick={(e) => { e.stopPropagation(); onEdit(bookmark) }}
            className="size-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="编辑书签"
            title="编辑"
          >
            <Pencil size={13} />
          </button>
          <button
            data-action="delete"
            onClick={(e) => { e.stopPropagation(); onDelete(bookmark.id) }}
            className="size-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            aria-label="删除书签"
            title="删除"
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </div>
  )
}
