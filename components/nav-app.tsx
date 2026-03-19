'use client'

import { useState, useMemo } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { useNavStore } from '@/lib/use-nav-store'
import { NavHeader } from '@/components/nav-header'
import { SortableGroup } from '@/components/bookmark-group'
import { BookmarkCard } from '@/components/bookmark-card'
import { QuickBar } from '@/components/quick-bar'
import {
  BookmarkModal,
  GroupModal,
  ImportModeModal,
  ConfirmDeleteModal,
} from '@/components/admin-modals'
import type { Bookmark, Group, NavData } from '@/lib/types'

type ModalState =
  | { type: 'none' }
  | { type: 'addBookmark'; groupId: string }
  | { type: 'editBookmark'; groupId: string; bookmark: Bookmark }
  | { type: 'addGroup' }
  | { type: 'editGroup'; group: Group }
  | { type: 'deleteBookmark'; groupId: string; bookmarkId: string; name: string }
  | { type: 'deleteGroup'; groupId: string; name: string }
  | { type: 'importMode'; data: NavData; fileName: string }

type ActiveDrag =
  | { type: 'bookmark'; bookmark: Bookmark; fromGroupId: string }
  | { type: 'group'; group: Group }
  | null

export function NavApp() {
  const store = useNavStore()
  const [modal, setModal] = useState<ModalState>({ type: 'none' })
  const [activeDrag, setActiveDrag] = useState<ActiveDrag>(null)

  const sortedGroups = useMemo(
    () => [...store.groups].sort((a, b) => a.order - b.order),
    [store.groups]
  )

  const groupIds = useMemo(() => sortedGroups.map((g) => g.id), [sortedGroups])

  const pinnedBookmarks = useMemo(() => {
    const result: { bookmark: Bookmark; groupId: string }[] = []
    for (const g of sortedGroups) {
      for (const b of g.bookmarks) {
        if (b.pinned) result.push({ bookmark: b, groupId: g.id })
      }
    }
    return result
  }, [sortedGroups])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 300, tolerance: 5 } })
  )

  const findGroupByBookmarkId = (bookmarkId: string): Group | undefined =>
    store.groups.find((g) => g.bookmarks.some((b) => b.id === bookmarkId))

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current
    if (data?.type === 'group') {
      const group = store.groups.find((g) => g.id === event.active.id)
      if (group) setActiveDrag({ type: 'group', group })
    } else if (data?.type === 'bookmark') {
      const fromGroup = findGroupByBookmarkId(String(event.active.id))
      if (fromGroup && data.bookmark) {
        setActiveDrag({ type: 'bookmark', bookmark: data.bookmark, fromGroupId: fromGroup.id })
      }
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over || !activeDrag || activeDrag.type !== 'bookmark') return

    const activeId = String(active.id)
    const overId = String(over.id)

    const fromGroup = findGroupByBookmarkId(activeId)
    if (!fromGroup) return

    let toGroupId: string | undefined

    if (over.data.current?.type === 'group-drop') {
      toGroupId = over.data.current.groupId
    } else if (over.data.current?.type === 'bookmark') {
      toGroupId = findGroupByBookmarkId(overId)?.id
    } else if (over.data.current?.type === 'group') {
      toGroupId = overId
    }

    if (!toGroupId || toGroupId === fromGroup.id) return

    const targetGroup = store.groups.find((g) => g.id === toGroupId)
    if (!targetGroup) return
    const toIndex = targetGroup.bookmarks.length
    store.moveBookmark(fromGroup.id, toGroupId, activeId, toIndex)

    setActiveDrag((prev) =>
      prev?.type === 'bookmark' ? { ...prev, fromGroupId: toGroupId! } : prev
    )
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveDrag(null)

    if (!over || active.id === over.id) return

    const activeId = String(active.id)
    const overId = String(over.id)

    if (active.data.current?.type === 'group') {
      const oldIndex = sortedGroups.findIndex((g) => g.id === activeId)
      const newIndex = sortedGroups.findIndex((g) => g.id === overId)
      if (oldIndex !== -1 && newIndex !== -1) {
        store.reorderGroups(arrayMove(sortedGroups, oldIndex, newIndex))
      }
      return
    }

    if (active.data.current?.type === 'bookmark') {
      const group = findGroupByBookmarkId(activeId)
      if (!group) return
      const overGroup = findGroupByBookmarkId(overId)
      if (!overGroup || overGroup.id !== group.id) return

      const sortedBms = [...group.bookmarks].sort((a, b) => a.order - b.order)
      const oldIndex = sortedBms.findIndex((b) => b.id === activeId)
      const newIndex = sortedBms.findIndex((b) => b.id === overId)
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        store.reorderBookmarks(group.id, arrayMove(sortedBms, oldIndex, newIndex))
      }
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <NavHeader
        title={store.title}
        theme={store.theme}
        adminMode={store.adminMode}
        onThemeChange={store.setTheme}
        onTitleChange={store.setTitle}
        onAdminToggle={() => store.setAdminMode(!store.adminMode)}
        onAddGroup={() => setModal({ type: 'addGroup' })}
        onExport={store.exportData}
        onImportFile={(data, fileName) =>
          setModal({ type: 'importMode', data, fileName })
        }
      />

      <QuickBar
        groups={sortedGroups}
        pinnedBookmarks={pinnedBookmarks}
        adminMode={store.adminMode}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {store.adminMode && (
          <div className="mb-6 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
            <span className="size-2 rounded-full bg-primary inline-block" />
            管理模式 — 点击卡片编辑，拖拽排序，点击图钉置顶到常用栏
          </div>
        )}

        {sortedGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
            <p className="text-muted-foreground text-base">暂无书签分组</p>
            {store.adminMode && (
              <button
                onClick={() => setModal({ type: 'addGroup' })}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                创建第一个分组
              </button>
            )}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={groupIds} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-8">
                {sortedGroups.map((group) => (
                  <SortableGroup
                    key={group.id}
                    group={group}
                    adminMode={store.adminMode}
                    onAddBookmark={(gId) => setModal({ type: 'addBookmark', groupId: gId })}
                    onEditBookmark={(gId, bm) =>
                      setModal({ type: 'editBookmark', groupId: gId, bookmark: bm })
                    }
                    onDeleteBookmark={(gId, bId) => {
                      const bm = group.bookmarks.find((b) => b.id === bId)
                      setModal({
                        type: 'deleteBookmark',
                        groupId: gId,
                        bookmarkId: bId,
                        name: bm?.name ?? '',
                      })
                    }}
                    onTogglePin={(gId, bId) => store.togglePinBookmark(gId, bId)}
                    onEditGroup={(g) => setModal({ type: 'editGroup', group: g })}
                    onDeleteGroup={(gId) =>
                      setModal({ type: 'deleteGroup', groupId: gId, name: group.name })
                    }
                  />
                ))}

                {store.adminMode && (
                  <button
                    onClick={() => setModal({ type: 'addGroup' })}
                    className="w-full rounded-2xl border-2 border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors py-5 text-sm flex items-center justify-center gap-2"
                  >
                    <span className="text-lg font-light leading-none">+</span>
                    <span>添加分组</span>
                  </button>
                )}
              </div>
            </SortableContext>

            <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
              {activeDrag?.type === 'bookmark' && (
                <div className="rotate-2 scale-105 opacity-90">
                  <BookmarkCard
                    bookmark={activeDrag.bookmark}
                    adminMode={false}
                    onEdit={() => {}}
                    onDelete={() => {}}
                  />
                </div>
              )}
              {activeDrag?.type === 'group' && (
                <div className="rounded-2xl bg-card border border-primary/30 shadow-xl px-4 py-3 opacity-90">
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: activeDrag.group.color }}
                    />
                    <span className="text-sm font-semibold text-foreground">
                      {activeDrag.group.name}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      ({activeDrag.group.bookmarks.length} 个书签)
                    </span>
                  </div>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}
      </main>

      {/* Modals */}
      {(modal.type === 'addBookmark' || modal.type === 'editBookmark') && (
        <BookmarkModal
          state={
            modal.type === 'editBookmark'
              ? { groupId: modal.groupId, bookmark: modal.bookmark }
              : { groupId: modal.groupId }
          }
          groups={store.groups}
          onSave={(sourceGroupId, name, url, newGroupId) => {
            if (modal.type === 'editBookmark') {
              store.updateBookmark(
                sourceGroupId,
                modal.bookmark.id,
                name,
                url,
                newGroupId !== sourceGroupId ? newGroupId : undefined
              )
            } else {
              store.addBookmark(newGroupId, name, url)
            }
          }}
          onClose={() => setModal({ type: 'none' })}
        />
      )}

      {(modal.type === 'addGroup' || modal.type === 'editGroup') && (
        <GroupModal
          state={modal.type === 'editGroup' ? { group: modal.group } : {}}
          onSave={(name, color) => {
            if (modal.type === 'editGroup') {
              store.updateGroup(modal.group.id, name, color)
            } else {
              store.addGroup(name, color)
            }
          }}
          onClose={() => setModal({ type: 'none' })}
        />
      )}

      {modal.type === 'deleteBookmark' && (
        <ConfirmDeleteModal
          message={`确定要删除书签「${modal.name}」吗？此操作不可撤销。`}
          onConfirm={() => store.deleteBookmark(modal.groupId, modal.bookmarkId)}
          onClose={() => setModal({ type: 'none' })}
        />
      )}

      {modal.type === 'deleteGroup' && (
        <ConfirmDeleteModal
          message={`确定要删除分组「${modal.name}」及其全部书签吗？此操作不可撤销。`}
          onConfirm={() => store.deleteGroup(modal.groupId)}
          onClose={() => setModal({ type: 'none' })}
        />
      )}

      {modal.type === 'importMode' && (
        <ImportModeModal
          fileName={modal.fileName}
          onImport={(mode) => store.importData(modal.data, mode)}
          onClose={() => setModal({ type: 'none' })}
        />
      )}
    </div>
  )
}
