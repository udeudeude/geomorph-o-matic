"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const {organicWallGeometry,organicWallPaths,rockHachurePaths}=require("../cave-contours");
const {buildCells,edgeMask}=require("../assemble");
const {makeSvg}=require("../render");
const {letterProof,printScaleAudit}=require("../print-review");
const data=JSON.parse(fs.readFileSync(path.join(__dirname,"../blueprints.json"),"utf8"));
const key=(x,y)=>x+","+y;

// An asymmetric connected outline, using the same outward-facing normals as
// the canonical renderer. Etching is measured against the DRAWN cubic, not
// the rectilinear source mask.
const segments=[
 [3,3,4,3,0,-1],[4,3,5,3,0,-1],[5,3,6,3,0,-1],
 [6,3,7,3,0,-1],[7,3,8,3,0,-1],
 [8,3,8,4,1,0],[8,4,8,5,1,0],[8,5,8,6,1,0],
 [8,6,8,7,1,0],[8,7,8,8,1,0],
 [3,8,4,8,0,1],[4,8,5,8,0,1],[5,8,6,8,0,1],
 [6,8,7,8,0,1],[7,8,8,8,0,1],
 [3,3,3,4,-1,0],[3,4,3,5,-1,0],[3,5,3,6,-1,0],
 [3,6,3,7,-1,0],[3,7,3,8,-1,0]
];
const cubic=(e,t)=>{
 const u=1-t;
 return e.curved?e.a.map((v,k)=>u*u*u*v+3*u*u*t*e.p[k]+3*u*t*t*e.q[k]+t*t*t*e.b[k]):
  e.a.map((v,k)=>v+(e.b[k]-v)*t);
};
function nearCurve(start,edges){
 let best=Infinity,nearest=null;
 for(const e of edges)for(let j=0;j<=200;j++){
  const p=cubic(e,j/200),d=Math.hypot(p[0]-start[0],p[1]-start[1]);
  if(d<best){best=d;nearest={e,p};}
 }
 return {distance:best,...nearest};
}
test("every etching needle starts directly outside the actual organic wall",()=>{
 const chains=organicWallGeometry(segments),edges=chains.flatMap(x=>x.edges);
 const hatch=rockHachurePaths(segments);
 assert.equal(chains.length,1);assert.equal(hatch.length,40);
 for(const d of hatch){
  const m=/^M([\\d.]+),([\\d.]+)L([\\d.]+),([\\d.]+)$/.exec(d);
  assert.ok(m,"malformed needle "+d);
  const start=[+m[1],+m[2]],end=[+m[3],+m[4]];
  const nearest=nearCurve(start,edges);
  assert.ok(Math.abs(nearest.distance-1.6)<.035,"floating needle "+d+" / "+nearest.distance);
  assert.ok(start.every(v=>v>=0&&v<=480)&&end.every(v=>v>=0&&v<=480));
  const n=nearest.e.normal,from=[start[0]-nearest.p[0],start[1]-nearest.p[1]];
  assert.ok(n&&n[0]*from[0]+n[1]*from[1]>0,"needle intrudes into a chamber");
 }
 assert.deepEqual(hatch,rockHachurePaths(segments));
 assert.deepEqual(chains.map(c=>c.path),organicWallPaths(segments));
});
test("the exact modular border cannot be warped or engraved over",()=>{
 const seam=[[0,2,1,2,0,-1],[0,2,0,3,-1,0],[1,2,1,3,1,0]];
 const geometry=organicWallGeometry(seam);
 const borderEdges=geometry.flatMap(c=>c.edges).filter(e=>e.border);
 assert.ok(borderEdges.length>0);
 for(const e of borderEdges){
  assert.equal(e.curved,false);
  assert.ok(e.a.every(v=>Number.isFinite(v))&&e.b.every(v=>Number.isFinite(v)));
 }
 assert.ok(rockHachurePaths(seam).length<=2);
 assert.throws(()=>organicWallGeometry(segments,{irregularity:.4}),/Unsafe/);
 assert.throws(()=>rockHachurePaths(segments,{cellSize:-5}),/Invalid/);
});
test("reshaped Hollow Causeway creates real nonrectangular rock voids without sacrificing portals",()=>{
 const tile=data.tiles.find(t=>t.id==="hollow_causeway");
 const owner=buildCells(tile);
 for(const [room,x,y] of [
  ["great_rift",11,6],["great_rift",6,10],["great_rift",7,11],["great_rift",8,12],
  ["dry_lung",2,2],["dry_lung",5,5],["lost_channel",1,12],
  ["pearl_pool",14,12],["blind_fissure",11,16]
 ])assert.equal(owner.get(key(x,y)),room);
 for(let turn=0;turn<4;turn++)for(const side of ["N","E","S","W"])
  assert.equal(edgeMask(tile,turn,side),"4,15");
 const svg=makeSvg(tile);
 assert.ok(svg.includes('id="cavern-walls"')&&svg.includes('id="rock-hachures"'));
 assert.equal(svg,makeSvg(tile),"artwork is nondeterministic");
 assert.ok(!/NaN|Infinity|undefined/.test(svg));
 assert.match(letterProof(tile),/width="215.9mm" height="279.4mm"/);
 assert.equal(printScaleAudit(tile).tile_width_mm,127);
});
test("all cave families preserve reproducible wall layers and rotation seams",()=>{
 for(const tile of data.tiles.filter(t=>t.wall_style==="cavern")){
  const svg=makeSvg(tile);
  assert.equal(svg,makeSvg(tile),tile.id);
  assert.match(svg,/<g id="cavern-walls"/);
  assert.match(svg,/<g id="rock-hachures"/);
  for(let turn=0;turn<4;turn++)for(const side of ["N","E","S","W"])
   assert.equal(edgeMask(tile,turn,side),"4,15",tile.id);
 }
});
