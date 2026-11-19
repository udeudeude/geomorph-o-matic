"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const {makeReceivingAnnexPlate}=require("../receiving-annex-plate");
const data=JSON.parse(fs.readFileSync(path.join(__dirname,"../blueprints.json"),"utf8"));
const annex=JSON.parse(fs.readFileSync(path.join(__dirname,"../examples/receiving_annex.json"),"utf8"));
test("architectural plan and section are editable separate vector layers with honest uncertainty",()=>{
 const svg=makeReceivingAnnexPlate(data,annex);
 assert.equal(svg,makeReceivingAnnexPlate(data,annex));
 for(const id of ["natural-rock-context","watercourse-masonry-and-bed","flagstone-apron",
  "sediment-pocket","rock-protection","dry-service-route","elevated-inspection-bridge",
  "cleanout-landing","external-interface-marks","longitudinal-rock-section",
  "erosion-treatment-section","receiving-water-levels","legend-and-limits"])
  assert.ok(svg.includes('id="'+id+'"'),id);
 assert.match(svg,/data-treatment="masonry_throat"/);
 assert.match(svg,/data-treatment="rocky_receiving_bed"/);
 assert.match(svg,/data-water-state="ordinary"/);
 assert.match(svg,/data-water-state="high"/);
 assert.match(svg,/not a standard dungeon tile/i);
 assert.match(svg,/unmapped/i);
});
