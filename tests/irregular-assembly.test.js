"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const {assemble,verifyLayout}=require("../assemble"),{makeSvg}=require("../render");
const data=JSON.parse(fs.readFileSync(path.join(__dirname,"../blueprints.json")));
const layout=JSON.parse(fs.readFileSync(path.join(__dirname,"../examples/assembly_irregular_3x3.json")));
test("irregular nine-morph survey has safe seams and unique editable SVG group identifiers",()=>{
 assert.equal(verifyLayout(layout,data).length,3);
 const byId=new Map(data.tiles.map(t=>[t.id,t]));
 const doc=assemble(layout,data,id=>makeSvg(byId.get(id)));
 assert.equal((doc.match(/<g id="assembly-/g)||[]).length,9);
 assert.equal((doc.match(/<svg x="0" y="0"/g)||[]).length,9);
 assert.equal((doc.match(/id="walk-[^"]+"/g)||[]).length,9);
 assert.ok(doc.includes('walk-basalt_rift-0-0'));
});
