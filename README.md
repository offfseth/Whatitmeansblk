# WhatitmeansBlk

The interactive Black Atlas prototype lives in [atlas/](atlas/).

See [setup, architecture, performance and data credits](atlas/README.md).

The website now includes a [milestone collection](atlas/src/data/milestones.js) with 53 original summaries and a [source register](atlas/src/data/sources.js). Open **Milestones** from the atlas masthead to search, filter, and follow the references.

The map connects this collection to **25 places**, with historical-period coverage by default and an exact-year toggle. Select a pin to read its milestones, local connections, sources, and available city stories. National and regional entries remain accessible without misleading city pins. See the [mapping method](atlas/public/data/milestone-map-method.md).

All additions must follow the [sourcing and reuse policy](atlas/CONTENT_POLICY.md). Citations are required; they do not replace permission for protected text, quotations, or images. `npm run build` includes a content publication check.

Quick start: `cd atlas`, `npm ci`, `npm run dev`.
