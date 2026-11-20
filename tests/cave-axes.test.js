"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const {axialRuns,auditAxes,report}=require("../cave-axes");
const {buildCells,edgeMask}=require("../assemble");
const {doorEdges,audit}=require("../audit");
const {terrainGraph}=require("../terrain");
const {distances}=require("../route-analysis");
const data=JSON.parse(fs.readFileSync(path.join(__dirname,"../blueprints.json"),"utf8"));
const tile=id=>data.tiles.find(t=>t.id===id);
test("rewritten cave approaches are genuine rock-floor geometry, not SVG decoration",()=>{
 const cuts={
  scoured_siphon:{floor:["7,17","9,16","11,18","11,16"],rock:["8,14","8,15","8,18","12,17"]},
  lantern_sink:{floor:["7,2","7,3","8,15"],rock:["6,3","7,18"]}
 };
 for(const [id,{floor,rock}] of Object.entries(cuts)){
  const t=tile(id),owner=buildCells(t),doors=doorEdges(t),graph=terrainGraph(owner,doors,t.terrain);
  for(const p of floor)assert.equal(owner.get(p),"hall",id+": "+p+" must be a real passage");
  for(const p of rock)assert.equal(owner.has(p),false,id+": "+p+" must remain real rock");
  assert.equal(audit(t).normal_portals_reachable,8);
  assert.equal(audit(t).fully_connected,true);
  assert.equal(distances(graph,"4,0").has("15,19"),true,"Dry route across revised "+id);
  for(let turn=0;turn<4;turn++)for(const side of ["N","E","S","W"])
   assert.equal(edgeMask(t,turn,side),"4,15");
 }
});
test("axial metric recognizes Lantern's genuine dogleg rather than hiding straightness with curves",()=>{
 const revised=auditAxes(tile("lantern_sink"));
 assert.ok(revised.longest_run_half_cells<=9,JSON.stringify(revised.runs.slice(0,3)));
 // The earlier northwest tunnel ran uninterrupted for twelve contiguous hall cells.
 const before=structuredClone(tile("lantern_sink"));
 before.routes.find(r=>r.id==="nw").points=[[4,0],[4,1],[6,1],[6,6],[6,8]];
 before.routes.find(r=>r.id==="sw").points=[[4,19],[4,18],[7,18],[7,13],[9,13]];
 assert.ok(auditAxes(before).longest_run_half_cells>=12);
 assert.ok(auditAxes(before).longest_run_half_cells>revised.longest_run_half_cells);
});
test("rockfall, not merely its illustration, splits a formerly continuous straight run",()=>{
 const t=tile("scoured_siphon"),r=axialRuns(t,{minCells:2});
 assert.ok(r.some(q=>q.axis==="north-south"&&q.from[0]===1&&q.from[1]<=10));
 assert.ok(!r.some(q=>q.axis==="north-south"&&q.from[0]===1&&q.from[1]<=10&&q.to[1]>=11),
  "West rockfall must divide straight travel at the canonical blocked edge");
 assert.equal(r.every(q=>q.plan_length_feet===q.clear_run_half_cells*2.5),true);
 assert.throws(()=>axialRuns(t,{minCells:0}),/minimum/);
 assert.throws(()=>axialRuns(tile("fallen_choir")) ,/cavern/);
});
test("all cave-axis reports are stable and explicitly limited to fictional plan geometry",()=>{
 assert.deepEqual(report(data),report(data));
 const studies=report(data).cave_tiles;
 assert.equal(studies.length,data.tiles.filter(t=>t.wall_style==="cavern").length);
 for(const t of studies){
  assert.ok(t.longest_run_half_cells>=4);
  assert.ok(t.runs.every(r=>r.clear_run_half_cells>=4));
  assert.match(t.interpretation,/not instrument-surveyed/);
 }
});
