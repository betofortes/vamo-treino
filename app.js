const STORAGE_KEY = "vamo-training-v1";
const CYCLE_START = "2026-06-22";
const CARDIO_MINIMUM = 1400;
const CARDIO_LONG_TERM = 2400;

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

const state = {
  view: "today",
  selectedDate: localISO(new Date()),
  store: loadStore(),
};

const app = document.querySelector("#app");
const toast = document.querySelector("#toast");
let toastTimer;

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

function defaultStore() {
  const seed = {
    version: 1,
    sessions: {},
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
    exerciseLogs,
    cardio: { duration: "12", distance: "1400" },
    notes: "Todos os exercícios realizados ficaram dentro da faixa indicada. Crunch na polia não realizado.",
    completedAt: "2026-06-23T20:00:00-03:00",
  };

  return seed;
}

function loadStore() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.store));
}

function getPlanForDate(dateISO = state.selectedDate) {
  return workoutPlan[parseISO(dateISO).getDay()];
}

function makeBlankSession(dateISO) {
  const plan = getPlanForDate(dateISO);
  return {
    dayId: parseISO(dateISO).getDay(),
    exerciseLogs: Object.fromEntries(
      plan.exercises.map((exercise) => [
        exercise.id,
        Array.from({ length: exercise.sets }, () => ({ load: "", reps: "", done: false })),
      ]),
    ),
    cardio: { duration: "12", distance: "" },
    notes: "",
    completedAt: null,
  };
}

function getSession(dateISO = state.selectedDate, create = true) {
  if (!state.store.sessions[dateISO] && create) {
    state.store.sessions[dateISO] = makeBlankSession(dateISO);
  }
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

function latestPreviousExercise(dateISO, exerciseId) {
  return Object.entries(state.store.sessions)
    .filter(([date, session]) => date < dateISO && session.exerciseLogs?.[exerciseId]?.some((set) => set.done))
    .sort(([a], [b]) => b.localeCompare(a))[0]?.[1]?.exerciseLogs?.[exerciseId];
}

function previousSummary(dateISO, exercise) {
  const sets = latestPreviousExercise(dateISO, exercise.id);
  if (!sets) return "Primeiro registro";
  const completed = sets.filter((set) => set.done);
  const loads = [...new Set(completed.map((set) => set.load).filter(Boolean))];
  const reps = completed.map((set) => set.reps).filter(Boolean);
  const loadText = loads.length ? `${loads.join(" / ")} ${exercise.loadUnit === "livre" ? "" : exercise.loadUnit}`.trim() : "carga não informada";
  return reps.length ? `Último: ${loadText} · reps ${reps.join("/")}` : `Último: ${loadText}`;
}

function shouldProgress(exercise, logs) {
  if (!exercise.maxReps || !logs?.length) return false;
  return logs.every((set) => set.done && Number(set.reps) >= exercise.maxReps);
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

function renderExercise(exercise, index, session) {
  const logs = session.exerciseLogs[exercise.id];
  const isComplete = logs.every((set) => set.done);
  const suggestion = shouldProgress(exercise, logs);

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
          <div class="previous-label">${previousSummary(state.selectedDate, exercise)}</div>
        </div>
      </div>
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

function renderToday() {
  const plan = getPlanForDate();
  const session = getSession();
  const cycle = getCycleInfo(state.selectedDate);
  const doneSets = completedSets(plan, session);
  const allSets = totalSets(plan);
  const completion = Math.round((doneSets / allSets) * 100);
  const dateContext = isToday(state.selectedDate) ? "Hoje" : plan.name;
  const distance = Number(session.cardio.distance) || 0;
  const cardioProgress = Math.min(100, Math.round((distance / CARDIO_MINIMUM) * 100));

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
        <span class="stat-pill">12 min de cardio</span>
        <span class="stat-pill">${doneSets}/${allSets} concluídas</span>
      </div>
    </section>

    <div class="progress-strip">
      <div class="progress-strip-header"><span>Progresso do treino</span><strong>${completion}%</strong></div>
      <div class="progress-track"><div class="progress-fill" style="width: ${completion}%"></div></div>
    </div>

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
        </div>
        <div class="progress-strip" style="margin-top: 15px; padding: 0; border: 0; background: transparent">
          <div class="progress-strip-header"><span>Meta mínima: ${CARDIO_MINIMUM.toLocaleString("pt-BR")} m</span><strong>${cardioProgress}%</strong></div>
          <div class="progress-track"><div class="progress-fill" style="width: ${cardioProgress}%"></div></div>
        </div>
        <div class="cardio-goal"><span>Objetivo de longo prazo</span><strong>${CARDIO_LONG_TERM.toLocaleString("pt-BR")} m</strong></div>
      </div>
    </section>

    <section class="section">
      <div class="notes-card">
        <label for="session-notes">Observações e substituições</label>
        <textarea id="session-notes" placeholder="Como foi o treino? Trocou algum exercício?" data-action="notes">${escapeAttribute(session.notes)}</textarea>
      </div>
      <button class="primary-button ${session.completedAt ? "is-saved" : ""}" type="button" data-action="finish-workout">
        ${session.completedAt ? `${checkIcon()} Treino salvo` : "Concluir e salvar treino"}
      </button>
    </section>
  `;
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
  const completed = dates.filter((date) => state.store.sessions[date]?.completedAt).length;

  app.innerHTML = `
    <header class="view-header">
      <p class="eyebrow">Seu cronograma</p>
      <h1>Semana ${cycle.week}</h1>
      <p>Bloco ${cycle.block}: ${cycle.blockLabel.toLowerCase()}. ${completed} de 7 sessões registradas nesta semana.</p>
    </header>
    <div class="progress-strip">
      <div class="progress-strip-header"><span>Consistência semanal</span><strong>${completed}/7</strong></div>
      <div class="progress-track"><div class="progress-fill" style="width: ${(completed / 7) * 100}%"></div></div>
    </div>
    <section class="week-list" aria-label="Treinos da semana">
      ${dates
        .map((dateISO) => {
          const date = parseISO(dateISO);
          const plan = workoutPlan[date.getDay()];
          const session = state.store.sessions[dateISO];
          const dateParts = formatShortDate(dateISO);
          const setsDone = completedSets(plan, session);
          const setsTotal = totalSets(plan);
          return `
            <button class="week-card ${isToday(dateISO) ? "is-today" : ""}" type="button" data-action="open-date" data-date="${dateISO}">
              <span class="week-day"><span>${plan.short}</span><strong>${dateParts.day}</strong></span>
              <span class="week-info"><h3>${plan.title}</h3><p>${setsDone ? `${setsDone}/${setsTotal} séries · ` : ""}${plan.cardio.intensity}</p></span>
              <span class="status-dot ${session?.completedAt ? "is-complete" : ""}">${session?.completedAt ? checkIcon() : "→"}</span>
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

function renderProgress() {
  const sessions = completedSessions();
  const cardioDistances = sessions.map(([, session]) => Number(session.cardio?.distance) || 0).filter(Boolean);
  const bestDistance = cardioDistances.length ? Math.max(...cardioDistances) : 0;
  const totalSetsDone = sessions.reduce((total, [dateISO, session]) => total + completedSets(getPlanForDate(dateISO), session), 0);
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
                  const plan = getPlanForDate(dateISO);
                  const date = formatShortDate(dateISO);
                  const done = completedSets(plan, session);
                  return `<article class="history-item"><div class="history-date"><strong>${date.day}</strong><span>${date.month}</span></div><div class="history-info"><h3>${plan.title}</h3><p>${done} séries concluídas</p></div><span class="history-distance">${session.cardio?.distance ? `${Number(session.cardio.distance).toLocaleString("pt-BR")} m` : "—"}</span></article>`;
                })
                .join("")
            : `<div class="empty-card"><strong>Nenhum treino registrado</strong>Seu histórico aparecerá aqui após a primeira sessão.</div>`
        }
      </div>
    </section>
    <section class="section">
      <div class="section-heading"><div><p class="eyebrow">Privacidade</p><h2>Seus dados</h2></div></div>
      <div class="data-card">
        <div>
          <h3>Armazenados neste aparelho</h3>
          <p>O Vamo funciona sem mensalidade e não envia seus treinos para servidores externos. Exporte um backup quando quiser trocar de aparelho.</p>
        </div>
        <div class="data-actions">
          <button class="secondary-button" type="button" data-action="export-data">Exportar backup</button>
          <button class="secondary-button" type="button" data-action="import-data">Importar backup</button>
          <input class="sr-only" id="backup-file" type="file" accept="application/json,.json" data-action="backup-file" />
        </div>
      </div>
    </section>
  `;
}

function render() {
  document.querySelectorAll(".nav-item").forEach((button) => {
    const active = button.dataset.view === state.view;
    button.classList.toggle("is-active", active);
    button.toggleAttribute("aria-current", active);
  });

  if (state.view === "week") renderWeek();
  else if (state.view === "progress") renderProgress();
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
  const session = getSession();

  if (action === "set-input") {
    session.exerciseLogs[target.dataset.exercise][Number(target.dataset.set)][target.dataset.field] = target.value;
  } else if (action === "cardio") {
    session.cardio[target.dataset.field] = target.value;
  } else if (action === "notes") {
    session.notes = target.value;
  }
  persist();
});

app.addEventListener("change", (event) => {
  const target = event.target;
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
  session.completedAt = null;
  persist();
  const scrollPosition = window.scrollY;
  renderToday();
  requestAnimationFrame(() => window.scrollTo(0, scrollPosition));
});

app.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;

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
    session.completedAt = new Date().toISOString();
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
    link.download = `vamo-backup-${localISO(new Date())}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Backup exportado.");
  }

  if (action === "import-data") {
    document.querySelector("#backup-file")?.click();
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.warn("Modo offline indisponível neste navegador.", error);
    });
  });
}

render();
