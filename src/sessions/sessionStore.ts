import { BaseDirectory, exists, mkdir, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import type { StudySession } from "./sessionTypes";

const FILE = "sessions.json";
const inAppData = { baseDir: BaseDirectory.AppData };

export async function loadSessions(): Promise<StudySession[]> {
  if (!(await exists(FILE, inAppData))) return [];
  const text = await readTextFile(FILE, inAppData);
  return JSON.parse(text) as StudySession[];
}

async function ensureAppDataDir(): Promise<void> {
  await mkdir("", { ...inAppData, recursive: true });
}

export async function saveSessions(sessions: StudySession[]): Promise<void> {
  await ensureAppDataDir();
  await writeTextFile(FILE, JSON.stringify(sessions, null, 2), inAppData);
}

const ACTIVE_FILE = "active.json";

export async function loadActive(): Promise<number | null> {
  if (!(await exists(ACTIVE_FILE, inAppData))) return null;
  const text = await readTextFile(ACTIVE_FILE, inAppData);
  return JSON.parse(text) as number | null;
}

// Called with a timestamp on Start and with null on Stop.
export async function saveActive(startedAt: number | null): Promise<void> {
  await ensureAppDataDir();
  await writeTextFile(ACTIVE_FILE, JSON.stringify(startedAt), inAppData);
}
