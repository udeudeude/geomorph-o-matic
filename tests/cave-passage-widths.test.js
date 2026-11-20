"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const {buildCells,edgeMask}=require("../assemble");
const {audit}=require("../audit");
const {crossSection,auditCavePassages,report}=require("../cave-passage-widths");
const data=JSON.parse(fs.readFileSync(path.join(__dirname,"../blueprints.json"),"utf8"));
const get=id=>data.tiles.find(t=>t.id===id);
test("four cave plans register measured narrow joints and passage enlargements",()=>{
 const expected={
  hollow_causeway:{eastern_limestone_squeeze:2.5,eastern_joint_return:5},
  basalt_rift:{western_roof_rib:2.5,eastern_roof_rib:2.5,southern_spur_bypass:2.5},
  lantern_sink:{north_joint_splay:5,east_bedding_eddy:5,south_scree_refuge:7.5},
  scoured_siphon:{upstream_relict_tube:7.5,downstream_relict_tube:5,southern_undercut:10,eastern_backwater:5}
 };
 for(const [id,widths]of Object.entries(expected)){
  const tile=get(id),floor=buildCells(tile),auditReport=audit(tile);
  assert.equal(auditReport.normal_portals_reachable,8);
  assert.equal(auditReport.fully_connected,true);
  const r=auditCavePassages(tile);
  for(const section of r.measured_sections){
   assert.equal(section.clear_feet,widths[section.id],id+" "+section.id);
   assert.equal(section.clear_half_cells*2.5,section.clear_feet);
   for(const [x,y] of [section.from,section.to])assert.equal(floor.get(x+","+y),"hall");
  }
  assert.equal(r.measured_sections.length,Object.keys(widths).length);
  for(let turn=0;turn<4;turn++)for(const side of["N","S","E","W"])
   assert.equal(edgeMask(tile,turn,side),"4,15");
 }
});
test("a cross-section cannot silently include rooms, uncarved rock or invented widths",()=>{
 const owner=buildCells(get("scoured_siphon"));
 assert.throws(()=>crossSection(owner,{id:"invalid",at:[8,0],across:"E-W"}),/must start/);
 assert.throws(()=>crossSection(owner,{id:"invalid",at:[8,3],across:"diagonal"}),/Invalid/);
 assert.deepEqual(crossSection(owner,{id:"tube",at:[8,3],across:"E-W"}).from,[7,3]);
 assert.deepEqual(crossSection(owner,{id:"tube",at:[8,3],across:"E-W"}).to,[9,3]);
 assert.equal(owner.get("6,4"),"old_tube");
 assert.equal(crossSection(owner,{id:"tube",at:[8,3],across:"E-W"}).clear_feet,7.5);
});
test("clearance report is deterministic and explicitly refuses survey-grade inference",()=>{
 const a=report(data),b=report(data);
 assert.deepEqual(a,b);
 assert.equal(a.cave_tiles.length,data.tiles.filter(t=>t.wall_style==="cavern").length);
 assert.ok(a.cave_tiles.every(t=>t.standard_seam_throat_feet===2.5));
 assert.match(JSON.stringify(a),/not instrument-surveyed/);
 assert.throws(()=>auditCavePassages(get("fallen_choir")),/Only natural-cave/);
});
