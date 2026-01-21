-- Миграция: предоставление прав доступа к схеме twitch_player
-- Необходимо выполнить после создания схемы

-- Дать права на использование схемы
GRANT USAGE ON SCHEMA twitch_player TO anon, authenticated, service_role;

-- Дать права на чтение всех таблиц
GRANT SELECT ON ALL TABLES IN SCHEMA twitch_player TO anon, authenticated;

-- Дать полные права service_role
GRANT ALL ON ALL TABLES IN SCHEMA twitch_player TO service_role;

-- Дать права на использование sequences (для автоинкрементных полей)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA twitch_player TO anon, authenticated, service_role;

-- Автоматически давать права на новые таблицы
ALTER DEFAULT PRIVILEGES IN SCHEMA twitch_player
GRANT SELECT ON TABLES TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA twitch_player
GRANT ALL ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA twitch_player
GRANT USAGE ON SEQUENCES TO anon, authenticated, service_role;
