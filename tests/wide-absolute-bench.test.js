"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {source}=require("../wide-cave");
const {buildCells}=require("../assemble");
const {doorEdges}=require("../audit");
const {terrainGraph}=require("../terrain");
const {assess,plate,walkTo}=require("../wide-absolute-bench");
const tile=source().tiles.find(t=>t.id==="sagging_sheet");
const key=p=>p.join(",");
test("one consistent vertical datum distinguishes raised floor from local headroom",()=>{
 const r=assess(tile),fixed=r.hypotheses.fixed,lifted=r.hypotheses.lifted;
 assert.equal(r.elevated_floor_cells.length,8);
 assert.equal(r.mouths_checked,16);
 assert.equal(r.adopted_for_gameplay,false);
 assert.equal(fixed.bench_floor_elevation_feet,1);
 assert.equal(fixed.bench_roof_elevation_feet,6.5);
 assert.equal(fixed.bench_local_clearance_feet,5.5);
 assert.equal(lifted.bench_roof_elevation_feet,7.5);
 assert.equal(lifted.bench_local_clearance_feet,6.5);
 assert.equal(fixed.modes.standing.elevated_bench_cells_admitted,0);
 assert.equal(lifted.modes.standing.elevated_bench_cells_admitted,8);
 assert.equal(fixed.modes.crouching.elevated_bench_cells_admitted,8);
 for(const mode of ["fixed","lifted"]){
  assert.equal(r.hypotheses[mode].modes.standing.reachable_wide_mouth_cells,16);
  assert.equal(r.hypotheses[mode].modes.crawling.reachable_cells,238);
 }
});
test("each independently located basalt step leads from north mouth via real dry floor edges",()=>{
 const r=assess(tile),owner=buildCells(tile);
 const graph=terrainGraph(owner,doorEdges(tile),tile.terrain,"ordinary","dry");
 assert.equal(r.approaches.length,3);
 assert.equal(new Set(r.approaches.map(a=>key(a.raised_cell))).size,3);
 for(const a of r.approaches){
  assert.equal(a.rise_feet,1);assert.equal(a.risers,2);assert.equal(a.tread_depth_feet,1.25);
  assert.equal(a.samples[a.step_sample_index-1].floor_elevation_feet,0);
  assert.equal(a.samples[a.step_sample_index].floor_elevation_feet,1);
  for(let i=1;i<a.samples.length;i++){
   assert.ok(graph.get(key(a.samples[i-1].cell)).includes(key(a.samples[i].cell)));
  }
  assert.equal(a.samples[a.step_sample_index].fixed_local_clearance_feet,5.5);
  assert.equal(a.samples[a.step_sample_index].lifted_local_clearance_feet,6.5);
  assert.ok(a.entrance_to_lower_route_feet>0);
 }
});
test("roof solutions reject unregistered steps, invented mouths, displaced low ceilings and nonroutes",()=>{
 const missing=structuredClone(tile);missing.terrain.steps.pop();
 assert.throws(()=>assess(missing),/Changed one-foot bench/);
 const wrong=structuredClone(tile);wrong.terrain.steps[0].rise_feet=.5;
 assert.throws(()=>assess(wrong),/two 0.5-foot/);
 const overlap=structuredClone(tile);
 overlap.roof_scenario.zones[0].cells=[[15,11],[16,11]];
 assert.throws(()=>assess(overlap),/Bench and low-roof/);
 assert.throws(()=>walkTo(new Map([["4,0",[]]]),"4,0","15,12"),/not reachable/);
});
test("editable SVG is deterministic, follows registered step cells and declares cave uncertainty",()=>{
 const r=assess(tile),svg=plate(r);
 assert.equal(svg,plate(r));
 assert.match(svg,/ABSOLUTE FLOOR AND ROOF DATUM/);
 for(const a of r.approaches){
  for(const id of ["data-real-stair","data-floor-profile","data-fixed-roof","data-lifted-roof"])
   assert.ok(svg.includes(id+'="'+a.id+'"'));
 }
 for(const p of r.elevated_floor_cells)assert.ok(svg.includes('data-bench-cell="'+key(p)+'"'));
 assert.match(svg,/no measured elevation/);
});
