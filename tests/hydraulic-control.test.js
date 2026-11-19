"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict");
const {gateModel,applyGateStates,hydraulicGraph}=require("../hydraulic-control");
const {floodStages}=require("../flood-stages");
const {distances}=require("../route-analysis");
const owner=new Map(Array.from({length:5},(_,i)=>[String(i+1)+",5","hall"]));
const dam={id:"east_sluice",kind:"sluice",default:"closed",a:[2,5],b:[3,5]};
const terrain={water:[[2,5]],elevations:[[1,[[4,5]]]]};
test("a watertight sluice blocks hydraulic connection without changing access",()=>{
 const gates=gateModel(owner,[],[dam]);
 const shut=hydraulicGraph(owner,[],gates,applyGateStates(gates));
 assert.equal(distances(shut,"2,5").has("3,5"),false);
 const open=hydraulicGraph(owner,[],gates,applyGateStates(gates,new Map(),{east_sluice:"open"}));
 assert.equal(distances(open,"2,5").get("5,5"),3);
 assert.throws(()=>floodStages(owner,[],terrain,{gates:[dam],stages:[
  {id:"inundation",add_water:[[3,5]],surface_level:1}
 ]}),/hydraulic/);
 const stages=floodStages(owner,[],terrain,{gates:[dam],stages:[
  {id:"inundation",add_water:[[3,5]],surface_level:1,gate_states:{east_sluice:"open"}}
 ]});
 assert.deepEqual([...stages.keys()],["normal","inundation"]);
 assert.deepEqual(stages.get("normal").closed_gates,["east_sluice"]);
 assert.deepEqual(stages.get("inundation").closed_gates,[]);
});
test("water cannot climb above its surface elevation, and waterlines cannot fall",()=>{
 for(const stage of [
  {id:"rise",add_water:[[3,5],[4,5]],surface_level:1,gate_states:{east_sluice:"open"}},
  {id:"rise",add_water:[[3,5]],surface_level:-1,gate_states:{east_sluice:"open"}},
  {id:"rise",add_water:[[3,5]],surface_level:Infinity,gate_states:{east_sluice:"open"}}
 ])assert.throws(()=>floodStages(owner,[],terrain,{gates:[dam],stages:[stage]}));
 const two=floodStages(owner,[],terrain,{gates:[dam],stages:[
  {id:"low",add_water:[[3,5]],surface_level:1,gate_states:{east_sluice:"open"}},
  {id:"high",add_water:[[4,5]],surface_level:2}
 ]});
 assert.equal(two.get("high").terrain.water.length,3);
 assert.equal(two.get("high").surface_level,2);
 assert.throws(()=>floodStages(owner,[],terrain,{gates:[dam],stages:[
  {id:"low",add_water:[[3,5]],surface_level:2,gate_states:{east_sluice:"open"}},
  {id:"high",add_water:[[4,5]],surface_level:1}
 ]}),/falling/);
});
test("invalid gates and malicious state changes are rejected",()=>{
 const bad=[
  {...dam,b:[4,5]},{...dam,b:[6,5]},{...dam,b:[3,5],default:"broken"},
  {...dam,a:[0,5]},{...dam,a:[2,5],b:[2,5]}
 ];
 for(const gate of bad)assert.throws(()=>gateModel(owner,[],[gate]));
 assert.throws(()=>gateModel(owner,[],[dam,dam]),/repeated/);
 assert.throws(()=>floodStages(owner,[],terrain,{gates:[dam],stages:[
  {id:"inundation",add_water:[[3,5]],gate_states:{no_such_gate:"open"}}
 ]}),/Unknown gate/);
 assert.throws(()=>floodStages(owner,[],terrain,{gates:[dam],stages:[
  {id:"inundation",add_water:[[3,5]],gate_states:{east_sluice:"invalid"}}
 ]}),/Unknown gate/);
});
