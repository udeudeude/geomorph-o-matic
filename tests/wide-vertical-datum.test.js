"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const {source}=require("../wide-cave");
const {buildCells}=require("../assemble");
const {assessBench,plate,CANDIDATE_RISES,DESIGN_GRADE_LIMIT_PERCENT}=require("../wide-vertical-datum");
const {analyzePostures}=require("../wide-posture-assembly");
const data=source(),sheet=data.tiles.find(t=>t.id==="sagging_sheet");
const layout=JSON.parse(fs.readFileSync(path.join(__dirname,"../studies/assembly_three_wide_2x2.json"),"utf8"));

test("sheetflow vertical sensitivities register to all 8 authored raised cells and all 3 access edges",()=>{
 const r=assessBench(sheet);
 assert.equal(r.raised_floor_cells.length,8);
 assert.equal(r.grade_edges.length,3);
 assert.equal(r.design_comparison_grade_limit_percent,12.5);
 const owner=buildCells(sheet),raised=new Set(r.raised_floor_cells.map(p=>p.join(",")));
 for(const cell of r.raised_floor_cells)assert.ok(owner.has(cell.join(",")));
 for(const edge of r.grade_edges){
   const [a,b]=[edge.from,edge.to].map(p=>p.join(","));
   assert.ok(owner.has(a)&&owner.has(b));
   assert.notEqual(raised.has(a),raised.has(b));
   assert.equal(edge.plan_run_feet,2.5);
   assert.equal(Math.abs(edge.from[0]-edge.to[0])+Math.abs(edge.from[1]-edge.to[1]),1);
 }
});
test("grade sensitivity distinguishes 3-inch grade from 1-2-foot unsupported ramp assumptions",()=>{
 const r=assessBench(sheet);
 assert.deepEqual(CANDIDATE_RISES,[0.25,0.5,1,2]);
 assert.deepEqual(r.candidates.map(s=>s.grade_per_single_2_5ft_transition_percent),[10,20,40,80]);
 assert.deepEqual(r.candidates.map(s=>s.grade_exceeds_study_limit),[false,true,true,true]);
 assert.deepEqual(r.candidates.map(s=>s.implied_raised_floor_headroom_feet_if_roof_crown_stays_fixed),
  [6.25,6,5.5,4.5]);
 assert.equal(DESIGN_GRADE_LIMIT_PERCENT,12.5);
 assert.match(r.alternative_fixed_roof_hypothesis,/not encoded in the master/);
});
test("datum verifier detects fictional access edges or displaced low-ceiling zones",()=>{
 const lost=structuredClone(sheet);lost.terrain.ramps.pop();
 assert.throws(()=>assessBench(lost),/Changed bench topology/);
 const displaced=structuredClone(sheet);
 displaced.roof_scenario.zones[0].cells=[[15,11],[16,11]];
 assert.throws(()=>assessBench(displaced),/Raised bench intersects/);
 assert.throws(()=>assessBench(sheet,[0,1]),/Candidate bench rises/);
});
test("editable bench engineering plate has actual registered cell geometry and candid caveats",()=>{
 const r=assessBench(sheet),art=plate(r);
 assert.equal(art,plate(r));
 assert.match(art,/id="registered-plan"/);
 assert.match(art,/id="raised-bench"/);
 assert.match(art,/id="registered-grade-edges"/);
 for(const p of r.raised_floor_cells)assert.ok(art.includes('data-bench-cell="'+p.join(",")+'"'));
 for(let i=1;i<=3;i++)assert.ok(art.includes('data-transition="'+i+'"'));
 assert.match(art,/not a measured cave/);
});
test("posture-aware mixed layout checks every rotated seam and all exterior mouths",()=>{
 const r=analyzePostures(layout,data);
 assert.equal(r.all_walkable_floor_cells,871);
 assert.equal(r.tile_count,4);
 assert.equal(r.distinct_designs.length,3);
 assert.equal(r.full_width_intertile_walking_edges,16);
 assert.equal(r.exterior_mouth_floor_cells,32);
 for(const mode of ["standing","crouching","crawling"]){
   const m=r.hypothetical_modes[mode];
   assert.equal(m.reachable_exterior_mouth_cells,32);
   assert.equal(m.exterior_mouth_pairs_connected,496);
   assert.equal(m.closures.length,4);
   assert.ok(m.reachable_floor_cells<=m.floor_cells_admitted);
 }
 assert.equal(r.hypothetical_modes.crawling.reachable_floor_cells,871);
 assert.ok(r.hypothetical_modes.standing.floor_cells_admitted<=863);
 assert.ok(r.hypothetical_modes.standing.reachable_floor_cells<871);
});
test("posture-aware graphs are rotation-safe and reject low ceiling at an external wide mouth",()=>{
 const rotated=structuredClone(layout);
 for(const row of rotated.rows)for(const cell of row)cell.turn=(cell.turn+1)%4;
 const r=analyzePostures(rotated,data);
 assert.equal(r.hypothetical_modes.crawling.reachable_floor_cells,871);
 assert.equal(r.hypothetical_modes.standing.reachable_exterior_mouth_cells,32);
 const broken=structuredClone(data),tile=broken.tiles.find(t=>t.id==="braided_lava");
 tile.roof_scenario.zones[0].cells=[[4,0],[5,0]];
 assert.throws(()=>analyzePostures(layout,broken),/Low roof|Invalid/);
});
