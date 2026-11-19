"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const {terrainModel,terrainGraph}=require("../terrain");
const {verticalModel,buildVerticalGraph,verticalSvg}=require("../vertical");
const {distances}=require("../route-analysis");
const {buildCells,edgeMask,verifyLayout}=require("../assemble");
const {doorEdges,audit}=require("../audit");
const {makeSvg}=require("../render");
const {choirLevelsPlate}=require("../choir-levels-plate");
const data=JSON.parse(fs.readFileSync(path.join(__dirname,"../blueprints.json"),"utf8"));
const choir=data.tiles.find(t=>t.id==="fallen_choir"),owner=buildCells(choir),doors=doorEdges(choir);

test("Fallen Choir has five impassable collapse edges and a separate high walk",()=>{
 const terrain=terrainModel(owner,choir.terrain),vertical=verticalModel(owner,choir.terrain,choir.vertical);
 assert.equal(terrain.barriers.size,5);
 assert.equal(terrain.ruins.size,5);
 assert.equal(vertical.decks.size,1);
 assert.equal(vertical.links.length,2);
 assert.equal([...vertical.decks.values()][0].cells.size,4);
 assert.equal(audit(choir).normal_portals_reachable,8);
});
test("rubble forces a lower detour; two ladders supply a genuine shorter route",()=>{
 const a="8,9",b="11,9";
 const lower=distances(terrainGraph(owner,doors,choir.terrain),"8,9").get(b);
 const stacked=distances(buildVerticalGraph(owner,doors,choir.terrain,choir.vertical),a+",0").get(b+",0");
 assert.ok(Number.isInteger(lower)&&Number.isInteger(stacked));
 assert.ok(stacked<lower,"High gallery must improve on the blocked lower crossing: "+JSON.stringify({lower,stacked}));
 assert.ok(lower>=7,"The collapsed arcade must not be an ornamental crack");
});
test("collapse symbols cannot be invented over walkable passage edges",()=>{
 const malformed=JSON.parse(JSON.stringify(choir.terrain));
 malformed.ruins.push([[8,8],[9,8]]);
 assert.throws(()=>terrainModel(owner,malformed),/Fallen masonry/);
 malformed.ruins=[...choir.terrain.ruins,choir.terrain.ruins[0]];
 assert.throws(()=>terrainModel(owner,malformed),/Fallen masonry/);
});
test("upper walk cannot silently pass through a wall between different rooms",()=>{
 const mock=new Map([["5,5","apse"],["6,5","hall"]]);
 const spec={decks:[{id:"impossible_bridge",level:1,cells:[[5,5],[6,5]]}],
 links:[{at:[5,5],from:0,to:1,kind:"ladder"}]};
 assert.throws(()=>verticalModel(mock,{},spec),/unmodeled upper-level wall/);
});
test("reproducible edited vectors distinguish collapse and vertical symbols without letter badges",()=>{
 const svg=makeSvg(choir),layers=verticalSvg(owner,choir.terrain,choir.vertical).join("");
 assert.equal(svg,makeSvg(choir));
 assert.match(svg,/id="collapsed-masonry"/);
 assert.match(svg,/id="overhead-decks"/);
 assert.equal((layers.match(/data-vertical-symbol="ladder"/g)||[]).length,2);
 assert.ok(!layers.includes('>L</text>'));
 assert.ok(svg.indexOf('id="collapsed-masonry"')<svg.indexOf('id="overhead-decks"'));
});
test("rotation and assembled seams remain unaffected by structural changes",()=>{
 for(let turn=0;turn<4;turn++)for(const side of ["N","S","E","W"])
  assert.equal(edgeMask(choir,turn,side),"4,15");
 const layout=JSON.parse(fs.readFileSync(path.join(__dirname,"../examples/assembly_fallen_choir_2x2.json"),"utf8"));
 assert.equal(verifyLayout(layout,data).length,2);
});
test("editable comparison plate has exactly two distinct views",()=>{
 const plate=choirLevelsPlate(choir);
 assert.equal(plate,choirLevelsPlate(choir));
 assert.match(plate,/id="ground-and-upper-composite"/);
 assert.match(plate,/id="upper-floor-isolation"/);
 assert.match(plate,/isolated-overhead-decks/);
 assert.match(plate,/collapsed arcade/);
 assert.equal((plate.match(/viewBox="0 0 480 480"/g)||[]).length,3);
});
