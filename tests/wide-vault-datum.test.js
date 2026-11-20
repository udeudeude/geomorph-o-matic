"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {source}=require("../wide-cave");
const {buildCells}=require("../assemble");
const {roofModel,headroomGraph,POSTURES}=require("../wide-headroom");
const {terrainGraph}=require("../terrain");
const {doorEdges}=require("../audit");
const {distances}=require("../route-analysis");
const {makeSvg}=require("../render");
const {assess,plate}=require("../wide-vault-plate");
const tile=source().tiles.find(t=>t.id==="sagging_sheet");
const model=t=>roofModel(buildCells(t),t.roof_scenario,t.seam_profile,t.terrain);
test("one physical datum describes all eight bench cells with intentionally nonuniform roof",()=>{
 const m=model(tile),heights=m.elevated_bench_cells.map(p=>m.clearances.get(p)).sort();
 assert.equal(heights.length,8);
 assert.deepEqual(heights,[5.5,6,6,6,6,6,6.5,6.5]);
 assert.equal(m.absolute_vault_zones.length,2);
 for(const p of m.elevated_bench_cells)assert.equal(m.floor_elevations_feet.get(p),1);
 for(const z of m.absolute_vault_zones)assert.ok(z.cells.every(p=>m.absolute_roof_elevations_feet.get(p)===z.roof_elevation_feet));
 assert.equal(m.clearances.get("17,13"),5.5);
 assert.equal(m.absolute_roof_elevations_feet.get("17,13"),6.5);
});
test("the locally low east tail changes standing movement without faking new walls",()=>{
 const m=model(tile),owner=buildCells(tile),walk=terrainGraph(owner,doorEdges(tile),tile.terrain,"ordinary","dry");
 const stand=headroomGraph(walk,m,POSTURES.standing),crouch=headroomGraph(walk,m,POSTURES.crouching);
 assert.ok(!stand.has("17,13"));
 assert.ok(crouch.has("17,13"));
 assert.equal(distances(stand,"4,0").size,235);
 assert.equal(distances(crouch,"4,0").size,238);
 for(const o of [4,5,14,15])assert.equal(m.clearances.get(o+",0"),6.5);
});
test("invalid datum, phantom rock, roof discontinuity and altered stairs are rejected",()=>{
 const mutate=cb=>{const t=structuredClone(tile);cb(t);return t};
 for(const t of [
  mutate(t=>{t.roof_scenario.absolute_vault.zones[0].cells[0]=[1,1]}),
  mutate(t=>{t.roof_scenario.absolute_vault.zones[0].roof_elevation_feet=8.5}),
  mutate(t=>{t.roof_scenario.absolute_vault.zones[0].cells[0]=[4,0]}),
  mutate(t=>{t.roof_scenario.absolute_vault.zones[1].cells.push([16,11])}),
  mutate(t=>{t.terrain.steps[0].rise_feet=.5}),
  mutate(t=>{t.roof_scenario.absolute_vault.datum="arbitrary"})
 ])assert.throws(()=>model(t),/Invalid|Absolute vault|registered/);
});
test("editable roof contour is distinct from floor-step and collapse layers",()=>{
 const svg=makeSvg(tile),r=assess(tile),s=plate(r);
 assert.match(svg,/id="absolute-bench-vault"/);
 assert.match(svg,/data-stooped-bench-cell="17,13"/);
 assert.match(svg,/id="lava-bench-steps"/);
 assert.equal(r.floor_count,238);
 assert.equal(r.sections.length,3);
 assert.equal(r.accessible_from_north.standing,235);
 assert.equal((s.match(/data-plan-cell=/g)||[]).length,238);
 assert.equal((s.match(/data-roof-profile=/g)||[]).length,3);
 assert.match(s,/not survey/);
 assert.equal(plate(r),s);
});
