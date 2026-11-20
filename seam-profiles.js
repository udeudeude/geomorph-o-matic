"use strict";
// Distinct edge families. This module evaluates *real occupied floor cells*;
// a matching drawn outline or a textual port label cannot create a join.
const fs=require("node:fs"),path=require("node:path");
const {buildCells,edgeMask,rotateCell}=require("./assemble");
const WIDTH_FEET_PER_CELL=2.5;
const PROFILES=Object.freeze({
 legacy:Object.freeze({mouths:Object.freeze([[4],[15]]),minimum_inward_depth:1}),
 "cave-wide-v1":Object.freeze({mouths:Object.freeze([[4,5],[14,15]]),minimum_inward_depth:2})
});
const sides=["N","E","S","W"];
const key=(x,y)=>x+","+y;
function spec(name){
 const result=PROFILES[name];
 if(!result)throw Error("Unknown modular opening standard: "+name);
 return result;
}
function boundaryCell(side,offset,depth=0){
 if(!sides.includes(side)||!Number.isInteger(offset)||offset<0||offset>=20||
    !Number.isInteger(depth)||depth<0||depth>=20)throw Error("Invalid modular mouth coordinate");
 return {N:[offset,depth],S:[offset,19-depth],W:[depth,offset],E:[19-depth,offset]}[side];
}
function rotateFloor(floor,turn=0){
 if(!(floor instanceof Map)||!Number.isInteger(turn)||turn<0||turn>3)throw Error("Invalid rotated floor");
 return new Map([...floor].map(([k,v])=>[key(...rotateCell(k.split(",").map(Number),turn)),v]));
}
function inspectFloor(floor,profileName){
 const p=spec(profileName);
 if(!(floor instanceof Map))throw Error("Modular floor must be occupied cell Map");
 const expected=p.mouths.flat().sort((a,b)=>a-b).join(",");
 const mouths=[];
 for(let turn=0;turn<4;turn++){
  const rotated=rotateFloor(floor,turn);
  for(const side of sides){
   const actual=[];
   for(let k=0;k<20;k++)if(rotated.has(key(...boundaryCell(side,k))))actual.push(k);
   if(actual.join(",")!==expected)throw Error("Incorrect "+profileName+" border mask at turn "+turn+" "+side+": "+actual.join(","));
   for(const offsets of p.mouths){
    for(let d=0;d<p.minimum_inward_depth;d++)for(const offset of offsets){
     const cell=boundaryCell(side,offset,d),id=key(...cell);
     if(rotated.get(id)!=="hall")throw Error("Modular throat loses full clear floor width at "+side+" "+id+" depth "+d);
    }
    if(turn===0)mouths.push({side,offsets:[...offsets],clear_feet:offsets.length*WIDTH_FEET_PER_CELL,
      minimum_inward_depth_feet:p.minimum_inward_depth*WIDTH_FEET_PER_CELL});
   }
  }
 }
 return {profile:profileName,rotations_checked:4,mouths,clear_openings:mouths.length,
  modular_family_compatible_with:Object.keys(PROFILES).filter(name=>name===profileName)};
}
function inspectTile(tile,profileName="legacy"){
 const name=tile.seam_profile||"legacy";
 if(name!==profileName)throw Error("Tile seam family differs from requested interface");
 const summary=inspectFloor(buildCells(tile),profileName);
 for(let t=0;t<4;t++)for(const side of sides)
  if(edgeMask(tile,t,side)!==spec(profileName).mouths.flat().sort((a,b)=>a-b).join(","))
   throw Error("Floor and tile edge-mask implementations disagree");
 return {...summary,tile:tile.id};
}
// A synthetic topological test fixture, not a printable or released geomorph.
// Four connected double-width axial passages meet in a continuous ring.
function specimenWideFloor(){
 const m=new Map();
 for(const offset of [4,5,14,15])for(let n=0;n<20;n++){
  m.set(key(offset,n),"hall");m.set(key(n,offset),"hall");
 }
 return m;
}
function report(data,wideData={tiles:[]}){
 return {units:"feet",cell_width_feet:WIDTH_FEET_PER_CELL,
  caution:"The wide specimen is a synthetic interface proof, NOT a designed dungeon or compatible with legacy tiles.",
  legacy_tiles:data.tiles.map(t=>inspectTile(t,"legacy")),
  wide_interface_specimen:inspectFloor(specimenWideFloor(),"cave-wide-v1"),
  designed_wide_tiles:wideData.tiles.map(t=>inspectTile(t,"cave-wide-v1"))};
}
if(require.main===module){
 const data=JSON.parse(fs.readFileSync(path.join(__dirname,"blueprints.json"),"utf8"));
 const output=path.resolve(process.argv[2]||path.join(__dirname,"reports/seam-families.json"));
 fs.mkdirSync(path.dirname(output),{recursive:true});
 const wideData=JSON.parse(fs.readFileSync(path.join(__dirname,"wide-blueprints.json"),"utf8"));
 fs.writeFileSync(output,JSON.stringify(report(data,wideData),null,2)+"\n");
 console.log("Wrote "+output);
}
module.exports={WIDTH_FEET_PER_CELL,PROFILES,boundaryCell,rotateFloor,inspectFloor,inspectTile,specimenWideFloor,report};
