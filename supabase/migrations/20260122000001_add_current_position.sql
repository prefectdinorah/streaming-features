-- Миграция: добавление сохранения текущей позиции видео
-- Позволяет продолжать воспроизведение с того же места при переоткрытии плеера

-- Добавить поле для хранения текущей позиции воспроизведения
ALTER TABLE twitch_player.player_settings
ADD COLUMN IF NOT EXISTS current_position INTEGER DEFAULT 0;

COMMENT ON COLUMN twitch_player.player_settings.current_position IS
  'Текущая позиция воспроизведения в секундах. Обновляется плеером каждые 5 секунд для восстановления позиции при перезагрузке';
