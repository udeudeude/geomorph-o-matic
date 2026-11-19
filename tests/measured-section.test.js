"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict");
const {measuredSection}=require("../measured-section");
const {buildCells}=require("../assemble");
const fs=require("node:fs"),path=require("node:path");
const rift=JSON.parse(fs.readFileSync(path.join(__dirname,"../blueprints.json"),"utf8")).tiles.find(t=>t.id==="riftwater_lock");
function survey(){
 const owner=new Map(Array.from({length:9},(_,i)=>[(i+2)+",10","hall"]));
 const terrain={water:[[8,10]],bridges:[[8,10]]};
 const vertical={decks:[
  {id:"lower_service",level:-1,cells:[[3,10],[4,10]]},
  {id:"upper_passage",level:1,cells:[[6,10],[7,10]]},
  {id:"watch_platform",level:2,cells:[[7,10]]}
 ],links:[
  {at:[3,10],from:0,to:-1,kind:"ladder"},
  {at:[6,10],from:0,to:1,kind:"ladder"},
  {at:[7,10],from:1,to:2,kind:"stair"}
 ]};
 return {owner,terrain,vertical};
}
test("section includes independent negative and stacked positive floor levels",()=>{
 const {owner,terrain,vertical}=survey();
 const svg=measuredSection(owner,terrain,vertical,{row:10,title:"Test survey"});
 for(const id of ["section-datums","section-floor-surfaces","section-overhead-surfaces",
  "section-vertical-links","section-water","section-bridges","section-distance-ruler"])
  assert.match(svg,new RegExp('id="'+id+'"'));
 assert.match(svg,/lower_service/);
 assert.match(svg,/upper_passage/);
 assert.match(svg,/watch_platform/);
 assert.match(svg,/\+2 \(20 ft\)/);
 assert.match(svg,/-1 \(-10 ft\)/);
 assert.match(svg,/M390 75h24/); // watch platform at x7, level +2
 assert.equal(svg,measuredSection(owner,terrain,vertical,{row:10,title:"Test survey"}));
});
test("section uses equal plan and nominal vertical length units, never inventing a cave roof",()=>{
 const {owner,terrain,vertical}=survey();
 const svg=measuredSection(owner,terrain,vertical,{feetPerLevel:12.5});
 assert.match(svg,/assumed 12.5 feet per level/);
 assert.match(svg,/not surveyed/);
 assert.match(svg,/unmodeled roofs and cave ceilings are omitted/);
 assert.throws(()=>measuredSection(owner,terrain,vertical,{feetPerLevel:0}),/Invalid/);
 assert.throws(()=>measuredSection(owner,terrain,vertical,{row:0}),/interior/);
});
test("canonical Riftwater multilevel section remains editable and non-destructive",()=>{
 const owner=buildCells(rift),svg=measuredSection(owner,rift.terrain,rift.vertical);
 assert.ok(svg.includes('data-deck="turbine_gantry"'));
 assert.ok(svg.includes('id="section-water"'));
 assert.ok(svg.includes('id="section-vertical-links"'));
 assert.ok(svg.includes('section-overhead-surfaces'));
});
