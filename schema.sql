-- AYDA CRM: execute once in Supabase SQL Editor.
create extension if not exists pgcrypto;
create table public.profiles (id uuid primary key references auth.users(id) on delete cascade, full_name text not null, role text not null default 'teacher' check(role in ('admin','teacher','coordinator')));
create table public.groups (id uuid primary key default gen_random_uuid(), name text not null, level text not null, teacher_id uuid references public.profiles(id), student_count int check(student_count>=0), start_date date, end_date date, weekdays int[] not null default '{}', start_time time, end_time time, total_units int not null default 24, completed_units int not null default 0, archived boolean not null default false, created_at timestamptz default now(), check(completed_units between 0 and total_units));
create table public.lessons (id uuid primary key default gen_random_uuid(), group_id uuid not null references public.groups(id) on delete cascade, scheduled_at timestamptz not null, ends_at timestamptz not null, status text not null default 'scheduled' check(status in ('scheduled','completed','cancelled')), completed_unit int, note text, reported_by uuid references public.profiles(id), reported_at timestamptz, unique(group_id,scheduled_at), check(ends_at>scheduled_at));
create table public.private_students (id uuid primary key default gen_random_uuid(), full_name text not null, teacher_id uuid references public.profiles(id), purchased_units int not null default 0 check(purchased_units>=0));
create table public.private_lessons (id uuid primary key default gen_random_uuid(), student_id uuid not null references public.private_students(id) on delete cascade, scheduled_at timestamptz not null, units int not null default 1 check(units>0), status text not null default 'scheduled' check(status in ('scheduled','completed','cancelled')), topic text, reported_by uuid references public.profiles(id), reported_at timestamptz);
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$select exists(select 1 from public.profiles where id=auth.uid() and role='admin')$$;
create or replace function public.is_staff() returns boolean language sql stable security definer set search_path=public as $$select exists(select 1 from public.profiles where id=auth.uid() and role in ('admin','coordinator'))$$;
create or replace function public.owns_group(g uuid) returns boolean language sql stable security definer set search_path=public as $$select exists(select 1 from public.groups where id=g and teacher_id=auth.uid())$$;
create or replace function public.owns_private(s uuid) returns boolean language sql stable security definer set search_path=public as $$select exists(select 1 from public.private_students where id=s and teacher_id=auth.uid())$$;
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.lessons enable row level security;
alter table public.private_students enable row level security;
alter table public.private_lessons enable row level security;
create policy profile_read on public.profiles for select to authenticated using(id=auth.uid() or public.is_staff());
create policy profile_admin on public.profiles for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy groups_read on public.groups for select to authenticated using(public.is_staff() or teacher_id=auth.uid());
create policy groups_admin on public.groups for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy lessons_read on public.lessons for select to authenticated using(public.is_staff() or public.owns_group(group_id));
create policy lessons_insert on public.lessons for insert to authenticated with check(public.is_admin());
create policy lessons_update on public.lessons for update to authenticated using(public.is_admin() or public.owns_group(group_id)) with check(public.is_admin() or (public.owns_group(group_id) and reported_by=auth.uid()));
create policy private_students_read on public.private_students for select to authenticated using(public.is_staff() or teacher_id=auth.uid());
create policy private_students_admin on public.private_students for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy private_lessons_read on public.private_lessons for select to authenticated using(public.is_staff() or public.owns_private(student_id));
create policy private_lessons_admin_insert on public.private_lessons for insert to authenticated with check(public.is_admin());
create policy private_lessons_update on public.private_lessons for update to authenticated using(public.is_admin() or public.owns_private(student_id)) with check(public.is_admin() or (public.owns_private(student_id) and reported_by=auth.uid()));
-- Prevent teachers from changing schedules/ownership and enforce report-only updates.
create or replace function public.guard_lesson_update() returns trigger language plpgsql security definer set search_path=public as $$begin
 if not public.is_admin() then
  if old.group_id is distinct from new.group_id or old.scheduled_at is distinct from new.scheduled_at or old.ends_at is distinct from new.ends_at then raise exception 'Schedule changes require admin'; end if;
  if old.status <> 'scheduled' then raise exception 'Only unreported lessons may be reported'; end if;
  if new.status not in ('completed','cancelled') then raise exception 'Invalid report status'; end if;
  new.reported_by:=auth.uid(); new.reported_at:=now();
 end if;
 return new; end$$;
create trigger guard_lesson before update on public.lessons for each row execute function public.guard_lesson_update();
create or replace function public.guard_private_update() returns trigger language plpgsql security definer set search_path=public as $$begin
 if not public.is_admin() then
  if old.student_id is distinct from new.student_id or old.scheduled_at is distinct from new.scheduled_at or old.units is distinct from new.units then raise exception 'Schedule changes require admin'; end if;
  if old.status <> 'scheduled' then raise exception 'Already reported'; end if;
  if new.status not in ('completed','cancelled') then raise exception 'Invalid status'; end if;
  new.reported_by:=auth.uid(); new.reported_at:=now();
 end if; return new; end$$;
create trigger guard_private before update on public.private_lessons for each row execute function public.guard_private_update();
create or replace function public.sync_group_progress() returns trigger language plpgsql security definer set search_path=public as $$begin update public.groups set completed_units=coalesce((select max(completed_unit) from public.lessons where group_id=new.group_id and status='completed'),0) where id=new.group_id; return new; end$$;
create trigger sync_progress after update of status,completed_unit on public.lessons for each row execute function public.sync_group_progress();
