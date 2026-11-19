"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const {buildCells}=require("../assemble"),{doorEdges}=require("../audit");
const {terrainGraph,terrainModel,terrainAudit}=require("../terrain");
const {distances}=require("../route-analysis");
const {makeSvg}=require("../render");
const {shorelinePaths,naturalWaterSvg,caveDetailSvg}=require("../cave-illustration");
const cave=JSON.parse(fs.readFileSync(path.join(__dirname,"../blueprints.json"),"utf8"))
  .tiles.find(t=>t.id==="hollow_causeway");
const owner=buildCells(cave),doors=doorEdges(cave);

test("mapped breakdown actually forces a longer dry route without sacrificing modular portals",()=>{
 const blocked=terrainModel(owner,cave.terrain);
 assert.equal(blocked.chokes.size,1);
 assert.equal(blocked.ruins.size,0,"natural cave breakdown is not fallen masonry");
 const openTerrain={...cave.terrain,chokes:[]};
 const clear=distances(terrainGraph(owner,doors,openTerrain),"0,4").get("0,15");
 const collapsed=distances(terrainGraph(owner,doors,cave.terrain),"0,4").get("0,15");
 assert.ok(Number.isFinite(clear)&&Number.isFinite(collapsed));
 assert.ok(collapsed>=clear+10,JSON.stringify({clear,collapsed}));
 const audit=terrainAudit(owner,doors,cave.terrain);
 assert.equal(audit.cave_choke_edges,1);
 assert.equal(audit.travel.dry.reachable_portals,8);
 assert.equal(audit.travel.wading.reachable_portals,8);
 const svg=makeSvg(cave);
 assert.match(svg,/id="cave-breakdown-chokes"/);
 assert.match(svg,/data-blocks-edge="5,10\|5,11"/);
 assert.doesNotMatch(svg,/id="collapsed-masonry"/);
});

test("cave chokes reject fabricated edges, duplicates, wet placement and portal damage",()=>{
 for(const chokes of [
  [[[5,10],[5,11]],[[5,11],[5,10]]],
  [[[5,10],[7,10]]],
  [[[4,0],[4,1]]],
  [[[8,9],[9,9]]],
  [[[0,0],[1,0]]]
 ]){
  assert.throws(()=>terrainModel(owner,{...cave.terrain,chokes}),/Cave choke|Invalid choke/);
 }
});

test("continuous natural shorelines follow wet components, not block-sized rectangles",()=>{
 const wet=terrainModel(owner,cave.terrain).water;
 const shore=shorelinePaths(wet),reversed=shorelinePaths(new Set([...wet].reverse()));
 assert.deepEqual(shore,reversed,"shoreline must not depend on authored cell order");
 assert.equal(shore.length,2,"main rift and isolated pearl pool have distinct outlines");
 assert.ok(shore.every(d=>d.startsWith("M")&&d.endsWith("Z")));
 assert.match(naturalWaterSvg(wet).join(""),/fill-rule="evenodd"/);
 const svg=makeSvg(cave),water=svg.match(/<g id="water-terrain"[^>]*>([\s\S]*?)<\/g>/);
 assert.ok(water);
 assert.equal((water[1].match(/<path /g)||[]).length,2);
 assert.doesNotMatch(water[1],/<rect /);
});

test("four distinct geological deposits are authored on traversable dry floor",()=>{
 const model=terrainModel(owner,cave.terrain);
 const art=caveDetailSvg(owner,model,cave.vertical,cave.cave_details).join("");
 assert.equal((art.match(/data-geology=/g)||[]).length,12);
 for(const kind of ["flowstone","breakdown","gravel","scallops"])
  assert.equal((art.match(new RegExp('data-geology="'+kind+'"','g'))||[]).length,3);
 assert.equal(art,caveDetailSvg(owner,model,cave.vertical,cave.cave_details).join(""));
 assert.match(makeSvg(cave),/id="cave-geomorphology"/);
 for(const invalid of [
  {gravel:[[8,9]]}, // submerged rift
  {breakdown:[[4,0]]}, // universal external connection
  {flowstone:[[8,8]]}, // ladder landing
  {scallops:[[0,0]]}, // outside walking map
  {gravel:[[3,13],[3,13]]}, // duplicate glyph
  {unmapped:[[3,13]]} // unknown semantic vocabulary
 ]){
  assert.throws(()=>caveDetailSvg(owner,model,cave.vertical,invalid));
 }
});
