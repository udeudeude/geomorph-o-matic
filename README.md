# Geomorph-o-matic

## Plan-registered wide-cave entrance crown transitions (November 20, 2026)

The three [wide-mouth cave masters](studies/) now include separately editable contours for a *hypothetical* entry-to-vault roof transition. Each modular opening preserves a 6.5-foot local crown for the full five-foot inward envelope, before the ceiling assumption rises in bounded half-foot increments into the taller Braided Lava and Split-Spine vaults. The much lower authored roof pinch points are deliberately retained. A [route-unfolded, scale-consistent vector profile](studies/wide_roof_transitions.svg) and [underlying station/height report](reports/wide-roof-transitions.json) follow real walkable passages, not invented straight section cuts.

[Primary cave-survey research, modeling decisions, and open geological objections](research/2026-11-20-wide-roof-entrance-transitions.md). Regenerate with `node wide-roof-transitions.js`; separate JavaScript and independent Python regression tests check height changes and occupied-floor paths. **These are unsurveyed local clearances, not actual roof elevations or stability claims.** Physical inspection and the Sheetflow bench's absolute vertical datum remain unresolved.


Original, modular, editable dungeon cartography. **Architectural studies, not yet a finished collection.**

## Wide cave raised-bench grade and assembled headroom review (November 20, 2026)

The [Sagging Sheetflow datum plate](studies/sheetflow_bench_grade.svg) now registers its eight genuinely raised plan cells and three real access edges. A new [design-envelope report](reports/sheetflow-bench-grade.json) compares hypothetical 0.25-, 0.5-, 1- and 2-foot raises over each 2.5-foot access edge (10%, 20%, 40% and 80% grade), flagging why the taller choices cannot responsibly be treated as ordinary short ramps. The prior 6.5-foot local headroom is **not** silently converted into an absolute roof elevation.

The new [assembly-wide posture report](reports/wide-posture-assembly.json) audits actual navigable standing, crouching and crawling routes across the four rotated wide-mouth caves and all 32 external entrance cells, including whole-seam closures. See [field research, explicitly hypothetical sections and unresolved architectural decisions](research/2026-11-20-bench-datum-posture-assembly.md). These are engineering diagnostics and editable vector studies, **not** measured caves or release-ready maps.

Regenerate with `node wide-vertical-datum.js && node wide-posture-assembly.js`. Tests: `node --test tests/wide-vertical-datum.test.js` and `PYTHONPATH=. python3 -m unittest discover -s tests -p 'test_bench_datum.py'`.

## Browse the editable vector dungeon studies

- [Cloister of Salt](tiles/salt_cloister.svg): enclosed processional circuit around a brine pool, a locked reliquary, and a hidden chapel.
- [Postern Bastion](tiles/postern_bastion.svg): defensive passageways, alternate routes, gate control, magazine and barracks.
- [Bone Galleries](tiles/bone_galleries.svg): two approaches to a royal sepulcher, ossuary galleries, a concealed tomb entrance.
- [Basalt Rift](tiles/basalt_rift.svg): seven irregular cavern chambers and natural rock contours.
- [Sunken Orrery](tiles/sunken_orrery.svg): a ruined observatory court with two guarded approaches.
- [Riftwater Lock](tiles/riftwater_lock.svg): partitioned subterranean sluice basin with three independently consequential shutters, separate crossing routes, and sealed discoveries.
- [Lantern Sink](tiles/lantern_sink.svg): a drowned limestone collapse beneath an abandoned pilgrim landing, with two dry perimeter routes, a raised rock bench with three registered ramps, a western choke producing a 12-half-cell detour and two optional discoveries. [Mixed assembly](examples/assembly_lantern_2x2.svg) · [print proof](examples/lantern_sink_print_letter.svg).
- [Scoured Siphon](tiles/scoured_siphon.svg): an original joint-guided cave with a submerged gorge, two separately traversable ascents to a limestone shelf, and a truly blocked western throat. [Mixed assembly](examples/assembly_scoured_2x2.svg) · [true-size print proof](examples/scoured_siphon_print_letter.svg).
- [Hollow Causeway](tiles/hollow_causeway.svg): an original solution-cave study with open natural throats, two distinct dry crossings of a flooded limestone fissure, and an optional concealed pocket. [Mixed four-morph assembly](examples/assembly_hollow_2x2.svg) · [true-size print proof](examples/hollow_causeway_print_letter.svg).
- [The Fallen Choir](tiles/fallen_choir.svg): a hand-composed ruined abbey with an irregular four-door bell nave, alternative ambulatories, a sealed vestry and optional discoveries. [Mixed four-tile composition](examples/assembly_fallen_choir_2x2.svg) · [true-size print sheet](examples/fallen_choir_print_letter.svg).

These are editable vector drawings, not flattened images. The separate floor, grid, rock, doors, structural walls and architectural features are grouped in the SVG document.

## Actual separate 5-foot entrance study: Braided Lava Confluence (November 20, 2026)

[The Braided Lava Confluence](studies/braided_lava.svg) is the first individually authored **wide-mouth** (5-foot clear) cave prototype. It is deliberately separate from the ten legacy masters: five irregular cave chambers, 28 passage runs, eight authentic double-width mouths and a fully blocked two-lane lava-collapse edge. Its western route changes from **22 to 30 half-cell steps** because of actual blocked floor connections. Both the cave and its seams remain valid through all rotations.

Inspect the [four-orientation assembly](studies/braided_lava_2x2.svg), [100% size print proof](studies/braided_lava_print_letter.svg), [reproducible route report](reports/wide-lava-routes.json), and [geological source research plus shortcomings](research/2026-11-20-braided-wide-lava.md). The demonstration repeats one prototype four times; it is not a diverse four-cave set. Its roofs, stability, and paper legibility remain unverified. **Not a finished dungeon.**

### Contrasting sheet-flow wide-mouth cave (November 20, 2026)

[The Sagging Sheetflow](studies/sagging_sheet.svg) is a **second individually authored** five-foot-mouth study with six asymmetric volcanic vesicle chambers, 18 natural thresholds, a drained central basin, and a raised eight-cell basalt bench with three modeled traversable approaches. A real two-lane roof fall forces a northern traversal from **17 to 31 half-cell steps** without stranding any of its 238 walkable cells. This contrasts with Braided Lava's braided feeder geometry rather than merely repeating it.

Examine the [mixed two-design four-tile assembly](studies/wide_mixed_2x2.svg), the [true-size sheetflow print proof](studies/sagging_sheet_print_letter.svg), the [independent route and elevation report](reports/sheetflow-routes.json), and the [published geological research and explicit design limitations](research/2026-11-20-sagging-sheetflow.md). The assembly **reuses two distinct designs**, not four. Modeled elevation indices are not measured heights; roof clearance, actual print quality and playtesting are still outstanding. **Neither map is finished.**

### Third wide-mouth cave: Split-Spine Drainback (November 20, 2026)

[The Split-Spine Drainback](studies/split_spine.svg) adds a third **original** five-foot-mouth cavern, with four irregular chambers, a genuine solid-rock axial septum, twin bypasses and eight natural chamber thresholds. Its three blocked west-branch roof-fall edges lengthen a particular dry passage from **22 to 34 half-cell steps** without leaving any of its **223** occupied floor cells or sixteen external throat cells inaccessible.

The [three-design rotated assembly](studies/three_wide_2x2.svg) includes Braided Lava, Sagging Sheetflow and Split-Spine twice. Unlike a simple drawing-seam test, the new [inter-tile route audit](reports/wide-assembly-routes.json) reconstructs ordinary dry walking routes in every rotated module, validates all traversable crossing edges, and checks alternate circuits after entire joining seams close. Inspect the [true-scale print proof](studies/split_spine_print_letter.svg), [independent blocked-route measurements](reports/spine-routes.json) and [geological research and critical limitations](research/2026-11-20-split-spine-three-wide.md).

**Still an architectural study.** Half-cell dimensions are fictional plan measurements; cave headroom, roof stability, gradients, printed legibility and human tabletop playability have not been established.

Regenerate with `node wide-cave.js && node wide-assembly-audit.js`; test with `node --test tests/*.test.js` and `PYTHONPATH=. python3 -m unittest discover -s tests -p 'test_*.py'`. Legacy 2.5-foot and wide 5-foot tiles deliberately cannot be assembled together.



## Cave design envelopes and independent wide openings (November 20, 2026)

The [new cave cross-section plate](examples/cave_section_envelopes.svg) derives four **actual transverse floor widths** (7.5, 5, 2.5, and 5 feet) from Scoured Siphon, Basalt Rift, and Lantern Sink. The hypothetical roof heights are individually authored, **not measured**, and registered to those exact floor cuts. Any altered width or misplaced section fails the [envelope audit](reports/cave-section-envelopes.json) and independent tests.

A new [modular seam contract](seam-profiles.js) verifies the existing eight 2.5-foot mouths and separately tests a **5-foot-mouth interface with two full-width occupied cells extending inward**. The [compatibility report](reports/seam-families.json) explicitly treats the two families as incompatible. The synthetic **interface-only** fixture remains as a regression test; the separately authored Braided Lava Confluence is now a real, though unfinished, wide-mouth prototype. [Design research and limitations](research/2026-11-20-cave-seam-envelopes.md). These experiments do not make the collection release-ready.

## Basalt rock-web integrity and interpretive sections (November 20, 2026)

[Basalt Rift](tiles/basalt_rift.svg) now bends two upper distributaries around **genuine 5-foot-wide rock bands in the fictional plan**, each doubled from the previous 2.5 feet. The editable [rock-web study plate](examples/basalt_rift_webs.svg) registers two horizontal transects to the source plan; dashed vault shapes are explicitly *not* measured sections. A new [rock separation audit](reports/cave-rock-ribs.json) confirms the solid cells remain between dry routes and flags remaining thin cave partitions without claiming structural bearing or measured headroom. [Geological research, rationale, and unresolved constraints](research/2026-11-20-basalt-rock-webs.md).

## Limestone ribs and basalt splays (November 19, 2026)

[Hollow Causeway](tiles/hollow_causeway.svg) now makes an actual narrow eastern dogleg around intact limestone instead of presenting a 32.5-foot straight shaft. [Basalt Rift](tiles/basalt_rift.svg) now has two branching upper passages and a southern spur bypass, preserving a geologically intentional main lava tube. The maximum straight hall strips are **20 feet** and **25 feet**, respectively, down from **32.5 feet** and **30 feet**. Five new [floor-plan clearance sections](reports/cave-passage-widths.json) measure actual half-cell throats, while route and rotation tests guard connectivity and editable map regeneration. [Research and unresolved physical constraints](research/2026-11-19-karst-bends-and-basalt-splays.md). **These are provisional drawings, not surveyed caves.**

## Joint-guided passage revisions and axial-corridor audit (November 19, 2026)

Scoured Siphon's two southern approaches and Lantern Sink's northwest/southwest entries now use authored lateral doglegs, protecting their actual dry connections, bridge, collapses, three rock-bench ramps and unchanged rotation-compatible mouths. The independent [cave axial-strip diagnostic](cave-axes.js) and [generated report](reports/cave-axes.json) expose still-straight hall runs rather than masking them under curved lines. [Research, decisions and limitations](research/2026-11-19-cave-axis-composition.md). All work remains provisional.

## Plan-width reconstruction: cave approaches (November 19, 2026)

[Scoured Siphon](tiles/scoured_siphon.svg) and [Lantern Sink](tiles/lantern_sink.svg) now have **19 additional authored floor cells** across asymmetric dry approaches, erosion pockets, and widened channel remnants, rather than merely smoothing rectangular walls. The existing eight 2.5-foot exterior throats, water crossings and blocked passages stay unchanged.

[Measured floor-plan sections](reports/cave-passage-widths.json) record real 5- to 7.5-foot internal clearances at named transverse cuts, **not** invented survey-grade ceiling dimensions. [Research and limitations](research/2026-11-19-cave-passage-widths.md). Run `node cave-passage-widths.js` to regenerate the plan-only audit; the continuous verification workflow checks the results. These drawings remain provisional until print inspection and playtesting.

## Cave-ink correction and true-scale warning (November 19, 2026)

The natural-cave renderer now places rock-facing etching **on the actual curved wall**, rather than along an invisible square-cell boundary. The same cubic geometry drives wall outlines and hachure starts, with separate editable layers and new geometric regression tests. Hollow Causeway has been reshaped in five chamber footprints (nine real additional walkable cells) while retaining its bridge, elevated stone traverse, impassable choke and all eight rotation-compatible edge mouths.

**Scale correction:** Each standard half-cell entrance is **2.5 feet clear**, not 5 feet. It occupies one half of a printed 5-foot square, or 6.35 millimetres at the standard print scale. Print proofs now disclose this explicitly. [Editable revised Hollow Causeway](tiles/hollow_causeway.svg) · [true-size proof](examples/hollow_causeway_print_letter.svg) · [research, critique and unresolved dimensional issues](research/2026-11-19-curve-registered-cave-ink.md). These studies still need physical inspection and playtesting.

## The Lantern Sink (November 19, 2026)

A newly composed limestone-and-pilgrimage ruin geomorph centers on a broad drowned sink. The crossing is physically represented by two bridged water cells; an eastern rock terrace has three registered access ramps, while a blocked western cleft increases the selected dry portal journey from 23 to 35 half-cells. All eight edge mouths survive rotation, and two secret chambers are optional discoveries. Examine the [editable map](tiles/lantern_sink.svg), [mixed assembly](examples/assembly_lantern_2x2.svg), [letter-size print proof](examples/lantern_sink_print_letter.svg) and [research and limitations](research/2026-11-19-lantern-sink.md). Not a finished or surveyed dungeon.

## Passage profiles: verify the cave's third dimension (November 19, 2026)

The [Scoured Siphon section plate](examples/scoured_siphon_profiles.svg) pairs the canonical modular plan with **two explicitly located, editable passage profiles**: one through the actual flooded plank crossing, and one along the elevated gallery and its descending ramp. The [generator](cave-profile.js) samples the real authored walkable floor, wet cells, bridge and ramp, rejecting sections that no longer match the dungeon. Read the [cave-survey research and measurement caveats](research/2026-11-19-cave-profile-registration.md). Roof contours and water depths are interpretive, not surveyed. The full collection remains unfinished.

Regenerate with `node cave-profile.js examples/scoured_siphon_profiles.svg`; verify with `node --test tests/cave-profile.test.js` and the independent Python suite.

## Scoured Siphon: dry keyhole and wet canyon (November 19, 2026)

Original unequal limestone chambers and the meeting of two underground watercourses. The collapsed western throat demonstrably lengthens a dry portal route, while a short timber bridge and a twice-accessible raised limestone shelf create different exploration opportunities. See [the main SVG](tiles/scoured_siphon.svg), [mixed four-tile assembly](examples/assembly_scoured_2x2.svg), [true-size print proof](examples/scoured_siphon_print_letter.svg), and [research and unresolved structural questions](research/2026-11-19-scoured-siphon.md). The study has not been physically printed or playtested.

## Natural cave geomorph: Hollow Causeway (November 19, 2026)

The eighth original study moves away from repetitive right-angle masonry. Six hand-shaped
limestone chambers connect through ten **unframed natural throats**, without drawing
imaginary hinged doors. The ordinary dry route across the flooded rift uses a narrow
plank bridge, while a distinct upper rock traverse supplies a tested ladder-accessible
alternative. A newly mapped breakdown choke now physically blocks one western
cleft edge, forcing a substantial detour rather than merely adding decoration.
All eight conventional edge mouths remain rotation-compatible. A single sealed
discovery is explicitly drawn, rather than turning every cave threshold into a door.

The cave's water is rendered as continuous, curved shorelines from the canonical
wet-cell union (not blue grid rectangles). Its twelve authored dry-floor deposit
symbols distinguish loose breakdown, flowstone, gravel and erosion scallops.
Unlike the blocked choke edge, those deposits do not alter movement; their
positions are checked independently in JavaScript and Python. The symbol
vocabulary is documented in [cave cartography and geology research](research/2026-11-19-cave-relief-and-shorelines.md).

Inspect the [editable cave SVG](tiles/hollow_causeway.svg),
[mixed architectural assembly](examples/assembly_hollow_2x2.svg),
[letter-size physical proof](examples/hollow_causeway_print_letter.svg), and
[design sources and unresolved geology](research/2026-11-19-hollow-causeway.md).
None has yet passed human print review or tabletop playtesting.

Regenerate with `node render.js && node assemble.js examples/assembly_hollow_2x2.json
examples/assembly_hollow_2x2.svg`, and test with `node --test
tests/hollow-causeway.test.js` and `PYTHONPATH=. python3 -m unittest
tests.test_hollow_causeway`.

## Collapsed Choir arcade and playable triforium (November 19, 2026)

The Fallen Choir now has **five impassable broken-arcade edges**, not merely decorative rubble. A four-cell raised triforium provides a true alternate passage between two separately marked ladders; the southern nave bay is the ground-level detour. The western ambulatory has also been re-composed to break its original straight run.

- [Two-level comparative vector survey](examples/fallen_choir_levels.svg)
- [Revised primary map](tiles/fallen_choir.svg) and [actual-size print proof](examples/fallen_choir_print_letter.svg)
- [Source and architectural caveats](research/2026-11-19-fallen-choir-upper-gallery.md)

The new broken-masonry edges share canonical blocked navigation data with the printed symbol. The vertical validator also rejects elevated decks that silently pass through different rooms without a modeled upper doorway. Height, headroom and stability remain provisional. **This is a spatial design iteration, not a certified finished map.**

Regenerate with `node render.js && node choir-levels-plate.js`; check `node --test tests/choir-collapse.test.js` and `PYTHONPATH=. python3 -m unittest tests.test_choir_ruins`.

## Cartographic reset: priority on imaginative dungeon architecture

The new [Fallen Choir](tiles/fallen_choir.svg) deliberately redirects development from machinery modeling to compositional strength: a distinctive bell landmark, a direct four-door crossing, secret discoveries that do not isolate the ordinary network, and fine etching **outside** stone walls. The new [masonry hatch generator](ink-hatching.js) is independent of floor geometry and retains editable vector layers. See the [research, references, tests and admitted design weaknesses](research/2026-11-19-ink-cartography-reset.md). The [curated assembly](examples/assembly_fallen_choir_2x2.svg) and [letter print proof](examples/fallen_choir_print_letter.svg) are for inspection; physical print review is not complete.

## Build locally

Requirements: Python 3 and Node.js. No third-party packages.

```sh
python3 validate.py
PYTHONPATH=. python3 -m unittest discover -s tests -p 'test_*.py'
node --test tests/*.test.js
node render.js
git diff --exit-code -- tiles/
```

The canonical architectural data is in [blueprints.json](blueprints.json). The [JavaScript renderer](render.js) creates the ten SVG masters reproducibly, and [validate.py](validate.py) rejects incompatible edge openings, invented doorways, unconnected halls and disconnected floors. [GitHub Actions](.github/workflows/validate.yml) checks these commands after pushes.

## Geometry

Each morph covers **10 x 10 full squares** subdivided into 20 x 20 half-square cells. A 2.5-foot-wide opening occupies one half-cell inside the 3rd and 8th full squares on each side. The exact fine-grid opening positions are **4 and 15**; unlike the earlier 5/15 pair they remain aligned through all quarter-turn rotations.

All ten studies have eight standard edge openings and individually authored rooms and passages. Doors, natural openings, secret discoveries and locks vary between settings. Corridor loops are diagnostic, not proof of meaningful alternatives; see the separate route-resilience and chamber-journey audits.

## Two-level waterworks study (November 19, 2026)

Riftwater Lock's three independently shut upper sumps now drop into a separate
**ordered, lower-level collection race**. Its sixteen half-cell stations are
connected by a directed drain path, with one distinct drop shaft per shutter.
The lower collector now reaches an **exact special subfloor seam** into Postern
Bastion. The Postern receiving relay reaches a mapped eastern lower-level outfall lip;
its exterior receiving channel and discharge capacity remain uncharted.
Assumed invert heights are checked against a tailwater envelope, **not**
surveyed or calculated flow physics.

- [Two-plan lower-race technical plate](examples/riftwater_tailrace_plate.svg):
  separately editable upper and lower hydraulic vectors, exact plan coordinates,
  three drop shafts, directional arrows, and an explicitly unmapped terminus.
- [Canonical lower-tailrace model](tailrace.js):
  verifies contiguous path, unique downstream pickups and closed-gate isolation.
- [Historic evidence and unresolved structural dimensions](research/2026-11-19-underfloor-tailrace.md):
  real winch/penstock precedents, missing invert elevations and vault foundations.

The main [Riftwater Lock SVG](tiles/riftwater_lock.svg) displays only drop symbols,
not a misleading surface tunnel. The existing standard eight exits are unchanged.

## Specialized graded subfloor assembly (November 19, 2026)

- [Paired lower-level technical survey](examples/subfloor_pair_plate.svg): buried
  paths, exact specialized seam and assumed invert profile, with upper structural
  footprints in faint context. The **outfall lip is mapped**, but the receiving
  watercourse beyond the eastern boundary remains uncharted.
- [Source and relay example](examples/subfloor_pair.json): Riftwater Lock directly
  north of Postern Bastion, unrotated. Surface portals and the specialist lower
  connection are audited independently.
- [Grade-envelope validator](drainage-grade.js), [rotatable specialist seam
  checker](subfloor-interfaces.js), and [engineering research and assumptions](research/2026-11-19-graded-subfloor-interface.md).

```sh
node subfloor-assembly-plate.js examples/subfloor_pair_plate.svg
node --test tests/subfloor-interfaces.test.js
```

The rerouted source collector now falls 0.75 feet over 37.5 feet, then another 0.05 feet
across the seam, under **explicitly assumed** datum and backwater constraints.
It does not prove the free-fall shaft stays vented under actual flood conditions.
The generic nine-tile compositions are surface-route studies, **not** verified
hydraulic assemblies.

## Foundation-aware buried route and profile (November 19, 2026)

The original straight lower collector crossed the pressure-vault footprint.
The new conduit turns west before the vault, reaching the specialized south
seam at **(6,19)**; the Postern receiver enters at **(6,0)**, turns east north
of the toll chamber, and turns east to an exterior masonry lip at **(19,9)**.
The receiving channel beyond that lip is uncharted. These are **unwalkable
buried waterways**.

The [structural overlap audit](foundation-clearance.js) and independent Python
checks reject buried routes under occupied chamber footprints, except three
explicit engineered water-drop points beneath the turbine basin. Actual footing
depths, offsets and material strength are **unmeasured**. Adjacent room cells
therefore receive caution rings in the [technical drawing](examples/subfloor_pair_plate.svg),
not a fictitious clearance certificate. The repeatable [audit report](reports/buried-clearance.json)
records these warnings. [Engineering research and remaining blockers](research/2026-11-19-foundation-aware-drainage.md).

```sh
node foundation-clearance.js reports/buried-clearance.json
node subfloor-assembly-plate.js examples/subfloor_pair_plate.svg
node --test tests/foundation-clearance.test.js tests/subfloor-interfaces.test.js
```

## Maintenance architecture and sluice transmissions (November 19, 2026)

Riftwater now has **three separate modeled overhead shaft-and-rack transmissions** from
its existing dry handwheels to the three independent shutters. Six intentional
rock penetrations and six assumed bearings are validated, but **8-foot shaft
height and 1.5-inch shaft diameter are design assumptions**, not measurements.
Non-walkable mechanisms appear only on the new [editable technical plate](examples/riftwater_maintenance_plate.svg),
not as false walkable passages in the main map.

Both lower watercourses now have **five sealed cleanouts at every turn, including the wet turbine pickup elbow**.
The turbine pickup elbow and crowded Riftwater gallery each require a 7.5-foot buried inspection spur. The latter
to place one dry hatch clear of the center winch. Postern gains a real one-cell
corridor niche to reach its previously inaccessible buried cleanout. These are
**bolted covers, not traversable shafts**. The [design record](research/2026-11-19-mechanical-access.md)
cites historic three-gate rack drives and actual mill penstock inspection work.

```sh
node maintenance-plate.js examples/riftwater_maintenance_plate.svg
node --test tests/maintenance-works.test.js
PYTHONPATH=. python3 -m unittest tests.test_maintenance_validation
```

## Right-angle gearing and serviceability study (November 19, 2026)

Five 90-degree shaft corners previously lacked a mechanism to redirect rotation.
They now have explicit **bevel-gear housings**, with access panels facing actual
dry galleries. The three drives have 1, 2 and 2 gearboxes. Two require locked-out
operating handwheels for inspection; two share a tight service landing. The
model records unresolved rock pockets and wet proximity without claiming that
the gearbox dimensions, torque or overhead access are feasible.

- [Editable geared service engineering plate](examples/riftwater_maintenance_plate.svg)
- [Gearbox access and risk screen](reports/gearbox-access.json)
- [Historic evidence and engineering limitations](research/2026-11-19-geared-corner-access.md)

```sh
node gearbox-audit.js reports/gearbox-access.json
node --test tests/gearbox-audit.test.js tests/maintenance-works.test.js
```

## Next major work

1. Research and dimension actual historic gear trains, shaft torque, bearing supports, sleeves, lower cleanout depth and the pressure vault's foundations before claiming working machinery.
2. Research and map the receiving watercourse beyond Postern's modeled outlet lip, then verify water levels, capacity and backwater. The detour eliminates direct room-footprint clashes, not unknown footing and crown clearances.
3. Critically review nine-tile map assemblies and the two-level technical plate at print size, correcting visual hierarchy and architecture rather than adding generic furniture.
4. Add edge/corner interface masks and test matched surface and lower-level openings through rotated assemblies, then playtest meaningful gate-operation choices.

Research comparisons and design decisions: [design notes](research/design-notes.md).

## Assemble and inspect larger dungeons

```sh
node assemble.js examples/assembly_3x3.json examples/assembly_3x3.svg
node audit.js
node --test tests/*.test.js
```

The [nine-tile original survey](examples/assembly_3x3.svg) is a single standalone editable SVG. Its clipping identifiers are unique across repeated tiles. Every quarter-turn seam is checked against its actual edge-floor cells, not merely an assumed portal convention. The [circulation audit](reports/topology.json) distinguishes freely accessible floor, secret-only discoveries, corridor cycles, and exit-separating choke cells.

These audits do not establish artistic excellence; use them to identify where to improve the underlying architecture. [Design criteria](research/2026-11-18-architecture-audit.md).

## New irregular-footprint studies (November 2026)
Three additional source blueprints are now encoded in [blueprints.json](blueprints.json): **The Basalt Rift** (seven chambers, including naturalistic lobes and two bypasses) and **The Sunken Orrery** (five chambers, an octagonal central court and surrounding service ring), and **The Riftwater Lock** (seven irregular floodwork chambers and an asymmetrical inspection network). [geometry.js](geometry.js) adds validated row-run room footprints shared by rendering, assembly and the audit. These remain **studies**, not finished tiles. Run `node render.js` to regenerate their SVG masters locally; CI also publishes both in the `irregular-vector-studies` artifact. See [research note](research/2026-11-18-irregular-chambers.md) and [new tests](tests/irregular.test.js).


## Research-backed cave cartography and honest loop metrics

The Basalt Rift now requests smoothly rounded, joined cave-facing wall contours with outwards-facing rock hachures; its underlying walkable cells and the eight rotation-invariant portals stay unchanged. Render with `node render.js`. New vector layers include `cavern-walls` and `rock-hachures`.

The topology audit now separately records `substantial_hall_circuits` (large fully encircled barriers or rooms), avoiding the misleading claim that every 2-by-2 hallway grid face constitutes a meaningful alternate route. The old `hall_cycle_rank` remains for comparison but is **not** a measure of real navigational choices. These new metrics are deliberately conservative. [Research and validation criteria](research/2026-11-18-cave-cartography-topology.md).

## Functional route quality and bounded organic contours

[route-analysis.js](route-analysis.js) now records portal-to-portal travel under ordinary, unlocked and secret-door access, then measures which chambers actually provide useful shortest-path bypasses. This is deliberately stricter than counting grid faces or simply counting doors. The new [Riftwater Lock](tiles/riftwater_lock.svg) passes all portal and walkability validations; it remains a design study.

The cavern rendering now uses reproducible, bounded cubic contours with tile-boundary coordinates fixed exactly. As before, the SVG geometry is visual presentation layered over canonical traversable cells, not an independent freeform navigation mesh. Read the [floodworks research and current limitations](research/2026-11-18-floodworks-room-routes.md) before treating this collection as finished.


## Environmental geometry and meaningful reroutes (November 2026)

The [terrain model](terrain.js) adds canonical water cells, dry bridge cells, signed elevation levels and explicit ramps. Unlike the original decorative pool/stair symbols, these affect traversal. An explorer on foot cannot walk through submerged cells except on bridge spans, and adjacent levels require an authored ramp. Wading access is audited independently of ordinary dry traversal. The [Python validator](validate.py) and [independent Python tests](tests/test_terrain_validation.py) verify bridge/elevation geometry, in addition to the renderer's JavaScript contract tests.

[Riftwater Lock](tiles/riftwater_lock.svg) is the first worked example: six wet cells, a two-cell continuous footbridge, a twelve-cell raised archive and one level transition. Its editable vector output separates water, bridge planking, elevation markers and stairs from the rock and floor drawing. No new tile-border connection is altered.

The [resilience analyzer](route-resilience.js) tests substantial geographic detours after a sampled corridor obstruction. It requires the replacement journey to diverge at least three cells from the original for at least three cells. Outputs are tracked by ordinary, unlocked and all-door policies and use the same dry-terrain graph as the chamber audit. This is a conservative diagnostic, not an assertion that every route has been playtested. Read the [research and limitations](research/2026-11-18-terrain-resilience.md).

The [automated build](.github/workflows/validate.yml) validates both languages, regenerates the complete vector collection and assembled surveys, and publishes the studies as a downloadable workflow artifact. On main-branch builds, verified generated SVG masters and topology reports are synchronized into the repository if they changed.

## Truly overlapping architectural levels

The [stacked-floor engine](vertical.js) distinguishes actual upper decks from elevation labels on the lower floor. Each `vertical.decks` surface is a connected grid footprint at an explicit integer level. Each `vertical.links` entry locates a stair or ladder connecting two existing levels at the **same plan coordinate**. Level-specific nodes allow a path above a submerged cell without turning that submerged cell into dry ground. Connections and edge constraints are checked in both JavaScript and Python.

[The Riftwater Lock](tiles/riftwater_lock.svg) now has a suspended turbine gantry spanning five cells above its partially submerged machine hall. Two additional service doors and two ladders reach that overhead route, while the existing north-south footbridge remains an independent lower crossing. Its separate editable layers are `overhead-decks`, `deck-parapets`, and `vertical-connections`. The architectural audit reports deck reachability and the effect on portal routes.

This is not a complete multi-level presentation system: small print requires dedicated profile drawings and lower/upper plan variants. [Research, implementation and remaining problems](research/2026-11-18-overlapping-floors.md).

## Two-level architectural drawings and rising-water scenarios

The [section-plates.js](section-plates.js) generator produces an independently editable companion sheet with a lower plan, a distinct overhead-deck plan, and an east-west sectional cut through the turbine machinery. The plate explicitly marks its schematic vertical spacing rather than implying measured clearance:

```sh
node section-plates.js examples/riftwater_section.svg
```

The [flood-stages.js](flood-stages.js) engine audits ordered, cumulative, hydraulically connected floor inundation masks. Its canonical terrain graphs measure how dry access changes; the authored **surge** scenario in Riftwater Lock covers three additional turbine-floor cells without changing the eight interface portals:

```sh
node flood-stages.js examples/riftwater_surge.svg
```

Both vector studies are published by the validation workflow. The [research and implementation limits](research/2026-11-19-sections-flood-stages.md) distinguish these deliberately authored scenarios from physical fluid simulation and identify print-scale work remaining.

## Controlled sluices, multi-level profiles, and true-size print proofs

The new [hydraulic-control.js](hydraulic-control.js) validates watertight sluices on real interior connections. A flood scenario may optionally specify `hydrology.gates`, `stage.gate_states` and `stage.surface_level` to test whether its authored inundation can travel across open gates and overtop floor heights. This is a scenario validator, **not** a pressure- or time-based fluid simulator.

[measured-section.js](measured-section.js) exports an editable [longitudinal profile](examples/riftwater_profile.svg) that supports both negative elevations and stacked positive levels. Horizontal distance is based on 2.5 feet per half-cell; vertical distance is proportional to the explicitly **assumed** 10 feet per floor level. It does not invent ceiling or water depths.

[print-review.js](print-review.js) generates a [US Letter vector proof](examples/riftwater_print_letter.svg) at 1/2 inch per standard five-foot square and the [print-scale inspection report](reports/print-scale.json) for all tile masters. Print the sheet at 100% actual size; not fit-to-page. Readability warnings are measurements, not proof of legibility. [Research and limitations](research/2026-11-19-controlled-hydraulics-print.md).

```sh
node measured-section.js examples/riftwater_profile.svg
node print-review.js examples/riftwater_print_letter.svg
node --test tests/*.test.js
```


## Working sluice bank and legible grid (19 November 2026)

The Riftwater Lock has three individually controlled shutters across a 7.5-foot sluice basin. Its original surge design used one raised shutter to flood an undivided receiving pool; that arrangement has since been replaced with three masonry-separated receiving compartments and progressive releases. Normal and surge SVG drawings show their actual hydraulic states. This is an authored **connectivity scenario**, not a calibrated flow simulation.

All vector masters now show only the standard five-foot grid by default, avoiding the very thin 2.5-foot construction lines on half-inch print proofs. The finer grid remains an optional drafting mode. See [research and open engineering questions](research/2026-11-19-sluice-bank-cartography.md).

## Bounded hydraulic architecture and accessible sluice controls (19 November 2026)

Riftwater Lock's nine-cell turbine race is now an **explicit engineered waterway**, not a subset of every traversable pedestrian corridor. The flood engine uses a separate hydraulic connectivity graph; water cannot enter other rooms through ordinary doors or leak across masonry boundaries without a deliberately authored culvert. A three-shutter bank divides six normally submerged cells from three downstream surge cells, and the source and receiving outfall are labeled as **off-sheet continuations**, not invented surveyed passages.

The south service gallery has three individually assigned handwheel stations. Their accessibility is measured against the dry navigation graph throughout the staged releases. The editable SVG includes separately grouped canal-bank masonry, hydraulic terminals, and operating wheels, plus the previously authored shutters and bridge. The Python blueprint validator independently checks the same architectural boundaries, and adversarial tests reject invalid leakage, controls and cross-wall connections.

This remains a small functional **map study**, not a complete power facility: an actual headrace, separate turbine pit, penstock, discharge culvert, hydraulic gradient, operating transmissions, and calibrated gate heights have not yet been designed. See [engineering research and design constraints](research/2026-11-19-bounded-waterworks-architecture.md). Inspect the [Riftwater Lock vector master](tiles/riftwater_lock.svg) and [surge study](examples/riftwater_surge.svg) at full size before evaluating their architectural legibility.


## Exterior outfall lip and high-water scenarios (19 November 2026)

Postern Bastion now has a two-foot nominal masonry outlet at its **east level -1
boundary (19,9)**. The routed receiver has 23 stations, an added dry-gallery
cleanout, and a provisional 1.10-foot total grade drop. Its discharge exits the
visible tile, but the receiving watercourse remains unmapped. The
[outfall plan and sectional SVG](examples/postern_outfall_section.svg) distinguishes
ordinary water from a high-water case that drowns the modeled crown. In a
hydraulic assembly the outlet must face an exterior boundary, never an
arbitrary adjoining tile. This is a high-water *risk flag*, not calculated flow
or proof that the turbine remains vented. [Evidence and limitations](research/2026-11-19-outfall-backwater.md).

## Specialist receiving-ravine annex (November 19, 2026)

The [Receiving Ravine architectural annex](examples/receiving_annex_plate.svg) now
models the **first 50 feet of conceptual exterior watercourse** east of Postern
Bastion's masonry lip, as a deliberately non-interchangeable attachment. It is
**not** a seventh standard dungeon tile: it has a matched, rotatable **lower**
watercourse interface at W:9, but does not masquerade as a complete set of
pedestrian portals. A downstream river remains unmapped.

The [authored annex geometry](examples/receiving_annex.json) and
[interface/grade validator](receiving-annex.js) define an ordered falling bed,
stone-lined throat, widened flagstone apron, desilting pocket with a separate
dry inspection terrace, two-bank bridge approach, pocket cleanout steps and rough-stone receiving
reach. A [second, independent Python check](receiving_validation.py) catches
mismatched profiles, access routes and bank assumptions. The editable vector
drawing keeps rock contours, channel treatments, pedestrian approach, bridge,
water states and section elevations distinct.

The source lip descends by an **assumed 0.05 feet** into the annex, followed by
**0.95 feet over 47.5 feet** of conceptual receiving channel. High water still
submerges the upstream masonry crown. **No discharge, energy dissipation,
bank stability or scour sizing has been calculated**, and the actual stream
outside the annex has not been surveyed. See
[research and remaining tasks](research/2026-11-19-receiving-annex.md).

```sh
node receiving-annex-plate.js examples/receiving_annex_plate.svg
node --test tests/receiving-annex*.test.js
```

