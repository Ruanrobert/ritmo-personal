"use client";

import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  Dumbbell,
  Ellipsis,
  Filter,
  LayoutDashboard,
  Menu,
  MessageCircle,
  Plus,
  Search,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Moon,
  Sun,
  UsersRound,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Section = "overview" | "students" | "workouts" | "exercises" | "schedule" | "finance" | "messages";
type StudentStatus = "Treinou hoje" | "Ontem" | "Atenção" | "Novo aluno";

type Student = {
  name: string;
  goal: string;
  status: StudentStatus;
  lastWorkout: string;
  initials: string;
  color: string;
  plan: string;
};

type Appointment = { id: string; time: string; title: string; person: string; date: string };
type Message = { id: string; person: string; text: string; time: string; unread: boolean };
type Exercise = { name: string; group: string; tag: string; color: string; videoUrl?: string };
type Workout = { name: string; subtitle: string; count: number; duration: string; color: string; exercises?: string[] };

const initialStudents: Student[] = [
  { name: "Mariana Costa", goal: "Hipertrofia", status: "Treinou hoje", lastWorkout: "Hoje, 08:42", initials: "MC", color: "coral", plan: "Hipertrofia A" },
  { name: "Lucas Almeida", goal: "Condicionamento", status: "Treinou hoje", lastWorkout: "Hoje, 07:15", initials: "LA", color: "blue", plan: "Full body 3×" },
  { name: "Beatriz Nunes", goal: "Emagrecimento", status: "Ontem", lastWorkout: "Ontem, 18:30", initials: "BN", color: "lilac", plan: "Adaptação B" },
  { name: "Pedro Henrique", goal: "Força", status: "Atenção", lastWorkout: "Há 6 dias", initials: "PH", color: "mint", plan: "Força base" },
  { name: "Camila Rocha", goal: "Hipertrofia", status: "Ontem", lastWorkout: "Ontem, 06:50", initials: "CR", color: "amber", plan: "Inferiores A" },
];

const initialWorkouts: Workout[] = [
  { name: "Hipertrofia A", subtitle: "Peito · Ombros · Tríceps", count: 7, duration: "45 min", color: "mint", exercises: ["Supino reto", "Desenvolvimento", "Tríceps pulley"] },
  { name: "Inferiores A", subtitle: "Quadríceps · Glúteos", count: 6, duration: "50 min", color: "peach", exercises: ["Agachamento", "Ponte de glúteo"] },
  { name: "Full body 3×", subtitle: "Corpo inteiro", count: 8, duration: "55 min", color: "lavender", exercises: ["Supino reto", "Remada baixa", "Agachamento"] },
];

const initialExercises: Exercise[] = [
  { name: "Supino reto", group: "Peito", tag: "Barra", color: "exercise-a" }, { name: "Remada baixa", group: "Costas", tag: "Polia", color: "exercise-b" }, { name: "Agachamento", group: "Quadríceps", tag: "Barra", color: "exercise-c" }, { name: "Desenvolvimento", group: "Ombros", tag: "Halteres", color: "exercise-d" }, { name: "Levantamento terra", group: "Posterior", tag: "Barra", color: "exercise-e" }, { name: "Tríceps pulley", group: "Tríceps", tag: "Polia", color: "exercise-f" }, { name: "Ponte de glúteo", group: "Glúteos", tag: "Peso corporal", color: "exercise-g" }, { name: "Prancha", group: "Core", tag: "Peso corporal", color: "exercise-h" },
];

const initialAppointments: Appointment[] = [
  { id: "a1", time: "09:30", title: "Avaliação física", person: "Mariana Costa", date: "2026-10-03" }, { id: "a2", time: "11:00", title: "Treino presencial", person: "Lucas Almeida", date: "2026-10-03" }, { id: "a3", time: "14:30", title: "Revisão de treino", person: "Beatriz Nunes", date: "2026-10-03" },
];

const initialMessages: Message[] = [
  { id: "m1", person: "Mariana Costa", text: "Concluí o treino de hoje!", time: "09:42", unread: true }, { id: "m2", person: "Pedro Henrique", text: "Podemos ajustar o treino de pernas?", time: "Ontem", unread: true }, { id: "m3", person: "Lucas Almeida", text: "Obrigado pelas orientações.", time: "Ontem", unread: false },
];

const navGroups = [
  { label: "ESPAÇO DE TRABALHO", items: [{ id: "overview", label: "Visão geral", icon: LayoutDashboard }, { id: "students", label: "Alunos", icon: UsersRound, count: "24" }, { id: "workouts", label: "Treinos", icon: Dumbbell }, { id: "exercises", label: "Exercícios", icon: Activity }] },
  { label: "ACOMPANHAMENTO", items: [{ id: "schedule", label: "Agenda", icon: CalendarDays }, { id: "messages", label: "Mensagens", icon: MessageCircle, count: "3" }] },
  { label: "GESTÃO", items: [{ id: "finance", label: "Financeiro", icon: SlidersHorizontal }] },
] as const;

function Avatar({ student, size = "normal" }: { student: Student; size?: "normal" | "small" }) {
  return <span className={`avatar avatar-${student.color} ${size === "small" ? "avatar-small" : ""}`}>{student.initials}</span>;
}

function StatusPill({ status }: { status: StudentStatus }) {
  const cls = status === "Treinou hoje" ? "status-good" : status === "Ontem" ? "status-yesterday" : status === "Novo aluno" ? "status-new" : "status-attention";
  return <span className={`status-pill ${cls}`}><i />{status}</span>;
}

function BrandMark() {
  return <div className="brand-lockup"><span className="brand-mark"><span /><span /><span /></span><span>ritmo<span className="brand-dot">.</span></span></div>;
}

export default function Home() {
  const [section, setSection] = useState<Section>("overview");
  const [students, setStudents] = useState(initialStudents);
  const [workouts, setWorkouts] = useState<Workout[]>(initialWorkouts);
  const [appointments, setAppointments] = useState(initialAppointments);
  const [messages, setMessages] = useState(initialMessages);
  const [exercises, setExercises] = useState(initialExercises);
  const [studentStatusFilter, setStudentStatusFilter] = useState("Todos");
  const [exerciseGroupFilter, setExerciseGroupFilter] = useState("Todos");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [activeConversation, setActiveConversation] = useState("Mariana Costa");
  const [selectedWorkout, setSelectedWorkout] = useState<number | null>(null);
  const [messageDraft, setMessageDraft] = useState("");
  const [appointmentModal, setAppointmentModal] = useState(false);
  const [financeTab, setFinanceTab] = useState<"overview" | "entries">("overview");
  const [income, setIncome] = useState(12180);
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<"student" | "workout" | "exercise" | null>(null);
  const [notice, setNotice] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState("Ruan");
  const [profileEmail, setProfileEmail] = useState("personal@ritmo.app");
  const [period, setPeriod] = useState("Esta semana");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [dailyReminders, setDailyReminders] = useState(true);
  const [defaultSection, setDefaultSection] = useState<Section>("overview");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const savedTheme = window.localStorage.getItem("ritmo-theme");
      const savedProfile = window.localStorage.getItem("ritmo-profile");
      const savedSettings = window.localStorage.getItem("ritmo-settings");
      const savedData = window.localStorage.getItem("ritmo-data");
      if (savedTheme === "light" || savedTheme === "dark") setTheme(savedTheme);
      if (savedProfile) {
        try {
          const profile = JSON.parse(savedProfile) as { name?: string; email?: string };
          if (profile.name) {
            const migratedName = profile.name === "Mirlan" ? "Ruan" : profile.name;
            setProfileName(migratedName);
            if (migratedName !== profile.name) window.localStorage.setItem("ritmo-profile", JSON.stringify({ ...profile, name: migratedName }));
          }
          if (profile.email) setProfileEmail(profile.email);
        } catch { window.localStorage.removeItem("ritmo-profile"); }
      }
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings) as { dailyReminders?: boolean; defaultSection?: string };
          if (typeof settings.dailyReminders === "boolean") setDailyReminders(settings.dailyReminders);
          if (["overview", "students", "workouts"].includes(settings.defaultSection || "")) {
            const savedSection = settings.defaultSection as Section;
            setDefaultSection(savedSection);
            setSection(savedSection);
          }
        } catch { window.localStorage.removeItem("ritmo-settings"); }
      }
      if (savedData) {
        try {
          const data = JSON.parse(savedData) as { schemaVersion?: number; students?: Student[]; workouts?: Workout[]; appointments?: Appointment[]; messages?: Message[]; exercises?: Exercise[]; income?: number };
          if (data.students) setStudents(data.students);
          if (data.workouts) {
            const migratedWorkouts = data.schemaVersion === 2 ? data.workouts : data.workouts.map((workout) => {
              const seed = initialWorkouts.find((initial) => initial.name === workout.name);
              return seed && !workout.exercises ? { ...workout, exercises: seed.exercises } : workout;
            });
            setWorkouts(migratedWorkouts);
            if (data.schemaVersion !== 2) window.localStorage.setItem("ritmo-data", JSON.stringify({ ...data, workouts: migratedWorkouts, schemaVersion: 2 }));
          }
          if (data.appointments) setAppointments(data.appointments);
          if (data.messages) setMessages(data.messages);
          if (data.exercises) setExercises(data.exercises);
          if (typeof data.income === "number") setIncome(data.income);
        } catch { window.localStorage.removeItem("ritmo-data"); }
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const filteredStudents = useMemo(() => students.filter((student) => `${student.name} ${student.goal} ${student.plan}`.toLowerCase().includes(query.toLowerCase())), [students, query]);
  const visibleStudents = useMemo(() => filteredStudents.filter((student) => studentStatusFilter === "Todos" || student.status === studentStatusFilter), [filteredStudents, studentStatusFilter]);
  const visibleExercises = useMemo(() => exercises.filter((exercise) => `${exercise.name} ${exercise.group} ${exercise.tag}`.toLowerCase().includes(query.toLowerCase()) && (exerciseGroupFilter === "Todos" || exercise.group === exerciseGroupFilter)), [exercises, query, exerciseGroupFilter]);
  const exerciseGroups = Array.from(new Set(exercises.map((exercise) => exercise.group)));

  function announce(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3200);
  }

  function persistData(next: Partial<{ students: Student[]; workouts: Workout[]; appointments: Appointment[]; messages: Message[]; exercises: Exercise[]; income: number }>) {
    const current = window.localStorage.getItem("ritmo-data");
    let stored = {};
    try { stored = current ? JSON.parse(current) : {}; } catch { stored = {}; }
    window.localStorage.setItem("ritmo-data", JSON.stringify({ ...stored, ...next, schemaVersion: 2 }));
  }

  const profileInitials = profileName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "MI";

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("profileName") || "Ruan").trim();
    const email = String(form.get("profileEmail") || "").trim();
    setProfileName(name);
    setProfileEmail(email);
    window.localStorage.setItem("ritmo-profile", JSON.stringify({ name, email }));
    setProfileOpen(false);
    announce("Perfil salvo neste navegador.");
  }

  function saveSettings(next: { dailyReminders: boolean; defaultSection: Section }) {
    setDailyReminders(next.dailyReminders);
    setDefaultSection(next.defaultSection);
    window.localStorage.setItem("ritmo-settings", JSON.stringify(next));
  }

  function addStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "Novo aluno").trim();
    const email = String(form.get("email") || "").trim();
    const goal = String(form.get("goal") || "Objetivo a definir");
    const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
    const student = { name, goal, status: "Novo aluno" as StudentStatus, lastWorkout: "Convite pendente", initials: initials || "NA", color: "blue", plan: "Sem treino atribuído" };
    setStudents((current) => { const next = [student, ...current]; persistData({ students: next }); return next; });
    setModal(null);
    announce(`Convite preparado para ${email || name}.`);
  }

  function addWorkout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "Novo treino").trim();
    const focus = String(form.get("focus") || "Treino personalizado");
    setWorkouts((current) => { const next: Workout[] = [{ name, subtitle: focus, count: 0, duration: "A configurar", color: "mint", exercises: [] }, ...current]; persistData({ workouts: next }); return next; });
    setModal(null);
    announce(`Treino “${name}” criado como rascunho.`);
  }

  function addExercise(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const videoUrl = String(form.get("videoUrl") || "").trim();
    if (videoUrl && !/^https?:\/\//i.test(videoUrl)) { announce("Use um endereço de vídeo que comece com https://."); return; }
    const exercise = { name: String(form.get("name")).trim(), group: String(form.get("group")), tag: String(form.get("equipment")), color: "exercise-h", videoUrl: videoUrl || undefined };
    setExercises((current) => { const next = [exercise, ...current]; persistData({ exercises: next }); return next; });
    setModal(null);
    announce(`${exercise.name} foi adicionado à biblioteca.`);
  }

  function setExerciseVideo(exerciseName: string) {
    const exercise = exercises.find((item) => item.name === exerciseName);
    if (!exercise) return;
    const videoUrl = window.prompt(`Link do vídeo para ${exerciseName}:`, exercise.videoUrl || "https://");
    if (videoUrl === null) return;
    const normalizedUrl = videoUrl.trim();
    if (!/^https?:\/\//i.test(normalizedUrl)) { announce("Informe um link começando com https://."); return; }
    setExercises((current) => {
      const next = current.map((item) => item.name === exerciseName ? { ...item, videoUrl: normalizedUrl } : item);
      persistData({ exercises: next });
      return next;
    });
    announce(`Vídeo de ${exerciseName} salvo.`);
  }

  function addAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const appointment = { id: crypto.randomUUID(), title: String(form.get("title")), person: String(form.get("person")), date: String(form.get("date")), time: String(form.get("time")) };
    setAppointments((current) => { const next = [...current, appointment].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)); persistData({ appointments: next }); return next; });
    setAppointmentModal(false);
    announce("Compromisso adicionado à agenda.");
  }

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = messageDraft.trim();
    if (!text) return;
    setMessages((current) => { const next = [{ id: crypto.randomUUID(), person: activeConversation, text, time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }), unread: false }, ...current]; persistData({ messages: next }); return next; });
    setMessageDraft("");
    announce("Mensagem salva nesta demonstração.");
  }

  function removeAppointment(id: string) {
    setAppointments((current) => { const next = current.filter((item) => item.id !== id); persistData({ appointments: next }); return next; });
    announce("Compromisso removido da agenda.");
  }

  function addExerciseToWorkout(workoutIndex: number, exerciseName: string) {
    setWorkouts((current) => {
      const next = current.map((workout, index) => index === workoutIndex ? { ...workout, exercises: Array.from(new Set([...(workout.exercises || []), exerciseName])), count: Math.max(workout.count, (workout.exercises || []).length + 1) } : workout);
      persistData({ workouts: next });
      return next;
    });
    announce(`${exerciseName} adicionado ao treino.`);
  }

  function removeWorkout(index: number) {
    const workout = workouts[index];
    if (!workout || !window.confirm(`Excluir o treino “${workout.name}”?`)) return;
    setWorkouts((current) => { const next = current.filter((_, itemIndex) => itemIndex !== index); persistData({ workouts: next }); return next; });
    announce("Treino excluído da biblioteca.");
  }

  const sectionTitles: Record<Section, { title: string; subtitle: string }> = {
    overview: { title: "Visão geral", subtitle: "Acompanhe o ritmo do seu espaço de treino." },
    students: { title: "Seus alunos", subtitle: "Veja quem está evoluindo e quem precisa de um incentivo." },
    workouts: { title: "Treinos", subtitle: "Monte programas e organize as prescrições dos seus alunos." },
    exercises: { title: "Biblioteca de exercícios", subtitle: "Uma base para montar treinos com mais agilidade." },
    schedule: { title: "Agenda", subtitle: "Sua semana de avaliações e sessões presenciais." },
    finance: { title: "Financeiro", subtitle: "Uma visão simples para organizar sua operação." },
    messages: { title: "Mensagens", subtitle: "Mantenha o contato com seus alunos em um só lugar." },
  };

  return (
    <div className={`app-shell theme-${theme}`}>
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="sidebar-top"><BrandMark /><button className="icon-button sidebar-close" aria-label="Fechar menu" onClick={() => setMobileNav(false)}><X size={18} /></button></div>
        <div className="workspace-menu-wrap"><button className="workspace-switcher" aria-expanded={showWorkspaceMenu} onClick={() => { setShowWorkspaceMenu((value) => !value); setShowAccountMenu(false); }}><span className="workspace-avatar">{profileInitials}</span><span className="workspace-copy"><b>{profileName}</b><small>Personal trainer</small></span><ChevronDown size={15} /></button>{showWorkspaceMenu && <div className="workspace-popover"><span className="popover-kicker">ESPAÇO ATUAL</span><b>{profileName}</b><small>Personal trainer · plano inicial</small><button onClick={() => { setSection("overview"); setShowWorkspaceMenu(false); }}>Abrir visão geral <ArrowRight size={13} /></button><button onClick={() => { setShowWorkspaceMenu(false); setSettingsOpen(true); }}>Configurar espaço <Settings2 size={13} /></button></div>}</div>
        <div className="side-scroll">
          {navGroups.map((group) => <div className="nav-group" key={group.label}><p className="nav-caption">{group.label}</p>{group.items.map((item) => {
            const Icon = item.icon;
            return <button key={item.id} className={`nav-item ${section === item.id ? "nav-active" : ""}`} onClick={() => { setSection(item.id as Section); setMobileNav(false); setQuery(""); }}><Icon size={18} strokeWidth={1.8} /><span>{item.label}</span>{"count" in item && <small className="nav-count">{item.id === "students" ? students.length + 19 : item.id === "messages" ? messages.filter((message) => message.unread).length : (item as { count: string }).count}</small>}</button>;
          })}</div>)}
        </div>
        <div className="sidebar-bottom">
          <div className="help-card"><span className="help-icon"><Sparkles size={15} /></span><b>Seu próximo nível</b><p>Organize seus alunos e ganhe tempo para o que importa.</p><button onClick={() => setSettingsOpen(true)}>Personalizar painel <ArrowRight size={13} /></button></div>
          <button className="nav-item settings-link" onClick={() => setSettingsOpen(true)}><Settings2 size={18} /><span>Configurações</span></button>
          <div className="sidebar-profile"><span className="profile-photo">{profileInitials}</span><span className="workspace-copy"><b>{profileName}</b><small>Plano inicial</small></span><button className="icon-button profile-more" aria-label="Mais ações da conta" aria-expanded={showAccountMenu} onClick={() => { setShowAccountMenu((value) => !value); setShowWorkspaceMenu(false); }}><Ellipsis size={18} /></button>{showAccountMenu && <div className="profile-popover account-popover"><b>{profileName}</b><small>{profileEmail}</small><button onClick={() => { setShowAccountMenu(false); setProfileOpen(true); }}><UsersRound size={14} /> Abrir perfil</button><button onClick={() => { setShowAccountMenu(false); setSettingsOpen(true); }}><Settings2 size={14} /> Configurações</button></div>}</div>
        </div>
      </aside>

      {mobileNav && <button className="scrim" aria-label="Fechar menu" onClick={() => setMobileNav(false)} />}

      <main className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu" aria-label="Abrir menu" onClick={() => setMobileNav(true)}><Menu size={20} /></button>
          <div className="breadcrumbs"><span>Ritmo</span><ChevronRight size={14} /><b>{sectionTitles[section].title}</b></div>
          <div className="topbar-actions"><span className="demo-tag"><span /> Ambiente de demonstração</span>{dailyReminders && <><button className="icon-button notification-trigger" aria-label="Notificações" aria-expanded={showNotifications} onClick={() => setShowNotifications((value) => !value)}><Bell size={18} /><i /></button>{showNotifications && <div className="notification-popover"><div className="popover-heading"><b>Notificações</b><span>Hoje</span></div><button className="notification-item" onClick={() => { setShowNotifications(false); setSelectedStudent(students.find((student) => student.name === "Pedro Henrique") || null); }}><span className="notification-dot dot-green" /> Pedro está há 6 dias sem treinar.</button><button className="notification-item" onClick={() => { setShowNotifications(false); setSelectedStudent(students.find((student) => student.name === "Mariana Costa") || null); }}><span className="notification-dot dot-blue" /> Mariana concluiu o treino de hoje.</button><button onClick={() => { setShowNotifications(false); setSection("students"); }}>Ver alunos <ArrowRight size={13} /></button></div>}</>}<button className="top-avatar" aria-label="Abrir meu perfil" title="Meu perfil" onClick={() => { setProfileOpen(true); setShowAccountMenu(false); }}><span>{profileInitials}</span></button></div>
        </header>

        <div className="content-wrap">
          <div className="page-heading"><div><div className="eyebrow"><span className="live-dot" /> {new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).format(new Date()).toLocaleUpperCase("pt-BR")}</div><h1>{section === "overview" ? <>Bom dia, {profileName} <span className="wave">✳</span></> : sectionTitles[section].title}</h1><p>{section === "overview" ? "Aqui está o que está acontecendo com seus alunos." : sectionTitles[section].subtitle}</p></div><div className="heading-actions"><button className="button button-secondary" onClick={() => setModal("student")}><Plus size={16} /> <span>Novo aluno</span></button><button className="button button-primary" onClick={() => setModal("workout")}><Plus size={16} /> <span>Criar treino</span></button></div></div>

          {section === "overview" && <>
            <div className="metric-grid">
              <MetricCard label="Alunos ativos" value={String(students.length + 19)} delta="+12%" detail="vs. mês passado" icon={<UsersRound size={17} />} tone="green" trend="up" />
              <MetricCard label="Treinos concluídos" value="186" delta="+8%" detail="esta semana" icon={<Dumbbell size={17} />} tone="blue" trend="up" />
              <MetricCard label="Constância média" value="82%" delta="+5%" detail="vs. semana passada" icon={<Activity size={17} />} tone="violet" trend="up" />
              <MetricCard label="Precisam de atenção" value="04" delta="2 novos" detail="nos últimos 7 dias" icon={<Clock3 size={17} />} tone="orange" trend="down" />
            </div>

            <div className="dashboard-grid top-panels">
              <section className="panel activity-panel"><div className="panel-header"><div><h2>Atividade dos alunos</h2><p>Treinos concluídos ao longo do período</p></div><label className="select-button"><select aria-label="Período do gráfico" value={period} onChange={(event) => setPeriod(event.target.value)}><option>Esta semana</option><option>Últimos 30 dias</option></select><ChevronDown size={14} /></label></div><ActivityChart period={period} /></section>
              <section className="panel consistency-panel"><div className="panel-header"><div><h2>Visão da turma</h2><p>Atividade nos últimos 7 dias</p></div><button className="more-button" aria-label="Ver alunos que precisam de atenção" onClick={() => { setSection("students"); setStudentStatusFilter("Atenção"); }}><Ellipsis size={18} /></button></div><div className="consistency-content"><div className="donut-wrap"><div className="donut"><div className="donut-center"><strong>82%</strong><span>ativos</span></div></div></div><div className="legend-list"><button onClick={() => { setSection("students"); setStudentStatusFilter("Treinou hoje"); }}><Legend label="Treinaram" number="20" color="legend-green" /></button><button onClick={() => { setSection("students"); setStudentStatusFilter("Atenção"); }}><Legend label="Em atenção" number="4" color="legend-orange" /></button><button onClick={() => { setSection("students"); setStudentStatusFilter("Ontem"); }}><Legend label="Sem atividade" number="3" color="legend-gray" /></button></div></div><div className="panel-footnote"><span className="trend-note"><ArrowUpRight size={14} /> 6% </span>mais alunos ativos que na semana passada</div></section>
            </div>

            <div className="dashboard-grid lower-panels">
              <section className="panel students-panel"><div className="panel-header"><div><h2>Seus alunos</h2><p>Um resumo da atividade mais recente</p></div><button className="text-link" onClick={() => setSection("students")}>Ver todos <ArrowRight size={14} /></button></div><div className="student-table-wrap"><table className="student-table"><thead><tr><th>ALUNO</th><th>ÚLTIMO TREINO</th><th>PROGRAMA</th><th>STATUS</th></tr></thead><tbody>{filteredStudents.slice(0, 4).map((student) => <tr key={student.name} onClick={() => setSection("students")}><td><div className="student-cell"><Avatar student={student} /><span><b>{student.name}</b><small>{student.goal}</small></span></div></td><td className="last-seen">{student.lastWorkout}</td><td><span className="plan-label">{student.plan}</span></td><td><StatusPill status={student.status} /></td></tr>)}</tbody></table></div><button className="mobile-all-link" onClick={() => setSection("students")}>Ver todos os alunos <ArrowRight size={14} /></button></section>

              <section className="panel agenda-panel"><div className="panel-header"><div><h2>Na sua agenda</h2><p>Próximos compromissos</p></div><button className="calendar-date" onClick={() => setSection("schedule")}><CalendarDays size={14} /> Agenda <ChevronRight size={13} /></button></div><div className="agenda-list">{appointments.slice(0, 3).map((item, index) => <AgendaItem key={item.id} time={item.time} title={item.title} person={item.person} initials={item.person.split(" ").map((word) => word[0]).slice(0, 2).join("")} tone={index % 3 === 0 ? "green" : index % 3 === 1 ? "blue" : "purple"} onRemove={() => removeAppointment(item.id)} />)}</div><button className="agenda-link" onClick={() => setSection("schedule")}>Abrir agenda completa <ArrowRight size={14} /></button></section>
            </div>
            <div className="bottom-note"><span className="note-icon"><Sparkles size={15} /></span><span><b>Pequenos passos, grandes resultados.</b> Seus alunos completaram 186 treinos esta semana.</span><button onClick={() => setSection("students")}>Acompanhar alunos <ArrowRight size={14} /></button></div>
          </>}

          {section === "students" && <section className="panel full-panel directory-panel"><div className="directory-toolbar"><div className="search-field"><Search size={16} /><input aria-label="Buscar aluno" placeholder="Buscar por nome ou objetivo..." value={query} onChange={(event) => setQuery(event.target.value)} /></div><label className="button button-secondary filter-button"><Filter size={15} /> <select aria-label="Filtrar alunos por status" value={studentStatusFilter} onChange={(event) => setStudentStatusFilter(event.target.value)}><option>Todos</option><option>Treinou hoje</option><option>Ontem</option><option>Atenção</option><option>Novo aluno</option></select></label><span className="directory-total">{visibleStudents.length} alunos</span></div><div className="student-table-wrap"><table className="student-table directory-table"><thead><tr><th>ALUNO</th><th>OBJETIVO</th><th>ÚLTIMA ATIVIDADE</th><th>PROGRAMA</th><th>STATUS</th><th></th></tr></thead><tbody>{visibleStudents.map((student) => <tr key={student.name}><td><button className="student-row-open" onClick={() => setSelectedStudent(student)}><Avatar student={student} /><span><b>{student.name}</b><small>Aluno ativo</small></span></button></td><td>{student.goal}</td><td className="last-seen">{student.lastWorkout}</td><td><span className="plan-label">{student.plan}</span></td><td><StatusPill status={student.status} /></td><td><button className="row-more" aria-label={`Opções de ${student.name}`} onClick={() => setSelectedStudent(student)}><Ellipsis size={18} /></button></td></tr>)}</tbody></table>{visibleStudents.length === 0 && <div className="empty-state"><Search size={22} /><b>Nenhum aluno encontrado</b><span>Ajuste a busca ou o filtro de status.</span></div>}</div></section>}

          {section === "workouts" && <><div className="workout-summary"><div className="summary-icon"><Dumbbell size={18} /></div><span><b>{workouts.length} programas</b><small>Organizados na sua biblioteca</small></span><button className="text-link" onClick={() => setModal("workout")}>Novo treino <Plus size={14} /></button></div><div className="workout-grid">{workouts.map((workout, index) => <article className="workout-card" key={`${workout.name}-${index}`}><div className={`workout-cover cover-${workout.color}`}><div className="cover-orbit orbit-one" /><div className="cover-orbit orbit-two" /><span className="cover-label">PROGRAMA DE TREINO</span><div className="cover-dumbbell"><Dumbbell size={40} strokeWidth={1.4} /></div><button className="cover-more" aria-label={`Excluir ${workout.name}`} onClick={() => removeWorkout(index)}><Ellipsis size={18} /></button></div><div className="workout-card-body"><span className="workout-type">{index === 1 ? "INFERIORES" : index === 2 ? "CONDICIONAMENTO" : "HIPERTROFIA"}</span><h3>{workout.name}</h3><p>{workout.subtitle}</p><div className="workout-meta"><span><Dumbbell size={14} /> {workout.exercises?.length ?? workout.count} exercícios</span><span><Clock3 size={14} /> {workout.duration}</span></div><button className="workout-open" onClick={() => setSelectedWorkout(index)}>Abrir programa <ArrowRight size={14} /></button></div></article>)}<button className="new-workout-card" onClick={() => setModal("workout")}><span><Plus size={20} /></span><b>Criar novo treino</b><small>Monte um programa do seu jeito</small></button></div></>}

          {section === "exercises" && <><div className="exercise-toolbar"><div className="search-field"><Search size={16} /><input aria-label="Buscar exercício" placeholder="Buscar exercício..." value={query} onChange={(event) => setQuery(event.target.value)} /></div><label className="button button-secondary"><SlidersHorizontal size={15} /><select aria-label="Filtrar por grupo muscular" value={exerciseGroupFilter} onChange={(event) => setExerciseGroupFilter(event.target.value)}><option>Todos</option>{exerciseGroups.map((group) => <option key={group}>{group}</option>)}</select></label><button className="button button-primary" onClick={() => setModal("exercise")}><Plus size={15} /> Novo exercício</button><span className="directory-total">{visibleExercises.length} exercícios</span></div><div className="exercise-grid">{visibleExercises.map((exercise) => <article className="exercise-card" key={exercise.name}><div className={`exercise-art ${exercise.color}`}><Dumbbell size={30} strokeWidth={1.6} /><span>{exercise.group}</span><button aria-label={`Adicionar ${exercise.name} ao treino`} onClick={() => { const index = selectedWorkout ?? 0; if (!workouts[index]) { setSection("workouts"); announce("Crie um treino antes de adicionar exercícios."); return; } addExerciseToWorkout(index, exercise.name); }}><Plus size={15} /></button></div><div className="exercise-info"><h3>{exercise.name}</h3><div><span>{exercise.group}</span><i />{exercise.tag}</div><div className="exercise-media-row">{exercise.videoUrl && /^https?:\/\//i.test(exercise.videoUrl) && <a href={exercise.videoUrl} target="_blank" rel="noreferrer">Ver vídeo</a>}<button type="button" onClick={() => setExerciseVideo(exercise.name)}>{exercise.videoUrl ? "Trocar vídeo" : "Adicionar vídeo"}</button></div></div></article>)}</div>{visibleExercises.length === 0 && <div className="empty-state"><Search size={22} /><b>Nenhum exercício encontrado</b><span>Tente outro termo ou grupo muscular.</span></div>}</>}

          {section === "schedule" && <section className="panel full-panel feature-workspace"><div className="panel-header"><div><h2>Agenda de compromissos</h2><p>Organize avaliações, treinos e revisões.</p></div><button className="button button-primary" onClick={() => setAppointmentModal(true)}><Plus size={15} /> Novo compromisso</button></div><div className="schedule-list">{appointments.map((item) => <div className="schedule-row" key={item.id}><b>{new Date(`${item.date}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })}</b><time>{item.time}</time><span><strong>{item.title}</strong><small>{item.person}</small></span><button className="row-more" aria-label={`Cancelar ${item.title}`} onClick={() => removeAppointment(item.id)}><X size={16} /></button></div>)}{appointments.length === 0 && <div className="empty-state"><CalendarDays size={22} /><b>Agenda vazia</b><span>Adicione um compromisso para começar.</span></div>}</div></section>}
          {section === "finance" && <section className="panel feature-workspace"><div className="panel-header"><div><h2>Financeiro do espaço</h2><p>Controle manual de recebimentos da demonstração. Cobranças online exigem integração.</p></div><div className="finance-tabs"><button className={financeTab === "overview" ? "tab-active" : ""} onClick={() => setFinanceTab("overview")}>Resumo</button><button className={financeTab === "entries" ? "tab-active" : ""} onClick={() => setFinanceTab("entries")}>Lançamentos</button></div></div>{financeTab === "overview" ? <><div className="finance-cards"><article><small>Receita registrada no mês</small><b>R$ {income.toLocaleString("pt-BR")}</b><span>Valores de demonstração editáveis</span></article><article><small>Alunos cadastrados</small><b>{students.length + 19}</b><span>Planos ativos no painel</span></article><article><small>Ticket médio estimado</small><b>R$ {Math.round(income / Math.max(students.length + 19, 1)).toLocaleString("pt-BR")}</b><span>Estimativa local</span></article></div><button className="button button-primary" onClick={() => { const amount = window.prompt("Valor recebido em reais:", "150"); const parsed = Number(String(amount || "").replace(",", ".")); if (parsed > 0) { setIncome((current) => { const next = current + parsed; persistData({ income: next }); return next; }); announce("Recebimento lançado no controle local."); } }}><Plus size={15} /> Registrar recebimento</button></> : <div className="finance-entry"><span>Outubro de 2026</span><b>Receita de planos demonstrativa</b><strong>R$ {income.toLocaleString("pt-BR")}</strong><small>Registro local · sem cobrança processada</small></div>}</section>}
          {section === "messages" && <section className="panel full-panel feature-workspace"><div className="panel-header"><div><h2>Caixa de mensagens</h2><p>Conversa demonstrativa salva neste navegador; envio externo ainda não está conectado.</p></div></div><div className="message-layout"><div className="message-inbox">{messages.map((message) => <button key={message.id} className={`message-contact ${message.unread ? "message-unread" : ""}`} onClick={() => { setActiveConversation(message.person); setMessages((current) => { const next = current.map((item) => item.person === message.person ? { ...item, unread: false } : item); persistData({ messages: next }); return next; }); }}><span className="message-avatar">{message.person.split(" ").map((word) => word[0]).slice(0, 2).join("")}</span><span><b>{message.person}</b><small>{message.text}</small></span><time>{message.time}</time></button>)}</div><div className="message-thread"><div className="thread-heading"><b>{activeConversation}</b><small>Conversa local de demonstração</small></div><div className="thread-history">{messages.filter((message) => message.person === activeConversation).map((message) => <p key={message.id}>{message.text}<small>{message.time}</small></p>)}</div><form className="message-compose" onSubmit={sendMessage}><input aria-label="Escreva uma mensagem" placeholder="Escreva uma mensagem..." value={messageDraft} onChange={(event) => setMessageDraft(event.target.value)} /><button className="button button-primary" type="submit"><ArrowRight size={15} /> Enviar</button></form></div></div></section>}

          <footer className="page-footer"><span>Ritmo · espaço de treino</span><button className="footer-help" onClick={() => setHelpOpen(true)}><CircleHelp size={13} /> Ajuda e suporte</button></footer>
        </div>
      </main>

      {modal && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(null); }}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-top"><span className="modal-icon">{modal === "student" ? <UsersRound size={19} /> : <Dumbbell size={19} />}</span><button className="icon-button" aria-label="Fechar" onClick={() => setModal(null)}><X size={19} /></button></div><span className="feature-kicker">{modal === "student" ? "NOVO VÍNCULO" : modal === "exercise" ? "BIBLIOTECA" : "SUA PRÓXIMA PRESCRIÇÃO"}</span><h2 id="modal-title">{modal === "student" ? "Adicionar aluno" : modal === "exercise" ? "Novo exercício" : "Criar treino"}</h2><p>{modal === "student" ? "Cadastre os dados básicos. O convite externo depende da conexão de autenticação." : modal === "exercise" ? "Inclua um exercício na biblioteca local do seu painel." : "Crie um programa e adicione exercícios pela biblioteca."}</p><form onSubmit={modal === "student" ? addStudent : modal === "exercise" ? addExercise : addWorkout}>{modal === "student" ? <><label>Nome do aluno<input name="name" required placeholder="Ex.: Ana Souza" autoFocus /></label><label>E-mail<input name="email" type="email" placeholder="ana@email.com" /></label><label>Objetivo inicial<select name="goal"><option>Objetivo a definir</option><option>Hipertrofia</option><option>Condicionamento</option><option>Emagrecimento</option><option>Força</option></select></label></> : modal === "exercise" ? <><label>Nome do exercício<input name="name" required placeholder="Ex.: Elevação lateral" autoFocus /></label><label>Grupo muscular<select name="group"><option>Peito</option><option>Costas</option><option>Ombros</option><option>Quadríceps</option><option>Posterior</option><option>Glúteos</option><option>Tríceps</option><option>Bíceps</option><option>Core</option></select></label><label>Equipamento<input name="equipment" required placeholder="Ex.: Halteres" /></label><label>Vídeo demonstrativo (opcional)<input name="videoUrl" type="url" placeholder="https://..." /></label></> : <><label>Nome do treino<input name="name" required placeholder="Ex.: Treino A — Superiores" autoFocus /></label><label>Foco principal<select name="focus"><option>Hipertrofia</option><option>Força</option><option>Condicionamento</option><option>Mobilidade</option></select></label></>}<div className="modal-actions"><button type="button" className="button button-secondary" onClick={() => setModal(null)}>Cancelar</button><button type="submit" className="button button-primary">{modal === "student" ? "Salvar aluno" : modal === "exercise" ? "Adicionar exercício" : "Criar treino"}<ArrowRight size={15} /></button></div></form></section></div>}
      {profileOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setProfileOpen(false); }}><section className="modal-card profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-title"><div className="modal-top"><span className="modal-icon"><UsersRound size={19} /></span><button className="icon-button" aria-label="Fechar perfil" onClick={() => setProfileOpen(false)}><X size={19} /></button></div><span className="feature-kicker">SUA CONTA</span><h2 id="profile-title">Meu perfil</h2><p>Atualize os dados exibidos no seu espaço. As mudanças ficam salvas neste navegador.</p><form onSubmit={saveProfile}><label>Nome<input name="profileName" required defaultValue={profileName} /></label><label>E-mail<input name="profileEmail" type="email" required defaultValue={profileEmail} /></label><label>Tipo de conta<input value="Personal trainer" readOnly /></label><div className="modal-actions"><button type="button" className="button button-secondary" onClick={() => setProfileOpen(false)}>Cancelar</button><button type="submit" className="button button-primary">Salvar perfil <Check size={15} /></button></div></form></section></div>}
      {settingsOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSettingsOpen(false); }}><section className="modal-card theme-modal settings-modal" role="dialog" aria-modal="true" aria-labelledby="theme-title"><div className="modal-top"><span className="modal-icon"><Settings2 size={19} /></span><button className="icon-button" aria-label="Fechar configurações" onClick={() => setSettingsOpen(false)}><X size={19} /></button></div><span className="feature-kicker">PERSONALIZE SEU ESPAÇO</span><h2 id="theme-title">Configurações</h2><p>Ajuste a aparência e as preferências do painel. As mudanças são salvas neste navegador.</p><span className="settings-section-title">Aparência</span><div className="theme-options" role="group" aria-label="Tema de aparência"><button className={`theme-choice ${theme === "light" ? "theme-choice-active" : ""}`} aria-pressed={theme === "light"} onClick={() => { setTheme("light"); window.localStorage.setItem("ritmo-theme", "light"); }}><span className="theme-preview preview-light"><i /><i /><i /><b /></span><span className="theme-choice-label"><Sun size={15} /> Claro</span>{theme === "light" && <Check className="theme-check" size={15} />}</button><button className={`theme-choice ${theme === "dark" ? "theme-choice-active" : ""}`} aria-pressed={theme === "dark"} onClick={() => { setTheme("dark"); window.localStorage.setItem("ritmo-theme", "dark"); }}><span className="theme-preview preview-dark"><i /><i /><i /><b /></span><span className="theme-choice-label"><Moon size={15} /> Escuro</span>{theme === "dark" && <Check className="theme-check" size={15} />}</button></div><span className="settings-section-title settings-section-spaced">Preferências</span><label className="settings-select-label">Página inicial ao abrir<select value={defaultSection} onChange={(event) => { const next = event.target.value as Section; saveSettings({ dailyReminders, defaultSection: next }); }}><option value="overview">Visão geral</option><option value="students">Alunos</option><option value="workouts">Treinos</option></select></label><label className="settings-toggle"><span><b>Lembretes no painel</b><small>Mostrar avisos de atividade dos alunos.</small></span><input type="checkbox" checked={dailyReminders} onChange={(event) => saveSettings({ dailyReminders: event.target.checked, defaultSection })} /></label><div className="settings-local-note">Estas preferências ficam neste navegador e ainda não sincronizam com outros dispositivos.</div><div className="modal-actions"><button className="button button-primary" onClick={() => setSettingsOpen(false)}>Concluir</button></div></section></div>}
      {selectedStudent && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedStudent(null); }}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="student-detail-title"><div className="modal-top"><span className="modal-icon"><UsersRound size={19} /></span><button className="icon-button" aria-label="Fechar perfil do aluno" onClick={() => setSelectedStudent(null)}><X size={19} /></button></div><span className="feature-kicker">FICHA DO ALUNO</span><h2 id="student-detail-title">{selectedStudent.name}</h2><p>{selectedStudent.goal} · {selectedStudent.lastWorkout}</p><label>Treino atribuído<select value={selectedStudent.plan} onChange={(event) => { const plan = event.target.value; setStudents((current) => { const next = current.map((item) => item.name === selectedStudent.name ? { ...item, plan } : item); persistData({ students: next }); return next; }); setSelectedStudent({ ...selectedStudent, plan }); }}><option>Sem treino atribuído</option>{workouts.map((workout) => <option key={workout.name}>{workout.name}</option>)}</select></label><div className="modal-actions"><button className="button button-secondary" onClick={() => { const updated = { ...selectedStudent, status: "Treinou hoje" as StudentStatus, lastWorkout: `Hoje, ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` }; setStudents((current) => { const next = current.map((item) => item.name === updated.name ? updated : item); persistData({ students: next }); return next; }); setSelectedStudent(null); announce("Atividade do aluno atualizada."); }}>Registrar treino</button><button className="button button-primary" onClick={() => { setActiveConversation(selectedStudent.name); setSelectedStudent(null); setSection("messages"); }}>Enviar mensagem <MessageCircle size={15} /></button></div></section></div>}

      {selectedWorkout !== null && workouts[selectedWorkout] && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedWorkout(null); }}><section className="modal-card workout-editor" role="dialog" aria-modal="true" aria-labelledby="workout-editor-title"><div className="modal-top"><span className="modal-icon"><Dumbbell size={19} /></span><button className="icon-button" aria-label="Fechar editor de treino" onClick={() => setSelectedWorkout(null)}><X size={19} /></button></div><span className="feature-kicker">EDITOR DO PROGRAMA</span><h2 id="workout-editor-title">{workouts[selectedWorkout].name}</h2><p>Exercícios incluídos no programa, salvos neste navegador.</p><div className="editor-exercise-list">{(workouts[selectedWorkout].exercises || []).map((name) => <div key={name}><Dumbbell size={14} />{name}{exercises.find((exercise) => exercise.name === name)?.videoUrl && <a href={exercises.find((exercise) => exercise.name === name)?.videoUrl} target="_blank" rel="noreferrer">Ver vídeo</a>}</div>)}{!(workouts[selectedWorkout].exercises || []).length && <span>Nenhum exercício ainda. Escolha abaixo.</span>}</div><label>Adicionar exercício<select defaultValue="" onChange={(event) => { if (event.target.value) addExerciseToWorkout(selectedWorkout, event.target.value); event.target.value = ""; }}><option value="" disabled>Escolha da biblioteca...</option>{exercises.map((exercise) => <option key={exercise.name} value={exercise.name}>{exercise.name} · {exercise.group}</option>)}</select></label><div className="modal-actions"><button className="button button-secondary" onClick={() => { const name = window.prompt("Novo nome para o treino:", workouts[selectedWorkout].name); if (name?.trim()) { setWorkouts((current) => { const next = current.map((item, index) => index === selectedWorkout ? { ...item, name: name.trim() } : item); persistData({ workouts: next }); return next; }); announce("Nome do treino atualizado."); } }}>Renomear</button><button className="button button-primary" onClick={() => setSelectedWorkout(null)}>Concluir <Check size={15} /></button></div></section></div>}

      {appointmentModal && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setAppointmentModal(false); }}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="appointment-title"><div className="modal-top"><span className="modal-icon"><CalendarDays size={19} /></span><button className="icon-button" aria-label="Fechar" onClick={() => setAppointmentModal(false)}><X size={19} /></button></div><span className="feature-kicker">AGENDA LOCAL</span><h2 id="appointment-title">Novo compromisso</h2><p>Adicione um horário para organizar sua rotina.</p><form onSubmit={addAppointment}><label>Tipo<input name="title" required placeholder="Ex.: Avaliação física" /></label><label>Aluno<input name="person" required placeholder="Nome do aluno" /></label><div className="appointment-fields"><label>Data<input type="date" name="date" required defaultValue={new Date().toISOString().slice(0, 10)} /></label><label>Horário<input type="time" name="time" required defaultValue="09:00" /></label></div><div className="modal-actions"><button type="button" className="button button-secondary" onClick={() => setAppointmentModal(false)}>Cancelar</button><button type="submit" className="button button-primary">Salvar compromisso</button></div></form></section></div>}
      {helpOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setHelpOpen(false); }}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="help-title"><div className="modal-top"><span className="modal-icon"><CircleHelp size={19} /></span><button className="icon-button" aria-label="Fechar ajuda" onClick={() => setHelpOpen(false)}><X size={19} /></button></div><span className="feature-kicker">CENTRAL DE AJUDA</span><h2 id="help-title">Como usar o Ritmo</h2><p>Cadastre alunos, crie programas e adicione exercícios. Use Agenda para organizar horários; Mensagens e Financeiro são controles de demonstração guardados neste navegador.</p><div className="modal-actions"><button className="button button-secondary" onClick={() => { setHelpOpen(false); setSettingsOpen(true); }}>Abrir configurações</button><button className="button button-primary" onClick={() => setHelpOpen(false)}>Entendi</button></div></section></div>}
      {notice && <div className="toast"><span><Check size={15} /></span>{notice}</div>}
    </div>
  );
}

function MetricCard({ label, value, delta, detail, icon, tone, trend }: { label: string; value: string; delta: string; detail: string; icon: React.ReactNode; tone: string; trend: "up" | "down" }) {
  return <article className="metric-card"><div className="metric-top"><span>{label}</span><span className={`metric-icon icon-${tone}`}>{icon}</span></div><div className="metric-value">{value}</div><div className="metric-bottom"><span className={`metric-delta ${trend === "down" ? "delta-warm" : ""}`}>{trend === "down" ? <ArrowDownRight size={13} /> : <ArrowUpRight size={13} />}{delta}</span><span>{detail}</span></div></article>;
}

function Legend({ label, number, color }: { label: string; number: string; color: string }) {
  return <div className="legend-row"><span className={`legend-dot ${color}`} /><span>{label}</span><b>{number}</b></div>;
}

function ActivityChart({ period }: { period: string }) {
  const weekly = period === "Esta semana";
  const bars = weekly ? [48, 68, 58, 83, 65, 94, 72] : [58, 76, 66, 88, 71, 94, 82];
  const values = weekly ? [32, 39, 35, 44, 38, 48, 41] : [118, 126, 121, 139, 132, 151, 146];
  const labels = weekly ? ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"] : ["04 set", "08 set", "12 set", "16 set", "20 set", "24 set", "28 set"];
  return <div className="chart-area"><div className="chart-y-labels"><span>{weekly ? "50" : "160"}</span><span>{weekly ? "40" : "120"}</span><span>{weekly ? "30" : "80"}</span><span>{weekly ? "20" : "40"}</span><span>{weekly ? "10" : "0"}</span></div><div className="chart-main"><div className="chart-grid-lines"><i /><i /><i /><i /><i /></div><div className="bar-list">{bars.map((height, index) => <div className="bar-column" key={index}><span className={`bar-value ${index === (weekly ? 5 : 6) ? "bar-value-visible" : ""}`}>{values[index]}</span><div className={`chart-bar ${index === (weekly ? 5 : 6) ? "chart-bar-highlight" : ""}`} style={{ height: `${height}%` }} /></div>)}</div><div className="chart-x-labels">{labels.map((label) => <span key={label}>{label}</span>)}</div></div></div>;
}

function AgendaItem({ time, title, person, initials, tone, onRemove }: { time: string; title: string; person: string; initials: string; tone: string; onRemove: () => void }) {
  return <div className="agenda-item"><span className="agenda-time">{time}</span><span className={`agenda-line line-${tone}`} /><div className="agenda-copy"><b>{title}</b><small><span className={`mini-avatar mini-${tone}`}>{initials}</span>{person}</small></div><button className="agenda-more" aria-label={`Remover ${title}`} onClick={onRemove}><Ellipsis size={16} /></button></div>;
}
