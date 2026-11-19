# Hollow Causeway: natural geomorph, not a mechanical model
19 November 2026 | Original architectural study

## Research and design interpretation

- [Dyson Logos, Vault of the Cave Morphs (2018)](https://dysonlogos.blog/2018/06/25/vault-of-the-cave-morphs/) establishes that an irregular cave can retain modular compatibility without becoming a rectilinear tunnel diagram. Its bold outer rock masses informed this **original**, independently composed cave; no source art was copied.
- [Dyson Logos, Geomorphic Halls level 4 (2019)](https://dysonlogos.blog/2019/07/15/geomorphic-4/) uses a subterranean lake, island and a descent to make vertical variation an exploration question, rather than an ornamental label.
- [U.S. National Park Service, Solution Caves](https://www.nps.gov/subjects/caves/solution-caves.htm) describes the dissolution of limestone along joints, active underground streams, and abandoned channels after changes in drainage. The map makes the western high-and-dry resurgence and active wet cleft distinct spaces.
- [U.S. National Park Service, Jewel Cave Surveying](https://www.nps.gov/jeca/learn/nature/surveying.htm) distinguishes plotted survey lines from hand-sketched actual passage outlines. Our grid is a game-navigation model; organic contours are an interpretive drawing, not a field survey.

## Three practical design changes

1. **The new Hollow Causeway** has six irregular chambers, nine interconnected corridor loops at the half-cell level, eight conventional rotation-invariant boundary mouths, and one concealed pocket. The cave is deliberately asymmetrical in area and route structure, with named dry and wet compartments rather than mirror chambers.
2. **Unframed natural openings** are first-class thresholds. A cave throat does not require a door leaf just because the internal navigation graph distinguishes the opening from the surrounding rock. Ten openings are plainly open in everyday travel, with no artificial hinge glyphs; the one sealed discovery remains genuinely secret.
3. **Distinct ways to cross the same flooded cleft:** a single narrow plank bridge at the eastern edge of the main flooded rift; a short overhead calcite traverse with separate fixed ladders at each end; and longer dry routes outside the main chamber. The model prevents walking across the flooded main channel when not on a bridge or the upper route. These two crossing methods provide a tested local shortcut.

## Limits and visual review

- The upper traverse is a hypothetical intact calcite/bedrock arch. Its load capacity, underside height and anchor connections are **not** established. The term `calcite arch` identifies a design idea, not a geotechnical finding.
- Water is recorded as impassable for normal dry-foot travel, with wading a separate mode. Flow direction, depth, high-water behavior and downstream discharge remain unknown. The standalone pearl-water pocket is **not** claimed to share hydraulic continuity with the rift.
- The retained half-square geometry can still make a room's edges too faceted even with smoothed wall contours. Inspect physical output at 100% before declaring the tile visually successful.
- The four-tile composition tests edge compatibility and provides a visual proof; it has not been playtested.

## Reproduce

```sh
python3 validate.py
node render.js
node assemble.js examples/assembly_hollow_2x2.json examples/assembly_hollow_2x2.svg
node print-review.js examples/hollow_causeway_print_letter.svg hollow_causeway
node --test tests/hollow-causeway.test.js
PYTHONPATH=. python3 -m unittest tests.test_hollow_causeway
```
