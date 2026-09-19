-- Live Profile Spotlight: single-slot session state.
-- Only one row ever exists (id = 1); "who's presenting" atomicity comes from
-- `UPDATE ... WHERE status = 'idle'` in application code (see lib/spotlight.ts),
-- not from anything in this schema.

create type spotlight_status as enum ('idle', 'presenting');

create table if not exists spotlight_session (
  id int primary key default 1,
  status spotlight_status not null default 'idle',
  profile_username text,
  profile_data jsonb,
  started_at timestamptz,
  is_random boolean not null default false,
  constraint spotlight_session_single_row check (id = 1)
);

insert into spotlight_session (id, status)
values (1, 'idle')
on conflict (id) do nothing;

-- All access is server-side via the service-role key (route handlers under
-- app/event/api/*), so RLS stays enabled with no permissive policies — the
-- anon/public role can never read or write this table directly.
alter table spotlight_session enable row level security;
