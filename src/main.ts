import { start, stop, getElapsedMs } from "./timer/timerEngine";
import { renderSessionList } from "./ui/sessionList";
import {
  buildSession,
  getTodaySessions,
  totalMinutes,
  formatTotal,
  type StudySession,
} from "./sessions/sessionTypes";


interface AppState {
  isRunning: boolean;
  elapsedMs: number;
}

const state: AppState = { isRunning: false, elapsedMs: 0 };

// Finished sessions, in memory only. Lost on close until Phase 5 (persistence).
const sessions: StudySession[] = [];

const toggleBtn = document.querySelector<HTMLButtonElement>("#toggle-btn")!;
const timerDisplay = document.querySelector<HTMLElement>("#timer-display")!;
const todayTotal = document.querySelector<HTMLElement>("#today-total")!;
const sessionCount = document.querySelector<HTMLElement>("#session-count")!;
const sessionList = document.querySelector<HTMLElement>("#session-list")!;

// setInterval gives back an id; we keep it so we can cancel the interval on stop.
let tickId: number | null = null;

// 5025000 ms -> "01:23:45"
function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

function render(): void {
  toggleBtn.textContent = state.isRunning ? "STOP STUDYING" : "START STUDYING";
  timerDisplay.textContent = formatElapsed(state.elapsedMs);

  const today = getTodaySessions(sessions);
  todayTotal.textContent = `Today: ${formatTotal(totalMinutes(today))}`;
  sessionCount.textContent = `${today.length} ${today.length === 1 ? "session" : "sessions"}`;
  renderSessionList(sessionList, today);
}

// Tick = "the clock moved, redraw". The value comes from the engine, not from counting ticks.
function tick(): void {
  state.elapsedMs = getElapsedMs();
  render();
}

function startTimer(): void {
  start();
  state.isRunning = true;
  tickId = window.setInterval(tick, 250);
  tick();
}

function stopTimer(): void {
  if (tickId !== null) window.clearInterval(tickId);
  tickId = null;
  const { startedAt, endedAt } = stop();
  sessions.push(buildSession(startedAt, endedAt));
  state.isRunning = false;
  state.elapsedMs = 0;
  render();
}

toggleBtn.addEventListener("click", () => {
  if (state.isRunning) stopTimer();
  else startTimer();
});

render();


