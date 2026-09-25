import { formatTotal, type StudySession } from "../sessions/sessionTypes";
import { join } from "@tauri-apps/api/path";
import { exists, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";

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
  const heading = `## ⋆𐙚₊${session.date}`;
  const h = lines.indexOf(heading);
  if (h === -1) {
    const base = oldText.trim() === "" ? "# Study Log" : oldText.trimEnd();
    return `${base}\n\n${heading}\nTotal: ${formatTotal(session.duration)}\n\n${formatEntry(session)}\n`;
  }
  const next = lines.findIndex((l, i) => i > h && l.startsWith("## "));
  const end = next === -1 ? lines.length : next;
  const entries = lines.slice(h + 1, end).filter((l) => l.startsWith("- "));
  const entry = formatEntry(session);
  if (entries.includes(entry)) return oldText; 

  const total = `Total: ${formatTotal(sumMinutes([...entries, entry]))}`;
  if (lines[h + 1]?.startsWith("Total:")) lines[h + 1] = total;
  else lines.splice(h + 1, 0, total); 
  let last = h + 1;
  for (let i = h + 2; i < lines.length && !lines[i].startsWith("## "); i++) {
    if (lines[i].startsWith("- ")) last = i;
  }
  lines.splice(last + 1, 0, ...(last === h + 1 ? ["", entry] : [entry]));

  return lines.join("\n").trimEnd() + "\n";
}

export async function saveSessionToVault(vaultPath: string, session: StudySession): Promise<void> {
  const file = await join(vaultPath, "Study Log.md");
  const oldText = (await exists(file)) ? await readTextFile(file) : "";
  const newText = addSessionsToLog(oldText, session);
  await writeTextFile(file, newText);
}


