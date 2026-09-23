import { formatTotal, type StudySession } from "../sessions/sessionTypes";

// Wipe the list and rebuild it
export function renderSessionList(list: HTMLElement, sessions: StudySession[]): void {
  list.replaceChildren();
  for (const s of sessions) {
    const li = document.createElement("li");
    li.textContent = `${s.start}–${s.end} · ${formatTotal(s.duration)}`;
    list.append(li);
  }
}
