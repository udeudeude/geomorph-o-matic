"use strict";
// Specialty subfloor interfaces are *not* pedestrian portals. Standard
// 20x20 surface edge masks remain untouched. A lower conduit has to be
// independently paired and graded in the assembled orientation.
const {buildCells,rotateCell,verifyLayout}=require("./assemble");
const {doorEdges}=require("./audit");
const {tailraceModel}=require("./tailrace");
const {gradeProfile,gradeAtSeam}=require("./drainage-grade");
const KEY=p=>p.join(",");
const DIRECTIONS=["N","E","S","W"];
const DELTA={N:[0,-1],E:[1,0],S:[0,1],W:[-1,0]};
const OPPOSITE={N:"S",E:"W",S:"N",W:"E"};
function edgePoint(edge){
 if(!edge||edge.kind!=="underfloor_tailrace"||
    !DIRECTIONS.includes(edge.side)||
    !Number.isInteger(edge.offset)||edge.offset<=0||edge.offset>=19)
  throw Error("Invalid specialized lower-level edge connector");
 const o=edge.offset;
 return edge.side==="N"?[o,0]:edge.side==="S"?[o,19]:
   edge.side==="W"?[0,o]:[19,o];
}
function relayModel(tile){
 const r=tile.hydrology?.subfloor_relay;
 if(!r)return null;
 if(r.level!==-1||r.role!=="receiving_relay"||
    r.discharge_status!=="unmapped_internal_outfall"||
    !Array.isArray(r.cells)||r.cells.length<3||
    !Array.isArray(r.terminus)||r.terminus.length!==2)
  throw Error("Invalid receiving lower-level conduit");
 const inlet=edgePoint(r.entry_edge);
 const keys=new Set();
 r.cells.forEach((p,i)=>{
  if(!Array.isArray(p)||p.length!==2||
     p.some(n=>!Number.isInteger(n)||n<0||n>19)||
     (i===0?KEY(p)!==KEY(inlet):p.some(n=>n<=0||n>=19))||
     keys.has(KEY(p)))throw Error("Relay must start at its seam and stay inside the tile");
  keys.add(KEY(p));
  if(i){
   const a=r.cells[i-1];
   if(Math.abs(a[0]-p[0])+Math.abs(a[1]-p[1])!==1)
    throw Error("Broken subfloor receiving conduit");
  }
 });
 if(KEY(r.terminus)!==KEY(r.cells.at(-1)))
  throw Error("Relay terminus must end the ordered lower route");
 const grade=gradeProfile(r.cells,r.grade);
 return {level:r.level,cells:r.cells.map(KEY),entry_edge:r.entry_edge,
  terminus:KEY(r.terminus),grade,discharge_status:r.discharge_status};
}
function interfaceForTile(tile){
 const h=tile.hydrology||{};
 if(h.tailrace&&h.subfloor_relay)throw Error("A tile cannot duplicate the same lower-level conduit role");
 if(h.tailrace){
  const m=tailraceModel(buildCells(tile),doorEdges(tile),h,tile.terrain||{});
  if(!m.boundary_edge)throw Error("Unmatched interior terminus is not a specialized seam");
  return {role:"out",edge:m.boundary_edge,grade:m.grade,level:m.level};
 }
 const relay=relayModel(tile);
 return relay?{role:"in",edge:relay.entry_edge,grade:relay.grade,level:relay.level}:null;
}
function turnInterface(entry,turn){
 if(!entry)return null;
 const p=rotateCell(edgePoint(entry.edge),turn);
 const side=p[1]===0?"N":p[0]===19?"E":p[1]===19?"S":"W";
 const offset=(side==="N"||side==="S")?p[0]:p[1];
 return {...entry,side,offset,point:p};
}
function verifySubfloorLayout(layout,data){
 const rows=verifyLayout(layout,data);
 const indexed=rows.map(row=>row.map(c=>turnInterface(interfaceForTile(c.tile),c.turn)));
 const seen=new Set(),matches=[];
 for(let y=0;y<rows.length;y++)for(let x=0;x<rows[0].length;x++){
  const p=indexed[y][x];
  if(!p)continue;
  const [dx,dy]=DELTA[p.side],tx=x+dx,ty=y+dy;
  if(ty<0||ty>=rows.length||tx<0||tx>=rows[0].length)
   throw Error("Unmated lower-level conduit exits assembled boundary");
  const q=indexed[ty][tx];
  if(!q||q.side!==OPPOSITE[p.side]||q.offset!==p.offset||
     q.level!==p.level||q.edge.kind!==p.edge.kind||q.role===p.role)
   throw Error("Specialized lower-level seam mismatch");
  const from=p.role==="out"?p:q,to=p.role==="in"?p:q;
  const a=p.role==="out"?[x,y]:[tx,ty],b=p.role==="in"?[x,y]:[tx,ty];
  const marker=[a.join(","),b.join(",")].join(">");
  if(seen.has(marker))continue;
  seen.add(marker);
  const grade=gradeAtSeam(from.grade,to.grade);
  matches.push({from:a,to:b,offset:p.offset,level:p.level,kind:p.edge.kind,...grade});
 }
 return {rows,matched_seams:matches};
}
module.exports={edgePoint,relayModel,interfaceForTile,turnInterface,verifySubfloorLayout};
