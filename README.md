# Idol Producer: Chronicle

FM-style Japanese female idol producer sim. You are the **Producer** — Inbox is the workbench; day is the default advance unit. Tagline: *The Stages We Shared.*

This repository currently ships a **mobile-first story-mode shell** (Vertical Slice A kickoff): four bottom tabs, mock Inbox with full-page detail, day advance, prologue founders, and Manage module navigation. Simulation engine, Live runtime, auth, database, and `idol-data-lab` sync are out of scope for this slice.

## Design source

Product IA and prologue rules live in the **Project Context** design doc (Chronicle Story Mode + Mobile UX **v0.6**), not necessarily committed here. Treat that doc as the source of truth when implementing features.

## Run locally

```bash
npm install
npm run dev
```

Dev server: [http://127.0.0.1:3847](http://127.0.0.1:3847) (port **3847**).

Open `/inbox` (root redirects there). Inbox ships with SSR sample items; `/api/inbox` backs empty/error previews. Day advance (`翌日へ`) is a server action writing a cookie — works without client hydration.

```bash
npm run build
npm start   # also port 3847; prefer this if `next dev` HMR websockets are blocked
```

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · shadcn/ui

## What’s mocked

- Inbox Blocking / Actionable / Report / Ambient sample items
- Game date starting `2013-01-07` JST with client-side `翌日へ` / Advance 1 Day
- Founders: 星野莉奈 · 宮原優花 · 小日向陽菜
- Manage modules: Making · Training · Live · Audition · Finance · Policy (nav stubs only)
