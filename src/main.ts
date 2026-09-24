import { start, stop, resume, getElapsedMs } from "./timer/timerEngine";
import { renderSessionList } from "./ui/sessionList";
import {
  buildSession,
  getTodaySessions,
  totalMinutes,
  formatTotal,
  type StudySession,
} from "./sessions/sessionTypes";
import { loadSessions, saveSessions, loadActive, saveActive } from "./sessions/sessionStore";


interface AppState {
  isRunning: boolean;
  elapsedMs: number;
}

const state: AppState = { isRunning: false, elapsedMs: 0 };

const toggleBtn = document.querySelector<HTMLButtonElement>("#toggle-btn")!;
const timerDisplay = document.querySelector<HTMLElement>("#timer-display")!;
const todayTotal = document.querySelector<HTMLElement>("#today-total")!;
const sessionCount = document.querySelector<HTMLElement>("#session-count")!;
const sessionList = document.querySelector<HTMLElement>("#session-list")!;

// Finished sessions. Loaded from sessions.json once at startup (top-level await: the file waits for this before continuing).
const sessions: StudySession[] = await loadSessions();

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

function tick(): void {
  state.elapsedMs = getElapsedMs();
  render();
}

// Shared by a fresh Start and by recovering an unfinished session on launch.
function beginTicking(): void {
  state.isRunning = true;
  tickId = window.setInterval(tick, 250);
  tick();
}

function startTimer(): void {
  const startedAt = start();
  saveActive(startedAt).catch((err) => console.error("Could not save active session:", err));
  beginTicking();
}

function stopTimer(): void {
  if (tickId !== null) window.clearInterval(tickId);
  tickId = null;
  const { startedAt, endedAt } = stop();
  sessions.push(buildSession(startedAt, endedAt));
  // Not awaited: the UI shouldn't freeze on disk I/O. A failed save is logged, not silent.
  saveSessions(sessions).catch((err) => console.error("Could not save sessions:", err));
  // Session is finished and saved, so clear the "unfinished" marker.
  saveActive(null).catch((err) => console.error("Could not clear active session:", err));
  state.isRunning = false;
  state.elapsedMs = 0;
  render();
}

toggleBtn.addEventListener("click", () => {
  if (state.isRunning) stopTimer();
  else startTimer();
});

// Crash recovery: a saved startedAt means the last run ended without a Stop.
const unfinishedStartedAt = await loadActive();
if (unfinishedStartedAt !== null) {
  resume(unfinishedStartedAt);
  beginTicking(); // also renders, so the timer shows the recovered elapsed time immediately
}

render();


