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
test("axial metric recognizes Lantern's genuinely broken northwest shaft",()=>{
 const revised=auditAxes(tile("lantern_sink"));
 assert.ok(revised.longest_run_half_cells<=9,JSON.stringify(revised.runs.slice(0,3)));
 // The earlier northwest tunnel ran uninterrupted for twelve contiguous hall cells.
 const before=structuredClone(tile("lantern_sink"));
 before.routes.find(r=>r.id==="nw").points=[[4,0],[4,1],[6,1],[6,6],[6,8]];
 before.routes.find(r=>r.id==="sw").points=[[4,19],[4,18],[7,18],[7,13],[9,13]];
 const oldShaft=axialRuns(before).find(q=>q.axis==="north-south"&&q.from.join(",")==="6,1");
 assert.ok(oldShaft&&oldShaft.clear_run_half_cells>=8,"Old northern spine was a long, direct dry axis");
 assert.ok(!axialRuns(tile("lantern_sink")).some(q=>q.axis==="north-south"&&q.from.join(",")==="6,1"),
  "The revised shaft must change direction at the rock rib; it cannot remain continuous");
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

test("Hollow Causeway's eastern limestone rib breaks an actual 32.5-foot shaft",()=>{
 const t=tile("hollow_causeway"),floor=buildCells(t),runs=axialRuns(t),graph=terrainGraph(floor,doorEdges(t),t.terrain);
 for(const k of ["14,9","14,10","14,11"])assert.equal(floor.get(k),"hall","Dogleg must be open rock floor: "+k);
 assert.equal(floor.has("13,10"),false,"The limestone rib must genuinely occupy the old straight shaft");
 assert.equal(auditAxes(t).longest_run_half_cells,8,"The former 13-cell shaft must not survive another route");
 assert.ok(!runs.some(r=>r.axis==="north-south"&&r.from[0]===13&&r.from[1]<=6&&r.to[1]>=18));
 assert.ok(distances(graph,"19,15").has("13,8"),"Eastern mouth still reaches the rift without walking across flooded rock");
 assert.equal(audit(t).normal_portals_reachable,8);
 assert.equal(audit(t).fully_connected,true);
 for(let turn=0;turn<4;turn++)for(const side of ["N","E","S","W"])assert.equal(edgeMask(t,turn,side),"4,15");
});
test("Basalt Rift has two real offset upper passages and a southern basalt spur",()=>{
 const t=tile("basalt_rift"),floor=buildCells(t),runs=axialRuns(t),graph=terrainGraph(floor,doorEdges(t),t.terrain);
 for(const k of ["8,8","13,8","7,18"])assert.equal(floor.get(k),"hall","The new basalt passage must be traversable: "+k);
 for(const k of ["8,9","13,9","7,17"])assert.equal(floor.has(k),false,"The rock rib must not merely be a decorative line: "+k);
 assert.equal(auditAxes(t).longest_run_half_cells,10,"Both former 12-cell east-west strips must be broken");
 assert.ok(!runs.some(r=>r.axis==="east-west"&&r.from[1]===9&&r.from[0]<=5&&r.to[0]>=16));
 assert.ok(!runs.some(r=>r.axis==="east-west"&&r.from[1]===17&&r.from[0]<=4&&r.to[0]>=15));
 assert.ok(distances(graph,"0,4").has("19,4"),"The two upper basalt passages must still meet");
 assert.ok(distances(graph,"4,19").has("15,19"),"The lower rock-spur bypass must remain traversable");
 const checked=audit(t);
 assert.equal(checked.normal_portals_reachable,8);
 assert.equal(checked.fully_connected,true);
 assert.ok(checked.hall_cycle_rank>=3);
 for(let turn=0;turn<4;turn++)for(const side of ["N","E","S","W"])assert.equal(edgeMask(t,turn,side),"4,15");
});
