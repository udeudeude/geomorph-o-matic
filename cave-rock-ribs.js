"use strict";
// Plan-only bedrock-separator audit. A solid grid cell separating two passages
// is NOT evidence of safe roof bearing, height, or geological stability.
const fs=require("node:fs"),path=require("node:path");
const {buildCells}=require("./assemble");
const {terrainModel}=require("./terrain");
const HALF_CELL_FEET=2.5;
const SAMPLES=Object.freeze({
 basalt_rift:[
  {id:"western_distributary_web",at:[7,9],across:"E-W",minimum_cells:2},
  {id:"eastern_distributary_web",at:[13,9],across:"E-W",minimum_cells:2},
  {id:"southern_bypass_spur",at:[7,17],across:"E-W",minimum_cells:1}
 ],
 hollow_causeway:[
  {id:"eastern_solution_rib",at:[13,10],across:"N-S",minimum_cells:1}
 ],
 lantern_sink:[
  {id:"northwest_bedding_partition",at:[6,3],across:"N-S",minimum_cells:1}
 ]
});
const key=(x,y)=>x+","+y;
function ribSection(owner,terrain,{id,at,across,minimum_cells=1}){
 if(!id||!Array.isArray(at)||at.length!==2||at.some(n=>!Number.isInteger(n)||n<1||n>18)||
    !["E-W","N-S"].includes(across)||!Number.isInteger(minimum_cells)||minimum_cells<1)
  throw Error("Invalid plan bedrock sample");
 const [x,y]=at,axis=across==="E-W"?[1,0]:[0,1],k=key(x,y);
 if(owner.has(k))throw Error("Bedrock sample must start in solid rock: "+id);
 const find=sign=>{
  let cx=x,cy=y,rocks=0;
  while(cx>=1&&cx<=18&&cy>=1&&cy<=18&&!owner.has(key(cx,cy))){
   rocks++;cx+=sign*axis[0];cy+=sign*axis[1];
  }
  if(cx<0||cx>=19||cy<0||cy>=19||!owner.has(key(cx,cy)))
   throw Error("Bedrock web must be bounded by two occupied passages: "+id);
  return {at:[cx,cy],rocks};
 };
 const left=find(-1),right=find(1);
 const rockCells=left.rocks+right.rocks-1;
 if(rockCells<minimum_cells)throw Error("Bedrock web below minimum plan thickness: "+id);
 const model=terrainModel(owner,terrain);
 for(const point of [left.at,right.at]){
  const p=key(...point);
  if(owner.get(p)!=="hall"||model.water.has(p)||model.heights.has(p))
   throw Error("Bedrock web flanks must be dry, ordinary-level passage floors: "+id);
 }
 const solids=[];
 for(let n=1;n<=rockCells;n++){
  const px=left.at[0]+n*axis[0],py=left.at[1]+n*axis[1];
  if(owner.has(key(px,py)))throw Error("Rock web discontinuity: "+id);
  solids.push([px,py]);
 }
 if(key(...solids[rockCells-1])===key(...right.at))throw Error("No rock between floor flanks");
 return {id,across,rock_cells:solids,
  rock_half_cells:rockCells,rock_plan_thickness_feet:rockCells*HALF_CELL_FEET,
  floor_flanks:[left.at,right.at],
  interpretation:"solid rock in fictional horizontal plan only; roof thickness, strength and headroom unknown"};
}
function auditRibs(tile,samples=SAMPLES[tile.id]||[]){
 if(tile.wall_style!=="cavern")throw Error("Only cavern tiles can have bedrock rib samples");
 const owner=buildCells(tile);
 return {id:tile.id,sections:samples.map(s=>ribSection(owner,tile.terrain||{},s))};
}
function report(data){
 return {units:"feet",half_cell_feet:HALF_CELL_FEET,
  scope:"Registered horizontal-plan rock separations between dry passages; not engineering evidence",
  cave_tiles:data.tiles.filter(t=>t.wall_style==="cavern").map(t=>auditRibs(t))};
}
if(require.main===module){
 const data=JSON.parse(fs.readFileSync(path.join(__dirname,"blueprints.json"),"utf8"));
 const dest=path.resolve(process.argv[2]||path.join(__dirname,"reports/cave-rock-ribs.json"));
 const result=report(data);
 fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.writeFileSync(dest,JSON.stringify(result,null,2)+"\n");
 console.log("Wrote "+dest);
}
module.exports={HALF_CELL_FEET,SAMPLES,ribSection,auditRibs,report};
