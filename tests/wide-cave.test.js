"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {buildCells,verifyLayout,edgeMask}=require("../assemble");
const {makeSvg}=require("../render");
const {terrainModel,terrainGraph}=require("../terrain");
const {doorEdges}=require("../audit");
const {distances}=require("../route-analysis");
const {printScaleAudit,letterProof}=require("../print-review");
const {source,routeReport}=require("../wide-cave");
const {inspectTile,inspectFloor}=require("../seam-profiles");
const base=require("node:fs"),path=require("node:path");
const tile=source().tiles[0],floor=buildCells(tile);
test("wide cave is a distinct authored five-room plan with actual sixteen boundary cells",()=>{
 assert.equal(tile.rooms.length,5);assert.equal(tile.doors.length,8);
 assert.ok(tile.rooms.every(r=>r[2].rows.length>=3));
 assert.equal(inspectTile(tile,"cave-wide-v1").clear_openings,8);
 for(let turn=0;turn<4;turn++)for(const side of ["N","S","E","W"])
  assert.equal(edgeMask(tile,turn,side),"4,5,14,15");
 assert.equal(floor.size,187);
 assert.throws(()=>inspectTile(tile,"legacy"),/family differs/);
});
test("both western distributary lanes are actually blocked and force an eight-cell detour",()=>{
 const report=routeReport(tile),doors=doorEdges(tile),without=terrainGraph(floor,doors,{...tile.terrain,chokes:[]});
 assert.equal(report.reachable_floor_cells,187);
 assert.equal(report.reachable_edge_cells,16);
 assert.equal(report.west_bank_before_half_cells,22);
 assert.equal(report.west_bank_after_half_cells,30);
 assert.equal(report.west_bank_detour_half_cells,8);
 const blocked=terrainGraph(floor,doors,tile.terrain);
 for(const x of [6,7]){
  assert.ok(without.get(x+",10").includes(x+",11"));
  assert.ok(!blocked.get(x+",10").includes(x+",11"));
 }
 const out=makeSvg(tile);
 for(const x of [6,7])assert.ok(out.includes('data-blocks-edge="'+x+',10|'+x+',11"'));
});
test("wide-mouth throat rejects a missing cell, blocked or flooded seam, and an invented standard",()=>{
 const deficient=new Map(floor);deficient.delete("5,1");
 assert.throws(()=>inspectFloor(deficient,"cave-wide-v1"),/loses full clear floor width/);
 assert.throws(()=>terrainModel(floor,{water:[[5,0]]}),/Terrain cannot change standard edge portal/);
 assert.throws(()=>terrainModel(floor,{chokes:[[[5,0],[5,1]]]}),/interior/);
 assert.throws(()=>makeSvg({...tile,seam_profile:"made-up"}),/Unknown modular opening standard/);
});
test("wide rotations assemble only within family and reject the old 2.5-foot system",()=>{
 const layout=JSON.parse(base.readFileSync(path.join(__dirname,"../studies/assembly_braided_2x2.json"),"utf8"));
 assert.equal(verifyLayout(layout,source()).length,2);
 const old=JSON.parse(base.readFileSync(path.join(__dirname,"../blueprints.json"),"utf8")).tiles[0];
 const mixed={rows:[[{id:tile.id,turn:0},{id:old.id,turn:0}]]};
 assert.throws(()=>verifyLayout(mixed,{tiles:[tile,old]}),/Incompatible/);
});
test("editable wall, texture, geological debris and true-size five-foot mouths survive rendering",()=>{
 const svg=makeSvg(tile),proof=letterProof(tile),info=printScaleAudit(tile);
 assert.equal(svg,makeSvg(tile));
 for(const layer of ["floor","grid","rock-hachures","cavern-walls","cave-geomorphology","cave-breakdown-chokes"])
  assert.ok(svg.includes('id="'+layer+'"'),layer);
 assert.match(proof,/width="215.9mm" height="279.4mm"/);
 assert.match(proof,/Edge throats are 5 ft clear/);
 assert.equal(info.standard_edge_throat_feet,5);
 assert.equal(info.standard_edge_throat_print_mm,25.4);
 assert.equal(info.tile_width_mm,127);
});
