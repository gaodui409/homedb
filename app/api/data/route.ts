import { NextRequest, NextResponse } from 'next/server'
import { put, head } from '@vercel/blob'

const BLOB_KEY = 'nav-data.json'

// Default data when blob doesn't exist
const DEFAULT_DATA = {
  groups: [
    {
      id: 'default-ai-tools',
      name: 'AI 工具',
      order: 0,
      color: '#3B82F6',
      bookmarks: [
        { id: 'bm-chatgpt', name: 'ChatGPT', url: 'https://chat.openai.com', order: 0 },
        { id: 'bm-claude', name: 'Claude', url: 'https://claude.ai', order: 1 },
        { id: 'bm-gemini', name: 'Gemini', url: 'https://gemini.google.com', order: 2 },
      ],
    },
    {
      id: 'default-dev',
      name: '开发',
      order: 1,
      color: '#10B981',
      bookmarks: [
        { id: 'bm-github', name: 'GitHub', url: 'https://github.com', order: 0 },
        { id: 'bm-vercel', name: 'Vercel', url: 'https://vercel.com', order: 1 },
        { id: 'bm-stackoverflow', name: 'Stack Overflow', url: 'https://stackoverflow.com', order: 2 },
      ],
    },
    {
      id: 'default-social',
      name: '社交',
      order: 2,
      color: '#F59E0B',
      bookmarks: [
        { id: 'bm-twitter', name: 'X / Twitter', url: 'https://x.com', order: 0 },
        { id: 'bm-youtube', name: 'YouTube', url: 'https://youtube.com', order: 1 },
        { id: 'bm-reddit', name: 'Reddit', url: 'https://reddit.com', order: 2 },
      ],
    },
  ],
}

// Check if Blob is configured
async function isBlobConfigured(): Promise<boolean> {
  return !!process.env.BLOB_READ_WRITE_TOKEN
}

// GET: Read data from Vercel Blob
export async function GET() {
  try {
    const blobConfigured = await isBlobConfigured()
    
    if (!blobConfigured) {
      // Return default data if Blob is not configured (local development)
      return NextResponse.json(DEFAULT_DATA)
    }

    // Check if blob exists
    const blobInfo = await head(BLOB_KEY).catch(() => null)
    
    if (!blobInfo) {
      return NextResponse.json(DEFAULT_DATA)
    }

    // Fetch the blob content
    const response = await fetch(blobInfo.url)
    const data = await response.json()
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error reading from Blob:', error)
    return NextResponse.json(DEFAULT_DATA)
  }
}

// POST: Write data to Vercel Blob
export async function POST(request: NextRequest) {
  try {
    const blobConfigured = await isBlobConfigured()
    
    if (!blobConfigured) {
      // In local development without Blob, just acknowledge the save
      return NextResponse.json({ success: true, local: true })
    }

    const data = await request.json()
    
    await put(BLOB_KEY, JSON.stringify(data), {
      access: 'public',
      addRandomSuffix: false,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error writing to Blob:', error)
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 })
  }
}
