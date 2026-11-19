# Cave contours and honest circulation metrics
18 November 2026

## References and decisions

- Dyson Logos, *Vault of the Cave Morphs* (2018), https://dysonlogos.blog/2018/06/25/vault-of-the-cave-morphs/ : edge-compatible cave morphs with strong wall silhouette and separately worked hatching.
- Dyson Logos, *2022 Cave/Lair Geomorphs - Set 2* (2022), https://dysonlogos.blog/2022/02/28/2022-cave-lair-geomorphs-set-2/ : waterways, vertical tiers, natural passages, and deliberate variation.
- The Alexandrian, *Xandering the Dungeon: How to Use a Melan Diagram* (2021), https://thealexandrian.net/wordpress/45711/roleplaying-games/xandering-the-dungeon-addendum-how-to-use-a-melan-diagram : beware false loops that do not create genuinely different routes.

Do not reproduce any reference artwork. Use those works as technical criteria for original cartography.

## Changes

1. Cave-facing wall edges are collected as contour chains, then rounded where they turn *inside* a tile. Boundary vertices and standard edge portals remain exact. The navigational floor remains the same validated half-cell geometry. Hachures extend away from walkable floor into solid rock.
2. Added `topology.js` to compute fully encircled non-hall obstacles in the hall union. Counting lattice cycles in a wide 2-cell passage inflated the prior corridor-loop score: every 2x2 block created a mathematical cycle with no meaningful explorer choice.
3. The new `substantial_hall_circuits` deliberately undercounts some real choices, including alternate routes through rooms or out through neighboring tiles. It does not replace scenario playtesting, signed elevation, or a semantic route graph.

## Visual quality gates

- SVG walls must not cover a portal or move a connector.
- Fine rock hatching belongs outside the walkable floor, not a repeated decorative pattern everywhere.
- Cave geometry is still composed of half-cell occupancies, and contour rounding is an **illustration improvement**, not sub-cell geometry. Future work: primitive vector room footprints, 3D elevation/cave cross-sections, purposeful route graphs, reviewed print proofs.
