-- Миграция: добавление функциональности перемотки видео
-- Поле seek_to_seconds используется для передачи команды перемотки из Dashboard в OBS плеер

-- Добавить поле для перемотки
ALTER TABLE twitch_player.player_settings
ADD COLUMN IF NOT EXISTS seek_to_seconds INTEGER DEFAULT NULL;

COMMENT ON COLUMN twitch_player.player_settings.seek_to_seconds IS
  'Секунды для перемотки видео. Плеер перематывает и сбрасывает это поле в NULL после выполнения';
