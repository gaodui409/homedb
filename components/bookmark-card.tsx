'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Pencil, Trash2, Pin, PinOff } from 'lucide-react'
import type { Bookmark } from '@/lib/types'

interface BookmarkCardProps {
  bookmark: Bookmark
  adminMode: boolean
  onEdit: (bookmark: Bookmark) => void
  onDelete: (id: string) => void
  onTogglePin?: (id: string) => void
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
  onTogglePin,
}: BookmarkCardProps) {
  const [imgError, setImgError] = useState(false)
  // Use custom icon if available, otherwise fallback to favicon
  const iconUrl = bookmark.icon || getFaviconUrl(bookmark.url)
  const avatarColor = getAvatarColor(bookmark.name)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: bookmark.id,
    disabled: !adminMode,
    data: { type: 'bookmark', bookmark },
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    rotate: isDragging ? '2deg' : undefined,
    scale: isDragging ? '1.02' : undefined,
    zIndex: isDragging ? 50 : undefined,
    boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.18)' : undefined,
  }

  const handleClick = () => {
    // Always open link, even in admin mode (edit via pencil icon only)
    window.open(bookmark.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`nav-card group relative flex items-center gap-3 rounded-xl bg-card p-3 select-none transition-all duration-200 cursor-pointer ${isDragging ? 'ring-2 ring-primary/40' : ''}`}
      onClick={handleClick}
      role="link"
      tabIndex={0}
      aria-label={`打开 ${bookmark.name}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
      {...(adminMode ? { ...attributes, ...listeners } : {})}
    >
      {/* Icon */}
      <div
        className="flex-shrink-0 size-9 rounded-lg overflow-hidden flex items-center justify-center text-white text-sm font-semibold"
        style={imgError || !iconUrl ? { backgroundColor: avatarColor } : undefined}
      >
        {!imgError && iconUrl ? (
          <img
            src={iconUrl}
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

      {/* Admin Actions - mobile: always visible; desktop: hover to show */}
      {adminMode && (
        <div
          className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {onTogglePin && (
            <button
              onClick={(e) => { e.stopPropagation(); onTogglePin(bookmark.id) }}
              className="size-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
              aria-label={bookmark.pinned ? '取消置顶' : '置顶到常用'}
              title={bookmark.pinned ? '取消置顶' : '置顶到常用'}
            >
              {bookmark.pinned ? <PinOff size={12} /> : <Pin size={12} />}
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(bookmark) }}
            className="size-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="编辑书签"
            title="编辑"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(bookmark.id) }}
            className="size-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            aria-label="删除书签"
            title="删除"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  )
}
