# Job panel

*[Leer en español](README.es.md)*

It finds the best paying jobs across several sources and emails them to you. You just
accept or decline. If you accept, it prepares your CV for that specific role, and if
something is missing, it does not lie: it helps you learn it.

## The problem

Preparing one application properly takes close to an hour: reading the posting, deciding
whether it actually fits, tailoring the CV, writing a cover letter that does not read
like a template, and sending it wherever it has to go.

People looking for work do not have that hour, let alone multiplied by every place they
have to check: LinkedIn, Tecnoempleo, Adzuna, Remotive, each company's own careers page,
every one of them with its own way of searching and notifying.

So corners get cut. The same CV goes everywhere, the cover letter only swaps the company
name, and postings get picked by their title because reading them all does not fit in
the hours available. Everyone knows the results are worse. It happens anyway, because
the alternative is sending nothing.

The first thing to go is the record keeping. A board that says «pending» about
applications sent weeks ago stops being useful for the only thing that mattered: knowing
who to follow up with, who replied, and what is dead.

This is not a discipline problem. It is a time problem: you need one hour per source,
and there is one hour for all of them.

## What it does

It searches for the best paying roles across several sources at once and sends them by
email. You just accept or decline.

### First, who you are

One form, filled in once. It takes your master CV, the full one with nothing trimmed,
the roles you can apply for, and your conditions: salary, whether you want remote,
hybrid or on-site, and which languages you can work in.

That master CV is **your single source of truth**. Everything the system writes later
comes from there and from nowhere else.

Everything else depends on that detail. Without a real profile, «the jobs that fit you»
means nothing, and the no-lying rule would be a statement of good intentions rather than
a consequence of how the system is built. There is nowhere to pull from what does not
exist.

### Then, the loop

1. **It searches by salary, across several sources at once.** Pay is a search criterion,
   not something you check after everything else.
2. **It notifies by email.** No need to log into anything to see whether something new
   arrived.
3. **You accept or decline.** That is the whole decision being asked of you: two
   options, one gesture.
4. **If you accept, it generates the CV for that specific role**, built to get through
   the automated screening filters that reject on keywords and formatting before a human
   reads anything. Good candidates are lost over how the document is written, not over
   what they know.
5. **And the part that changes everything else: it does not lie to make you fit.** If
   something the posting asks for is missing, the system says so and points you towards
   learning it, instead of padding the CV the way the rest of the industry does.

### The rule that does not bend: no lying

When someone is missing something a posting asks for, the industry's usual answer is to
pad: adding the technology you do not have, turning a «contributed to» into a «led»,
stretching three months until they look like solid experience. It reads better and it is
a lie.

Here the answer is different: **when something is missing, others lie; here you learn
it.** The system points out the gap and helps close it, instead of disguising it in the
CV.

This is not a moral footnote. The rule that governs CV tailoring puts it in terms you
can actually check:

> A tailored CV does not change who you are. It changes which part of your experience
> comes first. And the line between repositioning and inventing is not what you write:
> it is whether you can defend it for forty minutes in front of someone technical.

An example of the difference. For a role in a domain the person has never worked in, the
system does not write «I have experience in that domain», which would be a lie. It
writes that they have worked in domains where a mistake has real consequences, which is
true and can be defended. Repositioning is legitimate. Inventing is not.

Tailoring is choosing. Lying is adding.

### Where the jobs come from

Tecnoempleo, Adzuna and Remotive come in through scheduled workflows against their APIs.
LinkedIn offers no API for this, so it arrives another way: a daily task where an agent
with browser access opens the posting and fills in the record.

That asymmetry is deliberate. Where there is an API, use it. Where there is not, an
agent does the work a person would do, once a day and with a bounded scope, rather than
running a permanent scraper that is fragile and puts the account at risk.

**The list of sources grows.** Adding a job board means adding a source, not rebuilding
the system.

### The design principle

One, and it applies to everything: **if recording something costs less than not
recording it, the board maintains itself.**

There is a working system behind this: the ingestion described above, and a FastAPI
service that generates the tailored documents with its guardrails in place. This project
is its face.

**Status: under construction.** Scaffolding, design system and tests are in place. There
are no screens yet.

## Decisions

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

The eye adapts. Contrast is calculated.

## How the work is done

A failing test, the smallest piece that turns it green, then a commit. Commit messages
explain why something was done, not what changed: the diff already says that.

Delivery goes in complete vertical slices, not in layers. The first one stands on its
own: see the jobs, open one, generate CV and cover letter, download. The second closes
the tracking loop, which is the problem described above.

Commit messages and design documents are written in Spanish. They are the author's
reasoning, and they read better in the language they were thought in.

## Running it

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

## Architecture

```
n8n  ->  Notion
                \
                 '->  cv-server (FastAPI)  <-  this panel
                          |
                          '->  Postgres, Drive, models
```

The panel talks only to `cv-server`. Never to Notion, Drive, or a language model: the
browser never sees a third party credential.

### Inside the app

```
src/app/ofertas/
  oferta.ts                  the domain type and its eight states
  repositorio-de-ofertas.ts  where jobs come from, as an abstract class
  ofertas.store.ts           state in signals, plus the count per state
tools/design-system/         contrast formula and token reader, run in Node
```

`RepositorioDeOfertas` is the seam the whole thing hangs from. The app depends on that
abstract class, never on a concrete source. That is what lets the public demo run on
sample data bundled with the front end, with no live backend behind it, and what lets
the tests run without a network.

It is an abstract class rather than a TypeScript interface on purpose: interfaces vanish
at compile time, and dependency injection needs something that exists at runtime.

State lives in signals, with the store exposing them read-only. The count per state is a
`computed`: it is derived from the jobs, so it cannot drift out of sync with them.

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
