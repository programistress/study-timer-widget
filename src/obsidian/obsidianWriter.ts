import { formatTotal, type StudySession } from "../sessions/sessionTypes";
import { join } from "@tauri-apps/api/path";
import { exists, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";

const TITLE = "# Study Log ꒰ᐢ. .ᐢ꒱₊˚⊹";

function dateHeading(date: string): string {
  return `## ⋆𐙚₊ ${date} ⊹♡`;
}

function totalLine(minutes: number): string {
  return `Total: ⊹ ࣪ ˖꒰ঌ ${formatTotal(minutes)} ໒꒱.⋆˚࿔`;
}

export function formatEntry(session: StudySession): string {
  return `- ${session.start}-${session.end} (${session.duration} min)`;
}

function sumMinutes(entryLines: string[]): number {
  return entryLines.reduce((sum, line) => {
    const m = line.match(/\((\d+) min\)/);
    return sum + (m ? Number(m[1]) : 0);
  }, 0);
}

export function addSessionsToLog(
  oldText: string,
  session: StudySession,
): string {
  const lines = oldText.split(/\r?\n/); // "a\nb" -> ["a", "b"]
  const heading = dateHeading(session.date);
  const entry = formatEntry(session);
  const h = lines.indexOf(heading);
  if (h === -1) {
    const base = oldText.trim() === "" ? TITLE : oldText.trimEnd();
    return `${base}\n\n${heading}\n\n${entry}\n\n${totalLine(session.duration)}\n`;
  }
  const next = lines.findIndex((l, i) => i > h && l.startsWith("## "));
  const end = next === -1 ? lines.length : next;
  const entries = lines.slice(h + 1, end).filter((l) => l.startsWith("- "));
  if (entries.includes(entry)) return oldText;
  entries.push(entry);

  lines.splice(h, end - h, heading, "", ...entries, "", totalLine(sumMinutes(entries)));
  return lines.join("\n").trimEnd() + "\n";
}

export async function saveSessionToVault(vaultPath: string, session: StudySession): Promise<void> {
  const file = await join(vaultPath, "Study Log.md");
  const oldText = (await exists(file)) ? await readTextFile(file) : "";
  const newText = addSessionsToLog(oldText, session);
  await writeTextFile(file, newText);
}


