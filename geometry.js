"use strict";
// Row-run footprint: one [y,xStart,xEnd] per occupied horizontal span.
// Legacy rectangle footprints remain supported.
function shapeCells(shape) {
  const rows=Array.isArray(shape)?Array.from({length:shape[3]-shape[1]+1},(_,i)=>[shape[1]+i,shape[0],shape[2]]):shape?.rows;
  if(!Array.isArray(rows)||rows.length===0)throw Error("Empty chamber footprint");
  const occupied=new Map();
  for(const [y,x1,x2] of rows) {
    if(![x1,x2,y].every(Number.isInteger)||x1<0||y<0||y>=20||x1>x2||x2>=20)throw Error("Invalid chamber run");
    for(let x=x1;x<=x2;x++){const k=x+","+y;if(occupied.has(k))throw Error("Overlapping chamber runs");occupied.set(k,[x,y]);}
  }
  const seen=new Set(),pending=[occupied.keys().next().value];
  while(pending.length){const k=pending.pop();if(seen.has(k))continue;seen.add(k);const[x,y]=occupied.get(k);for(const[dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const n=(x+dx)+","+(y+dy);if(occupied.has(n)&&!seen.has(n))pending.push(n)}}
  if(seen.size!==occupied.size)throw Error("Disconnected chamber footprint");
  return [...occupied.values()];
}
function shapeBounds(shape) {
  const cells=shapeCells(shape);
  return [Math.min(...cells.map(p=>p[0])),Math.min(...cells.map(p=>p[1])),Math.max(...cells.map(p=>p[0])),Math.max(...cells.map(p=>p[1]))];
}
module.exports={shapeCells,shapeBounds};
