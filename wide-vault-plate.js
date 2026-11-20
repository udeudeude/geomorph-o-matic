"use strict";
// Reconstruct the fictional Sagging Sheetflow floor and roof using the same
// absolute z datum. Profiles trace real traversable terrain edges, not straight cuts.
const fs=require("node:fs"),path=require("node:path");
const {source}=require("./wide-cave");
const {buildCells}=require("./assemble");
const {doorEdges}=require("./audit");
const {terrainGraph}=require("./terrain");
const {roofModel,headroomGraph,POSTURES}=require("./wide-headroom");
const {distances}=require("./route-analysis");
const {walkTo}=require("./wide-absolute-bench");
const key=p=>p.join(",");
const xy=s=>s.split(",").map(Number);
function assess(tile){
 if(tile.id!=="sagging_sheet")throw Error("Vault plate registered to Sagging Sheetflow only");
 const floor=buildCells(tile),roof=roofModel(floor,tile.roof_scenario,tile.seam_profile,tile.terrain);
 const graph=terrainGraph(floor,doorEdges(tile),tile.terrain,"ordinary","dry");
 const steps=tile.terrain.steps.map((s,i)=>{
  const [a,b]=s.edge.map(key),upper=roof.floor_elevations_feet.get(a)===1?a:b;
  const lower=upper===a?b:a;
  if(roof.floor_elevations_feet.get(lower)!==0||!graph.get(lower).includes(upper))
   throw Error("Not a registered traversable basalt stair");
  const route=walkTo(graph,"4,0",lower),points=route.slice(-4).concat(upper);
  const further=(graph.get(upper)||[]).filter(p=>p!==lower&&roof.floor_elevations_feet.get(p)===1).sort()[0];
  if(further)points.push(further);
  return {id:"stair_"+(i+1),approach_length_feet:(route.length-1)*2.5,
   lower_cell:xy(lower),upper_cell:xy(upper),
   samples:points.map((p,j)=>({cell:xy(p),distance_feet:j*2.5,
    floor_z_feet:roof.floor_elevations_feet.get(p),
    roof_z_feet:roof.absolute_roof_elevations_feet.get(p),
    local_clearance_feet:roof.clearances.get(p)}))};
 });
 const standing=headroomGraph(graph,roof,POSTURES.standing);
 const crouch=headroomGraph(graph,roof,POSTURES.crouching);
 const absCounts={};
 for(const z of roof.absolute_roof_elevations_feet.values())absCounts[z]=(absCounts[z]||0)+1;
 const bench=roof.elevated_bench_cells.map(p=>({cell:xy(p),
  floor_z_feet:roof.floor_elevations_feet.get(p),
  roof_z_feet:roof.absolute_roof_elevations_feet.get(p),
  clear_feet:roof.clearances.get(p)})).sort((a,b)=>a.cell[1]-b.cell[1]||a.cell[0]-b.cell[0]);
 if(bench.length!==8||steps.length!==3||distances(standing,"4,0").size<200||
    distances(crouch,"4,0").size!==floor.size)
  throw Error("Authoring damaged Sheetflow's verified bench routes");
 return {tile:tile.id,status:"unreleased hypothetical canonical vault, not a measured cave",
  datum:"z=0 at all five-foot modular mouths; bench floor z=+1 ft",
  floor_count:floor.size,bench,roof_crown_histogram_feet:absCounts,
  accessible_from_north:{standing:distances(standing,"4,0").size,
   crouching:distances(crouch,"4,0").size,crawling:floor.size},
  sections:steps,
  limitations:"Plan-registered invented elevation model; no load, roof thickness, survey-grade cross-section, physical print review or playtest."};
}
function plate(r){
 const tile=source().tiles.find(t=>t.id===r.tile),owner=buildCells(tile);
 const roof=roofModel(owner,tile.roof_scenario,tile.seam_profile,tile.terrain);
 const X=42,Y=126,P=22,svg=[
 '<svg xmlns="http://www.w3.org/2000/svg" width="16in" height="9.5in" viewBox="0 0 1280 760" role="img" aria-label="Registered plan and three unfolded stair-to-vault roof profiles of Sagging Sheetflow">',
 '<title>Sagging Sheetflow / authored absolute roof envelope and three navigable stair profiles</title>',
 '<rect x="0" y="0" width="1280" height="760" fill="#f9f6ee"/>',
 '<text x="40" y="45" font-size="25" font-family="serif" fill="#263e3a">SAGGING SHEETFLOW / ABSOLUTE VAULT DATUM</text>',
 '<text x="40" y="72" font-size="13" font-family="sans-serif" fill="#63736b">Hypothetical volcanic architecture, not survey, structural design, or completed playable map</text>',
 '<g id="registered-plan" font-family="sans-serif"><text x="42" y="105" font-size="15">CANONICAL PLAN / actual occupied cells and authored overhead bands</text>'
 ];
 for(const p of owner.keys()){
  const [x,y]=xy(p),z=roof.absolute_roof_elevations_feet.get(p),f=roof.floor_elevations_feet.get(p),h=roof.clearances.get(p);
  const fill=f===1?"#c8b393":z===7.5?"#b0c9b7":z===7?"#d4e1cc":"#eee9df";
  svg.push('<rect data-plan-cell="'+p+'" x="'+(X+x*P)+'" y="'+(Y+y*P)+'" width="'+P+'" height="'+P+'" fill="'+fill+'" stroke="#65736d" stroke-width=".35"/>');
  if(z>6.5)svg.push('<circle data-absolute-vault="'+p+'" cx="'+(X+(x+.5)*P)+'" cy="'+(Y+(y+.5)*P)+'" r="4" fill="none" stroke="#37645a" stroke-width="1"/>');
  if(h<6&&f===1)svg.push('<path data-stooped-bench="'+p+'" d="M'+(X+(x+.3)*P)+','+(Y+(y+.33)*P)+'l'+(.4*P)+','+(.36*P)+'m0,-'+(.36*P)+'l-'+(.4*P)+','+(.36*P)+'" fill="none" stroke="#a64f40" stroke-width="2"/>');
 }
 for(const s of r.sections){const [x,y]=s.upper_cell;
  svg.push('<circle data-plan-stair="'+s.id+'" cx="'+(X+(x+.5)*P)+'" cy="'+(Y+(y+.5)*P)+'" r="7" fill="none" stroke="#a44c39" stroke-width="2"/>');
 }
 svg.push('</g>',
 '<text x="42" y="601" font-family="sans-serif" font-size="12">Green rings: raised roof crown (7 or 7.5 ft).</text>',
 '<text x="42" y="619" font-family="sans-serif" font-size="12">Tan: elevated floor (+1 ft); red: low standing clearance.</text>',
 '<text x="42" y="643" font-family="sans-serif" font-size="12">North entrance / all seams: floor z=0, roof z=6.5 ft.</text>',
 '<g id="real-stair-profiles" font-family="sans-serif">');
 for(let index=0;index<r.sections.length;index++){
  const s=r.sections[index],left=590,baseline=250+index*205,unit=22,stepX=55;
  svg.push('<text x="'+left+'" y="'+(baseline-160)+'" font-size="15">STAIR '+(index+1)+' / route from north: '+s.approach_length_feet+' ft to lower tread</text>');
  const contour=(property)=>s.samples.map((p,j)=>(j?"L":"M")+(left+40+j*stepX)+","+(baseline-p[property]*unit)).join(" ");
  svg.push('<path data-floor-profile="'+s.id+'" d="'+contour("floor_z_feet")+'" fill="none" stroke="#855f40" stroke-width="3"/>',
  '<path data-roof-profile="'+s.id+'" d="'+contour("roof_z_feet")+'" fill="none" stroke="#477b70" stroke-width="3"/>');
  for(let j=0;j<s.samples.length;j++){
   const p=s.samples[j],x=left+40+j*stepX;
   svg.push('<line x1="'+x+'" y1="'+(baseline-p.floor_z_feet*unit)+'" x2="'+x+'" y2="'+(baseline-p.roof_z_feet*unit)+'" stroke="#b5b4a9" stroke-dasharray="2 4"/>',
    '<text x="'+x+'" y="'+(baseline+18)+'" text-anchor="middle" font-size="10">'+p.cell.join(",")+'</text>');
  }
  svg.push('<text x="'+left+'" y="'+(baseline+38)+'" font-size="11">Unfolded along actual walk; horizontal and vertical both 22 px per ft</text>');
 }
 svg.push('</g>','<text x="44" y="711" font-family="sans-serif" font-size="12">Design hypothesis from authored volcanic plan. Roof contours do not establish bearing rock thickness or safe passage.</text>','</svg>');
 return svg.join("\n")+"\n";
}
function generate(reportPath=path.join(__dirname,"reports/sheetflow-authored-vault.json"),
 svgPath=path.join(__dirname,"studies/sheetflow_authored_vault.svg")){
 const r=assess(source().tiles.find(t=>t.id==="sagging_sheet"));
 fs.writeFileSync(reportPath,JSON.stringify(r,null,2)+"\n");
 fs.writeFileSync(svgPath,plate(r));
 return r;
}
if(require.main===module)console.log(JSON.stringify(generate(),null,2));
module.exports={assess,plate,generate};
