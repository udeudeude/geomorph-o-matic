"use strict";
// Plan clearances are measured from authored walkable cells, not inferred from
// decorative contour offsets. This is fictional plan geometry, NOT a cave survey.
const fs=require("node:fs"),path=require("node:path");
const {buildCells,edgeMask}=require("./assemble");
const HALF_CELL_FEET=2.5;
const CUTS={
 hollow_causeway:[
  {id:"eastern_limestone_squeeze",at:[14,10],across:"E-W"},
  {id:"eastern_joint_return",at:[13,11],across:"E-W"}
 ],
 basalt_rift:[
  {id:"western_roof_rib",at:[8,8],across:"N-S"},
  {id:"eastern_roof_rib",at:[13,8],across:"N-S"},
  {id:"southern_spur_bypass",at:[7,18],across:"N-S"}
 ],
 lantern_sink:[
  {id:"north_joint_splay",at:[6,4],across:"E-W"},
  {id:"east_bedding_eddy",at:[16,7],across:"N-S"},
  {id:"south_scree_refuge",at:[7,17],across:"E-W"}
 ],
 scoured_siphon:[
  {id:"upstream_relict_tube",at:[8,3],across:"E-W"},
  {id:"downstream_relict_tube",at:[8,4],across:"E-W"},
  {id:"southern_undercut",at:[9,13],across:"N-S"},
  {id:"eastern_backwater",at:[17,9],across:"E-W"}
 ]
};
const key=(x,y)=>x+","+y;
function crossSection(owner,{id,at,across}){
 if(!Array.isArray(at)||at.length!==2||at.some(v=>!Number.isInteger(v))||
    !["E-W","N-S"].includes(across))throw Error("Invalid plan cross-section");
 const [x,y]=at;
 if(owner.get(key(x,y))!=="hall")throw Error("Cross-section must start on passage floor: "+id);
 const [dx,dy]=across==="E-W"?[1,0]:[0,1];
 const side=sign=>{let count=0;for(let n=1;n<=20;n++){
  if(owner.get(key(x+sign*dx*n,y+sign*dy*n))!=="hall")break;
  count++;
 }return count};
 const left=side(-1),right=side(1),start=[x-left*dx,y-left*dy],end=[x+right*dx,y+right*dy];
 return {id,at,across,from:start,to:end,clear_half_cells:1+left+right,
  clear_feet:(1+left+right)*HALF_CELL_FEET};
}
function auditCavePassages(tile){
 if(tile.wall_style!=="cavern")throw Error("Only natural-cave plans have these sections");
 const owner=buildCells(tile);
 const expected="4,15";
 for(let turn=0;turn<4;turn++)for(const side of["N","E","S","W"])
  if(edgeMask(tile,turn,side)!==expected)throw Error("Changed modular edge standard "+tile.id);
 const sections=(CUTS[tile.id]||[]).map(cut=>crossSection(owner,cut));
 const corridors=[...owner.values()].filter(v=>v==="hall").length;
 return {id:tile.id,interpretation:"fictional floor-plan clearance; no measured ceiling, wall thickness or survey grade",
  standard_seam_throat_feet:HALF_CELL_FEET,walkable_passage_cells:corridors,
  measured_sections:sections};
}
function report(data){
 return {units:"feet",coordinate_units:"2.5-foot floor-plan half-cells",
  scope:"Illustrative widths, not instrument-surveyed passage cross-sections",
  cave_tiles:data.tiles.filter(t=>t.wall_style==="cavern").map(auditCavePassages)};
}
if(require.main===module){
 const data=JSON.parse(fs.readFileSync(path.join(__dirname,"blueprints.json"),"utf8"));
 const filename=path.resolve(process.argv[2]||path.join(__dirname,"reports/cave-passage-widths.json"));
 fs.mkdirSync(path.dirname(filename),{recursive:true});
 fs.writeFileSync(filename,JSON.stringify(report(data),null,2)+"\n");
 console.log("Plan-only passage clearances written to "+filename);
}
module.exports={crossSection,auditCavePassages,report,CUTS,HALF_CELL_FEET};
