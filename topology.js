"use strict";
const SIZE=20;
const DELTAS=[[1,0],[-1,0],[0,1],[0,-1]];
const key=(x,y)=>`${x},${y}`;

// Count topological obstacles fully encircled by hallway, rather than every
// 2x2 lattice cycle. This is a conservative estimate of meaningful loops.
function hallObstacles(owner,size=SIZE){
 if(!(owner instanceof Map))throw Error("Expected occupied floor Map");
 if(!Number.isInteger(size)||size<3)throw Error("Invalid grid size");
 const hall=new Set([...owner].filter(([,kind])=>kind==="hall").map(([p])=>p));
 const visited=new Set(),holes=[];
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const start=key(x,y);
  if(hall.has(start)||visited.has(start))continue;
  const todo=[[x,y]];visited.add(start);
  let touchesExterior=false;
  const points=[],adjacent=new Set(),contents=new Set();
  while(todo.length){
   const[cx,cy]=todo.pop();points.push([cx,cy]);
   if(cx===0||cy===0||cx===size-1||cy===size-1)touchesExterior=true;
   const zone=owner.get(key(cx,cy));
   if(zone&&zone!=="hall")contents.add(zone);
   for(const[dx,dy]of DELTAS){
    const nx=cx+dx,ny=cy+dy;
    if(nx<0||ny<0||nx>=size||ny>=size)continue;
    const neighbor=key(nx,ny);
    if(hall.has(neighbor))adjacent.add(neighbor);
    else if(!visited.has(neighbor)){visited.add(neighbor);todo.push([nx,ny]);}
   }
  }
  if(touchesExterior)continue;
  const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
  holes.push({
   area:points.length,
   bounding_box:[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)],
   adjacent_hall_cells:adjacent.size,
   chamber_ids:[...contents].sort(),
   substantial:points.length>=4&&adjacent.size>=8
  });
 }
 return holes.sort((a,b)=>b.area-a.area||a.bounding_box[0]-b.bounding_box[0]);
}
function navigationSummary(owner,size=SIZE){
 const holes=hallObstacles(owner,size);
 return{
  substantial_hall_circuits:holes.filter(h=>h.substantial).length,
  minor_hall_islands:holes.filter(h=>!h.substantial).length,
  hall_encircled_obstacles:holes
 };
}
module.exports={hallObstacles,navigationSummary};
