"use strict";
// A registered *design sensitivity study*, not a physical survey. Existing
// terrain.elevations are unitless levels, NOT measured vertical feet.
// An absolute roof datum cannot be inferred from "headroom above local floor".
const fs=require("node:fs"),path=require("node:path");
const {source}=require("./wide-cave");
const {buildCells}=require("./assemble");
const {terrainModel}=require("./terrain");
const {roofModel}=require("./wide-headroom");
const CELL_FEET=2.5;
const CANDIDATE_RISES=Object.freeze([0.25,0.5,1,2]);
const DESIGN_GRADE_LIMIT_PERCENT=12.5; // comparison criterion, NOT a regulation
const pkey=p=>p.join(",");
const xy=s=>s.split(",").map(Number);
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
function assessBench(tile,rises=CANDIDATE_RISES){
 if(!tile||tile.id!=="sagging_sheet")throw Error("Bench study must register to Sagging Sheetflow");
 const floor=buildCells(tile),terrain=terrainModel(floor,tile.terrain||{});
 const roof=roofModel(floor,tile.roof_scenario,tile.seam_profile);
 const raised=[...terrain.heights].filter(([,z])=>z===1).map(([p])=>p).sort();
 if(raised.length!==8||terrain.heights.size!==8||terrain.ramps.size!==3)
   throw Error("Changed bench topology: expected eight raised cells and three transition edges");
 const transitions=[];
 for(const entry of tile.terrain.ramps){
   const [a,b]=entry.map(pkey),az=terrain.heights.get(a)||0,bz=terrain.heights.get(b)||0;
   if(!floor.has(a)||!floor.has(b)||Math.abs(az-bz)!==1||Math.abs(entry[0][0]-entry[1][0])+Math.abs(entry[0][1]-entry[1][1])!==1)
     throw Error("Unregistered grade transition");
   if(roof.clearances.get(a)!==roof.baseline_feet||roof.clearances.get(b)!==roof.baseline_feet)
     throw Error("A local low crown intersects a bench approach; section needs resurvey");
   transitions.push({from:entry[0],to:entry[1],from_level:az,to_level:bz,
     plan_run_feet:CELL_FEET,kind:"modeled walking connection; physical construction unresolved"});
 }
 if(!Array.isArray(rises)||!rises.length||rises.some(n=>!Number.isFinite(n)||n<=0||n>=roof.baseline_feet))
   throw Error("Candidate bench rises must be positive finite feet below the assumed crown");
 if(raised.some(p=>!roof.clearances.has(p)||roof.clearances.get(p)!==roof.baseline_feet))
   throw Error("Raised bench intersects an authored roof constriction");
 const candidates=rises.map(rise=>{
   const grade=100*rise/CELL_FEET;
   return {hypothetical_bench_rise_feet:rise,
    grade_per_single_2_5ft_transition_percent:Number(grade.toFixed(2)),
    grade_exceeds_study_limit:grade>DESIGN_GRADE_LIMIT_PERCENT,
    implied_raised_floor_headroom_feet_if_roof_crown_stays_fixed:Number((roof.baseline_feet-rise).toFixed(2)),
    standing_six_foot_passage_if_roof_crown_stays_fixed:roof.baseline_feet-rise>=6,
    interpretation:grade>DESIGN_GRADE_LIMIT_PERCENT?
      "Single-edge walking ramp fails chosen grade criterion; redesign as longer approach, steps, or separately modeled scramble.":
      "Single-edge grade meets comparison criterion; actual roughness and construction are still unknown."};
 });
 return {tile:tile.id,status:"unreleased schematic vertical-datum sensitivity study",
  basis:"Eight genuine raised plan cells and three actual terrain ramp edges",
  datum:"Adjacent ordinary-floor surface z=0 ft for this study only; actual level-one rise and absolute roof elevation unknown",
  existing_roof_assumption:"6.5 ft above LOCAL floor, not a surveyed absolute ceiling",
  alternative_fixed_roof_hypothesis:"ONLY for comparing candidates: hold roof at z=6.5 ft above ordinary floor across the bench. This is not encoded in the master and not asserted as geological fact.",
  baseline_local_clearance_feet:roof.baseline_feet,
  half_cell_plan_feet:CELL_FEET,design_comparison_grade_limit_percent:DESIGN_GRADE_LIMIT_PERCENT,
  raised_floor_cells:raised.map(xy),grade_edges:transitions,candidates,
  recommended_action:"Do not represent a 1-2 ft bench rise as three effortless 2.5 ft ramps. Re-author longer landings, stairs, or explicit scrambles after a coherent vault and floor datum is selected.",
  no_structural_claim:"No surveyed height, roof thickness, bearing capacity, regulatory access grade or tested construction."};
}
function plate(r){
 const out=[
 '<svg xmlns="http://www.w3.org/2000/svg" width="16in" height="10in" viewBox="0 0 1440 900" role="img" aria-label="Actual plan registered Sagging Sheetflow bench with four hypothetical grade and headroom options">',
 '<title>Sagging Sheetflow | raised bench vertical-datum design review, not a measured cave</title>',
 '<rect width="1440" height="900" fill="#eeeae0"/>',
 '<text x="34" y="56" fill="#23382f" font-family="Georgia,serif" font-size="32">SAGGING SHEETFLOW / BENCH GRADE</text>',
 '<text x="35" y="80" fill="#58685c" font-family="sans-serif" font-size="13">REGISTERED FLOOR PLAN   ·   FOUR VERTICAL SCENARIOS   ·   UNSURVEYED DESIGN STUDY</text>',
 '<g id="registered-plan" transform="translate(34 120)">',
 '<rect width="565" height="575" fill="#fbfaf6" stroke="#b7bdb4"/>',
 '<text x="18" y="28" font-family="Georgia,serif" fill="#28382f" font-size="18">01 / ACTUAL BENCH AND THREE APPROACHES</text>'
 ];
 const tile=source().tiles.find(t=>t.id===r.tile),floor=buildCells(tile);
 const scale=24,x0=43,y0=61,raised=new Set(r.raised_floor_cells.map(pkey));
 out.push('<g id="canonical-floor" fill="#d4ded5" stroke="#f4f1e9" stroke-width=".7">');
 for(const p of [...floor.keys()].sort()){
  const [x,y]=xy(p);out.push('<rect data-plan-cell="'+p+'" x="'+(x0+x*scale)+'" y="'+(y0+y*scale)+'" width="'+scale+'" height="'+scale+'"/>');
 }
 out.push('</g>','<g id="raised-bench" fill="#a58b6b" stroke="#f9f6ef" stroke-width="1">');
 for(const p of [...raised].sort()){const [x,y]=xy(p);out.push('<rect data-bench-cell="'+p+'" x="'+(x0+x*scale)+'" y="'+(y0+y*scale)+'" width="'+scale+'" height="'+scale+'"/>')}
 out.push('</g>','<g id="registered-grade-edges" fill="none" stroke="#a55231" stroke-width="4">');
 for(const [i,t] of r.grade_edges.entries()){
  const [ax,ay]=t.from,[bx,by]=t.to,cx=(ax+bx+1)*scale/2+x0,cy=(ay+by+1)*scale/2+y0;
  out.push('<circle data-transition="'+(i+1)+'" cx="'+cx+'" cy="'+cy+'" r="7" fill="#f6eee0" stroke="#a55231"/>');
 }
 out.push('</g>','<text x="18" y="561" fill="#5d665c" font-family="sans-serif" font-size="11">5 ft mouth widths remain untouched. Brown: original level-one bench; circles: real access edges.</text>','</g>');
 out.push('<g id="candidate-profiles" font-family="sans-serif">');
 for(let i=0;i<r.candidates.length;i++){
  const c=r.candidates[i],col=i%2,row=Math.floor(i/2),x=620+col*399,y=120+row*285,base=195;
  const rise=c.hypothetical_bench_rise_feet,scaleZ=30;
  out.push('<g id="candidate-'+i+'" transform="translate('+x+' '+y+')">');
  out.push('<rect width="382" height="265" fill="#fbfaf6" stroke="#b7bdb4"/>');
  out.push('<text x="16" y="30" font-family="Georgia,serif" font-size="17" fill="#293a31">'+(i+1)+' / RISE '+rise+' FT</text>');
  out.push('<text x="16" y="49" font-size="11" fill="#617167">Fixed-roof comparison only; vertical &amp; horizontal scale 30 px/ft</text>');
  const roofY=base-r.baseline_local_clearance_feet*scaleZ;
  out.push('<path d="M65,'+roofY+'H329" stroke="#7c6650" stroke-width="2.5" stroke-dasharray="6 4"/>');
  out.push('<path d="M65,'+base+'H115L'+(115+2.5*scaleZ)+','+(base-rise*scaleZ)+'H329" fill="none" stroke="#344b3f" stroke-width="3.5"/>');
  out.push('<path d="M115,'+(base+8)+'v11h'+(2.5*scaleZ)+'v-11" fill="none" stroke="#a35332"/>');
  out.push('<text x="152.5" y="'+(base+34)+'" font-size="12" text-anchor="middle" fill="#a35332">2.5 ft run</text>');
  out.push('<text x="16" y="235" fill="'+(c.grade_exceeds_study_limit?"#a04c31":"#355b45")+'" font-size="13" font-weight="bold">'+c.grade_per_single_2_5ft_transition_percent+'% GRADE'+(c.grade_exceeds_study_limit?" / RECOMPOSE APPROACH":" / DESIGN LIMIT MET")+'</text>');
  out.push('<text x="16" y="254" fill="#4b6257" font-size="11">If roof fixed: '+c.implied_raised_floor_headroom_feet_if_roof_crown_stays_fixed+' ft over bench floor</text>');
  out.push('</g>');
 }
 out.push('</g>','<path d="M34 719H1403" stroke="#adb5aa"/>',
 '<text x="34" y="749" font-family="Georgia,serif" fill="#293a31" font-size="19">REVIEW: THE MODEL DOES NOT YET DEFINE A PHYSICAL BENCH HEIGHT</text>',
 '<text x="34" y="778" font-family="sans-serif" fill="#5b655d" font-size="14">A 1–2 ft rise over one 2.5 ft transition implies 40–80% grade. The current three "ramps" are only topological links.</text>',
 '<text x="34" y="802" font-family="sans-serif" fill="#5b655d" font-size="14">A uniform roof height ABOVE THE LOCAL FLOOR cannot be silently recast as a shared roof elevation.</text>',
 '<text x="34" y="839" font-family="sans-serif" fill="#835c45" font-size="12">This plate compares invented scenarios; not a cave survey, accessible-route certification, or stability calculation.</text>',
 '</svg>');
 return out.join("\n")+"\n";
}
function generate(reportPath=path.join(__dirname,"reports/sheetflow-bench-grade.json"),svgPath=path.join(__dirname,"studies/sheetflow_bench_grade.svg")){
 const tile=source().tiles.find(t=>t.id==="sagging_sheet"),report=assessBench(tile);
 fs.mkdirSync(path.dirname(reportPath),{recursive:true});fs.mkdirSync(path.dirname(svgPath),{recursive:true});
 fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+"\n");fs.writeFileSync(svgPath,plate(report));
 return report;
}
if(require.main===module)console.log(JSON.stringify(generate(process.argv[2]||undefined,process.argv[3]||undefined),null,2));
module.exports={CELL_FEET,CANDIDATE_RISES,DESIGN_GRADE_LIMIT_PERCENT,assessBench,plate,generate};
