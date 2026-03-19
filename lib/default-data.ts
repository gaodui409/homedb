import { v4 as uuid } from 'uuid'
import type { Group } from './types'

export const DEFAULT_DATA: Group[] = [
  {
    id: uuid(),
    name: '示例 - AI 工具',
    order: 0,
    color: '#3B82F6',
    bookmarks: [
      { id: uuid(), name: 'ChatGPT', url: 'https://chat.openai.com', order: 0 },
      { id: uuid(), name: 'Claude', url: 'https://claude.ai', order: 1 },
      { id: uuid(), name: 'Gemini', url: 'https://gemini.google.com', order: 2 },
      { id: uuid(), name: 'Perplexity', url: 'https://www.perplexity.ai', order: 3 },
    ],
  },
  {
    id: uuid(),
    name: '示例 - 开发',
    order: 1,
    color: '#10B981',
    bookmarks: [
      { id: uuid(), name: 'GitHub', url: 'https://github.com', order: 0 },
      { id: uuid(), name: 'Stack Overflow', url: 'https://stackoverflow.com', order: 1 },
      { id: uuid(), name: 'MDN Web Docs', url: 'https://developer.mozilla.org', order: 2 },
      { id: uuid(), name: 'Can I use', url: 'https://caniuse.com', order: 3 },
    ],
  },
  {
    id: uuid(),
    name: '示例 - 社交',
    order: 2,
    color: '#F59E0B',
    bookmarks: [
      { id: uuid(), name: 'Twitter / X', url: 'https://x.com', order: 0 },
      { id: uuid(), name: '微博', url: 'https://weibo.com', order: 1 },
    ],
  },
]
