# Альтернативная архитектура: Vercel KV вместо Supabase Realtime

## Проблема

Supabase Realtime требует:
- Включения Realtime в проекте
- Настройки publications для таблиц
- WebSocket подключений
- Задержка ~50-200ms

Для простого состояния плеера (is_paused, current_video) это может быть избыточно.

## Решение: Vercel KV (Redis)

### Архитектура

```
Dashboard (Browser)
    ↓ onClick "Pause"
    ↓ POST /api/player/pause
    ↓
Vercel Edge Function
    ↓ kv.set('player:state', { is_paused: true })
    ↓
Vercel KV (Redis)
    ↑ polling каждую секунду
    ↑ GET /api/player/state
    ↑
OBS Player (Browser)
```

### Что хранить где

**В Vercel KV (in-memory, быстро):**
- `player:state` - текущее состояние { is_paused, seek_to_seconds }
- `player:current_video` - ID текущего видео
- Всё что меняется часто и нужна мгновенная синхронизация

**В Supabase (персистентность):**
- `video_queue` - очередь видео (важно не потерять при сбое)
- `player_settings` - настройки (max_queue_size, max_duration, etc)
- История воспроизведения

### Код

#### 1. Установка Vercel KV

```bash
npm install @vercel/kv
```

В Vercel Dashboard:
- Storage → Create KV Database
- Автоматически добавятся env variables

#### 2. API Route для паузы

```typescript:app/api/player/pause/route.ts
import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Обновить состояние в Redis
    await kv.set('player:state', {
      is_paused: true,
      updated_at: Date.now(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error pausing player:', error)
    return NextResponse.json({ error: 'Failed to pause' }, { status: 500 })
  }
}

export const runtime = 'edge' // Быстрее выполнение
```

#### 3. API Route для получения состояния

```typescript:app/api/player/state/route.ts
import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const state = await kv.get('player:state') || {
      is_paused: false,
      updated_at: Date.now(),
    }

    return NextResponse.json(state)
  } catch (error) {
    console.error('Error fetching player state:', error)
    return NextResponse.json({ error: 'Failed to fetch state' }, { status: 500 })
  }
}

export const runtime = 'edge'
```

#### 4. Hook для Player (с polling)

```typescript:hooks/usePlayerState.ts
'use client'

import { useEffect, useState } from 'react'

interface PlayerState {
  is_paused: boolean
  updated_at: number
}

export function usePlayerState() {
  const [state, setState] = useState<PlayerState>({
    is_paused: false,
    updated_at: Date.now(),
  })

  useEffect(() => {
    // Загрузить состояние при монтировании
    const loadState = async () => {
      const res = await fetch('/api/player/state')
      const data = await res.json()
      setState(data)
    }

    loadState()

    // Polling каждую секунду
    const interval = setInterval(loadState, 1000)

    return () => clearInterval(interval)
  }, [])

  const pause = async () => {
    await fetch('/api/player/pause', { method: 'POST' })
    // Оптимистичное обновление
    setState(prev => ({ ...prev, is_paused: true }))
  }

  const resume = async () => {
    await fetch('/api/player/resume', { method: 'POST' })
    setState(prev => ({ ...prev, is_paused: false }))
  }

  return {
    isPaused: state.is_paused,
    pause,
    resume,
  }
}
```

#### 5. Использование в Player

```typescript:components/player/YouTubePlayer.tsx
'use client'

import { usePlayerState } from '@/hooks/usePlayerState'

export function YouTubePlayer() {
  const playerRef = useRef<YTPlayer | null>(null)
  const { isPaused } = usePlayerState()

  // Реагировать на изменения isPaused
  useEffect(() => {
    if (!playerRef.current) return

    if (isPaused) {
      playerRef.current.pauseVideo()
    } else {
      playerRef.current.playVideo()
    }
  }, [isPaused])

  // ... остальной код
}
```

### Оптимизация: Server-Sent Events вместо polling

Вместо polling можно использовать SSE для push-уведомлений:

```typescript:app/api/player/events/route.ts
import { kv } from '@vercel/kv'

export async function GET() {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      let lastState = await kv.get('player:state')

      // Проверять изменения каждые 500ms
      const interval = setInterval(async () => {
        const currentState = await kv.get('player:state')

        if (JSON.stringify(currentState) !== JSON.stringify(lastState)) {
          // Отправить обновление клиенту
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(currentState)}\n\n`)
          )
          lastState = currentState
        }
      }, 500)

      // Cleanup через 25 секунд (Vercel timeout)
      setTimeout(() => {
        clearInterval(interval)
        controller.close()
      }, 25000)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

export const runtime = 'edge'
```

**Проблема:** Vercel имеет timeout 25 секунд для Hobby plan, 60 секунд для Pro. Нужно переподключаться.

## Сравнение решений

### Текущее (Supabase Realtime)

**Плюсы:**
- ✅ Автоматическая синхронизация
- ✅ Персистентность из коробки
- ✅ Работает для любого количества клиентов
- ✅ WebSocket connection (постоянный канал)
- ✅ Нет polling overhead

**Минусы:**
- ❌ Требует включения Realtime
- ❌ Задержка ~50-200ms
- ❌ Дополнительный round-trip через БД
- ❌ Нужно настраивать publications

**Когда использовать:**
- Уже используете Supabase
- Нужна персистентность состояния
- Много клиентов
- Критична синхронизация между всеми клиентами

### Vercel KV + Polling

**Плюсы:**
- ✅ Быстрее (in-memory)
- ✅ Проще настройка
- ✅ Меньше зависимостей
- ✅ Polling = простая реализация

**Минусы:**
- ❌ Polling overhead (запрос каждую секунду)
- ❌ Задержка 1-2 секунды
- ❌ Дополнительный сервис (Vercel KV)
- ❌ Платный ($0.50/месяц, но есть free tier)

**Когда использовать:**
- Уже используете Vercel
- 1-2 клиента
- Задержка 1-2 секунды приемлема
- Не хотите настраивать Realtime

### Vercel KV + SSE

**Плюсы:**
- ✅ Быстрее (in-memory)
- ✅ Push notifications (не polling)
- ✅ Задержка ~100-500ms

**Минусы:**
- ❌ Vercel timeout (нужно переподключаться)
- ❌ Сложнее реализация
- ❌ Не работает на старых браузерах

**Когда использовать:**
- Критична скорость
- Можете обработать переподключения
- Не хотите polling overhead

### WebSocket сервер (отдельный)

**Плюсы:**
- ✅ Полный контроль
- ✅ Мгновенная синхронизация
- ✅ Нет ограничений

**Минусы:**
- ❌ Дополнительный сервер
- ❌ Дополнительная сложность
- ❌ Дополнительные расходы

**Когда использовать:**
- Очень высокие требования к latency
- Много клиентов
- Сложная логика синхронизации

## Рекомендация для вашего проекта

### Если хотите избежать Supabase Realtime:

**Используйте Vercel KV + Simple Polling**

1. Установите Vercel KV (free tier достаточно)
2. Состояние плеера → Vercel KV
3. Очередь видео → Supabase (персистентность важна!)
4. Polling каждую секунду из Player

**Код изменений:**
- Заменить Server Actions на API routes с KV
- Заменить useRealtimeQueue на usePlayerState с polling
- Оставить очередь в Supabase

**Результат:**
- Задержка 1-2 секунды (вполне приемлемо для паузы/скипа)
- Проще настройка (не нужен Realtime)
- Быстрее работа (in-memory vs БД)

### Если Realtime уже работает:

**Оставьте как есть!**

Supabase Realtime - проверенное решение, работает из коробки, подходит для вашего use case.

Преждевременная оптимизация - корень всех зол. Если задержка 50-200ms не критична (а для стрима это не критично), текущее решение отличное.

## Итог

**Для вашего простого use case (1 Dashboard + 1 OBS Player):**

Либо:
1. **Включите Realtime** (5 минут настройки) → работает сразу
2. **Или переключитесь на Vercel KV** (30 минут переделки) → чуть быстрее

Оба решения нормальные. Realtime проще в текущей ситуации, KV немного быстрее но требует изменений.

Хотите чтобы я переделал на Vercel KV? Могу показать полный код.
