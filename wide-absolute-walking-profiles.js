"use strict";
// Walking-route profiles use a shared physical z datum, not a false straight
// geological section. Both axes are equally scaled; each route can turn.
const fs=require("node:fs"),path=require("node:path");
const {source}=require("./wide-cave");
const {buildCells}=require("./assemble");
const {doorEdges}=require("./audit");
const {terrainGraph,terrainModel}=require("./terrain");
const {roofModel}=require("./wide-headroom");
const HALF_CELL_FEET=2.5,PIXELS_PER_FOOT=12,START="4,0";
const destinations=Object.freeze({
 braided_lava:{at:"11,9",feature:"High roof of the braided confluence"},
 sagging_sheet:{at:"17,13",feature:"Stooped eastern end of the raised basalt bench"},
 split_spine:{at:"10,15",feature:"Lower crown beyond the axial rock spine"}
});
const xy=p=>p.split(",").map(Number);
const edge=(a,b)=>[a,b].sort().join("|");
function shortestPath(graph,start,end){
 if(!graph.has(start)||!graph.has(end))throw Error("Route endpoint is not occupied floor");
 const previous=new Map([[start,null]]),queue=[start];
 for(let i=0;i<queue.length&&!previous.has(end);i++){
  const p=queue[i];
  for(const q of [...(graph.get(p)||[])].sort()){
   if(!previous.has(q)){previous.set(q,p);queue.push(q);}
  }
 }
 if(!previous.has(end))throw Error("No traversable cave passage to the authored vertical feature");
 const route=[];
 for(let p=end;p!==null;p=previous.get(p))route.push(p);
 return route.reverse();
}
function assess(tile,target=destinations[tile.id]){
 if(!target||typeof target.at!=="string")throw Error("No authored vertical destination for tile");
 const floor=buildCells(tile),r=roofModel(floor,tile.roof_scenario,tile.seam_profile,tile.terrain);
 const ground=terrainModel(floor,tile.terrain||{});
 const graph=terrainGraph(floor,doorEdges(tile),tile.terrain||{},"ordinary","dry");
 if(!r.absolute_roof_elevations_feet||!r.floor_elevations_feet)
  throw Error("Vertical walking route requires an absolute roof and floor datum");
 const route=shortestPath(graph,START,target.at);
 const stations=route.map((p,i)=>{
  const z=r.floor_elevations_feet.get(p),c=r.absolute_roof_elevations_feet.get(p);
  if(!Number.isFinite(z)||!Number.isFinite(c)||c-z<2.5)
   throw Error("Cave route has an invalid real floor or absolute fictional crown: "+p);
  return {station:i,route_feet:i*HALF_CELL_FEET,cell:xy(p),
   floor_z_feet:z,roof_z_feet:c,local_clearance_feet:c-z};
 });
 const crossings=[];
 for(let i=1;i<stations.length;i++){
  const a=route[i-1],b=route[i],p=stations[i-1],q=stations[i];
  if(Math.abs(p.cell[0]-q.cell[0])+Math.abs(p.cell[1]-q.cell[1])!==1||
    !(graph.get(a)||[]).includes(b))
   throw Error("Unregistered route traverses a wall or skips rock");
  const rise=Math.abs(p.floor_z_feet-q.floor_z_feet),step=ground.steps.get(edge(a,b));
  if(rise&&!step)throw Error("Unregistered stair in actual vertical floor");
  if(step&&!(step.risers>=1&&step.rise_feet===rise))
   throw Error("Basalt step model contradicts the actual route floor datum");
  if(step)crossings.push({after_station:i,from:p.cell,to:q.cell,
    rise_feet:step.rise_feet,risers:step.risers});
 }
 if(stations[0].floor_z_feet!==0||stations[0].roof_z_feet!==6.5||
    stations[1].floor_z_feet!==0||stations[1].roof_z_feet!==6.5)
  throw Error("External throat z datum changed in longitudinal route");
 if(tile.id==="sagging_sheet"&&(!crossings.length||stations.at(-1).floor_z_feet!==1||
    stations.at(-1).local_clearance_feet!==5.5))
  throw Error("Sheetflow section fails to reach actual raised, standing-restricted bench by steps");
 return {tile:tile.id,feature:target.feature,mode:"ordinary dry walking (crouch where required)",
  horizontal_axis:"route distance, deliberately unfolded through plan turns",
  physical_datum:"z=0 feet at every modular exterior floor; fictional roof and floor elevations",
  route_length_feet:(route.length-1)*HALF_CELL_FEET,
  floor_cells_sampled:stations.length,real_stair_crossings:crossings.length,
  lowest_local_clearance_feet:Math.min(...stations.map(p=>p.local_clearance_feet)),
  ascent_feet:stations.at(-1).floor_z_feet,
  endpoints:{start:stations[0].cell,end:stations.at(-1).cell},
  stair_crossings:crossings,stations,
  limitations:"Route-folded architectural profile, not a straight geological survey or an overhead rock-solid model. Linear roof joins are diagrammatic."};
}
function assessAll(tiles=source().tiles){
 const profiles=tiles.map(t=>assess(t));
 if(profiles.length!==3||new Set(profiles.map(x=>x.tile)).size!==3)
  throw Error("Expected three individual volcanic vertical routes");
 return {status:"UNRELEASED fictional architectural study",horizontal_vertical_pixels_per_foot:PIXELS_PER_FOOT,
  half_cell_distance_feet:HALF_CELL_FEET,
  shared_datum:"All external floors z=0, all protected crowns z=6.5 ft",
  profiles,
  limitations:"Real occupied floor and step topology; fictional height values. Route-unfolded rather than projected straight section; geological roof support, rock thickness and print readability unverified."};
}
function floorPath(stations,x0,baseline,pitch){
 const pos=(x,z)=>Number(x.toFixed(2))+","+Number((baseline-z*PIXELS_PER_FOOT).toFixed(2));
 let txt="M"+pos(x0,stations[0].floor_z_feet);
 for(let i=1;i<stations.length;i++){
  const a=stations[i-1],b=stations[i],x=x0+(i-1)*pitch;
  if(a.floor_z_feet===b.floor_z_feet){txt+=" L"+pos(x+pitch,b.floor_z_feet);continue;}
  const m=(a.floor_z_feet+b.floor_z_feet)/2;
  txt+=" L"+pos(x+pitch/3,a.floor_z_feet)+" L"+pos(x+pitch/3,m)+
   " L"+pos(x+pitch*2/3,m)+" L"+pos(x+pitch*2/3,b.floor_z_feet)+
   " L"+pos(x+pitch,b.floor_z_feet);
 }
 return txt;
}
function plate(report=assessAll(),tiles=source().tiles){
 const pitch=HALF_CELL_FEET*PIXELS_PER_FOOT;
 const W=Math.max(1320,325+Math.max(...report.profiles.map(p=>p.stations.length-1))*pitch+65);
 const H=1080,lines=[
  '<svg xmlns="http://www.w3.org/2000/svg" width="'+(W/85).toFixed(2)+'in" height="12.7in" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Three registered walking-route floor and roof profiles with true stair transitions">',
  '<title>Wide volcanic caverns / absolute datum walking-route sections</title>',
  '<desc>Roof elevations and floor rises reconstructed from source cave cells; paths turn and are unfolded. No geological survey or structural support is implied.</desc>',
  '<rect width="'+W+'" height="'+H+'" fill="#f1eee5"/>',
  '<text x="35" y="44" font-size="28" font-family="Georgia,serif" fill="#263b35">VOLCANIC CAVERNS / WALKING-ROUTE VERTICAL SECTIONS</text>',
  '<text x="36" y="70" font-family="sans-serif" font-size="13" fill="#516d60">Plan-registered dry routes · absolute floor and ceiling z · both section axes '+PIXELS_PER_FOOT+' pixels per foot</text>'
 ];
 for(let i=0;i<report.profiles.length;i++){
  const r=report.profiles[i],tile=tiles.find(t=>t.id===r.tile);
  if(!tile)throw Error("Missing source cave in vertical study");
  const floor=buildCells(tile),x0=295,top=96+i*320,base=top+250;
  const xEnd=x0+(r.stations.length-1)*pitch;
  lines.push('<g id="absolute-route-'+r.tile+'" font-family="sans-serif">');
  lines.push('<rect x="24" y="'+top+'" width="'+(W-48)+'" height="308" fill="#fffcf4" stroke="#b7c4b8"/>');
  lines.push('<text x="43" y="'+(top+27)+'" font-size="18" font-family="Georgia,serif" fill="#344940">'+r.feature+'</text>');
  lines.push('<text x="43" y="'+(top+46)+'" font-size="11" fill="#586e61">'+r.tile.replaceAll("_"," ").toUpperCase()+' · '+r.route_length_feet+' feet of actual walking, unrolled through turns</text>');
  const cell=8,px=49,py=top+64;
  for(let y=0;y<20;y++)for(let x=0;x<20;x++){
   lines.push('<rect x="'+(px+x*cell)+'" y="'+(py+y*cell)+'" width="'+cell+'" height="'+cell+
    '" fill="'+(floor.has(x+","+y)?"#f5edda":"#50655a")+'" stroke="#83958a" stroke-width=".22"/>');
  }
  for(const station of r.stations){
   const [x,y]=station.cell;
   lines.push('<rect data-plan-route="'+r.tile+':'+x+','+y+'" x="'+(px+x*cell+1)+'" y="'+(py+y*cell+1)+
    '" width="'+(cell-2)+'" height="'+(cell-2)+'" fill="#be794e"/>');
  }
  for(const z of [0,2,4,6,8,10]){
   const y=base-z*PIXELS_PER_FOOT;
   lines.push('<path d="M'+(x0-10)+','+y+'H'+(xEnd+22)+'" stroke="#d1d8cf" stroke-dasharray="3 6"/>');
   lines.push('<text x="'+(x0-16)+'" y="'+(y+4)+'" text-anchor="end" font-size="10" fill="#607568">'+z+' ft</text>');
  }
  const roofs=r.stations.map((s,j)=>(x0+j*pitch)+","+(base-s.roof_z_feet*PIXELS_PER_FOOT));
  lines.push('<path data-absolute-roof="'+r.tile+'" d="M'+roofs.join(" L")+'" stroke="#4e8177" stroke-width="3" fill="none" stroke-linejoin="round"/>');
  lines.push('<path data-absolute-floor="'+r.tile+'" d="'+floorPath(r.stations,x0,base,pitch)+'" stroke="#625043" stroke-width="3" fill="none"/>');
  for(const p of r.stations){
   if(p.station===0||p.station%5===0||p.station===r.stations.length-1){
    const x=x0+p.station*pitch;
    lines.push('<line data-sample="'+r.tile+':'+p.station+'" x1="'+x+'" x2="'+x+'" y1="'+(base-p.floor_z_feet*PIXELS_PER_FOOT)+
     '" y2="'+(base-p.roof_z_feet*PIXELS_PER_FOOT)+'" stroke="#b9b7aa" stroke-dasharray="2 3"/>');
    lines.push('<text x="'+x+'" y="'+(base+19)+'" text-anchor="middle" font-size="9" fill="#607568">'+p.cell.join(",")+'</text>');
   }
  }
  for(const stair of r.stair_crossings){
   const x=x0+(stair.after_station-.5)*pitch;
   lines.push('<path data-authored-stair="'+r.tile+'" d="M'+x+','+(base+4)+'v12" stroke="#bd6c43" stroke-width="3"/>');
  }
  lines.push('<text x="'+x0+'" y="'+(base+44)+'" font-size="11" fill="#526b5e">Green: invented roof z · Brown: genuine authored floor z · Orange: actual basalt-step crossing</text>');
  lines.push('</g>');
 }
 lines.push('<text x="36" y="1063" font-family="sans-serif" font-size="12" fill="#8d5a42">UNFOLDED PATH, NOT STRAIGHT SECTION. Roof segments interpolate plan samples; roof thickness and stability unknown.</text>');
 lines.push('</svg>');
 return lines.join("\n")+"\n";
}
function generate(reportPath=path.join(__dirname,"reports/wide-absolute-walking-profiles.json"),
 svgPath=path.join(__dirname,"studies/wide_absolute_walking_profiles.svg")){
 const tiles=source().tiles,result=assessAll(tiles);
 fs.mkdirSync(path.dirname(reportPath),{recursive:true});
 fs.mkdirSync(path.dirname(svgPath),{recursive:true});
 fs.writeFileSync(reportPath,JSON.stringify(result,null,2)+"\n");
 fs.writeFileSync(svgPath,plate(result,tiles));
 return result;
}
if(require.main===module){
 const r=generate();console.log(JSON.stringify(r.profiles.map(p=>({
  tile:p.tile,route_feet:p.route_length_feet,stair_crossings:p.real_stair_crossings,low_clearance:p.lowest_local_clearance_feet})),null,2));
}
module.exports={destinations,shortestPath,assess,assessAll,floorPath,plate,generate};
