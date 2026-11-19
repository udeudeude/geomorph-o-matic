# Overlapping floors and circulation (18 November 2026)

## Evidence considered

1. The [National Park Service's Mammoth Cave survey guidance](https://home.nps.gov/maca/learn/cave-mapping.htm) distinguishes the plan-view survey from the cross sections and running profiles that make vertical relationships understandable.
2. The [Mammoth Cave map and guide](https://home.nps.gov/maca/planyourvisit/mammoth-cave-map-guide.htm) describes abandoned higher passages and progressively lower, younger active stream routes.
3. The [National Park Service explanation of solution caves](https://www.nps.gov/subjects/caves/solution-caves.htm) documents the relationship between shafts, gradients, pits and horizontal water-bearing passages. These are geological precedents, not evidence that a built flood-control gantry is a natural cave.

**Architectural application:** a dungeon's lower and upper floors must be separate traversable surfaces, even where the plan projection overlaps. An elevated deck must not silently turn the submerged ground beneath it into dry floor. Ladders, shafts and stairs are explicit connections, not automatic adjacency.

## Implemented

- New `vertical.decks` stores named connected cell surfaces at integer levels, independently of existing base-floor `terrain.elevations`.
- `vertical.links` connects two floors at the same plan position with an explicitly authored ladder or stair. Stair transitions must differ by exactly one level.
- `vertical.js` constructs a three-dimensional circulation graph. Its lower plane inherits all ordinary, locked, secret, bridge, flood and ramp restrictions from `terrain.js`. Vertical links touching submerged lower cells do not create a dry traversal loophole.
- Both JavaScript and Python reject disconnected or boundary-crossing decks, missing landings, inconsistent level links, duplicated deck surfaces and floating platforms. The permanent 20 by 20 boundary contract remains unchanged.
- The vector renderer adds independently editable `overhead-decks`, `deck-parapets` and `vertical-connections` groups.
- `The Riftwater Lock` now has a five-cell turbine inspection gantry above a partly flooded sump, reached by ladders from **two separate service approaches**. The north-south bridge remains on the original level, creating a distinct lower crossing.

## Deliberate limitations

1. The parallel height layers are topological, not yet a full solid-geometry engine: no collision volumes or computed sightlines.
2. The overlaid plan view may be ambiguous when printed small. Next: separate annotated level inset and profile, plus print-scale comparison at 10-by-10-square tile size.
3. The graph measures shortest-path gains and connectivity. It does not prove that a route is visually readable, tactically desirable or interesting to play.
4. Water is presently static. Next: explicit flood stages, hydraulic connectivity and scenarios where access changes at known thresholds.
5. Source vector files remain reproducible *architectural studies*, not finished cartography.
