import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Next.js Middleware для защиты API endpoints
 *
 * Проверяет наличие API ключа для POST/PUT/DELETE запросов к /api/queue
 * Это предотвращает несанкционированные запросы от внешних источников
 *
 * API ключ должен быть передан в заголовке x-api-key
 */
export function middleware(request: NextRequest) {
  // Защита API endpoints для модификации очереди
  if (
    request.nextUrl.pathname.startsWith('/api/queue') &&
    request.method !== 'GET'
  ) {
    const apiKey = request.headers.get('x-api-key')

    if (!apiKey || apiKey !== process.env.API_SECRET_KEY) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/queue/:path*',
}
