"use strict";
// Orthogonal transverse passage sections: horizontal width is derived from
// authored floor cells, vertical heights are explicitly fictional design inputs.
// A plan measured width and an assumed roof do not constitute a cave survey.
const fs=require("node:fs"),path=require("node:path");
const {buildCells}=require("./assemble");
const {crossSection}=require("./cave-passage-widths");
const HALF_CELL_FEET=2.5,PIXELS_PER_FOOT=22;
const CUTS=Object.freeze([
 {tile:"scoured_siphon",id:"relict_upstream",at:[8,3],across:"E-W",
  from:[7,3],to:[9,3],heights_ft:[5,9,7],geology:"relict solution conduit; broad upper pocket"},
 {tile:"scoured_siphon",id:"relict_downstream",at:[8,4],across:"E-W",
  from:[8,4],to:[9,4],heights_ft:[6.5,8],geology:"narrower surviving dry keyhole"},
 {tile:"basalt_rift",id:"basalt_upper_squeeze",at:[8,8],across:"N-S",
  from:[8,8],to:[8,8],heights_ft:[4.5],geology:"constricted volcanic distributary, not the main tube"},
 {tile:"lantern_sink",id:"north_joint_splay",at:[6,4],across:"E-W",
  from:[6,4],to:[7,4],heights_ft:[6,8],geology:"bedding and joint-controlled solution passage"}
]);
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,'&quot;');
const key=p=>p.join(",");
const same=(a,b)=>key(a)===key(b);
function section(tile,cut){
 if(tile.id!==cut.tile||tile.wall_style!=="cavern")throw Error("Section is registered to a different natural-cave plan");
 const width=crossSection(buildCells(tile),cut);
 if(!same(width.from,cut.from)||!same(width.to,cut.to))
  throw Error("Section no longer aligns with actual authored plan floor: "+cut.id);
 const heights=cut.heights_ft;
 if(!Array.isArray(heights)||heights.length!==width.clear_half_cells||
    heights.some(h=>typeof h!=="number"||!Number.isFinite(h)||h<2||h>25))
  throw Error("Invalid fictional roof heights or changed passage width: "+cut.id);
 const atIndex=cut.across==="E-W"?cut.at[0]-width.from[0]:cut.at[1]-width.from[1];
 const centerHeight=heights[atIndex];
 const minimum=Math.min(...heights),maximum=Math.max(...heights);
 return {tile:tile.id,id:cut.id,section_at:cut.at,across:cut.across,
  from:width.from,to:width.to,width_feet:width.clear_feet,roof_height_over_floor_feet:[...heights],
  sampled_axis_headroom_feet:centerHeight,minimum_edge_sample_headroom_feet:minimum,
  maximum_sample_headroom_feet:maximum,
  example_central_posture:centerHeight>=6?"standing design allowance":centerHeight>=4?"crouching design allowance":"crawl design allowance",
  geological_intent:cut.geology,
  height_evidence:"hypothetical authored section; not measured; roof strength and continuity unknown"};
}
function report(data){
 const index=new Map(data.tiles.map(t=>[t.id,t]));
 const sections=CUTS.map(c=>{if(!index.has(c.tile))throw Error("Missing cave "+c.tile);return section(index.get(c.tile),c)});
 return {units:"feet",scale_note:"2.5 feet per plan half-cell; transverse diagrams use equal horizontal and vertical scale",
  design_only:"Headroom values are explicit fictional assumptions, not measured cave data, human safety ratings or evidence of roof stability",
  sections};
}
const f=n=>Number(n.toFixed(2));
function sectionPanel(s,index){
 const x=34+(index%2)*635,y=124+Math.floor(index/2)*318,W=607,H=286;
 const step=HALF_CELL_FEET*PIXELS_PER_FOOT,roof=s.roof_height_over_floor_feet;
 const wide=roof.length*step,x0=62+(430-wide)/2,base=217;
 const points=[["M",x0,base-roof[0]*PIXELS_PER_FOOT*.65]];
 for(let i=0;i<roof.length;i++){
  const mid=x0+(i+.5)*step;
  points.push(["Q",x0+i*step+step*.15,base-roof[i]*PIXELS_PER_FOOT,
                  mid,base-roof[i]*PIXELS_PER_FOOT]);
  if(i+1<roof.length)points.push(["Q",x0+(i+.82)*step,base-roof[i]*PIXELS_PER_FOOT,
     x0+(i+1)*step,base-(roof[i]+roof[i+1])/2*PIXELS_PER_FOOT]);
 }
 points.push(["L",x0+wide,base-roof[roof.length-1]*PIXELS_PER_FOOT*.65]);
 const roofPath=points.map(p=>p.map((v,i)=>i===0?v:f(v)).join(" ")).join(" ");
 const arches=roofPath+" L "+f(x0+wide)+" "+base+" L "+f(x0)+" "+base+" Z";
 const out=[
 '<g id="transverse-'+esc(s.id)+'" transform="translate('+x+' '+y+')" font-family="sans-serif">',
 '<rect width="'+W+'" height="'+H+'" fill="#f9f6ee" stroke="#abb2a8"/>',
 '<text x="18" y="28" font-size="15" font-family="Georgia,serif" fill="#29352f" font-weight="bold">'+esc(s.tile.replaceAll("_"," ").toUpperCase())+'  /  '+esc(s.id.replaceAll("_"," ").toUpperCase())+'</text>',
 '<text x="18" y="45" font-size="10.5" fill="#5c6b60">'+esc(s.geological_intent)+'</text>',
 '<path d="'+arches+'" fill="#e9ede5" stroke="none"/>',
 '<path d="'+roofPath+'" fill="none" stroke="#526259" stroke-dasharray="5 3" stroke-width="2.2"/>',
 '<path d="M'+x0+','+base+'H'+f(x0+wide)+'" stroke="#303c36" stroke-width="2.5"/>',
 '<path d="M'+x0+','+f(base-5*PIXELS_PER_FOOT)+'v'+f(5*PIXELS_PER_FOOT)+'m-5,-'+f(5*PIXELS_PER_FOOT)+'h10 m-10,'+f(5*PIXELS_PER_FOOT)+'h10" stroke="#a4583c" stroke-width="1.1" fill="none"/>',
 '<text x="'+f(x0-9)+'" y="'+f(base-2.5*PIXELS_PER_FOOT)+'" font-size="10" text-anchor="end" fill="#a4583c">5 ft</text>',
 '<path d="M'+x0+','+(base+9)+'v8H'+f(x0+wide)+'v-8" fill="none" stroke="#53635a"/>',
 '<text x="'+f(x0+wide/2)+'" y="'+(base+31)+'" text-anchor="middle" fill="#273a30" font-size="12" font-weight="bold">'+s.width_feet+' ft clear in plan</text>',
 '<text x="18" y="271" font-size="10.5" fill="#7a5140">Dashed roof = unverified scenario; 1:1 vertical/horizontal within panel.</text>'
 ];
 // Each plan-cell column has a genuine width of 2.5 feet.
 for(let i=0;i<roof.length;i++){
  const xx=x0+i*step;
  out.push('<path data-plan-cell="'+i+'" d="M'+f(xx)+','+base+'v-6" stroke="#737d70"/>');
  out.push('<text x="'+f(xx+step/2)+'" y="'+(base+47)+'" font-size="9.5" text-anchor="middle" fill="#626d63">'+roof[i]+' ft roof</text>');
 }
 out.push('</g>');return out.join("\n");
}
function plate(data){
 const r=report(data);
 return [
 '<svg xmlns="http://www.w3.org/2000/svg" width="16in" height="10in" viewBox="0 0 1300 800" role="img" aria-label="Four plan-registered cave passage transverse design sections">',
 '<title>Four fictional cave passage envelopes | plan-registered transverse studies</title>',
 '<rect width="1300" height="800" fill="#ece9df"/>',
 '<text x="34" y="52" font-family="Georgia,serif" font-size="32" fill="#2b3830">CAVE PASSAGE ENVELOPES</text>',
 '<text x="35" y="75" font-family="sans-serif" font-size="13" fill="#56635a" letter-spacing="1.2">AUTHOR-SPECIFIED ROOF SCENARIOS  /  WIDTHS REGISTERED TO CANONICAL FLOOR PLANS</text>',
 '<path d="M34 92H1265 M34 768H1265" stroke="#abb3aa"/>',
 ...r.sections.map(sectionPanel),
 '<text x="35" y="781" font-family="sans-serif" font-size="10.5" fill="#65594d">Not a cave survey. Floor widths are derived from actual map cells; ceiling assumptions need measured evidence.</text>',
 '</svg>\n'].join("\n");
}
if(require.main===module){
 const data=JSON.parse(fs.readFileSync(path.join(__dirname,"blueprints.json"),"utf8"));
 const reportPath=path.resolve(process.argv[2]||path.join(__dirname,"reports/cave-section-envelopes.json"));
 const platePath=path.resolve(process.argv[3]||path.join(__dirname,"examples/cave_section_envelopes.svg"));
 fs.mkdirSync(path.dirname(reportPath),{recursive:true});fs.mkdirSync(path.dirname(platePath),{recursive:true});
 fs.writeFileSync(reportPath,JSON.stringify(report(data),null,2)+"\n");
 fs.writeFileSync(platePath,plate(data));
 console.log("Wrote "+reportPath+" and "+platePath);
}
module.exports={CUTS,HALF_CELL_FEET,PIXELS_PER_FOOT,section,report,sectionPanel,plate};
