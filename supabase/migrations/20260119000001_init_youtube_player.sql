-- YouTube Player для Twitch - Инициализация БД
-- Миграция: 20260119000001_init_youtube_player

-- ============================================================================
-- ТАБЛИЦА: video_queue
-- Описание: Очередь YouTube видео для воспроизведения
-- ============================================================================

CREATE TABLE IF NOT EXISTS video_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_id VARCHAR(20) NOT NULL,
  title TEXT NOT NULL,
  duration INTEGER, -- длительность в секундах
  thumbnail_url TEXT,
  requested_by VARCHAR(100) NOT NULL, -- Twitch username
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- Возможные значения: 'pending', 'playing', 'completed', 'skipped'
  played_at TIMESTAMPTZ,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_video_queue_status
  ON video_queue(status);

CREATE INDEX IF NOT EXISTS idx_video_queue_position
  ON video_queue(position);

CREATE INDEX IF NOT EXISTS idx_video_queue_created_at
  ON video_queue(created_at DESC);

-- ============================================================================
-- ТАБЛИЦА: player_settings
-- Описание: Настройки плеера и ограничения
-- ============================================================================

CREATE TABLE IF NOT EXISTS player_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_paused BOOLEAN DEFAULT false,
  current_video_id UUID REFERENCES video_queue(id) ON DELETE SET NULL,
  max_queue_size INTEGER DEFAULT 50,
  max_video_duration INTEGER DEFAULT 600, -- 10 минут в секундах
  allow_duplicates BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- RLS (Row Level Security) Policies
-- Описание: Разрешить чтение всем, запись только через service role
-- ============================================================================

ALTER TABLE video_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_settings ENABLE ROW LEVEL SECURITY;

-- Политики для video_queue
CREATE POLICY "Allow public read video_queue"
  ON video_queue
  FOR SELECT
  USING (true);

-- Политики для player_settings
CREATE POLICY "Allow public read player_settings"
  ON player_settings
  FOR SELECT
  USING (true);

-- ============================================================================
-- ФУНКЦИЯ: reindex_queue_positions
-- Описание: Автоматическая переиндексация позиций в очереди после изменений
-- ============================================================================

CREATE OR REPLACE FUNCTION reindex_queue_positions()
RETURNS TRIGGER AS $$
BEGIN
  -- Обновить позиции всех pending видео
  UPDATE video_queue
  SET position = subquery.row_num
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (ORDER BY position ASC, created_at ASC) as row_num
    FROM video_queue
    WHERE status = 'pending'
  ) AS subquery
  WHERE video_queue.id = subquery.id
    AND video_queue.status = 'pending';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: after_queue_change
-- Описание: Вызывать reindex_queue_positions после изменений в очереди
-- ============================================================================

DROP TRIGGER IF EXISTS after_queue_change ON video_queue;

CREATE TRIGGER after_queue_change
  AFTER INSERT OR DELETE OR UPDATE OF status ON video_queue
  FOR EACH STATEMENT
  EXECUTE FUNCTION reindex_queue_positions();

-- ============================================================================
-- ФУНКЦИЯ: update_updated_at_column
-- Описание: Автоматическое обновление поля updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS: update_updated_at
-- Описание: Обновлять updated_at при изменении строк
-- ============================================================================

DROP TRIGGER IF EXISTS update_video_queue_updated_at ON video_queue;
DROP TRIGGER IF EXISTS update_player_settings_updated_at ON player_settings;

CREATE TRIGGER update_video_queue_updated_at
  BEFORE UPDATE ON video_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_settings_updated_at
  BEFORE UPDATE ON player_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Комментарии к таблицам
-- ============================================================================

COMMENT ON TABLE video_queue IS 'Очередь YouTube видео для воспроизведения на Twitch стриме';
COMMENT ON TABLE player_settings IS 'Настройки плеера и ограничения очереди';

COMMENT ON COLUMN video_queue.youtube_id IS 'YouTube video ID (11 символов)';
COMMENT ON COLUMN video_queue.status IS 'Статус: pending (в очереди), playing (воспроизводится), completed (завершено), skipped (пропущено)';
COMMENT ON COLUMN video_queue.position IS 'Позиция в очереди (автоматически переиндексируется)';
COMMENT ON COLUMN video_queue.requested_by IS 'Twitch username пользователя, который запросил видео';

COMMENT ON COLUMN player_settings.max_queue_size IS 'Максимальное количество видео в очереди';
COMMENT ON COLUMN player_settings.max_video_duration IS 'Максимальная длительность видео в секундах';
COMMENT ON COLUMN player_settings.allow_duplicates IS 'Разрешить добавление одного и того же видео несколько раз';
