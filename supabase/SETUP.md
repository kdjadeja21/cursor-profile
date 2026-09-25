# Connecting Supabase (Live Profile Spotlight)

The `/event` feature ([app/event/](../app/event/)) stores its single-row
"who's presenting" state in a Supabase Postgres table. Follow these steps to
wire up a real project.

## 1. Create a Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and sign in.
2. Click **New project** (pick an existing organization or create one).
3. Choose a name (e.g. `cursor-profile-event`), a database password, and a
   region close to where the event/display screen will run.
4. Wait for the project to finish provisioning (usually under a minute).

You can reuse an existing Supabase project instead — this feature only needs
one extra table, and it lives in its own namespace (`spotlight_session`), so
it won't collide with anything else in that project.

## 2. Run the migration

The schema lives in [supabase/migrations/0001_spotlight_session.sql](./migrations/0001_spotlight_session.sql).
Run it with whichever of these is easiest for you:

### Option A — Supabase Dashboard SQL Editor (fastest, no CLI needed)

1. In your project, open **SQL Editor** in the left sidebar.
2. Click **New query**.
3. Paste the entire contents of
   [supabase/migrations/0001_spotlight_session.sql](./migrations/0001_spotlight_session.sql).
4. Click **Run**.
5. Confirm it succeeded, then open **Table Editor** → you should see a
   `spotlight_session` table with exactly one row (`id = 1`, `status = idle`).

### Option B — Supabase CLI

```bash
npm install -g supabase

# Log in and link this repo to your project (grab the project ref from the
# dashboard URL: https://supabase.com/dashboard/project/<project-ref>)
supabase login
supabase link --project-ref <project-ref>

# Push the migration in supabase/migrations/
supabase db push
```

Either way, this only needs to be run once per Supabase project.

## 3. Get your API credentials

1. In the dashboard, open **Project Settings** → **API**.
2. Copy the **Project URL** — this is `SUPABASE_URL`.
3. Under **Project API keys**, copy the **`service_role`** secret key — this
   is `SUPABASE_SERVICE_ROLE_KEY`.

> **Important:** the service-role key bypasses Row Level Security and must
> never be exposed to the browser. Do **not** prefix it with `NEXT_PUBLIC_`.
> It's only read server-side, inside route handlers under
> [app/event/api/](../app/event/api/) via [lib/supabase/server.ts](../lib/supabase/server.ts).
> The anon/public key is not used anywhere in this feature — RLS is enabled
> on `spotlight_session` with no permissive policies, so only the
> service-role key can read or write it.

## 4. Set the environment variables

### Local development

Create (or update) `.env.local` in the project root:

```bash
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Restart `npm run dev` after adding these — Next.js only reads `.env.local`
at startup.

### Cursor Cloud Agents

Add both `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` as secrets in the
Cursor Dashboard under **Cloud Agents → Secrets**, scoped to this
repository. They'll be injected into future agent runs automatically.

### Vercel (or another host)

Add both variables under **Project Settings → Environment Variables** for
each environment you deploy to (Production/Preview/Development), then
redeploy.

## 5. Verify it works

1. With the env vars set, run `npm run dev`.
2. Open `http://localhost:3000/event/display` in one tab — it should show
   the idle stage (the open spotlight, with no QR).
3. Open `http://localhost:3000/event` in another tab, enter a Cursor
   username (or click **Surprise me**), and submit.
4. The display tab should flip to the full-screen profile within ~2 seconds
   (its polling interval) and count down from 60.
5. In the Supabase **Table Editor**, watch the `spotlight_session` row
   change from `idle` to `presenting` and back after the timer runs out.

If the claim fails immediately with a 500 and a "Supabase is not configured"
message, double-check both env vars are set and that you restarted the dev
server after adding them.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| `500` with "Supabase is not configured" | `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` missing/misspelled, or dev server wasn't restarted after adding them. |
| `spotlight_session` table missing | The migration wasn't run against this project — repeat step 2. |
| Claims always fail with "Someone's up right now" even when idle | Check the row in Table Editor: if `status` is stuck on `presenting` with a very old `started_at`, the expiry check runs on read/claim, not on a timer — hit `/event/api/status` once to trigger it. |
| Claim succeeds but the display never updates | The display fetches status on mount and every 5s while idle — wait a moment, confirm `/event/api/status` returns `presenting`, and that both routes use the same Supabase project. |
