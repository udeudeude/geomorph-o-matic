# Controlled hydraulics, measured profiles, and physical print review
19 November 2026

## Research and applicable principles

1. The [National Speleological Society cartography judging criteria](https://caves.org/salons/cartography-submissions/cartography-judging-criteria/) require plan/profile consistency, explained symbols, section orientation, and an explicit vertical scale for profiles. Our sections must never invent a ceiling height or confuse levels that simply overlap in plan.
2. [Architectural line and text weights](https://www.eit.edu.au/resources/electrical-drawings-and-schematics/) describe physical print line widths around 0.18 mm or greater and lettering around 2.5 mm for important notes. Our **0.15 mm stroke and 2.2 mm type** tests are deliberately lenient screening thresholds, not a declaration that small features are legible. Printing and human inspection remain necessary.
3. [National Park Service Mammoth Cave mapping](https://www.nps.gov/maca/learn/cave-mapping.htm) highlights the difference between plan and vertical cave information. The map should distinguish a floor, a deck above it, and water below it rather than collapsing them into one drawn surface.

## Implemented in this development cycle

**Watertight sluices.** Hydraulic gates control specific walkable edges for **water**, not character movement. They are explicit internal connections with durable IDs and open/closed states. Flood-stage masks must be hydraulically reachable through open gates. Optionally, a stage can declare a surface elevation; water cannot inundate floors at or above that elevation. These checks are deliberately separate from the usual accessible-path graph: a sealed sluice may stop water without stopping a human route. Stages remain authored masks, not an attempt at computational fluid dynamics.

**Architectural longitudinal profile.** A companion editable vector output shows any integer stacked floor elevations, negative sublevels, existing surfaces, water symbols, bridges, and ladders/stairs. Horizontal half-cell spacing is the canonical 2.5 feet. Vertical spacing is proportional to an explicit **assumed** floor-to-floor height (default 10 feet per model level), not a cave-survey measurement. No ceilings or water depths are invented. This removes the previous +1-only limitation for longitudinal profile studies while retaining the earlier paired-plan section sheet.

**Physical print proof.** One dungeon tile is embedded as its actual original vector artwork on an 8.5 by 11 inch sheet, with a 10-foot calibrated scale bar. The audit estimates on-paper font sizes and line widths at a chosen grid size, then reports counts below warning thresholds; the raw vectors remain editable. Default is 1/2 inch per full square, so a 10-square tile prints five inches wide. The print proof must be output at 100% without fit-to-page.

## Architecture and limitations

- Only gates explicitly authored on legitimate internal path edges are modeled; there is no water velocity, pressure, flow volume, hydraulic head loss, or timing.
- Waterline validation checks inundation against existing **floor level integers**. Those integers do not specify real-world meters or feet; do not infer engineering precision.
- Future tile blueprints should include a water-control chamber with intentionally confined cells and multiple sealable channels. Adding one isolated gate to a room with alternative seepage paths would be hydraulically meaningless.
- The new idealized longitudinal profile uses an assumed floor-to-floor dimension because actual cavern clearance has not been surveyed.
- Print audits do not detect overlaps, color-blind contrast defects, typographic inheritance, or legibility of curved stone marks. Proofs need actual viewing at intended size.

## Next investigations

1. Give the floodworks a specifically designed pressure-regulated side basin with multiple gated inlets and overflow spillways; model head losses only once the geometry and water source elevations are credible.
2. Put a section-line direction arrow and vertical bar scale on the profile, then compare it against cave cartographic conventions. Add arbitrary section axes and verify overlap with actual plan surfaces.
3. Print multiple nine-tile assemblies at common scales and conduct blind readability checks of locked doors, secret passages, elevated surfaces, and cavern hatching.
