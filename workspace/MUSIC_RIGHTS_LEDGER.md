# ASHWOOD Music Rights Ledger

Status: canonical direction for the private `/workspace/` music rights surface.

## Purpose

ASHWOOD is not a PRO, publisher, distributor, or legal adjudicator. It is the private source of truth for what TK records about each song before and alongside downstream systems such as a PRO, SoundExchange, a distributor, and Copyright Office registration.

Canonical flow:

`Upload → Rights Ledger → Commercial Clearance → Music Intelligence → Release Direction → Edition Economics → External registrations`

## Core principle

The workspace must never imply that a database entry itself proves legal ownership. It records the parties, percentages, agreements, and registration status that support the user's current understanding of the rights.

Preferred language:

- `Recorded composition split`
- `Recorded master split`
- `Agreement status`
- `External registration status`
- `Commercial clearance`

Avoid language such as `ASHWOOD certifies ownership` or `verified legal owner` unless an external legal process actually supports that claim.

## Track record

Each uploaded track may carry a private rights record containing:

- composition / songwriter split
- master ownership split
- direct-sale revenue split
- producer / collaborator agreement status
- agreement reference or note
- PRO registration status
- SoundExchange registration status where applicable
- U.S. Copyright Office registration status
- commercial-clearance status
- edition size and edition price for direct-sale experiments
- private rights notes
- last-updated timestamp

The original audio upload remains the canonical source file and is never overwritten by rights edits.

## Commercial clearance

Commercial clearance is an explicit human decision, not an automated inference.

Allowed states:

- `NOT CLEARED` — do not treat the track as commercially releasable.
- `REVIEW` — rights information exists but one or more issues still need confirmation.
- `CLEARED` — the user has recorded that the track is ready for commercial release based on the agreements and rights information available to them.

The workspace may warn about missing information, but it must not silently promote a track to CLEARED.

YouTube-beat demos and other non-commercial material can remain in the creative library and Music Intelligence system while staying `NOT CLEARED`.

## Edition economics

For a limited ASHWOOD Edition, the workspace may calculate planning numbers such as:

`edition size × price = gross direct-sale revenue`

and, when a direct-sale split is recorded:

`gross × TK percentage = TK share before fees/taxes/other deductions`

`gross × collaborator percentage = collaborator share before fees/taxes/other deductions`

These are planning estimates, not accounting statements. Payment processor fees, taxes, recoupment, expenses, contractual exceptions, and other deductions may change actual payouts.

Purchasing an ASHWOOD Edition does not transfer copyright unless the purchase terms explicitly say so. Default release terms should preserve all copyrights with the applicable rights holders.

## External systems

ASHWOOD should track whether downstream registrations are complete; it should not pretend to replace them.

Examples:

- PRO registration for composition-performance royalties
- SoundExchange registration for eligible digital sound-recording performance royalties
- distributor / ISRC metadata
- Copyright Office registration

Future integrations may generate registration-ready metadata packets, but external systems remain authoritative for their own records.

## Data contract

V1 persists a `rights_ledger` JSON object on the existing `workspace_uploads` record and records `rights_updated_at`.

This keeps the rights layer attached to the canonical uploaded track instead of creating a second catalog.

Fields in V1:

- `compositionSplit`
- `masterSplit`
- `directTkPct`
- `agreementStatus`
- `agreementReference`
- `proRegistration`
- `soundexchangeRegistration`
- `copyrightRegistration`
- `commercialClearance`
- `editionSize`
- `editionPrice`
- `notes`

A later normalized contributor/split schema is appropriate if the catalog grows enough to require contributor identities, signatures, amendment history, automated payouts, or multi-party royalty accounting.

## V1 acceptance criteria

1. Rights records persist server-side and survive browser/device changes.
2. Every private library track can open a rights record.
3. Commercial clearance is visible and explicit.
4. The UI clearly says the ledger is a recorded source of truth, not legal certification.
5. Edition economics can calculate gross and simple recorded direct-sale shares without implying net payout.
6. Existing upload/publish behavior is preserved.
7. No rights data is exposed by the public Music API by default.
