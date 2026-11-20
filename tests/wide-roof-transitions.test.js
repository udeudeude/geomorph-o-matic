"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {source}=require("../wide-cave");
const {buildCells}=require("../assemble");
const {roofModel,POSTURES,headroomGraph,ceilingSvg}=require("../wide-headroom");
const {terrainGraph}=require("../terrain");
const {doorEdges}=require("../audit");
const {routeToPinch,assess,plate}=require("../wide-roof-transitions");
const {makeSvg}=require("../render");
const {distances}=require("../route-analysis");
const tiles=source().tiles;
const key=p=>p.join(",");

test("real occupied cave corridors carry a bounded mouth-to-vault roof taper without losing standing mouths",()=>{
 for(const tile of tiles){
  const owner=buildCells(tile),roof=roofModel(owner,tile.roof_scenario,tile.seam_profile);
  assert.equal(roof.throat_transition_feet_per_half_cell,0.5);
  assert.equal(roof.clearances.size,owner.size);
  const floor=terrainGraph(owner,doorEdges(tile),tile.terrain||{},"ordinary","dry");
  const standing=headroomGraph(floor,roof,POSTURES.standing);
  const reached=distances(standing,"4,0");
  for(const side of ["N","S","E","W"])for(const o of [4,5,14,15]){
   const mouth=side==="N"?[o,0]:side==="S"?[o,19]:side==="W"?[0,o]:[19,o];
   assert.ok(reached.has(key(mouth)),tile.id+" "+mouth);
  }
  const zoned=new Set(roof.zones.flatMap(z=>z.cells));
  for(const [p,height] of roof.clearances){
   if(zoned.has(p))continue;
   const [x,y]=p.split(",").map(Number);
   for(const q of [[x+1,y],[x,y+1]].map(key)){
    if(!roof.clearances.has(q)||zoned.has(q))continue;
    assert.ok(Math.abs(height-roof.clearances.get(q))<=.5, tile.id+" "+p+" "+q);
   }
  }
 }
});
test("braided and split-spine roofs genuinely rise within actual passages; flat sheetflow is explicitly flat",()=>{
 const expected={braided_lava:[7,7.5],sagging_sheet:[],split_spine:[7]};
 for(const tile of tiles){
  const roof=roofModel(buildCells(tile),tile.roof_scenario);
  assert.deepEqual([...new Set(roof.tapered_cells.map(s=>s.clearance_feet))].sort((a,b)=>a-b),expected[tile.id]);
  assert.ok(roof.tapered_cells.every(s=>s.distance_from_mouth_half_cells>0));
  for(const p of roof.zones[0].cells)assert.equal(roof.clearances.get(p),tile.roof_scenario.zones[0].clearance_feet);
 }
});
test("profile walks real dry graph edges, documents abrupt constrictions, and does not invent a bench datum",()=>{
 for(const tile of tiles){
  const section=assess(tile),owner=buildCells(tile);
  const graph=terrainGraph(owner,doorEdges(tile),tile.terrain,"ordinary","dry");
  const zone=new Set(tile.roof_scenario.zones.flatMap(z=>z.cells.map(key)));
  assert.deepEqual(section.samples[0].plan_cell,[4,0]);
  assert.ok(zone.has(key(section.end_low_ceiling)));
  assert.equal(section.route_length_feet,(section.samples.length-1)*2.5);
  for(let i=1;i<section.samples.length;i++){
   const a=key(section.samples[i-1].plan_cell),b=key(section.samples[i].plan_cell);
   assert.ok(graph.get(a).includes(b),tile.id+" "+a+" -> "+b);
  }
  assert.equal(section.maximum_non_pinch_ceiling_change_feet<=.5,true);
  assert.ok(section.abrupt_pinch_transitions>=1);
  assert.match(section.limitations,/Hypothetical|hypothetical/);
 }
});
test("cannot fake a walkable roof profile across disconnected routes",()=>{
 const tile=tiles[0],floor=buildCells(tile),roof=roofModel(floor,tile.roof_scenario);
 const graph=terrainGraph(floor,doorEdges(tile),tile.terrain,"ordinary","dry");
 assert.ok(routeToPinch(graph,roof.zones).length>4);
 assert.throws(()=>routeToPinch(new Map([["4,0",[]]]),roof.zones),/not reachable/);
});
test("roof contours and real-distance vector profiles are deterministic and remain separate from walls",()=>{
 const reports=tiles.map(assess),svg=plate(reports);
 assert.equal(plate(reports),svg);
 assert.match(svg,/UNFOLDED WALKING ROUTE/);
 assert.match(svg,/NOT SURVEY DATA/);
 for(const tile of tiles){
  assert.ok(svg.includes('id="route-profile-'+tile.id+'"'));
  assert.ok(svg.includes('data-route-ceiling="'+tile.id+'"'));
  const roof=roofModel(buildCells(tile),tile.roof_scenario);
  const marks=ceilingSvg(buildCells(tile),tile.roof_scenario).join("\n");
  assert.match(marks,/id="roof-entry-transitions"/);
  assert.match(makeSvg(tile),/id="roof-entry-transitions"/);
  if(roof.tapered_cells.length)assert.match(marks,/data-crown-transition-edge=/);
 }
});
test("rejects non-finite, falsely extreme and negative crown transitions",()=>{
 const tile=tiles[0],owner=buildCells(tile);
 for(const rate of [-1,.75,NaN,Infinity,"0.5"])
  assert.throws(()=>roofModel(owner,{...tile.roof_scenario,throat_transition_feet_per_half_cell:rate}),/entrance-to-vault/);
});
