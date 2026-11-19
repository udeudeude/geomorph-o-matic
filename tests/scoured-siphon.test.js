"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const data=JSON.parse(fs.readFileSync(path.join(__dirname,"../blueprints.json"),"utf8"));
const tile=data.tiles.find(t=>t.id==="scoured_siphon");
const {buildCells,edgeMask,verifyLayout}=require("../assemble");
const {doorEdges,audit}=require("../audit");
const {terrainGraph,terrainAudit,terrainModel}=require("../terrain");
const {distances}=require("../route-analysis");
const {makeSvg}=require("../render");
const {letterProof,printScaleAudit}=require("../print-review");
const owner=buildCells(tile),doors=doorEdges(tile);
test("six hand-shaped chambers and twelve bounded passages survive quarter turns",()=>{
 assert.equal(tile.rooms.length,6);
 assert.equal(tile.doors.length,12);
 assert.ok(tile.rooms.every(r=>r[2].rows.length>=3));
 assert.equal(audit(tile).fully_connected,true);
 assert.equal(audit(tile).normal_portals_reachable,8);
 assert.ok(audit(tile).hall_cycle_rank>=3);
 for(let turn=0;turn<4;turn++)for(const side of ["N","E","S","W"])
  assert.equal(edgeMask(tile,turn,side),"4,15");
});
test("a wet canyon is genuinely impassable without its narrow plank bridge",()=>{
 const wet=terrainModel(owner,tile.terrain);
 assert.equal(wet.water.size,8);
 assert.equal(wet.bridges.size,1);
 const joined=terrainGraph(owner,doors,tile.terrain);
 assert.ok(joined.get("10,9").includes("10,10"));
 const removed={...tile.terrain,bridges:[]};
 assert.ok(!terrainGraph(owner,doors,removed).get("10,9").includes("10,10"));
 assert.equal(terrainAudit(owner,doors,tile.terrain).travel.dry.reachable_portals,8);
});
test("the breakdown is an actual west-bank detour rather than floor decoration",()=>{
 const after=distances(terrainGraph(owner,doors,tile.terrain),"0,4").get("0,15");
 const before=distances(terrainGraph(owner,doors,{...tile.terrain,chokes:[]}),"0,4").get("0,15");
 assert.ok(after>=before+8,JSON.stringify({before,after}));
 assert.equal(terrainModel(owner,tile.terrain).chokes.size,1);
 assert.match(makeSvg(tile),/data-blocks-edge="1,10\|1,11"/);
});
test("raised karst gallery has two independently modeled dry ascents",()=>{
 const model=terrainModel(owner,tile.terrain);
 assert.equal(model.ramps.size,2);
 assert.ok(model.heights.size>=15);
 for(const [a,b] of tile.terrain.ramps){
  assert.ok(terrainGraph(owner,doors,tile.terrain).get(a.join(",")).includes(b.join(",")));
 }
 for(const bad of [
  {...tile.terrain,ramps:[[[17,4],[18,6]]]},
  {...tile.terrain,ramps:[[[17,4],[18,4]],[[17,4],[18,4]]]},
  {...tile.terrain,chokes:[[[0,4],[1,4]]]}
 ])assert.throws(()=>terrainModel(owner,bad));
 const svg=makeSvg(tile);
 assert.match(svg,/id="elevation-edges"/);
 assert.match(svg,/id="level-ramps"/);
 assert.match(svg,/id="cave-geomorphology"/);
 assert.equal(svg,makeSvg(tile));
});
test("mixed masonry and caves assemble without exposed seams, with true-size proof",()=>{
 const layout=JSON.parse(fs.readFileSync(path.join(__dirname,"../examples/assembly_scoured_2x2.json"),"utf8"));
 assert.equal(verifyLayout(layout,data).length,2);
 const svg=letterProof(tile);
 assert.match(svg,/width="215.9mm" height="279.4mm"/);
 assert.equal(printScaleAudit(tile).tile_width_mm,127);
});
