export type Theme = 'light' | 'sepia' | 'dark'

export interface Bookmark {
  id: string
  name: string
  url: string
  order: number
  pinned?: boolean // pinned to the quick-access bar
}

export interface Group {
  id: string
  name: string
  order: number
  color: string
  bookmarks: Bookmark[]
}

export interface NavData {
  groups: Group[]
}
