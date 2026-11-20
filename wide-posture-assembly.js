"use strict";
// Independently rebuild standing, crouching and crawling routes across the
// rotated three-design four-morph study. Matching seams in plan does not
// prove overhead clearance or exterior-to-exterior route continuity.
const fs=require("node:fs"),path=require("node:path");
const {buildCells,rotateCell,verifyLayout}=require("./assemble");
const {source}=require("./wide-cave");
const {inspectTile}=require("./seam-profiles");
const {doorEdges}=require("./audit");
const {terrainGraph}=require("./terrain");
const {POSTURES,roofModel,headroomGraph}=require("./wide-headroom");
const {distances}=require("./route-analysis");
const OFFSETS=[4,5,14,15],SIZE=20,xy=s=>s.split(",").map(Number),key=(x,y)=>x+","+y;
function analyzePostures(layout,data=source()){
 const rows=verifyLayout(layout,data),width=rows[0].length,height=rows.length;
 const seams=[];
 const global=(p,x,y,turn)=>{
  const [a,b]=rotateCell(typeof p==="string"?xy(p):p,turn);
  return key(a+x*SIZE,b+y*SIZE);
 };
 const base=new Map(),roofHeights=new Map(),types=new Set();
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   const c=rows[y][x],owner=buildCells(c.tile);
   inspectTile(c.tile,"cave-wide-v1");types.add(c.id);
   const local=terrainGraph(owner,doorEdges(c.tile),c.tile.terrain||{},"ordinary","dry");
   const roof=roofModel(owner,c.tile.roof_scenario,c.tile.seam_profile);
   for(const [p,adj] of local){
     const at=global(p,x,y,c.turn);
     if(base.has(at)||roofHeights.has(at))throw Error("Overlapping rotated floor");
     base.set(at,adj.map(q=>global(q,x,y,c.turn)));
     roofHeights.set(at,roof.clearances.get(p));
   }
 }
 function join(a,b,tag){
   if(!base.has(a)||!base.has(b))throw Error("Unwalkable or missing entrance at "+tag);
   if(roofHeights.get(a)<POSTURES.standing||roofHeights.get(b)<POSTURES.standing)
     throw Error("Modular throat has insufficient standing crown at "+tag);
   base.get(a).push(b);base.get(b).push(a);
   seams.push({a,b,tag});
 }
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   if(x<width-1)for(const o of OFFSETS)
     join(key((x+1)*SIZE-1,y*SIZE+o),key((x+1)*SIZE,y*SIZE+o),"vertical-"+x+"-"+y);
   if(y<height-1)for(const o of OFFSETS)
     join(key(x*SIZE+o,(y+1)*SIZE-1),key(x*SIZE+o,(y+1)*SIZE),"horizontal-"+x+"-"+y);
 }
 const mouths=[];
 for(let x=0;x<width;x++)for(const o of OFFSETS)
   mouths.push(key(x*SIZE+o,0),key(x*SIZE+o,height*SIZE-1));
 for(let y=0;y<height;y++)for(const o of OFFSETS)
   mouths.push(key(0,y*SIZE+o),key(width*SIZE-1,y*SIZE+o));
 if(new Set(mouths).size!==mouths.length)throw Error("Exterior mouth coordinates overlap");
 const entry=mouths[0],traversals={},groups=[...new Set(seams.map(s=>s.tag))];
 for(const [mode,min] of Object.entries(POSTURES)){
   const graph=headroomGraph(base,{clearances:roofHeights},min);
   const reachable=distances(graph,entry);
   const missing=mouths.filter(p=>!reachable.has(p));
   if(missing.length)throw Error(mode+" posture strands "+missing.length+" exterior wide-mouth floor cells");
   const closures=groups.map(tag=>{
     const removed=new Set(seams.filter(s=>s.tag===tag).flatMap(({a,b})=>[a+"|"+b,b+"|"+a]));
     const cut=new Map([...graph].map(([p,neighbors])=>[p,neighbors.filter(q=>!removed.has(p+"|"+q))]));
     const reached=distances(cut,entry);
     return {seam:tag,reachable_floor_cells:reached.size,exterior_mouth_cells_still_connected:mouths.filter(p=>reached.has(p)).length};
   });
   const dists=mouths.map(p=>distances(graph,p)),totalPairs=mouths.length*(mouths.length-1)/2;
   const connectedPairs=dists.reduce((count,d,i)=>count+mouths.slice(i+1).filter(p=>d.has(p)).length,0);
   if(connectedPairs!==totalPairs)throw Error("Exterior mouth-to-mouth paths disconnected for "+mode);
   traversals[mode]={
     minimum_hypothetical_clearance_feet:min,
     floor_cells_admitted:graph.size,reachable_floor_cells:reachable.size,
     admitted_but_unreachable_floor_cells:graph.size-reachable.size,
     reachable_exterior_mouth_cells:mouths.length,exterior_mouth_pairs_connected:connectedPairs,
     closures,closures_preserving_all_exterior_mouths:closures.filter(c=>c.exterior_mouth_cells_still_connected===mouths.length).length
   };
 }
 if(traversals.crawling.reachable_floor_cells!==base.size)
   throw Error("Crawling must reach all canonical cave floors before interpreting the model");
 if(!(traversals.standing.reachable_floor_cells<=traversals.crouching.reachable_floor_cells&&
      traversals.crouching.reachable_floor_cells<=traversals.crawling.reachable_floor_cells))
   throw Error("Posture accessibility must be monotone");
 return {layout:layout.title||"Three wide caves",stage:"unreleased assembly posture study",
  distinct_designs:[...types].sort(),tile_count:width*height,layout_width_tiles:width,layout_height_tiles:height,
  all_walkable_floor_cells:base.size,full_width_intertile_walking_edges:seams.length,
  exterior_mouth_floor_cells:mouths.length,hypothetical_modes:traversals,
  caution:"These are fictional local headroom assumptions, not measured roof elevations, guaranteed seam crown continuity, load ratings or physical playtesting."};
}
function generate(file=path.join(__dirname,"reports/wide-posture-assembly.json")){
 const layout=JSON.parse(fs.readFileSync(path.join(__dirname,"studies/assembly_three_wide_2x2.json"),"utf8"));
 const r=analyzePostures(layout);
 fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(r,null,2)+"\n");return r;
}
if(require.main===module)console.log(JSON.stringify(generate(process.argv[2]||undefined),null,2));
module.exports={analyzePostures,generate};
