"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const {outfallModel}=require("../outfall-envelope");
const {relayModel,verifySubfloorLayout}=require("../subfloor-interfaces");
const data=JSON.parse(fs.readFileSync(path.join(__dirname,"../blueprints.json"),"utf8"));
const receiver=data.tiles.find(t=>t.id==="postern_bastion");
const copy=v=>JSON.parse(JSON.stringify(v));
const pair=()=>({rows:[[{id:"riftwater_lock",turn:0}],[{id:"postern_bastion",turn:0}]]});
test("masonry outfall is a dimensioned lip at an external boundary, not a completed receiver",()=>{
 const r=relayModel(receiver),o=r.outfall;
 assert.deepEqual(o.at,[19,9]);
 assert.equal(o.nominal_clear_width_ft,2);
 assert.equal(r.cells.length,23);
 assert.equal(r.grade.total_fall_ft.toFixed(2),"1.10");
 assert.equal(o.invert_ft,-12.4);
 assert.equal(o.states[0].interpretation,"partly_submerged_lip");
 assert.equal(o.states[0].crown_drowned,false);
 assert.equal(o.states[1].crown_drowned,true);
 assert.equal(o.states[1].beyond_design_tailwater,true);
 assert.match(o.status,/not verified/);
});
test("unmapped high-water receiver is never certified as harmless",()=>{
 for(const edit of [
  x=>x.outfall.at=[18,9],
  x=>x.outfall.exit_edge.offset=8,
  x=>x.outfall.nominal_clear_width_ft=3,
  x=>x.outfall.water_levels_ft.high=-9.5,
  x=>x.outfall.water_levels_ft.ordinary=-7,
  x=>x.outfall.receiver_documentation="measured",
  x=>x.discharge_status="complete"
 ]){
  const bad=copy(receiver.hydrology.subfloor_relay);edit(bad);
  assert.throws(()=>outfallModel(bad,{inverts_ft:bad.grade.inverts_ft,
   crown_ft:bad.grade.crown_ft,max_tailwater_ft:bad.grade.max_tailwater_ft}));
 }
});
test("outfall may face open exterior after rotations, never an arbitrary adjacent tile",()=>{
 const straight=verifySubfloorLayout(pair(),data);
 assert.deepEqual(straight.outfalls[0].tile,[0,1]);
 assert.equal(straight.outfalls[0].offset,9);
 const turned=verifySubfloorLayout({rows:[[{id:"postern_bastion",turn:2}],[{id:"riftwater_lock",turn:2}]]},data);
 assert.equal(turned.outfalls[0].side,"W");
 assert.equal(turned.outfalls[0].offset,10);
 const blocked={rows:[
  [{id:"riftwater_lock",turn:0},{id:"bone_galleries",turn:0}],
  [{id:"postern_bastion",turn:0},{id:"salt_cloister",turn:0}]
 ]};
 assert.throws(()=>verifySubfloorLayout(blocked,data),/outfall/);
});
