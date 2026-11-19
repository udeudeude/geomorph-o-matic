"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const {verticalModel,buildVerticalGraph,verticalAudit,verticalSvg}=require("../vertical");
const {terrainGraph}=require("../terrain"),{distances}=require("../route-analysis");
const {buildCells}=require("../assemble"),{doorEdges}=require("../audit");
const tiles=JSON.parse(fs.readFileSync(path.join(__dirname,"../blueprints.json"),"utf8")).tiles;
const rift=tiles.find(t=>t.id==="riftwater_lock");
function corridor(){const map=new Map();for(let x=0;x<=8;x++)map.set(x+",9","hall");return map}
const gantry={decks:[{id:"test_gantry",level:1,cells:[[2,9],[3,9],[4,9],[5,9],[6,9]]}],
 links:[{at:[2,9],from:0,to:1,kind:"ladder"},{at:[6,9],from:0,to:1,kind:"ladder"}]};
test("stacked decks preserve submerged ground and provide an independent dry path",()=>{
 const owner=corridor(),water={water:[[3,9],[4,9],[5,9]]};
 const graph=buildVerticalGraph(owner,[],water,gantry),from=distances(graph,"0,9,0");
 assert.equal(from.has("8,9,0"),true);
 assert.equal(from.has("4,9,0"),false);
 assert.equal(from.has("4,9,1"),true);
 assert.equal(distances(buildVerticalGraph(owner,[],water,{}),"0,9,0").has("8,9,0"),false);
});
test("reject invalid, disconnected or edge-crossing stacked floors",()=>{
 const owner=corridor();
 assert.throws(()=>verticalModel(owner,{}, {decks:[{id:"broken",level:1,cells:[[2,9],[4,9]]}],links:[]}));
 assert.throws(()=>verticalModel(owner,{}, {decks:[{id:"floating",level:1,cells:[[2,9],[3,9]]}],links:[]}));
 assert.throws(()=>verticalModel(owner,{}, {decks:[{id:"edge",level:1,cells:[[0,9],[1,9]]}],links:[]}));
 assert.throws(()=>verticalModel(owner,{}, {decks:[{id:"wrong",level:1,cells:[[2,9]]}],links:[{at:[2,9],from:0,to:2,kind:"stair"}]}));
 assert.throws(()=>verticalModel(owner,{}, {decks:[{id:"wrong",level:1,cells:[[2,9]]}],links:[{at:[1,9],from:0,to:1,kind:"ladder"}]}));
});
test("upper and lower turbine circulation are separate and both accessible",()=>{
 const owner=buildCells(rift),doors=doorEdges(rift),base=terrainGraph(owner,doors,rift.terrain);
 const upper=buildVerticalGraph(owner,doors,rift.terrain,rift.vertical);
 const normal=distances(base,"8,10").get("12,10"),withGantry=distances(upper,"8,10,0").get("12,10,0");
 assert.equal(withGantry,6);
 assert.ok(normal===undefined||normal>withGantry);
 const report=verticalAudit(owner,doors,rift.terrain,rift.vertical);
 assert.equal(report.stacked_decks,1);
 assert.equal(report.stacked_floor_cells,5);
 assert.equal(report.vertical_connections,2);
 assert.equal(report.reachable_stacked_cells,5);
 assert.equal(report.newly_connected_portal_pairs,0);
});
test("overhead deck and ladder vector layers are editable and reproducible",()=>{
 const owner=buildCells(rift),svg=verticalSvg(owner,rift.terrain,rift.vertical).join("");
 assert.match(svg,/id="overhead-decks"/);
 assert.match(svg,/id="deck-parapets"/);
 assert.match(svg,/id="vertical-connections"/);
 assert.equal((svg.match(/<circle /g)||[]).length,2);
 assert.equal(svg,verticalSvg(owner,rift.terrain,rift.vertical).join(""));
});
