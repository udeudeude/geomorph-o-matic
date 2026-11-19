# Floodworks, organic contours and functional route analysis
18 November 2026

## Sources studied (design principles, not source art)

1. Dyson Logos, *2022 Cave / Lair Geomorphs - Set 2* (28 February 2022):
   https://dysonlogos.blog/2022/02/28/2022-cave-lair-geomorphs-set-2/
   Separate water bodies, natural routes, architectural inserts and multi-tiered caverns instead of one interchangeable room grid.
2. Dyson Logos, *Vault of the Cave Morphs* (25 June 2018):
   https://dysonlogos.blog/2018/06/25/vault-of-the-cave-morphs/
   Exact edge connection conventions matter; freeform walls must never deform the seams.
3. Stephen Wendell, *The Thing About a Dyson Logos Dungeon Map* (16 November 2021):
   https://donjonlands.com/2021/11/the-thing-about-a-dyson-logos-dungeon-map.html
   The spatial sequence and route decisions, rather than hatching alone, make a map compelling.
4. R. P. Davis, *Use 3 Dimensions* (20 September 2023):
   https://kaboutergames.com/use-3-dimensions/
   Vertical transitions must be designed in the architecture; stair decoration is not equivalent to elevation.
   
No reference artwork, linework or room arrangement was copied.

## Engineering work

- Organic curves are now deterministic cubic wall contours computed from the already validated chamber/hall boundary. Displacements are bounded to under 0.18 half-cell, and any contour segment touching a tile boundary is preserved exactly. Floor ownership and portal masks remain canonical in the 20 x 20 cell grid.
- Added three travel modes to the circulation audit: ordinary open doors, unlocked doors (including formerly locked entrances), and all doors including secrets. This makes a genuine shortcut through a chamber measurable without pretending that a microscopic 2 x 2 grid square represents a navigational choice.
- Recorded the longest and average shortest journey between standard portals, and the extra distance incurred by removing a chamber. A room counts as a shortest-path bypass only if some portal pair actually takes a longer route when that room becomes unavailable.
- Authored **The Riftwater Lock** as a separate original map: seven irregular chambers, an office connecting two inspection circuits, two locked facilities, two secret discoveries, a central broken turbine room and independent routes from every edge. Its major halls are asymmetrical and serve a functional underground water-control complex.

## Findings / shortcomings to address

The Riftwater Lock produces **11 raw corridor graph cycles** but only **one substantial enclosed obstacle** under the conservative spatial test. The floodkeeper's office is an open shortest-route bypass. The central turbine and secret cellar are traversable alternatives, but do not improve portal-pair shortest paths. The audit correctly does not award them shortcut credit; a subsequent pass should distinguish meaningful *non-shortest* paths using doorway-to-doorway detour ratios.

The broader collection still lacks true 3-dimensional elevation, independently modeled channels/water levels, and crafted freeform geometry at sub-cell scale. Our organic curves are an illustrative contour treatment, not a change to traversability. A print-scale visual review of assembled maps remains necessary; these are studies, not published-quality cartography.

## Next three technical targets

1. Treat water and elevation as explicit, validated terrain with dry crossing constraints, not merely a pool symbol and stair decoration.
2. Promote corridor/room circulation to a semantic door-to-door route graph. Detect useful alternate paths even when they are not the absolute shortest path.
3. Create a print-scale, multi-tile review loop with collisions, line weights and seam continuity evaluated visually, then design deliberately differentiated standalone caves and masonry junctions.
