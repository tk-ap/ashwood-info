# ASHWOOD Universe publishing

The public Universe is a curated index, not a second CMS or a claim that every body of work is complete.

To add, move, or retire an item, edit `universe/content.mjs`:

- Use a unique, stable `id` and one of the existing `group` values.
- Keep `title`, `label`, `summary`, and `status` concise and evidence-based.
- Use a public, approved route for `href`; use `null` when work remains held for review.
- A time-bound `previewHref` is optional for a verified, non-production render. It must be a live public preview you have checked, and the Universe presents it as a non-interactive frame with a separate external link; it never stands in for the canonical route.
- Set desktop field coordinates (`x`, `y`) between 5 and 95, then check the desktop field for overlap. On fine-pointer desktops, visitors can drag open field space and scroll to change distance; selecting a signal brings its thread forward. The responsive layout becomes a linear list on small screens, and reduced-motion users receive the stable map/index without travel controls.
- The entrance routes are deliberate filters, not duplicate content. Each one should name an existing group and take visitors directly to the field; the large `Enter the field` action always restores the complete map.
- Use `related` only for relationships a visitor can follow in the public experience.

Run `node --test tests/universe.test.mjs tests/public-discovery.test.mjs` after changes. The content registry drives both the constellation and the readable index.
