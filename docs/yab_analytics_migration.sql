-- یاب: افزودن فراداده‌های تحلیلی به رویدادها
-- در Supabase > SQL Editor اجرا شود؛ این تغییر داده‌های قبلی را حذف نمی‌کند.
alter table public.yab_events
  add column if not exists platform text,
  add column if not exists device_type text,
  add column if not exists browser text,
  add column if not exists device_model text,
  add column if not exists user_agent text,
  add column if not exists language text,
  add column if not exists screen_size text,
  add column if not exists device_id text,
  add column if not exists app_version text;

create index if not exists yab_events_created_at_idx
  on public.yab_events (created_at desc);

create index if not exists yab_events_event_type_created_at_idx
  on public.yab_events (event_type, created_at desc);

-- یادآوری: درج رویداد از سایت باید با سیاست INSERT موجود در RLS سازگار باشد.
-- user_agent و device_id همچنان داده‌های تحلیلی‌اند؛ در سیاست حریم خصوصی سایت توضیح داده شوند.
