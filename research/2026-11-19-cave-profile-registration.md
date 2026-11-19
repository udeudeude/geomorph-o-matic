# Scoured Siphon: integrated cave plan and passage-profile study

19 November 2026. **Original interpretive dungeon cartography, not a surveyed cave, engineering certification, or finished release.**

## Research and corrections to the design process

1. [National Park Service: Mammoth Cave mapping](https://www.nps.gov/maca/learn/cave-mapping.htm) explains why cave survey plans alone do not communicate passage dimensions. A running profile and local cross sections provide the missing third dimension. **Action:** include explicit section traces in the plan instead of merely placing a tiny +1 on the gallery.
2. [National Speleological Society: Cartographic Salon judging criteria](https://caves.org/salons/cartography-submissions/cartography-judging-criteria/) emphasize intelligible entrances, vertical control, identifiable cross-section lines, coherent portrayal between plan and profile, and a scale bar. **Action:** make the crossing, raised gallery, section lines and modular mouths inspectable side by side. This is *not* an NSS-standard survey, and our illustrative roof profile must never be treated as surveyed vertical control.
3. [Carlsbad Caverns cave-survey standards](https://www.ntc.blm.gov/system/files/legacy/uploads/18922/survey%20standards.pdf) distinguish running profiles from transverse cross sections and require roof and floor variations to be recorded. **Action:** label our plates accurately as *interpretive passage profiles*, not measured cross sections; an authentic transverse section will require explicitly authored lateral width and ceiling data.
4. [Dyson Logos: Vault of the Cave Morphs](https://dysonlogos.blog/2018/06/25/vault-of-the-cave-morphs/) and [The Gallery Cave and Gallery Pit](https://dysonlogos.blog/2023/07/17/the-gallery-cave-the-gallery-pit/) demonstrate imaginative cavern topology and strong vertical spatial relationships, not decorative complexity for its own sake. The plan, elevation studies and linework here are original, with no traced or imported source art.

## Three concrete development improvements

**1. New editorial architectural plate.** The cave-profile.js generator composes the canonical, fully editable Scoured Siphon plan at left with two original passage profiles. The corresponding 16 × 10.25-inch SVG is examples/scoured_siphon_profiles.svg, suited to a 17 × 11-inch sheet at 100% scaling. The plan includes section endpoints and a genuine 10-foot scale bar.

**2. Canonical plan/profile registration.** A–A follows (10,7) through (10,12), cutting through the actual bridged flooded cell (10,9). B–B runs (12,4) through (18,4), crossing the six raised gallery cells and ending on the explicit down-ramp (17,4)–(18,4). The profileSamples function derives occupancy from canonical authored room runs and hall routes, and reads water, bridges and elevations from blueprints.json. It rejects nonwalkable cut cells, unreal ceiling metadata, broken bridge correspondence and an unmodeled vertical jump. The cut lines are annotations only: the tile's eight modular edge mouths are unchanged.

**3. Independent quality controls and reproducibility.** JavaScript tests check sample positions, route conformity, water and bridge alignment, real ramp adjacency, failure modes, deterministic output and nested vector layers. Python tests independently reconstruct the occupied plan cells and assert the cut, gallery and unchanged edge-mouth geometry. GitHub Actions generates and tracks the profile drawing, then parses every SVG as XML and checks reproducibility alongside the other master vectors.

## Interpretation and remaining limitations

- Every fine-grid cell represents 2.5 feet on the *plan*. The displayed water and bridge positions are canonical.
- The profile roof silhouette, assumed ceiling heights, illustrative water depth, exposed bedrock strata and vertical scaling are **not measured**. The art is a proportional explanatory sketch, not proof that there is adequate headroom or bearing strength.
- The bridge is drawn across a one-cell water span in the plan; real bridge abutments and flood clearance need separate engineering and artistic review.
- An actual cave-style transverse section through the keyhole, passage width, flowstone and solutional features is a worthwhile next design study. It should not be invented by rotating an unmeasured profile.
- Both physical-size print inspection and navigational playtesting remain outstanding. The present plate should be evaluated for label collisions, hatch density, visibility of cut markers and whether the gallery reads as a plausible geological shelf.

## Reproduction

    node render.js
    node cave-profile.js examples/scoured_siphon_profiles.svg
    node --test tests/cave-profile.test.js
    PYTHONPATH=. python3 -m unittest discover -s tests -p 'test_*.py'

The generator deliberately rejects a changed Scoured Siphon plan rather than silently drawing obsolete section lines.
