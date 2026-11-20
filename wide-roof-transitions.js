"use strict";
// Roof profiles unrolled along real routes through authored wide caves.
// These are plan-registered design studies, NOT measured longitudinal surveys.
// Distances use 2.5-foot occupied floor cells; heights are above LOCAL floor.
const fs=require("node:fs"),path=require("node:path");
const {source}=require("./wide-cave");
const {buildCells}=require("./assemble");
const {doorEdges}=require("./audit");
const {terrainGraph,terrainModel}=require("./terrain");
const {roofModel}=require("./wide-headroom");
const CELL_FEET=2.5,PIXELS_PER_FOOT=24,ENTRY="4,0";
const xy=p=>p.split(",").map(Number);
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
function routeToPinch(graph,zones,start=ENTRY){
  const stops=new Set(zones.flatMap(z=>z.cells)),queue=[start],parent=new Map([[start,null]]);
  let target=null;
  for(let i=0;i<queue.length;i++){
    const p=queue[i];
    if(stops.has(p)){target=p;break;}
    for(const q of [...(graph.get(p)||[])].sort()){
      if(parent.has(q))continue;
      parent.set(q,p);queue.push(q);
    }
  }
  if(!target)throw Error("The authored low ceiling is not reachable through actual cave passages");
  const result=[];
  for(let p=target;p!==null;p=parent.get(p))result.push(p);
  return result.reverse();
}
function assess(tile){
  const owner=buildCells(tile),roof=roofModel(owner,tile.roof_scenario,tile.seam_profile,tile.terrain);
  const terrain=terrainModel(owner,tile.terrain||{});
  const walking=terrainGraph(owner,doorEdges(tile),tile.terrain||{},"ordinary","dry");
  const route=routeToPinch(walking,roof.zones);
  if(route.some(p=>(terrain.heights.get(p)||0)!==0))
    throw Error("Selected roof profile crosses a raised floor; requires a measured vertical floor datum");
  const pinched=new Set(roof.zones.flatMap(z=>z.cells));
  const protectedMouths=new Set([...roof.mouth_distances].filter(([,d])=>d===0).map(([p])=>p));
  const samples=route.map((p,i)=>({
    station:i,plan_cell:xy(p),route_distance_feet:i*CELL_FEET,
    local_clearance_feet:roof.clearances.get(p),
    type:pinched.has(p)?"pinched_ceiling":protectedMouths.has(p)?"modular_throat":
      roof.clearances.get(p)<roof.baseline_feet?"throat_to_vault":"interior_vault"
  }));
  const segments=samples.slice(1).map((p,i)=>{
    const prev=samples[i],change=p.local_clearance_feet-prev.local_clearance_feet;
    return {from_station:i,to_station:i+1,ceiling_change_feet:change,
      local_crown_change_percent:Math.round(100*Math.abs(change)/CELL_FEET*10)/10,
      intentional_abrupt_pinch:pinched.has(route[i])||pinched.has(route[i+1])};
  });
  const gradual=segments.filter(s=>!s.intentional_abrupt_pinch);
  if(gradual.some(s=>Math.abs(s.ceiling_change_feet)>0.500001))
    throw Error("The authored entry-to-vault transition changes more than half a foot per grid station");
  if(samples[0].local_clearance_feet!==6.5||samples[1].local_clearance_feet!==6.5)
    throw Error("The modular entrance must retain its two-cell vertical contract");
  if(samples.at(-1).type!=="pinched_ceiling")
    throw Error("The section must terminate at the actual authored low ceiling");
  return {tile:tile.id,stage:"unreleased plan-registered hypothetical route profile",
    interpretation:"Route-unrolled local clearance above ordinary floor, NOT a surveyed straight geologic section",
    horizontal_and_vertical_pixels_per_foot:PIXELS_PER_FOOT,
    half_cell_feet:CELL_FEET,start_mouth:xy(ENTRY),end_low_ceiling:samples.at(-1).plan_cell,
    route_length_feet:(route.length-1)*CELL_FEET,
    assumed_mouth_crown_feet:roof.mouth_crown_feet,assumed_interior_clearance_feet:roof.baseline_feet,
    modeled_taper_cells:roof.tapered_cells.length,
    maximum_non_pinch_ceiling_change_feet:Math.max(...gradual.map(s=>Math.abs(s.ceiling_change_feet)),0),
    abrupt_pinch_transitions:segments.filter(s=>s.intentional_abrupt_pinch&&Math.abs(s.ceiling_change_feet)>.5).length,
    samples,segments,
    limitations:"Hypothetical local headroom over authored floor elevations; all three caverns now also have a fictional absolute z datum, but no surveyed section, roof support or physical stability assessment."};
}
function plate(reports){
  const pitch=PIXELS_PER_FOOT*CELL_FEET;
  const w=Math.max(1200,220+Math.max(...reports.map(r=>r.samples.length))*pitch);
  const h=1030,lines=[
    '<svg xmlns="http://www.w3.org/2000/svg" width="'+(w/80)+'in" height="'+(h/80)+'in" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="Hypothetical ceiling clearance along real cave walking routes">',
    '<title>Unfolded entrance-to-constriction roof profiles, three wide-mouth volcanic cave studies</title>',
    '<rect width="'+w+'" height="'+h+'" fill="#f0ede4"/>',
    '<text x="40" y="50" font-family="Georgia,serif" font-size="30" fill="#293c35">WIDE CAVE / ENTRANCE TO ROOF PINCH</text>',
    '<text x="42" y="74" font-family="sans-serif" font-size="13" fill="#52685d">UNFOLDED WALKING ROUTE · 2.5 FT PER STATION · BOTH AXES 24 PX/FT · LOCAL CLEARANCE ONLY</text>'
  ];
  for(let row=0;row<reports.length;row++){
    const r=reports[row],top=105+row*303,baseline=top+224,origin=117;
    lines.push('<g id="route-profile-'+esc(r.tile)+'" font-family="sans-serif">');
    lines.push('<rect x="32" y="'+top+'" width="'+(w-64)+'" height="290" fill="#faf9f4" stroke="#a4b4a7"/>');
    lines.push('<text x="55" y="'+(top+29)+'" font-family="Georgia,serif" font-size="19" fill="#293c35">'+
      esc(r.tile.toUpperCase().replaceAll("_"," "))+'</text>');
    lines.push('<text x="55" y="'+(top+47)+'" font-size="11" fill="#657b6f">From north five-foot entrance to real low-ceiling cell · '+r.route_length_feet+' ft actual route distance</text>');
    const points=[];
    for(const p of r.samples){
      const x=origin+p.station*pitch,y=baseline-p.local_clearance_feet*PIXELS_PER_FOOT;
      points.push(x+','+y);
      const isPoint=p.station===0||p.station===r.samples.length-1||p.station%3===0;
      if(isPoint)lines.push('<path d="M'+x+','+(baseline+2)+'v7" stroke="#50665b"/>',
        '<text x="'+x+'" y="'+(baseline+25)+'" font-size="10" text-anchor="middle" fill="#596d60">'+p.plan_cell.join(",")+'</text>');
      if(p.type==="pinched_ceiling")lines.push('<circle cx="'+x+'" cy="'+y+'" r="6" fill="#9d543c"/>');
    }
    const xend=origin+(r.samples.length-1)*pitch;
    lines.push('<path d="M'+origin+','+baseline+'H'+xend+'" fill="none" stroke="#35463a" stroke-width="2.4"/>');
    lines.push('<polyline data-route-ceiling="'+esc(r.tile)+'" points="'+points.join(" ")+'" fill="none" stroke="#a47a49" stroke-width="2.5"/>');
    lines.push('<path d="M'+origin+','+(baseline-6*PIXELS_PER_FOOT)+'H'+xend+'" stroke="#a0aba2" stroke-dasharray="5 5" fill="none"/>');
    lines.push('<text x="'+origin+'" y="'+(top+274)+'" font-size="11" fill="#5b685d">Red: authored low roof. Dashed: 6-foot standing threshold, not a legal clearance rule.</text>');
    lines.push('</g>');
  }
  lines.push('<text x="42" y="1020" font-family="sans-serif" font-size="11" fill="#795a48">DESIGN HYPOTHESIS, NOT SURVEY DATA. Distances follow winding walkable passages; roof heights above local floor only. No roof stability inferred.</text>','</svg>');
  return lines.join("\n")+"\n";
}
function generate(reportPath=path.join(__dirname,"reports/wide-roof-transitions.json"),
                  svgPath=path.join(__dirname,"studies/wide_roof_transitions.svg")){
  const reports=source().tiles.map(assess);
  fs.mkdirSync(path.dirname(reportPath),{recursive:true});
  fs.mkdirSync(path.dirname(svgPath),{recursive:true});
  fs.writeFileSync(reportPath,JSON.stringify({
    stage:"unreleased hypothetical local-height architectural profiles",
    method:"BFS along real terrainGraph walking edges; profile unrolled along route, not surveyed",
    references:"USGS Bulletin 1673 (1990); 2017 lava-tube lidar study; TubeX 2020",
    profiles:reports
  },null,2)+"\n");
  fs.writeFileSync(svgPath,plate(reports));
  return reports;
}
if(require.main===module)console.log(JSON.stringify(generate(),null,2));
module.exports={routeToPinch,assess,plate,generate};
