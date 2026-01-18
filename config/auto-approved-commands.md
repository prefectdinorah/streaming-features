# Авто-одобренные команды

Команды и операции, которые Claude Code может выполнять без подтверждения.

> **Примечание:** Эти правила — руководство для агента. Реальные разрешения
> настраиваются в `~/.claude/settings.json` или через UI Claude Code.

---

## Файловые операции (без подтверждения)

### Создание и редактирование
- Создание новых файлов `.ts`, `.tsx`, `.js`, `.jsx`, `.css`, `.json`, `.md`
- Редактирование существующих файлов кода
- Создание папок для компонентов, утилит, типов
- Создание/обновление документации в `docs/`
- Создание тестов `*.test.ts`, `*.spec.ts`

### Структура проекта
```
Можно создавать/изменять без подтверждения:
├── app/                 # Next.js App Router
├── components/          # React компоненты
├── lib/                 # Утилиты
├── types/               # TypeScript типы
├── hooks/               # Custom hooks
├── docs/                # Документация
├── __tests__/           # Тесты
└── .claude/             # Конфигурация агентов
```

### Исключения (требуют подтверждения)
- `.env*` файлы — могут содержать секреты
- `package.json` — изменение зависимостей
- Конфигурационные файлы (`next.config.js`, `tsconfig.json`)
- Удаление файлов

---

## Git (только чтение)

```bash
git status
git log
git log --oneline -20
git diff
git diff --staged
git branch
git branch -a
git remote -v
git show
```

## Node.js / npm

```bash
npm run dev
npm run build
npm run lint
npm run test
npm run test:watch
npm run type-check
npm install
npm ci
npx tsc --noEmit
```

## Просмотр файлов

```bash
ls
ls -la
cat
head
tail
find . -name "*.ts" -type f
tree -L 3
```

## Vercel CLI (только чтение)

```bash
vercel env ls
vercel logs
vercel --version
```

## Supabase CLI (только чтение)

```bash
supabase status
supabase db diff
supabase gen types typescript
```

## Утилиты

```bash
echo
pwd
which
node --version
npm --version
```

---

## Требуют подтверждения

Следующие команды **всегда** требуют явного подтверждения:

- `git push` — отправка изменений
- `git commit` — создание коммита
- `git merge` — слияние веток
- `git checkout -b` — создание веток
- `rm -rf` — удаление файлов
- `vercel --prod` — production деплой
- `supabase db push` — применение миграций
- Любые команды с `sudo`
