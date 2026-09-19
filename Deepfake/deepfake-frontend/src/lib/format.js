export const isNum = (v) => v !== null && v !== undefined && v !== "" && Number.isFinite(Number(v));

export function fmtNum(v, digits = 1, suffix = "") {
  return isNum(v) ? `${Number(v).toFixed(digits)}${suffix}` : "—";
}

export function fmtBytes(bytes) {
  if (!isNum(bytes)) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let n = Number(bytes);
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function fmtDuration(seconds) {
  if (!isNum(seconds)) return "—";
  const s = Number(seconds);
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${Math.round(s % 60)}s`;
}

export function fmtElapsed(seconds) {
  const m = Math.floor(seconds / 60);
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export function fmtDate(value, options = { dateStyle: "medium", timeStyle: "short" }) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString(undefined, options);
}
