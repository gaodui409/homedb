'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react'
import { BookmarkCard } from './bookmark-card'
import type { Group, Bookmark } from '@/lib/types'

interface BookmarkGroupProps {
  group: Group
  adminMode: boolean
  onAddBookmark: (groupId: string) => void
  onEditBookmark: (groupId: string, bookmark: Bookmark) => void
  onDeleteBookmark: (groupId: string, bookmarkId: string) => void
  onTogglePin: (groupId: string, bookmarkId: string) => void
  onEditGroup: (group: Group) => void
  onDeleteGroup: (groupId: string) => void
}

// Sortable wrapper for the entire group section (for group reorder)
export function SortableGroup(props: BookmarkGroupProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props.group.id,
    disabled: !props.adminMode,
    data: { type: 'group' },
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <BookmarkGroup
        {...props}
        dragHandleProps={props.adminMode ? { ...attributes, ...listeners } : undefined}
        isDragging={isDragging}
      />
    </div>
  )
}

interface InternalGroupProps extends BookmarkGroupProps {
  dragHandleProps?: Record<string, unknown>
  isDragging?: boolean
}

function BookmarkGroup({
  group,
  adminMode,
  onAddBookmark,
  onEditBookmark,
  onDeleteBookmark,
  onTogglePin,
  onEditGroup,
  onDeleteGroup,
  dragHandleProps,
  isDragging,
}: InternalGroupProps) {
  const sortedBookmarks = [...group.bookmarks].sort((a, b) => a.order - b.order)
  const bookmarkIds = sortedBookmarks.map((b) => b.id)

  // Make the group section a droppable zone for cross-group drops
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `group-drop-${group.id}`,
    data: { type: 'group-drop', groupId: group.id },
  })

  return (
    <section
      id={`group-${group.id}`}
      className={`rounded-2xl transition-all duration-200 scroll-mt-32 ${
        isDragging ? 'ring-2 ring-primary/30 shadow-lg' : ''
      } ${isOver ? 'ring-2 ring-primary ring-offset-2 bg-primary/5' : ''}`}
    >
      {/* Group Header */}
      <div className="flex items-center gap-2 mb-3 group/header">
        {/* Drag handle — only in admin mode */}
        {adminMode && dragHandleProps && (
          <div
            className="size-5 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
            aria-label="拖拽排序分组"
            title="拖拽排序"
            {...dragHandleProps}
          >
            <GripVertical size={14} />
          </div>
        )}

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
          </div>
        )}
      </div>

      {/* Bookmark Grid */}
      <div ref={setDropRef}>
        <SortableContext items={bookmarkIds} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {sortedBookmarks.map((bm) => (
              <BookmarkCard
                key={bm.id}
                bookmark={bm}
                adminMode={adminMode}
                onEdit={(b) => onEditBookmark(group.id, b)}
                onDelete={(id) => onDeleteBookmark(group.id, id)}
                onTogglePin={(id) => onTogglePin(group.id, id)}
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
        </SortableContext>
      </div>
    </section>
  )
}
