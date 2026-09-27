import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CorridorMap } from "./CorridorMap";
import {
  applyCoordinatorDecision,
  applyFollowUp,
  buildDriverReport,
  useSpeechToText,
  validateCoordinatorAction,
  validateDriverForm,
  validateNote,
} from "./forms";
import {
  categoryLabel,
  driverOutcome,
  formatWhen,
  freshnessLabel,
  isUnverified,
  statusLabel,
} from "./labels";
import { loadEmbeddingModel, relatedReports, type MlState, type Suggestion } from "./ml";
import {
  COORDINATOR,
  DESC_MAX,
  DRIVER,
  NOTE_MAX,
  OTHER_MAX,
  RISK_CATEGORIES,
  ROUTE_NAME,
  type Report,
  type RiskCategory,
  type Role,
  type WorkflowStatus,
} from "./model";
import { loadStore, resetStore, saveStore } from "./storage";

type Screen = "landing" | "app";
type Tab = "home" | "map" | "work" | "privacy";

function DemoBanner() {
  return (
    <div className="banner">
      DEMO / DATOS SIMULADOS — No es seguimiento en vivo · No certifica seguridad
      <br />
      DEMO / SIMULATED DATA
    </div>
  );
}

function UncertaintyChips({ report }: { report: Report }) {
  return (
    <div className="row">
      {isUnverified(report.verificationStatus) ? (
        <span className="chip warn">Sin verificar</span>
      ) : (
        <span className="chip">Revisado por una persona</span>
      )}
      <span className={freshnessLabel(report.createdAt).includes("viejo") ? "chip stale" : "chip"}>
        {freshnessLabel(report.createdAt)}
      </span>
      <span className="chip">{statusLabel(report.verificationStatus)}</span>
    </div>
  );
}

export default function App() {
  const initial = loadStore();
  const [screen, setScreen] = useState<Screen>("landing");
  const [role, setRole] = useState<Role>("driver");
  const [tab, setTab] = useState<Tab>("home");
  const [reports, setReports] = useState<Report[]>(initial.reports);
  const [tripComplete, setTripComplete] = useState(initial.tripComplete);
  const [selectedId, setSelectedId] = useState<string | null>(initial.reports[0]?.id ?? null);
  const [tilesUnavailable, setTilesUnavailable] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [category, setCategory] = useState<RiskCategory | "">("");
  const [description, setDescription] = useState("");
  const [otherDetail, setOtherDetail] = useState("");
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);

  const [coordNote, setCoordNote] = useState("");
  const [actionText, setActionText] = useState("");
  const [owner, setOwner] = useState("");
  const [deadline, setDeadline] = useState("");
  const [dupId, setDupId] = useState("");
  const [followUp, setFollowUp] = useState("");

  const [ml, setMl] = useState<MlState>({ status: "idle" });
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  const speech = useSpeechToText((text) => {
    setDescription((prev) => (prev ? `${prev} ${text}` : text).slice(0, DESC_MAX));
  });

  useEffect(() => {
    saveStore({ reports, tripComplete });
  }, [reports, tripComplete]);

  const selected = reports.find((r) => r.id === selectedId) ?? null;
  const driverReports = useMemo(
    () => reports.filter((r) => r.reporterLabel === DRIVER.label),
    [reports],
  );

  useEffect(() => {
    if (role !== "coordinator" || !selected) {
      return;
    }
    let cancelled = false;
    setMl({ status: "loading" });
    setSuggestions([]);
    (async () => {
      try {
        await loadEmbeddingModel();
        const found = await relatedReports(selected, reports);
        if (!cancelled) {
          setMl({ status: "ready" });
          setSuggestions(found);
        }
      } catch {
        if (!cancelled) {
          setMl({
            status: "unavailable",
            reason: "No se pudo cargar el modelo en este navegador.",
          });
          setSuggestions([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [role, selected, reports]);

  function enter(next: Role) {
    setRole(next);
    setScreen("app");
    setTab("home");
    setFlash(null);
  }

  function replaceReport(next: Report) {
    setReports((prev) => prev.map((r) => (r.id === next.id ? next : r)));
    setSelectedId(next.id);
  }

  function submitDriver() {
    const err = validateDriverForm({ category, description, otherDetail, pin });
    if (err || !category || !pin) {
      setFormError(err ?? "Revisa el formulario.");
      return;
    }
    const report = buildDriverReport({
      reports,
      category,
      description,
      otherDetail,
      pin,
    });
    setReports((prev) => [report, ...prev]);
    setSelectedId(report.id);
    setCategory("");
    setDescription("");
    setOtherDetail("");
    setPin(null);
    setFormError(null);
    setFlash(`Reporte ${report.id} recibido. No hay puntaje ni ranking.`);
    setTab("work");
  }

  function decide(status: WorkflowStatus) {
    if (!selected) return;
    if (status === "action_assigned") {
      const err = validateCoordinatorAction({
        action: actionText,
        owner,
        deadline,
        note: coordNote,
      });
      if (err) {
        setFormError(err);
        return;
      }
      replaceReport(
        applyCoordinatorDecision(selected, status, {
          coordinatorNote: coordNote.trim() || "Acción asignada.",
          assignedAction: actionText.trim(),
          responsibleOwner: owner.trim(),
          deadline,
        }),
      );
    } else if (status === "flagged_duplicate") {
      const err = validateNote(coordNote);
      if (err) {
        setFormError(err);
        return;
      }
      replaceReport(
        applyCoordinatorDecision(selected, status, {
          coordinatorNote: coordNote.trim(),
          duplicateOf: dupId.trim() || suggestions[0]?.id,
        }),
      );
    } else {
      const err = validateNote(coordNote);
      if (err) {
        setFormError(err);
        return;
      }
      replaceReport(
        applyCoordinatorDecision(selected, status, {
          coordinatorNote: coordNote.trim(),
        }),
      );
    }
    setFormError(null);
    setFlash("Decisión humana guardada. La sugerencia de IA no cambió el estado.");
    setCoordNote("");
    setActionText("");
    setOwner("");
    setDeadline("");
  }

  function sendFollowUp() {
    if (!selected) return;
    const err = validateNote(followUp);
    if (err) {
      setFormError(err);
      return;
    }
    replaceReport(applyFollowUp(selected, followUp));
    setFollowUp("");
    setFormError(null);
    setFlash("Nota extra enviada. El reporte volvió a Recibido.");
  }

  function resetDemo() {
    const next = resetStore();
    setReports(next.reports);
    setTripComplete(next.tripComplete);
    setSelectedId(next.reports[0]?.id ?? null);
    setFlash("Datos DEMO restablecidos en este navegador.");
  }

  if (screen === "landing") {
    return (
      <div className="app-shell">
        <DemoBanner />
        <header className="header">
          <p className="eyebrow">Capa colectivo · seguridad + dato usable</p>
          <h1>RutaViva</h1>
          <p className="muted">
            De la observación del chofer a una acción verificada por una persona. Un solo corredor
            ficticio. No es una app para pedir viaje.
          </p>
        </header>
        <main className="content">
          <section className="card">
            <h2>{ROUTE_NAME}</h2>
            <p className="muted">
              Identidades inventadas: chofer {DRIVER.name} y coordinadora {COORDINATOR.name}. Todo
              el contenido es DEMO / SIMULATED DATA.
            </p>
            <div className="stack" style={{ marginTop: "0.8rem" }}>
              <button className="btn btn-primary" type="button" onClick={() => enter("driver")}>
                Entrar como {DRIVER.name} (chofer)
              </button>
              <button className="btn btn-secondary" type="button" onClick={() => enter("coordinator")}>
                Entrar como {COORDINATOR.name} (coordinación)
              </button>
            </div>
          </section>
          <section className="card">
            <h2>Cómo funciona</h2>
            <ul className="plain">
              <li>El chofer reporta solo después de terminar el viaje. Nunca al conducir.</li>
              <li>El mapa muestra el corredor y las observaciones, no un camión en vivo.</li>
              <li>Un modelo en el navegador sugiere posibles duplicados. Ana decide.</li>
              <li>Cerrar una acción no significa que la ruta esté certificada como segura.</li>
            </ul>
          </section>
          <section className="card">
            <h2>Privacidad en una frase</h2>
            <p className="muted">
              Este prototipo guarda reportes ficticios en tu navegador. No hay cuentas reales ni
              puntuación del chofer. Detalles en la pestaña Privacidad.
            </p>
          </section>
        </main>
      </div>
    );
  }

  const isDriver = role === "driver";

  return (
    <div className="app-shell">
      <DemoBanner />
      <header className="header">
        <p className="eyebrow">{isDriver ? DRIVER.label : COORDINATOR.label}</p>
        <h1>RutaViva</h1>
        <p className="muted">{isDriver ? DRIVER.name : COORDINATOR.name} · {ROUTE_NAME}</p>
        <div className="row" style={{ marginTop: "0.55rem" }}>
          <button className="btn btn-ghost" type="button" onClick={() => enter(isDriver ? "coordinator" : "driver")}>
            Cambiar a {isDriver ? "coordinación" : "chofer"}
          </button>
          <button className="btn btn-ghost" type="button" onClick={() => setScreen("landing")}>
            Inicio
          </button>
        </div>
      </header>

      <main className="content">
        {flash ? <p className="ok">{flash}</p> : null}
        {formError ? <p className="error">{formError}</p> : null}

        {tab === "home" && isDriver ? (
          <DriverHome
            tripComplete={tripComplete}
            setTripComplete={setTripComplete}
            category={category}
            setCategory={setCategory}
            description={description}
            setDescription={setDescription}
            otherDetail={otherDetail}
            setOtherDetail={setOtherDetail}
            pin={pin}
            setPin={setPin}
            reports={reports}
            selectedId={selectedId}
            onSelect={setSelectedId}
            tilesUnavailable={tilesUnavailable}
            setTilesUnavailable={setTilesUnavailable}
            speech={speech}
            onSubmit={submitDriver}
          />
        ) : null}

        {tab === "home" && !isDriver ? (
          <CoordinatorHome
            reports={reports}
            selected={selected}
            selectedId={selectedId}
            onSelect={setSelectedId}
            tilesUnavailable={tilesUnavailable}
            setTilesUnavailable={setTilesUnavailable}
            ml={ml}
            suggestions={suggestions}
            coordNote={coordNote}
            setCoordNote={setCoordNote}
            actionText={actionText}
            setActionText={setActionText}
            owner={owner}
            setOwner={setOwner}
            deadline={deadline}
            setDeadline={setDeadline}
            dupId={dupId}
            setDupId={setDupId}
            onDecide={decide}
          />
        ) : null}

        {tab === "map" ? (
          <section className="card">
            <h2>Corredor DEMO</h2>
            <p className="muted">
              Línea ficticia inspirada en Tacubaya–Observatorio. Los pines son observaciones, no
              vehículos.
            </p>
            {tilesUnavailable ? (
              <p className="error">Mapa: teselas no disponibles. El corredor sigue en la lista.</p>
            ) : null}
            <CorridorMap
              reports={reports}
              selectedId={selectedId}
              pendingPin={isDriver ? pin : null}
              onSelect={setSelectedId}
              onMapClick={isDriver ? (lat, lng) => setPin({ lat, lng }) : undefined}
              onTilesFailed={() => setTilesUnavailable(true)}
            />
            <div className="legend">
              <span>Sin verificar</span>
              <span>Reciente</span>
              <span>Dato viejo</span>
              <span>No disponible (si falla el mapa o el ML)</span>
            </div>
          </section>
        ) : null}

        {tab === "work" && isDriver ? (
          <DriverReports
            reports={driverReports}
            selected={selected}
            onSelect={setSelectedId}
            followUp={followUp}
            setFollowUp={setFollowUp}
            onFollowUp={sendFollowUp}
          />
        ) : null}

        {tab === "work" && !isDriver ? (
          <CoordinatorQueue reports={reports} selectedId={selectedId} onSelect={setSelectedId} />
        ) : null}

        {tab === "privacy" ? <PrivacyPanel onReset={resetDemo} /> : null}
      </main>

      <nav className="nav" aria-label="Principal">
        <button className={tab === "home" ? "active" : ""} type="button" onClick={() => setTab("home")}>
          {isDriver ? "Reportar" : "Revisar"}
        </button>
        <button className={tab === "map" ? "active" : ""} type="button" onClick={() => setTab("map")}>
          Mapa
        </button>
        <button className={tab === "work" ? "active" : ""} type="button" onClick={() => setTab("work")}>
          {isDriver ? "Mis reportes" : "Cola"}
        </button>
        <button className={tab === "privacy" ? "active" : ""} type="button" onClick={() => setTab("privacy")}>
          Privacidad
        </button>
      </nav>
    </div>
  );
}

function DriverHome({
  tripComplete,
  setTripComplete,
  category,
  setCategory,
  description,
  setDescription,
  otherDetail,
  setOtherDetail,
  pin,
  setPin,
  reports,
  selectedId,
  onSelect,
  tilesUnavailable,
  setTilesUnavailable,
  speech,
  onSubmit,
}: {
  tripComplete: boolean;
  setTripComplete: (v: boolean) => void;
  category: RiskCategory | "";
  setCategory: (v: RiskCategory | "") => void;
  description: string;
  setDescription: (v: string) => void;
  otherDetail: string;
  setOtherDetail: (v: string) => void;
  pin: { lat: number; lng: number } | null;
  setPin: (v: { lat: number; lng: number }) => void;
  reports: Report[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  tilesUnavailable: boolean;
  setTilesUnavailable: (v: boolean) => void;
  speech: ReturnType<typeof useSpeechToText>;
  onSubmit: () => void;
}) {
  return (
    <>
      <section className="card">
        <h2>Solo después del viaje</h2>
        <p className="muted">
          No uses el teléfono mientras conduces. Marca el viaje como terminado y luego escribe o
          dicta.
        </p>
        <button className="btn btn-primary" type="button" onClick={() => setTripComplete(true)}>
          {tripComplete ? "Viaje marcado como terminado" : "Marcar viaje terminado"}
        </button>
      </section>
      {!tripComplete ? (
        <section className="card">
          <p className="disclaimer">El formulario se abre cuando el viaje ya terminó.</p>
        </section>
      ) : (
        <section className="card stack">
          <h2>Observación de seguridad</h2>
          <label htmlFor="cat">Categoría</label>
          <select
            id="cat"
            value={category}
            onChange={(e) => setCategory(e.target.value as RiskCategory | "")}
          >
            <option value="">Elige una</option>
            {RISK_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          {category === "otro" ? (
            <>
              <label htmlFor="otro">Etiqueta (Otro)</label>
              <input
                id="otro"
                maxLength={OTHER_MAX}
                value={otherDetail}
                onChange={(e) => setOtherDetail(e.target.value)}
              />
            </>
          ) : null}
          <label htmlFor="desc">Qué viste al terminar el viaje</label>
          <textarea
            id="desc"
            maxLength={DESC_MAX}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="char-count">
            {description.length}/{DESC_MAX}
          </div>
          <button className="btn btn-secondary" type="button" onClick={speech.toggle}>
            {speech.supported
              ? speech.listening
                ? "Detener dictado"
                : "Dictar (opcional)"
              : "Dictado no disponible — usa el teclado"}
          </button>
          {speech.error ? <p className="error">{speech.error}</p> : null}
          {tilesUnavailable ? <p className="error">Teselas del mapa no disponibles.</p> : null}
          <CorridorMap
            reports={reports}
            selectedId={selectedId}
            pendingPin={pin}
            onSelect={onSelect}
            onMapClick={(lat, lng) => setPin({ lat, lng })}
            onTilesFailed={() => setTilesUnavailable(true)}
          />
          <p className="muted">
            Ubicación: {pin ? `${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}` : "toca el mapa para marcar el lugar"}
          </p>
          <button className="btn btn-primary" type="button" onClick={onSubmit}>
            Enviar reporte DEMO
          </button>
        </section>
      )}
    </>
  );
}

function DriverReports({
  reports,
  selected,
  onSelect,
  followUp,
  setFollowUp,
  onFollowUp,
}: {
  reports: Report[];
  selected: Report | null;
  onSelect: (id: string) => void;
  followUp: string;
  setFollowUp: (v: string) => void;
  onFollowUp: () => void;
}) {
  return (
    <>
      <section className="card">
        <h2>Qué pasó con tu aporte</h2>
        <p className="muted">No hay puntaje, ranking ni recuento de “quién reporta más”.</p>
        <div className="stack">
          {reports.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`report-btn ${selected?.id === r.id ? "selected" : ""}`}
              onClick={() => onSelect(r.id)}
            >
              <strong>{r.id}</strong> · {categoryLabel(r.riskCategory)}
              <div className="muted">{statusLabel(r.verificationStatus)}</div>
            </button>
          ))}
        </div>
      </section>
      {selected && reports.some((r) => r.id === selected.id) ? (
        <ReportDetail report={selected}>
          <p>{driverOutcome(selected.verificationStatus)}</p>
          {selected.assignedAction ? (
            <p>
              <strong>Acción:</strong> {selected.assignedAction}
              <br />
              <strong>Dueño:</strong> {selected.responsibleOwner} · <strong>Plazo:</strong>{" "}
              {selected.deadline}
            </p>
          ) : null}
          {selected.verificationStatus === "action_closed" ? (
            <p className="disclaimer">Acción cerrada. Esto no certifica que la ruta sea segura.</p>
          ) : null}
          {selected.verificationStatus === "needs_more_info" ? (
            <div className="stack">
              <label htmlFor="fu">Nota extra</label>
              <textarea
                id="fu"
                maxLength={NOTE_MAX}
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
              />
              <button className="btn btn-primary" type="button" onClick={onFollowUp}>
                Enviar nota extra
              </button>
            </div>
          ) : null}
        </ReportDetail>
      ) : null}
    </>
  );
}

function CoordinatorHome({
  reports,
  selected,
  selectedId,
  onSelect,
  tilesUnavailable,
  setTilesUnavailable,
  ml,
  suggestions,
  coordNote,
  setCoordNote,
  actionText,
  setActionText,
  owner,
  setOwner,
  deadline,
  setDeadline,
  dupId,
  setDupId,
  onDecide,
}: {
  reports: Report[];
  selected: Report | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  tilesUnavailable: boolean;
  setTilesUnavailable: (v: boolean) => void;
  ml: MlState;
  suggestions: Suggestion[];
  coordNote: string;
  setCoordNote: (v: string) => void;
  actionText: string;
  setActionText: (v: string) => void;
  owner: string;
  setOwner: (v: string) => void;
  deadline: string;
  setDeadline: (v: string) => void;
  dupId: string;
  setDupId: (v: string) => void;
  onDecide: (status: WorkflowStatus) => void;
}) {
  return (
    <>
      <section className="card">
        <h2>Revisión humana</h2>
        <p className="muted">La IA no verifica, no publica y no asigna. Tú decides.</p>
        {tilesUnavailable ? <p className="error">Teselas del mapa no disponibles.</p> : null}
        <CorridorMap
          reports={reports}
          selectedId={selectedId}
          pendingPin={null}
          onSelect={onSelect}
          onTilesFailed={() => setTilesUnavailable(true)}
        />
      </section>
      {selected ? (
        <ReportDetail report={selected}>
          <MlPanel ml={ml} suggestions={suggestions} reports={reports} onPickDup={setDupId} />
          <div className="stack">
            <label htmlFor="note">Nota de coordinación</label>
            <textarea
              id="note"
              maxLength={NOTE_MAX}
              value={coordNote}
              onChange={(e) => setCoordNote(e.target.value)}
            />
            <label htmlFor="dup">ID duplicado (si aplica)</label>
            <input id="dup" value={dupId} onChange={(e) => setDupId(e.target.value)} placeholder="RV-088" />
            <label htmlFor="act">Acción concreta</label>
            <input id="act" value={actionText} onChange={(e) => setActionText(e.target.value)} />
            <label htmlFor="own">Dueño responsable (DEMO)</label>
            <input id="own" value={owner} onChange={(e) => setOwner(e.target.value)} />
            <label htmlFor="dl">Plazo</label>
            <input id="dl" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            <button className="btn btn-secondary" type="button" onClick={() => onDecide("needs_more_info")}>
              Pedir más información
            </button>
            <button className="btn btn-secondary" type="button" onClick={() => onDecide("context_verified")}>
              Verificar contexto
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => onDecide("flagged_duplicate")}>
              Marcar duplicado
            </button>
            <button className="btn btn-primary" type="button" onClick={() => onDecide("action_assigned")}>
              Asignar acción
            </button>
            <button className="btn btn-danger" type="button" onClick={() => onDecide("action_closed")}>
              Cerrar acción
            </button>
            <p className="disclaimer">Cerrar una acción no certifica que la ruta sea segura.</p>
          </div>
        </ReportDetail>
      ) : null}
    </>
  );
}

function CoordinatorQueue({
  reports,
  selectedId,
  onSelect,
}: {
  reports: Report[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <section className="card">
      <h2>Cola de reportes</h2>
      <div className="stack">
        {reports.map((r) => (
          <button
            key={r.id}
            type="button"
            className={`report-btn ${selectedId === r.id ? "selected" : ""}`}
            onClick={() => onSelect(r.id)}
          >
            <strong>{r.id}</strong> · {statusLabel(r.verificationStatus)}
            <div className="muted">
              {categoryLabel(r.riskCategory)} · {freshnessLabel(r.createdAt)}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function MlPanel({
  ml,
  suggestions,
  reports,
  onPickDup,
}: {
  ml: MlState;
  suggestions: Suggestion[];
  reports: Report[];
  onPickDup: (id: string) => void;
}) {
  if (ml.status === "loading" || ml.status === "idle") {
    return (
      <div className="ml-box">
        <span className="chip purple">Sugerencia ML</span>
        <p>Cargando modelo de embeddings en el navegador…</p>
      </div>
    );
  }
  if (ml.status === "unavailable") {
    const recent = [...reports].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
    return (
      <div className="ml-box ml-box-compact">
        <p>
          La sugerencia automática no está disponible. Puedes revisar los reportes y decidir normalmente.
        </p>
        <details className="ml-details">
          <summary>Por qué no hay sugerencia</summary>
          <p className="muted">
            El modelo automático no se pudo cargar. La lista siguiente es solo para consultar reportes
            recientes. No es una recomendación de IA y no verifica ningún reporte. La decisión es tuya.
          </p>
          <p>
            <strong>Reportes recientes para consultar (no es IA):</strong>
          </p>
          <ul className="plain">
            {recent.map((r) => (
              <li key={r.id}>
                {r.id} · {statusLabel(r.verificationStatus)}
              </li>
            ))}
          </ul>
        </details>
      </div>
    );
  }
  return (
    <div className="ml-box">
      <span className="chip purple">Solo aviso · Ana decide</span>
      <p>La IA no verifica ni publica. Similitud semántica MiniLM en el navegador.</p>
      {suggestions.length === 0 ? (
        <p className="muted">No hay pares por encima del umbral 0.75.</p>
      ) : (
        suggestions.map((s) => (
          <button key={s.id} className="report-btn" type="button" onClick={() => onPickDup(s.id)}>
            Posible relacionado: {s.id} (similitud {s.score.toFixed(2)})
            <div className="muted">{s.description}</div>
          </button>
        ))
      )}
    </div>
  );
}

function ReportDetail({ report, children }: { report: Report; children?: ReactNode }) {
  return (
    <section className="card stack">
      <h2>
        {report.id} · {categoryLabel(report.riskCategory)}
      </h2>
      <UncertaintyChips report={report} />
      <p>{report.description}</p>
      <p className="muted">
        {report.locationLabel} · {formatWhen(report.createdAt)} · {report.routeName}
      </p>
      {report.coordinatorNote ? (
        <p>
          <strong>Nota:</strong> {report.coordinatorNote}
        </p>
      ) : null}
      {report.duplicateOf ? (
        <p>
          <strong>Duplicado de:</strong> {report.duplicateOf}
        </p>
      ) : null}
      <h3>Historial</h3>
      <ol className="history">
        {report.history.map((h) => (
          <li key={`${h.at}-${h.status}`}>
            {formatWhen(h.at)} · {statusLabel(h.status)}
            {h.note ? ` — ${h.note}` : ""}
          </li>
        ))}
      </ol>
      {children}
    </section>
  );
}

function PrivacyPanel({ onReset }: { onReset: () => void }) {
  return (
    <section className="card stack">
      <h2>Privacidad y datos DEMO</h2>
      <p>
        <strong>Qué se guarda:</strong> reportes ficticios (texto, categoría, coordenadas simuladas,
        estatus, notas y acciones) en <code>localStorage</code> de este navegador.
      </p>
      <p>
        <strong>Para qué:</strong> demostrar el ciclo chofer → revisión humana → acción visible.
      </p>
      <p>
        <strong>Quién lo ve:</strong> quien use este mismo teléfono o computadora. No hay cuentas,
        correo ni contraseñas. El selector de rol no es un inicio de sesión.
      </p>
      <p>
        <strong>Qué no hay:</strong> datos personales reales, GPS en vivo, ETA, predicción de
        choques, puntuación del chofer, ni vigilancia oculta.
      </p>
      <p>
        El modelo de embeddings corre en el navegador. El texto del reporte no se manda a un
        chatbot remoto.
      </p>
      <button className="btn btn-ghost" type="button" onClick={onReset}>
        Restablecer datos DEMO
      </button>
    </section>
  );
}
