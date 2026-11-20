# Bench step geometry and vertical seam contract (2026-11-20)

**Status:** experimental, original dungeon cartography. This pass changes the *authored* Sagging Sheetflow floor-access geometry and the three wide-mouth cave roof-interface data. It does not certify a natural cave, a safe stair, a stable roof or a release-ready tabletop map.

## Source investigation, with observations separated from extrapolation

1. **Waters, Donnelly-Nolan and Rogers (1990), United States Geological Survey Bulletin 1673**, [official catalogue and six separate survey plates](https://pubs.usgs.gov/publication/b1673), and its [Craig Cave / Craig Temple descriptions](https://npshistory.com/publications/geology/bul/1673/sec3h.htm). The researchers describe successive lava flow units producing altar-like steps at Craig Temple. This makes a *stepped volcanic floor* a better analogue for our raised bench than an unexplained high-gradient walking ramp. It does **not** establish the tread or riser dimensions chosen below. Their plate 5 contains Craig Cave and the complex Post Office Cave system, which has several superimposed levels and a documented longitudinal section ([description](https://npshistory.com/publications/geology/bul/1673/sec3g.htm)). Plate 4, map 12, includes a longitudinal section of Skull Cave ([description](https://npshistory.com/publications/geology/bul/1673/sec3d.htm)). These are specific candidates for future survey-to-fiction dimensional study, *not* data extracted or redrawn in this pass.
2. **Pettinelli and colleagues, TubeX (2020)**, [Resolution of Lava Tubes With Ground Penetrating Radar](https://doi.org/10.1029/2019JE006138). They compare Skull Cave, roughly 10–20 metres in diameter, with much smaller Valentine Cave, roughly 1–3 metres in diameter. Their paired laser survey and radar sections demonstrate that roof, floor, pillars and multi-level features need separately registered vertical observations; radar responses may not resolve a deeper floor. We use this as a warning against equating plan width and headroom.
3. **Bulletin 1673, cave morphology and distributaries** ([official abstract](https://pubs.usgs.gov/publication/b1673), [Cave Loop cave descriptions](https://www.npshistory.com/publications/geology/bul/1673/sec2.htm)). Lava tubes branch and divide where lava delivery and terrain grade change, and roof falls can create misleading apparent floors. The varied passage sizes and tumbled rubble support the existing separation of ceiling fall, walking edges and bedrock. They do not support arbitrarily repeating three identical 2-riser stoneways in nature.

## Three engineering results

### 1. Bench edges are now actual *steps*, not invisible ramps

The eight actual raised bench floor cells remain in place, and exactly three existing one-edge approaches remain reachable. The former `terrain.ramps` definitions were replaced with separate `terrain.steps` entries, each with explicit **1-foot total rise**, **two 0.5-foot risers** and **two nominal 1.25-foot treads** along an existing 2.5-foot plan transition. Those are invented geometry choices, not surveyed measurements or an accessibility prescription. The canonical drawing renderer now marks **six riser lines** in its own independently editable `lava-bench-steps` layer. Neither the old ramp arrows nor absent natural ledge crossings are shown as walkable. A separate dimension validator rejects excessively tall individual risers, undersized tread runs, duplicates, overlay with ramps, steps at exterior portals, and nonadjacent or non-height-changing edges.

Two further caveats: a visually drawn 0.5-foot step could still be treacherous or physically impassable, and the three identical approaches are an idealization. Physical tread roughness and usable width have not been evaluated.

### 2. Shared vertical mouth datum specified and audited

All three separate wide-mouth designs now declare **6.5 feet of hypothetical crown clearance above their zero-level entrance floor**, over both two-cell-wide mouths on each side and **5 feet inward**. The remainder of each fictional cave retains its distinct roof scenario (Braided 8 feet, Sheetflow 6.5 feet, Split-Spine 7.5 feet). An independent assembly audit rotates all four actual placements, rebuilds true floor and roof cells, and checks *both sides of every seam*, at depth zero and one. It separately audits exterior full-depth throats. Mixed tiles with inconsistent floor elevations, missing throat floor, insufficient assumed headroom, or unequal junction roof heights fail. The posture audit now refuses to proceed without this contract.

**Important limit:** this is a hypothetical *local* floor/crown equality only. At interior locations, the previous baseline scenario is still clearance above local floor. The new mouth values are not surveyed roof altitudes; the 6.5-to-8-foot roof rise within Braided Lava and 6.5-to-7.5-foot roof rise in Split-Spine now require credible longitudinal transitions. We have not drawn or verified those changes. Similarly, the rise assigned to Sheetflow's bench requires a coherent bench roof elevation. It is physically inaccurate to call the whole cave vertically complete.

### 3. Independent plan and section regression tests

JavaScript tests rebuild actual passable terrain edges, verify six distinct drawn risers and reject fabricated or oversized steps, examine all four intertile seams, and detect a modified or incompatible hypothetical crown. Independent Python tests reconstruct the rotated floor plan from source room and passage geometry, verify all 32 across-seam depth samples and all 64 outside throat samples, and check the dimensioned risers and treads. Both languages distinguish floor connectivity from physical vertical clearance. CI regenerates `reports/wide-seam-crowns.json` alongside the revised original SVGs, printed vector proofs, bench plate and navigation reports.

## Priorities after this pass

1. **Model variable longitudinal roof elevations in the wide caves** without abrupt ungrounded jumps at the second inward throat cell. Register cross sections to floor datum and study **Skull Cave map 12/plate 4** and **Post Office Cave map 15/plate 5** before assigning credible height contours. The full plates still need visual source inspection and station-scale interpretation; the figures have not yet been measured.
2. **Critique the three identical two-riser stepways** against actual published lava bench descriptions, and consider making only one a comfortable stair while rendering others as irregular scrambles or impassable rock lips.
3. **Physical print proof and human route testing.** Measure whether six new small riser strokes are legible at nominal half-inch-per-square scale, and check whether players correctly distinguish steps from blocked ledges, low ceilings and fully impassable collapses.

**Release status:** still experimental; no physical test print, geotechnical analysis or tabletop playtest has been performed.
