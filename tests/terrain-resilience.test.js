"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const {terrainModel,terrainGraph,terrainAudit,terrainSvg}=require("../terrain");
const {route,alternatives,routeDiversity}=require("../route-resilience");
const {buildCells}=require("../assemble");
const {audit}=require("../audit");
const {makeSvg}=require("../render");
const fs=require("node:fs"),path=require("node:path");
const tiles=JSON.parse(fs.readFileSync(path.join(__dirname,"../blueprints.json"),"utf8")).tiles;
const morph=tiles.find(t=>t.id==="riftwater_lock");
const grid=(width,height,rows)=>{
 const owner=new Map();for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  if(!rows||rows.includes(y))owner.set(x+","+y,"hall");
 }
 return owner;
};
test("dry water is impassable; bridges remain traversable; wading changes access",()=>{
 const cells=grid(5,1),doors=[];
 const spec={water:[[2,0]]};
 assert.equal(route(terrainGraph(cells,doors,spec),"0,0","4,0"),null);
 assert.equal(route(terrainGraph(cells,doors,spec,"ordinary","wading"),"0,0","4,0").length,5);
 spec.bridges=[[2,0]];
 assert.equal(route(terrainGraph(cells,doors,spec),"0,0","4,0").length,5);
});
test("height changes are impassable without authored ramps",()=>{
 const cells=grid(4,1),spec={elevations:[[1,[[2,0],[3,0]]]]};
 assert.equal(route(terrainGraph(cells,[],spec),"0,0","3,0"),null);
 spec.ramps=[[[1,0],[2,0]]];
 assert.equal(route(terrainGraph(cells,[],spec),"0,0","3,0").length,4);
});
test("terrain validation rejects unreachable, inconsistent, duplicate or edge geometry",()=>{
 const cells=grid(7,6);
 for(const spec of [
  {water:[[20,2]]},{bridges:[[2,2]]},
  {water:[[1,1],[1,1]]},
  {elevations:[[1,[[2,2]]],[2,[[2,2]]]]},
  {elevations:[[1,[[3,2]]]],ramps:[[[1,1],[3,2]]]},
  {elevations:[[1,[[4,0]]]]},
  {water:[[4,0]]}
 ])assert.throws(()=>terrainModel(cells,spec));
});
test("terrain vector overlays are deterministically layered and editable",()=>{
 const cells=grid(7,6);
 const spec={water:[[2,2]],bridges:[[2,2]],elevations:[[1,[[4,2],[4,3]]]],ramps:[[[3,2],[4,2]]]};
 const svg=terrainSvg(cells,spec).join("");
 assert.match(svg,/id="water-terrain"/);
 assert.match(svg,/id="dry-bridges"/);
 assert.match(svg,/id="elevation-edges"/);
 assert.match(svg,/id="level-ramps"/);
 assert.equal(svg,terrainSvg(cells,spec).join(""));
});
test("multiple corridors can provide real separated alternatives",()=>{
 const cells=new Map();
 for(let x=0;x<=14;x++)for(const y of [2,7])cells.set(x+","+y,"hall");
 for(let y=2;y<=7;y++)for(const x of [0,14])cells.set(x+","+y,"hall");
 const graph=terrainGraph(cells,[]);
 const answer=alternatives(graph,cells,"0,2","14,2");
 assert.equal(answer.distance,14);
 assert.equal(answer.resilient,true);
 assert.ok(answer.alternate.separated_cells>=3);
 assert.equal(routeDiversity(cells,[],["0,2","14,2"]).route_resilience.ordinary.meaningful_reroute_pairs,1);
});
test("wide corridors and single passages are not scored as diverse routes",()=>{
 const wide=grid(15,8,[2,3]),thin=grid(15,8,[2]);
 for(const cells of [wide,thin]){
  const graph=terrainGraph(cells,[]);
  assert.equal(alternatives(graph,cells,"0,2","14,2").resilient,false);
 }
});
test("Riftwater Lock encodes water, a walkable bridge, and genuinely raised rooms",()=>{
 const owner=buildCells(morph),model=terrainModel(owner,morph.terrain);
 assert.ok(model.water.size>=4);
 assert.ok(model.bridges.size>=2);
 assert.ok(model.heights.size>=10);
 assert.ok(model.ramps.size>=1);
 const summary=terrainAudit(owner,require("../audit").doorEdges(morph),morph.terrain);
 assert.equal(summary.travel.dry.reachable_portals,8);
 assert.equal(summary.travel.wading.reachable_portals,8);
 const svg=makeSvg(morph);
 assert.ok(svg.includes('id="water-terrain"'));
 assert.ok(svg.includes('id="level-ramps"'));
 assert.ok(svg.includes('id="dry-bridges"'));
 assert.ok(svg.indexOf('id="water-terrain"')<svg.indexOf('id="features"'));
 assert.equal(audit(morph).water_cells,model.water.size);
});
