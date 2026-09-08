# ASHWOOD Workspace — Content Lifecycle Loop

Status: owner-approved product direction, 2026-09-08.

## Principle

Content creation, scheduling, publication monitoring, and response analysis should not behave as separate tools.

ASHWOOD should treat them as one continuous lifecycle grounded in real work:

**work happens → evidence appears → progress reveal → worth sharing? → medium-specific draft → approve/edit/skip → schedule/publish → monitor external state → capture response/evidence → inform next recommendation**

The loop exists to help the owner notice real progress, communicate selectively, and maintain oversight without turning creative/public presence into a generic content-marketing treadmill.

## 1. Progress reveal is the upstream trigger

A meaningful progress reveal may create a `content.opportunity` only when the underlying event is supported by actual evidence.

Eligible evidence may include:

- completed or materially advanced product work
- verified review/approval/merge/deployment state
- a real creative upload/session/output
- a public release or launch
- a meaningful changed belief/decision in the Build Journal
- a modeling/music/writing milestone
- a customer/design-partner/user signal
- a completed external professional/creative action

Do not create a content opportunity merely because activity exists.

## 2. Worth Sharing decision

For a progress reveal, ASHWOOD should answer:

- Is this actually interesting enough to share?
- Who would reasonably care?
- Which medium fits the evidence and story shape?
- Is there a stronger angle than a status update?
- Is there anything private, security-sensitive, premature, repetitive, or weakly evidenced that makes sharing a bad idea?

Valid recommendation states:

- `SHARE`
- `MAYBE`
- `DO_NOT_POST`

`DO_NOT_POST` is a first-class outcome.

## 3. Medium-native generation

One evidence item may produce several different treatments, but ASHWOOD must not simply resize the same copy.

### TikTok / Reel

Optimize for:

- visual hook
- before/after or realization
- demonstration
- spoken/narrated story
- native pacing
- evidence visible on screen when safe

### Instagram

Optimize for:

- strongest visual asset or carousel sequence
- restrained caption
- portfolio/public-presence fit
- visual authorship over explanatory prose

### Threads

Optimize for:

- unfinished thought
- observation
- contradiction
- changed belief
- conversational insight grounded in actual work

### LinkedIn

Optimize for:

- lesson
- decision
- evidence
- professional relevance
- changed approach
- useful takeaway without founder-performance theater

### Build Journal

Optimize for the durable record:

**event → previous belief → evidence → decision → what changed → current uncertainty / next test**

The Build Journal is not a duplicate social feed.

### Consumer / product email

Optimize for:

- why the change matters to the actual user/customer
- what changed in the product or offering
- what is now possible, proven, fixed, or available
- one appropriate next action

Do not force founder-process detail into consumer email when it does not help the recipient.

### Founder dispatch

Use for cross-product synthesis, repeated patterns, changed beliefs, and larger implications across the ASHWOOD / ALVIRA / ailhat / LEDGATo / AgentOS ecosystem.

## 4. UI pattern

A meaningful progress reveal may expose:

**WORTH SHARING**

- Why this matters
- Recommended angle
- Recommended medium
- Other available media
- `Make something from this →`
- `Not worth posting`
- `Save for later`

After selecting a medium, show a pre-drafted native treatment with provenance back to the source evidence.

The owner must be able to edit, reject, or change medium before any publishing action.

## 5. Scheduled-content oversight

Once a draft becomes scheduled, it should leave the creation surface and enter a unified external-content tracker.

ASHWOOD should maintain one human-readable projection of:

- scheduled
- queued
- publishing / processing
- published
- failed
- canceled
- unknown / provider unavailable

Across relevant destinations such as:

- Instagram
- TikTok
- Threads
- LinkedIn
- Build Journal
- product/consumer email
- future supported public channels

The tracker should answer at a glance:

- What is going out?
- Where?
- When?
- What evidence/story did it originate from?
- Has it actually published?
- Did anything fail?
- Am I accidentally over-posting one category while ignoring another?

External provider truth wins. A locally scheduled item must not be shown as published until publication is confirmed by a supported source.

## 6. Existing-post monitoring

Published posts should remain connected to the original `content.opportunity` and source evidence where possible.

ASHWOOD can then observe:

- publish confirmation
- platform/post URL
- timestamp
- engagement/performance data when available
- comments/replies or notable qualitative response when available
- whether the content produced a useful downstream signal

The point is not vanity-score optimization. Response should be interpreted against owner goals and the type of content.

Examples:

- a low-reach Build Journal entry may still be valuable as durable founder evidence
- a small Threads post may be valuable if it sharpens positioning or creates a useful conversation
- a modeling post may matter for portfolio visibility even without product relevance
- a product email should be judged against user action, not social engagement

## 7. Feedback into Workspace intelligence

Published/scheduled content should become evidence in Workspace, but with the correct semantics.

Candidate events:

- `content.opportunity_created`
- `content.draft_created`
- `content.approved`
- `content.scheduled`
- `content.publish_confirmed`
- `content.publish_failed`
- `content.response_observed`
- `content.insight_recorded`

One lifecycle item should be able to update:

- Progress Reveals
- What Moved
- Operating Cycle balance
- public-presence cadence
- Threads/Worth Sharing suggestions
- Build Journal prompts
- product communication queue
- external scheduled-post tracker

## 8. Content balance

ASHWOOD should not reward raw posting frequency.

It should notice skew across relevant practices, for example:

- too much product/build content and no creative presence
- repeated LEDGATo updates while ALVIRA has more meaningful user evidence
- frequent social posts with no durable Build Journal record
- many scheduled posts but no monitoring/response loop
- creative work happening privately with no public evidence for long stretches

Recommendations should follow the owner’s operating cycle and goals rather than a generic social-media cadence.

## 9. Truth boundary

Never fabricate:

- that a post was scheduled
- that a post was published
- engagement metrics
- audience response
- external account state
- the significance of an event

Unknown provider state must remain `UNKNOWN` or `UNAVAILABLE`.

A post idea must always retain provenance to the work/evidence that caused ASHWOOD to suggest it.

## 10. Product outcome

The desired owner experience is:

> I do the work once. ASHWOOD helps me notice that it mattered, decide whether it is worth sharing, shape it appropriately for the medium, keep track of what is actually scheduled/published, and use the response as new evidence without making me operate six disconnected content systems.

That is the intended connection between private Workspace intelligence and public ASHWOOD presence.