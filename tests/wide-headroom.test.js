"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {source}=require("../wide-cave");
const {buildCells}=require("../assemble");
const {doorEdges}=require("../audit");
const {terrainGraph}=require("../terrain");
const {distances}=require("../route-analysis");
const {makeSvg}=require("../render");
const {roofModel,headroomGraph,analyze,ceilingSvg,plate,POSTURES}=require("../wide-headroom");
const wide=source().tiles;
const expected={
 braided_lava:{floor:187,standing:185,crouching:185,changed:16,from:23,to:31,low:3.5,baseline:8},
 sagging_sheet:{floor:238,standing:235,crouching:238,changed:12,from:29,to:31,low:5,baseline:6.5},
 split_spine:{floor:223,standing:208,crouching:208,changed:0,low:3.5,baseline:7.5}
};
test("all three authored ceiling restrictions register to genuinely occupied cave geometry",()=>{
 assert.equal(wide.length,3);
 for(const tile of wide){
  const floor=buildCells(tile),model=roofModel(floor,tile.roof_scenario,tile.seam_profile,tile.terrain);
  assert.equal(model.clearances.size,expected[tile.id].floor);
  assert.equal(model.zones.length,1);
  assert.equal(model.zones[0].cells.length,2);
  assert.equal(model.zones[0].clearance_feet,expected[tile.id].low);
  assert.equal(model.baseline_feet,expected[tile.id].baseline);
  for(const p of model.zones[0].cells)assert.ok(floor.has(p),p);
 }
});
test("assumed low ceilings have measurable navigation consequences, without damaging modular mouths",()=>{
 for(const tile of wide){
  const ex=expected[tile.id],r=analyze(tile);
  assert.equal(r.postures.standing.reachable_floor_cells,ex.standing,tile.id);
  assert.equal(r.postures.crouching.reachable_floor_cells,ex.crouching,tile.id);
  assert.equal(r.postures.crawling.reachable_floor_cells,ex.floor,tile.id);
  assert.equal(r.postures.standing.reachable_mouth_cells,16,tile.id);
  assert.equal(r.postures.standing.mouth_pairs_with_longer_traversal,ex.changed,tile.id);
  assert.equal(r.postures.standing.unreachable_mouth_pairs,0,tile.id);
  if(ex.from){
   const traverse=r.selected_traversals.find(x=>x.from==="0,4"&&x.to==="19,4");
   assert.equal(traverse.crawling_half_cells,ex.from);
   assert.equal(traverse.standing_half_cells,ex.to);
  }
 }
});
test("headroom filters only genuine walkable links and preserves original collapse and grade rules",()=>{
 for(const tile of wide){
  const floor=buildCells(tile),roof=roofModel(floor,tile.roof_scenario,tile.seam_profile,tile.terrain);
  const full=terrainGraph(floor,doorEdges(tile),tile.terrain,"ordinary","dry");
  const stand=headroomGraph(full,roof,POSTURES.standing);
  assert.equal(stand.size,floor.size-2-(tile.id==="sagging_sheet"?1:0),"One additional stooped bench cell is excluded");
  assert.equal(distances(stand,"4,0").size,expected[tile.id].standing,
    "A constriction can make further admitted floor unreachable");
  for(const [p,neighbors] of stand)for(const q of neighbors){
   assert.ok(full.get(p).includes(q),p+" -> "+q);
   assert.ok(stand.get(q).includes(p),"Headroom should preserve bidirectionality");
  }
  const crawl=headroomGraph(full,roof,POSTURES.crawling);
  assert.equal(distances(crawl,"4,0").size,floor.size);
 }
});
test("roof scenarios reject fabricated floors, disconnected zones, non-walkable mouths, overlaps and survey claims",()=>{
 const tile=wide[0],floor=buildCells(tile),scenario=tile.roof_scenario;
 for(const changed of [
   {...scenario,status:"surveyed"},
   {...scenario,baseline_feet:3},
   {...scenario,zones:[{...scenario.zones[0],cells:[[9,6],[1,1]]}]},
   {...scenario,zones:[{...scenario.zones[0],cells:[[4,0],[5,0]]}]},
   {...scenario,zones:[{...scenario.zones[0],cells:[[9,6],[9,6]]}]},
   {...scenario,zones:[scenario.zones[0],scenario.zones[0]]}
 ])assert.throws(()=>roofModel(floor,changed,tile.seam_profile,tile.terrain),/Invalid|Low roof/);
 assert.throws(()=>headroomGraph(new Map(),{clearances:new Map()},0),/Invalid headroom/);
});
test("editable cave ceiling marks are registered to the same floor cells and remain separate from barriers",()=>{
 for(const tile of wide){
  const floor=buildCells(tile),svg=makeSvg(tile),marks=ceilingSvg(floor,tile.roof_scenario,24,tile.terrain).join("\n");
  assert.match(svg,/id="ceiling-clearance"/);
  for(const [x,y] of tile.roof_scenario.zones[0].cells)
   assert.ok(svg.includes('data-roof-cell="'+x+','+y+'"'));
  assert.ok(marks.includes('stroke-dasharray="2 4"'));
  assert.equal(svg,makeSvg(tile),"Deterministic authored SVG");
 }
 const legacy={...wide[0],roof_scenario:undefined};
 assert.doesNotMatch(makeSvg(legacy),/id="ceiling-clearance"/);
});
test("cross-section technical vector is explicitly hypothetical, deterministic and geo-registered",()=>{
 const reports=wide.map(analyze),svg=plate(reports);
 assert.equal(svg,plate(reports));
 assert.match(svg,/<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/);
 assert.match(svg,/not survey drawings/);
 assert.match(svg,/HYPOTHETICAL CLEARANCE/);
 for(const t of wide){
  assert.ok(svg.includes('id="scenario-'+t.id+'"'));
  for(const p of t.roof_scenario.zones[0].cells)assert.ok(svg.includes('>'+p.join(",")+'</text>'));
 }
});
