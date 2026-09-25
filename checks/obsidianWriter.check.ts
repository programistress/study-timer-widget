// Run from study-timer/ (see chat for the 3 commands): tsc -> .check-out/, mark it commonjs, node runs it.
import assert from "node:assert";
import { addSessionsToLog } from "../src/obsidian/obsidianWriter";

const s = (date: string, start: string, end: string, duration: number) => ({ id: "x", date, start, end, duration });

// empty file -> title + section
let t = addSessionsToLog("", s("2026-09-23", "15:00", "16:25", 85));
assert.strictEqual(t, "# Study Log\n\n## ⋆𐙚₊2026-09-23\nTotal: 1h 25m\n\n- 15:00-16:25 (85 min)\n");

// same date -> appended, total recomputed
t = addSessionsToLog(t, s("2026-09-23", "17:00", "17:40", 40));
assert.strictEqual(t, "# Study Log\n\n## ⋆𐙚₊2026-09-23\nTotal: 2h 05m\n\n- 15:00-16:25 (85 min)\n- 17:00-17:40 (40 min)\n");

// duplicate -> unchanged
assert.strictEqual(addSessionsToLog(t, s("2026-09-23", "17:00", "17:40", 40)), t);

// new date -> new section, old one untouched
t = addSessionsToLog(t, s("2026-09-24", "10:00", "10:30", 30));
assert.ok(t.endsWith("\n## ⋆𐙚₊2026-09-24\nTotal: 0h 30m\n\n- 10:00-10:30 (30 min)\n"));

// earlier date section followed by another section: insert stays inside its own section
t = addSessionsToLog(t, s("2026-09-23", "20:00", "20:10", 10));
assert.ok(t.includes("- 17:00-17:40 (40 min)\n- 20:00-20:10 (10 min)\n\n## ⋆𐙚₊2026-09-24"));
assert.ok(t.includes("Total: 2h 15m"));

// junk file with no heading -> kept, section appended; CRLF handled
t = addSessionsToLog("my notes\r\nhello", s("2026-09-23", "15:00", "15:10", 10));
assert.ok(t.startsWith("my notes\r\nhello\n\n## ⋆𐙚₊2026-09-23"));

// heading with nothing under it
t = addSessionsToLog("## ⋆𐙚₊2026-09-23\n", s("2026-09-23", "15:00", "15:10", 10));
assert.strictEqual(t, "## ⋆𐙚₊2026-09-23\nTotal: 0h 10m\n\n- 15:00-15:10 (10 min)\n");

console.log("all ok");
