import type { Exercise, PersistedAppState, Prescription, Program, Trainer } from "./types";

export const exercises: Exercise[] = [
  { id: "bench-press", name: "Supino reto", muscle: "Peito", equipment: "Barra", level: "Intermediário", description: "Empurrada horizontal para fortalecer o peitoral, tríceps e deltoide anterior.", instructions: ["Mantenha os pés apoiados e as escápulas firmes no banco.", "Desça a barra com controle até a linha média do peito.", "Empurre sem perder o alinhamento dos punhos e cotovelos."], sets: 4, reps: "10", restSeconds: 90, targetLoad: 30 },
  { id: "incline-press", name: "Supino inclinado", muscle: "Peito", equipment: "Halteres", level: "Intermediário", description: "Variação inclinada com foco na região superior do peitoral.", instructions: ["Ajuste o banco entre 30° e 45°.", "Desça os halteres ao lado do peito sem deixar os ombros avançarem.", "Suba de forma controlada e mantenha os pés firmes."], sets: 3, reps: "12", restSeconds: 75, targetLoad: 16 },
  { id: "cable-fly", name: "Crossover", muscle: "Peito", equipment: "Polia", level: "Iniciante", description: "Movimento de adução dos braços com tensão contínua da polia.", instructions: ["Posicione um pé à frente e incline levemente o tronco.", "Una as mãos à frente do peito sem arredondar as costas.", "Retorne até sentir alongamento confortável."], sets: 3, reps: "15", restSeconds: 60, targetLoad: 10 },
  { id: "triceps-pushdown", name: "Tríceps pulley", muscle: "Tríceps", equipment: "Polia", level: "Iniciante", description: "Extensão de cotovelos na polia, mantendo os braços próximos ao tronco.", instructions: ["Mantenha o tronco estável e cotovelos junto ao corpo.", "Estenda os braços sem travar os cotovelos com força.", "Retorne devagar até a posição inicial."], sets: 3, reps: "12", restSeconds: 60, targetLoad: 18 },
  { id: "squat", name: "Agachamento", muscle: "Quadríceps", equipment: "Barra", level: "Intermediário", description: "Exercício composto para pernas e quadril, com a barra apoiada de forma estável.", instructions: ["Apoie a barra com conforto e firme o abdômen.", "Sente o quadril para trás e desça mantendo os joelhos alinhados aos pés.", "Suba empurrando o chão, sem perder a postura."], sets: 4, reps: "10", restSeconds: 90, targetLoad: 40 },
  { id: "seated-row", name: "Remada baixa", muscle: "Costas", equipment: "Polia", level: "Intermediário", description: "Puxada horizontal para costas, com foco em controle escapular.", instructions: ["Sente com a coluna neutra e peito aberto.", "Puxe o pegador em direção ao abdômen, conduzindo pelos cotovelos.", "Estenda os braços devagar sem arredondar a lombar."], sets: 3, reps: "12", restSeconds: 60, targetLoad: 25 },
  { id: "shoulder-press", name: "Desenvolvimento", muscle: "Ombros", equipment: "Halteres", level: "Intermediário", description: "Empurrada vertical para ombros, com tronco firme e amplitude confortável.", instructions: ["Comece com os halteres na altura dos ombros.", "Empurre para cima sem arquear a lombar.", "Desça até a posição inicial com controle."], sets: 3, reps: "12", restSeconds: 60, targetLoad: 12 },
  { id: "glute-bridge", name: "Ponte de glúteo", muscle: "Glúteos", equipment: "Peso corporal", level: "Iniciante", description: "Extensão do quadril com foco em glúteos e estabilidade do tronco.", instructions: ["Deite com joelhos flexionados e pés apoiados.", "Eleve o quadril contraindo os glúteos.", "Desça devagar sem relaxar completamente no chão."], sets: 3, reps: "15", restSeconds: 45, targetLoad: 0 },
  { id: "plank", name: "Prancha", muscle: "Core", equipment: "Peso corporal", level: "Iniciante", description: "Isometria para controle e resistência do tronco.", instructions: ["Apoie antebraços e pontas dos pés no chão.", "Mantenha cabeça, tronco e quadril alinhados.", "Respire normalmente e pare se perder a postura."], sets: 3, reps: "30 s", restSeconds: 45, targetLoad: 0 },
  { id: "lateral-raise", name: "Elevação lateral", muscle: "Ombros", equipment: "Halteres", level: "Iniciante", description: "Abdução dos ombros para o deltoide lateral.", instructions: ["Fique em pé com leve flexão dos cotovelos.", "Eleve os halteres até a linha dos ombros.", "Desça devagar, sem balançar o tronco."], sets: 3, reps: "12", restSeconds: 60, targetLoad: 6 },
  { id: "lat-pulldown", name: "Puxada frontal", muscle: "Costas", equipment: "Polia", level: "Iniciante", description: "Puxada vertical para dorsais e bíceps.", instructions: ["Segure a barra um pouco além da largura dos ombros.", "Puxe até a parte alta do peito levando os cotovelos para baixo.", "Retorne controlando até estender os braços."], sets: 4, reps: "10", restSeconds: 75, targetLoad: 40 },
  { id: "biceps-curl", name: "Rosca direta", muscle: "Bíceps", equipment: "Barra", level: "Iniciante", description: "Flexão de cotovelos para o bíceps braquial.", instructions: ["Cotovelos junto ao tronco.", "Suba a barra sem projetar os ombros.", "Desça em dois a três segundos."], sets: 3, reps: "12", restSeconds: 60, targetLoad: 20 },
  { id: "leg-press", name: "Leg press 45°", muscle: "Quadríceps", equipment: "Máquina", level: "Iniciante", description: "Empurrada de pernas guiada, com quadril apoiado.", instructions: ["Apoie toda a lombar no encosto.", "Desça até cerca de 90° nos joelhos.", "Empurre sem travar os joelhos no final."], sets: 4, reps: "12", restSeconds: 90, targetLoad: 120 },
  { id: "leg-curl", name: "Mesa flexora", muscle: "Posterior", equipment: "Máquina", level: "Iniciante", description: "Flexão de joelhos para isquiotibiais.", instructions: ["Ajuste o rolo logo acima dos tornozelos.", "Flexione os joelhos sem tirar o quadril do banco.", "Retorne devagar."], sets: 3, reps: "12", restSeconds: 60, targetLoad: 30 },
  { id: "calf-raise", name: "Panturrilha em pé", muscle: "Panturrilhas", equipment: "Máquina", level: "Iniciante", description: "Flexão plantar para gastrocnêmio.", instructions: ["Apoie a ponta dos pés na plataforma.", "Suba o máximo possível e segure um segundo.", "Desça alongando sem quicar."], sets: 4, reps: "15", restSeconds: 45, targetLoad: 40 },
];

export const muscles = ["Todos", "Peito", "Costas", "Ombros", "Bíceps", "Tríceps", "Quadríceps", "Posterior", "Glúteos", "Panturrilhas", "Core", "Cardio", "Mobilidade"];

/** Personal de demonstração (fictício). Na versão conectada vem de trainer_accounts. */
export const trainer: Trainer = { name: "Carla Mendes", cref: "000000-G/SP", whatsapp: "5511900000000", instagram: "ritmo.app" };

function isoDate(offsetDays: number) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

const p = (exerciseId: string, sets: number, repsMin: number, repsMax: number, loadKg: number, restSeconds = 75, loadPerSide = false, note?: string): Prescription => ({ exerciseId, sets, repsMin, repsMax, loadKg, restSeconds, loadPerSide, note });

/** Programa de demonstração com validade e fichas por dia da semana. */
export const program: Program = {
  id: "demo-program",
  name: "Hipertrofia · Bloco 1",
  goal: "Hipertrofia",
  level: "Intermediário",
  startsOn: isoDate(-21),
  endsOn: isoDate(39),
  generalNotes: "Aqueça 5 a 10 minutos antes de começar.\nQuando completar todas as repetições máximas em duas sessões seguidas, o app sugere aumentar a carga.\nSentiu dor? Marque no feedback ao final — eu recebo o aviso.",
  days: [
    { id: "mon", label: "Segunda", title: "Peito, ombro e tríceps", weekday: 1, items: [p("bench-press", 4, 8, 10, 30, 90), p("incline-press", 3, 10, 12, 16, 75, true), p("cable-fly", 3, 12, 15, 10, 60), p("lateral-raise", 3, 12, 15, 6, 60, true), p("triceps-pushdown", 3, 10, 12, 18, 60)] },
    { id: "tue", label: "Terça", title: "Membros inferiores", weekday: 2, items: [p("squat", 4, 8, 10, 40, 120), p("leg-press", 4, 10, 12, 120, 90), p("leg-curl", 3, 10, 12, 30, 60), p("glute-bridge", 3, 12, 15, 0, 45), p("calf-raise", 4, 12, 15, 40, 45)] },
    { id: "wed", label: "Quarta", title: "Costas e bíceps", weekday: 3, items: [p("lat-pulldown", 4, 8, 10, 40, 75), p("seated-row", 3, 10, 12, 25, 60), p("biceps-curl", 3, 10, 12, 20, 60), p("plank", 3, 30, 45, 0, 45, false, "Repetições em segundos")] },
    { id: "fri", label: "Sexta", title: "Full body", weekday: 5, items: [p("squat", 3, 10, 12, 35, 90), p("bench-press", 3, 10, 12, 26, 75), p("lat-pulldown", 3, 10, 12, 35, 75), p("shoulder-press", 3, 10, 12, 12, 60, true)] },
  ],
};

/** Mantido para compatibilidade com telas antigas: primeira ficha do programa. */
export const workoutExerciseIds = program.days[0].items.map(item => item.exerciseId);

export const defaultState: PersistedAppState = {
  theme: "light",
  displayName: "Ruan",
  favorites: [],
  sessions: [],
  videos: {},
  measurements: [],
  uiVersion: 2,
};

export const sampleNotifications = [
  { id: "workout-ready", icon: "▣", tone: "mint", title: "Treino atualizado", body: "Seu personal publicou uma nova versão do Treino A.", time: "há 2h", route: "/workout" },
  { id: "workout-reminder", icon: "◷", tone: "orange", title: "Hora de se movimentar", body: "Seu treino de hoje está pronto quando você estiver.", time: "há 5h", route: "/workout" },
  { id: "check-in", icon: "✦", tone: "violet", title: "Check-in da semana", body: "Conte ao seu personal como você está se sentindo.", time: "ontem", route: "/messages" },
];

export const sampleMessages = [
  { id: "m1", author: "trainer", text: "Oi, Ruan! Ajustei o treino desta semana. Se algum exercício incomodar, me avisa por aqui.", time: "09:24" },
  { id: "m2", author: "trainer", text: "No supino, mantém o movimento confortável e com controle. Boa sessão! 💪", time: "09:26" },
];
