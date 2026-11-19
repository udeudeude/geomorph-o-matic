# Water, elevation and genuine route alternatives
18 November 2026

## Priorities selected for this development cycle

1. Model *travel constraints*, rather than painting water or stair symbols on ordinary traversable floor.
2. Detect substantial geographically separate fallback routes after a representative local blockage, instead of counting tiny grid loops as escape choices.
3. Apply both systems to an existing map, publish their editable vector layers and enforce regression tests. This avoids adding a seventh superficially different composition.

## Research and decisions

- Dyson Logos, [2022 Cave / Lair Geomorphs, Set 2](https://dysonlogos.blog/2022/02/28/2022-cave-lair-geomorphs-set-2/) (28 February 2022). The published set combines little lakes, a bridged pool, interconnected pools and two-tiered spaces. The principle applied here is that water and level changes must alter the choices available to explorers.
- Dyson Logos, [Tiered Pools Cave](https://dysonlogos.blog/2022/12/19/tiered-pools-cave/) (19 December 2022). Vertical relationships are narratively and spatially consequential; they should not be reduced to decorative hatching.
- US National Park Service, [Cave Surveying, Jewel Cave National Monument](https://www.nps.gov/jeca/learn/nature/surveying.htm) (19 September 2023). Reliable surveys distinguish surveyed passage geometry from the features drawn around the survey skeleton. Our cell ownership and traversal remain separate from vector embellishments.
- Australian Speleological Federation, [Survey and Mapping Standards](https://caves.org.au/administration/commissions/survey-and-mapping-standards/). Unambiguous symbols and a consistent spatial model precede polished cartography.

None of these sources' images, maps, or linework was incorporated into the work.

## New canonical terrain structure

Optional `tile.terrain` contains `water` (cell coordinates), `bridges` (a subset of wet cells), `elevations` (pairs of signed integer level and cell list), and `ramps` (pairs of orthogonally adjacent cell coordinates connecting consecutive levels). Any unstated floor is dry at level zero. Dry traversal cannot enter deep water except on bridges; wading can enter water. A height change always requires an authored ramp.

No tile-edge opening may be wet or elevated: this preserves existing eight-portal rotation compatibility. The geometry model explicitly rejects duplicate or out-of-floor terrain, floating bridges and impossible ramp jumps.

The Riftwater Lock now contains six submerged pool cells, two dry bridge cells, a raised twelve-cell chart archive and one documented level transition through its locked doorway. The existing decorative pool was removed to avoid depicting an inconsistent second water surface.

The vector renderer exports independent editable `water-terrain`, `dry-bridges`, `elevation-edges`, `elevation-labels`, and `level-ramps` groups. This is a minimal schematic convention, not final illustration.

## Honest route resilience

`route-resilience.js` measures paths after a three-cell-wide local corridor obstruction. An alternate route is only credited when the replacement spends at least three cells at least three cell-units away from the normal path. This deliberately ignores circulation within a wide rectangular hall. The result is computed separately for ordinary, unlocked and all-door traversal, for each standard portal pair. It is a *sampled* blockage test, not proof of full graph redundancy: path choices that do not fall on sampled obstructions can be missed.

## Remaining limits

- The terrain system models discrete levels, not vertical overlap of two passage layers at one planar location. A genuine overhead bridge or stacked shaft will require separate walkable layers and explicit transitions.
- Water has two travel policies (dry and wading), but not currents, drowning hazards, equipment or a hydrological flow network.
- Bridge planks and elevation labels are functional schematic symbols. Print-scale visual calibration and cross-section symbols remain for a later pass.
- The new fallback route measure is intentionally conservative and can undercount valid alternatives. A semantic junction graph and authored scenario route tests will strengthen it.
