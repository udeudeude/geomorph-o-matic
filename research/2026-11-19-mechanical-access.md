# 19 November 2026 | Overhead sluice mechanisms and inspectable buried bends

**Status: provisional constructability study, not finished cartography or a verified working installation.**

## Sources and design translation

- [Historic England, Bone Mill Sluice](https://historicengland.org.uk/listing/heritage-gateway/results/record/8b9e1ba8-5c5b-4a91-8f83-590512331139/MWB22618) reports three independently operated guillotine gates using **rack and pinion with ratchet and pawl brakes**. That supports separating each gate's actuator from a purely decorative shared wheel. It does not establish dimensions for Riftwater.
- [The Mills Archive, Bodley Foundry Collection](https://millsarchive.org/2010/05/30/bodley-foundry-collection/) preserves historic ironworks and sluice-gate designs. Drawings are an appropriate next source for shaft bearings, gearing and measured installation.
- [Saltford Brass Mill, watercourse inspection and penstock repair](https://www.brassmill.com/saltford_brass_mill_021.htm) documents dewatering ordinarily flooded culverts to survey and repair a penstock. This argues for safe, physically accessible service provisions, not merely labels placed at underfloor bends.
- [National Park Service, Harpers Ferry tailrace](https://home.nps.gov/articles/harpers-ferry-tailrace.htm) documents subterranean tailrace survey, branches and sedimentation. Its Y-shaped tunnel is evidence that historic subsurface systems need not be visually simple, but makes no claim that our little collector is traversable.

## Three engineering contributions in this change

### 1. Three individually documented and validated gate transmissions

Riftwater has three dry handwheel positions at (10,14), (11,14), (12,14), and three shutter rack ends at (9,11), (10,11), (11,11). We have now authored three *separate* overhead shaft centerlines, each with an assumed 8-foot axis above gallery level, nominal 1.5-inch shaft diameter, two bearing stations, and all six required rock penetrations explicitly declared as sleeved bores. The model rejects a missing sleeve, shared shaft station, mismatched gate, unsupported run, or nonorthogonal segment.

This is a **constructability envelope**, not a calculated torque capacity, real headroom assessment, or gear design. The six sleeves require proof that the masonry can tolerate them. The transmission routes are deliberately absent from the ordinary walkable map; they appear on their own editable technical plate.

### 2. Access to all five bends of the buried water race

The lower centerline has **three** changes of direction in Riftwater, including the turning elbow beneath the eastern wet sump, and **two** in Postern. Each now has a bolted, nominal 1.5-foot cleanout provision directly under a dry gallery hatch or connected to one by a short lower lateral service branch. The eastern turbine sump's buried elbow at (11,11) needs a 7.5-foot lateral cleanout branch to the dry gallery at (13,12), with isolation and dewatering before service. In Riftwater, the downstream bend under the middle handwheel **cannot** have a workable hatch at that same floor location. Instead, a separately authored 7.5-foot lower inspection spur leads to the accessible corridor at (13,13). The second Riftwater bend has a direct cover at (6,14).

Postern's turns at (6,1) and (9,1) now have direct inspection covers. The latter was originally buried under solid rock: a one-cell service niche now opens from (8,1) to (9,1), creating a real corridor approach rather than an invented access label. These covers are closed and do not create additional pedestrian portals. Inspection points are maintenance features, **not** crawlable dungeon shafts.

Both validators reject absent bend service, obstructed covers, crossing of main collector by a service branch, or cutting an occupied room footprint. These checks use a 2.5-foot plan grid, not a dimensioned excavation, and assume a sealed cleanout riser. Depth and cleaning equipment are not resolved.

### 3. Editable construction-focused vector plate and map-level symbols

The generated [maintenance plate](../examples/riftwater_maintenance_plate.svg) separates actual surface occupation, three overhead centerlines, rock sleeves, bearing stations, controlled vertical racks, and lower maintenance provision. Individual components are in separate named vector groups, permitting later mechanical and cartographic refinement. The main [Riftwater](../tiles/riftwater_lock.svg) and [Postern](../tiles/postern_bastion.svg) maps depict accessible hatch covers only; overhead hardware is not misrepresented as walking corridors.

## Remaining risks and recommended priorities

1. **Mechanical research and proof:** obtain measured archival installation drawings, choose shaft materials, gearing, brakes, bearing span and sleeve details; test a shaft torque and support-load envelope before drawing a claim of safe operation.
2. **Lower-level dimensions:** establish crown thickness, invert-to-floor separation, cleanout riser drop, bearing on vault footings, arch support and sediment removal path. A bolted 1.5-foot cleanout is not an access passage.
3. **Receiver outfall and backwater:** Postern ends at (9,8) without an engineered discharge. Verify that a lower river/ditch or further modular channel can accept the assumed flows before asserting ventilation and a permanent air break.
4. **Physical drawing review:** verify shaft/bore/cleanout labels and chamber forms on actual prints; optimize the assembled map visual hierarchy, not just minimum digital stroke widths.

**No claim is made that the maps are ready for publication or that the hydraulic mechanisms are engineering-certified.**
