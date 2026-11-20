"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const data=JSON.parse(fs.readFileSync(path.join(__dirname,"../blueprints.json"),"utf8"));
const get=id=>data.tiles.find(t=>t.id===id);
const {buildCells,edgeMask}=require("../assemble");
const {doorEdges,audit}=require("../audit");
const {terrainGraph}=require("../terrain");
const {distances}=require("../route-analysis");
const {ribSection,auditRibs,report}=require("../cave-rock-ribs");

test("Basalt Rift now separates upper distributaries with real five-foot rock webs",()=>{
 const tile=get("basalt_rift"),floor=buildCells(tile),r=auditRibs(tile);
 const western=r.sections.find(s=>s.id==="western_distributary_web");
 const eastern=r.sections.find(s=>s.id==="eastern_distributary_web");
 assert.equal(western.rock_plan_thickness_feet,5);
 assert.equal(eastern.rock_plan_thickness_feet,5);
 assert.deepEqual(western.floor_flanks,[[6,9],[9,9]]);
 assert.deepEqual(eastern.floor_flanks,[[12,9],[15,9]]);
 assert.deepEqual(western.rock_cells,[[7,9],[8,9]]);
 assert.deepEqual(eastern.rock_cells,[[13,9],[14,9]]);
 for(const k of ["6,8","15,8","6,9","15,9"])assert.equal(floor.get(k),"hall","New bypass must be actual traversable floor: "+k);
 for(const k of ["7,9","8,9","13,9","14,9"])assert.equal(floor.has(k),false,"Rib must be genuine uncarved basalt: "+k);
 const graph=terrainGraph(floor,doorEdges(tile),tile.terrain);
 const westDistance=distances(graph,"6,9").get("9,9");
 const eastDistance=distances(graph,"12,9").get("15,9");
 assert.ok(westDistance>3&&eastDistance>3,JSON.stringify({westDistance,eastDistance}));
 assert.equal(audit(tile).normal_portals_reachable,8);
 assert.equal(audit(tile).fully_connected,true);
 for(let turn=0;turn<4;turn++)for(const side of ["N","E","S","W"])
  assert.equal(edgeMask(tile,turn,side),"4,15");
});

test("previous shallow rock webs were only 2.5 feet thick in the exact same plan",()=>{
 const tile=structuredClone(get("basalt_rift"));
 tile.routes.find(r=>r.id==="western_top").points=[[0,4],[1,4],[1,7],[5,7],[5,9],[7,9],[7,8],[9,8],[9,9],[10,9]];
 tile.routes.find(r=>r.id==="eastern_top").points=[[19,4],[18,4],[18,7],[16,7],[16,9],[14,9],[14,8],[12,8],[12,9],[10,9]];
 const old=buildCells(tile);
 assert.equal(ribSection(old,tile.terrain,{id:"previous-west",at:[8,9],across:"E-W"}).rock_plan_thickness_feet,2.5);
 assert.equal(ribSection(old,tile.terrain,{id:"previous-east",at:[13,9],across:"E-W"}).rock_plan_thickness_feet,2.5);
});

test("rock web registration fails if floor eats into its bearing footprint",()=>{
 const tile=get("basalt_rift"),floor=buildCells(tile);
 const desc={id:"western-distributary",at:[7,9],across:"E-W",minimum_cells:2};
 assert.equal(ribSection(floor,tile.terrain,desc).rock_half_cells,2);
 assert.throws(()=>ribSection(floor,tile.terrain,{...desc,minimum_cells:3}),/below minimum/);
 assert.throws(()=>ribSection(floor,tile.terrain,{...desc,at:[6,9]}),/solid rock/);
 const changed=structuredClone(tile);changed.routes.push({id:"eroded_web",points:[[7,9],[7,9]]});
 assert.throws(()=>ribSection(buildCells(changed),changed.terrain,desc),/solid rock/);
 const invalid={...desc,at:[0,9]};
 assert.throws(()=>ribSection(floor,tile.terrain,invalid),/Invalid/);
 assert.throws(()=>auditRibs(get("fallen_choir")) ,/Only cavern/);
});

test("other caves retain openly provisional thin partitions rather than fictitious structural certification",()=>{
 const hollow=auditRibs(get("hollow_causeway")),lantern=auditRibs(get("lantern_sink"));
 assert.equal(hollow.sections[0].rock_plan_thickness_feet,2.5);
 assert.equal(lantern.sections[0].rock_plan_thickness_feet,2.5);
 const r=report(data);
 assert.deepEqual(r,report(data));
 assert.ok(r.cave_tiles.some(t=>t.id==="scoured_siphon"&&t.sections.length===0));
 assert.ok(r.cave_tiles.every(t=>t.sections.every(s=>/headroom unknown/.test(s.interpretation))));
 assert.match(r.scope,/not engineering evidence/);
});
