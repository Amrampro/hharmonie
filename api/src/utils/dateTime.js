export function toMysqlDateTime(value) {
  if (value === null || value === undefined || value === "") return null;
  const text = String(value).trim();
  // Preserve wall time from datetime-local; normalize timezone-bearing ISO dates to UTC.
  const local = text.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(?::(\d{2}))?$/);
  const iso = local ? `${local[1]}T${local[2]}:${local[3] || "00"}Z` : text;
  if (!local && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(text)) {
    throw Object.assign(new Error("Date invalide."), { statusCode: 400 });
  }
  const wallTime = local ? iso.slice(0, 19) : text.slice(0, 19);
  const calendarDate = new Date(`${wallTime}Z`);
  if (!Number.isFinite(calendarDate.getTime()) || calendarDate.toISOString().slice(0, 19) !== wallTime || Number(text.slice(0, 4)) < 1000) {
    throw Object.assign(new Error("Date invalide."), { statusCode: 400 });
  }
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime()) || (local && date.toISOString().slice(0, 19) !== iso.slice(0, 19))) {
    throw Object.assign(new Error("Date invalide."), { statusCode: 400 });
  }
  return date.toISOString().slice(0, 19).replace("T", " ");
}
