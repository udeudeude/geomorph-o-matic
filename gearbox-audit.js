"use strict";
// Deterministic qualitative plan-screen, NOT a gearbox force/capacity model.
const fs=require("node:fs"),path=require("node:path");
const {transmissionModel}=require("./maintenance-works");
const {buildCells}=require("./assemble");
const KEY=p=>p.join(",");
function gearboxAudit(tile){
 const owner=buildCells(tile),drives=transmissionModel(tile,owner);
 const controls=new Set((tile.hydrology?.controls||[]).map(c=>KEY(c.at)));
 const canals=new Set((tile.hydrology?.channels||[]).map(KEY));
 const landings=new Map();
 for(const d of drives)for(const b of d.gearboxes){
  const k=KEY(b.service_from);
  landings.set(k,(landings.get(k)||0)+1);
 }
 const boxes=drives.flatMap(d=>d.gearboxes.map(b=>{
  const neighbors=[[1,0],[-1,0],[0,1],[0,-1]]
   .map(([dx,dy])=>KEY([b.at[0]+dx,b.at[1]+dy]));
  const warnings=[];
  if(!owner.has(KEY(b.at)))warnings.push("rock pocket excavation, liner and support unverified");
  if(controls.has(KEY(b.service_from)))warnings.push("wheel shutdown/lockout required for access");
  if((landings.get(KEY(b.service_from))||0)>1)warnings.push("shared narrow service landing; access envelope unverified");
  if(neighbors.some(k=>canals.has(k)))warnings.push("near wet hydraulic race; corrosion and enclosure unverified");
  return {drive:d.id,station:KEY(b.at),service_from:KEY(b.service_from),housing_width_ft:b.housing_width_ft,
   access:b.access,shutdown_required:b.shutdown_required,warnings};
 }));
 return {tile:tile.id,gearbox_count:boxes.length,drives:drives.length,
  service_warnings:boxes.reduce((n,b)=>n+b.warnings.length,0),
  assumptions:"Centerlines and nominal 1.5 ft housings only; transmission forces, ratios, working headroom, recess excavation, panels and gear access have not been engineered.",
  gearboxes:boxes};
}
if(require.main===module){
 const src=JSON.parse(fs.readFileSync(path.join(__dirname,"blueprints.json"),"utf8"));
 const tile=src.tiles.find(t=>t.id==="riftwater_lock");
 const target=path.resolve(process.argv[2]||path.join(__dirname,"reports/gearbox-access.json"));
 const audit=gearboxAudit(tile);
 fs.mkdirSync(path.dirname(target),{recursive:true});
 fs.writeFileSync(target,JSON.stringify(audit,null,2)+"\n");
 console.log("Gearbox housing and access plan-screen written: "+audit.gearbox_count+" turning stations");
}
module.exports={gearboxAudit};
