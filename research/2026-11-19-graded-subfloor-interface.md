# 2026-11-19 | Matched underfloor conduit and bounded grade assumptions

**Status: explicit design-study assumption, not dimensioned historic machinery or a calibrated flood model.** The central omission addressed here was geometric: Riftwater's lower collector stopped one half-cell short of a tile edge, while ordinary 5-foot surface portals were the only available modular connections.

## Research and architectural constraints

1. [National Park Service: Lowell waterpower](https://www.nps.gov/lowe/learn/historyculture/water-power-in-the-mills.htm) describes headwater falling into turbine pits and then transferring power to machinery through shafts and belts. This supports separating upstream impoundment, working machinery, and downstream races. Its documented **13-foot working head** is an example at a particular restored turbine, **not** a dimension borrowed for Riftwater.
2. [National Park Service: Harpers Ferry head gates and inner basin](https://www.nps.gov/places/000/head-gates-and-inner-basin.htm) documents gates feeding an impoundment that branched into water tunnels. Our three upper sluices are independent, not an arbitrary decorative bank, and their actual downstream continuation needs a distinct conduit level.
3. [National Park Service: Harpers Ferry Armory tailrace survey](https://home.nps.gov/articles/harpers-ferry-tailrace.htm) documents a surviving *Y-shaped* underground collection tunnel. This makes subfloor convergence a credible historical analogy, but **does not** establish this project's tunnel diameter, load-bearing vault foundation, or discharge capacity.
4. [National Park Service: Harpers Ferry water tunnels](https://www.nps.gov/places/000/water-tunnels.htm) notes underground waterways with differing upstream and downstream openings. The interface here is an authored lower-level aperture, not an extra corridor entrance.

## Three implemented decisions

### 1. Separate water grades from a schematic floor level

The source collector now has eleven 2.5-foot-apart plan stations, a 25-foot centerline run and an **assumed** invert from -10.50 to -11.00 feet. The receiving relay has nine stations and an **assumed** invert from -11.05 to -11.45 feet. Each 2.5-foot station descends 0.05 feet (2% assumed grade). The cross-tile join falls a further 0.05 feet. Steeper undocumented steps, reversing gradients and discontinuous levels are rejected.

A provisional crown at -8.00 feet, maximum downstream water surface at -8.75 feet and drop lip at -1.00 feet yield 0.75 feet nominal crown freeboard and a 7.75-foot vertical separation of drop lip above assumed maximum tailwater. **These figures are not surveyed or discharge-derived.** The validator rejects a submerged crown or failed *declared* air gap, but cannot establish actual ventilation, head loss, flood transients, or structural viability. The max-tailwater datum must be rechecked if a real outlet is ever mapped.

### 2. Author an exact, independent modular lower-level seam

Riftwater now continues to lower-level south cell **(11,19)**. Postern Bastion receives at north cell **(11,0)** on an independently stored buried relay ending at **(11,8)**, with the true exterior outfall **still unmapped**. Both surface tiles retain their existing eight standard exits at offsets 4 and 15. No ninth *walking* entrance has been invented.

The explicit seam checker handles all four quarter turns: it checks surface floor masks, rotated lower aperture side and offset, directional source/receiver roles, shared level, connector kind, and downhill invert continuity. Unpaired, reversed, misaligned or uphill conduits fail the specialized assembly contract. Existing generic nine-tile examples remain **surface-only studies**; their hydraulic interconnections have **not** been certified by the new contract.

### 3. Draw the combined engineering evidence

[Editable paired subfloor plate](../examples/subfloor_pair_plate.svg) overlays the *upper* tile structures as faint foundation context, shows two independent buried plan routes and their one exact seam, then plots the continuous assumed invert profile. The profile exaggerates vertical scale for legibility and marks the outfall as uncharted. The older [single-tile tailrace plate](../examples/riftwater_tailrace_plate.svg) now reaches the actual south edge; its terminal is a seam, not a fictional final outlet.

The new JavaScript tests cover rotated seams, grade continuity, backwater and vector reproducibility. The independent Python tests reject mismatched profile geometry, false lower outlets and drownable vent assumptions. Automated structural checks do **not** equal a physical print review; drawings are still design studies.

## Next work

1. **Research/dimension mechanical gates, vent shafts and access.** The handwheel-to-shutter transmissions and walkable inspection access are unresolved. Review measured rack-and-pinion/chain-hoist drawings against actual corridor wall thickness.
2. **Resolve the Postern exit.** The relay ends internally at (11,8). A defensible outfall needs a further mapped discharge route, possible receiving water level, real soffit/invert dimensions, and foundation clearances; do not label it completed drainage.
3. **Review printing and structure.** Print the two-level plate and nine-tile surveys at their specified scale. Examine buried passage versus foundation clashes, legend hierarchy, gate symbols, and fine strokes under human inspection before releasing finished cartography.
