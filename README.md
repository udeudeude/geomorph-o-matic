# Geomorph-o-matic

Original, modular, editable dungeon cartography. **Architectural studies, not yet a finished collection.**

## Browse the editable vector dungeon studies

- [Cloister of Salt](tiles/salt_cloister.svg): enclosed processional circuit around a brine pool, a locked reliquary, and a hidden chapel.
- [Postern Bastion](tiles/postern_bastion.svg): defensive passageways, alternate routes, gate control, magazine and barracks.
- [Bone Galleries](tiles/bone_galleries.svg): two approaches to a royal sepulcher, ossuary galleries, a concealed tomb entrance.
- [Basalt Rift](tiles/basalt_rift.svg): seven irregular cavern chambers and natural rock contours.
- [Sunken Orrery](tiles/sunken_orrery.svg): a ruined observatory court with two guarded approaches.
- [Riftwater Lock](tiles/riftwater_lock.svg): asymmetric subterranean floodworks with seven chambers, independent inspection circuits and sealed discoveries.

These are editable vector drawings, not flattened images. The separate floor, grid, rock, doors, structural walls and architectural features are grouped in the SVG document.

## Build locally

Requirements: Python 3 and Node.js. No third-party packages.

```sh
python3 validate.py
PYTHONPATH=. python3 -m unittest discover -s tests -p 'test_*.py'
node --test tests/*.test.js
node render.js
git diff --exit-code -- tiles/
```

The canonical architectural data is in [blueprints.json](blueprints.json). The [JavaScript renderer](render.js) creates the six SVG masters reproducibly, and [validate.py](validate.py) rejects incompatible edge openings, invented doorways, unconnected halls and disconnected floors. [GitHub Actions](.github/workflows/validate.yml) checks these commands after pushes.

## Geometry

Each morph covers **10 x 10 full squares** subdivided into 20 x 20 half-square cells. A 5-foot-wide opening occupies one half-cell inside the 3rd and 8th full squares on each side. The exact fine-grid opening positions are **4 and 15**; unlike the earlier 5/15 pair they remain aligned through all quarter-turn rotations.

All six studies currently have eight standard edge openings, plus explicitly authored rooms, passages, secret doors and locked doors. Corridor loops are diagnostic, not proof of meaningful alternatives; see the separate route-resilience and chamber-journey audits.

## Next major work

1. Critically examine actual assembled maps at print scale; improve density and architectural plausibility rather than adding superficial furniture.
2. Extend the existing irregular chambers and overlapping elevation model with connected waterways, flood stages, and purposeful dead ends.
3. Add edge/corner interface masks and validate matched openings instead of assuming eight for every tile.
4. Build meaningful scenario keys and alternate routes, then validate with actual playtesting.

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
