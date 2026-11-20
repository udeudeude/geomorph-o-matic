"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {source}=require("../wide-cave");
const {buildCells}=require("../assemble");
const {doorEdges}=require("../audit");
const {terrainGraph}=require("../terrain");
const {analyzeTile,analyzeAll,plate:rockPlate,distance}=require("../wide-rock-webs");
const {destinations,shortestPath,assess,assessAll,plate:profilePlate}=require("../wide-absolute-walking-profiles");
const tiles=source().tiles;
test("all rock-web assessments derive from occupied, actually separated cave floor",()=>{
 const report=analyzeAll();
 assert.equal(report.tiles.length,3);
 for(const item of report.tiles){
  const tile=tiles.find(t=>t.id===item.tile),floor=buildCells(tile),graph=terrainGraph(floor,doorEdges(tile),tile.terrain,"ordinary","dry");
  assert.equal(item.source_floor_cells,floor.size);
  assert.ok(item.cross_sections.length>8,"substantial geological web audit");
  for(const w of item.cross_sections){
   const [x,y]=w.rock_cell;
   assert.ok(!floor.has(x+","+y),"auditor never calls floor solid rock");
   assert.ok(w.opposite_floor_cells.every(p=>floor.has(p.join(","))));
   assert.equal(w.rock_web_plan_width_feet,2.5);
   assert.equal(w.walking_bypass_half_cells,
    distance(graph,w.opposite_floor_cells[0].join(","),w.opposite_floor_cells[1].join(",")));
   assert.ok(["east-west","north-south"].includes(w.axis));
  }
 }
});
test("rock report identifies consequential thin septa without declaring geological stability",()=>{
 const r=analyzeAll(),braided=r.tiles.find(x=>x.tile==="braided_lava");
 const p=braided.cross_sections.find(s=>s.rock_cell.join(",")==="2,6"&&s.axis==="north-south");
 assert.ok(p&&p.walking_bypass_half_cells>=8);
 assert.ok(r.tiles.find(x=>x.tile==="sagging_sheet").cross_sections.length>15);
 assert.match(JSON.stringify(r),/not engineering|neither rock bearing/i);
 const svg=rockPlate(r);
 assert.equal(rockPlate(r),svg);
 assert.equal((svg.match(/id="rock-web-review-/g)||[]).length,3);
 assert.ok((svg.match(/data-rock-web=/g)||[]).length>20);
 assert.match(svg,/prediction of roof collapse/i);
});
test("two relict chambers now preserve genuine five-foot rock webs without faking passage closures",()=>{
 const cave=tiles.find(t=>t.id==="braided_lava"),floor=buildCells(cave);
 for(const x of [3,17]){
  assert.ok(floor.has(x+",9")&&floor.has(x+",12"));
  assert.ok(!floor.has(x+",10")&&!floor.has(x+",11"),"two whole 2.5-foot solid rock cells separate the passages");
 }
 assert.equal(floor.size,185);
});
test("shortest path never crosses nonexistent or unconnected source floor",()=>{
 const tile=tiles[0],floor=buildCells(tile),graph=terrainGraph(floor,doorEdges(tile),tile.terrain,"ordinary","dry");
 assert.deepEqual(shortestPath(graph,"4,0","4,0"),["4,0"]);
 assert.throws(()=>shortestPath(graph,"1,1","4,0"),/not occupied/);
 assert.throws(()=>shortestPath(new Map([["4,0",[]],["4,1",[]]]),"4,0","4,1"),/No traversable/);
});
test("all three absolute profiles follow genuine dry edges and source roof and floor elevations",()=>{
 const result=assessAll();
 assert.equal(result.profiles.length,3);
 for(const r of result.profiles){
  const tile=tiles.find(t=>t.id===r.tile),floor=buildCells(tile);
  const graph=terrainGraph(floor,doorEdges(tile),tile.terrain,"ordinary","dry");
  assert.deepEqual(r.endpoints.start,[4,0]);
  assert.equal(r.endpoints.end.join(","),destinations[r.tile].at);
  assert.ok(r.stations.length>10);
  assert.equal(r.route_length_feet,(r.stations.length-1)*2.5);
  assert.equal(r.stations[0].roof_z_feet,6.5);
  for(let i=0;i<r.stations.length;i++){
   const s=r.stations[i],p=s.cell.join(",");
   assert.ok(floor.has(p));
   assert.ok(s.roof_z_feet-s.floor_z_feet>=2.5);
   if(i){
    const previous=r.stations[i-1].cell.join(",");
    assert.ok(graph.get(previous).includes(p),"genuine traversable edge "+previous+" to "+p);
   }
  }
 }
 const sheet=result.profiles.find(p=>p.tile==="sagging_sheet");
 assert.ok(sheet.real_stair_crossings>0);
 assert.equal(sheet.ascent_feet,1);
 assert.equal(sheet.stations.at(-1).local_clearance_feet,5.5);
 assert.equal(result.profiles.find(p=>p.tile==="braided_lava").ascent_feet,0);
});
test("wrong geology, nonexistent destinations and manuscript report mistakes cannot pass",()=>{
 const tile=tiles.find(t=>t.id==="sagging_sheet");
 assert.throws(()=>assess(tile,{at:"0,0",feature:"phantom"}),/not occupied/);
 const altered=structuredClone(tile);
 altered.roof_scenario.absolute_vault.zones[0].roof_elevation_feet=8.5;
 assert.throws(()=>assess(altered),/Absolute vault|abrupt|Invalid/);
});
test("registered vertical plate exposes the actual path, roof, floor and stair marks in distinct editable layers",()=>{
 const r=assessAll(),svg=profilePlate(r);
 assert.equal(profilePlate(r),svg);
 assert.equal((svg.match(/data-absolute-roof=/g)||[]).length,3);
 assert.equal((svg.match(/data-absolute-floor=/g)||[]).length,3);
 assert.ok((svg.match(/data-plan-route=/g)||[]).length>30);
 assert.ok((svg.match(/data-authored-stair=/g)||[]).length>0);
 assert.match(svg,/UNFOLDED PATH, NOT STRAIGHT SECTION/);
});
