"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const {masonryHatchPaths}=require("../ink-hatching");
const {makeSvg}=require("../render");
const {edgeMask,verifyLayout}=require("../assemble");
const {audit}=require("../audit");
const {letterProof,printScaleAudit}=require("../print-review");
const data=JSON.parse(fs.readFileSync(path.join(__dirname,"../blueprints.json"),"utf8"));
const tile=data.tiles.find(x=>x.id==="fallen_choir");

test("fallen choir is a complete and consciously authored seven-room architectural study",()=>{
 assert.ok(tile);
 assert.equal(tile.rooms.length,7);
 assert.equal(tile.doors.length,10);
 assert.equal(tile.doors.filter(d=>d[3]==="secret").length,2);
 const nave=tile.rooms.find(r=>r[0]==="bell_nave");
 assert.equal(nave[2].rows.length,6);
 assert.equal(tile.doors.filter(d=>d[0]==="bell_nave").length,4);
 assert.ok(tile.features.some(f=>f[0]==="bell"));
 const a=audit(tile);
 assert.equal(a.normal_portals_reachable,8);
 assert.equal(a.fully_connected,true);
 assert.ok(a.hall_cycle_rank>=3);
});
test("ink hatch vectors occupy stone, not playable floor",()=>{
 const owner=new Map([["4,4","hall"]]);
 const paths=masonryHatchPaths(owner,24,10);
 const strokes=[...paths.matchAll(/M([0-9.]+),([0-9.]+)L([0-9.]+),([0-9.]+)/g)];
 assert.equal(strokes.length,8);
 for(const [,a,b,c,d] of strokes){
  for(const [x,y] of [[+a,+b],[+c,+d],[(+a+(+c))/2,(+b+(+d))/2]]){
   assert.ok(!(x>=4*24&&x<=5*24&&y>=4*24&&y<=5*24),"Hatch intrudes into walkable floor");
  }
 }
 assert.throws(()=>masonryHatchPaths(new Set()),/Map/);
 assert.throws(()=>masonryHatchPaths(owner,-1),/scale/);
});
test("fallen choir SVG is reproducible, editable, and has differentiated black-ink layers",()=>{
 const svg=makeSvg(tile);
 assert.equal(svg,makeSvg(tile));
 assert.match(svg,/id="masonry-hachures"/);
 assert.match(svg,/id="fallen-bell"/);
 assert.match(svg,/id="stone-walls"/);
 assert.match(svg,/id="explicit-doors"/);
 assert.match(svg,/id="grid"/);
 assert.ok(svg.indexOf('id="masonry-hachures"')<svg.indexOf('id="stone-walls"'));
});
test("fallen choir retains standard connections through all turns and mixed tiles",()=>{
 for(let turn=0;turn<4;turn++)for(const side of ["N","S","E","W"]){
  assert.equal(edgeMask(tile,turn,side),"4,15");
 }
 const layout=JSON.parse(fs.readFileSync(path.join(__dirname,"../examples/assembly_fallen_choir_2x2.json"),"utf8"));
 assert.equal(verifyLayout(layout,data).length,2);
});
test("print-size fallen choir proof is a true-size letter sheet, not a quality certification",()=>{
 const proof=letterProof(tile,{squareInches:.5});
 const a=printScaleAudit(tile,{squareInches:.5});
 assert.match(proof,/width="215.9mm" height="279.4mm"/);
 assert.match(proof,/The Fallen Choir/);
 assert.equal(a.tile_width_mm,127);
 assert.equal(a.requires_visual_review,true);
});
