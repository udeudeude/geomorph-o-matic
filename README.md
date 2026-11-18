# Geomorph-o-matic

Original, modular, editable dungeon cartography. **Architectural studies, not yet a finished collection.**

## Browse the three original tiles

- [Cloister of Salt](tiles/salt_cloister.svg): enclosed processional circuit around a brine pool, a locked reliquary, and a hidden chapel.
- [Postern Bastion](tiles/postern_bastion.svg): defensive passageways, alternate routes, gate control, magazine and barracks.
- [Bone Galleries](tiles/bone_galleries.svg): two approaches to a royal sepulcher, ossuary galleries, a concealed tomb entrance.

These are editable vector drawings, not flattened images. The separate floor, grid, rock, doors, structural walls and architectural features are grouped in the SVG document.

## Build locally

Requirements: Python 3 and Node.js. No third-party packages.

```sh
python3 validate.py
node render.js
git diff --exit-code -- tiles/
```

The canonical architectural data is in [blueprints.json](blueprints.json). The [JavaScript renderer](render.js) creates the three SVG masters reproducibly, and [validate.py](validate.py) rejects incompatible edge openings, invented doorways, unconnected halls and disconnected floors. [GitHub Actions](.github/workflows/validate.yml) checks these commands after pushes.

## Geometry

Each morph covers **10 x 10 full squares** subdivided into 20 x 20 half-square cells. A 5-foot-wide opening occupies one half-cell inside the 3rd and 8th full squares on each side. The exact fine-grid opening positions are **4 and 15**; unlike the earlier 5/15 pair they remain aligned through all quarter-turn rotations.

All three tiles currently have eight standard edge openings, plus explicitly authored rooms, passages, secret doors and locked doors. They contain 5, 4 and 8 independently closed corridor loops respectively. These are circulation loops rather than spurious cycles inside large rooms.

## Next major work

1. Critically examine actual assembled maps at print scale; improve density and architectural plausibility rather than adding superficial furniture.
2. Introduce irregular chambers, changing elevation, underground waterways, and purposeful dead ends.
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
