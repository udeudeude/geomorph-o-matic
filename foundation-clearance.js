"use strict";
// Conservative plan-only collision test. A room footprint is a structural
// exclusion proxy on level -1, NOT proof of actual footing depth or clearance.
// The three engineered turbine drop shafts are the sole allowed penetrations.
const {shapeCells}=require("./geometry");
const KEY=p=>p.join(",");
const STEPS=[[1,0],[-1,0],[0,1],[0,-1]];
function auditBuriedFoundations(tile){
 const h=tile.hydrology||{},spec=h.tailrace||h.subfloor_relay;
 if(!spec)return null;
 const role=h.tailrace?"releasing_collector":"receiving_relay";
 if(h.tailrace&&h.subfloor_relay)throw Error("A tile cannot have two buried conduit roles");
 if(!Array.isArray(spec.cells)||!spec.cells.length)throw Error("Buried route needs coordinates");
 const footprints=new Map();
 for(const [name,,shape] of tile.rooms||[]){
  for(const p of shapeCells(shape)){
   const k=KEY(p);
   if(footprints.has(k))throw Error("Overlapping foundations");
   footprints.set(k,name);
  }
 }
 const drops=new Set((role==="releasing_collector"?spec.pickups:[]||[]).map(KEY));
 const overlaps=[],adjacent=[],accepted_drops=[];
 spec.cells.forEach((p,index)=>{
  if(!Array.isArray(p)||p.length!==2||!p.every(Number.isInteger))throw Error("Bad buried station");
  const k=KEY(p),room=footprints.get(k);
  if(room){
   if(room==="turbine"&&drops.has(k))accepted_drops.push(k);
   else overlaps.push({station:index,at:k,room});
  }else{
   const rooms=[...new Set(STEPS.map(([dx,dy])=>footprints.get(KEY([p[0]+dx,p[1]+dy]))).filter(Boolean))].sort();
   if(rooms.length)adjacent.push({station:index,at:k,rooms});
  }
 });
 return {role,route_cells:spec.cells.length,overlaps,adjacent,accepted_drops,
  structural_clearance:"plan-footprint-only; footing depth, conduit size and actual offset unknown"};
}
function requireBuriedFoundationClearance(tile){
 const result=auditBuriedFoundations(tile);
 if(result?.overlaps.length)throw Error("Buried conduit under room foundation: "+result.overlaps.map(o=>o.room+"@"+o.at).join(", "));
 return result;
}
module.exports={auditBuriedFoundations,requireBuriedFoundationClearance};
