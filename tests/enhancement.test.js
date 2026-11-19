"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict");
const {hallObstacles,navigationSummary}=require("../topology");
const {chainsFromEdges,naturalWallPaths,rockHachurePaths}=require("../cave-contours");
const {makeSvg}=require("../render");
const fs=require("node:fs"),path=require("node:path");
const fill=(x1,y1,x2,y2,except=()=>false)=>{
 const map=new Map();for(let y=y1;y<=y2;y++)for(let x=x1;x<=x2;x++)if(!except(x,y))map.set(`${x},${y}`,"hall");return map;
};
test("solid corridor does not acquire fictitious navigational loops from grid faces",()=>{
 assert.equal(navigationSummary(fill(3,3,10,10)).substantial_hall_circuits,0);
});
test("enclosed chambers are each counted once, independent of graph-face count",()=>{
 const hall=fill(2,2,12,12,(x,y)=>x>=5&&x<=8&&y>=5&&y<=8);
 for(let y=5;y<=8;y++)for(let x=5;x<=8;x++)hall.set(`${x},${y}`,"reliquary");
 const result=navigationSummary(hall);
 assert.equal(result.substantial_hall_circuits,1);
 assert.deepEqual(result.hall_encircled_obstacles[0].chamber_ids,["reliquary"]);
 assert.deepEqual(result.hall_encircled_obstacles[0].bounding_box,[5,5,8,8]);
});
test("small ornamental rock island is not a substantial route choice",()=>{
 const result=navigationSummary(fill(3,3,9,9,(x,y)=>x===6&&y===6));
 assert.equal(result.substantial_hall_circuits,0);
 assert.equal(result.minor_hall_islands,1);
});
test("cutouts touching outside boundary are not enclosed obstacles",()=>{
 assert.equal(hallObstacles(fill(0,0,19,19,(x,y)=>x>=5&&x<=8&&y<=10)).length,0);
});
test("smooth cave walls keep precise tile portals and round interior corners",()=>{
 const paths=naturalWallPaths([[4,0,4,1],[4,1,5,1],[5,1,5,2]]);
 assert.equal(paths.length,1);
 assert.ok(paths[0].includes("M96,0"));
 assert.ok(paths[0].includes("Q120,24"));
 assert.ok(paths[0].endsWith("L120,48"));
});
test("closed cave contours do not duplicate line segments",()=>{
 const edges=[[2,2,3,2],[3,2,3,3],[3,3,2,3],[2,3,2,2],[2,2,3,2]];
 assert.equal(chainsFromEdges(edges).length,1);
 assert.match(naturalWallPaths(edges)[0],/Q/);
 assert.match(naturalWallPaths(edges)[0],/Z$/);
});
test("outward rock hachures and strict normals",()=>{
 assert.ok(naturalWallPaths([[0,4,1,4],[1,4,1,5]])[0].startsWith("M0,96"));
 assert.equal(rockHachurePaths([[4,4,5,4,0,-1]]).length,2);
 assert.throws(()=>rockHachurePaths([[4,4,5,4,1,1]]),/normal/);
});
test("volcanic cavern has a separate organic vector wall layer without changing geometry",()=>{
 const data=JSON.parse(fs.readFileSync(path.join(__dirname,"../blueprints.json"),"utf8"));
 const cave=data.tiles.find(t=>t.id==="basalt_rift");
 assert.equal(cave.wall_style,"cavern");
 const svg=makeSvg(cave);
 assert.match(svg,/<g id="cavern-walls"/);
 assert.match(svg,/<g id="rock-hachures"/);
 assert.match(svg,/<g id="explicit-doors"/);
 assert.ok(!makeSvg(data.tiles.find(t=>t.id==="salt_cloister")).includes('id="cavern-walls"'));
});
