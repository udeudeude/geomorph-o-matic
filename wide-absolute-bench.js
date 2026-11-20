"use strict";
// Source-registered FLOOR and CEILING on one fictional vertical datum.
// Compares an unchanged roof crown with a roof rising above a lava bench.
// Neither is a survey or a structural analysis; no gameplay model is silently changed.
const fs=require("node:fs"),path=require("node:path");
const {source}=require("./wide-cave");
const {buildCells}=require("./assemble");
const {doorEdges}=require("./audit");
const {terrainModel,terrainGraph}=require("./terrain");
const {roofModel,headroomGraph,POSTURES}=require("./wide-headroom");
const {distances}=require("./route-analysis");
const {boundaryCell}=require("./seam-profiles");

const CELL_FEET=2.5, SCALE=24;
const key=p=>p.join(",");
const xy=p=>p.split(",").map(Number);
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
function walkTo(graph,start,end){
 const queue=[start],previous=new Map([[start,null]]);
 for(let i=0;i<queue.length;i++){
  const p=queue[i];if(p===end)break;
  for(const q of (graph.get(p)||[]).slice().sort()){
   if(!previous.has(q)){previous.set(q,p);queue.push(q);}
  }
 }
 if(!previous.has(end))throw Error("Bench approach is not reachable from ordinary floor");
 const route=[];for(let p=end;p!==null;p=previous.get(p))route.push(p);
 return route.reverse();
}
function assess(tile){
 if(!tile||tile.id!=="sagging_sheet")throw Error("Absolute bench datum is registered only to Sagging Sheetflow");
 const owner=buildCells(tile),terrain=terrainModel(owner,tile.terrain||{}),
  roof=roofModel(owner,tile.roof_scenario,tile.seam_profile),
  graph=terrainGraph(owner,doorEdges(tile),tile.terrain||{},"ordinary","dry");
 const levels=new Map([...owner.keys()].map(p=>[p,terrain.heights.get(p)||0]));
 const elevated=[...levels].filter(([,h])=>h!==0);
 if(elevated.length!==8||elevated.some(([,h])=>h!==1)||terrain.steps.size!==3||terrain.ramps.size)
  throw Error("Changed one-foot bench or three-step topology");
 const rises=tile.terrain.steps.map(s=>s.rise_feet);
 if(rises.some(n=>n!==1)||tile.terrain.steps.some(s=>s.risers!==2))
  throw Error("The explicitly modeled two 0.5-foot basalt risers changed");
 const floorZ=new Map([...levels].map(([p,l])=>[p,l]));
 const zones=new Set(roof.zones.flatMap(z=>z.cells));
 if(elevated.some(([p])=>zones.has(p)))throw Error("Bench and low-roof pinch unexpectedly overlap");
 const mouths=["N","E","S","W"].flatMap(side=>[4,5,14,15].map(o=>key(boundaryCell(side,o))));
 if(mouths.some(p=>floorZ.get(p)!==0||roof.clearances.get(p)!==6.5))
  throw Error("Common 6.5-foot crown and zero-floor seam datum changed");
 const floorGraph=new Map([...graph].filter(([p])=>floorZ.get(p)===0)
   .map(([p,adj])=>[p,adj.filter(q=>floorZ.get(q)===0)]));
 const hypotheses={};
 for(const mode of ["fixed","lifted"]){
  const ceilings=new Map([...roof.clearances].map(([p,h])=>[p,h+(mode==="lifted"?floorZ.get(p):0)]));
  const local=new Map([...ceilings].map(([p,z])=>[p,z-floorZ.get(p)]));
  if([...local.values()].some(h=>h<2.5))throw Error("Modeled crown intersects a floor");
  if(mouths.some(p=>ceilings.get(p)!==6.5))throw Error("Vertical seam contract broken");
  const postureStats={};
  for(const [posture,minFeet] of Object.entries(POSTURES)){
   const admitted=headroomGraph(graph,{clearances:local},minFeet),reached=distances(admitted,"4,0");
   const benchAdmitted=elevated.filter(([p])=>admitted.has(p)).length;
   postureStats[posture]={
    minimum_clearance_feet:minFeet,admitted_cells:admitted.size,reachable_cells:reached.size,
    reachable_wide_mouth_cells:mouths.filter(p=>reached.has(p)).length,
    elevated_bench_cells_admitted:benchAdmitted
   };
  }
  if(postureStats.crawling.reachable_cells!==owner.size||
     postureStats.standing.reachable_wide_mouth_cells!==16)
   throw Error("Hypothetical crown loses the modular mouths or crawl circulation");
  hypotheses[mode]={
   interpretation:mode==="fixed"?"Assume 6.5-foot roof elevation above ordinary floor continues over the elevated lava bench.":"Assume roof elevation increases by one foot over the elevated bench, preserving 6.5 feet of local clearance.",
   bench_floor_elevation_feet:1,bench_roof_elevation_feet:mode==="fixed"?6.5:7.5,
   bench_local_clearance_feet:mode==="fixed"?5.5:6.5,
   modes:postureStats
  };
 }
 const approaches=[];
 for(const [i,step] of tile.terrain.steps.entries()){
  const [a,b]=step.edge.map(key);
  if(!graph.get(a)?.includes(b)||!graph.get(b)?.includes(a))throw Error("Basalt step is not a real walking edge");
  const lower=floorZ.get(a)===0&&floorZ.get(b)===1?a:floorZ.get(b)===0&&floorZ.get(a)===1?b:null;
  if(!lower)throw Error("Basalt step does not connect ordinary floor to the bench");
  const upper=lower===a?b:a;
  if(roof.clearances.get(lower)!==6.5||roof.clearances.get(upper)!==6.5)
   throw Error("Bench step intersects a low ceiling zone or crown taper");
  const route=walkTo(floorGraph,"4,0",lower),profile=route.slice(-3).concat(upper);
  const second=(graph.get(upper)||[]).filter(p=>p!==lower&&floorZ.get(p)===1).sort()[0];
  if(second)profile.push(second);
  const samples=profile.map((p,n)=>({
   station:n,cell:xy(p),distance_feet:n*CELL_FEET,
   floor_elevation_feet:floorZ.get(p),
   fixed_roof_elevation_feet:roof.clearances.get(p),
   lifted_roof_elevation_feet:roof.clearances.get(p)+floorZ.get(p),
   fixed_local_clearance_feet:roof.clearances.get(p)-floorZ.get(p),
   lifted_local_clearance_feet:roof.clearances.get(p)
  }));
  for(let j=1;j<profile.length;j++)if(!graph.get(profile[j-1])?.includes(profile[j]))
   throw Error("Architectural section invents a non-walkable connection");
  approaches.push({id:"step_"+(i+1),lower_cell:xy(lower),raised_cell:xy(upper),
   entrance_to_lower_route_feet:(route.length-1)*CELL_FEET,
   rise_feet:step.rise_feet,risers:step.risers,tread_depth_feet:CELL_FEET/step.risers,
   samples,step_sample_index:profile.indexOf(upper)});
 }
 if(new Set(approaches.map(a=>key(a.raised_cell))).size!==3)
  throw Error("The three approaches do not reach distinct bench floor cells");
 return {tile:tile.id,stage:"unreleased hypothetical architectural alternatives",
  datum:"z=0 at ordinary floor and all sixteen 5-foot mouths; bench floor z=+1 foot",
  sources:"Plan geometry, registered lava step edges and local clearances in wide-blueprints.json",
  half_cell_feet:CELL_FEET,vertical_and_horizontal_pixels_per_foot:SCALE,
  elevated_floor_cells:elevated.map(([p])=>xy(p)).sort((a,b)=>a[1]-b[1]||a[0]-b[0]),
  mouths_checked:mouths.length,approaches,hypotheses,
  adopted_for_gameplay:false,
  limitations:"Both roof scenarios are authored geometry, not surveyed dimensions. Does not prove roof support or passage stability, and neither scenario replaces the current local-clearance gameplay model."};
}
function plate(r){
 const W=1440,H=1110,left=42,planX=95,planY=165,planPitch=18,lines=[
  '<svg xmlns="http://www.w3.org/2000/svg" width="18in" height="13.875in" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Three actual Sagging Sheetflow basalt stair sections, with alternative fixed and lifted absolute crowns">',
  '<title>Sagging Sheetflow / three real step approaches, two hypothetical roof datum solutions</title>',
  '<rect width="'+W+'" height="'+H+'" fill="#f3f0e7"/>',
  '<text x="42" y="52" font-family="Georgia,serif" font-size="30" fill="#2b3b34">SAGGING SHEETFLOW / ABSOLUTE FLOOR AND ROOF DATUM</text>',
  '<text x="43" y="77" font-family="sans-serif" font-size="13" fill="#59695e">UNRELEASED ARCHITECTURAL OPTIONS: COMMON ROOF CROWN OR ONE-FOOT LIFT OVER A STEPPED BASALT BENCH</text>',
  '<g id="registered-bench-plan" font-family="sans-serif">',
  '<rect x="'+(planX-30)+'" y="115" width="435" height="466" fill="#fbfaf6" stroke="#b9bcb5"/>',
  '<text x="'+(planX-13)+'" y="145" font-size="17" fill="#293c34">01 / PLAN-REGISTERED BENCH</text>'
 ];
 // Reconstruct the entire canonical occupied floor rather than displaying a
 // floating patch of raised cells. The outline is made of real rock/floor edges.
 const mapTile=source().tiles.find(t=>t.id===r.tile),occupied=buildCells(mapTile);
 lines.push('<g id="registered-floor" fill="#dce2d8" stroke="#f7f6f0" stroke-width=".35">');
 for(const p of [...occupied.keys()].sort()){
  const [gx,gy]=xy(p);
  lines.push('<rect data-occupied-plan-cell="'+p+'" x="'+(planX+gx*planPitch)+'" y="'+(planY+gy*planPitch)+
   '" width="'+planPitch+'" height="'+planPitch+'"/>');
 }
 lines.push('</g>','<g id="actual-rock-boundary" fill="none" stroke="#44584c" stroke-width="1.8">');
 for(const p of [...occupied.keys()].sort()){
  const [gx,gy]=xy(p),x=planX+gx*planPitch,y=planY+gy*planPitch;
  for(const [other,d] of [
   [[gx,gy-1],'M'+x+','+y+'h'+planPitch],
   [[gx+1,gy],'M'+(x+planPitch)+','+y+'v'+planPitch],
   [[gx,gy+1],'M'+x+','+(y+planPitch)+'h'+planPitch],
   [[gx-1,gy],'M'+x+','+y+'v'+planPitch]
  ])if(!occupied.has(key(other)))lines.push('<path d="'+d+'"/>');
 }
 lines.push('</g>');
 for(const p of r.elevated_floor_cells){
  lines.push('<rect data-bench-cell="'+key(p)+'" x="'+(planX+p[0]*planPitch)+'" y="'+(planY+p[1]*planPitch)+
   '" width="'+planPitch+'" height="'+planPitch+'" fill="#ad9070" stroke="#f8f6f0" stroke-width="1"/>');
 }
 for(const a of r.approaches){
  const [lx,ly]=a.lower_cell,[ux,uy]=a.raised_cell;
  lines.push('<path data-real-stair="'+a.id+'" d="M'+(planX+(lx+.5)*planPitch)+','+(planY+(ly+.5)*planPitch)+
   'L'+(planX+(ux+.5)*planPitch)+','+(planY+(uy+.5)*planPitch)+'" stroke="#b35032" stroke-width="4"/>');
 }
 lines.push('<text x="84" y="557" font-size="11" fill="#637365">Brown: +1 ft bench. Red: three genuine traversable step edges.</text>','</g>',
  '<g id="roof-legend" font-family="sans-serif">',
  '<path d="M560 125h65" stroke="#405e55" stroke-width="3"/><text x="637" y="130" font-size="13" fill="#405e55">Floor at z=0/+1 ft</text>',
  '<path d="M835 125h65" stroke="#9d7146" stroke-width="3"/><text x="913" y="130" font-size="13" fill="#70553e">Fixed roof at z=6.5 ft</text>',
  '<path d="M1140 125h65" stroke="#57767d" stroke-width="3" stroke-dasharray="6 5"/><text x="1211" y="130" font-size="13" fill="#57767d">Lifted roof to z=7.5 ft</text>',
  '</g>');
 for(let i=0;i<r.approaches.length;i++){
  const a=r.approaches[i],x=555,top=170+i*288,w=845,h=260,baseline=top+204;
  const pts=a.samples,pitch=CELL_FEET*SCALE,x0=x+58;
  lines.push('<g id="absolute-'+a.id+'" font-family="sans-serif">',
   '<rect x="'+x+'" y="'+top+'" width="'+w+'" height="'+h+'" fill="#fffdf8" stroke="#b7c1ba"/>',
   '<text x="'+(x+20)+'" y="'+(top+29)+'" font-size="16" font-family="Georgia,serif" fill="#30483c">0'+(i+2)+' / '+a.id.toUpperCase().replace("_"," ")+' : '+a.entrance_to_lower_route_feet+' ft from north mouth to approach</text>',
   '<text x="'+(x+20)+'" y="'+(top+48)+'" font-size="11" fill="#536b5e">All axes 24 px/foot; aligned floor and roof share z=0. Local profile of real dry passage.</text>');
  let floorD='',fixedD='',liftedD='';
  for(let j=0;j<pts.length;j++){
   const p=pts[j],sx=x0+j*pitch,fy=baseline-p.floor_elevation_feet*SCALE;
   if(j===0)floorD='M'+sx+','+fy;
   else if(j===a.step_sample_index){
    const old=pts[j-1],ox=x0+(j-1)*pitch,prev=baseline-old.floor_elevation_feet*SCALE;
    // Two 0.5 ft risers, two 1.25 ft nominal treads (the centreline section is schematic).
    floorD+='H'+(ox+pitch*.25)+'v-'+(a.rise_feet/a.risers*SCALE)+
     'H'+(ox+pitch*.75)+'v-'+(a.rise_feet/a.risers*SCALE)+'H'+sx;
   }else floorD+='L'+sx+','+fy;
   fixedD+=(j?' L':'M')+sx+','+(baseline-p.fixed_roof_elevation_feet*SCALE);
   liftedD+=(j?' L':'M')+sx+','+(baseline-p.lifted_roof_elevation_feet*SCALE);
   lines.push('<text x="'+sx+'" y="'+(baseline+31)+'" font-size="10" text-anchor="middle" fill="#62736a">'+key(p.cell)+'</text>');
  }
  lines.push('<path d="'+floorD+'" fill="none" stroke="#405e55" stroke-width="3" data-floor-profile="'+a.id+'"/>',
   '<path d="'+fixedD+'" fill="none" stroke="#9d7146" stroke-width="2.5" data-fixed-roof="'+a.id+'"/>',
   '<path d="'+liftedD+'" fill="none" stroke="#57767d" stroke-width="2.5" stroke-dasharray="6 5" data-lifted-roof="'+a.id+'"/>',
   '<text x="'+(x+22)+'" y="'+(top+h-12)+'" font-size="11" fill="#82614c">Fixed: 5.5 ft clearance over bench. Lifted: 6.5 ft. Neither is a measured section.</text>',
   '</g>');
 }
 lines.push('<text x="52" y="1044" font-family="Georgia,serif" font-size="19" fill="#354c40">ARCHITECTURAL CONFLICT REVEALED, NOT SILENTLY RESOLVED</text>',
 '<text x="52" y="1071" font-family="sans-serif" font-size="13" fill="#56665b">A one-foot higher floor under a continuous crown reduces clearance. Keeping 6.5 ft of local headroom requires the roof to rise.</text>',
 '<text x="52" y="1093" font-family="sans-serif" font-size="12" fill="#7d5d44">Hypothetical fictional cave sections; no measured elevation, bearing, roof stability or certified accessible route.</text>','</svg>');
 return lines.join("\n")+"\n";
}
function generate(reportPath=path.join(__dirname,"reports/sheetflow-bench-crown.json"),
                  svgPath=path.join(__dirname,"studies/sheetflow_bench_crown.svg")){
 const tile=source().tiles.find(t=>t.id==="sagging_sheet"),r=assess(tile);
 fs.mkdirSync(path.dirname(reportPath),{recursive:true});fs.mkdirSync(path.dirname(svgPath),{recursive:true});
 fs.writeFileSync(reportPath,JSON.stringify(r,null,2)+"\n");
 fs.writeFileSync(svgPath,plate(r));
 return r;
}
if(require.main===module)console.log(JSON.stringify(generate(),null,2));
module.exports={CELL_FEET,SCALE,walkTo,assess,plate,generate};
