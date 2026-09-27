import {
  BOUNDS,
  FRESH_MS,
  type Freshness,
  type Report,
  type RiskCategory,
  type WorkflowStatus,
  RISK_CATEGORIES,
} from "./model";

export function categoryLabel(id: RiskCategory): string {
  return RISK_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export function statusLabel(status: WorkflowStatus): string {
  switch (status) {
    case "received":
      return "Recibido";
    case "in_review":
      return "En revisión";
    case "needs_more_info":
      return "Falta información";
    case "context_verified":
      return "Contexto verificado";
    case "flagged_duplicate":
      return "Marcado como duplicado";
    case "action_assigned":
      return "Acción asignada";
    case "action_closed":
      return "Acción cerrada";
  }
}

export function driverOutcome(status: WorkflowStatus): string {
  switch (status) {
    case "received":
      return "Tu reporte llegó. Todavía no lo revisa la coordinación.";
    case "in_review":
      return "La coordinación está revisando tu reporte.";
    case "needs_more_info":
      return "Hace falta más información. Puedes añadir una nota.";
    case "context_verified":
      return "Se verificó el contexto (lugar y descripción). Esto no dice que la ruta sea segura.";
    case "flagged_duplicate":
      return "Se marcó como posible duplicado de otro reporte. La decisión la tomó una persona.";
    case "action_assigned":
      return "Hay una acción concreta asignada. Aún no está cerrada.";
    case "action_closed":
      return "La acción se cerró en el registro. Esto no certifica que la ruta sea segura.";
  }
}

export function freshnessOf(createdAt: string, now = Date.now()): Freshness {
  return now - Date.parse(createdAt) <= FRESH_MS ? "recent" : "stale";
}

export function freshnessLabel(createdAt: string): string {
  return freshnessOf(createdAt) === "recent"
    ? "Reciente (menos de 24 h)"
    : "Dato viejo (más de 24 h)";
}

export function isUnverified(status: WorkflowStatus): boolean {
  return status === "received" || status === "in_review" || status === "needs_more_info";
}

export function inBounds(lat: number, lng: number): boolean {
  return (
    lat >= BOUNDS.minLat &&
    lat <= BOUNDS.maxLat &&
    lng >= BOUNDS.minLng &&
    lng <= BOUNDS.maxLng
  );
}

export function nearestStopLabel(lat: number, lng: number, stops: { label: string; lat: number; lng: number }[]): string {
  let best = stops[0];
  let bestD = Infinity;
  for (const s of stops) {
    const d = (s.lat - lat) ** 2 + (s.lng - lng) ** 2;
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return best.label;
}

export function formatWhen(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function nextReportId(reports: Report[]): string {
  const nums = reports.map((r) => Number(r.id.replace("RV-", ""))).filter((n) => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : 100;
  return `RV-${max + 1}`;
}
