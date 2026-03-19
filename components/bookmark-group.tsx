'use client'

import { useState, useRef } from 'react'
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react'
import { BookmarkCard } from './bookmark-card'
import type { Group, Bookmark } from '@/lib/types'

interface BookmarkGroupProps {
  group: Group
  adminMode: boolean
  onAddBookmark: (groupId: string) => void
  onEditBookmark: (groupId: string, bookmark: Bookmark) => void
  onDeleteBookmark: (groupId: string, bookmarkId: string) => void
  onEditGroup: (group: Group) => void
  onDeleteGroup: (groupId: string) => void
  onReorderBookmarks: (groupId: string, newOrder: Bookmark[]) => void
  // group drag
  onGroupDragStart?: (e: React.DragEvent, groupId: string) => void
  onGroupDragOver?: (e: React.DragEvent, groupId: string) => void
  onGroupDrop?: (e: React.DragEvent, groupId: string) => void
  isGroupDragOver?: boolean
}

export function BookmarkGroup({
  group,
  adminMode,
  onAddBookmark,
  onEditBookmark,
  onDeleteBookmark,
  onEditGroup,
  onDeleteGroup,
  onReorderBookmarks,
  onGroupDragStart,
  onGroupDragOver,
  onGroupDrop,
  isGroupDragOver,
}: BookmarkGroupProps) {
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const dragItemId = useRef<string | null>(null)

  const sortedBookmarks = [...group.bookmarks].sort((a, b) => a.order - b.order)

  const handleCardDragStart = (e: React.DragEvent, id: string) => {
    dragItemId.current = id
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleCardDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault()
    setDragOverId(id)
  }

  const handleCardDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    const sourceId = dragItemId.current
    if (!sourceId || sourceId === targetId) {
      setDragOverId(null)
      return
    }
    const reordered = [...sortedBookmarks]
    const fromIdx = reordered.findIndex((b) => b.id === sourceId)
    const toIdx = reordered.findIndex((b) => b.id === targetId)
    const [item] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, item)
    onReorderBookmarks(group.id, reordered)
    setDragOverId(null)
    dragItemId.current = null
  }

  return (
    <section
      className={`rounded-2xl transition-all ${isGroupDragOver ? 'ring-2 ring-primary ring-offset-2' : ''}`}
      onDragOver={(e) => { e.preventDefault(); onGroupDragOver?.(e, group.id) }}
      onDrop={(e) => onGroupDrop?.(e, group.id)}
    >
      {/* Group Header */}
      <div className="flex items-center gap-2 mb-3 group/header">
        {/* Color accent dot */}
        <span
          className="inline-block size-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: group.color }}
        />
        <h2 className="text-sm font-semibold text-foreground tracking-wide flex-1">
          {group.name}
        </h2>

        {adminMode && (
          <div className="flex items-center gap-1 opacity-0 group-hover/header:opacity-100 transition-opacity">
            <button
              onClick={() => onEditGroup(group)}
              className="size-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="编辑分组"
              title="编辑分组"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => onDeleteGroup(group.id)}
              className="size-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              aria-label="删除分组"
              title="删除分组"
            >
              <Trash2 size={13} />
            </button>
            <div
              draggable
              onDragStart={(e) => onGroupDragStart?.(e, group.id)}
              className="size-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-grab active:cursor-grabbing"
              aria-label="拖拽排序分组"
              title="拖拽排序"
            >
              <GripVertical size={13} />
            </div>
          </div>
        )}
      </div>

      {/* Bookmark Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
        {sortedBookmarks.map((bm) => (
          <BookmarkCard
            key={bm.id}
            bookmark={bm}
            adminMode={adminMode}
            onEdit={(b) => onEditBookmark(group.id, b)}
            onDelete={(id) => onDeleteBookmark(group.id, id)}
            draggable={adminMode}
            onDragStart={handleCardDragStart}
            onDragOver={handleCardDragOver}
            onDrop={handleCardDrop}
            isDragOver={dragOverId === bm.id}
          />
        ))}

        {/* Add Bookmark Button */}
        {adminMode && (
          <button
            onClick={() => onAddBookmark(group.id)}
            className="nav-card flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors min-h-[60px] text-sm"
          >
            <Plus size={16} />
            <span>添加书签</span>
          </button>
        )}
      </div>
    </section>
  )
}
