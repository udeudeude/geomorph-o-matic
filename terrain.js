"use strict";
// Canonical environmental traversal. Geometry, not furnishings, determines access.
const {accessGraph,distances}=require("./route-analysis");
const {naturalWaterSvg}=require("./cave-illustration");
const POS=(p)=>p.join(",");
const EDGE=(a,b)=>[a,b].sort().join("|");
const PORTALS=["4,0","15,0","4,19","15,19","0,4","0,15","19,4","19,15"];

function terrainModel(owner,spec={}){
 if(!(owner instanceof Map))throw Error("Terrain requires occupied floor Map");
 if(!spec||Array.isArray(spec)||typeof spec!=="object")throw Error("Invalid terrain definition");
 const water=new Set(),bridges=new Set(),heights=new Map(),ramps=new Set(),steps=new Map(),barriers=new Set(),chokes=new Set();
 // Restrict actual exterior mouths, not every boundary cell of
 // a small routing-test fixture. Real wide profiles have sixteen edge cells.
 const boundaryFloor=new Set([...owner.keys()].filter(p=>{const [x,y]=p.split(",").map(Number);return x===0||x===19||y===0||y===19;}));
 const widePortals=new Set(["N","E","S","W"].flatMap(side=>[4,5,14,15].map(offset=>
  ({N:[offset,0],S:[offset,19],W:[0,offset],E:[19,offset]})[side].join(","))));
 const isWide=boundaryFloor.size===widePortals.size&&[...boundaryFloor].every(p=>widePortals.has(p));
 const protectedPortals=isWide?widePortals:new Set(PORTALS);
 const coordinate=(p,description)=>{
  if(!Array.isArray(p)||p.length!==2||p.some(n=>!Number.isInteger(n))||
     p.some(n=>n<0||n>=20)||!owner.has(POS(p)))throw Error("Invalid "+description+" coordinate");
  return POS(p);
 };
 for(const p of spec.water||[]){const k=coordinate(p,"water");if(water.has(k))throw Error("Duplicate water cell");water.add(k)}
 for(const p of spec.bridges||[]){const k=coordinate(p,"bridge");if(bridges.has(k)||!water.has(k))throw Error("Bridge must occupy water exactly once");bridges.add(k)}
 for(const entry of spec.elevations||[]){
  if(!Array.isArray(entry)||entry.length!==2||!Number.isInteger(entry[0])||
     entry[0]===0||!Array.isArray(entry[1]))throw Error("Invalid elevation group");
  for(const p of entry[1]){const k=coordinate(p,"elevation");if(heights.has(k))throw Error("Overlapping elevation groups");heights.set(k,entry[0])}
 }
 for(const e of spec.ramps||[]){
  if(!Array.isArray(e)||e.length!==2)throw Error("Invalid ramp");
  const a=coordinate(e[0],"ramp"),b=coordinate(e[1],"ramp");
  if(Math.abs(e[0][0]-e[1][0])+Math.abs(e[0][1]-e[1][1])!==1||
     Math.abs((heights.get(a)||0)-(heights.get(b)||0))!==1)throw Error("Ramp must join adjacent distinct levels");
  const k=EDGE(a,b);if(ramps.has(k))throw Error("Duplicate ramp");ramps.add(k);
 }
 // Lava steps are explicit risers with tread depths, not inferred gradual ramps.
 if(!Array.isArray(spec.steps||[]))throw Error("Steps must be an array");
 for(const item of spec.steps||[]){
  if(!item||Array.isArray(item)||!Array.isArray(item.edge)||item.edge.length!==2||
     !Number.isFinite(item.rise_feet)||item.rise_feet<=0||item.rise_feet>2||
     !Number.isInteger(item.risers)||item.risers<1||item.risers>3||
     item.rise_feet/item.risers>0.75||2.5/item.risers<0.8)
    throw Error("Invalid basalt step dimensions");
  const [a,b]=item.edge.map(point=>coordinate(point,"step"));
  if(Math.abs(item.edge[0][0]-item.edge[1][0])+Math.abs(item.edge[0][1]-item.edge[1][1])!==1||
     Math.abs((heights.get(a)||0)-(heights.get(b)||0))!==1||
     water.has(a)||water.has(b)||protectedPortals.has(a)||protectedPortals.has(b))
    throw Error("Basalt step must join adjacent dry interior height levels");
  const k=EDGE(a,b);
  if(ramps.has(k)||steps.has(k))throw Error("Duplicate or overlapping step/ramp");
  steps.set(k,{rise_feet:item.rise_feet,risers:item.risers});
 }
 // Full-height masonry partitions block BOTH walking and hydraulic flow.
 // They must be genuine occupied edges, not portal seams or duplicate ramps.
 if(!Array.isArray(spec.barriers||[]))throw Error("Terrain barriers must be an array");
 for(const e of spec.barriers||[]){
  if(!Array.isArray(e)||e.length!==2)throw Error("Invalid masonry partition");
  const a=coordinate(e[0],"barrier"),b=coordinate(e[1],"barrier");
  if(Math.abs(e[0][0]-e[1][0])+Math.abs(e[0][1]-e[1][1])!==1||
     protectedPortals.has(a)||protectedPortals.has(b))throw Error("Masonry partition must join interior neighbors");
  const k=EDGE(a,b);
  if(barriers.has(k)||ramps.has(k)||steps.has(k))throw Error("Duplicate masonry partition or overlapping ramp");
  barriers.add(k);
 }
 const ruins=new Set();
 for(const e of spec.ruins||[]){
  if(!Array.isArray(e)||e.length!==2)throw Error("Invalid fallen-masonry edge");
  const a=coordinate(e[0],"ruin"),b=coordinate(e[1],"ruin"),k=EDGE(a,b);
  if(!barriers.has(k)||ruins.has(k))throw Error("Fallen masonry must be a unique blocked wall edge");
  ruins.add(k);
 }
 // Cave breakdown chokes are real, dry, completely blocked edges, not
 // decorative floor rocks. They must not masquerade as worked masonry.
 if(!Array.isArray(spec.chokes||[]))throw Error("Cave chokes must be an array");
 for(const e of spec.chokes||[]){
  if(!Array.isArray(e)||e.length!==2)throw Error("Invalid cave choke");
  const a=coordinate(e[0],"choke"),b=coordinate(e[1],"choke"),k=EDGE(a,b);
  if(Math.abs(e[0][0]-e[1][0])+Math.abs(e[0][1]-e[1][1])!==1||
     protectedPortals.has(a)||protectedPortals.has(b)||chokes.has(k)||
     barriers.has(k)||ramps.has(k)||steps.has(k)||water.has(a)||water.has(b)||
     (heights.get(a)||0)!==(heights.get(b)||0))
   throw Error("Cave choke must block a unique dry interior edge");
  chokes.add(k);
 }
 for(const p of protectedPortals)if(owner.has(p)&&(water.has(p)||heights.has(p)))throw Error("Terrain cannot change standard edge portal");
 return {water,bridges,heights,ramps,steps,barriers,ruins,chokes};
}
function terrainGraph(owner,doors,spec={},access="ordinary",travel="dry"){
 if(!["dry","wading"].includes(travel))throw Error("Unknown terrain travel mode");
 const model=terrainModel(owner,spec),graph=accessGraph(owner,doors,access);
 for(const [p,adj] of graph){
  if(travel==="dry"&&model.water.has(p)&&!model.bridges.has(p)){graph.set(p,[]);continue}
  graph.set(p,adj.filter(q=>{
   if(model.barriers.has(EDGE(p,q))||model.chokes.has(EDGE(p,q)))return false;
   if(travel==="dry"&&model.water.has(q)&&!model.bridges.has(q))return false;
   return (model.heights.get(p)||0)===(model.heights.get(q)||0)||model.ramps.has(EDGE(p,q))||model.steps.has(EDGE(p,q));
  }));
 }
 return graph;
}
function terrainAudit(owner,doors,spec={},portals=PORTALS){
 const model=terrainModel(owner,spec),results={};
 for(const travel of ["dry","wading"]){
  const graph=terrainGraph(owner,doors,spec,"ordinary",travel);
  const seen=distances(graph,portals[0]);
  results[travel]={accessible_floor_cells:seen.size,reachable_portals:portals.filter(p=>seen.has(p)).length};
 }
 return {water_cells:model.water.size,bridged_water_cells:model.bridges.size,
  elevated_cells:model.heights.size,ramp_edges:model.ramps.size,step_edges:model.steps.size,barrier_edges:model.barriers.size,ruined_wall_edges:model.ruins.size,cave_choke_edges:model.chokes.size,travel:results};
}
// Each layer is independently editable in exported SVG.
function terrainSvg(owner,spec={},cellSize=24,style="masonry"){
 const model=terrainModel(owner,spec),out=[];
 const xy=(s)=>s.split(",").map(Number);
 if(model.water.size&&style==="cavern")out.push(...naturalWaterSvg(model.water,cellSize));
 if(model.water.size&&style!=="cavern"){
  out.push('<g id="water-terrain" fill="#86b8c3" fill-opacity=".64" stroke="none">');
  for(const p of [...model.water].sort()){const [x,y]=xy(p);out.push('<rect x="'+x*cellSize+'" y="'+y*cellSize+'" width="'+cellSize+'" height="'+cellSize+'"/>')}
  out.push("</g>");
 }
 if(model.bridges.size){
  out.push('<g id="dry-bridges" fill="#d5c6a4" stroke="#635f54" stroke-width=".9">');
  const visited=new Set();
  for(const first of [...model.bridges].sort()){
   if(visited.has(first))continue;
   const component=[],queue=[first];visited.add(first);
   while(queue.length){
    const p=queue.pop();component.push(p);const [x,y]=xy(p);
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
     const q=POS([x+dx,y+dy]);if(model.bridges.has(q)&&!visited.has(q)){visited.add(q);queue.push(q)}
    }
   }
   const coords=component.map(xy),xs=coords.map(p=>p[0]),ys=coords.map(p=>p[1]);
   const x1=Math.min(...xs),x2=Math.max(...xs),y1=Math.min(...ys),y2=Math.max(...ys);
   if(component.length!==(x2-x1+1)*(y2-y1+1)||x1!==x2&&y1!==y2)
    throw Error("Bridges must form straight contiguous spans");
   const vertical=y2>y1,X=x1*cellSize,Y=y1*cellSize;
   const w=(x2-x1+1)*cellSize,h=(y2-y1+1)*cellSize,margin=cellSize*.18;
   const rx=X+(vertical?margin:0),ry=Y+(vertical?0:margin);
   const rw=w-(vertical?2*margin:0),rh=h-(vertical?0:2*margin);
   out.push('<rect x="'+rx+'" y="'+ry+'" width="'+rw+'" height="'+rh+'"/>');
   for(let offset=6;offset<(vertical?rh:rw);offset+=6)
    out.push(vertical?'<path d="M'+rx+','+(ry+offset)+'h'+rw+'"/>':
      '<path d="M'+(rx+offset)+','+ry+'v'+rh+'"/>');
  }
  out.push("</g>");
 }
 if(model.heights.size){
  out.push('<g id="elevation-edges" fill="none" stroke="#8f7562" stroke-width="2" stroke-dasharray="2 3">');
  const seen=new Set();
  for(const p of model.heights.keys()){
   const [x,y]=xy(p),height=model.heights.get(p);
   for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
    const q=POS([x+dx,y+dy]);
    if(!owner.has(q)||(model.heights.get(q)||0)===height)continue;
    const e=EDGE(p,q);if(seen.has(e)||model.ramps.has(e)||model.steps.has(e))continue;seen.add(e);
    const X=(dx===1?x+1:x)*cellSize,Y=(dy===1?y+1:y)*cellSize;
    out.push(dx?'<path d="M'+X+','+Y+'v'+cellSize+'"/>':'<path d="M'+X+','+Y+'h'+cellSize+'"/>');
   }
  }
  out.push("</g>");
  out.push('<g id="elevation-labels" fill="#705b47" font-family="sans-serif" font-size="10" font-weight="600" text-anchor="middle">');
  for(const [level,cells] of spec.elevations||[]){
   const top=Math.min(...cells.map(p=>p[1])),topRow=cells.filter(p=>p[1]===top);
   const cx=topRow.reduce((n,p)=>n+p[0]+.5,0)/topRow.length*cellSize;
   const cy=(top+.69)*cellSize;
   out.push('<text x="'+cx.toFixed(1)+'" y="'+cy.toFixed(1)+'">'+(level>0?"+":"")+level+'</text>');
  }
  out.push("</g>");
 }
 if(model.barriers.size){
  const intact=[],fallen=[];
  for(const e of [...model.barriers].sort()){
   const [a,b]=e.split("|").map(xy),vertical=a[0]!==b[0];
   const x=(vertical?Math.max(a[0],b[0]):a[0])*cellSize;
   const y=(vertical?a[1]:Math.max(a[1],b[1]))*cellSize;
   const d=vertical?'M'+x+','+y+'v'+cellSize:'M'+x+','+y+'h'+cellSize;
   if(!model.ruins.has(e)){
    intact.push('<path data-blocks-edge="'+e+'" d="'+d+'" stroke="#e4dfd2" stroke-width="6"/>');
    intact.push('<path d="'+d+'" stroke="#3c4241" stroke-width="3.3"/>');
   }else{
    // Rubble changes traversability at this edge, never in unrelated cells.
    const n=v=>Number(v.toFixed(2)),p=(fraction,side)=>{
     const along=cellSize*fraction,offset=cellSize*side;
     return vertical?[n(x+offset),n(y+along)]:[n(x+along),n(y+offset)];
    };
    const points=[[0,0],[.19,-.09],[.38,.07],[.58,-.11],[.79,.07],[1,0]].map(([u,v])=>p(u,v));
    const jag='M'+points.map(q=>q.join(',')).join('L');
    fallen.push('<path data-blocks-edge="'+e+'" d="'+jag+'" stroke="#f1ede3" stroke-width="7"/>');
    fallen.push('<path d="'+jag+'" stroke="#333836" stroke-width="3"/>');
    for(const [u,v] of [[.27,.18],[.70,-.19]]){
     const [cx,cy]=p(u,v),z=cellSize*.11;
     fallen.push('<path d="M'+n(cx-z)+','+n(cy-z/2)+'l'+n(z*1.5)+','+n(-z/2)+' '+n(z*.45)+','+n(z*1.3)+'z" fill="#c9c3b8" stroke="#726e65" stroke-width=".8"/>');
    }
   }
  }
  if(intact.length)out.push('<g id="masonry-partitions" fill="none" stroke-linecap="square">',...intact,'</g>');
  if(fallen.length)out.push('<g id="collapsed-masonry" stroke-linejoin="round">',...fallen,'</g>');
 }
 if(model.chokes.size){
  out.push('<g id="cave-breakdown-chokes" stroke-linejoin="round" stroke-linecap="round">');
  for(const e of [...model.chokes].sort()){
   const [a,b]=e.split("|").map(xy),vertical=a[0]!==b[0];
   const x=(vertical?Math.max(a[0],b[0]):a[0])*cellSize;
   const y=(vertical?a[1]:Math.max(a[1],b[1]))*cellSize;
   const n=v=>Number(v.toFixed(2)),pt=(t,offset)=>vertical?
      [n(x+offset*cellSize),n(y+t*cellSize)]:[n(x+t*cellSize),n(y+offset*cellSize)];
   // A broad rubble fan actually blocks travel across the recorded edge.
   const points=[[0,0],[.18,-.14],[.35,.12],[.54,-.16],[.73,.12],[.88,-.09],[1,0]].map(([t,o])=>pt(t,o));
   const d="M"+points.map(p=>p.join(",")).join("L");
   out.push('<path data-blocks-edge="'+e+'" d="'+d+'" fill="none" stroke="#e8e1d4" stroke-width="8"/>');
   out.push('<path d="'+d+'" fill="none" stroke="#424541" stroke-width="3"/>');
   for(const [t,o] of [[.22,.24],[.48,-.3],[.76,.27]]){
    const [cx,cy]=pt(t,o),sz=cellSize*.1;
    out.push('<path d="M'+n(cx-sz)+','+n(cy+sz/2)+'l'+n(sz*.7)+','+n(-sz*1.5)+' '+n(sz*1.2)+','+n(sz)+'z" fill="#b8b5ab" stroke="#77766c" stroke-width=".85"/>');
   }
  }
  out.push('</g>');
 }
 if(model.ramps.size){
  // A ramp is directional. The former plain stroke did not show uphill.
  out.push('<g id="level-ramps" fill="none" stroke="#87664e" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">');
  const n=v=>Number(v.toFixed(2));
  for(const e of [...model.ramps].sort()){
   const [a,b]=e.split("|").map(xy);
   const [lower,upper]=(model.heights.get(POS(a))||0)<(model.heights.get(POS(b))||0)?[a,b]:[b,a];
   const lx=(lower[0]+.5)*cellSize,ly=(lower[1]+.5)*cellSize;
   const hx=(upper[0]+.5)*cellSize,hy=(upper[1]+.5)*cellSize;
   const length=Math.hypot(hx-lx,hy-ly),ux=(hx-lx)/length,uy=(hy-ly)/length;
   const tip=[hx-ux*cellSize*.12,hy-uy*cellSize*.12];
   const tail=[lx+ux*cellSize*.18,ly+uy*cellSize*.18];
   const head=[tip[0]-ux*cellSize*.24,tip[1]-uy*cellSize*.24];
   const left=[head[0]-uy*cellSize*.14,head[1]+ux*cellSize*.14];
   const right=[head[0]+uy*cellSize*.14,head[1]-ux*cellSize*.14];
   const point=p=>n(p[0])+","+n(p[1]);
   out.push('<path data-uphill-cell="'+POS(upper)+'" d="M'+point(tail)+'L'+point(tip)+' M'+point(left)+'L'+point(tip)+'L'+point(right)+'"/>');
  }
  out.push("</g>");
 }
 if(model.steps.size){
  out.push('<g id="lava-bench-steps" fill="none" stroke="#76583c" stroke-width="2.1" stroke-linecap="round">');
  const n=v=>Number(v.toFixed(2));
  for(const [edge,dimensions] of [...model.steps].sort(([a],[b])=>a.localeCompare(b))){
   const [a,b]=edge.split("|").map(xy);
   const [low,high]=(model.heights.get(POS(a))||0)<(model.heights.get(POS(b))||0)?[a,b]:[b,a];
   const lx=(low[0]+.5)*cellSize,ly=(low[1]+.5)*cellSize;
   const hx=(high[0]+.5)*cellSize,hy=(high[1]+.5)*cellSize;
   const ux=(hx-lx)/cellSize,uy=(hy-ly)/cellSize;
   for(let i=0;i<dimensions.risers;i++){
    const t=(i+1)/(dimensions.risers+1),cx=lx+(hx-lx)*t,cy=ly+(hy-ly)*t;
    const q=cellSize*.32,dx=-uy*q,dy=ux*q;
    out.push('<path data-step-edge="'+edge+'" data-riser="'+(i+1)+'" data-uphill-cell="'+POS(high)+
      '" d="M'+n(cx-dx)+','+n(cy-dy)+'L'+n(cx+dx)+','+n(cy+dy)+'"/>');
   }
  }
  out.push('</g>');
 }
 return out;
}
module.exports={terrainModel,terrainGraph,terrainAudit,terrainSvg,PORTALS};
