-- Base multi-tenant do MVP Ritmo. A autorização de domínio depende de auth.uid()
-- e dos vínculos registrados; nunca de IDs de tenant enviados pelo cliente.
create extension if not exists pgcrypto with schema extensions;

create type public.app_role as enum ('trainer', 'student');
create type public.relationship_status as enum ('pending', 'active', 'paused', 'ended');
create type public.workout_status as enum ('draft', 'active', 'archived');
create type public.session_status as enum ('in_progress', 'completed', 'abandoned');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role public.app_role not null default 'student',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.trainer_accounts (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);
create table public.trainer_students (
  id uuid primary key default extensions.gen_random_uuid(),
  trainer_id uuid not null references public.trainer_accounts(user_id) on delete cascade,
  student_id uuid references public.profiles(id) on delete restrict,
  invited_email text not null check (invited_email = lower(trim(invited_email))),
  status public.relationship_status not null default 'pending',
  invited_at timestamptz not null default now(),
  activated_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  check (student_id is null or student_id <> trainer_id),
  check (status <> 'active' or student_id is not null),
  unique (trainer_id, invited_email)
);
create unique index trainer_students_one_active_trainer_per_student
  on public.trainer_students(student_id) where status = 'active' and student_id is not null;
create index trainer_students_by_trainer on public.trainer_students(trainer_id, status);
create index trainer_students_by_student on public.trainer_students(student_id, status);

create table public.exercises (
  id uuid primary key default extensions.gen_random_uuid(),
  trainer_id uuid references public.trainer_accounts(user_id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  muscle_groups text[] not null default '{}',
  equipment text[] not null default '{}',
  difficulty text not null default 'beginner' check (difficulty in ('beginner', 'intermediate', 'advanced')),
  instructions text not null default '',
  video_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index exercises_global_name on public.exercises(lower(name)) where trainer_id is null;
create unique index exercises_trainer_name on public.exercises(trainer_id, lower(name)) where trainer_id is not null;

create table public.workout_plans (
  id uuid primary key default extensions.gen_random_uuid(),
  trainer_id uuid not null references public.trainer_accounts(user_id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  goal text not null default '',
  notes text not null default '',
  status public.workout_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index workout_plans_by_trainer on public.workout_plans(trainer_id, status, updated_at desc);

create table public.workout_exercises (
  id uuid primary key default extensions.gen_random_uuid(),
  workout_id uuid not null references public.workout_plans(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  position integer not null check (position > 0),
  sets_count integer not null default 3 check (sets_count between 1 and 30),
  reps text not null default '10',
  target_load_kg numeric(7,2) check (target_load_kg is null or target_load_kg >= 0),
  rest_seconds integer not null default 60 check (rest_seconds between 0 and 3600),
  coach_note text not null default '',
  created_at timestamptz not null default now(),
  unique (workout_id, position)
);
create index workout_exercises_by_workout on public.workout_exercises(workout_id, position);

create table public.workout_assignments (
  id uuid primary key default extensions.gen_random_uuid(),
  relationship_id uuid not null references public.trainer_students(id) on delete restrict,
  workout_id uuid not null references public.workout_plans(id) on delete restrict,
  assigned_by uuid not null references public.trainer_accounts(user_id) on delete restrict,
  assigned_at timestamptz not null default now(),
  starts_on date not null default current_date,
  ends_on date,
  status text not null default 'active' check (status in ('active', 'paused', 'completed', 'cancelled')),
  workout_snapshot jsonb not null,
  created_at timestamptz not null default now(),
  check (ends_on is null or ends_on >= starts_on)
);
create index workout_assignments_by_relationship on public.workout_assignments(relationship_id, status, starts_on desc);

create table public.training_sessions (
  id uuid primary key default extensions.gen_random_uuid(),
  assignment_id uuid not null references public.workout_assignments(id) on delete restrict,
  student_id uuid not null references public.profiles(id) on delete restrict,
  status public.session_status not null default 'in_progress',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  workout_snapshot jsonb not null,
  created_at timestamptz not null default now(),
  check ((status = 'completed') = (completed_at is not null))
);
create index training_sessions_by_student on public.training_sessions(student_id, started_at desc);

create table public.set_logs (
  id uuid primary key default extensions.gen_random_uuid(),
  session_id uuid not null references public.training_sessions(id) on delete cascade,
  workout_exercise_id uuid not null references public.workout_exercises(id) on delete restrict,
  set_number integer not null check (set_number > 0),
  reps_completed integer not null check (reps_completed >= 0),
  load_kg numeric(7,2) check (load_kg is null or load_kg >= 0),
  completed boolean not null default false,
  logged_at timestamptz not null default now(),
  unique (session_id, workout_exercise_id, set_number)
);
create table public.session_feedback (
  session_id uuid primary key references public.training_sessions(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  note text not null default '',
  created_at timestamptz not null default now()
);

-- Funções de vínculo com search_path fechado para uso em policies RLS.
create or replace function public.is_active_trainer_of(target_student uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.trainer_students ts
    where ts.trainer_id = (select auth.uid()) and ts.student_id = target_student and ts.status = 'active');
$$;
create or replace function public.is_active_student_of(target_trainer uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.trainer_students ts
    where ts.trainer_id = target_trainer and ts.student_id = (select auth.uid()) and ts.status = 'active');
$$;

-- O papel de personal é concedido apenas por esta RPC autenticada; não se lê role
-- de user_metadata, que poderia ser enviada livremente pelo cliente.
create or replace function public.create_trainer_account(account_name text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare account_user_id uuid := (select auth.uid());
begin
  if account_user_id is null then raise exception 'Entre na conta primeiro.' using errcode = '28000'; end if;
  if length(trim(coalesce(account_name, ''))) < 2 then raise exception 'Informe um nome válido.' using errcode = '22023'; end if;
  if exists (select 1 from public.trainer_accounts where user_id = account_user_id) then
    raise exception 'Este usuário já possui um espaço de personal.' using errcode = '23505';
  end if;
  insert into public.profiles (id, full_name, role)
    values (account_user_id, trim(account_name), 'trainer')
    on conflict (id) do update set full_name = excluded.full_name, role = 'trainer', updated_at = now();
  insert into public.trainer_accounts (user_id, display_name) values (account_user_id, trim(account_name));
  return account_user_id;
end;
$$;

create or replace function public.invite_student(student_email text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare invitation_id uuid;
declare normalized_email text := lower(trim(coalesce(student_email, '')));
begin
  if (select auth.uid()) is null then raise exception 'Entre na conta primeiro.' using errcode = '28000'; end if;
  if not exists (select 1 from public.trainer_accounts where user_id = (select auth.uid())) then
    raise exception 'Crie seu espaço de personal antes de convidar.' using errcode = '42501';
  end if;
  if normalized_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    raise exception 'Informe um e-mail válido.' using errcode = '22023';
  end if;
  insert into public.trainer_students (trainer_id, invited_email)
    values ((select auth.uid()), normalized_email)
    on conflict (trainer_id, invited_email) do update
      set status = 'pending', student_id = null, invited_at = now(), activated_at = null, ended_at = null
      where public.trainer_students.status <> 'active'
    returning id into invitation_id;
  if invitation_id is null then raise exception 'Este aluno já possui vínculo ativo.' using errcode = '23505'; end if;
  return invitation_id;
end;
$$;

create or replace function public.accept_trainer_invitation(target_invitation uuid)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare accepted_id uuid;
begin
  if (select auth.uid()) is null or (select auth.jwt() ->> 'email') is null then
    raise exception 'Entre na conta para aceitar o convite.' using errcode = '28000';
  end if;
  update public.trainer_students ts
    set student_id = (select auth.uid()), status = 'active', activated_at = now()
    where ts.id = target_invitation
      and ts.invited_email = lower((select auth.jwt() ->> 'email'))
      and ts.status = 'pending' and ts.student_id is null
    returning ts.id into accepted_id;
  if accepted_id is null then raise exception 'Não há convite pendente para este e-mail.' using errcode = 'P0002'; end if;
  return accepted_id;
end;
$$;

-- Copia a prescrição na atribuição: edições futuras não reescrevem histórico.
create or replace function public.start_training_session(target_assignment uuid)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare new_session uuid;
begin
  if (select auth.uid()) is null then raise exception 'Entre na conta primeiro.' using errcode = '28000'; end if;
  insert into public.training_sessions (assignment_id, student_id, workout_snapshot)
  select wa.id, (select auth.uid()), wa.workout_snapshot
    from public.workout_assignments wa
    join public.trainer_students ts on ts.id = wa.relationship_id
   where wa.id = target_assignment and ts.student_id = (select auth.uid())
     and ts.status = 'active' and wa.status = 'active'
     and wa.starts_on <= current_date and (wa.ends_on is null or wa.ends_on >= current_date)
  returning id into new_session;
  if new_session is null then raise exception 'Treino não atribuído ou fora do período.' using errcode = '42501'; end if;
  return new_session;
end;
$$;

create or replace function public.complete_training_session(target_session uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  update public.training_sessions
     set status = 'completed', completed_at = now()
   where id = target_session and student_id = (select auth.uid()) and status = 'in_progress';
  if not found then raise exception 'Sessão ativa não encontrada.' using errcode = 'P0002'; end if;
end;
$$;

create or replace function public.assign_workout(target_relationship uuid, target_workout uuid, first_day date default current_date)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare new_assignment uuid;
declare snapshot jsonb;
begin
  if (select auth.uid()) is null then raise exception 'Entre na conta primeiro.' using errcode = '28000'; end if;
  if not exists (select 1 from public.trainer_students ts
    where ts.id = target_relationship and ts.trainer_id = (select auth.uid()) and ts.status = 'active') then
    raise exception 'Vínculo de aluno inválido.' using errcode = '42501';
  end if;
  select jsonb_build_object('id', wp.id, 'name', wp.name, 'goal', wp.goal, 'notes', wp.notes,
    'exercises', coalesce(jsonb_agg(jsonb_build_object(
      'id', we.id, 'position', we.position, 'sets', we.sets_count, 'reps', we.reps,
      'targetLoadKg', we.target_load_kg, 'restSeconds', we.rest_seconds, 'coachNote', we.coach_note,
      'exercise', jsonb_build_object('id', e.id, 'name', e.name, 'muscleGroups', e.muscle_groups,
        'equipment', e.equipment, 'difficulty', e.difficulty, 'instructions', e.instructions, 'videoUrl', e.video_url)
    ) order by we.position) filter (where we.id is not null), '[]'::jsonb))
    into snapshot
    from public.workout_plans wp
    left join public.workout_exercises we on we.workout_id = wp.id
    left join public.exercises e on e.id = we.exercise_id
    where wp.id = target_workout and wp.trainer_id = (select auth.uid()) and wp.status = 'active'
    group by wp.id;
  if snapshot is null then raise exception 'Treino ativo não encontrado.' using errcode = 'P0002'; end if;
  insert into public.workout_assignments (relationship_id, workout_id, assigned_by, starts_on, workout_snapshot)
    values (target_relationship, target_workout, (select auth.uid()), first_day, snapshot)
    returning id into new_assignment;
  return new_assignment;
end;
$$;

insert into public.exercises (name, muscle_groups, equipment, difficulty, instructions) values
  ('Supino reto', array['Peito'], array['Barra'], 'beginner', 'Mantenha os pés firmes e controle a descida.'),
  ('Remada baixa', array['Costas'], array['Polia'], 'beginner', 'Puxe em direção ao abdômen sem arredondar a coluna.'),
  ('Agachamento', array['Quadríceps', 'Glúteos'], array['Barra'], 'intermediate', 'Desça com controle e mantenha os joelhos alinhados.'),
  ('Desenvolvimento', array['Ombros'], array['Halteres'], 'beginner', 'Empurre acima da cabeça sem arquear a lombar.'),
  ('Levantamento terra', array['Posterior', 'Costas'], array['Barra'], 'advanced', 'Mantenha a barra próxima ao corpo e a coluna neutra.'),
  ('Tríceps pulley', array['Tríceps'], array['Polia'], 'beginner', 'Estenda os cotovelos sem movimentar os ombros.'),
  ('Ponte de glúteo', array['Glúteos'], array['Peso corporal'], 'beginner', 'Eleve o quadril contraindo os glúteos.'),
  ('Prancha', array['Core'], array['Peso corporal'], 'beginner', 'Mantenha cabeça, tronco e quadril alinhados.');

alter table public.profiles enable row level security;
alter table public.trainer_accounts enable row level security;
alter table public.trainer_students enable row level security;
alter table public.exercises enable row level security;
alter table public.workout_plans enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.workout_assignments enable row level security;
alter table public.training_sessions enable row level security;
alter table public.set_logs enable row level security;
alter table public.session_feedback enable row level security;

create policy "profiles read self or linked students" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_active_trainer_of(id));
create policy "profiles update self" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "trainer accounts read self or linked trainer" on public.trainer_accounts for select to authenticated
  using (user_id = (select auth.uid()) or public.is_active_student_of(user_id));

create policy "participants read relationship" on public.trainer_students for select to authenticated
  using (trainer_id = (select auth.uid()) or student_id = (select auth.uid())
    or (status = 'pending' and invited_email = lower((select auth.jwt() ->> 'email'))));

create policy "read global or related exercises" on public.exercises for select to authenticated
  using (is_active and (trainer_id is null or trainer_id = (select auth.uid()) or public.is_active_student_of(trainer_id)));
create policy "trainers manage own exercises" on public.exercises for all to authenticated
  using (trainer_id = (select auth.uid()) and exists (select 1 from public.trainer_accounts where user_id = (select auth.uid())))
  with check (trainer_id = (select auth.uid()) and exists (select 1 from public.trainer_accounts where user_id = (select auth.uid())));

create policy "read own or assigned plans" on public.workout_plans for select to authenticated
  using (trainer_id = (select auth.uid()) or exists (
    select 1 from public.workout_assignments wa join public.trainer_students ts on ts.id = wa.relationship_id
    where wa.workout_id = workout_plans.id and ts.student_id = (select auth.uid()) and wa.status = 'active' and ts.status = 'active'));
create policy "trainer creates own plans" on public.workout_plans for insert to authenticated
  with check (trainer_id = (select auth.uid()) and exists (select 1 from public.trainer_accounts where user_id = (select auth.uid())));
create policy "trainer updates own plans" on public.workout_plans for update to authenticated
  using (trainer_id = (select auth.uid())) with check (trainer_id = (select auth.uid()));
create policy "trainer deletes unassigned own plans" on public.workout_plans for delete to authenticated
  using (trainer_id = (select auth.uid()) and not exists (select 1 from public.workout_assignments wa where wa.workout_id = workout_plans.id));

create policy "read items for visible plans" on public.workout_exercises for select to authenticated
  using (exists (select 1 from public.workout_plans wp where wp.id = workout_id));
create policy "trainer manages items in own plans" on public.workout_exercises for all to authenticated
  using (exists (select 1 from public.workout_plans wp where wp.id = workout_id and wp.trainer_id = (select auth.uid())))
  with check (exists (
    select 1 from public.workout_plans wp join public.exercises e on e.id = exercise_id
    where wp.id = workout_id and wp.trainer_id = (select auth.uid()) and (e.trainer_id is null or e.trainer_id = (select auth.uid()))));

create policy "participants read assignments" on public.workout_assignments for select to authenticated
  using (assigned_by = (select auth.uid()) or exists (
    select 1 from public.trainer_students ts where ts.id = relationship_id and ts.student_id = (select auth.uid())));
create policy "trainer updates own assignments" on public.workout_assignments for update to authenticated
  using (assigned_by = (select auth.uid())) with check (assigned_by = (select auth.uid()));

create policy "participants read sessions" on public.training_sessions for select to authenticated
  using (student_id = (select auth.uid()) or exists (
    select 1 from public.workout_assignments wa join public.trainer_students ts on ts.id = wa.relationship_id
    where wa.id = assignment_id and ts.trainer_id = (select auth.uid())));
create policy "student starts own assigned session" on public.training_sessions for insert to authenticated
  with check (student_id = (select auth.uid()) and status = 'in_progress' and completed_at is null and exists (
    select 1 from public.workout_assignments wa join public.trainer_students ts on ts.id = wa.relationship_id
    where wa.id = assignment_id and ts.student_id = (select auth.uid()) and ts.status = 'active' and wa.status = 'active'
      and wa.starts_on <= current_date and (wa.ends_on is null or wa.ends_on >= current_date)));
create policy "student updates own in progress sessions" on public.training_sessions for update to authenticated
  using (student_id = (select auth.uid()) and status = 'in_progress') with check (student_id = (select auth.uid()));

create policy "participants read set logs" on public.set_logs for select to authenticated
  using (exists (select 1 from public.training_sessions s where s.id = session_id));
create policy "student writes own active session sets" on public.set_logs for all to authenticated
  using (exists (select 1 from public.training_sessions s where s.id = session_id and s.student_id = (select auth.uid()) and s.status = 'in_progress'))
  with check (exists (
    select 1 from public.training_sessions s join public.workout_assignments wa on wa.id = s.assignment_id
      join public.workout_exercises we on we.id = workout_exercise_id and we.workout_id = wa.workout_id
    where s.id = session_id and s.student_id = (select auth.uid()) and s.status = 'in_progress'));

create policy "participants read feedback" on public.session_feedback for select to authenticated
  using (exists (select 1 from public.training_sessions s where s.id = session_id));
create policy "student writes own completed feedback" on public.session_feedback for all to authenticated
  using (exists (select 1 from public.training_sessions s where s.id = session_id and s.student_id = (select auth.uid()) and s.status = 'completed'))
  with check (exists (select 1 from public.training_sessions s where s.id = session_id and s.student_id = (select auth.uid()) and s.status = 'completed'));

revoke all on function public.is_active_trainer_of(uuid) from public;
revoke all on function public.is_active_student_of(uuid) from public;
grant execute on function public.is_active_trainer_of(uuid), public.is_active_student_of(uuid) to authenticated;
revoke all on function public.create_trainer_account(text), public.invite_student(text), public.accept_trainer_invitation(uuid), public.assign_workout(uuid, uuid, date) from public;
grant execute on function public.create_trainer_account(text), public.invite_student(text), public.accept_trainer_invitation(uuid), public.assign_workout(uuid, uuid, date) to authenticated;
revoke all on function public.start_training_session(uuid), public.complete_training_session(uuid) from public;
grant execute on function public.start_training_session(uuid), public.complete_training_session(uuid) to authenticated;

grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;
grant select on public.trainer_accounts to authenticated;
grant select on public.trainer_students to authenticated;
grant select, insert, update, delete on public.exercises, public.workout_plans, public.workout_exercises, public.set_logs, public.session_feedback to authenticated;
grant select, update on public.workout_assignments to authenticated;
grant select on public.training_sessions to authenticated;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), ''))
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
