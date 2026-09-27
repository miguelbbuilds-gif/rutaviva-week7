export type Role = "driver" | "coordinator";

export type RiskCategory =
  | "parada_bloqueada"
  | "superficie_bache"
  | "iluminacion"
  | "cruce_peligroso"
  | "encharcamiento"
  | "otro";

export type WorkflowStatus =
  | "received"
  | "in_review"
  | "needs_more_info"
  | "context_verified"
  | "flagged_duplicate"
  | "action_assigned"
  | "action_closed";

export type Freshness = "recent" | "stale";

export type HistoryActor = "driver-luis" | "coordinator-ana" | "system";

export interface StatusHistoryEntry {
  at: string;
  status: WorkflowStatus;
  actor: HistoryActor;
  note?: string;
}

export interface Report {
  id: string;
  routeId: string;
  routeName: string;
  lat: number;
  lng: number;
  locationLabel: string;
  riskCategory: RiskCategory;
  otherDetail?: string;
  description: string;
  createdAt: string;
  verificationStatus: WorkflowStatus;
  simulated: true;
  reporterLabel: string;
  coordinatorNote?: string;
  assignedAction?: string;
  responsibleOwner?: string;
  deadline?: string;
  duplicateOf?: string;
  followUpNote?: string;
  history: StatusHistoryEntry[];
}

export const ROUTE_ID = "DEMO-TO1";
export const ROUTE_NAME =
  "Ruta DEMO-TO1 — Corredor Tacubaya–Observatorio (simulado)";

export const RISK_CATEGORIES: { id: RiskCategory; label: string }[] = [
  { id: "parada_bloqueada", label: "Parada bloqueada" },
  { id: "superficie_bache", label: "Superficie / bache" },
  { id: "iluminacion", label: "Iluminación deficiente" },
  { id: "cruce_peligroso", label: "Cruce o incorporación peligrosa" },
  { id: "encharcamiento", label: "Encharcamiento" },
  { id: "otro", label: "Otro" },
];

export const DESC_MAX = 280;
export const DESC_MIN = 10;
export const NOTE_MAX = 400;
export const NOTE_MIN = 8;
export const ACTION_MAX = 200;
export const OWNER_MAX = 80;
export const OTHER_MAX = 80;
export const FRESH_MS = 24 * 60 * 60 * 1000;
export const ML_THRESHOLD = 0.75;
export const STORAGE_KEY = "rutaviva.demo.v1";

/** Simulated corridor near Tacubaya–Observatorio (not live GPS). */
export const CORRIDOR: [number, number][] = [
  [19.39855, -99.20155],
  [19.39905, -99.1994],
  [19.3997, -99.19715],
  [19.40045, -99.19485],
  [19.40125, -99.19255],
  [19.40215, -99.1902],
  [19.40305, -99.18815],
  [19.40355, -99.18695],
];

export const STOPS: { label: string; lat: number; lng: number }[] = [
  { label: "Terminal Observatorio (DEMO)", lat: 19.39855, lng: -99.20155 },
  { label: "Puente de los Leones (DEMO)", lat: 19.3997, lng: -99.19715 },
  { label: "Parque Lira (DEMO)", lat: 19.40125, lng: -99.19255 },
  { label: "Mercado Tacubaya (DEMO)", lat: 19.40215, lng: -99.1902 },
  { label: "Centro Tacubaya (DEMO)", lat: 19.40355, lng: -99.18695 },
];

export const BOUNDS = {
  minLat: 19.392,
  maxLat: 19.41,
  minLng: -99.21,
  maxLng: -99.178,
};

export const DRIVER = {
  id: "driver-luis" as const,
  name: "Luis Ortega",
  label: "Chofer DEMO",
};

export const COORDINATOR = {
  id: "coordinator-ana" as const,
  name: "Ana Beltrán",
  label: "Coordinadora DEMO",
};
