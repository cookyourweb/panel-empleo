# Job panel

*[Leer en español](README.es.md)*

**A job search system that automates the repetitive work without automating the
decisions that belong to the candidate.**

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
not invent skills, stretch responsibilities, or turn partial exposure into expertise.

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
every document is generated from a master CV that the candidate wrote. **There is
nowhere to pull from what does not exist.**

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

Different models for different jobs: the CV is written by `claude-haiku-4-5`, the cover
letter by `claude-sonnet-4-6`.

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

The panel has no product screens yet. Saying otherwise would make this document worse
than not having one.

Built so far:

- An Angular 22 application shell with signals and standalone components.
- A design system inherited from the agency site, with its contrast tests.
- The domain (`Oferta`, `Candidatura`, the eight states) separated from any concrete
  data source.
- One screen: a list with filters, running on sample data bundled with the project.

Not built yet:

- Any connection to `cv-server` or live data. The list runs on sample data only.
- Approving or declining from the panel instead of from the email.
- Any screen beyond the list: no application detail, no interview preparation view.

---

## Engineering decisions

**Angular 22 without `zone.js`, with signals and standalone components.** Change
detection runs on signals, which is how Angular is written today.

**Vitest.** It has been the default runner since Angular 22, and Karma is on its way
out.

**The design system is not invented here.** These are the CookYourWeb brand tokens,
measured in OKLCh and already proven on the agency site. They travel with their
twenty-four contrast tests.

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

```
n8n  ->  Notion
                \
                 '->  cv-server  <-  this panel
                          |
                          '->  Postgres, Drive, models
```

The panel talks only to `cv-server`. Never to Notion, Drive, or a language model: the
browser never sees a third party credential.

### Inside the app

```
src/app/ofertas/
  dominio.ts                      Oferta, Candidatura and the eight states
  repositorio-de-candidaturas.ts  where they come from, as an abstract class
  candidaturas.store.ts           state in signals, plus the count per state
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

Commit messages and design documents are written in Spanish. They are the author's
reasoning, and they read better in the language they were thought in.

## Development

Requires Node 22, pinned in `.nvmrc`.

```bash
nvm use
npm ci
npm start          # development server
npm test           # component and contrast tests
npm run build
```

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
