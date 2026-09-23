let startedAt: number | null = null;

export function start(): void {
  startedAt = Date.now();
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
