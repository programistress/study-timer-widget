export interface StudySession {
  id: string;
  date: string; // "2026-09-23"
  start: string; // "15:00"
  end: string; // "16:25"
  duration: number; // minutes
}

const pad = (n: number): string => String(n).padStart(2, "0");

// Local-time getters on purpose: toISOString() would give UTC and can flip the date near midnight.
export function formatDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatTime(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Pure: two timestamps in (ms since epoch), one session out.
export function buildSession(startedAt: number, endedAt: number): StudySession {
  const startDate = new Date(startedAt);
  const endDate = new Date(endedAt);
  return {
    id: crypto.randomUUID(),
    date: formatDate(startDate),
    start: formatTime(startDate),
    end: formatTime(endDate),
    duration: Math.round((endedAt - startedAt) / 60000),
  };
}

export function getTodaySessions(sessions: StudySession[]): StudySession[] {
  const today = formatDate(new Date());
  return sessions.filter((s) => s.date === today);
}

export function totalMinutes(sessions: StudySession[]): number {
  return sessions.reduce((sum, s) => sum + s.duration, 0);
}

// 125 -> "2h 05m"
export function formatTotal(minutes: number): string {
  return `${Math.floor(minutes / 60)}h ${pad(minutes % 60)}m`;
}
