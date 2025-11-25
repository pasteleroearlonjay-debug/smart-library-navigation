import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type')

  // Handle password recovery
  if (type === 'recovery' && code) {
    return NextResponse.redirect(`${requestUrl.origin}/reset-password?code=${code}`)
  }

  // Default redirect
  return NextResponse.redirect(`${requestUrl.origin}/`)
}

