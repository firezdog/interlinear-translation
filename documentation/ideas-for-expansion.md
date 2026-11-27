# Ideas for expansion

## Browser persistence (GitHub Pages demo)

Today, reads load static JSON from `/passages/{key}/{page}.json`, while Save writes through a local webpack-dev-server API (`PUT /api/passage`) that updates files on disk. That write path only works in local development; a static deploy (e.g. GitHub Pages) can serve the shipped passages but cannot persist edits that way.

**Direction:** keep the original static passages as the immutable base, and use browser storage for user-authored state so Save works without a backend.

- **IndexedDB** for full edited passages (glosses, token transliteration/translation, user-created works). Better quota than `localStorage` for larger texts.
- **`localStorage`** (optional) for light UI prefs: last selected passage, transliteration toggle, etc.
- **Load path:** fetch shipped JSON → if a saved copy exists for that key/page, prefer it (or merge deltas onto the base).
- **Save path:** write the current passage into IndexedDB; leave `public/passages/` unchanged.
- **New passages:** store alongside edits; surface them in the passage picker together with the built-in catalog.

**Implications:** persistence is per browser / per origin (not synced across devices). Clearing site data resets local work. Good enough for personal study and for a public GitHub Pages demo; not a multi-user sync layer.

Fits the existing `InterlinearClient` (`read` / `write`): a storage-backed or hybrid client can replace the disk API for deploy builds while local file writes remain available in development if desired.

## AI-assisted passage authoring

**Direction:** use an AI agent/workflow to help author passages—tokenization, transliteration, gloss drafting, structural cleanup—rather than building every work by hand.

**Per-user on a static demo?** Not automatically. A GitHub Pages build has no server to hold a shared model key or run agents on behalf of visitors. Practical options:

| Approach | Works for each visitor? | Notes |
|---|---|---|
| **Bring-your-own key (BYOK)** in the browser | Yes, if they supply a key | User pastes an API key (stored locally); app calls the provider from the client. Privacy/cost sit with the user; public demos must warn about key handling. |
| **Shared demo API key** | Fragile | Easy to abuse; cost and rate limits land on the project owner. Poor fit for an open Pages site. |
| **Authoring offline / in Cursor** | For the maintainer | Agent-assisted authoring in the repo (or via a local tool) produces JSON that ships in `public/passages/`. Visitors get the result, not the agent. |
| **Dev-only create middleware** | For the maintainer (local `npm start`) | `POST /api/ai/passage` on webpack-dev-server calls Gemini with `GEMINI_API_KEY` from `.env`. The key never enters the bundle or the Pages deploy; production stays static and AI create is unavailable there. |
| **Backend / serverless proxy** | Yes, with hosting | A small API can mediate LLM calls (auth, quotas, prompts). Leaves pure static hosting. |

So: AI authoring is a strong fit for **producing** shipped passages (and for power users with their own keys). It does not, by itself, give every GitHub Pages visitor a free shared agent unless you add keys-per-user or a backend.

**Local AI create:** copy `.env.example` → `.env`, set `GEMINI_API_KEY`, then `npm start`. New Passage → “AI (Gemini)” uses the middleware; Local tokenize works without a key. Dev-only — key never ships.

**Open questions:** scope of assistance (full passage bootstrap vs. gloss suggestions only); whether output must validate against `interlinear.schema.json` before Save; and whether agent features are demo-only for the maintainer or productized for end users via BYOK.

## Deploy action (GitHub Pages)

**Status:** shipped. [`.github/workflows/deploy-pages.yml`](../.github/workflows/deploy-pages.yml) builds on push to `main` (and `workflow_dispatch`) and publishes via the official Actions Pages flow (`actions/upload-pages-artifact` + `actions/deploy-pages`)—no `gh-pages` branch, no third-party deploy actions.

- **Build:** `npm ci` → `npm test` → `PUBLIC_PATH=/interlinear-translation/ npm run build` → upload `dist/`. Failed tests block the deploy.
- **Base path:** webpack `output.publicPath` and passage fetches (`src/clients/basePath.ts`) both honor `PUBLIC_PATH`, so the project site at `https://firezdog.github.io/interlinear-translation/` resolves assets and `/passages/...` correctly. Local `npm start` keeps the default `/`.
- **One-time repo setup:** Settings → Pages → Source → **GitHub Actions**.

The local `PUT /api/passage` middleware is not part of the deploy artifact. Save on the live demo still depends on the browser-persistence work above.
