-- Programas com validade, fichas por dia, prescrição numérica, feedback com
-- esforço/dor e medidas corporais estruturadas.
-- Origem: REA do MFIT Personal 9.1.2 (docs/rea-mfit-para-ritmo.md). Corrige,
-- por desenho, problemas observados lá: carga em texto livre ("15-15" plotado
-- como 1.515 kg) e medidas guardadas como foto de ficha em papel.

-- 1. Programa (bloco com validade) ------------------------------------------
create table public.programs (
  id uuid primary key default extensions.gen_random_uuid(),
  trainer_id uuid not null references public.trainer_accounts(user_id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  goal text not null default '',
  level text not null default '',
  general_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index programs_by_trainer on public.programs(trainer_id, updated_at desc);

-- Fichas (workout_plans) passam a pertencer opcionalmente a um programa.
alter table public.workout_plans
  add column program_id uuid references public.programs(id) on delete cascade,
  add column day_label text not null default '',
  add column weekday smallint check (weekday is null or weekday between 1 and 7);
create index workout_plans_by_program on public.workout_plans(program_id, weekday);

-- 2. Prescrição numérica ------------------------------------------------------
alter table public.workout_exercises
  add column reps_min smallint check (reps_min is null or reps_min > 0),
  add column reps_max smallint check (reps_max is null or reps_max > 0),
  add column load_per_side boolean not null default false,
  add constraint workout_exercises_reps_range check (reps_min is null or reps_max is null or reps_min <= reps_max);

-- 3. Atribuição de programa com validade --------------------------------------
create table public.program_assignments (
  id uuid primary key default extensions.gen_random_uuid(),
  relationship_id uuid not null references public.trainer_students(id) on delete restrict,
  program_id uuid not null references public.programs(id) on delete restrict,
  assigned_by uuid not null references public.trainer_accounts(user_id) on delete restrict,
  starts_on date not null default current_date,
  ends_on date not null,
  status text not null default 'active' check (status in ('active', 'paused', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);
create index program_assignments_by_relationship on public.program_assignments(relationship_id, status, ends_on desc);

-- 4. Feedback com esforço e dor -----------------------------------------------
alter table public.session_feedback
  add column rpe smallint check (rpe is null or rpe between 1 and 10),
  add column pain boolean not null default false,
  alter column rating drop not null;
alter table public.session_feedback drop constraint if exists session_feedback_rating_check;
alter table public.session_feedback add constraint session_feedback_rating_check check (rating is null or rating between 1 and 5);

-- 5. Medidas corporais estruturadas -------------------------------------------
create table public.body_measurements (
  id uuid primary key default extensions.gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  measured_at date not null default current_date,
  weight_kg numeric(5,2) check (weight_kg is null or weight_kg between 20 and 400),
  chest_cm numeric(5,1) check (chest_cm is null or chest_cm between 30 and 250),
  waist_cm numeric(5,1) check (waist_cm is null or waist_cm between 30 and 250),
  hip_cm numeric(5,1) check (hip_cm is null or hip_cm between 30 and 250),
  arm_cm numeric(5,1) check (arm_cm is null or arm_cm between 10 and 100),
  thigh_cm numeric(5,1) check (thigh_cm is null or thigh_cm between 20 and 150),
  created_at timestamptz not null default now(),
  check (coalesce(weight_kg, chest_cm, waist_cm, hip_cm, arm_cm, thigh_cm) is not null)
);
create index body_measurements_by_student on public.body_measurements(student_id, measured_at desc);

-- 6. Contato público do personal (exibido ao aluno vinculado) -----------------
alter table public.trainer_accounts
  add column cref text not null default '',
  add column whatsapp text not null default '' check (whatsapp ~ '^[0-9]{0,15}$'),
  add column instagram text not null default '' check (instagram ~ '^[A-Za-z0-9._]{0,30}$');

-- RLS -------------------------------------------------------------------------
alter table public.programs enable row level security;
alter table public.program_assignments enable row level security;
alter table public.body_measurements enable row level security;

create policy "trainer manages own programs" on public.programs for all to authenticated
  using (trainer_id = (select auth.uid()))
  with check (trainer_id = (select auth.uid()) and exists (select 1 from public.trainer_accounts where user_id = (select auth.uid())));
create policy "student reads assigned programs" on public.programs for select to authenticated
  using (exists (
    select 1 from public.program_assignments pa join public.trainer_students ts on ts.id = pa.relationship_id
    where pa.program_id = programs.id and ts.student_id = (select auth.uid()) and ts.status = 'active' and pa.status = 'active'));

create policy "participants read program assignments" on public.program_assignments for select to authenticated
  using (assigned_by = (select auth.uid()) or exists (
    select 1 from public.trainer_students ts where ts.id = relationship_id and ts.student_id = (select auth.uid())));
create policy "trainer creates program assignments" on public.program_assignments for insert to authenticated
  with check (assigned_by = (select auth.uid())
    and exists (select 1 from public.trainer_students ts where ts.id = relationship_id and ts.trainer_id = (select auth.uid()) and ts.status = 'active')
    and exists (select 1 from public.programs p where p.id = program_id and p.trainer_id = (select auth.uid())));
create policy "trainer updates program assignments" on public.program_assignments for update to authenticated
  using (assigned_by = (select auth.uid())) with check (assigned_by = (select auth.uid()));

-- Fichas de um programa atribuído ficam visíveis ao aluno.
create policy "student reads plans of assigned programs" on public.workout_plans for select to authenticated
  using (program_id is not null and exists (
    select 1 from public.program_assignments pa join public.trainer_students ts on ts.id = pa.relationship_id
    where pa.program_id = workout_plans.program_id and ts.student_id = (select auth.uid()) and ts.status = 'active' and pa.status = 'active'));

-- Medidas: aluno gerencia as próprias; personal com vínculo ativo apenas lê.
create policy "student manages own measurements" on public.body_measurements for all to authenticated
  using (student_id = (select auth.uid())) with check (student_id = (select auth.uid()));
create policy "trainer reads linked student measurements" on public.body_measurements for select to authenticated
  using (public.is_active_trainer_of(student_id));

grant select, insert, update, delete on public.programs, public.body_measurements to authenticated;
grant select, insert, update on public.program_assignments to authenticated;
grant update (cref, whatsapp, instagram, display_name) on public.trainer_accounts to authenticated;
create policy "trainer updates own account" on public.trainer_accounts for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
