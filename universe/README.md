# ASHWOOD Universe publishing

The public Universe is a curated index, not a second CMS or a claim that every body of work is complete.

To add, move, or retire an item, edit `universe/content.mjs`:

- Use a unique, stable `id` and one of the existing `group` values.
- Keep `title`, `label`, `summary`, and `status` concise and evidence-based.
- Use a public, approved route for `href`; use `null` when work remains held for review.
- Set desktop map coordinates (`x`, `y`) between 5 and 95, then check the desktop map for overlap. The responsive layout becomes a linear list on small screens.
- Use `related` only for relationships a visitor can follow in the public experience.

Run `node --test tests/universe.test.mjs tests/public-discovery.test.mjs` after changes. The content registry drives both the constellation and the readable index.
