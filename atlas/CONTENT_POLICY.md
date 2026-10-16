# Adding sourced historical material

The canonical, reader-visible policy is [public/data/content-policy.md](public/data/content-policy.md). Read it before adding text, quotations, or media.

Milestones live in `src/data/milestones.js`. Each record has a stable ID, inclusive year bounds, a human-readable date, location, themes, an independently written summary and context, and `sourceIds` pointing to `src/data/sources.js`. Source records include a publisher, title, direct HTTPS URL, material type, and actual access date. Record a new `reviewedAt` only after checking the evidence. Keep approximate periods clearly labeled. The list is intentionally selective; a missing event is not a claim that nothing happened.

To add a milestone:

1. Read and verify its evidence. Add bibliographic records with stable IDs; use additional sources for disputed or compound claims.
2. Write original prose. Cite every claim through the entry’s references, adding claim-level locators or splitting the entry when a combined citation list would be ambiguous.
3. Supply a date label and year range. Add the geographic classification in `src/data/milestoneGeography.js`. Each city connection needs a place ID, an explanation of its role, evidence sources, and inclusive dates inside the event's overall bounds. `placeIds` are derived from these connections. For national or regional entries without a supported pin, record the scope and an explanation. A connection creates map coverage; it does not create a long city essay.
4. Keep `images` and `quotations` empty under the current text-only milestone contract. Adding them requires both documented rights and a renderer that displays their evidence and credits. The publication gate deliberately rejects them until that workflow is implemented.
5. Run `npm run check:content`, `npm test`, and `npm run build`. The build runs content checks automatically. Inspect the new entry, references, filtering, and map-year link in the browser.

The public archive’s allowlist is `src/data/archive.js`. Its five photographs have recorded item-specific reuse bases. One previously supplied, unidentified photograph is now excluded. Its original file is retained in ignored `private/uncleared/`; do not distribute that directory. Never put a withheld asset back into `public/` merely to hide it with CSS or a data flag. Vite serves/copies public assets even if no page references them.

New places belong in `src/data/mapPlaces.js`, with a geographic reference source and a note explaining the precision of the marker. Run `npm run prepare:markers` after changing coordinates. Keep movements and national laws at an appropriate scale; never assign a city merely to fill the map. The map defaults to historical periods; exact-year mode includes both endpoints of an event or local connection.

The automated gate checks metadata, references, year ranges, city joins, geographic classifications and connection evidence, chapter citations, city section citations, archive file registration, and local asset presence. It does not certify factual accuracy or absence of infringement. Existing city stories have their own section sources; this expansion is not a new line-by-line historical or rights audit of all legacy material.
