"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const data=JSON.parse(fs.readFileSync(path.join(__dirname,"../blueprints.json"),"utf8")),tile=data.tiles.find(t=>t.id==="lantern_sink");
const {buildCells,edgeMask,verifyLayout}=require("../assemble"),{doorEdges,audit}=require("../audit");
const {terrainModel,terrainGraph,terrainAudit}=require("../terrain"),{distances}=require("../route-analysis");
const {makeSvg}=require("../render"),{letterProof}=require("../print-review");
test("hand-composed cavern/ruin is modular and fully connected",()=>{
 assert.equal(tile.rooms.length,7);assert.equal(tile.doors.length,11);
 const report=audit(tile);assert.equal(report.fully_connected,true);assert.equal(report.normal_portals_reachable,8);
 assert.ok(report.hall_cycle_rank>=2);assert.equal(report.secret_doors,2);
 for(let turn=0;turn<4;turn++)for(const side of ["N","E","S","W"])assert.equal(edgeMask(tile,turn,side),"4,15");
});
test("drowned sink, rock bench and west collapse alter traversal, not just illustration",()=>{
 const owner=buildCells(tile),doors=doorEdges(tile),m=terrainModel(owner,tile.terrain);
 assert.equal(m.water.size,4);assert.equal(m.bridges.size,2);
 assert.equal(m.ramps.size,3);assert.equal(m.heights.size,4);assert.equal(m.chokes.size,1);
 for(const [a,b] of tile.terrain.ramps)assert.ok(terrainGraph(owner,doors,tile.terrain).get(a.join(",")).includes(b.join(",")));
 assert.equal(terrainAudit(owner,doors,tile.terrain).travel.dry.reachable_portals,8);
 const before=distances(terrainGraph(owner,doors,{...tile.terrain,chokes:[]}),"0,4").get("0,15");
 const after=distances(terrainGraph(owner,doors,tile.terrain),"0,4").get("0,15");
 assert.ok(after>=before+10,JSON.stringify({before,after}));
 assert.equal(after,35); assert.equal(before,23);
 assert.throws(()=>terrainModel(owner,{...tile.terrain,ramps:[[[14,8],[14,10]]]}));
});
test("edited cave vectors, rotation assembly and print scale remain consistent",()=>{
 const svg=makeSvg(tile);
 for(const id of ["cavern-walls","cave-breakdown-chokes","level-ramps","dry-bridges","cave-geomorphology"])
  assert.ok(svg.includes('id="'+id+'"'),"missing layer "+id);
 assert.equal(svg,makeSvg(tile));
 const layout=JSON.parse(fs.readFileSync(path.join(__dirname,"../examples/assembly_lantern_2x2.json"),"utf8"));
 assert.equal(verifyLayout(layout,data).length,2);
 assert.match(letterProof(tile),/width="215.9mm" height="279.4mm"/);
});
