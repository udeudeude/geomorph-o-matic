# A second wide-mouth study: The Sagging Sheetflow (20 November 2026)

**Status:** Original, editable, reproducible architectural **study**, not a finished adventure map or geotechnical model.

## The geological distinction that changes the drawing

The preceding Braided Lava Confluence investigates anastomosing tube distributaries. Simply rearranging its corridors would not create a compelling second geomorph. **The Sagging Sheetflow** instead imagines a deflated, inflated pahoehoe sheet with adjacent vesicles, partly surviving partitions, a lower central depression, and a remnant raised floor. Its six chambers and 54 row-run floor segments encode a different plan, with an asymmetric west-side pocket and three independent approaches to an eastern bench.

- William R. Halliday, "[Sheet flow caves of Kilauea Caldera, Hawaii County, Hawaii](https://digitalcommons.usf.edu/ijs/vol27/iss1/11/)," *International Journal of Speleology* 27 (1998), 107–112, DOI 10.5038/1827-806X.27.1.11. Describes low, wide, three-dimensional nests and partly melted septa in inflated sheet flows. This motivates **separate inflated pockets**, not a copied field survey.
- [United States Geological Survey Bulletin 1673, Sentinel Cave](https://npshistory.com/publications/geology/bul/1673/sec2g.htm). Documents superposed lava tubes, roof and floor collapse, and surviving benches and alcoves. It supports showing breakdown and a bench together, while **not** allowing us to assign a reliable roof thickness.
- [National Park Service, lava caves and tubes](https://www.nps.gov/subjects/caves/lava-caves-or-tubes.htm). Explains tube roofing and drainage and the vulnerability of near-surface tubes to collapse. This is consistent with a collapsed northwest throat.
- Jim Kauahikaua and collaborators, "[Observations on basaltic lava streams in tubes from Kilauea Volcano](https://doi.org/10.1029/97JB03576)," *Journal of Geophysical Research* 103 (1998), 27303–27323. Reports that tube dimensions depend greatly on emplacement setting, warning against extrapolating plausible ceiling dimensions directly from a two-dimensional floor plan.
- [Dyson Logos, "Vault of the Cave Morphs" (25 June 2018)](https://dysonlogos.blog/2018/06/25/vault-of-the-cave-morphs/). The two-square standard in those cave geomorphs motivates a separately defined wide interface; this study is original work, not a traced or copied map.

## Constructed architectural logic

The **50 by 50 foot** plan occupies 20 by 20 half-cells, each 2.5 feet wide. It contains six irregular chamber footprints and 240 walkable half-cells. There are 18 explicit natural thresholds. The eight edge mouths each occupy two adjacent half-cells, and that full five-foot clearance continues at least five feet inward. Rotation and mixed assembly preserve exact joining positions. No attempt is made to connect it to the incompatible 2.5-foot standard.

A **two-edge collapsed roof fall** blocks both crossing edges of the northwest five-foot feeder at [(5,4)–(6,4)] and [(5,5)–(6,5)]. Without this collapse, the shortest dry route from the northwestern mouth at (5,0) to the northeastern mouth at (14,0) is **17 half-cell steps**. With it, the route is **31 steps**, a **14-step or 35-foot additional walk**. All 240 floor cells remain connected under ordinary traversability and all 16 occupied boundary cells are reachable. These are **horizontal plan distances only**.

The raised eastern bench is eight occupied cells with a level-index offset of +1. Three actual graph-approved transitions at its west, east and south edges provide independent approaches. The index is **not a stated number of feet**. No slope, overhang, vault span, gradient or headroom is implied. The remaining edges of the raised bench are explicitly non-traversable ledges.

The vector drawing is built from canonical floor ownership, room thresholds, blocked edges, and level changes. Wall engraving, rock texture, rubble, floor and ramp signs remain editable groups. The physical letter-size sheet preserves a five-foot mouth as 12.7 millimetres at the chosen half-inch grid scale. **No physical print has been examined.**

## Checks and reproducible artifacts

Generate the complete two-cave study with `node wide-cave.js`. It now produces both original maps, letter print proofs, the original four-orientation Braided Lava plate, a **mixed two-design four-tile plate**, and separate machine-readable route reports. Both JavaScript and independent Python regressions verify the new cave's seam masks, room ownership, real collapse edges, detour, elevated bench, and reachable chambers. The workflow validates every generated vector as structured XML and version-controls the results.

- [Sheetflow map](../studies/sagging_sheet.svg)
- [Mixed assembly](../studies/wide_mixed_2x2.svg)
- [Actual-size print proof](../studies/sagging_sheet_print_letter.svg)
- [Sheetflow route and elevation report](../reports/sheetflow-routes.json)
- [Existing Braided Lava cave](../studies/braided_lava.svg)

## Critical limitations and highest-value next research

1. **Measured plan/section pairing:** Research published cave surveys with both plan and transverse sections, ideally inflated sheet caves rather than generic tube panoramas. Establish scenarios for low clearances, disconnected upper levels, and physical ledge climbability without treating hypothetical dimensions as measured facts.
2. **Drawing composition and physical reproduction:** Audit natural edges for excess square-grid runs and overprinted clutter; inspect a physical print at 100 percent before adjusting hatching, obstruction symbols or typography.
3. **Exploration and route diversity:** Playtest a two-design mixed arrangement in all four rotations. Check whether the 35-foot detour produces interesting decisions or merely a long trudge, and whether the chamber edges invite unintentional shortcuts.
4. **Further variation:** Add a third wide-mouth tile built around markedly different architecture (e.g., a high-angle tube cascade or an eroded volcanic fault) only after the two candidates survive critical revision.

The assembled plate reuses **two** designs twice each, not four independent caves. The artwork, geology and route logic are provisional; neither candidate is release-ready.
