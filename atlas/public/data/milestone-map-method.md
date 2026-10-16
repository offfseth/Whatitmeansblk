# Milestones, places, and time

The map uses 25 geographic reference points. The current collection has 35 milestones with documented place connections and 18 national or regional entries without city pins. The latter remain available through “Across regions & the nation.” This is a selected set of connections, not a complete map of every event or movement.

## Time

Historical-period mode is the default. It shows connections and city stories whose date ranges overlap the selected chapter. Exact-year mode includes a connection only when its inclusive dates contain the selected year. Jurisdiction boundaries always follow the selected year, even when the pins cover a wider period. These two dates are labeled beside the controls.

Local connections can be narrower than the whole event. The [National Archives account of the Great Migration](https://www.archives.gov/research/african-americans/migrations/great-migration) distinguishes northern and midwestern migration from the later western phase. The western destination markers in this collection begin in 1940. These are broad historical phases, not exact local arrival dates. Pins represent selected destinations; they do not trace every journey.

## Place connections

Each mapped milestone explains why a place is connected and links to the evidence. The distinction matters: Chicago represents Emmett Till's funeral and public response, not the location of his murder; Boston represents Phillis Wheatley's home context, while the publication city was London, outside this map. A court case can connect a local lawsuit with the court's decision in Washington. A new national law is not automatically pinned to Washington or to every city it affected.

Geographic references identify a city or region approximately, not a historical street address. Harpers Ferry uses an NPS Lower Town area reference. The Maryland Eastern Shore marker is anchored near the modern Tubman visitor center to locate the region; it is not a claim that her escape started at that modern facility. Kennedy Space Center marks the launch site, not the astronaut's position during the whole mission. These qualifications also appear in the map panels.

## Geographic data and reuse

New city reference points come from [Natural Earth's 1:10m Populated Places](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-populated-places/), retrieved October 15, 2026. Natural Earth places its map data in the [public domain](https://www.naturalearthdata.com/about/terms-of-use/). Dataset feature IDs are retained with the selected coordinates in `mapPlaces.js`. These reference points are not surveyed event locations.

Other new references are the National Park Service's [Harpers Ferry geographic information](https://home.nps.gov/hafe/planyourvisit/gettingaround.htm) and [Tubman park geographic information](https://www.nps.gov/hatu/planyourvisit/basicinfo.htm), and NASA's [Launch Pad 39B coordinates in its 1998 release archive](https://www3.nasa.gov/centers/kennedy/pdf/744611main_1998.pdf). NASA's [Shuttle retrospective, page 107](https://www.nasa.gov/pdf/656773main_ShuttleRetrospectiveBook-ebook.pdf) identifies the STS-47 launch pad. Coordinates are rounded for display. The original eight atlas points retain the project's existing geographic references.

The marker projection matches the atlas terrain: Albers USA, scale 1300, translation [487.5, 305]. Rebuilding display points requires no live geocoding service. No source photographs, maps, or page images were imported in this integration. Historical claims and geographic source records have separate roles; a coordinate dataset is not evidence that an event happened there.
