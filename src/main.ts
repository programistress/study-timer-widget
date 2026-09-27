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
import { open } from "@tauri-apps/plugin-dialog";
import { loadSettings, saveSettings } from "./settings/settingsStore";
import { saveSessionToVault } from "./obsidian/obsidianWriter";
import { commitSession } from "./git/gitService";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";


interface AppState {
  isRunning: boolean;
  elapsedMs: number;
}

const state: AppState = { isRunning: false, elapsedMs: 0 };

const toggleBtn = document.querySelector<HTMLButtonElement>("#toggle-btn")!;
const timerDisplay = document.querySelector<HTMLElement>("#timer-display")!;
const todayTotal = document.querySelector<HTMLElement>("#today-total")!;
const sessionList = document.querySelector<HTMLElement>("#session-list")!;

// Finished sessions. Loaded from sessions.json once at startup
const sessions: StudySession[] = await loadSessions();

let tickId: number | null = null;

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
  renderSessionList(sessionList, today);
}

function tick(): void {
  state.elapsedMs = getElapsedMs();
  render();
}

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
  const session = buildSession(startedAt, endedAt);
  sessions.push(session);
  saveSessions(sessions).catch((err) => console.error("Could not save sessions:", err));
  if (settings.vaultPath !== null) {
    const vault = settings.vaultPath;
    // Commit only after the log file is written, or the commit would miss the entry.
    saveSessionToVault(vault, session)
      .then(() => (settings.autoCommit ? commitSession(vault, session, settings.autoPush) : undefined))
      .catch((err) => console.error("Vault write / git failed:", err));
  }
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
  beginTicking();
}

render();

const vaultBtn = document.querySelector<HTMLButtonElement>("#vault-btn")!;
const vaultPath = document.querySelector<HTMLElement>("#vault-path")!;

const settings = await loadSettings();

function renderVault(): void {
  vaultPath.textContent = settings.vaultPath ?? "No vault chosen";
  vaultPath.title = settings.vaultPath ?? ""; // full path on hover, since the text itself is truncated with an ellipsis
}

async function chooseVault(): Promise<void> {
  const picked = await open({ directory: true });
  if (picked === null) return;
  settings.vaultPath = picked;
  await saveSettings(settings);
  renderVault();
}

vaultBtn.addEventListener("click", () => {
  chooseVault().catch((err) => console.error("Could not choose vault:", err));
});

renderVault();

const autoCommit = document.querySelector<HTMLInputElement>("#auto-commit")!;
const autoPush = document.querySelector<HTMLInputElement>("#auto-push")!;

function renderGitToggles(): void {
  autoCommit.checked = settings.autoCommit;
  autoPush.checked = settings.autoPush;
  autoPush.disabled = !settings.autoCommit; // push only makes sense after a commit
}

autoCommit.addEventListener("change", () => {
  settings.autoCommit = autoCommit.checked;
  saveSettings(settings).catch((err) => console.error("Could not save settings:", err));
  renderGitToggles();
});
autoPush.addEventListener("change", () => {
  settings.autoPush = autoPush.checked;
  saveSettings(settings).catch((err) => console.error("Could not save settings:", err));
});

renderGitToggles();

// Window controls — the titlebar is our own art, so minimize/maximize/close
// need to be wired by hand via IPC instead of the OS doing it for free.
const win = getCurrentWindow();

document.querySelector<HTMLButtonElement>("#win-minimize")!.addEventListener("click", () => {
  win.minimize();
});
document.querySelector<HTMLButtonElement>("#win-maximize")!.addEventListener("click", () => {
  win.toggleMaximize();
});
document.querySelector<HTMLButtonElement>("#win-close")!.addEventListener("click", () => {
  win.close();
});

// Tauri has no built-in "lock aspect ratio" resize — so instead we let the OS
// resize freely, then snap the height back to match the width on every
// resize event, keeping the wrapper art from ever looking stretched.
// ponytail: corrects after the fact rather than clamping live like a native
// aspect-locked resize; upgrade path is a platform-specific window hook if
// the post-drag snap ever feels wrong.
const FRAME_ASPECT_RATIO = 1317 / 1194; // width / height of app-frame.png
let resizingSelf = false;

win.onResized(async ({ payload: size }) => {
  if (resizingSelf) return;
  const logical = size.toLogical(await win.scaleFactor());
  const correctedHeight = logical.width / FRAME_ASPECT_RATIO;
  if (Math.abs(correctedHeight - logical.height) < 1) return;
  resizingSelf = true;
  await win.setSize(new LogicalSize(logical.width, correctedHeight));
  resizingSelf = false;
});

// Hamburger menu: everything that isn't the core timer lives behind it.
const hamburgerBtn = document.querySelector<HTMLButtonElement>("#hamburger-btn")!;
const hamburgerMenu = document.querySelector<HTMLElement>("#hamburger-menu")!;

hamburgerBtn.addEventListener("click", () => {
  hamburgerMenu.classList.toggle("hidden");
});

const alwaysOnTop = document.querySelector<HTMLInputElement>("#always-on-top")!;
alwaysOnTop.checked = settings.alwaysOnTop;
win.setAlwaysOnTop(settings.alwaysOnTop);

alwaysOnTop.addEventListener("change", () => {
  settings.alwaysOnTop = alwaysOnTop.checked;
  win.setAlwaysOnTop(alwaysOnTop.checked);
  saveSettings(settings).catch((err) => console.error("Could not save settings:", err));
});
