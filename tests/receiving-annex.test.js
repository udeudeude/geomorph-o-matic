"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const {modelFromBlueprint,validateReceivingAnnex,verifyAnnexPair}=require("../receiving-annex");
const data=JSON.parse(fs.readFileSync(path.join(__dirname,"../blueprints.json"),"utf8"));
const annex=JSON.parse(fs.readFileSync(path.join(__dirname,"../examples/receiving_annex.json"),"utf8"));
const lip=modelFromBlueprint(data,annex).model,copy=v=>JSON.parse(JSON.stringify(v));
test("receiver is a distinct, dimensioned, provisional exterior architecture",()=>{
 const a=verifyAnnexPair(annex,lip);
 assert.equal(a.source_seam_drop_ft,.05);
 assert.equal(a.receiving_run_ft,47.5);
 assert.equal(a.receiving_drop_ft,.95);
 assert.equal(a.assumed_high_water_bank_freeboard_ft,1);
 assert.equal(a.service_path_cells,13);
 assert.equal(a.source_high_crown_drowned,true);
 assert.match(a.statuses.join(" "),/not mapped/);
});
test("rotated lips mate with opposite exterior interface, not standard walking edges",()=>{
 for(let t=0;t<4;t++){
  const a=verifyAnnexPair(annex,lip,t,t);
  assert.equal(a.offset,[9,10,10,9][t]);
  assert.deepEqual(a.necessary_annex_position,[[1,0],[0,1],[-1,0],[0,-1]][t]);
 }
 assert.throws(()=>verifyAnnexPair(annex,lip,0,1),/mate/);
});
test("adversarial route, treatment, access and water assumptions fail closed",()=>{
 const edits=[
  a=>a.stations[5]=[6,10],a=>a.stations[5]=a.stations[4],
  a=>a.bed_ft[1]=a.bed_ft[0],a=>a.bed_ft[1]=-13,
  a=>a.bed_ft[0]=-12.3,a=>a.reaches[1].first=4,
  a=>a.reaches[2].clear_width_ft=2,a=>a.reaches.pop(),
  a=>a.upper_terrace.path[5]=[15,8],
  a=>a.upper_terrace.path[10]=[10,9],
  a=>a.upper_terrace.bridge.deck_ft=-7.5,
  a=>a.desilting_pocket.service_landing=[10,8],
  a=>a.receiving_levels_ft.high=-8,
  a=>a.bank_top_ft=-8,a=>a.status="certified",
  a=>a.entry_edge.offset=4
 ];
 for(const edit of edits){
  const changed=copy(annex);edit(changed);
  assert.throws(()=>validateReceivingAnnex(changed,lip));
 }
});
