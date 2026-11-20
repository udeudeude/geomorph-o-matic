"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const {source,spineReport}=require("../wide-cave");
const {buildCells,edgeMask,verifyLayout,assemble}=require("../assemble");
const {inspectTile,inspectFloor}=require("../seam-profiles");
const {doorEdges}=require("../audit");
const {terrainGraph}=require("../terrain");
const {distances}=require("../route-analysis");
const {makeSvg}=require("../render");
const {letterProof}=require("../print-review");
const {examineAssembly}=require("../wide-assembly-audit");
const data=source(),cave=data.tiles.find(t=>t.id==="split_spine");
test("third wide volcanic design has actual asymmetrical chambers and unbroken five-foot entrances",()=>{
 assert.equal(data.tiles.length,3);
 assert.equal(cave.rooms.length,4);
 assert.equal(cave.doors.length,8);
 assert.equal(cave.routes.length,40);
 const owner=buildCells(cave);
 assert.equal(owner.size,223);
 for(const turn of [0,1,2,3])for(const side of ["N","E","S","W"])
  assert.equal(edgeMask(cave,turn,side),"4,5,14,15");
 assert.equal(inspectTile(cave,"cave-wide-v1").clear_openings,8);
 for(const p of ["8,8","9,9","10,10","11,11"])assert.ok(!owner.has(p),"Preserved central solid basalt spine: "+p);
 assert.ok(owner.has("7,10")&&owner.has("12,10"),"Separate west and east conduits flank the rock spine");
});
test("three real west-limb roof-fall edges lengthen a traverse by twelve steps without isolating floor",()=>{
 const owner=buildCells(cave),doors=doorEdges(cave);
 const open=terrainGraph(owner,doors,{...cave.terrain,chokes:[]});
 const blocked=terrainGraph(owner,doors,cave.terrain);
 assert.equal(distances(open,"0,4").get("0,14"),22);
 assert.equal(distances(blocked,"0,4").get("0,14"),34);
 assert.equal(distances(blocked,"4,0").size,223);
 const report=spineReport(cave);
 assert.equal(report.west_detour_half_cells,12);
 assert.equal(report.reachable_edge_cells,16);
 const artwork=makeSvg(cave);
 for(const x of [5,6,7]){
  assert.ok(open.get(x+",7").includes(x+",8"));
  assert.ok(!blocked.get(x+",7").includes(x+",8"));
  assert.ok(artwork.includes('data-blocks-edge="'+x+",7|"+x+",8"+'"'));
 }
});
test("mutating a throat, collapse or doorway is detected from canonical geometry",()=>{
 const owner=buildCells(cave),noMouth=new Map(owner);
 noMouth.delete("5,1");
 assert.throws(()=>inspectFloor(noMouth,"cave-wide-v1"),/loses full clear floor width/);
 const changed=structuredClone(cave);changed.terrain.chokes.pop();
 assert.throws(()=>spineReport(changed),/three actual west-limb/);
 const withoutDoor=structuredClone(cave);withoutDoor.doors=withoutDoor.doors.filter(d=>d[0]!=="west_sump");
 assert.ok(distances(terrainGraph(buildCells(withoutDoor),doorEdges(withoutDoor),withoutDoor.terrain),"4,0").size<223);
});
test("three distinct wide cave designs join in a rotated four-tile composition with redundant crossings",()=>{
 const layout=JSON.parse(fs.readFileSync(path.join(__dirname,"../studies/assembly_three_wide_2x2.json"),"utf8"));
 const rows=verifyLayout(layout,data);
 assert.equal(new Set(rows.flat().map(c=>c.id)).size,3);
 const report=examineAssembly(layout,data);
 assert.equal(report.authored_tile_types.length,3);
 assert.equal(report.tile_instances,4);
 assert.equal(report.occupied_floor_cells,871);
 assert.equal(report.reachable_floor_cells,871);
 assert.equal(report.actual_walkable_intertile_edges,16);
 assert.equal(report.exterior_edge_cells,32);
 assert.ok(report.whole_seam_closures_with_alternate_routes.every(x=>x.connected_floor_cells_after_full_seam_closure===871));
 const svg=assemble(layout,data,id=>makeSvg(data.tiles.find(t=>t.id===id)));
 for(const name of ["The Split-Spine Drainback","The Sagging Sheetflow","The Braided Lava Confluence"])
  assert.ok(svg.includes(name),name);
 const ids=[...svg.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,new Set(ids).size,"Repeated master SVG identifiers must be isolated per instance");
});
test("third design retains editable volcanic layers and truthful actual-size print proof",()=>{
 const svg=makeSvg(cave),proof=letterProof(cave);
 for(const id of ["rock-hachures","cavern-walls","cave-geomorphology","cave-breakdown-chokes"])
  assert.ok(svg.includes('id="'+id+'"'));
 assert.match(proof,/width="215.9mm" height="279.4mm"/);
 assert.match(proof,/Edge throats are 5 ft clear/);
 assert.match(proof,/Visual clarity must be assessed from a physical test print/);
});
