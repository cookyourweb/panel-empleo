# Job panel

*[Leer en español](README.es.md)*

It finds the best paying jobs across several sources and emails them to you. You just
accept or decline. If you accept, it prepares your CV for that specific role, and if
something is missing, it does not lie: it helps you learn it.

That is not a plan. It has been running in production since July 2026. This
repository is the panel being built on top of it: the shared place a job search is
still missing.

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

## The system already running

Before this panel existed, the pipeline that finds jobs, filters them and writes the
documents was already working end to end. What follows describes what runs today, not
what is planned.

### In production since July 2026

A n8n workflow of about fifty nodes runs every morning at nine. It searches, filters,
notifies and, once a job is approved, triggers the document generation. **None of this
is simulated**: it runs against real data every morning.

### Real postings, learned the hard way

The previous version of the system asked a language model for job postings. It
answered with postings that sounded plausible and did not exist. **Postings now come
from three real sources by API** (Tecnoempleo, Adzuna, Remotive), filtered by each
person's stack, with anything already saved discarded before it reaches the inbox.

### LinkedIn takes a different path, on purpose

LinkedIn offers no API for this, so it comes in another way: a daily task where an
agent with browser access opens the posting and fills in the record. Where there is an
API, it gets used. Where there is not, an agent does the work a person would do, once a
day and with a bounded scope, instead of running a permanent scraper that is fragile
and puts the account at risk.

The list of sources grows by adding a source, not by rebuilding the system.

### The text is written by a model, the truth is not

Generating the CV and the cover letter lives in a separate service, `cv-server`,
deployed on Render. It carries its own guardrails against
overstatement, and **its evaluation cases were built from real production failures**,
not imagined ones. The CV it writes is built to get through the automated screening
filters that reject on keywords and formatting before a human ever reads it. Good
candidates are lost over how a document is written, not over what they know.

A model does not fail with an exception: it returns something plausible and worse.

### Different models for different tasks

The CV is written by `claude-haiku-4-5`. The cover letter, shorter and closer to a
human voice, is written by `claude-sonnet-4-6`.

### The flow, today

Search at nine in the morning, filter by profile, notify by email. From that same
email the person approves, discards, or forwards the posting to the company: two
options, or a forward, from the inbox. **Approving is what triggers generation**,
whether it comes from the email or, once the panel supports it, from the person's own
hand on the board.

### Secrets do not depend on anyone remembering

The n8n webhooks run actions with effects outside the system, so their routes cannot
sit in a public repository. A checker runs on the pre-commit hook and in continuous
integration, and it fails the moment it finds one. **It was written after discovering
the routes had been public for months.**

A written rule is not a control. A control is code that fails.

### A workflow you can diff

An n8n export is a single JSON file with every code node packed
inside an escaped string: a change of three lines is invisible in `git diff`. There
are tools built for this that split it into readable pieces, rebuild it, and check it
against eight rules drawn from real incidents.

This project is the face being built for that system.

## What the panel adds

Today a single application lives split across four places with no link between them:
the posting and its status in Notion, the CV in Google Drive, the interview prep in a
folder inside a git repository, and the tracking of what comes next in the head of
whoever is looking for the job.

**There is no shared place.** The panel is meant to be that place.

**One measurement backs this up.** The fields the system fills in automatically when
it captures a posting are present in more than eighty percent of rows. The fields that
have to be typed by hand after each contact (the stage of the process, the format of
the technical test, the interview date, the name of the person on the other side) sit
below fifteen percent. They are not empty because they do not matter. They are empty
because filling them means leaving the flow to edit a row by hand.

If recording something costs less than not recording it, the board maintains itself.
That is the principle guiding what the panel builds next.

## What is built, and what is not

The panel is under construction and has no product screens yet. Saying otherwise would
make this document worse than having none at all.

Built so far:

- Scaffolding for an Angular 22 application with signals and standalone components.
- A design system carried over from the agency's own site, with its contrast tests.
- The domain (`Oferta`, `Candidatura`, the eight states) separated from any concrete
  data source.
- One screen: a list with filters, running on bundled sample data.

Not built yet:

- Any connection to `cv-server` or to live data. The list runs on sample data alone.
- The board actions described above: approving or discarding a job from the panel
  itself instead of from the email.
- Any screen beyond the list: no candidature detail view, no interview prep view.

## What it does

Two things make it trustworthy: knowing who you are, and the rule that never bends.

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
job can exist with nobody applying to it, and two people can apply to the same one and be
at different points.

`RepositorioDeCandidaturas` is the seam the whole thing hangs from. The app depends on that
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
