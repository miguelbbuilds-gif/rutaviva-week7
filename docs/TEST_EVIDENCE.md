# Test evidence

Checks below were actually executed. Persona tests (P1–P5) have **not** been run.

## Earlier local smoke (2026-09-27, pre-Vercel)

| Check | Result | Notes |
|-------|--------|-------|
| `npm install` | Pass | Exit 0 |
| `npm run build` | Pass | Exit 0; onnxruntime-web eval warning; Transformers chunk ~828 kB |
| `npm run dev` | Pass | App at http://localhost:5174/ (5173 was SigueMX) |
| Mockup PNG | Later recovered | See commit `ec0ec1d` |

## Mechanical test on production baseline

**URL:** https://rutaviva-week7.vercel.app  
**Method:** Playwright Chromium, viewport **390×667**. Date: 2026-09-27.

| Step | Result | Evidence |
|------|--------|----------|
| Landing | Pass | Heading RutaViva, Luis/Ana entry |
| Enter Luis Ortega | Pass | Header “Luis Ortega · Ruta DEMO-TO1…” |
| Post-trip gate | Pass | Form locked until “Marcar viaje terminado” |
| Empty submit validation | Pass | Error: `Toca el mapa para marcar el lugar (DEMO).` |
| Voice | Pass as fallback path | Button labeled `Dictar (opcional)` (SpeechRecognition present in Chromium). Description was filled by **typed** text, not dictation. |
| Map pin after scrolling map into view | Pass | `Ubicación: 19.40136, -99.19498` |
| Submit report | Pass | Flash `Reporte RV-105 recibido. No hay puntaje ni ranking.` History heading visible |
| Map tab | Pass | Leaflet corridor visible |
| Switch to Ana | Pass | Header Ana Beltrán |
| ML | Pass **fallback** | After ~25s: `ML no disponible` + `Lista reciente (no es ML)` including RV-105. No keyword list labeled as ML. **No similarity scores on this run** (model did not load in this Chromium). |
| Assign action + owner + deadline + note | Pass | Flash `Decisión humana guardada…` |
| Switch back to Luis | Pass | `Acción asignada` visible. Action text present (strict-mode locator clash on “Bacheo puntual” was a **test script** issue, not missing copy). |
| Refresh persistence on **this production run** | Not finished | Script threw before reload. Persistence **was** confirmed on the fixed preview origin (below). |

### Phone layout bug (confirmed on production)

**ID:** NAV-OVERLAY-1  

**Reproduction (390×667, https://rutaviva-week7.vercel.app):**

1. Enter as Luis Ortega.  
2. Tap **Marcar viaje terminado**.  
3. Scroll until the Leaflet map is in the viewport.  
4. Measure map vs tab bar.

**Expected:** Map, location line, and Enviar stay fully above the tab bar so a finger can tap the map and submit.

**Actual:** Map box `{ x: 31.4, y: 428.1, w: 327.2, h: 240 }` so the map bottom is **y=668**. Tab bar `{ y: 606.5, h: 60.2 }`. About **62px of the map sits under the nav**. A Cursor browser screenshot of the same production URL also showed **Marcar viaje terminado** clipped by the tab bar on a short pane.

**Cause:** `.nav { position: sticky; bottom: 0 }` painted over scrolling `.content` instead of sitting in normal flex layout below it.

**Fix:** `.nav` is `position: relative; flex-shrink: 0`. `.content` uses `flex: 1; min-height: 0; overflow: auto` with normal padding (no fake footer spacer). Leaflet `invalidateSize()` after map ready.

**Retest (fixed build, Vite preview http://127.0.0.1:4174/, same 390×667 script):**

| Measure | Result |
|---------|--------|
| Map box | `{ y: 211.1, h: 240 }` → bottom **451**, nav **y=606** — **no overlap** |
| Submit vs nav | submit bottom 563 < nav 606 — **no overlap** |
| Full loop | Pass including assign, Luis outcome, **reload persistence** of “Acción: Bacheo puntual” |

**Retest on production after redeploy** (https://rutaviva-week7.vercel.app, CSS `index-CZN58TsP.css`, 390×667):

| Measure | Result |
|---------|--------|
| Map box | `{ y: 211.1, h: 240 }` → bottom **451**, nav **y=606** — **no overlap** |
| Submit vs nav | submit y=518 h=45, nav y=606 — **no overlap** |
| Loop + refresh | Pass (RV-105, assign, Luis sees action, persist after reload) |

Fix commit: `bd8404f`  
Production deployment: https://rutaviva-week7-6uzrtccnv-miguel-d52d.vercel.app  
Alias: https://rutaviva-week7.vercel.app  
Inspect: https://vercel.com/miguel-d52d/rutaviva-week7/2Dk4ctYGZLTCs3Smoxf7zX253zjQ

---

## 2026-09-27 — Synthetic persona (screenshots), ML fallback copy

**Not a real driver interview.** Walkthrough of the live mobile UI using screenshots, persona **Don José** (56, colectivo driver, distrusts surveillance, wants a human action).

**Finding:** The coordinator “ML no disponible” panel was large and technical (`embeddings`, `no es un filtro por palabras clave…`, a list that looked like a system result). It interrupted review and used language the persona would not trust or understand.

**Fix:** Compact Spanish notice: “La sugerencia automática no está disponible. Puedes revisar los reportes y decidir normalmente.” Details control “Por qué no hay sugerencia” explains the model did not load and that any recent list is **not** an IA recommendation and **does not** verify a report. Human statuses, history, and DEMO labels unchanged.

**Tests (this machine, not invented):**

| Check | Result |
|-------|--------|
| `npm run build` | Pass (exit 0) |
| Playwright 390×667 vs http://127.0.0.1:4175/ | Pass: new copy present; old “ML no disponible” chip absent; details 44px tall, width 301px; assign + Luis outcome + persist still pass |

* Git commit: `25c3326`
* Vercel: https://rutaviva-week7-jtsugtk3h-miguel-d52d.vercel.app
* Alias: https://rutaviva-week7.vercel.app
