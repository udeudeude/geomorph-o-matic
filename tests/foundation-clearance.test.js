"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const {auditBuriedFoundations,requireBuriedFoundationClearance}=require("../foundation-clearance");
const {verifySubfloorLayout}=require("../subfloor-interfaces");
const {tailraceModel}=require("../tailrace");
const {buildCells}=require("../assemble"),{doorEdges}=require("../audit");
const data=JSON.parse(fs.readFileSync(path.join(__dirname,"../blueprints.json"),"utf8"));
const source=data.tiles.find(t=>t.id==="riftwater_lock");
const sink=data.tiles.find(t=>t.id==="postern_bastion");
const copy=o=>JSON.parse(JSON.stringify(o));
test("buried collector turns west of the pressure vault instead of crossing its footprint",()=>{
 const a=requireBuriedFoundationClearance(source);
 assert.equal(a.route_cells,16);
 assert.equal(a.overlaps.length,0);
 assert.deepEqual(a.accepted_drops.sort(),["10,11","11,11","9,11"]);
 assert.ok(source.hydrology.tailrace.cells.some(p=>p[0]===6&&p[1]===17));
 const m=tailraceModel(buildCells(source),doorEdges(source),source.hydrology,source.terrain);
 assert.equal(m.terminus,"6,19");
});
test("receiver dogleg avoids the toll room and barracks foundation footprints",()=>{
 const a=requireBuriedFoundationClearance(sink);
 assert.equal(a.route_cells,12);
 assert.equal(a.overlaps.length,0);
 assert.equal(a.accepted_drops.length,0);
 assert.equal(sink.hydrology.subfloor_relay.cells.at(-1).join(","),"9,8");
});
test("a route beneath the vault is rejected even if its nominal grade looks downhill",()=>{
 const bad=copy(source);
 bad.hydrology.tailrace.cells[12]=[11,17];
 const a=auditBuriedFoundations(bad);
 assert.ok(a.overlaps.some(o=>o.room==="vault"));
 assert.throws(()=>requireBuriedFoundationClearance(bad),/foundation/);
});
test("a receiver routed under a room requires a different architectural design",()=>{
 const bad=copy(sink);
 bad.hydrology.subfloor_relay.cells[6]=[5,4];
 assert.ok(auditBuriedFoundations(bad).overlaps.some(o=>o.room==="toll"));
 assert.throws(()=>requireBuriedFoundationClearance(bad),/foundation/);
});
test("specialized seam still joins in four physical orientations without an extra walking portal",()=>{
 const straight={rows:[[{id:"riftwater_lock",turn:0}],[{id:"postern_bastion",turn:0}]]};
 const back={rows:[[{id:"postern_bastion",turn:2}],[{id:"riftwater_lock",turn:2}]]};
 assert.equal(verifySubfloorLayout(straight,data).matched_seams[0].offset,6);
 assert.equal(verifySubfloorLayout(back,data).matched_seams[0].offset,13);
});
