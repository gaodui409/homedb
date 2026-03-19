import type { Group } from './types'

// IDs are hardcoded static strings to avoid SSR/CSR hydration mismatch
// (uuid() at module load time generates different values on server vs client)
export const DEFAULT_DATA: Group[] = [
  {
    id: 'default-group-ai',
    name: '示例 - AI 工具',
    order: 0,
    color: '#3B82F6',
    bookmarks: [
      { id: 'default-bm-chatgpt', name: 'ChatGPT', url: 'https://chat.openai.com', order: 0 },
      { id: 'default-bm-claude', name: 'Claude', url: 'https://claude.ai', order: 1 },
      { id: 'default-bm-gemini', name: 'Gemini', url: 'https://gemini.google.com', order: 2 },
      { id: 'default-bm-perplexity', name: 'Perplexity', url: 'https://www.perplexity.ai', order: 3 },
    ],
  },
  {
    id: 'default-group-dev',
    name: '示例 - 开发',
    order: 1,
    color: '#10B981',
    bookmarks: [
      { id: 'default-bm-github', name: 'GitHub', url: 'https://github.com', order: 0 },
      { id: 'default-bm-stackoverflow', name: 'Stack Overflow', url: 'https://stackoverflow.com', order: 1 },
      { id: 'default-bm-mdn', name: 'MDN Web Docs', url: 'https://developer.mozilla.org', order: 2 },
      { id: 'default-bm-caniuse', name: 'Can I use', url: 'https://caniuse.com', order: 3 },
    ],
  },
  {
    id: 'default-group-social',
    name: '示例 - 社交',
    order: 2,
    color: '#F59E0B',
    bookmarks: [
      { id: 'default-bm-twitter', name: 'Twitter / X', url: 'https://x.com', order: 0 },
      { id: 'default-bm-weibo', name: '微博', url: 'https://weibo.com', order: 1 },
    ],
  },
]
