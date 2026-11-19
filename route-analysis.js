"use strict";
// Purposeful circulation diagnostics. A wide corridor's tiny grid faces are not
// alternate routes; only changed portal-to-portal journeys count here.
const DIRS=[[1,0],[-1,0],[0,1],[0,-1]];
const edge=(a,b)=>[a,b].sort().join("|");
const modes=["ordinary","unlocked","all"];
function accessGraph(owner,doors,mode="ordinary"){
 if(!(owner instanceof Map))throw Error("Expected floor owner Map");
 if(!modes.includes(mode))throw Error("Unknown access mode: "+mode);
 const open=new Set(doors.filter(d=>d.kind==="door"||(mode!=="ordinary"&&d.kind==="locked")||mode==="all")
  .map(d=>edge(d.a,d.b)));
 const graph=new Map([...owner.keys()].map(k=>[k,[]]));
 for(const [p,zone] of owner){
  const [x,y]=p.split(",").map(Number);
  for(const [dx,dy] of DIRS){
   const q=(x+dx)+","+(y+dy);
   if(owner.has(q)&&(owner.get(q)===zone||open.has(edge(p,q))))graph.get(p).push(q);
  }
 }
 return graph;
}
function distances(graph,origin,owner=null,excludedRoom=null){
 const result=new Map();
 if(!graph.has(origin)||(owner&&owner.get(origin)===excludedRoom))return result;
 const queue=[origin];result.set(origin,0);
 for(let head=0;head<queue.length;head++){
  const p=queue[head],steps=result.get(p)+1;
  for(const q of graph.get(p)){
   if(result.has(q)||(owner&&owner.get(q)===excludedRoom))continue;
   result.set(q,steps);queue.push(q);
  }
 }
 return result;
}
function profile(graph,owner,portals){
 const distancesFrom=portals.map(p=>distances(graph,p));
 const seen=distancesFrom[0];
 let pairs=0,total=0,longest=0,unreachable=0;
 for(let a=0;a<portals.length;a++)for(let b=a+1;b<portals.length;b++){
  const d=distancesFrom[a].get(portals[b]);
  if(d===undefined){unreachable++;continue;}
  pairs++;total+=d;longest=Math.max(d,longest);
 }
 return {
  accessible_floor_cells:seen.size,
  accessible_chambers:[...new Set([...seen.keys()].map(p=>owner.get(p)).filter(z=>z!=="hall"))].sort(),
  reachable_portals:portals.filter(p=>seen.has(p)).length,
  connected_portal_pairs:pairs,
  inaccessible_portal_pairs:unreachable,
  mean_portal_distance:pairs?Number((total/pairs).toFixed(2)):null,
  longest_shortest_portal_distance:pairs?longest:null
 };
}
function roomContribution(graph,owner,portals,room){
 const origins=portals.map(p=>distances(graph,p));
 const detours=portals.map(p=>distances(graph,p,owner,room));
 const result={essential_pairs:0,shortcut_pairs:0,maximum_detour:0};
 for(let i=0;i<portals.length;i++)for(let j=i+1;j<portals.length;j++){
  const normal=origins[i].get(portals[j]);
  if(normal===undefined)continue;
  const without=detours[i].get(portals[j]);
  if(without===undefined)result.essential_pairs++;
  else if(without>normal){result.shortcut_pairs++;result.maximum_detour=Math.max(result.maximum_detour,without-normal)}
 }
 return result;
}
function analyzeRoutes(owner,doors,portals){
 if(!Array.isArray(portals)||portals.length<2||new Set(portals).size!==portals.length||
    portals.some(p=>!owner.has(p)))throw Error("Invalid portal sample");
 const graphs=Object.fromEntries(modes.map(mode=>[mode,accessGraph(owner,doors,mode)]));
 const accessibility=Object.fromEntries(modes.map(mode=>[mode,profile(graphs[mode],owner,portals)]));
 const rooms=[...new Set(owner.values())].filter(z=>z!=="hall").sort();
 const chamberRoutes=rooms.map(room=>{
  const entrances=doors.filter(d=>d.id===room);
  const impact=Object.fromEntries(modes.map(mode=>[mode,roomContribution(graphs[mode],owner,portals,room)]));
  const useful=m=>impact[m].essential_pairs+impact[m].shortcut_pairs>0;
  return {
   room,door_count:entrances.length,door_kinds:entrances.map(d=>d.kind).sort(),
   role:useful("ordinary")?"ordinary_through_route":
    useful("unlocked")?"locked_route":
    useful("all")?"secret_route":
    entrances.length===1?"destination":"no_portal_shortcut",
   impact
  };
 });
 return {
  access_profiles:accessibility,
  chamber_route_roles:chamberRoutes,
  ordinary_through_rooms:chamberRoutes.filter(r=>r.role==="ordinary_through_route").map(r=>r.room),
  gated_through_rooms:chamberRoutes.filter(r=>["locked_route","secret_route"].includes(r.role)).map(r=>r.room)
 };
}
module.exports={accessGraph,distances,profile,roomContribution,analyzeRoutes};
