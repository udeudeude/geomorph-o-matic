"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const {buildCells}=require("../assemble");
const {doorEdges}=require("../audit");
const {makeSvg}=require("../render");
const {transmissionModel,inspectionModel,maintenanceSymbolsSvg,bendKeys}=require("../maintenance-works");
const {makeMaintenancePlate}=require("../maintenance-plate");
const data=JSON.parse(fs.readFileSync(path.join(__dirname,"../blueprints.json"),"utf8"));
const src=data.tiles.find(t=>t.id==="riftwater_lock");
const dst=data.tiles.find(t=>t.id==="postern_bastion");
const copy=v=>JSON.parse(JSON.stringify(v));
test("three distinct overhead line shafts link their own dry handwheels to sluice rack stations",()=>{
 const drives=transmissionModel(src);
 assert.deepEqual(drives.map(d=>d.gate),["west_shutter","center_shutter","east_shutter"]);
 assert.deepEqual(drives.map(d=>d.control),["west_winch","center_winch","east_winch"]);
 assert.deepEqual(drives.map(d=>d.bores.length),[2,1,3]);
 assert.equal(drives.reduce((n,d)=>n+d.bores.length,0),6);
 assert.equal(new Set(drives.flatMap(d=>d.path.map(p=>p.join(",")))).size,
  drives.reduce((n,d)=>n+d.path.length,0),"no intersecting transmission centerlines");
 assert.deepEqual(drives.map(d=>d.axis_ft),[8,8,8]);
});
test("independent gate drives fail on swaps, shared cells, disconnected segments and missing rock sleeves",()=>{
 for(const edit of [
  t=>{t.hydrology.transmissions[0].gate="center_shutter"},
  t=>{t.hydrology.transmissions[1].path[1]=[9,14]},
  t=>{t.hydrology.transmissions[2].path[2]=[12,10]},
  t=>{t.hydrology.transmissions[2].bored_at.pop()},
  t=>{t.hydrology.transmissions[0].bearings=[[9,13],[9,13]]},
  t=>{t.hydrology.transmissions[0].shaft_axis_ft=3},
  t=>{t.hydrology.transmissions.pop()}
 ]){
  const t=copy(src);edit(t);
  assert.throws(()=>transmissionModel(t),undefined,"bad drive must not validate");
 }
});
test("every genuine conduit turn has a dry inspectable, nontraversable cleanout",()=>{
 const upper=inspectionModel(src),lower=inspectionModel(dst);
 assert.deepEqual(bendKeys(src.hydrology.tailrace.cells),["11,14","6,14"]);
 assert.deepEqual(bendKeys(dst.hydrology.subfloor_relay.cells),["6,1","9,1"]);
 assert.deepEqual(upper.map(a=>a.branch_length_ft),[7.5,0]);
 assert.deepEqual(lower.map(a=>a.branch_length_ft),[0,0]);
 assert.deepEqual(lower.map(a=>a.surface.join(",")),["6,1","9,1"]);
 assert.equal(buildCells(dst).get("9,1"),"hall","the Postern shaft now has a real dry access niche");
 assert.equal(maintenanceSymbolsSvg(src).filter(s=>s.includes("buried-inspection-hatches")).length,1);
});
test("reject inaccessible rock hatches, submerged covers, colliding controls and missing bends",()=>{
 for(const edit of [
  t=>t.hydrology.tailrace.inspections.pop(),
  t=>t.hydrology.tailrace.inspections[0].surface=[11,14],
  t=>t.hydrology.tailrace.inspections[0].surface=[9,10],
  t=>t.hydrology.tailrace.inspections[0].branch=[[11,14],[13,14],[13,13]],
  t=>t.hydrology.tailrace.inspections[0].branch=[[11,14],[12,14],[11,14],[13,13]],
  t=>t.hydrology.tailrace.inspections[0].nominal_clear_diameter_ft=4
 ]){
  const t=copy(src);edit(t);
  assert.throws(()=>inspectionModel(t));
 }
 const t=copy(dst);t.routes=t.routes.filter(r=>r.id!=="north_service_cleanout_niche");
 assert.throws(()=>inspectionModel(t),/unserviceable|hatch/);
});
test("canonical surface SVG marks only accessible covers, not phantom walkable shafts",()=>{
 const s=makeSvg(src),p=makeSvg(dst);
 assert.match(s,/id="buried-inspection-hatches"/);
 assert.match(s,/data-inspection-cover="13,13"/);
 assert.match(s,/data-inspection-cover="6,14"/);
 assert.match(p,/data-inspection-cover="9,1"/);
 assert.doesNotMatch(s,/id="separate-overhead-drives"/);
});
test("deterministic editable technical plate identifies bores, vertical racks, inspections and unresolved outfall",()=>{
 const a=makeMaintenancePlate(data);
 assert.equal(a,makeMaintenancePlate(data));
 for(const k of ['id="separate-overhead-drives"','id="mechanism-masonry-edges"',
  'id="drive-elevations"','id="subfloor-inspection-schedule"',
  'id="underground-inspection-spur"','data-rock-bore="12,12"','data-drive="west_drive"'])
   assert.ok(a.includes(k),k);
 assert.equal((a.match(/data-section-drive=/g)||[]).length,3);
 assert.equal((a.match(/data-rock-bore=/g)||[]).length,6);
 assert.equal((a.match(/lateral branch/g)||[]).length,4);
 assert.match(a,/unmapped outfall/i);
 assert.match(a,/not a construction drawing/i);
});
