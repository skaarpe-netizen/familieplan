create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Store the cron secret in Supabase Vault before enabling the schedule:
-- select vault.create_secret('replace-with-a-long-random-secret', 'sync_cron_secret');

select cron.schedule(
  'sync-family-calendars-hourly',
  '15 * * * *',
  $$
  select net.http_post(
    url := 'https://ttpbywklmxstwuxqiqte.supabase.co/functions/v1/sync-calendars',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-sync-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'sync_cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
