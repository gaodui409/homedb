'use client'

import { useState, useEffect, useRef } from 'react'
import { X, ExternalLink } from 'lucide-react'
import type { Bookmark, Group } from '@/lib/types'

// ── Shared overlay backdrop ──────────────────────────────────────────────
function Backdrop({ onClick }: { onClick: () => void }) {
  return (
    <div
      className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
      onClick={onClick}
      aria-hidden="true"
    />
  )
}

// ── Modal shell ──────────────────────────────────────────────────────────
function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <>
      <Backdrop onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md border border-border">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-base font-semibold text-card-foreground">{title}</h2>
            <button
              onClick={onClose}
              className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="关闭"
            >
              <X size={16} />
            </button>
          </div>
          <div className="px-5 py-4">{children}</div>
        </div>
      </div>
    </>
  )
}

function FormField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  )
}

const inputCls =
  'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow'

// ── Bookmark Modal ───────────────────────────────────────────────────────
export interface BookmarkModalState {
  groupId: string
  bookmark?: Bookmark // present when editing
}

interface BookmarkModalProps {
  state: BookmarkModalState
  groups: Group[]
  onSave: (groupId: string, name: string, url: string, icon: string, newGroupId: string) => void
  onClose: () => void
}

function getFaviconUrl(url: string) {
  try {
    const domain = new URL(url).hostname
    return `https://favicon.im/${domain}`
  } catch {
    return ''
  }
}

export function BookmarkModal({ state, groups, onSave, onClose }: BookmarkModalProps) {
  const isEdit = !!state.bookmark
  const [name, setName] = useState(state.bookmark?.name ?? '')
  const [url, setUrl] = useState(state.bookmark?.url ?? '')
  const [icon, setIcon] = useState(state.bookmark?.icon ?? '')
  const [selectedGroupId, setSelectedGroupId] = useState(state.groupId)
  const [faviconError, setFaviconError] = useState(false)
  // Use custom icon if set, otherwise auto-detect favicon
  const previewIconUrl = icon.trim() || getFaviconUrl(url)

  // Reset favicon error when url changes
  useEffect(() => { setFaviconError(false) }, [url])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !url.trim()) return
    const finalUrl = url.startsWith('http') ? url : `https://${url}`
    onSave(state.groupId, name.trim(), finalUrl, icon.trim(), selectedGroupId)
    onClose()
  }

  return (
    <ModalShell title={isEdit ? '编辑书签' : '添加书签'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Icon Preview */}
        {url && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-accent border border-border">
            <div className="size-8 rounded-lg overflow-hidden flex items-center justify-center bg-primary/10 flex-shrink-0">
              {!faviconError && previewIconUrl ? (
                <img
                  src={previewIconUrl}
                  alt="网站图标"
                  width={32}
                  height={32}
                  className="size-full object-contain"
                  onError={() => setFaviconError(true)}
                />
              ) : (
                <span className="text-primary text-xs font-bold">{name.charAt(0) || '?'}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{name || '网站名称'}</p>
              <p className="text-xs text-muted-foreground truncate">{url}</p>
            </div>
            <a
              href={url.startsWith('http') ? url : `https://${url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="在新标签页打开"
            >
              <ExternalLink size={14} />
            </a>
          </div>
        )}

        <FormField label="网站名称">
          <input
            className={inputCls}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例：GitHub"
            required
            autoFocus
          />
        </FormField>

        <FormField label="网址 URL">
          <input
            className={inputCls}
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            required
          />
        </FormField>

        <FormField label="自定义图标 URL（可选）">
          <input
            className={inputCls}
            type="text"
            value={icon}
            onChange={(e) => { setIcon(e.target.value); setFaviconError(false) }}
            placeholder="留空则自动获取网站图标"
          />
        </FormField>

        <FormField label="所属分组">
          <select
            className={inputCls}
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </FormField>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            {isEdit ? '保存修改' : '添加书签'}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}

// ── Group Modal ───────────────────────────────��──────────────────────────
export interface GroupModalState {
  group?: Group // present when editing
}

interface GroupModalProps {
  state: GroupModalState
  onSave: (name: string, color: string) => void
  onClose: () => void
}

const COLOR_PRESETS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
  '#F97316', '#6B7280',
]

export function GroupModal({ state, onSave, onClose }: GroupModalProps) {
  const isEdit = !!state.group
  const [name, setName] = useState(state.group?.name ?? '')
  const [color, setColor] = useState(state.group?.color ?? COLOR_PRESETS[0])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave(name.trim(), color)
    onClose()
  }

  return (
    <ModalShell title={isEdit ? '编辑分组' : '新建分组'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField label="分组名称">
          <input
            className={inputCls}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例：AI 工具"
            required
            autoFocus
          />
        </FormField>

        <FormField label="颜色标签">
          <div className="flex flex-wrap gap-2">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="size-7 rounded-full border-2 transition-transform hover:scale-110"
                style={{
                  backgroundColor: c,
                  borderColor: color === c ? c : 'transparent',
                  outline: color === c ? `2px solid ${c}` : 'none',
                  outlineOffset: '2px',
                }}
                aria-label={`选择颜色 ${c}`}
              />
            ))}
          </div>
        </FormField>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            {isEdit ? '保存修改' : '创建分组'}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}

// ── Import Modal ─────────────────────────────────────────────────────────
interface ImportModalProps {
  onImport: (mode: 'overwrite' | 'merge') => void
  onClose: () => void
  fileName: string
}

export function ImportModeModal({ onImport, onClose, fileName }: ImportModalProps) {
  return (
    <ModalShell title="导入数据" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          已解析文件：<span className="font-medium text-foreground">{fileName}</span>
        </p>
        <p className="text-sm text-foreground">请选择导入方式：</p>
        <p className="text-xs text-destructive">覆盖将清除所有现有数据，此操作不可撤销。建议先导出备份。</p>
        <div className="flex gap-2">
          <button
            onClick={() => { onImport('overwrite'); onClose() }}
            className="flex-1 rounded-lg border border-destructive/50 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            覆盖（不可撤销）
          </button>
          <button
            onClick={() => { onImport('merge'); onClose() }}
            className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            与现有合并
          </button>
        </div>
        <button
          onClick={onClose}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
        >
          取消
        </button>
      </div>
    </ModalShell>
  )
}

// ── Confirm Delete Modal ─────────────────────────────────────────────────
interface ConfirmDeleteProps {
  message: string
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmDeleteModal({ message, onConfirm, onClose }: ConfirmDeleteProps) {
  return (
    <ModalShell title="确认删除" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-foreground">{message}</p>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => { onConfirm(); onClose() }}
            className="flex-1 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:opacity-90 transition-opacity"
          >
            确认删除
          </button>
        </div>
      </div>
    </ModalShell>
  )
}
