"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const {buildCells}=require("../assemble"),{doorEdges}=require("../audit");
const {gradeProfile}=require("../drainage-grade");
const {tailraceModel}=require("../tailrace");
const {relayModel,verifySubfloorLayout,turnInterface,interfaceForTile}=require("../subfloor-interfaces");
const {makeSubfloorAssemblyPlate}=require("../subfloor-assembly-plate");
const data=JSON.parse(fs.readFileSync(path.join(__dirname,"../blueprints.json"),"utf8"));
const rift=data.tiles.find(t=>t.id==="riftwater_lock");
const postern=data.tiles.find(t=>t.id==="postern_bastion");
const copy=v=>JSON.parse(JSON.stringify(v));
const grid=(top,bottom,ta=0,tb=0)=>({rows:[[{id:top,turn:ta}],[{id:bottom,turn:tb}]]});
test("dimensioned *assumption* envelope has strictly downhill inverts, roof freeboard and air break",()=>{
 const m=tailraceModel(buildCells(rift),doorEdges(rift),rift.hydrology,rift.terrain);
 assert.equal(m.cells.length,16);
 assert.equal(m.terminus,"6,19");
 assert.equal(m.boundary_edge.side,"S");
 assert.equal(m.grade.total_fall_ft,.75);
 assert.equal(m.grade.horizontal_run_ft,37.5);
 assert.equal(m.grade.min_freeboard_ft,.75);
 assert.equal(m.grade.available_air_gap_ft,7.75);
 for(const change of [
  g=>g.inverts_ft[3]=g.inverts_ft[2],
  g=>g.inverts_ft[3]=g.inverts_ft[2]-.3,
  g=>g.inverts_ft.pop(),
  g=>g.crown_ft=-9,
  g=>g.max_tailwater_ft=-7.9,
  g=>g.max_tailwater_ft=-1,
  g=>g.minimum_air_gap_ft=8,
  g=>g.drop_lip_ft=-9
 ]){
  const g=copy(rift.hydrology.tailrace.grade);change(g);
  assert.throws(()=>gradeProfile(rift.hydrology.tailrace.cells,g,
    {pickups:rift.hydrology.tailrace.pickups,vented:true}));
 }
});
test("postern lower conduit is an actual paired continuation, not an invented ninth surface portal",()=>{
 const source=interfaceForTile(rift),sink=interfaceForTile(postern);
 assert.equal(source.role,"out");
 assert.equal(sink.role,"in");
 assert.equal(relayModel(postern).terminus,"19,9");
 assert.equal(relayModel(postern).outfall.states[1].interpretation,"potential_backwater");
 const measured=verifySubfloorLayout(grid("riftwater_lock","postern_bastion"),data);
 assert.equal(measured.matched_seams.length,1);
 assert.equal(measured.matched_seams[0].seam_fall_ft.toFixed(2),"0.05");
 assert.equal(measured.matched_seams[0].offset,6);
 assert.equal(measured.outfalls.length,1);
 assert.equal(measured.outfalls[0].side,"E");
});
test("quarter-turn lower openings mate only at the rotated physical coordinate",()=>{
 const reverse=verifySubfloorLayout(grid("postern_bastion","riftwater_lock",2,2),data);
 assert.equal(reverse.matched_seams[0].offset,13);
 const horizontal={rows:[[{id:"riftwater_lock",turn:3},{id:"postern_bastion",turn:3}]]};
 assert.equal(verifySubfloorLayout(horizontal,data).matched_seams[0].offset,13);
 const direct=turnInterface(interfaceForTile(rift),1);
 assert.equal(direct.side,"W");
 assert.equal(direct.offset,6);
});
test("independently reject missing, misaligned, reversed and rising lower seams",()=>{
 assert.throws(()=>verifySubfloorLayout(grid("riftwater_lock","bone_galleries"),data),/mismatch/);
 assert.throws(()=>verifySubfloorLayout(grid("postern_bastion","riftwater_lock"),data),/boundary|mismatch/);
 const bad=copy(data);const r=bad.tiles.find(t=>t.id==="postern_bastion");
 r.hydrology.subfloor_relay.entry_edge.offset=12;
 assert.throws(()=>verifySubfloorLayout(grid("riftwater_lock","postern_bastion"),bad));
 const steep=copy(data);
 steep.tiles.find(t=>t.id==="postern_bastion").hydrology.subfloor_relay.grade.inverts_ft[0]=-10.8;
 assert.throws(()=>verifySubfloorLayout(grid("riftwater_lock","postern_bastion"),steep));
});
test("matched architectural plate is editable and identifies the unfinished downstream outfall",()=>{
 const layout=JSON.parse(fs.readFileSync(path.join(__dirname,"../examples/subfloor_pair.json"),"utf8"));
 const a=makeSubfloorAssemblyPlate(layout,data);
 assert.equal(a,makeSubfloorAssemblyPlate(layout,data));
 for(const id of ["subfloor-two-tile-plan","lower-level-centerlines","matched-subfloor-seam",
  "longitudinal-grade-profile","grade-seam","foundation-context-0","foundation-context-1"])
  assert.ok(a.includes('id="'+id+'"'),id);
 assert.match(a,/data-seam-fall-ft="0.05"/);
 assert.match(a,/data-seam-offset="6"/);
 assert.match(a,/id="foundation-adjacency-flags"/);
 assert.match(a,/Direct room-footprint overlaps: 0/);
 assert.match(a,/Outfall lip/);
 assert.match(a,/NOT a walking route/);
 assert.match(a,/air gap 7.75 ft/);
});
