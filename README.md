# RutaViva

Phone-first demo for **2041 Business Bending**, Week 7.  
Student: Miguel Bravo · Role: OPERATOR · Team 6.

RutaViva is **not** a ride-hailing app. It is a post-trip safety observation loop on one **fictional** Mexico City colectivo corridor (inspired by Tacubaya–Observatorio). All people, routes, and pins are **DEMO / SIMULATED DATA**.

Closing an action does **not** certify that the route is safe. There is no live tracking, ETA, crash prediction, or driver safety score.

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Stack

- Vite + React + TypeScript
- Leaflet + OpenStreetMap
- In-browser MiniLM embeddings (`@xenova/transformers`) for duplicate *suggestions* only
- Optional Web Speech API with typed fallback
- `localStorage` only (no accounts, no backend, no secrets)

## Roles

- Driver: Luis Ortega (invented)
- Coordinator: Ana Beltrán (invented)

Use the role switcher. Do not use the phone while driving; the form unlocks after “viaje terminado”.

## Docs

- `docs/PACKET.md` — pre-code packet (includes mockup embed)
- `docs/DECISIONS.md` — product decisions
- `docs/TEST_EVIDENCE.md` — only tests that were actually run
