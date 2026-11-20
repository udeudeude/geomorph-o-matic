"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const {source,sheetReport}=require("../wide-cave");
const {buildCells,verifyLayout,edgeMask,assemble}=require("../assemble");
const {inspectTile}=require("../seam-profiles");
const {doorEdges}=require("../audit");
const {terrainModel,terrainGraph}=require("../terrain");
const {distances}=require("../route-analysis");
const {makeSvg}=require("../render");
const {letterProof}=require("../print-review");
const tiles=source().tiles;
const tile=tiles.find(t=>t.id==="sagging_sheet");
const original=tiles.find(t=>t.id==="braided_lava");
test("sheetflow is a second, spatially distinct six-chamber five-foot-mouth plan",()=>{
 assert.ok(tile&&original);
 assert.notDeepEqual(tile.rooms.map(r=>r[2]),original.rooms.map(r=>r[2]));
 assert.equal(tile.rooms.length,6);
 assert.equal(tile.doors.length,18);
 assert.equal(buildCells(tile).size,240);
 assert.equal(inspectTile(tile,"cave-wide-v1").clear_openings,8);
 for(let turn=0;turn<4;turn++)for(const side of ["N","S","E","W"])
  assert.equal(edgeMask(tile,turn,side),"4,5,14,15");
});
test("paired traversable roof fall creates a fourteen-half-cell detour without isolating any floor",()=>{
 const floor=buildCells(tile),doors=doorEdges(tile);
 const before=terrainGraph(floor,doors,{...tile.terrain,chokes:[]});
 const after=terrainGraph(floor,doors,tile.terrain);
 assert.equal(distances(before,"5,0").get("14,0"),17);
 assert.equal(distances(after,"5,0").get("14,0"),31);
 assert.equal(distances(after,"4,0").size,floor.size);
 for(const [a,b] of tile.terrain.chokes){
  const x=a.join(","),y=b.join(",");
  assert.ok(before.get(x).includes(y));
  assert.ok(!after.get(x).includes(y));
  assert.ok(makeSvg(tile).includes('data-blocks-edge="'+[x,y].sort().join("|")+'"'));
 }
 const report=sheetReport(tile);
 assert.equal(report.northern_detour_half_cells,14);
 assert.equal(report.reachable_edge_cells,16);
});
test("three distinct grade approaches make the raised bench fully walkable, with remaining ledge edges impassable",()=>{
 const floor=buildCells(tile),doors=doorEdges(tile),model=terrainModel(floor,tile.terrain);
 const graph=terrainGraph(floor,doors,tile.terrain);
 assert.equal(model.heights.size,8);
 assert.equal(model.ramps.size,3);
 assert.equal(distances(graph,"4,0").size,240);
 for(const [a,b] of tile.terrain.ramps){
  const x=a.join(","),y=b.join(",");
  assert.ok(graph.get(x).includes(y),x+" -> "+y);
 }
 assert.ok(!graph.get("17,11").includes("18,11")); // no fabricated climb at un-ramped east ledge
 const noRamps=terrainGraph(floor,doors,{...tile.terrain,ramps:[]});
 assert.ok(distances(noRamps,"4,0").size<240);
});
test("mixed assembly proves two genuinely different mapped caves join in four rotated instances",()=>{
 const layout=JSON.parse(fs.readFileSync(path.join(__dirname,"../studies/assembly_wide_mixed_2x2.json"),"utf8"));
 const rows=verifyLayout(layout,source());
 assert.equal(rows.length,2);
 assert.equal(new Set(rows.flat().map(c=>c.id)).size,2);
 const composed=assemble(layout,source(),id=>makeSvg(tiles.find(t=>t.id===id)));
 assert.match(composed,/The Sagging Sheetflow/);
 assert.match(composed,/The Braided Lava Confluence/);
 const ids=[...composed.matchAll(/\\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,new Set(ids).size);
 const legacy=JSON.parse(fs.readFileSync(path.join(__dirname,"../blueprints.json"),"utf8")).tiles[0];
 assert.throws(()=>verifyLayout({rows:[[{id:tile.id,turn:0},{id:legacy.id,turn:0}]]},{tiles:[tile,legacy]}),/Incompatible/);
});
test("sheetflow is reproducibly rendered and carries an explicitly provisional actual-size print proof",()=>{
 const svg=makeSvg(tile),proof=letterProof(tile);
 assert.equal(svg,makeSvg(tile));
 for(const layer of ["rock-hachures","cavern-walls","cave-geomorphology","cave-breakdown-chokes","elevation-edges","level-ramps"])
  assert.ok(svg.includes('id="'+layer+'"'),layer);
 assert.match(proof,/width="215.9mm" height="279.4mm"/);
 assert.match(proof,/Edge throats are 5 ft clear/);
 assert.match(proof,/Visual clarity must be assessed from a physical test print/);
});
