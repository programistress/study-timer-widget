import { Command } from "@tauri-apps/plugin-shell";
import type { StudySession } from "../sessions/sessionTypes";


// GIT_TERMINAL_PROMPT=0: fail instead of hanging if git asks for a password.
function git(name: string, args: string[], cwd: string) {
  return Command.create(name, args, { cwd, env: { GIT_TERMINAL_PROMPT: "0" } }).execute();
}

// Throws on any problem; the caller logs it. A failed push never undoes the commit.
export async function commitSession(vaultPath: string, session: StudySession, push: boolean): Promise<void> {
  const prefix = await git("git-prefix", ["rev-parse", "--show-prefix"], vaultPath);
  if (prefix.code !== 0) throw new Error("Vault is not a git repository");
  if (prefix.stdout.trim() !== "") throw new Error("Vault is inside a larger repo; not committing");

  const add = await git("git-add", ["add", "-A"], vaultPath);
  if (add.code !== 0) throw new Error(`git add failed: ${add.stderr}`);

  const message = `Study: ${session.date} ${session.start}-${session.end}`;
  const commit = await git("git-commit", ["commit", "-m", message], vaultPath);
  if (commit.code !== 0) {
    if (/nothing to commit/.test(commit.stdout)) return;
    throw new Error(`git commit failed: ${commit.stderr || commit.stdout}`); // e.g. no user.name/email
  }

  if (!push) return;
  const pushed = await git("git-push", ["push"], vaultPath);
  if (pushed.code !== 0) throw new Error(`Committed, but push failed: ${pushed.stderr}`);
}
