"use strict";
const fs=require("node:fs"),path=require("node:path");
const {buildCells}=require("./assemble");
const {shapeBounds}=require("./geometry");
const {navigationSummary}=require("./topology");
const {analyzeRoutes}=require("./route-analysis");
const {terrainAudit,terrainGraph}=require("./terrain");
const {verticalAudit}=require("./vertical");
const {routeDiversity}=require("./route-resilience");
const key=([x,y])=>x+","+y;const split=s=>s.split(",").map(Number);
const portals=new Set(["4,0","15,0","4,19","15,19","0,4","0,15","19,4","19,15"]);
function ownerMap(tile){return buildCells(tile)}

function neighbors(s){const[x,y]=split(s);return[key([x-1,y]),key([x+1,y]),key([x,y-1]),key([x,y+1])]}

function doorEdges(tile){
 const bounds=new Map(tile.rooms.map(r=>[r[0],shapeBounds(r[2])]));
 return tile.doors.map(([id,side,p,kind])=>{
  const[x1,y1,x2,y2]=bounds.get(id);
  const a=side==="N"?[p,y1]:side==="S"?[p,y2]:side==="W"?[x1,p]:[x2,p];
  const b=side==="N"?[p,y1-1]:side==="S"?[p,y2+1]:side==="W"?[x1-1,p]:[x2+1,p];
  return{id,kind,a:key(a),b:key(b)};
 });
}

function reachable(start,adj){
 const seen=new Set([start]),todo=[start];
 while(todo.length){const p=todo.pop();for(const q of adj.get(p)||[])if(!seen.has(q)){seen.add(q);todo.push(q)}}
 return seen;
}

function adjacency(owner,doors,mode="full"){
 const opens=new Set(doors.filter(d=>mode==="full"||d.kind==="door"||d.kind==="opening").map(d=>[d.a,d.b].sort().join("|")));
 const adj=new Map([...owner.keys()].map(p=>[p,new Set()]));
 for(const[a,z]of owner)for(const b of neighbors(a)){
  if(!owner.has(b))continue;
  if(owner.get(b)!==z&&!opens.has([a,b].sort().join("|")))continue;
  adj.get(a).add(b);
 }
 return adj;
}

function corridorAdj(owner){
 const hall=new Map([...owner].filter(([p,z])=>z==="hall").map(([p])=>[p,new Set()]));
 for(const a of hall.keys())for(const b of neighbors(a))if(hall.has(b))hall.get(a).add(b);
 return hall;
}

function cycleRank(adj){
 let components=0;const seen=new Set();
 for(const p of adj.keys())if(!seen.has(p)){components++;for(const q of reachable(p,adj))seen.add(q)}
 const edges=[...adj.values()].reduce((n,s)=>n+s.size,0)/2;
 return edges-adj.size+components;
}

// The raw grid cycle rank counts every 2x2 floor patch as a loop.
// Those microscopic squares are NOT distinct adventure routes. In a planar
// unit-square grid graph each occupied 2x2 is one bounded elementary face.
// Subtracting them leaves cycles enclosing actual omitted floor/rock areas.
function elementaryFloorFaces(hall){
 let count=0;
 for(const p of hall.keys()){
  const[x,y]=split(p);
  if(hall.has(key([x+1,y]))&&hall.has(key([x,y+1]))&&hall.has(key([x+1,y+1])))count++;
 }
 return count;
}
function nontrivialHallLoopRank(hall){
 const loops=cycleRank(hall)-elementaryFloorFaces(hall);
 if(loops<0)throw Error("Invalid planar hall adjacency");
 return loops;
}

function chokepoints(hall){
 const critical=[];
 for(const p of hall.keys()){
  if(portals.has(p))continue;
  const start="4,0",seen=new Set([start]),stack=[start];
  while(stack.length){const q=stack.pop();for(const n of hall.get(q)||[]){
   if(n===p||seen.has(n))continue;seen.add(n);stack.push(n);
  }}
  if([...portals].some(n=>!seen.has(n)))critical.push(p);
 }
 return critical;
}

function audit(tile){
 const owner=ownerMap(tile),doors=doorEdges(tile);
 const full=adjacency(owner,doors,"full"),normal=adjacency(owner,doors,"normal"),hall=corridorAdj(owner);
 const fully=reachable("4,0",full),ordinarily=reachable("4,0",normal);
 const visibility=tile.rooms.map(([id])=>({room:id,doors:doors.filter(d=>d.id===id).map(d=>d.kind),
  normally_accessible:[...owner].some(([p,z])=>z===id&&ordinarily.has(p))}));
 return{id:tile.id,floor_cells:owner.size,corridor_cells:hall.size,doors:doors.length,
  standard_doors:doors.filter(d=>d.kind==="door").length,open_passages:doors.filter(d=>d.kind==="opening").length,locked_doors:doors.filter(d=>d.kind==="locked").length,secret_doors:doors.filter(d=>d.kind==="secret").length,
  hall_cycle_rank:cycleRank(hall),hall_elementary_square_faces:elementaryFloorFaces(hall),
  hall_nontrivial_loop_rank:nontrivialHallLoopRank(hall),hall_chokepoint_count:chokepoints(hall).length,
  normal_portals_reachable:[...portals].filter(p=>ordinarily.has(p)).length,fully_connected:fully.size===owner.size,
  normally_accessible_floor_fraction:Number((ordinarily.size/owner.size).toFixed(3)),
  chambers:visibility,notes:visibility.filter(r=>r.doors.length===1&&r.doors[0]==="secret").map(r=>`Secret-only chamber ${r.room} is a discovery, not an alternative circulation route`),
  ...navigationSummary(owner),
  ...analyzeRoutes(owner,doors,[...portals],mode=>terrainGraph(owner,doors,tile.terrain||{},mode,"dry")),
  ...terrainAudit(owner,doors,tile.terrain||{}),
  ...(tile.vertical?verticalAudit(owner,doors,tile.terrain||{},tile.vertical):{}),
  ...routeDiversity(owner,doors,[...portals],tile.terrain||{})};
}
if(require.main===module){const data=JSON.parse(fs.readFileSync(path.join(__dirname,"blueprints.json"),"utf8"));const results=data.tiles.map(audit);if(results.some(r=>!r.fully_connected||r.normal_portals_reachable!==8))throw Error("A tile has inaccessible floor or stranded exits");fs.mkdirSync(path.join(__dirname,"reports"),{recursive:true});fs.writeFileSync(path.join(__dirname,"reports/topology.json"),JSON.stringify(results,null,2)+"\n");for(const r of results)console.log(r.id+": "+r.hall_cycle_rank+" cycles, "+r.hall_chokepoint_count+" exit-separating cells");}
module.exports={audit,cycleRank,elementaryFloorFaces,nontrivialHallLoopRank,adjacency,chokepoints,reachable,ownerMap,doorEdges};
