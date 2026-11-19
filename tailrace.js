"use strict";
// Lower receiving race: an authored, one-way *drainage topology*.
// The plan coordinates are canonical, but level -1 and its vertical spacing
// are design assumptions. No invert heights, discharge rates or flow times
// are inferred from this ordered route.
const {waterwayModel,hydraulicCanalGraph,sluiceImpact}=require("./waterworks");
const {gateModel}=require("./hydraulic-control");
const {distances}=require("./route-analysis");
const KEY=p=>p.join(",");
function point(p,label){
 if(!Array.isArray(p)||p.length!==2||p.some(n=>!Number.isInteger(n)||n<=0||n>=19))
  throw Error("Invalid tailrace "+label+" coordinate");
 return KEY(p);
}
function tailraceModel(owner,doors=[],hydrology={},terrain={}){
 if(hydrology.tailrace===undefined)return null;
 const spec=hydrology.tailrace;
 if(!spec||Array.isArray(spec)||typeof spec!=="object"||spec.level!==-1||
    !Array.isArray(spec.cells)||spec.cells.length<3||
    !Array.isArray(spec.pickups)||!spec.pickups.length)
  throw Error("Invalid lower tailrace specification");
 const upper=waterwayModel(owner,doors,hydrology,terrain);
 if(!upper)throw Error("Lower tailrace requires an engineered upper channel");
 const cells=[],visited=new Set();
 for(const p of spec.cells){
  const k=point(p,"path");
  if(visited.has(k))throw Error("Lower tailrace must be a simple, unbranched path");
  if(cells.length){
   const previous=spec.cells[cells.length-1];
   if(Math.abs(p[0]-previous[0])+Math.abs(p[1]-previous[1])!==1)
    throw Error("Lower tailrace has a disconnected route");
  }
  cells.push(k);visited.add(k);
 }
 const terminus=point(spec.terminus,"terminus");
 if(terminus!==cells[cells.length-1])throw Error("Tailrace terminus must end the ordered route");
 const pickups=new Set(),wet=new Set((terrain.water||[]).map(KEY));
 const gates=gateModel(owner,doors,hydrology.gates||[]);
 const sealed=new Map(gates.map(g=>[g.id,"closed"]));
 const headwater=distances(hydraulicCanalGraph(upper.canal,gates,sealed,upper.walls),upper.inlet);
 for(const p of spec.pickups){
  const k=point(p,"pickup");
  if(pickups.has(k)||!upper.canal.has(k)||!visited.has(k)||
     k===terminus||wet.has(k)||headwater.has(k))
   throw Error("Tailrace pickups must be unique dry downstream sumps above the lower path");
  pickups.add(k);
 }
 const gatePickups={};
 if(hydrology.isolated_shutters){
  const impacts=sluiceImpact(owner,doors,hydrology,terrain);
  for(const impact of impacts){
   const matches=impact.newly_accessible_canals.filter(k=>pickups.has(k));
   if(matches.length!==1)throw Error("Every independent shutter requires exactly one lower drain pickup");
   gatePickups[impact.gate]=matches[0];
  }
  if(Object.keys(gatePickups).length!==pickups.size)
   throw Error("Uncontrolled tailrace pickup bypasses the shutter bank");
 }
 // The order of cells describes a one-way descending route. All drops are
 // vertical from the upper sumps to that path, never a return water link.
 return {level:-1,cells,pickups,terminus,gatePickups};
}
// This symbol marks a change of level, NOT a walkable shaft or an upper
// watercourse. Full subsurface route is on the separate technical plate.
function tailraceSymbolsSvg(owner,doors=[],hydrology={},terrain={},S=24){
 const m=tailraceModel(owner,doors,hydrology,terrain);
 if(!m)return [];
 const out=['<g id="tailrace-drop-shafts" fill="none" stroke="#365c68" stroke-width="1.8">'];
 for(const key of [...m.pickups].sort()){
  const [x,y]=key.split(",").map(Number),X=(x+.5)*S,Y=(y+.5)*S;
  out.push('<g data-tailrace-drop="'+key+'" data-level="-1">'+
   '<title>Vertical water drop into assumed lower collection race; not walkable</title>'+
   '<circle cx="'+X+'" cy="'+Y+'" r="8" fill="#f6f4e9" stroke-width="1.8"/>'+
   '<path d="M'+(X-4)+','+(Y-2)+'l4,5 4,-5 M'+X+','+(Y-5)+'v7" stroke-linejoin="round"/></g>');
 }
 out.push('</g>');
 return out;
}
module.exports={tailraceModel,tailraceSymbolsSvg};
