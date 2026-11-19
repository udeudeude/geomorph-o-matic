"use strict";
// Authored, cumulative flood extents. These are scenario masks, not a fluid simulator.
const {terrainModel,terrainGraph}=require("./terrain");
const {accessGraph,distances}=require("./route-analysis");
const {buildVerticalGraph}=require("./vertical");
const POS=p=>p.join(",");
const PORTALS=["4,0","15,0","4,19","15,19","0,4","0,15","19,4","19,15"];
const ORDER=(a,b)=>{const [ax,ay]=a.split(",").map(Number),[bx,by]=b.split(",").map(Number);return ay-by||ax-bx};
function floodStages(owner,doors=[],terrain={},hydrology={}){
 if(!hydrology||Array.isArray(hydrology)||typeof hydrology!=="object"||!Array.isArray(hydrology.stages||[]))
  throw Error("Invalid flood-stage definition");
 const baseline=terrainModel(owner,terrain),water=new Set(baseline.water);
 const stages=new Map([["normal",{id:"normal",new_cells:0,terrain:{...terrain,water:[...water].sort(ORDER).map(p=>p.split(",").map(Number))}}]]);
 const passages=accessGraph(owner,doors,"all");
 for(const stage of hydrology.stages||[]){
  if(!stage||typeof stage.id!=="string"||!/^[a-z][a-z0-9_-]*$/.test(stage.id)||
   stages.has(stage.id)||!Array.isArray(stage.add_water)||!stage.add_water.length)throw Error("Invalid or duplicate flood stage");
  const additions=new Set();
  for(const p of stage.add_water){
   if(!Array.isArray(p)||p.length!==2||p.some(n=>!Number.isInteger(n))||
    p.some(n=>n<0||n>=20)||!owner.has(POS(p)))throw Error("Flooding outside occupied floor");
   const k=POS(p);
   if(water.has(k)||additions.has(k))throw Error("Duplicate or already submerged stage cell");
   additions.add(k);
  }
  const wet=new Set([...water,...additions]),seen=new Set(water),queue=[...water];
  for(let i=0;i<queue.length;i++)for(const next of passages.get(queue[i])||[]){
   if(wet.has(next)&&!seen.has(next)){seen.add(next);queue.push(next)}
  }
  if([...additions].some(p=>!seen.has(p)))throw Error("Flood stage has no hydraulic path to existing water");
  const nextTerrain={...terrain,water:[...wet].sort(ORDER).map(p=>p.split(",").map(Number))};
  // Reapply the canonical portal, bridge, elevation and coordinate contracts.
  terrainModel(owner,nextTerrain);
  stages.set(stage.id,{id:stage.id,new_cells:additions.size,terrain:nextTerrain});
  for(const p of additions)water.add(p);
 }
 return stages;
}
function floodAudit(owner,doors=[],terrain={},vertical={},hydrology={}){
 const all=floodStages(owner,doors,terrain,hydrology),result=[];
 for(const state of all.values()){
  const lower=terrainGraph(owner,doors,state.terrain),graph=buildVerticalGraph(owner,doors,state.terrain,vertical);
  const reachable=distances(graph,"4,0,0"),baseReachable=distances(lower,"4,0");
  const portals=PORTALS.filter(p=>reachable.has(p+",0"));
  result.push({id:state.id,new_water_cells:state.new_cells,water_cells:state.terrain.water.length,
   accessible_base_cells:baseReachable.size,accessible_stacked_cells:reachable.size,
   reachable_portals:portals.length,
   turbine_lower_north_south:distances(lower,"10,8").get("10,12")??null,
   turbine_stacked_north_south:distances(graph,"10,8,0").get("10,12,0")??null});
 }
 return result;
}
if(require.main===module){
 const fs=require("node:fs"),path=require("node:path");
 const {buildCells}=require("./assemble"),{doorEdges}=require("./audit"),{makeSvg}=require("./render");
 const tile=JSON.parse(fs.readFileSync(path.join(__dirname,"blueprints.json"),"utf8")).tiles.find(t=>t.id==="riftwater_lock");
 const owner=buildCells(tile),doors=doorEdges(tile),stages=floodStages(owner,doors,tile.terrain,tile.hydrology);
 if(!stages.has("surge"))throw Error("Riftwater Lock has no surge stage");
 const target=path.resolve(process.argv[2]||path.join(__dirname,"examples/riftwater_surge.svg"));
 fs.mkdirSync(path.dirname(target),{recursive:true});
 fs.writeFileSync(target,makeSvg({...tile,title:tile.title+" | Surge",terrain:stages.get("surge").terrain}));
 console.log(JSON.stringify(floodAudit(owner,doors,tile.terrain,tile.vertical,tile.hydrology),null,2));
 console.log("Flood study written: "+target);
}
module.exports={floodStages,floodAudit};
