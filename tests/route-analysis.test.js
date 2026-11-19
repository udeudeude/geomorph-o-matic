"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const {analyzeRoutes,accessGraph,distances}=require("../route-analysis");
const {organicWallPaths}=require("../cave-contours");
const {makeSvg}=require("../render");
const fs=require("node:fs"),path=require("node:path");
const byId=new Map(JSON.parse(fs.readFileSync(path.join(__dirname,"../blueprints.json"),"utf8")).tiles.map(t=>[t.id,t]));

function crossing(kind="door",single=false){
 const owner=new Map();
 for(let x=0;x<=4;x++)owner.set(x+",0","hall");
 for(let x=0;x<=4;x++)owner.set(x+",1",x===2?"vault":"hall");
 const doors=[{id:"vault",kind,a:"1,1",b:"2,1"}];
 if(!single)doors.push({id:"vault",kind:"door",a:"2,1",b:"3,1"});
 return {owner,doors,portals:["0,1","4,1"]};
}
test("room shortcut measures actual journey detour, not tiny passage grid cycles",()=>{
 const {owner,doors,portals}=crossing();
 const result=analyzeRoutes(owner,doors,portals);
 assert.equal(result.chamber_route_roles[0].role,"ordinary_through_route");
 assert.equal(result.chamber_route_roles[0].impact.ordinary.shortcut_pairs,1);
 assert.equal(result.chamber_route_roles[0].impact.ordinary.maximum_detour,2);
 assert.equal(result.access_profiles.ordinary.mean_portal_distance,4);
 assert.equal(result.access_profiles.ordinary.inaccessible_portal_pairs,0);
});
test("a one-door room does not create a fictitious alternate route",()=>{
 const {owner,doors,portals}=crossing("door",true);
 const result=analyzeRoutes(owner,doors,portals);
 assert.equal(result.chamber_route_roles[0].role,"destination");
 assert.equal(result.chamber_route_roles[0].impact.all.shortcut_pairs,0);
 assert.equal(result.access_profiles.ordinary.mean_portal_distance,6);
});
test("locked and secret doors are not silently counted as open bypasses",()=>{
 for(const [kind,expected] of [["locked","locked_route"],["secret","secret_route"]]){
  const {owner,doors,portals}=crossing(kind);
  const a=analyzeRoutes(owner,doors,portals);
  assert.equal(a.chamber_route_roles[0].role,expected);
  assert.equal(a.chamber_route_roles[0].impact.ordinary.shortcut_pairs,0);
  assert.equal(a.chamber_route_roles[0].impact.all.shortcut_pairs,1);
  assert.equal(a.access_profiles.ordinary.mean_portal_distance,6);
  assert.equal(a.access_profiles.all.mean_portal_distance,4);
 }
});
test("route graph refuses nonexistent portals and unknown access policy",()=>{
 const {owner,doors,portals}=crossing();
 assert.throws(()=>analyzeRoutes(owner,doors,["0,1","100,1"]),/portal/);
 assert.throws(()=>accessGraph(owner,doors,"free-for-all"),/mode/);
 assert.equal(distances(accessGraph(owner,doors),portals[0]).size,owner.size);
});
test("organic cave cubic paths are deterministic and preserve exact boundary vertices",()=>{
 const segments=[[4,0,4,1],[4,1,5,1],[5,1,5,2]];
 const paths=organicWallPaths(segments);
 assert.deepEqual(paths,organicWallPaths(segments));
 assert.equal(paths.length,1);
 assert.ok(paths[0].startsWith("M96,0L96,24"));
 assert.ok(paths[0].includes("C"));
 assert.ok(paths[0].endsWith("120,48"));
 assert.ok(!paths[0].includes("NaN"));
 assert.throws(()=>organicWallPaths(segments,{irregularity:0.5}),/Unsafe/);
});
test("closed cave outlines remain closed and tile source reproducibility is preserved",()=>{
 const closed=[[3,3,4,3],[4,3,4,4],[4,4,3,4],[3,4,3,3]];
 assert.match(organicWallPaths(closed)[0],/Z$/);
 const rift=byId.get("basalt_rift");
 const svg=makeSvg(rift);
 assert.equal(svg,makeSvg(rift));
 const wall=svg.match(/<g id="cavern-walls"[^>]*>([\s\S]*?)<\/g>/);
 assert.ok(wall&&wall[1].includes("C"));
 assert.ok(svg.includes('id="rock-hachures"'));
});
test("real tiles expose staged access and room route roles without inventing connectivity",()=>{
 for(const tile of byId.values()){
  const {audit}=require("../audit");
  const a=audit(tile);
  assert.equal(a.access_profiles.ordinary.reachable_portals,8);
  assert.equal(a.access_profiles.all.accessible_floor_cells,a.floor_cells);
  assert.equal(a.chamber_route_roles.length,tile.rooms.length);
  assert.ok(a.chamber_route_roles.every(r=>r.door_count>=1));
 }
});
