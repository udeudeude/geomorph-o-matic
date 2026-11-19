# Scoured Siphon: an original, structurally legible karst geomorph

19 November 2026. Working cartographic study; not a survey or finished map.

## Research influencing the drawing

1. [Karst caves and passage forms, Environmental Geology / Earle](https://geo.libretexts.org/Bookshelves/Geology/Environmental_Geology_%28Earle%29/12%3A_Karst_and_Caves/12.04%3A_Karst_Cave_Features_Cave_Contents_and_Subterranean_Life) distinguishes earlier phreatic tubes from later stream-cut vadose canyons, including keyhole cross sections, and identifies joints, bedding and ceiling breakdown as constraints. The northwest dry keyhole and central wet incision are composed as contrasting cave histories rather than interchangeable rooms.
2. [Mammoth Cave mapping, National Park Service](https://www.nps.gov/maca/learn/cave-mapping.htm) explains why a plan alone cannot communicate passage height: genuine surveys use cross sections and running profiles. Therefore the eastern high gallery is explicit *traversable raised floor* with two ramp connections, not a label claiming a three-dimensional shortcut.
3. [National Speleological Society cave symbols](https://caves.org/wp-content/uploads/2023/11/Vol-41-num-2.pdf) distinguish breakdown on floors, breakdown-choked passages, water and upper/lower passages. The western obstructed throat modifies the route graph, whereas nearby decorative breakdown does not. River bank and bridge access also affects dry traversal.
4. [Dyson Logos's original cave geomorphs](https://dysonlogos.blog/2018/06/25/vault-of-the-cave-morphs/) and [his later cave/lair morphs](https://dysonlogos.blog/2022/02/28/2022-cave-lair-geomorphs-set-2/) demonstrate non-square chamber plans, strong outside rock silhouettes, mixed water and alternate paths within standardized joins. This composition and its drawing geometry are original, not traced or reused from his maps.

## Composition and navigation

- Six individually sculpted, unequal chamber footprints. The central stream is an eight-cell continuous watercourse crossed by one explicitly bridged cell.
- Twelve chamber thresholds, eleven genuinely open and one secret. Every chamber connects to the ordinary dungeon network.
- The north-eastern high limestone shelf is an actual +1 elevation group, reached by two independent, explicit ramp edges. Both standard exit boundaries remain at base elevation.
- The one collapsed western edge forces a testable overland dry detour while retaining all eight modular exits. The map uses eight conventional mouths at positions 4 and 15, invariant under quarter-turn rotation.
- Twelve small, separate geological marks identify dry tube scallops, secondary flowstone, low-channel gravel and broken rock. These marks are intentionally non-blocking.

## Evidence, limitations and next research

The route distances are grid-path lengths rather than feet measured in a cave. The elevated shelf is a plausible drawing hypothesis, **not verified structural geology**: physical slope, low ceiling over the lower channel, bridge supports, flood depths, sediment and erosion history remain unspecified. Scallop marks do not establish paleoflow orientation. The grid-driven organic walls require a critical physical-size artwork inspection and interactive tabletop trials.

Compare karst cave long profiles and actual survey sections to assess the shelf's vertical proportions; photograph paper proofs to find overloaded geology or unreadable ramp strokes. Avoid extending technical hydraulic simulations at the expense of map quality.

## Reproduce

```sh
python3 validate.py
PYTHONPATH=. python3 -m unittest discover -s tests -p 'test_*.py'
node render.js
node --test tests/*.test.js
node assemble.js examples/assembly_scoured_2x2.json examples/assembly_scoured_2x2.svg
node print-review.js examples/scoured_siphon_print_letter.svg scoured_siphon
```

## Cartographic correction: uphill ramps

Earlier maps drew ramps as unoriented straight strokes, leaving the viewer to infer uphill direction from a tiny elevation label. Following standard cave-map slope annotations, ramp glyphs now use a short directional arrow **toward the higher canonical floor cell**, regardless of edge ordering. This improves the Scoured Siphon's two separate approaches and applies to existing maps. The geometry, not the arrow, determines travel legality; tests check reversed and below-datum slopes.
