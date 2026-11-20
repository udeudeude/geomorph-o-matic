"use strict";
// Plan-registered rock-web audit. A one-cell septum is a plan dimension,
// NOT a measured basalt roof thickness or a structural stability assessment.
const fs=require("node:fs"),path=require("node:path");
const {source}=require("./wide-cave");
const {buildCells}=require("./assemble");
const {doorEdges}=require("./audit");
const {terrainGraph}=require("./terrain");
const HALF_CELL_FEET=2.5;
const key=(x,y)=>x+","+y;
function distance(graph,from,to){
 if(!graph.has(from)||!graph.has(to))return null;
 const visited=new Map([[from,0]]),queue=[from];
 for(let i=0;i<queue.length;i++){
  const current=queue[i];
  if(current===to)return visited.get(current);
  for(const next of graph.get(current)||[]){
   if(!visited.has(next)){visited.set(next,visited.get(current)+1);queue.push(next);}
  }
 }
 return null;
}
function analyzeTile(tile){
 const floor=buildCells(tile);
 const graph=terrainGraph(floor,doorEdges(tile),tile.terrain||{},"ordinary","dry");
 const narrow=[];
 for(let y=2;y<18;y++)for(let x=2;x<18;x++){
  if(floor.has(key(x,y)))continue;
  const directions=[
   {axis:"east-west",a:key(x-1,y),b:key(x+1,y)},
   {axis:"north-south",a:key(x,y-1),b:key(x,y+1)}
  ];
  for(const dir of directions){
   if(!floor.has(dir.a)||!floor.has(dir.b))continue;
   const steps=distance(graph,dir.a,dir.b);
   narrow.push({rock_cell:[x,y],axis:dir.axis,
    opposite_floor_cells:[dir.a.split(",").map(Number),dir.b.split(",").map(Number)],
    rock_web_plan_width_feet:HALF_CELL_FEET,
    walking_bypass_half_cells:steps,
    walking_bypass_feet:steps===null?null:steps*HALF_CELL_FEET,
    priority:steps===null?"unconnected":steps>=8?"long-bypass":"local-partition"});
  }
 }
 narrow.sort((a,b)=>a.rock_cell[1]-b.rock_cell[1]||
  a.rock_cell[0]-b.rock_cell[0]||a.axis.localeCompare(b.axis));
 const priority=narrow.filter(w=>w.priority!=="local-partition");
 return {tile:tile.id,source_floor_cells:floor.size,
  audited_interior_bounds:"x,y=2..17 only; excludes the protected modular throat zone",
  minimum_sampled_web_width_feet:HALF_CELL_FEET,
  narrow_web_cross_sections:narrow.length,
  long_bypass_cross_sections:priority.filter(w=>w.priority==="long-bypass").length,
  disconnected_banks:priority.filter(w=>w.priority==="unconnected").length,
  limitations:"Detects one-cell rock separations between genuine occupied plan cells. A single rock cell may contribute two cross sections. Bypass routes include actual traversability restrictions; these figures establish neither rock bearing, thermal history, ceiling thickness nor geological hazard.",
  cross_sections:narrow};
}
function analyzeAll(data=source()){
 const tiles=data.tiles.map(analyzeTile);
 return {status:"UNRELEASED design-quality diagnostic, not engineering",
  units:"Each plan cell represents 2.5 feet of horizontal plan distance",
  method:"Occupied floor reconstruction; one-rock-cell opposites; shortest actual dry walking bypass using authored doors, falls and stairs",
  tiles,
  review_priority:"Investigate long-bypass thin partitions on paper and in a deliberately authored plan revision before treating caves as geologically credible."};
}
function plate(report=analyzeAll(),data=source()){
 const W=1310,H=560,cell=17,items=[
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Three cave plan sections identifying single-cell basalt rock partitions">',
  '<title>Rock web integrity audit / three wide-mouth cave geomorphs</title>',
  '<desc>Rock separators derived from occupied fictional floor-plan cells. Amber indicates long bypass around a 2.5-foot rock web; these are review targets, not stability claims.</desc>',
  '<rect width="'+W+'" height="'+H+'" fill="#efece3"/>',
  '<text x="28" y="42" font-family="Georgia,serif" font-size="27" fill="#293a35">CAVE ROCK WEBS / PLAN-BASED DESIGN AUDIT</text>',
  '<text x="29" y="65" font-family="sans-serif" font-size="13" fill="#52645c">One-cell internal rock septa · Walking detours respect existing floor, closures and stair edges</text>'
 ];
 for(let i=0;i<report.tiles.length;i++){
  const r=report.tiles[i],tile=data.tiles.find(t=>t.id===r.tile);
  if(!tile)throw Error("Missing cave for rock-web section");
  const floor=buildCells(tile),x0=30+i*425,y0=113;
  items.push('<g id="rock-web-review-'+r.tile+'" font-family="sans-serif">');
  items.push('<text x="'+x0+'" y="'+(y0-18)+'" font-size="17" fill="#31453c">'+
   String(tile.title).replaceAll("&","&amp;").replaceAll("<","&lt;")+'</text>');
  for(let y=0;y<20;y++)for(let x=0;x<20;x++){
   items.push('<rect x="'+(x0+x*cell)+'" y="'+(y0+y*cell)+'" width="'+cell+
    '" height="'+cell+'" fill="'+(floor.has(key(x,y))?"#fffcf2":"#626d67")+
    '" stroke="#9eaaa2" stroke-width=".32"/>');
  }
  const byCell=new Map();
  for(const sec of r.cross_sections){
   const p=sec.rock_cell.join(","),prev=byCell.get(p);
   if(!prev||sec.priority==="long-bypass"||sec.priority==="unconnected")byCell.set(p,sec);
  }
  for(const [p,s] of byCell){
   const [x,y]=p.split(",").map(Number),cx=x0+(x+.5)*cell,cy=y0+(y+.5)*cell;
   const important=s.priority!=="local-partition";
   items.push('<circle data-rock-web="'+r.tile+':'+p+'" data-priority="'+s.priority+
    '" cx="'+cx+'" cy="'+cy+'" r="'+(important?6.3:3.3)+'" fill="'+
    (important?"#d19b3e":"#8cb1a4")+'" stroke="#223c38" stroke-width=".7"/>');
  }
  items.push('<text x="'+x0+'" y="'+(y0+371)+'" font-size="12" fill="#354a40">'+
   r.narrow_web_cross_sections+' thin cross sections / '+r.long_bypass_cross_sections+' long-bypass reviews</text>');
  items.push('<text x="'+x0+'" y="'+(y0+390)+'" font-size="11" fill="#596f61">White: occupied cave · Dark: solid rock · Gold: review</text>');
  items.push('</g>');
 }
 items.push('<text x="29" y="539" font-family="sans-serif" font-size="12" fill="#8a6047">FICTIONAL PLAN AUDIT ONLY. A 2.5-foot rock separator is not a measured support web or a prediction of roof collapse.</text>');
 items.push('</svg>');
 return items.join("\n")+"\n";
}
function generate(reportPath=path.join(__dirname,"reports/wide-rock-webs.json"),
 svgPath=path.join(__dirname,"studies/wide_rock_webs.svg")){
 const data=source(),result=analyzeAll(data);
 fs.mkdirSync(path.dirname(reportPath),{recursive:true});
 fs.mkdirSync(path.dirname(svgPath),{recursive:true});
 fs.writeFileSync(reportPath,JSON.stringify(result,null,2)+"\n");
 fs.writeFileSync(svgPath,plate(result,data));
 return result;
}
if(require.main===module){
 const r=generate();console.log(JSON.stringify(r.tiles.map(t=>({
  tile:t.tile,thin:t.narrow_web_cross_sections,long:t.long_bypass_cross_sections})),null,2));
}
module.exports={distance,analyzeTile,analyzeAll,plate,generate};
