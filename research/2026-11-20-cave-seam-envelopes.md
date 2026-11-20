# Cave throats and dimensional envelopes: architectural constraint study

20 November 2026. **Original fictional dungeon design. Not measured cave data, an engineering assessment, or a finished map.**

## Research and why it matters

1. [Dyson Logos, *Vault of the Cave Morphs* (25 June 2018)](https://dysonlogos.blog/2018/06/25/vault-of-the-cave-morphs/) states that those cave geomorphs have **two-square-wide entrances**, deliberately matched to the passages of that particular adventure. This is a precedent for a separately defined entrance family, **not** a reason to change our existing one-cell mouth in place. Our grid uses 2.5-foot *half-cells*, so two adjacent cells are 5 feet, and not necessarily the same real-world measurement as Dyson's two full squares.
2. [British Cave Research Association survey grades](https://bcra.org.uk/surveying/) distinguish measured detail at meaningful passage transitions (Class D) from estimates or memory. Our diagrams are deliberately author-imagined vertical designs: a precise floor plan does **not** make a hypothetical roof into measured evidence.
3. [National Speleological Society cartography judging criteria](https://caves.org/salons/cartography-submissions/cartography-judging-criteria/) emphasize that cross-sections must correspond with their plan, and identify scale and direction. A plan-registered transverse section is a different object from an unscaled decorative vault.
4. [Bristol Exploration Club, *Passage Width* (1969)](https://bec-cave.org.uk/belfry-bulletin-no-258-september-1969/) explains why cave width can differ at floor, shoulder, and roof, with examples of tilted or T-shaped rifts. Our current *floor-plan width* is therefore a **partial** dimension, not a claim about total void cross-section. That ambiguity motivates explicit, separately authored roof-height scenarios.

## Three completed engineering studies

### 1. Independent, incompatible edge-opening families

[seam-profiles.js](../seam-profiles.js) defines **legacy** mouths at half-cell offsets 4 and 15 (one 2.5-foot cell each), and an **experimental cave-wide-v1** interface occupying [4,5] and [14,15] on every edge. Each family is exactly rotation-invariant. The wide specification requires two *continuous* occupied floor cells for at least **5 feet inward**, not a token double-width stripe at the boundary.

[The seam report](../reports/seam-families.json) validates all ten real legacy tiles and an explicit **synthetic** four-way cave-wide interface test fixture. Those families are **incompatible**. The synthetic fixture is not a completed new tile, not exported as a dungeon illustration, and is not mixed with the existing maps. A properly authored 5-foot-mouth cave remains to be designed.

### 2. Real floor cuts, explicitly fictional ceiling geometry

[cave-section-envelopes.js](../cave-section-envelopes.js) registers four transverse cuts to the actual traversable floor in Scoured Siphon, Basalt Rift and Lantern Sink. The two neighboring Scoured Siphon cuts show a genuine reduction in horizontal width from **7.5 to 5 feet**. The Basalt squeeze is **2.5 feet wide**; the Lantern joint splay is **5 feet**. All four are computed from canonical floor geometry and refuse to survive edits that move their named cut extents.

Only the roof-height values are invented as **design hypotheses**. The resulting [transverse plate](../examples/cave_section_envelopes.svg) uses one equal horizontal and vertical scale for each diagram, labels the actual plan widths, depicts speculative ceilings as dashed curves, and explicitly refuses to label the diagrams as a cave survey. The [machine-readable envelope report](../reports/cave-section-envelopes.json) retains the provenance of every number.

### 3. Independent regression gates and regeneration

New JavaScript tests reject a port mouth whose floor narrows immediately inside the edge and section cuts whose real passage width changes under the assumed roof. New independent Python tests reconstruct the floor and prove that our widths and eight historical mouth positions have not silently changed. The automated verification workflow regenerates the new section plate and both reports from their source and checks that the vector remains editable XML.

## Remaining limitations / research agenda

1. **Real field morphology:** Collect a *published* lava-tube survey pairing plan, transverse sections, and roof heights. Compare lateral asymmetry, rock island frequency and width/depth transitions qualitatively; do not copy another cartographer's map or claim unknown dimensions are measured.
2. **Real wide-mouth cave:** Author an original, navigable cave-wide-v1 tile that maintains two genuinely clear cells *inward* from each of eight boundary throats. Rework renderer, validator and assembly policy before treating the new standard as production-ready. The legacy and experimental families must never be assembled together without an explicitly modeled adapter.
3. **Vertical consistency:** Add actual authored floor levels, gradients, vault/roof constraints and route-linked transverse checks, including potential low ceilings at the 2.5-foot constrictions. The current room roof parameters are assumptions only; no structural bearing, true human mobility or bedrock stability has been established.
4. **Print + table use:** Inspect a physical actual-size print, compare line weights against established cave mapping practices, and playtest choices of loop and choke. An XML pass cannot substitute for legibility or good dungeon design.

**Status:** A recoverable architectural specification and dimensional experiment, *not* a release-ready set of maps.
