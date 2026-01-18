import { YouTubePlayer } from '@/components/player/YouTubePlayer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'YouTube Player - OBS Browser Source',
  description: 'YouTube video player for Twitch streams via OBS',
}

/**
 * Страница YouTube плеера для OBS Browser Source
 *
 * URL для OBS: http://localhost:3000/player
 * Или production: https://your-app.vercel.app/player
 *
 * Настройки в OBS:
 * - Width: 1920
 * - Height: 1080
 * - FPS: 30
 * - Отключить "Shutdown source when not visible"
 * - Включить "Refresh browser when scene becomes active"
 */
export default function PlayerPage() {
  return <YouTubePlayer />
}
