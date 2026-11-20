# Wide volcanic cave roof and raised-bench consistency review (2026-11-20)

**Status:** research and *reproducible architectural sensitivity analysis*, not an original cave survey or a release-ready dungeon. The most important finding is an inconsistency in our previous mental model: Sagging Sheetflow has an eight-cell raised bench and three one-edge "ramps", but the vertical level is *unitless*. The neighboring 6.5-foot roof scenario is explicitly **height above local floor**. It cannot automatically serve as a single absolute ceiling elevation.

## Research consulted

1. **Waters, Donnelly-Nolan and Rogers (1990)**, [*Selected caves and lava-tube systems in and near Lava Beds National Monument, California*](https://pubs.usgs.gov/publication/b1673), United States Geological Survey Bulletin 1673, includes 102 pages and six plates. This is a promising next source of **paired plans and sections**. The presence of plates in the catalogue is verified; their actual geometries have **not** been extracted or reproduced in this iteration.
2. **Kauahikaua and Cashman (1998)**, [*Observations on basaltic lava streams in tubes from Kīlauea Volcano*](https://doi.org/10.1029/97JB03576), reports strong differences between inflated sheet-flow conduits and roofed-over channels. The paper describes shallow inflated sheets approximately 1–2 metres high and tens of metres wide in the observed coastal setting, and locally taller roofed channels elsewhere. **Width does not determine height or ceiling continuity**. These are real field observations, not measured dimensions for our map.
3. **The TubeX ground-penetrating-radar study (2020)**, [*Resolution of Lava Tubes With Ground Penetrating Radar: The TubeX Project*](https://doi.org/10.1029/2019JE006138), compares measured roof and floor geometry using detailed laser-scanning and radar observations of Skull Cave and Valentine Cave, California. It highlights different passage scales and important three-dimensional complexities. Better ground truth requires paired measurements, not extrapolation from one sample.
4. **British Cave Research Association**, [cave surveying grades](https://list.bcra.org.uk/surveying/index.html), distinguishes measured centreline accuracy and survey grades from approximate sketches. In particular the requirement to measure inclination in appreciably sloping passages is relevant to a multi-level cave plan. None of the project drawings has been assigned a formal survey grade.

## Three concrete developments this pass

### 1. A common-datum *comparison*, not a falsely measured vault

The new `wide-vertical-datum.js` registers the **actual eight bench cells** and **all three real grade-connecting edges** in `wide-blueprints.json`. It does not silently reinterpret a unitless level index as feet.

Instead it compares four explicitly hypothetical raised-bench heights measured relative to the adjacent lower floor, with each transition having an actual 2.5-foot horizontal run:

| Bench rise (hypothetical) | Implied one-edge grade | Would meet chosen 12.5% comparison limit? | If roof stays fixed at lower-floor 6.5 ft, clearance over bench |
| ---: | ---: | :---: | ---: |
| 0.25 ft | 10% | Yes | 6.25 ft |
| 0.5 ft | 20% | No | 6 ft |
| 1 ft | 40% | No | 5.5 ft |
| 2 ft | 80% | No | 4.5 ft |

The 12.5% comparison limit is a **chosen design screening value, not a legal building/accessibility standard**. There is no assumption that the surfaces are constructed accessible ramps. The fixed-roof comparison is a *different hypothesis* from the currently authored roof height **above the local floor**. The two should not be conflated or combined to claim standing navigation is verified.

**Consequences:** a genuinely raised one- or two-foot lava bench cannot be reached by the current three 2.5-foot edges if they are meant to depict ordinary, gradual walking ramps. The design requires longer ramp geometry, explicit stone steps/scrambles, or a much lower bench. No geological source justifies pretending otherwise.

### 2. An editable, coordinate-registered technical plate

The new [bench grade plate](../studies/sheetflow_bench_grade.svg), generated from actual cave floor occupancy, layers all true floor cells, the eight raised cells, and three access-edge markers. Four alternative profile sketches show why plan continuity alone proves insufficient. The sketches compare **assumptions**; they do not overwrite any canonical dungeon walls or passages. See the machine-readable [grade report](../reports/sheetflow-bench-grade.json).

### 3. Posture-specific *rotated assembly* audit

The existing single-tile headroom diagnostic cannot prove what happens when restricted caves are assembled. The new [posture assembly report](../reports/wide-posture-assembly.json) reconstructs real floor navigation after all four tile rotations, reapplying collapse, threshold and elevation rules, then the local low-ceiling scenarios. It counts reachable occupied cells, all 32 external mouth cells, all exterior-to-exterior pairs, and the consequences of closing each of four full inter-tile seams, separately for standing, crouching and crawling assumptions.

This is more rigorous than checking matching drawn openings. It remains a **fictional height and posture model**, not evidence of stable roofs, satisfactory ceiling junctions or a physical playtest.

## Next design decisions, in priority order

1. **Recompose Sagging Sheetflow's bench access.** Decide whether the bench is a short step, a rough scramble with explicit access restrictions, or a physically graded ramp requiring longer approach landings. Update topology *and* SVG semantics together. Do not merely recolor the existing ramp strokes.
2. **Obtain actual published cave plans with paired measured transverse sections and longitudinal profiles.** Start with the Survey Bulletin 1673 plates and the TubeX Skull/Valentine measurements, recording station locations, floor elevations, roof elevations, substrate, and uncertainties. Then author geological roof variation across the three separate fictional caves without tracing copyrighted surveys.
3. **Extend the seam standard to define an explicitly modeled common roof datum or minimum crown continuity.** Currently the five-foot wide seam family is a horizontal floor contract only. Test grades and vertical clearance across adjacent rotated tiles before offering any usable-world guarantees.
4. **Print at intended tabletop scale and conduct human route tests.** The current paper plots and digital route analysis cannot determine whether ceiling marks, step symbols or cave entrances communicate clearly.

**Release decision:** keep the drawings as editable, experimental architectural studies. No physical roof-load, survey, print or playability verification was performed.
