"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const data=JSON.parse(fs.readFileSync(path.join(__dirname,"../blueprints.json"),"utf8"));
const tile=data.tiles.find(t=>t.id==="scoured_siphon");
const {makeSvg}=require("../render");
const {CUTS,profileSamples,auditScouredProfiles,sectionPlateSvg,occupiedFloor}=require("../cave-profile");

test("two registered interpretive cuts trace actual floor rather than imaginary corridors",()=>{
 const model=occupiedFloor(tile);
 assert.ok(model.has("10,9")&&model.has("17,4")&&model.has("18,4"));
 const a=profileSamples(tile,CUTS[0]),b=profileSamples(tile,CUTS[1]);
 assert.deepEqual(a.samples.map(s=>s.key),["10,7","10,8","10,9","10,10","10,11","10,12"]);
 assert.deepEqual(b.samples.map(s=>s.key),["12,4","13,4","14,4","15,4","16,4","17,4","18,4"]);
 assert.equal(a.lengthFeet,15);
 assert.equal(b.lengthFeet,17.5);
 assert.deepEqual(b.slopes,[[5,6]]);
 assert.equal(a.samples.filter(s=>s.wet).length,1);
 assert.ok(a.samples[2].bridge);
 assert.equal(auditScouredProfiles(tile).section_b_ramp_edges,1);
});
test("profile validation fails loudly if canonical bridge, stream or ramp moves",()=>{
 const copy=()=>structuredClone(tile);
 const dry=copy();dry.terrain.water=dry.terrain.water.filter(p=>p.join()!=="10,9");
 assert.throws(()=>auditScouredProfiles(dry),/bridge|stream/i);
 const bridge=copy();bridge.terrain.bridges=[];
 assert.throws(()=>auditScouredProfiles(bridge),/bridged stream/);
 const ramp=copy();ramp.terrain.ramps=[];
 assert.throws(()=>auditScouredProfiles(ramp),/without canonical ramp/);
 const blocked=copy();blocked.routes=blocked.routes.filter(r=>r.id!=="spur_east");
 assert.throws(()=>profileSamples(blocked,{...CUTS[1],fixed:19}),/solid rock/);
});
test("roof sketch metadata is bounded, and a section cannot accidentally traverse bedrock",()=>{
 assert.throws(()=>profileSamples(tile,{...CUTS[0],from:2}),/ceiling profile/);
 assert.throws(()=>profileSamples(tile,{...CUTS[0],fixed:0}),/solid rock/);
 assert.throws(()=>profileSamples(tile,{...CUTS[1],ceiling:[15,15,15,15,15,15,30]}),/ceiling profile/);
});
test("editable profile plate remains coupled to canonical rendered plan",()=>{
 const plan=makeSvg(tile),plate=sectionPlateSvg(tile,plan);
 assert.equal(plate,sectionPlateSvg(tile,plan));
 assert.match(plate,/width="16in" height="10.25in"/);
 assert.match(plate,/id="section-cuts"/);
 assert.match(plate,/id="profile-A"/);
 assert.match(plate,/id="profile-B"/);
 assert.match(plate,/data-cut="A"/);
 assert.match(plate,/data-cut="B"/);
 assert.match(plate,/id="dry-bridges"/);
 assert.match(plate,/id="level-ramps"/);
 assert.match(plate,/no measured cave survey/);
 assert.throws(()=>sectionPlateSvg(tile,"<svg/>"),/canonical SVG/);
});
