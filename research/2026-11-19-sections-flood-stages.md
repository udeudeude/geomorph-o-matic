# Section plates and flood-stage modeling, 19 November 2026

## Research evidence

1. [Mammoth Cave National Park cave mapping](https://www.nps.gov/maca/learn/cave-mapping.htm) distinguishes plan-view geometry from cross sections and running profiles. Overlapping passages need independent depictions.
2. [Jewel Cave cave surveying](https://www.nps.gov/jeca/learn/nature/surveying.htm) documents surveying passage elevation and wet areas.
3. [Dyson Logos' multi-level Geomorphic Halls](https://dysonlogos.blog/2019/07/15/geomorphic-4/) includes a cave lake below a descending spiral staircase.
4. [Dyson Logos' Raining Cave](https://dysonlogos.blog/2022/05/11/the-raining-cave/) uses interconnected pools descending through multiple tiers.

All cartographic geometry in this project is original. These references inform the representation of vertical relations and water hazards; neither they nor their artwork are reproduced.

## Three engineering decisions

1. **Independent vector plans and a sectional cut.** The new section-plates.js exports two separate plan layers and a cut through the turbine gantry. The lower drawing preserves the canonical tile plan without the overlaid deck; the upper shows physically modeled decks, raised floor, and lower-floor projection in distinct groups. The cut marks the same row in both plans and indicates ladder placements. Longitudinal grid spacing is exact, but height separation and depth of water are deliberately labeled *schematic*.
2. **Flooding is a navigable scenario, not a decorative water symbol.** flood-stages.js introduces ordered, cumulative flood masks. Every new wet cell must connect through actual geometric passages to already submerged cells, and each state is checked by the existing canonical terrain validator. This is **not** a hydraulic fluid or pressure simulation; every modeled door opening is assumed permeable.
3. **A real failure state.** The Riftwater Lock's authored surge inundates the three exposed turbine-floor cells south of its bridge. Its southern dry approach now requires a detour, while the overhead deck retains distinct lower and upper surfaces. The audit compares base and surge travel, accessibility, and entry compatibility, and both states generate separate editable vector studies.

## Limits and next work

- Water volumes, flow direction, pressure, duration, valves, and the effect of closed watertight doors are **not** simulated. A graph-only connected flood extent is a first contract, not physical hydrology.
- The sectional generator currently handles a single constructed +1 level and horizontal section cuts. General sections need elevations measured in physical units, clearance and ceiling shape.
- Flood and section studies do not replace the original standardized geomorph masters, whose outer-portal geometry remains unchanged.
- Printed map readability, architectural plausibility, and playtesting need a dedicated critical review before treating the collection as complete.
