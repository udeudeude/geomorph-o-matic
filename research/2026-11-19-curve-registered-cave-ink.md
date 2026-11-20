# Curve-registered cave ink and Hollow Causeway revision
19 November 2026 · Cartographic design review · work in progress

## First-principles research

- [Dyson Logos, Vault of the Cave Morphs (2018)](https://dysonlogos.blog/2018/06/25/vault-of-the-cave-morphs/): deliberately distinctive cave openings and strong ink silhouettes. His caves are not copies of an orthogonal room generator; our stricter eight-mouth grid is a design constraint, not a stylistic model to imitate.
- [Dyson Logos, Geomorphs Set 6 (2019)](https://dysonlogos.blog/2019/08/29/geomorphs6/): mixed cave, tower, pool and collapsed dungeon environments use meaningful landmarks within interoperable compositions, rather than making every tile a uniformly hollowed ring.
- [National Park Service, Mapping Mammoth Cave](https://home.nps.gov/maca/learn/cave-mapping.htm): survey sketches track irregular passage boundaries, breakdown and formations, while cross-sections record actual passage dimensions. These fictional plans do not have surveyed cross-sections or assigned survey grades.

## Critical diagnosis

The source half-cell layout provides exact connections, but our previous natural-cave wall renderer displaced ink away from those rectilinear boundaries **without moving its hachure marks**. On-screen, the marks could start in blank rock, touch the wrong side of an overhanging wall, or appear to follow the invisible grid instead of the cave outline. Adding more decoration would conceal rather than resolve that flaw.

The new drawing code constructs **one shared, deterministic cubic wall model**. Each rock needle starts 1.6 vector units outside an actual sampled cubic, follows a local rock-facing normal, and preserves the standard tile boundary without altered coordinates. Curves, needles and endpoints remain separate editable SVG groups. The registered hachures are tested geometrically, including malformed parameters and modular edges. The visual result still requires close examination at full print scale.

## Hollow Causeway: genuine void alterations

Recomposed five existing chamber footprints using nine added rock-cut cells, without introducing passage-shaped overlays:
- Great Rift: a northern undercut, a western rim notch and a broadened southwest taper; changes at (11,6), (6,10), (7,11), (8,12).
- Dry Lung: a splayed upstream shoulder and a taper connecting toward the central approach; changes at (2,2), (5,5).
- Lost Channel: widened abandoned-tube head at (1,12).
- Pearl Pool: a widened headwater shelf at (14,12).
- Blind Fissure: a broader asymmetric fossil entry at (11,16).

These are deliberate changes to authored room silhouettes and true walkable floors, not just line-art noise. Existing doors, bridge, overhead traverse, water, collapse and eight exact rotational ports are unchanged. The original blocked passage and dry detour remain subject to existing separate navigation tests. These alterations do **not** prove that the enlarged cave is geologically surveyed or aesthetically finished.

## Physical-scale correction

The ten-square-wide tile prints at 0.5 inch per **5-foot** standard square, with **20 half-square cells** across. Therefore an unexpanded single-half-cell edge throat is **2.5 feet** wide and prints at **0.25 inch / 6.35 millimetres**, not five feet wide. This is narrow but plausible for a squeeze, service gallery or pedestrian cave throat. Calling it a five-foot doorway would be physically inaccurate. The print audit and proof label now disclose the actual dimension, without silently widening any modular interface or pretending the whole tile is accessible to all modes of movement.

## Remaining design liabilities

1. **Composition:** Most caverns still expose rectangular, one-cell-wide connector trunks after the first bend. Future geomorphs need changed *circulation*, not endless decorative contour noise.
2. **Width and human use:** All eight standard portals have 2.5-foot geometric clear width. A future five-foot portal standard would require reworking all edge masks, rotation tests, authored routes and compatibility claims, not changing a label.
3. **Elevation:** A numerical +1 terrain label is not presently tied to verified rock-ledge rise, slope, headroom or ceiling relationships. Review the actual crossing and make low scrambles distinct from stairs and full-level ladders.
4. **Drawing review:** Proof geometry and numerical hachure registration do not establish that lines remain clear at physical size. Compare a 100-percent printed map against this source and inspect actual room/path anatomy.
5. **Geology:** Floor pockets and wall strokes are invented for adventure play, not a measured karst survey. There is no external hydrology, rockfall stability or bridge support calculation.

## Reproduction

```sh
node render.js
node --test tests/cave-ink-registration.test.js tests/hollow-causeway.test.js
PYTHONPATH=. python3 -m unittest discover -s tests -p 'test_*.py'
node print-review.js examples/hollow_causeway_print_letter.svg hollow_causeway
node assemble.js examples/assembly_hollow_2x2.json examples/assembly_hollow_2x2.svg
python3 validate.py
```

The standard workflow rerenders and verifies master vectors, assemblies, print sheets and topology reports. The collection is still unfinished.
