"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict");
const data=require("../blueprints.json");
const {gearboxAudit}=require("../gearbox-audit");
const src=data.tiles.find(t=>t.id==="riftwater_lock");
test("right-angle boxes have real service faces and explicit unresolved risks",()=>{
 const a=gearboxAudit(src);
 assert.equal(a.gearbox_count,5);
 assert.equal(a.drives,3);
 assert.equal(a.gearboxes.filter(b=>b.shutdown_required).length,2);
 assert.equal(a.gearboxes.filter(b=>b.warnings.some(w=>w.includes("shared narrow"))).length,2);
 assert.ok(a.gearboxes.some(b=>b.warnings.some(w=>w.includes("wet hydraulic"))));
 assert.match(a.assumptions,/not been engineered/);
 assert.deepEqual(a,gearboxAudit(src));
});
