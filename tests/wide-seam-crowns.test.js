"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const {source}=require("../wide-cave");
const {inspectCrowns}=require("../wide-seam-crowns");
const {terrainModel,terrainGraph,terrainSvg}=require("../terrain");
const {buildCells}=require("../assemble");
const {doorEdges}=require("../audit");
const {distances}=require("../route-analysis");
const layout=JSON.parse(fs.readFileSync(path.join(__dirname,"../studies/assembly_three_wide_2x2.json"),"utf8"));
test("the four rotated intertile seams match vertical datum throughout all five-foot throats",()=>{
 const r=inspectCrowns(layout);
 assert.equal(r.checked_intertile_seams,4);
 assert.equal(r.checked_crown_pairs,32);
 assert.equal(r.checked_exterior_throat_cells,64);
 assert.equal(r.common_mouth_crown_feet,6.5);
 assert.equal(r.inward_envelope_depth_feet,5);
 assert.ok(r.seams.every(s=>s.checked_pairs===8&&s.crown_feet===6.5));
});
test("crown contract survives another rotation and refuses unregistered roof changes",()=>{
 const rotated=structuredClone(layout);
 for(const row of rotated.rows)for(const c of row)c.turn=(c.turn+1)%4;
 assert.equal(inspectCrowns(rotated).checked_crown_pairs,32);
 const mismatched=source();
 mismatched.tiles.find(t=>t.id==="braided_lava").roof_scenario.mouth_crown_feet=7;
 assert.throws(()=>inspectCrowns(layout,mismatched),/Vertical seam crown mismatch|Exterior wide mouth|Absolute vault changes the modular throat datum/);
 const malformed=source();
 malformed.tiles.find(t=>t.id==="sagging_sheet").roof_scenario.mouth_crown_feet=8;
 assert.throws(()=>inspectCrowns(layout,malformed),/Invalid hypothetical roof scenario/);
});
test("one-foot sheetflow bench is reached via three real two-riser stepways, never by phantom ledge climbing",()=>{
 const tile=source().tiles.find(t=>t.id==="sagging_sheet");
 const owner=buildCells(tile),model=terrainModel(owner,tile.terrain),svg=terrainSvg(owner,tile.terrain).join("");
 assert.equal(model.steps.size,3);
 assert.equal(model.ramps.size,0);
 assert.equal(svg.match(/data-step-edge=/g).length,6);
 assert.match(svg,/id="lava-bench-steps"/);
 assert.equal([...model.steps.values()].reduce((n,v)=>n+v.risers,0),6);
 const graph=terrainGraph(owner,doorEdges(tile),tile.terrain);
 assert.equal(distances(graph,"4,0").size,238);
 assert.ok(!graph.get("17,11").includes("18,11"));
 assert.ok(distances(terrainGraph(owner,doorEdges(tile),{...tile.terrain,steps:[]}),"4,0").size<238);
});
test("step specification rejects unsafe fictional risers, overlaps and disconnected edges",()=>{
 const tile=source().tiles.find(t=>t.id==="sagging_sheet"),floor=buildCells(tile);
 for(const bad of [
  {...tile.terrain,steps:[{...tile.terrain.steps[0],rise_feet:2}]},
  {...tile.terrain,steps:[...tile.terrain.steps,tile.terrain.steps[0]]},
  {...tile.terrain,ramps:[tile.terrain.steps[0].edge]},
  {...tile.terrain,steps:[{...tile.terrain.steps[0],risers:0}]},
  {...tile.terrain,steps:[{...tile.terrain.steps[0],edge:[[15,12],[19,12]]}]}
 ])assert.throws(()=>terrainModel(floor,bad));
});
