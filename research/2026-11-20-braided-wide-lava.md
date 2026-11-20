# Braided Lava Confluence: architectural study and wide-mouth verification
November 20, 2026

## What research actually supports

- The National Park Service documents that lava tubes may divide into multiple passages, split between levels and feature abrupt drops: https://www.nps.gov/subjects/caves/lava-caves-or-tubes.htm . This permits a branching *design premise*, not a surveyed plan.
- A 2018 Geological Society of America presentation on laser scans of four Lava Beds caves describes 1–4 metre branching tubes which rejoin the trunk, lava benches and fallen roof blocks. https://gsa.confex.com/gsa/2018AM/webprogram/Paper322466.html . Our fictional branched layout explores this anastomosing morphology rather than adding decorative random bends.
- US Geological Survey descriptions of Lava Beds' tubes report dramatic changes in width, lava benches, uneven roofs and partitioned pools: https://npshistory.com/publications/geology/bul/1673/sec3.htm .
- The British Cave Research Association distinguishes measured survey lines from passage-detail classes A–D. None of this project's fictional outlines qualify as a cave survey. https://bcra.org.uk/surveying/
- Dyson Logos's 2022 cave geomorphs combine water, tiered caves and twisting passages, but their art is not copied. https://dysonlogos.blog/2022/02/28/2022-cave-lair-geomorphs-set-2/

## Authored structural layout

Braided Lava Confluence is an **actual distinct SVG-generating blueprint** in `wide-blueprints.json`, not the earlier synthetic cross-shaped seam fixture. Five irregular rooms, twenty-eight registered corridor runs and eight natural thresholds form a pair of distributaries around a central confluence. Two separate, **blocked** western gallery edges represent a roof-fall spanning both lanes. Walkable routes, not ink, determine the detour. The western rim-to-rim dry journey measures 22 half-cell steps without the collapse and 30 with it.

Each of the eight modular exits is **two 2.5-foot cells wide** and maintains that width for at least two inward cells. All four quarter-turns are independently checked. The system rejects joining a wide-mouth tile to a legacy tile, including if a future accidental mask match might otherwise occur. This is a separate modular family, not an upgrade of existing entrances.

The master `studies/braided_lava.svg` separates floor, curved cave walls, rock hachures, deposits and two blocked chokes in editable vector layers. The four-tile assembly `studies/braided_lava_2x2.svg` proves rotation-safe adjacency; its repeated source tile is *not* four individually designed caverns. A `studies/braided_lava_print_letter.svg` sheet labels the true 5-foot throat and is a **print proof**, not proof of legibility.

## Weaknesses that require next revisions

1. Branching layout is still noticeably bilateral and rectilinear, even though rock outlines are organically displaced; redraw selected distributary axes around credible basalt remnants rather than adding decorative noise.
2. Roof depth, ceiling profile, vault bearing, flow direction, vent chimney aperture and raised lava-bench height **have not been surveyed, dimensioned or verified**. The blocked roof fall is a game topology assumption, not a stability claim.
3. No real paper has been printed and examined; no tabletop group has evaluated navigation choices. Vector/XML and route checks cannot replace these reviews.
4. The 2x2 wide-family demonstration is deliberately repetitive. The next authored member must be *complementary*, with different routes and a measured-matched seam, before treating this family as a useful library.

Build locally: `node wide-cave.js`; verify with `node --test tests/wide-cave.test.js` and `PYTHONPATH=. python3 -m unittest tests.test_wide_cave`. Never mix legacy and wide mouths in an assembly.
