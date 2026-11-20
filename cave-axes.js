"use strict";
// Reproducible, conservative diagnostic for straight cave-floor strips.
// Only dry, actually connected hall-to-hall edges count. A blocked collapse,
// a flooded step, or a change of elevation without a ramp breaks an axis.
const fs=require("node:fs"),path=require("node:path");
const {buildCells}=require("./assemble");
const {doorEdges}=require("./audit");
const {terrainModel,terrainGraph}=require("./terrain");

const key=(x,y)=>x+","+y;
function axialRuns(tile,{minCells=4}={}){
 if(tile.wall_style!=="cavern")throw Error("Axial plan audit is for cavern studies only");
 if(!Number.isInteger(minCells)||minCells<2||minCells>20)throw Error("Invalid minimum axis length");
 const owner=buildCells(tile),spec=tile.terrain||{};
 const model=terrainModel(owner,spec);
 const graph=terrainGraph(owner,doorEdges(tile),spec,"ordinary","dry");
 const passable=k=>owner.get(k)==="hall"&&(!model.water.has(k)||model.bridges.has(k));
 const linked=(a,b)=>passable(a)&&passable(b)&&graph.get(a)?.includes(b)&&graph.get(b)?.includes(a);
 const result=[];
 for(const [axis,dx,dy] of [["east-west",1,0],["north-south",0,1]]){
  for(let y=0;y<20;y++)for(let x=0;x<20;x++){
   const start=key(x,y),previous=key(x-dx,y-dy);
   if(!passable(start)||linked(previous,start))continue;
   let count=1,cx=x,cy=y;
   while(cx+dx<20&&cy+dy<20&&linked(key(cx,cy),key(cx+dx,cy+dy))){
    cx+=dx;cy+=dy;count++;
   }
   if(count>=minCells)result.push({axis,from:[x,y],to:[cx,cy],
    clear_run_half_cells:count,plan_length_feet:count*2.5});
  }
 }
 return result.sort((a,b)=>b.clear_run_half_cells-a.clear_run_half_cells||
  a.axis.localeCompare(b.axis)||a.from[1]-b.from[1]||a.from[0]-b.from[0]);
}
function auditAxes(tile){
 const runs=axialRuns(tile);
 return {id:tile.id,
  interpretation:"Dry traversable straight hall strips in fictional cell plans; not instrument-surveyed passage axes or sightlines",
  longest_run_half_cells:runs[0]?.clear_run_half_cells||0,
  longest_run_feet:runs[0]?.plan_length_feet||0,
  runs_at_least_15_feet:runs.filter(r=>r.clear_run_half_cells>=6).length,
  runs};
}
function report(data){
 return {units:"feet",half_cell_feet:2.5,
  methodology:"Maximal horizontal and vertical hall strips; split at inaccessible water, collapse edges, barriers and unmodeled elevation transitions",
  cave_tiles:data.tiles.filter(t=>t.wall_style==="cavern").map(auditAxes)};
}
if(require.main===module){
 const data=JSON.parse(fs.readFileSync(path.join(__dirname,"blueprints.json"),"utf8"));
 const dest=path.resolve(process.argv[2]||path.join(__dirname,"reports/cave-axes.json"));
 fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.writeFileSync(dest,JSON.stringify(report(data),null,2)+"\n");
 console.log("Physically traversable cave axis audit written to "+dest);
}
module.exports={axialRuns,auditAxes,report};
