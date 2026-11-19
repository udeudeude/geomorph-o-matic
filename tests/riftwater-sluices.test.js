"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const {buildCells}=require("../assemble"),{doorEdges}=require("../audit");
const {gateModel,applyGateStates,hydraulicGraph}=require("../hydraulic-control");
const {floodStages,floodAudit}=require("../flood-stages");
const {makeSvg}=require("../render");
const {printScaleAudit}=require("../print-review");
const tiles=JSON.parse(fs.readFileSync(path.join(__dirname,"../blueprints.json"),"utf8")).tiles;
const rift=tiles.find(t=>t.id==="riftwater_lock"),owner=buildCells(rift),doors=doorEdges(rift);
test("three contiguous sluices seal the entire downstream turbine basin",()=>{
 const gates=gateModel(owner,doors,rift.hydrology.gates);
 assert.equal(gates.length,3);
 assert.deepEqual(rift.hydrology.gates.map(g=>g.a),[[9,10],[10,10],[11,10]]);
 assert.deepEqual(rift.hydrology.gates.map(g=>g.b),[[9,11],[10,11],[11,11]]);
 const sealed=hydraulicGraph(owner,doors,gates,applyGateStates(gates));
 for(const x of [9,10,11])assert.ok(!sealed.get(x+",10").includes(x+",11"));
 assert.throws(()=>floodStages(owner,doors,rift.terrain,{
  ...rift.hydrology,stages:[{id:"surge",add_water:[[9,11],[10,11],[11,11]],surface_level:1}]
 }),/hydraulic path/);
});
test("distinct sluice pockets flood in a deliberate three-step release",()=>{
 const stages=floodStages(owner,doors,rift.terrain,rift.hydrology);
 assert.equal(stages.get("normal").terrain.water.length,6);
 assert.equal(stages.get("west_release").terrain.water.length,7);
 assert.equal(stages.get("center_release").terrain.water.length,8);
 assert.equal(stages.get("surge").terrain.water.length,9);
 assert.deepEqual(stages.get("normal").closed_gates,["west_shutter","center_shutter","east_shutter"]);
 assert.deepEqual(stages.get("west_release").closed_gates,["center_shutter","east_shutter"]);
 assert.deepEqual(stages.get("center_release").closed_gates,["east_shutter"]);
 assert.deepEqual(stages.get("surge").closed_gates,[]);
 assert.deepEqual(stages.get("surge").gate_states,{west_shutter:"open",center_shutter:"open",east_shutter:"open"});
 assert.equal(floodAudit(owner,doors,rift.terrain,rift.vertical,rift.hydrology)[1].reachable_portals,8);
});
test("vector master and surge sheet depict correct gate states in editable layers",()=>{
 const normal=makeSvg(rift),stage=floodStages(owner,doors,rift.terrain,rift.hydrology).get("surge");
 const scenario={...rift,terrain:stage.terrain,hydrology:{...rift.hydrology,render_gate_states:stage.gate_states}};
 const surge=makeSvg(scenario);
 assert.match(normal,/id="sluice-gates"/);
 assert.equal((normal.match(/data-state="closed"/g)||[]).length,3);
 assert.equal((surge.match(/data-state="closed"/g)||[]).length,0);
 assert.equal((surge.match(/data-state="open"/g)||[]).length,3);
 assert.match(surge,/data-gate-id="center_shutter" data-state="open"/);
 assert.equal(surge,makeSvg(scenario));
 assert.throws(()=>makeSvg({...rift,hydrology:{...rift.hydrology,render_gate_states:{not_a_gate:"open"}}}),/Unknown gate/);
});
test("printed five-foot grids omit drafting hairlines; half-grid remains optional",()=>{
 for(const t of tiles){
  const standard=makeSvg(t),draft=makeSvg(t,{grid:"half"});
  assert.match(standard,/id="grid" data-grid="full"/);
  assert.match(draft,/id="grid" data-grid="half"/);
  assert.ok((draft.match(/stroke-width=".5"/g)||[]).length>(standard.match(/stroke-width=".5"/g)||[]).length);
  assert.equal(printScaleAudit(t).strokes_below_0_15_mm,0,t.id);
 }
 assert.throws(()=>makeSvg(rift,{grid:"none"}),/Invalid map grid/);
});
