# RutaViva — Decisions log

**Owner:** Miguel Bravo (OPERATOR)  
**Team:** Team 6  
**Status:** Packet approved 2026-09-27. Coding authorized. Corridor amended to fictional Tacubaya–Observatorio.

This file is the running log. When a decision changes, add a new dated entry; do not silently rewrite history.

---

## 2026-09-27 — Initial product decisions (pre-code)

### D1. Product

RutaViva is a **post-trip safety observation loop** for **one fictional** Mexico City colectivo corridor. It is not ride-hailing, not live tracking, and not a safety certificate.

### D2. First users (DEMO identities only)

| Surface | Invented name | Job |
|---------|---------------|-----|
| Driver | Luis Ortega | Submit after the trip; see what happened to the report |
| Coordinator | Ana Beltrán | Review, verify context, flag duplicates, assign/close actions |

Access is a **role switcher**, not accounts.

### D3. Fictional corridor

- **Route ID:** `DEMO-TO1` *(amended 2026-09-27; was DEMO-CV1 Tlalpan)*
- **Public name:** Ruta DEMO-TO1 — Corredor Tacubaya–Observatorio (simulated)
- **Narrative stretch:** Terminal Observatorio → Puente de los Leones → Parque Lira → Mercado Tacubaya → Centro Tacubaya (labels only; inspired by the area, not an official route table)
- **Geometry:** A hand-drawn polyline of simulated coordinates near Tacubaya and Observatorio, clearly marked DEMO
- **Stops in seed data:** 4–6 labeled fictional stops, not a full GTFS

### D4. Risk categories (closed list)

1. Parada bloqueada  
2. Superficie / bache  
3. Iluminación deficiente  
4. Cruce o incorporación peligrosa  
5. Encharcamiento  
6. Otro (requires extra text)

No category for “bad driver,” “slow driver,” or passenger complaints about a named person.

### D5. Verification workflow statuses

`received` → `in_review` → one of:

- `needs_more_info`
- `context_verified` (context only; **not** “true accusation” and **not** “route safe”)
- `flagged_duplicate`
- `action_assigned`
- `action_closed`

Uncertainty is a **separate** display layer: `unverified` | `recent` | `stale` | `unavailable`.

### D6. Freshness window

**Recent** = created within **24 hours**. Older seed/user reports show **stale**. If map tiles or the model cannot load, that subsystem shows **unavailable**.

### D7. Dragon Stack choices

| Stack | Choice | Fallback |
|-------|--------|----------|
| Maps | Leaflet + OpenStreetMap tiles | Static corridor note + list of coordinates if tiles fail |
| ML | In-browser MiniLM embeddings (`Xenova/all-MiniLM-L6-v2` via Transformers.js), cosine similarity | Banner `ML no disponible`; recent reports listed **without** an ML badge |
| Voice | Browser Web Speech API into the description field | Typed input always sufficient |

**Duplicate suggestion rule (proposed):** show up to 3 open reports with cosine similarity ≥ **0.75**. Coordinator must confirm. Never auto-flag.

### D8. Data and security

- Client-only; `localStorage` key namespace `rutaviva.demo.v1`
- Seed reports always tagged `simulated: true`
- Description max **280** characters; coordinator notes max **400**
- Coordinates clamped to a bounding box around the fictional corridor
- No remote LLM; no secrets in repo
- Untrusted text is truncated before embedding

### D9. Language

- **Product UI:** Clear Mexican Spanish
- **Course docs:** English
- **DEMO ribbon:** Spanish plus English `DEMO / SIMULATED DATA`
- Code identifiers: English

### D10. Incentives and shadow clause

- No points, streaks, counts-as-score, or speed metrics
- No per-driver safety score
- History is visible on the report, not a hidden HR file
- Closing an action always shows: **“Acción cerrada. Esto no certifica que la ruta sea segura.”**

### D11. Architecture

Vite + React + TypeScript SPA, deployed to Vercel as a static site. No backend in v1.

---

## First implementation step (after approval only)

**Do not execute this step until Miguel confirms the assumptions below.**

1. Scaffold Vite + React + TypeScript in the repo root (or `app/` if we decide to keep docs isolated — default: **repo root**).
2. Add README with DEMO / not-ride-hailing / not-a-certificate warnings.
3. Add a DEMO banner and role switcher with Luis / Ana. No report form yet beyond a placeholder.
4. Commit: `chore: scaffold Vite React TypeScript app with DEMO shell`
5. Optional: first Vercel deploy of the shell **after** that commit, not before Leaflet exists if time is tight — packet prefers Vercel #1 once the map shell exists; see PACKET §14.

**Still forbidden in that first step:** ML wiring, Speech API, real forms, npm packages beyond the scaffold, or any claim of live data.

---

## Assumptions that require approval before coding

Mark each **yes / change / no**.

| ID | Assumption | Default in this packet | Why it needs you |
|----|------------|------------------------|------------------|
| A1 | Fictional corridor is **Ruta DEMO-CV1 — Corredor Tlalpan Sur** with Tasqueña–Portales narrative | Proceed | You may want a different CDMX street or fully invented geography with no real calzada name |
| A2 | Demo people are **Luis Ortega** (driver) and **Ana Beltrán** (coordinator) | Proceed | You may want names/roles that match Team 6 fiction |
| A3 | One SPA + **role switcher**, not two URLs | Proceed | Simpler for Vercel and for the demo |
| A4 | **Spanish UI**, English in docs and DEMO ribbon | Proceed | Course reviewers may prefer all-English UI |
| A5 | Stack is **Vite + React + TypeScript + Leaflet + Transformers.js MiniLM + localStorage** | Proceed | You may be required to use a course starter |
| A6 | **No backend** in Week 7 | Proceed | Shared multi-device demo would need auth first |
| A7 | Freshness window **24 hours**; duplicate cosine **≥ 0.75** | Proceed | Thresholds are arbitrary until you say otherwise |
| A8 | Risk categories as in D4 (no “bad driver” category) | Proceed | Operator may need a different taxonomy |
| A9 | Voice is **optional STT into the text box**, never in-trip | Proceed | Matches low-friction / no driving interaction |
| A10 | First code step is **scaffold + DEMO shell only** | Proceed | Packet review comes first; you asked not to write app code yet |
| A11 | Image mockup file is **generated later**, not in this step | Proceed | This step only specified the frame |
| A12 | Closing an action **never** implies route safety | Locked by brief | Confirm wording only |

---

## Decision outcomes (fill after review)

- Date reviewed: **2026-09-27**
- Approved as written: **yes, with corridor and language amendments below**
- Amendments: Corridor is fictional Tacubaya–Observatorio (DEMO-TO1), not Tlalpan. UI is clear Mexican Spanish; docs are English.
- Coding authorized: **yes**

---

## 2026-09-27 — Packet approval (Miguel Bravo)

Miguel approved the Week 7 pre-code packet and locked:

* Project: RutaViva. Student: Miguel Bravo. Role: OPERATOR.
* Primary vacuum: COLECTIVO LAYER. Primary condition: #3 Human Verification.
* Corridor: fictional colectivo corridor in Mexico City, inspired by Tacubaya–Observatorio.
* Application language: clear Mexican Spanish. Documentation language: English.
* Dragon Stack: Leaflet/OpenStreetMap + real in-browser ML embeddings for duplicate suggestions + optional Web Speech API.
* Data: fictional demo data only, clearly labeled.
* Storage: browser-local demo state; no real accounts or personal data.
* Driver reporting: only after a trip.
* AI never verifies reports automatically.
* Mockup path: `docs/mockups/rutaviva-loop-frame.png` (embedded in PACKET.md).

| ID | Outcome |
|----|---------|
| A1 | **Changed** — DEMO-TO1 Tacubaya–Observatorio, not Tlalpan |
| A2 | **Yes** — Luis Ortega / Ana Beltrán |
| A3 | **Yes** — one SPA + role switcher |
| A4 | **Yes** — Mexican Spanish UI; English docs |
| A5 | **Yes** — Vite + React + TypeScript + Leaflet + Transformers.js MiniLM + localStorage |
| A6 | **Yes** — no backend |
| A7 | **Yes** — 24 h recent; cosine ≥ 0.75 |
| A8 | **Yes** — D4 categories |
| A9 | **Yes** — optional STT, never in-trip |
| A10 | Superseded — full loop implementation authorized after approval |
| A11 | Mockup file specified at `docs/mockups/rutaviva-loop-frame.png` |
| A12 | **Yes** — close ≠ safe; wording unchanged |

---

## 2026-09-27 — Implementation started (post-approval)

- Repo root Vite + React + TypeScript SPA authorized and scaffolded.
- Corridor IDs in code: `DEMO-TO1`.
- First local URL observed: Vite moved to **http://localhost:5174/** because 5173 was already in use.
- Mockup embed path: `docs/mockups/rutaviva-loop-frame.png` (file was not present in the workspace at implementation time).
- Vercel production URL: not created in this step.

---

## 2026-09-27 — First public deployment baseline (prep)

Preserve this build as the first public baseline. No mechanical bug-fix pass and no persona testing in this step.

* **Build:** `npm run build` (`tsc -b && vite build`) completed with **exit 0**. Vite 6.4.3; vendor warning from `onnxruntime-web` eval; Transformers chunk ~828 kB.
* **Git:** branch `master`, working tree clean before this note. Six commits on disk (five implementation/docs commits plus this deploy-prep note after it is committed). History was not rewritten.
* **Tracked files:** source, docs, Vite config, `vercel.json`, lockfile. Not tracked: `node_modules`, `dist`, `.env`. No API keys or real personal data in the tree. Demo names only (Luis Ortega, Ana Beltrán).
* **Packet:** `docs/PACKET.md` embeds `mockups/rutaviva-loop-frame.png` and contains both Mermaid diagrams (report-to-action flowchart; DRIVER / SYSTEM-ML / COORDINATOR swimlane). **The PNG file is still missing from the workspace** (embed is present; binary is not).
* **Next step:** create public GitHub repo `rutaviva-week7`, push `master`, then deploy that repo to Vercel Hobby. Record the real GitHub and Vercel URLs only after they exist. Do not start bug-fix or persona tests until this baseline is live.

---

## 2026-09-27 — First public URLs (baseline live)

Recorded after a successful Vercel production build (`readyState: READY`, alias HTTP 200). GitHub repo connected. Do **not** start mechanical bug-fix or persona tests against this baseline yet.

* GitHub: https://github.com/miguelbbuilds-gif/rutaviva-week7
* Vercel production alias: https://rutaviva-week7.vercel.app
* This deployment: https://rutaviva-week7-6z4da9hb8-miguel-d52d.vercel.app
* Inspect: https://vercel.com/miguel-d52d/rutaviva-week7/D8DDVk4zsLFVr2FHJp9hHXGquYCy

**Next step (later):** mechanical tests and persona tests against this baseline, then a second Vercel deploy if fixes are needed.

---

## 2026-09-27 — Mechanical test and nav-overlay fix

Mechanical Playwright pass against the **baseline** alias https://rutaviva-week7.vercel.app (see `docs/TEST_EVIDENCE.md`). Confirmed bug **NAV-OVERLAY-1**: sticky tab bar covered the driver map (~62px) at 390×667.

Fix is in `src/index.css` and `src/CorridorMap.tsx`. Local preview retest on http://127.0.0.1:4174/ showed no overlap and persistence after reload.

Persona tests: not started.

* Git commit (fix): `bd8404f` — `fix: keep the phone tab bar from covering the driver map`
* Vercel redeploy (READY): https://rutaviva-week7-6uzrtccnv-miguel-d52d.vercel.app
* Alias (HTTP 200, new CSS): https://rutaviva-week7.vercel.app
* Inspect: https://vercel.com/miguel-d52d/rutaviva-week7/2Dk4ctYGZLTCs3Smoxf7zX253zjQ

Production overlay retest at 390×667: map bottom y=451 vs nav y=606 (no overlap). Persona tests still not started.
