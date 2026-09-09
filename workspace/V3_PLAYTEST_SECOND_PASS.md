# V3 Playtest — second pass triage

Source: the authenticated production snapshot of `v3-playtest-2026-09-08` taken
2026-09-09T13:13:55Z, supplied on PR #88. 14 completed checks, 19 notes.

The notes are not one kind of thing, so they are not one patch. They separate into
stale notes already resolved, concrete regressions, design decisions, and owner
questions. Only the regressions are defects. The design decisions and questions are
recorded here as evidence rather than silently patched into someone's guess at an
answer.

## Already addressed — classify as stale

| Item | Note | Resolution |
| --- | --- | --- |
| `home-nav` | "remove creative direction 404" | PR #88 removed all seven `/going/` references and renumbered both nav lists. |
| `work-modeling` | "no new pictures from what i can see??" | PR #84 expanded Selected work from 4 to 18 frames and has since merged. Worth re-checking on production, since the note predates the merge landing. |

## Priority — ASHWOOD Drop upload stall

Two items report the same symptom: `ws-drop` ("wont upload, Uploading 1 of 1:
connecting to storage…") and `music-runtime` ("won't upload Uploading 1 of 1:
connecting to storage…"). PR #85 and commit `b6b9c92` both previously claimed to fix
a stalled upload, so the first requirement is locating the boundary rather than
shipping a third attempt at the same symptom.

### What the string actually means

`workspace/drop.js` prints `connecting to storage…` from inside `onUploadProgress`,
and only while no bytes have moved:

```js
if (loaded > 0 || pct > 0) hasTransferredBytes = true;
status.textContent = hasTransferredBytes ? `${label}: ${pct}%` : `${label}: connecting to storage…`;
```

Reading the shipped `@vercel/blob@2.8.0` client bundle, the SDK emits one synthetic
zero-progress event immediately before it begins the transfer:

```js
r?.onUploadProgress && r.onUploadProgress({ loaded: 0, total: l, percentage: 0 });
```

That event is emitted from the code path that has already resolved a store identity
(`o.storeId`), which the client only holds once `handleUploadUrl` has returned a
client token.

### What that rules out

The stall is **after** the server round-trip, not during it. By the time the string
appears, `/api/workspace-upload` has already accepted the request, `sameOrigin`
passed, `requireSession` validated the session against Neon, `onBeforeGenerateToken`
ran, `BLOB_READ_WRITE_TOKEN` was present, and a signed client token came back. So:

- **Not** a missing or unconnected Blob store. That path returns the "storage is not
  connected yet" message instead of hanging.
- **Not** a session, cookie, or same-origin rejection. Those return before any
  progress event exists.
- **Not** a Content Security Policy blocking the `esm.sh` import. Production sends no
  CSP header at all, and the module resolves in ~120ms.
- **Not** an unreachable Blob API. `https://vercel.com/api/blob` — the default base
  the bundle falls back to, since `VERCEL_BLOB_API_URL` is unset in a browser —
  answers normally.

Verified directly against production: an unauthenticated
`blob.generate-client-token` POST to `/api/workspace-upload` returns
`{"error":"Workspace is locked."}`, which proves the function, its Neon queries, and
its DDL are all live and responsive.

### What remains, and what it needs

The failure is the browser's direct transfer to the Blob API. The likeliest mechanism
in the bundle is the transport the SDK selects when `onUploadProgress` is supplied:

```js
Cc = async ({input, init, onUploadProgress: r}) => {
  if (r) { if (Ac) return Ba(...); if (La) return Ma(...); }   // streaming fetch, else XHR
  if (Za) return Ba({input, init});                            // plain non-streaming fetch
}
```

`Ba` sends a `ReadableStream` body with `duplex:'half'`. Chrome permits streaming
request bodies only over HTTP/2 or HTTP/3, and they are a common casualty of proxies,
VPNs and blocking extensions. A stalled stream produces exactly this signature: the
request opens, the synthetic 0% fires, and no byte ever moves.

This is a hypothesis with a mechanism, not a diagnosis. Confirming it needs one
observation from the failing browser, which no amount of static reading can
substitute for: the DevTools Network entry for the `vercel.com/api/blob` request —
its protocol column, its status, and whether it reports any bytes sent.

Note also that the existing stall recovery cannot escape this path. It retries by
flipping `multipart` while still passing `onUploadProgress`, so the second attempt
uses the same streaming transport as the first. Dropping `onUploadProgress` on the
retry would fall through to the plain non-streaming `fetch` on the last line above —
a genuinely different transport, at the cost of a progress readout. That is the
change to make **after** the network entry confirms the mechanism, not before.

## Concrete regressions

All four are fixed on `fix/checklist-second-pass`. None could be visually verified —
no browser was available in this session — so each fix is recorded with the mechanism
it addresses, and the rendered result still needs an eye.

**`home-provenance` — fixed.** `.v3-provenance-reveal` is `position:absolute` with
`top:calc(100% + .55em)` on `.v3-identity`. Absolute positioning reserves no space, so
the reveal opened directly on top of `.v3-grounding`, the paragraph immediately below
it in normal flow. Opening the reveal now also adds `.is-provenance-open` to
`.v3-identity`, which transitions in a matching `margin-bottom` and pushes the
paragraph down instead of being covered by it. The closed layout is unchanged.

**`home-manifestations` — fixed.** PR #88 measured each label with a detached `<span>`
in `document.body` carrying font properties copied across by hand — `font`,
`letter-spacing`, `text-transform`. That reproduces only the properties someone
remembered; anything else affecting advance width measures wrong, and the label
closest to the box width is the one that loses a single glyph, which is exactly
`BUILD JOURNAL`. The probe is now a real `.v3-manifestations__label` inside the real
reel, so it inherits every relevant property by construction rather than by
enumeration. Two further causes are closed at the same time: labels are scaled to one
pixel inside the box rather than to an exact fit that sub-pixel rounding can clip, and
the measurement is re-taken on resize, which it never was despite the reel font being
`clamp()`-based and therefore viewport-dependent.

**`instinct-persist` — fixed.** The note asks how to refresh. There was no answer:
discovery writes to `localStorage` and nothing ever cleared it, so once the field was
found it stayed found on every later visit and the section could not be replayed. A
**Reset discovery** control now appears in the field once at least one signal has been
found, clearing the stored progress, the found state, and the open signal card.

**`home-themes` — fixed, with a caveat.** Home and the modeling landing did not merely
share a hero: they opened with the same three images in the same order. The homepage
now leads with `barelysain-01.jpg`, and the modeling landing keeps
`IMG_7192-hero-web.jpg`, which is the asset named for that role. `barelysain-01.jpg`
was the only unused portrait asset in the repository at hero resolution (1350×1800) —
every other candidate was either already on the portfolio page or landscape, and a
landscape image would crop badly in a `100svh` portrait column. The caveat is that
the choice was made from dimensions and filenames, not from looking at the photograph.
It is the structurally correct slot; whether it is the right picture is the owner's
call.

`home-manifestations` also carries two content corrections, which are content edits
rather than defects: the trailing period after the reel may be unnecessary, and
"out of one, many becomings" has been replaced and still appears on About.

## Design decisions — need a call before any code

- `gate-open`: "good information but could make better use of space on page."
- `work-music`: "we should use the song cover art as the background of the section."
- `ws-workstreams`: "would be cool if the related text was integrated into the existing
  visual structure on click/hover."
- `instinct-doc`: "works, but maybe the cards could be less fixed to bottom right corner."
- "What is pulling on what" graphic: the concept is right and the execution is not —
  raised as an aesthetic upgrade, not a defect. Worth treating as its own piece of
  design work rather than a tweak, since the concept is the part already working.
- `instinct-progress`: "works but not the same discovery-first UI we originally agreed
  on." Needs the original agreement retrieved before anything is rebuilt against a guess.
- `home-audio`: "no cross navigation continuity after play initiated on home. not sure
  if mini player needs to be on home since IN ME already embedded into ASHWOOD." Half
  observation, half open question about whether the homepage player should exist at all.
  Continuity across navigation is not achievable on a multi-page site without a
  persistent shell, so this is an architecture decision, not a bug fix.

## Layout — left-alignment bias

Raised by the owner alongside this snapshot rather than in it: the page carries a
left-alignment bias and the format should be rebalanced. Unlike the items above this
is a directed change, not a question. It is recorded here because it cuts across the
whole V3 layout rather than belonging to any single checklist item, and because it
interacts with `home-provenance` and `home-manifestations` — both of which are
failures of horizontal fit in a left-anchored column, and neither of which should be
fixed twice.

### Where the bias comes from

The shell is centered. The content inside it is not. That is the whole mechanism.

```css
.v3-shell   { max-width: var(--v3-max); margin: 0 auto }   /* --v3-max: 1440px */
.v3-chapter { padding: clamp(96px,10vw,150px) var(--v3-pad) } /* --v3-pad: clamp(20px,3vw,48px) */
```

`.v3-shell` centers a 1440px column, so the page frame is symmetrical. Every text
block within it then anchors to that column's left edge and stops well short of its
right edge:

| Block | Constraint | Share of the content width | Empty to its right |
| --- | --- | --- | --- |
| `.v3-deck` | `max-width:620px` | 46% | 734px |
| `.v3-grounding` | `max-width:560px; margin:16px 0 0` | 41% | 794px |
| `.v3-manifesto-note` | `text-align:left` | — | explicit |

Measured against a 1440px viewport, where `--v3-pad` resolves to 43px and the content
width inside `.v3-chapter` is ~1354px. These are computed from the stylesheets rather
than from a render — no browser was available in this session — so treat the pixel
figures as arithmetic on the declared values, not as observed layout.

The section grids lean the same way:

| Section | Columns | Split |
| --- | --- | --- |
| `.v3-hero` | `minmax(0,1.03fr) minmax(360px,.97fr)` | 51.5 / 48.5 |
| `.v3-music` | `1.12fr .88fr` | 56 / 44 |
| `.v3-depth` | `.7fr 1.3fr` | 35 / 65 |

`.v3-depth` is the one that weights right, but its *heading* sits in the narrow left
column, so the heading rail still begins at the far left and is the most cramped of
the three.

The net effect is that the optical center of the page sits far left of its geometric
center, and the right 45–60% of every chapter is permanent void. Four sections stack
this identically — hero, thinking, evidence, depth, continuation — which is what
produces a single unbroken left rail down the full scroll.

### The direction chosen

Alternate the anchor rather than centering the measure or widening the column.
Sections keep the max-widths they have and alternate which edge they attach to, so
the existing typographic measure is preserved and only the rail is broken. In
practice that is `margin-left:auto` on alternating chapters, plus swapping the column
order in the two-column sections, rather than any change to the type scale.

Scope is not yet decided: this diagnosis is the input to that decision. The homepage
alone is four sections; carrying the same rhythm across about, music, portfolio,
journal, dispatch and ai-from-zero would make the site read as one system but cannot
be visually verified from here.

## Owner questions — answers, not patches

- `depth-cta`: "what does this actually mean? make what? what am i soliciting here?"
- `gate-strong`: "how would i know that?"
- `gate-assumption`: "how?"
- `gate-experiment`: "how?"
- `work-products`: "explanations are a bit vague / not clear."

These four Build Gate items are one question asked four times: the gate states a
verdict, an assumption and an experiment without showing its reasoning. That is a
single coherent piece of work — make the gate show why — rather than four copy edits.


## Checklist surface changes

Requested by the owner while this pass was running, and shipped with it:

- The checklist refreshes itself. It polls `/api/workspace-checklist` every 15 seconds
  while the tab is visible, and immediately when the tab is looked at again — which is
  the moment that matters, since playing the checklist means leaving for the live site
  and coming back. A poll never runs while an edit is unsaved or while the cursor is in
  a note, so a server copy cannot overwrite work in progress or rebuild the DOM under a
  caret, and a poll that finds no change does not re-render.
- Checked items sink into a single **Completed** group at the bottom, closed by default
  and struck through, each labelled with the section it came from. Sections above show
  only what is still outstanding, and a section with nothing left disappears from the
  working list rather than sitting there fully checked. Unchecking an item in the
  Completed group returns it to its own section.
