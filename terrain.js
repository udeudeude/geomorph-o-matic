"use strict";
// Canonical environmental traversal. Geometry, not furnishings, determines access.
const {accessGraph,distances}=require("./route-analysis");
const POS=(p)=>p.join(",");
const EDGE=(a,b)=>[a,b].sort().join("|");
const PORTALS=["4,0","15,0","4,19","15,19","0,4","0,15","19,4","19,15"];

function terrainModel(owner,spec={}){
 if(!(owner instanceof Map))throw Error("Terrain requires occupied floor Map");
 if(!spec||Array.isArray(spec)||typeof spec!=="object")throw Error("Invalid terrain definition");
 const water=new Set(),bridges=new Set(),heights=new Map(),ramps=new Set();
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
 for(const p of PORTALS)if(owner.has(p)&&(water.has(p)||heights.has(p)))throw Error("Terrain cannot change standard edge portal");
 return {water,bridges,heights,ramps};
}
function terrainGraph(owner,doors,spec={},access="ordinary",travel="dry"){
 if(!["dry","wading"].includes(travel))throw Error("Unknown terrain travel mode");
 const model=terrainModel(owner,spec),graph=accessGraph(owner,doors,access);
 for(const [p,adj] of graph){
  if(travel==="dry"&&model.water.has(p)&&!model.bridges.has(p)){graph.set(p,[]);continue}
  graph.set(p,adj.filter(q=>{
   if(travel==="dry"&&model.water.has(q)&&!model.bridges.has(q))return false;
   return (model.heights.get(p)||0)===(model.heights.get(q)||0)||model.ramps.has(EDGE(p,q));
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
  elevated_cells:model.heights.size,ramp_edges:model.ramps.size,travel:results};
}
// Each layer is independently editable in exported SVG.
function terrainSvg(owner,spec={},cellSize=24){
 const model=terrainModel(owner,spec),out=[];
 const xy=(s)=>s.split(",").map(Number);
 if(model.water.size){
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
    const e=EDGE(p,q);if(seen.has(e)||model.ramps.has(e))continue;seen.add(e);
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
 if(model.ramps.size){
  out.push('<g id="level-ramps" fill="none" stroke="#87664e" stroke-width="2.2" stroke-linecap="round">');
  for(const e of model.ramps){const [a,b]=e.split("|").map(xy);
   out.push('<path d="M'+(a[0]+.5)*cellSize+','+(a[1]+.5)*cellSize+'L'+(b[0]+.5)*cellSize+','+(b[1]+.5)*cellSize+'"/>');
  }
  out.push("</g>");
 }
 return out;
}
module.exports={terrainModel,terrainGraph,terrainAudit,terrainSvg,PORTALS};
