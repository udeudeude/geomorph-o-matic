# Riftwater Lock: bounded hydraulic architecture and operating gallery
19 November 2026

## Research and architectural requirements

1. The [National Park Service's Slater Mill Dam history](https://www.nps.gov/places/slater-mill-dam.htm) describes a supply diverted behind a dam and metered through a gate into a raceway. A flooded chamber alone does not establish a working power system. We should show intake, regulator, receiving basin, and the subsequent discharge as distinct structural elements.
2. The [National Park Service's Harpers Ferry tailrace survey](https://home.nps.gov/articles/harpers-ferry-tailrace.htm) records a hidden, branching underground tailrace and surviving structural wheel supports. Crucially, excavated underground drainage cannot be reconstructed solely by extrapolating a surface-plan opening. The current map therefore labels its intake and outfall as *off-sheet, uncharted continuations*, rather than inventing the missing passages.
3. [New Hall Mill's account of its operating penstock](https://www.newhallmill.uk/waterwheel/) documents internal control of a water supply and discharge through an under-building culvert. Separate operating stations along Riftwater's south gallery are a plausible schematic intervention, but the actual mechanical transmission path, gate lift clearance, and wheel size remain deliberately unmeasured.

## Implemented constraints

The canonical data now explicitly declares a **nine-half-cell engineered turbine channel**, with three wet upstream cells in each of two rows and three downstream cells that fill only in surge. The center sluice can admit water while the two flank shutters remain sealed. Water does **not** treat ordinary pedestrian passages or unlocked doors as hydraulic conduits. An adjacent occupied cell cannot carry the modeled flood unless it belongs to the authored channel.

The channel engine uses its own adjacency graph. Where a channel would cross a chamber boundary, a solid wall blocks it unless the author declares the exact **culvert edge**. Such culverts must be adjacent and must actually cut a masonry boundary. This distinction is architectural: ordinary room access and hydraulic permeability are different systems.

Three handwheels occupy dry cells in the south operating gallery. Each has an unambiguous shutter assignment, and an audit checks that they remain accessible from all eight standard dungeon portals in normal and surge states. Handwheel locations are play-relevant but **do not assert any particular underground shaft-routing mechanism**. The graphics use distinct editable groups for channel banks, intake/outfall tags, wheels, and shutter states.

## Plan dimensions and omissions

- Tile: 10 by 10 five-foot squares, represented as 20 by 20 half-square cells.
- Bank: three individually sealed 2.5-foot apertures, 7.5 feet overall.
- Authored channel: 3 by 3 half-square cells, 7.5 feet by 7.5 feet in plan.
- Lower footbridge and elevated gantry: unchanged and independent of the canal water graph.
- Upstream intake adit: represented by a keyed end marker, continuation **not surveyed or drawn**.
- Receiving sump/tailrace outfall: likewise keyed, continuation not surveyed or drawn.
- Vertical head, operating level, discharge, pressure, tailwater backflow, underground culvert slopes, outlet elevation, gate machinery clearances: **not modeled**.

The new system is a bounded *scenario and architecture consistency model*, not a physically calibrated watercourse. A complete headrace, overflow bypass, turbine housing and outfall still need a surveyed or explicitly fictionalized separate level and section drawing.

## Test and review criteria

Run `python3 validate.py`, the independent Python test suite, and `node --test tests/*.test.js`. Adversarial tests must reject duplicate or dry-hall channel cells, an outlet outside the channel, water leaking through walls without a declared culvert, and controls placed underwater or assigned ambiguously. The vector master must regenerate deterministically.

Inspect actual-size prints at the repository's 1/2-inch per five-foot-square scale. In particular, verify that canal stone edging does not obscure the bridge, that handwheels remain distinguishable from door symbols, and that the intake/outfall letters are not mistaken for doors. Automated line-weight screening is not a substitute for physical inspection.

## Next high-value design work

1. **Research and design the missing lower hydraulic section.** Use water-power archaeological surveys to distinguish a penstock, turbine or wheel chamber, bypass, tailrace, and hydraulic gradient rather than inventing water physics.
2. **Architectural iteration.** Rework the currently compact machine hall so gate access, masonry thickness, operating linkages, and overflows have plausible physical clearances. A cramped nine-cell basin is not a complete working mill.
3. **Map readability and modular play.** Verify 3-by-3 rotated assemblies at physical scale, then author deliberately constrained edge and corner connection families with inspectable compatibility masks.
