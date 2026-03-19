'use client'

import { useState, useRef } from 'react'
import { useNavStore } from '@/lib/use-nav-store'
import { NavHeader } from '@/components/nav-header'
import { BookmarkGroup } from '@/components/bookmark-group'
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

export default function HomePage() {
  const store = useNavStore()
  const [modal, setModal] = useState<ModalState>({ type: 'none' })

  // Group drag and drop
  const dragGroupId = useRef<string | null>(null)
  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null)

  const handleGroupDragStart = (e: React.DragEvent, groupId: string) => {
    dragGroupId.current = groupId
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleGroupDragOver = (e: React.DragEvent, groupId: string) => {
    e.preventDefault()
    setDragOverGroupId(groupId)
  }

  const handleGroupDrop = (e: React.DragEvent, targetGroupId: string) => {
    e.preventDefault()
    const sourceId = dragGroupId.current
    if (!sourceId || sourceId === targetGroupId) {
      setDragOverGroupId(null)
      return
    }
    const sorted = [...store.groups].sort((a, b) => a.order - b.order)
    const fromIdx = sorted.findIndex((g) => g.id === sourceId)
    const toIdx = sorted.findIndex((g) => g.id === targetGroupId)
    const [item] = sorted.splice(fromIdx, 1)
    sorted.splice(toIdx, 0, item)
    store.reorderGroups(sorted)
    setDragOverGroupId(null)
    dragGroupId.current = null
  }

  const sortedGroups = [...store.groups].sort((a, b) => a.order - b.order)

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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin mode banner */}
        {store.adminMode && (
          <div className="mb-6 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
            <span className="size-2 rounded-full bg-primary inline-block" />
            管理模式已开启 — 可添加、编辑、删除书签和分组，并可拖拽排序
          </div>
        )}

        {/* Groups */}
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
          <div className="flex flex-col gap-8">
            {sortedGroups.map((group) => (
              <BookmarkGroup
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
                onEditGroup={(g) => setModal({ type: 'editGroup', group: g })}
                onDeleteGroup={(gId) => {
                  setModal({ type: 'deleteGroup', groupId: gId, name: group.name })
                }}
                onReorderBookmarks={store.reorderBookmarks}
                onGroupDragStart={handleGroupDragStart}
                onGroupDragOver={handleGroupDragOver}
                onGroupDrop={handleGroupDrop}
                isGroupDragOver={dragOverGroupId === group.id}
              />
            ))}

            {/* Bottom add group button */}
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
        )}
      </main>

      {/* ── Modals ── */}

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
