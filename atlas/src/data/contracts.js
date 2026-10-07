/**
 * Future content contract; no backend or event database is implemented.
 *
 * @typedef {Object} HistoricalEvent
 * @property {string} id Stable event ID.
 * @property {string} locationId Join to locations.js.
 * @property {number} startYear Inclusive.
 * @property {number} endYear Inclusive; use startYear for a single-year event.
 * @property {string} title
 * @property {string} context Plain text or sanitized rich text.
 * @property {string} outcome
 * @property {{src:string, alt:string, credit:string, license:string}[]} images
 * @property {{title:string, url:string, accessedAt:string}[]} sources
 *
 * @typedef {Object} HistoryRepository
 * @property {(year:number, signal?:AbortSignal)=>Promise<HistoricalEvent[]>} eventsForYear
 *
 * Integration: subscribe to the timeline store, query a repository with cancellation,
 * join records by locationId, then fill the existing selection panel.
 * Keep content loading independent from camera changes and WebGL rendering.
 */
export {};
