# Job panel

*[Leer en español](README.es.md)*

**A job search system that automates the repetitive work without automating the
decisions that belong to the candidate.**

This repository is its front end: an Angular 22 panel where every application lives in
one place, with its CV, its cover letter and its tracking. The jobs, the tailored
documents and the daily search already run in production. The panel is where the
candidate reviews and decides.

## At a glance

| What is technically interesting | Where to look |
|---|---|
| State in signals, standalone components, `OnPush`, no `zone.js` | [Engineering decisions](#engineering-decisions) |
| Hexagonal ports: the screens never know where data comes from | [Inside the app](#inside-the-app) |
| TDD with Vitest: 305 component tests and 53 design token tests | [Development](#development) |
| Sign-in by invitation: the token lives in memory only and a scoped interceptor sends it to one origin | [Sign-in](#sign-in) |
| Public welcome page only; the panel sits behind sign-in in every environment | [Routes and access](#routes-and-access) |
| Contrast tests that read the stylesheet from disk | [The contrast tests](#the-contrast-tests) |

## Try it

| Mode | Command | Data | Sign-in |
|---|---|---|---|
| Demo data | `npx ng serve --configuration production` | Sample data bundled with the project | Yes |
| Development with real data | `npm start` | Local files and a local bridge that are not in this repository | Yes |

You can run the demo data right after cloning (the panel still asks for an invited Google account). The development mode needs files and a bridge
that live outside this public repository (see [Development](#development)).

Looking for work is usually a collection of disconnected tools. Jobs are discovered on
several platforms. Applications are tracked somewhere else. The CV lives in a folder,
interview preparation in another, and follow-ups depend on memory.

The result is predictable: the work that takes time gets skipped. The same CV goes
everywhere, the cover letter only swaps the company name, and roles get picked by their
title because reading them all does not fit in the hours available. Everyone knows the
results are worse. It happens anyway, because the alternative is sending nothing.

This is not a discipline problem. **It is a tool for doing a rigorous job search without
the time it takes making rigour impossible.**

---

## The principle: adapt, do not invent

> **Tailoring is choosing. Lying is adding.**

A tailored CV should emphasise different parts of a person's real experience. It should
not invent skills or turn partial exposure into expertise. It is designed not to invent: what it adds is checked against the master CV and flagged. Exaggerated role scope is not yet detected automatically.

When a role asks for something the candidate does not have, the system names the gap
instead of hiding it. The rule that governs tailoring puts it in terms anyone can check:

> A tailored CV does not change who you are. It changes which part of your experience
> comes first. And the line between repositioning and inventing is not what you write:
> it is whether you can defend it for forty minutes in front of someone technical.

An example. For a role in a domain the person has never worked in, the system does not
write «I have experience in that domain», which would be a lie. It writes that they have
worked in domains where a mistake has real consequences, which is true and can be
defended.

This is not a moral footnote. It is the reason the whole thing is built the way it is:
every document is generated from a master CV that the candidate wrote. **It is designed not to invent: what it adds is checked against the master CV and flagged. Exaggerated role scope is not yet detected automatically.**

## What it does

```
Find      several sources, once a day
Filter    against a real candidate profile, not a keyword
Review    by email: approve, decline, or forward
Generate  tailored CV and cover letter, on approval
Apply     and record it in the same gesture
Track     what happened, when, and who to chase
```

The first five steps run in production. The last one is what this repository is
building.

**The system automates the work. The candidate keeps the judgement.** It never decides
whether to apply, and it never sends anything on its own.

## Running in production

Since July 2026, against real data, every morning at nine. An n8n workflow of around
fifty nodes searches, filters, notifies and, the moment a role is approved, triggers
document generation.

**Real jobs, learned the hard way.** An earlier version asked a language model for the
jobs. It returned roles that sounded plausible and did not exist. They now come from
three real sources through their APIs (Tecnoempleo, Adzuna, Remotive), filtered against
the candidate's stack, with anything already stored discarded before it reaches the
inbox.

**LinkedIn arrives another way, on purpose.** LinkedIn offers no API for this, so it
comes through a daily task where an agent with browser access opens the posting and
fills in the record. Where there is an API, use it. Where there is not, an agent does
the work a person would do, once a day and with a bounded scope, rather than running a
permanent scraper that is fragile and puts the account at risk. The list of sources
grows by adding a source, not by rebuilding the system.

**The model writes the text. It does not write the truth.** Generating the CV and the
cover letter lives in a separate service, `cv-server`, deployed on Render, with its own
guardrails against exaggeration and evaluation cases built from real production
failures, not imagined ones. The CV it writes is built to get through the automated
screening filters that reject on keywords and formatting before a human reads anything.
Good candidates are lost over how the document is written, not over what they know.

> A model does not fail with an exception. It returns something plausible and worse.

In production, `cv-server` writes both the CV and the cover letter with
`claude-sonnet-4-6`.
If Claude fails, `openai/gpt-oss-120b` takes over, then Gemini, then Claude Haiku 4.5,
and every response reports the model used in `modelo_usado`.

**Secrets do not depend on anyone remembering.** The n8n webhooks trigger actions with
effects outside the system, so their paths cannot live in a public repository. A checker
runs in the pre-commit hook and in continuous integration and fails the moment it finds
one. It was written after discovering the paths had been public for months.

> A written rule is not a control. A control is code that fails.

**The workflow can be diffed.** An n8n export is a single JSON file with every code node
buried inside an escaped string: a three line change is invisible in `git diff`.
Purpose-built tools split it into readable pieces, put it back together, and check it
against eight rules that came out of real breakages.

## What this repository is building

Today one application lives in four places with no link between them: the job and its
status in Notion, the CV in Google Drive, interview preparation in a folder inside a git
repository, and the follow-up in the candidate's head.

**There is no common place. The panel is meant to be that place.**

There is measured evidence behind it. The fields the system fills in when it captures a
job are present in more than eighty per cent of rows. The fields someone has to write by
hand after each contact (the stage of the process, the format of the technical test, the
interview date, the name of the person on the other side) sit below fifteen per cent.
They are not empty because they do not matter. They are empty because filling them means
leaving the flow and editing a row by hand.

If recording something costs less than not recording it, the board maintains itself.
That is the criterion that decides what gets built next.

### What is built, and what is not

The panel already has the screens a candidate uses every day. The table, the side panel
and the detail page run on sample data in the demo build. Actions, editing and deleting
only work with real data in development: the demo has none of them switched on.

| Screen | What you can do |
|---|---|
| Applications table | Sort, search, choose columns (31 available, your choice is stored in `localStorage`), newest first |
| Side panel | Open an application without leaving the table and move to the previous or next one |
| Detail page | Read the full job, the embedded CV and cover letter, and the content of the Notion page |
| Actions | Approve, discard and send, using the same links the daily email uses |
| Editing | Change the fields of an application through a local bridge to Notion |
| Selection | Select rows, move them to the Notion trash, change their status and undo |
| Sign-in | Enter with a Google account that has been invited (see [Sign-in](#sign-in)) |

Not built yet:

- Interview preparation view.
- Panel-owned storage. Postgres (Neon) is **planned** (ADR-002 in the
  [system repository](https://github.com/cookyourweb/buscartrabajo)), not implemented.
- Per-user data in production. The public site shows demo data to invited accounts only
  until each user has their own.

## Sign-in

Added on 7 October 2026. Since 8 October 2026 it protects the panel in every environment, demo data included.

| Piece | What it does |
|---|---|
| `ProveedorDeIdentidad` (port) and `IdentidadGoogle` (adapter) | Sign in with Google Identity Services. The panel does not know which provider is behind the port |
| `Sesion` | Holds the token in memory only. It is never written to `localStorage` or cookies, so reloading the page signs you out |
| `Servidor` | Health check of `cv-server`, used to detect a cold start |
| `soloConSesion` | Functional route guard: no session, no panel |
| `conToken` | HTTP interceptor. It adds `Authorization: Bearer` **only** to the origin of `cv-server`, never to the local bridge or to third parties, and on a `401` it ends the session and goes back to sign-in |
| Sign-in page | Shows a cold start message after 3 seconds (the free server sleeps) and offers a retry at 90 seconds |

`cv-server` validates the token on `GET /yo` and checks the account against an
invitation allowlist. The Google client id in `src/app/sesion/configuracion.ts` is public
on purpose: it is not a secret, and Google protects it with the authorised origins set in
its console.

### Routes and access

The guard applies to the whole panel in development and in production. Only the welcome
page and the sign-in page are public. The public site shows a welcome page, says the
product is coming soon and that access is by invitation, and links to the CookYourWebAI
waiting list (an external Tally form; the panel itself stores no data). Until per-user data exists, an invited account sees
the demo data in production.

| Route | Access | What it shows |
|---|---|---|
| `/` | Public | Welcome page: what the product is, "coming soon", waiting-list link, link to sign in |
| `/entrar` | Public | Google sign-in; on success it goes to `/panel` (or to the safe `volver` route) |
| `/panel` | Session required | Applications table with the side panel |
| `/panel/candidatura/:id` | Session required | Detail page of one application |
| anything else | Public | Redirects to `/` |

---

## Internationalization

The panel comes in Spanish (the source language) and English, with Angular's official
`@angular/localize`. It is resolved at compile time: one build per language, served under
`/es/` and `/en/`, with no translation code at runtime. `/` redirects by the
`Accept-Language` header (see `vercel.json`), and a switcher in the header links to the
same screen under the other prefix.

- **What is translated:** the interface (titles, buttons, labels, column headers,
  messages, `aria-label`s, route titles). The data (jobs, companies, descriptions) stays
  in Spanish on purpose: it is sample data, not interface.
- **Dates, numbers and alphabetical order** follow `LOCALE_ID`. Nothing hard-codes a
  locale.
- **Every message has a hand-written id** (`@@area.name`). A generated id changes when a
  typo is fixed and leaves the translation orphaned without warning.

**Adding a language:**

1. Declare it in `angular.json` under `i18n.locales` (its `translation` file and its
   `subPath`) and in `src/app/idioma/idiomas.ts`, with its name written in that language.
2. Run `npx ng extract-i18n --format xlf2 --output-path src/locale` to refresh
   `src/locale/messages.xlf`, the source.
3. Copy it to `src/locale/messages.<code>.xlf`, add `trgLang` to the header and a
   `<target>` to every unit.
4. Add a rewrite for the new prefix in `vercel.json`, plus a redirect rule if
   `Accept-Language` should pick it.

**The completeness test.** With one build per language, a missing translation stays in
Spanish without a warning. `tools/i18n.test.ts` reads `angular.json` and, for each
language, fails if a message has no translation, if a target is empty, if a placeholder
was dropped, if an obsolete message is left over, or if `messages.xlf` is out of date
with the ids in the code. A new language is checked without touching the test.
`tools/vercel.test.ts` does the same for the per-language routing and the redirect.

**Locally:** `npm start` and `npx ng serve --configuration production` serve Spanish, and
`npx ng serve --configuration production-en` serves English. The dev server serves one
language at a time, so the header switcher only works once deployed.

## Engineering decisions

**Angular 22 without `zone.js`, with signals and standalone components.** Change
detection runs on signals, which is how Angular is written today.

**Hexagonal ports.** `RepositorioDeCandidaturas`, `FuenteDeAcciones`,
`EditorDeCandidaturas` and `ProveedorDeIdentidad` are abstract classes. Each one has a
demo or local adapter and the app picks one by mode, so the same screens run on sample
data, on real data or in tests.

**Vitest.** It has been the default runner since Angular 22, and Karma is on its way
out.

**The design system is not invented here.** These are the CookYourWeb brand tokens,
measured in OKLCh and already proven on the agency site. They travel with their
twenty-six contrast tests.

**They are copied, not shared through a library.** Not yet. With one live consumer and
another about to exist, the boundary between what is shared and what belongs to each
product would be drawn by guessing, and a badly placed boundary costs more than copying.
They will be extracted once there are two real cases to look at. An abstraction is
discovered, not invented.

**Multi-user by design.** The problem does not belong to one person, so the system is
not built for one. There is no «once we open it up to multiple users»: adding isolation
later means migrating data and touching every query, and forgetting a single one leaks
someone else's data.

## The contrast tests

Every colour pair in the system is checked with the WCAG relative luminance formula. If
a text pair drops below 4.5:1, or a border or focus ring drops below 3:1, the suite
fails.

They read `src/styles.css` **from disk**, not a copy of the values. That difference is
everything: with the values copied into the test, the suite would always pass, even with
the panel rendered unreadable.

They are not a formality. Applied to the agency site these tokens come from, they found
three defects that had been there for months and that looking at the screen does not
reveal: an error red at 3.59:1, and borders at 2.90:1 in dark theme and 1.42:1 in light.
The third came from a wrong rule in the design documentation itself, written with
measured data.

> The eye adapts. Contrast is calculated.

## Architecture

| Piece | Role | Status |
|---|---|---|
| n8n | Searches, filters, notifies and triggers generation | In production |
| Notion | Where jobs and their status are stored today | In production |
| `cv-server` | Writes CV and cover letter, validates sign-in | In production |
| This panel | Reviews and decides | Screens built, see above |
| Postgres | Future data store for the panel | Planned (ADR-002) |

n8n writes to Notion and calls `cv-server`. The panel talks to `cv-server` for sign-in.
In development it also reads local files and uses a local bridge to Notion. The panel
does not reach Notion, Drive or a language model from the browser: the browser never
sees a third party credential.

### Inside the app

```
src/app/ofertas/
  dominio.ts                      Oferta, Candidatura and the nine states
  repositorio-de-candidaturas.ts  where they come from, as an abstract class
  candidaturas.store.ts           state in signals, plus the count per state
  ofertas.page.ts, detalle.page.ts  the table and the detail page
  editor-de-candidaturas.ts       editing through the local bridge
  fuente-de-acciones.ts           approve, discard and send links
src/app/sesion/                   sign-in: port, Google adapter, in-memory session,
                                  guard and interceptor
src/app/entrada/                  the sign-in page
tools/design-system/              contrast formula and token reader, run in Node
```

An `Oferta` describes a job and carries no state. State belongs to the `Candidatura`: a
job can exist with nobody applying to it, and two people can apply to the same one and
be at different points.

`RepositorioDeCandidaturas` is the seam the whole thing hangs from. The app depends on
that abstract class, never on a concrete source. That is what lets the public demo run
on sample data bundled with the front end, with no live backend behind it, and what lets
the tests run without a network.

It is an abstract class rather than a TypeScript interface on purpose: interfaces vanish
at compile time, and dependency injection needs something that exists at runtime.

State lives in signals, with the store exposing them read-only. The count per state is a
`computed`: it is derived from the applications, so it cannot drift out of sync with
them.

## How the work is done

A failing test, the smallest piece that turns it green, then a commit. Commit messages
explain why something was done, not what changed: the diff already says that.

Delivery goes in complete vertical slices, not in layers. The first one stands on its
own: see the jobs, open one, generate CV and cover letter, download. The second closes
the tracking loop, which is the problem described above.

Since 8 Oct 2026 commit messages and code comments are written in English (see
[CONTRIBUTING](CONTRIBUTING.md)). Earlier history and the design documents are in Spanish,
the language the reasoning was done in.

## Development

Requires Node 22, pinned in `.nvmrc`.

```bash
nvm use
npm ci
npx ng serve --configuration production   # demo data, sign-in required
npm start                                 # development: real data, sign-in
npx ng test --watch=false                 # 305 component tests
npm test                                  # those 305 plus 53 design token tests
```

### Real data in development

`npm start` reads real applications from `public/local/candidaturas.json`, which is
gitignored, and proxies `/api` to a local bridge on `127.0.0.1:4300`. The script that
creates that file and the bridge live in a **private** repository, so whoever clones this
one does not have them. Without them, run the demo.

### Sign-in in development

`cv-server` must run on `localhost:5000` with these environment variables set:
`OIDC_AUDIENCIA`, `OIDC_EMISORES`, `OIDC_JWKS_URL`, `INVITADAS` and
`CORS_ORIGENES=http://localhost:4200`. See the
[`cv-server` repository](https://github.com/cookyourweb/cv-server) and its
`.env.example` for what each one means.

### Tests

The tests run in two runners on purpose. Component tests run in a browser; contrast
tests read the stylesheet from disk and run in Node. Mixing them would mean compiling
filesystem code for the browser, which is not where it lives.

## Documentation

Decisions and their reasoning live in the system's repository, not in a vendor tool.
They are written in Spanish:

- [Architecture decisions](https://github.com/cookyourweb/buscartrabajo/blob/develop/docs/diseno/2026-09-05-decisiones-arquitectura.md).
  What is settled, what is a default, and what still has to be argued. Each entry says
  why, and what it would cost to change later.
- [Panel design](https://github.com/cookyourweb/buscartrabajo/blob/develop/docs/diseno/2026-09-05-panel-empleo-angular-design.md).
  Scope, data model, delivery slices, and an explicit list of what is left out.
- [Design system tokens](https://github.com/cookyourweb/buscartrabajo/blob/develop/docs/diseno/2026-09-05-tokens-design-system.md).
  The four brand ramps, their measured contrast, and the usage rule.
- [Startup plan](https://github.com/cookyourweb/buscartrabajo/blob/develop/docs/diseno/2026-09-06-plan-arranque-panel-angular.md).
  How the pieces fit together and the rules that keep them apart.

## License

[PolyForm Noncommercial 1.0.0](LICENSE). You can read, study and use this code for personal, learning or other noncommercial purposes. Commercial use, such as selling it, offering it as a service or using it in a for-profit company, needs permission: get in touch through [cookyourwebai.es](https://cookyourwebai.es).
