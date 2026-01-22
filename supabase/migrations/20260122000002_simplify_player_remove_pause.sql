-- Упрощение архитектуры плеера: убираем паузы и seek, добавляем настройки фона
-- Видео просто всегда играет на эндпоинте, никакого управления извне

-- 1. Удалить колонки для управления плеером
ALTER TABLE twitch_player.player_settings
  DROP COLUMN IF EXISTS is_paused,
  DROP COLUMN IF EXISTS seek_to_seconds,
  DROP COLUMN IF EXISTS current_position;

-- 2. Добавить настройки отображения фона
ALTER TABLE twitch_player.player_settings
  ADD COLUMN transparent_background BOOLEAN DEFAULT true,
  ADD COLUMN background_color TEXT DEFAULT '#000000';

-- 3. Обновить комментарий таблицы
COMMENT ON TABLE twitch_player.player_settings IS
'Глобальные настройки плеера. Только одна запись в таблице. Плеер работает автономно, управление только через очередь.';

COMMENT ON COLUMN twitch_player.player_settings.transparent_background IS
'Использовать прозрачный фон (для наложения в OBS)';

COMMENT ON COLUMN twitch_player.player_settings.background_color IS
'Цвет фона если transparent_background = false (hex формат, например #000000)';
