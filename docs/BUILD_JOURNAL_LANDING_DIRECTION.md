# Build Journal Landing Direction

Status: owner-approved implementation direction; not yet production-approved.

## Purpose

The Build Journal should tell the story of building through questions, evidence, decisions, and changed beliefs. It should not duplicate product-site copy, the private Workspace, the creative Portfolio, or general Writing / Ideas.

A visitor should understand within roughly ten seconds:

- real products are being built in public;
- the journal preserves reasoning, not only launches;
- entries show how a question moved through build, evidence, decision, and outcome.

## Landing-page hierarchy

### 1. Opening

Keep the opening concise. Use one strong Build Journal statement and one primary action. Do not explain the entire ecosystem above the fold.

Directional framing:

**BUILD JOURNAL**
The decisions, experiments, failures, and evidence behind what I build.

Primary action: **Explore the journal**.

### 2. Current questions

Organize the landing page around active questions rather than product-description cards.

Current examples:

- **LEDGATo** — Can an AI agent actually be stopped before it crosses an unauthorized boundary?
- **ALVIRA** — Does persistent context measurably make AI more useful?
- **AgentOS** — Can an agent workforce reliably run work without constant founder intervention?
- **ailhat** — Can intelligence across an agent portfolio reveal what humans would otherwise miss?

Products are threads beneath the questions. Do not imply equal execution priority where that is not true.

### 3. Journal model

Prefer one visual sequence over explanatory prose:

**QUESTION → BUILD → EVIDENCE → DECISION → WHAT CHANGED**

Deeper methodology belongs behind progressive disclosure or within entries.

### 4. Recent evidence

Use a small changing feed of concrete artifacts and outcomes: tests, screenshots, decisions, corrections, deployments, before/after states, and dated evidence.

The landing page should increasingly show proof rather than paragraphs describing the fact that work is happening.

## AI from Zero callout

AI from Zero is an education layer, not another startup and not another product card.

Place a distinct, visually differentiated callout after current questions/evidence.

Directional framing:

### AI from Zero
**Learning the language of building with AI by building real things.**

A practical reference for concepts that appear throughout the journal — agents, harnesses, CLIs, Markdown, context, approvals, evidence, deployment, and related foundations — explained for people who want to understand the work without already being engineers.

CTA: **Explore AI from Zero →**

## Content-density rules

- Reduce repeated ecosystem explanation.
- Prefer visuals, artifacts, statuses, screenshots, diagrams, tests, and timestamps over prose where they can carry the meaning.
- Use progressive disclosure for depth.
- Clearly distinguish concept, prototype, preview, owner-only, and production capability states.
- Mobile must use normal document flow and must not rely on hidden-discovery interactions for essential navigation.
- Preserve the established ASHWOOD editorial identity; do not restart the design system.

## Information architecture

- **Product sites** explain and sell individual products.
- **Workspace** privately operates the portfolio.
- **Build Journal** publicly preserves the reasoning and evidence trail.
- **Portfolio** presents creative and professional work.
- **AI from Zero** teaches the machinery encountered while building.

## /going decision

`/going` is removed as a standalone public destination because its existing function duplicated About, Portfolio, Build Journal, and Workspace. Its strongest thesis language may be reused selectively elsewhere, especially:

> Build the life that can carry who you are.

Do not recreate `/going` unless a future version has a clearly distinct job that cannot be served by the existing surfaces.

## Release boundary

This document authorizes the direction, not an automatic production push of the Build Journal redesign. Public Build Journal rendering changes should still receive desktop/mobile review before merge or production promotion.
