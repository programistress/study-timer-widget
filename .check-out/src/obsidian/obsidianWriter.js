"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatEntry = formatEntry;
exports.addSessionsToLog = addSessionsToLog;
const sessionTypes_1 = require("../sessions/sessionTypes");
// StudySession -> "- 15:00-16:25 (85 min)"
function formatEntry(session) {
    return `- ${session.start}-${session.end} (${session.duration} min)`;
}
// ["- 15:00-16:25 (85 min)", "- 17:00-17:40 (40 min)"] -> 125
function sumMinutes(entryLines) {
    return entryLines.reduce((sum, line) => {
        const m = line.match(/\((\d+) min\)/);
        return sum + (m ? Number(m[1]) : 0);
    }, 0);
}
function addSessionsToLog(oldText, session) {
    const lines = oldText.split(/\r?\n/); // "a\nb" -> ["a", "b"]
    const heading = `## ⋆𐙚₊${session.date}`;
    const h = lines.indexOf(heading);
    if (h === -1) {
        const base = oldText.trim() === "" ? "# Study Log" : oldText.trimEnd();
        return `${base}\n\n${heading}\nTotal: ${(0, sessionTypes_1.formatTotal)(session.duration)}\n\n${formatEntry(session)}\n`;
    }
    // Case B: section exists. It runs from h to the next "## " heading (or end of file).
    const next = lines.findIndex((l, i) => i > h && l.startsWith("## "));
    const end = next === -1 ? lines.length : next;
    const entries = lines.slice(h + 1, end).filter((l) => l.startsWith("- "));
    const entry = formatEntry(session);
    if (entries.includes(entry))
        return oldText; // duplicate
    const total = `Total: ${(0, sessionTypes_1.formatTotal)(sumMinutes([...entries, entry]))}`;
    if (lines[h + 1]?.startsWith("Total:"))
        lines[h + 1] = total;
    else
        lines.splice(h + 1, 0, total); // heading without a Total line: add one
    // Find the last entry line (indexes may have shifted above, so search again).
    let last = h + 1;
    for (let i = h + 2; i < lines.length && !lines[i].startsWith("## "); i++) {
        if (lines[i].startsWith("- "))
            last = i;
    }
    // No entries yet -> a blank line must separate the Total from the first entry.
    lines.splice(last + 1, 0, ...(last === h + 1 ? ["", entry] : [entry]));
    return lines.join("\n").trimEnd() + "\n";
}
