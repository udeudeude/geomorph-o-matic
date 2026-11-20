"use strict";
// A separate five-foot-mouth cave FAMILY, not mixed into the ten legacy tiles.
const fs=require("node:fs"),path=require("node:path");
const {makeSvg}=require("./render");
const {buildCells,verifyLayout,assemble}=require("./assemble");
const {inspectTile,boundaryCell}=require("./seam-profiles");
const {doorEdges}=require("./audit");
const {terrainGraph,terrainModel}=require("./terrain");
const {distances}=require("./route-analysis");
const {letterProof,printScaleAudit}=require("./print-review");
const source=()=>JSON.parse(fs.readFileSync(path.join(__dirname,"wide-blueprints.json"),"utf8"));
function routeReport(tile){
 const seams=inspectTile(tile,"cave-wide-v1");
 const floor=buildCells(tile),doors=doorEdges(tile);
 const collapsed=terrainGraph(floor,doors,tile.terrain,"ordinary","dry");
 const before=terrainGraph(floor,doors,{...tile.terrain,chokes:[]},"ordinary","dry");
 const start="0,4",destination="0,14";
 const afterLength=distances(collapsed,start).get(destination);
 const beforeLength=distances(before,start).get(destination);
 if(!Number.isFinite(afterLength)||!Number.isFinite(beforeLength)||afterLength-beforeLength<6)
  throw Error("The authored double-lane roof fall does not force a meaningful west-bank detour");
 const fromNorth=distances(collapsed,"4,0");
 const edgeCells=seams.mouths.flatMap(m=>m.offsets.map(offset=>boundaryCell(m.side,offset).join(",")));
 if(edgeCells.some(p=>!fromNorth.has(p))||fromNorth.size!==floor.size)
  throw Error("The collapsed feeder strands occupied floor or a modular mouth");
 if(terrainModel(floor,tile.terrain).chokes.size!==2)
  throw Error("The roof fall must block two actual walking edges");
 return {tile:tile.id,stage:"unreleased architectural study",
  geology:"fictional lava-tube plan; roof heights and bearing unverified",
  seam_family:"cave-wide-v1",distinct_mouths:seams.clear_openings,
  width_feet:5,minimum_inward_clear_depth_feet:5,
  all_rotations_checked:seams.rotations_checked,
  rooms:tile.rooms.length,doorways:tile.doors.length,floor_cells:floor.size,
  reachable_floor_cells:fromNorth.size,reachable_edge_cells:edgeCells.length,
  roof_fall_blocked_edges:2,west_bank_before_half_cells:beforeLength,
  west_bank_after_half_cells:afterLength,west_bank_detour_half_cells:afterLength-beforeLength,
  print:printScaleAudit(tile)};
}
function generate(outputDir=path.join(__dirname,"studies")){
 const data=source(),tile=data.tiles[0];
 if(data.tiles.length!==1)throw Error("Only the inspected candidate belongs on this study sheet");
 const report=routeReport(tile);
 const layout=JSON.parse(fs.readFileSync(path.join(__dirname,"studies/assembly_braided_2x2.json"),"utf8"));
 verifyLayout(layout,data);
 fs.mkdirSync(outputDir,{recursive:true});
 fs.mkdirSync(path.join(__dirname,"reports"),{recursive:true});
 const write=(name,txt)=>fs.writeFileSync(path.join(outputDir,name),txt,"utf8");
 write(tile.id+".svg",makeSvg(tile));
 write(tile.id+"_2x2.svg",assemble(layout,data,()=>makeSvg(tile)));
 write(tile.id+"_print_letter.svg",letterProof(tile));
 fs.writeFileSync(path.join(__dirname,"reports/wide-lava-routes.json"),JSON.stringify(report,null,2)+"\n");
 return report;
}
if(require.main===module){console.log(JSON.stringify(generate(),null,2));}
module.exports={source,routeReport,generate};
