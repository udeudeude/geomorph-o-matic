"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const {printScaleAudit,letterProof}=require("../print-review");
const tiles=JSON.parse(fs.readFileSync(path.join(__dirname,"../blueprints.json"),"utf8")).tiles;
test("audit reports original vector dimensions at actual proof size",()=>{
 const tile=tiles.find(t=>t.id==="riftwater_lock");
 const half=printScaleAudit(tile),quarter=printScaleAudit(tile,{squareInches:.25});
 assert.equal(half.full_square_inches,.5);
 assert.equal(half.tile_width_mm,127);
 assert.equal(quarter.tile_width_mm,63.5);
 assert.ok(half.font_samples>0);
 assert.ok(half.stroke_samples>0);
 assert.ok(quarter.minimum_type_mm<half.minimum_type_mm);
 assert.equal(half.requires_visual_review,true);
});
test("Letter sheet keeps exact physical size, reproducible vector master and calibrated bar",()=>{
 const tile=tiles.find(t=>t.id==="riftwater_lock");
 const sheet=letterProof(tile);
 assert.match(sheet,/width="215.9mm" height="279.4mm"/);
 assert.match(sheet,/id="print-map"/);
 assert.match(sheet,/x="168" y="130" width="480" height="480"/);
 assert.match(sheet,/10-foot scale bar/);
 assert.match(sheet,/id="overhead-decks"/);
 assert.equal(sheet,letterProof(tile));
});
test("all designs can generate physical proof and invalid sizes are rejected",()=>{
 for(const t of tiles){
  assert.ok(letterProof(t).includes('<title>'+t.title+' | True-size print proof</title>'));
 }
 for(const n of [0,Infinity,NaN,-.5,.8]){
  assert.throws(()=>letterProof(tiles[0],{squareInches:n}),/Invalid print/);
 }
});
