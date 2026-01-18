import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

/**
 * Создает Supabase клиент для использования в браузере (Client Components)
 *
 * Использование:
 * ```tsx
 * 'use client'
 *
 * import { createClient } from '@/lib/supabase/client'
 *
 * export function MyComponent() {
 *   const supabase = createClient()
 *   // ...
 * }
 * ```
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
