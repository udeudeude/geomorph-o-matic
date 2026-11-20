"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const data=JSON.parse(fs.readFileSync(path.join(__dirname,"../blueprints.json"),"utf8"));
const {buildCells}=require("../assemble");
const {PROFILES,boundaryCell,inspectTile,inspectFloor,specimenWideFloor,rotateFloor,report}=require("../seam-profiles");
test("ten canonical maps keep exactly eight 2.5-foot throats through every rotation",()=>{
 for(const tile of data.tiles){
  const r=inspectTile(tile);
  assert.equal(r.rotations_checked,4);
  assert.equal(r.clear_openings,8);
  assert.equal(r.mouths.every(m=>m.clear_feet===2.5),true);
  assert.deepEqual(r.modular_family_compatible_with,["legacy"]);
 }
});
test("independent five-foot cave seam specimen has two genuinely clear cells through an inward throat",()=>{
 const floor=specimenWideFloor(),r=inspectFloor(floor,"cave-wide-v1");
 assert.equal(r.clear_openings,8);
 assert.equal(r.rotations_checked,4);
 assert.ok(r.mouths.every(m=>m.clear_feet===5&&m.minimum_inward_depth_feet===5));
 for(let turn=0;turn<4;turn++)
  assert.deepEqual(inspectFloor(rotateFloor(floor,turn),"cave-wide-v1"),r);
 assert.deepEqual(r.modular_family_compatible_with,["cave-wide-v1"]);
});
test("a drawn widening without navigable depth is rejected, as are incompatible seam families",()=>{
 const floor=specimenWideFloor();
 floor.delete("5,1");assert.throws(()=>inspectFloor(floor,"cave-wide-v1"),/loses full clear floor width/);
 const legacy=buildCells(data.tiles[0]);
 assert.throws(()=>inspectFloor(legacy,"cave-wide-v1"),/border mask/);
 assert.throws(()=>inspectFloor(specimenWideFloor(),"legacy"),/border mask/);
 assert.throws(()=>inspectTile(data.tiles[0],"cave-wide-v1"),/family differs/);
 assert.throws(()=>inspectFloor(new Map(),"unknown"),/Unknown modular/);
 assert.deepEqual(boundaryCell("S",14,2),[14,17]);
 assert.deepEqual(PROFILES["cave-wide-v1"].mouths,[[4,5],[14,15]]);
});
test("interface research report is reproducible and never counts specimen as a released map",()=>{
 const r=report(data);
 assert.equal(r.legacy_tiles.length,data.tiles.length);
 assert.equal(r.wide_interface_specimen.clear_openings,8);
 assert.match(r.caution,/NOT a designed dungeon/);
 assert.deepEqual(r,report(data));
});
