# ASHWOOD Music Intelligence

Status: canonical product direction for the private `/workspace/` music surface.

## Purpose

Turn the existing ASHWOOD music upload/library into a creative-intelligence layer that helps decide what to finish, test, release, revisit, or leave alone without replacing artistic judgment.

Canonical flow:

`Upload → Song DNA → Creative Mode → Review Mode → Market Context → Catalog Intelligence → Release Direction`

## Product principles

1. **No fake hit score.** Never collapse a song into a single probability-of-success number.
2. **Protect the creative process.** Creative Mode stores/analyzes a track without surfacing optimization advice. Review Mode is an intentional reveal.
3. **Compare against relevant cohorts, not blindly against the overall Top 10.** Overall charts are market evidence, not the definition of what a specific song should become.
4. **Keep three judgments separate:** Artistic Strength, Market Alignment, and Release Readiness.
5. **Preserve the original.** Experiments are alternate decisions/exports; the system never overwrites the uploaded source.
6. **Recommend experiments, not commands.** Advice should identify the evidence, uncertainty, and smallest useful test.
7. **`Release as-is` is a legitimate winning recommendation.** Divergence from market norms may be a strength.
8. **Market data is context, not taste.** Current performance signals must not be presented as proof of artistic quality.
9. **Do not dilute identity.** If moving toward the comparison cohort would erase a song's strongest characteristic, say so.
10. **Be explicit about uncertainty.** Audience response, emotional resonance, cultural timing, and virality cannot be reliably inferred from audio features alone.

## Track-level analysis

### Song DNA

For uploaded audio that ASHWOOD has rights/permission to process, derive or store where technically available:

- duration
- BPM / tempo confidence
- key / mode confidence
- loudness and dynamic range
- section map (intro, verse, chorus/hook, bridge/outro where detectable)
- time to first vocal and first hook where detectable
- energy curve
- vocal/instrument balance
- density / arrangement changes
- repetition signals
- spectral / mix characteristics
- optional embeddings or similarity representation created from the user's own audio

Every inferred field should retain method/version and confidence. Unknown is better than fabricated precision.

### Three independent judgments

#### Artistic Strength

A qualitative evidence-backed read of internal coherence, distinctiveness, memorability, emotional effectiveness, performance, and identity. This must not be derived from chart similarity alone.

#### Market Alignment

How the track's observable characteristics compare with a relevant current cohort. Low alignment is not automatically negative.

#### Release Readiness

Whether the current recording/arrangement/mix/presentation appears ready to publish, independent of whether it resembles current chart material.

Each judgment should expose supporting observations rather than only a label.

## Creative Mode vs Review Mode

### Creative Mode

Default-safe state while a song is being made.

- upload and preserve source
- allow private notes and credits
- background technical analysis may run
- no market optimization recommendations shown
- no ranking against the user's catalog shown unless explicitly requested

### Review Mode

User intentionally requests analysis.

Surface:

1. Song DNA
2. Creative strengths to protect
3. Relevant comparison cohort
4. Where the song aligns
5. Where it diverges
6. Uncertainties / things the model cannot know
7. 2–4 smallest useful experiments
8. Release direction

Example direction format:

> **Winning direction**
> The chorus appears to be the strongest commercial opportunity. The track reaches it later than most songs in the current comparison cohort, but the extended build may be part of the song's identity.
>
> **Experiment**
> Keep the original. Export one alternate arrangement that reaches the first chorus earlier, then compare listener response before changing the master.

## Market context

### Source roles

- **Billboard / similar charts:** evidence of market performance and ranking.
- **Apple Music:** chart/catalog metadata where official APIs permit it.
- **Spotify:** catalog/chart metadata only where current platform terms and endpoints permit it. Do not assume permission to download or deeply analyze Spotify audio.
- **Other providers:** may be added only when terms permit the proposed use.

### Rights boundary

Do **not** architect the feature around downloading charting songs from streaming services or ingesting protected streaming audio into an AI/ML system.

Preferred architecture:

`live chart/index data + permitted metadata/public characteristics + deep analysis of user-owned/uploaded audio`

If richer reference-audio analysis is later required, use material the user owns, licenses, uploads with permission, or a provider that explicitly licenses that processing.

### Cohort construction

The system should build a relevant comparison cohort rather than averaging the overall Top 10.

Potential signals:

- genre / subgenre
- tempo range
- vocal profile
- instrumentation / production family
- mood / lyrical posture where available
- market / region
- release recency
- chart performance
- user-selected reference songs

Show the cohort definition and size. A user must be able to replace or narrow it.

## Catalog Intelligence

Catalog Intelligence is the higher-value layer across all uploaded tracks. It should answer:

- Which songs are most release-ready?
- Which songs have the strongest identity?
- Which have the strongest hooks or most memorable moments?
- Which are commercially unusual in a potentially useful way?
- Which have the biggest upside from a small change?
- Which should be finished next?
- Which should be released as-is?
- Which should be left alone or archived?

Do not rank tracks merely by market similarity. Rankings/directions must expose the dimensions that drove them.

Suggested catalog labels:

- Most release-ready
- Strongest identity
- Strongest hook
- Most commercially unusual
- Biggest upside from a small experiment
- Needs more work

## Release direction

Allowed outcomes include:

- **Release as-is**
- **Finish / mix / master**
- **Run one small arrangement experiment**
- **Test two versions**
- **Hold for a better release window**
- **Revisit later**
- **Archive / leave alone**

The system must explain why and distinguish observation from inference.

## Data model direction

A future implementation should extend, not replace, the existing ASHWOOD upload record.

Suggested entities:

- `music_track` — canonical uploaded source and rights metadata
- `music_analysis` — versioned Song DNA results + confidence
- `music_review` — user-triggered Review Mode output
- `market_snapshot` — dated chart/cohort data and source provenance
- `comparison_cohort` — cohort definition + member metadata
- `music_experiment` — alternate hypothesis/test, never source overwrite
- `catalog_assessment` — cross-track decision layer

Every generated assessment should retain:

- analysis version
- market snapshot date
- sources/provenance
- confidence/uncertainty
- user overrides

## Implementation phases

### Phase 0 — current repo

- Keep existing direct audio upload/storage and private library.
- Add visible Creative Mode / Review Mode product framing.
- Add per-track entry point for analysis with honest "analysis engine not connected yet" state.
- Add Catalog Intelligence shell with no fabricated rankings.
- Commit this spec as the canonical direction.

### Phase 1 — owned-audio intelligence

- technical audio analysis pipeline for uploaded tracks
- durable analysis records
- Song DNA UI
- versioned analysis/confidence
- creative notes / strengths-to-protect

### Phase 2 — market context

- official/permitted chart integrations
- dated market snapshots
- cohort builder
- track-vs-cohort comparison

### Phase 3 — decision intelligence

- Review Mode recommendations
- experiment tracking
- cross-catalog intelligence
- Release Direction
- listener/test evidence loop where available

## Non-goals

- generating songs to imitate chart records
- prescribing a universal song structure
- declaring that high chart similarity means "good"
- using unauthorized reference audio
- overwriting originals
- turning the creative workspace into an optimization dashboard while a song is still being made
