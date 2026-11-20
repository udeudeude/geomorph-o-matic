"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {cycleRank,elementaryFloorFaces,nontrivialHallLoopRank,audit}=require("../audit");
const fs=require("node:fs"),path=require("node:path");
const data=JSON.parse(fs.readFileSync(path.join(__dirname,"../blueprints.json"),"utf8"));
function hall(cells){
 const ids=new Set(cells.map(p=>p.join(","))),adj=new Map();
 for(const k of ids){const [x,y]=k.split(",").map(Number);const next=new Set();
  for(const [dx,dy] of[[1,0],[-1,0],[0,1],[0,-1]])if(ids.has((x+dx)+","+(y+dy)))next.add((x+dx)+","+(y+dy));
  adj.set(k,next);
 }
 return adj;
}
test("a broad 2x2 or 3x2 floor does not masquerade as a branching adventure loop",()=>{
 for(const [w,h]of [[2,2],[3,2],[4,3]]){
  const g=hall(Array.from({length:w*h},(_,i)=>[i%w,Math.floor(i/w)]));
  assert.equal(cycleRank(g),(w-1)*(h-1));
  assert.equal(elementaryFloorFaces(g),(w-1)*(h-1));
  assert.equal(nontrivialHallLoopRank(g),0);
 }
});
test("a rock island with a genuine walkaround route survives suppression of tiny cycles",()=>{
 const ring=hall(Array.from({length:9},(_,i)=>[i%3,Math.floor(i/3)]).filter(p=>!(p[0]===1&&p[1]===1)));
 assert.equal(cycleRank(ring),1);
 assert.equal(elementaryFloorFaces(ring),0);
 assert.equal(nontrivialHallLoopRank(ring),1);
});
test("real cave width additions report distinct floor squares and genuine circuits",()=>{
 const scoured=audit(data.tiles.find(t=>t.id==="scoured_siphon"));
 const lantern=audit(data.tiles.find(t=>t.id==="lantern_sink"));
 assert.equal(scoured.hall_cycle_rank,21);
 assert.equal(scoured.hall_elementary_square_faces,17);
 assert.equal(scoured.hall_nontrivial_loop_rank,4);
 assert.equal(lantern.hall_cycle_rank,15);
 assert.equal(lantern.hall_elementary_square_faces,13);
 assert.equal(lantern.hall_nontrivial_loop_rank,2);
 assert.equal(scoured.normal_portals_reachable,8);
 assert.equal(lantern.normal_portals_reachable,8);
});
