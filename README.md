# AYDA Akademik Takip – production foundation
This is a **real Supabase-backed application**, not localStorage demo. It is not deployed until you configure it.

## Installation
1. Create a Supabase project; open SQL Editor and run `schema.sql`.
2. In Supabase Authentication > Users create your first administrator using email/password. Copy their UUID.
3. In SQL Editor, run `insert into public.profiles(id,full_name,role) values ('YOUR-AUTH-USER-UUID','AYDA Yönetim','admin');`.
4. Copy `config.example.js` to `config.js`; set project URL and **publishable/anon key** from Supabase Project Settings > API. NEVER use service_role/secret key in browser files.
5. Upload `index.html`, `app.js`, `config.js` to a GitHub Pages repository; set Pages publishing from main/root. Enable HTTPS.
6. Create teachers in Supabase Auth > Users, then add a matching `profiles` row with role `teacher`. Admin may add groups and individual scheduled lessons in the UI.
7. To load existing AYDA groups, enter them via admin UI; do not invent missing schedules or unit progress.

## Important release limitations
This foundation has centralized auth, RLS and reports, but does **not yet implement recurring schedule generation**, user management UI, audit logs, automatic backups, full private-lesson creation UI, or transactional enforcement of private-lesson balance. Teachers should not be onboarded until these are finished and tested. No student personal data should be entered before security review.
The trigger `sync_group_progress` tracks max completed unit and assumes monotonic progress. Group lesson durations are clock times; 40-minute group and 50-minute private unit rules should be enforced in the future scheduler. Do not interpret arbitrary elapsed time as teaching units when breaks are included.
