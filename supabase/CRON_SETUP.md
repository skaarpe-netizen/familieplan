# Automatisk kalender-synkronisering

`sync-calendars` er deployet som en Supabase Edge Function. Cron-jobbet kører hvert hele time kl. 15 minutter.

## Aktivér cron sikkert

Kør dette i Supabase SQL Editor med en selvvalgt lang, tilfældig secret:

```sql
select vault.create_secret('INDSÆT_DIN_EGEN_LANGE_SECRET', 'sync_cron_secret');
```

Sæt derefter den samme værdi som Edge Function secret i Supabase Dashboard:

`Project Settings -> Edge Functions -> Secrets`

```text
SYNC_CRON_SECRET=INDSÆT_DIN_EGEN_LANGE_SECRET
```

Kør migrationen:

```powershell
npx.cmd supabase db push
```

Kontrollér cron-jobbet:

```sql
select jobid, jobname, schedule, active
from cron.job
where jobname = 'sync-family-calendars-hourly';
```

Secret’en må ikke lægges i GitHub, `.env.local` eller frontendens Vercel variables.
