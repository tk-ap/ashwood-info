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

| Item | Note | Status |
| --- | --- | --- |
| `home-provenance` | "doesn't work, overlaps w 'TK Ashwood is a creative practice moving through modeling, music, writing, and technology…'" | Unresolved. Two elements occupying the same space; needs a rendered check. |
| `home-manifestations` | "build journal doesnt fit fully missing L" | Unresolved. PR #88 added a per-label horizontal fit factor for exactly this and the widest label is still clipping. `BUILD JOURNAL` is the label closest in width to the idle string, so it is the one that fails by a single character — consistent with the fit factor being computed but not applied, or applied against a stale measurement. Needs a rendered measurement to distinguish. |
| `instinct-persist` | "how can i refresh? the capability map and refresh button no longer exist" | Unresolved. UI referenced by the checklist is absent; either the controls regressed out or the checklist item is stale. |
| `home-themes` | "hero pic on home shouldn't be the same as the modeling landing, hard to tell where you are" | Unresolved. Same asset used in two places that need to read as distinct. |

`home-manifestations` also carries two content corrections, which are content edits
rather than defects: the trailing period after the reel may be unnecessary, and
"out of one, many becomings" has been replaced and still appears on About.

## Design decisions — need a call before any code

- `gate-open`: "good information but could make better use of space on page."
- `work-music`: "we should use the song cover art as the background of the section."
- `ws-workstreams`: "would be cool if the related text was integrated into the existing
  visual structure on click/hover."
- `instinct-doc`: "works, but maybe the cards could be less fixed to bottom right corner."
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

## Owner questions — answers, not patches

- `depth-cta`: "what does this actually mean? make what? what am i soliciting here?"
- `gate-strong`: "how would i know that?"
- `gate-assumption`: "how?"
- `gate-experiment`: "how?"
- `work-products`: "explanations are a bit vague / not clear."

These four Build Gate items are one question asked four times: the gate states a
verdict, an assumption and an experiment without showing its reasoning. That is a
single coherent piece of work — make the gate show why — rather than four copy edits.
