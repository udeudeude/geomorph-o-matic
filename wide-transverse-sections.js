"use strict";
// Registered fictional cave transects. The floor/roof elevations are sampled
// from actual authored cells; the lines between them are schematic, not surveyed.
const fs=require("node:fs"),path=require("node:path");
const {source}=require("./wide-cave");
const {buildCells}=require("./assemble");
const {doorEdges}=require("./audit");
const {terrainGraph,terrainModel}=require("./terrain");
const {roofModel}=require("./wide-headroom");

const HALF_CELL_FEET=2.5,PIXELS_PER_FOOT=21;
const cuts=Object.freeze([
 {tile:"braided_lava",row:9,x1:6,x2:11,
  label:"Braided central confluence: asymmetric feeder vault"},
 {tile:"sagging_sheet",row:12,x1:14,x2:18,
  label:"Inflated sheet: genuine 1-foot bench and two natural stairs"},
 {tile:"split_spine",row:4,x1:7,x2:13,
  label:"Split-spine north blister: crowned side arch"}
]);
const key=(x,y)=>x+","+y,xy=s=>s.split(",").map(Number);
const escape=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const edge=(a,b)=>[a,b].sort().join("|");
const point=(x,y)=>Number(x.toFixed(2))+","+Number(y.toFixed(2));
function assessCut(cut,tiles=source().tiles){
 const tile=tiles.find(t=>t.id===cut.tile);
 if(!tile||!Number.isInteger(cut.row)||!Number.isInteger(cut.x1)||
    !Number.isInteger(cut.x2)||cut.x1<0||cut.x2>=20||
    cut.x1>=cut.x2||cut.row<0||cut.row>19)
   throw Error("Invalid plan-registered transverse section");
 const owner=buildCells(tile),r=roofModel(owner,tile.roof_scenario,tile.seam_profile,tile.terrain);
 const terrain=terrainModel(owner,tile.terrain||{});
 const graph=terrainGraph(owner,doorEdges(tile),tile.terrain||{},"ordinary","dry");
 if(!r.absolute_roof_elevations_feet||!r.floor_elevations_feet)
   throw Error("Transverse section lacks a common absolute z datum");
 const samples=[];
 for(let x=cut.x1;x<=cut.x2;x++){
  const p=key(x,cut.row),prior=key(x-1,cut.row);
  if(!owner.has(p)||!r.absolute_roof_elevations_feet.has(p))
   throw Error("Section would bridge an unoccupied rock cell at "+p);
  if(x>cut.x1&&!(graph.get(prior)||[]).includes(p))
   throw Error("Section would cross a blocked, stepped-without-access, or sealed edge "+prior+" -> "+p);
  const floor=r.floor_elevations_feet.get(p),crown=r.absolute_roof_elevations_feet.get(p);
  const clearance=crown-floor;
  if(!(clearance>=2.5))throw Error("Invalid floor-to-ceiling dimension at "+p);
  samples.push({cell:[x,cut.row],station_feet:(x-cut.x1)*HALF_CELL_FEET,
   floor_z_feet:floor,roof_z_feet:crown,local_clearance_feet:clearance,
   authored_vault_zone:(r.absolute_vault_zones||[]).find(z=>z.cells.includes(p))?.id||null});
 }
 const steps=[];
 for(let i=1;i<samples.length;i++){
  const a=samples[i-1],b=samples[i],k=edge(key(...a.cell),key(...b.cell));
  const rise=Math.abs(a.floor_z_feet-b.floor_z_feet),spec=terrain.steps.get(k);
  if(rise&&!spec)throw Error("Unexpected unmodeled sectional floor rise at "+k);
  if(spec){
   if(spec.rise_feet!==rise||spec.risers!==2)
    throw Error("Section crosses an inconsistent authored basalt step");
   steps.push({edge:[a.cell,b.cell],rise_feet:spec.rise_feet,risers:spec.risers});
  }
  if(Math.abs(a.roof_z_feet-b.roof_z_feet)>.5+1e-9)
   throw Error("Schematic section crosses roof discontinuity");
 }
 return {tile:tile.id,label:cut.label,cut:{axis:"west-east",row:cut.row,
   first_cell:[cut.x1,cut.row],last_cell:[cut.x2,cut.row]},
   actual_floor_cells:owner.size,sampled_cells:samples.length,
   horizontal_extent_feet:samples.length*HALF_CELL_FEET,
   physical_datum:"z=0 at each modular exterior floor",
   horizontal_and_vertical_pixels_per_foot:PIXELS_PER_FOOT,
   local_clearance_range_feet:[Math.min(...samples.map(s=>s.local_clearance_feet)),
    Math.max(...samples.map(s=>s.local_clearance_feet))],
   registered_steps:steps,samples,
   interpretation:"Fictional, actual-plan-cell registered vertical envelope. Lines between samples are schematic, not measured geology."};
}
function assessAll(tiles=source().tiles){
 const sections=cuts.map(c=>assessCut(c,tiles));
 if(sections.length!==3||sections.some(s=>s.sampled_cells<5))
   throw Error("Expected three distinct substantial plan transects");
 return {stage:"unreleased concept; not a surveyed cave, structural design, or finished geomorph",
  cell_width_feet:HALF_CELL_FEET,section_scale_pixels_per_foot:PIXELS_PER_FOOT,
  measurement_type:"exact plan-cell occupancy and authored fictional absolute floor/roof z values",
  sections,
  limitations:"No three-dimensional roof solid, load capacity, rock overburden, measured ceiling curvature, physical print inspection or tabletop playtest."};
}
function floorLine(samples,x0,baseline,pitch){
 const px=PIXELS_PER_FOOT,cmd=["M"+point(x0,baseline-samples[0].floor_z_feet*px)];
 for(let i=1;i<samples.length;i++){
  const a=samples[i-1],b=samples[i],start=x0+(i-1)*pitch,end=x0+i*pitch;
  const z0=a.floor_z_feet,z1=b.floor_z_feet;
  if(z0===z1){cmd.push("L"+point(end,baseline-z1*px));continue;}
  const first=start+pitch/3,second=start+pitch*2/3,mid=z0+(z1-z0)/2;
  cmd.push("L"+point(first,baseline-z0*px));
  cmd.push("L"+point(first,baseline-mid*px));
  cmd.push("L"+point(second,baseline-mid*px));
  cmd.push("L"+point(second,baseline-z1*px));
  cmd.push("L"+point(end,baseline-z1*px));
 }
 return cmd.join(" ");
}
function sectionSvg(report,tiles=source().tiles){
 const W=1320,H=1060,unit=PIXELS_PER_FOOT,pitch=unit*HALF_CELL_FEET;
 const rows=[
 '<svg xmlns="http://www.w3.org/2000/svg" width="16.5in" height="13.25in" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Registered plan and three independent volcanic cave transverse sections">',
 '<title>Wide volcanic caves / three plan-registered fictional transverse sections</title>',
 '<desc>Each cut samples actual contiguous occupied floor cells. Plan and section use different page zooms, while section horizontal and vertical axes share one scale.</desc>',
 '<rect width="'+W+'" height="'+H+'" fill="#f7f4eb"/>',
 '<text x="30" y="43" font-size="28" font-family="Georgia,serif" fill="#2b3c39">THREE VOLCANIC CAVES / SECTION REGISTER</text>',
 '<text x="31" y="69" font-size="13" font-family="sans-serif" fill="#596f64">Fictional roof elevations relative to an actual model datum; not surveyed or structurally tested</text>'
 ];
 for(let i=0;i<report.sections.length;i++){
  const s=report.sections[i],tile=tiles.find(t=>t.id===s.tile),owner=buildCells(tile);
  const left=30,top=93+i*311,planX=left+18,planY=top+50,planPitch=10;
  const originX=366,baseY=top+265,scaleX=pitch,crown=s.samples.map(p=>[originX+(p.cell[0]-s.cut.first_cell[0])*pitch,baseY-p.roof_z_feet*unit]);
  const lower=s.samples.map(p=>[originX+(p.cell[0]-s.cut.first_cell[0])*pitch,baseY-p.floor_z_feet*unit]);
  const xEnd=originX+(s.samples.length-1)*pitch;
  rows.push('<g id="section-'+s.tile+'" font-family="sans-serif">');
  rows.push('<rect x="'+left+'" y="'+top+'" width="'+(W-2*left)+'" height="302" fill="#fffdf8" stroke="#c1c9bc"/>');
  rows.push('<text x="'+(left+16)+'" y="'+(top+28)+'" font-family="Georgia,serif" font-size="18" fill="#34443c">'+escape(s.label)+'</text>');
  rows.push('<g id="plan-'+s.tile+'">');
  for(let y=0;y<20;y++)for(let x=0;x<20;x++){
   const occupied=owner.has(key(x,y)),cut=y===s.cut.row&&x>=s.cut.first_cell[0]&&x<=s.cut.last_cell[0];
   rows.push('<rect x="'+(planX+x*planPitch)+'" y="'+(planY+y*planPitch)+'" width="'+planPitch+'" height="'+planPitch+
    '" fill="'+(occupied?'#e2e6dc':'#4f5951')+'" stroke="#aeb9ae" stroke-width=".22"/>');
   if(cut)rows.push('<rect data-cut-cell="'+s.tile+':'+x+','+y+'" x="'+(planX+x*planPitch+1)+'" y="'+(planY+y*planPitch+1)+
    '" width="'+(planPitch-2)+'" height="'+(planPitch-2)+'" fill="#ae6147"/>');
  }
  rows.push('</g>');
  rows.push('<text x="'+planX+'" y="'+(planY+217)+'" font-size="11" fill="#53685e">Registered plan: tan = floor, dark = rock, red = sampled cut</text>');
  rows.push('<g id="profile-'+s.tile+'">');
  for(const z of [0,2,4,6,8,10]){
   const y=baseY-z*unit;
   rows.push('<path d="M'+(originX-24)+','+y+'H'+(xEnd+45)+'" stroke="#bec9be" stroke-width=".7" stroke-dasharray="2 5"/>',
    '<text x="'+(originX-29)+'" y="'+(y+4)+'" font-size="11" text-anchor="end" fill="#647b70">'+z+' ft</text>');
  }
  for(let j=0;j<s.samples.length;j++){
   const v=s.samples[j],x=originX+j*pitch;
   rows.push('<line data-profile-sample="'+s.tile+':'+v.cell.join(",")+'" x1="'+x+'" x2="'+x+
    '" y1="'+(baseY-v.floor_z_feet*unit)+'" y2="'+(baseY-v.roof_z_feet*unit)+
    '" stroke="#a3b9a9" stroke-width="1.2" stroke-dasharray="3 3"/>');
   rows.push('<text x="'+x+'" y="'+(baseY+20)+'" text-anchor="middle" font-size="10" fill="#455b50">'+v.cell.join(",")+'</text>');
   if(v.authored_vault_zone)rows.push('<circle data-authored-vault-sample="'+s.tile+':'+v.cell.join(",")+
    '" cx="'+x+'" cy="'+(baseY-v.roof_z_feet*unit)+'" r="4" fill="#597e74"/>');
  }
  const roofPath="M"+point(crown[0][0],crown[0][1])+" "+crown.slice(1).map(p=>"L"+point(...p)).join(" ");
  rows.push('<path data-section-floor="'+s.tile+'" d="'+floorLine(s.samples,originX,baseY,pitch)+
   '" fill="none" stroke="#5f4938" stroke-width="3" stroke-linecap="round" stroke-linejoin="bevel"/>');
  rows.push('<path data-section-roof="'+s.tile+'" d="'+roofPath+
    '" fill="none" stroke="#548478" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>');
  for(const stair of s.registered_steps){
   const [x,y]=stair.edge[1],mark=originX+(x-s.cut.first_cell[0]-.5)*pitch;
   rows.push('<path data-section-step="'+s.tile+'" d="M'+mark+','+(baseY+7)+'v7" stroke="#a05a45" stroke-width="2"/>');
  }
  rows.push('<text x="'+originX+'" y="'+(baseY+44)+'" font-size="11" fill="#60756a">'+
   s.horizontal_extent_feet+' feet of sampled real cave-floor plan / horizontal and vertical both '+unit+' pixels per foot</text>');
  rows.push('</g></g>');
 }
 rows.push('<text x="30" y="1041" font-family="sans-serif" font-size="12" fill="#895b44">SCHEMATIC ONLY. Roof segments interpolate cell samples; rock thickness, true ceiling curvature, and stability are not established.</text>');
 rows.push('</svg>');
 return rows.join("\n")+"\n";
}
function generate(reportFile=path.join(__dirname,"reports/wide-transverse-sections.json"),
 svgFile=path.join(__dirname,"studies/wide_transverse_sections.svg")){
 const result=assessAll();
 fs.mkdirSync(path.dirname(reportFile),{recursive:true});fs.mkdirSync(path.dirname(svgFile),{recursive:true});
 fs.writeFileSync(reportFile,JSON.stringify(result,null,2)+"\n");
 fs.writeFileSync(svgFile,sectionSvg(result));
 return result;
}
if(require.main===module)console.log(JSON.stringify(generate(),null,2));
module.exports={cuts,assessCut,assessAll,floorLine,sectionSvg,generate};
