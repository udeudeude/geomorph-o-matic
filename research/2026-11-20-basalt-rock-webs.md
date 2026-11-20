# Basalt Rift: real rock webs and registered interpretive sections

20 November 2026. **Original fictional dungeon geometry; not a field survey, engineering drawing or finished cartography.**

## Research informing the revision

1. [U.S. National Park Service, lava-tube formation](https://www.nps.gov/subjects/caves/lava-caves-or-tubes.htm) describes a solidified lava roof enclosing a draining molten conduit. Tubes are commonly near the surface, where roof collapse and entrance formation matter. A branch around a rock partition is more credible when the partition exists in **floor geometry** instead of being drawn as a superficial engraving.
2. [U.S. Geological Survey Bulletin 1673, Skull Cave and other lava tubes](https://npshistory.com/publications/geology/bul/1673/sec3d.htm) describes multiple eruptive layers, breached floors, collapse-related enlargement and rock fills. Natural lava caverns do not have one universal roof shape or uniform supporting material. **A plan-measured two-cell rock band does not prove a load-bearing rib.**
3. [National Speleological Society cartography judging criteria](https://caves.org/salons/cartography-submissions/cartography-judging-criteria/) require cross-section details to correspond to plans, clear identification of section lines and explicit scale. The new artwork intentionally uses accurately registered *horizontal plan transects* but labels its curved roof strokes hypothetical; it is **not a transverse geological survey**.
4. [British Cave Research Association survey grades](https://bcra.org.uk/surveying/) distinguish measured passage detail from remembered or estimated detail. None of the three-dimensional forms here merits an actual survey grade.

These references inform the *logic* of an original dungeon composition. They are not source geometry or an endorsement of the fictional dimensions.

## Three concrete changes

### 1. Recompose two volcanic distributaries around thicker, real rock

- Western branch: remove the traversable cell **(7,9)**, carve **(6,8)**, and change the branch around the preserved **(7,9)–(8,9)** rock web.
- Eastern branch: remove the traversable cell **(14,9)**, carve **(15,8)**, and change the branch around the preserved **(13,9)–(14,9)** rock web.
- On the 2.5-foot half-cell grid, each intervening band is now **5 feet thick in plan**, up from **2.5 feet**. The two alternative passages remain actual, dry connected routes. The central main lava conduit remains an intentionally straighter axial form.

These changed cells are not mere visual hatching. The blueprint, topology and regenerated editable vectors share the same definitions.

### 2. Independent bedrock-web diagnostic

[cave-rock-ribs.js](../cave-rock-ribs.js) traces consecutive *uncarved* plan cells between two independently modeled dry corridors. It refuses to start in a floor, to use wet or elevated flanks, or to certify less than the expected number of solid cells. The [report](../reports/cave-rock-ribs.json) intentionally distinguishes **horizontal-plan rock thickness** from roof thickness, vault clearances and load-bearing strength.

Thin, single-cell limestone partitions elsewhere remain in the report as **2.5-foot unresolved design limitations**; the verifier does not quietly inflate or approve them.

### 3. Editable registered interpretive architectural plate

[Basalt Rift bedrock plate](../examples/basalt_rift_webs.svg) nests the canonical vector tile with two exact horizontal cut traces and two distinct labeled rock-web diagrams. Each of the two center bands is data-derived and five feet wide in plan. The vaulted passage strokes are intentionally dashed and **not vertically scaled**. The diagram cannot claim measured ceiling height, wall thickness out of plane or structural capacity. Changing the rock-web plan invalidates its registration and fails the associated tests.

## Verification

Run:

    python3 validate.py
    PYTHONPATH=. python3 -m unittest discover -s tests -p 'test_*.py'
    node --test tests/*.test.js
    node render.js
    node cave-rock-ribs.js reports/cave-rock-ribs.json
    node basalt-web-plate.js examples/basalt_rift_webs.svg

The validation workflow regenerates all maps, new reports and the section plate, checks vector syntax, commits reproducible masters on branch pushes, and checks the branch's generated files against source. A physical paper proof and real tabletop route tests are still needed.

## Remaining limitations and next research

1. **True rock support:** The five-foot width is a **horizontal plan distance** only. Actual lava-tube roof thickness, arch stability, fractures, rock mass quality, and headroom are unknown. Obtain one published measured floor-plan-plus-vertical-section pair from a real basalt lava tube and compare *qualitative morphology*, not dimensions copied without context.
2. **Hydrology and passage gradients:** The plan portrays some dry upper routes, but there are no authentic elevation readings or walking-gradient calculations. These need defensible scenarios and clearly separated assumptions.
3. **Mixed assemblies and print scale:** Existing two-square modular openings are not present. Current immutable openings are one 2.5-foot half-cell wide; research and prototype a **separate incompatible wider-mouth standard**, rather than claiming the narrow legacy standard is universally suitable. Actual-size print scrutiny and playtest data have not been collected.

**Status:** Improved, reproducible, provisional original dungeon studies. Not finished or structurally verified.
