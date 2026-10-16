/**
 * Implemented static milestone contract; no backend required.
 * See CONTENT_POLICY.md before extending this schema.
 *
 * HistoricalMilestone (milestones.js):
 * id: stable permalink; year/endYear: inclusive bounds; date: exact/approximate label;
 * title, location, summary, context: original plain text; topics: filter labels;
 * geography: scope, note, review date and evidenced place connections;
 * placeIds: derived from geography.connections; joins to mapPlaces.js;
 * sourceIds: evidence for date, summary and context in sources.js;
 * textRights: original-summary; reviewedAt: actual review date (YYYY-MM-DD);
 * images/quotations: empty until a reviewed media/quotation workflow is implemented.
 *
 * HistoricalSource (sources.js):
 * id, publisher, title, url (direct HTTPS), type (primary record, history, etc.),
 * accessedAt (actual consultation date, YYYY-MM-DD).
 *
 * A citation supports a claim; it grants no license to reproduce protected material.
 * Publication checks: contentValidation.js and scripts/validate-content.mjs.
 */
export {};
