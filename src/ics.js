// Builds a single event in iCalendar format (RFC 5545), the format iCloud stores.
import { randomUUID } from "node:crypto";

const utc = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

// Escape text values so user input can never inject extra iCalendar properties.
const esc = (s) =>
  String(s)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n");

// Fold lines longer than 75 octets (RFC 5545 §3.1) without splitting UTF-8 characters.
function fold(line) {
  const parts = [];
  let current = "";
  let limit = 75;
  for (const ch of line) {
    if (Buffer.byteLength(current + ch) > limit) {
      parts.push(current);
      current = ch;
      limit = 74; // continuation lines start with a space
    } else {
      current += ch;
    }
  }
  parts.push(current);
  return parts.join("\r\n ");
}

/**
 * @param {{title: string, start: Date, end: Date, notes?: string, location?: string, alarmMinutesBefore?: number}} e
 * @returns {{uid: string, ics: string}}
 */
export function buildEvent(e) {
  const uid = `${randomUUID()}@claude-connector-apple-calendar`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//claude-connector-apple-calendar//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${utc(new Date())}`,
    `DTSTART:${utc(e.start)}`,
    `DTEND:${utc(e.end)}`,
    `SUMMARY:${esc(e.title)}`,
  ];
  if (e.notes) lines.push(`DESCRIPTION:${esc(e.notes)}`);
  if (e.location) lines.push(`LOCATION:${esc(e.location)}`);
  if (e.alarmMinutesBefore != null) {
    lines.push(
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${esc(e.title)}`,
      `TRIGGER:-PT${Math.round(e.alarmMinutesBefore)}M`,
      "END:VALARM"
    );
  }
  lines.push("END:VEVENT", "END:VCALENDAR");
  return { uid, ics: lines.map(fold).join("\r\n") + "\r\n" };
}
