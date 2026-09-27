# Test evidence

Only procedures that were actually executed are listed. Persona scripts (P1–P5) were **not** run interactively: the Cursor browser MCP did not attach (`Server not found: cursor-ide-browser`). No Vercel URL was created.

| Date (UTC) | Check | Result | Notes |
|------------|--------|--------|-------|
| 2026-09-27 | `npm install` | Pass | Completed with exit 0. npm reported 5 audit vulnerabilities; `npm audit fix --force` was **not** run. |
| 2026-09-27 | `npm run build` (`tsc -b && vite build`) | Pass | Exit 0. Vite 6.4.3 production build succeeded in ~2.7s. Transformers chunk ~828 kB (expected). onnxruntime-web eval warning from the vendor bundle. |
| 2026-09-27 | `npm run dev` | Pass | Vite ready. Port **5173 in use**, so this app’s URL is **http://localhost:5174/**. |
| 2026-09-27 | HTTP GET `http://localhost:5174/` | Pass | Status 200. HTML `lang="es-MX"`, title RutaViva DEMO, mounts `/src/main.tsx`. |
| 2026-09-27 | Headless Edge `--dump-dom` on `http://localhost:5174/` | Pass (landing only) | Rendered Spanish landing: DEMO banner, Luis Ortega / Ana Beltrán, corredor DEMO-TO1 Tacubaya–Observatorio, not-a-ride-hailing copy, no driver score. Leaflet CSS injected. **Did not click** role buttons, map, forms, or ML. |
| 2026-09-27 | Mechanical M1–M13 (full click-through) | Not run | Requires an interactive browser session. |
| 2026-09-27 | ML model download / similarity scores | Not run | Model loads only after entering coordinator view; not opened in this evidence pass. |
| 2026-09-27 | Voice / Web Speech | Not run | Headless dump-dom cannot exercise the mic. Typed fallback exists in code; not click-tested. |
| 2026-09-27 | Mockup file `docs/mockups/rutaviva-loop-frame.png` | Missing in workspace | PACKET embeds the path; the PNG was not on disk when this folder was listed. |
| 2026-09-27 | Git commits | Pass | Five commits on `master` (see `git log`). No deploy. |

## Copy spotted on the landing (dump-dom)

- `DEMO / DATOS SIMULADOS — No es seguimiento en vivo · No certifica seguridad`
- `DEMO / SIMULATED DATA`
- `No es una app para pedir viaje`
- Invented identities named on screen
