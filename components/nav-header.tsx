'use client'

import { useRef, useState } from 'react'
import {
  Sun, BookOpen, Moon, Settings, Download, Upload,
  Plus, Check, X, Pencil, MoreVertical, LogOut, Cloud,
} from 'lucide-react'
import type { Theme, NavData } from '@/lib/types'

interface NavHeaderProps {
  title: string
  theme: Theme
  adminMode: boolean
  syncing?: boolean
  onThemeChange: (t: Theme) => void
  onTitleChange: (t: string) => void
  onAdminToggle: () => void
  onAddGroup: () => void
  onExport: () => void
  onImportFile: (data: NavData, fileName: string) => void
  onLogout?: () => void
}

const THEMES: { key: Theme; icon: React.ReactNode; label: string }[] = [
  { key: 'light', icon: <Sun size={15} />, label: '日间模式' },
  { key: 'sepia', icon: <BookOpen size={15} />, label: '阅读模式' },
  { key: 'dark', icon: <Moon size={15} />, label: '深夜模式' },
]

export function NavHeader({
  title,
  theme,
  adminMode,
  syncing,
  onThemeChange,
  onTitleChange,
  onAdminToggle,
  onAddGroup,
  onExport,
  onImportFile,
  onLogout,
}: NavHeaderProps) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [draftTitle, setDraftTitle] = useState(title)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const commitTitle = () => {
    const trimmed = draftTitle.trim()
    if (trimmed) onTitleChange(trimmed)
    else setDraftTitle(title)
    setEditingTitle(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data: NavData = JSON.parse(ev.target?.result as string)
        onImportFile(data, file.name)
      } catch {
        alert('JSON 文件解析失败，请检查格式。')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
    setMobileMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 h-14">
          {/* Title */}
          <div className="flex-1 flex items-center gap-2 min-w-0">
            {editingTitle ? (
              <div className="flex items-center gap-1.5 flex-1 min-w-0 max-w-xs">
                <input
                  className="flex-1 min-w-0 bg-transparent border-b-2 border-primary text-lg font-semibold text-foreground focus:outline-none"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitTitle()
                    if (e.key === 'Escape') { setDraftTitle(title); setEditingTitle(false) }
                  }}
                  autoFocus
                  maxLength={30}
                />
                <button
                  onClick={commitTitle}
                  className="size-6 flex items-center justify-center rounded text-primary hover:bg-primary/10 transition-colors"
                  aria-label="确认修改标题"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => { setDraftTitle(title); setEditingTitle(false) }}
                  className="size-6 flex items-center justify-center rounded text-muted-foreground hover:bg-accent transition-colors"
                  aria-label="取消修改"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 group/title">
                <h1 className="text-lg font-semibold text-foreground truncate">
                  {title}
                </h1>
                {adminMode && (
                  <button
                    onClick={() => { setDraftTitle(title); setEditingTitle(true) }}
                    className="size-6 flex items-center justify-center rounded text-muted-foreground opacity-0 group-hover/title:opacity-100 hover:text-foreground hover:bg-accent transition-all"
                    aria-label="编辑标题"
                    title="编辑标题"
                  >
                    <Pencil size={13} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1.5">
            {/* Admin actions */}
            {adminMode && (
              <>
                {/* Desktop: show buttons directly */}
                <button
                  onClick={onExport}
                  className="hidden sm:flex items-center gap-1.5 px-3 h-8 text-xs font-medium rounded-lg border border-border text-foreground hover:bg-accent transition-colors"
                  title="导出 JSON"
                >
                  <Download size={13} />
                  <span>导出</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="hidden sm:flex items-center gap-1.5 px-3 h-8 text-xs font-medium rounded-lg border border-border text-foreground hover:bg-accent transition-colors"
                  title="导入 JSON"
                >
                  <Upload size={13} />
                  <span>导入</span>
                </button>
                <button
                  onClick={onAddGroup}
                  className="hidden sm:flex items-center gap-1.5 px-3 h-8 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                  title="新建分组"
                >
                  <Plus size={13} />
                  <span>新建分组</span>
                </button>

                {/* Mobile: dropdown menu */}
                <div className="relative sm:hidden">
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="h-8 w-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    aria-label="更多操作"
                    aria-expanded={mobileMenuOpen}
                  >
                    <MoreVertical size={15} />
                  </button>
                  {mobileMenuOpen && (
                    <>
                      {/* Backdrop to close menu */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setMobileMenuOpen(false)}
                      />
                      <div className="absolute right-0 top-full mt-1 z-50 min-w-[140px] py-1 rounded-lg border border-border bg-card shadow-lg">
                        <button
                          onClick={() => { onAddGroup(); setMobileMenuOpen(false) }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                        >
                          <Plus size={14} />
                          <span>新建分组</span>
                        </button>
                        <button
                          onClick={() => { onExport(); setMobileMenuOpen(false) }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                        >
                          <Download size={14} />
                          <span>导出 JSON</span>
                        </button>
                        <button
                          onClick={() => { fileInputRef.current?.click() }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                        >
                          <Upload size={14} />
                          <span>导入 JSON</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="sr-only"
                  aria-hidden
                />
              </>
            )}

            {/* Theme switcher */}
            <div className="flex items-center rounded-lg border border-border overflow-hidden">
              {THEMES.map(({ key, icon, label }) => (
                <button
                  key={key}
                  onClick={() => onThemeChange(key)}
                  className={`h-8 w-8 flex items-center justify-center transition-colors ${
                    theme === key
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                  title={label}
                  aria-label={label}
                  aria-pressed={theme === key}
                >
                  {icon}
                </button>
              ))}
            </div>

            {/* Sync indicator */}
            {syncing !== undefined && (
              <div
                className="h-8 w-8 flex items-center justify-center"
                title={syncing ? '正在同步...' : '已同步'}
              >
                <Cloud size={15} className={syncing ? 'text-primary animate-pulse' : 'text-green-500'} />
              </div>
            )}

            {/* Admin toggle */}
            <button
              onClick={onAdminToggle}
              className={`h-8 w-8 flex items-center justify-center rounded-lg border transition-colors ${
                adminMode
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
              title={adminMode ? '退出管理模式' : '进入管理模式'}
              aria-label={adminMode ? '退出管理模式' : '进入管理模式'}
              aria-pressed={adminMode}
            >
              <Settings size={15} />
            </button>

            {/* Logout button */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title="退出登录"
                aria-label="退出登录"
              >
                <LogOut size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
