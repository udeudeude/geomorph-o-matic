# Geomorph-o-matic

Original modular dungeon cartography research and software development.

## Status
Three architectural study maps have been generated, rendered, and checked locally. The project is **not** a finished collection; route diversity, physically credible architectural detail, and cartographic treatment still need refinement.

## Canonical map data
[Three author-designed map blueprints](blueprints.json) specify named rooms, room bounds, purposeful corridor routes, explicitly permitted doors (including locked and secret), and landmarks. The blueprints deliberately avoid automatic doorway insertion.

**Format:** 10 x 10 full squares, modeled as 20 x 20 fine-grid cells. Openings are one half-square wide, exactly at edge cell indices 4 and 15. Previous 5/15 openings were invalid under 90-degree rotation. This is now corrected.

## Validation carried out in the development checkpoint
12 automated tests passed: exact edge masks, quarter-turn portal invariance, connected interiors, connected corridors with rooms closed, controlled door counts, meaningful corridor cycles, parseable layered SVGs, absence of walls across portals, rejection of diagonal paths, and 60 randomly composed 3 x 3 arrangements with rotations.

## Design priorities
1. Commit fully browseable SVG masters and the Python renderer from the development checkpoint.
2. Improve architectural realism and art quality through individual room design, not random glyphs.
3. Extend interface masks for edge and corner pieces, caves, stairs, elevation, and multi-level relationships.
4. Validate 2 x 2 and larger assemblies visually, not only geometrically.

See [research notes](research/design-notes.md).
