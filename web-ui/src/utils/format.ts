// Utilities for formatting timestamps in events UI
export function formatTime(ts: number): string {
  const d = new Date(ts)
  // 24h time with zero-padded HH:MM:SS
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}
