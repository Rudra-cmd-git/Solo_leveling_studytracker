# The System — Solo Leveling Study Tracker

A single-user study tracker inspired by the "System" from *Solo Leveling*. Log focus sessions, earn XP, complete daily and weekly quests, build streaks, raise your Hunter rank, and watch your attributes grow.

This is an original fan-made interface. It does not include or redistribute artwork from the series.

## Features

- **Focus timer** with presets, pause/resume, elapsed tracking, and a post-session review step
- **Manual session logging** for study completed away from the timer
- **XP and levels** with an escalating level curve
- **Hunter ranks E → S**, each with its own title and visual treatment
- **Daily and weekly quests** with claimable XP rewards
- **Study streaks** that keep the chain alive through today or yesterday
- **Five attributes** — Intelligence, Focus, Discipline, Vitality, Perception
- **Achievements** with progress tracking and XP rewards
- **Analytics** — 14-day XP trend, subject split, and a 12-week study heatmap
- **Session archive** with search, subject filter, date range, and deletion
- **Settings** for hunter name, daily goal, default timer, timezone, and chime
- **JSON backup and restore** plus a progress reset
- **Responsive layout** with desktop sidebar and mobile bottom navigation
- **Single-user** with no account system — just open it and start training

## Tech stack

- [Next.js 16](https://nextjs.org/) (App Router, Server Actions)
- React 19
- TypeScript
- Tailwind CSS v4
- SQLite-compatible [libSQL](https://turso.tech/) through [`@libsql/client`](https://github.com/tursodatabase/libsql-client-ts) and [Drizzle ORM](https://orm.drizzle.team/)
- Zod for input validation
- Vitest for unit tests
- Lucide icons

## Getting started

Requires **Node.js 22+** and npm.

```bash
git clone git@github.com:Rudra-cmd-git/Solo_leveling_studytracker.git
cd Solo_leveling_studytracker
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). On first launch, the System asks for your Hunter name, daily study goal, and timezone.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm start` | Run the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run the TypeScript compiler |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Run Vitest in watch mode |

## Data and privacy

Data is stored in a libSQL database. When run locally without configuration, it uses a SQLite file at `data/study-tracker.db`; the `data/` directory is gitignored and is created automatically on first run. When deployed, point the app at a hosted libSQL database (for example [Turso](https://turso.tech/)) using environment variables — see [Deploying](#deploying).

Use **Settings → Data vault → Export backup** to download a complete JSON copy of your record. **Restore backup** replaces the current record with the uploaded file. The backup is validated before anything is written, so a failed restore leaves your existing data untouched.

To use a hosted libSQL database locally, set:

```bash
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token
npm run dev
```

To store the local file somewhere else, set `DATABASE_PATH` instead:

```bash
DATABASE_PATH=/path/to/study-tracker.db npm run dev
```

## Deploying to Vercel

This app needs a hosted libSQL database because Vercel's filesystem is read-only.

1. Create a [Turso](https://turso.tech/) database and copy its URL and auth token:

   ```bash
   turso db create solo-leveling
   turso db show solo-leveling --url
   turso db tokens create solo-leveling
   ```

2. Copy `.env.example` to `.env.local` locally (optional) or add these variables directly in Vercel:

   | Variable | Value |
   | --- | --- |
   | `TURSO_DATABASE_URL` | the `libsql://…` URL |
   | `TURSO_AUTH_TOKEN` | the generated token |

3. Push to GitHub, import the repo on [Vercel](https://vercel.com/new), add both environment variables under **Settings → Environment Variables** (all environments), and redeploy.

Your app will be live at https://solo-leveling-studytracker.vercel.app/. Tables and default quests/achievements are created automatically on the first request.

## How progression works

### Session XP

```text
XP = round(minutes × 2 × (0.8 + focus × 0.1)) + 10
```

Focus is rated from 1 to 5. A 25-minute session at focus 3 earns **65 XP**.

### Levels

The XP required to advance from level `L` is:

```text
100 + (L − 1) × 50
```

Level 1 → 2 costs 100 XP, level 2 → 3 costs 150 XP, and so on.

### Ranks

| Rank | Title | Level |
| --- | --- | --- |
| E | Unawakened | 1 |
| D | Awakened Hunter | 10 |
| C | Elite Hunter | 20 |
| B | Veteran Hunter | 30 |
| A | Apex Hunter | 40 |
| S | Sovereign | 50 |

### Streaks

A streak counts consecutive days with at least one session. The chain remains active if your latest session was today or yesterday; it breaks when the most recent session is older than that. Breaking a streak does not remove XP.

### Quests

Daily quests reset at midnight in your configured timezone. Weekly quests reset on Monday. Complete the objective, then claim the reward. Claimed rewards are recorded per period and cannot be claimed twice.

## Project structure

```text
src/
  app/
    actions.ts          Server actions for sessions, quests, settings, and subjects
    api/export/         JSON backup download
    api/import/         Validated JSON backup restore
    focus/              Focus timer screen
    progress/           Levels, ranks, charts, and achievements
    quests/             Daily and weekly quest log
    sessions/           Session archive and manual logging
    settings/           Profile, subjects, and data management
  components/           UI primitives and feature components
  lib/
    data.ts             Aggregated reads for pages
    dates.ts            Timezone-safe date helpers
    db/                 libSQL client, schema bootstrap, and seed data
    game.ts             XP, rank, streak, stat, and achievement logic
    types.ts            Shared types
tests/                  Vitest unit tests
```

## Tests

The test suite covers the progression formulas, rank thresholds, streak edge cases, attribute calculations, achievement conditions, formatting, and date/timezone helpers.

```bash
npm test
```

## License

Personal project. No license is granted for redistribution.
