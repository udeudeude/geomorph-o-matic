"use strict";
// Independently navigable stacked decks. The underlying 20x20 floor still owns
// door, water and ramp rules; an upper deck never overwrites its lower floor.
const {terrainModel,terrainGraph}=require("./terrain");
const {distances}=require("./route-analysis");
const POS=p=>p.join(",");
const NODE=(p,z)=>p+","+z;
const NEIGHBORS=[[1,0],[-1,0],[0,1],[0,-1]];
const PORTALS=["4,0","15,0","4,19","15,19","0,4","0,15","19,4","19,15"];
function verticalModel(owner,terrain={},vertical={}){
 if(!(owner instanceof Map))throw Error("Vertical geometry requires floor cells");
 if(!vertical||Array.isArray(vertical)||typeof vertical!=="object")throw Error("Invalid vertical definition");
 const base=terrainModel(owner,terrain),nodes=new Map(),decks=new Map(),links=[];
 for(const p of owner.keys())nodes.set(NODE(p,base.heights.get(p)||0),{at:p,level:base.heights.get(p)||0,deck:null});
 const location=(p)=>{
  if(!Array.isArray(p)||p.length!==2||!p.every(Number.isInteger)||
     p.some(v=>v<0||v>=20)||!owner.has(POS(p)))throw Error("Invalid stacked floor coordinate");
  return POS(p);
 };
 if(!Array.isArray(vertical.decks||[])||!Array.isArray(vertical.links||[]))throw Error("Invalid deck/link list");
 for(const deck of vertical.decks||[]){
  if(!deck||typeof deck.id!=="string"||!/^[a-z][a-z0-9_-]*$/.test(deck.id)||
     !Number.isInteger(deck.level)||deck.level===0||!Array.isArray(deck.cells)||!deck.cells.length||
     decks.has(deck.id))throw Error("Invalid or duplicate stacked deck");
  const cells=new Set();
  for(const coordinate of deck.cells){
   const p=location(coordinate),[x,y]=coordinate,k=NODE(p,deck.level);
   if(!x||x===19||!y||y===19)throw Error("Elevated deck cannot change tile edges");
   if(cells.has(p)||nodes.has(k))throw Error("Duplicate stacked floor cell");
   cells.add(p);nodes.set(k,{at:p,level:deck.level,deck:deck.id});
  }
  const reached=new Set(),queue=[[...cells][0]];
  while(queue.length){const p=queue.pop();if(reached.has(p))continue;reached.add(p);
   const [x,y]=p.split(",").map(Number);
   for(const [dx,dy] of NEIGHBORS){const q=POS([x+dx,y+dy]);if(cells.has(q)&&!reached.has(q))queue.push(q)}
  }
  if(reached.size!==cells.size)throw Error("Disconnected deck: "+deck.id);
  decks.set(deck.id,{level:deck.level,cells});
 }
 const unique=new Set();
 for(const link of vertical.links||[]){
  if(!link||!Number.isInteger(link.from)||!Number.isInteger(link.to)||
     link.from===link.to||!["stair","ladder"].includes(link.kind)||
     link.kind==="stair"&&Math.abs(link.from-link.to)!==1)throw Error("Invalid vertical connection");
  const p=location(link.at),a=NODE(p,link.from),b=NODE(p,link.to);
  if(!nodes.has(a)||!nodes.has(b)||nodes.get(a).deck===null&&nodes.get(b).deck===null)
   throw Error("Vertical links must connect existing stacked floors");
  const k=[a,b].sort().join("|");if(unique.has(k))throw Error("Duplicate vertical link");
  unique.add(k);links.push({at:p,from:link.from,to:link.to,kind:link.kind,a,b});
 }
 if(decks.size&&links.length===0)throw Error("Stacked decks require a vertical connection");
 // Every elevated component needs a physical connection to an existing floor.
 if(decks.size){
  const graph=buildVerticalGraph(owner,[],terrain,vertical,"all","wading",true);
  const reached=new Set([...nodes].filter(([,n])=>n.deck===null).map(([k])=>k)),queue=[...reached];
  for(let i=0;i<queue.length;i++)for(const q of graph.get(queue[i])||[]){
   if(!reached.has(q)){reached.add(q);queue.push(q)}
  }
  for(const [k,n] of nodes)if(n.deck&&!reached.has(k))throw Error("Unreachable stacked deck: "+n.deck);
 }
 return {base,nodes,decks,links};
}
// Internal mode avoids recursively validating while the model is being checked.
function buildVerticalGraph(owner,doors,terrain={},vertical={},access="ordinary",travel="dry",skipValidation=false){
 const model=skipValidation?rawVerticalModel(owner,terrain,vertical):verticalModel(owner,terrain,vertical);
 const baseGraph=terrainGraph(owner,doors,terrain,access,travel),graph=new Map();
 for(const k of model.nodes.keys())graph.set(k,[]);
 const add=(a,b)=>{if(!graph.get(a).includes(b))graph.get(a).push(b)};
 for(const [p,near] of baseGraph){const a=NODE(p,model.base.heights.get(p)||0);
  for(const q of near)add(a,NODE(q,model.base.heights.get(q)||0));
 }
 for(const [k,n] of model.nodes){if(!n.deck)continue;
  const [x,y]=n.at.split(",").map(Number);
  for(const [dx,dy] of NEIGHBORS){const q=NODE(POS([x+dx,y+dy]),n.level);
   if(model.nodes.get(q)?.deck)add(k,q);
  }
 }
 for(const {a,b} of model.links){
  if(travel==="dry" && [a,b].some(k=>{
   const n=model.nodes.get(k);
   return !n.deck && model.base.water.has(n.at) && !model.base.bridges.has(n.at);
  }))continue;
  add(a,b);add(b,a);
 }
 return graph;
}
function rawVerticalModel(owner,terrain,vertical){
 // No reachability recursion: use an identical shape check with an empty deck
 // model constructed from known validated data during verticalModel's own check.
 const base=terrainModel(owner,terrain),nodes=new Map(),decks=new Map(),links=[];
 for(const p of owner.keys())nodes.set(NODE(p,base.heights.get(p)||0),{at:p,level:base.heights.get(p)||0,deck:null});
 for(const d of vertical.decks||[]){decks.set(d.id,{level:d.level,cells:new Set(d.cells.map(POS))});
  for(const cell of d.cells){const p=POS(cell);nodes.set(NODE(p,d.level),{at:p,level:d.level,deck:d.id})}
 }
 for(const l of vertical.links||[]){const p=POS(l.at);links.push({...l,at:p,a:NODE(p,l.from),b:NODE(p,l.to)})}
 return {base,nodes,decks,links};
}
function verticalAudit(owner,doors,terrain={},vertical={}){
 const model=verticalModel(owner,terrain,vertical),original=terrainGraph(owner,doors,terrain),stacked=buildVerticalGraph(owner,doors,terrain,vertical);
 const start=NODE("4,0",0),accessible=distances(stacked,start),portals=PORTALS.map(p=>NODE(p,0));
 let improved=0,newlyConnected=0,largestSaving=0;
 for(let i=0;i<PORTALS.length;i++){
  const old=distances(original,PORTALS[i]),now=distances(stacked,portals[i]);
  for(let j=i+1;j<PORTALS.length;j++){
   const a=old.get(PORTALS[j]),b=now.get(portals[j]);
   if(b===undefined)continue;
   if(a===undefined)newlyConnected++;
   else if(b<a){improved++;largestSaving=Math.max(largestSaving,a-b)}
  }
 }
 return {stacked_decks:model.decks.size,stacked_floor_cells:[...model.nodes.values()].filter(n=>n.deck).length,
  vertical_connections:model.links.length,reachable_stacked_cells:[...accessible.keys()].filter(k=>model.nodes.get(k)?.deck).length,
  improved_portal_pairs:improved,newly_connected_portal_pairs:newlyConnected,largest_portal_distance_saving:largestSaving};
}
function verticalSvg(owner,terrain={},vertical={},cellSize=24){
 const model=verticalModel(owner,terrain,vertical),out=[];
 if(!model.decks.size)return out;
 out.push('<g id="overhead-decks" fill="#d6b88e" fill-opacity=".52" stroke="none">');
 for(const [,deck] of model.decks)for(const p of deck.cells){const [x,y]=p.split(",").map(Number);
  out.push(`<rect x="${x*cellSize}" y="${y*cellSize}" width="${cellSize}" height="${cellSize}"/>`);
 }
 out.push('</g><g id="deck-parapets" fill="none" stroke="#715f4f" stroke-width="2" stroke-dasharray="7 3">');
 for(const [,deck] of model.decks)for(const p of deck.cells){const [x,y]=p.split(",").map(Number);
  for(const [dx,dy] of NEIGHBORS){const q=POS([x+dx,y+dy]);if(deck.cells.has(q))continue;
   const x1=(dx===1?x+1:x)*cellSize,y1=(dy===1?y+1:y)*cellSize;
   out.push(`<path d="M${x1},${y1}${dx?`v${cellSize}`:`h${cellSize}`}"/>`);
  }
 }
 out.push('</g><g id="vertical-connections" font-family="sans-serif" text-anchor="middle">');
 for(const link of model.links){const [x,y]=link.at.split(",").map(Number),cx=(x+.5)*cellSize,cy=(y+.5)*cellSize;
  out.push(`<circle cx="${cx}" cy="${cy}" r="${cellSize*.32}" fill="#fff9e9" stroke="#4f443b" stroke-width="1.6"/>`);
  out.push(`<text x="${cx}" y="${cy+3.7}" font-size="9" font-weight="bold" fill="#473b32">${link.kind==="ladder"?"L":"S"}</text>`);
 }
 out.push('</g>');return out;
}
module.exports={verticalModel,buildVerticalGraph,verticalAudit,verticalSvg};
