"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const {buildCells,edgeMask,verifyLayout}=require("../assemble");
const {doorEdges,audit}=require("../audit");
const {terrainModel,terrainGraph}=require("../terrain");
const {verticalModel,buildVerticalGraph}=require("../vertical");
const {distances}=require("../route-analysis");
const {makeSvg}=require("../render");
const {printScaleAudit,letterProof}=require("../print-review");
const data=JSON.parse(fs.readFileSync(path.join(__dirname,"../blueprints.json"),"utf8"));
const cave=data.tiles.find(t=>t.id==="hollow_causeway");
const owner=buildCells(cave),doors=doorEdges(cave);

test("original cave has six asymmetric rooms, genuine open passages and eight rotatable mouths",()=>{
 assert.equal(cave.rooms.length,6);
 assert.equal(doors.filter(d=>d.kind==="opening").length,10);
 assert.equal(doors.filter(d=>d.kind==="secret").length,1);
 const report=audit(cave);
 assert.equal(report.normal_portals_reachable,8);
 assert.equal(report.fully_connected,true);
 assert.ok(report.hall_cycle_rank>=3);
 for(let turn=0;turn<4;turn++)for(const side of ["N","S","E","W"])
  assert.equal(edgeMask(cave,turn,side),"4,15");
});

test("unframed cave opening is traversable but not drawn as an invented door",()=>{
 const ordinary=terrainGraph(owner,doors,cave.terrain);
 assert.ok(ordinary.get("6,3").includes("5,3"),"natural throat should be physically open");
 const locked=doors.map(d=>d.id==="dry_lung"?{...d,kind:"locked"}:d);
 assert.ok(!terrainGraph(owner,locked,cave.terrain).get("6,3").includes("5,3"));
 const drawing=makeSvg(cave);
 assert.equal(drawing,makeSvg(cave));
 assert.match(drawing,/id="cavern-walls"/);
 assert.match(drawing,/id="rock-hachures"/);
 assert.match(drawing,/id="overhead-decks"/);
 assert.match(drawing,/id="dry-bridges"/);
 assert.doesNotMatch(drawing,/stroke="#8a745f"/,"there are no hinged doors on this cave map");
 assert.match(drawing,/stroke-dasharray="6,2"/,"the one concealed man-made seal remains visible");
});

test("two alternate dry traverses cross a real wet barrier, not a painted puddle",()=>{
 const model=terrainModel(owner,cave.terrain),vertical=verticalModel(owner,cave.terrain,cave.vertical);
 assert.equal(model.water.size,13);
 assert.equal(model.bridges.size,1);
 assert.equal(vertical.decks.size,1);
 assert.equal(vertical.links.length,2);
 const lower=distances(terrainGraph(owner,doors,cave.terrain),"8,8").get("8,10");
 const upper=distances(buildVerticalGraph(owner,doors,cave.terrain,cave.vertical),"8,8,0").get("8,10,0");
 assert.ok(Number.isFinite(lower)&&Number.isFinite(upper),JSON.stringify({lower,upper}));
 assert.ok(upper<lower,`Ladders and dry calcite arch must shorten the crossing: ${lower} vs ${upper}`);
 const noBridge={...cave.terrain,bridges:[]};
 assert.ok(!terrainGraph(owner,doors,noBridge).get("11,9").includes("11,10"),
  "no bridge means no walking from submerged cell onto dry bank");
 const oneLadder={...cave.vertical,links:cave.vertical.links.slice(0,1)};
 const slower=distances(buildVerticalGraph(owner,doors,cave.terrain,oneLadder),"8,8,0").get("8,10,0");
 assert.equal(slower,lower,"a single ladder must not create an imaginary complete crossing");
});

test("reject unsupported access and incorrect water and upper-floor coordinates",()=>{
 const badBridge={...cave.terrain,bridges:[[9,8]]};
 assert.throws(()=>terrainModel(owner,badBridge),/Bridge must occupy water/);
 const badOpening=JSON.parse(JSON.stringify(cave));
 badOpening.doors[0][2]=17;
 assert.throws(()=>makeSvg(badOpening),/Door mismatch/);
 const badDeck=JSON.parse(JSON.stringify(cave.vertical));
 badDeck.decks[0].cells.push([13,8]);
 assert.throws(()=>verticalModel(owner,cave.terrain,badDeck),/Invalid stacked floor coordinate|unmodeled upper-level wall|Disconnected deck/);
});

test("four-tile juxtaposition and letter print proof are reproducible",()=>{
 const layout=JSON.parse(fs.readFileSync(path.join(__dirname,"../examples/assembly_hollow_2x2.json"),"utf8"));
 assert.equal(verifyLayout(layout,data).length,2);
 const proof=letterProof(cave);
 assert.equal(proof,letterProof(cave));
 assert.match(proof,/width="215.9mm" height="279.4mm"/);
 assert.match(proof,/The Hollow Causeway/);
 assert.equal(printScaleAudit(cave).tile_width_mm,127);
});
