import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

/**
 * Создает Supabase клиент для использования в Server Components и Server Actions
 *
 * Использование в Server Component:
 * ```tsx
 * import { createClient } from '@/lib/supabase/server'
 *
 * export default async function MyPage() {
 *   const supabase = await createClient()
 *   const { data } = await supabase
 *     .schema('twitch_player')
 *     .from('video_queue')
 *     .select('*')
 *   // ...
 * }
 * ```
 *
 * Использование в Server Action:
 * ```tsx
 * 'use server'
 *
 * import { createClient } from '@/lib/supabase/server'
 *
 * export async function myAction() {
 *   const supabase = await createClient()
 *   // ...
 * }
 * ```
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

/**
 * Создает Supabase клиент с service role ключом для обхода RLS
 *
 * ВАЖНО: Использовать только в API routes, где требуется полный доступ к БД
 *
 * Использование в API Route:
 * ```tsx
 * import { NextResponse } from 'next/server'
 * import { createServiceClient } from '@/lib/supabase/server'
 *
 * export async function POST(request: Request) {
 *   const supabase = createServiceClient()
 *   // Этот клиент обходит RLS политики
 *   const { data, error } = await supabase
 *     .schema('twitch_player')
 *     .from('video_queue')
 *     .insert(...)
 *   // ...
 * }
 * ```
 */
export function createServiceClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {
          // Service client не использует cookies
        },
      },
    }
  )
}
