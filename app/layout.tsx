import type { Metadata } from 'next'
import './globals.css'
import { initializePlayerSettings } from './actions/player'

export const metadata: Metadata = {
  title: 'YouTube Player for Twitch',
  description: 'YouTube video player for Twitch streams via OBS Browser Source',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Инициализировать настройки плеера при первом запуске
  await initializePlayerSettings()

  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  )
}
