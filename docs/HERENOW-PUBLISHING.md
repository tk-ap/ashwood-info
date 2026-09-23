# Here.now publishing handoff

This document records where the existing Here.now publishing setup is located. **Do not commit API keys, email verification codes, or the contents of credential files.**

## Existing deployment
- Service: Here.now
- Account email: hire.tkashwood@gmail.com
- Permanent site: https://mighty-yoga-pgph.here.now/
- Site identifier: `mighty-yoga-pgph`
- Known previous live version: `01M35VA2QTNY52J2YEAP19EMSZ` (historical; check Here.now for the current version).
- Source repository: `tk-ap/ashwood-info`
- Sandbox branch: `ops/herenow-gravity-sandbox`
- Do not create a new site or deploy to Vercel when updating this sandbox.

## Credentials and publisher (on the authenticated machine)
- Here.now credentials: `$HOME/.herenow/credentials`
- Here.now skill: `.agents/skills/here-now/`
- Publishing script: `.agents/skills/here-now/scripts/publish.sh`
- These are **paths in the previously authenticated environment**, not files guaranteed to be available in every ChatGPT conversation or runtime.
- Do not paste credential contents into chat, logs, issues, or commits.

## Cross-conversation handoff
The September 22, 2026 ChatGPT conversation titled **Operator overlay adaptation** contains the prior authenticated publishing workflow. A different ChatGPT session may be able to read this repository but cannot automatically access that conversation's execution environment, local checkout, or credentials.

Before publishing: confirm the authenticated machine and credential file are accessible; fetch the latest sandbox branch; review the gravity fixes; inspect the existing Here.now deployment configuration; publish **to the existing permanent site** using the installed skill and its documented options; verify the resulting live version ID and test the animation in a mobile browser. Do not report mobile visual verification without an actual mobile browser test.

If the authenticated environment is unavailable, stop and request access to that environment. Do not reauthenticate unnecessarily or claim a publish succeeded.
