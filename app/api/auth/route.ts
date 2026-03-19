import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const TOKEN_EXPIRY_DAYS = 30

// Create HMAC-signed stateless token
function createToken(): string {
  const secret = process.env.NAV_PASSWORD || 'secret'
  const timestamp = Date.now().toString()
  const hmac = crypto.createHmac('sha256', secret).update(timestamp).digest('hex')
  return `${timestamp}.${hmac}`
}

// Verify HMAC token and check expiry
function verifyToken(token: string): boolean {
  const secret = process.env.NAV_PASSWORD || 'secret'
  const parts = token.split('.')
  if (parts.length !== 2) return false
  
  const [timestamp, providedHmac] = parts
  const expectedHmac = crypto.createHmac('sha256', secret).update(timestamp).digest('hex')
  
  // Timing-safe comparison
  if (!crypto.timingSafeEqual(Buffer.from(providedHmac), Buffer.from(expectedHmac))) {
    return false
  }
  
  // Check expiry (30 days)
  const tokenTime = parseInt(timestamp, 10)
  const now = Date.now()
  const maxAge = TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  
  return now - tokenTime < maxAge
}

// POST: Login with password
export async function POST(request: NextRequest) {
  const password = process.env.NAV_PASSWORD

  // If no password is set, return a dummy token (no auth required)
  if (!password) {
    return NextResponse.json({ token: 'no-auth-required', noAuth: true })
  }

  try {
    const body = await request.json()
    const inputPassword = body.password

    if (inputPassword === password) {
      const token = createToken()
      return NextResponse.json({ token })
    } else {
      return NextResponse.json({ error: '密码错误' }, { status: 401 })
    }
  } catch {
    return NextResponse.json({ error: '请求格式错误' }, { status: 400 })
  }
}

// GET: Validate token
export async function GET(request: NextRequest) {
  const password = process.env.NAV_PASSWORD

  // If no password is set, always valid
  if (!password) {
    return NextResponse.json({ valid: true, noAuth: true })
  }

  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return NextResponse.json({ valid: false }, { status: 401 })
  }

  // Check if it's the special no-auth token
  if (token === 'no-auth-required') {
    return NextResponse.json({ valid: true, noAuth: true })
  }

  if (verifyToken(token)) {
    return NextResponse.json({ valid: true })
  }

  return NextResponse.json({ valid: false }, { status: 401 })
}
