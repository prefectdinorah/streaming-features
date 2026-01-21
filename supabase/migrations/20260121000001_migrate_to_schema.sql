-- Миграция: перенос таблиц из public в twitch_player
-- Применяется если у вас уже есть таблицы в схеме public

-- Шаг 1: Удалить старые таблицы из public (если нет важных данных)
DROP TABLE IF EXISTS public.video_queue CASCADE;
DROP TABLE IF EXISTS public.player_settings CASCADE;

-- Шаг 2: Создать схему twitch_player
CREATE SCHEMA IF NOT EXISTS twitch_player;

COMMENT ON SCHEMA twitch_player IS 'YouTube Player для Twitch трансляций - очередь видео и настройки плеера';

-- Шаг 3: Создать таблицу video_queue
CREATE TABLE IF NOT EXISTS twitch_player.video_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_id VARCHAR(20) NOT NULL,
  title TEXT NOT NULL,
  duration INTEGER,
  thumbnail_url TEXT,
  requested_by VARCHAR(100) NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  played_at TIMESTAMPTZ,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_video_queue_status
  ON twitch_player.video_queue(status);

CREATE INDEX IF NOT EXISTS idx_video_queue_position
  ON twitch_player.video_queue(position);

CREATE INDEX IF NOT EXISTS idx_video_queue_created_at
  ON twitch_player.video_queue(created_at DESC);

-- Шаг 4: Создать таблицу player_settings
CREATE TABLE IF NOT EXISTS twitch_player.player_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_paused BOOLEAN DEFAULT false,
  current_video_id UUID REFERENCES twitch_player.video_queue(id) ON DELETE SET NULL,
  max_queue_size INTEGER DEFAULT 50,
  max_video_duration INTEGER DEFAULT 600,
  allow_duplicates BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Шаг 5: RLS политики
ALTER TABLE twitch_player.video_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE twitch_player.player_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read video_queue" ON twitch_player.video_queue;
DROP POLICY IF EXISTS "Allow public read player_settings" ON twitch_player.player_settings;

CREATE POLICY "Allow public read video_queue"
  ON twitch_player.video_queue
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public read player_settings"
  ON twitch_player.player_settings
  FOR SELECT
  USING (true);

-- Шаг 6: Функции
CREATE OR REPLACE FUNCTION twitch_player.reindex_queue_positions()
RETURNS TRIGGER AS $$
BEGIN
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

CREATE OR REPLACE FUNCTION twitch_player.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Шаг 7: Триггеры
DROP TRIGGER IF EXISTS after_queue_change ON twitch_player.video_queue;
DROP TRIGGER IF EXISTS update_video_queue_updated_at ON twitch_player.video_queue;
DROP TRIGGER IF EXISTS update_player_settings_updated_at ON twitch_player.player_settings;

CREATE TRIGGER after_queue_change
  AFTER INSERT OR DELETE OR UPDATE OF status ON twitch_player.video_queue
  FOR EACH STATEMENT
  EXECUTE FUNCTION twitch_player.reindex_queue_positions();

CREATE TRIGGER update_video_queue_updated_at
  BEFORE UPDATE ON twitch_player.video_queue
  FOR EACH ROW
  EXECUTE FUNCTION twitch_player.update_updated_at_column();

CREATE TRIGGER update_player_settings_updated_at
  BEFORE UPDATE ON twitch_player.player_settings
  FOR EACH ROW
  EXECUTE FUNCTION twitch_player.update_updated_at_column();

-- Шаг 8: Комментарии
COMMENT ON TABLE twitch_player.video_queue IS 'Очередь YouTube видео для воспроизведения на Twitch стриме';
COMMENT ON TABLE twitch_player.player_settings IS 'Настройки плеера и ограничения очереди';

COMMENT ON COLUMN twitch_player.video_queue.youtube_id IS 'YouTube video ID (11 символов)';
COMMENT ON COLUMN twitch_player.video_queue.status IS 'Статус: pending (в очереди), playing (воспроизводится), completed (завершено), skipped (пропущено)';
COMMENT ON COLUMN twitch_player.video_queue.position IS 'Позиция в очереди (автоматически переиндексируется)';
COMMENT ON COLUMN twitch_player.video_queue.requested_by IS 'Twitch username пользователя, который запросил видео';

COMMENT ON COLUMN twitch_player.player_settings.max_queue_size IS 'Максимальное количество видео в очереди';
COMMENT ON COLUMN twitch_player.player_settings.max_video_duration IS 'Максимальная длительность видео в секундах';
COMMENT ON COLUMN twitch_player.player_settings.allow_duplicates IS 'Разрешить добавление одного и того же видео несколько раз';

-- Шаг 9: Инициализировать настройки
INSERT INTO twitch_player.player_settings (is_paused, max_queue_size, max_video_duration, allow_duplicates)
VALUES (false, 50, 600, false)
ON CONFLICT DO NOTHING;
