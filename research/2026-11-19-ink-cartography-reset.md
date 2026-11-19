# A cartographic reset: original ink language and the Fallen Choir
19 November 2026

## References studied, and what we changed
1. [Dyson Logos' original geomorph collection](https://dysonlogos.blog/maps/geomorph-mapping-project/) demonstrates that a standardized 10-by-10 edge contract need not dictate the interior silhouette. We retain precise joins, but deliberately stagger the northern walk and put a large, irregular room at the dramatic center.
2. [Maker's Hall](https://dysonlogos.blog/2014/01/03/friday-map-makers-hall/) explains that secret passages are more satisfying as shortcuts or optional discoveries than as the only way to explore essential space. The two concealed cells in this tile are optional; its ordinary eight entrances remain connected.
3. [Dyson's pen-and-ink drawing process](https://dysonlogos.blog/2014/01/30/dysons-dungeons-a-map-animation/) distinguishes heavy boundaries from delicate detail hatching. Our *original* renderer now makes dark masonry boundaries legible above sparse rock-facing chisel marks, separate from grid and floor layers.
4. [2019 DungeonMorphs](https://dysonlogos.blog/2019/04/23/2019-geomorphs-dice/) required substantial detail reduction at miniature scale. We deliver a real-size five-inch tile on a letter-size print proof; reduction smaller than this needs a fresh evaluation.

No source geometry, maps, lettering, or specific linework has been copied. The reference is a design benchmark, not a trace template.

## New hand-composed map: The Fallen Choir
A broken abbey's core is a six-row irregular bell nave, with **four ordinary doorways** into it. The nave's direct crossing competes with east and west ambulatories and a slightly staggered upper walk. Seven defined rooms include a ribbed vestry, stranded pulpit, chime room, canted crypt, and two concealed discoveries. The central fallen bell has its own distinct, editable vector symbol; stones around traversable masonry acquire outward-oriented chisel marks rather than arbitrary floor texture.

The tile preserves the exact eight 5-foot portals of the project's 20-by-20 half-square contract. Any quarter turn keeps the ordinary interface mask. A deliberate mixed 2-by-2 arrangement pairs this tile with a masonry cloister, natural basalt rift, and tomb galleries. The aggregate is a **circulation and art study**, not a finished playtested dungeon.

### Proofs and checks
- Edit the [master tile](../tiles/fallen_choir.svg), not a flattened preview.
- Compare the [curated four-tile assembly](../examples/assembly_fallen_choir_2x2.svg) for seams and visual rhythm.
- Examine the [letter-sized proof](../examples/fallen_choir_print_letter.svg) at **100% / no fit-to-page**. Physical print evaluation remains outstanding.
- Run `python3 validate.py`, `node --test tests/*.test.js`, `node assemble.js examples/assembly_fallen_choir_2x2.json examples/assembly_fallen_choir_2x2.svg`, and `node print-review.js examples/fallen_choir_print_letter.svg fallen_choir`.

## Critical objections, not completion claims
- The outer circuit still has too much right-angle regularity; a further design pass should diversify corridor silhouettes and reduce schematic bilateral symmetry.
- The bell is a visible object but its collapse and structural consequences are not yet modeled as barriers. Do not infer a blocked or unstable passage from the illustration alone.
- Stair symbols suggest a change in level, but there is no surveyed elevation or vertical topology behind them yet. Either explicitly author level transitions or remove the stairs.
- No physical printed sheet or actual tabletop navigation session has been completed. Raster inspection and automated geometry cannot substitute for them.

## Next research and development
1. Study Dyson's cave maps and independent architectural drawings of ruined churches to develop irregular broken edges, vault scar lines and rubble that actually affects navigation, without tracing a reference map.
2. Author a genuine height-aware broken-choir crossing with stairs, overlooks, and elevation-marked alternatives; validate the graph rather than treating symbols as physics.
3. Print the tile at 5 inches and assembled portions at a comparable scale, comparing line separation, false doors, dark-ink density and approach choices; revise the renderer if small hatches become noise.
