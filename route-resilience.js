"use strict";
// Nontrivial detours: require a usable route at least three cells away
// from the primary route after a three-cell-wide obstruction.
const {accessGraph}=require("./route-analysis");
const POS=(p)=>p.split(",").map(Number);
const SEP=(a,b)=>{const x=POS(a),y=POS(b);return Math.abs(x[0]-y[0])+Math.abs(x[1]-y[1])};
function route(graph,start,goal,blocked=new Set()){
 if(!graph.has(start)||!graph.has(goal)||blocked.has(start)||blocked.has(goal))return null;
 const parent=new Map([[start,null]]),todo=[start];
 for(let at=0;at<todo.length;at++){
  const p=todo[at];if(p===goal)break;
  for(const q of graph.get(p)||[])if(!parent.has(q)&&!blocked.has(q)){parent.set(q,p);todo.push(q)}
 }
 if(!parent.has(goal))return null;
 const path=[];for(let p=goal;p!==null;p=parent.get(p))path.push(p);
 return path.reverse();
}
function alternatives(graph,owner,a,b){
 const direct=route(graph,a,b);
 if(!direct)return {distance:null,resilient:false};
 const corridor=direct.map((p,i)=>({p,i})).filter(({p,i})=>owner.get(p)==="hall"&&i>=4&&i<direct.length-4);
 let best=null;
 // Fixed deterministic interval avoids repeatedly measuring the same corridor.
 const tested=new Set();
 for(const {p,i} of corridor){
  if(i%3!==0)continue;
  const point=POS(p),blocked=new Set();
  for(const q of graph.keys())if(owner.get(q)==="hall"&&SEP(p,q)<=1)blocked.add(q);
  const signature=[...blocked].sort().join(";");
  if(tested.has(signature))continue;tested.add(signature);
  const alternate=route(graph,a,b,blocked);
  if(!alternate)continue;
  const distant=alternate.filter(q=>Math.min(...direct.map(d=>SEP(d,q)))>=3);
  if(distant.length<3)continue;
  const candidate={distance:alternate.length-1,extra_steps:alternate.length-direct.length,
   separated_cells:distant.length,obstruction:p};
  if(!best||candidate.extra_steps<best.extra_steps||
    candidate.extra_steps===best.extra_steps&&candidate.separated_cells>best.separated_cells)best=candidate;
 }
 return {distance:direct.length-1,resilient:!!best,alternate:best};
}
function routeDiversity(owner,doors,portals){
 if(!Array.isArray(portals)||portals.length<2)throw Error("Need at least two portals");
 const results={};
 for(const mode of ["ordinary","unlocked","all"]){
  const graph=accessGraph(owner,doors,mode);
  let reachable=0,reroutable=0;const examples=[];
  for(let i=0;i<portals.length;i++)for(let j=i+1;j<portals.length;j++){
   const result=alternatives(graph,owner,portals[i],portals[j]);
   if(result.distance===null)continue;
   reachable++;
   if(result.resilient){reroutable++;if(examples.length<4)examples.push({from:portals[i],to:portals[j],...result})}
  }
  results[mode]={reachable_pairs:reachable,meaningful_reroute_pairs:reroutable,
   reroute_fraction:reachable?Number((reroutable/reachable).toFixed(3)):null,
   examples};
 }
 return {route_resilience:results};
}
module.exports={route,alternatives,routeDiversity};
