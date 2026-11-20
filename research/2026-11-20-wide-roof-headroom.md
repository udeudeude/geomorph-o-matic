# Wide volcanic caves: physically consequential, explicitly conjectural roof constrictions (2026-11-20)

**Status:** architectural design experiment, not a cave survey or a finished dungeon. This pass addresses a serious previous omission: all three wide-mouth floor plans had plausible horizontal corridors but no modeled ceiling restrictions, and therefore made it too easy to mistake five-foot passage **width** for standing **clearance**.

## Field evidence considered

1. **Kauahikaua et al. (1998),** [*Observations on basaltic lava streams in tubes from Kīlauea Volcano*](https://www.usgs.gov/publications/observations-basaltic-lava-streams-tubes-kilauea-volcano-island-hawaii), *Journal of Geophysical Research*, DOI 10.1029/97JB03576. Field-observed tubes near source vents could be as much as 20 m high and 10–25 m wide; roofed-over channels commonly about 5 m high and 3 m wide; low-gradient, inflated sheet flows were often 1–2 m high and tens of meters wide. In particular **plan width cannot determine roof height**. Our fictional sheetflow assumptions should not simply borrow the height of a tall roofed-over channel.
2. **Peterson et al. (1994),** [*Development of lava tubes in the light of observations at Mauna Ulu*](https://www.usgs.gov/publications/development-lava-tubes-light-observations-mauna-ulu-kilauea-volcano-hawaii), *Bulletin of Volcanology*, DOI 10.1007/BF00326461. Roofs can form from a rooted crust, accretionary levees, fused floating crust plates, or lobes fed by distributary networks; local roof variation is therefore plausible but should follow a geological explanation, not random corridor noise.
3. **United States National Park Service,** [*Craters of the Moon cave field guide*](https://home.nps.gov/crmo/learn/education/site-tour-3.htm), updated 2024-02-23. Cooling, subsidence and later erosion can create varied roof failures and skylights. A lowered ceiling is distinct from a roof fall that completely blocks an edge.
4. **National Park Service,** [*Lava Caves/Tubes*](https://www.nps.gov/subjects/caves/lava-caves-or-tubes.htm). These caves may be close to the surface; collapse is frequent enough to matter to cave architecture, but none of the source descriptions establishes actual bearing capacity for our fictional arches.

**Interpretation limit:** These publications are field constraints, not measurements from the invented caverns. We did not extract, trace or copy any particular surveyed cave geometry.

## Three substantive changes

### 1. Distinct height regimes, registered to actual occupied plan

Each of the three designs now declares a *hypothetical* baseline height above the local floor, rather than treating horizontal width as vertical clearance.

| Authored cave | Hypothetical baseline | Actual plan cells assigned a lower roof | Constriction |
| --- | ---: | --- | ---: |
| Braided Lava Confluence | 8 ft | (9,6), (10,6) across the upper feeder | 3.5 ft |
| Sagging Sheetflow | 6.5 ft | (7,6), (8,6) across the west inner throat | 5 ft |
| Split-Spine Drainback | 7.5 ft | (6,9), (7,9) along the west septum | 3.5 ft |

A hypothetical 6.5-foot sheet-flow baseline was chosen to distinguish a broad, lower inflated-sheet passage from the more elevated distributary hypotheses. These exact numbers are **design values**, not fitted measurements. The two-cell bands are each five feet in plan. They are genuinely occupied floor cells with cardinal continuity, not a graphic laid over absent floor.

The complete two-cell-wide external mouths remain unaffected through the first five feet inward. This is only an assumed clearance scenario; the established modular interface standard itself still specifies **width only**.

### 2. Posture-aware routing, without confusing roof and rubble

`wide-headroom.js` validates ceiling scenarios against the canonical room-and-hall footprint and its entrance protection. Its three gameplay travel modes use author-defined minimum clearances (standing 6 feet, crouching 4 feet, crawling 2.5 feet). Those are **simulation thresholds**, not health, accessibility or safety standards.

The analysis starts from the actual ordinarily accessible, dry floor graph. It preserves blocked roof-fall edges, chamber thresholds, and the grade transitions already modeled in Sagging Sheetflow. It then excludes any floor cell that fails a selected height requirement. It separately counts lost destinations, accessible mouth cells, and actual shortest-path detours. These are geometry tests, not speculative navigability captions.

Expected outcomes, protected by independent JavaScript and Python regression tests:

- Braided Lava: a west-to-east upper crossing grows from **23 to 31 half-cell steps** without losing any exterior connection; the 3.5-foot feeder band remains crawlable.
- Sagging Sheetflow: the same comparison grows from **29 to 31 half-cell steps**. A 5-foot roof admits the crouching scenario but not the standing one.
- Split-Spine Drainback: the west pocket includes crawl-only territory; standing access reaches **208 of 223** floor cells but all sixteen external mouth cells still connect.

These results are specific to authored assumptions. They are not predictions of travel speeds or physical exertion.

### 3. Ceiling-specific SVG language and explanatory sections

A new independent, editable `ceiling-clearance` vector layer marks the boundaries and coordinates of low-crown zones. The marks use restrained dashed contours and hatching so they do not read as full-height walls or blocked collapse edges. The original terrain and doorway layers remain authoritative for floor access.

A generated three-panel technical drawing (`studies/wide_roof_sections.svg`) shows the **two actual registered floor cells** in each constriction and the explicitly assumed local height. It is intentionally not a reconstructed complete cave roof, and its explanatory title disclaims survey status. The JSON report (`reports/wide-roof-clearance.json`) records travel-mode results and cave-by-cave constraints.

Regenerate with `node wide-cave.js && node wide-headroom.js`; independently test with `node --test tests/*.test.js` and `PYTHONPATH=. python3 -m unittest discover -s tests -p 'test_*.py'`. The repository's verification workflow regenerates and checks the vector outputs.

## Remaining design weaknesses and research priorities

1. **Acquire published paired floor plans and measured cross sections** for both roofed channels and inflated sheet flows, recording *spatially varying* width, roof profile, slope and substrate. Avoid inferring an entire passage from two point samples. A good next step is a section-and-grade dataset whose unknown fields are explicitly nullable.
2. **Check three-dimensional consistency of the raised sheetflow bench**, including whether an eight-cell raised platform with three approaches could fit below a 6.5-foot local vault, and whether slope transitions require stairs rather than the existing abstract ramp flags. At present “height above local floor” does not encode roof level relative to a common datum.
3. **Print real paper and human-test routes.** The thin dashed ceiling marks may be too subtle or too easily confused with roof fall at true size; no one has physically reviewed the paper. Simulated posture-specific paths are not a substitute for players identifying navigation choices in the rendered map.
4. **Critique unsupported uniform baselines.** The baseline is a *single hypothetical height per tile*, almost certainly an oversimplification of real lava-tube ceilings. This pass is a meaningful first vertical constraint, not a completed volumetric rock model.

**Release decision:** keep all wide-mouth caves as experimental studies. The project is not ready for release.
