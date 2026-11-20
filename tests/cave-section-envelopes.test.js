"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const data=JSON.parse(fs.readFileSync(path.join(__dirname,"../blueprints.json"),"utf8"));
const {CUTS,section,report,plate,PIXELS_PER_FOOT}=require("../cave-section-envelopes");
const get=id=>data.tiles.find(t=>t.id===id);
test("four actual orthogonal cuts have plan-registered widths and authored height scenarios",()=>{
 const r=report(data);
 assert.deepEqual(r.sections.map(s=>s.width_feet),[7.5,5,2.5,5]);
 assert.deepEqual(r.sections.map(s=>s.sampled_axis_headroom_feet),[9,6.5,4.5,6]);
 assert.ok(r.sections.every(s=>s.roof_height_over_floor_feet.length*2.5===s.width_feet));
 assert.ok(r.sections.every(s=>/not measured/.test(s.height_evidence)));
 assert.equal(r.sections[2].example_central_posture,"crouching design allowance");
 assert.equal(PIXELS_PER_FOOT,22);
});
test("roof sections must fail loudly when the source plan width or registration moves",()=>{
 const cut=CUTS[0],good=get(cut.tile);
 const moved=structuredClone(good);
 moved.routes.push({id:"unwanted_cavity",points:[[6,3],[6,3]]});
 assert.throws(()=>section(moved,cut),/no longer aligns/);
 const narrower=structuredClone(good);
 const badCut={...cut,heights_ft:[5,9]};
 assert.throws(()=>section(narrower,badCut),/Invalid fictional roof/);
 assert.throws(()=>section(get("hollow_causeway"),cut),/different natural-cave plan/);
 assert.throws(()=>section(good,{...cut,heights_ft:[5,NaN,7]}),/Invalid fictional roof/);
});
test("new editable vector plate is deterministic and scaled rather than a decorative unregistered arch",()=>{
 const svg=plate(data);
 assert.equal(svg,plate(data));
 assert.equal((svg.match(/id="transverse-/g)||[]).length,4);
 assert.ok(svg.includes("5 ft clear in plan"));
 assert.ok(svg.includes("7.5 ft clear in plan"));
 assert.match(svg,/1:1 vertical\/horizontal/);
 assert.match(svg,/fictional cave passage envelopes/i);
 assert.doesNotMatch(svg,/<image\b/);
 assert.doesNotMatch(svg,/<foreignObject\b/);
});
