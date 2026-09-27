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
