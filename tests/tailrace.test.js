"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const {buildCells}=require("../assemble"),{doorEdges}=require("../audit");
const {tailraceModel}=require("../tailrace");
const {makeTailracePlate}=require("../tailrace-plate");
const {makeSvg}=require("../render");
const {floodStages}=require("../flood-stages");
const source=JSON.parse(fs.readFileSync(path.join(__dirname,"../blueprints.json"),"utf8"));
const rift=source.tiles.find(t=>t.id==="riftwater_lock"),owner=buildCells(rift),doors=doorEdges(rift);
const copy=o=>JSON.parse(JSON.stringify(o));
const modify=fn=>{const t=copy(rift);fn(t.hydrology.tailrace);return t};

test("three separately gated sumps drop into one directed lower collection race",()=>{
 const m=tailraceModel(owner,doors,rift.hydrology,rift.terrain);
 assert.equal(m.level,-1);
 assert.equal(m.cells.length,10);
 assert.equal(m.terminus,"11,18");
 assert.deepEqual([...m.pickups].sort(),["10,11","11,11","9,11"]);
 assert.deepEqual(m.gatePickups,{
  west_shutter:"9,11",center_shutter:"10,11",east_shutter:"11,11"
 });
 assert.ok(!owner.has("11,18") || owner.get("11,18")!=="hall",
  "buried water path is not created by altering pedestrian hall geometry");
});

test("lower river is an ordered, simple path ending at its declared terminus",()=>{
 for(const f of [
  t=>t.cells.splice(4,1), // broken join between 11,12 and 11,14
  t=>t.cells.push([11,17]), // repeat
  t=>t.cells[1]=[0,11], // boundary and discontinuity
  t=>t.terminus=[10,18],
  t=>t.level=0,
  t=>t.hydraulic_separation="direct_piped",
  t=>t.cells.reverse()
 ]){
  const bad=modify(f);
  assert.throws(()=>tailraceModel(owner,doors,bad.hydrology,bad.terrain));
 }
});

test("every shutter independently drains exactly one separate downstream pocket",()=>{
 for(const f of [
  t=>t.pickups.pop(),
  t=>t.pickups.push([9,11]),
  t=>t.pickups[0]=[10,10],
  t=>t.pickups[0]=[11,12],
  t=>t.pickups[1]=[11,18]
 ]){
  const bad=modify(f);
  assert.throws(()=>tailraceModel(owner,doors,bad.hydrology,bad.terrain));
 }
});

test("vector upper plan marks vertical drops, not an invented ground-level tailrace",()=>{
 const a=makeSvg(rift),b=makeSvg(rift);
 assert.equal(a,b);
 assert.match(a,/id="tailrace-drop-shafts"/);
 assert.equal((a.match(/data-tailrace-drop=/g)||[]).length,3);
 assert.equal((a.match(/data-hydraulic-terminal=/g)||[]).length,1);
 assert.doesNotMatch(a,/data-direction="toward-terminus"/);
 const stages=floodStages(owner,doors,rift.terrain,rift.hydrology);
 const surge=stages.get("surge");
 const map=makeSvg({...rift,terrain:surge.terrain,
  hydrology:{...rift.hydrology,render_gate_states:surge.gate_states}});
 assert.equal((map.match(/data-tailrace-drop=/g)||[]).length,3);
 assert.match(map,/data-gate-id="east_shutter" data-state="open"/);
});

test("separate technical plate traces physical coordinates without implying surveyed elevation",()=>{
 const svg=makeTailracePlate(rift);
 assert.equal(svg,makeTailracePlate(rift));
 for(const tag of ["upper-hydraulic-plan","subfloor-collection-plan",
  "subfloor-directed-tailrace","lower-discharge-shafts",
  "upper-floor-context","vault-foundation-conflict","plan-scale",
  'data-level="-1"','data-continuation="unmapped"'])
  assert.ok(svg.includes(tag),tag);
 assert.equal((svg.match(/data-drain-from=/g)||[]).length,3);
 assert.equal((svg.match(/data-gate=/g)||[]).length,3);
 assert.match(svg,/centerline, not tunnel width/); // dimensionally honest technical map legend
 assert.equal((svg.match(/data-direction="toward-terminus"/g)||[]).length,1);
});
