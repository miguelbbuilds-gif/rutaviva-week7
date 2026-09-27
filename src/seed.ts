import {
  COORDINATOR,
  DRIVER,
  ROUTE_ID,
  ROUTE_NAME,
  type Report,
  type StatusHistoryEntry,
} from "./model";

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600 * 1000).toISOString();
}

function daysAgo(d: number): string {
  return new Date(Date.now() - d * 86400 * 1000).toISOString();
}

function hist(
  at: string,
  status: StatusHistoryEntry["status"],
  actor: StatusHistoryEntry["actor"],
  note?: string,
): StatusHistoryEntry {
  return note ? { at, status, actor, note } : { at, status, actor };
}

export const SEED_REPORTS: Report[] = [
  {
    id: "RV-088",
    routeId: ROUTE_ID,
    routeName: ROUTE_NAME,
    lat: 19.40215,
    lng: -99.1902,
    locationLabel: "Mercado Tacubaya (DEMO)",
    riskCategory: "parada_bloqueada",
    description:
      "Después del viaje: puestos fijos cubren la parada frente al Mercado Tacubaya (DEMO). La gente baja en el segundo carril.",
    createdAt: daysAgo(4),
    verificationStatus: "flagged_duplicate",
    simulated: true,
    reporterLabel: "Chofer DEMO (identidad inventada)",
    coordinatorNote: "Mismo tema que reportes posteriores de parada bloqueada. Decisión humana.",
    duplicateOf: "RV-104",
    history: [
      hist(daysAgo(4), "received", "system"),
      hist(daysAgo(3), "in_review", COORDINATOR.id),
      hist(daysAgo(3), "flagged_duplicate", COORDINATOR.id, "Marcado duplicado de forma manual."),
    ],
  },
  {
    id: "RV-091",
    routeId: ROUTE_ID,
    routeName: ROUTE_NAME,
    lat: 19.3997,
    lng: -99.19715,
    locationLabel: "Puente de los Leones (DEMO)",
    riskCategory: "superficie_bache",
    description:
      "Bache profundo en el carril de abordaje junto al puente (DEMO). Se siente al frenar al terminar el viaje.",
    createdAt: daysAgo(6),
    verificationStatus: "action_closed",
    simulated: true,
    reporterLabel: "Chofer DEMO (identidad inventada)",
    coordinatorNote: "Se registró bacheo puntual. Cerrar la acción no certifica la ruta.",
    assignedAction: "Solicitar bacheo en el carril de abordaje (DEMO)",
    responsibleOwner: "Taller de vía (DEMO)",
    deadline: daysAgo(1).slice(0, 10),
    history: [
      hist(daysAgo(6), "received", "system"),
      hist(daysAgo(5), "action_assigned", COORDINATOR.id, "Asignado a Taller de vía (DEMO)."),
      hist(daysAgo(1), "action_closed", COORDINATOR.id, "Acción cerrada en el registro DEMO."),
    ],
  },
  {
    id: "RV-076",
    routeId: ROUTE_ID,
    routeName: ROUTE_NAME,
    lat: 19.40125,
    lng: -99.19255,
    locationLabel: "Parque Lira (DEMO)",
    riskCategory: "iluminacion",
    description:
      "Tramo oscuro al bajar en Parque Lira (DEMO). No se ve el borde de la banqueta después de las 20:00.",
    createdAt: daysAgo(2),
    verificationStatus: "needs_more_info",
    simulated: true,
    reporterLabel: DRIVER.label,
    coordinatorNote: "¿De qué lado de la avenida y a qué hora aproximada?",
    history: [
      hist(daysAgo(2), "received", "system"),
      hist(daysAgo(1), "needs_more_info", COORDINATOR.id, "Pedir lado de la avenida y hora."),
    ],
  },
  {
    id: "RV-099",
    routeId: ROUTE_ID,
    routeName: ROUTE_NAME,
    lat: 19.39855,
    lng: -99.20155,
    locationLabel: "Terminal Observatorio (DEMO)",
    riskCategory: "encharcamiento",
    description:
      "Charco amplio en la salida de Terminal Observatorio (DEMO) después de la lluvia. El agua llega a la puerta.",
    createdAt: hoursAgo(8),
    verificationStatus: "in_review",
    simulated: true,
    reporterLabel: "Chofer DEMO (identidad inventada)",
    history: [
      hist(hoursAgo(8), "received", "system"),
      hist(hoursAgo(7), "in_review", COORDINATOR.id),
    ],
  },
  {
    id: "RV-104",
    routeId: ROUTE_ID,
    routeName: ROUTE_NAME,
    lat: 19.40225,
    lng: -99.19005,
    locationLabel: "Mercado Tacubaya (DEMO)",
    riskCategory: "parada_bloqueada",
    description:
      "Parada tapada por puestos junto al Mercado Tacubaya (DEMO). Pasajeras y pasajeros bajan en el segundo carril al terminar el viaje.",
    createdAt: hoursAgo(3),
    verificationStatus: "received",
    simulated: true,
    reporterLabel: DRIVER.label,
    history: [hist(hoursAgo(3), "received", "system")],
  },
];
