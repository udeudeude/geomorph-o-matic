"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const {buildCells}=require("../assemble"),{doorEdges}=require("../audit");
const {floodStages,floodAudit}=require("../flood-stages");
const {sectionPlate}=require("../section-plates");
const rift=JSON.parse(fs.readFileSync(path.join(__dirname,"../blueprints.json"),"utf8")).tiles.find(t=>t.id==="riftwater_lock");
const owner=buildCells(rift),doors=doorEdges(rift);
test("authored flood stages are cumulative, reachable, and preserve edge portals",()=>{
 const stages=floodStages(owner,doors,rift.terrain,rift.hydrology);
 assert.deepEqual([...stages.keys()],["normal","surge"]);
 assert.equal(stages.get("normal").terrain.water.length,6);
 assert.equal(stages.get("surge").terrain.water.length,9);
 assert.equal(stages.get("surge").new_cells,3);
 const report=floodAudit(owner,doors,rift.terrain,rift.vertical,rift.hydrology);
 assert.equal(report.length,2);
 assert.equal(report[0].reachable_portals,8);
 assert.equal(report[1].reachable_portals,8);
 assert.ok(report[1].turbine_lower_north_south===null||
  report[1].turbine_lower_north_south>report[0].turbine_lower_north_south);
 assert.ok(report[1].accessible_base_cells<=report[0].accessible_base_cells);
});
test("flood contract rejects disconnected, repeated, and boundary water cells",()=>{
 const bad=[
  [{id:"surge",add_water:[[18,18]]}],
  [{id:"surge",add_water:[[9,11],[9,11]]}],
  [{id:"normal",add_water:[[9,11]]}],
  [{id:"surge",add_water:[[4,0]]}],
  [{id:"surge",add_water:[[99,99]]}],
  [{id:"surge",add_water:[[9,9]]}],
 ];
 for(const stages of bad)assert.throws(()=>floodStages(owner,doors,rift.terrain,{stages}));
});
test("two plans and their section have editable groups and identical repeated outputs",()=>{
 const svg=sectionPlate(rift,{row:10});
 for(const id of ["lower-plan","upper-plan","lower-floor-projection","upper-deck-surfaces","upper-plan-links","section"])
  assert.ok(svg.includes('id="'+id+'"'),id);
 assert.equal((svg.match(/<circle cx=/g)||[]).length,2);
 assert.match(svg,/schematic, not vertically to scale/);
 assert.ok(svg.includes('M352 54h44'));
 assert.equal(svg,sectionPlate(rift,{row:10}));
});
test("section refuses boundary rows, empty cut and unmodeled decks",()=>{
 assert.throws(()=>sectionPlate(rift,{row:0}));
 assert.throws(()=>sectionPlate(rift,{row:8}));
 assert.throws(()=>sectionPlate({...rift,vertical:{}},{row:10}));
});
