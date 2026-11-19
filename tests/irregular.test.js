"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const {shapeCells,shapeBounds}=require("../geometry");
const {makeSvg}=require("../render");
const {audit}=require("../audit");
const {edgeMask,verifyLayout}=require("../assemble");
const data=JSON.parse(fs.readFileSync(path.join(__dirname,"../blueprints.json"),"utf8"));
const newcomers=data.tiles.filter(t=>t.geometry==="row-runs");
test("row-run footprints are connected and reject malformed and duplicate runs",()=>{
 assert.deepEqual(shapeBounds({rows:[[4,4,5],[5,3,6],[6,4,5]]}),[3,4,6,6]);
 assert.throws(()=>shapeCells({rows:[[3,3,3],[7,7,7]]}),/Disconnected/);
 assert.throws(()=>shapeCells({rows:[[3,3,4],[3,4,5]]}),/Overlapping/);
});
test("all irregular architectural studies have nonrectangular occupancies and reproducible SVG masters",()=>{
 assert.equal(newcomers.length,3);
 for(const tile of newcomers){
  assert.ok(tile.rooms.some(r=>typeof r[2]==="object"));
  assert.ok(tile.rooms.some(r=>new Set(r[2].rows.map(v=>v[1]+","+v[2])).size>1));
  const first=makeSvg(tile),second=makeSvg(tile);assert.equal(first,second);
  assert.ok(first.includes('<g id="stone-walls"'));
  assert.ok(first.includes('<g id="explicit-doors"'));
 }
});
test("irregular tiles preserve all four rotation-invariant join masks",()=>{
 for(const t of newcomers)for(let turn=0;turn<4;turn++)for(const side of ["N","S","E","W"])assert.equal(edgeMask(t,turn,side),side==="N"||side==="S"?"4,15":"4,15");
 const layout={rows:[[...newcomers.map(t=>({id:t.id,turn:1}))],[...newcomers.map(t=>({id:t.id,turn:3}))]]};
 assert.equal(verifyLayout(layout,data).length,2);
});
test("irregular studies retain meaningful corridor loops and all walkable rooms",()=>{
 for(const t of newcomers){const a=audit(t);assert.equal(a.fully_connected,true);assert.equal(a.normal_portals_reachable,8);assert.ok(a.hall_cycle_rank>=3);assert.ok(a.secret_doors>=1);assert.ok(a.doors<=2*t.rooms.length)}
});

test("Riftwater Lock has deliberate floodworks, staged discoveries and a working public bypass",()=>{
 const tile=data.tiles.find(t=>t.id==="riftwater_lock");
 assert.ok(tile);
 const result=audit(tile);
 assert.equal(result.normal_portals_reachable,8);
 assert.equal(result.fully_connected,true);
 assert.equal(result.rooms,undefined);
 assert.equal(result.locked_doors,2);
 assert.equal(result.secret_doors,2);
 assert.ok(result.hall_cycle_rank>=6);
 assert.ok(result.substantial_hall_circuits>=1);
 assert.ok(result.chamber_route_roles.some(r=>r.room==="office"&&r.role==="ordinary_through_route"));
 assert.ok(makeSvg(tile).includes('id="cavern-walls"'));
});
