# ASHWOOD Deployment Review Contract

Purpose: keep the private Workspace playtest checklist current as ASHWOOD changes, without relying on the founder or an agent to remember to manually copy new review items into a dated checklist.

## Rule

A production deployment that changes a potentially user-facing ASHWOOD surface creates an unchecked review item in `/workspace/v3-playtest/` the next time the authenticated Workspace loads.

The item remains pending until the founder explicitly checks it off. Deployment success, CI success, agent review, preview review, or a merge does not count as founder review.

## Source of truth

The detector uses Vercel's production deployment metadata (`VERCEL_ENV=production` and `VERCEL_GIT_COMMIT_SHA`) and reads the matching public GitHub commit for `tk-ap/ashwood-info`.

Potentially user-facing changes include HTML, CSS, browser/server JavaScript, JSON/runtime configuration, media assets, and API behavior. Documentation, tests, scripts, GitHub workflow files, and the review system's own files are excluded to avoid self-generated noise.

## What is generated

Each unobserved production commit gets one deployment-level review item containing:

- commit subject
- production commit SHA
- deployment/commit timestamp
- affected ASHWOOD areas
- changed files (capped for display/storage)
- a human confirmation checkbox
- a private observation/note field

This is intentionally conservative: a deployment may generate a review item for a user-facing refactor even when behavior did not materially change. False-positive review work is preferred to silently missing an unreviewed live behavior.

## Semantics

- unchecked = live change has not been founder-confirmed
- checked = founder confirms they reviewed that live deployment behavior
- notes = private working observations, not canonical product evidence
- production deployment detection never auto-checks an item
- preview deployments never create production review items

## Dated baseline

`V3_PLAYTEST_2026-09-08.md` remains the canonical baseline for the initial V3 playthrough. Automatically detected later deployments appear in the live review queue rather than rewriting that historical baseline.
