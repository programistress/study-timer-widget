import { BaseDirectory, exists, mkdir, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";

export interface Settings {
  vaultPath: string | null; // null = no vault chosen yet
}

const FILE = "settings.json";
const inAppData = { baseDir: BaseDirectory.AppData };

export async function loadSettings(): Promise<Settings> {
  if (!(await exists(FILE, inAppData))) return { vaultPath: null };
  const text = await readTextFile(FILE, inAppData);
  return JSON.parse(text) as Settings;
}

export async function saveSettings(settings: Settings): Promise<void> {
  await mkdir("", { ...inAppData, recursive: true });
  await writeTextFile(FILE, JSON.stringify(settings, null, 2), inAppData);
}
