import type { Metadata } from 'next'
import { QueuePageClient } from '@/components/queue/QueuePageClient'

export const metadata: Metadata = {
  title: 'Очередь - YouTube Player',
  description: 'Управление очередью видео',
}

/**
 * Страница управления очередью видео
 *
 * Использует Client Component с Realtime подпиской для автоматического
 * обновления UI при изменениях в очереди
 */
export default function QueuePage() {
  return <QueuePageClient />
}
