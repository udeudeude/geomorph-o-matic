# 2026-11-19 | Riftwater Lock: lower collection race

Status: **architectural hypothesis**, not a surveyed or hydraulically dimensioned mill. This work corrects a specific inconsistency: three genuinely isolated upper sluice pockets were modeled, but the previous "outfall" marker lived in the eastern pocket. There was no common downstream discharge path.

## Research precedents

1. **Historic England, House Mill, Three Mills:** the archive catalogs measured isometric drawings of the water wheel and *sluice gate winch gear*. This demonstrates that real gate trains deserve explicit mechanical documentation, not merely remote handwheel icons. [Archive MD96/05146](https://historicengland.org.uk/images-books/photos/item/MD96/05146).
2. **National Park Service, Centreville Mill:** the 1881 four-aperture headgate used cast-iron rack-and-pinion controls. Its headrace, turbine chamber, and tailrace were separate masonry-built spaces. The documented headrace was about 30 feet wide and 175 feet long, and the 25-by-35-foot turbine chamber strongly cautions against calling our compact 7.5-foot-wide channel a dimensioned turbine room. [National Register continuation sheet, section 7, p. 12](https://npgallery.nps.gov/GetAsset/296396b2-8241-43fc-abbc-13a7081e3986).
3. **New Hall Mill:** an indoor lever turns a chain drum to raise the outside penstock, a real example of remote mechanical control. It does not validate a specific mechanism for our three handwheels. [Penstock and pentrough](https://www.newhallmill.uk/penstock/).
4. **National Park Service, Harpers Ferry:** archaeological inspection documents an underground tailrace and a Y-shaped convergence. Subfloor drainage can be integral to complex industrial architecture rather than a surface corridor. [Armory Grounds Tailrace](https://home.nps.gov/articles/harpers-ferry-tailrace.htm).

## Authored architecture

- The three upper shutters remain at the edge between rows 10 and 11, independently holding back a 3-cell-wide headrace. Masonry divides the downstream west, center, and east receiving pockets. **Those pockets remain isolated at level 0**.
- Each pocket has exactly one specified vertical water drop at (9,11), (10,11), or (11,11). These drops lead to one **lower collector at assumed level -1**, never to a pedestrian stair or a surface bypass around the gates. Their modeled **vented free-fall air breaks** prevent backflow *only if* the lower race stays unsurcharged. This condition is specified but not proven by hydraulic calculation. A submerged/surcharged shared collector could make the upper pockets communicate and defeat the shutter independence.
- The *ordered* lower channel runs across (9,11) to (11,11), then south along x=11 to (11,18). It comprises ten half-cell stations, nine center-to-center segments, **22.5 feet in plan** at the canonical 2.5-foot half-cell scale. The collection direction is encoded from first to last, not solved by a pressure model. The vector stroke shows a **centerline, not a tunnel diameter or proven structural clearance**.
- The terminus at (11,18) is **inside the tile**, and the continuing outfall beyond this point has NOT been mapped. Importantly, it is **not** an invented ninth edge portal. A future adjacent tile needs an explicit matched lower-level connection before discharge can be said to continue.
- The subsurface gallery passes below the southern service corridor and the buried pressure-vault footprint. Ceiling depth, supports, cover, and collision with foundations are unresolved and **must not** be mistaken for validated engineering.

## Cartographic decision

The normal editable tile map shows three *drop* symbols, not the continuous lower channel (which would falsely suggest a ground-level walkable passage). The accompanying two-plan technical sheet separates the shut upper gate bank from the descending lower collector. Both have independent vector groups and machine-readable gate, pickup, and terminus IDs. Visual inspection exposed the technical plate’s initial empty-grid problem; the revised upper panel includes surrounding floor and carved-rock boundaries, while the lower panel shades the *pressure-vault footprint overhead* to expose the unresolved foundation collision. The upper-only "T" symbol is suppressed when an actual lower collector is authored; its terminus appears only on the lower sheet.

A new JavaScript model rejects discontinuous, branching, duplicated, boundary-crossing or backward-terminating lower geometry. It also checks that every independently flooded sump has exactly one vertical drain and that no upstream water can bypass a shut shutter through a pickup. The independent Python validator repeats these checks; both languages have adversarial regression cases. Water movement in the collector is intentionally one-way.

## Remaining design work, in priority order

1. **Research and dimension the drop shafts, inspection access, sluice winch transmissions and turbine alternatives.** Verify real rack-and-pinion or chain-drum mechanisms against historic drawings, then represent their support shafts and service clearances in section. Without these, handwheels are only operating *locations*.
2. **Complete the downstream continuation.** Author a specialized **matched lower-level seam** for a second geomorph, or an interior outfall with a defended hydraulic head. Calculate plausible invert elevations and clearance from the pressure-vault foundations. Neither discharge volume nor time-to-flood is yet modeled.
3. **Inspect full-size printed nine-tile assemblies and sectional plates.** Check label overlap, line hierarchy and the meaning of hidden-level symbols. Unit tests can verify vector structure and minimum stroke widths but cannot establish perceptual quality.

Do not call the six tiles complete. The underfloor collector solves a real architectural omission while exposing further unmeasured structural dependencies.
