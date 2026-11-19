# Independent sluice compartments and realistic map claims
19 November 2026 | Architecture, controls, and cartographic contract

## Evidence and constraints

1. Harpers Ferry's excavated armory tailrace has a documented Y-shaped junction. A historic underground hydraulic system may branch, but a junction is a real constructed connection, not something to infer through every adjoining pedestrian cell. National Park Service: https://home.nps.gov/articles/harpers-ferry-tailrace.htm
2. Saltford Brass Battery Mill used sluice-controlled headraces and a tailrace, arranged as a water-management complex rather than an isolated decorative pool. Historic England: https://historicengland.org.uk/listing/the-list/list-entry/1004607/
3. The Victoria Mill sluice and wheel have documented regulating devices, axle mountings, a spur wheel, and a tailrace continuing under a yard. These are physical spaces with a working order and clearances, not interchangeable map symbols. Historic England: https://historicengland.org.uk/listing/the-list/list-entry/1245879
4. The Harpers Ferry armory diverted water into headraces, past wheels/turbines, and through tailraces. This establishes the large-scale conceptual sequence without supplying dimensions for *our* imaginary site. National Park Service: https://www.nps.gov/places/000/power-of-the-potomac.htm

## Critical observation

The earlier nine-cell basin admitted water through three shutters into a **single undivided receiving pool**. The model treated all three gates as independently operable, but opening *any one* connected all three downstream cells laterally. Therefore their flooding effects were identical. Three controls were artistic decoration, not three distinct architectural decisions.

The nominal footprint is just three 2.5-foot half-cells wide (**7.5 feet**). A historic wheel need not fit in this pocket: for comparison the Victoria Mill example has a wheel about 4 metres wide and 5 metres in diameter. A turbine, generator, transmission and service clearances have **not** been dimensioned here. Do not present the basin as a finished machinery plan.

## Implemented response

- Add full-height stone partitions between downstream cells (9,11)/(10,11) and (10,11)/(11,11). The same canonical edges now block **dry/wading access** and hydraulic propagation. Editable maps render these partitions as stone walls.
- Mark this sluice bank with `isolated_shutters: true`. The JavaScript engine and independent Python validator reject any arrangement in which opening one shutter by itself exposes an empty or overlapping downstream pocket.
- Stage three separately testable releases: west shutter wets one cell, center wets the next, and east completes the three-cell surge. A renderer regenerates the full surge map showing all three shutters open. This is a branching topology model, **not** pressure, velocity, gate-lift dynamics, or elapsed time.
- Keep the intake and tailrace as explicitly off-sheet. Replace the unsupported turbine-room label with **Partitioned sluice basin**; mechanical plant, trash rack, bypass, channel invert elevations, real water head and three-dimensional shaft routing are open design work.

## Remaining work, ranked

1. **Machinery/grade research and honest section:** collect documented cross-sections for forebay, trash screen, sluice, turbine pit, downstream draught tube and tailrace; then design a **separate**, dimensionally defensible turbine volume instead of shoehorning one into this basin.
2. **Integrated mechanical access:** determine whether each control station can physically transmit movement to its shutter without crossing the walking corridor or wet galleries; explicitly route and test linkages, not only operator reachability.
3. **Small-format assembly inspection:** print the full 3x3 mix at true size and check whether canal partitions are distinguishable from cavern walls and door leaves. The SVG remains an architectural study, not final artwork.
4. **Specialized interfaces:** modular sealed edges and terminus tiles will allow actual upstream and downstream watercourses across neighboring geomorphs instead of eight universal pedestrian openings.

## Verification criteria

The six dry baseline water cells remain unchanged. Three releases increase submerged cells **6 → 7 → 8 → 9**. Opening each shutter independently exposes a *different* one-cell receiving compartment. At least one dry walking journey changes when the center pocket floods. The eight tile portals remain unchanged. Both language validators must reject removed partitions or unauthorized flood stages.
