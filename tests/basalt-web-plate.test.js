"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const data=JSON.parse(fs.readFileSync(path.join(__dirname,"../blueprints.json"),"utf8"));
const tile=data.tiles.find(t=>t.id==="basalt_rift");
const {plate}=require("../basalt-web-plate");
const {auditRibs}=require("../cave-rock-ribs");

test("Basalt plate registers two actual five-foot rock webs to the canonical map",()=>{
 const svg=plate(tile),samples=auditRibs(tile).sections;
 const west=samples.find(s=>s.id==="western_distributary_web");
 const east=samples.find(s=>s.id==="eastern_distributary_web");
 assert.equal(west.rock_half_cells,2);
 assert.equal(east.rock_half_cells,2);
 assert.equal(svg,plate(tile),"SVG assembly must be deterministic");
 assert.match(svg,/id="bedrock-transects"/);
 assert.match(svg,/data-rock-cut="western_distributary_web"/);
 assert.match(svg,/data-rock-cut="eastern_distributary_web"/);
 assert.match(svg,/id="rib-section-western_distributary_web"/);
 assert.match(svg,/id="rib-section-eastern_distributary_web"/);
 assert.match(svg,/5 ft/);
 assert.match(svg,/canonical plan/i);
 assert.match(svg,/ceiling sketches are not vertically scaled/);
 assert.doesNotMatch(svg,/<image\b/i,"Do not flatten editorial vector plate");
});

test("wrong passage geometry cannot silently retain the section illustration",()=>{
 const bad=structuredClone(tile);
 bad.routes.find(r=>r.id==="western_top").points=[[0,4],[1,4],[1,7],[5,7],[5,9],[7,9],[7,8],[9,8],[9,9],[10,9]];
 assert.throws(()=>plate(bad),/Bedrock sample must start in solid rock/);
 assert.throws(()=>plate(data.tiles.find(t=>t.id==="hollow_causeway")),/Basalt Rift/);
});
