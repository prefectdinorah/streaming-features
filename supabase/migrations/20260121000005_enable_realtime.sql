-- Миграция: включение Realtime для таблиц twitch_player
-- Realtime необходим для мгновенного обновления плеера при изменении настроек

-- Включить Realtime для video_queue
ALTER PUBLICATION supabase_realtime ADD TABLE twitch_player.video_queue;

-- Включить Realtime для player_settings
ALTER PUBLICATION supabase_realtime ADD TABLE twitch_player.player_settings;

-- Проверка: убедиться что таблицы добавлены
-- SELECT schemaname, tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
