"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDate = formatDate;
exports.buildSession = buildSession;
exports.getTodaySessions = getTodaySessions;
exports.totalMinutes = totalMinutes;
exports.formatTotal = formatTotal;
const pad = (n) => String(n).padStart(2, "0");
// Local-time getters on purpose: toISOString() would give UTC and can flip the date near midnight.
function formatDate(d) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function formatTime(d) {
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
// Pure: two timestamps in (ms since epoch), one session out.
function buildSession(startedAt, endedAt) {
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
function getTodaySessions(sessions) {
    const today = formatDate(new Date());
    return sessions.filter((s) => s.date === today);
}
function totalMinutes(sessions) {
    return sessions.reduce((sum, s) => sum + s.duration, 0);
}
// 125 -> "2h 05m"
function formatTotal(minutes) {
    return `${Math.floor(minutes / 60)}h ${pad(minutes % 60)}m`;
}
