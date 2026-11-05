# Modeling archive attribution and booking audit

Checked November 4, 2026. Implementation remains preview-only in PR #313.

## Source confirmation

The original Adobe site remains reachable at https://tkashwood.myportfolio.com/. Its portfolio, /fs and /digitals pages still contain per-image locations and creator credits. These were absent from the current ASHWOOD Archive grid and its viewer captions. The historical extraction script at commit 30852a1 preserved image URLs, dimensions and byte counts, but its manifest did not retain caption, photographer or location fields. The original ASHWOOD template had placeholders for source credits; those placeholders were later removed without filling the archive credits.

This is a confirmed attribution migration gap. It does not mean all current site credits vanished: the recent campaign credit/location blocks already exist.

Recovered and verified against the actual photographs:

- 13 of 17 Archive frames: restored linked photographer and city captions.
- 3 of 4 runway-strip frames: restored San Antonio / @the_Quantum_Lotus, plus the original show date, host and designer details in the viewer.
- Source roles also include @ReyesBoBBY of @Thedreamersmgt; @mintwhisper; @vivid_media_production; @ultraephoto; @spyfroman; @angeli_ascend_. Exact per-image assignments and original full captions are in modeling/archive-credits.json.
- 5 remain unresolved: street monochrome and black crew portraits match Adobe photographs with no original caption; 88800408.jpg, TKTKTK00420.jpg and up-next-151.jpg do not match the currently exposed Adobe images reliably. No photographer or location was guessed for these.

Sources: https://tkashwood.myportfolio.com/ ; https://tkashwood.myportfolio.com/fs ; https://tkashwood.myportfolio.com/digitals ; https://tkashwood.myportfolio.com/about-me

The 2023 Adobe age, shaved-hair details, old San Diego base and historical digitals were not copied into the current model profile. Historical shoot cities are credits, not current residence information.

## Curation

Hero #24 is a strong introductory direct-gaze portrait. Repeating it in the short five-frame gallery adds less range than a distinct view. Preview gallery now uses #18 → #10 → #25 → #1 → #32, with #25 adding profile and garment detail. #24 remains exclusively the page hero; #27 and #16 remain excluded. Hero data is independent of the gallery selection while still owned by the newest campaign record.

## Booking assessment — recommendations, not conversion claims

The existing site supports inquiries: it has LA/travel information, a persistent booking link, agency/direct routes, current digitals and measurements. It does not yet prioritize a casting/booking decision. No analytics or booking-conversion rate was measured.

Recommended order of work:

1. Make Book TK the primary hero action. Keep View latest campaign secondary and add a direct Digitals & measurements anchor.
2. Bring a compact current model profile / representation summary and digitals access ahead of the long campaign/archive scroll. A current approved comp-card download would make sharing easier; no unverified or obsolete card should be generated from historical Adobe data.
3. Replace the generic agency-homepage destination with the agency's verified booking page or a confirmed personal agent/profile contact. WHO's current official booking page is https://whomanagement.com/booking-info/ ; no direct personal model profile was verified here.
4. Make the inquiry action useful: suggest project/brand, dates, city, usage and budget in a prefilled direct-booking email, while retaining agency booking as a clear separate route.
5. Keep campaign depth available behind View full campaign so buyers can see range and reach booking essentials quickly. Preserve the full approved photographs rather than deleting work to shorten the page.
6. Reduce the persistent audio-player footprint on the modeling route: it currently covers photograph/content area on mobile. Keep portfolio visitors' attention on images, digitals and booking, with wider artistic/founder links discoverable elsewhere.

The attribution repair, Archive label and gallery replacement are implemented in this preview. Broader booking-layout, inquiry-form, comp-card and audio changes are recommendations only, pending the owner's direction.
