"use strict";
// Reconstruct actual ordinary dry routes across rotated adjoining wide-mouth
// cave maps. Matching edge art alone does not prove traversable assemblies.
const fs=require("node:fs"),path=require("node:path");
const {buildCells,rotateCell,verifyLayout}=require("./assemble");
const {inspectTile}=require("./seam-profiles");
const {doorEdges}=require("./audit");
const {terrainGraph}=require("./terrain");
const {distances}=require("./route-analysis");
const {source}=require("./wide-cave");
const OFFSETS=[4,5,14,15],CELL=20;
const xy=s=>s.split(",").map(Number);
const key=(x,y)=>x+","+y;
function examineAssembly(layout,data=source()){
 const rows=verifyLayout(layout,data),w=rows[0].length,h=rows.length;
 const graph=new Map(),seams=[];
 const global=(p,x,y,turn)=>{
  const [a,b]=rotateCell(typeof p==="string"?xy(p):p,turn);
  return key(a+x*CELL,b+y*CELL);
 };
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const c=rows[y][x],floor=buildCells(c.tile);
  inspectTile(c.tile,"cave-wide-v1");
  const local=terrainGraph(floor,doorEdges(c.tile),c.tile.terrain||{},"ordinary","dry");
  for(const [p,neighbors] of local){
   const at=global(p,x,y,c.turn);
   if(graph.has(at))throw Error("Overlapping assembly floor at "+at);
   graph.set(at,neighbors.map(q=>global(q,x,y,c.turn)));
  }
 }
 function join(a,b,tag){
  if(!graph.has(a)||!graph.has(b))throw Error("Missing traversable modular seam at "+tag+": "+a+" / "+b);
  graph.get(a).push(b);graph.get(b).push(a);
  seams.push({a,b,tag});
 }
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  if(x<w-1)for(const o of OFFSETS){
   const a=key((x+1)*CELL-1,y*CELL+o),b=key((x+1)*CELL,y*CELL+o);
   join(a,b,`vertical-${x}-${y}`);
  }
  if(y<h-1)for(const o of OFFSETS){
   const a=key(x*CELL+o,(y+1)*CELL-1),b=key(x*CELL+o,(y+1)*CELL);
   join(a,b,`horizontal-${x}-${y}`);
  }
 }
 const entered=distances(graph,"4,0");
 if(entered.size!==graph.size)throw Error("Joined layout contains inaccessible occupied cave floor");
 const groups=[...new Set(seams.map(s=>s.tag))];
 const resilience=groups.map(tag=>{
  const exclusion=new Set(seams.filter(s=>s.tag===tag).flatMap(({a,b})=>[a+"|"+b,b+"|"+a]));
  const cut=new Map([...graph].map(([p,n])=>[p,n.filter(q=>!exclusion.has(p+"|"+q))]));
  return {seam:tag,connected_floor_cells_after_full_seam_closure:distances(cut,"4,0").size};
 });
 if(resilience.some(r=>r.connected_floor_cells_after_full_seam_closure!==graph.size))
  throw Error("Mixed wide assembly depends on a single joining edge; no alternate route remains");
 const outerMouths=2*(w+h)*OFFSETS.length;
 return {stage:"unreleased playable-layout diagnostic, not field playtesting",
  layout:layout.title||"Unnamed wide modular study",width_tiles:w,height_tiles:h,
  authored_tile_types:[...new Set(rows.flat().map(c=>c.id))].sort(),
  tile_instances:w*h,occupied_floor_cells:graph.size,reachable_floor_cells:entered.size,
  distinct_internal_joining_seams:groups.length,actual_walkable_intertile_edges:seams.length,
  exterior_edge_cells:outerMouths,whole_seam_closures_with_alternate_routes:resilience,
  units:"2.5-foot half-cells",caution:"No real height, load-bearing strength, physical print inspection or human tabletop playtest established."};
}
function generate(file=path.join(__dirname,"reports/wide-assembly-routes.json")){
 const layout=JSON.parse(fs.readFileSync(path.join(__dirname,"studies/assembly_three_wide_2x2.json"),"utf8"));
 const report=examineAssembly(layout);
 fs.mkdirSync(path.dirname(file),{recursive:true});
 fs.writeFileSync(file,JSON.stringify(report,null,2)+"\n");
 return report;
}
if(require.main===module)console.log(JSON.stringify(generate(process.argv[2]||undefined),null,2));
module.exports={examineAssembly,generate};
