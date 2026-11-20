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

function sheetReport(tile){
 const seams=inspectTile(tile,"cave-wide-v1"),floor=buildCells(tile),doors=doorEdges(tile);
 const model=terrainModel(floor,tile.terrain);
 const before=terrainGraph(floor,doors,{...tile.terrain,chokes:[]},"ordinary","dry");
 const after=terrainGraph(floor,doors,tile.terrain,"ordinary","dry");
 const start="5,0",target="14,0";
 const prior=distances(before,start).get(target),current=distances(after,start).get(target);
 const edges=seams.mouths.flatMap(m=>m.offsets.map(o=>boundaryCell(m.side,o).join(",")));
 const accessible=distances(after,"4,0");
 if(!Number.isFinite(prior)||current-prior!==14)
  throw Error("Sheetflow double-width collapse must lengthen the northern route by fourteen half-cells");
 if(accessible.size!==floor.size||edges.some(p=>!accessible.has(p)))
  throw Error("Sheetflow has stranded passage or modular edge mouths");
 if(model.chokes.size!==2||model.heights.size!==8||model.ramps.size!==3)
  throw Error("Sheetflow collapse, elevated bench or independent approaches are incomplete");
 for(const blocked of model.chokes)if(before.get(blocked.split("|")[0])?.includes(blocked.split("|")[1])!==true)
  throw Error("Sheetflow roof fall must close an actual ordinary walking edge");
 return {tile:tile.id,stage:"unreleased architectural study",
  geology:"fictional inflated sheet-flow passage; roof elevations and actual bearing not established",
  seam_family:"cave-wide-v1",mouths:seams.clear_openings,rotations_checked:seams.rotations_checked,
  chamber_count:tile.rooms.length,doorway_count:tile.doors.length,floor_cells:floor.size,
  reachable_floor_cells:accessible.size,reachable_edge_cells:edges.length,
  blocked_edges:model.chokes.size,raised_floor_cells:model.heights.size,grade_transition_edges:model.ramps.size,
  northern_before_half_cells:prior,northern_after_half_cells:current,northern_detour_half_cells:current-prior,
  print:printScaleAudit(tile)};
}
function generate(outputDir=path.join(__dirname,"studies")){
 const data=source(),braided=data.tiles.find(t=>t.id==="braided_lava"),
   sheet=data.tiles.find(t=>t.id==="sagging_sheet");
 if(!braided||!sheet||data.tiles.length!==2)
  throw Error("Expected exactly the two independently authored wide cave studies");
 const braidedReport=routeReport(braided),sheetflowReport=sheetReport(sheet);
 const oldLayout=JSON.parse(fs.readFileSync(path.join(__dirname,"studies/assembly_braided_2x2.json"),"utf8"));
 const mixedLayout=JSON.parse(fs.readFileSync(path.join(__dirname,"studies/assembly_wide_mixed_2x2.json"),"utf8"));
 verifyLayout(oldLayout,data);verifyLayout(mixedLayout,data);
 fs.mkdirSync(outputDir,{recursive:true});fs.mkdirSync(path.join(__dirname,"reports"),{recursive:true});
 const write=(name,txt)=>fs.writeFileSync(path.join(outputDir,name),txt,"utf8");
 for(const tile of data.tiles){
  write(tile.id+".svg",makeSvg(tile));
  write(tile.id+"_print_letter.svg",letterProof(tile));
 }
 write(braided.id+"_2x2.svg",assemble(oldLayout,data,id=>makeSvg(data.tiles.find(t=>t.id===id))));
 write("wide_mixed_2x2.svg",assemble(mixedLayout,data,id=>makeSvg(data.tiles.find(t=>t.id===id))));
 fs.writeFileSync(path.join(__dirname,"reports/wide-lava-routes.json"),JSON.stringify(braidedReport,null,2)+"\n");
 fs.writeFileSync(path.join(__dirname,"reports/sheetflow-routes.json"),JSON.stringify(sheetflowReport,null,2)+"\n");
 return {braided_lava:braidedReport,sagging_sheet:sheetflowReport,assemblies:["braided_lava_2x2.svg","wide_mixed_2x2.svg"]};
}
if(require.main===module){console.log(JSON.stringify(generate(),null,2));}
module.exports={source,routeReport,sheetReport,generate};
