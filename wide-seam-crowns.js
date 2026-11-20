"use strict";
// A deliberately bounded vertical interface contract. It checks only the
// five-foot mouth and five-foot inward throat, not whole-cavern roof stability.
const fs=require("node:fs"),path=require("node:path");
const {buildCells,rotateCell,verifyLayout}=require("./assemble");
const {terrainModel}=require("./terrain");
const {roofModel}=require("./wide-headroom");
const {source}=require("./wide-cave");
const SIZE=20,OFFSETS=[4,5,14,15],DEPTHS=[0,1];
const key=(x,y)=>x+","+y;
const xy=p=>p.split(",").map(Number);
function inspectCrowns(layout,data=source()){
 const rows=verifyLayout(layout,data),height=rows.length,width=rows[0].length;
 const floor=new Map(),roof=new Map(),kind=new Map();
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const tile=rows[y][x],owner=buildCells(tile.tile);
  const localTerrain=terrainModel(owner,tile.tile.terrain||{});
  const localRoof=roofModel(owner,tile.tile.roof_scenario,tile.tile.seam_profile);
  for(const p of owner.keys()){
   const [a,b]=rotateCell(xy(p),tile.turn),q=key(x*SIZE+a,y*SIZE+b);
   if(floor.has(q))throw Error("Overlapping wide cave floor");
   // Level indices are not treated as vertical feet in the interior.
   floor.set(q,localTerrain.heights.get(p)||0);
   roof.set(q,localRoof.clearances.get(p));
   kind.set(q,tile.id);
  }
 }
 const edges=[],mouths=[];
 const pair=(a,b,tag,depth)=>{
  if(!floor.has(a)||!floor.has(b))throw Error("Incomplete wide mouth at "+tag);
  if(floor.get(a)!==0||floor.get(b)!==0)throw Error("Vertical seam floor datum mismatch at "+tag);
  if(roof.get(a)!==roof.get(b)||roof.get(a)<6)
   throw Error("Vertical seam crown mismatch at "+tag+": "+roof.get(a)+" vs "+roof.get(b));
  edges.push({a,b,depth_half_cells:depth,crown_feet:roof.get(a),lower_floor_datum_feet:0,tile_a:kind.get(a),tile_b:kind.get(b),seam:tag});
 };
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  if(x<width-1)for(const n of OFFSETS)for(const d of DEPTHS)
   pair(key((x+1)*SIZE-1-d,y*SIZE+n),key((x+1)*SIZE+d,y*SIZE+n),"vertical-"+x+"-"+y,d);
  if(y<height-1)for(const n of OFFSETS)for(const d of DEPTHS)
   pair(key(x*SIZE+n,(y+1)*SIZE-1-d),key(x*SIZE+n,(y+1)*SIZE+d),"horizontal-"+x+"-"+y,d);
 }
 // The outward-facing mouths also need the exact same roof/floor datum.
 for(let x=0;x<width;x++)for(const n of OFFSETS)for(const d of DEPTHS){
  mouths.push(key(x*SIZE+n,d),key(x*SIZE+n,height*SIZE-1-d));
 }
 for(let y=0;y<height;y++)for(const n of OFFSETS)for(const d of DEPTHS){
  mouths.push(key(d,y*SIZE+n),key(width*SIZE-1-d,y*SIZE+n));
 }
 for(const p of mouths){
  if(!floor.has(p)||floor.get(p)!==0||roof.get(p)!==6.5)
   throw Error("Exterior wide mouth has incompatible crown or floor datum: "+p);
 }
 const tags=[...new Set(edges.map(e=>e.seam))];
 if(!tags.length)throw Error("Need at least two wide cave tiles to verify a physical seam");
 if(edges.length!==tags.length*OFFSETS.length*DEPTHS.length)
  throw Error("Not every wide entrance maintains the full five-foot inward throat");
 return {
  stage:"unreleased hypothetical vertical interface, not a geotechnical roof guarantee",
  layout:layout.title||"Wide-mouthed cave assembly",tiles:width*height,
  checked_intertile_seams:tags.length,checked_crown_pairs:edges.length,
  checked_exterior_throat_cells:mouths.length,
  canonical_floor_datum_feet:0,common_mouth_crown_feet:6.5,
  mouth_clear_width_feet:5,inward_envelope_depth_feet:5,
  seams:tags.map(tag=>({id:tag,checked_pairs:edges.filter(e=>e.seam===tag).length,
    crown_feet:edges.find(e=>e.seam===tag).crown_feet})),
  physical_limitations:"Verifies the fictional shared datum at 2x2 floor cells per mouth and 5 ft inward. No roof thickness, support, gradients away from the seam, geology, legal headroom, or physical inspection is established."
 };
}
function generate(file=path.join(__dirname,"reports/wide-seam-crowns.json")){
 const layout=JSON.parse(fs.readFileSync(path.join(__dirname,"studies/assembly_three_wide_2x2.json"),"utf8"));
 const report=inspectCrowns(layout);
 fs.mkdirSync(path.dirname(file),{recursive:true});
 fs.writeFileSync(file,JSON.stringify(report,null,2)+"\n");
 return report;
}
if(require.main===module)console.log(JSON.stringify(generate(process.argv[2]||undefined),null,2));
module.exports={inspectCrowns,generate};
