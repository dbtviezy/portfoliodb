# Портфолио Даниила Баутина (`db.tviezy`)

Сайт-визитка + админка **Studio** (`/studio`).  
Стек: **Next.js 16 · React 19 · Prisma · SQLite/Turso · JWT**.

Прод: [portfoliodb-three.vercel.app](https://portfoliodb-three.vercel.app)  
Репо: [github.com/dbtviezy/portfoliodb](https://github.com/dbtviezy/portfoliodb)

---

## Главное: куда сохраняется контент

| Вопрос | Ответ |
|---|---|
| Studio пишет в **код** (`locales/*.json`)? | **Нет.** JSON в `locales/` — только стартовый seed / запасной контент. |
| Studio пишет куда? | В **базу данных** (Prisma): проекты, карточка, контакты, навыки. |
| Сайт откуда читает? | Из **той же базы** через `/api/content`. Изменил в Studio → сразу на сайте (после успешного Save). |
| Почему на Vercel было «Failed to save project»? | На serverless обычный `file:./dev.db` **не живёт**. Без **Turso** база лежит в `/tmp` и **не держит** правки между запросами. |

**Чтобы править сайт в любой момент с продакшена**, нужна облачная БД **Turso** (бесплатный tier) + две переменные в Vercel. Без этого Studio на Vercel только смотрит контент, но надёжно сохранить не может.

---

## Что за что отвечает (карта проекта)

### Публичный сайт
| Путь / файл | Зачем |
|---|---|
| `/` (`app/page.tsx`) | Главная: Card → Work → Contact |
| `/projects` | Все проекты |
| `components/Hero.tsx` | Имя, роль, волны, CTA |
| `components/BioModal.tsx` | Био по `#bio` |
| `components/Projects.tsx` | Карусель работ |
| `components/Contact.tsx` | Email / Telegram / соцсети из базы |
| `components/Navbar.tsx` | Навигация |
| `components/ContentProvider.tsx` | Тянет `/api/content` и отдаёт тексты всему сайту |
| `app/globals.css` | Токены, градиенты, атмосфера |

### Studio (кабинет)
| Путь | Зачем |
|---|---|
| `/studio` | Логин |
| `/studio/dashboard` | Редактор: вкладки **Card / Work / Reach / Labels** |
| `components/admin/AdminDashboard.tsx` | Весь UI студии |
| `POST /api/auth/login` | Вход, cookie `admin_token` |
| `GET /api/auth/me` | Проверка сессии |
| `PUT /api/admin/portfolio` | Сохранить карточку / контакты / лейблы |
| `GET·POST /api/admin/projects` | Список / создать проект |
| `PUT·DELETE /api/admin/projects/[id]` | Обновить / удалить проект |
| `POST /api/admin/upload` | Drag-and-drop загрузка фото (Vercel Blob / local) |
| `GET /api/admin/db-status` | Режим базы: durable или ephemeral |
| `components/admin/ImageUploader.tsx` | UI: перетащить фото / клик / URL |

### Данные и база
| Файл | Зачем |
|---|---|
| `prisma/schema.prisma` | Модели: Admin, Portfolio, Project, Skill… |
| `prisma/seed.ts` | Первичное наполнение из `locales/` + админ из env |
| `locales/en.json`, `locales/ru.json` | Стартовые тексты EN/RU (не «живой» прод-контент) |
| `lib/content.ts` | Сборка контента сайта из БД |
| `lib/create-prisma.ts` | Подключение: Turso **или** локальный файл **или** `/tmp` на Vercel |
| `lib/db-mode.ts` | Понимает durable vs ephemeral; блокирует «ложные» сохранения |
| `lib/bootstrap-admin.ts` | Первый вход: если админов 0 — создаёт из `ADMIN_EMAIL` / `ADMIN_PASSWORD` |
| `lib/contact-channels.ts` | Каналы связи (Email, Telegram, Behance…) |
| `lib/storage.ts` | Куда класть фото: Vercel Blob или `public/uploads/` |
| `middleware.ts` | Пускает в dashboard только с cookie (проверка JWT — в Node API) |

### Секреты (не коммитить)
| Переменная | Зачем |
|---|---|
| `JWT_SECRET` | Подпись cookie сессии Studio (**обязательно** на проде) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Логин Studio + bootstrap / seed |
| `DATABASE_URL` | Локально: `file:./dev.db`. На Vercel для SQLite-файла — **не подходит** |
| `TURSO_DATABASE_URL` | `libsql://…` — облачная БД на Vercel |
| `TURSO_AUTH_TOKEN` | Токен Turso |
| `BLOB_READ_WRITE_TOKEN` | Хранение фото Studio на Vercel Blob (**нужно для drag-and-drop на проде**) |

`.env` в git **не** попадает. На Vercel секреты задаются только в  
**Project → Settings → Environment Variables** (загрузка файла `.env` в репозиторий секреты **не** включает).

---

## Локально (у себя на машине)

```bash
npm install
cp .env.example .env
# В .env: JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, DATABASE_URL=file:./dev.db
npm run db:setup
npm run dev
```

- Сайт: http://localhost:3000  
- Studio: http://localhost:3000/studio  

Здесь SQLite-файл на диске — **сохранения работают** и сразу видны на сайте.

Полезные команды:

```bash
npm run db:push      # схема → база
npm run db:seed      # контент + админ из env
npm run admin:reset  # сбросить пароль админа из env
npm run build        # как на Vercel: generate + deploy.db + next build
```

---

## Vercel: чтобы Studio реально сохраняла

### 1. Создай бесплатную БД Turso
1. Зайди на [turso.tech](https://turso.tech), создай database.  
2. Скопируй URL (`libsql://…`) и auth token.

### 2. В Vercel → Environment Variables (Production + Preview)
- `TURSO_DATABASE_URL` = `libsql://…`
- `TURSO_AUTH_TOKEN` = токен
- `JWT_SECRET` = длинная случайная строка
- `ADMIN_EMAIL` = твой email для входа
- `ADMIN_PASSWORD` = сильный пароль

### 3. Примени схему к Turso (с компьютера)

```bash
# Один раз: установить CLI и залогиниться
# https://docs.turso.tech/cli
turso db shell ИМЯ_ТВОЕЙ_БД < prisma/migrations/20260721134448_init/migration.sql
```

Если в схеме уже больше полей, чем в старой migration — надёжнее:

```bash
# Локально собрать актуальную схему в файл, затем скормить Turso
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > /tmp/schema.sql
turso db shell ИМЯ_ТВОЕЙ_БД < /tmp/schema.sql
```

Или seed/admin с Turso-env:

```bash
export TURSO_DATABASE_URL="libsql://..."
export TURSO_AUTH_TOKEN="..."
export ADMIN_EMAIL="you@example.com"
export ADMIN_PASSWORD="your-password"
npm run admin:reset
# при необходимости: npm run db:seed
```

### 4. Redeploy на Vercel
После переменных — **Redeploy**.  
В Studio баннер про `/tmp` должен пропасть. Save проекта / карточки пишет в Turso → сайт читает оттуда.

### 5. Фото (drag-and-drop) — Vercel Blob
1. Vercel → проект → **Storage** → **Create Database / Blob** (Public).  
2. Vercel сам добавит `BLOB_READ_WRITE_TOKEN` в Environment Variables (проверь Production + Preview).  
3. **Redeploy**.  
4. В Studio: Card → Portrait или Work → проект — зона «Перетащи фото сюда».  
5. URL картинки пишется в поле; не забудь **Save changes** / сохранить проект — ссылка уходит в Turso.

Локально без Blob файлы кладутся в `public/uploads/` и открываются как `/uploads/...`.

Лимит серверной загрузки ~**4.5 MB** (JPEG / PNG / WebP / GIF / AVIF).

### 6. Вход
`/studio` → `ADMIN_EMAIL` + `ADMIN_PASSWORD`.  
Если таблица Admin пустая — первый успешный вход **сам создаст** админа (bootstrap).

---

## Как устроен поток «изменил → увидел на сайте»

```
Studio (Save / Upload photo)
    → API /api/admin/...  (нужна cookie login)
        → фото → Vercel Blob (URL) или public/uploads
        → тексты/URL → Prisma → Turso (прод) или file:./dev.db (локаль)
            → сайт /api/content читает ту же БД
                → Hero / Projects / Contact / Bio показывают новое
```

Без Turso на Vercel цепочка рвётся на шаге «записать в базу»: API отвечает понятной ошибкой вместо тихого «Failed to save project».

---

## Структура вкладок Studio

| Вкладка | Что правишь |
|---|---|
| **Card** | Hero-тексты, about, фото, expertise |
| **Work** | Проекты (создать / изменить / удалить, featured) |
| **Reach** | Контакты и соцсети (каналы) |
| **Labels** | Подписи навбара, заголовки секций, skills |

Язык EN/RU переключается в шапке Studio — у каждого языка **свои** строки в БД.

---

## Деплой (когда скажешь)

Сейчас правки могут лежать в ветке без выката на прод — **деплой только по твоей команде**.

Обычный путь после merge в `main`: Vercel подхватит сам.  
Build: `prisma generate` → `prepare-deploy-db` (снимок для аварийного чтения) → `next build`.

`prisma/deploy.db` — только запасной снимок для чтения/логина без Turso. **Не** замена облачной БД для сохранений.

---

## Если что-то сломалось

| Симптом | Что проверить |
|---|---|
| `Failed to save project` / баннер про Turso | Нет `TURSO_*` в Vercel или не сделан Redeploy |
| Не грузится фото / ошибка про Blob Store | Создай Blob в Vercel Storage и проверь `BLOB_READ_WRITE_TOKEN` + Redeploy |
| `Неверный email или пароль` | `ADMIN_*` в Vercel; или `npm run admin:reset` с Turso-env |
| `JWT_SECRET is required` | Задай `JWT_SECRET` в Vercel |
| Контент пустой / 404 content | Схема не применена к Turso или база пустая → seed / первый заход на сайт сидит из locales |
| Бесконечный редирект Studio | Старая cookie; Logout или очисти cookie `admin_token` |

---

Сделано для тебя: правь визитку из Studio когда угодно — после подключения Turso сохранения живут в облаке и сразу кормят сайт. Код в `locales/` сам по себе после деплоя «магически» не меняется от кнопок Save.
