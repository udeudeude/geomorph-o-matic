"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {source}=require("../wide-cave");
const {buildCells}=require("../assemble");
const {roofModel}=require("../wide-headroom");
const {cuts,assessCut,assessAll,sectionSvg,floorLine}=require("../wide-transverse-sections");
const {terrainModel}=require("../terrain");
const {inspectCrowns}=require("../wide-seam-crowns");
const fs=require("node:fs"),path=require("node:path");
const tiles=source().tiles;
const key=([x,y])=>x+","+y;
test("three distinct real plan cuts register to one physical model datum",()=>{
 const r=assessAll(tiles);
 assert.deepEqual(r.sections.map(x=>x.sampled_cells),[6,5,7]);
 assert.deepEqual(r.sections.map(x=>x.tile),["braided_lava","sagging_sheet","split_spine"]);
 for(const s of r.sections){
  const tile=tiles.find(t=>t.id===s.tile),floor=buildCells(tile);
  const roof=roofModel(floor,tile.roof_scenario,tile.seam_profile,tile.terrain);
  assert.equal(s.actual_floor_cells,floor.size);
  assert.equal(s.horizontal_extent_feet,s.sampled_cells*2.5);
  for(const p of s.samples){
   const k=key(p.cell);
   assert.ok(floor.has(k));
   assert.equal(roof.floor_elevations_feet.get(k),p.floor_z_feet);
   assert.equal(roof.absolute_roof_elevations_feet.get(k),p.roof_z_feet);
   assert.equal(p.roof_z_feet-p.floor_z_feet,p.local_clearance_feet);
  }
 }
});
test("bench cut crosses two actual double-riser stone stair edges with a real elevated floor",()=>{
 const s=assessCut(cuts[1],tiles),tile=tiles[1],model=terrainModel(buildCells(tile),tile.terrain);
 assert.equal(s.registered_steps.length,2);
 assert.deepEqual(s.samples.map(p=>p.floor_z_feet),[0,1,1,1,0]);
 assert.deepEqual(s.samples.map(p=>p.roof_z_feet),[7,7,7.5,7,7]);
 for(const step of s.registered_steps){
  assert.equal(step.rise_feet,1);
  assert.equal(step.risers,2);
  assert.ok(model.steps.has(step.edge.map(key).sort().join("|")));
 }
 assert.ok(floorLine(s.samples,200,300,52.5).includes("L"));
});
test("braided and split-spine profiles show independently designed asymmetric vault crowns",()=>{
 const braided=assessCut(cuts[0],tiles),spine=assessCut(cuts[2],tiles);
 assert.ok(braided.samples.some(p=>p.roof_z_feet===9));
 assert.ok(spine.samples.some(p=>p.roof_z_feet===8.5));
 assert.notDeepEqual(braided.samples.map(p=>p.roof_z_feet),spine.samples.map(p=>p.roof_z_feet));
});
test("section generator rejects fictitious rock crossings and out-of-bounds cuts",()=>{
 assert.throws(()=>assessCut({...cuts[0],x1:0},tiles),/unoccupied rock/);
 assert.throws(()=>assessCut({...cuts[2],row:3,x1:0},tiles),/unoccupied rock/);
 assert.throws(()=>assessCut({...cuts[1],x2:20},tiles),/Invalid plan/);
 const altered=structuredClone(tiles),target=altered.find(t=>t.id==="sagging_sheet");
 target.roof_scenario.absolute_vault.zones[0].roof_elevation_feet=9;
 assert.throws(()=>assessCut(cuts[1],altered),/abrupt|Absolute vault|Invalid/);
});
test("editable plan and all three cross-sections are deterministic and separate from cave masters",()=>{
 const report=assessAll(tiles),svg=sectionSvg(report,tiles);
 assert.equal(sectionSvg(report,tiles),svg);
 assert.equal((svg.match(/data-cut-cell=/g)||[]).length,18);
 assert.equal((svg.match(/data-profile-sample=/g)||[]).length,18);
 assert.equal((svg.match(/data-section-roof=/g)||[]).length,3);
 assert.equal((svg.match(/data-section-floor=/g)||[]).length,3);
 assert.equal((svg.match(/data-section-step=/g)||[]).length,2);
 assert.match(svg,/SCHEMATIC ONLY/);
 const layout=JSON.parse(fs.readFileSync(path.join(__dirname,"../studies/assembly_three_wide_2x2.json"),"utf8"));
 const seams=inspectCrowns(layout);
 assert.equal(seams.checked_crown_pairs,32);
});
