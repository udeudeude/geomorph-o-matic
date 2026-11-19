# The Hollow Causeway: breakdown, cave deposits and natural shorelines
19 November 2026 | Original, editable cave-map study

## Research that changed the design

1. **A cave obstruction is a mapped passage ending, not an ornament.** The [National Speleological Society's historic cave symbols](https://www.mexicancaves.org/nl/01-07.pdf) distinguish breakdown chokes, loose floor breakdown, stream direction, pools and underlying passages. We now encode those as separate concerns: `terrain.chokes` actually closes an edge in the route graph; `cave_details.breakdown` marks traversable loose stone and does **not** close an edge. Both are illustrated with independent editable vector groups.
2. **A map should show passage morphology rather than expose its plotting grid.** [Jewel Cave's National Park Service surveying explanation](https://www.nps.gov/jeca/learn/nature/surveying.htm) distinguishes surveyed passage line plots from interpreted wall sketches. Continuous water silhouettes are therefore traced from the wet-cell union instead of exposing individual blue square cells. The cell topology remains authoritative for play and rotation.
3. **Geology can make an environment legible without simulated machinery.** The [International Union of Speleology's map symbol guidance](https://uis-speleo.org/index.php/survey-and-mapping/) and [National Speleological Society cartography criteria](https://caves.org/salons/cartography-submissions/cartography-judging-criteria/) emphasize distinguishable breakdown, cave form, water and levels. The dry fossil tube now carries gravel, the drip-fed shaft flowstone curtains, the blind cleft breakdown fragments, and the upper rift scalloped erosion marks. These symbols are *interpretive fiction*, not claims of a measured survey.
4. **Modularity need not remove surprising local obstacles.** [Dyson Logos's cave geomorphs](https://dysonlogos.blog/2018/06/25/vault-of-the-cave-morphs/) combine bold cavern geometry with standardized tunnel mouths, while [his 2022 cave/lair geomorphs](https://dysonlogos.blog/2022/02/28/2022-cave-lair-geomorphs-set-2/) use pools, bridges, mixed worked/natural rooms and two-tier routes. Our artwork and specific geometry are independently authored, with no copied source linework.

## Three implemented changes

### 1. A real blocked cave throat

- At the west cleft, between (5,10) and (5,11), one narrow passage is buried under breakdown.
- The obstruction has its own vector group `cave-breakdown-chokes`, is present in **both dry and wading navigation**, and is separately validated in JavaScript and Python.
- The northwestern to southwestern mouth route increases from **27 to 41 half-cell steps** under the simple floor-and-door model, without losing any of eight standard portal connections. The automated tests also compare paths using the canonical routing implementation, to avoid depending solely on this manual calculation.
- A real choke is disallowed on a standardized tile-mouth cell, on a ramp, in water, on a duplicate obstruction or between nonadjacent floor cells.

### 2. Four dry geological details, each authored and checked

`cave_details` holds 12 deliberately placed floor cells: three each of `flowstone`, `breakdown`, `gravel` and `scallops`. The renderer creates original compact vector glyphs. The independent validators reject water, ladder landings, external portals, non-floor cells and duplicate marks. These deposits are deliberately **not movement blockers**; physical blockage is represented exclusively by a `chokes` edge.

### 3. Connected wet shapes, rather than blue pixel blocks

The cave renderer forms deterministic boundary chains around the *union* of wet cells. It draws a softened shoreline for the long fissure and a distinct enclosed pearl-water pool while preserving exact wet-cell movement rules. Worked masonry tiles retain their earlier water rendering. Shoreline geometry is purely illustrative and should never be inferred as surveyed water depth or a precise shoreline.

## Outstanding questions and research priorities

1. **Cave passage and deposit plausibility:** compare the interpreted scallops, talus, dry tube and flowstone distribution against published karst survey plans and speleogenesis examples. Do not imply the sculpted marks establish paleoflow direction.
2. **Vertical passage credibility:** test the calcite traverse's bearing rock, ladder landings, clearance, flood visibility and realistic alternative access. Its supported load and height remain unknown.
3. **Visual and play assessment:** inspect actual-size prints and mixed four-tile compositions for line collisions and distinguishable chokes versus loose rock. Conduct a route-choice playtest. These cannot be inferred from passing XML and navigation checks.

No physical printed proof, hydrological capacity analysis or geotechnical inspection was performed. This map remains an architectural/cartographic study and is not ready to be called finished.

## Reproduction

```sh
python3 validate.py
PYTHONPATH=. python3 -m unittest discover -s tests -p 'test_*.py'
node render.js
node --test tests/*.test.js
node assemble.js examples/assembly_hollow_2x2.json examples/assembly_hollow_2x2.svg
node print-review.js examples/hollow_causeway_print_letter.svg hollow_causeway
```
