"use strict";
// A spatially authored, hypothetical absolute roof surface, registered to the
// canonical level-one bench. Unlike local headroom, a crown is a z elevation.
const {terrainModel}=require("./terrain");
const {boundaryCell}=require("./seam-profiles");
const key=p=>p.join(",");
const xy=s=>s.split(",").map(Number);
function applyAbsoluteVault(owner,scenario,terrain,base){
 const spec=scenario.absolute_vault;
 if(!spec)return base;
 if(!terrain||spec.datum!=="ordinary_floor_zero_feet"||
    spec.status!=="hypothetical"||spec.bench_rise_feet!==1||
    spec.maximum_adjacent_crown_change_feet!==0.5||
    !Array.isArray(spec.zones)||spec.zones.length<2)
  throw Error("Invalid authored absolute vault datum");
 const model=terrainModel(owner,terrain);
 const floorZ=new Map([...owner.keys()].map(p=>[p,(model.heights.get(p)||0)*spec.bench_rise_feet]));
 const elevated=[...floorZ].filter(([,z])=>z>0);
 if(elevated.length!==8||elevated.some(([,z])=>z!==1)||
    model.steps.size!==3||model.ramps.size!==0||
    terrain.steps.some(s=>s.rise_feet!==1||s.risers!==2))
  throw Error("Absolute vault requires the registered eight-cell one-foot bench and three real stairs");
 const protectedMouths=new Set();
 for(const side of ["N","E","S","W"])for(const o of [4,5,14,15])for(let depth=0;depth<2;depth++)
  protectedMouths.add(key(boundaryCell(side,o,depth)));
 const pinch=new Set(base.zones.flatMap(z=>z.cells));
 const roofZ=new Map(base.clearances); // Source baseline is absolute z above ordinary ground.
 const touched=new Set(),ids=new Set(),zones=[];
 for(const zone of spec.zones){
  if(!zone||typeof zone.id!=="string"||!/^[a-z][a-z0-9_-]+$/.test(zone.id)||
     ids.has(zone.id)||typeof zone.interpretation!=="string"||zone.interpretation.length<12||
     !Number.isFinite(zone.roof_elevation_feet)||
     zone.roof_elevation_feet<=scenario.baseline_feet||
     zone.roof_elevation_feet>scenario.baseline_feet+2||
     (zone.roof_elevation_feet*2)%1!==0||
     !Array.isArray(zone.cells)||zone.cells.length<2)
   throw Error("Invalid absolute vault contour zone");
  ids.add(zone.id);
  const cells=[];
  for(const p of zone.cells){
   if(!Array.isArray(p)||p.length!==2||p.some(n=>!Number.isInteger(n)||n<0||n>19)||
      !owner.has(key(p))||protectedMouths.has(key(p))||pinch.has(key(p))||touched.has(key(p)))
    throw Error("Absolute vault contour must be unique occupied interior floor, not rock, a throat, or pinch");
   const k=key(p);touched.add(k);cells.push(k);roofZ.set(k,zone.roof_elevation_feet);
  }
  zones.push({id:zone.id,roof_elevation_feet:zone.roof_elevation_feet,cells,interpretation:zone.interpretation});
 }
 const lowBench=elevated.filter(([p])=>roofZ.get(p)-floorZ.get(p)<6);
 if(!lowBench.length||lowBench.length===elevated.length)
  throw Error("Authored bench must create both upright and crouching-only regions");
 for(const [p,z] of roofZ){
  if(!Number.isFinite(z)||z-floorZ.get(p)<2.5)
    throw Error("Absolute vault intersects floor at "+p);
  if(protectedMouths.has(p)&&(z!==6.5||floorZ.get(p)!==0))
    throw Error("Absolute vault changes the modular throat datum");
  const [x,y]=xy(p);
  for(const q of [key([x+1,y]),key([x,y+1])]){
   if(!roofZ.has(q)||pinch.has(p)||pinch.has(q))continue;
   if(Math.abs(z-roofZ.get(q))>spec.maximum_adjacent_crown_change_feet+1e-9)
    throw Error("Absolute vault has an abrupt interior crown discontinuity at "+p+" and "+q);
  }
 }
 const local=new Map([...roofZ].map(([p,z])=>[p,z-floorZ.get(p)]));
 return {...base,clearances:local,floor_elevations_feet:floorZ,
  absolute_roof_elevations_feet:roofZ,absolute_vault_zones:zones,
  elevated_bench_cells:elevated.map(([p])=>p),
  bench_cells_below_standing_clearance:lowBench.map(([p])=>p)};
}
module.exports={applyAbsoluteVault};
