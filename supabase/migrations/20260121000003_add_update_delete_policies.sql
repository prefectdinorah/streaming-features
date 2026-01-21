-- Миграция: добавление RLS политик для UPDATE и DELETE операций
-- Необходимо для работы Server Actions (pause, stop, skip, play specific track)

-- Политики для video_queue

-- Разрешить authenticated пользователям обновлять статус и другие поля
DROP POLICY IF EXISTS "Allow authenticated update video_queue" ON twitch_player.video_queue;
CREATE POLICY "Allow authenticated update video_queue"
  ON twitch_player.video_queue
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Разрешить authenticated пользователям удалять видео
DROP POLICY IF EXISTS "Allow authenticated delete video_queue" ON twitch_player.video_queue;
CREATE POLICY "Allow authenticated delete video_queue"
  ON twitch_player.video_queue
  FOR DELETE
  TO authenticated
  USING (true);

-- Политики для player_settings

-- Разрешить authenticated пользователям обновлять настройки плеера
DROP POLICY IF EXISTS "Allow authenticated update player_settings" ON twitch_player.player_settings;
CREATE POLICY "Allow authenticated update player_settings"
  ON twitch_player.player_settings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Комментарии для документации
COMMENT ON POLICY "Allow authenticated update video_queue" ON twitch_player.video_queue IS
  'Authenticated пользователи могут обновлять статус видео (completed, skipped) и играть конкретные треки';

COMMENT ON POLICY "Allow authenticated delete video_queue" ON twitch_player.video_queue IS
  'Authenticated пользователи могут удалять видео из очереди';

COMMENT ON POLICY "Allow authenticated update player_settings" ON twitch_player.player_settings IS
  'Authenticated пользователи могут управлять плеером (пауза, стоп)';
