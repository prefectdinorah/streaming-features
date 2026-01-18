# Настройка OBS Browser Source

Подробная инструкция по настройке YouTube плеера в OBS Studio.

## Требования

- OBS Studio 28+ (скачать с [obsproject.com](https://obsproject.com))
- Next.js приложение запущено (`npm run dev`)

## Шаг 1: Добавить Browser Source

1. Откройте OBS Studio
2. В панели "Sources" нажмите "+" (Add)
3. Выберите "Browser"
4. Введите название (например, "YouTube Player")
5. Нажмите "OK"

## Шаг 2: Настроить Browser Source

В окне настроек Browser Source:

### URL
```
http://localhost:3000/player
```

Для production:
```
https://your-app.vercel.app/player
```

### Width / Height
```
Width: 1920
Height: 1080
```

Для 720p:
```
Width: 1280
Height: 720
```

### FPS
```
30
```

### Checkboxes

✅ **Включить:**
- "Refresh browser when scene becomes active"

❌ **Отключить:**
- "Shutdown source when not visible"
- "Control audio via OBS"

## Шаг 3: Расположение на сцене

1. Нажмите "OK" чтобы закрыть настройки
2. Browser Source появится на сцене
3. Измените размер и позицию:
   - Перетащите для перемещения
   - Потяните за угол для изменения размера
   - Shift + перетаскивание для пропорционального масштабирования

**Рекомендации:**
- Для полноэкранного видео: растяните на весь canvas
- Для видео в углу: уменьшите и разместите в углу
- Для Picture-in-Picture: разместите поверх основного контента

## Шаг 4: Проверка работоспособности

1. Добавьте видео через Twitch чат:
   ```
   !play https://www.youtube.com/watch?v=dQw4w9WgXcQ
   ```

2. В OBS должно начаться воспроизведение видео
3. Если видео не появилось:
   - Right click на Browser Source → Refresh
   - Right click → Interact (откроется окно для отладки)
   - Проверьте Console (F12) на ошибки

## Troubleshooting

### Browser Source показывает "Очередь пуста"

**Причина:** В очереди нет видео

**Решение:**
1. Добавьте видео через Twitch чат: `!play <YouTube_URL>`
2. Или через API (см. README.md)

### Browser Source не загружается (черный экран)

**Причина:** Next.js приложение не запущено

**Решение:**
1. Запустите Next.js: `npm run dev`
2. Проверьте http://localhost:3000/player в браузере
3. Refresh Browser Source в OBS (Right click → Refresh)

### Видео тормозит / лагает

**Решение:**
1. Понизьте FPS Browser Source до 24-25
2. Уменьшите разрешение Browser Source (1280x720 вместо 1920x1080)
3. Закройте другие Browser Sources
4. Проверьте CPU usage в OBS

### Звук не синхронизирован

**Решение:**
1. Right click на Browser Source → Filters
2. Добавьте "Video Delay (Async)" фильтр
3. Настройте delay (обычно 50-200 ms)

### Browser Source не обновляется при добавлении нового видео

**Причина:** Supabase Realtime не подключен

**Решение:**
1. Right click на Browser Source → Interact
2. Откройте Console (F12)
3. Проверьте логи Realtime subscription
4. Если ошибки - проверьте Supabase credentials в `.env.local`

## Advanced: Кастомизация

### Скрыть debug информацию

В файле `components/player/YouTubePlayer.tsx` закомментируйте:

```tsx
{/* Debug info - удалить в production */}
<div className="fixed bottom-4 left-4 ...">
  ...
</div>
```

### Изменить размер плеера

В `components/player/YouTubePlayer.tsx`:

```tsx
playerRef.current = new window.YT.Player('youtube-player', {
  width: '1280',  // Изменить ширину
  height: '720',  // Изменить высоту
  // ...
})
```

### Добавить рамку / эффекты

В OBS:
1. Right click на Browser Source → Filters
2. Добавьте:
   - "Color Correction" - для цветокоррекции
   - "Crop/Pad" - для обрезки
   - "Chroma Key" - для зеленого экрана

## Hotkeys (горячие клавиши)

Вы можете настроить горячие клавиши в OBS для управления Browser Source:

1. Settings → Hotkeys
2. Найдите "YouTube Player" (название вашего Browser Source)
3. Настройте:
   - "Refresh Browser Source" - для обновления
   - "Show/Hide Source" - для показа/скрытия

## Multiple Scenes

Если вы используете несколько сцен:

1. Добавьте Browser Source в каждую сцену
2. Используйте одинаковые настройки URL
3. Отключите "Shutdown source when not visible"
4. Включите "Refresh browser when scene becomes active"

**Совет:** Создайте Browser Source один раз, затем копируйте его между сценами (Copy/Paste).

## Performance Tips

1. **Отключите ненужные Browser Sources** когда не используете
2. **Используйте Hardware Acceleration** в OBS Settings → Advanced
3. **Ограничьте FPS** Browser Source до 24-30
4. **Закрывайте вкладки браузера** с `/player` когда идет трансляция (используйте только OBS)

## Дополнительная информация

### Browser Source Settings

```
URL: http://localhost:3000/player
Width: 1920
Height: 1080
FPS: 30
Use custom frame rate: Unchecked
CSS: (empty)
Shutdown source when not visible: Unchecked
Refresh browser when scene becomes active: Checked
Control audio via OBS: Unchecked
Reroute audio: Unchecked
```

### Shortcuts

- **F5** - Refresh Browser Source (в Interact режиме)
- **F12** - Open Developer Tools (для отладки)
- **Ctrl + Shift + I** - Open DevTools (альтернатива)

## Связь с разработчиком

Если возникли проблемы с Browser Source:
1. Right click → Interact → F12 (Console)
2. Скопируйте ошибки из Console
3. Проверьте логи Next.js в терминале
