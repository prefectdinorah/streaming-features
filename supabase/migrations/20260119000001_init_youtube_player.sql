-- YouTube Player для Twitch - Инициализация БД
-- Миграция: 20260119000001_init_youtube_player

-- ============================================================================
-- СХЕМА: twitch_player
-- Описание: Отдельная схема для YouTube Player проекта
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS twitch_player;

COMMENT ON SCHEMA twitch_player IS 'YouTube Player для Twitch трансляций - очередь видео и настройки плеера';

-- ============================================================================
-- ТАБЛИЦА: twitch_player.video_queue
-- Описание: Очередь YouTube видео для воспроизведения
-- ============================================================================

CREATE TABLE IF NOT EXISTS twitch_player.video_queue (
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
  ON twitch_player.video_queue(status);

CREATE INDEX IF NOT EXISTS idx_video_queue_position
  ON twitch_player.video_queue(position);

CREATE INDEX IF NOT EXISTS idx_video_queue_created_at
  ON twitch_player.video_queue(created_at DESC);

-- ============================================================================
-- ТАБЛИЦА: twitch_player.player_settings
-- Описание: Настройки плеера и ограничения
-- ============================================================================

CREATE TABLE IF NOT EXISTS twitch_player.player_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_paused BOOLEAN DEFAULT false,
  current_video_id UUID REFERENCES twitch_player.video_queue(id) ON DELETE SET NULL,
  max_queue_size INTEGER DEFAULT 50,
  max_video_duration INTEGER DEFAULT 600, -- 10 минут в секундах
  allow_duplicates BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- RLS (Row Level Security) Policies
-- Описание: Разрешить чтение всем, запись только через service role
-- ============================================================================

ALTER TABLE twitch_player.video_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE twitch_player.player_settings ENABLE ROW LEVEL SECURITY;

-- Политики для video_queue
CREATE POLICY "Allow public read video_queue"
  ON twitch_player.video_queue
  FOR SELECT
  USING (true);

-- Политики для player_settings
CREATE POLICY "Allow public read player_settings"
  ON twitch_player.player_settings
  FOR SELECT
  USING (true);

-- ============================================================================
-- ФУНКЦИЯ: twitch_player.reindex_queue_positions
-- Описание: Автоматическая переиндексация позиций в очереди после изменений
-- ============================================================================

CREATE OR REPLACE FUNCTION twitch_player.reindex_queue_positions()
RETURNS TRIGGER AS $$
BEGIN
  -- Обновить позиции всех pending видео
  UPDATE twitch_player.video_queue
  SET position = subquery.row_num
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (ORDER BY position ASC, created_at ASC) as row_num
    FROM twitch_player.video_queue
    WHERE status = 'pending'
  ) AS subquery
  WHERE twitch_player.video_queue.id = subquery.id
    AND twitch_player.video_queue.status = 'pending';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: after_queue_change
-- Описание: Вызывать reindex_queue_positions после изменений в очереди
-- ============================================================================

DROP TRIGGER IF EXISTS after_queue_change ON twitch_player.video_queue;

CREATE TRIGGER after_queue_change
  AFTER INSERT OR DELETE OR UPDATE OF status ON twitch_player.video_queue
  FOR EACH STATEMENT
  EXECUTE FUNCTION twitch_player.reindex_queue_positions();

-- ============================================================================
-- ФУНКЦИЯ: twitch_player.update_updated_at_column
-- Описание: Автоматическое обновление поля updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION twitch_player.update_updated_at_column()
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

DROP TRIGGER IF EXISTS update_video_queue_updated_at ON twitch_player.video_queue;
DROP TRIGGER IF EXISTS update_player_settings_updated_at ON twitch_player.player_settings;

CREATE TRIGGER update_video_queue_updated_at
  BEFORE UPDATE ON twitch_player.video_queue
  FOR EACH ROW
  EXECUTE FUNCTION twitch_player.update_updated_at_column();

CREATE TRIGGER update_player_settings_updated_at
  BEFORE UPDATE ON twitch_player.player_settings
  FOR EACH ROW
  EXECUTE FUNCTION twitch_player.update_updated_at_column();

-- ============================================================================
-- Комментарии к таблицам
-- ============================================================================

COMMENT ON TABLE twitch_player.video_queue IS 'Очередь YouTube видео для воспроизведения на Twitch стриме';
COMMENT ON TABLE twitch_player.player_settings IS 'Настройки плеера и ограничения очереди';

COMMENT ON COLUMN twitch_player.video_queue.youtube_id IS 'YouTube video ID (11 символов)';
COMMENT ON COLUMN twitch_player.video_queue.status IS 'Статус: pending (в очереди), playing (воспроизводится), completed (завершено), skipped (пропущено)';
COMMENT ON COLUMN twitch_player.video_queue.position IS 'Позиция в очереди (автоматически переиндексируется)';
COMMENT ON COLUMN twitch_player.video_queue.requested_by IS 'Twitch username пользователя, который запросил видео';

COMMENT ON COLUMN twitch_player.player_settings.max_queue_size IS 'Максимальное количество видео в очереди';
COMMENT ON COLUMN twitch_player.player_settings.max_video_duration IS 'Максимальная длительность видео в секундах';
COMMENT ON COLUMN twitch_player.player_settings.allow_duplicates IS 'Разрешить добавление одного и того же видео несколько раз';
