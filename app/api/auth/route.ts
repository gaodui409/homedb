import { NextRequest, NextResponse } from 'next/server'

// In-memory token store (in production, use a proper session store or JWT)
// For simplicity, we use a Set to store valid tokens
const validTokens = new Set<string>()

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
      const token = crypto.randomUUID()
      validTokens.add(token)
      return NextResponse.json({ token })
    } else {
      return NextResponse.json({ error: '密码错误' }, { status: 401 })
    }
  } catch {
    return NextResponse.json({ error: '请求格式错误' }, { status: 400 })
  }
}

// Validate token endpoint
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

  if (validTokens.has(token)) {
    return NextResponse.json({ valid: true })
  }

  return NextResponse.json({ valid: false }, { status: 401 })
}
