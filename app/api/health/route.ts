import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/health
 *
 * Диагностическая страница для проверки подключения к Supabase
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Проверка подключения к Supabase
    const { data: settings, error } = await supabase
      .schema('twitch_player')
      .from('player_settings')
      .select('*')
      .maybeSingle()

    if (error) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Supabase connection failed',
          error: {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          },
          env: {
            hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            hasYouTubeKey: !!process.env.YOUTUBE_API_KEY,
            hasApiKey: !!process.env.API_SECRET_KEY,
          },
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      status: 'ok',
      message: 'All systems operational',
      supabase: {
        connected: true,
        settings: settings || null,
      },
      env: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasYouTubeKey: !!process.env.YOUTUBE_API_KEY,
        hasApiKey: !!process.env.API_SECRET_KEY,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Unexpected error',
        error: String(error),
      },
      { status: 500 }
    )
  }
}
