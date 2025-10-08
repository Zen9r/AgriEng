// agring/app/api/proxy/[[...path]]/route.ts

import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and/or anonymous key are missing in .env.local file. Check variable names.")
}

async function handleRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    const path = pathSegments.join('/')
    const targetUrl = `${supabaseUrl}/${path}`

    const searchParams = request.nextUrl.searchParams.toString()
    const fullTargetUrl = searchParams ? `${targetUrl}?${searchParams}` : targetUrl

    const headers = new Headers()

    request.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase()
      if (lowerKey !== 'host') {
        headers.set(key, value)
      }
    })

    headers.set('apikey', supabaseAnonKey!)

    if (method !== 'GET' && method !== 'HEAD' && !headers.has('content-type')) {
      headers.set('content-type', 'application/json')
    }

    const fetchOptions: RequestInit = {
      method,
      headers,
    }

    if (method !== 'GET' && method !== 'HEAD' && request.body) {
      fetchOptions.body = request.body
      // @ts-ignore
      fetchOptions.duplex = 'half'
    }

    const response = await fetch(fullTargetUrl, fetchOptions)

    const responseHeaders = new Headers()

    response.headers.forEach((value, key) => {
      if (!['content-encoding', 'transfer-encoding'].includes(key.toLowerCase())) {
        responseHeaders.set(key, value)
      }
    })

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    })

  } catch (error) {
    console.error('Proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// --- الجزء الأهم للتأكد منه ---
export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleRequest(request, params.path, 'GET')
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleRequest(request, params.path, 'POST')
}

export async function PUT(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleRequest(request, params.path, 'PUT')
}

export async function PATCH(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleRequest(request, params.path, 'PATCH')
}

export async function DELETE(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleRequest(request, params.path, 'DELETE')
}

export async function HEAD(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleRequest(request, params.path, 'HEAD')
}

export async function OPTIONS(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleRequest(request, params.path, 'OPTIONS')
}