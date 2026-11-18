# November 18, 2026: geometry and circulation audit

## Comparative research

1. [Dyson Logos on the classic geomorph specification](https://dysonlogos.blog/2021/11/27/six-sickly-sewermorphs/): a 10 x 10 grid, passages at squares 3 and 8; special sewers add a distinct central channel and require matching neighbors.
2. [Dyson Logos on cave morphs](https://dysonlogos.blog/2018/06/25/vault-of-the-cave-morphs/): natural caves can use a wider interface, which **must not** be mixed indiscriminately with one-cell passages.
3. [Dyson Logos on oversized morphs](https://dysonlogos.blog/2021/12/27/oversized-sewermorphs/): 20 x 10 and 30 x 10 morphs allow coherent large structures to cross arbitrary tile boundaries.
4. [Justin Alexander, Jaquaying the Dungeon](https://www.thealexandrian.net/archive/archive2010-07c.html): multiple entrances, nontrivial loops, level connections, secret shortcuts.

## Review of current three originals

Nine-tile rotated assembly is now mechanically valid, but it reveals repeated architectural vocabulary and large empty rock fields. The current collection does **not** yet possess the variety of convincing spaces found in these references.

| Existing tile | Hall cycle rank | Corridor cells separating some exits | Accessible floor without secrets/locked doors |
|---|---:|---:|---:|
| salt_cloister | 5 | 48 | 85% |
| postern_bastion | 4 | 47 | 100% |
| bone_galleries | 8 | 60 | 100% |

**Interpretation:** Exit-separating cells include intentional single-wide entry stems, so the raw number is not a quality score. The cycle rank counts cell-graph cycles, not player-perceived meaningful route choices. A one-door secret chamber is a discovery, not a bypass. The new audit reports these distinctions rather than claiming a high loop count is automatically good.

## Design requirements for next tiles

1. Author topology around site purpose: real cause and effect between functional spaces.
2. At least one tile should have a **large atypical landmark** rather than four small rectangular chambers.
3. Model waterways, pits and changes of elevation as impassable or conditional route geometry, **not** merely decoration drawn on top of ordinary traversable floor.
4. Provide at least two narratively significant alternative routes in assembled maps, not just tiny cell-graph cycles.
5. Test each full assembly at actual print scale. Include edge or corner masks and explicit compatibility rules before introducing specialty morphs.
6. Avoid copying specific maps, textures, or expressive linework from reference artists; create original visual solutions.

