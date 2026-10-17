# WhatitmeansBlk

The interactive Black Atlas prototype lives in [atlas/](atlas/).

See [setup, architecture, performance and data credits](atlas/README.md).

The website now includes a [milestone collection](atlas/src/data/milestones.js) with 53 original summaries and a [source register](atlas/src/data/sources.js). Open **Milestones** from the atlas masthead to search, filter, and follow the references.

The map connects this collection to **25 places**, with historical-period coverage by default and an exact-year toggle. Selecting a city zooms into the map and opens a full milestone page in the original city-story design. Each page explains what happened, why it matters, and the local connection, with section citations and a source register. A menu switches between that place’s milestones in the selected period; the longer city essays remain available. All 53 milestones have shareable reading pages, including national and regional entries without city pins. See the [mapping method](atlas/public/data/milestone-map-method.md).

All additions must follow the [sourcing and reuse policy](atlas/CONTENT_POLICY.md). Citations are required; they do not replace permission for protected text, quotations, or images. `npm run build` includes a content publication check.

Quick start: `cd atlas`, `npm ci`, `npm run dev`.
