import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Middleware для обновления сессии пользователя
 *
 * Этот middleware автоматически обновляет токен аутентификации пользователя
 * при каждом запросе, чтобы сессия оставалась актуальной.
 *
 * ВАЖНО: Для MVP аутентификация не используется, но middleware подготовлен
 * для будущего использования с Supabase Auth.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // ВАЖНО: Избегайте запроса пользователя здесь, чтобы не создавать
  // бесконечные редиректы.
  // Проверка аутентификации должна происходить в layout или page компонентах.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Защищенные маршруты (для будущего использования)
  if (
    !user &&
    request.nextUrl.pathname.startsWith('/control') &&
    !request.nextUrl.pathname.startsWith('/control/login')
  ) {
    // Редирект на страницу логина
    const url = request.nextUrl.clone()
    url.pathname = '/control/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
