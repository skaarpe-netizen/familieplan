# Familieplanen

Familieplanen er et touch-optimeret familiedashboard til en fastmonteret skærm i køkkenet. MVP'en er bygget med React, TypeScript, Vite, Tailwind CSS, React Router, Zustand og Supabase-klienten.

## Kom i gang

Forudsætter Node.js 20+ og npm.

```bash
npm install
copy .env.example .env.local
npm run dev
```

Åbn derefter `http://localhost:5173`. Login er i demo-tilstand og sender videre til dashboardet. Supabase Auth kobles på via `VITE_SUPABASE_URL` og `VITE_SUPABASE_ANON_KEY`.

## Struktur

- `src/App.tsx` - routes og MVP-view
- `src/features/calendar` - kalenderdata og kalenderfunktioner
- `src/store` - lokal UI-state for filtre og visning
- `src/lib/supabase.ts` - Supabase-klient
- `supabase/migrations` - PostgreSQL-schema, indexes og RLS
- `supabase/functions` - synkronisering og billed-cache endpoints

## Supabase

1. Opret et Supabase-projekt.
2. Kør migrationen i `supabase/migrations`.
3. Aktivér Google provider under Authentication > Providers.
4. Sæt redirect URL til den lokale og deployede app.
5. Deploy Edge Functions med Supabase CLI.

```bash
supabase db push
supabase functions deploy sync-calendars
supabase functions deploy sync-weather
supabase functions deploy sync-meal-plan
supabase functions deploy generate-meal-image
```

## Vercel

Importér repository'et i Vercel, vælg Vite, og tilføj `VITE_SUPABASE_URL` samt `VITE_SUPABASE_ANON_KEY` som environment variables. Build command er `npm run build`, output er `dist`.

## Roadmap

Sprint 1 er dækket med routing, mock-dashboard, adminflade, PWA manifest og Supabase-integrationens grundstruktur. Sprint 2-4 har types, migrationer og Edge Function-skeletter klar til ICS-parser, Open-Meteo-cache, FullCalendar og image provider.
