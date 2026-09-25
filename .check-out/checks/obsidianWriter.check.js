"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Run from study-timer/ (see chat for the 3 commands): tsc -> .check-out/, mark it commonjs, node runs it.
const node_assert_1 = __importDefault(require("node:assert"));
const obsidianWriter_1 = require("../src/obsidian/obsidianWriter");
const s = (date, start, end, duration) => ({ id: "x", date, start, end, duration });
// empty file -> title + section
let t = (0, obsidianWriter_1.addSessionsToLog)("", s("2026-09-23", "15:00", "16:25", 85));
node_assert_1.default.strictEqual(t, "# Study Log\n\n## ⋆𐙚₊2026-09-23\nTotal: 1h 25m\n\n- 15:00-16:25 (85 min)\n");
// same date -> appended, total recomputed
t = (0, obsidianWriter_1.addSessionsToLog)(t, s("2026-09-23", "17:00", "17:40", 40));
node_assert_1.default.strictEqual(t, "# Study Log\n\n## ⋆𐙚₊2026-09-23\nTotal: 2h 05m\n\n- 15:00-16:25 (85 min)\n- 17:00-17:40 (40 min)\n");
// duplicate -> unchanged
node_assert_1.default.strictEqual((0, obsidianWriter_1.addSessionsToLog)(t, s("2026-09-23", "17:00", "17:40", 40)), t);
// new date -> new section, old one untouched
t = (0, obsidianWriter_1.addSessionsToLog)(t, s("2026-09-24", "10:00", "10:30", 30));
node_assert_1.default.ok(t.endsWith("\n## ⋆𐙚₊2026-09-24\nTotal: 0h 30m\n\n- 10:00-10:30 (30 min)\n"));
// earlier date section followed by another section: insert stays inside its own section
t = (0, obsidianWriter_1.addSessionsToLog)(t, s("2026-09-23", "20:00", "20:10", 10));
node_assert_1.default.ok(t.includes("- 17:00-17:40 (40 min)\n- 20:00-20:10 (10 min)\n\n## ⋆𐙚₊2026-09-24"));
node_assert_1.default.ok(t.includes("Total: 2h 15m"));
// junk file with no heading -> kept, section appended; CRLF handled
t = (0, obsidianWriter_1.addSessionsToLog)("my notes\r\nhello", s("2026-09-23", "15:00", "15:10", 10));
node_assert_1.default.ok(t.startsWith("my notes\r\nhello\n\n## ⋆𐙚₊2026-09-23"));
// heading with nothing under it
t = (0, obsidianWriter_1.addSessionsToLog)("## ⋆𐙚₊2026-09-23\n", s("2026-09-23", "15:00", "15:10", 10));
node_assert_1.default.strictEqual(t, "## ⋆𐙚₊2026-09-23\nTotal: 0h 10m\n\n- 15:00-15:10 (10 min)\n");
console.log("all ok");
