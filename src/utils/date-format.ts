const pad = (n: number) => n.toString().padStart(2, "0")

function toDate(value?: string | Date | number | null): Date | null {
  if (value === undefined || value === null || value === "") return null
  const d = value instanceof Date ? value : new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

export function formatDateTime(value?: string | Date | number | null, fallback = "-"): string {
  const d = toDate(value)
  if (!d) return fallback
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export function formatDate(value?: string | Date | number | null, fallback = "-"): string {
  const d = toDate(value)
  if (!d) return fallback
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
