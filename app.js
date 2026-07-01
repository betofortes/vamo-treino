const STORAGE_KEY = "vamo-training-v1";
const SYNC_CONFIG_KEY = "workout-sync-config-v1";
const SYNC_STATE_KEY = "workout-sync-state-v1";
const DEFAULT_SYNC_CONFIG = {
  url: "https://onpgwlbbzqjmuevkpbrw.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ucGd3bGJienFqbXVldmtwYnJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTg3MjAsImV4cCI6MjA5ODQzNDcyMH0.G534vlribv_RITZkeObKwxBHQrE-GcBT0vHNVZFG3WA",
};
const AUTO_SYNC_INTERVAL_MS = 45000;
const SYNC_SCHEMA_SQL = `create table if not exists public.workout_sync (
  sync_id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.workout_sync enable row level security;

grant usage on schema public to anon;
grant select, insert, update on public.workout_sync to anon;

drop policy if exists "workout_sync_read" on public.workout_sync;
drop policy if exists "workout_sync_insert" on public.workout_sync;
drop policy if exists "workout_sync_update" on public.workout_sync;

create policy "workout_sync_read"
on public.workout_sync for select
to anon
using (true);

create policy "workout_sync_insert"
on public.workout_sync for insert
to anon
with check (true);

create policy "workout_sync_update"
on public.workout_sync for update
to anon
using (true)
with check (true);`;
const CYCLE_START = "2026-06-22";
const CARDIO_MINIMUM = 1400;
const CARDIO_LONG_TERM = 2400;
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_NAMES = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
const DAY_SHORT = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

try {
  localStorage.removeItem("workout-auth-v1");
  localStorage.removeItem("workout-session-v1");
} catch {
  // O aplicativo continua disponível mesmo quando o navegador restringe o armazenamento.
}

const makeExercise = (
  id,
  name,
  muscle,
  sets,
  minReps,
  maxReps,
  options = {},
) => ({
  id,
  name,
  muscle,
  sets,
  minReps,
  maxReps,
  loadUnit: options.loadUnit ?? "kg",
  unit: options.unit ?? "reps",
  target: options.target ?? null,
  rir: options.rir ?? (options.type === "composto" ? "RIR 1-2" : "RIR 0-1 na última"),
  type: options.type ?? "isolador",
  defaultLoad: options.defaultLoad ?? "",
  notes: options.notes ?? "",
  restSeconds: options.restSeconds ?? (options.type === "composto" ? 120 : 90),
});

const workoutPlan = {
  1: {
    short: "SEG",
    name: "Segunda-feira",
    title: "Peito + Tríceps",
    warmupTitle: "Supino reto com barra",
    warmup: "Barra ou carga leve por 12-15 repetições; 40-50% x8; 60-70% x5; 75-85% x2-3.",
    cardio: { intensity: "Moderado", note: "Ritmo estável, sem buscar recorde." },
    exercises: [
      makeExercise("supino-reto-barra", "Supino reto com barra", "Peito", 4, 6, 8, { type: "composto" }),
      makeExercise("supino-inclinado-halteres", "Supino inclinado com halteres", "Peito", 4, 8, 10, { type: "composto" }),
      makeExercise("crucifixo-inclinado", "Crucifixo inclinado", "Peito", 3, 10, 12),
      makeExercise("crossover", "Crossover", "Peito", 2, 12, 15),
      makeExercise("triceps-testa", "Tríceps testa", "Tríceps", 3, 8, 10),
      makeExercise("triceps-corda-seg", "Tríceps corda", "Tríceps", 3, 10, 12),
    ],
  },
  2: {
    short: "TER",
    name: "Terça-feira",
    title: "Costas + Bíceps + Abdômen",
    warmupTitle: "Puxada alta aberta",
    warmup: "Carga leve por 12-15 repetições; 50% x8; 70% x5; 80-85% x2-3.",
    cardio: { intensity: "Forte / controlado", note: "Dia principal para evoluir a distância." },
    exercises: [
      makeExercise("puxada-alta-aberta", "Puxada alta aberta", "Costas", 4, 6, 10, { type: "composto" }),
      makeExercise("remada-curvada-maquina", "Remada curvada na máquina", "Costas", 4, 6, 8, { type: "composto" }),
      makeExercise("pulldown", "Pulldown", "Costas", 3, 8, 12, { loadUnit: "lb" }),
      makeExercise("rosca-direta-polia", "Rosca direta na polia", "Bíceps", 4, 6, 8),
      makeExercise("rosca-inclinada-polia", "Rosca inclinada na polia", "Bíceps", 3, 8, 12),
      makeExercise("elevacao-pernas", "Elevação de pernas", "Abdômen", 4, 12, 15, { loadUnit: "livre" }),
      makeExercise("crunch-polia", "Crunch na polia", "Abdômen", 3, 12, 15),
    ],
  },
  3: {
    short: "QUA",
    name: "Quarta-feira",
    title: "Quadríceps + Panturrilhas",
    warmupTitle: "Agachamento livre",
    warmup: "Barra ou carga leve por 12-15 repetições; 40-50% x8; 60-70% x5; 75-85% x2-3.",
    cardio: { intensity: "Leve / regenerativo", note: "Sem forçar recorde após o treino de pernas." },
    exercises: [
      makeExercise("agachamento-livre", "Agachamento livre", "Quadríceps", 5, 5, 8, { type: "composto" }),
      makeExercise("leg-press", "Leg press", "Quadríceps", 4, 10, 12, { type: "composto" }),
      makeExercise("agachamento-bulgaro", "Agachamento búlgaro", "Quadríceps", 3, 10, 12, { target: "por perna", type: "composto" }),
      makeExercise("cadeira-extensora", "Cadeira extensora", "Quadríceps", 3, 12, 15),
      makeExercise("panturrilha-em-pe-qua", "Panturrilha em pé", "Panturrilhas", 4, 12, 15),
      makeExercise("panturrilha-sentada-qua", "Panturrilha sentada", "Panturrilhas", 4, 15, 20),
    ],
  },
  4: {
    short: "QUI",
    name: "Quinta-feira",
    title: "Peito + Ombros + Tríceps",
    warmupTitle: "Supino inclinado + desenvolvimento",
    warmup: "Supino: barra ou carga leve 12-15; 40-50% x8; 60-70% x5; 75-85% x2-3. Desenvolvimento: leve 10-12; 60-70% x5.",
    cardio: { intensity: "Forte / controlado", note: "Dia principal para evoluir a distância." },
    exercises: [
      makeExercise("supino-inclinado-barra", "Supino inclinado com barra", "Peito", 4, 6, 8, { type: "composto" }),
      makeExercise("supino-maquina", "Supino na máquina", "Peito", 4, 8, 10, { type: "composto" }),
      makeExercise("crossover-baixo", "Crossover baixo", "Peito", 2, 12, 15),
      makeExercise("desenvolvimento-militar", "Desenvolvimento militar", "Ombros", 4, 6, 8, { type: "composto" }),
      makeExercise("elevacao-lateral-qui", "Elevação lateral", "Ombros", 4, 10, 15),
      makeExercise("crucifixo-inverso-qui", "Crucifixo inverso", "Ombros", 3, 12, 15),
      makeExercise("paralelas", "Paralelas", "Tríceps", 3, null, null, { target: "falha controlada", loadUnit: "livre" }),
      makeExercise("triceps-corda-qui", "Tríceps corda", "Tríceps", 3, 10, 12),
    ],
  },
  5: {
    short: "SEX",
    name: "Sexta-feira",
    title: "Costas + Bíceps + Abdômen",
    warmupTitle: "Puxada ou barra neutra",
    warmup: "Carga leve por 12-15 repetições; 50% x8; 70% x5; 80-85% x2-3.",
    cardio: { intensity: "Moderado", note: "Ritmo estável, sem buscar recorde." },
    exercises: [
      makeExercise("puxada-neutra", "Barra fixa neutra ou puxada neutra", "Costas", 4, 6, 10, { type: "composto" }),
      makeExercise("remada-cavalinho", "Remada cavalinho", "Costas", 4, 8, 10, { type: "composto" }),
      makeExercise("pullover-polia", "Pullover na polia", "Costas", 3, 12, 15),
      makeExercise("rosca-ez", "Rosca EZ", "Bíceps", 4, 8, 10),
      makeExercise("rosca-scott", "Rosca Scott", "Bíceps", 3, 10, 12),
      makeExercise("crunch-maquina", "Crunch na máquina", "Abdômen", 4, 12, 15),
      makeExercise("prancha", "Prancha", "Abdômen", 3, 60, 60, { unit: "s", target: "60 segundos", loadUnit: "livre" }),
    ],
  },
  6: {
    short: "SÁB",
    name: "Sábado",
    title: "Posterior + Glúteos",
    warmupTitle: "Terra romeno",
    warmup: "Barra ou carga leve por 12 repetições; 40-50% x8; 60-70% x5; 75-85% x2-3.",
    cardio: { intensity: "Leve / regenerativo", note: "Sem atrapalhar a recuperação de posterior e glúteos." },
    exercises: [
      makeExercise("terra-romeno", "Terra romeno", "Posterior", 4, 6, 8, { type: "composto" }),
      makeExercise("mesa-flexora", "Mesa flexora", "Posterior", 4, 10, 12),
      makeExercise("flexora-unilateral", "Flexora unilateral", "Posterior", 3, 10, 12),
      makeExercise("hip-thrust", "Hip thrust", "Glúteos", 4, 8, 12, { type: "composto" }),
      makeExercise("afundo-caminhando", "Afundo caminhando", "Glúteos", 3, 12, 12, { target: "passos por perna", type: "composto" }),
    ],
  },
  0: {
    short: "DOM",
    name: "Domingo",
    title: "Ombros + Bíceps + Panturrilhas",
    warmupTitle: "Mobilidade de ombros",
    warmup: "Elevação lateral leve 2x15-20; crucifixo inverso leve 2x15-20; rotação externa 2x15.",
    cardio: { intensity: "Moderado", note: "Ritmo estável, sem buscar recorde." },
    exercises: [
      makeExercise("elevacao-lateral-dom", "Elevação lateral", "Ombros", 4, 12, 15),
      makeExercise("crucifixo-inverso-dom", "Crucifixo inverso", "Ombros", 4, 12, 15),
      makeExercise("face-pull", "Face pull", "Ombros", 4, 15, 20),
      makeExercise("rosca-martelo", "Rosca martelo", "Bíceps", 3, 10, 12),
      makeExercise("rosca-scott-unilateral", "Rosca Scott unilateral", "Bíceps", 3, 10, 12),
      makeExercise("panturrilha-sentada-dom", "Panturrilha sentada", "Panturrilhas", 4, 15, 20),
      makeExercise("panturrilha-em-pe-dom", "Panturrilha em pé", "Panturrilhas", 4, 12, 15),
    ],
  },
};

const exerciseCatalog = Array.from(
  new Map(
    Object.values(workoutPlan)
      .flatMap((plan) => plan.exercises)
      .map((exercise) => [exercise.name, exercise]),
  ).values(),
).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

const DEFAULT_COACH_RECOMMENDATIONS = [
  {
    id: "seed-coach-2026-06-25-supino-inclinado-barra",
    exerciseId: "supino-inclinado-barra",
    exerciseName: "Supino inclinado com barra",
    recommendationText: "Usar 40 kg como carga base. Meta próxima: 8/8/8/8. Só subir para 42,5 kg ou 45 kg depois de fechar todas as séries no topo da faixa.",
  },
  {
    id: "seed-coach-2026-06-25-supino-maquina",
    exerciseId: "supino-maquina",
    exerciseName: "Supino na máquina",
    recommendationText: "Usar 35 kg como carga base. Meta próxima: 10/9/8/8. Não usar 40 kg ainda como base, pois saiu abaixo da faixa.",
  },
  {
    id: "seed-coach-2026-06-25-crossover-baixo",
    exerciseId: "crossover-baixo",
    exerciseName: "Crossover baixo",
    recommendationText: "Manter 18 kg. Meta próxima: 15/15.",
  },
  {
    id: "seed-coach-2026-06-25-desenvolvimento-militar",
    exerciseId: "desenvolvimento-militar",
    exerciseName: "Desenvolvimento militar",
    recommendationText: "Usar 25 kg como carga base. Meta próxima: 8/8/7/6. Alternativa: 20/25/25/30 kg como progressão crescente.",
  },
  {
    id: "seed-coach-2026-06-25-elevacao-lateral-qui",
    exerciseId: "elevacao-lateral-qui",
    exerciseName: "Elevação lateral",
    recommendationText: "Manter 15 kg. Meta próxima: 15/15/13/13.",
  },
  {
    id: "seed-coach-2026-06-25-crucifixo-inverso-qui",
    exerciseId: "crucifixo-inverso-qui",
    exerciseName: "Crucifixo inverso",
    recommendationText: "Manter 80 kg. Meta próxima: 15/15/15.",
  },
  {
    id: "seed-coach-2026-06-25-paralelas",
    exerciseId: "paralelas",
    exerciseName: "Paralelas",
    recommendationText: "Registrar se a máquina é assistida ou carga contra o usuário. Manter o registro 50/84/104 kg — 15/15/10 até confirmar o tipo da máquina.",
  },
  {
    id: "seed-coach-2026-06-25-triceps-corda-qui",
    exerciseId: "triceps-corda-qui",
    exerciseName: "Tríceps corda",
    recommendationText: "Usar 60 kg como carga-base. Meta próxima: 10/10/10.",
  },
];

const state = {
  view: "today",
  selectedDate: localISO(new Date()),
  store: loadStore(),
  builder: null,
  sheetBuilder: null,
  exerciseTimers: {},
  sync: loadSyncState(),
};

const app = document.querySelector("#app");
const toast = document.querySelector("#toast");
let toastTimer;
let timerTicker;
let syncDebounceTimer;
let autoSyncTimer;
let autoSyncListenersAttached = false;

function localISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseISO(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeExercise(exercise, index = 0) {
  return {
    ...exercise,
    id: exercise.id ?? `exercise-${Date.now()}-${index}`,
    defaultLoad: exercise.defaultLoad ?? "",
    notes: exercise.notes ?? "",
    restSeconds: Number(exercise.restSeconds) || (exercise.type === "composto" ? 120 : 90),
  };
}

function normalizePlanDay(plan, weekday) {
  return {
    ...cloneValue(plan),
    id: plan.id ?? `base-${weekday}`,
    weekday: Number(weekday),
    short: DAY_SHORT[weekday],
    name: DAY_NAMES[weekday],
    cardio: {
      intensity: plan.cardio?.intensity ?? "Moderado",
      duration: Number(plan.cardio?.duration ?? 12),
      minimum: Number(plan.cardio?.minimum ?? CARDIO_MINIMUM),
      goal: Number(plan.cardio?.goal ?? CARDIO_LONG_TERM),
      note: plan.cardio?.note ?? "Ritmo estável e controlado.",
    },
    exercises: (plan.exercises ?? []).map(normalizeExercise),
  };
}

function makeDefaultActivePlan() {
  return {
    id: "current-plan",
    name: "Ficha atual",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    days: DAY_ORDER.map((weekday) => normalizePlanDay(workoutPlan[weekday], weekday)),
  };
}

function findStoredPlan(store, planId, weekday) {
  const custom = store.customPlans?.find((plan) => plan.id === planId);
  const archived = store.planArchive?.find((plan) => plan.id === planId);
  const active = store.activePlan?.days?.find((plan) => plan.id === planId);
  return custom ?? archived ?? active ?? normalizePlanDay(workoutPlan[weekday], weekday);
}

function defaultExerciseDetails(plan) {
  return Object.fromEntries(
    (plan?.exercises ?? []).map((exercise) => [
      exercise.id,
      { performedName: "", substitutionReason: "", notes: "" },
    ]),
  );
}

function normalizeCoachRecommendation(recommendation) {
  return {
    id: recommendation.id ?? `coach-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    exerciseId: recommendation.exerciseId ?? "",
    exerciseName: recommendation.exerciseName ?? "",
    workoutSessionId: recommendation.workoutSessionId ?? recommendation.sourceDate ?? "",
    sourceDate: recommendation.sourceDate ?? recommendation.workoutSessionId ?? "",
    workoutTitle: recommendation.workoutTitle ?? "",
    recommendationText: recommendation.recommendationText ?? "",
    suggestedWeight: recommendation.suggestedWeight ?? "",
    suggestedRepTarget: recommendation.suggestedRepTarget ?? "",
    createdAt: recommendation.createdAt ?? new Date().toISOString(),
    appliesToNextSession: recommendation.appliesToNextSession ?? true,
    status: recommendation.status ?? "pending",
    appliedAt: recommendation.appliedAt ?? "",
    appliedSessionId: recommendation.appliedSessionId ?? "",
    result: recommendation.result ?? "",
    fulfilled: recommendation.fulfilled ?? null,
  };
}

function ensureCoachStore(store) {
  store.coachRecommendations ??= [];
  store.coachRecommendations = store.coachRecommendations.map(normalizeCoachRecommendation);

  DEFAULT_COACH_RECOMMENDATIONS.forEach((recommendation) => {
    if (store.coachRecommendations.some((item) => item.id === recommendation.id)) return;
    store.coachRecommendations.push(
      normalizeCoachRecommendation({
        ...recommendation,
        workoutSessionId: "2026-06-25",
        sourceDate: "2026-06-25",
        workoutTitle: "Peito + Ombros + Tríceps",
        createdAt: "2026-06-25T20:00:00-03:00",
        status: "pending",
      }),
    );
  });
}

function normalizeSession(store, dateISO, session) {
  const weekday = parseISO(dateISO).getDay();
  session.planId ??= `base-${weekday}`;
  session.cardio ??= { duration: "12", distance: "", speed: "" };
  session.cardio.speed ??= "";
  session.mobilityDone ??= false;
  session.timer ??= { elapsed: 0, running: false, startedAt: null };
  session.planSnapshot ??= cloneValue(findStoredPlan(store, session.planId, weekday));
  session.loadRecommendations ??= {};
  session.repRecommendations ??= {};
  session.exerciseDetails ??= defaultExerciseDetails(session.planSnapshot);
  (session.planSnapshot?.exercises ?? []).forEach((exercise) => {
    session.exerciseDetails[exercise.id] ??= { performedName: "", substitutionReason: "", notes: "" };
    session.exerciseDetails[exercise.id].performedName ??= "";
    session.exerciseDetails[exercise.id].substitutionReason ??= "";
    session.exerciseDetails[exercise.id].notes ??= "";
  });
  session.coachResponseText ??= "";
  session.coachExerciseDrafts ??= {};
  session.chatgptSummary ??= "";
  return session;
}

function defaultStore() {
  const seed = {
    version: 1,
    sessions: {},
    customPlans: [],
    datePlanOverrides: {},
    activePlan: makeDefaultActivePlan(),
    planArchive: [],
    coachRecommendations: [],
    updatedAt: new Date().toISOString(),
  };

  const tuesday = workoutPlan[2];
  const completedLoads = {
    "puxada-alta-aberta": "79",
    "remada-curvada-maquina": "30",
    pulldown: "120",
    "rosca-direta-polia": "40",
    "rosca-inclinada-polia": "15",
    "elevacao-pernas": "PC",
  };

  const exerciseLogs = {};
  tuesday.exercises.forEach((exercise) => {
    exerciseLogs[exercise.id] = Array.from({ length: exercise.sets }, () => ({
      load: completedLoads[exercise.id] ?? "",
      reps: "",
      done: Object.hasOwn(completedLoads, exercise.id),
    }));
  });

  seed.sessions["2026-06-23"] = {
    dayId: 2,
    planId: "base-2",
    planSnapshot: cloneValue(seed.activePlan.days.find((plan) => plan.weekday === 2)),
    exerciseLogs,
    cardio: { duration: "12", distance: "1400", speed: "" },
    mobilityDone: false,
    timer: { elapsed: 0, running: false, startedAt: null },
    notes: "Todos os exercícios realizados ficaram dentro da faixa indicada. Crunch na polia não realizado.",
    completedAt: "2026-06-23T20:00:00-03:00",
  };

  ensureCoachStore(seed);
  return seed;
}

function loadStore() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      parsed.customPlans ??= [];
      parsed.datePlanOverrides ??= {};
      parsed.activePlan ??= makeDefaultActivePlan();
      parsed.activePlan.days = (parsed.activePlan.days ?? []).map((plan) => normalizePlanDay(plan, plan.weekday));
      parsed.planArchive ??= [];
      ensureCoachStore(parsed);
      parsed.updatedAt ??= new Date().toISOString();
      Object.entries(parsed.sessions ?? {}).forEach(([dateISO, session]) => {
        normalizeSession(parsed, dateISO, session);
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      return parsed;
    }
  } catch (error) {
    console.warn("Não foi possível ler os registros salvos.", error);
  }
  const initial = defaultStore();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  } catch (error) {
    console.warn("Não foi possível salvar os dados iniciais.", error);
  }
  return initial;
}

function persist() {
  state.store.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.store));
  scheduleAutoSync();
}

function loadSyncState() {
  try {
    const config = JSON.parse(localStorage.getItem(SYNC_CONFIG_KEY) || "null");
    const saved = JSON.parse(localStorage.getItem(SYNC_STATE_KEY) || "null");
    const hasBundledConfig = Boolean(DEFAULT_SYNC_CONFIG.url && DEFAULT_SYNC_CONFIG.anonKey);
    const shouldUseBundledConfig =
      hasBundledConfig && (!config?.url || config.url !== DEFAULT_SYNC_CONFIG.url || config.anonKey !== DEFAULT_SYNC_CONFIG.anonKey);
    return {
      config: shouldUseBundledConfig ? { ...DEFAULT_SYNC_CONFIG } : { ...DEFAULT_SYNC_CONFIG, ...(config ?? {}) },
      code: saved?.code ?? "",
      pendingCode: "",
      lastSyncedAt: saved?.lastSyncedAt ?? "",
      status: "",
      busy: false,
    };
  } catch {
    return { config: { ...DEFAULT_SYNC_CONFIG }, code: "", pendingCode: "", lastSyncedAt: "", status: "", busy: false };
  }
}

function saveSyncState() {
  localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(state.sync.config));
  localStorage.setItem(SYNC_STATE_KEY, JSON.stringify({ code: state.sync.code, lastSyncedAt: state.sync.lastSyncedAt }));
}

function syncConfigured() {
  return Boolean(state.sync.config?.url && state.sync.config?.anonKey);
}

function setSyncStatus(message) {
  state.sync.status = message;
  const target = document.querySelector("[data-sync-status]");
  if (target) target.textContent = message;
}

function bytesToBase64(bytes) {
  const data = new Uint8Array(bytes);
  const chunkSize = 0x8000;
  let binary = "";
  for (let index = 0; index < data.length; index += chunkSize) {
    binary += String.fromCharCode(...data.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

function base64ToBytes(value) {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

function randomSyncCode() {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("").replace(/(.{6})/g, "$1-").replace(/-$/, "");
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function syncIdForCode(code) {
  return sha256Hex("workout-sync:" + code.trim());
}

async function deriveSyncKey(code, salt) {
  const baseKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(code.trim()), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 120000, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function encryptStoreForSync(store, code) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveSyncKey(code, salt);
  const data = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(JSON.stringify(store)));
  return { v: 1, salt: bytesToBase64(salt), iv: bytesToBase64(iv), data: bytesToBase64(data) };
}

async function decryptStoreFromSync(payload, code) {
  const salt = base64ToBytes(payload.salt);
  const iv = base64ToBytes(payload.iv);
  const key = await deriveSyncKey(code, salt);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, base64ToBytes(payload.data));
  return JSON.parse(new TextDecoder().decode(decrypted));
}

function syncEndpoint(path = "") {
  return state.sync.config.url.replace(/\/$/, "") + "/rest/v1/workout_sync" + path;
}

function syncHeaders(extra = {}) {
  return {
    apikey: state.sync.config.anonKey,
    Authorization: "Bearer " + state.sync.config.anonKey,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function syncErrorMessage(response, fallback) {
  const details = await response.text().catch(() => "");
  if (response.status === 404) {
    return "A tabela workout_sync ainda não existe no Supabase. Copie o modelo de tabela no app e rode no SQL Editor.";
  }
  if (response.status === 401 || response.status === 403) {
    return "O Supabase recusou a conexão. Confira a URL, a chave pública e as permissões da tabela workout_sync.";
  }
  if (details.includes("row-level security")) {
    return "O Supabase bloqueou por permissão. Rode o modelo de tabela completo para liberar a sincronização criptografada.";
  }
  return fallback;
}

async function fetchRemoteSync(syncId) {
  const response = await fetch(syncEndpoint() + "?sync_id=eq." + encodeURIComponent(syncId) + "&select=sync_id,payload,updated_at", {
    headers: syncHeaders(),
  });
  if (!response.ok) throw new Error(await syncErrorMessage(response, "Não foi possível consultar a sincronização."));
  return (await response.json())[0] ?? null;
}

async function upsertRemoteSync(syncId, payload) {
  const response = await fetch(syncEndpoint() + "?on_conflict=sync_id", {
    method: "POST",
    headers: syncHeaders({ Prefer: "resolution=merge-duplicates,return=representation" }),
    body: JSON.stringify({ sync_id: syncId, payload, updated_at: new Date().toISOString() }),
  });
  if (!response.ok) throw new Error(await syncErrorMessage(response, "Não foi possível enviar os dados sincronizados."));
  return (await response.json())[0] ?? null;
}

function replaceStoreFromSync(remoteStore) {
  remoteStore.customPlans ??= [];
  remoteStore.datePlanOverrides ??= {};
  remoteStore.activePlan ??= makeDefaultActivePlan();
  remoteStore.activePlan.days = (remoteStore.activePlan.days ?? []).map((plan) => normalizePlanDay(plan, plan.weekday));
  remoteStore.planArchive ??= [];
  ensureCoachStore(remoteStore);
  remoteStore.updatedAt ??= new Date().toISOString();
  Object.entries(remoteStore.sessions ?? {}).forEach(([dateISO, session]) => normalizeSession(remoteStore, dateISO, session));
  state.store = remoteStore;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.store));
}

async function pushSync() {
  if (!syncConfigured() || !state.sync.code) return false;
  state.sync.busy = true;
  setSyncStatus("Enviando dados...");
  try {
    const syncId = await syncIdForCode(state.sync.code);
    const payload = await encryptStoreForSync(state.store, state.sync.code);
    await upsertRemoteSync(syncId, payload);
    state.sync.lastSyncedAt = new Date().toISOString();
    saveSyncState();
    setSyncStatus("Sincronizado agora.");
    return true;
  } catch (error) {
    console.warn(error);
    setSyncStatus(error.message || "Não foi possível enviar. Confira a conexão do Supabase.");
    return false;
  } finally {
    state.sync.busy = false;
  }
}

async function pullSync({ onlyIfNewer = false, silent = false } = {}) {
  if (!syncConfigured() || !state.sync.code) return false;
  state.sync.busy = true;
  if (!silent) setSyncStatus("Buscando dados...");
  try {
    const syncId = await syncIdForCode(state.sync.code);
    const remote = await fetchRemoteSync(syncId);
    if (!remote) {
      if (!silent) setSyncStatus("Nenhum dado encontrado para este código.");
      return false;
    }
    const remoteStore = await decryptStoreFromSync(remote.payload, state.sync.code);
    const remoteTime = Date.parse(remoteStore.updatedAt ?? remote.updated_at ?? 0);
    const localTime = Date.parse(state.store.updatedAt ?? 0);
    if (onlyIfNewer && remoteTime <= localTime) {
      if (!silent) setSyncStatus("Este navegador já está atualizado.");
      return false;
    }
    replaceStoreFromSync(remoteStore);
    state.sync.lastSyncedAt = new Date().toISOString();
    saveSyncState();
    if (!silent) setSyncStatus("Dados recebidos.");
    render();
    return true;
  } catch (error) {
    console.warn(error);
    if (!silent) setSyncStatus(error.message || "Não foi possível receber. Confira o código e a conexão.");
    return false;
  } finally {
    state.sync.busy = false;
  }
}

async function syncNow() {
  if (!syncConfigured()) {
    showToast("Configure o Supabase antes de sincronizar.");
    return;
  }
  if (!state.sync.code) {
    showToast("Crie ou informe um código de sincronização.");
    return;
  }
  const pulled = await pullSync({ onlyIfNewer: true, silent: true });
  if (!pulled) await pushSync();
  showToast("Sincronização concluída.");
}

function scheduleAutoSync() {
  if (!syncConfigured() || !state.sync.code) return;
  clearTimeout(syncDebounceTimer);
  syncDebounceTimer = setTimeout(() => {
    pushSync();
  }, 1800);
}

function pullSyncInBackground() {
  if (!syncConfigured() || !state.sync.code || state.sync.busy) return;
  pullSync({ onlyIfNewer: true, silent: true });
}

function startAutoSync() {
  clearInterval(autoSyncTimer);
  if (!syncConfigured() || !state.sync.code) return;

  if (!autoSyncListenersAttached) {
    autoSyncListenersAttached = true;
    window.addEventListener("focus", pullSyncInBackground);
    window.addEventListener("online", pullSyncInBackground);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") pullSyncInBackground();
    });
  }

  autoSyncTimer = window.setInterval(pullSyncInBackground, AUTO_SYNC_INTERVAL_MS);
  window.setTimeout(pullSyncInBackground, 900);
}

function stopAutoSync() {
  clearInterval(autoSyncTimer);
  clearTimeout(syncDebounceTimer);
}

function getPlanForDate(dateISO = state.selectedDate) {
  const customId = state.store.datePlanOverrides?.[dateISO];
  const customPlan = state.store.customPlans?.find((plan) => plan.id === customId);
  if (customPlan) return customPlan;
  const day = parseISO(dateISO).getDay();
  return state.store.activePlan?.days?.find((plan) => Number(plan.weekday) === day) ?? null;
}

function getPlanForSession(dateISO, session) {
  if (session?.planSnapshot) return session.planSnapshot;
  if (session?.planId?.startsWith("custom-")) {
    const customPlan = state.store.customPlans?.find((plan) => plan.id === session.planId);
    if (customPlan) return customPlan;
  }
  const day = parseISO(dateISO).getDay();
  return findStoredPlan(state.store, session?.planId, day);
}

function makeBlankSession(dateISO) {
  const plan = getPlanForDate(dateISO);
  if (!plan) return null;
  const previousSpeed = latestPreviousCardioSpeed(dateISO);
  const loadRecommendations = {};
  const repRecommendations = {};
  const exerciseLogs = Object.fromEntries(
    plan.exercises.map((exercise) => {
      const loadRecommendation = buildLoadRecommendation(dateISO, exercise);
      const repRecommendation = buildRepRecommendation(dateISO, exercise);
      if (loadRecommendation) loadRecommendations[exercise.id] = loadRecommendation;
      if (repRecommendation) repRecommendations[exercise.id] = repRecommendation;
      return [
        exercise.id,
        Array.from({ length: exercise.sets }, (_, index) => ({
          load: loadRecommendation?.loads?.[index] ?? exercise.defaultLoad ?? "",
          reps: repRecommendation?.reps?.[index] ?? "",
          done: false,
        })),
      ];
    }),
  );

  return {
    dayId: parseISO(dateISO).getDay(),
    planId: plan.id,
    exerciseLogs,
    cardio: {
      duration: String(plan.cardio.duration ?? 12),
      distance: "",
      speed: String(plan.cardio.speed ?? previousSpeed ?? ""),
    },
    notes: "",
    mobilityDone: false,
    timer: { elapsed: 0, running: false, startedAt: null },
    planSnapshot: cloneValue(plan),
    loadRecommendations,
    repRecommendations,
    exerciseDetails: defaultExerciseDetails(plan),
    coachResponseText: "",
    coachExerciseDrafts: {},
    chatgptSummary: "",
    completedAt: null,
  };
}

function ensureLoadRecommendations(dateISO, session, plan) {
  if (!session || session.completedAt) return;
  session.loadRecommendations ??= {};
  session.repRecommendations ??= {};

  plan.exercises.forEach((exercise) => {
    const loadRecommendation = session.loadRecommendations[exercise.id] ?? buildLoadRecommendation(dateISO, exercise);
    const repRecommendation = session.repRecommendations[exercise.id] ?? buildRepRecommendation(dateISO, exercise);
    if (loadRecommendation) session.loadRecommendations[exercise.id] = loadRecommendation;
    if (repRecommendation) session.repRecommendations[exercise.id] = repRecommendation;

    const logs = session.exerciseLogs?.[exercise.id];
    if (!logs?.length) return;
    logs.forEach((set, index) => {
      const currentLoad = String(set.load ?? "").trim();
      const defaultLoad = String(exercise.defaultLoad ?? "").trim();
      const canReplaceLoad = loadRecommendation && !set.done && (!currentLoad || currentLoad === defaultLoad);
      const canReplaceReps = repRecommendation && !set.done && !set.reps;
      if (canReplaceLoad) set.load = loadRecommendation.loads?.[index] ?? loadRecommendation.loads?.[loadRecommendation.loads.length - 1] ?? currentLoad;
      if (canReplaceReps) set.reps = repRecommendation.reps?.[index] ?? repRecommendation.reps?.[repRecommendation.reps.length - 1] ?? "";
    });
  });
}

function getSession(dateISO = state.selectedDate, create = true) {
  const currentPlan = getPlanForDate(dateISO);
  const existing = state.store.sessions[dateISO];
  if (!currentPlan) return null;
  if (existing && !existing.completedAt && existing.planId !== currentPlan.id) {
    state.store.sessions[dateISO] = makeBlankSession(dateISO);
  }
  if (!state.store.sessions[dateISO] && create) {
    state.store.sessions[dateISO] = makeBlankSession(dateISO);
  }
  ensureLoadRecommendations(dateISO, state.store.sessions[dateISO], currentPlan);
  return state.store.sessions[dateISO];
}

function getCycleInfo(dateISO) {
  const start = parseISO(CYCLE_START);
  const date = parseISO(dateISO);
  const elapsedDays = Math.floor((date - start) / 86400000);
  const week = Math.max(1, Math.floor(elapsedDays / 7) + 1);
  const normalizedWeek = ((week - 1) % 12) + 1;
  return {
    week: normalizedWeek,
    block: normalizedWeek <= 6 ? 1 : 2,
    blockLabel: normalizedWeek <= 6 ? "Tensão e carga" : "Volume e controle",
  };
}

function formatDateHeading(dateISO) {
  const date = parseISO(dateISO);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
  }).format(date);
}

function formatShortDate(dateISO) {
  const date = parseISO(dateISO);
  return {
    day: String(date.getDate()).padStart(2, "0"),
    month: new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(date).replace(".", ""),
  };
}

function isToday(dateISO) {
  return dateISO === localISO(new Date());
}

function rangeLabel(exercise) {
  if (exercise.target && exercise.minReps == null) return exercise.target;
  if (exercise.minReps === exercise.maxReps) {
    return `${exercise.minReps} ${exercise.unit}${exercise.target ? ` · ${exercise.target}` : ""}`;
  }
  return `${exercise.minReps}-${exercise.maxReps} ${exercise.unit}${exercise.target ? ` · ${exercise.target}` : ""}`;
}

function totalSets(plan) {
  return plan.exercises.reduce((sum, exercise) => sum + exercise.sets, 0);
}

function completedSets(plan, session) {
  if (!session) return 0;
  return plan.exercises.reduce(
    (sum, exercise) => sum + (session.exerciseLogs?.[exercise.id] ?? []).filter((set) => set.done).length,
    0,
  );
}

function normalizeExerciseLookup(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function exerciseMatches(candidate, exercise) {
  return candidate?.id === exercise.id || normalizeExerciseLookup(candidate?.name) === normalizeExerciseLookup(exercise.name);
}

function completedExerciseSets(logs = []) {
  return logs.filter((set) => set.done);
}

function latestPreviousExerciseRecord(dateISO, exercise) {
  const targetName = normalizeExerciseLookup(exercise.name);
  const entries = Object.entries(state.store.sessions)
    .filter(([date]) => date < dateISO)
    .sort(([a], [b]) => b.localeCompare(a));

  for (const [date, session] of entries) {
    const plan = getPlanForSession(date, session);
    const previousExercise =
      plan?.exercises?.find((candidate) => exerciseMatches(candidate, exercise)) ??
      plan?.exercises?.find((candidate) => normalizeExerciseLookup(candidate.name).includes(targetName) || targetName.includes(normalizeExerciseLookup(candidate.name)));
    const logs = session.exerciseLogs?.[previousExercise?.id] ?? session.exerciseLogs?.[exercise.id];
    if (logs?.some((set) => set.done)) return { date, exercise: previousExercise ?? exercise, logs };
  }

  return null;
}

function latestPreviousCardioSpeed(dateISO) {
  return (
    Object.entries(state.store.sessions)
      .filter(([date, session]) => date < dateISO && Number(session.cardio?.speed) > 0)
      .sort(([a], [b]) => b.localeCompare(a))[0]?.[1]?.cardio?.speed ?? ""
  );
}

function formatSpeed(value) {
  const speed = Number(value);
  if (!speed) return "";
  return speed.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function parseLoadValue(value) {
  const normalized = String(value ?? "").trim().replace(",", ".");
  const match = normalized.match(/-?\d+(\.\d+)?/);
  if (!match) return null;
  const number = Number(match[0]);
  return Number.isFinite(number) ? number : null;
}

function formatLoadValue(value) {
  return value.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
}

function loadStepForExercise(exercise, load) {
  if (exercise.loadUnit === "lb") return 5;
  if (exercise.loadUnit === "kg") return load < 20 ? 1 : 2.5;
  return 0;
}

function loadSummary(loads, exercise) {
  const unique = [...new Set(loads.filter(Boolean))];
  if (!unique.length) return "";
  const shown = unique.slice(0, 4).join(" / ");
  const suffix = unique.length > 4 ? "..." : "";
  return `${shown}${suffix}${exercise.loadUnit === "livre" ? "" : ` ${exercise.loadUnit}`}`.trim();
}

function repStepForExercise(exercise) {
  return exercise.unit === "s" ? 5 : 1;
}

function formatRepValue(value) {
  return String(Math.max(0, Math.round(Number(value) || 0)));
}

function repSummary(reps, exercise) {
  const unique = [...new Set(reps.filter(Boolean))];
  if (!unique.length) return "";
  const shown = unique.slice(0, 4).join(" / ");
  const suffix = unique.length > 4 ? "..." : "";
  return `${shown}${suffix} ${exercise.unit === "s" ? "s" : "reps"}`;
}

function compactRecommendationValues(values, { unique = false, limit = 6 } = {}) {
  const list = values.map((value) => String(value ?? "").trim()).filter(Boolean);
  const normalized = unique ? [...new Set(list)] : list;
  if (!normalized.length) return "";
  const shown = normalized.slice(0, limit).join("/");
  return `${shown}${normalized.length > limit ? "..." : ""}`;
}

function withLoadUnit(value, exercise) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  const unit = exercise.loadUnit === "livre" ? "" : exercise.loadUnit;
  if (!unit || new RegExp(`\\b${unit}\\b`, "i").test(text)) return text;
  return `${text} ${unit}`;
}

function compactLoadRecommendationText(recommendation, exercise) {
  const recommended = compactRecommendationValues(recommendation?.loads ?? [], { unique: true, limit: 4 });
  if (recommended) return withLoadUnit(recommended, exercise);
  return withLoadUnit(exercise.defaultLoad, exercise);
}

function compactRepRangeText(exercise) {
  if (exercise.minReps == null && exercise.maxReps == null) return exercise.target ?? "";
  const label = exercise.unit === "s" ? "tempo" : "reps";
  const suffix = exercise.unit === "s" ? "s" : "";
  if (exercise.minReps === exercise.maxReps) return `${label} ${exercise.minReps}${suffix}`;
  return `${label} ${exercise.minReps}-${exercise.maxReps}${suffix}`;
}

function compactRepRecommendationText(recommendation, exercise) {
  const recommended = compactRecommendationValues(recommendation?.reps ?? [], { limit: 6 });
  if (recommended) return `${exercise.unit === "s" ? "tempo" : "reps"} ${recommended}${exercise.unit === "s" ? "s" : ""}`;
  return compactRepRangeText(exercise);
}

function compactExerciseRecommendationSummary(exercise, session) {
  const loadText = compactLoadRecommendationText(session.loadRecommendations?.[exercise.id], exercise);
  const repText = compactRepRecommendationText(session.repRecommendations?.[exercise.id], exercise);
  const parts = [loadText, repText].filter(Boolean);
  return parts.length ? `Recomendado: ${parts.join(" · ")}` : "Recomendado: seguir plano";
}

function shortDateLabel(dateISO) {
  const date = parseISO(dateISO);
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(date).replace(".", "");
}

function previousSummary(dateISO, exercise) {
  const record = latestPreviousExerciseRecord(dateISO, exercise);
  if (!record) return "Primeiro registro";
  const completed = completedExerciseSets(record.logs);
  const loads = [...new Set(completed.map((set) => set.load).filter(Boolean))];
  const reps = completed.map((set) => set.reps).filter(Boolean);
  const loadText = loads.length ? `${loads.join(" / ")} ${exercise.loadUnit === "livre" ? "" : exercise.loadUnit}`.trim() : "carga não informada";
  return reps.length ? `Último: ${loadText} · reps ${reps.join("/")}` : `Último: ${loadText}`;
}

function shouldProgress(exercise, logs) {
  if (!exercise.maxReps || !logs?.length) return false;
  return logs.every((set) => set.done && Number(set.reps) >= exercise.maxReps);
}

function shouldProgressFromPrevious(exercise, logs) {
  const completed = completedExerciseSets(logs);
  if (!exercise.maxReps || !completed.length) return false;
  const expectedSets = Number(exercise.sets) || logs.length;
  return completed.length >= expectedSets && completed.every((set) => Number(set.reps) >= exercise.maxReps);
}

function buildLoadRecommendation(dateISO, exercise) {
  const record = latestPreviousExerciseRecord(dateISO, exercise);
  if (!record) return null;

  const completed = completedExerciseSets(record.logs);
  if (!completed.length) return null;

  const shouldIncrease = exercise.loadUnit !== "livre" && shouldProgressFromPrevious(exercise, record.logs);
  const fallbackSet = completed[completed.length - 1];
  const loads = Array.from({ length: Number(exercise.sets) || completed.length }, (_, index) => {
    const source = record.logs[index]?.done ? record.logs[index] : completed[index] ?? fallbackSet;
    const rawLoad = String(source?.load ?? "").trim();
    if (!rawLoad) return exercise.defaultLoad ?? "";
    const numericLoad = parseLoadValue(rawLoad);
    if (numericLoad == null || !shouldIncrease) return rawLoad;
    return formatLoadValue(numericLoad + loadStepForExercise(exercise, numericLoad));
  });

  const summary = loadSummary(loads, exercise);
  if (!summary) return null;

  return {
    loads,
    sourceDate: record.date,
    progressed: shouldIncrease,
    message: shouldIncrease
      ? `Progressão sugerida: ${summary}. Base: último treino em ${shortDateLabel(record.date)}.`
      : `Carga recomendada: ${summary}. Base: último treino em ${shortDateLabel(record.date)}.`,
  };
}

function buildRepRecommendation(dateISO, exercise) {
  const record = latestPreviousExerciseRecord(dateISO, exercise);
  if (!record) return null;

  const completed = completedExerciseSets(record.logs);
  if (!completed.length) return null;

  const shouldResetRange = shouldProgressFromPrevious(exercise, record.logs) && Number(exercise.minReps) > 0 && Number(exercise.maxReps) > Number(exercise.minReps);
  const fallbackSet = completed[completed.length - 1];
  let increased = false;
  const reps = Array.from({ length: Number(exercise.sets) || completed.length }, (_, index) => {
    const source = record.logs[index]?.done ? record.logs[index] : completed[index] ?? fallbackSet;
    const previousReps = Number(source?.reps);
    if (!Number.isFinite(previousReps) || previousReps <= 0) return "";
    if (shouldResetRange) return formatRepValue(exercise.minReps);
    if (!exercise.maxReps) return formatRepValue(previousReps);

    const nextReps = Math.min(Number(exercise.maxReps), previousReps + repStepForExercise(exercise));
    if (nextReps > previousReps) increased = true;
    return formatRepValue(nextReps);
  });

  const summary = repSummary(reps, exercise);
  if (!summary) return null;

  const unitLabel = exercise.unit === "s" ? "tempo" : "reps";
  return {
    reps,
    sourceDate: record.date,
    progressed: increased || shouldResetRange,
    message: shouldResetRange
      ? `${unitLabel === "tempo" ? "Tempo" : "Reps"} sugeridas: ${summary}. Como você bateu o topo, mire no começo da faixa com a carga nova.`
      : increased
        ? `Progressão de ${unitLabel}: ${summary}. Base: último treino em ${shortDateLabel(record.date)}.`
        : `${unitLabel === "tempo" ? "Tempo" : "Reps"} recomendadas: ${summary}. Base: último treino em ${shortDateLabel(record.date)}.`,
  };
}

function coachRecommendationMatches(recommendation, exercise) {
  return recommendation.exerciseId === exercise.id || normalizeExerciseLookup(recommendation.exerciseName) === normalizeExerciseLookup(exercise.name);
}

function activeCoachRecommendationForExercise(dateISO, exercise) {
  return [...(state.store.coachRecommendations ?? [])]
    .filter((recommendation) => recommendation.status === "pending")
    .filter((recommendation) => recommendation.appliesToNextSession)
    .filter((recommendation) => recommendation.sourceDate !== dateISO)
    .filter((recommendation) => !recommendation.sourceDate || recommendation.sourceDate < dateISO)
    .filter((recommendation) => coachRecommendationMatches(recommendation, exercise))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0] ?? null;
}

function nextDateWithExercise(fromDateISO, exercise) {
  for (let offset = 1; offset <= 35; offset += 1) {
    const dateISO = localISO(addDays(parseISO(fromDateISO), offset));
    const plan = getPlanForDate(dateISO);
    if (plan?.exercises?.some((candidate) => exerciseMatches(candidate, exercise))) return dateISO;
  }
  return "";
}

function formatSetList(sets, field) {
  const values = sets.map((set) => String(set[field] ?? "").trim() || "—");
  return values.length ? values.join(" / ") : "—";
}

function formatDoneCount(sets) {
  return `${sets.filter((set) => set.done).length}/${sets.length}`;
}

function exerciseDetailFor(session, exercise) {
  session.exerciseDetails ??= {};
  session.exerciseDetails[exercise.id] ??= { performedName: "", substitutionReason: "", notes: "" };
  return session.exerciseDetails[exercise.id];
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function coachSearchText(value) {
  return normalizeExerciseLookup(value)
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripCoachListPrefix(line) {
  return String(line ?? "")
    .replace(/^\s*(?:[-*•]+|\d{1,2}[\).:-])\s*/, "")
    .replace(/^\s*(?:exercício|exercicio|recomendação|recomendacao)\s*\d*\s*[:.-]\s*/i, "")
    .trim();
}

function coachExerciseMatchScore(line, exercise) {
  const lineText = coachSearchText(stripCoachListPrefix(line));
  const target = coachSearchText(exercise.name);
  if (!lineText || !target) return 0;
  if (lineText === target) return 100;
  if (lineText.startsWith(`${target} `)) return 95;
  if (lineText.includes(target)) return 85;

  const tokens = target.split(" ").filter((token) => token.length > 2);
  if (tokens.length < 2 || lineText.length > 140) return 0;
  const hits = tokens.filter((token) => lineText.includes(token)).length;
  if (hits === tokens.length) return 70;
  if (tokens.length >= 3 && hits >= Math.ceil(tokens.length * 0.75)) return 55;
  return 0;
}

function exerciseFromCoachLine(line, plan) {
  if (!String(line ?? "").trim()) return null;
  const matches = (plan.exercises ?? [])
    .map((exercise) => ({ exercise, score: coachExerciseMatchScore(line, exercise) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || b.exercise.name.length - a.exercise.name.length);
  if (!matches.length) return null;
  if (matches[1] && matches[0].score === matches[1].score) return null;
  return matches[0].exercise;
}

function isCoachGeneralHeading(line) {
  const text = coachSearchText(stripCoachListPrefix(line));
  if (!text || text.length > 80) return false;
  return [
    "analise geral",
    "resumo geral",
    "recomendacoes gerais",
    "recomendacoes por exercicio",
    "observacoes gerais",
    "consideracoes finais",
    "cardio",
    "corrida",
    "cuidados",
    "proximo treino",
  ].some((heading) => text === heading || text.startsWith(`${heading} `));
}

function cleanCoachRecommendationText(block, exercise) {
  const lines = String(block ?? "").trim().split("\n");
  if (!lines.length) return "";
  const firstLine = lines[0] ?? "";
  const exactName = new RegExp(`^\\s*(?:[-*•]+\\s*)?(?:\\d{1,2}[\\).:-]\\s*)?(?:exercício\\s*)?${escapeRegExp(exercise.name)}\\s*[:–—-]?\\s*`, "i");
  lines[0] = firstLine.replace(exactName, "").trim();
  return lines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitNumberedCoachBlocks(text) {
  const blocks = [];
  let current = null;
  String(text ?? "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .forEach((line) => {
      const numbered = line.match(/^\s*(\d{1,2})[\).:-]\s+/);
      if (numbered) {
        if (current) blocks.push(current);
        current = { number: Number(numbered[1]), lines: [line] };
        return;
      }
      if (current) current.lines.push(line);
    });
  if (current) blocks.push(current);
  return blocks.filter((block, index) => block.number === index + 1).map((block) => block.lines.join("\n").trim()).filter(Boolean);
}

function parseCoachRecommendationsFromText(text, plan) {
  const source = String(text ?? "").trim();
  const parsed = { generalText: "", items: [] };
  if (!source || !plan?.exercises?.length) return parsed;

  const generalLines = [];
  const sections = [];
  let current = null;

  source
    .replace(/\r\n/g, "\n")
    .split("\n")
    .forEach((line) => {
      const exercise = exerciseFromCoachLine(line, plan);
      if (exercise) {
        current = { exercise, lines: [line] };
        sections.push(current);
        return;
      }
      if (isCoachGeneralHeading(line)) {
        current = null;
        generalLines.push(line);
        return;
      }
      if (current) current.lines.push(line);
      else generalLines.push(line);
    });

  const byExercise = new Map();
  sections.forEach((section) => {
    const textForExercise = cleanCoachRecommendationText(section.lines.join("\n"), section.exercise);
    if (!textForExercise) return;
    const existing = byExercise.get(section.exercise.id);
    if (existing) {
      existing.recommendationText = `${existing.recommendationText}\n\n${textForExercise}`;
    } else {
      byExercise.set(section.exercise.id, {
        exercise: section.exercise,
        recommendationText: textForExercise,
      });
    }
  });

  if (!byExercise.size) {
    splitNumberedCoachBlocks(source)
      .slice(0, plan.exercises.length)
      .forEach((block, index) => {
        const exercise = plan.exercises[index];
        const textForExercise = cleanCoachRecommendationText(block, exercise) || block;
        if (!textForExercise.trim()) return;
        byExercise.set(exercise.id, { exercise, recommendationText: textForExercise.trim() });
      });
  }

  parsed.generalText = generalLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  parsed.items = [...byExercise.values()];
  return parsed;
}

function buildChatGPTSummary(dateISO, session) {
  const plan = getPlanForSession(dateISO, session);
  const cycle = getCycleInfo(dateISO);
  const date = parseISO(dateISO);
  const weekday = DAY_NAMES[date.getDay()];
  const substitutions = [];
  const exerciseBlocks = plan.exercises.map((exercise, index) => {
    const logs = session.exerciseLogs?.[exercise.id] ?? [];
    const detail = exerciseDetailFor(session, exercise);
    const performedName = String(detail.performedName || exercise.name).trim();
    if (performedName && performedName !== exercise.name) {
      substitutions.push({
        planned: exercise.name,
        performed: performedName,
        reason: detail.substitutionReason || detail.notes || "não informado",
      });
    }
    return [
      `${index + 1}. Nome do exercício: ${exercise.name}`,
      `   Planejado: ${exercise.sets} séries · ${rangeLabel(exercise)} · ${exercise.rir}`,
      `   Executado: ${performedName || exercise.name}`,
      `   Séries: ${logs.length}`,
      `   Carga por série: ${formatSetList(logs, "load")}`,
      `   Repetições por série: ${formatSetList(logs, "reps")}`,
      `   RIR alvo: ${exercise.rir}`,
      `   Séries concluídas: ${formatDoneCount(logs)}`,
      detail.notes ? `   Observação do exercício: ${detail.notes}` : "",
    ].filter(Boolean).join("\n");
  });

  const cardioMinimum = Number(plan.cardio?.minimum ?? CARDIO_MINIMUM);
  const cardioGoal = Number(plan.cardio?.goal ?? CARDIO_LONG_TERM);
  const substitutionText = substitutions.length
    ? substitutions.map((item) => [`Exercício planejado: ${item.planned}`, `Exercício executado: ${item.performed}`, `Motivo: ${item.reason}`].join("\n")).join("\n\n")
    : "Sem substituições registradas.";
  const notes = session.notes?.trim() || "Sem observações registradas.";

  return [
    "TREINO EXECUTADO",
    "",
    `Data: ${new Intl.DateTimeFormat("pt-BR").format(date)}`,
    `Semana: ${cycle.week}`,
    `Dia da semana: ${weekday}`,
    `Grupo muscular: ${plan.title}`,
    `Bloco da periodização: ${cycle.block} — ${cycle.blockLabel}`,
    "",
    "EXERCÍCIOS",
    "",
    exerciseBlocks.join("\n\n"),
    "",
    "CARDIO",
    `Duração: ${session.cardio?.duration || plan.cardio?.duration || 12} min`,
    `Distância: ${session.cardio?.distance || "não registrada"} m`,
    `Velocidade média, se houver: ${session.cardio?.speed ? `${formatSpeed(session.cardio.speed)} km/h` : "não registrada"}`,
    `Meta mínima: ${cardioMinimum.toLocaleString("pt-BR")} m`,
    `Objetivo de longo prazo: ${cardioGoal.toLocaleString("pt-BR")} m`,
    "",
    "SUBSTITUIÇÕES",
    substitutionText,
    "",
    "OBSERVAÇÕES",
    `Como foi o treino: ${notes}`,
    "Dificuldades: ",
    "Dores ou desconfortos: ",
    `Exercícios não realizados: ${plan.exercises.filter((exercise) => !(session.exerciseLogs?.[exercise.id] ?? []).some((set) => set.done)).map((exercise) => exercise.name).join(", ") || "nenhum"}`,
    "",
    "PEDIDO PARA O PRÓXIMO TREINO",
    "Gere recomendações práticas de carga e repetições para o próximo treino.",
    "Use exatamente este formato para eu colar a resposta no app Workout:",
    "",
    "ANÁLISE GERAL",
    "Resumo curto do que evoluiu, do que manter e dos cuidados.",
    "",
    "RECOMENDAÇÕES POR EXERCÍCIO",
    "Nome exato do exercício: carga recomendada, meta de repetições e observação objetiva.",
    "Use um item separado para cada exercício e repita o nome exatamente como aparece acima.",
  ].join("\n");
}

function makeCoachRecommendationFromDraft(dateISO, session, exercise, text) {
  return normalizeCoachRecommendation({
    id: `coach-${dateISO}-${exercise.id}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    workoutSessionId: dateISO,
    sourceDate: dateISO,
    workoutTitle: getPlanForSession(dateISO, session).title,
    recommendationText: text.trim(),
    createdAt: new Date().toISOString(),
    status: "pending",
  });
}

function saveCoachRecommendationsFromSession(dateISO = state.selectedDate) {
  const session = getSession(dateISO);
  const plan = getPlanForSession(dateISO, session);
  let saved = 0;

  state.store.coachRecommendations = (state.store.coachRecommendations ?? []).filter(
    (recommendation) => !(recommendation.sourceDate === dateISO && recommendation.id.startsWith(`coach-${dateISO}-`)),
  );

  const generalText = String(session.coachResponseText ?? "").trim();
  const parsed = parseCoachRecommendationsFromText(generalText, plan);
  if (generalText) {
    state.store.coachRecommendations.push(
      normalizeCoachRecommendation({
        id: `coach-${dateISO}-geral-${Date.now()}`,
        exerciseId: "",
        exerciseName: "Geral do treino",
        workoutSessionId: dateISO,
        sourceDate: dateISO,
        workoutTitle: plan.title,
        recommendationText: parsed.generalText || "Resposta completa do ChatGPT salva neste treino.",
        createdAt: new Date().toISOString(),
        appliesToNextSession: false,
        status: "applied",
        result: "análise geral salva",
      }),
    );
  }

  parsed.items.forEach(({ exercise, recommendationText }) => {
    const text = String(recommendationText ?? "").trim();
    if (!text) return;
    state.store.coachRecommendations.push(makeCoachRecommendationFromDraft(dateISO, session, exercise, text));
    saved += 1;
  });

  return saved;
}

function classifyRecommendationResult(exercise, currentLogs, previousLogs = []) {
  const completed = completedExerciseSets(currentLogs);
  const previousCompleted = completedExerciseSets(previousLogs);
  const currentReps = completed.reduce((sum, set) => sum + (Number(set.reps) || 0), 0);
  const previousReps = previousCompleted.reduce((sum, set) => sum + (Number(set.reps) || 0), 0);
  const currentBestLoad = Math.max(0, ...completed.map((set) => parseLoadValue(set.load) ?? 0));
  const previousBestLoad = Math.max(0, ...previousCompleted.map((set) => parseLoadValue(set.load) ?? 0));
  const topReached = exercise.maxReps ? completed.length >= Number(exercise.sets) && completed.every((set) => Number(set.reps) >= exercise.maxReps) : false;
  const belowMinimum = exercise.minReps ? completed.some((set) => set.done && Number(set.reps) < exercise.minReps) : false;

  if (!completed.length) return { result: "não avaliada", fulfilled: false };
  if (currentBestLoad > previousBestLoad || currentReps > previousReps || topReached) return { result: "progressão", fulfilled: true };
  if (belowMinimum || (previousReps && currentReps < previousReps)) return { result: "regressão", fulfilled: false };
  return { result: "manutenção", fulfilled: true };
}

function applyCoachRecommendationsForSession(dateISO, session) {
  const plan = getPlanForSession(dateISO, session);
  plan.exercises.forEach((exercise) => {
    const recommendation = activeCoachRecommendationForExercise(dateISO, exercise);
    if (!recommendation) return;
    const previous = latestPreviousExerciseRecord(dateISO, exercise);
    const evaluation = classifyRecommendationResult(exercise, session.exerciseLogs?.[exercise.id] ?? [], previous?.logs ?? []);
    recommendation.status = "applied";
    recommendation.appliedAt = new Date().toISOString();
    recommendation.appliedSessionId = dateISO;
    recommendation.result = evaluation.result;
    recommendation.fulfilled = evaluation.fulfilled;
  });
}

function escapeAttribute(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function checkIcon() {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>`;
}

function formatTimer(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return hours ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}` : `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function generalElapsed(session) {
  const timer = session?.timer ?? { elapsed: 0, running: false, startedAt: null };
  return Number(timer.elapsed || 0) + (timer.running && timer.startedAt ? Math.floor((Date.now() - timer.startedAt) / 1000) : 0);
}

function getRestTimer(exercise) {
  state.exerciseTimers[state.selectedDate] ??= {};
  state.exerciseTimers[state.selectedDate][exercise.id] ??= {
    duration: Number(exercise.restSeconds) || 90,
    remaining: Number(exercise.restSeconds) || 90,
    running: false,
    endsAt: null,
  };
  return state.exerciseTimers[state.selectedDate][exercise.id];
}

function restRemaining(timer) {
  if (!timer.running || !timer.endsAt) return timer.remaining;
  return Math.max(0, Math.ceil((timer.endsAt - Date.now()) / 1000));
}

function updateTimerDisplays() {
  const session = getSession(state.selectedDate, false);
  const generalDisplay = document.querySelector("[data-general-timer]");
  if (generalDisplay && session) generalDisplay.textContent = formatTimer(generalElapsed(session));
  Object.entries(state.exerciseTimers[state.selectedDate] ?? {}).forEach(([exerciseId, timer]) => {
    const remaining = restRemaining(timer);
    if (timer.running && remaining <= 0) {
      timer.running = false;
      timer.remaining = 0;
      timer.endsAt = null;
    }
    const display = document.querySelector(`[data-rest-display="${CSS.escape(exerciseId)}"]`);
    if (display) display.textContent = formatTimer(remaining);
  });
}

function ensureTimerTicker() {
  if (timerTicker) return;
  timerTicker = window.setInterval(updateTimerDisplays, 250);
}

function renderExercise(exercise, index, session) {
  const logs = session.exerciseLogs[exercise.id];
  const isComplete = logs.every((set) => set.done);
  const suggestion = shouldProgress(exercise, logs);
  const detail = exerciseDetailFor(session, exercise);
  const restTimer = getRestTimer(exercise);
  const recommendationSummary = compactExerciseRecommendationSummary(exercise, session);

  return `
    <article class="exercise-card ${isComplete ? "is-complete" : ""}" data-exercise-card="${exercise.id}">
      <div class="exercise-header">
        <span class="exercise-number">${isComplete ? checkIcon() : String(index + 1).padStart(2, "0")}</span>
        <div class="exercise-title">
          <h3>${exercise.name}</h3>
          <div class="exercise-meta">
            <span>${exercise.sets} séries · ${rangeLabel(exercise)}</span>
            <span>${exercise.rir}</span>
          </div>
          <div class="exercise-recommendation-label">${escapeAttribute(recommendationSummary)}</div>
          ${exercise.notes ? `<div class="exercise-plan-note">${escapeAttribute(exercise.notes)}</div>` : ""}
        </div>
      </div>
      <div class="rest-timer-card">
        <div><span>Intervalo deste exercício</span><strong data-rest-display="${exercise.id}">${formatTimer(restRemaining(restTimer))}</strong></div>
        <div class="timer-actions">
          <button type="button" data-action="${restTimer.running ? "pause-rest-timer" : "start-rest-timer"}" data-exercise="${exercise.id}">${restTimer.running ? "Pausar" : restTimer.remaining < restTimer.duration ? "Continuar" : "Iniciar"}</button>
          <button type="button" data-action="reset-rest-timer" data-exercise="${exercise.id}">Reiniciar</button>
        </div>
      </div>
      <details class="exercise-detail-panel">
        <summary>Substituição / nota deste exercício</summary>
        <div class="coach-fields">
          <label><span>Executado como</span><input value="${escapeAttribute(detail.performedName)}" placeholder="${escapeAttribute(exercise.name)}" data-action="exercise-detail" data-exercise="${exercise.id}" data-field="performedName" /></label>
          <label><span>Motivo da substituição</span><input value="${escapeAttribute(detail.substitutionReason)}" placeholder="Ex.: equipamento ocupado" data-action="exercise-detail" data-exercise="${exercise.id}" data-field="substitutionReason" /></label>
          <label class="is-wide"><span>Observação do exercício</span><textarea data-action="exercise-detail" data-exercise="${exercise.id}" data-field="notes" placeholder="Técnica, dor, ajuste de máquina...">${escapeAttribute(detail.notes)}</textarea></label>
        </div>
      </details>
      <div class="series-grid is-header" aria-hidden="true">
        <span>Série</span>
        <span>Carga${exercise.loadUnit === "livre" ? "" : ` (${exercise.loadUnit})`}</span>
        <span>${exercise.unit === "s" ? "Tempo" : "Reps"}</span>
        <span>Feita</span>
      </div>
      ${logs
        .map(
          (set, setIndex) => `
            <div class="series-grid">
              <span class="series-label">${setIndex + 1}</span>
              <label>
                <span class="sr-only">Carga da série ${setIndex + 1}</span>
                <input
                  class="set-input"
                  type="text"
                  inputmode="decimal"
                  autocomplete="off"
                  value="${escapeAttribute(set.load)}"
                  placeholder="—"
                  data-action="set-input"
                  data-exercise="${exercise.id}"
                  data-set="${setIndex}"
                  data-field="load"
                />
              </label>
              <label>
                <span class="sr-only">${exercise.unit === "s" ? "Tempo" : "Repetições"} da série ${setIndex + 1}</span>
                <input
                  class="set-input"
                  type="number"
                  inputmode="numeric"
                  min="0"
                  value="${escapeAttribute(set.reps)}"
                  placeholder="${exercise.maxReps ?? "—"}"
                  data-action="set-input"
                  data-exercise="${exercise.id}"
                  data-set="${setIndex}"
                  data-field="reps"
                />
              </label>
              <label class="set-check">
                <span class="sr-only">Concluir série ${setIndex + 1}</span>
                <input
                  type="checkbox"
                  ${set.done ? "checked" : ""}
                  data-action="set-check"
                  data-exercise="${exercise.id}"
                  data-set="${setIndex}"
                />
                <span>${checkIcon()}</span>
              </label>
            </div>
          `,
        )
        .join("")}
      ${
        suggestion
          ? `<div class="exercise-suggestion"><span>↗</span><span>Você atingiu o topo da faixa em todas as séries. Na próxima sessão, experimente o menor aumento de carga disponível.</span></div>`
          : ""
      }
    </article>
  `;
}

function renderCoachSessionPanel(plan, session) {
  const summary = session.chatgptSummary ?? "";
  const parsed = parseCoachRecommendationsFromText(session.coachResponseText, plan);
  const detectedExercises = parsed.items.map((item) => item.exercise.name);
  const detectionText = session.coachResponseText?.trim()
    ? detectedExercises.length
      ? `${detectedExercises.length} recomendação(ões) detectada(s): ${detectedExercises.join(", ")}.`
      : "Ainda não encontrei nomes de exercícios no texto. Peça ao ChatGPT para usar os nomes exatamente como aparecem no resumo."
    : "Depois de colar a resposta, o app mostrará aqui quais exercícios foram identificados.";
  return `
    <section class="section coach-session-section">
      <div class="section-heading">
        <div><p class="eyebrow">Coach / ChatGPT</p><h2>Acompanhamento inteligente</h2></div>
      </div>
      <div class="coach-card">
        <div>
          <h3>Resumo para enviar ao ChatGPT</h3>
          <p>Gere um texto padronizado com cargas, repetições, cardio, substituições e observações do treino.</p>
        </div>
        <div class="data-actions">
          <button class="secondary-button" type="button" data-action="generate-chatgpt-summary">Gerar resumo</button>
          <button class="secondary-button" type="button" data-action="copy-chatgpt-summary">Copiar resumo</button>
        </div>
        <textarea class="coach-output" readonly placeholder="O resumo aparecerá aqui depois de gerar.">${escapeAttribute(summary)}</textarea>
      </div>
      <div class="coach-card">
        <div>
          <h3>Colar resposta do ChatGPT</h3>
          <p>Cole a resposta completa em um único campo. O Workout separa automaticamente as recomendações por exercício.</p>
        </div>
        <textarea class="coach-output" data-action="coach-response" placeholder="Cole aqui a resposta completa do ChatGPT. Ex.: Supino reto com barra: manter 40 kg e buscar 8/8/8/8...">${escapeAttribute(session.coachResponseText)}</textarea>
        <div class="coach-detection ${detectedExercises.length ? "has-items" : ""}" data-coach-detection>
          <span>${escapeAttribute(detectionText)}</span>
        </div>
        <button class="primary-button" type="button" data-action="save-coach-recommendations">Salvar recomendações do Coach</button>
      </div>
    </section>
  `;
}

function renderToday() {
  const plan = getPlanForDate();
  if (!plan) {
    app.innerHTML = `
      <section class="date-switcher" aria-label="Selecionar dia">
        <button class="date-button" type="button" data-action="previous-day" aria-label="Dia anterior">←</button>
        <div class="date-label"><strong>${isToday(state.selectedDate) ? "Hoje" : DAY_NAMES[parseISO(state.selectedDate).getDay()]}</strong><span>${formatDateHeading(state.selectedDate)}</span></div>
        <button class="date-button" type="button" data-action="next-day" aria-label="Próximo dia">→</button>
      </section>
      <section class="empty-day-card"><span>☾</span><p class="eyebrow">Recuperação</p><h1>Dia de descanso</h1><p>Não há treino programado para este dia na ficha atual.</p><button class="secondary-button" type="button" data-action="go-plans">Ver ficha de treinos</button></section>`;
    return;
  }
  const session = getSession();
  const cycle = getCycleInfo(state.selectedDate);
  const doneSets = completedSets(plan, session);
  const allSets = totalSets(plan);
  const completion = Math.round((doneSets / allSets) * 100);
  const dateContext = isToday(state.selectedDate) ? "Hoje" : plan.name;
  const distance = Number(session.cardio.distance) || 0;
  const cardioMinimum = Number(plan.cardio.minimum ?? CARDIO_MINIMUM);
  const cardioGoal = Number(plan.cardio.goal ?? CARDIO_LONG_TERM);
  const cardioDuration = Number(plan.cardio.duration ?? 12);
  const cardioProgress = cardioMinimum > 0 ? Math.min(100, Math.round((distance / cardioMinimum) * 100)) : 0;
  const previousSpeed = latestPreviousCardioSpeed(state.selectedDate);

  app.innerHTML = `
    <section class="date-switcher" aria-label="Selecionar dia">
      <button class="date-button" type="button" data-action="previous-day" aria-label="Dia anterior">←</button>
      <div class="date-label">
        <strong>${dateContext}</strong>
        <span>${formatDateHeading(state.selectedDate)}</span>
      </div>
      <button class="date-button" type="button" data-action="next-day" aria-label="Próximo dia">→</button>
    </section>

    <section class="hero-card">
      <p class="eyebrow">Semana ${cycle.week} · Bloco ${cycle.block}</p>
      <h1>${plan.title}</h1>
      <p>${plan.exercises.length} exercícios programados. ${cycle.blockLabel}, com execução técnica e registro série por série.</p>
      <div class="hero-stats">
        <span class="stat-pill"><span class="stat-pill-dot"></span>${allSets} séries</span>
        <span class="stat-pill">${cardioDuration} min de cardio</span>
        <span class="stat-pill">${doneSets}/${allSets} concluídas</span>
      </div>
    </section>

    <section class="workout-timer-card">
      <div><p class="eyebrow">Tempo total</p><strong data-general-timer>${formatTimer(generalElapsed(session))}</strong><span>cronômetro geral do treino</span></div>
      <div class="timer-actions is-general">
        <button type="button" data-action="${session.timer.running ? "pause-general-timer" : "start-general-timer"}">${session.timer.running ? "Pausar" : generalElapsed(session) ? "Continuar" : "Iniciar treino"}</button>
        <button type="button" data-action="reset-general-timer">Reiniciar</button>
      </div>
    </section>

    <div class="progress-strip">
      <div class="progress-strip-header"><span>Progresso do treino</span><strong>${completion}%</strong></div>
      <div class="progress-track"><div class="progress-fill" style="width: ${completion}%"></div></div>
    </div>

    <label class="mobility-card">
      <input type="checkbox" data-action="mobility-check" ${session.mobilityDone ? "checked" : ""} />
      <span class="mobility-check">${checkIcon()}</span>
      <span><strong>Fiz alongamento/mobilidade antes do treino</strong><small>Este registro será salvo no histórico da sessão.</small></span>
    </label>

    <section class="section">
      <div class="section-heading">
        <div><p class="eyebrow">Antes de começar</p><h2>Aquecimento</h2></div>
      </div>
      <details class="warmup-card">
        <summary><span class="warmup-icon">↗</span><span>${plan.warmupTitle}</span></summary>
        <div class="warmup-body"><p>${plan.warmup}</p></div>
      </details>
    </section>

    <section class="section">
      <div class="section-heading">
        <div><p class="eyebrow">Sessão principal</p><h2>Exercícios</h2></div>
        <p>${doneSets} de ${allSets} séries</p>
      </div>
      <div class="exercise-list">
        ${plan.exercises.map((exercise, index) => renderExercise(exercise, index, session)).join("")}
      </div>
    </section>

    <section class="section">
      <div class="section-heading">
        <div><p class="eyebrow">Fechamento</p><h2>Corrida</h2></div>
      </div>
      <div class="cardio-card">
        <div class="cardio-top">
          <span class="cardio-icon">⌁</span>
          <div><h3>Teste de 12 minutos</h3><p>${plan.cardio.note}</p></div>
          <span class="intensity-badge">${plan.cardio.intensity}</span>
        </div>
        <div class="field-grid">
          <div class="field">
            <label for="cardio-duration">Duração</label>
            <div class="field-control"><input id="cardio-duration" type="number" inputmode="decimal" value="${escapeAttribute(session.cardio.duration)}" data-action="cardio" data-field="duration"/><span class="field-suffix">min</span></div>
          </div>
          <div class="field">
            <label for="cardio-distance">Distância</label>
            <div class="field-control"><input id="cardio-distance" type="number" inputmode="numeric" value="${escapeAttribute(session.cardio.distance)}" placeholder="1400" data-action="cardio" data-field="distance"/><span class="field-suffix">m</span></div>
          </div>
          <div class="field cardio-speed-field">
            <label for="cardio-speed">Velocidade da esteira</label>
            <div class="field-control"><input id="cardio-speed" type="number" inputmode="decimal" min="0" step="0.1" value="${escapeAttribute(session.cardio.speed)}" placeholder="7,0" data-action="cardio" data-field="speed"/><span class="field-suffix">km/h</span></div>
            <p class="field-memory">${previousSpeed ? `Última velocidade registrada: <strong>${formatSpeed(previousSpeed)} km/h</strong>` : "Registre a velocidade usada para ela aparecer no próximo treino."}</p>
          </div>
        </div>
        <div class="progress-strip" style="margin-top: 15px; padding: 0; border: 0; background: transparent">
          <div class="progress-strip-header"><span>Meta mínima: ${cardioMinimum.toLocaleString("pt-BR")} m</span><strong>${cardioProgress}%</strong></div>
          <div class="progress-track"><div class="progress-fill" style="width: ${cardioProgress}%"></div></div>
        </div>
        <div class="cardio-goal"><span>Objetivo de longo prazo</span><strong>${cardioGoal.toLocaleString("pt-BR")} m</strong></div>
      </div>
    </section>

    <section class="section">
      <div class="notes-card">
        <label for="session-notes">Observações e substituições</label>
        <textarea id="session-notes" placeholder="Como foi o treino? Trocou algum exercício?" data-action="notes">${escapeAttribute(session.notes)}</textarea>
      </div>
      ${renderCoachSessionPanel(plan, session)}
      <button class="primary-button ${session.completedAt ? "is-saved" : ""}" type="button" data-action="finish-workout">
        ${session.completedAt ? `${checkIcon()} Treino salvo` : "Concluir e salvar treino"}
      </button>
    </section>
  `;
  ensureTimerTicker();
}

function mondayOf(date) {
  const day = date.getDay();
  return addDays(date, -((day + 6) % 7));
}

function renderWeek() {
  const today = parseISO(localISO(new Date()));
  const monday = mondayOf(today);
  const dates = Array.from({ length: 7 }, (_, index) => localISO(addDays(monday, index)));
  const cycle = getCycleInfo(localISO(monday));
  const scheduled = dates.filter((date) => getPlanForDate(date)).length;
  const completed = dates.filter((date) => getPlanForDate(date) && state.store.sessions[date]?.completedAt).length;

  app.innerHTML = `
    <header class="view-header">
      <p class="eyebrow">Seu cronograma</p>
      <h1>Semana ${cycle.week}</h1>
      <p>Bloco ${cycle.block}: ${cycle.blockLabel.toLowerCase()}. ${completed} de ${scheduled} sessões registradas nesta semana.</p>
    </header>
    <div class="progress-strip">
      <div class="progress-strip-header"><span>Consistência semanal</span><strong>${completed}/${scheduled}</strong></div>
      <div class="progress-track"><div class="progress-fill" style="width: ${scheduled ? (completed / scheduled) * 100 : 0}%"></div></div>
    </div>
    <section class="week-list" aria-label="Treinos da semana">
      ${dates
        .map((dateISO) => {
          const date = parseISO(dateISO);
          const plan = getPlanForDate(dateISO);
          const session = state.store.sessions[dateISO];
          const dateParts = formatShortDate(dateISO);
          const setsDone = plan ? completedSets(plan, session) : 0;
          const setsTotal = plan ? totalSets(plan) : 0;
          return `
            <button class="week-card ${isToday(dateISO) ? "is-today" : ""}" type="button" data-action="open-date" data-date="${dateISO}">
              <span class="week-day"><span>${plan?.short ?? DAY_SHORT[date.getDay()]}</span><strong>${dateParts.day}</strong></span>
              <span class="week-info"><h3>${plan?.title ?? "Descanso"}</h3><p>${plan ? `${setsDone ? `${setsDone}/${setsTotal} séries · ` : ""}${plan.cardio.intensity}` : "Recuperação programada"}</p></span>
              <span class="status-dot ${session?.completedAt ? "is-complete" : ""}">${session?.completedAt ? checkIcon() : plan ? "→" : "·"}</span>
            </button>
          `;
        })
        .join("")}
    </section>
  `;
}

function completedSessions() {
  return Object.entries(state.store.sessions)
    .filter(([, session]) => session.completedAt)
    .sort(([a], [b]) => b.localeCompare(a));
}

function calculateStreak(sessions) {
  if (!sessions.length) return 0;
  const completedDates = new Set(sessions.map(([date]) => date));
  let cursor = parseISO(localISO(new Date()));
  if (!completedDates.has(localISO(cursor))) cursor = addDays(cursor, -1);
  let streak = 0;
  while (completedDates.has(localISO(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

function renderSyncCard() {
  const configured = syncConfigured();
  const connected = configured && state.sync.code;
  const lastSync = state.sync.lastSyncedAt
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(state.sync.lastSyncedAt))
    : "ainda não sincronizado";
  const status = escapeAttribute(state.sync.status);

  if (!configured) {
    return [
      '<div class="data-card sync-card">',
      '<div><h3>Configurar sincronização online</h3><p>Use um projeto Supabase e cole aqui a URL e a chave pública/publishable. O Workout usa um código secreto para criptografar os dados antes de enviar.</p></div>',
      '<div class="sync-fields">',
      '<label><span>URL do projeto Supabase</span><input value="', escapeAttribute(state.sync.config.url), '" placeholder="https://xxxx.supabase.co" data-action="sync-config" data-field="url" /></label>',
      '<label><span>Chave pública</span><input value="', escapeAttribute(state.sync.config.anonKey), '" placeholder="eyJ..." data-action="sync-config" data-field="anonKey" /></label>',
      '<button class="secondary-button" type="button" data-action="save-sync-config">Salvar conexão</button>',
      '</div>',
      '<details class="sync-setup"><summary>Preparar tabela no Supabase</summary>',
      '<p>Rode este modelo uma única vez no SQL Editor do Supabase. Depois volte aqui e salve a conexão.</p>',
      '<textarea readonly>', escapeAttribute(SYNC_SCHEMA_SQL), '</textarea>',
      '<button class="secondary-button" type="button" data-action="copy-sync-sql">Copiar modelo da tabela</button>',
      '</details>',
      '<p class="sync-status" data-sync-status>', status, '</p>',
      '</div>',
    ].join("");
  }

  if (!connected) {
    return [
      '<div class="data-card sync-card">',
      '<div><h3>Ligar navegadores</h3><p>Crie um código neste navegador ou cole o código criado em outro navegador. O código é a chave para criptografar seus dados.</p></div>',
      '<div class="sync-fields">',
      '<button class="secondary-button" type="button" data-action="create-sync-code">Criar código de sincronização</button>',
      '<label><span>Entrar com código existente</span><input value="', escapeAttribute(state.sync.pendingCode ?? ""), '" placeholder="cole o código aqui" data-action="sync-code" /></label>',
      '<button class="secondary-button" type="button" data-action="connect-sync-code">Conectar e receber dados</button>',
      '<button class="ghost-button" type="button" data-action="disconnect-sync">Trocar conexão Supabase</button>',
      '</div>',
      '<p class="sync-status" data-sync-status>', status, '</p>',
      '</div>',
    ].join("");
  }

  return [
    '<div class="data-card sync-card">',
    '<div><h3>Sincronização ativa</h3><p>Última sincronização: ', escapeAttribute(lastSync), '. O app sincroniza ao abrir, ao voltar para a aba e depois de salvar alterações.</p></div>',
    '<div class="sync-code-box"><span>Código secreto</span><strong>', escapeAttribute(state.sync.code), '</strong></div>',
    '<div class="data-actions">',
    '<button class="secondary-button" type="button" data-action="sync-now">Sincronizar agora</button>',
    '<button class="secondary-button" type="button" data-action="pull-sync">Receber dados da nuvem</button>',
    '<button class="secondary-button" type="button" data-action="copy-sync-code">Copiar código</button>',
    '<button class="ghost-button" type="button" data-action="disconnect-sync">Desconectar</button>',
    '</div>',
    '<p class="sync-status" data-sync-status>', status, '</p>',
    '</div>',
  ].join("");
}

function renderCoachRecommendationsSection() {
  const recommendations = state.store.coachRecommendations ?? [];
  const groups = {
    pending: recommendations.filter((item) => item.status === "pending"),
    applied: recommendations.filter((item) => item.status === "applied"),
    ignored: recommendations.filter((item) => item.status === "ignored"),
  };
  const renderGroup = (title, items, emptyText) => `
    <div class="coach-status-group">
      <h3>${title}</h3>
      ${
        items.length
          ? items
              .slice()
              .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
              .slice(0, 8)
              .map((item) => {
                const nextDate = item.status === "pending" && item.exerciseId ? nextDateWithExercise(item.sourceDate || state.selectedDate, { id: item.exerciseId, name: item.exerciseName }) : "";
                return `
                  <article class="coach-recommendation-item">
                    <div>
                      <strong>${escapeAttribute(item.exerciseName || "Recomendação geral")}</strong>
                      <p>${escapeAttribute(item.recommendationText)}</p>
                      <span>${item.status === "pending" && nextDate ? `Próximo uso: ${formatShortDate(nextDate).day}/${formatShortDate(nextDate).month}` : item.result ? `Resultado: ${item.result}` : "Registrada no histórico"}</span>
                    </div>
                    ${
                      item.status === "pending"
                        ? `<button class="ghost-button" type="button" data-action="ignore-coach-recommendation" data-id="${escapeAttribute(item.id)}">Ignorar</button>`
                        : ""
                    }
                  </article>
                `;
              })
              .join("")
          : `<p class="coach-empty">${emptyText}</p>`
      }
    </div>
  `;

  return `
    <section class="section">
      <div class="section-heading"><div><p class="eyebrow">Coach</p><h2>Recomendações do Coach</h2></div></div>
      <div class="coach-board">
        ${renderGroup("Pendentes", groups.pending, "Nenhuma recomendação pendente.")}
        ${renderGroup("Aplicadas", groups.applied, "Nenhuma recomendação aplicada ainda.")}
        ${renderGroup("Ignoradas", groups.ignored, "Nenhuma recomendação ignorada.")}
      </div>
    </section>
  `;
}

function renderProgress() {
  const sessions = completedSessions();
  const cardioDistances = sessions.map(([, session]) => Number(session.cardio?.distance) || 0).filter(Boolean);
  const bestDistance = cardioDistances.length ? Math.max(...cardioDistances) : 0;
  const totalSetsDone = sessions.reduce((total, [dateISO, session]) => total + completedSets(getPlanForSession(dateISO, session), session), 0);
  const streak = calculateStreak(sessions);
  const bestPercent = Math.min(100, Math.round((bestDistance / CARDIO_LONG_TERM) * 100));

  app.innerHTML = `
    <header class="view-header">
      <p class="eyebrow">Sua evolução</p>
      <h1>Progresso</h1>
      <p>Cargas, consistência e corrida reunidas para mostrar o que realmente está avançando.</p>
    </header>
    <section class="metrics-grid" aria-label="Resumo do progresso">
      <article class="metric-card is-featured"><span class="metric-label">Treinos</span><div class="metric-value">${sessions.length}</div><span class="metric-caption">sessões registradas</span></article>
      <article class="metric-card"><span class="metric-label">Sequência</span><div class="metric-value">${streak}</div><span class="metric-caption">dias consecutivos</span></article>
      <article class="metric-card"><span class="metric-label">Séries feitas</span><div class="metric-value">${totalSetsDone}</div><span class="metric-caption">séries concluídas</span></article>
      <article class="metric-card"><span class="metric-label">Melhor corrida</span><div class="metric-value">${bestDistance || "—"}</div><span class="metric-caption">${bestDistance ? `metros · ${bestPercent}% da meta` : "sem registro"}</span></article>
    </section>
    <section class="section">
      <div class="section-heading"><div><p class="eyebrow">Atividade</p><h2>Histórico recente</h2></div></div>
      <div class="history-list">
        ${
          sessions.length
            ? sessions
                .slice(0, 10)
                .map(([dateISO, session]) => {
                  const plan = getPlanForSession(dateISO, session);
                  const date = formatShortDate(dateISO);
                  const done = completedSets(plan, session);
                  const speed = formatSpeed(session.cardio?.speed);
                  const details = [`${done} séries`, session.totalDuration ? formatTimer(session.totalDuration) : "", speed ? `Esteira ${speed} km/h` : "", session.mobilityDone ? "Mobilidade ✓" : ""].filter(Boolean).join(" · ");
                  return `<article class="history-item"><div class="history-date"><strong>${date.day}</strong><span>${date.month}</span></div><div class="history-info"><h3>${plan.title}</h3><p>${details}</p></div><span class="history-distance">${session.cardio?.distance ? `${Number(session.cardio.distance).toLocaleString("pt-BR")} m` : "—"}</span></article>`;
                })
                .join("")
            : `<div class="empty-card"><strong>Nenhum treino registrado</strong>Seu histórico aparecerá aqui após a primeira sessão.</div>`
        }
      </div>
    </section>
    <section class="section">
      <div class="section-heading"><div><p class="eyebrow">Entre navegadores</p><h2>Sincronização</h2></div></div>
      ${renderSyncCard()}
    </section>
    <section class="section">
      <div class="section-heading"><div><p class="eyebrow">Privacidade</p><h2>Seus dados</h2></div></div>
      <div class="data-card">
        <div>
          <h3>Levar dados para outro navegador</h3>
          <p>Cada navegador mantém uma cópia separada. Exporte o backup neste navegador e importe o arquivo no outro para transferir sua ficha e seu histórico.</p>
        </div>
        <div class="data-actions">
          <button class="secondary-button" type="button" data-action="export-data">1. Exportar dados</button>
          <button class="secondary-button" type="button" data-action="import-data">2. Importar neste navegador</button>
          <input class="sr-only" id="backup-file" type="file" accept="application/json,.json" data-action="backup-file" />
        </div>
      </div>
    </section>
  `;
}

function makeBuilderExercise(source = null, index = 0) {
  if (source) {
    return {
      ...source,
      id: `custom-ex-${Date.now()}-${index}`,
      catalogId: source.id,
      target: source.target ?? "",
      defaultLoad: source.defaultLoad ?? "",
      notes: source.notes ?? "",
      restSeconds: Number(source.restSeconds) || (source.type === "composto" ? 120 : 90),
    };
  }
  return {
    id: `custom-ex-${Date.now()}-${index}`,
    catalogId: "",
    name: "",
    muscle: "",
    sets: 3,
    minReps: 8,
    maxReps: 12,
    loadUnit: "kg",
    unit: "reps",
    target: "",
    rir: "RIR 1-2",
    type: "isolador",
    defaultLoad: "",
    notes: "",
    restSeconds: 90,
  };
}

function startWorkoutBuilder() {
  state.builder = {
    mode: "new-day",
    title: "",
    groups: "",
    date: state.selectedDate,
    weekday: parseISO(state.selectedDate).getDay(),
    warmupTitle: "",
    warmup: "",
    cardio: {
      intensity: "Moderado",
      duration: 12,
      minimum: 1400,
      goal: 2400,
      note: "Ritmo estável e controlado.",
    },
    exercises: [makeBuilderExercise()],
  };
}

function startEditWorkoutBuilder(plan) {
  state.builder = {
    mode: "edit-day",
    sourceId: plan.id,
    title: plan.title,
    groups: plan.groups ?? "",
    weekday: Number(plan.weekday),
    warmupTitle: plan.warmupTitle ?? "",
    warmup: plan.warmup ?? "",
    cardio: cloneValue(plan.cardio),
    exercises: plan.exercises.map((exercise, index) => makeBuilderExercise(exercise, index)),
  };
}

function renderPlanLibrary() {
  const activePlan = state.store.activePlan;
  const days = [...(activePlan?.days ?? [])].sort((a, b) => DAY_ORDER.indexOf(a.weekday) - DAY_ORDER.indexOf(b.weekday));

  app.innerHTML = `
    <header class="view-header plans-header">
      <div>
        <p class="eyebrow">Sua ficha atual</p>
        <h1>Treinos</h1>
        <p>${escapeAttribute(activePlan?.name ?? "Ficha atual")} · abra um dia para executar ou editar cada detalhe.</p>
      </div>
      <button class="compact-primary" type="button" data-action="new-sheet">+ Nova ficha</button>
    </header>

    <section class="section">
      <div class="section-heading"><div><p class="eyebrow">Organizada por dia</p><h2>${activePlan?.name ?? "Ficha atual"}</h2></div><span>${days.length} treinos</span></div>
      <div class="plan-grid">
        ${days
          .map(
            (plan) => `<article class="plan-card is-actionable">
              <button class="plan-card-main" type="button" data-action="open-plan-day" data-weekday="${plan.weekday}">
                <div class="plan-card-top"><span class="plan-badge">${plan.short}</span><span>${plan.exercises.length} exercícios</span></div>
                <h3>${plan.name} — ${plan.title}</h3>
                <p>${plan.groups || plan.exercises.map((exercise) => exercise.muscle).filter(Boolean).join(" · ")} · ${plan.cardio.duration ?? 12} min de corrida</p>
              </button>
              <div class="plan-card-actions"><button class="secondary-button" type="button" data-action="edit-plan-day" data-plan-id="${plan.id}">Editar treino</button></div>
            </article>`,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderBuilderExercise(exercise, index) {
  return `
    <article class="builder-exercise">
      <div class="builder-exercise-head">
        <span class="exercise-number">${String(index + 1).padStart(2, "0")}</span>
        <div><h3>Exercício ${index + 1}</h3><p>Escolha da biblioteca ou preencha um novo.</p></div>
        <div class="editor-order-actions">
          <button type="button" data-action="move-builder-exercise" data-index="${index}" data-direction="-1" aria-label="Mover exercício ${index + 1} para cima" ${index === 0 ? "disabled" : ""}>↑</button>
          <button type="button" data-action="move-builder-exercise" data-index="${index}" data-direction="1" aria-label="Mover exercício ${index + 1} para baixo" ${index === state.builder.exercises.length - 1 ? "disabled" : ""}>↓</button>
          ${state.builder.exercises.length > 1 ? `<button class="remove-button" type="button" data-action="remove-builder-exercise" data-index="${index}" aria-label="Remover exercício ${index + 1}">×</button>` : ""}
        </div>
      </div>
      <div class="builder-fields">
        <label class="builder-field is-wide"><span>Biblioteca de exercícios</span><select data-action="catalog-exercise" data-index="${index}"><option value="">Novo exercício</option>${exerciseCatalog
          .map((item) => `<option value="${item.id}" ${exercise.catalogId === item.id ? "selected" : ""}>${item.name}</option>`)
          .join("")}</select></label>
        <label class="builder-field is-wide"><span>Nome</span><input value="${escapeAttribute(exercise.name)}" placeholder="Ex.: Supino reto" data-action="builder-exercise" data-index="${index}" data-field="name" /></label>
        <label class="builder-field"><span>Grupo muscular</span><input value="${escapeAttribute(exercise.muscle)}" placeholder="Peito" data-action="builder-exercise" data-index="${index}" data-field="muscle" /></label>
        <label class="builder-field"><span>Séries</span><input type="number" min="1" max="20" value="${exercise.sets}" data-action="builder-exercise" data-index="${index}" data-field="sets" /></label>
        <label class="builder-field"><span>Reps mínimas</span><input type="number" min="0" value="${exercise.minReps ?? ""}" data-action="builder-exercise" data-index="${index}" data-field="minReps" /></label>
        <label class="builder-field"><span>Reps máximas</span><input type="number" min="0" value="${exercise.maxReps ?? ""}" data-action="builder-exercise" data-index="${index}" data-field="maxReps" /></label>
        <label class="builder-field"><span>Medida</span><select data-action="builder-exercise" data-index="${index}" data-field="unit"><option value="reps" ${exercise.unit === "reps" ? "selected" : ""}>Repetições</option><option value="s" ${exercise.unit === "s" ? "selected" : ""}>Segundos</option></select></label>
        <label class="builder-field"><span>Unidade de carga</span><select data-action="builder-exercise" data-index="${index}" data-field="loadUnit"><option value="kg" ${exercise.loadUnit === "kg" ? "selected" : ""}>kg</option><option value="lb" ${exercise.loadUnit === "lb" ? "selected" : ""}>lb</option><option value="livre" ${exercise.loadUnit === "livre" ? "selected" : ""}>Peso livre/corporal</option></select></label>
        <label class="builder-field"><span>Tipo</span><select data-action="builder-exercise" data-index="${index}" data-field="type"><option value="composto" ${exercise.type === "composto" ? "selected" : ""}>Composto</option><option value="isolador" ${exercise.type === "isolador" ? "selected" : ""}>Isolador</option></select></label>
        <label class="builder-field"><span>RIR</span><input value="${escapeAttribute(exercise.rir)}" placeholder="RIR 1-2" data-action="builder-exercise" data-index="${index}" data-field="rir" /></label>
        <label class="builder-field"><span>Carga sugerida</span><input value="${escapeAttribute(exercise.defaultLoad)}" placeholder="Opcional" data-action="builder-exercise" data-index="${index}" data-field="defaultLoad" /></label>
        <label class="builder-field"><span>Descanso (segundos)</span><input type="number" min="10" max="900" value="${exercise.restSeconds}" data-action="builder-exercise" data-index="${index}" data-field="restSeconds" /></label>
        <label class="builder-field is-wide"><span>Observação ou alvo</span><input value="${escapeAttribute(exercise.target)}" placeholder="Ex.: por perna, falha controlada" data-action="builder-exercise" data-index="${index}" data-field="target" /></label>
        <label class="builder-field is-wide"><span>Observações do exercício</span><textarea placeholder="Ajustes técnicos, máquina ou execução..." data-action="builder-exercise" data-index="${index}" data-field="notes">${escapeAttribute(exercise.notes)}</textarea></label>
      </div>
    </article>
  `;
}

function renderDayOptions(selected) {
  return DAY_ORDER.map((weekday) => `<option value="${weekday}" ${Number(selected) === weekday ? "selected" : ""}>${DAY_NAMES[weekday]}</option>`).join("");
}

function renderWorkoutBuilder() {
  const builder = state.builder;
  const isEditing = builder.mode === "edit-day";
  app.innerHTML = `
    <header class="builder-header">
      <button class="back-button" type="button" data-action="cancel-builder">←</button>
      <div><p class="eyebrow">${isEditing ? "Ficha atual" : "Novo treino"}</p><h1>${isEditing ? "Editar treino" : "Criar treino"}</h1></div>
    </header>
    <section class="builder-section">
      <div class="builder-section-title"><span>1</span><div><h2>Informações gerais</h2><p>Nome, foco e data em que deseja usar.</p></div></div>
      <div class="builder-panel builder-fields">
        <label class="builder-field is-wide"><span>Nome do treino</span><input value="${escapeAttribute(builder.title)}" placeholder="Ex.: Peito intenso" data-action="builder-field" data-field="title" /></label>
        <label class="builder-field"><span>Grupos musculares</span><input value="${escapeAttribute(builder.groups)}" placeholder="Peito + Ombros" data-action="builder-field" data-field="groups" /></label>
        <label class="builder-field"><span>Dia da semana</span><select data-action="builder-field" data-field="weekday">${renderDayOptions(builder.weekday)}</select></label>
      </div>
    </section>
    <section class="builder-section">
      <div class="builder-section-title"><span>2</span><div><h2>Exercícios</h2><p>Todos os parâmetros podem ser ajustados.</p></div></div>
      <div class="builder-exercise-list">${builder.exercises.map(renderBuilderExercise).join("")}</div>
      <button class="add-exercise-button" type="button" data-action="add-builder-exercise">+ Adicionar exercício</button>
    </section>
    <section class="builder-section">
      <div class="builder-section-title"><span>3</span><div><h2>Aquecimento</h2><p>Protocolo que aparecerá antes do treino.</p></div></div>
      <div class="builder-panel builder-fields">
        <label class="builder-field"><span>Exercício principal</span><input value="${escapeAttribute(builder.warmupTitle)}" placeholder="Ex.: Agachamento livre" data-action="builder-field" data-field="warmupTitle" /></label>
        <label class="builder-field is-wide"><span>Protocolo</span><textarea placeholder="Séries leves e progressivas..." data-action="builder-field" data-field="warmup">${escapeAttribute(builder.warmup)}</textarea></label>
      </div>
    </section>
    <section class="builder-section">
      <div class="builder-section-title"><span>4</span><div><h2>Cardio</h2><p>Duração, intensidade e metas de distância.</p></div></div>
      <div class="builder-panel builder-fields">
        <label class="builder-field"><span>Intensidade</span><input value="${escapeAttribute(builder.cardio.intensity)}" data-action="builder-cardio" data-field="intensity" /></label>
        <label class="builder-field"><span>Duração (min)</span><input type="number" min="0" value="${builder.cardio.duration}" data-action="builder-cardio" data-field="duration" /></label>
        <label class="builder-field"><span>Meta mínima (m)</span><input type="number" min="0" value="${builder.cardio.minimum}" data-action="builder-cardio" data-field="minimum" /></label>
        <label class="builder-field"><span>Meta futura (m)</span><input type="number" min="0" value="${builder.cardio.goal}" data-action="builder-cardio" data-field="goal" /></label>
        <label class="builder-field is-wide"><span>Orientação</span><input value="${escapeAttribute(builder.cardio.note)}" data-action="builder-cardio" data-field="note" /></label>
      </div>
    </section>
    <div class="builder-footer"><button class="primary-button" type="button" data-action="${isEditing ? "save-edited-workout" : "save-custom-workout"}">${isEditing ? "Salvar alterações" : "Salvar e usar treino"}</button></div>
  `;
}

function createSheetDay(index) {
  const weekdayDefaults = [1, 3, 5, 2, 4, 6, 0];
  const weekday = weekdayDefaults[index] ?? DAY_ORDER[index % 7];
  return {
    weekday,
    title: `Treino ${String.fromCharCode(65 + index)}`,
    groups: "",
    warmupTitle: "Aquecimento livre",
    warmup: "Faça séries leves e progressivas antes das séries válidas.",
    cardio: { intensity: "Moderado", duration: 12, minimum: 1400, goal: 2400, note: "Ritmo estável e controlado." },
    exercises: [makeBuilderExercise(null, 0)],
  };
}

function startSheetBuilder() {
  state.builder = null;
  state.sheetBuilder = {
    name: "Minha ficha",
    count: 3,
    confirming: false,
    days: [createSheetDay(0), createSheetDay(1), createSheetDay(2)],
  };
}

function resizeSheetDays(count) {
  const safeCount = Math.max(1, Math.min(7, Number(count) || 1));
  while (state.sheetBuilder.days.length < safeCount) state.sheetBuilder.days.push(createSheetDay(state.sheetBuilder.days.length));
  state.sheetBuilder.days = state.sheetBuilder.days.slice(0, safeCount);
  state.sheetBuilder.count = safeCount;
}

function renderSheetExercise(exercise, dayIndex, exerciseIndex) {
  return `<article class="sheet-exercise">
    <div class="builder-exercise-head">
      <span class="exercise-number">${String(exerciseIndex + 1).padStart(2, "0")}</span>
      <div><h3>Exercício ${exerciseIndex + 1}</h3><p>Séries, repetições, carga e descanso.</p></div>
      <div class="editor-order-actions">
        <button type="button" data-action="move-sheet-exercise" data-day-index="${dayIndex}" data-index="${exerciseIndex}" data-direction="-1" aria-label="Mover exercício para cima" ${exerciseIndex === 0 ? "disabled" : ""}>↑</button>
        <button type="button" data-action="move-sheet-exercise" data-day-index="${dayIndex}" data-index="${exerciseIndex}" data-direction="1" aria-label="Mover exercício para baixo" ${exerciseIndex === state.sheetBuilder.days[dayIndex].exercises.length - 1 ? "disabled" : ""}>↓</button>
        ${state.sheetBuilder.days[dayIndex].exercises.length > 1 ? `<button class="remove-button" type="button" data-action="remove-sheet-exercise" data-day-index="${dayIndex}" data-index="${exerciseIndex}" aria-label="Remover exercício">×</button>` : ""}
      </div>
    </div>
    <div class="builder-fields">
      <label class="builder-field is-wide"><span>Biblioteca</span><select data-action="sheet-catalog" data-day-index="${dayIndex}" data-index="${exerciseIndex}"><option value="">Novo exercício</option>${exerciseCatalog.map((item) => `<option value="${item.id}" ${exercise.catalogId === item.id ? "selected" : ""}>${item.name}</option>`).join("")}</select></label>
      <label class="builder-field is-wide"><span>Nome</span><input value="${escapeAttribute(exercise.name)}" data-action="sheet-exercise" data-day-index="${dayIndex}" data-index="${exerciseIndex}" data-field="name" placeholder="Ex.: Supino reto" /></label>
      <label class="builder-field"><span>Grupo muscular</span><input value="${escapeAttribute(exercise.muscle)}" data-action="sheet-exercise" data-day-index="${dayIndex}" data-index="${exerciseIndex}" data-field="muscle" /></label>
      <label class="builder-field"><span>Séries</span><input type="number" min="1" max="20" value="${exercise.sets}" data-action="sheet-exercise" data-day-index="${dayIndex}" data-index="${exerciseIndex}" data-field="sets" /></label>
      <label class="builder-field"><span>Reps mínimas</span><input type="number" min="0" value="${exercise.minReps ?? ""}" data-action="sheet-exercise" data-day-index="${dayIndex}" data-index="${exerciseIndex}" data-field="minReps" /></label>
      <label class="builder-field"><span>Reps máximas</span><input type="number" min="0" value="${exercise.maxReps ?? ""}" data-action="sheet-exercise" data-day-index="${dayIndex}" data-index="${exerciseIndex}" data-field="maxReps" /></label>
      <label class="builder-field"><span>Carga sugerida</span><input value="${escapeAttribute(exercise.defaultLoad)}" data-action="sheet-exercise" data-day-index="${dayIndex}" data-index="${exerciseIndex}" data-field="defaultLoad" placeholder="Opcional" /></label>
      <label class="builder-field"><span>Unidade</span><select data-action="sheet-exercise" data-day-index="${dayIndex}" data-index="${exerciseIndex}" data-field="loadUnit"><option value="kg" ${exercise.loadUnit === "kg" ? "selected" : ""}>kg</option><option value="lb" ${exercise.loadUnit === "lb" ? "selected" : ""}>lb</option><option value="livre" ${exercise.loadUnit === "livre" ? "selected" : ""}>Livre/corporal</option></select></label>
      <label class="builder-field"><span>Descanso (s)</span><input type="number" min="10" max="900" value="${exercise.restSeconds}" data-action="sheet-exercise" data-day-index="${dayIndex}" data-index="${exerciseIndex}" data-field="restSeconds" /></label>
      <label class="builder-field is-wide"><span>Observações</span><textarea data-action="sheet-exercise" data-day-index="${dayIndex}" data-index="${exerciseIndex}" data-field="notes" placeholder="Execução, máquina ou ajustes...">${escapeAttribute(exercise.notes)}</textarea></label>
    </div>
  </article>`;
}

function renderSheetBuilder() {
  const builder = state.sheetBuilder;
  app.innerHTML = `
    <header class="builder-header"><button class="back-button" type="button" data-action="cancel-sheet">←</button><div><p class="eyebrow">Substituir ficha atual</p><h1>Nova ficha de treino</h1></div></header>
    <section class="builder-section">
      <div class="builder-section-title"><span>1</span><div><h2>Estrutura da ficha</h2><p>Escolha o nome e quantos treinos ela terá.</p></div></div>
      <div class="builder-panel builder-fields">
        <label class="builder-field is-wide"><span>Nome da ficha</span><input value="${escapeAttribute(builder.name)}" data-action="sheet-field" data-field="name" /></label>
        <label class="builder-field"><span>Quantidade de treinos</span><input type="number" min="1" max="7" value="${builder.count}" data-action="sheet-field" data-field="count" /></label>
      </div>
    </section>
    ${builder.days.map((day, dayIndex) => `<section class="builder-section sheet-day-section">
      <div class="builder-section-title"><span>${dayIndex + 2}</span><div><h2>${day.title || `Treino ${dayIndex + 1}`}</h2><p>Dia, nome e exercícios deste treino.</p></div></div>
      <div class="builder-panel builder-fields">
        <label class="builder-field"><span>Dia da semana</span><select data-action="sheet-day" data-day-index="${dayIndex}" data-field="weekday">${renderDayOptions(day.weekday)}</select></label>
        <label class="builder-field"><span>Nome do treino</span><input value="${escapeAttribute(day.title)}" data-action="sheet-day" data-day-index="${dayIndex}" data-field="title" /></label>
        <label class="builder-field is-wide"><span>Foco muscular</span><input value="${escapeAttribute(day.groups)}" data-action="sheet-day" data-day-index="${dayIndex}" data-field="groups" placeholder="Ex.: Peito + Ombros + Tríceps" /></label>
        <label class="builder-field"><span>Descanso/cardio (min)</span><input type="number" min="0" value="${day.cardio.duration}" data-action="sheet-cardio" data-day-index="${dayIndex}" data-field="duration" /></label>
        <label class="builder-field"><span>Intensidade da corrida</span><input value="${escapeAttribute(day.cardio.intensity)}" data-action="sheet-cardio" data-day-index="${dayIndex}" data-field="intensity" /></label>
      </div>
      <div class="sheet-exercise-list">${day.exercises.map((exercise, exerciseIndex) => renderSheetExercise(exercise, dayIndex, exerciseIndex)).join("")}</div>
      <button class="add-exercise-button" type="button" data-action="add-sheet-exercise" data-day-index="${dayIndex}">+ Adicionar exercício a este treino</button>
    </section>`).join("")}
    <div class="builder-footer"><button class="primary-button" type="button" data-action="request-replace-sheet">Salvar nova ficha</button></div>
    ${builder.confirming ? `<div class="confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="replace-title"><div class="confirm-card"><span class="warning-mark">!</span><h2 id="replace-title">Substituir ficha atual?</h2><p>Ao criar uma nova ficha, o treino atual será substituído. Deseja continuar?</p><div class="confirm-actions"><button class="secondary-button" type="button" data-action="cancel-sheet-confirm">Cancelar</button><button class="danger-button" type="button" data-action="confirm-replace-sheet">Sim, substituir ficha</button></div></div></div>` : ""}
  `;
}

function replaceActivePlanFromBuilder() {
  const builder = state.sheetBuilder;
  if (!builder.name.trim()) return "Dê um nome à nova ficha.";
  const weekdays = builder.days.map((day) => Number(day.weekday));
  if (new Set(weekdays).size !== weekdays.length) return "Escolha dias da semana diferentes para cada treino.";
  if (builder.days.some((day) => !day.title.trim())) return "Dê um nome a todos os treinos.";
  if (builder.days.some((day) => !day.exercises.some((exercise) => exercise.name.trim() && Number(exercise.sets) > 0))) return "Cada treino precisa ter ao menos um exercício válido.";

  state.store.planArchive.push(...state.store.activePlan.days.map(cloneValue));
  const planId = `plan-${Date.now()}`;
  const days = builder.days.map((day, dayIndex) => {
    const dayId = `${planId}-day-${dayIndex + 1}`;
    return normalizePlanDay({
      id: dayId,
      title: day.title.trim(),
      groups: day.groups.trim(),
      warmupTitle: day.warmupTitle,
      warmup: day.warmup,
      cardio: day.cardio,
      exercises: day.exercises
        .filter((exercise) => exercise.name.trim() && Number(exercise.sets) > 0)
        .map((exercise, exerciseIndex) => ({ ...exercise, id: `${dayId}-exercise-${exerciseIndex + 1}`, catalogId: undefined })),
    }, Number(day.weekday));
  });
  state.store.activePlan = {
    id: planId,
    name: builder.name.trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    days,
  };
  Object.entries(state.store.sessions).forEach(([dateISO, session]) => {
    if (!session.completedAt) delete state.store.sessions[dateISO];
  });
  state.store.datePlanOverrides = {};
  state.sheetBuilder = null;
  persist();
  return "";
}

function renderPlans() {
  if (state.sheetBuilder) renderSheetBuilder();
  else if (state.builder) renderWorkoutBuilder();
  else renderPlanLibrary();
}

function render() {
  document.querySelectorAll(".nav-item").forEach((button) => {
    const active = button.dataset.view === state.view;
    button.classList.toggle("is-active", active);
    button.toggleAttribute("aria-current", active);
  });

  if (state.view === "week") renderWeek();
  else if (state.view === "progress") renderProgress();
  else if (state.view === "plans") renderPlans();
  else renderToday();
}

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

document.querySelector(".bottom-nav").addEventListener("click", (event) => {
  const button = event.target.closest("[data-view]");
  if (!button) return;
  state.view = button.dataset.view;
  if (state.view === "today") state.selectedDate = localISO(new Date());
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

document.querySelector("#profile-button").addEventListener("click", () => {
  state.view = "progress";
  render();
  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
});

app.addEventListener("input", (event) => {
  const target = event.target;
  const action = target.dataset.action;
  if (!action) return;

  if (action === "sync-config") {
    state.sync.config[target.dataset.field] = target.value.trim();
    return;
  }
  if (action === "sync-code") {
    state.sync.pendingCode = target.value.trim();
    return;
  }

  if (action === "sheet-field") {
    if (target.dataset.field === "count") {
      resizeSheetDays(target.value);
      renderSheetBuilder();
    } else state.sheetBuilder[target.dataset.field] = target.value;
    return;
  }
  if (action === "sheet-day") {
    const day = state.sheetBuilder.days[Number(target.dataset.dayIndex)];
    day[target.dataset.field] = target.dataset.field === "weekday" ? Number(target.value) : target.value;
    return;
  }
  if (action === "sheet-cardio") {
    const day = state.sheetBuilder.days[Number(target.dataset.dayIndex)];
    day.cardio[target.dataset.field] = target.dataset.field === "duration" ? Number(target.value) : target.value;
    return;
  }
  if (action === "sheet-exercise") {
    const exercise = state.sheetBuilder.days[Number(target.dataset.dayIndex)].exercises[Number(target.dataset.index)];
    const numericFields = new Set(["sets", "minReps", "maxReps", "restSeconds"]);
    exercise[target.dataset.field] = numericFields.has(target.dataset.field)
      ? target.value === ""
        ? null
        : Number(target.value)
      : target.value;
    return;
  }

  if (action === "builder-field") {
    state.builder[target.dataset.field] = target.value;
    return;
  }
  if (action === "builder-cardio") {
    state.builder.cardio[target.dataset.field] = target.value;
    return;
  }
  if (action === "builder-exercise") {
    const exercise = state.builder.exercises[Number(target.dataset.index)];
    const numericFields = new Set(["sets", "minReps", "maxReps", "restSeconds"]);
    exercise[target.dataset.field] = numericFields.has(target.dataset.field)
      ? target.value === ""
        ? null
        : Number(target.value)
      : target.value;
    return;
  }
  if (action === "catalog-exercise") return;

  const session = getSession();

  if (action === "set-input") {
    session.exerciseLogs[target.dataset.exercise][Number(target.dataset.set)][target.dataset.field] = target.value;
  } else if (action === "exercise-detail") {
    session.exerciseDetails ??= {};
    session.exerciseDetails[target.dataset.exercise] ??= { performedName: "", substitutionReason: "", notes: "" };
    session.exerciseDetails[target.dataset.exercise][target.dataset.field] = target.value;
  } else if (action === "coach-response") {
    session.coachResponseText = target.value;
    const plan = getPlanForSession(state.selectedDate, session);
    const parsed = parseCoachRecommendationsFromText(session.coachResponseText, plan);
    const detectedExercises = parsed.items.map((item) => item.exercise.name);
    const detection = document.querySelector("[data-coach-detection]");
    if (detection) {
      detection.classList.toggle("has-items", detectedExercises.length > 0);
      detection.querySelector("span").textContent = detectedExercises.length
        ? `${detectedExercises.length} recomendação(ões) detectada(s): ${detectedExercises.join(", ")}.`
        : "Ainda não encontrei nomes de exercícios no texto. Peça ao ChatGPT para usar os nomes exatamente como aparecem no resumo.";
    }
  } else if (action === "coach-exercise-draft") {
    session.coachExerciseDrafts ??= {};
    session.coachExerciseDrafts[target.dataset.exercise] = target.value;
  } else if (action === "cardio") {
    session.cardio[target.dataset.field] = target.value;
  } else if (action === "notes") {
    session.notes = target.value;
  }
  persist();
});

app.addEventListener("change", (event) => {
  const target = event.target;
  if (target.dataset.action === "mobility-check") {
    const session = getSession();
    session.mobilityDone = target.checked;
    persist();
    return;
  }
  if (target.dataset.action === "sheet-catalog") {
    const dayIndex = Number(target.dataset.dayIndex);
    const exerciseIndex = Number(target.dataset.index);
    const template = exerciseCatalog.find((exercise) => exercise.id === target.value);
    state.sheetBuilder.days[dayIndex].exercises[exerciseIndex] = template
      ? makeBuilderExercise(template, exerciseIndex)
      : makeBuilderExercise(null, exerciseIndex);
    renderSheetBuilder();
    return;
  }
  if (target.dataset.action === "catalog-exercise") {
    const index = Number(target.dataset.index);
    const template = exerciseCatalog.find((exercise) => exercise.id === target.value);
    state.builder.exercises[index] = template
      ? makeBuilderExercise(template, index)
      : makeBuilderExercise(null, index);
    const scrollPosition = window.scrollY;
    renderWorkoutBuilder();
    requestAnimationFrame(() => window.scrollTo(0, scrollPosition));
    return;
  }
  if (target.dataset.action === "backup-file") {
    const file = target.files?.[0];
    if (!file) return;
    file
      .text()
      .then((content) => {
        const imported = JSON.parse(content);
        if (!imported || imported.version !== 1 || typeof imported.sessions !== "object") {
          throw new Error("Formato de backup inválido");
        }
        imported.customPlans ??= [];
        imported.datePlanOverrides ??= {};
        imported.activePlan ??= makeDefaultActivePlan();
        imported.activePlan.days = (imported.activePlan.days ?? []).map((plan) => normalizePlanDay(plan, plan.weekday));
        imported.planArchive ??= [];
        ensureCoachStore(imported);
        Object.entries(imported.sessions).forEach(([dateISO, session]) => {
          normalizeSession(imported, dateISO, session);
        });
        state.store = imported;
        persist();
        renderProgress();
        showToast("Backup importado com sucesso.");
      })
      .catch(() => showToast("Não foi possível importar este backup."));
    target.value = "";
    return;
  }
  if (target.dataset.action !== "set-check") return;
  const session = getSession();
  session.exerciseLogs[target.dataset.exercise][Number(target.dataset.set)].done = target.checked;
  if (target.checked && !session.timer.running && generalElapsed(session) === 0) {
    session.timer.running = true;
    session.timer.startedAt = Date.now();
  }
  session.completedAt = null;
  persist();
  const scrollPosition = window.scrollY;
  renderToday();
  requestAnimationFrame(() => window.scrollTo(0, scrollPosition));
});

app.addEventListener("click", async (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;

  if (action === "save-sync-config") {
    saveSyncState();
    renderProgress();
    startAutoSync();
    showToast(syncConfigured() ? "Conexão salva." : "Preencha URL e chave pública.");
    return;
  }

  if (action === "copy-sync-sql") {
    await navigator.clipboard?.writeText(SYNC_SCHEMA_SQL);
    showToast("Modelo da tabela copiado.");
    return;
  }

  if (action === "create-sync-code") {
    if (!syncConfigured()) {
      showToast("Salve a conexão do Supabase primeiro.");
      return;
    }
    state.sync.code = randomSyncCode();
    state.sync.pendingCode = "";
    saveSyncState();
    renderProgress();
    await pushSync();
    startAutoSync();
    showToast("Código criado e dados enviados.");
    return;
  }

  if (action === "connect-sync-code") {
    if (!syncConfigured()) {
      showToast("Salve a conexão do Supabase primeiro.");
      return;
    }
    if (!state.sync.pendingCode) {
      showToast("Cole o código de sincronização.");
      return;
    }
    state.sync.code = state.sync.pendingCode.trim();
    saveSyncState();
    const received = await pullSync();
    startAutoSync();
    showToast(received ? "Dados recebidos." : "Não encontrei dados para este código.");
    return;
  }

  if (action === "sync-now") {
    await syncNow();
    return;
  }

  if (action === "pull-sync") {
    const received = await pullSync();
    showToast(received ? "Dados atualizados." : "Nada novo para receber.");
    return;
  }

  if (action === "copy-sync-code") {
    await navigator.clipboard?.writeText(state.sync.code);
    showToast("Código copiado.");
    return;
  }

  if (action === "disconnect-sync") {
    const hadCode = Boolean(state.sync.code);
    state.sync.code = "";
    state.sync.pendingCode = "";
    state.sync.lastSyncedAt = "";
    state.sync.status = "";
    if (!hadCode) state.sync.config = { ...DEFAULT_SYNC_CONFIG };
    saveSyncState();
    stopAutoSync();
    renderProgress();
    showToast(hadCode ? "Sincronização desconectada." : "Conexão padrão restaurada.");
    return;
  }

  if (action === "generate-chatgpt-summary") {
    const session = getSession();
    session.chatgptSummary = buildChatGPTSummary(state.selectedDate, session);
    persist();
    renderToday();
    showToast("Resumo gerado para o ChatGPT.");
    return;
  }

  if (action === "copy-chatgpt-summary") {
    const session = getSession();
    if (!session.chatgptSummary) session.chatgptSummary = buildChatGPTSummary(state.selectedDate, session);
    await navigator.clipboard?.writeText(session.chatgptSummary);
    persist();
    renderToday();
    showToast("Resumo copiado.");
    return;
  }

  if (action === "save-coach-recommendations") {
    const session = getSession();
    const hasCoachText = Boolean(String(session.coachResponseText ?? "").trim());
    const saved = saveCoachRecommendationsFromSession();
    persist();
    renderToday();
    showToast(
      saved
        ? `${saved} recomendações separadas para o próximo treino.`
        : hasCoachText
          ? "Não encontrei exercícios no texto. Use os nomes exatos do resumo."
          : "Cole a resposta do ChatGPT antes de salvar.",
    );
    return;
  }

  if (action === "ignore-coach-recommendation") {
    const recommendation = state.store.coachRecommendations?.find((item) => item.id === target.dataset.id);
    if (recommendation) {
      recommendation.status = "ignored";
      recommendation.appliedAt = new Date().toISOString();
      persist();
      renderProgress();
      showToast("Recomendação ignorada.");
    }
    return;
  }

  if (action === "start-general-timer" || action === "pause-general-timer" || action === "reset-general-timer") {
    const session = getSession();
    if (action === "start-general-timer" && !session.timer.running) {
      session.timer.running = true;
      session.timer.startedAt = Date.now();
    }
    if (action === "pause-general-timer" && session.timer.running) {
      session.timer.elapsed = generalElapsed(session);
      session.timer.running = false;
      session.timer.startedAt = null;
    }
    if (action === "reset-general-timer") session.timer = { elapsed: 0, running: false, startedAt: null };
    persist();
    renderToday();
    return;
  }

  if (["start-rest-timer", "pause-rest-timer", "reset-rest-timer"].includes(action)) {
    const exercise = getPlanForDate()?.exercises.find((item) => item.id === target.dataset.exercise);
    if (!exercise) return;
    const timer = getRestTimer(exercise);
    if (action === "start-rest-timer") {
      if (timer.remaining <= 0) timer.remaining = timer.duration;
      timer.running = true;
      timer.endsAt = Date.now() + timer.remaining * 1000;
    }
    if (action === "pause-rest-timer") {
      timer.remaining = restRemaining(timer);
      timer.running = false;
      timer.endsAt = null;
    }
    if (action === "reset-rest-timer") {
      timer.remaining = timer.duration;
      timer.running = false;
      timer.endsAt = null;
    }
    renderToday();
    return;
  }

  if (action === "previous-day" || action === "next-day") {
    const direction = action === "previous-day" ? -1 : 1;
    state.selectedDate = localISO(addDays(parseISO(state.selectedDate), direction));
    renderToday();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (action === "open-date") {
    state.selectedDate = target.dataset.date;
    state.view = "today";
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (action === "finish-workout") {
    const session = getSession();
    if (session.timer.running) {
      session.timer.elapsed = generalElapsed(session);
      session.timer.running = false;
      session.timer.startedAt = null;
    }
    session.totalDuration = Math.round(generalElapsed(session));
    session.completedAt = new Date().toISOString();
    applyCoachRecommendationsForSession(state.selectedDate, session);
    persist();
    renderToday();
    showToast("Treino salvo no seu histórico.");
  }

  if (action === "export-data") {
    const content = JSON.stringify(state.store, null, 2);
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `workout-backup-${localISO(new Date())}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Dados exportados. Importe o arquivo no outro navegador.");
  }

  if (action === "import-data") {
    document.querySelector("#backup-file")?.click();
  }

  if (action === "go-plans") {
    state.view = "plans";
    render();
    return;
  }

  if (action === "new-workout") {
    startWorkoutBuilder();
    renderWorkoutBuilder();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (action === "new-sheet") {
    startSheetBuilder();
    renderSheetBuilder();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  if (action === "cancel-sheet") {
    state.sheetBuilder = null;
    renderPlanLibrary();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  if (action === "add-sheet-exercise") {
    const day = state.sheetBuilder.days[Number(target.dataset.dayIndex)];
    day.exercises.push(makeBuilderExercise(null, day.exercises.length));
    renderSheetBuilder();
    return;
  }

  if (action === "remove-sheet-exercise") {
    const day = state.sheetBuilder.days[Number(target.dataset.dayIndex)];
    day.exercises.splice(Number(target.dataset.index), 1);
    renderSheetBuilder();
    return;
  }

  if (action === "move-sheet-exercise") {
    const day = state.sheetBuilder.days[Number(target.dataset.dayIndex)];
    const index = Number(target.dataset.index);
    const destination = index + Number(target.dataset.direction);
    if (destination < 0 || destination >= day.exercises.length) return;
    const [exercise] = day.exercises.splice(index, 1);
    day.exercises.splice(destination, 0, exercise);
    renderSheetBuilder();
    return;
  }

  if (action === "request-replace-sheet") {
    state.sheetBuilder.confirming = true;
    renderSheetBuilder();
    return;
  }

  if (action === "cancel-sheet-confirm") {
    state.sheetBuilder.confirming = false;
    renderSheetBuilder();
    return;
  }

  if (action === "confirm-replace-sheet") {
    const error = replaceActivePlanFromBuilder();
    if (error) {
      state.sheetBuilder.confirming = false;
      renderSheetBuilder();
      showToast(error);
      return;
    }
    renderPlanLibrary();
    showToast("Nova ficha salva como ficha atual.");
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  if (action === "open-plan-day") {
    const weekday = Number(target.dataset.weekday);
    const monday = mondayOf(parseISO(localISO(new Date())));
    state.selectedDate = localISO(addDays(monday, (weekday + 6) % 7));
    state.view = "today";
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  if (action === "edit-plan-day") {
    const plan = state.store.activePlan.days.find((item) => item.id === target.dataset.planId);
    if (!plan) return;
    startEditWorkoutBuilder(plan);
    renderWorkoutBuilder();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  if (action === "cancel-builder") {
    state.builder = null;
    renderPlanLibrary();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (action === "add-builder-exercise") {
    state.builder.exercises.push(makeBuilderExercise(null, state.builder.exercises.length));
    renderWorkoutBuilder();
    requestAnimationFrame(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }));
  }

  if (action === "move-builder-exercise") {
    const index = Number(target.dataset.index);
    const destination = index + Number(target.dataset.direction);
    if (destination < 0 || destination >= state.builder.exercises.length) return;
    const [exercise] = state.builder.exercises.splice(index, 1);
    state.builder.exercises.splice(destination, 0, exercise);
    renderWorkoutBuilder();
    return;
  }

  if (action === "remove-builder-exercise") {
    state.builder.exercises.splice(Number(target.dataset.index), 1);
    renderWorkoutBuilder();
  }

  if (action === "save-edited-workout") {
    const builder = state.builder;
    if (!builder.title.trim()) {
      showToast("Dê um nome ao treino.");
      return;
    }
    const weekday = Number(builder.weekday);
    const collision = state.store.activePlan.days.find((plan) => Number(plan.weekday) === weekday && plan.id !== builder.sourceId);
    if (collision) {
      showToast("Já existe um treino nesse dia da semana.");
      return;
    }
    const exercises = builder.exercises.filter((exercise) => exercise.name.trim() && Number(exercise.sets) > 0);
    if (!exercises.length) {
      showToast("Adicione pelo menos um exercício válido.");
      return;
    }
    const oldPlan = state.store.activePlan.days.find((plan) => plan.id === builder.sourceId);
    if (oldPlan) state.store.planArchive.push(cloneValue(oldPlan));
    const newId = `day-${weekday}-${Date.now()}`;
    const editedPlan = normalizePlanDay({
      id: newId,
      title: builder.title.trim(),
      groups: builder.groups.trim(),
      warmupTitle: builder.warmupTitle.trim() || "Aquecimento livre",
      warmup: builder.warmup.trim() || "Faça séries leves e progressivas antes das séries válidas.",
      cardio: builder.cardio,
      exercises: exercises.map((exercise, index) => ({ ...exercise, id: `${newId}-exercise-${index + 1}`, catalogId: undefined })),
    }, weekday);
    state.store.activePlan.days = state.store.activePlan.days.filter((plan) => plan.id !== builder.sourceId);
    state.store.activePlan.days.push(editedPlan);
    state.store.activePlan.updatedAt = new Date().toISOString();
    Object.entries(state.store.sessions).forEach(([dateISO, session]) => {
      if (!session.completedAt && session.planId === builder.sourceId) delete state.store.sessions[dateISO];
    });
    state.builder = null;
    persist();
    renderPlanLibrary();
    showToast("Treino atualizado na ficha atual.");
    return;
  }

  if (action === "use-custom-plan") {
    const currentSession = state.store.sessions[state.selectedDate];
    if (currentSession?.completedAt) {
      showToast("Essa data já possui um treino concluído.");
      return;
    }
    state.store.datePlanOverrides[state.selectedDate] = target.dataset.planId;
    delete state.store.sessions[state.selectedDate];
    persist();
    state.view = "today";
    render();
    showToast("Treino aplicado à data selecionada.");
  }

  if (action === "save-custom-workout") {
    const builder = state.builder;
    if (!builder.title.trim()) {
      showToast("Dê um nome ao treino.");
      return;
    }
    if (!builder.date) {
      showToast("Escolha a data de uso.");
      return;
    }
    if (state.store.sessions[builder.date]?.completedAt) {
      showToast("A data escolhida já possui um treino concluído.");
      return;
    }
    const validExercises = builder.exercises.filter((exercise) => exercise.name.trim() && Number(exercise.sets) > 0);
    if (!validExercises.length) {
      showToast("Adicione pelo menos um exercício válido.");
      return;
    }
    const planId = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const customPlan = {
      id: planId,
      isBase: false,
      short: "NOVO",
      name: "Treino personalizado",
      title: builder.title.trim(),
      groups: builder.groups.trim(),
      warmupTitle: builder.warmupTitle.trim() || "Aquecimento livre",
      warmup: builder.warmup.trim() || "Faça séries leves e progressivas antes das séries válidas.",
      cardio: {
        intensity: builder.cardio.intensity.trim() || "Moderado",
        duration: Number(builder.cardio.duration) || 0,
        minimum: Number(builder.cardio.minimum) || 0,
        goal: Number(builder.cardio.goal) || 0,
        note: builder.cardio.note.trim(),
      },
      exercises: validExercises.map((exercise, index) => ({
        ...exercise,
        id: `${planId}-exercise-${index + 1}`,
        catalogId: undefined,
        sets: Number(exercise.sets),
        minReps: exercise.minReps == null ? null : Number(exercise.minReps),
        maxReps: exercise.maxReps == null ? null : Number(exercise.maxReps),
      })),
      createdAt: new Date().toISOString(),
    };
    state.store.customPlans.push(customPlan);
    state.store.datePlanOverrides[builder.date] = planId;
    delete state.store.sessions[builder.date];
    state.selectedDate = builder.date;
    state.builder = null;
    state.view = "today";
    persist();
    render();
    showToast("Novo treino criado e aplicado.");
  }
});

if ("serviceWorker" in navigator) {
  let reloadingForUpdate = false;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloadingForUpdate) return;
    reloadingForUpdate = true;
    window.location.reload();
  });

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then((registration) => {
        registration.update();
        window.setInterval(() => registration.update(), 60 * 60 * 1000);
      })
      .catch((error) => {
        console.warn("Modo offline indisponível neste navegador.", error);
      });
  });
}

render();
startAutoSync();
