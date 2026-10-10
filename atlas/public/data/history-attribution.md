# Historical map: sources and method

Siczewicz, Peter. *U.S. Historical States and Territories (Generalized .01 deg).* Emily Kelley, digital compiler. *Atlas of Historical County Boundaries*, edited by John H. Long. Chicago: The Newberry Library, 2011.

Source: https://publications.newberry.org/ahcb/pages/United_States.html
Downloaded 2026-10-09: https://publications.newberry.org/ahcb/downloads/gis/US_AtlasHCB_StateTerr_Gen01.zip

The source contains 220 dated jurisdiction configurations, with change descriptions and citations. This project projects the polygons into Albers USA (scale 1300, translation [487.5,305]), rounds projected coordinates to 0.01 units, and packages them for offline display. It retains each configuration’s dates, description, and citation. Alaska and Hawaiʻi use geographic insets.

## Time and scope

- The year slider samples jurisdiction boundaries on **December 31**. Changes within a year cannot be explored separately in this interface.
- Historical coverage: September 3, 1783 through December 31, 2000. Before 1783 no state lines or political fills are shown. Colonial boundaries have not yet been added.
- After 2000 the app uses its modern U.S. Census / us-atlas reference, rather than extrapolating dated Newberry records. Small recent adjustments are not modeled year by year.
- The terrain, land outline, coastline, and geographic city locator illustrations remain modern reference geography. They do not represent historical shorelines or the historical national extent.
- This is a layer of U.S. jurisdictions and selected territorial claims. It does not map the full geography of Indigenous nations, sovereignty, displacement, or overlapping claims. Uncolored land is outside the layer’s recorded jurisdictions, not empty or uninhabited.
- Generalized polygons can differ slightly from the separate modern coastline and terrain, especially on shores and insets.

## Civil War colors

For the year-end snapshots of 1861–1864, blue marks Union states and D.C., rust marks the eleven Confederate states, and gold marks border states that remained in the Union: Delaware, Kentucky, Maryland, Missouri, and (after statehood in 1863) West Virginia. Territories have their own neutral color. The text list in “About these boundaries” provides the same classifications without relying on color.

These are broad political affiliations, **not front lines or a map of slavery**. Union occupation changed throughout the war. Kentucky and Missouri also had rival Confederate governments. Territorial alliances and contested military control are not modeled. By December 31, 1865 the Confederacy had collapsed, so that snapshot returns to jurisdiction colors. The editorial Civil War chapter still covers 1861–1865.

Sources:
- https://www.nps.gov/civilwar/facts.htm
- https://www.nps.gov/articles/the-border-states.htm
- https://www.archives.gov/legislative/features/west-virginia
- https://www.archives.gov/milestone-documents/emancipation-proclamation

## Reuse

Newberry’s current download notice permits lawful commercial and noncommercial reuse without library licensing fees and says the obsolete copyright licenses bundled with old downloads may be disregarded. Consult its current terms:
- https://publications.newberry.org/ahcb/downloads/states.html
- https://www.newberry.org/rights-and-reproductions

Projection, simplification, and display choices are this project’s; they are not endorsed by the source institutions.

## Reproduce

Download the ZIP above, then run from atlas/:

    npm run prepare:history -- "path/to/US_AtlasHCB_StateTerr_Gen01.zip"

The preparation script reads only polygon geometry and attribute records. It needs no new dependencies and does not run during normal builds. Source ZIPs are not required at runtime.
