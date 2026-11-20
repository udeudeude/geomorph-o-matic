# Split-Spine Drainback: third wide-mouth cave, assembly robustness and geological limitations (2026-11-20)

Status: **design study, not a finished dungeon or surveyed cave**.

## Geological evidence used to constrain the fiction

- **Kauahikaua et al. (1998),** *Observations on basaltic lava streams in tubes from Kīlauea Volcano, island of Hawai‘i*, [United States Geological Survey / Journal of Geophysical Research](https://pubs.usgs.gov/publication/70020452), DOI 10.1029/97JB03576. Documents the major difference between tall roofed-over channel tubes and broad, low inflated-sheet-flow passages, including near-elliptical cross sections that can be much wider than high. Thus a broad fictional plan must **not** be assumed to provide a standing-height vault.
- **Peterson et al. (1994),** *Development of lava tubes in the light of observations at Mauna Ulu*, [United States Geological Survey](https://pubs.usgs.gov/publication/70017657). Describes tubes created by channel roofing, accretionary levees, coalescing crust plates and advancing pāhoehoe lobes with distributary networks. The study's side channels and surviving central basalt septum are a fictional architectural interpretation, **not** a reconstruction of any specific surveyed feature.
- **National Park Service,** [Craters of the Moon cave field guide](https://home.nps.gov/crmo/learn/education/site-tour-3.htm), updated February 23, 2024. Describes sagging and fractured cooling roofs, collapse and skylights. This supports modeling a complete dry traverse interrupted by a collapse; it does **not** determine the actual physical stability of any invented rock span.
- **British Cave Research Association,** [Cave Surveying standards](https://bcra.org.uk/surveying/). Survey detail classes distinguish estimates from measured dimensions at meaningful changes in passage width and height. This map has **no grade or survey class**. The 2.5-foot half-cell measures are authored game-plan dimensions only.

## Three development decisions

1. **Different geography, rather than a third rearrangement of the first two.** The Split-Spine Drainback has a real persistent basalt island through the middle of the plan, twin flanking drainback conduits, offset east and west side vesicles, a northern inflated blister and a southern depressurised chamber. Four irregular rooms and 40 separately authored hall row-runs contain **223 walkable cells**. The interior rock spine is actually solid in the floor model. This provides two consequential passage arms and eight natural room thresholds, not simply a painted rock island.
2. **A breakdown with measurable navigational consequence.** Three independent adjacent west-limb floor edges are blocked by roof-fall, forcing a selected upper-west to lower-west journey from **22 to 34 half-cell steps**, a **30-foot additional walk** at the fictional 2.5-foot cell scale, while retaining access to all 223 floor cells and sixteen exterior mouth cells. The opposite branch remains usable. Breakdown marks are anchored to actual blocked edges rather than unrelated debris ornament.
3. **An assembly that tests actual navigation, not only matching edge inks.** A four-instance composition uses **three different hand-authored wide-mouth caves**, independently rotated, with four adjoining full seams. The assembly auditor rotates the traversable graph, adds only real mouth-to-mouth walking edges, proves global reachability, and temporarily closes each entire internal seam to check for alternative circuits. This is a reproducible *computerized route assessment*, **not** a human tabletop test.

## What the design does not establish

- **Headroom and three-dimensional geology.** The drawn central spine and its margins exist only in plan. There is no measured roof thickness, vertical clearance, lava stratigraphy or actual load-bearing analysis. A 5-foot entrance width is not a guarantee of 5-foot height. A near-elliptical tube may be low.
- **The independent meaning of a collapse.** Blocking three connected hall edges is a deterministic game-traversal rule. An actual geological roof failure could fill floor cells, change vertical access, or close a different area entirely.
- **Visual print legibility.** The print proof encodes the correct half-inch-per-five-foot nominal scale, but no physical printed copy has been inspected. Text and fine hachures may disappear.
- **Human playability.** Graph reachability and seam redundancy say little about whether room identities are memorable or player choices are interesting.

## Next decisive verification tasks

1. Source **published, measured plans with paired transverse profiles** for actual lava tubes. Record width-to-height ratios, inclines and roof/lava-lining structures, then model explicit low/headroom-limited routes where warranted. Do not infer height from plan width alone.
2. Print the three masters and mixed composition at their intended paper scale, review under ordinary lighting, and revise line weight, hachures, labels and doorway clarity based on observed results.
3. Conduct real or simulated tabletop route playtests with deliberate objectives (finding a blocked feeder, bypassing the spine, navigating across tile seams). Inspect where the visually appealing rock structure fails to communicate the available routes. Revise the floor, not merely its rendering.

Regenerate: `node wide-cave.js && node wide-assembly-audit.js`.
Verify: `node --test tests/*.test.js` and `PYTHONPATH=. python3 -m unittest discover -s tests -p 'test_*.py'`.
