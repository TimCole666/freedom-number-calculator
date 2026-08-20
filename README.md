# Freedom Number Calculator

A tiny, mobile-first, static calculator for the “Freedom Number” idea popularized in Noah Kagan’s *Million Dollar Weekend*.

The user enters six monthly expense buckets, optionally adds current independent income, and gets one prominent target:

> **Your Freedom Number — $X,XXX / month**

If independent income is provided, the result also shows the percentage already covered and the remaining monthly gap.

This is an unofficial independent companion tool. It does not use Noah Kagan, AppSumo, or *Million Dollar Weekend* branding or visual identity.

## MVP choices

- Vite + TypeScript + HTML/CSS/DOM; no UI framework.
- Fully static; no backend, database, auth, accounts, OAuth, payments, or API keys.
- Six monthly categories: Housing, Food, Transportation, Family / dependents, Fun / lifestyle, Other.
- Optional independent-income input.
- Mobile-first result and share loop.
- X Web Intent for one-tap handoff to the X post composer; no X API or OAuth.
- Copy-link fallback for any browser.
- Optional Umami analytics, disabled unless configured.
- Node built-in test runner; no test framework dependency.

## Privacy-minimal sharing

The user’s expense breakdown is **never placed in the shared URL**.

A shared result carries only the minimum state needed to understand the result:

```text
?fn=4850&cov=29
```

`fn` is the Freedom Number. `cov` is the optional independent-income coverage percentage. The exact independent-income amount is not shared either.

That means a recipient can see the social proof/result, then calculate their own number from a blank calculator without inheriting someone else’s personal expense assumptions.

## Attribution and propagation

Seed an initial social post with a simple source identifier:

```text
https://your-site.example/?src=x-post-01
```

When that visitor shares a result, the app creates a fresh random `via` token and increments `gen`:

```text
https://your-site.example/?fn=4850&cov=29&src=x-post-01&via=7KQ4M9T2&gen=1
```

If that recipient calculates and shares again, a new `via` is generated and `gen=2`.

No backend is required. The propagation join is:

```text
share_attempt.outgoing_via == later visit.via
```

A `visit` with `generation >= 1` is a propagated visit, so there is no separate `propagated_visit` event.

## Optional analytics

Analytics is a no-op by default. To enable Umami, copy `.env.example` to `.env.local` and set:

```bash
VITE_UMAMI_WEBSITE_ID=your-public-website-id
```

Umami Cloud is used by default. For a self-hosted tracker, also set:

```bash
VITE_UMAMI_SCRIPT_URL=https://analytics.example.com/script.js
```

These are client-side Vite values, not secrets.

Automatic pageview tracking is disabled. Search-query collection is excluded and Do Not Track is respected. The app sends only explicit experiment events:

| Event | Fields beyond source/via/generation |
| --- | --- |
| `visit` | `shared_result` |
| `calculation_complete` | `has_independent_income` |
| `share_attempt` | `method`, `outgoing_via`, `outgoing_generation` |
| `share_success` | `method`, `outgoing_via`, `outgoing_generation` |

The app deliberately does **not** send expense amounts, Freedom Number values, independent-income amounts, names, email addresses, account IDs, or its own persistent user identifier to Umami.

`share_success` currently means the result URL was successfully copied. Clicking “Post on X” records `share_attempt`; the browser cannot reliably know whether the user ultimately published the post, so the app does not pretend otherwise.

## Local development

Requirements: Node.js 22.12+ (the included `.nvmrc` uses 22.16.0).

```bash
npm install
npm run dev
```

Vite prints the local URL. You can test source attribution directly:

```text
http://localhost:5173/?src=x-post-01
```

And a propagated shared result:

```text
http://localhost:5173/?fn=4850&cov=29&src=x-post-01&via=7KQ4M9T2&gen=1
```

## Verification

```bash
npm test
npm run typecheck
npm run build
```

Production output is written to `dist/`. To inspect that production build locally:

```bash
npm run preview
```

## Deployment

Deploy the generated `dist/` directory to any static host at the site root. Shared state is query-string based, so no dynamic routes or SPA fallback rules are required for result links.

## What this MVP intentionally does not do

There are no growth projections, quit-your-job dates, investment returns, long-term simulations, FIRE calculations, tax models, or financial-planning recommendations. The product asks one question only:

> What monthly income would cover the lifestyle I want, and how much of that am I already covering independently?
