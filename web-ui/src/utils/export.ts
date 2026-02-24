import type { ContractEvent } from "../hooks/useEventStream";

export function eventsToJSON(events: ContractEvent[]): string {
  return JSON.stringify(events, null, 2)
}

export function eventsToCSV(events: ContractEvent[]): string {
  const header = ['timestamp', 'name', 'params', 'txHash', 'source']
  const lines = [header.join(',')]
  for (const e of events) {
    const row = [
      e.timestamp,
      e.name,
      JSON.stringify(e.params).replace(/"/g, '"'),
      e.txHash,
      e.source ?? ''
    ]
    lines.push(row.map(v => {
      // Escape commas in fields by quoting
      const s = String(v)
      if (s.includes(',')) return `"${s}"`
      return s
    }).join(','))
  }
  return lines.join('\n')
}

export function triggerDownload(filename: string, mime: string, content: string) {
  const blob = new Blob([content], { type: mime })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  // Append to DOM to trigger click in some environments
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(a.href)
}
