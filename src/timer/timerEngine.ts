let startedAt: number | null = null;

// Returns the timestamp so the caller can persist it.
export function start(): number {
  startedAt = Date.now();
  return startedAt;
}

// Restore a session that was running before the app closed: same startedAt, so elapsed is correct instantly.
export function resume(previousStartedAt: number): void {
  startedAt = previousStartedAt;
}

export function getElapsedMs(): number {
  return startedAt === null ? 0 : Date.now() - startedAt;
}

// Returns both timestamps
export function stop(): { startedAt: number; endedAt: number } {
  if (startedAt === null) throw new Error("stop() called while not running");
  const result = { startedAt, endedAt: Date.now() };
  startedAt = null;
  return result;
}
