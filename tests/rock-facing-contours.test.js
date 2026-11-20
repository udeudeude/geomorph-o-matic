"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {organicWallPaths,rockFacingOffsets,rockHachurePaths}=require("../cave-contours");
const fs=require("node:fs"),path=require("node:path");
const {makeSvg}=require("../render");
const tiles=JSON.parse(fs.readFileSync(path.join(__dirname,"../blueprints.json"),"utf8")).tiles;
const square=[
 [5,5,6,5,0,-1],[6,5,6,6,1,0],[6,6,5,6,0,1],[5,6,5,5,-1,0]
];
test("unsurveyed cave-wall vertex offsets enter surrounding rock, not traversable chamber",()=>{
 const shifted=rockFacingOffsets(square),xy=p=>shifted.get(p);
 assert.ok(xy("5,5")[0]<120&&xy("5,5")[1]<120);
 assert.ok(xy("6,5")[0]>144&&xy("6,5")[1]<120);
 assert.ok(xy("6,6")[0]>144&&xy("6,6")[1]>144);
 assert.ok(xy("5,6")[0]<120&&xy("5,6")[1]>144);
 for(const [p,original] of [["5,5",[120,120]],["6,5",[144,120]],["6,6",[144,144]],["5,6",[120,144]]]){
  const move=xy(p),dist=Math.hypot(move[0]-original[0],move[1]-original[1]);
  assert.ok(dist>0&&dist<4,"Sub-cell perturbation must remain subtle");
 }
});
test("standard tile boundary stays mathematically exact through rock-side smoothing",()=>{
 const edges=[[0,4,1,4,0,-1],[1,4,1,5,1,0],[1,5,0,5,0,1]];
 const points=rockFacingOffsets(edges);
 assert.deepEqual(points.get("0,4"),[0,96]);
 assert.deepEqual(points.get("0,5"),[0,120]);
 assert.match(organicWallPaths(edges).join(""),/^M0,96/);
 assert.ok(organicWallPaths(square)[0].includes("C"));
 assert.equal(organicWallPaths(square).join(""),organicWallPaths(square).join(""));
});
test("invalid outward normals and excessive offsets are rejected",()=>{
 assert.throws(()=>rockFacingOffsets([[5,5,6,5,1,1]]),/outward normal/);
 assert.throws(()=>rockFacingOffsets(square,{irregularity:.3}),/Unsafe/);
 assert.throws(()=>organicWallPaths(square,{curvature:.9}),/Unsafe/);
});
test("all canonical cave and mixed tiles render with editable rock contours",()=>{
 for(const tile of tiles.filter(t=>t.wall_style==="cavern")){
  const svg=makeSvg(tile);
  assert.match(svg,/id="cavern-walls"/);
  assert.match(svg,/id="rock-hachures"/);
  assert.equal(svg,makeSvg(tile));
 }
});

test("irregular cave hachures lean into rock instead of making uniform fenceposts",()=>{
 const paths=rockHachurePaths(square);
 assert.equal(paths.length,8);
 assert.deepEqual(paths,rockHachurePaths(square));
 const top=paths.slice(0,2).map(s=>{
  const m=s.match(/^M([-0-9.]+),([-0-9.]+)L([-0-9.]+),([-0-9.]+)$/);
  assert.ok(m,"each needle is an independent editable straight SVG segment");
  return m.slice(1).map(Number);
 });
 for(const [x1,y1,x2,y2] of top){
  assert.ok(y2<y1 && y1<120 && y2>104,"top cave needles must stay in exterior rock despite curved-wall recession");
  assert.ok(Math.abs(x2-x1)>1,"needles must lean rather than form repeating perpendicular ticks");
 }
 assert.ok(new Set(paths.map(p=>p.slice(0,9))).size>2);
 assert.throws(()=>rockHachurePaths(square,{cellSize:0}),/scale/);
});
