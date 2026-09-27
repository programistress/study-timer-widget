import { BaseDirectory, exists, mkdir, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";

export interface Settings {
  vaultPath: string | null; // null = no vault chosen yet
  autoCommit: boolean;
  autoPush: boolean; // only used when autoCommit is on
  alwaysOnTop: boolean;
}

const defaults: Settings = { vaultPath: null, autoCommit: false, autoPush: false, alwaysOnTop: false };

const FILE = "settings.json";
const inAppData = { baseDir: BaseDirectory.AppData };

export async function loadSettings(): Promise<Settings> {
  if (!(await exists(FILE, inAppData))) return { ...defaults };
  const text = await readTextFile(FILE, inAppData);
  return { ...defaults, ...JSON.parse(text) }; // old files lack the new fields
}

export async function saveSettings(settings: Settings): Promise<void> {
  await mkdir("", { ...inAppData, recursive: true });
  await writeTextFile(FILE, JSON.stringify(settings, null, 2), inAppData);
}
