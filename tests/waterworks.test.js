"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const {buildCells}=require("../assemble"),{doorEdges}=require("../audit");
const {gateModel,applyGateStates}=require("../hydraulic-control");
const {waterwayModel,hydraulicCanalGraph,sluiceImpact,controlModel,controlAudit}=require("../waterworks");
const {floodStages,floodAudit}=require("../flood-stages");
const {makeSvg}=require("../render");
const tiles=JSON.parse(fs.readFileSync(path.join(__dirname,"../blueprints.json"),"utf8")).tiles;
const tile=tiles.find(t=>t.id==="riftwater_lock"),owner=buildCells(tile),doors=doorEdges(tile);

test("engineered waterway has identifiable intake, outfall and bounded hydraulic graph",()=>{
 const waterway=waterwayModel(owner,doors,tile.hydrology,tile.terrain);
 const gates=gateModel(owner,doors,tile.hydrology.gates);
 assert.equal(waterway.canal.size,9);
 assert.equal(waterway.inlet,"9,9");
 assert.equal(waterway.outlet,"11,11");
 const shut=hydraulicCanalGraph(waterway.canal,gates,applyGateStates(gates));
 assert.ok(!shut.get("10,10").includes("10,11"));
 const open=hydraulicCanalGraph(waterway.canal,gates,applyGateStates(gates,new Map(),{center_shutter:"open"}));
 assert.ok(open.get("10,10").includes("10,11"));
 assert.ok(!open.has("10,12"),"pedestrian circulation must not become a canal");
 assert.ok(!open.has("12,10"),"wall-side corridor cannot leak into turbine channel");
});

test("staged water is confined to engineered race instead of spilling through walkable doors",()=>{
 const stages=floodStages(owner,doors,tile.terrain,tile.hydrology);
 assert.equal(stages.get("normal").terrain.water.length,6);
 assert.equal(stages.get("surge").terrain.water.length,9);
 assert.throws(()=>floodStages(owner,doors,tile.terrain,{
  ...tile.hydrology,stages:[{id:"bad",add_water:[[10,12]],gate_states:{center_shutter:"open"},surface_level:1}]
 }),/outside engineered waterway/);
});

test("three independent handwheels are dry and reachable in both flood states",()=>{
 const controls=controlModel(owner,doors,tile.hydrology,tile.terrain);
 assert.deepEqual(controls.map(c=>c.gate),["west_shutter","center_shutter","east_shutter"]);
 assert.deepEqual(controls.map(c=>c.at),[[10,14],[11,14],[12,14]]);
 for(const state of floodStages(owner,doors,tile.terrain,tile.hydrology).values()){
  const audit=controlAudit(owner,doors,tile.hydrology,state.terrain);
  assert.equal(audit.length,3);
  for(const c of audit)assert.equal(c.dry_portal_approaches,8,c.gate+" at "+state.id);
 }
 const audit=floodAudit(owner,doors,tile.terrain,tile.vertical,tile.hydrology);
 assert.equal(audit.length,4);
 assert.equal(audit[3].control_access.length,3);
});

test("bad race and control geometry is rejected before vector output",()=>{
 const hydro=tile.hydrology;
 assert.throws(()=>waterwayModel(owner,doors,{...hydro,channels:[...hydro.channels,[10,14],[10,14]]},tile.terrain),/Repeated/);
 assert.throws(()=>waterwayModel(owner,doors,{...hydro,channels:hydro.channels.filter(p=>p[0]!==10||p[1]!==9)},tile.terrain),/Existing water outside/);
 assert.throws(()=>waterwayModel(owner,doors,{...hydro,outlet:[10,14]},tile.terrain),/Intake and outlet/);
 assert.throws(()=>controlModel(owner,doors,{...hydro,controls:[...hydro.controls,hydro.controls[0]]},tile.terrain),/repeated hydraulic control/);
 assert.throws(()=>controlModel(owner,doors,{...hydro,controls:hydro.controls.slice(0,2)},tile.terrain),/Every sluice/);
 assert.throws(()=>controlModel(owner,doors,{...hydro,controls:hydro.controls.map((c,i)=>i===1?{...c,id:hydro.controls[0].id}:c)},tile.terrain),/repeated hydraulic control/);
 assert.throws(()=>controlModel(owner,doors,{...hydro,controls:hydro.controls.map((c,i)=>i===0?{...c,at:[10,9]}:c)},tile.terrain),/dry service-gallery/);
});

test("three stone-partitioned sluice branches produce distinct useful flood states",()=>{
 const states=floodStages(owner,doors,tile.terrain,tile.hydrology);
 assert.deepEqual([...states.keys()],["normal","west_release","center_release","surge"]);
 assert.deepEqual([...states.values()].map(s=>s.terrain.water.length),[6,7,8,9]);
 const impact=sluiceImpact(owner,doors,tile.hydrology,tile.terrain);
 assert.deepEqual(impact.map(g=>g.newly_accessible_canals),[["9,11"],["10,11"],["11,11"]]);
 assert.equal(new Set(impact.flatMap(g=>g.newly_accessible_canals)).size,3);
 const model=waterwayModel(owner,doors,tile.hydrology,tile.terrain);
 assert.equal(model.partitions.size,2);
 for(const barrier of model.partitions)assert.ok(model.walls.has(barrier));
 assert.throws(()=>waterwayModel(owner,doors,tile.hydrology,
  {...tile.terrain,barriers:[]}),/do not isolate independent/);
 assert.throws(()=>waterwayModel(owner,doors,
  {...tile.hydrology,isolated_shutters:"definitely"},tile.terrain),/Invalid isolated-shutter/);
 const normal=makeSvg(tile);
 assert.match(normal,/id="masonry-partitions"/);
 assert.equal((normal.match(/data-blocks-edge=/g)||[]).length,2);
});
test("stone walls isolate canals unless a specific culvert cuts the boundary",()=>{
 const zones=new Map([["2,5","pond"],["3,5","hall"]]);
 const terrain={water:[[2,5]]};
 const hydro={channels:[[2,5],[3,5]],intake:[2,5],outlet:[3,5]};
 assert.throws(()=>waterwayModel(zones,[],hydro,terrain),/cannot connect intake/);
 const cut={...hydro,culverts:[[[2,5],[3,5]]]};
 const model=waterwayModel(zones,[],cut,terrain);
 const graph=hydraulicCanalGraph(model.canal,[],new Map(),model.walls);
 assert.deepEqual(graph.get("2,5"),["3,5"]);
 assert.throws(()=>waterwayModel(zones,[],{...cut,culverts:[...cut.culverts,...cut.culverts]},terrain),/unique masonry boundary/);
});

test("waterworks appears in independent reproducible vector layers",()=>{
 const normal=makeSvg(tile),stages=floodStages(owner,doors,tile.terrain,tile.hydrology);
 const surge=makeSvg({...tile,terrain:stages.get("surge").terrain,
  hydrology:{...tile.hydrology,render_gate_states:stages.get("surge").gate_states}});
 for(const svg of [normal,surge]){
  for(const marker of ['id="engineered-canal-banks"','id="intake-and-outfall"','id="sluice-control-stations"'])
   assert.ok(svg.includes(marker),marker);
  assert.equal((svg.match(/data-control-id=/g)||[]).length,3);
  assert.equal((svg.match(/data-hydraulic-terminal=/g)||[]).length,2);
  assert.equal((svg.match(/data-controls-gate=/g)||[]).length,3);
 }
 assert.equal(normal,makeSvg(tile));
 assert.equal((surge.match(/data-state="open"/g)||[]).length,3);
});
