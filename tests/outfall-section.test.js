"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const {makeOutfallSection}=require("../outfall-section");
const {makeSubfloorAssemblyPlate}=require("../subfloor-assembly-plate");
const data=JSON.parse(fs.readFileSync(path.join(__dirname,"../blueprints.json"),"utf8"));
const layout=JSON.parse(fs.readFileSync(path.join(__dirname,"../examples/subfloor_pair.json"),"utf8"));
test("separate vector layers and high-water hazard remain explicit and deterministic",()=>{
 const s=makeOutfallSection(data);
 assert.equal(s,makeOutfallSection(data));
 for(const name of ["outfall-plan-foundations","subfloor-outfall-route","outfall-lip",
  "buried-cleanout-plan","outfall-longitudinal","receiver-water-envelopes","outfall-assumptions"])
  assert.ok(s.includes('id="'+name+'"'),name);
 assert.match(s,/data-state="ordinary"/);
 assert.match(s,/data-state="high"/);
 assert.match(s,/Potential backwater/);
 assert.match(s,/data-external-boundary="E:9"/);
 const assembly=makeSubfloorAssemblyPlate(layout,data);
 assert.match(assembly,/id="mapped-outfall-lip"/);
 assert.match(assembly,/data-receiver-state="ordinary"/);
 assert.match(assembly,/data-receiver-state="high"/);
 assert.doesNotMatch(assembly,/Uncharted outfall/);
});
