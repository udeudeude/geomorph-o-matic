"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {source}=require("../wide-cave");
const {buildCells}=require("../assemble");
const {roofModel,ceilingSvg}=require("../wide-headroom");
const {makeSvg}=require("../render");
const {inspectCrowns}=require("../wide-seam-crowns");
const fs=require("node:fs"),path=require("node:path");
const tiles=source().tiles.filter(t=>t.id!=="sagging_sheet");
const xy=s=>s.split(",").map(Number),key=p=>p.join(",");
function model(t){return roofModel(buildCells(t),t.roof_scenario,t.seam_profile,t.terrain)}
test("both previously flat wide caverns have separately authored physical roof envelopes",()=>{
 assert.equal(tiles.length,2);
 const counts={braided_lava:[187,3,[8.5,9]],split_spine:[223,3,[8,8.5]]};
 for(const tile of tiles){
  const m=model(tile),[floor,zoneCount,crowns]=counts[tile.id];
  assert.equal(m.absolute_roof_elevations_feet.size,floor);
  assert.equal(m.absolute_vault_zones.length,zoneCount);
  assert.equal(m.elevated_bench_cells.length,0);
  assert.ok([...m.floor_elevations_feet.values()].every(z=>z===0));
  assert.deepEqual([...new Set(m.absolute_vault_zones.map(z=>z.roof_elevation_feet))].sort((a,b)=>a-b),crowns);
  assert.equal(m.clearances.size,floor);
  for(const zone of m.absolute_vault_zones)for(const p of zone.cells){
   assert.equal(m.absolute_roof_elevations_feet.get(p),zone.roof_elevation_feet);
   assert.equal(m.clearances.get(p),zone.roof_elevation_feet);
  }
 }
});
test("absolute crown transitions are bounded away from original genuine low-roof pinches",()=>{
 for(const tile of tiles){
  const m=model(tile),pinch=new Set(m.zones.flatMap(z=>z.cells));
  for(const [p,z] of m.absolute_roof_elevations_feet){
   const [x,y]=xy(p);
   for(const q of [[x+1,y],[x,y+1]].map(key)){
    if(!m.absolute_roof_elevations_feet.has(q)||pinch.has(p)||pinch.has(q))continue;
    assert.ok(Math.abs(z-m.absolute_roof_elevations_feet.get(q))<=.5,tile.id+" "+p+" / "+q);
   }
  }
  for(const side of ["N","S","E","W"])for(const o of [4,5,14,15])for(const depth of [0,1]){
   const p={N:[o,depth],S:[o,19-depth],W:[depth,o],E:[19-depth,o]}[side],at=key(p);
   assert.equal(m.floor_elevations_feet.get(at),0);
   assert.equal(m.absolute_roof_elevations_feet.get(at),6.5);
  }
 }
});
test("rejects phantom roofs, protective throat damage, discontinuities and invented bench levels",()=>{
 for(const tile of tiles){
  const mutate=cb=>{const t=structuredClone(tile);cb(t);return t};
  const failures=[
   mutate(t=>t.roof_scenario.absolute_vault.zones[0].cells.push([1,1])),
   mutate(t=>t.roof_scenario.absolute_vault.zones[0].cells.push([4,0])),
   mutate(t=>t.roof_scenario.absolute_vault.zones[1].roof_elevation_feet+=.5),
   mutate(t=>t.roof_scenario.absolute_vault.bench_rise_feet=1),
   mutate(t=>t.roof_scenario.absolute_vault.datum="arbitrary")
  ];
  for(const t of failures)assert.throws(()=>model(t),/Absolute vault|Invalid|Flat-datum/);
 }
});
test("authored overhead ink is editable and separate from walls, chokes and entrance taper",()=>{
 for(const tile of tiles){
  const svg=makeSvg(tile),marks=ceilingSvg(buildCells(tile),tile.roof_scenario,24,tile.terrain).join("\n");
  assert.match(svg,/id="absolute-cave-vault"/);
  assert.match(svg,/data-absolute-roof-cell=/);
  assert.match(svg,/id="roof-entry-transitions"/);
  assert.match(svg,/id="cave-breakdown-chokes"/);
  assert.ok(marks.includes('data-roof-elevation-feet="8'));
 }
 const layout=JSON.parse(fs.readFileSync(path.join(__dirname,"../studies/assembly_three_wide_2x2.json"),"utf8"));
 const result=inspectCrowns(layout);
 assert.equal(result.checked_crown_pairs,32);
 assert.equal(result.checked_exterior_throat_cells,64);
});
