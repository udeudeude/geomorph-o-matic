# Real floor geometry before decorative cave ink
19 November 2026 · design note · provisional studies

## Research and a narrower, more accurate claim

- [Dyson Logos, Vault of the Cave Morphs (2018)](https://dysonlogos.blog/2018/06/25/vault-of-the-cave-morphs/): the five cave morphs there use **two conventional squares** at every entrance. Our single half-cell mouth, at the documented five-foot conventional square, remains only **2.5 feet** wide. Our maps are **not interchangeable with those Dyson morphs**.
- [Dyson Logos, 2022 Cave/Lair Geomorphs Set 2](https://dysonlogos.blog/2022/02/28/2022-cave-lair-geomorphs-set-2/): irregular cavern links, water, two tiers, dead ends, and squared constructed chambers are deliberately combined; a random rock-wall stroke pattern alone cannot produce that quality of circulation.
- [National Speleological Society, Cartography Salon judging criteria](https://caves.org/salons/cartography-submissions/cartography-judging-criteria/): strong visible passage walls, immediately recognizable connections, plan/profile relationships, coherent symbols and vertical control matter. A passage cross-section that lacks observed ceiling geometry is **not** a real survey section.
- [National Park Service, Jewel Cave surveying](https://www.nps.gov/jeca/learn/nature/surveying.htm): real survey sketches tie passage-wall position to station measurements and vertical observations. Our invented plan clearances describe only floor cutouts.

## Authored corrections: two different cave origins

**Lantern Sink: reused dry pilgrimage approaches.** The northern joint has an uneven side expansion, the high approach gains a recessed drip pocket, and the eastern approach opens into a lateral dry solution eddy. A small refuge broadens the southwestern return. These modifications alter occupied floor cells, with no extra exterior mouths, no fictitious water crossings, and no new route around the western blocked edge.

**Scoured Siphon: abandoned water-cut branches.** The northern relict tube expands into asymmetric two- and three-half-cell sections, leaving the Old Tube chamber separated by a real remaining rock mask. The western elbow, downstream dry undercut, and eastern bypass have small flood-plain pockets. These do not remove the bank breakdown, replace the bridge, or change the raised shelf's two modeled ramps.

These are composed **walkable masks**, not post-processed wall perturbations. The resulting curves still inherit some square-cell ancestry. We have *not* supplied measured headroom, structural stability, water fluctuation, or a physical print review.

## Independent evidence and how to reproduce it

`node cave-passage-widths.js reports/cave-passage-widths.json` measures **clear uninterrupted hall cells** perpendicular to hand-selected passage axes. Each half-cell is 2.5 feet. The new independent tests reject hand-waved widths and verify all eight rotation-compatible portals, connected floors, and reports that disclaim survey accuracy. Existing JavaScript and Python tests continue to check detours, bridges, upper beds, print scale and XML.

The reference sites are **fictional horizontal floor-plan widths**, not surveyed cave transverse sections. In particular, a 7.5-foot-wide plan cut says nothing about ceiling height, navigable slope, or human access at that location.

## Next work

1. Study actual karst cave plans alongside the source drawings, then redesign **long underlying north-south route axes** rather than only their pockets.
2. Prototype a *separate* wider-seam geomorph standard if five- to ten-foot compatible portals are required. Do not silently mix incompatible families.
3. Review physical prints at 100 percent and playtest flooded and dry variations, including ceiling-height and ladder clearance questions. All edited artwork remains provisional.

## Counting choices without exaggerating them

A widened two-by-two walkable floor patch introduces one cycle into the ordinary *cell graph*, but it does **not** create a new meaningful explorer route. We now distinguish all cell-graph cycles from the nontrivial cycles remaining after subtracting elementary four-cell faces. The Scoured Siphon's raw 8-to-23 cycle increase is **mostly small floor squares**: the meaningful count moves from 3 to 4. Lantern Sink's raw 9-to-15 increase leaves its meaningful circuit count at 2. This is a conservative planar-graph proxy, **not** a replacement for actual route playtesting.
