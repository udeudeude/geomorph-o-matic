"use strict";
// Service engineering is authored explicitly rather than inferred from a plan
// symbol. All heights and shaft sizes are provisional design dimensions.
const {buildCells}=require("./assemble");
const {doorEdges}=require("./audit");
const {gateModel}=require("./hydraulic-control");
const {controlModel}=require("./waterworks");
const K=p=>p.join(",");
const eq=(a,b)=>K(a)===K(b);
const step=(a,b)=>Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1])===1;
const valid=p=>Array.isArray(p)&&p.length===2&&p.every(n=>Number.isInteger(n)&&n>0&&n<19);
function checkRoute(points,label){
 if(!Array.isArray(points)||!points.length||points.some(p=>!valid(p)))throw Error(label+" requires internal half-cell coordinates");
 if(new Set(points.map(K)).size!==points.length||points.slice(1).some((p,i)=>!step(p,points[i])))
  throw Error(label+" must be an unbranched, orthogonal unit-cell path");
}
function bendKeys(points){
 const result=[];
 for(let i=1;i<points.length-1;i++){
  const a=points[i-1],p=points[i],b=points[i+1];
  if((p[0]-a[0])!==(b[0]-p[0])||(p[1]-a[1])!==(b[1]-p[1]))result.push(K(p));
 }
 return result;
}
function transmissionModel(tile,owner=buildCells(tile),doors=doorEdges(tile)){
 const h=tile.hydrology||{},spec=h.transmissions;
 if(spec===undefined)return [];
 if(!Array.isArray(spec))throw Error("Transmission specification must be an array");
 const gates=gateModel(owner,doors,h.gates||[]);
 const controls=controlModel(owner,doors,h,tile.terrain||{});
 if(spec.length!==gates.length||controls.length!==gates.length)
  throw Error("Every shutter requires a separate transmission");
 const gateById=new Map((h.gates||[]).map(g=>[g.id,g]));
 const controlById=new Map(controls.map(c=>[c.id,c]));
 const reserved=new Map(),seen=new Set(),result=[];
 for(const item of spec){
  if(!item||typeof item.id!=="string"||!/^[a-z][a-z0-9_-]*$/.test(item.id)||
     seen.has(item.id)||item.kind!=="ceiling_shaft_rack"||
     !Number.isFinite(item.shaft_axis_ft)||item.shaft_axis_ft<7||item.shaft_axis_ft>12||
     !Number.isFinite(item.shaft_diameter_in)||item.shaft_diameter_in<=0||item.shaft_diameter_in>3)
   throw Error("Invalid transmission assumptions or identifier");
  const control=controlById.get(item.control),gate=gateById.get(item.gate);
  if(!control||!gate||control.gate!==gate.id)throw Error("Transmission does not join its own handwheel and shutter");
  checkRoute(item.path,"Transmission");
  if(!eq(item.path[0],control.at)||!eq(item.path.at(-1),gate.b))
   throw Error("Transmission endpoints do not meet the handwheel and downstream gate rack");
  const bore=new Set(item.path.filter(p=>!owner.has(K(p))).map(K));
  const authored=item.bored_at||[];
  if(!Array.isArray(authored)||authored.some(p=>!valid(p))||
     new Set(authored.map(K)).size!==authored.length||
     bore.size!==authored.length||authored.some(p=>!bore.has(K(p))))
   throw Error("Every shaft crossing of uncarved rock requires an explicit sleeved bore");
  const supports=item.bearings||[];
  if(!Array.isArray(supports)||supports.length<2||
     new Set(supports.map(K)).size!==supports.length||
     supports.some(p=>!valid(p)||!item.path.slice(1,-1).some(q=>eq(p,q))))
   throw Error("Transmission requires distinct intermediate wall/ceiling bearings");
  // A rigid shaft cannot turn a right angle: every bend needs a gear train.
  const turns=bendKeys(item.path),gearboxes=item.gearboxes;
  if(!Array.isArray(gearboxes)||gearboxes.length!==turns.length)
   throw Error("Every drive turn needs a right-angle gearbox");
  const boxesSeen=new Set(),controlsAt=new Map(controls.map(c=>[K(c.at),c.id]));
  const wet=new Set((tile.terrain?.water||[]).map(K));
  for(const box of gearboxes){
   if(!box||box.kind!=="recessed_bevel_gearbox"||
      !valid(box.at)||!valid(box.service_from)||
      !Number.isFinite(box.housing_width_ft)||
      box.housing_width_ft<0.75||box.housing_width_ft>2||
      box.access!=="sealed_overhead_service_panel"||
      typeof box.shutdown_required!=="boolean")
    throw Error("Invalid gearbox housing or service assumption");
   const at=K(box.at),entry=K(box.service_from);
   if(!turns.includes(at)||boxesSeen.has(at)||
      !step(box.at,box.service_from)||
      (owner.has(at)&&owner.get(at)!=="hall")||
      owner.get(entry)!=="hall"||wet.has(entry))
    throw Error("Gearbox turn lacks a dry, adjacent hallway service face");
   const occupied=controlsAt.get(entry);
   if(occupied && (occupied!==item.control||!box.shutdown_required))
    throw Error("Gearbox panel conflicts with another control or lacks shutdown lockout");
   if(!occupied&&box.shutdown_required)throw Error("Gearbox shutdown flag has no modeled wheel interference");
   boxesSeen.add(at);
  }
  for(const p of item.path){
   const k=K(p);
   if(reserved.has(k))throw Error("Mechanism centerlines collide at "+k+" between "+reserved.get(k)+" and "+item.id);
   reserved.set(k,item.id);
  }
  seen.add(item.id);
  result.push({id:item.id,control:item.control,gate:item.gate,path:item.path,
   axis_ft:item.shaft_axis_ft,diameter_in:item.shaft_diameter_in,
   bores:authored,bearings:supports,gearboxes:gearboxes.map(g=>({...g})),gate_rack:gate.b,
   clearance_status:"assumed ceiling-level centerlines; headroom, bearings, masonry penetrations and force not certified"});
 }
 if(new Set(result.map(m=>m.gate)).size!==gates.length)throw Error("Duplicate shutter transmission");
 return result;
}
function inspectionModel(tile,owner=buildCells(tile)){
 const h=tile.hydrology||{},spec=h.tailrace||h.subfloor_relay;
 if(!spec)return [];
 const bends=bendKeys(spec.cells),accesses=spec.inspections;
 if(!Array.isArray(accesses)||accesses.length!==bends.length)
  throw Error("Every buried change of direction requires an authored inspection arrangement");
 const controls=new Set((h.controls||[]).map(c=>K(c.at)));
 const wet=new Set((tile.terrain?.water||[]).map(K));
 const room=new Map();
 for(const [id,,shape] of tile.rooms){
  const {shapeCells}=require("./geometry");
  for(const p of shapeCells(shape))room.set(K(p),id);
 }
 const seen=new Set(),covers=new Set(),result=[];
 for(const a of accesses){
  if(!a||a.kind!=="bolted_cleanout_riser"||
     !Number.isFinite(a.nominal_clear_diameter_ft)||a.nominal_clear_diameter_ft<=0||
     a.nominal_clear_diameter_ft>2||
     !valid(a.at)||!valid(a.surface)||seen.has(K(a.at))||!bends.includes(K(a.at))||
     covers.has(K(a.surface))||controls.has(K(a.surface))||wet.has(K(a.surface))||
     owner.get(K(a.surface))!=="hall")
   throw Error("Invalid, unserviceable or obstructed inspection hatch");
  checkRoute(a.branch,"Inspection spur");
  if(a.branch.length>5||!eq(a.branch[0],a.at)||!eq(a.branch.at(-1),a.surface))
   throw Error("Inspection spur must connect bend to dry service-gallery cover");
  const main=new Set(spec.cells.map(K));
  for(const p of a.branch.slice(1)){
   if(main.has(K(p))||room.has(K(p)))
    throw Error("Inspection branch intersects main collector or modeled chamber footing");
  }
  seen.add(K(a.at));covers.add(K(a.surface));
  result.push({at:a.at,surface:a.surface,branch:a.branch,
   diameter_ft:a.nominal_clear_diameter_ft,branch_length_ft:(a.branch.length-1)*2.5,
   status:"bolted inspection cover; lower water race remains non-walkable; depth and clearance unverified"});
 }
 return result;
}
function maintenanceSymbolsSvg(tile,S=24){
 const inspections=inspectionModel(tile),out=[];
 if(!inspections.length)return out;
 out.push('<g id="buried-inspection-hatches" fill="none" stroke="#594b3d" stroke-width="1.8">');
 for(const a of inspections){
  const [x,y]=a.surface,X=(x+.5)*S,Y=(y+.5)*S;
  out.push('<g data-inspection-cover="'+K(a.surface)+'" data-bend="'+K(a.at)+'">'+
   '<title>Bolted dry gallery inspection cover over a non-walkable buried cleanout; dimensions provisional</title>'+
   '<rect x="'+(X-6)+'" y="'+(Y-6)+'" width="12" height="12" fill="#d6ccb7" stroke-width="1.8"/>'+
   '<path d="M'+(X-3)+','+Y+'h6 M'+X+','+(Y-3)+'v6" stroke-width="1.5"/>'+
   '</g>');
 }
 out.push('</g>');
 return out;
}
module.exports={transmissionModel,inspectionModel,maintenanceSymbolsSvg,bendKeys};
