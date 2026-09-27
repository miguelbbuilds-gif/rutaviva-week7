import { useRef, useState } from "react";
import {
  ACTION_MAX,
  COORDINATOR,
  DESC_MAX,
  DESC_MIN,
  DRIVER,
  NOTE_MAX,
  NOTE_MIN,
  OWNER_MAX,
  OTHER_MAX,
  ROUTE_ID,
  ROUTE_NAME,
  STOPS,
  type Report,
  type RiskCategory,
  type Role,
  type WorkflowStatus,
} from "./model";
import { inBounds, nearestStopLabel, nextReportId } from "./labels";

function SpeechCtor(): (new () => SpeechRecognitionLike) | null {
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export function useSpeechToText(onText: (text: string) => void): {
  supported: boolean;
  listening: boolean;
  error: string | null;
  toggle: () => void;
} {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const supported = SpeechCtor() !== null;

  const toggle = () => {
    const Ctor = SpeechCtor();
    if (!Ctor) {
      setError("Este teléfono no ofrece dictado. Escribe el texto.");
      return;
    }
    if (listening && recRef.current) {
      recRef.current.abort();
      recRef.current = null;
      setListening(false);
      return;
    }
    const rec = new Ctor();
    rec.lang = "es-MX";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (ev) => {
      const said = ev.results[0]?.[0]?.transcript ?? "";
      if (said) onText(said);
    };
    rec.onerror = () => {
      setError("No se pudo dictar. Usa el teclado.");
      setListening(false);
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setError(null);
    setListening(true);
    rec.start();
  };

  return { supported, listening, error, toggle };
}

export function validateDriverForm(input: {
  category: RiskCategory | "";
  description: string;
  otherDetail: string;
  pin: { lat: number; lng: number } | null;
}): string | null {
  if (!input.pin) return "Toca el mapa para marcar el lugar (DEMO).";
  if (!inBounds(input.pin.lat, input.pin.lng)) {
    return "El pin debe quedar cerca del corredor DEMO.";
  }
  if (!input.category) return "Elige una categoría.";
  if (input.category === "otro" && input.otherDetail.trim().length < 5) {
    return "Si eliges Otro, escribe una etiqueta breve.";
  }
  if (input.otherDetail.length > OTHER_MAX) return `La etiqueta Extra no puede pasar de ${OTHER_MAX} caracteres.`;
  const desc = input.description.trim();
  if (desc.length < DESC_MIN) return `La descripción necesita al menos ${DESC_MIN} caracteres.`;
  if (desc.length > DESC_MAX) return `La descripción no puede pasar de ${DESC_MAX} caracteres.`;
  return null;
}

export function validateCoordinatorAction(input: {
  action: string;
  owner: string;
  deadline: string;
  note: string;
}): string | null {
  if (input.action.trim().length < NOTE_MIN) return "Describe una acción concreta (mínimo 8 caracteres).";
  if (input.action.length > ACTION_MAX) return `La acción no puede pasar de ${ACTION_MAX} caracteres.`;
  if (input.owner.trim().length < 3) return "Indica un dueño responsable (rol u oficina DEMO).";
  if (input.owner.length > OWNER_MAX) return `El dueño no puede pasar de ${OWNER_MAX} caracteres.`;
  if (!input.deadline) return "Elige una fecha límite.";
  if (input.note.length > NOTE_MAX) return `La nota no puede pasar de ${NOTE_MAX} caracteres.`;
  return null;
}

export function validateNote(note: string): string | null {
  const t = note.trim();
  if (t.length < NOTE_MIN) return `La nota necesita al menos ${NOTE_MIN} caracteres.`;
  if (note.length > NOTE_MAX) return `La nota no puede pasar de ${NOTE_MAX} caracteres.`;
  return null;
}

export function buildDriverReport(input: {
  reports: Report[];
  category: RiskCategory;
  description: string;
  otherDetail: string;
  pin: { lat: number; lng: number };
}): Report {
  const now = new Date().toISOString();
  const id = nextReportId(input.reports);
  return {
    id,
    routeId: ROUTE_ID,
    routeName: ROUTE_NAME,
    lat: input.pin.lat,
    lng: input.pin.lng,
    locationLabel: nearestStopLabel(input.pin.lat, input.pin.lng, STOPS),
    riskCategory: input.category,
    otherDetail: input.category === "otro" ? input.otherDetail.trim() : undefined,
    description: input.description.trim(),
    createdAt: now,
    verificationStatus: "received",
    simulated: true,
    reporterLabel: DRIVER.label,
    history: [{ at: now, status: "received", actor: "system", note: "Reporte recibido después del viaje." }],
  };
}

export function applyCoordinatorDecision(
  report: Report,
  status: WorkflowStatus,
  extra: Partial<Pick<Report, "coordinatorNote" | "assignedAction" | "responsibleOwner" | "deadline" | "duplicateOf">>,
): Report {
  const now = new Date().toISOString();
  return {
    ...report,
    verificationStatus: status,
    coordinatorNote: extra.coordinatorNote ?? report.coordinatorNote,
    assignedAction: extra.assignedAction ?? report.assignedAction,
    responsibleOwner: extra.responsibleOwner ?? report.responsibleOwner,
    deadline: extra.deadline ?? report.deadline,
    duplicateOf: extra.duplicateOf ?? report.duplicateOf,
    history: [
      ...report.history,
      {
        at: now,
        status,
        actor: COORDINATOR.id,
        note: extra.coordinatorNote,
      },
    ],
  };
}

export function applyFollowUp(report: Report, note: string): Report {
  const now = new Date().toISOString();
  return {
    ...report,
    followUpNote: note.trim(),
    verificationStatus: "received",
    history: [
      ...report.history,
      {
        at: now,
        status: "received",
        actor: DRIVER.id,
        note: `Nota extra del chofer: ${note.trim()}`,
      },
    ],
  };
}

export type { Role };
